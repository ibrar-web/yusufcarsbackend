# Chat Socket Contract

The backend now exposes a single Socket.IO gateway dedicated to chat delivery. The setup is intentionally minimal to match the lightweight frontend bootstrap.

## Connection

- Connect to the default namespace `/` (standard Socket.IO path).
- Provide a `userId` via the connection query string: `io('/', { query: { userId } })`.
- If `userId` is missing or empty, the server rejects the connection.
- No authentication, JWT validation, or cookies are involved.
- Socket.IO default heartbeats/reconnects are unchanged.

## Room Membership

- Each socket joins one room: `chat:user:<userId>`.
- Messages are emitted to both the sender and recipient rooms so each party receives realtime updates (including their own sent message for optimistic rendering).

## Events

- `chat:message`

```ts
type ChatMessagePayload = {
  messageId: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  senderRole: 'user' | 'supplier';
  content: string;
  createdAt: string; // ISO8601
};
```

No other events are currently emitted. Additional events can be layered on later as requirements grow.
