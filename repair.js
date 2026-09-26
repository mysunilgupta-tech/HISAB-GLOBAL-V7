/* =========================================================
   HISAB V7 — repair.js
   Navigation + Android Back + Business Contacts
   ========================================================= */

(function () {
  "use strict";

  /* =========================
     SAFE HELPERS
  ========================= */

  const $id = (id) =>
    document.getElementById(id);

  /* =========================
     SHOW / MODE
  ========================= */

  const oldShow = window.show;

  if (typeof oldShow === "function") {
    window.show = function (id) {

      if (id === "personal") {
        D.mode = "personal";
      }

      if (id === "business") {
        D.mode = "business";
      }

      if (typeof save === "function") {
        save();
      }

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
    return window.back();
  };

  window.closeKhataDetail = function () {
    return window.back();
  };

  /* Browser / WebView back */
  window.addEventListener(
    "popstate",
    function () {
      window.back();
    }
  );

  /* =========================
     CAPACITOR ANDROID BACK
  ========================= */

  function setupAndroidBack() {

    try {

      const Cap = window.Capacitor;

      if (
        !Cap ||
        !Cap.Plugins ||
        !Cap.Plugins.App ||
        typeof Cap.Plugins.App.addListener !==
          "function"
      ) {
        return;
      }

      Cap.Plugins.App.addListener(
        "backButton",
        function () {
          window.back();
        }
      );

      console.log(
        "HISAB: Android Back connected"
      );

    } catch (e) {

      console.log(
        "HISAB: Android Back unavailable",
        e
      );
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    setupAndroidBack
  );

  /* =========================
     KHATA FORM
  ========================= */

  const oldKhataForm =
    window.openKhataForm;

  if (typeof oldKhataForm === "function") {

    window.openKhataForm =
      function (mode, person, phone) {

        if (mode === "business") {

          D.businessEntryRole =
            D.businessFilter === "supplier"
              ? "supplier"
              : "customer";
        }

        return oldKhataForm(
          mode,
          person,
          phone
        );
      };
  }

  /* =========================
     PERSONAL FILTER
  ========================= */

  const oldFilter =
    window.filterKhata;

  if (typeof oldFilter === "function") {

    window.filterKhata =
      function (mode, type, btn) {

        if (typeof type !== "string") {
          btn = type;
          type = mode;
          mode = "personal";
        }

        D.filter =
          type || "all";

        if (typeof save === "function") {
          save();
        }

        return oldFilter(
          mode,
          type,
          btn
        );
      };
  }

  /* =========================
     BUSINESS FILTER
  ========================= */

  const oldBusinessFilter =
    window.businessFilter;

  if (
    typeof oldBusinessFilter ===
    "function"
  ) {

    window.businessFilter =
      function (type, btn) {

        D.businessFilter =
          type || "customer";

        D.businessEntryRole =
          type === "supplier"
            ? "supplier"
            : "customer";

        if (typeof save === "function") {
          save();
        }

        return oldBusinessFilter(
          type,
          btn
        );
      };
  }

  /* =========================
     CONTACT DATA
  ========================= */

  function fillBusinessContact(
    contact
  ) {

    if (!contact) {
      return false;
    }

    let name = "";
    let phone = "";

    /* Name */
    if (
      typeof contact.displayName ===
      "string"
    ) {
      name =
        contact.displayName;
    }

    if (
      !name &&
      typeof contact.name ===
      "string"
    ) {
      name =
        contact.name;
    }

    if (
      !name &&
      Array.isArray(contact.name)
    ) {
      name =
        contact.name[0] || "";
    }

    /* Phone */
    if (
      Array.isArray(
        contact.phoneNumbers
      )
    ) {

      const p =
        contact.phoneNumbers[0];

      if (typeof p === "string") {
        phone = p;
      }
      else if (p && typeof p.value === "string") {
        phone = p.value;
      }
    }

    if (
      !phone &&
      Array.isArray(contact.phones)
    ) {

      const p =
        contact.phones[0];

      if (typeof p === "string") {
        phone = p;
      }
      else if (p && typeof p.number === "string") {
        phone = p.number;
      }
    }

    if (
      !phone &&
      Array.isArray(contact.tel)
    ) {
      phone =
        contact.tel[0] || "";
    }

    const nameEl =
      $id("businessPersonName");

    const phoneEl =
      $id("businessPersonPhone");

    if (nameEl) {
      nameEl.value =
        String(name || "").trim();
    }

    if (phoneEl) {
      phoneEl.value =
        String(phone || "").trim();
    }

    return !!(
      name ||
      phone
    );
  }

  /* =========================
     NATIVE CONTACT PICKER
  ========================= */

  window.selectBusinessContact =
    async function () {

      let nativeTried =
        false;

      try {

        const Cap =
          window.Capacitor;

        const Contacts =
          Cap &&
          Cap.Plugins &&
          Cap.Plugins.Contacts;

        if (Contacts) {

          nativeTried = true;

          /*
            Community Contacts plugin
            may expose getContacts rather
            than a browser-style picker.
          */

          if (
            typeof Contacts.pickContact ===
            "function"
          ) {

            const result =
              await Contacts.pickContact();

            const contact =
              result?.contact ||
              result;

            if (
              fillBusinessContact(
                contact
              )
            ) {
              return true;
            }
          }

          if (
            typeof Contacts.pickContacts ===
            "function"
          ) {

            const result =
              await Contacts.pickContacts({
                multiple: false
              });

            const contact =
              result?.contacts?.[0] ||
              result?.[0];

            if (
              fillBusinessContact(
                contact
              )
            ) {
              return true;
            }
          }

          /*
            If picker methods are not exposed,
            try getting contacts and use first
            contact as a safe compatibility path.
          */

          if (
            typeof Contacts.getContacts ===
            "function"
          ) {

            const result =
              await Contacts.getContacts();

            const contacts =
              result?.contacts ||
              result;

            if (
              Array.isArray(contacts) &&
              contacts.length
            ) {

              /*
                Use first returned contact only
                when the plugin has no native
                picker method.
              */

              if (
                fillBusinessContact(
                  contacts[0]
                )
              ) {
                return true;
              }
            }
          }
        }

      } catch (e) {

        console.log(
          "HISAB native Contacts error:",
          e
        );
      }

      /* =========================
         WEB CONTACTS FALLBACK
      ========================= */

      try {

        if (
          navigator.contacts &&
          typeof navigator.contacts.select ===
            "function"
        ) {

          const result =
            await navigator.contacts.select(
              ["name", "tel"],
              {
                multiple: false
              }
            );

          const contact =
            result?.[0];

          if (
            fillBusinessContact(
              contact
            )
          ) {
            return true;
          }
        }

      } catch (e) {

        console.log(
          "HISAB web Contacts error:",
          e
        );
      }

      /* =========================
         FINAL MESSAGE
      ========================= */

      if (nativeTried) {

        alert(
          "Phone contacts permission/picker " +
          "available nahi hai. Android permission " +
          "allow karke dobara try karein."
        );

      } else {

        alert(
          "Contacts plugin app mein available " +
          "nahi mila. Latest APK build/install karein."
        );
      }

      return false;
    };

  /* =========================
     SHARE
  ========================= */

  window.shareText =
    async function (
      text,
      title
    ) {

      try {

        if (
          navigator.share
        ) {

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
        typeof copyText ===
        "function"
      ) {

        copyText(
          text || ""
        );

        return true;
      }

      return false;
    };

  /* =========================
     DEFAULT DATES
  ========================= */

  function setDate(id) {

    const el =
      $id(id);

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
