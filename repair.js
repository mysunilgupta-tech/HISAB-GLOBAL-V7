/* HISAB V7 — FINAL BACK BUTTON REPAIR ONLY */

(function () {
  "use strict";

  const BACK_PAGES = [
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
    "familytools",
    "tools13",
    "final"
  ];

  /* ================= CURRENT PAGE ================= */

  function getCurrentPage() {
    const pages = document.querySelectorAll(".page");

    for (const page of pages) {
      if (!page.id) continue;

      const style = window.getComputedStyle(page);

      if (style.display !== "none") {
        return page;
      }
    }

    return null;
  }

  function getPageId() {
    const page = getCurrentPage();
    return page ? page.id : "";
  }

  /* ================= DATA ================= */

  function getData() {
    try {
      if (
        window.D &&
        typeof window.D === "object"
      ) {
        return window.D;
      }

      const raw =
        localStorage.getItem("hisab_v7_data");

      return raw ? JSON.parse(raw) : null;

    } catch (e) {
      return null;
    }
  }

  /* ================= BACK ACTION ================= */

  function goToParentPage() {

    const id = getPageId();
    const d = getData();

    /* Udhar form/detail */
    if (
      id === "khataEntry" ||
      id === "khataDetail"
    ) {

      const mode =
        d &&
        d.detailMode === "business"
          ? "business"
          : "personal";

      if (
        typeof window.show === "function"
      ) {
        window.show(mode);
      }

      return;
    }

    /* All main sections → Home */
    if (BACK_PAGES.includes(id)) {

      if (
        typeof window.show === "function"
      ) {
        window.show("home");
      }

      return;
    }

    if (
      typeof window.show === "function"
    ) {
      window.show("home");
    }
  }

  /* ================= CREATE BACK BUTTON ================= */

  function createBackButton() {

    let btn =
      document.getElementById(
        "hisabGlobalBackButton"
      );

    if (btn) {
      return btn;
    }

    btn =
      document.createElement("button");

    btn.id =
      "hisabGlobalBackButton";

    btn.type = "button";

    btn.textContent = "← Back";

    btn.setAttribute(
      "aria-label",
      "Back"
    );

    btn.style.position = "fixed";
    btn.style.left = "12px";

    btn.style.top =
      "calc(8px + env(safe-area-inset-top))";

    btn.style.zIndex =
      "2147483647";

    btn.style.display = "none";

    btn.style.padding =
      "10px 15px";

    btn.style.border = "0";

    btn.style.borderRadius =
      "12px";

    btn.style.background =
      "#082b45";

    btn.style.color =
      "#ffffff";

    btn.style.fontSize =
      "14px";

    btn.style.fontWeight =
      "700";

    btn.style.lineHeight =
      "1";

    btn.style.boxShadow =
      "0 4px 12px rgba(0,0,0,.20)";

    btn.addEventListener(
      "click",
      function (e) {

        e.preventDefault();
        e.stopPropagation();

        goToParentPage();
      }
    );

    document.body.appendChild(btn);

    return btn;
  }

  /* ================= UPDATE BUTTON ================= */

  function updateBackButton() {

    const btn =
      createBackButton();

    const id =
      getPageId();

    if (
      BACK_PAGES.includes(id)
    ) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  }

  /* ================= SHOW WRAPPER ================= */

  const originalShow =
    window.show;

  if (
    typeof originalShow ===
      "function" &&
    !window.__hisabRepairShowWrapped
  ) {

    window.__hisabRepairShowWrapped =
      true;

    window.show =
      function (id) {

        const result =
          originalShow.apply(
            this,
            arguments
          );

        setTimeout(
          updateBackButton,
          0
        );

        setTimeout(
          updateBackButton,
          100
        );

        return result;
      };
  }

  /* ================= DEVICE BACK ================= */

  function handleDeviceBack() {

    const id =
      getPageId();

    if (
      BACK_PAGES.includes(id)
    ) {

      goToParentPage();

      return;
    }

    if (
      id === "home" ||
      id === "welcome"
    ) {
      return;
    }

    if (
      typeof window.show ===
      "function"
    ) {
      window.show("home");
    }
  }

  /* Browser back */
  window.addEventListener(
    "popstate",
    handleDeviceBack
  );

  /* ================= CAPACITOR BACK ================= */

  function connectCapacitorBack() {

    try {

      const App =
        window.Capacitor &&
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.App;

      if (
        App &&
        typeof App.addListener ===
          "function" &&
        !window.__hisabCapBackConnected
      ) {

        window.__hisabCapBackConnected =
          true;

        App.addListener(
          "backButton",
          handleDeviceBack
        );
      }

    } catch (e) {

      console.warn(
        "HISAB Capacitor Back skipped:",
        e
      );
    }
  }

  /* ================= EXISTING BACK BUTTONS ================= */

  function fixExistingBackButtons() {

    document
      .querySelectorAll(
        ".page-title button"
      )
      .forEach(function (button) {

        if (
          button.dataset
            .hisabBackFixed === "1"
        ) {
          return;
        }

        const text =
          (
            button.innerText ||
            ""
          )
            .trim()
            .toLowerCase();

        if (
          text === "←" ||
          text === "back" ||
          text.includes("back")
        ) {

          button.dataset
            .hisabBackFixed = "1";

          button.addEventListener(
            "click",
            function (e) {

              e.preventDefault();
              e.stopPropagation();

              goToParentPage();

            },
            true
          );
        }
      });
  }

  /* ================= START ================= */

  function startRepair() {

    createBackButton();

    connectCapacitorBack();

    fixExistingBackButtons();

    updateBackButton();

    setTimeout(
      updateBackButton,
      100
    );

    setTimeout(
      updateBackButton,
      500
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startRepair
    );

  } else {

    startRepair();
  }

  /* ================= SAFE WATCH ================= */

  /*
   * IMPORTANT:
   * Only watch DOM additions/removals.
   * Do NOT watch style/class here.
   */

  const observer =
    new MutationObserver(
      function () {

        fixExistingBackButtons();

        /*
         * Page changes are handled
         * by the show() wrapper.
         */
      }
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );

})();
