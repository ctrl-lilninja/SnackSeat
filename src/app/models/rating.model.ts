import { Timestamp } from '@angular/fire/firestore';

export interface Rating {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  comment?: string;
  anonymous: boolean;
  timestamp: Timestamp;
  userId: string;
  ownerReply?: string;
}

export interface RatingCreate {
  shopId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  anonymous: boolean;
}

export interface RatingUpdate {
  rating?: number;
  comment?: string;
  anonymous?: boolean;
}

export interface ShopRatingSummary {
  averageRating: number;
  totalRatings: number;
  fiveStarCount: number;
}
