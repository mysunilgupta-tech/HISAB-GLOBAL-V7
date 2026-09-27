/* HISAB V7 — FINAL REPAIR CONTROLLER
   BACK BUTTON FIX ONLY
   बाकी existing HISAB functions को disturb नहीं करता.
*/

(function () {
  "use strict";

  /* ================= BASIC HELPERS ================= */

  function $(id) {
    return document.getElementById(id);
  }

  function getData() {
    try {
      if (window.D && typeof window.D === "object") return window.D;

      const raw = localStorage.getItem("hisab_v7_data");
      if (raw) return JSON.parse(raw);

    } catch (e) {
      console.warn("HISAB data read error:", e);
    }

    return null;
  }

  function saveSafe() {
    try {
      if (typeof window.save === "function") {
        window.save();
        return;
      }

      const d = getData();

      if (d) {
        localStorage.setItem(
          "hisab_v7_data",
          JSON.stringify(d)
        );
      }

    } catch (e) {
      console.warn("HISAB save error:", e);
    }
  }

  /* ================= BACK BUTTON ================= */

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

  function getCurrentPage() {
    const pages = document.querySelectorAll(".page, .screen");

    for (const page of pages) {
      const style = window.getComputedStyle(page);

      if (
        !page.classList.contains("hidden") &&
        style.display !== "none" &&
        page.id
      ) {
        return page;
      }
    }

    return null;
  }

  function getPageId() {
    const page = getCurrentPage();
    return page ? page.id : "";
  }

  function goToParentPage() {
    const id = getPageId();
    const d = getData();

    /* Udhar form/detail */
    if (
      id === "khataEntry" ||
      id === "khataDetail"
    ) {
      const mode =
        d && d.detailMode === "business"
          ? "business"
          : "personal";

      if (typeof window.show === "function") {
        window.show(mode);
      }

      return;
    }

    /* Main sections */
    if (
      id === "personal" ||
      id === "business" ||
      id === "transactions" ||
      id === "planning" ||
      id === "credit" ||
      id === "reports" ||
      id === "reminders" ||
      id === "privacy" ||
      id === "family" ||
      id === "familytools" ||
      id === "tools13" ||
      id === "final"
    ) {
      if (typeof window.show === "function") {
        window.show("home");
      }

      return;
    }

    if (typeof window.show === "function") {
      window.show("home");
    }
  }

  function createBackButton() {
    if ($("hisabGlobalBackButton")) {
      return $("hisabGlobalBackButton");
    }

    const btn = document.createElement("button");

    btn.id = "hisabGlobalBackButton";
    btn.type = "button";
    btn.innerHTML = "← Back";

    btn.style.position = "fixed";
    btn.style.left = "12px";
    btn.style.top =
      "calc(8px + env(safe-area-inset-top))";
    btn.style.zIndex = "999999";
    btn.style.display = "none";
    btn.style.padding = "9px 14px";
    btn.style.border = "0";
    btn.style.borderRadius = "12px";
    btn.style.background = "#082b45";
    btn.style.color = "#ffffff";
    btn.style.fontSize = "14px";
    btn.style.fontWeight = "700";
    btn.style.boxShadow =
      "0 4px 12px rgba(0,0,0,.20)";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      goToParentPage();
    });

    document.body.appendChild(btn);

    return btn;
  }

  function updateBackButton() {
    const btn = createBackButton();
    const id = getPageId();

    if (BACK_PAGES.includes(id)) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  }

  /* ================= SHOW WRAPPER ================= */

  const originalShow = window.show;

  if (
    typeof originalShow === "function" &&
    !window.__hisabRepairShowWrapped
  ) {
    window.__hisabRepairShowWrapped = true;

    window.show = function (id) {

      try {
        const d = getData();

        if (d) {
          if (id === "personal") {
            d.mode = "personal";
          }

          if (id === "business") {
            d.mode = "business";
          }

          saveSafe();
        }
      } catch (e) {
        console.warn("HISAB mode error:", e);
      }

      const result = originalShow.apply(
        this,
        arguments
      );

      setTimeout(updateBackButton, 50);
      setTimeout(updateBackButton, 200);

      return result;
    };
  }

  /* ================= ANDROID / DEVICE BACK ================= */

  function handleDeviceBack() {
    const id = getPageId();

    if (BACK_PAGES.includes(id)) {
      goToParentPage();
      return;
    }

    if (
      id === "home" ||
      id === "welcome" ||
      id === "guestGate"
    ) {
      return;
    }

    if (typeof window.show === "function") {
      window.show("home");
    }
  }

  /* Browser/device back */
  window.addEventListener(
    "popstate",
    function () {
      handleDeviceBack();
    }
  );

  /* Capacitor App plugin, if available */
  function connectCapacitorBack() {
    try {
      if (
        window.Capacitor &&
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.App &&
        typeof window.Capacitor.Plugins.App.addListener ===
          "function"
      ) {
        if (window.__hisabCapBackConnected) {
          return;
        }

        window.__hisabCapBackConnected = true;

        window.Capacitor.Plugins.App.addListener(
          "backButton",
          function () {
            handleDeviceBack();
          }
        );
      }
    } catch (e) {
      console.warn(
        "Capacitor Back connection skipped:",
        e
      );
    }
  }

  /* ================= EXISTING HEADER BUTTONS ================= */

  function fixExistingBackButtons() {
    const buttons = document.querySelectorAll(
      ".page-title button"
    );

    buttons.forEach(function (button) {

      if (
        button.dataset.hisabBackFixed === "1"
      ) {
        return;
      }

      const text =
        (button.innerText || "")
          .trim()
          .toLowerCase();

      if (
        text === "←" ||
        text === "back" ||
        text.includes("back")
      ) {
        button.dataset.hisabBackFixed = "1";

        button.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();

          goToParentPage();
        };
      }
    });
  }

  /* ================= STARTUP ================= */

  function startRepair() {

    createBackButton();

    connectCapacitorBack();

    fixExistingBackButtons();

    updateBackButton();

    setTimeout(function () {
      fixExistingBackButtons();
      updateBackButton();
    }, 100);

    setTimeout(function () {
      fixExistingBackButtons();
      updateBackButton();
    }, 500);
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startRepair
    );
  } else {
    startRepair();
  }

  /* ================= PAGE CHANGE WATCH ================= */

  const observer =
    new MutationObserver(function () {
      fixExistingBackButtons();
      updateBackButton();
    });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "class",
      "style"
    ]
  });

})();
