import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Pau Henriques <pedidos@pauhenriques.com>";

interface PaymentConfirmationParams {
  to: string;
  customerName: string;
  orderId: string;
  transactionId: string;
  authorizationCode: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  discount?: number;
  couponCode?: string;
  vat: number;
  total: number;
}

export async function sendPaymentConfirmation(
  params: PaymentConfirmationParams,
): Promise<{ success: boolean }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping email");
    return { success: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Confirmaci\u00f3n de pago - Orden ${params.orderId.slice(0, 8)}`,
      html: buildConfirmationHtml(params),
    });

    if (error) {
      console.error("[email] Failed to send confirmation:", error);
      return { success: false };
    }

    console.log("[email] Confirmation sent to:", params.to);
    return { success: true };
  } catch (err) {
    console.error("[email] Error sending confirmation email:", err);
    return { success: false };
  }
}

function buildConfirmationHtml(params: PaymentConfirmationParams): string {
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; color: #e0d5c8; font-size: 14px;">
          ${item.name} <span style="color: #8a7a6a;">&times; ${item.quantity}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; color: #e0d5c8; font-size: 14px; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`,
    )
    .join("");

  const discountHtml = params.discount
    ? `
      <tr>
        <td style="padding: 6px 0; color: #8a7a6a; font-size: 13px;">
          Descuento${params.couponCode ? ` (${params.couponCode})` : ""}
        </td>
        <td style="padding: 6px 0; color: #a68a63; font-size: 13px; text-align: right;">
          -$${params.discount.toFixed(2)}
        </td>
      </tr>`
    : "";

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 28px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;">
              <div style="font-size: 24px; font-weight: 600; color: #e0d5c8; font-family: Georgia, serif; letter-spacing: 0.5px;">
                Pau Henriques
              </div>
            </td>
          </tr>

          <!-- Success badge -->
          <tr>
            <td style="padding: 28px 28px 8px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.2); border-radius: 24px; padding: 6px 18px;">
                <span style="color: #4ade80; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">PAGO CONFIRMADO</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 20px 28px 4px; text-align: center;">
              <p style="margin: 0; color: #e0d5c8; font-size: 16px;">
                Hola <strong>${params.customerName || ""}!</strong>
              </p>
              <p style="margin: 8px 0 0; color: #8a7a6a; font-size: 14px;">
                Tu pago ha sido procesado exitosamente.
              </p>
            </td>
          </tr>

          <!-- Transaction details -->
          <tr>
            <td style="padding: 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #141414; border: 1px solid #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #2a2a2a;">
                    <span style="color: #8a7a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Orden</span>
                    <div style="color: #e0d5c8; font-size: 14px; font-family: monospace; margin-top: 2px;">${params.orderId.slice(0, 8)}...</div>
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #2a2a2a; text-align: right;">
                    <span style="color: #8a7a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Autorizaci\u00f3n</span>
                    <div style="color: #e0d5c8; font-size: 14px; font-family: monospace; margin-top: 2px;">${params.authorizationCode || "N/A"}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 14px 16px;">
                    <span style="color: #8a7a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">ID Transacci\u00f3n</span>
                    <div style="color: #e0d5c8; font-size: 14px; font-family: monospace; margin-top: 2px;">${params.transactionId}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding: 0 28px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding: 0 28px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #141414; border: 1px solid #2a2a2a; border-radius: 8px; padding: 14px 16px;">
                <tr>
                  <td style="padding: 6px 16px; color: #8a7a6a; font-size: 13px;">Subtotal</td>
                  <td style="padding: 6px 16px; color: #e0d5c8; font-size: 13px; text-align: right;">$${params.subtotal.toFixed(2)}</td>
                </tr>
                ${discountHtml}
                <tr>
                  <td style="padding: 6px 16px; color: #8a7a6a; font-size: 13px;">IVA</td>
                  <td style="padding: 6px 16px; color: #e0d5c8; font-size: 13px; text-align: right;">$${params.vat.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px 6px; border-top: 1px solid #2a2a2a; color: #e0d5c8; font-size: 16px; font-weight: 700;">Total</td>
                  <td style="padding: 12px 16px 6px; border-top: 1px solid #2a2a2a; color: #a68a63; font-size: 16px; font-weight: 700; text-align: right;">$${params.total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 28px 28px; text-align: center;">
              <a href="https://pauhenriques.com/mis-pedidos" style="display: inline-block; background-color: #a68a63; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px;">
                Ver mis pedidos
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0; color: #5a5a5a; font-size: 12px;">
                Este es un correo autom\u00e1tico de confirmaci\u00f3n de pago.
              </p>
              <p style="margin: 6px 0 0; color: #5a5a5a; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Pau Henriques. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
