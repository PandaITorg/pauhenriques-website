import { describe, it, expect } from "vitest";
import {
  resolveChargeOutcome,
  DEFAULT_CHARGE_ERROR,
} from "@/lib/checkout/resolve-charge-outcome";

// Red de seguridad del routing del dinero: dada la respuesta de charge,
// resolveChargeOutcome debe clasificar EXACTAMENTE como lo hacía el inline de
// handleConfirmPayment. Cada rama (success / review / otp / challenge / error)
// y el conflicto de stock 409 quedan cubiertos.

describe("resolveChargeOutcome — éxito", () => {
  it("data.success → kind success, propaga emailSent=true", () => {
    const r = resolveChargeOutcome({ success: true, emailSent: true }, 200);
    expect(r).toEqual({ kind: "success", emailSent: true });
  });

  it("propaga emailSent=false (caso que dispara &emailSent=false)", () => {
    const r = resolveChargeOutcome({ success: true, emailSent: false }, 200);
    expect(r).toEqual({ kind: "success", emailSent: false });
  });

  it("emailSent ausente queda undefined", () => {
    const r = resolveChargeOutcome({ success: true }, 200);
    expect(r).toEqual({ kind: "success", emailSent: undefined });
  });
});

describe("resolveChargeOutcome — review", () => {
  it("data.review → kind review", () => {
    const r = resolveChargeOutcome({ review: true }, 200);
    expect(r).toEqual({ kind: "review" });
  });
});

describe("resolveChargeOutcome — OTP (status_detail 31)", () => {
  it("data.otpRequired → kind otp con orderId y nuveiTransactionId", () => {
    const r = resolveChargeOutcome(
      { otpRequired: true, orderId: "ord_1", nuveiTransactionId: "tx_9" },
      200,
    );
    expect(r).toEqual({
      kind: "otp",
      orderId: "ord_1",
      nuveiTransactionId: "tx_9",
    });
  });

  it("nuveiTransactionId ausente cae a cadena vacía", () => {
    const r = resolveChargeOutcome(
      { otpRequired: true, orderId: "ord_1" },
      200,
    );
    expect(r).toEqual({ kind: "otp", orderId: "ord_1", nuveiTransactionId: "" });
  });
});

describe("resolveChargeOutcome — challenge 3DS (status 35/36)", () => {
  it("challenge interactivo (36) con todos los campos", () => {
    const r = resolveChargeOutcome(
      {
        challenge: true,
        challengeHtml: "<html>acs</html>",
        orderId: "ord_2",
        isDeviceFingerprint: false,
        nuveiTransactionId: "tx_5",
        statusDetail: 36,
      },
      200,
    );
    expect(r).toEqual({
      kind: "challenge",
      html: "<html>acs</html>",
      orderId: "ord_2",
      isDeviceFingerprint: false,
      nuveiTransactionId: "tx_5",
      statusDetail: 36,
    });
  });

  it("device fingerprint (35)", () => {
    const r = resolveChargeOutcome(
      {
        challenge: true,
        challengeHtml: "<iframe>",
        orderId: "ord_3",
        isDeviceFingerprint: true,
        nuveiTransactionId: "tx_6",
        statusDetail: 35,
      },
      200,
    );
    expect(r).toMatchObject({
      kind: "challenge",
      isDeviceFingerprint: true,
      statusDetail: 35,
    });
  });

  it("isDeviceFingerprint ausente → false; statusDetail ausente → 36; nuveiTransactionId ausente → ''", () => {
    const r = resolveChargeOutcome(
      { challenge: true, challengeHtml: "<x>", orderId: "ord_4" },
      200,
    );
    expect(r).toEqual({
      kind: "challenge",
      html: "<x>",
      orderId: "ord_4",
      isDeviceFingerprint: false,
      nuveiTransactionId: "",
      statusDetail: 36,
    });
  });

  it("statusDetail=0 cae al default 36 (mismo `|| 36` del inline)", () => {
    const r = resolveChargeOutcome(
      { challenge: true, orderId: "ord_5", statusDetail: 0 },
      200,
    );
    expect(r).toMatchObject({ kind: "challenge", statusDetail: 36 });
  });
});

describe("resolveChargeOutcome — error", () => {
  it("sin data.error usa el mensaje por defecto", () => {
    const r = resolveChargeOutcome({}, 200);
    expect(r).toEqual({
      kind: "error",
      message: DEFAULT_CHARGE_ERROR,
      isStockConflict: false,
    });
  });

  it("propaga data.error cuando existe", () => {
    const r = resolveChargeOutcome({ error: "Tarjeta rechazada" }, 402);
    expect(r).toEqual({
      kind: "error",
      message: "Tarjeta rechazada",
      isStockConflict: false,
    });
  });
});

describe("resolveChargeOutcome — conflicto de stock 409", () => {
  const stockMessages = [
    "Stock insuficiente para el producto",
    "El producto ya no está disponible",
    "El precio del producto cambió",
    "El monto no coincide con el carrito",
  ];

  for (const msg of stockMessages) {
    it(`409 + "${msg}" → isStockConflict true`, () => {
      const r = resolveChargeOutcome({ error: msg }, 409);
      expect(r).toMatchObject({ kind: "error", isStockConflict: true });
    });
  }

  it("409 pero mensaje no relacionado a stock → isStockConflict false", () => {
    const r = resolveChargeOutcome({ error: "Fondos insuficientes" }, 409);
    expect(r).toMatchObject({ kind: "error", isStockConflict: false });
  });

  it("mensaje de stock pero status != 409 → isStockConflict false", () => {
    const r = resolveChargeOutcome({ error: "Stock insuficiente" }, 400);
    expect(r).toMatchObject({ kind: "error", isStockConflict: false });
  });
});

describe("resolveChargeOutcome — precedencia de ramas", () => {
  it("success gana sobre review/otp/challenge", () => {
    const r = resolveChargeOutcome(
      { success: true, review: true, otpRequired: true, challenge: true },
      200,
    );
    expect(r.kind).toBe("success");
  });

  it("review gana sobre otp/challenge", () => {
    const r = resolveChargeOutcome(
      { review: true, otpRequired: true, challenge: true },
      200,
    );
    expect(r.kind).toBe("review");
  });

  it("otp gana sobre challenge", () => {
    const r = resolveChargeOutcome(
      { otpRequired: true, challenge: true, orderId: "o" },
      200,
    );
    expect(r.kind).toBe("otp");
  });

  it("challenge gana sobre error", () => {
    const r = resolveChargeOutcome(
      { challenge: true, orderId: "o", error: "ignorado" },
      200,
    );
    expect(r.kind).toBe("challenge");
  });
});
