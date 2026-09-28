/* HISAB V7 — FINAL BACK BUTTON / HEADER FIX
   Safe version
   Only Back button UI/navigation repair.
   app.js, data and other features unchanged.
*/

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

  let repairTimer = null;
  let repairing = false;

  function getCurrentPage() {
    const pages = document.querySelectorAll(".page");

    for (const page of pages) {
      if (!page.id) continue;

      const s = getComputedStyle(page);

      if (
        s.display !== "none" &&
        page.offsetWidth > 0 &&
        page.offsetHeight > 0
      ) {
        return page;
      }
    }

    return null;
  }

  function getPageTitle(page) {
    if (!page) return null;

    return (
      page.querySelector(".page-title") ||
      page.querySelector(".page-header") ||
      page.querySelector("header")
    );
  }

  function isBackButton(button) {
    if (!button) return false;

    if (button.id === "hisabGlobalBackButton") {
      return true;
    }

    const text = (
      button.innerText ||
      button.textContent ||
      ""
    ).trim().toLowerCase();

    return (
      text === "back" ||
      text === "←" ||
      text === "‹" ||
      text === "〈" ||
      text.includes("back")
    );
  }

  function styleBackButton(button) {
    if (!button) return;

    button.type = "button";
    button.setAttribute("aria-label", "Back");

    button.style.width = "62px";
    button.style.minWidth = "62px";
    button.style.maxWidth = "62px";

    button.style.height = "30px";
    button.style.minHeight = "30px";
    button.style.maxHeight = "30px";

    button.style.padding = "0";
    button.style.margin = "0";

    button.style.boxSizing = "border-box";

    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";

    button.style.border = "0";
    button.style.borderRadius = "8px";

    button.style.background = "#082b45";
    button.style.color = "#ffffff";

    button.style.fontFamily = "inherit";
    button.style.fontSize = "11px";
    button.style.fontWeight = "700";
    button.style.lineHeight = "1";
    button.style.whiteSpace = "nowrap";

    button.style.boxShadow =
      "0 2px 6px rgba(0,0,0,.15)";

    button.style.position = "absolute";
    button.style.left = "8px";
    button.style.top = "50%";
    button.style.transform = "translateY(-50%)";

    button.style.zIndex = "5";
    button.style.overflow = "hidden";
  }

  function attachBackAction(button) {
    if (!button) return;

    if (button.dataset.hisabBackAction === "1") {
      return;
    }

    button.dataset.hisabBackAction = "1";

    button.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (typeof window.goBack === "function") {
          window.goBack();
        }
      },
      true
    );
  }

  function prepareTitle(title) {
    if (!title) return;

    const computed = getComputedStyle(title);

    if (computed.position === "static") {
      title.style.position = "relative";
    }

    const paddingLeft =
      parseFloat(
        getComputedStyle(title).paddingLeft
      ) || 0;

    if (paddingLeft < 76) {
      title.style.paddingLeft = "76px";
    }
  }

  function findExistingBack(title) {
    if (!title) return null;

    const buttons =
      title.querySelectorAll("button");

    for (const button of buttons) {
      if (isBackButton(button)) {
        return button;
      }
    }

    return null;
  }

  function createBackButton(title) {
    let button =
      title.querySelector(
        '[data-hisab-page-back="1"]'
      );

    if (!button) {
      button = document.createElement("button");

      button.type = "button";
      button.textContent = "← Back";

      button.setAttribute(
        "data-hisab-page-back",
        "1"
      );

      title.insertBefore(
        button,
        title.firstChild
      );
    }

    styleBackButton(button);
    attachBackAction(button);

    return button;
  }

  function repairPage(page) {
    if (!page) return;

    const id = page.id;

    if (!BACK_PAGES.includes(id)) {
      return;
    }

    const title = getPageTitle(page);

    if (!title) {
      return;
    }

    prepareTitle(title);

    let button = findExistingBack(title);

    if (!button) {
      button = createBackButton(title);
    }

    styleBackButton(button);
    attachBackAction(button);
  }

  function repairAll() {
    if (repairing) return;

    repairing = true;

    try {
      const current = getCurrentPage();

      const oldGlobal =
        document.getElementById(
          "hisabGlobalBackButton"
        );

      if (oldGlobal) {
        oldGlobal.remove();
      }

      BACK_PAGES.forEach(function (id) {
        const page =
          document.getElementById(id);

        if (!page) return;

        repairPage(page);

        const title =
          getPageTitle(page);

        if (!title) return;

        const button =
          findExistingBack(title);

        if (!button) return;

        button.style.display =
          current === page
            ? "flex"
            : "none";
      });
    } catch (e) {
      console.warn(
        "HISAB Back repair:",
        e
      );
    }

    repairing = false;
  }

  /*
    Safe refresh.
    DOM change ke turant andar repairAll()
    nahi chalega.
  */
  function scheduleRepair(delay) {
    clearTimeout(repairTimer);

    repairTimer = setTimeout(function () {
      repairAll();
    }, delay || 0);
  }

  /*
    show() ke baad Back button update.
  */
  const originalShow = window.show;

  if (
    typeof originalShow === "function" &&
    !window.__hisabFinalBackShowFix
  ) {
    window.__hisabFinalBackShowFix = true;

    window.show = function () {
      const result =
        originalShow.apply(
          this,
          arguments
        );

      scheduleRepair(0);

      return result;
    };
  }

  /*
    Android hardware Back.
  */
  function handleAndroidBack() {
    const page = getCurrentPage();

    const id = page ? page.id : "";

    if (
      id === "home" ||
      id === "welcome" ||
      id === ""
    ) {
      return;
    }

    if (typeof window.goBack === "function") {
      window.goBack();
    }
  }

  /*
    Capacitor Android Back listener.
  */
  function connectAndroidBack() {
    try {
      const App =
        window.Capacitor &&
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.App;

      if (
        App &&
        typeof App.addListener === "function" &&
        !window.__hisabFinalAndroidBackFix
      ) {
        window.__hisabFinalAndroidBackFix = true;

        App.addListener(
          "backButton",
          handleAndroidBack
        );
      }
    } catch (e) {
      console.warn(
        "HISAB Android Back:",
        e
      );
    }
  }

  /*
    Browser/device history.
  */
  window.addEventListener(
    "popstate",
    handleAndroidBack
  );

  /*
    Start.
  */
  function startRepair() {
    repairAll();
    connectAndroidBack();

    setTimeout(function () {
      repairAll();
    }, 150);

    setTimeout(function () {
      repairAll();
    }, 400);

    setTimeout(function () {
      repairAll();
    }, 800);
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startRepair,
      { once: true }
    );
  } else {
    startRepair();
  }

  /*
    SAFE DOM observer
    -----------------
    Continuous repair loop nahi banega.
    Sirf changes ke baad ek delayed repair.
  */
  if (document.body) {
    const observer =
      new MutationObserver(function () {
        scheduleRepair(120);
      });

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }

})();
