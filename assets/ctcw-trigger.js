(function () {
  "use strict";

  var FRAME_ID = "ctcw-frame-10";
  var WIDGET_ID = "10";
  var DEFAULT_ORIGIN = "https://ctc.chatfromforms.com";
  var MOBILE_QUERY = "(max-width: 900px)";
  var FEEDBACK_MS = 1800;
  var CTC = {
    widgetId: 10,
    publicKey: "7c660c334cde4b2ea3d6c15590cf2d0d9b116e21f3160b05",
    resolveUrl: "https://ctc.chatfromforms.com/resolve-widget-destination.php",
    siteName: "PreMarketGuide",
    message: "Hi, I'd like to join the free {site_name} daily market analysis group."
  };

  var pendingOpen = false;
  var activeTrigger = null;
  var feedbackTimer = null;
  var pendingTab = null;

  function getFrame() {
    return document.getElementById(FRAME_ID);
  }

  function isMobileSticky() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function getFrameOrigin(iframe) {
    try {
      return new URL(iframe.src, window.location.href).origin;
    } catch (err) {
      return DEFAULT_ORIGIN;
    }
  }

  function isFrameReady(iframe) {
    if (!iframe || !iframe.contentWindow) return false;
    if (iframe.dataset.ctcwReady === "1") return true;

    try {
      var origin = iframe.contentWindow.location.origin;
      return origin && origin !== "null" && origin.indexOf("about:") !== 0;
    } catch (err) {
      return iframe.dataset.ctcwReady === "1";
    }
  }

  function markFrameReady(iframe) {
    iframe.dataset.ctcwReady = "1";
    if (pendingOpen) {
      pendingOpen = false;
      postOpenMessage(iframe);
    }
  }

  function watchFrame(iframe) {
    if (!iframe || iframe.dataset.ctcwWatch === "1") return;
    iframe.dataset.ctcwWatch = "1";
    iframe.addEventListener("load", function () {
      markFrameReady(iframe);
    });
    if (iframe.complete !== false && iframe.src) {
      window.setTimeout(function () { markFrameReady(iframe); }, 0);
    }
  }

  function postOpenMessage(iframe) {
    var payload = {
      type: "ctcw:open",
      id: WIDGET_ID,
      sourceUrl: window.location.href
    };
    var targetOrigin = getFrameOrigin(iframe);

    try {
      iframe.contentWindow.postMessage(payload, targetOrigin);
    } catch (err) {}

    try {
      iframe.contentWindow.postMessage(payload, DEFAULT_ORIGIN);
    } catch (err2) {}

    try {
      iframe.contentWindow.postMessage(payload, "*");
    } catch (err3) {}
  }

  function triggerCtcWidget() {
    var iframe = getFrame();
    if (!iframe) {
      pendingOpen = true;
      window.setTimeout(triggerCtcWidget, 200);
      return false;
    }

    watchFrame(iframe);

    if (!isFrameReady(iframe)) {
      pendingOpen = true;
      return true;
    }

    postOpenMessage(iframe);
    return true;
  }

  function buildWhatsAppUrl(phone) {
    var text = CTC.message.replace(/\{site_name\}/g, CTC.siteName);
    var digits = String(phone).replace(/\D+/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
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

  function navigatePendingTab(url) {
    if (pendingTab && !pendingTab.closed) {
      pendingTab.location.href = url;
      try { pendingTab.opener = null; } catch (err) {}
      pendingTab = null;
      return true;
    }

    window.open(url, "_blank");
    pendingTab = null;
    return false;
  }

  function openWhatsAppFromSticky() {
    // Do not pass noopener here — it makes window.open return null while still
    // opening a tab, which caused the fallback to navigate this page instead.
    pendingTab = window.open("about:blank", "_blank");

    return resolveWhatsAppUrl().then(function (url) {
      navigatePendingTab(url);
      clearTriggerFeedback();
    }).catch(function () {
      if (pendingTab && !pendingTab.closed) {
        pendingTab.close();
      }
      pendingTab = null;
      triggerCtcWidget();
    });
  }

  function setTriggerFeedback(trigger, active) {
    if (!trigger || !isMobileSticky()) return;

    if (active) {
      activeTrigger = trigger;
      trigger.classList.add("is-triggered");
      trigger.setAttribute("aria-busy", "true");
      return;
    }

    trigger.classList.remove("is-triggered", "is-pressed");
    trigger.removeAttribute("aria-busy");
    if (activeTrigger === trigger) activeTrigger = null;
  }

  function clearTriggerFeedback() {
    if (feedbackTimer) {
      window.clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
    if (activeTrigger) setTriggerFeedback(activeTrigger, false);
  }

  function startTriggerFeedback(trigger) {
    if (!isMobileSticky()) return;

    clearTriggerFeedback();
    setTriggerFeedback(trigger, true);

    feedbackTimer = window.setTimeout(function () {
      setTriggerFeedback(trigger, false);
      feedbackTimer = null;
    }, FEEDBACK_MS);
  }

  function handlePressStart(event) {
    var trigger = event.target.closest && event.target.closest("[data-ctcw-trigger]");
    if (!trigger || !isMobileSticky()) return;
    trigger.classList.add("is-pressed");
  }

  function handlePressEnd(event) {
    var trigger = event.target.closest && event.target.closest("[data-ctcw-trigger]");
    if (!trigger) return;
    trigger.classList.remove("is-pressed");
  }

  function handleTrigger(event) {
    var trigger = event.target.closest && event.target.closest("[data-ctcw-trigger]");
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }

    startTriggerFeedback(trigger);

    if (isMobileSticky() && trigger.id === "m-floating-btn") {
      openWhatsAppFromSticky();
      return;
    }

    triggerCtcWidget();
  }

  window.addEventListener("message", function (event) {
    if (!event.data) return;

    if (event.data.type === "ctcw:open-url" && event.data.url) {
      if (String(event.data.id) !== WIDGET_ID) return;
      navigatePendingTab(event.data.url);
      clearTriggerFeedback();
      return;
    }

    if (event.data.type !== "ctcw:size") return;
    if (String(event.data.id) !== WIDGET_ID) return;
    if (!event.data.state || event.data.state === "icon") return;
    clearTriggerFeedback();
  });

  document.addEventListener("touchstart", handlePressStart, true);
  document.addEventListener("mousedown", handlePressStart, true);
  document.addEventListener("touchend", handlePressEnd, true);
  document.addEventListener("mouseup", handlePressEnd, true);
  document.addEventListener("touchcancel", handlePressEnd, true);
  document.addEventListener("click", handleTrigger, true);

  window.triggerCtcWidget = triggerCtcWidget;

  watchFrame(getFrame());
  window.setInterval(function () {
    watchFrame(getFrame());
  }, 1000);
}());
