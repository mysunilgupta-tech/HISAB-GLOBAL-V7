/* =========================================================
   HISAB V7 — REPAIR CONTROLLER
   Back button + safe screen navigation
   Works with app.js
   ========================================================= */

(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function hideAll() {
    const ids = [
      "splashScreen",
      "welcomeScreen",
      "homeScreen",
      "personalScreen",
      "businessScreen",
      "transactionScreen",
      "transactionsScreen",
      "udharScreen",
      "khataScreen",
      "goalsScreen",
      "savingsScreen",
      "budgetScreen",
      "billsScreen",
      "loansScreen",
      "reportsScreen",
      "settingsScreen",
      "moreScreen"
    ];

    ids.forEach(function (id) {
      const el = $(id);

      if (el) {
        el.style.display = "none";
        el.classList.remove("active", "show");
      }
    });
  }

  function home() {
    hideAll();

    const el = $("homeScreen");

    if (el) {
      el.style.display = "";
      el.classList.add("active");
    }

    window.scrollTo(0, 0);

    if (
      window.HISAB &&
      typeof window.HISAB.render === "function"
    ) {
      window.HISAB.render();
    }
  }

  function back() {
    home();
  }

  /* ---------------------------------------------------------
     BACK BUTTON
     --------------------------------------------------------- */

  document.addEventListener(
    "click",
    function (event) {
      const target =
        event.target.closest(
          "#backBtn,.backBtn,[data-back]"
        );

      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      back();
    },
    true
  );

  /* ---------------------------------------------------------
     ANDROID / PHONE BACK
     --------------------------------------------------------- */

  window.addEventListener(
    "popstate",
    function () {
      home();
    }
  );

  /* ---------------------------------------------------------
     GLOBAL REPAIR API
     --------------------------------------------------------- */

  window.HISAB_REPAIR = {
    home: home,
    back: back
  };

})();
