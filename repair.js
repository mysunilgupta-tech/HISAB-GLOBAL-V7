/* =========================================================
   HISAB V7 — SAFE REPAIR
   Compatible with current index.html + app.js
   ========================================================= */

(function () {
  "use strict";

  window.HISAB_REPAIR = {
    home: function () {
      if (typeof window.show === "function") {
        window.show("home");
      }
    },

    back: function () {
      if (typeof window.show === "function") {
        window.show("home");
      }
    }
  };

})();
