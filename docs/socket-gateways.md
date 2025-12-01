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

### Quote Requests

- **Connection**: suppliers connect to `/` with `?supplierId=<uuid>` (or `handshake.query.supplierId`). Each socket joins `quote-request:supplier:<supplierId>`.
- **Events**:

```ts
type QuoteRequestCreatedPayload = {
  requestId: string;
  userId: string;
  postCode?: string | null;
  serviceCategories: string[];
  createdAt: string; // ISO8601
};

type QuoteRequestUpdatedPayload = {
  requestId: string;
  status?: string;
  postCode?: string | null;
  serviceCategories?: string[];
  updatedAt: string; // ISO8601
};
```

### Quote Offers

- **Connection**: users connect with `?userId=<uuid>` and join `quote-offer:user:<userId>`.
- **Events**:

```ts
type QuoteOfferReceivedPayload = {
  offerId: string;
  quoteRequestId: string;
  userId: string;
  price: number;
  supplierName: string;
  notes?: string;
  createdAt: string; // ISO8601
};

type QuoteOfferUpdatedPayload = {
  offerId: string;
  userId: string;
  status?: string;
  updatedAt: string; // ISO8601
};
```
