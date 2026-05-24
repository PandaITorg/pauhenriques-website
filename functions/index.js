const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const {
  create3dsCallbackHandler,
  createNuveiProxyHandler,
} = require("@pandait.tech/payment-nuvei/handlers");
const { toCloudFunction } = require("@pandait.tech/payment-nuvei/adapters");

initializeApp();
const db = getFirestore();

/**
 * 3DS Callback — receives the POST from the bank ACS after challenge completion.
 * Hosted as a Cloud Function (not on App Hosting) so it accepts external POSTs.
 *
 * Now backed by the package's hardened handler (create3dsCallbackHandler):
 * extracts/decodes the CRES, stores it on the order while in 3ds-pending, and
 * returns the postMessage HTML. Replaces the previous hand-written copy — same
 * logic, single source of truth in @pandait.tech/payment-nuvei.
 */
const { POST: threeDSPost, GET: threeDSGet } = create3dsCallbackHandler({
  firebase: { db },
});
exports.threeDSCallback = onRequest(
  { cors: true, region: "us-central1" },
  toCloudFunction((request) =>
    request.method === "GET" ? threeDSGet(request) : threeDSPost(request),
  ),
);

/**
 * Nuvei API Proxy — forwards requests from App Hosting to Nuvei's API.
 * Cloud Run (App Hosting) gets 500 from Nuvei; Cloud Functions work fine.
 * Now backed by the package's createNuveiProxyHandler (same forwarding logic).
 *
 * Usage from App Hosting (NUVEI_PROXY_URL points here):
 *   POST /nuveiProxy  Body: { path, method, body? }  Header: x-nuvei-auth-token
 */
exports.nuveiProxy = onRequest(
  { cors: true, region: "us-central1" },
  toCloudFunction(createNuveiProxyHandler()),
);

/**
 * Cleanup anonymous Firebase users older than 7 days.
 * The guest checkout creates anonymous users for each visitor so Nuvei's
 * tokenize SDK has a uid. Without cleanup the anonymous user count grows
 * unbounded. Runs daily and deletes any anonymous user older than 7 days.
 * Also cleans up expired rateLimits/* docs (older than 1 day).
 */
exports.cleanupAnonymousUsers = onSchedule(
  {
    schedule: "every 24 hours",
    region: "us-central1",
    timeoutSeconds: 540,
    memory: "256MiB",
  },
  async () => {
    const auth = getAuth();
    const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let nextPageToken;
    let scanned = 0;
    let deleted = 0;

    do {
      const result = await auth.listUsers(1000, nextPageToken);
      scanned += result.users.length;

      const toDelete = result.users
        .filter((u) => {
          const isAnonymous = !u.providerData || u.providerData.length === 0;
          if (!isAnonymous) return false;
          const createdAt = u.metadata?.creationTime
            ? new Date(u.metadata.creationTime).getTime()
            : Date.now();
          return createdAt < sevenDaysAgoMs;
        })
        .map((u) => u.uid);

      if (toDelete.length > 0) {
        const delResult = await auth.deleteUsers(toDelete);
        deleted += delResult.successCount;
        if (delResult.failureCount > 0) {
          console.warn(
            `[cleanupAnonymousUsers] ${delResult.failureCount} deletions failed in this batch`,
          );
        }
      }

      nextPageToken = result.pageToken;
    } while (nextPageToken);

    // Also purge expired rate limit docs (>1 day idle).
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let rateLimitsPurged = 0;
    try {
      const stale = await db
        .collection("rateLimits")
        .where("updatedAt", "<", oneDayAgo)
        .limit(500)
        .get();
      const batch = db.batch();
      stale.docs.forEach((doc) => batch.delete(doc.ref));
      if (stale.size > 0) {
        await batch.commit();
        rateLimitsPurged = stale.size;
      }
    } catch (err) {
      console.error("[cleanupAnonymousUsers] rateLimits purge failed:", err);
    }

    console.log(
      `[cleanupAnonymousUsers] scanned=${scanned} deleted=${deleted} rateLimitsPurged=${rateLimitsPurged}`,
    );
  },
);
