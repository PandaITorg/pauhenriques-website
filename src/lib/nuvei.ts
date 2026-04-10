import crypto from "crypto";

const NUVEI_DOMAIN = "paymentez.com";

function getBaseUrl(): string {
  const env = process.env.NUVEI_ENV === "prod" ? "prod" : "stg";
  return env === "prod"
    ? `https://ccapi.${NUVEI_DOMAIN}`
    : `https://ccapi-stg.${NUVEI_DOMAIN}`;
}


function getServerCredentials() {
  const appCode = process.env.NUVEI_SERVER_APP_CODE;
  const appKey = process.env.NUVEI_SERVER_APP_KEY;
  if (!appCode || !appKey) {
    throw new Error("Nuvei server credentials not configured");
  }
  return { appCode, appKey };
}

export function generateAuthToken(): string {
  const { appCode, appKey } = getServerCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const uniqToken = crypto
    .createHash("sha256")
    .update(`${appKey}${timestamp}`)
    .digest("hex");
  return Buffer.from(`${appCode};${timestamp};${uniqToken}`).toString(
    "base64",
  );
}

function getProxyUrl(): string | null {
  return process.env.NUVEI_PROXY_URL || null;
}

export async function nuveiRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T> {
  const authToken = generateAuthToken();
  const proxyUrl = getProxyUrl();

  // Use Cloud Function proxy if configured (workaround for Cloud Run / Nuvei incompatibility)
  if (proxyUrl) {
    console.log(`[nuvei] ${method} ${path} via proxy`);
    const proxyResponse = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nuvei-auth-token": authToken,
        "x-nuvei-env": process.env.NUVEI_ENV || "stg",
      },
      body: JSON.stringify({ path, method, body }),
    });
    if (!proxyResponse.ok) {
      const errorBody = await proxyResponse.text();
      console.error(`[nuvei] ${method} ${path} proxy failed with status ${proxyResponse.status}. Body: ${errorBody}`);
      try {
        return JSON.parse(errorBody) as T;
      } catch {
        throw new Error(`Nuvei proxy ${method} ${path} failed: ${proxyResponse.status}`);
      }
    }
    return proxyResponse.json() as Promise<T>;
  }

  // Direct call (works from local dev, fails from Cloud Run in production)
  const url = `${getBaseUrl()}${path}`;
  console.log(`[nuvei] ${method} ${url} | env=${process.env.NUVEI_ENV}`);

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Auth-Token": authToken,
    },
  };

  if (body && method === "POST") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[nuvei] ${method} ${path} failed with status ${response.status}. Body: ${errorBody}`);
    try {
      return JSON.parse(errorBody) as T;
    } catch {
      throw new Error(`Nuvei ${method} ${path} failed: ${response.status}`);
    }
  }
  return response.json() as Promise<T>;
}

export async function listCards(uid: string) {
  return nuveiRequest<{
    cards: Array<{
      bin: string;
      status: string;
      token: string;
      holder_name: string;
      expiry_year: string;
      expiry_month: string;
      transaction_reference: string;
      type: string;
      number: string;
    }>;
    result_size: number;
  }>(`/v2/card/list?uid=${encodeURIComponent(uid)}`, "GET");
}

export async function deleteCard(token: string, uid: string) {
  return nuveiRequest<{ message: string }>("/v2/card/delete/", "POST", {
    card: { token },
    user: { id: uid },
  });
}

export async function refundTransaction(transactionId: string) {
  return nuveiRequest<{
    status: string;
    detail: string;
  }>("/v2/transaction/refund/", "POST", {
    transaction: { id: transactionId },
  });
}

export async function verifyCard(params: {
  userId: string;
  transactionReference: string;
  value: string;
}) {
  return nuveiRequest<{
    transaction?: {
      status: string;
      status_detail: number;
      id: string;
      message: string | null;
    };
    error?: {
      type: string;
      help: string;
      description: string;
    };
  }>("/v2/transaction/verify/", "POST", {
    user: {
      id: params.userId,
    },
    transaction: {
      id: params.transactionReference,
    },
    type: "BY_AMOUNT",
    value: params.value,
  });
}

export interface ThreeDSResponse {
  authentication: {
    status: string;
    return_code: string;
    return_message?: string;
    cavv?: string;
    eci?: string;
    xid?: string;
    reference_id?: string;
  };
  browser_response: {
    hidden_iframe?: string;
    challenge_request?: string;
  };
  sdk_response?: {
    acs_trans_id?: string;
    acs_reference_number?: string;
  };
}

export interface DebitResponse {
  transaction?: {
    status: string;
    current_status: string;
    id: string;
    message: string | null;
    status_detail: number;
    authorization_code: string | null;
  };
  card?: {
    bin: string;
    type: string;
    number: string;
  };
  "3ds"?: ThreeDSResponse;
  error?: {
    type: string;
    help: string;
    description: string;
  };
}

export async function debitWithToken(params: {
  userId: string;
  userEmail: string;
  amount: number;
  description: string;
  devReference: string;
  cardToken: string;
  cvc?: string;
  vat?: number;
  taxableAmount?: number;
  installments?: number;
  installmentsType?: number;
  browserInfo?: {
    accept_header: string;
    user_agent: string;
    language: string;
    timezone_offset: number;
    screen_width: number;
    screen_height: number;
    color_depth: number;
    js_enabled: boolean;
    java_enabled: boolean;
    ip_address?: string;
  };
  termUrl?: string;
}) {
  const order: Record<string, unknown> = {
    amount: params.amount,
    description: params.description,
    dev_reference: params.devReference,
    vat: params.vat ?? 0,
    taxable_amount: params.taxableAmount ?? (params.amount - (params.vat ?? 0)),
    tax_percentage: 15,
  };

  if (params.installments && params.installments > 0) {
    order.installments = params.installments;
    order.installments_type = params.installmentsType ?? 0;
  }

  const body: Record<string, unknown> = {
    user: {
      id: params.userId,
      email: params.userEmail,
    },
    order,
    card: {
      token: params.cardToken,
      ...(params.cvc ? { cvc: params.cvc } : {}),
    },
  };

  if (params.browserInfo && params.termUrl) {
    body.extra_params = {
      threeDS2_data: {
        term_url: params.termUrl,
        device_type: "browser",
      },
      browser_info: params.browserInfo,
    };
  }

  return nuveiRequest<DebitResponse>("/v2/transaction/debit/", "POST", body);
}

// --- 3DS Verify API ---

export interface VerifyThreeDSParams {
  transactionId: string;
  userId: string;
  type: "AUTHENTICATION_CONTINUE" | "BY_CRES" | "BY_OTP";
  value?: string;
}

export async function verifyThreeDS(params: VerifyThreeDSParams): Promise<DebitResponse> {
  const body: Record<string, unknown> = {
    user: {
      id: params.userId,
    },
    transaction: { id: params.transactionId },
    type: params.type,
    value: params.value ?? "",
  };
  return nuveiRequest<DebitResponse>("/v2/transaction/verify/", "POST", body);
}
