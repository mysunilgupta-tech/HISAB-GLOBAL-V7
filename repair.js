/* HISAB V7 — repair.js
   Navigation + Business Contact Picker + compatibility
*/
(function () {
  "use strict";

  /* =========================
     MODE
  ========================= */

  const oldShow = window.show;

  if (typeof oldShow === "function") {
    window.show = function (id) {
      if (id === "personal") D.mode = "personal";
      if (id === "business") D.mode = "business";

      save();
      return oldShow(id);
    };
  }

  /* =========================
     BACK
  ========================= */

  window.back = function () {
    if (typeof window.goBack === "function") {
      return window.goBack();
    }

    if (typeof window.show === "function") {
      return window.show("home");
    }
  };

  window.closeKhataForm = function () {
    if (typeof window.goBack === "function") {
      return window.goBack();
    }

    return window.show("home");
  };

  window.closeKhataDetail = function () {
    if (typeof window.goBack === "function") {
      return window.goBack();
    }

    return window.show("home");
  };

  /* =========================
     ANDROID HARDWARE BACK
  ========================= */

  document.addEventListener("backbutton", function () {
    window.back();
  });

  window.addEventListener("popstate", function () {
    window.back();
  });

  /* Capacitor App plugin, if available */
  document.addEventListener("DOMContentLoaded", function () {
    try {
      const Cap = window.Capacitor;

      if (
        Cap &&
        typeof Cap.Plugins === "object" &&
        Cap.Plugins.App &&
        typeof Cap.Plugins.App.addListener === "function"
      ) {
        Cap.Plugins.App.addListener(
          "backButton",
          function () {
            window.back();
          }
        );
      }
    } catch (e) {
      console.log("Hardware Back listener unavailable");
    }
  });

  /* =========================
     KHATA FORM
  ========================= */

  const oldKhataForm = window.openKhataForm;

  if (typeof oldKhataForm === "function") {
    window.openKhataForm = function (mode, person, phone) {

      if (mode === "business") {
        D.businessEntryRole =
          D.businessFilter || "customer";
      }

      return oldKhataForm(mode, person, phone);
    };
  }

  /* =========================
     PERSONAL FILTER
  ========================= */

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

  /* =========================
     BUSINESS FILTER
  ========================= */

  const oldBusinessFilter =
    window.businessFilter;

  if (typeof oldBusinessFilter === "function") {
    window.businessFilter = function (type, btn) {

      D.businessFilter =
        type || "customer";

      D.businessEntryRole =
        type === "supplier"
          ? "supplier"
          : "customer";

      save();

      return oldBusinessFilter(
        type,
        btn
      );
    };
  }

  /* =========================
     NATIVE BUSINESS CONTACT PICKER
  ========================= */

  window.selectBusinessContact =
    async function () {

      try {

        /*
          Capacitor native plugin
        */
        const Cap = window.Capacitor;

        if (
          Cap &&
          Cap.Plugins &&
          Cap.Plugins.Contacts
        ) {

          const Contacts =
            Cap.Plugins.Contacts;

          let result;

          /*
            First try native picker.
          */
          if (
            typeof Contacts.pickContacts ===
            "function"
          ) {
            result =
              await Contacts.pickContacts({
                multiple: false
              });
          }
          else if (
            typeof Contacts.pickContact ===
            "function"
          ) {
            result =
              await Contacts.pickContact();
          }

          const contact =
            result &&
            result.contacts &&
            result.contacts[0]
              ? result.contacts[0]
              : result &&
                result.contact
                ? result.contact
                : null;

          if (contact) {

            const name =
              contact.displayName ||
              (
                Array.isArray(contact.name)
                  ? contact.name[0]
                  : contact.name
              ) ||
              "";

            let phone = "";

            if (
              Array.isArray(
                contact.phoneNumbers
              )
            ) {
              phone =
                contact.phoneNumbers[0]
                  ?.value || "";
            }

            if (
              !phone &&
              Array.isArray(contact.tel)
            ) {
              phone =
                contact.tel[0] || "";
            }

            if ($("businessPersonName")) {
              $("businessPersonName").value =
                name;
            }

            if ($("businessPersonPhone")) {
              $("businessPersonPhone").value =
                phone;
            }

            return true;
          }
        }

        /*
          Web Contacts API fallback
        */
        if (
          navigator.contacts &&
          navigator.contacts.select
        ) {

          const contacts =
            await navigator.contacts.select(
              ["name", "tel"],
              {
                multiple: false
              }
            );

          const c =
            contacts && contacts[0];

          if (c) {

            if ($("businessPersonName")) {
              $("businessPersonName").value =
                Array.isArray(c.name)
                  ? c.name[0] || ""
                  : c.name || "";
            }

            if ($("businessPersonPhone")) {
              $("businessPersonPhone").value =
                Array.isArray(c.tel)
                  ? c.tel[0] || ""
                  : "";
            }

            return true;
          }
        }

      } catch (e) {

        console.log(
          "Business contact picker error",
          e
        );

      }

      alert(
        "Contact picker available nahi hai. " +
        "Name aur Mobile manually enter karein."
      );

      return false;
    };

  /* =========================
     TEXT SHARE
  ========================= */

  window.shareText =
    async function (text, title) {

      try {

        if (navigator.share) {

          await navigator.share({
            title:
              title || "HISAB",
            text:
              text || ""
          });

          return true;
        }

      } catch (e) {}

      if (
        typeof copyText === "function"
      ) {
        copyText(text || "");
        return true;
      }

      return false;
    };

  /* =========================
     SAFE DATE DEFAULTS
  ========================= */

  function setDate(id) {

    const el =
      document.getElementById(id);

    if (
      el &&
      !el.value
    ) {
      el.value =
        new Date()
          .toISOString()
          .slice(0, 10);
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      setDate("khataDate");
      setDate("transactionDate");
      setDate("billDue");
      setDate("cardDue");
      setDate("goalDate");
      setDate("reminderDate");

      console.log(
        "HISAB V7 repair.js loaded"
      );
    }
  );

})();
