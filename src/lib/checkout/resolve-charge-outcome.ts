/**
 * Decisión PURA del flujo de pago del checkout.
 *
 * Dada la respuesta del endpoint `/api/payment/charge` (cuerpo JSON ya
 * parseado + el status HTTP), decide cuál es el siguiente paso SIN tocar
 * React, el DOM ni efectos de red. El cableado (setState, mostrar iframe/OTP,
 * redirección) lo hace el hook `useCheckoutPayment` a partir de este resultado.
 *
 * Esta separación pone el routing del dinero bajo prueba unitaria (node), sin
 * necesitar React Testing Library. El comportamiento es idéntico al inline que
 * vivía en `handleConfirmPayment` de `checkout/page.tsx`:
 *
 *   data.success      → success
 *   data.review       → review
 *   data.otpRequired  → otp     (status_detail 31)
 *   data.challenge    → challenge (status 35 device fingerprint / 36 interactivo)
 *   else              → error   (con detección de conflicto de stock 409)
 *
 * El orden de precedencia se preserva tal cual el inline lo evaluaba.
 */

/** Cuerpo (parseado) de la respuesta de `/api/payment/charge`. */
export interface ChargeResponseData {
  success?: boolean;
  review?: boolean;
  otpRequired?: boolean;
  challenge?: boolean;
  emailSent?: boolean;
  orderId?: string;
  nuveiTransactionId?: string;
  challengeHtml?: string;
  isDeviceFingerprint?: boolean;
  statusDetail?: number;
  error?: string;
}

export type ChargeOutcome =
  | { kind: "success"; emailSent?: boolean }
  | { kind: "review" }
  | { kind: "otp"; orderId: string; nuveiTransactionId: string }
  | {
      kind: "challenge";
      html: string;
      orderId: string;
      isDeviceFingerprint: boolean;
      nuveiTransactionId: string;
      statusDetail: number;
    }
  | { kind: "error"; message: string; isStockConflict: boolean };

/**
 * Mensaje de error por defecto cuando el backend no envía `data.error`.
 * Mismo texto que el inline original.
 */
export const DEFAULT_CHARGE_ERROR = "Error al procesar el pago.";

/**
 * Patrón que identifica un fallo de charge causado porque un ítem se quedó sin
 * stock (o el precio/monto cambió) entre la carga de la página y "Pagar". El
 * backend responde 409 con un mensaje de la validación estándar del paquete;
 * cuando coincide, el flujo debe resincronizar el carrito y volver al paso
 * "cart".
 */
const STOCK_CONFLICT_RE =
  /stock insuficiente|ya no está disponible|precio.*cambió|monto no coincide/i;

/**
 * Clasifica la respuesta de charge en el siguiente paso del flujo de pago.
 *
 * @param data       Cuerpo JSON ya parseado de la respuesta de charge.
 * @param httpStatus Status HTTP de la respuesta (necesario para detectar el
 *                   conflicto de stock 409).
 */
export function resolveChargeOutcome(
  data: ChargeResponseData,
  httpStatus: number,
): ChargeOutcome {
  if (data.success) {
    return { kind: "success", emailSent: data.emailSent };
  }

  if (data.review) {
    return { kind: "review" };
  }

  if (data.otpRequired) {
    return {
      kind: "otp",
      orderId: data.orderId ?? "",
      nuveiTransactionId: data.nuveiTransactionId || "",
    };
  }

  if (data.challenge) {
    return {
      kind: "challenge",
      html: data.challengeHtml ?? "",
      orderId: data.orderId ?? "",
      isDeviceFingerprint: data.isDeviceFingerprint ?? false,
      nuveiTransactionId: data.nuveiTransactionId || "",
      statusDetail: data.statusDetail || 36,
    };
  }

  const message = data.error || DEFAULT_CHARGE_ERROR;
  return {
    kind: "error",
    message,
    isStockConflict: httpStatus === 409 && STOCK_CONFLICT_RE.test(message),
  };
}
