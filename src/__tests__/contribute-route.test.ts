// ── P2 + P3: route contribute de Plan Novios ─────────────────────────────────
//
// P2 — getNuveiUserMessage (local en la route, no exportada).
//   Se cubre aquí de forma implícita: cada rama de fallo ejecuta la función y
//   el test afirma el mensaje que devuelve el endpoint.
//
// P3 — route `contribute` (src/app/api/plan-novios/contribute/route.ts).
//   Fija el comportamiento actual de las 7 ramas de resultado Nuvei más las
//   rutas de validación/acceso. Invitado vs autenticado incluido.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocks declarados antes de cualquier import de los módulos que mockean.
vi.mock("@/lib/firebase-admin", () => ({
  dbAdmin: { collection: vi.fn(), batch: vi.fn() },
  auth: { verifySessionCookie: vi.fn() },
}));

vi.mock("@pandait.tech/payment-nuvei", () => ({
  debitWithToken: vi.fn(),
  deleteCard: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email-plan-novios", () => ({
  sendContributionConfirmation: vi.fn().mockResolvedValue(undefined),
  sendContributionNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { increment: (n: number) => ({ __inc: n }) },
}));

import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken, deleteCard } from "@pandait.tech/payment-nuvei";
import { POST } from "@/app/api/plan-novios/contribute/route";

// ── Datos base ────────────────────────────────────────────────────────────────

const PLAN_ACTIVO = {
  status: "active",
  isActive: true,
  slug: "bodas-example",
  partner1Name: "Ana",
  partner2Name: "Luis",
  userEmail: "ana@example.com",
};

const BODY_VALIDO = {
  planId: "plan-001",
  slug: "bodas-example",
  guestName: "Carlos Gómez",
  guestEmail: "carlos@example.com",
  amount: 50,
  token: "tok_abc123",
  billingData: {
    name: "Carlos Gómez",
    cedula: "1234567890",
    address: "Av. Amazonas 123",
    phone: "0991234567",
  },
};

// ── Helpers de mock ───────────────────────────────────────────────────────────

const mockContribRef = {
  id: "contrib-test-id",
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
};

const mockBatch = {
  update: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

function setupFirestore(planData: Record<string, unknown> | null = PLAN_ACTIVO) {
  const planDocRef = {
    get: vi.fn().mockResolvedValue({
      exists: planData !== null,
      data: () => planData ?? undefined,
    }),
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockContribRef),
    }),
  };

  vi.mocked(dbAdmin.collection).mockReturnValue({
    doc: vi.fn().mockReturnValue(planDocRef),
  } as ReturnType<typeof dbAdmin.collection>);

  vi.mocked(dbAdmin.batch).mockReturnValue(mockBatch as ReturnType<typeof dbAdmin.batch>);
}

function setupAuth(uid: string | null = null) {
  if (uid) {
    vi.mocked(auth.verifySessionCookie).mockResolvedValue({ uid } as never);
  } else {
    vi.mocked(auth.verifySessionCookie).mockRejectedValue(new Error("no session"));
  }
}

function makeRequest(body: unknown, cookieHeader = "") {
  return new NextRequest(
    "https://pauhenriques.com/api/plan-novios/contribute",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(body),
    },
  );
}

// ── Utilidad para leer la respuesta JSON ───────────────────────────────────────
async function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

// ── Limpieza entre tests ──────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockContribRef.set.mockResolvedValue(undefined);
  mockContribRef.update.mockResolvedValue(undefined);
  mockBatch.commit.mockResolvedValue(undefined);
});

// ── Validación de entrada ─────────────────────────────────────────────────────

describe("contribute POST — validación de entrada", () => {
  it("body vacío → 400", async () => {
    setupAuth();
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBeTruthy();
  });

  it("amount < 1 → 400", async () => {
    setupAuth();
    const res = await POST(makeRequest({ ...BODY_VALIDO, amount: 0 }));
    expect(res.status).toBe(400);
  });

  it("planId vacío → 400", async () => {
    setupAuth();
    const res = await POST(makeRequest({ ...BODY_VALIDO, planId: "" }));
    expect(res.status).toBe(400);
  });

  it("email inválido → 400", async () => {
    setupAuth();
    const res = await POST(
      makeRequest({ ...BODY_VALIDO, guestEmail: "no-es-email" }),
    );
    expect(res.status).toBe(400);
  });
});

