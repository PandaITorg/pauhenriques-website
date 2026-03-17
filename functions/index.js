const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

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
    const orderId = req.query.orderId || "";
    let transStatus = "U";
    let cres = "";

    if (req.method === "POST") {
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        transStatus = req.body.transStatus || "U";
        cres = req.body.cres || req.body.CRes || "";
      } else if (typeof req.body === "object") {
        transStatus = req.body.transStatus || "U";
        cres = req.body.cres || req.body.CRes || "";
      }
    } else if (req.method === "GET") {
      transStatus = req.query.transStatus || "Y";
      cres = req.query.cres || req.query.CRes || "";
    }

    // Store cres on the order so 3ds-complete can use it for BY_CRES verify
    if (orderId && cres) {
      try {
        await db.collection("orders").doc(orderId).update({
          threeDSCres: cres,
          threeDSTransStatus: transStatus,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to store cres on order:", err);
      }
    } else if (orderId && transStatus) {
      // Even without cres, store the transStatus so polling can detect failures
      try {
        await db.collection("orders").doc(orderId).update({
          threeDSTransStatus: transStatus,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to store transStatus on order:", err);
      }
    }

    // Return HTML that sends postMessage to the parent checkout window
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>3DS Verification</title></head>
<body>
<script>
(function() {
  var message = {
    type: "3DS_COMPLETE",
    orderId: "${orderId.replace(/"/g, "")}",
    transStatus: "${transStatus.replace(/"/g, "")}"
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
