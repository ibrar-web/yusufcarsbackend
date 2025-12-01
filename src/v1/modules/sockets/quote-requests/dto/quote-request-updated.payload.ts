export type QuoteRequestUpdatedPayload = {
  requestId: string;
  status?: string;
  postCode?: string | null;
  serviceCategories?: string[];
  updatedAt: Date | string;
};
