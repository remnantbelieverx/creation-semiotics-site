/**
 * Vercel serverless: create a PayMongo Checkout Session (Hosted Checkout v2).
 *
 * Env (never commit):
 *   PAYMONGO_SECRET_KEY
 *   PUBLIC_SITE_URL  (optional)
 *
 * POST JSON: { "tier": "library_monthly" | "library_yearly" | "pastor_monthly" }
 * Returns: { "ok": true, "url": "https://checkout.paymongo.com/..." }
 *
 * Prefer static Payment Links on GitHub Pages when this API is not deployed.
 */
const ALLOWED_ORIGINS = [
  "https://remnantbelieverx.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

const TIERS = {
  library_monthly: {
    name: "Library membership (monthly)",
    amount: 49900,
    currency: "PHP",
  },
  library_yearly: {
    name: "Library membership (yearly)",
    amount: 449900,
    currency: "PHP",
  },
  pastor_monthly: {
    name: "Pastor / Teacher (monthly)",
    amount: 109900,
    currency: "PHP",
  },
};

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}

function send(res, status, obj, origin) {
  res.statusCode = status;
  Object.entries(cors(origin)).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (req.method === "OPTIONS") {
    Object.entries(cors(origin)).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    return send(res, 405, { ok: false, error: "POST only" }, origin);
  }

  const secret = process.env.PAYMONGO_SECRET_KEY;
  if (!secret) return send(res, 500, { ok: false, error: "Server misconfigured" }, origin);

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};

  const tier = String(body.tier || "").trim();
  const product = TIERS[tier];
  if (!product) return send(res, 400, { ok: false, error: "Unknown tier" }, origin);

  const site = (process.env.PUBLIC_SITE_URL || "https://remnantbelieverx.github.io/creation-semiotics-site").replace(
    /\/$/,
    ""
  );
  const auth = Buffer.from(`${secret}:`).toString("base64");

  try {
    const resp = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                name: product.name,
                amount: product.amount,
                currency: product.currency,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "paymaya", "grab_pay", "qrph"],
            success_url: `${site}/library/success.html?tier=${encodeURIComponent(tier)}&provider=paymongo`,
            cancel_url: `${site}/library/cancel.html?tier=${encodeURIComponent(tier)}&provider=paymongo`,
            send_email_receipt: true,
            reference_number: `cs-${tier}-${Date.now()}`,
            metadata: {
              cs_tier: tier,
              cs_project: "creation-semiotics",
            },
          },
        },
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const detail =
        (data.errors && data.errors[0] && data.errors[0].detail) ||
        data.detail ||
        "PayMongo error";
      return send(res, 502, { ok: false, error: detail }, origin);
    }
    const attrs = (data.data && data.data.attributes) || {};
    const url = attrs.checkout_url || attrs.url;
    if (!url) return send(res, 502, { ok: false, error: "No checkout_url in response" }, origin);
    return send(res, 200, { ok: true, url, id: data.data && data.data.id }, origin);
  } catch (e) {
    return send(res, 502, { ok: false, error: "Upstream error" }, origin);
  }
};
