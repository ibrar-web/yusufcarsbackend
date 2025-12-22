import { AppRole } from 'src/v1/entities/user.entity';

export type ChatMessagePayload = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date | string;
  deletedAt: Date | string | null;
  chatId: string;
  sender: {
    id: string;
    email: string;
    firstName: string;
    role: AppRole;
    createdAt: Date | string;
  };
};