// ── Acceso al plan ────────────────────────────────────────────────────────────

describe("contribute POST — acceso al plan", () => {
  it("plan no encontrado → 404", async () => {
    setupAuth();
    setupFirestore(null);

    const res = await POST(makeRequest(BODY_VALIDO));
    expect(res.status).toBe(404);
    expect((await json(res)).error).toMatch(/no encontrado/i);
  });

  it("plan inactivo → 409", async () => {
    setupAuth();
    setupFirestore({ ...PLAN_ACTIVO, status: "closed", isActive: false });

    const res = await POST(makeRequest(BODY_VALIDO));
    expect(res.status).toBe(409);
    expect((await json(res)).error).toMatch(/no esta aceptando/i);
  });

  it("slug no coincide → 404", async () => {
    setupAuth();
    setupFirestore({ ...PLAN_ACTIVO, slug: "otro-slug" });

    const res = await POST(makeRequest(BODY_VALIDO));
    expect(res.status).toBe(404);
  });
});

// ── P3 rama 1: pago aprobado (status_detail 3) ───────────────────────────────

describe("contribute POST — rama: pago aprobado (3)", () => {
  it("devuelve success:true y actualiza Firestore en batch", async () => {
    setupAuth();
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: {
        status: "success",
        status_detail: 3,
        id: "tx-success",
        authorization_code: "auth-001",
      },
    } as never);

    const res = await POST(makeRequest(BODY_VALIDO));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.contributionId).toBe("contrib-test-id");
    expect(body.transactionId).toBe("tx-success");
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("borra la tarjeta del invitado al aprobar", async () => {
    setupAuth(null); // invitado
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "success", status_detail: 3, id: "tx-2", authorization_code: null },
    } as never);

    await POST(makeRequest(BODY_VALIDO));

    // deleteCard se llama en fire-and-forget; esperamos un tick
    await new Promise((r) => setTimeout(r, 0));
    expect(deleteCard).toHaveBeenCalledWith(BODY_VALIDO.token, expect.stringContaining("guest_"));
  });

  it("no borra la tarjeta cuando el usuario está autenticado", async () => {
    setupAuth("user-real-uid");
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "success", status_detail: 3, id: "tx-3", authorization_code: null },
    } as never);

    await POST(makeRequest(BODY_VALIDO, "__session=s123"));

    await new Promise((r) => setTimeout(r, 0));
    expect(deleteCard).not.toHaveBeenCalled();
  });
});

// ── P3 rama 2: pago en revisión (status_detail 1) ────────────────────────────

describe("contribute POST — rama: revisión/pendiente (1)", () => {
  it("devuelve review:true", async () => {
    setupAuth();
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "pending", status_detail: 1, id: "tx-rev" },
    } as never);

    const res = await POST(makeRequest(BODY_VALIDO));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.review).toBe(true);
    expect(body.contributionId).toBe("contrib-test-id");
  });
});

// ── P3 rama 3: 3DS device fingerprint (status_detail 35) ─────────────────────

describe("contribute POST — rama: 3DS fingerprint (35)", () => {
  it("devuelve challenge:true con isDeviceFingerprint:true", async () => {
    setupAuth();
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "pending", status_detail: 35, id: "tx-35" },
      "3ds": { browser_response: { hidden_iframe: "<iframe src='...' />" } },
    } as never);

    const res = await POST(makeRequest(BODY_VALIDO));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.challenge).toBe(true);
    expect(body.isDeviceFingerprint).toBe(true);
    expect(body.statusDetail).toBe(35);
    expect(mockContribRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "3ds-pending", isDeviceFingerprint: true }),
    );
  });
});

// ── P3 rama 4: OTP requerido (status_detail 31) ───────────────────────────────

describe("contribute POST — rama: OTP requerido (31)", () => {
  it("devuelve otpRequired:true", async () => {
    setupAuth();
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "pending", status_detail: 31, id: "tx-otp" },
    } as never);

    const res = await POST(makeRequest(BODY_VALIDO));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.otpRequired).toBe(true);
    expect(body.statusDetail).toBe(31);
    expect(body.nuveiTransactionId).toBe("tx-otp");
    expect(mockContribRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "otp-pending" }),
    );
  });
});

// ── P3 rama 5 & 6: 3DS challenge (status_detail 36 y 37) ─────────────────────

