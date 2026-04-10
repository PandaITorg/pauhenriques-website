import { Timestamp } from "firebase/firestore";

export type PlanNoviosStatus = "active" | "paused" | "completed";

export type ContributionStatus =
  | "pending"
  | "paid"
  | "failed"
  | "3ds-pending"
  | "otp-pending";

export interface SelectedProduct {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
}

export interface PlanNovios {
  id: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: Timestamp | null;
  message: string;
  coverImage?: string;
  userId: string;
  userEmail: string;
  slug: string;
  selectedProducts?: SelectedProduct[];
  goalAmount?: number;
  totalContributed: number;
  totalRedeemed: number;
  balance: number;
  status: PlanNoviosStatus;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Contribution {
  id: string;
  planId: string;
  guestName: string;
  guestEmail?: string;
  guestMessage?: string;
  amount: number;
  currency: "USD";
  status: ContributionStatus;
  paymentTransactionId?: string;
  authorizationCode?: string;
  nuveiTransactionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Redemption {
  id: string;
  planId: string;
  amount: number;
  description: string;
  redeemedBy: string;
  createdAt: Timestamp;
}
