/* HISAB V7 — repair.js */

(function () {
  "use strict";

  const _show = window.show;

  window.show = function (id) {
    if (id === "personal") D.mode = "personal";
    if (id === "business") D.mode = "business";
    save();
    return _show(id);
  };

  const _khata = window.openKhataForm;

  window.openKhataForm = function (mode, person, phone) {
    if (mode === "business") {
      D.businessEntryRole = D.businessFilter || "customer";
    }
    return _khata(mode, person, phone);
  };

  const _filter = window.filterKhata;

  window.filterKhata = function (mode, type, btn) {
    if (type === undefined) {
      type = mode;
      mode = "personal";
    }

    D.filter = type || "all";
    save();

    return _filter(mode, type, btn);
  };

  window.shareText = async function (text, title) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "HISAB",
          text: text || ""
        });
        return;
      }
    } catch (e) {}

    if (typeof copyText === "function") {
      copyText(text || "");
    }
  };

  console.log("HISAB repair.js loaded");

})();
