/* =========================================================
   HISAB V7 — SAFE BACK BUTTON FIX
   Navigation only
   White-screen safe
   Does NOT replace app.js
   ========================================================= */

(function () {
  "use strict";

  var historyStack = [];
  var currentPage = "home";
  var busy = false;
  var installed = false;

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
    if (!page) return false;

    var buttons = page.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var text = (buttons[i].textContent || "")
        .trim()
        .toLowerCase();

      if (
        text.indexOf("←") === 0 ||
        text.indexOf("✕") === 0 ||
        text.indexOf("back") !== -1
      ) {
        return true;
      }
    }

    return false;
  }

  function addBackButton(page) {
    if (!page || page.id === "home") return;

    if (page.querySelector(".hisab-auto-back")) return;

    if (hasExistingBack(page)) return;

    var title = page.querySelector(".page-title");

    if (!title) return;

    var btn = document.createElement("button");

    btn.type = "button";
    btn.className = "hisab-auto-back";
    btn.setAttribute("aria-label", "Back");
    btn.innerHTML = "← Back";

    btn.onclick = function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      goBack();
      return false;
    };

    title.insertBefore(btn, title.firstChild);
  }

  function prepareButtons() {
    try {
      for (var i = 0; i < pages.length; i++) {
        addBackButton(getPage(pages[i]));
      }
    } catch (e) {
      /* Back button error must never stop the app */
    }
  }

  function originalShow(id) {
    try {
      if (typeof window.__HISAB_ORIGINAL_SHOW === "function") {
        window.__HISAB_ORIGINAL_SHOW(id);
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  function realShow(id, remember) {
    var target = getPage(id);

    /*
      IMPORTANT:
      Target page nahi mila to current screen ko hide nahi karna.
      Isse white screen prevent hoti hai.
    */
    if (!target) {
      return false;
    }

    if (remember && currentPage !== id) {
      if (currentPage && getPage(currentPage)) {
        historyStack.push(currentPage);
      }
    }

    var ok = originalShow(id);

    if (!ok) {
      return false;
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

  function goBack() {
    if (busy) return;

    busy = true;

    try {
      var previous = historyStack.pop();

      while (previous && !getPage(previous)) {
        previous = historyStack.pop();
      }

      if (previous) {
        realShow(previous, false);
      } else {
        historyStack = [];

        if (getPage("home")) {
          realShow("home", false);
        }
      }
    } catch (e) {
      /* Never allow Back to crash the app */
    }

    setTimeout(function () {
      busy = false;
    }, 120);
  }

  function install() {
    if (installed) return;

    /*
      app.js ka show function load hone ka wait.
      Infinite aggressive loop nahi.
    */
    if (typeof window.show !== "function") {
      setTimeout(install, 200);
      return;
    }

    /*
      Agar kisi aur system ne already original show save
      kiya hai to usko dobara wrap nahi karna.
    */
    if (!window.__HISAB_ORIGINAL_SHOW) {
      window.__HISAB_ORIGINAL_SHOW = window.show;
    }

    if (!window.__HISAB_BACK_WRAPPED) {
      var baseShow = window.__HISAB_ORIGINAL_SHOW;

      window.show = function (id) {
        if (!getPage(id)) {
          return false;
        }

        return realShow(id, true);
      };

      /*
        Safety reference:
        original app.js show kabhi overwrite nahi hoga.
      */
      window.__HISAB_ORIGINAL_SHOW = baseShow;
      window.__HISAB_BACK_WRAPPED = true;
    }

    installed = true;

    prepareButtons();

    window.HISAB_REPAIR = {
      back: goBack,

      home: function () {
        historyStack = [];

        if (getPage("home")) {
          realShow("home", false);
        }
      },

      refreshBackButtons: function () {
        prepareButtons();
      }
    };
  }

  /* =========================================================
     SAFE STYLE
     ========================================================= */

  function addStyle() {
    if (document.getElementById("hisab-back-style")) return;

    var style = document.createElement("style");
    style.id = "hisab-back-style";

    style.textContent = `
      .hisab-auto-back{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        flex:0 0 auto !important;
        width:auto !important;
        min-width:72px !important;
        max-width:90px !important;
        height:40px !important;
        padding:8px 12px !important;
        margin:0 10px 0 0 !important;
        border-radius:11px !important;
        background:#fff !important;
        color:#2457d6 !important;
        border:1px solid #dfe5ef !important;
        font-size:13px !important;
        font-weight:700 !important;
        line-height:1 !important;
        box-shadow:0 3px 10px rgba(30,55,90,.06) !important;
        white-space:nowrap !important;
        box-sizing:border-box !important;
      }

      .hisab-auto-back:active{
        transform:scale(.96) !important;
      }

      .page-title{
        gap:8px !important;
        display:flex !important;
        align-items:center !important;
      }
    `;

    try {
      document.head.appendChild(style);
    } catch (e) {}
  }

  /* =========================================================
     START
     ========================================================= */

  function start() {
    try {
      addStyle();
      install();
    } catch (e) {
      /*
        Repair system fail ho bhi jaye,
        main HISAB app ko stop nahi karega.
      */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
