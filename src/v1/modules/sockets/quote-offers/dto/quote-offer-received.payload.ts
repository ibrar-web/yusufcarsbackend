export type QuoteOfferReceivedPayload = {
  offerId: string;
  quoteRequestId: string;
  userId: string;
  price: number;
  supplierName: string;
  notes?: string;
  createdAt: Date | string;
};
