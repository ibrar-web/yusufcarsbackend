import { AppRole } from 'src/v1/common/decorators/roles.decorator';

export type ChatMessagePayload = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  sender: {
    id: string;
    email: string;
    fullName: string;
    role: AppRole;
    isActive: boolean;
    suspensionReason: string | null;
    createdAt: Date;
    postCode: string | null;
  };
};
