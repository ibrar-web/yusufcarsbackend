const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'support@partsquote.co.uk';
const EMAIL_FROM_NAME =
  process.env.EMAIL_FROM_NAME ?? 'PartsQuote Support Team';

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('[emails] SENDGRID_API_KEY missing. Email not sent to %s', to);
    return;
  }

  const plainText = text ?? stripHtml(html);
  const body = {
    personalizations: [
      {
        to: [{ email: to }],
        subject,
      },
    ],
    from: {
      email: EMAIL_FROM,
      name: EMAIL_FROM_NAME,
    },
    content: [
      { type: 'text/plain', value: plainText },
      { type: 'text/html', value: html },
    ],
  };

  const response = await fetch(SENDGRID_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await safeReadBody(response);
    throw new Error(
      `SendGrid request failed (${response.status}): ${detail || 'Unknown'}`,
    );
  }
}

async function safeReadBody(response: Response): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}
