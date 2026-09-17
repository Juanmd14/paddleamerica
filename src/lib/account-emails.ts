import "server-only";
import { emailLayout, isEmailConfigured, sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site";
import { getAccountEmails } from "@/lib/supabase/admin";

export type AccountMessage = {
  subject: string;
  /** Título grande del email (por defecto, el asunto). */
  title?: string;
  paragraphs: string[];
  /** Botón a una página del sitio, por ejemplo "/torneos/abierto#inscripcion". */
  button?: { label: string; path: string };
};

type Recipient = { email: string | null; full_name: string | null };

/**
 * Manda el mismo aviso por email a cuentas que ya tienen el email a mano
 * (acciones del panel, donde el admin lo puede leer). Sin Resend no hace nada.
 */
export async function emailProfiles(
  recipients: Recipient[],
  message: AccountMessage,
) {
  if (!isEmailConfigured()) return;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const firstName = recipient.full_name?.trim().split(/\s+/)[0];
    await sendEmail({
      to: recipient.email,
      subject: message.subject,
      html: emailLayout({
        title: message.title ?? message.subject,
        paragraphs: [
          firstName ? `Hola, ${firstName}.` : "Hola.",
          ...message.paragraphs,
        ],
        button: message.button && {
          label: message.button.label,
          href: `${siteConfig.url}${message.button.path}`,
        },
      }),
    });
  }
}

/**
 * Lo mismo, a partir del id de las cuentas (acciones de un jugador, que no puede
 * leer el email de su pareja). Sin email configurado ni siquiera busca los emails.
 * Llamala dentro de after() para no demorar la respuesta.
 */
export async function emailAccounts(
  ids: (string | null | undefined)[],
  message: AccountMessage,
) {
  if (!isEmailConfigured()) return;
  const recipients = await getAccountEmails(
    ids.filter((id): id is string => Boolean(id)),
  );
  await emailProfiles(recipients, message);
}
