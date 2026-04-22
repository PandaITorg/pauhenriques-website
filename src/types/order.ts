import { Timestamp } from "firebase/firestore";
import { PromotionType } from "./promotion";

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed"
  | "3ds-pending"
  | "otp-pending";

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentToken?: string;
  paymentTransactionId?: string;
  authorizationCode?: string;
  cardBrand?: string;
  cardLast4?: string;
  shippingAddress: ShippingAddress;
  discount?: number;
  couponCode?: string;
  promotionId?: string;
  discountType?: PromotionType;
  guestInfo?: GuestInfo;
  postPurchaseNote?: string;
  courseId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
