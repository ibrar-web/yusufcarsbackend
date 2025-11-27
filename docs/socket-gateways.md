# Socket Gateway Contract

This document captures the canonical contract between the backend Socket.IO gateways and any frontend client. All gateways now use the default namespace `/`, so a single `io('/', { ... })` connection can subscribe to every channel.

## Connection & Auth

- Connect to the default namespace `/` (the server listens on the regular Socket.IO path, typically `/socket.io`).
- Authentication tokens are read in the following order (first non-empty wins):
  1. Cookie named `access_token` (override with `COOKIE_NAME` env).
  2. `Authorization: Bearer <token>` header.
  3. `?token=` query parameter.
  4. `handshake.auth.token`.
- Tokens must be JWTs that include:
  - `sub`: UUID of the user.
  - `role`: one of `user`, `supplier`, `admin`. Missing role defaults to `user`.
- Suppliers do **not** need to embed `supplierId`; the backend resolves it after verifying the token.
- Connections are rejected if the token is invalid, missing, or the role is incompatible with the gateway (e.g., quote-request feed for non-suppliers).
- No custom heartbeat/keepalive settings are applied; clients can rely on Socket.IO defaults.

## Room Membership

| Gateway        | Room format                          | Who joins?                                   |
| -------------- | ------------------------------------ | -------------------------------------------- |
| Chat           | `chat:user:<userId>`                 | Users (role ≠ `supplier`).                   |
|                | `chat:supplier:<supplierUserId>`     | Suppliers (role === `supplier`).             |
| Quote Requests | `quote-request:supplier:<supplierId>`| Suppliers only (server checks supplier id).  |
| Quote Offers   | `quote-offer:user:<userId>`          | Users (non-suppliers).                       |

## Events & Payloads

All payloads are validated on the server with `class-validator`. Fields marked optional may be omitted or `null`.

### Chat

- `chat:message`

```ts
type ChatMessagePayload = {
  messageId: string;
  chatId: string;
  senderId: string;
  senderRole: 'user' | 'supplier';
  recipientId: string;
  content: string;
  createdAt: string; // ISO8601
  message: {
    id: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;      // ISO8601
    deletedAt: string | null;
    sender: {
      id: string;
      email: string;
      fullName: string;
      firstName: string | null;
      role: 'user' | 'supplier' | 'admin';
      isActive: boolean;
      suspensionReason: string | null;
      createdAt: string;    // ISO8601
      postCode: string | null;
    };
  };
};
```

- `chat:delivered`

```ts
type ChatDeliveredPayload = {
  messageId: string;
  recipientId: string;
  deliveredAt: string; // ISO8601
};
```

### Quote Requests (supplier feed)

- `quote:request:created`

```ts
type QuoteRequestCreatedPayload = {
  requestId: string;
  userId: string;
  postCode?: string | null;
  serviceCategories: string[];
  createdAt: string; // ISO8601
};
```

- `quote:request:updated`

```ts
type QuoteRequestUpdatedPayload = {
  requestId: string;
  status?: string;
  postCode?: string | null;
  serviceCategories?: string[];
  updatedAt: string; // ISO8601
};
```

### Quote Offers (user feed)

- `quote:offer:received`

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
```

- `quote:offer:updated`

```ts
type QuoteOfferUpdatedPayload = {
  offerId: string;
  userId: string;
  status?: string;
  updatedAt: string; // ISO8601
};
```

## Role Restrictions

- **Chat gateway**: all authenticated roles are allowed; room membership dictates who receives which events. Messages always go to the recipient’s rooms only.
- **Quote request gateway**: suppliers only. Non-suppliers are disconnected immediately.
- **Quote offer gateway**: users/admins only. Suppliers are disconnected immediately.

## Lifecycle Notes

- No additional heartbeat, retry, or backoff logic is enforced. Socket.IO’s built-in ping/pong is sufficient.
- On reconnect, clients must re-emit auth details (either cookie or `handshake.auth.token`) so the backend can revalidate and rejoin rooms.
