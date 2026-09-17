import "server-only";
import { siteConfig } from "@/lib/site";

/** ¿Están RESEND_API_KEY y EMAIL_FROM? Sin eso, los avisos quedan solo en la cuenta. */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

type Email = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Manda un email con la API de Resend. Sin RESEND_API_KEY o EMAIL_FROM no hace nada
 * (así funciona antes de tener el dominio). Nunca tira error: el envío no debe
 * frenar la acción que lo dispara. Devuelve si se envió.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info(
      `[email] Sin RESEND_API_KEY/EMAIL_FROM: no se envió "${subject}".`,
    );
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!response.ok) {
      console.error(
        `[email] Resend respondió ${response.status}: ${await response.text()}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] No se pudo enviar:", error);
    return false;
  }
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Plantilla simple con la marca: título, párrafos y un botón. */
export function emailLayout({
  title,
  paragraphs,
  button,
}: {
  title: string;
  paragraphs: string[];
  button?: { label: string; href: string };
}) {
  const body = paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2c3b56">${escapeHtml(text)}</p>`,
    )
    .join("");
  const cta = button
    ? `<a href="${escapeHtml(button.href)}" style="display:inline-block;margin-top:8px;background:#ffbb1f;color:#0a101e;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px">${escapeHtml(button.label)}</a>`
    : "";

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f7f9fc;font-family:Arial,Helvetica,sans-serif;color:#0a101e">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4eaf2;border-radius:16px;overflow:hidden">
          <tr><td style="background:#0a101e;padding:24px 32px">
            <span style="font-size:22px;font-weight:bold;letter-spacing:1px;color:#ffffff">PADDLE<span style="color:#ffbb1f">AMERICA</span></span><br />
            <span style="font-size:10px;letter-spacing:3px;color:#9fb0c9">${escapeHtml(siteConfig.tagline.toUpperCase())}</span>
          </td></tr>
          <tr><td style="padding:32px">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${escapeHtml(title)}</h1>
            ${body}
            ${cta}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
