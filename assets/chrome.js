(function () {
  "use strict";

  var year = String(new Date().getFullYear());
  var path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  var home = path === "" || path === "index.html" || path === "/";

  function navHref(hash) {
    return home ? hash : "index.html" + hash;
  }

  var dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York"
  });
  var termsActive = path === "terms-of-use.html" ? " is-active" : "";
  var privacyActive = path === "privacy-policy.html" ? " is-active" : "";

  var header = document.getElementById("site-chrome-header");
  if (header) {
    header.outerHTML =
      '<div class="mast-rail" role="note">' +
        "<span>Educational publisher</span>" +
        "<span>Currently $0</span>" +
        "<span>Detroit, MI 48226, United States</span>" +
      "</div>" +
      '<div class="masthead">' +
        '<p class="mast-date">' + dateStr + " · ET</p>" +
        '<a class="mast-wordmark" href="' + (home ? "#" : "index.html") + '">' +
          '<img src="assets/logo.png" alt="" width="36" height="36" />' +
          "<strong>PreMarketGuide</strong>" +
          "<small>The morning briefing</small>" +
        "</a>" +
        '<p class="mast-issue">Vol. 01 · Educational desk<br>WhatsApp · typically before 9:00 AM ET</p>' +
      "</div>" +
      '<nav class="site-nav" aria-label="Primary">' +
        '<a class="nav-brand" href="' + (home ? "#" : "index.html") + '">' +
          '<img src="assets/logo.png" alt="" width="28" height="28" />' +
          "<span>PreMarketGuide</span>" +
        "</a>" +
        '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-links" aria-label="Open menu"><span></span></button>' +
        '<div class="nav-links" id="site-nav-links">' +
          '<a href="' + navHref("#market") + '">Market data</a>' +
          '<a href="' + navHref("#method") + '">Method</a>' +
          '<a href="' + navHref("#receive") + '">What you get</a>' +
          '<a href="' + navHref("#faq") + '">FAQ</a>' +
          '<button class="btn-primary js-ctcw-waf-s" type="button" id="waf-s">Request briefing</button>' +
        "</div>" +
      "</nav>";
  }

  var disclaimer = document.getElementById("site-chrome-disclaimer");
  if (disclaimer) {
    disclaimer.outerHTML =
      '<aside class="disclaimer">' +
        '<div class="wrap">' +
          "<strong>Important disclaimer.</strong> " +
          "PreMarketGuide is an independent publisher of educational market commentary. We are not a registered broker-dealer or investment adviser, and we are not affiliated with any other market-research brand. " +
          "Content is furnished for personal, informational, and educational purposes only. " +
          "No mention of a particular security constitutes a recommendation to buy, sell, or hold that security. " +
          "Information is obtained from publicly available sources believed to be reliable, but accuracy, completeness, and timeliness are not guaranteed. " +
          "Check information independently before relying on it. Use of this service is solely at your own risk. " +
          "Currently $0. No subscription, membership, or consulting fee today. Fees may be introduced later with notice. " +
          "Markets involve risk, including loss of principal. Past performance does not indicate future results. " +
          'Contact: <a href="mailto:contact@premarketguide.com">contact@premarketguide.com</a>. Publisher location: Detroit, MI 48226, United States.' +
        "</div>" +
      "</aside>";
  }

  var footer = document.getElementById("site-chrome-footer");
  if (footer) {
    footer.outerHTML =
      '<footer class="site-foot">' +
        '<div class="footer-grid">' +
          "<div>" +
            '<div class="footer-brand"><img src="assets/logo.png" alt="" width="28" height="28" />PreMarketGuide</div>' +
            "<div>© " + year + " PreMarketGuide. All rights reserved.</div>" +
            '<p class="footer-contact">Independent educational publisher — not a broker or investment adviser. Currently $0; no subscription fee today. Fees may be introduced later with notice. Detroit, MI 48226, United States. Contact: <a href="mailto:contact@premarketguide.com">contact@premarketguide.com</a>.</p>' +
          "</div>" +
          "<div>" +
            "<h5>Desk</h5>" +
            "<ul>" +
              '<li><a href="' + navHref("#market") + '">Market data</a></li>' +
              '<li><a href="' + navHref("#method") + '">Method</a></li>' +
              '<li><a href="' + navHref("#receive") + '">What you get</a></li>' +
              '<li><a href="' + navHref("#faq") + '">FAQ</a></li>' +
            "</ul>" +
          "</div>" +
          "<div>" +
            "<h5>Legal</h5>" +
            "<ul>" +
              '<li><a class="' + privacyActive.trim() + '" href="privacy-policy.html">Privacy Policy</a></li>' +
              '<li><a class="' + termsActive.trim() + '" href="terms-of-use.html">Terms of Use</a></li>' +
            "</ul>" +
          "</div>" +
        "</div>" +
      "</footer>";
  }

  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("site-nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = ((i % 4) * 0.07) + "s";
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }
})();
