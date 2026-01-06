import { renderTemplate } from './base-template';
import { sendEmail } from '../index';

export type EmailVerificationParams = {
  to: string;
  name?: string;
  verificationUrl: string;
  code?: string;
  expiresInMinutes?: number;
  subject?: string;
};

export async function sendEmailVerificationEmail(
  params: EmailVerificationParams,
): Promise<void> {
  const { to, name, verificationUrl, code, expiresInMinutes, subject } = params;
  const expires =
    expiresInMinutes !== undefined
      ? `This link expires in ${expiresInMinutes} minutes.`
      : 'This link expires soon.';

  const highlight =
    code !== undefined
      ? [
          {
            label: 'Verification code',
            value: code,
          },
        ]
      : [];

  const html = renderTemplate({
    previewText: 'Confirm your email to continue with PartsQuote.',
    heading: 'Verify your email',
    intro: `Hello ${name ?? 'there'},`,
    bodyLines: [
      'Thanks for joining PartsQuote. Before we unlock your dashboard we just need to confirm this email address belongs to you.',
      expires,
    ],
    highlights: highlight,
    cta: {
      label: 'Verify email',
      url: verificationUrl,
    },
    footerNote:
      "If you didn't request this, you can safely ignore this email. Someone may have entered your address by mistake.",
  });

  await sendEmail({
    to,
    subject: subject ?? 'Verify your PartsQuote email',
    html,
  });
}
