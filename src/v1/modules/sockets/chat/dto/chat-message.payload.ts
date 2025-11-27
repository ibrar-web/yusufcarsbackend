export type ChatMessagePayload = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  deletedAt: string | null;
  sender: {
    id: string;
    email: string;
    fullName: string;
    role: 'user' | 'supplier' | 'admin';
    isActive: boolean;
    suspensionReason: string | null;
    createdAt: string;
    postCode: string | null;
  };
};
