/* =========================================================
   HISAB V7 — REPAIR CONTROLLER
   Back Button + Welcome Screen Fix
   Works with current app.js + index.html
   ========================================================= */

(function () {
  "use strict";

  function get(id) {
    return document.getElementById(id);
  }

  function hideAllPages() {
    document
      .querySelectorAll(".page.screen")
      .forEach(function (page) {
        page.classList.remove("active");
      });

    const gate = get("guestGate");
    if (gate) {
      gate.classList.remove("active");
    }
  }

  function openHome() {
    hideAllPages();

    const shell = get("appShell");
    if (shell) {
      shell.style.display = "block";
    }

    const home = get("home");
    if (home) {
      home.classList.add("active");
    }

    if (typeof window.renderHome === "function") {
      window.renderHome();
    }
  }

  /* =========================================================
     WELCOME SCREEN BYPASS
     Start Using HISAB -> Direct Home
     ========================================================= */

  function fixWelcomeScreen() {
    const welcome = get("welcome");

    if (welcome) {
      welcome.classList.remove("active");
      welcome.style.display = "none";
    }
  }

  /* =========================================================
     SAFE SETMODE
     Personal / Business -> Home
     ========================================================= */

  const oldSetMode = window.setMode;

  window.setMode = function (mode) {
    if (mode !== "personal" && mode !== "business") {
      mode = "personal";
    }

    if (window.D) {
      window.D.mode = mode;

      if (typeof window.save === "function") {
        window.save();
      }
    }

    if (typeof oldSetMode === "function") {
      oldSetMode(mode);
    } else {
      openHome();
    }

    fixWelcomeScreen();
  };

  /* =========================================================
     START USING HISAB
     Direct Home instead of Welcome
     ========================================================= */

  const oldEnterGuestMode = window.enterGuestMode;

  window.enterGuestMode = function () {
    if (typeof oldEnterGuestMode === "function") {
      try {
        oldEnterGuestMode();
      } catch (e) {
        console.error("Guest mode error:", e);
      }
    }

    openHome();
    fixWelcomeScreen();
  };

  /* =========================================================
     BACK BUTTON
     ========================================================= */

  const oldGoBack = window.goBack;

  window.goBack = function () {
    if (typeof oldGoBack === "function") {
      oldGoBack();
    } else {
      openHome();
    }

    fixWelcomeScreen();
  };

  /* =========================================================
     NORMAL SHOW
     ========================================================= */

  const oldShow = window.show;

  window.show = function (id) {
    if (id === "welcome") {
      openHome();
      return;
    }

    if (typeof oldShow === "function") {
      oldShow(id);
    }

    fixWelcomeScreen();
  };

  /* =========================================================
     INITIAL REPAIR
     ========================================================= */

  function repair() {
    fixWelcomeScreen();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      repair,
      { once: true }
    );
  } else {
    repair();
  }

})();
