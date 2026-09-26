/* HISAB V7 — repair.js */

(function () {
  "use strict";

  /* ---------- SAFE HELPERS ---------- */

  const $ = id => document.getElementById(id);

  /* ---------- ORIGINAL SHOW KO SAFE RAKHO ---------- */

  const originalShow = window.show;

  window.show = function (id) {
    try {
      if (id === "personal" && window.D) D.mode = "personal";
      if (id === "business" && window.D) D.mode = "business";

      if (typeof window.save === "function") {
        window.save();
      }
    } catch (e) {}

    return typeof originalShow === "function"
      ? originalShow(id)
      : undefined;
  };


  /* ---------- BUSINESS CONTACT ---------- */

  function fillBusinessContact(contact) {
    if (!contact) return;

    let name = "";
    let phone = "";

    if (Array.isArray(contact.name)) {
      name = contact.name[0] || "";
    } else {
      name = contact.name || "";
    }

    if (Array.isArray(contact.phones)) {
      phone =
        contact.phones[0]?.number ||
        contact.phones[0]?.value ||
        "";
    }

    if (!phone && Array.isArray(contact.tel)) {
      phone = contact.tel[0] || "";
    }

    if ($("businessPersonName")) {
      $("businessPersonName").value = name;
    }

    if ($("businessPersonPhone")) {
      $("businessPersonPhone").value = phone;
    }
  }


  /* ---------- NATIVE CONTACT PICKER ---------- */

  window.selectBusinessContact = async function () {

    try {

      if (!window.Capacitor) {
        throw new Error("Capacitor not available");
      }

      const Contacts =
        window.Capacitor.registerPlugin("Contacts");

      /* Native picker */
      if (Contacts && typeof Contacts.pickContact === "function") {

        const result =
          await Contacts.pickContact();

        const contact =
          result?.contact ||
          result;

        if (contact) {
          fillBusinessContact(contact);
          return;
        }
      }

      /* Some plugin versions may expose pickContacts */
      if (Contacts && typeof Contacts.pickContacts === "function") {

        const result =
          await Contacts.pickContacts({
            multiple: false
          });

        const contact =
          result?.contacts?.[0] ||
          result?.[0];

        if (contact) {
          fillBusinessContact(contact);
          return;
        }
      }

      throw new Error("Picker unavailable");

    } catch (nativeError) {

      /* Browser Contacts API fallback */

      try {

        if (
          navigator.contacts &&
          typeof navigator.contacts.select === "function"
        ) {

          const contacts =
            await navigator.contacts.select(
              ["name", "tel"],
              { multiple: false }
            );

          if (contacts?.[0]) {
            fillBusinessContact(contacts[0]);
            return;
          }
        }

      } catch (browserError) {}

      alert(
        "Phone contact picker available nahi hai.\n\n" +
        "Name aur Mobile number manually enter karein."
      );
    }
  };


  /* ---------- CONTACT BUTTON ---------- */

  function connectContactButton() {

    const btn = $("selectBusinessContact");

    if (!btn) return;

    btn.onclick = window.selectBusinessContact;
  }


  /* ---------- OBSERVE DYNAMIC BUSINESS FORM ---------- */

  const observer =
    new MutationObserver(function () {
      connectContactButton();
    });

  function startObserver() {

    if (!document.body) {
      setTimeout(startObserver, 300);
      return;
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    connectContactButton();
  }


  /* ---------- BACK BUTTON ---------- */

  window.back = function () {

    if (typeof window.goBack === "function") {
      window.goBack();
    } else if (typeof window.show === "function") {
      window.show("home");
    }
  };


  /* ---------- START ---------- */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startObserver
    );
  } else {
    startObserver();
  }

})();
