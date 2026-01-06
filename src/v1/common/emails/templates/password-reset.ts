import { renderTemplate } from './base-template';
import { sendEmail } from '../index';

export type PasswordResetParams = {
  to: string;
  name?: string;
  resetUrl: string;
  expiresInMinutes?: number;
  subject?: string;
};

export async function sendPasswordResetEmail(
  params: PasswordResetParams,
): Promise<void> {
  const { to, name, resetUrl, expiresInMinutes, subject } = params;
  const html = renderTemplate({
    previewText: 'Reset your PartsQuote password.',
    heading: 'Reset your password',
    intro: `Hi ${name ?? 'there'},`,
    bodyLines: [
      'We received a request to reset the password for your PartsQuote account.',
      expiresInMinutes
        ? `The secure link below will expire in ${expiresInMinutes} minutes.`
        : 'Use the secure link below to choose a new password.',
    ],
    cta: { label: 'Choose new password', url: resetUrl },
    footerNote:
      "If you didn't request a password reset, you can safely ignore this email. Your password will stay the same.",
  });

  await sendEmail({
    to,
    subject: subject ?? 'Reset your PartsQuote password',
    html,
  });
}
