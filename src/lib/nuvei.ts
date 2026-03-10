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

export async function nuveiRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const authToken = generateAuthToken();

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
  userEmail: string;
  cardToken: string;
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
      email: params.userEmail,
    },
    card: {
      token: params.cardToken,
    },
    value: params.value,
  });
}

export async function debitWithToken(params: {
  userId: string;
  userEmail: string;
  amount: number;
  description: string;
  devReference: string;
  cardToken: string;
  vat?: number;
}) {
  return nuveiRequest<{
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
    error?: {
      type: string;
      help: string;
      description: string;
    };
  }>("/v2/transaction/debit/", "POST", {
    user: {
      id: params.userId,
      email: params.userEmail,
    },
    order: {
      amount: params.amount,
      description: params.description,
      dev_reference: params.devReference,
      vat: params.vat ?? 0,
    },
    card: {
      token: params.cardToken,
    },
  });
}
