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

  if (!params.to || !params.to.includes("@")) {
    console.warn("[email] Invalid recipient email, skipping:", params.to);
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
  /* ── Brand palette (from globals.css @theme) ──
   * bg body:       #0e120a  (bosque-profundo-900)
   * card bg:       #2b3322  (bosque-profundo-600)
   * inner card:    #21281a  (bosque-profundo-700)
   * primary/CTA:   #a68a63  (warm gold)
   * primary hover: #b89a73
   * success:       #6b9a5b
   * text main:     #c1c4a7  (sage cream)
   * text muted:    #778a63  (bosque-300)
   * labels:        #556346  (bosque-400)
   * borders:       rgba(193,196,167,0.15)
   * warm accent:   #a68a63
   * serif font:    Cormorant Garamond → Georgia fallback
   * sans font:     Inter → system-ui fallback
   */

  const itemsHtml = params.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 16px 20px; ${index < params.items.length - 1 ? "border-bottom: 1px solid rgba(193,196,167,0.10);" : ""} color: #c1c4a7; font-family: Inter, system-ui, Arial, sans-serif; font-size: 14px; line-height: 1.5;">
          <span style="font-weight: 500;">${item.name}</span>
          <span style="color: #778a63; font-size: 13px; margin-left: 6px;">x${item.quantity}</span>
        </td>
        <td style="padding: 16px 20px; ${index < params.items.length - 1 ? "border-bottom: 1px solid rgba(193,196,167,0.10);" : ""} color: #c1c4a7; font-family: Inter, system-ui, Arial, sans-serif; font-size: 14px; text-align: right; white-space: nowrap;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`,
    )
    .join("");

  const discountHtml = params.discount
    ? `
      <tr>
        <td style="padding: 8px 20px; color: #778a63; font-family: Inter, system-ui, Arial, sans-serif; font-size: 13px;">
          Descuento${params.couponCode ? ` <span style="color: #a68a63; font-weight: 500;">${params.couponCode}</span>` : ""}
        </td>
        <td style="padding: 8px 20px; color: #a68a63; font-family: Inter, system-ui, Arial, sans-serif; font-size: 13px; text-align: right; font-weight: 500;">
          &minus;$${params.discount.toFixed(2)}
        </td>
      </tr>`
    : "";

  const formattedDate = new Date().toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmaci\u00f3n de pago</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0e120a; font-family: Inter, system-ui, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0e120a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px;">

          <!-- Top accent line -->
          <tr>
            <td style="padding: 0 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="height: 2px; background: linear-gradient(90deg, transparent 0%, #a68a63 50%, transparent 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Brand logo -->
          <tr>
            <td style="text-align: center; padding: 0 0 36px;">
              <img src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fpauhenriques-lightest-green.png?alt=media" alt="Pau Henriques" width="200" style="display: inline-block; max-width: 200px; height: auto;" />
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #2b3322; border: 1px solid rgba(193,196,167,0.15); border-radius: 16px; overflow: hidden;">

                <!-- Success icon + message -->
                <tr>
                  <td style="padding: 40px 36px 28px; text-align: center;">
                    <!-- Checkmark circle -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px;">
                      <tr>
                        <td style="width: 56px; height: 56px; background-color: rgba(107,154,91,0.10); border: 2px solid rgba(107,154,91,0.25); border-radius: 50%; text-align: center; vertical-align: middle; line-height: 56px;">
                          <span style="color: #6b9a5b; font-size: 26px; font-weight: 300;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #c1c4a7; letter-spacing: 0.5px;">
                      Pago Confirmado
                    </h1>
                    <p style="margin: 0; color: #778a63; font-size: 14px; line-height: 1.6;">
                      Gracias, <strong style="color: #c1c4a7; font-weight: 500;">${params.customerName || ""}</strong>. Tu transacci\u00f3n fue exitosa.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="border-bottom: 1px solid rgba(193,196,167,0.12); font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order info row -->
                <tr>
                  <td style="padding: 24px 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: top; width: 50%;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Orden</span>
                          <div style="color: #c1c4a7; font-size: 14px; font-family: Consolas, monospace; margin-top: 4px; letter-spacing: 0.3px;">#${params.orderId.slice(0, 8)}</div>
                        </td>
                        <td style="vertical-align: top; width: 50%; text-align: right;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Fecha</span>
                          <div style="color: #c1c4a7; font-size: 14px; margin-top: 4px;">${formattedDate}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Transaction details card -->
                <tr>
                  <td style="padding: 0 36px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #21281a; border: 1px solid rgba(193,196,167,0.10); border-radius: 10px;">
                      <tr>
                        <td style="padding: 14px 20px; border-bottom: 1px solid rgba(193,196,167,0.08);">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">ID Transacci\u00f3n</span>
                          <div style="color: #778a63; font-size: 13px; font-family: Consolas, monospace; margin-top: 3px; word-break: break-all;">${params.transactionId}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 20px;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Autorizaci\u00f3n</span>
                          <div style="color: #778a63; font-size: 13px; font-family: Consolas, monospace; margin-top: 3px;">${params.authorizationCode || "N/A"}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="border-bottom: 1px solid rgba(193,196,167,0.12); font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items header -->
                <tr>
                  <td style="padding: 24px 36px 0;">
                    <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Detalle del pedido</span>
                  </td>
                </tr>

                <!-- Items list -->
                <tr>
                  <td style="padding: 12px 16px 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      ${itemsHtml}
                    </table>
                  </td>
                </tr>

                <!-- Totals -->
                <tr>
                  <td style="padding: 8px 36px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #21281a; border: 1px solid rgba(193,196,167,0.10); border-radius: 10px; overflow: hidden;">
                      <tr>
                        <td style="padding: 14px 20px; color: #778a63; font-size: 13px;">Subtotal</td>
                        <td style="padding: 14px 20px; color: #c1c4a7; font-size: 13px; text-align: right;">$${params.subtotal.toFixed(2)}</td>
                      </tr>
                      ${discountHtml}
                      <tr>
                        <td style="padding: 8px 20px 14px; color: #778a63; font-size: 13px;">IVA (15%)</td>
                        <td style="padding: 8px 20px 14px; color: #c1c4a7; font-size: 13px; text-align: right;">$${params.vat.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="border-bottom: 1px solid rgba(193,196,167,0.12); font-size: 0; line-height: 0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 20px; font-size: 17px; font-weight: 600; color: #c1c4a7; font-family: Georgia, 'Times New Roman', serif;">Total</td>
                        <td style="padding: 16px 20px; font-size: 17px; font-weight: 700; color: #a68a63; text-align: right; letter-spacing: 0.3px;">$${params.total.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 36px 36px; text-align: center;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://pauhenriques.com/mi-cuenta" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" strokecolor="#a68a63" fillcolor="#a68a63">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Ver mis pedidos</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="https://pauhenriques.com/mi-cuenta" style="display: inline-block; background-color: #a68a63; color: #ffffff; text-decoration: none; font-family: Inter, system-ui, Arial, sans-serif; font-size: 14px; font-weight: 600; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px; mso-hide: all;">
                      Ver mis pedidos
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #556346; font-size: 12px; line-height: 1.6;">
                Este correo es una confirmaci\u00f3n autom\u00e1tica de tu pago.
              </p>
              <p style="margin: 0 0 16px; color: #556346; font-size: 12px;">
                Si tienes alguna pregunta, cont\u00e1ctanos por
                <a href="https://wa.me/593997733498" style="color: #a68a63; text-decoration: underline;">WhatsApp</a>.
              </p>
              <!-- Bottom accent line -->
              <table width="60" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 16px;">
                <tr>
                  <td style="height: 1px; background-color: rgba(193,196,167,0.15); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin: 0; color: #343d2a; font-size: 11px; letter-spacing: 0.5px;">
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
