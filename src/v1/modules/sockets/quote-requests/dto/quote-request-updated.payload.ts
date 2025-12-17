export type QuoteRequestUpdatedPayload = {
  requestId: string;
  status?: string;
  postCode?: string | null;
  serviceCategories?: string[];
  serviceItems?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  updatedAt: Date | string;
};
