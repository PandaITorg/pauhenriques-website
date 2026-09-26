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
 * 3DS Callback del Plan Novios — el term_url de los aportes
 * (src/app/api/plan-novios/contribute) apunta aquí.
 *
 * Hace lo mismo que threeDSCallback, pero el pago vive en
 * planNovios/{planId}/contributions/{contributionId} y no en orders/{id}.
 * El handler del paquete solo sabe escribir en orders, por eso va a mano.
 * Guarda threeDSCres/threeDSTransStatus solo si el aporte está en 3ds-pending;
 * /api/plan-novios/3ds-complete los lee en su polling.
 */
function pickCres(src) {
  for (const [key, v] of Object.entries(src)) {
    const k = key.toLowerCase();
    if ((k === "cres" || k === "value") && typeof v === "string" && v) return v;
  }
  return "";
}

function transStatusFromCres(cres) {
  try {
    // "base64" en Node también acepta el alfabeto base64url y sin padding.
    const decoded = JSON.parse(Buffer.from(cres, "base64").toString("utf-8"));
    return typeof decoded?.transStatus === "string" ? decoded.transStatus : null;
  } catch {
    return null;
  }
}

const isDocId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]+$/.test(v);

exports.threeDSCallbackPlanNovios = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    const { planId, contributionId } = req.query;
    const src = {
      ...req.query,
      ...(req.body && typeof req.body === "object" ? req.body : {}),
    };
    const cres = pickCres(src);
    const transStatus =
      (cres && transStatusFromCres(cres)) ||
      src.transStatus ||
      src.TransStatus ||
      "U";

    if (isDocId(planId) && isDocId(contributionId)) {
      try {
        const ref = db
          .collection("planNovios")
          .doc(planId)
          .collection("contributions")
          .doc(contributionId);
        const snap = await ref.get();
        if (snap.exists && snap.data().status === "3ds-pending") {
          const update = { threeDSTransStatus: transStatus, updatedAt: new Date() };
          if (cres) update.threeDSCres = cres;
          await ref.update(update);
        } else {
          console.warn("[threeDSCallbackPlanNovios] rechazado: no está en 3ds-pending", {
            planId,
            contributionId,
            status: snap.data()?.status,
          });
        }
      } catch (err) {
        console.error("[threeDSCallbackPlanNovios] no se pudo guardar la CRES:", err);
      }
    }

    // ContributeClient escucha este postMessage y empieza el polling.
    const safeId = isDocId(contributionId) ? contributionId : "";
    const safeStatus = String(transStatus).replace(/[^a-zA-Z0-9]/g, "");
    res.set("Content-Type", "text/html; charset=utf-8").send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>3DS Verification</title></head>
<body>
<script>
(function() {
  var message = { type: "3DS_COMPLETE", contributionId: "${safeId}", transStatus: "${safeStatus}" };
  try {
    if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");
    else if (window.opener) window.opener.postMessage(message, "*");
  } catch(e) {}
})();
</script>
<p style="font-family:sans-serif;color:#666;text-align:center;margin-top:40px">
Verificando autenticaci&oacute;n...
</p>
</body></html>`);
  },
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
