import nodemailer from "nodemailer";

/**
 * SMTP email sending. Configured entirely by environment variables so it stays
 * off in local dev and switches on in production:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, EMAIL_FROM
 * Hostinger email provides these (smtp.hostinger.com).
 */
export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

function transport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** Send one campaign to many recipients (BCC). Throws if SMTP isn't set up. */
export async function sendCampaignEmail(
  recipients: string[],
  subject: string,
  text: string,
  fromName?: string,
): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error(
      "Email sending isn't configured yet. Set SMTP_HOST, SMTP_USER, SMTP_PASS and EMAIL_FROM on the server, then try again.",
    );
  }
  if (recipients.length === 0) return;
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER!;
  await transport().sendMail({
    from: fromName ? `"${fromName}" <${from}>` : from,
    to: from,
    bcc: recipients,
    subject,
    text,
  });
}
