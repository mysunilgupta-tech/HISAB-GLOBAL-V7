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

  function getCurrentPage() {
    const pages = document.querySelectorAll(".page");

    for (const page of pages) {
      if (!page.id) continue;

      const style = window.getComputedStyle(page);

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

  function goToParentPage() {

    const id = getPageId();
    const d = getData();

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
      "calc(10px + env(safe-area-inset-top))";

    btn.style.right = "auto";
    btn.style.bottom = "auto";

    btn.style.zIndex =
      "2147483647";

    btn.style.display = "none";

    btn.style.visibility = "visible";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";

    btn.style.padding =
      "10px 15px";

    btn.style.minHeight =
      "40px";

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

    btn.style.fontFamily =
      "inherit";

    btn.style.cursor =
      "pointer";

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

    const btn =
      createBackButton();

    const id =
      getPageId();

    if (
      BACK_PAGES.includes(id)
    ) {

      btn.style.display = "block";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";

    } else {

      btn.style.display = "none";
    }
  }

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

        setTimeout(
          updateBackButton,
          300
        );

        return result;
      };
  }

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

  window.addEventListener(
    "popstate",
    handleDeviceBack
  );

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
      300
    );

    setTimeout(
      updateBackButton,
      700
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

  const observer =
    new MutationObserver(
      function () {

        fixExistingBackButtons();

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
