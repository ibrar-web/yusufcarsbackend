import { renderTemplate } from './base-template';
import { sendEmail } from '../index';

export type PromotionEmailParams = {
  to: string;
  name?: string;
  subject: string;
  title: string;
  description: string;
  highlights?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  footerNote?: string;
};

export async function sendPromotionEmail(
  params: PromotionEmailParams,
): Promise<void> {
  const { to, name, subject, title, description, highlights, cta, footerNote } =
    params;

  const html = renderTemplate({
    previewText: subject,
    heading: title,
    intro: name ? `Hi ${name},` : undefined,
    bodyLines: [description],
    highlights,
    cta,
    footerNote:
      footerNote ??
      'You are receiving this because you asked to hear about PartsQuote news and promotions.',
  });

  await sendEmail({
    to,
    subject,
    html,
  });
}
