/* =========================================================
   HISAB V7 — BACK BUTTON FIX
   Only navigation/back system
   Does NOT replace app.js
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

  function hasExistingBack(page) {
    if (!page) return true;

    var buttons = page.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim();

      if (
        t.indexOf("←") === 0 ||
        t.indexOf("✕") === 0 ||
        t.toLowerCase().indexOf("back") !== -1
      ) {
        return true;
      }
    }

    return false;
  }

  function addBackButton(page) {
    if (!page || page.id === "home") return;

    /* Existing back option है तो नया button नहीं */
    if (hasExistingBack(page)) return;

    if (page.querySelector(".hisab-auto-back")) return;

    var title = page.querySelector(".page-title");

    if (!title) return;

    var btn = document.createElement("button");

    btn.type = "button";
    btn.className = "hisab-auto-back";
    btn.innerHTML = "← Back";

    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      goBack();
    };

    title.insertBefore(btn, title.firstChild);
  }

  function prepareButtons() {
    pages.forEach(function (id) {
      addBackButton(getPage(id));
    });
  }

  function realShow(id, remember) {
    if (!getPage(id)) return;

    if (remember && currentPage !== id) {
      historyStack.push(currentPage);
    }

    currentPage = id;

    if (typeof window.__HISAB_ORIGINAL_SHOW === "function") {
      window.__HISAB_ORIGINAL_SHOW(id);
    }

    setTimeout(function () {
      prepareButtons();
      window.scrollTo(0, 0);
    }, 20);
  }

  function goBack() {
    if (busy) return;
    busy = true;

    var previous = historyStack.pop();

    if (previous && getPage(previous)) {
      realShow(previous, false);
    } else {
      realShow("home", false);
      historyStack = [];
    }

    setTimeout(function () {
      busy = false;
    }, 80);
  }

  function install() {
    if (typeof window.show !== "function") {
      setTimeout(install, 100);
      return;
    }

    if (!window.__HISAB_ORIGINAL_SHOW) {
      window.__HISAB_ORIGINAL_SHOW = window.show;

      window.show = function (id) {
        realShow(id, true);
      };
    }

    prepareButtons();

    window.HISAB_REPAIR = {
      back: goBack,
      home: function () {
        historyStack = [];
        realShow("home", false);
      }
    };
  }

  /* Screen fit styling */
  var style = document.createElement("style");

  style.textContent = `
    .hisab-auto-back{
      flex:0 0 auto !important;
      width:auto !important;
      min-width:72px !important;
      height:40px !important;
      padding:8px 12px !important;
      margin:0 10px 0 0 !important;
      border-radius:11px !important;
      background:#fff !important;
      color:#2457d6 !important;
      border:1px solid #dfe5ef !important;
      font-size:13px !important;
      font-weight:700 !important;
      box-shadow:0 3px 10px rgba(30,55,90,.06) !important;
      white-space:nowrap !important;
    }

    .hisab-auto-back:active{
      transform:scale(.96) !important;
    }

    .page-title{
      gap:8px;
    }
  `;

  document.head.appendChild(style);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

})();
