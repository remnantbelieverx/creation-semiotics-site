/**
 * Vercel serverless: create a Buttondown subscriber (sends double-opt-in email).
 *
 * Env (Vercel project secrets — never commit):
 *   BUTTONDOWN_API_KEY
 *
 * POST JSON: { "email": "you@example.com", "list": "signature" | "verdict-want" }
 * CORS: allows github.io origin + localhost for testing.
 */
const ALLOWED_ORIGINS = [
  "https://remnantbelieverx.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

function bad(res, status, msg, origin) {
  res.statusCode = status;
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, error: msg }));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    return bad(res, 405, "POST only", origin);
  }

  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) return bad(res, 500, "Server misconfigured", origin);

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  if (!body || typeof body !== "object") body = {};

  const email = String(body.email || "").trim().toLowerCase();
  const list = String(body.list || "signature").trim().slice(0, 64);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, "Valid email required", origin);
  }

  try {
    const bd = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Buttondown-Collision-Behavior": "overwrite",
        "X-Buttondown-Bypass-Firewall": "true",
      },
      body: JSON.stringify({
        email_address: email,
        metadata: { source: "verdict-site", list },
        notes: `list=${list}`,
        tags: [],
      }),
    });
    const data = await bd.json().catch(() => ({}));
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.setHeader(k, v));
    res.setHeader("Content-Type", "application/json");
    if (bd.ok || bd.status === 201) {
      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        id: data.id,
        type: data.type,
        email_address: data.email_address,
      }));
    }
    /* Already subscribed is fine — treat as success for the visitor */
    if (data.code === "email_already_exists" || /already/i.test(data.detail || "")) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, already: true }));
    }
    res.statusCode = 502;
    return res.end(JSON.stringify({
      ok: false,
      error: data.detail || data.code || "Buttondown error",
    }));
  } catch (err) {
    return bad(res, 502, "Upstream error", origin);
  }
};
