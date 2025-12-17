import { Order } from '../../entities/quotes/order.entity';
import { ReviewRating } from '../../entities/reviews_rating.entity';
import { User } from '../../entities/user.entity';

type PublicProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
};

type ServiceItemSummary = {
  id: string;
  name: string;
  slug: string;
};

type OrderRequestSummary = {
  id: string;
  registrationNumber: string;
  make: string;
  model?: string | null;
  services: string[];
  serviceItems: ServiceItemSummary[];
};

type OrderQuoteSummary = {
  id: string;
  partName: string;
  price: number;
  estimatedTime: string;
  brand: string;
};

type OrderReviewSummary = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

export type OrderResponse = {
  id: string;
  status: string;
  deliveryDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  request: OrderRequestSummary | null;
  supplier?: PublicProfile | null;
  buyer?: PublicProfile | null;
  acceptedQuote?: OrderQuoteSummary | null;
  review?: OrderReviewSummary | null;
  reviewSubmitted: boolean;
};

export type OrderResponseOptions = {
  includeSupplier?: boolean;
  includeBuyer?: boolean;
  includeQuote?: boolean;
};

export function buildOrderResponse(
  order: Order,
  review?: ReviewRating | null,
  options: OrderResponseOptions = {},
): OrderResponse {
  const response: OrderResponse = {
    id: order.id,
    status: order.status,
    deliveryDate: order.deliveryDate ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    request: order.request
      ? {
          id: order.request.id,
          registrationNumber: order.request.registrationNumber,
          make: order.request.make,
          model: order.request.model ?? null,
          services:
            order.request.services ||
            (order.request.serviceItems || []).map((item) => item.id),
          serviceItems: (order.request.serviceItems || []).map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
          })),
        }
      : null,
    reviewSubmitted: false,
  };

  if (options.includeSupplier && order.supplier) {
    response.supplier = sanitizeUser(order.supplier);
  }
  if (options.includeBuyer && order.buyer) {
    response.buyer = sanitizeUser(order.buyer);
  }
  if (options.includeQuote && order.acceptedQuote) {
    response.acceptedQuote = {
      id: order.acceptedQuote.id,
      partName: order.acceptedQuote.partName,
      price: Number(order.acceptedQuote.price),
      estimatedTime: order.acceptedQuote.estimatedTime,
      brand: order.acceptedQuote.brand,
    };
  }
  response.reviewSubmitted =
    typeof order.reviewSubmitted === 'boolean'
      ? order.reviewSubmitted
      : Boolean(review);
  if (review) {
    response.review = {
      id: review.id,
      rating: review.rating,
      comment: review.comment ?? null,
      createdAt: review.createdAt,
    };
  }
  return response;
}

function sanitizeUser(user?: User | null): PublicProfile | null {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName ?? null,
    email: user.email ?? null,
    role: user.role,
  };
}
