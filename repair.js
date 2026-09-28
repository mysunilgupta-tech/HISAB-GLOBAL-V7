/* =========================================================
   HISAB V7 — REPAIR.JS
   SAFE BACK BUTTON SYSTEM
   Compatible with current app.js + index.html
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

  /* ---------------------------------------------------------
     CHECK EXISTING BACK/CLOSE BUTTON
     --------------------------------------------------------- */

  function hasExistingBack(page) {
    if (!page) return false;

    var buttons = page.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var text = (buttons[i].textContent || "").trim().toLowerCase();

      if (
        text.indexOf("←") === 0 ||
        text.indexOf("back") !== -1 ||
        text.indexOf("✕") === 0 ||
        text === "close" ||
        text === "बंद"
      ) {
        return true;
      }
    }

    return false;
  }

  /* ---------------------------------------------------------
     ADD BACK BUTTON ONLY WHERE NEEDED
     --------------------------------------------------------- */

  function addBackButton(page) {
    if (!page || page.id === "home") return;

    if (page.querySelector(".hisab-auto-back")) return;

    if (hasExistingBack(page)) return;

    var title = page.querySelector(".page-title");

    if (!title) return;

    var button = document.createElement("button");

    button.type = "button";
    button.className = "hisab-auto-back";
    button.textContent = "← Back";

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      goBack();
    });

    title.insertBefore(button, title.firstChild);
  }

  function prepareButtons() {
    for (var i = 0; i < pages.length; i++) {
      addBackButton(getPage(pages[i]));
    }
  }

  /* ---------------------------------------------------------
     ORIGINAL SHOW FROM APP.JS
     --------------------------------------------------------- */

  function getOriginalShow() {
    return window.__HISAB_ORIGINAL_SHOW;
  }

  /* ---------------------------------------------------------
     SHOW PAGE THROUGH APP.JS
     --------------------------------------------------------- */

  function realShow(id, remember) {
    var page = getPage(id);

    if (!page) {
      console.warn("HISAB repair: page not found:", id);
      return false;
    }

    if (remember && currentPage !== id) {
      if (historyStack[historyStack.length - 1] !== currentPage) {
        historyStack.push(currentPage);
      }
    }

    var originalShow = getOriginalShow();

    if (typeof originalShow === "function") {
      try {
        originalShow(id, false);
      } catch (error) {
        console.error("HISAB repair show error:", error);

        /* Emergency local navigation */
        showPageDirect(id);
      }
    } else {
      showPageDirect(id);
    }

    currentPage = id;

    setTimeout(function () {
      prepareButtons();

      try {
        window.scrollTo(0, 0);
      } catch (e) {}
    }, 30);

    return true;
  }

  /* ---------------------------------------------------------
     EMERGENCY SAFE NAVIGATION
     --------------------------------------------------------- */

  function showPageDirect(id) {
    var target = getPage(id);

    if (!target) return;

    var all = document.querySelectorAll(".page");

    for (var i = 0; i < all.length; i++) {
      all[i].style.display = "none";
      all[i].classList.remove("active");
    }

    target.style.display = "";
    target.classList.add("active");
  }

  /* ---------------------------------------------------------
     BACK
     --------------------------------------------------------- */

  function goBack() {
    if (busy) return;

    busy = true;

    var previous = null;

    while (historyStack.length > 0) {
      previous = historyStack.pop();

      if (previous && getPage(previous)) {
        break;
      }

      previous = null;
    }

    if (previous && previous !== currentPage) {
      realShow(previous, false);
    } else {
      historyStack = [];
      realShow("home", false);
    }

    setTimeout(function () {
      busy = false;
    }, 120);
  }

  /* ---------------------------------------------------------
     INSTALL
     --------------------------------------------------------- */

  function install() {

    /*
      Wait for app.js to create window.show.
      repair.js must not destroy or replace app.js logic.
    */

    if (typeof window.show !== "function") {
      setTimeout(install, 100);
      return;
    }

    /*
      Save original app.js show only once.
    */

    if (
      !window.__HISAB_ORIGINAL_SHOW ||
      window.__HISAB_ORIGINAL_SHOW === window.show
    ) {
      window.__HISAB_ORIGINAL_SHOW = window.show;

      /*
        Repair wrapper.
        App.js remains the real page renderer.
      */

      window.show = function (id) {
        if (!id) return false;

        if (currentPage !== id) {
          historyStack.push(currentPage);
        }

        return realShow(id, false);
      };
    }

    prepareButtons();

    /*
      Public repair controls.
    */

    window.HISAB_REPAIR = {
      back: goBack,

      home: function () {
        historyStack = [];
        currentPage = "home";
        realShow("home", false);
      },

      clearHistory: function () {
        historyStack = [];
      }
    };
  }

  /* ---------------------------------------------------------
     STYLE
     --------------------------------------------------------- */

  function addStyle() {

    if (document.getElementById("hisabRepairStyle")) {
      return;
    }

    var style = document.createElement("style");

    style.id = "hisabRepairStyle";

    style.textContent = `
      .hisab-auto-back {
        flex: 0 0 auto !important;
        width: auto !important;
        min-width: 72px !important;
        height: 40px !important;
        box-sizing: border-box !important;
        padding: 8px 12px !important;
        margin: 0 10px 0 0 !important;
        border-radius: 11px !important;
        background: #ffffff !important;
        color: #2457d6 !important;
        border: 1px solid #dfe5ef !important;
        font-size: 13px !important;
        line-height: 22px !important;
        font-weight: 700 !important;
        box-shadow: 0 3px 10px rgba(30,55,90,.06) !important;
        white-space: nowrap !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .hisab-auto-back:active {
        transform: scale(.96) !important;
      }

      .page-title {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     START
     --------------------------------------------------------- */

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
