/**
 * Creation Semiotics — lightweight funnel analytics
 *
 * Set CS_ANALYTICS.domain to your Plausible site domain (e.g. "example.com"
 * or "remnantbelieverx.github.io") to load Plausible. Leave empty to keep
 * local dataLayer-only tracking (debug with ?debug=1).
 *
 * Docs: Hermes/Memory/Public-Domain-Analytics.md
 */
(function (w) {
  "use strict";

  var cfg = w.CS_ANALYTICS || {};
  w.CS_ANALYTICS = cfg;

  /* Defaults — owner may override in a prior inline script */
  if (typeof cfg.domain !== "string") cfg.domain = "";
  if (typeof cfg.src !== "string") cfg.src = "https://plausible.io/js/script.tagged-events.js";
  if (typeof cfg.enabled !== "boolean") {
    cfg.enabled = !!(cfg.domain && String(cfg.domain).trim());
  }

  function loadPlausible() {
    if (!cfg.enabled || !cfg.domain) return;
    if (document.querySelector("script[data-cs-plausible]")) return;
    var s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", String(cfg.domain).trim());
    s.setAttribute("data-cs-plausible", "1");
    s.src = cfg.src;
    document.head.appendChild(s);
  }

  /**
   * @param {string} event
   * @param {object} [props]
   */
  function track(event, props) {
    try {
      var payload = Object.assign(
        { t: Date.now(), path: (location.pathname || "") + (location.hash || "") },
        props || {}
      );
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push(Object.assign({ event: event }, payload));

      if (typeof w.plausible === "function") {
        var keys = props ? Object.keys(props) : [];
        if (keys.length) w.plausible(event, { props: props });
        else w.plausible(event);
      }

      if (location.search.indexOf("debug=1") !== -1) {
        console.info("[cs-analytics]", event, payload);
      }
    } catch (_) {
      /* never block UX */
    }
  }

  w.csTrack = track;

  /* Auto pageview for multi-page surfaces (Plausible also auto-tracks full loads). */
  function pageview() {
    track("pageview", {
      title: document.title || "",
      ref: document.referrer ? "1" : "0",
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      loadPlausible();
      pageview();
    });
  } else {
    loadPlausible();
    pageview();
  }

  /* Hash SPAs (Verdict, Branch, Entry) */
  w.addEventListener("hashchange", function () {
    track("hash_change", { hash: location.hash || "#/" });
  });
})(window);
