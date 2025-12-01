import { AppRole } from 'src/v1/entities/user.entity';

export type ChatMessagePayload = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date | string;
  deletedAt: Date | string | null;
  sender: {
    id: string;
    email: string;
    fullName: string;
    role: AppRole;
    isActive: boolean;
    suspensionReason: string | null;
    createdAt: Date | string;
    postCode: string | null;
  };
};
