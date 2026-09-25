// Route 3ds-complete de Plan Novios (src/app/api/plan-novios/3ds-complete).
// Cubre lo que cambió: sesión obligatoria (uid == nuveiUserId) y el borrado de
// la tarjeta del invitado con el paymentToken que guarda /contribute.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  dbAdmin: { collection: vi.fn(), batch: vi.fn() },
  auth: { verifySessionCookie: vi.fn() },
}));

vi.mock("@pandait.tech/payment-nuvei", () => ({
  verifyThreeDS: vi.fn(),
  deleteCard: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email-plan-novios", () => ({
  sendContributionConfirmation: vi.fn().mockResolvedValue(undefined),
  sendContributionNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { increment: (n: number) => ({ __inc: n }), delete: () => "__delete" },
}));

import { dbAdmin, auth } from "@/lib/firebase-admin";
import { verifyThreeDS, deleteCard } from "@pandait.tech/payment-nuvei";
import { POST } from "@/app/api/plan-novios/3ds-complete/route";

const UID = "anon-uid-001";

const BODY = {
  contributionId: "contrib-1",
  planId: "plan-1",
  nuveiUserId: UID,
  type: "AUTHENTICATION_CONTINUE",
  nuveiTransactionId: "tx-1",
};

const CONTRIB_3DS = {
  status: "3ds-pending",
  amount: 50,
  guestName: "Carlos",
  authenticatedUserId: null,
  nuveiUserId: UID,
  nuveiTransactionId: "tx-1",
  paymentToken: "tok_abc",
  threeDSCres: "cres-value",
  threeDSTransStatus: "Y",
};

const contribRef = { get: vi.fn(), update: vi.fn().mockResolvedValue(undefined) };
const batch = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };

function setup(contrib: Record<string, unknown>, uid = UID) {
  vi.mocked(auth.verifySessionCookie).mockResolvedValue({ uid } as never);
  contribRef.get.mockResolvedValue({ exists: true, data: () => contrib });
  const planRef = {
    get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ partner1Name: "A", partner2Name: "B", slug: "s" }) }),
    collection: () => ({ doc: () => contribRef }),
  };
  vi.mocked(dbAdmin.collection).mockReturnValue({ doc: () => planRef } as never);
  vi.mocked(dbAdmin.batch).mockReturnValue(batch as never);
}

function req(body: unknown, cookie: string | null = "__session=ok") {
  return new NextRequest("https://pauhenriques.com/api/plan-novios/3ds-complete", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  contribRef.update.mockResolvedValue(undefined);
  batch.commit.mockResolvedValue(undefined);
  vi.mocked(deleteCard).mockResolvedValue(undefined as never);
});

describe("plan-novios 3ds-complete — sesión", () => {
  it("sin cookie → 401 y no llama a Nuvei", async () => {
    setup(CONTRIB_3DS);
    const res = await POST(req(BODY, null));
    expect(res.status).toBe(401);
    expect(verifyThreeDS).not.toHaveBeenCalled();
  });

  it("nuveiUserId del body distinto al de la sesión → 403", async () => {
    setup(CONTRIB_3DS, "otro-uid");
    const res = await POST(req(BODY));
    expect(res.status).toBe(403);
    expect(verifyThreeDS).not.toHaveBeenCalled();
  });

  it("el aporte es de otro uid aunque el body coincida con la sesión → 403", async () => {
    setup({ ...CONTRIB_3DS, nuveiUserId: "dueño-real" }, "atacante");
    const res = await POST(req({ ...BODY, nuveiUserId: "atacante" }));
    expect(res.status).toBe(403);
    expect(verifyThreeDS).not.toHaveBeenCalled();
  });
});

describe("plan-novios 3ds-complete — tarjeta del invitado", () => {
  it("pagado: verifica BY_CRES, borra la tarjeta y quita el token del aporte", async () => {
    setup(CONTRIB_3DS);
    vi.mocked(verifyThreeDS).mockResolvedValue({
      transaction: { status: "success", status_detail: 3, id: "tx-1" },
    } as never);

    const res = await POST(req(BODY));
    await tick();

    expect((await res.json()).success).toBe(true);
    expect(verifyThreeDS).toHaveBeenCalledWith(
      expect.objectContaining({ type: "BY_CRES", value: "cres-value", userId: UID }),
    );
    expect(deleteCard).toHaveBeenCalledWith("tok_abc", UID);
    expect(batch.update).toHaveBeenCalledWith(
      contribRef,
      expect.objectContaining({ status: "paid", paymentToken: "__delete" }),
    );
  });

  it("rechazado tras 3DS: también borra la tarjeta", async () => {
    setup(CONTRIB_3DS);
    vi.mocked(verifyThreeDS).mockResolvedValue({
      transaction: { status: "failure", status_detail: 4, id: "tx-1" },
    } as never);

    const res = await POST(req(BODY));
    await tick();

    expect(res.status).toBe(400);
    expect(deleteCard).toHaveBeenCalledWith("tok_abc", UID);
  });

  it("cliente registrado: no borra su tarjeta", async () => {
    setup({ ...CONTRIB_3DS, authenticatedUserId: UID });
    vi.mocked(verifyThreeDS).mockResolvedValue({
      transaction: { status: "success", status_detail: 3, id: "tx-1" },
    } as never);

    await POST(req(BODY));
    await tick();

    expect(deleteCard).not.toHaveBeenCalled();
  });

  it("sin CRES todavía → pending, sin tocar la tarjeta", async () => {
    setup({ ...CONTRIB_3DS, threeDSCres: undefined, threeDSTransStatus: undefined });
    const res = await POST(req(BODY));
    await tick();

    expect((await res.json()).pending).toBe(true);
    expect(deleteCard).not.toHaveBeenCalled();
  });
});
