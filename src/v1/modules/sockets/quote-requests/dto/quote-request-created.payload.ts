export type QuoteRequestCreatedPayload = {
  requestId: string;
  userId: string;
  postCode?: string | null;
  serviceCategories: string[];
  createdAt: Date | string;
};
