export type QuoteRequestCreatedPayload = {
  requestId: string;
  userId: string;
  request: {
    postcode?: string | null;
    serviceCategories: string[];
    serviceItems: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    user:{
      id?: string | null;
      firstName?: string | null;
    }
  }
  createdAt: Date | string;
  expiresAt: Date | string;
  // postcode: string;
};
