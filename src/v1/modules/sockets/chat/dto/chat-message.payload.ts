export type ChatMessagePayload = {
  messageId: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  senderRole: 'user' | 'supplier';
  content: string;
  createdAt: string;
};
