/* =========================================================
   HISAB V7 — REPAIR.JS
   FINAL SAFE BACK FIX
   Compatible with current app.js
   ========================================================= */

(function () {
  "use strict";

  var historyStack = [];
  var currentPage = "home";
  var busy = false;

  var pages = [
    "home",
    "personal",
    "business",
    "khataEntry",
    "khataDetail",
    "transactions",
    "planning",
    "credit",
    "reports",
    "reminders",
    "privacy",
    "family",
    "ads",
    "familytools",
    "tools13",
    "final"
  ];

  function getPage(id) {
    return document.getElementById(id);
  }

  function hasBackButton(page) {
    if (!page) return true;

    if (page.querySelector(".hisab-auto-back")) {
      return true;
    }

    var buttons = page.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "")
        .trim()
        .toLowerCase();

      if (
        t.indexOf("←") === 0 ||
        t.indexOf("back") !== -1 ||
        t.indexOf("✕") === 0 ||
        t === "close" ||
        t === "बंद"
      ) {
        return true;
      }
    }

    return false;
  }

  function addBackButton(page) {
    if (!page || page.id === "home") return;
    if (hasBackButton(page)) return;

    var title = page.querySelector(".page-title");

    if (!title) return;

    var btn = document.createElement("button");

    btn.type = "button";
    btn.className = "hisab-auto-back";
    btn.textContent = "← Back";

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      goBack();
    });

    title.insertBefore(btn, title.firstChild);
  }

  function prepareButtons() {
    for (var i = 0; i < pages.length; i++) {
      addBackButton(getPage(pages[i]));
    }
  }

  function install() {
    if (typeof window.show !== "function") {
      setTimeout(install, 100);
      return;
    }

    if (window.__HISAB_REPAIR_INSTALLED) {
      return;
    }

    window.__HISAB_REPAIR_INSTALLED = true;

    var originalShow = window.show;

    window.__HISAB_ORIGINAL_SHOW = originalShow;

    /*
     * IMPORTANT:
     * Respect app.js second argument.
     * show(page, false) MUST NOT enter Back history.
     */
    window.show = function (id, remember) {

      if (!getPage(id)) {
        console.warn("HISAB: page not found:", id);
        return false;
      }

      if (remember !== false && id !== currentPage) {
        historyStack.push(currentPage);
      }

      try {
        var result = originalShow(id, remember);

        currentPage = id;

        setTimeout(function () {
          prepareButtons();
        }, 30);

        return result;

      } catch (error) {
        console.error("HISAB repair navigation:", error);
        return false;
      }
    };

    prepareButtons();

    window.HISAB_REPAIR = {
      back: goBack,

      home: function () {
        historyStack = [];
        currentPage = "home";

        try {
          originalShow("home", false);
        } catch (e) {}
      },

      clearHistory: function () {
        historyStack = [];
      }
    };
  }

  function goBack() {
    if (busy) return;

    busy = true;

    var previous = null;

    while (historyStack.length) {
      var candidate = historyStack.pop();

      if (candidate && getPage(candidate)) {
        previous = candidate;
        break;
      }
    }

    if (!previous) {
      previous = "home";
      historyStack = [];
    }

    currentPage = previous;

    try {
      /*
       * Use app.js show(false) so renderAll(),
       * data refresh and existing navigation remain intact.
       */
      if (typeof window.__HISAB_ORIGINAL_SHOW === "function") {
        window.__HISAB_ORIGINAL_SHOW(previous, false);
      }
    } catch (error) {
      console.error("HISAB Back error:", error);
    }

    setTimeout(function () {
      prepareButtons();
      busy = false;
    }, 120);
  }

  function addStyle() {
    if (document.getElementById("hisabRepairStyle")) {
      return;
    }

    var style = document.createElement("style");

    style.id = "hisabRepairStyle";

    style.textContent = `
      .hisab-auto-back{
        flex:0 0 auto !important;
        width:auto !important;
        min-width:72px !important;
        height:40px !important;
        box-sizing:border-box !important;
        padding:8px 12px !important;
        margin:0 10px 0 0 !important;
        border-radius:11px !important;
        background:#fff !important;
        color:#2457d6 !important;
        border:1px solid #dfe5ef !important;
        font-size:13px !important;
        line-height:22px !important;
        font-weight:700 !important;
        white-space:nowrap !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        cursor:pointer !important;
      }

      .hisab-auto-back:active{
        transform:scale(.96) !important;
      }

      .page-title{
        display:flex !important;
        align-items:center !important;
        gap:8px !important;
      }
    `;

    document.head.appendChild(style);
  }

  function start() {
    addStyle();
    install();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
