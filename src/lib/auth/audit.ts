import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Role } from "./roles";
import type { AdminSessionUser } from "./server";

export type UserAuditAction =
  | "create"
  | "update-role"
  | "update-password"
  | "update-displayName"
  | "delete";

export interface UserAuditEntry {
  action: UserAuditAction;
  actor: { uid: string; email: string | null; role: Role };
  target: { uid: string; email: string | null };
  previousRole?: Role | null;
  newRole?: Role | null;
  notes?: string;
}

export async function writeUserAudit(
  actor: AdminSessionUser,
  entry: Omit<UserAuditEntry, "actor">,
): Promise<void> {
  if (!dbAdmin) return;
  await dbAdmin.collection("userAudit").add({
    ...entry,
    actor: { uid: actor.uid, email: actor.email, role: actor.role },
    at: FieldValue.serverTimestamp(),
  });
}
