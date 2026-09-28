/* =========================================================
   HISAB V7 — SAFE BACK REPAIR
   Works with existing app.js
   Does NOT remove or replace app features
   ========================================================= */

(function () {
  "use strict";

  var stack = [];
  var current = "home";
  var locked = false;

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

  function page(id) {
    return document.getElementById(id);
  }

  /* -------------------------------
     Detect an existing Back/Close
     ------------------------------- */

  function alreadyHasBack(el) {
    if (!el) return false;

    var buttons = el.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim().toLowerCase();

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

  /* -------------------------------
     Add automatic Back button
     ------------------------------- */

  function addBack(el) {
    if (!el || el.id === "home") return;

    if (el.querySelector(".hisab-auto-back")) return;

    if (alreadyHasBack(el)) return;

    var title = el.querySelector(".page-title");

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

  function prepare() {
    for (var i = 0; i < pages.length; i++) {
      addBack(page(pages[i]));
    }
  }

  /* -------------------------------
     Direct page display
     Used only for Back.
     Does NOT call app.js show().
     ------------------------------- */

  function display(id) {
    var target = page(id);

    if (!target) {
      target = page("home");
      id = "home";
    }

    var all = document.querySelectorAll(".page");

    for (var i = 0; i < all.length; i++) {
      all[i].style.display = "none";
      all[i].classList.remove("active");
    }

    target.style.display = "";
    target.classList.add("active");

    current = id;

    prepare();

    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  }

  /* -------------------------------
     Remember navigation
     ------------------------------- */

  function remember(id) {
    if (!id || id === current) return;

    if (page(id)) {
      stack.push(current);
      current = id;
    }
  }

  /* -------------------------------
     Back
     ------------------------------- */

  function goBack() {
    if (locked) return;

    locked = true;

    var previous = null;

    while (stack.length) {
      previous = stack.pop();

      if (previous && page(previous)) {
        break;
      }

      previous = null;
    }

    if (previous) {
      display(previous);
    } else {
      stack = [];
      display("home");
    }

    setTimeout(function () {
      locked = false;
    }, 120);
  }

  /* -------------------------------
     Hook app.js show()
     ------------------------------- */

  function install() {
    if (typeof window.show !== "function") {
      setTimeout(install, 100);
      return;
    }

    if (window.__HISAB_REPAIR_INSTALLED) return;

    window.__HISAB_REPAIR_INSTALLED = true;

    var originalShow = window.show;

    window.__HISAB_ORIGINAL_SHOW = originalShow;

    window.show = function (id) {
      if (!page(id)) {
        console.warn("HISAB: page not found:", id);
        return false;
      }

      if (id !== current) {
        remember(id);
      }

      /*
       * IMPORTANT:
       * Call app.js show ONLY ONCE.
       * No recursive realShow() call.
       */

      try {
        var result = originalShow(id);

        current = id;

        setTimeout(function () {
          prepare();
        }, 30);

        return result;
      } catch (e) {
        console.error("HISAB navigation error:", e);

        display(id);

        return false;
      }
    };

    window.HISAB_REPAIR = {
      back: goBack,

      home: function () {
        stack = [];
        display("home");
      },

      clearHistory: function () {
        stack = [];
      }
    };

    prepare();
  }

  /* -------------------------------
     CSS
     ------------------------------- */

  function style() {
    if (document.getElementById("hisabRepairStyle")) return;

    var s = document.createElement("style");

    s.id = "hisabRepairStyle";

    s.textContent = `
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

    document.head.appendChild(s);
  }

  /* -------------------------------
     Start
     ------------------------------- */

  function start() {
    style();
    install();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