describe("contribute POST — rama: 3DS challenge (36 y 37)", () => {
  it.each([36, 37])("status_detail %i → devuelve challenge:true con isDeviceFingerprint:false", async (sd) => {
    setupAuth();
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "pending", status_detail: sd, id: `tx-${sd}` },
      "3ds": { browser_response: { challenge_request: "<form>...</form>" } },
    } as never);

    const res = await POST(makeRequest(BODY_VALIDO));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.challenge).toBe(true);
    expect(body.isDeviceFingerprint).toBe(false);
    expect(body.statusDetail).toBe(sd);
  });
});

// ── P3 rama 7: pago fallido ───────────────────────────────────────────────────

describe("contribute POST — rama: pago fallido (P2 + P3)", () => {
  it("status_detail conocido → mensaje específico", async () => {
    setupAuth();
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "failure", status_detail: 4, id: "tx-fail" },
    } as never);

    const res = await POST(makeRequest(BODY_VALIDO));
    const body = await json(res);

    expect(res.status).toBe(400);
    // P2: status_detail 4 → "Tarjeta rechazada por el banco"
    expect((body.error as string).toLowerCase()).toContain("rechazada");
    expect(mockContribRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
    );
  });

  it("P2 — cubre todas las ramas de getNuveiUserMessage", async () => {
    const casos: Array<{ sd?: number; msg?: string; expectedFragment: string }> = [
      { sd: 0, expectedFragment: "procesador" },
      { sd: 2, expectedFragment: "validacion" },
      { sd: 5, expectedFragment: "emisor" },
      { sd: 6, expectedFragment: "comunicacion" },
      { sd: 7, expectedFragment: "perdida" },
      { sd: 8, expectedFragment: "antifraude" },
      { sd: 9, expectedFragment: "denegada" },
      { sd: 10, expectedFragment: "procesada" },
      { sd: 20, expectedFragment: "vencida" },
      { sd: 21, expectedFragment: "cvv" },
      // rawMessage fallbacks (statusDetail undefined o fuera del mapa)
      { msg: "insufficient funds", expectedFragment: "denegada" },
      { msg: "card expired", expectedFragment: "vencida" },
      { msg: "bad cvv code", expectedFragment: "cvv" },
      // default
      { sd: 999, expectedFragment: "no se pudo" },
    ];

    for (const caso of casos) {
      vi.clearAllMocks();
      mockContribRef.set.mockResolvedValue(undefined);
      mockContribRef.update.mockResolvedValue(undefined);
      setupFirestore();
      setupAuth();

      vi.mocked(debitWithToken).mockResolvedValue({
        transaction: {
          status: "failure",
          status_detail: caso.sd,
          id: "tx-err",
          message: caso.msg,
        },
      } as never);

      const res = await POST(makeRequest(BODY_VALIDO));
      const body = await json(res);

      expect(res.status).toBe(400);
      expect((body.error as string).toLowerCase()).toContain(
        caso.expectedFragment,
      );
    }
  });

  it("invitado: borra tarjeta al fallar", async () => {
    setupAuth(null);
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "failure", status_detail: 4, id: "tx-guest-fail" },
    } as never);

    await POST(makeRequest(BODY_VALIDO));
    await new Promise((r) => setTimeout(r, 0));

    expect(deleteCard).toHaveBeenCalledWith(BODY_VALIDO.token, expect.stringContaining("guest_"));
  });
});

// ── P3: usuario autenticado vs invitado ───────────────────────────────────────

describe("contribute POST — invitado vs autenticado", () => {
  it("invitado: nuveiUserId comienza con 'guest_'", async () => {
    setupAuth(null);
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "success", status_detail: 3, id: "tx-ok", authorization_code: null },
    } as never);

    await POST(makeRequest(BODY_VALIDO));

    expect(debitWithToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.stringMatching(/^guest_/),
      }),
    );
  });

  it("autenticado: nuveiUserId es el uid del usuario", async () => {
    setupAuth("uid-abc");
    setupFirestore();

    vi.mocked(debitWithToken).mockResolvedValue({
      transaction: { status: "success", status_detail: 3, id: "tx-ok", authorization_code: null },
    } as never);

    await POST(makeRequest(BODY_VALIDO, "__session=valid-session"));

    expect(debitWithToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "uid-abc" }),
    );
  });
});
