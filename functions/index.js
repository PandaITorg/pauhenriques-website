const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

/**
 * 3DS Callback — receives POST from bank ACS after challenge completion.
 * Hosted as a Cloud Function (not on App Hosting) so it accepts external POSTs.
 * Stores the cres value and returns HTML with postMessage to the parent checkout.
 */
exports.threeDSCallback = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    // === DIAGNOSTIC LOGGING — full request dump ===
    // This is the critical diagnostic to find where the CRES arrives (or doesn't).
    try {
      console.log("[3dsCallback] =============== INCOMING REQUEST ===============");
      console.log("[3dsCallback] method:", req.method);
      console.log("[3dsCallback] url:", req.url);
      console.log("[3dsCallback] query:", JSON.stringify(req.query));
      console.log("[3dsCallback] headers:", JSON.stringify(req.headers));
      console.log("[3dsCallback] body (parsed):", JSON.stringify(req.body));
      console.log("[3dsCallback] rawBody:", req.rawBody ? req.rawBody.toString("utf8") : "(none)");
      console.log("[3dsCallback] body field names:", req.body && typeof req.body === "object" ? Object.keys(req.body).join(",") : "(n/a)");
    } catch (logErr) {
      console.error("[3dsCallback] log error:", logErr);
    }

    const orderId = req.query.orderId || "";
    let transStatus = "U";
    let cres = "";

    // Try to extract CRES from every possible field name, whatever casing
    function pickCres(src) {
      if (!src || typeof src !== "object") return "";
      // Match any field that looks like cres/CRes/creq/value/param.value
      for (const key of Object.keys(src)) {
        const k = key.toLowerCase();
        if (k === "cres" || k === "cres_value" || k === "cresvalue" || k === "value" || k === "param.value" || k === "paramvalue") {
          const v = src[key];
          if (typeof v === "string" && v.length > 0) return v;
        }
      }
      return src.cres || src.CRes || src.CRES || src.value || "";
    }

    if (req.method === "POST") {
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        transStatus = req.body?.transStatus || req.body?.TransStatus || "U";
        cres = pickCres(req.body);
      } else if (typeof req.body === "object") {
        transStatus = req.body?.transStatus || req.body?.TransStatus || "U";
        cres = pickCres(req.body);
      }
      // Last-resort fallback: parse rawBody manually
      if (!cres && req.rawBody) {
        const raw = req.rawBody.toString("utf8");
        const params = new URLSearchParams(raw);
        for (const [k, v] of params.entries()) {
          const kl = k.toLowerCase();
          if ((kl === "cres" || kl === "value" || kl === "param.value") && v) {
            cres = v;
            console.log("[3dsCallback] CRES extracted from rawBody fallback, key=" + k);
            break;
          }
        }
      }
    } else if (req.method === "GET") {
      transStatus = req.query.transStatus || "U";
      cres = req.query.cres || req.query.CRes || req.query.value || "";
    }

    // Alignet does NOT send transStatus as a separate field — it's inside the
    // CRES (base64url-encoded JSON). Decode the CRES payload to extract the
    // real transStatus. If we can't decode, leave the default.
    if (cres) {
      try {
        const base64 = cres.replace(/-/g, "+").replace(/_/g, "/");
        const pad = base64.length % 4;
        const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
        const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
        if (decoded && typeof decoded.transStatus === "string") {
          transStatus = decoded.transStatus;
          console.log("[3dsCallback] transStatus decoded from CRES payload: " + transStatus);
        }
      } catch (e) {
        console.warn("[3dsCallback] Could not decode CRES payload:", e.message);
      }
    }

    console.log("[3dsCallback] Extracted: orderId=" + orderId + ", transStatus=" + transStatus + ", cres=" + (cres ? "YES(len=" + cres.length + ")" : "NO"));

    // Store cres on the order so 3ds-complete can use it for BY_CRES verify
    // Only update if order exists and is in 3ds-pending state (prevents tampering)
    if (orderId) {
      try {
        const orderRef = db.collection("orders").doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists || orderDoc.data().status !== "3ds-pending") {
          console.warn("Callback rejected: order not in 3ds-pending state", { orderId, status: orderDoc.data()?.status });
        } else if (cres) {
          await orderRef.update({
            threeDSCres: cres,
            threeDSTransStatus: transStatus,
            updatedAt: new Date(),
          });
        } else if (transStatus) {
          await orderRef.update({
            threeDSTransStatus: transStatus,
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        console.error("Failed to store cres on order:", err);
      }
    }

    // Return HTML that sends postMessage to the parent checkout window
    // Sanitize values to prevent XSS — only allow alphanumeric, hyphens, underscores
    const safeOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, "");
    const safeTransStatus = String(transStatus).replace(/[^a-zA-Z0-9]/g, "");
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>3DS Verification</title></head>
<body>
<script>
(function() {
  var message = {
    type: "3DS_COMPLETE",
    orderId: "${safeOrderId}",
    transStatus: "${safeTransStatus}"
  };
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, "*");
    } else if (window.opener) {
      window.opener.postMessage(message, "*");
    }
  } catch(e) {}
})();
</script>
<p style="font-family:sans-serif;color:#666;text-align:center;margin-top:40px">
Verificando autenticaci&oacute;n...
</p>
</body></html>`;

    res.status(200).type("html").send(html);
  }
);

/**
 * Nuvei API Proxy — forwards requests from App Hosting to Nuvei production API.
 * Cloud Run (App Hosting) gets 500 from Nuvei, but Cloud Functions work fine.
 * This proxy solves the infrastructure incompatibility.
 *
 * Usage from App Hosting:
 *   POST /nuveiProxy
 *   Body: { path: "/v2/card/list?uid=xxx", method: "GET", body?: {...} }
 *   Headers: Auth-Token (generated by the caller)
 *
 * The proxy forwards the Auth-Token and body to Nuvei and returns the response.
 */
exports.nuveiProxy = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { path, method, body: nuveiBody } = req.body;
    const authToken = req.headers["x-nuvei-auth-token"];

    if (!path || !method || !authToken) {
      return res.status(400).json({ error: "Missing path, method, or x-nuvei-auth-token header" });
    }

    const env = req.headers["x-nuvei-env"] || "prod";
    const baseUrl = env === "prod"
      ? "https://ccapi.paymentez.com"
      : "https://ccapi-stg.paymentez.com";
    const url = `${baseUrl}${path}`;

    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Auth-Token": authToken,
        },
      };
      if (nuveiBody && method === "POST") {
        options.body = JSON.stringify(nuveiBody);
      }

      const response = await fetch(url, options);
      const responseBody = await response.text();

      // Forward Nuvei's response status and body
      try {
        res.status(response.status).json(JSON.parse(responseBody));
      } catch {
        res.status(response.status).send(responseBody);
      }
    } catch (err) {
      console.error("[nuveiProxy] Error:", err);
      res.status(500).json({ error: "Proxy error: " + err.message });
    }
  }
);
