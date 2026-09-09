(function () {
  "use strict";

  var WORKER_URL = "https://stockedge-quotes.vtan6288.workers.dev";
  var FINNHUB_KEY = "d9goml9r01qq65376m60d9goml9r01qq65376m6g";
  var DISPLAY_SYMBOLS = ["AAPL","NVDA","MSFT","AMZN","GOOGL","META","TSLA","BRK.B","AVGO","JPM","LLY","UNH","V","XOM","MA","COST","HD","WMT","NFLX","AMD"];
  var COMPANY_NAMES = {
    "AAPL":"Apple Inc.","NVDA":"NVIDIA Corporation","MSFT":"Microsoft Corp.",
    "AMZN":"Amazon.com Inc.","GOOGL":"Alphabet Inc.","META":"Meta Platforms",
    "TSLA":"Tesla Inc.","BRK.B":"Berkshire Hathaway","AVGO":"Broadcom Inc.",
    "JPM":"JPMorgan Chase","LLY":"Eli Lilly & Co.","UNH":"UnitedHealth Group",
    "V":"Visa Inc.","XOM":"Exxon Mobil Corp.","MA":"Mastercard Inc.",
    "COST":"Costco Wholesale","HD":"Home Depot Inc.","WMT":"Walmart Inc.",
    "NFLX":"Netflix Inc.","AMD":"Advanced Micro Devices"
  };
  var cachedQuotes = {};
  var currentTab = "gainers";

  function fetchAllQuotes() {
    return fetch(WORKER_URL + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).catch(function () {
      var results = {};
      return DISPLAY_SYMBOLS.reduce(function (chain, sym) {
        return chain.then(function () {
          return new Promise(function (res) { setTimeout(res, 200); });
        }).then(function () {
          return fetch("https://finnhub.io/api/v1/quote?symbol=" + sym + "&token=" + FINNHUB_KEY)
            .then(function (r) { return r.json(); })
            .then(function (d) { if (d && d.c > 0) results[sym] = d; })
            .catch(function () {});
        });
      }, Promise.resolve()).then(function () { return results; });
    });
  }

  function fmt(n, dec) {
    if (dec === undefined) dec = 2;
    if (n == null || isNaN(n)) return "—";
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function isMarketOpen() {
    var et = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    var day = et.getDay(), mins = et.getHours() * 60 + et.getMinutes();
    return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
  }

  function nowET() {
    return new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: true });
  }

  function refreshMarket() {
    var dot = document.getElementById("ticker-dot");
    var statusEl = document.getElementById("ticker-status-text");
    return fetchAllQuotes().then(function (quoteMap) {
      var quotes = DISPLAY_SYMBOLS.map(function (s) { return quoteMap[s] || {}; });
      var open = isMarketOpen();
      var et = nowET();
      var tickerItems = "";
      for (var t = 0; t < DISPLAY_SYMBOLS.length; t++) {
        var qt = quotes[t] || {};
        var pctt = qt.dp, pt = qt.c, upt = (pctt == null) ? true : pctt >= 0;
        tickerItems += '<span class="ticker-item">' + DISPLAY_SYMBOLS[t] +
          ' <span class="t-price">$' + fmt(pt) + "</span>" +
          ' <span class="' + (upt ? "up" : "down") + '">' + (pctt == null ? "—" : ((upt ? "▲ +" : "▼ ") + fmt(pctt) + "%")) + "</span></span>";
      }
      var track = document.getElementById("ticker-track");
      if (track) track.innerHTML = tickerItems + tickerItems;
      if (dot) dot.className = "live-dot" + (open ? "" : " closed");
      if (statusEl) statusEl.textContent = open ? "US session open · delayed sample" : "US session closed · last available sample";
      var tu = document.getElementById("ticker-update-time");
      if (tu) tu.textContent = "Updated " + et + " ET";

      for (var i = 0; i < DISPLAY_SYMBOLS.length; i++) cachedQuotes[DISPLAY_SYMBOLS[i]] = quotes[i];

      var tiles = document.querySelectorAll(".stock-tile");
      for (var j = 0; j < DISPLAY_SYMBOLS.length; j++) {
        var sym2 = DISPLAY_SYMBOLS[j], qj = quotes[j] || {};
        var pctj = qj.dp, pricej = qj.c, upj = (pctj == null) ? true : pctj >= 0;
        var tile = tiles[j];
        if (!tile) continue;
        tile.classList.remove("loading-tile", "up-tile", "down-tile");
        if (pctj != null) tile.classList.add(upj ? "up-tile" : "down-tile");
        tile.querySelector(".st-sym").textContent = sym2;
        tile.querySelector(".st-price").textContent = "$" + fmt(pricej);
        var chgEl2 = tile.querySelector(".st-chg");
        chgEl2.textContent = pctj == null ? "—" : ((upj ? "▲ +" : "▼ ") + fmt(pctj) + "%");
        chgEl2.className = "st-chg " + (pctj == null ? "" : (upj ? "up" : "down"));
        tile.setAttribute("data-sym", sym2);
        tile.onclick = function () { showDetail(this.getAttribute("data-sym")); };
      }

      renderTable(currentTab);

      var badge = document.getElementById("card-live-badge");
      if (badge) {
        badge.className = "live-pill" + (open ? "" : " closed");
        badge.innerHTML = open
          ? '<span class="live-dot"></span> Sample US prices (delayed)'
          : '<span class="live-dot closed"></span> Session closed · last available sample';
      }
      var crt = document.getElementById("card-refresh-time");
      if (crt) crt.textContent = "Updated " + et + " ET";
    }).catch(function (e) {
      console.warn("Market data error:", e);
      if (dot) dot.className = "live-dot closed";
      if (statusEl) statusEl.textContent = "Data delayed — retrying…";
      var note = document.getElementById("card-note");
      if (note) note.textContent = "Data temporarily unavailable. Will retry automatically.";
    });
  }

  function renderTable(tab) {
    var rows = DISPLAY_SYMBOLS.map(function (sym) { return { sym: sym, q: cachedQuotes[sym] }; });
    if (tab === "gainers") {
      rows = rows.filter(function (r) { return r.q && r.q.dp > 0; });
      rows.sort(function (a, b) { return b.q.dp - a.q.dp; });
    } else if (tab === "losers") {
      rows = rows.filter(function (r) { return r.q && r.q.dp < 0; });
      rows.sort(function (a, b) { return a.q.dp - b.q.dp; });
    }
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      var sym = rows[i].sym, q = rows[i].q;
      if (!q || q.c == null) continue;
      var up = q.dp >= 0;
      var chgSign = up ? "+" : "";
      html += '<tr onclick="showDetail(\'' + sym + '\')" data-sym="' + sym + '">' +
        "<td>" + (i + 1) + "</td>" +
        '<td class="td-sym">' + sym + "</td>" +
        '<td class="td-name">' + (COMPANY_NAMES[sym] || sym) + "</td>" +
        "<td>$" + fmt(q.c) + "</td>" +
        '<td class="' + (up ? "td-up" : "td-down") + '">' + chgSign + "$" + fmt(Math.abs(q.d || 0)) + "</td>" +
        '<td class="' + (up ? "td-up" : "td-down") + '">' + (up ? "+" : "") + fmt(q.dp) + "%</td>" +
        "</tr>";
    }
    var body = document.getElementById("stocks-tbody");
    if (body) body.innerHTML = html || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:16px;">No data yet</td></tr>';
  }

  function switchTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll(".stab").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    closeDetail();
    renderTable(tab);
  }

  function showDetail(sym) {
    var q = cachedQuotes[sym];
    if (!q || q.c == null) return;
    var up = q.dp >= 0;
    document.querySelectorAll(".stock-tile").forEach(function (t) {
      t.classList.toggle("selected", t.getAttribute("data-sym") === sym);
    });
    document.getElementById("detail-panel").style.display = "block";
    document.getElementById("dp-sym").textContent = sym;
    document.getElementById("dp-price").textContent = "$" + fmt(q.c);
    var chg = document.getElementById("dp-chg");
    chg.textContent = (up ? "▲ +" : "▼ ") + fmt(q.dp) + "%";
    chg.className = "dp-chg " + (up ? "up" : "down");
    document.getElementById("dp-high").textContent = "$" + fmt(q.h);
    document.getElementById("dp-low").textContent = "$" + fmt(q.l);
    document.getElementById("dp-open").textContent = "$" + fmt(q.o);
    document.getElementById("dp-prev").textContent = "$" + fmt(q.pc);
    document.getElementById("dp-chgd").textContent = (up ? "+" : "") + "$" + fmt(q.d);
    var range = (q.h != null && q.l != null && q.pc) ? (((q.h - q.l) / q.pc) * 100) : null;
    document.getElementById("dp-vol").textContent = range == null ? "—" : fmt(range) + "%";
  }

  function closeDetail() {
    var panel = document.getElementById("detail-panel");
    if (panel) panel.style.display = "none";
    document.querySelectorAll(".stock-tile").forEach(function (t) { t.classList.remove("selected"); });
  }

  window.switchTab = switchTab;
  window.showDetail = showDetail;
  window.closeDetail = closeDetail;

  if (document.getElementById("ticker-track")) {
    refreshMarket();
    setInterval(refreshMarket, 90000);
  }
})();
