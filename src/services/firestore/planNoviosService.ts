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
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  PlanNovios,
  SelectedProduct,
  Contribution,
  Redemption,
} from "@/types/planNovios";

const PLANS_COLLECTION = "planNovios";

export async function createPlan(params: {
  partner1Name: string;
  partner2Name: string;
  weddingDate: Date | null;
  message: string;
  coverImage?: string;
  userId: string;
  userEmail: string;
  slug: string;
  selectedProducts: SelectedProduct[];
  goalAmount: number;
}): Promise<string> {
  const planData = {
    partner1Name: params.partner1Name,
    partner2Name: params.partner2Name,
    weddingDate: params.weddingDate,
    message: params.message,
    coverImage: params.coverImage || null,
    userId: params.userId,
    userEmail: params.userEmail,
    slug: params.slug,
    selectedProducts: params.selectedProducts,
    goalAmount: params.goalAmount,
    totalContributed: 0,
    totalRedeemed: 0,
    balance: 0,
    status: "active" as const,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PLANS_COLLECTION), planData);
  return docRef.id;
}

export async function getPlanBySlug(
  slug: string,
): Promise<PlanNovios | null> {
  const q = query(
    collection(db, PLANS_COLLECTION),
    where("slug", "==", slug),
    where("isActive", "==", true),
    limit(1),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as PlanNovios;
}

export async function getPlanByUserId(
  userId: string,
): Promise<PlanNovios | null> {
  const q = query(
    collection(db, PLANS_COLLECTION),
    where("userId", "==", userId),
    limit(1),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as PlanNovios;
}

export async function getPlanById(
  planId: string,
): Promise<PlanNovios | null> {
  const docRef = doc(db, PLANS_COLLECTION, planId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as PlanNovios;
}

export async function updatePlan(
  planId: string,
  data: Partial<Pick<PlanNovios, "partner1Name" | "partner2Name" | "message" | "coverImage" | "status" | "isActive">>,
): Promise<void> {
  const docRef = doc(db, PLANS_COLLECTION, planId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const q = query(
    collection(db, PLANS_COLLECTION),
    where("slug", "==", slug),
    limit(1),
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export async function getContributions(
  planId: string,
): Promise<Contribution[]> {
  const q = query(
    collection(db, PLANS_COLLECTION, planId, "contributions"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Contribution,
  );
}

export async function getRedemptions(
  planId: string,
): Promise<Redemption[]> {
  const q = query(
    collection(db, PLANS_COLLECTION, planId, "redemptions"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Redemption,
  );
}
