import { Resend } from "resend";

export type InvitationEmail = {
  to: string;
  parentName: string;
  childName: string;
  code: string;
  expiresAt: Date;
  activationUrl: string;
};

export type SendInvitationEmailResult =
  | { ok: true }
  | { ok: false; error: string };

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  resendClient ??= new Resend(apiKey);
  return resendClient;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatExpiry(expiresAt: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(expiresAt);
}

function buildHtml({
  parentName,
  childName,
  code,
  expiresAt,
  activationUrl,
}: Omit<InvitationEmail, "to">): string {
  const safeParentName = escapeHtml(parentName);
  const safeChildName = escapeHtml(childName);
  const safeCode = escapeHtml(code);
  const safeUrl = escapeHtml(activationUrl);
  const safeExpiry = escapeHtml(formatExpiry(expiresAt));

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invitación a OpenDayCare</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6ecdf;font-family:'Nunito',Arial,Helvetica,sans-serif;color:#3f362e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6ecdf;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#fffdf9;border:1px solid #ece0d0;border-radius:20px;padding:32px;">
            <tr>
              <td style="padding-bottom:8px;font-family:'Fredoka','Nunito',Arial,sans-serif;font-size:22px;font-weight:600;color:#d9583c;">
                OpenDayCare
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;font-family:'Fredoka','Nunito',Arial,sans-serif;font-size:26px;font-weight:600;line-height:1.25;color:#3f362e;">
                Hola ${safeParentName}, te esperamos en la guardería
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;font-size:16px;line-height:1.6;color:#3f362e;">
                La guardería te invitó a seguir el día de
                <strong>${safeChildName}</strong>. Activá tu cuenta con el
                siguiente código:
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 0 20px;">
                <div style="display:inline-block;background-color:#f6ecdf;border:1px solid #ece0d0;border-radius:14px;padding:14px 28px;font-family:'Fredoka','Nunito',Arial,sans-serif;font-size:30px;font-weight:600;letter-spacing:8px;color:#2e89a6;">
                  ${safeCode}
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <a href="${safeUrl}" style="display:inline-block;background-color:#f2937a;color:#fffdf9;text-decoration:none;font-size:16px;font-weight:700;border-radius:14px;padding:14px 28px;">
                  Activar mi cuenta
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;font-size:14px;line-height:1.6;color:#3f362e;">
                El código vence el <strong>${safeExpiry}</strong>. Si el botón no
                funciona, copiá este enlace en tu navegador:<br />
                <a href="${safeUrl}" style="color:#2e89a6;word-break:break-all;">${safeUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #ece0d0;padding-top:16px;font-size:13px;line-height:1.6;color:#7a6f64;">
                Si no esperabas esta invitación, podés ignorar este correo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildText({
  parentName,
  childName,
  code,
  expiresAt,
  activationUrl,
}: Omit<InvitationEmail, "to">): string {
  return [
    `Hola ${parentName}, te esperamos en la guardería.`,
    "",
    `La guardería te invitó a seguir el día de ${childName}.`,
    `Tu código de activación es: ${code}`,
    "",
    `Activá tu cuenta acá: ${activationUrl}`,
    `El código vence el ${formatExpiry(expiresAt)}.`,
    "",
    "Si no esperabas esta invitación, podés ignorar este correo.",
  ].join("\n");
}

export async function sendInvitationEmail(
  payload: InvitationEmail,
): Promise<SendInvitationEmailResult> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return {
      ok: false,
      error: "Falta configurar el remitente de invitaciones.",
    };
  }

  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false,
      error: "Falta configurar el envío de correos.",
    };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: `Invitación para seguir el día de ${payload.childName}`,
      html: buildHtml(payload),
      text: buildText(payload),
    });

    if (error) {
      console.error("sendInvitationEmail failed", error);
      return {
        ok: false,
        error: "No se pudo enviar el correo de invitación.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("sendInvitationEmail failed", error);
    return {
      ok: false,
      error: "No se pudo enviar el correo de invitación.",
    };
  }
}
