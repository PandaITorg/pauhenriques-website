import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderItem, ShippingAddress, OrderStatus } from "@/types/order";
import type { PromotionType } from "@/types/promotion";

const ORDERS_COLLECTION = "orders";

export async function createOrder(params: {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentToken?: string;
  paymentTransactionId?: string;
  discount?: number;
  couponCode?: string;
  promotionId?: string;
  discountType?: PromotionType;
  installments?: number;
  installmentsType?: number;
}): Promise<string> {
  const orderData = {
    ...params,
    status: "pending" as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, ORDERS_COLLECTION),
    orderData,
  );
  return docRef.id;
}

export async function markOrderFailed(orderId: string): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    status: "failed" as OrderStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function getOrderById(
  orderId: string,
): Promise<Order | null> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Order;
}

export async function getOrdersByUser(
  userId: string,
): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Order,
  );
}
