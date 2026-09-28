/* HISAB V7 — BACK BUTTON FINAL POSITION FIX */

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

  function getCurrentPage() {
    const pages = document.querySelectorAll(".page");

    for (const page of pages) {
      if (!page.id) continue;

      const style = getComputedStyle(page);

      if (
        style.display !== "none" &&
        page.offsetWidth > 0 &&
        page.offsetHeight > 0
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

  function getData() {
    try {
      if (window.D && typeof window.D === "object") {
        return window.D;
      }

      const raw = localStorage.getItem("hisab_v7_data");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function goToParentPage() {
    const id = getPageId();
    const d = getData();

    if (id === "khataEntry" || id === "khataDetail") {
      const mode =
        d && d.detailMode === "business"
          ? "business"
          : "personal";

      if (typeof window.show === "function") {
        window.show(mode);
      }
      return;
    }

    if (BACK_PAGES.includes(id)) {
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
    let btn = document.getElementById(
      "hisabGlobalBackButton"
    );

    if (btn) return btn;

    btn = document.createElement("button");

    btn.id = "hisabGlobalBackButton";
    btn.type = "button";
    btn.textContent = "← Back";
    btn.setAttribute("aria-label", "Back");

    /*
      HEADER-FRIENDLY POSITION
      Status bar ke neeche,
      lekin screen ke bilkul top par nahi.
    */
    btn.style.position = "fixed";
    btn.style.top =
      "calc(env(safe-area-inset-top, 0px) + 16px)";
    btn.style.left = "10px";

    btn.style.right = "auto";
    btn.style.bottom = "auto";

    /* COMPACT SIZE */
    btn.style.width = "68px";
    btn.style.height = "34px";
    btn.style.minWidth = "68px";
    btn.style.minHeight = "34px";
    btn.style.maxWidth = "68px";
    btn.style.padding = "0";

    /* PERFECT CENTER */
    btn.style.display = "none";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";

    /* STYLE */
    btn.style.boxSizing = "border-box";
    btn.style.border = "0";
    btn.style.borderRadius = "9px";
    btn.style.background = "#082b45";
    btn.style.color = "#ffffff";

    btn.style.fontFamily = "inherit";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "700";
    btn.style.lineHeight = "1";
    btn.style.whiteSpace = "nowrap";

    btn.style.boxShadow =
      "0 2px 8px rgba(0,0,0,.16)";

    btn.style.zIndex = "2147483647";

    btn.style.visibility = "visible";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";

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

  function updateBackButton() {
    const btn = createBackButton();
    const id = getPageId();

    if (BACK_PAGES.includes(id)) {
      btn.style.display = "flex";
      btn.style.pointerEvents = "auto";
    } else {
      btn.style.display = "none";
      btn.style.pointerEvents = "none";
    }
  }

  /* Keep original HISAB navigation intact */
  const originalShow = window.show;

  if (
    typeof originalShow === "function" &&
    !window.__hisabRepairShowWrapped
  ) {
    window.__hisabRepairShowWrapped = true;

    window.show = function (id) {
      const result = originalShow.apply(
        this,
        arguments
      );

      setTimeout(updateBackButton, 0);
      setTimeout(updateBackButton, 100);
      setTimeout(updateBackButton, 250);

      return result;
    };
  }

  /* Android Back */
  function handleDeviceBack() {
    const id = getPageId();

    if (BACK_PAGES.includes(id)) {
      goToParentPage();
      return;
    }

    if (id === "home" || id === "welcome") {
      return;
    }

    if (typeof window.show === "function") {
      window.show("home");
    }
  }

  window.addEventListener(
    "popstate",
    handleDeviceBack
  );

  /* Capacitor Android Back */
  function connectCapacitorBack() {
    try {
      const App =
        window.Capacitor &&
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.App;

      if (
        App &&
        typeof App.addListener === "function" &&
        !window.__hisabCapBackConnected
      ) {
        window.__hisabCapBackConnected = true;

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

  /* Existing header Back buttons */
  function fixExistingBackButtons() {
    document
      .querySelectorAll(".page-title button")
      .forEach(function (button) {
        if (
          button.dataset.hisabBackFixed === "1"
        ) {
          return;
        }

        const text = (
          button.innerText || ""
        )
          .trim()
          .toLowerCase();

        if (
          text === "←" ||
          text === "back" ||
          text.includes("back")
        ) {
          button.dataset.hisabBackFixed = "1";

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

  function startRepair() {
    createBackButton();
    connectCapacitorBack();
    fixExistingBackButtons();
    updateBackButton();

    setTimeout(updateBackButton, 100);
    setTimeout(updateBackButton, 300);
    setTimeout(updateBackButton, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startRepair
    );
  } else {
    startRepair();
  }

  const observer = new MutationObserver(
    function () {
      fixExistingBackButtons();
    }
  );

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

})();
