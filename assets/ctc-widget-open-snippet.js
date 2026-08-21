/**
 * Paste BOTH scripts into widget 12 custom code only (Head or Body).
 * Do not paste this into widget 10 or widget 11.
 */
(function () {
  "use strict";

  var FLOATING_BTN_ID = "waf-s";
  var MAX_TRIES = 20;

  function tagFloatingButton() {
    var button = document.querySelector(".ctcw-widget-trigger [data-widget-button]")
      || document.querySelector(".ctcw-widget-trigger .ctcw-cta-button")
      || document.querySelector("[data-widget-button]")
      || document.querySelector(".ctcw-cta-button");
    if (!button) return false;
    button.id = FLOATING_BTN_ID;
    return true;
  }

  function tryTag(attempt) {
    if (tagFloatingButton()) return;
    if (attempt >= MAX_TRIES) return;
    window.setTimeout(function () { tryTag(attempt + 1); }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { tryTag(0); });
  } else {
    tryTag(0);
  }
}());

(function () {
  "use strict";

  var THIS_WIDGET_ID = "12";
  var TRUSTED_ORIGINS = [
    "https://www.premarketguide.com",
    "https://premarketguide.com",
    "http://localhost:8080"
  ];

  function isTrustedOrigin(origin) {
    if (!origin) return false;
    if (TRUSTED_ORIGINS.indexOf(origin) !== -1) return true;
    if (/^https:\/\/([a-z0-9-]+\.)?premarketguide\.com$/i.test(origin)) return true;
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  }

  function getFloatingButton() {
    return document.querySelector(".ctcw-widget-trigger #waf-s")
      || document.querySelector(".ctcw-widget-trigger [data-widget-button]")
      || document.querySelector(".ctcw-widget-trigger .ctcw-cta-button");
  }

  function buildWhatsAppUrl(phone) {
    var config = window.CTCW_WIDGET || {};
    var message = String(config.prefilledMessage || "")
      .replace(/\{site_name\}/g, config.websiteName || "PreMarketGuide");
    var digits = String(phone).replace(/\D+/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message);
  }

  function resolveDestination(sourceUrl) {
    var config = window.CTCW_WIDGET || {};
    return fetch(config.destinationResolveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widget_id: config.widgetId,
        public_key: config.publicKey,
        source_url: sourceUrl || document.referrer || ""
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      if (!data || !data.success || !data.full_number) {
        throw new Error((data && data.message) || "Unable to resolve destination");
      }
      return buildWhatsAppUrl(data.full_number);
    });
  }

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "ctcw:open") return;
    if (String(event.data.id) !== THIS_WIDGET_ID) return;
    if (!isTrustedOrigin(event.origin)) return;
    if (!event.source) return;

    var button = getFloatingButton();
    if (button) button.id = "waf-s";

    resolveDestination(event.data.sourceUrl).then(function (url) {
      event.source.postMessage({
        type: "ctcw:destination",
        id: THIS_WIDGET_ID,
        url: url
      }, event.origin);
    }).catch(function () {
      if (button) button.click();
    });
  });
}());
