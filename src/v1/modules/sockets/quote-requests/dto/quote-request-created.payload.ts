export type QuoteRequestCreatedPayload = {
  requestId: string;
  userId: string;
  postCode?: string | null;
  serviceCategories: string[];
  serviceItems: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  createdAt: Date | string;
};
