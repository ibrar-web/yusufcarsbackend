import { renderTemplate } from './base-template';
import { sendEmail } from '../index';

export type QuoteNotificationParams = {
  to: string;
  name?: string;
  requestTitle: string;
  summary?: string;
  viewUrl: string;
  expiresOn?: string;
  subject?: string;
};

export async function sendQuoteNotificationEmail(
  params: QuoteNotificationParams,
): Promise<void> {
  const { to, name, requestTitle, summary, viewUrl, expiresOn, subject } =
    params;

  const html = renderTemplate({
    previewText: 'You have a new quote request update.',
    heading: 'Quote request update',
    intro: `Hi ${name ?? 'there'},`,
    bodyLines: [
      `Your quote request <strong>${requestTitle}</strong> just received an update.`,
      summary ?? 'Sign in to review the latest details and respond quickly.',
    ],
    highlights: expiresOn
      ? [
          {
            label: 'Expires on',
            value: expiresOn,
          },
        ]
      : undefined,
    cta: {
      label: 'View quote request',
      url: viewUrl,
    },
    footerNote: 'Tip: faster responses win more jobs. Good luck!',
  });

  await sendEmail({
    to,
    subject: subject ?? 'New update on your quote request',
    html,
  });
}
