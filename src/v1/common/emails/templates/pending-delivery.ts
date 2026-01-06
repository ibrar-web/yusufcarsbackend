import { renderTemplate } from './base-template';
import { sendEmail } from '../index';

export type PendingDeliveryEmailParams = {
  to: string;
  name?: string;
  orderId: string;
  eta?: string;
  carrier?: string;
  trackingUrl?: string;
  subject?: string;
};

export async function sendPendingDeliveryEmail(
  params: PendingDeliveryEmailParams,
): Promise<void> {
  const { to, name, orderId, eta, carrier, trackingUrl, subject } = params;

  const highlightItems = [
    { label: 'Order ID', value: orderId },
    eta ? { label: 'ETA', value: eta } : undefined,
    carrier ? { label: 'Carrier', value: carrier } : undefined,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const html = renderTemplate({
    previewText: 'Your delivery is almost there.',
    heading: 'Delivery on the way',
    intro: `Hi ${name ?? 'there'},`,
    bodyLines: [
      "We're tracking your order and it's nearly at your door. We'll confirm once the driver marks it delivered.",
      trackingUrl
        ? 'Track progress in real time using the link below.'
        : 'You can review order details in your dashboard anytime.',
    ],
    highlights: highlightItems,
    cta: trackingUrl
      ? {
          label: 'Track delivery',
          url: trackingUrl,
        }
      : undefined,
    footerNote:
      'Need to change delivery details? Reply to this email and our support team will help.',
  });

  await sendEmail({
    to,
    subject: subject ?? 'Your PartsQuote delivery is pending',
    html,
  });
}
