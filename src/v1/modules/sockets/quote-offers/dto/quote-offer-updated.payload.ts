export type QuoteOfferUpdatedPayload = {
  offerId: string;
  userId: string;
  status?: string;
  updatedAt: Date | string;
};
