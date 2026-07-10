/**
 * Vercel serverless: create a Stripe Checkout Session for Library membership.
 *
 * Env (Vercel project secrets — never commit):
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_LIBRARY_MONTHLY
 *   STRIPE_PRICE_LIBRARY_YEARLY
 *   STRIPE_PRICE_PASTOR_MONTHLY
 *   PUBLIC_SITE_URL  (e.g. https://remnantbelieverx.github.io/creation-semiotics-site)
 *
 * POST JSON: { "tier": "library_monthly" | "library_yearly" | "pastor_monthly" }
 * Returns: { "url": "https://checkout.stripe.com/..." }
 *
 * Prefer Payment Links on GitHub Pages when this API is not deployed.
 */
const ALLOWED_ORIGINS = [
  "https://remnantbelieverx.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

const TIER_ENV = {
  library_monthly: "STRIPE_PRICE_LIBRARY_MONTHLY",
  library_yearly: "STRIPE_PRICE_LIBRARY_YEARLY",
  pastor_monthly: "STRIPE_PRICE_PASTOR_MONTHLY",
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

function formBody(data) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  return params.toString();
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

  const secret = process.env.STRIPE_SECRET_KEY;
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
  const envKey = TIER_ENV[tier];
  if (!envKey) {
    return send(res, 400, { ok: false, error: "Unknown tier" }, origin);
  }
  const priceId = process.env[envKey] || body.priceId;
  if (!priceId) {
    return send(res, 500, { ok: false, error: `Price not configured for ${tier}` }, origin);
  }

  const site = (process.env.PUBLIC_SITE_URL || "https://remnantbelieverx.github.io/creation-semiotics-site").replace(
    /\/$/,
    ""
  );

  try {
    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody({
        mode: "subscription",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: `${site}/library/success.html?tier=${encodeURIComponent(tier)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/library/cancel.html?tier=${encodeURIComponent(tier)}`,
        allow_promotion_codes: "true",
        "metadata[cs_tier]": tier,
        "subscription_data[metadata][cs_tier]": tier,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return send(
        res,
        502,
        { ok: false, error: (data.error && data.error.message) || "Stripe error" },
        origin
      );
    }
    return send(res, 200, { ok: true, url: data.url, id: data.id }, origin);
  } catch (e) {
    return send(res, 502, { ok: false, error: "Upstream error" }, origin);
  }
};
