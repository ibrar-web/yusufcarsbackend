import type { PromotionSnapshot } from '../../../../entities/quotes/quote-offers.entity';

export type QuoteOfferReceivedPayload = {
  id: string;
  partName: string;
  brand: string;
  offers: Record<string, unknown> | null;
  promotion: PromotionSnapshot | null;
  price: number | string;
  estimatedTime: string;
  partCondition: string;
  notes: string | null;
  expiresAt: Date | string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  quoteRequestId: string;
  supplier: {
    id: string;
    email: string | null;
    firstName: string | null;
  };
  userId: string;
};
