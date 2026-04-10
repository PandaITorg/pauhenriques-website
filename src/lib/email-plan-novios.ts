import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Pau Henriques <pedidos@pauhenriques.com>";

// ─── Contribution Confirmation (to guest) ──────────────────────────────────

interface ContributionConfirmationParams {
  to: string;
  guestName: string;
  coupleNames: string;
  amount: number;
  slug: string;
}

export async function sendContributionConfirmation(
  params: ContributionConfirmationParams,
): Promise<{ success: boolean }> {
  if (!resend) return { success: false };
  if (!params.to || !params.to.includes("@")) return { success: false };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Gracias por tu regalo para ${params.coupleNames}`,
      html: buildContributionConfirmationHtml(params),
    });
    if (error) {
      console.error("[email-plan-novios] Failed to send confirmation:", error);
      return { success: false };
    }
    console.log("[email-plan-novios] Confirmation sent to:", params.to);
    return { success: true };
  } catch (err) {
    console.error("[email-plan-novios] Error:", err);
    return { success: false };
  }
}

function buildContributionConfirmationHtml(params: ContributionConfirmationParams): string {
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
  <title>Contribucion confirmada</title>
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

          <!-- Logo -->
          <tr>
            <td style="text-align: center; padding: 0 0 36px;">
              <img src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fpauhenriques-lightest-green.png?alt=media" alt="Pau Henriques" width="200" style="display: inline-block; max-width: 200px; height: auto;" />
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #2b3322; border: 1px solid rgba(193,196,167,0.15); border-radius: 16px; overflow: hidden;">

                <!-- Success icon -->
                <tr>
                  <td style="padding: 40px 36px 28px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px;">
                      <tr>
                        <td style="width: 56px; height: 56px; background-color: rgba(107,154,91,0.10); border: 2px solid rgba(107,154,91,0.25); border-radius: 50%; text-align: center; vertical-align: middle; line-height: 56px;">
                          <span style="color: #6b9a5b; font-size: 26px; font-weight: 300;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #c1c4a7; letter-spacing: 0.5px;">
                      Contribucion Confirmada
                    </h1>
                    <p style="margin: 0; color: #778a63; font-size: 14px; line-height: 1.6;">
                      Gracias, <strong style="color: #c1c4a7; font-weight: 500;">${params.guestName}</strong>. Tu regalo para
                      <strong style="color: #a68a63; font-weight: 500;">${params.coupleNames}</strong> fue registrado exitosamente.
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

                <!-- Amount + Date -->
                <tr>
                  <td style="padding: 24px 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: top; width: 50%;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Monto</span>
                          <div style="color: #a68a63; font-size: 24px; font-weight: 700; margin-top: 4px; letter-spacing: 0.3px;">$${params.amount.toFixed(2)}</div>
                        </td>
                        <td style="vertical-align: top; width: 50%; text-align: right;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Fecha</span>
                          <div style="color: #c1c4a7; font-size: 14px; margin-top: 4px;">${formattedDate}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="padding: 0 36px 36px; text-align: center;">
                    <p style="margin: 0; color: #778a63; font-size: 13px; line-height: 1.6; font-style: italic;">
                      Tu contribucion sera utilizada por los novios para adquirir productos de salud y bienestar para su nuevo hogar.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #556346; font-size: 12px; line-height: 1.6;">
                Este correo es una confirmacion automatica de tu contribucion.
              </p>
              <p style="margin: 0 0 16px; color: #556346; font-size: 12px;">
                Si tienes alguna pregunta, contactanos por
                <a href="https://wa.me/593991712532" style="color: #a68a63; text-decoration: underline;">WhatsApp</a>.
              </p>
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

// ─── Contribution Notification (to couple) ──────────────────────────────────

interface ContributionNotificationParams {
  to: string;
  coupleNames: string;
  guestName: string;
  amount: number;
  guestMessage?: string;
}

export async function sendContributionNotification(
  params: ContributionNotificationParams,
): Promise<{ success: boolean }> {
  if (!resend) return { success: false };
  if (!params.to || !params.to.includes("@")) return { success: false };

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Nueva contribucion de ${params.guestName} - $${params.amount.toFixed(2)}`,
      html: buildContributionNotificationHtml(params),
    });
    if (error) {
      console.error("[email-plan-novios] Failed to send notification:", error);
      return { success: false };
    }
    console.log("[email-plan-novios] Notification sent to:", params.to);
    return { success: true };
  } catch (err) {
    console.error("[email-plan-novios] Error:", err);
    return { success: false };
  }
}

function buildContributionNotificationHtml(params: ContributionNotificationParams): string {
  const formattedDate = new Date().toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const messageHtml = params.guestMessage
    ? `
                <!-- Guest message -->
                <tr>
                  <td style="padding: 0 36px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #21281a; border: 1px solid rgba(193,196,167,0.10); border-radius: 10px;">
                      <tr>
                        <td style="padding: 14px 20px;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Mensaje</span>
                          <div style="color: #c1c4a7; font-size: 14px; margin-top: 6px; line-height: 1.5; font-style: italic;">"${params.guestMessage}"</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
    : "";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva contribucion</title>
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

          <!-- Logo -->
          <tr>
            <td style="text-align: center; padding: 0 0 36px;">
              <img src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fpauhenriques-lightest-green.png?alt=media" alt="Pau Henriques" width="200" style="display: inline-block; max-width: 200px; height: auto;" />
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #2b3322; border: 1px solid rgba(193,196,167,0.15); border-radius: 16px; overflow: hidden;">

                <!-- Gift icon + heading -->
                <tr>
                  <td style="padding: 40px 36px 28px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px;">
                      <tr>
                        <td style="width: 56px; height: 56px; background-color: rgba(166,138,99,0.10); border: 2px solid rgba(166,138,99,0.25); border-radius: 50%; text-align: center; vertical-align: middle; line-height: 56px;">
                          <span style="color: #a68a63; font-size: 26px;">&#127873;</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #c1c4a7; letter-spacing: 0.5px;">
                      Nueva Contribucion
                    </h1>
                    <p style="margin: 0; color: #778a63; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #c1c4a7; font-weight: 500;">${params.guestName}</strong> ha contribuido a tu Plan Novios.
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

                <!-- Amount + Date -->
                <tr>
                  <td style="padding: 24px 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: top; width: 50%;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Monto</span>
                          <div style="color: #a68a63; font-size: 28px; font-weight: 700; margin-top: 4px; letter-spacing: 0.3px;">$${params.amount.toFixed(2)}</div>
                        </td>
                        <td style="vertical-align: top; width: 50%; text-align: right;">
                          <span style="font-size: 11px; color: #556346; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Fecha</span>
                          <div style="color: #c1c4a7; font-size: 14px; margin-top: 4px;">${formattedDate}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${messageHtml}

                <!-- CTA -->
                <tr>
                  <td style="padding: 8px 36px 36px; text-align: center;">
                    <a href="https://pauhenriques.com/plan-novios/mi-plan" style="display: inline-block; background-color: #a68a63; color: #ffffff; text-decoration: none; font-family: Inter, system-ui, Arial, sans-serif; font-size: 14px; font-weight: 600; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px;">
                      Ver mi Plan Novios
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px 16px; text-align: center;">
              <p style="margin: 0 0 16px; color: #556346; font-size: 12px; line-height: 1.6;">
                Recibiras una notificacion por cada nueva contribucion.
              </p>
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
