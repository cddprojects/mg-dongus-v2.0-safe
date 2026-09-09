(function () {
  "use strict";

  var FRAME_ID = "ctcw-frame-12";
  var WIDGET_ID = "12";
  var TRIGGER_SELECTOR = ".js-ctcw-waf-s";
  var CTC = {
    widgetId: 12,
    publicKey: "1bfd42900634a6194864ee610c9e7bff76a1651eddea5d53",
    resolveUrl: "https://ctc.chatfromforms.com/resolve-widget-destination.php",
    siteName: "PreMarketGuide",
    message: "Hi, I'd like to join the {site_name} daily market analysis group.",
    fallbackNumber: "13183948645"
  };

  var cachedUrl = buildWhatsAppUrl(CTC.fallbackNumber);

  function buildWhatsAppUrl(phone) {
    var text = CTC.message.replace(/\{site_name\}/g, CTC.siteName);
    var digits = String(phone).replace(/\D+/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
  }

  function frameBelongsToThisWidget(iframe) {
    if (!iframe) return false;
    if (iframe.id === FRAME_ID) return true;

    var src = iframe.getAttribute("src") || "";
    try {
      return new URL(src, window.location.href).searchParams.get("id") === WIDGET_ID;
    } catch (err) {
      return new RegExp("[?&]id=" + WIDGET_ID + "(?:&|$)").test(src);
    }
  }

  function getFrame() {
    var byId = document.getElementById(FRAME_ID);
    if (frameBelongsToThisWidget(byId)) return byId;

    var frames = document.querySelectorAll('iframe[id^="ctcw-frame-"], iframe[src*="ctc.chatfromforms.com"]');
    for (var i = 0; i < frames.length; i++) {
      if (frameBelongsToThisWidget(frames[i])) return frames[i];
    }
    return null;
  }

  function resolveWhatsAppUrl() {
    return fetch(CTC.resolveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widget_id: CTC.widgetId,
        public_key: CTC.publicKey,
        source_url: window.location.href
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      if (!data || !data.success || !data.full_number) {
        throw new Error((data && data.message) || "Unable to resolve WhatsApp destination");
      }
      return buildWhatsAppUrl(data.full_number);
    });
  }

  function openWhatsApp() {
    var url = cachedUrl;
    var tab = window.open(url, "_blank");
    if (!tab) window.location.href = url;

    var iframe = getFrame();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "ctcw:open",
        id: WIDGET_ID,
        sourceUrl: window.location.href
      }, "*");
    }
  }

  function handleClick(event) {
    var trigger = event.target.closest && event.target.closest(TRIGGER_SELECTOR);
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    openWhatsApp();
  }

  resolveWhatsAppUrl().then(function (url) {
    cachedUrl = url;
  }).catch(function () {});

  document.addEventListener("click", handleClick, true);
}());
