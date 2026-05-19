/**
 * Refund a paid order via Nuvei + update Firestore.
 *
 * Reads credentials from .env.local (NUVEISTG-* by default, since that's
 * what the local environment uses). Pau uses ONE Firebase project for both
 * staging and prod, but the Nuvei transactionId is bound to the Nuvei
 * account that processed it — so refunding a PROD transactionId with
 * staging credentials would fail naturally at the Nuvei API, which is
 * the safety net.
 *
 * Usage:
 *   npx tsx scripts/refund-order.ts list                  → list 10 recent paid orders
 *   npx tsx scripts/refund-order.ts <orderId>             → refund that order (asks for confirmation)
 *   npx tsx scripts/refund-order.ts <orderId> --yes       → refund without confirmation
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createInterface } from "readline";
import { refundTransaction } from "@pandait.tech/payment-nuvei";

config({ path: ".env.local" });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

async function listRecent() {
  // No composite index assumed: order by createdAt desc and filter in memory.
  const snap = await db
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const paid = snap.docs.filter((d) => d.data().status === "paid").slice(0, 10);
  if (paid.length === 0) {
    console.log("No paid orders found in last 50.");
    return;
  }

  console.log(`\nLast ${paid.length} paid orders:\n`);
  for (const doc of paid) {
    const o = doc.data();
    const created = o.createdAt?.toDate?.()?.toISOString() ?? "?";
    const total = o.total ?? o.totals?.total ?? "?";
    const tx = o.paymentTransactionId ?? "—";
    const customer = o.customerEmail ?? o.email ?? "?";
    console.log(
      `  ${doc.id}  $${total}  tx=${tx}  ${customer}  ${created}`,
    );
  }
  console.log("\nRun:  npx tsx scripts/refund-order.ts <orderId>");
}

function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim().toLowerCase() === "y" || a.trim().toLowerCase() === "yes");
    });
  });
}

async function refundOne(orderId: string, autoYes: boolean) {
  const ref = db.collection("orders").doc(orderId);
  const doc = await ref.get();
  if (!doc.exists) {
    console.error(`Order ${orderId} not found.`);
    process.exit(1);
  }
  const o = doc.data()!;
  const tx = o.paymentTransactionId as string | undefined;

  console.log("\nOrder:");
  console.log(`  id:                  ${orderId}`);
  console.log(`  status:              ${o.status}`);
  console.log(`  total:               $${o.total ?? o.totals?.total ?? "?"}`);
  console.log(`  paymentTransactionId: ${tx ?? "—"}`);
  console.log(`  customerEmail:       ${o.customerEmail ?? o.email ?? "?"}`);
  console.log(`  createdAt:           ${o.createdAt?.toDate?.()?.toISOString() ?? "?"}`);
  console.log(`  refundedAt:          ${o.refundedAt?.toDate?.()?.toISOString() ?? "—"}`);

  if (o.status !== "paid") {
    console.error(`\nOrder status is "${o.status}", not "paid". Aborting.`);
    process.exit(1);
  }
  if (!tx) {
    console.error("\nOrder has no paymentTransactionId. Aborting.");
    process.exit(1);
  }
  if (o.refundedAt) {
    console.error("\nOrder already refunded. Aborting.");
    process.exit(1);
  }

  console.log(`\nNuvei env: ${process.env.NUVEI_ENV ?? "stg"}`);
  console.log(`Nuvei app code: ${process.env.NUVEI_SERVER_APP_CODE ?? "?"}`);

  if (!autoYes) {
    const ok = await confirm("\nProceed with refund? (y/N) ");
    if (!ok) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  console.log("\nCalling Nuvei refund...");
  const result = await refundTransaction(tx);
  console.log("Nuvei response:", JSON.stringify(result, null, 2));

  if (result.status === "success" || result.detail === "Completed") {
    const now = new Date();
    await ref.update({
      status: "refunded",
      refundedAt: now,
      refundedManually: false,
      updatedAt: now,
    });
    console.log(`\nOrder ${orderId} updated to status=refunded.`);

    // cascade enrollment (if any) — mirrors admin endpoint behavior
    try {
      const enrollSnap = await db
        .collection("courseEnrollments")
        .where("orderId", "==", orderId)
        .limit(1)
        .get();
      if (!enrollSnap.empty) {
        await enrollSnap.docs[0].ref.update({
          accessStatus: "refunded",
          refundedAt: now,
          refundedManually: false,
          updatedAt: now,
        });
        console.log(`Linked courseEnrollment ${enrollSnap.docs[0].id} also marked refunded.`);
      }
    } catch (err) {
      console.error("Enrollment cascade failed (non-fatal):", err);
    }
  } else {
    console.error(`\nNuvei rejected refund: ${result.detail ?? result.status}`);
    process.exit(1);
  }
}

async function main() {
  const arg = process.argv[2];
  if (!arg || arg === "list") {
    await listRecent();
    return;
  }
  const autoYes = process.argv.includes("--yes");
  await refundOne(arg, autoYes);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
