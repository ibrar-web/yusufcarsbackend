import { renderTemplate } from './base-template';
import { sendEmail } from '../index';

export type OfferNotificationParams = {
  to: string;
  name?: string;
  offerTitle: string;
  quoteReference?: string;
  valueSummary?: string;
  viewUrl: string;
  subject?: string;
};

export async function sendOfferNotificationEmail(
  params: OfferNotificationParams,
): Promise<void> {
  const {
    to,
    name,
    offerTitle,
    quoteReference,
    valueSummary,
    viewUrl,
    subject,
  } = params;

  const highlightItems = [
    quoteReference
      ? { label: 'Quote reference', value: quoteReference }
      : undefined,
    valueSummary ? { label: 'Highlights', value: valueSummary } : undefined,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const html = renderTemplate({
    previewText: 'A supplier sent a new offer to your quote request.',
    heading: 'New offer received',
    intro: name ? `Great news ${name},` : 'Great news!',
    bodyLines: [
      `You have a new offer for <strong>${offerTitle}</strong>.`,
      'Compare specs, chat with the supplier, or accept it right away.',
    ],
    highlights: highlightItems,
    cta: {
      label: 'Review offer',
      url: viewUrl,
    },
    footerNote: 'Need help comparing offers? Reply to this email and we can help.',
  });

  await sendEmail({
    to,
    subject: subject ?? 'New offer waiting for you',
    html,
  });
}
