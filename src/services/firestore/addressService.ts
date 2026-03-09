import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SavedAddress } from "@/types/address";

function addressesRef(userId: string) {
  return collection(db, "users", userId, "addresses");
}

export async function getAddresses(userId: string): Promise<SavedAddress[]> {
  const q = query(addressesRef(userId), orderBy("isDefault", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as SavedAddress,
  );
}

export async function getAddressById(
  userId: string,
  addressId: string,
): Promise<SavedAddress | null> {
  const docRef = doc(db, "users", userId, "addresses", addressId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as SavedAddress;
}

export async function createAddress(
  userId: string,
  address: Omit<SavedAddress, "id">,
): Promise<string> {
  // If this is set as default, unset other defaults first
  if (address.isDefault) {
    await clearDefaultAddresses(userId);
  }

  const docRef = await addDoc(addressesRef(userId), address);
  return docRef.id;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: Partial<Omit<SavedAddress, "id">>,
): Promise<void> {
  if (data.isDefault) {
    await clearDefaultAddresses(userId);
  }
  const docRef = doc(db, "users", userId, "addresses", addressId);
  await updateDoc(docRef, data);
}

export async function deleteAddress(
  userId: string,
  addressId: string,
): Promise<void> {
  const docRef = doc(db, "users", userId, "addresses", addressId);
  await deleteDoc(docRef);
}

async function clearDefaultAddresses(userId: string): Promise<void> {
  const addresses = await getAddresses(userId);
  const defaults = addresses.filter((a) => a.isDefault);
  if (defaults.length === 0) return;

  const batch = writeBatch(db);
  for (const addr of defaults) {
    const docRef = doc(db, "users", userId, "addresses", addr.id);
    batch.update(docRef, { isDefault: false });
  }
  await batch.commit();
}
