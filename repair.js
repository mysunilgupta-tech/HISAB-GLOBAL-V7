/* HISAB V7 — repair.js
   Navigation + compatibility/wiring patch
*/
(function () {
  "use strict";

  /* ---------- MODE ---------- */
  const oldShow = window.show;

  if (typeof oldShow === "function") {
    window.show = function (id) {
      if (id === "personal") D.mode = "personal";
      if (id === "business") D.mode = "business";

      save();
      return oldShow(id);
    };
  }

  /* ---------- UNIVERSAL BACK ---------- */
  window.back = function () {
    if (typeof window.goBack === "function") {
      return window.goBack();
    }

    if (typeof window.show === "function") {
      return window.show("home");
    }
  };

  /* ---------- CLOSE KHATA FORM ---------- */
  const oldCloseKhataForm = window.closeKhataForm;

  window.closeKhataForm = function () {
    if (typeof oldCloseKhataForm === "function") {
      return oldCloseKhataForm();
    }

    return window.back();
  };

  /* ---------- CLOSE KHATA DETAIL ---------- */
  const oldCloseKhataDetail = window.closeKhataDetail;

  window.closeKhataDetail = function () {
    if (typeof oldCloseKhataDetail === "function") {
      return oldCloseKhataDetail();
    }

    return window.back();
  };

  /* ---------- KHATA FORM ---------- */
  const oldKhataForm = window.openKhataForm;

  if (typeof oldKhataForm === "function") {
    window.openKhataForm = function (mode, person, phone) {
      if (mode === "business") {
        D.businessEntryRole = D.businessFilter || "customer";
      }

      return oldKhataForm(mode, person, phone);
    };
  }

  /* ---------- PERSONAL KHATA FILTER ---------- */
  const oldFilter = window.filterKhata;

  if (typeof oldFilter === "function") {
    window.filterKhata = function (mode, type, btn) {
      if (typeof type !== "string") {
        btn = type;
        type = mode;
        mode = "personal";
      }

      D.filter = type || "all";
      save();

      return oldFilter(mode, type, btn);
    };
  }

  /* ---------- BUSINESS FILTER ---------- */
  const oldBusinessFilter = window.businessFilter;

  if (typeof oldBusinessFilter === "function") {
    window.businessFilter = function (type, btn) {
      D.businessFilter = type || "customer";
      D.businessEntryRole =
        type === "supplier" ? "supplier" : "customer";

      save();

      return oldBusinessFilter(type, btn);
    };
  }

  /* ---------- TEXT SHARE ---------- */
  window.shareText = async function (text, title) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "HISAB",
          text: text || ""
        });
        return true;
      }
    } catch (e) {}

    if (typeof copyText === "function") {
      copyText(text || "");
      return true;
    }

    return false;
  };

  /* ---------- SAFE DATE DEFAULTS ---------- */
  function setDate(id) {
    const el = document.getElementById(id);

    if (el && !el.value) {
      el.value = new Date().toISOString().slice(0, 10);
    }
  }

  /* ---------- ANDROID / BROWSER BACK ---------- */
  window.addEventListener("popstate", function () {
    window.back();
  });

  document.addEventListener("DOMContentLoaded", function () {
    setDate("khataDate");
    setDate("transactionDate");
    setDate("billDue");
    setDate("cardDue");
    setDate("goalDate");
    setDate("reminderDate");
  });

  console.log("HISAB V7 repair.js loaded");
})();
