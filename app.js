/* =========================================================
   HISAB V7 — FINAL STABLE SINGLE CONTROLLER
   index.html compatible
   NO repair.js required
   ========================================================= */

(function () {
  "use strict";

  var KEY = "hisab_v7_data";
  var GUEST_KEY = "hisab_v7_guest";

  var D = {
    mode: "personal",
    currency: "₹",
    language: "hi",

    transactions: [],
    khata: [],

    business: [],
    sales: [],
    purchases: [],

    goals: [],
    savings: [],
    bills: [],
    loans: [],
    reminders: [],
    family: [],
    tools: [],

    budget: {
      personal: 0,
      business: 0
    },

    pin: "",
    pinHash: "",

    ui: {
      page: "home",
      khataEditId: null,
      businessFilter: "customer",
      khataFilter: "all",
      detailPerson: "",
      detailFilter: "all"
    }
  };

  /* =========================================================
     BASIC
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function uid(prefix) {
    return (prefix || "id") + "_" +
      Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function money(v) {
    return D.currency + " " + num(v).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeDate(v) {
    return v || today();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(D));
    } catch (e) {
      console.error("HISAB save:", e);
    }
  }

  function normalize() {
    var arrays = [
      "transactions",
      "khata",
      "business",
      "sales",
      "purchases",
      "goals",
      "savings",
      "bills",
      "loans",
      "reminders",
      "family",
      "tools"
    ];

    arrays.forEach(function (x) {
      if (!Array.isArray(D[x])) D[x] = [];
    });

    /* Preserve old budget value during migration */
    if (typeof D.budget === "number") {
      D.budget = {
        personal: D.budget,
        business: 0
      };
    }

    if (!D.budget || typeof D.budget !== "object") {
      D.budget = {
        personal: 0,
        business: 0
      };
    }

    if (D.budget.personal == null) D.budget.personal = 0;
    if (D.budget.business == null) D.budget.business = 0;

    if (!D.ui || typeof D.ui !== "object") {
      D.ui = {
        page: "home",
        khataEditId: null,
        businessFilter: "customer",
        khataFilter: "all",
        detailPerson: "",
        detailFilter: "all"
      };
    }

    if (!D.mode) D.mode = "personal";
    if (!D.currency) D.currency = "₹";
    if (!D.language) D.language = "hi";

    /*
      Old Business Sale/Purchase records were missing mode.
      They belong to Business.
    */
    D.sales.forEach(function (x) {
      if (!x.mode) x.mode = "business";
      if (!Array.isArray(x.history)) x.history = [];
      if (x.paid == null) x.paid = 0;
      if (!x.status) x.status = "pending";
    });

    D.purchases.forEach(function (x) {
      if (!x.mode) x.mode = "business";
      if (!Array.isArray(x.history)) x.history = [];
      if (x.paid == null) x.paid = 0;
      if (!x.status) x.status = "pending";
    });

    D.bills.forEach(function (x) {
      if (!Array.isArray(x.history)) x.history = [];
      if (!x.status) x.status = "pending";
    });

    D.loans.forEach(function (x) {
      if (!Array.isArray(x.history)) x.history = [];
      if (x.paid == null) x.paid = 0;
      if (!x.status) x.status = "pending";
    });
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(KEY);

      if (raw) {
        var parsed = JSON.parse(raw);

        if (parsed && typeof parsed === "object") {
          Object.keys(parsed).forEach(function (k) {
            D[k] = parsed[k];
          });
        }
      }
    } catch (e) {
      console.error("HISAB load:", e);
    }

    normalize();
    save();
  }

  /* =========================================================
     LANGUAGE
     ========================================================= */

  var HI = {
    "Transactions": "लेन-देन",
    "Reports": "रिपोर्ट",
    "Settings": "सेटिंग्स",
    "Planning": "योजना",
    "Reminders": "रिमाइंडर",
    "Privacy": "सुरक्षा",
    "Family": "परिवार",
    "Customer": "ग्राहक",
    "Supplier": "सप्लायर",
    "Sale": "बिक्री",
    "Purchase": "खरीद",
    "Income": "आय",
    "Expense": "खर्च",
    "Budget": "बजट",
    "Goals": "लक्ष्य",
    "Bills": "बिल",
    "Loans": "लोन",
    "Give": "देना",
    "Receive": "लेना",
    "Save": "सेव",
    "Delete": "हटाएँ",
    "Edit": "संपादित करें",
    "View": "देखें",
    "Back": "वापस",
    "Paid": "भुगतान",
    "Pending": "बाकी",
    "Status": "स्थिति",
    "Date": "तारीख",
    "Amount": "राशि",
    "Note": "नोट",
    "Cash": "कैश"
  };

  function applyLanguage() {
    document.documentElement.lang =
      D.language === "hi" ? "hi" : "en";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");

      if (D.language === "hi" && HI[key]) {
        el.textContent = HI[key];
      } else {
        el.textContent = key;
      }
    });
  }

  function L(en) {
    if (D.language === "hi" && HI[en]) return HI[en];
    return en;
  }

  function toggleLanguage() {
    D.language = D.language === "hi" ? "en" : "hi";
    save();
    applyLanguage();

    renderHome();
    renderPersonal();
    renderBusiness();
    renderTransactions();
    renderPlanning();
    renderCredit();
    renderReports();
    renderReminders();
  }

  function toggleCurrency() {
    var list = ["₹", "$", "€", "£"];
    var i = list.indexOf(D.currency);

    if (i < 0) i = 0;

    D.currency = list[(i + 1) % list.length];
    save();

    renderHome();
    renderPersonal();
    renderBusiness();
    renderTransactions();
    renderPlanning();
    renderCredit();
    renderReports();
  }

  /* =========================================================
     GUEST / PIN
     ========================================================= */

  async function hashPin(pin) {
    try {
      if (
        window.crypto &&
        crypto.subtle &&
        window.TextEncoder
      ) {
        var data = new TextEncoder().encode(pin);
        var hash = await crypto.subtle.digest("SHA-256", data);

        return Array.from(new Uint8Array(hash))
          .map(function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("");
      }
    } catch (e) {}

    /*
      Fallback only when Web Crypto is unavailable.
      This is a local PIN gate, not full database encryption.
    */
    var h = 2166136261;

    for (var i = 0; i < pin.length; i++) {
      h ^= pin.charCodeAt(i);
      h +=
        (h << 1) +
        (h << 4) +
        (h << 7) +
        (h << 8) +
        (h << 24);
    }

    return String(h >>> 0);
  }

  function initGate() {
    var gate = $("guestGate");
    var shell = $("appShell");

    var entered =
      localStorage.getItem(GUEST_KEY) === "1";

    if (entered) {
      if (gate) gate.style.display = "none";
      if (shell) shell.style.display = "";
    } else {
      if (gate) gate.style.display = "";
      if (shell) shell.style.display = "none";
    }
  }

  async function enterGuestMode() {
    /*
      If PIN exists, verify it before opening.
    */
    if (D.pinHash || D.pin) {
      var enteredPin = prompt("Enter HISAB PIN:");

      if (enteredPin === null) return;

      var valid = false;

      if (D.pinHash) {
        valid =
          (await hashPin(enteredPin)) === D.pinHash;
      } else {
        valid = enteredPin === D.pin;

        if (valid) {
          D.pinHash = await hashPin(enteredPin);
          D.pin = "";
          save();
        }
      }

      if (!valid) {
        alert("Wrong PIN.");
        return;
      }
    }

    localStorage.setItem(GUEST_KEY, "1");

    var gate = $("guestGate");
    var shell = $("appShell");

    if (gate) gate.style.display = "none";
    if (shell) shell.style.display = "";

    show("home");
  }

  async function setPin() {
    var input = $("pinInput");
    var pin = input ? input.value.trim() : "";

    if (!/^\d{4,8}$/.test(pin)) {
      alert("PIN 4 se 8 digit ka hona chahiye.");
      return;
    }

    D.pinHash = await hashPin(pin);
    D.pin = "";

    save();

    if (input) input.value = "";

    alert("PIN saved.");
  }

  function lockApp() {
    localStorage.removeItem(GUEST_KEY);

    var gate = $("guestGate");
    var shell = $("appShell");

    if (shell) shell.style.display = "none";
    if (gate) gate.style.display = "";

    alert("App locked.");
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  var pages = [
    "home",
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
    "ads",
    "familytools",
    "tools13",
    "final"
  ];

  function removeBackButtons() {
    document.querySelectorAll(".hisab-auto-back")
      .forEach(function (el) {
        el.remove();
      });
  }

  function addBackButton(page) {
    if (
      page === "home" ||
      page === "khataEntry" ||
      page === "khataDetail"
    ) {
      return;
    }

    var root = $(page);
    if (!root) return;

    var title = root.querySelector(".page-title");
    if (!title) return;

    if (title.querySelector(".hisab-auto-back")) return;

    var btn = document.createElement("button");

    btn.className = "hisab-auto-back";
    btn.type = "button";
    btn.textContent = "← " + L("Back");

    btn.style.marginRight = "8px";
    btn.style.padding = "8px 12px";
    btn.style.borderRadius = "10px";
    btn.style.border = "0";
    btn.style.cursor = "pointer";

    btn.onclick = function () {
      show("home");
    };

    title.prepend(btn);
  }

  function show(page) {
    if (!page || pages.indexOf(page) === -1) {
      page = "home";
    }

    pages.forEach(function (p) {
      var el = $(p);

      if (el) {
        el.style.display =
          p === page ? "" : "none";
      }
    });

    D.ui.page = page;

    removeBackButtons();
    addBackButton(page);

    if (page === "home") renderHome();
    if (page === "personal") renderPersonal();
    if (page === "business") renderBusiness();
    if (page === "transactions") renderTransactions();
    if (page === "planning") renderPlanning();
    if (page === "credit") renderCredit();
    if (page === "reports") renderReports();
    if (page === "reminders") renderReminders();
    if (page === "privacy") renderPrivacy();
    if (page === "family") renderFamily();
    if (page === "tools13") renderTools();
    if (page === "final") renderFinal();

    window.scrollTo(0, 0);
  }

  /* =========================================================
     MODE / HOME
     ========================================================= */

  function setMode(mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    save();

    if (D.mode === "business") {
      show("business");
    } else {
      show("personal");
    }
  }

  function renderHome() {
    var income = 0;
    var expense = 0;
    var give = 0;
    var receive = 0;

    D.transactions.forEach(function (t) {
      if (t.mode !== D.mode) return;

      if (t.type === "income") {
        income += num(t.amount);
      }

      if (t.type === "expense") {
        expense += num(t.amount);
      }
    });

    D.khata.forEach(function (k) {
      if (k.mode !== D.mode) return;

      if (k.type === "give") {
        give += num(k.amount);
      }

      if (k.type === "receive") {
        receive += num(k.amount);
      }
    });

    var balance =
      income - expense + receive - give;

    if ($("modeLabel")) {
      $("modeLabel").textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }

    if ($("receivable")) {
      $("receivable").textContent =
        money(receive);
    }

    if ($("payable")) {
      $("payable").textContent =
        money(give);
    }

    if ($("homeBalance")) {
      $("homeBalance").textContent =
        money(balance);
    }
  }

  /* =========================================================
     KHATA
     ========================================================= */

  function openKhataForm(mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.khataEditId = null;

    if ($("khataPerson")) $("khataPerson").value = "";
    if ($("khataType")) $("khataType").value = "give";
    if ($("khataAmount")) $("khataAmount").value = "";
    if ($("khataDate")) $("khataDate").value = today();
    if ($("khataMethod")) $("khataMethod").value = "Cash";
    if ($("khataStatus")) $("khataStatus").value = "pending";
    if ($("khataNote")) $("khataNote").value = "";

    show("khataEntry");
  }

  function closeKhataForm() {
    D.ui.khataEditId = null;

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function saveKhataEntry() {
    var name =
      $("khataPerson")
        ? $("khataPerson").value.trim()
        : "";

    var amount =
      $("khataAmount")
        ? num($("khataAmount").value)
        : 0;

    if (!name) {
      alert("Person / Customer name enter karein.");
      return;
    }

    if (amount <= 0) {
      alert("Valid amount enter karein.");
      return;
    }

    var item = {
      id:
        D.ui.khataEditId ||
        uid("khata"),

      mode: D.mode,

      person: name,

      type:
        $("khataType")
          ? $("khataType").value
          : "give",

      amount: amount,

      date:
        $("khataDate")
          ? safeDate($("khataDate").value)
          : today(),

      method:
        $("khataMethod")
          ? $("khataMethod").value
          : "Cash",

      status:
        $("khataStatus")
          ? $("khataStatus").value
          : "pending",

      note:
        $("khataNote")
          ? $("khataNote").value.trim()
          : ""
    };

    if (D.ui.khataEditId) {
      D.khata = D.khata.map(function (x) {
        return x.id === D.ui.khataEditId
          ? item
          : x;
      });
    } else {
      D.khata.push(item);
    }

    D.ui.khataEditId = null;

    save();

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function getKhata(mode) {
    return D.khata.filter(function (k) {
      return k.mode === mode;
    });
  }

  function renderPersonal() {
    renderKhata("personal");
  }

  function renderKhata(mode) {
    var list =
      mode === "business"
        ? $("businessList")
        : $("personalList");

    if (!list) return;

    var data = getKhata(mode);

    var filter =
      D.ui.khataFilter || "all";

    if (filter !== "all") {
      data = data.filter(function (k) {
        return k.type === filter;
      });
    }

    var root =
      mode === "business"
        ? $("business")
        : $("personal");

    var input =
      root
        ? root.querySelector(
            'input[type="search"],input[placeholder*="Search"]'
          )
        : null;

    var q =
      input
        ? input.value.trim().toLowerCase()
        : "";

    if (q) {
      data = data.filter(function (k) {
        return (
          String(k.person || "")
            .toLowerCase()
            .includes(q) ||
          String(k.note || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    data.sort(function (a, b) {
      return String(b.date)
        .localeCompare(String(a.date));
    });

    var give = 0;
    var receive = 0;

    getKhata(mode).forEach(function (k) {
      if (k.type === "give") {
        give += num(k.amount);
      }

      if (k.type === "receive") {
        receive += num(k.amount);
      }
    });

    var givenId =
      mode === "personal"
        ? "ledgerGiven"
        : "businessGiven";

    var receivedId =
      mode === "personal"
        ? "ledgerReceived"
        : "businessReceived";

    var netId =
      mode === "personal"
        ? "ledgerNet"
        : "businessNet";

    if ($(givenId)) {
      $(givenId).textContent =
        money(give);
    }

    if ($(receivedId)) {
      $(receivedId).textContent =
        money(receive);
    }

    if ($(netId)) {
      $(netId).textContent =
        money(give - receive);
    }

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No entries yet.</div>';
      return;
    }

    list.innerHTML = data.map(function (k) {
      var isGive = k.type === "give";

      return (
        '<div class="hisab-entry-card">' +

        '<div>' +
        '<strong>' +
        esc(k.person) +
        '</strong>' +

        '<div style="font-size:12px;opacity:.7;">' +
        esc(k.date) +
        ' • ' +
        esc(k.method || "Cash") +
        '</div>' +

        (k.note
          ? '<div style="font-size:13px;margin-top:4px;">' +
            esc(k.note) +
            '</div>'
          : "") +

        '</div>' +

        '<div style="text-align:right;">' +

        '<strong style="color:' +
        (isGive ? "#d93025" : "#168a45") +
        ';">' +

        (isGive ? "Give " : "Receive ") +
        money(k.amount) +

        '</strong>' +

        '<div style="font-size:12px;">' +
        esc(k.status || "pending") +
        '</div>' +

                '<div style="margin-top:6px;">' +

        '<button type="button" onclick="openKhataDetail(\'' +
        esc(k.person).replace(/'/g, "\\'") +
        "','" +
        mode +
        '\')">View</button> ' +

        '<button type="button" onclick="editKhata(\'' +
        esc(k.id) +
        '\')">Edit</button> ' +

        '<button type="button" onclick="deleteKhata(\'' +
        esc(k.id) +
        '\')">Delete</button>' +

        '</div>' +

        '</div>' +
        '</div>'
      );
    }).join("");
  }

  function searchKhata(mode) {
    renderKhata(mode);
  }
  function filterKhata(mode, filter) {
    D.ui.khataFilter =
      filter || "all";

    renderKhata(mode);
  }

  function editKhata(id) {
    var item = D.khata.find(function (k) {
      return k.id === id;
    });

    if (!item) return;

    D.mode = item.mode;
    D.ui.khataEditId = id;

    if ($("khataPerson"))
      $("khataPerson").value =
        item.person || "";

    if ($("khataType"))
      $("khataType").value =
        item.type || "give";

    if ($("khataAmount"))
      $("khataAmount").value =
        item.amount || "";

    if ($("khataDate"))
      $("khataDate").value =
        item.date || today();

    if ($("khataMethod"))
      $("khataMethod").value =
        item.method || "Cash";

    if ($("khataStatus"))
      $("khataStatus").value =
        item.status || "pending";

    if ($("khataNote"))
      $("khataNote").value =
        item.note || "";

    show("khataEntry");
  }

  function deleteKhata(id) {
    if (!confirm("Is entry ko delete karein?")) {
      return;
    }

    D.khata = D.khata.filter(function (k) {
      return k.id !== id;
    });

    save();

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  /* =========================================================
     KHATA DETAIL / SHARE / PDF
     ========================================================= */

  function openKhataDetail(person, mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.detailPerson = person;
    D.ui.detailFilter = "all";

    if ($("detailPersonName")) {
      $("detailPersonName").textContent =
        person;
    }

    show("khataDetail");
  }

  function renderKhataDetail() {
    var person = D.ui.detailPerson;

    var entries = D.khata.filter(function (k) {
      return (
        k.mode === D.mode &&
        k.person === person
      );
    });

    var give = 0;
    var receive = 0;

    entries.forEach(function (k) {
      if (k.type === "give")
        give += num(k.amount);

      if (k.type === "receive")
        receive += num(k.amount);
    });

    if ($("detailGive"))
      $("detailGive").textContent =
        money(give);

    if ($("detailReceive"))
      $("detailReceive").textContent =
        money(receive);

    if ($("detailBalance"))
      $("detailBalance").textContent =
        money(give - receive);

    var list = $("khataHistory");
    if (!list) return;

    if (D.ui.detailFilter !== "all") {
      entries = entries.filter(function (k) {
        return k.type === D.ui.detailFilter;
      });
    }

    entries.sort(function (a, b) {
      return String(b.date)
        .localeCompare(String(a.date));
    });

    if (!entries.length) {
      list.innerHTML =
        '<div class="empty-state">No history.</div>';
      return;
    }

    list.innerHTML = entries.map(function (k) {
      var giveType =
        k.type === "give";

      return (
        '<div class="hisab-history-row">' +

        '<strong>' +
        esc(k.date) +
        '</strong> ' +

        '<span style="color:' +
        (giveType ? "#d93025" : "#168a45") +
        ';">' +

        (giveType ? "Give " : "Receive ") +
        money(k.amount) +

        '</span> • ' +

        esc(k.method || "Cash") +
        ' • ' +
        esc(k.status || "pending") +

        (k.note
          ? "<br>" + esc(k.note)
          : "") +

        '</div>'
      );
    }).join("");
  }

  function detailFilter(filter) {
    D.ui.detailFilter =
      filter || "all";

    renderKhataDetail();
  }

  function closeKhataDetail() {
    D.ui.detailPerson = "";

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function openPaymentEntry() {
    openKhataForm(D.mode);

    if (
      D.ui.detailPerson &&
      $("khataPerson")
    ) {
      $("khataPerson").value =
        D.ui.detailPerson;
    }

    if ($("khataType")) {
      $("khataType").value =
        "receive";
    }
  }

  function makeKhataText() {
    var person =
      D.ui.detailPerson || "Khata";

    var entries = D.khata.filter(function (k) {
      return (
        k.mode === D.mode &&
        k.person === person
      );
    });

    var give = 0;
    var receive = 0;

    entries.forEach(function (k) {
      if (k.type === "give")
        give += num(k.amount);

      if (k.type === "receive")
        receive += num(k.amount);
    });

    var text =
      "HISAB - " + person + "\n\n" +

      "Total Give: " +
      money(give) + "\n" +

      "Total Receive: " +
      money(receive) + "\n" +

      "Balance: " +
      money(give - receive) +
      "\n\n";

    entries.forEach(function (k) {
      text +=
        k.date +
        " | " +
        (k.type === "give"
          ? "Give"
          : "Receive") +
        " | " +
        money(k.amount) +
        " | " +
        (k.method || "Cash") +
        " | " +
        (k.status || "pending") +
        (k.note
          ? " | " + k.note
          : "") +
        "\n";
    });

    return text;
  }

  function shareKhata() {
    var text = makeKhataText();
    var person =
      D.ui.detailPerson || "Khata";

    if (navigator.share) {
      navigator.share({
        title: "HISAB - " + person,
        text: text
      }).catch(function () {});
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          alert("Khata details copied.");
        });
      return;
    }

    alert(text);
  }

  function exportKhataPDF() {
    var person =
      D.ui.detailPerson || "Khata";

    var entries = D.khata.filter(function (k) {
      return (
        k.mode === D.mode &&
        k.person === person
      );
    });

    var give = 0;
    var receive = 0;

    entries.forEach(function (k) {
      if (k.type === "give")
        give += num(k.amount);

      if (k.type === "receive")
        receive += num(k.amount);
    });

    var w = window.open("", "_blank");

    if (!w) {
      alert("Popup blocked.");
      return;
    }

    var html =
      "<html><head>" +
      "<title>HISAB - " +
      esc(person) +
      "</title>" +

      "<style>" +
      "body{font-family:Arial;padding:20px;color:#111}" +
      "h2{margin-bottom:4px}" +
      ".summary{margin:15px 0;padding:12px;border:1px solid #ddd;border-radius:10px}" +
      "table{width:100%;border-collapse:collapse}" +
      "th,td{border:1px solid #ccc;padding:8px;text-align:left}" +
      "@media print{button{display:none}}" +
      "</style>" +

      "</head><body>" +

      "<h2>HISAB - " +
      esc(person) +
      "</h2>" +

      "<div class='summary'>" +
      "<b>Total Give:</b> " +
      esc(money(give)) +
      "<br><b>Total Receive:</b> " +
      esc(money(receive)) +
      "<br><b>Balance:</b> " +
      esc(money(give - receive)) +
      "</div>" +

      "<table>" +
      "<tr><th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Status</th><th>Note</th></tr>" +

      entries.map(function (k) {
        return (
          "<tr>" +
          "<td>" + esc(k.date) + "</td>" +
          "<td>" + esc(k.type) + "</td>" +
          "<td>" + esc(money(k.amount)) + "</td>" +
          "<td>" + esc(k.method || "") + "</td>" +
          "<td>" + esc(k.status || "") + "</td>" +
          "<td>" + esc(k.note || "") + "</td>" +
          "</tr>"
        );
      }).join("") +

      "</table>" +

      "</body></html>";

    w.document.open();
    w.document.write(html);
    w.document.close();

    setTimeout(function () {
      w.print();
    }, 400);
  }

  /* =========================================================
     BUSINESS
     ========================================================= */

  function businessFilter(filter) {
    D.ui.businessFilter =
      filter || "customer";

    renderBusiness();
  }

  function addBusinessCustomer() {
    addBusinessMaster("customer");
  }

  function addBusinessSupplier() {
    addBusinessMaster("supplier");
  }

  function addBusinessMaster(type) {
    var name = prompt(
      type === "customer"
        ? "Customer name:"
        : "Supplier name:"
    );

    if (!name || !name.trim()) return;

    var phone =
      prompt("Phone (optional):") || "";

    D.business.push({
      id: uid("business"),
      type: type,
      name: name.trim(),
      phone: phone.trim(),
      date: today(),
      mode: "business"
    });

    save();
    renderBusiness();
  }

  function deleteBusinessMaster(id) {
    if (!confirm("Record delete karein?")) {
      return;
    }

    D.business = D.business.filter(function (b) {
      return b.id !== id;
    });

    save();
    renderBusiness();
  }

  function addBusinessSales() {
    addBusinessEntry("sale");
  }

  function addBusinessPurchase() {
    addBusinessEntry("purchase");
  }

  function addBusinessEntry(type) {
    var name = prompt(
      type === "sale"
        ? "Customer name:"
        : "Supplier name:"
    );

    if (!name || !name.trim()) return;

    var amount =
      num(prompt("Amount:"));

    if (amount <= 0) {
      alert("Valid amount enter karein.");
      return;
    }

    var date =
      prompt(
        "Date (YYYY-MM-DD):",
        today()
      ) || today();

    var note =
      prompt("Note (optional):") || "";

    var method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    var item = {
      id: uid(type),
      mode: "business",
      date: safeDate(date),
      amount: amount,
      note: note.trim(),
      method: method.trim(),
      paid: 0,
      status: "pending",
      history: []
    };

    if (type === "sale") {
      item.customer = name.trim();
      D.sales.push(item);
      D.ui.businessFilter = "sales";
    } else {
      item.supplier = name.trim();
      D.purchases.push(item);
      D.ui.businessFilter = "purchase";
    }

    save();
    renderBusiness();
  }

  function getBusinessSales() {
    return D.sales.filter(function (x) {
      return !x.mode || x.mode === "business";
    });
  }

  function getBusinessPurchases() {
    return D.purchases.filter(function (x) {
      return !x.mode || x.mode === "business";
    });
  }

  function editBusinessEntry(type, id) {
    var arr =
      type === "sale"
        ? D.sales
        : D.purchases;

    var item = arr.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    var oldName =
      type === "sale"
        ? item.customer
        : item.supplier;

    var name =
      prompt(
        type === "sale"
          ? "Customer name:"
          : "Supplier name:",
        oldName || ""
      );

    if (!name || !name.trim()) return;

    var amount =
      num(
        prompt(
          "Amount:",
          String(item.amount || "")
        )
      );

    if (amount <= 0) return;

    var date =
      prompt(
        "Date:",
        item.date || today()
      ) || item.date;

    var note =
      prompt(
        "Note:",
        item.note || ""
      ) || "";

    item.mode = "business";
    item.amount = amount;
    item.date = safeDate(date);
    item.note = note.trim();

    if (type === "sale") {
      item.customer = name.trim();
    } else {
      item.supplier = name.trim();
    }

    save();
    renderBusiness();
  }

  function deleteBusinessEntry(type, id) {
    if (!confirm("Entry delete karein?")) {
      return;
    }

    if (type === "sale") {
      D.sales = D.sales.filter(function (x) {
        return x.id !== id;
      });
    } else {
      D.purchases = D.purchases.filter(function (x) {
        return x.id !== id;
      });
    }

    save();
    renderBusiness();
  }

  function payBusinessEntry(type, id) {
    var arr =
      type === "sale"
        ? D.sales
        : D.purchases;

    var item = arr.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    var total = num(item.amount);
    var paid = num(item.paid);
    var remaining = Math.max(
      0,
      total - paid
    );

    if (remaining <= 0) {
      item.status = "paid";
      save();
      renderBusiness();
      return;
    }

    var amount =
      num(
        prompt(
          "Payment amount:",
          String(remaining)
        )
      );

    if (amount <= 0) return;

    if (amount > remaining) {
      amount = remaining;
    }

    var method =
      prompt(
        "Payment method:",
        item.method || "Cash"
      ) || "Cash";

    item.paid = paid + amount;

    if (!Array.isArray(item.history)) {
      item.history = [];
    }

    item.history.push({
      id: uid("bizpay"),
      date: today(),
      amount: amount,
      method: method
    });

    if (item.paid >= total) {
      item.paid = total;
      item.status = "paid";
    } else {
      item.status = "partial";
    }

    save();
    renderBusiness();
  }

  function businessHistory(type, id) {
    var arr =
      type === "sale"
        ? D.sales
        : D.purchases;

    var item = arr.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    var history =
      Array.isArray(item.history)
        ? item.history
        : [];

    if (!history.length) {
      alert("No payment history.");
      return;
    }

    var text =
      (type === "sale"
        ? "Sale"
        : "Purchase") +
      " History\n\n";

    history.forEach(function (h) {
      text +=
        h.date +
        " | " +
        money(h.amount) +
        " | " +
        (h.method || "Cash") +
        "\n";
    });

    alert(text);
  }

  function renderBusiness() {
    var list = $("businessList");
    if (!list) return;

    var tab =
      D.ui.businessFilter ||
      "customer";

    var khata =
      getKhata("business");

    var master =
      D.business.filter(function (b) {
        return b.type === tab;
      });

    var sales =
      getBusinessSales();

    var purchases =
      getBusinessPurchases();

    var give = 0;
    var receive = 0;

    khata.forEach(function (k) {
      if (k.type === "give")
        give += num(k.amount);

      if (k.type === "receive")
        receive += num(k.amount);
    });

    if ($("businessGiven"))
      $("businessGiven").textContent =
        money(give);

    if ($("businessReceived"))
      $("businessReceived").textContent =
        money(receive);

    if ($("businessNet"))
      $("businessNet").textContent =
        money(give - receive);

    var html =
      '<div class="business-actions" ' +
      'style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +

      '<button type="button" onclick="addBusinessCustomer()">+ Customer</button>' +
      '<button type="button" onclick="addBusinessSupplier()">+ Supplier</button>' +
      '<button type="button" onclick="addBusinessSales()">+ Sale</button>' +
      '<button type="button" onclick="addBusinessPurchase()">+ Purchase</button>' +

      '</div>';

    /* CUSTOMER / SUPPLIER */

    if (
      tab === "customer" ||
      tab === "supplier"
    ) {
      if (!master.length) {
        html +=
          '<div class="empty-state">No ' +
          esc(tab) +
          " records.</div>";
      } else {
        html += master.map(function (b) {
          return (
            '<div class="hisab-entry-card">' +

            '<div>' +
            '<strong>' +
            esc(b.name) +
            '</strong>' +

            '<div>' +
            esc(b.phone || "") +
            '</div>' +

            '</div>' +

            '<div>' +
            '<button type="button" onclick="deleteBusinessMaster(\'' +
            esc(b.id) +
            "')\">Delete</button>" +
            '</div>' +

            '</div>'
          );
        }).join("");
      }

      if (khata.length) {
        html +=
          '<h4 style="margin-top:18px;">Business Udhaar</h4>';

        html += khata
          .slice()
          .sort(function (a, b) {
            return String(b.date)
              .localeCompare(String(a.date));
          })
          .map(function (k) {
            return (
              '<div class="hisab-entry-card">' +

              '<div>' +
              '<strong>' +
              esc(k.person) +
              '</strong>' +

              '<div>' +
              esc(k.date) +
              '</div>' +

              '</div>' +

              '<div style="text-align:right;color:' +
              (k.type === "give"
                ? "#d93025"
                : "#168a45") +
              ';">' +

              (k.type === "give"
                ? "Give "
                : "Receive ") +

              money(k.amount) +

              '</div>' +

              '</div>'
            );
          })
          .join("");
      }
    }

    /* SALES */

    if (tab === "sales") {
      if (!sales.length) {
        html +=
          '<div class="empty-state">No sales yet.</div>';
      } else {
        html += sales
          .slice()
          .sort(function (a, b) {
            return String(b.date)
              .localeCompare(String(a.date));
          })
          .map(function (s) {
            var remaining =
              Math.max(
                0,
                num(s.amount) -
                num(s.paid)
              );

            return (
              '<div class="hisab-entry-card">' +

              '<div>' +

              '<strong>' +
              esc(s.customer || "Customer") +
              '</strong>' +

              '<div>' +
              esc(s.date) +
              (s.note
                ? " • " + esc(s.note)
                : "") +
              '</div>' +

              '<div style="font-size:12px;margin-top:4px;">' +
              'Total: ' +
              money(s.amount) +
              ' • Paid: ' +
              money(s.paid) +
              ' • Remaining: ' +
              money(remaining) +
              '</div>' +

              '<div style="font-size:12px;">' +
              'Status: ' +
              esc(s.status || "pending") +
              '</div>' +

              '</div>' +

              '<div style="text-align:right;">' +

              '<strong style="color:#168a45;">' +
              money(s.amount) +
              '</strong>' +

              '<div style="margin-top:6px;">' +

              (remaining > 0
                ? '<button type="button" onclick="payBusinessEntry(\'sale\',\'' +
                  esc(s.id) +
                  "')\">Pay</button> "
                : "") +

              '<button type="button" onclick="editBusinessEntry(\'sale\',\'' +
              esc(s.id) +
              "')\">Edit</button> " +

              '<button type="button" onclick="businessHistory(\'sale\',\'' +
              esc(s.id) +
              "')\">History</button> " +

              '<button type="button" onclick="deleteBusinessEntry(\'sale\',\'' +
              esc(s.id) +
              "')\">Delete</button>' +

              '</div>' +

              '</div>' +

              '</div>'
            );
          })
          .join("");
      }
    }

    /* PURCHASE */

    if (tab === "purchase") {
      if (!purchases.length) {
        html +=
          '<div class="empty-state">No purchases yet.</div>';
      } else {
        html += purchases
          .slice()
          .sort(function (a, b) {
            return String(b.date)
              .localeCompare(String(a.date));
          })
          .map(function (p) {
            var remaining =
              Math.max(
                0,
                num(p.amount) -
                num(p.paid)
              );

            return (
              '<div class="hisab-entry-card">' +

              '<div>' +

              '<strong>' +
              esc(p.supplier || "Supplier") +
              '</strong>' +

              '<div>' +
              esc(p.date) +
              (p.note
                ? " • " + esc(p.note)
                : "") +
              '</div>' +

              '<div style="font-size:12px;margin-top:4px;">' +
              'Total: ' +
              money(p.amount) +
              ' • Paid: ' +
              money(p.paid) +
              ' • Remaining: ' +
              money(remaining) +
              '</div>' +

              '<div style="font-size:12px;">' +
              'Status: ' +
              esc(p.status || "pending") +
              '</div>' +

              '</div>' +

              '<div style="text-align:right;">' +

              '<strong style="color:#d93025;">' +
              money(p.amount) +
              '</strong>' +

              '<div style="margin-top:6px;">' +

              (remaining > 0
                ? '<button type="button" onclick="payBusinessEntry(\'purchase\',\'' +
                  esc(p.id) +
                  "')\">Pay</button> "
                : "") +

              '<button type="button" onclick="editBusinessEntry(\'purchase\',\'' +
              esc(p.id) +
              "')\">Edit</button> " +

              '<button type="button" onclick="businessHistory(\'purchase\',\'' +
              esc(p.id) +
              "')\">History</button> " +

              '<button type="button" onclick="deleteBusinessEntry(\'purchase\',\'' +
              esc(p.id) +
              "')\">Delete</button>' +

              '</div>' +

              '</div>' +

              '</div>'
            );
          })
          .join("");
      }
    }

    list.innerHTML = html;
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction() {
    var amount =
      $("transactionAmount")
        ? num($("transactionAmount").value)
        : 0;

    if (amount <= 0) {
      alert("Valid amount enter karein.");
      return;
    }

    D.transactions.push({
      id: uid("txn"),
      mode: D.mode,

      type:
        $("transactionType")
          ? $("transactionType").value
          : "expense",

      amount: amount,

      category:
        $("transactionCategory")
          ? $("transactionCategory").value.trim()
          : "",

      note:
        $("transactionNote")
          ? $("transactionNote").value.trim()
          : "",

      date:
        $("transactionDate")
          ? safeDate($("transactionDate").value)
          : today()
    });

    if ($("transactionAmount"))
      $("transactionAmount").value = "";

    if ($("transactionCategory"))
      $("transactionCategory").value = "";

    if ($("transactionNote"))
      $("transactionNote").value = "";

    if ($("transactionDate"))
      $("transactionDate").value = today();

    save();

    renderTransactions();
    renderHome();
  }

  function renderTransactions() {
    var list = $("transactionList");
    if (!list) return;

    var data =
      D.transactions
        .filter(function (t) {
          return t.mode === D.mode;
        })
        .slice()
        .sort(function (a, b) {
          return String(b.date)
            .localeCompare(String(a.date));
        });

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No transactions yet.</div>';
      return;
    }

    list.innerHTML =
      data.map(function (t) {
        var income =
          t.type === "income";

        return (
          '<div class="hisab-entry-card">' +

          '<div>' +
          '<strong>' +
          esc(
            t.category ||
            (income
              ? "Income"
              : "Expense")
          ) +
          '</strong>' +

          '<div>' +
          esc(t.date) +
          (t.note
            ? " • " + esc(t.note)
            : "") +
          '</div>' +

          '</div>' +

          '<strong style="color:' +
          (income
            ? "#168a45"
            : "#d93025") +
          ';">' +

          (income ? "+" : "-") +
          money(t.amount) +

          '</strong>' +

          '</div>'
        );
      }).join("");
  }

  /* =========================================================
     BUDGET / GOALS
     ========================================================= */

  function calcBudget() {
    var amount =
      $("budgetAmount")
        ? num($("budgetAmount").value)
        : 0;

    if (amount < 0) amount = 0;

    D.budget[D.mode] = amount;

    save();
    renderPlanning();
  }

  function calcGoal() {
    var name =
      $("goalName")
        ? $("goalName").value.trim()
        : "";

    var target =
      $("goalTarget")
        ? num($("goalTarget").value)
        : 0;

    var saved =
      $("goalSaved")
        ? num($("goalSaved").value)
        : 0;

    if (!name || target <= 0) {
      alert("Goal name aur target amount enter karein.");
      return;
    }

    D.goals.push({
      id: uid("goal"),
      mode: D.mode,
      name: name,
      target: target,
      saved: saved,
      date:
        $("goalDate")
          ? safeDate($("goalDate").value)
          : today()
    });

    if ($("goalName"))
      $("goalName").value = "";

    if ($("goalTarget"))
      $("goalTarget").value = "";

    if ($("goalSaved"))
      $("goalSaved").value = "";

    if ($("goalDate"))
      $("goalDate").value = "";

    save();
    renderPlanning();
  }

  function renderPlanning() {
    var page = $("planning");
    if (!page) return;

    var budget =
      num(D.budget[D.mode]);

    var spent =
      D.transactions
        .filter(function (t) {
          return (
            t.mode === D.mode &&
            t.type === "expense"
          );
        })
        .reduce(function (sum, t) {
          return sum + num(t.amount);
        }, 0);

    var remaining =
      budget - spent;

    var percent =
      budget > 0
        ? (spent / budget) * 100
        : 0;

    var displayPercent =
      Math.min(100, Math.max(0, percent));

    var old =
      page.querySelector(
        ".hisab-budget-info"
      );

    if (old) old.remove();

    var info =
      document.createElement("div");

    info.className =
      "hisab-budget-info";

    info.style.marginBottom =
      "15px";

    info.innerHTML =
      "<strong>Budget:</strong> " +
      money(budget) +

      "<br><strong>Spent:</strong> " +
      money(spent) +

      "<br><strong>Remaining:</strong> " +
      money(remaining) +

      "<br><strong>Progress:</strong> " +
      displayPercent.toFixed(1) +
      "%" +

      (budget > 0 && spent > budget
        ? '<div style="margin-top:6px;color:#d93025;font-weight:bold;">Budget exceeded by ' +
          money(spent - budget) +
          "</div>"
        : "");

    page.prepend(info);

    var goalList = $("goalList");
    if (!goalList) return;

    var goals =
      D.goals.filter(function (g) {
        return g.mode === D.mode;
      });

    if (!goals.length) {
      goalList.innerHTML =
        '<div class="empty-state">No goals yet.</div>';
      return;
    }

    goalList.innerHTML =
      goals.map(function (g) {
        var p =
          num(g.target) > 0
            ? Math.min(
                100,
                (num(g.saved) /
                  num(g.target)) *
                  100
              )
            : 0;

        return (
          '<div class="hisab-entry-card">' +

          '<div>' +
          '<strong>' +
          esc(g.name) +
          '</strong>' +

          '<div>' +
          money(g.saved) +
          " / " +
          money(g.target) +
          '</div>' +

          '</div>' +

          '<strong>' +
          p.toFixed(0) +
          "%" +
          '</strong>' +

          '</div>'
        );
      }).join("");
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function addBill(type) {
    var name = "";
    var amount = 0;
    var due = "";

    if (type === "Bill") {
      name =
        $("billName")
          ? $("billName").value.trim()
          : "";

      amount =
        $("billAmount")
          ? num($("billAmount").value)
          : 0;

      due =
        $("billDue")
          ? safeDate($("billDue").value)
          : today();
    }

    if (type === "Credit Card") {
      name = "Credit Card";

      amount =
        $("cardBill")
          ? num($("cardBill").value)
          : 0;

      due =
        $("cardDue")
          ? safeDate($("cardDue").value)
          : today();
    }

    if (!name) {
      name =
        prompt("Bill name:");
    }

    if (!name) return;

    if (amount <= 0) {
      amount =
        num(prompt("Amount:"));
    }

    if (amount <= 0) {
      alert("Valid amount enter karein.");
      return;
    }

    D.bills.push({
      id: uid("bill"),
      mode: D.mode,
      type: type || "Bill",
      name: name.trim(),
      amount: amount,
      due: due || today(),
      status: "pending",
      history: []
    });

    save();

    if ($("billName"))
      $("billName").value = "";

    if ($("billAmount"))
      $("billAmount").value = "";

    if ($("cardBill"))
      $("cardBill").value = "";

    renderCredit();
  }

  function payBill(id) {
    var bill =
      D.bills.find(function (b) {
        return b.id === id;
      });

    if (!bill) return;

    var amount =
      num(
        prompt(
          "Payment amount:",
          String(
            Math.max(
              0,
              num(bill.amount) -
              num(bill.paid)
            )
          )
        )
      );

    if (amount <= 0) return;

    var remaining =
      Math.max(
        0,
        num(bill.amount) -
        num(bill.paid)
      );

    if (amount > remaining)
      amount = remaining;

    bill.paid =
      num(bill.paid) + amount;

    if (!Array.isArray(bill.history)) {
      bill.history = [];
    }

    bill.history.push({
      id: uid("billpay"),
      date: today(),
      amount: amount,
      method:
        prompt(
          "Payment method:",
          "Cash"
        ) || "Cash"
    });

    bill.status =
      bill.paid >= num(bill.amount)
        ? "paid"
        : "partial";

    save();
    renderCredit();
  }

  function billHistory(id) {
    var bill =
      D.bills.find(function (b) {
        return b.id === id;
      });

    if (!bill) return;

    var history =
      Array.isArray(bill.history)
        ? bill.history
        : [];

    if (!history.length) {
      alert("No payment history.");
      return;
    }

    var text =
      bill.name +
      " Payment History\n\n";

    history.forEach(function (h) {
      text +=
        h.date +
        " | " +
        money(h.amount) +
        " | " +
        (h.method || "Cash") +
        "\n";
    });

    alert(text);
  }

  /* =========================================================
     LOAN / EMI
     ========================================================= */

  function calcEMI() {
    var principal =
      $("emiPrincipal")
        ? num($("emiPrincipal").value)
        : 0;

    var rate =
      $("emiRate")
        ? num($("emiRate").value)
        : 0;

    var months =
      $("emiMonths")
        ? num($("emiMonths").value)
        : 0;

    if (
      principal <= 0 ||
      months <= 0
    ) {
      alert(
        "Principal aur months enter karein."
      );
      return;
    }

    var r =
      rate / 12 / 100;

    var emi;

    if (r === 0) {
      emi = principal / months;
    } else {
      emi =
        (principal * r *
          Math.pow(1 + r, months)) /
        (Math.pow(1 + r, months) - 1);
    }

    if ($("emiResult")) {
      $("emiResult").textContent =
        "Monthly EMI: " +
        money(emi);
    }

    if (
      !confirm(
        "Is EMI ko Loan record mein save karna hai?"
      )
    ) {
      return;
    }

    var loanName =
      prompt(
        "Loan / Bank name:",
        "Loan"
      ) || "Loan";

    var dueDate =
      prompt(
        "First due date (YYYY-MM-DD):",
        today()
      ) || today();

    D.loans.push({
      id: uid("loan"),
      mode: D.mode,
      name: loanName.trim(),
      principal: principal,
      rate: rate,
      months: months,
      emi: emi,
      due: safeDate(dueDate),
      status: "pending",
      paid: 0,
      history: []
    });

    save();
    renderCredit();
  }

  function payLoan(id) {
    var loan =
      D.loans.find(function (l) {
        return l.id === id;
      });

    if (!loan) return;

    var remaining =
      Math.max(
        0,
        num(loan.principal) -
        num(loan.paid)
      );

    if (remaining <= 0) {
      loan.status = "paid";
      save();
      renderCredit();
      return;
    }

    var amount =
      num(
        prompt(
          "Payment amount:",
          String(
            Math.min(
              num(loan.emi) || remaining,
              remaining
            )
          )
        )
      );

    if (amount <= 0) return;

    if (amount > remaining)
      amount = remaining;

    var method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    loan.paid =
      num(loan.paid) + amount;

    if (!Array.isArray(loan.history)) {
      loan.history = [];
    }

    loan.history.push({
      id: uid("loanpay"),
      date: today(),
      amount: amount,
      method: method
    });

    loan.status =
      loan.paid >= num(loan.principal)
        ? "paid"
        : "pending";

    save();
    renderCredit();
  }

  function loanHistory(id) {
    var loan =
      D.loans.find(function (l) {
        return l.id === id;
      });

    if (!loan) return;

    var history =
      Array.isArray(loan.history)
        ? loan.history
        : [];

    if (!history.length) {
      alert("No payment history.");
      return;
    }

    var text =
      loan.name +
      " Loan Payment History\n\n";

    history.forEach(function (h) {
      text +=
        h.date +
        " | " +
        money(h.amount) +
        " | " +
        (h.method || "Cash") +
        "\n";
    });

    alert(text);
  }

  function toggleLoanStatus(id) {
    var loan =
      D.loans.find(function (l) {
        return l.id === id;
      });

    if (!loan) return;

    if (loan.status === "paid") {
      loan.status = "pending";
    } else {
      loan.status = "paid";
    }

    save();
    renderCredit();
  }

  function deleteLoan(id) {
    if (!confirm("Loan delete karein?")) {
      return;
    }

    D.loans =
      D.loans.filter(function (l) {
        return l.id !== id;
      });

    save();
    renderCredit();
  }

  /* =========================================================
     CREDIT RENDER
     ========================================================= */

  function renderCredit() {
    var list = $("billList");
    if (!list) return;

    var bills =
      D.bills.filter(function (b) {
        return b.mode === D.mode;
      });

    var loans =
      D.loans.filter(function (l) {
        return l.mode === D.mode;
      });

    var html = "";

    /* BILLS */

    if (bills.length) {
      html += "<h4>Bills</h4>";

      html += bills.map(function (b) {
        var total = num(b.amount);
        var paid = num(b.paid);
        var remaining =
          Math.max(0, total - paid);

        return (
          '<div class="hisab-entry-card">' +

          '<div>' +

          '<strong>' +
          esc(b.name) +
          '</strong>' +

          '<div>' +
          esc(b.type) +
          " • Due " +
          esc(b.due) +
          '</div>' +

          '<div>' +
          "Total: " +
          money(total) +
          " • Paid: " +
          money(paid) +
          " • Remaining: " +
          money(remaining) +
          '</div>' +

          '<div>Status: ' +
          esc(b.status || "pending") +
          '</div>' +

          '</div>' +

          '<div>' +

          '<strong>' +
          money(total) +
          '</strong>' +

          (remaining > 0
            ? ' <button type="button" onclick="payBill(\'' +
              esc(b.id) +
              "')\">Paid</button>"
            : "") +

          ' <button type="button" onclick="billHistory(\'' +
          esc(b.id) +
          "')\">History</button>" +

          '</div>' +

          '</div>'
        );
      }).join("");
    }

    /* LOANS */

    if (loans.length) {
      html +=
        "<h4>Loans / EMI</h4>";

      html += loans.map(function (l) {
        var principal =
          num(l.principal);

        var paid =
          num(l.paid);

        var remaining =
          Math.max(
            0,
            principal - paid
          );

        return (
          '<div class="hisab-entry-card">' +

          '<div>' +

          '<strong>' +
          esc(l.name) +
          '</strong>' +

          '<div>' +
          "EMI " +
          money(l.emi) +
          " • Due " +
          esc(l.due) +
          '</div>' +

          '<div>' +
          "Principal: " +
          money(principal) +
          " • Paid: " +
          money(paid) +
          " • Remaining: " +
          money(remaining) +
          '</div>' +

          '<div>Status: ' +
          esc(l.status || "pending") +
          '</div>' +

          '</div>' +

          '<div>' +

          (remaining > 0
            ? '<button type="button" onclick="payLoan(\'' +
              esc(l.id) +
              "')\">Pay</button>"
            : "") +

          ' <button type="button" onclick="loanHistory(\'' +
          esc(l.id) +
          "')\">History</button>" +

          ' <button type="button" onclick="toggleLoanStatus(\'' +
          esc(l.id) +
          "')\">Status</button>" +

          ' <button type="button" onclick="deleteLoan(\'' +
          esc(l.id) +
          "')\">Delete</button>" +

          '</div>' +

          '</div>'
        );
      }).join("");
    }

    if (!html) {
      html =
        '<div class="empty-state">No bills or loans yet.</div>';
    }

    list.innerHTML = html;
  }

  /* =========================================================
     REPORTS / ANALYTICS
     ========================================================= */

  function renderReports() {
    var income = 0;
    var expense = 0;
    var give = 0;
    var receive = 0;

    D.transactions.forEach(function (t) {
      if (t.mode !== D.mode) return;

      if (t.type === "income")
        income += num(t.amount);

      if (t.type === "expense")
        expense += num(t.amount);
    });

    D.khata.forEach(function (k) {
      if (k.mode !== D.mode) return;

      if (k.type === "give")
        give += num(k.amount);

      if (k.type === "receive")
        receive += num(k.amount);
    });

    var sales = 0;
    var purchases = 0;
    var salePaid = 0;
    var purchasePaid = 0;

    if (D.mode === "business") {
      getBusinessSales().forEach(function (s) {
        sales += num(s.amount);
        salePaid += num(s.paid);
      });

      getBusinessPurchases().forEach(function (p) {
        purchases += num(p.amount);
        purchasePaid += num(p.paid);
      });
    }

    var balance =
      income -
      expense +
      receive -
      give;

    var budget =
      num(D.budget[D.mode]);

    var budgetSpent =
      D.transactions
        .filter(function (t) {
          return (
            t.mode === D.mode &&
            t.type === "expense"
          );
        })
        .reduce(function (s, t) {
          return s + num(t.amount);
        }, 0);

    var pendingBills =
      D.bills
        .filter(function (b) {
          return (
            b.mode === D.mode &&
            b.status !== "paid"
          );
        })
        .reduce(function (s, b) {
          return (
            s +
            Math.max(
              0,
              num(b.amount) -
              num(b.paid)
            )
          );
        }, 0);

    var pendingLoans =
      D.loans
        .filter(function (l) {
          return (
            l.mode === D.mode &&
            l.status !== "paid"
          );
        })
        .reduce(function (s, l) {
          return (
            s +
            Math.max(
              0,
              num(l.principal) -
              num(l.paid)
            )
          );
        }, 0);

    if ($("reportIncome"))
      $("reportIncome").textContent =
        money(income);

    if ($("reportExpense"))
      $("reportExpense").textContent =
        money(expense);

    if ($("reportGive"))
      $("reportGive").textContent =
        money(give);

    if ($("reportReceive"))
      $("reportReceive").textContent =
        money(receive);

    var content =
      $("reportContent");

    if (!content) return;

    var html =
      "<h3>HISAB Analytics</h3>" +

      "<p><strong>Mode:</strong> " +
      esc(D.mode) +
      "</p>" +

      "<p><strong>Income:</strong> " +
      money(income) +
      "</p>" +

      "<p><strong>Expense:</strong> " +
      money(expense) +
      "</p>" +

      "<p><strong>Net Cash:</strong> " +
      money(income - expense) +
      "</p>" +

      "<p><strong>Give:</strong> " +
      money(give) +
      "</p>" +

      "<p><strong>Receive:</strong> " +
      money(receive) +
      "</p>" +

      "<p><strong>Udhaar Balance:</strong> " +
      money(give - receive) +
      "</p>" +

      "<p><strong>Overall Balance:</strong> " +
      money(balance) +
      "</p>";

    if (budget > 0) {
      var bp =
        Math.min(
          100,
          Math.max(
            0,
            (budgetSpent /
              budget) *
              100
          )
        );

      html +=
        "<hr>" +
        "<p><strong>Budget:</strong> " +
        money(budget) +
        "</p>" +

        "<p><strong>Budget Spent:</strong> " +
        money(budgetSpent) +
        "</p>" +

        "<p><strong>Budget Remaining:</strong> " +
        money(
          budget - budgetSpent
        ) +
        "</p>" +

        "<p><strong>Budget Progress:</strong> " +
        bp.toFixed(1) +
        "%</p>" +

        '<div style="height:10px;background:#ddd;border-radius:10px;overflow:hidden;">' +
        '<div style="height:100%;width:' +
        bp +
        '%;background:#168a45;"></div>' +
        "</div>";
    }

    if (D.mode === "business") {
      html +=
        "<hr>" +

        "<p><strong>Sales:</strong> " +
        money(sales) +
        "</p>" +

        "<p><strong>Sales Paid:</strong> " +
        money(salePaid) +
        "</p>" +

        "<p><strong>Purchase:</strong> " +
        money(purchases) +
        "</p>" +

        "<p><strong>Purchase Paid:</strong> " +
        money(purchasePaid) +
        "</p>" +

        "<p><strong>Business Net:</strong> " +
        money(sales - purchases) +
        "</p>";
    }

    html +=
      "<hr>" +

      "<p><strong>Pending Bills:</strong> " +
      money(pendingBills) +
      "</p>" +

      "<p><strong>Pending Loans:</strong> " +
      money(pendingLoans) +
      "</p>" +

      "<p><strong>Transactions:</strong> " +
      D.transactions.filter(function (t) {
        return t.mode === D.mode;
      }).length +
      "</p>" +

      "<p><strong>Udhaar Entries:</strong> " +
      D.khata.filter(function (k) {
        return k.mode === D.mode;
      }).length +
      "</p>";

    content.innerHTML = html;
  }

  function makeSummaryText() {
    var income = 0;
    var expense = 0;
    var give = 0;
    var receive = 0;

    D.transactions.forEach(function (t) {
      if (t.mode !== D.mode) return;

      if (t.type === "income")
        income += num(t.amount);

      if (t.type === "expense")
        expense += num(t.amount);
    });

    D.khata.forEach(function (k) {
      if (k.mode !== D.mode) return;

      if (k.type === "give")
        give += num(k.amount);

      if (k.type === "receive")
        receive += num(k.amount);
    });

    var text =
      "HISAB SUMMARY\n\n" +

      "Mode: " +
      D.mode +
      "\n" +

      "Currency: " +
      D.currency +
      "\n\n" +

      "Income: " +
      money(income) +
      "\n" +

      "Expense: " +
      money(expense) +
      "\n" +

      "Give: " +
      money(give) +
      "\n" +

      "Receive: " +
      money(receive) +
      "\n" +

      "Balance: " +
      money(
        income -
        expense +
        receive -
        give
      ) +
      "\n";

    if (D.mode === "business") {
      var sales =
        getBusinessSales()
          .reduce(function (s, x) {
            return s + num(x.amount);
          }, 0);

      var purchases =
        getBusinessPurchases()
          .reduce(function (s, x) {
            return s + num(x.amount);
          }, 0);

      text +=
        "\nSales: " +
        money(sales) +

        "\nPurchase: " +
        money(purchases) +

        "\nBusiness Net: " +
        money(sales - purchases);
    }

    return text;
  }

  function exportSummary() {
    var text =
      makeSummaryText();

    if (navigator.share) {
      navigator.share({
        title: "HISAB Summary",
        text: text
      }).catch(function () {});
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          alert("Summary copied.");
        });
      return;
    }

    alert(text);
  }

  function exportSummaryPDF() {
    var w =
      window.open("", "_blank");

    if (!w) {
      alert("Popup blocked.");
      return;
    }

    var content =
      $("reportContent");

    w.document.open();

    w.document.write(
      "<html><head>" +

      "<title>HISAB Report</title>" +

      "<style>" +
      "body{font-family:Arial;padding:20px;color:#111}" +
      "h2{margin-bottom:15px}" +
      "p{padding:4px 0;border-bottom:1px solid #eee}" +
      "@media print{button{display:none}}" +
      "</style>" +

      "</head><body>" +

      "<h2>HISAB Report</h2>" +

      (content
        ? content.innerHTML
        : "") +

      "</body></html>"
    );

    w.document.close();

    setTimeout(function () {
      w.print();
    }, 400);
  }

  /* =========================================================
     REMINDERS
     ========================================================= */

  function addReminder() {
    var name =
      $("reminderName")
        ? $("reminderName").value.trim()
        : "";

    if (!name) {
      alert("Reminder name enter karein.");
      return;
    }

    D.reminders.push({
      id: uid("reminder"),
      name: name,
      date:
        $("reminderDate")
          ? safeDate(
              $("reminderDate").value
            )
          : today(),
      done: false
    });

    if ($("reminderName"))
      $("reminderName").value = "";

    if ($("reminderDate"))
      $("reminderDate").value = "";

    save();
    renderReminders();
  }

  function renderReminders() {
    var list =
      $("reminderList");

    if (!list) return;

    if (!D.reminders.length) {
      list.innerHTML =
        '<div class="empty-state">No reminders.</div>';
      return;
    }

    list.innerHTML =
      D.reminders
        .slice()
        .sort(function (a, b) {
          return String(a.date)
            .localeCompare(
              String(b.date)
            );
        })
        .map(function (r) {
          return (
            '<div class="hisab-entry-card">' +

            '<div>' +
            '<strong>' +
            esc(r.name) +
            '</strong>' +

            '<div>' +
            esc(r.date) +
            '</div>' +

            '</div>' +

            '<button type="button" onclick="deleteReminder(\'' +
            esc(r.id) +
            "')\">Delete</button>" +

            '</div>'
          );
        })
        .join("");
  }

  function deleteReminder(id) {
    D.reminders =
      D.reminders.filter(function (r) {
        return r.id !== id;
      });

    save();
    renderReminders();
  }

  /* =========================================================
     BACKUP
     ========================================================= */

  function exportBackup() {
    try {
      var data =
        JSON.stringify(
          D,
          null,
          2
        );

      var blob =
        new Blob(
          [data],
          {
            type:
              "application/json"
          }
        );

      var url =
        URL.createObjectURL(blob);

      var a =
        document.createElement("a");

      a.href = url;

      a.download =
        "HISAB-backup-" +
        today() +
        ".json";

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (e) {
      alert("Backup export failed.");
    }
  }

  function importBackup(event) {
    var file =
      event &&
      event.target &&
      event.target.files &&
      event.target.files[0];

    if (!file) return;

    var reader =
      new FileReader();

    reader.onload =
      function () {
        try {
          var imported =
            JSON.parse(
              reader.result
            );

          if (
            !imported ||
            typeof imported !==
              "object"
          ) {
            throw new Error(
              "Invalid"
            );
          }

          Object.keys(imported)
            .forEach(function (k) {
              D[k] = imported[k];
            });

          normalize();
          save();

          alert("Backup restored.");

          show("home");

        } catch (e) {
          alert("Invalid backup file.");
        }
      };

    reader.readAsText(file);
  }

  function renderPrivacy() {}

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamilyMember() {
    var name =
      $("familyName")
        ? $("familyName").value.trim()
        : "";

    if (!name) {
      alert(
        "Family member name enter karein."
      );
      return;
    }

    D.family.push({
      id: uid("family"),
      name: name
    });

    if ($("familyName"))
      $("familyName").value = "";

    save();
    renderFamily();
  }

  function renderFamily() {
    var list =
      $("familyList");

    if (!list) return;

    if (!D.family.length) {
      list.innerHTML =
        '<div class="empty-state">No family members.</div>';
      return;
    }

    list.innerHTML =
      D.family.map(function (f) {
        return (
          '<div class="hisab-entry-card">' +

          '<strong>' +
          esc(f.name) +
          '</strong>' +

          '<button type="button" onclick="deleteFamilyMember(\'' +
          esc(f.id) +
          "')\">Delete</button>" +

          '</div>'
        );
      }).join("");
  }

  function deleteFamilyMember(id) {
    D.family =
      D.family.filter(function (f) {
        return f.id !== id;
      });

    save();
    renderFamily();
  }

  /* =========================================================
     TOOLS
     ========================================================= */

  function calcFD() {
    var p =
      $("fdPrincipal")
        ? num($("fdPrincipal").value)
        : 0;

    var r =
      $("fdRate")
        ? num($("fdRate").value)
        : 0;

    var n =
      $("fdN")
        ? num($("fdN").value)
        : 0;

    if (p <= 0 || n <= 0) {
      alert(
        "FD amount aur period enter karein."
      );
      return;
    }

    var result =
      p *
      Math.pow(
        1 + r / 100,
        n
      );

    if ($("fdResult")) {
      $("fdResult").textContent =
        "Maturity: " +
        money(result);
    }
  }

  function addTool(name) {
    D.tools.push({
      id: uid("tool"),
      name: name,
      date: today()
    });

    save();

    alert(name + " added.");
  }

  function addInsurance() {
    addTool("Insurance");
  }

  function addSchool() {
    addTool("School");
  }

  function addVehicle() {
    addTool("Vehicle");
  }

  function addShopping() {
    addTool("Shopping");
  }

  function addUtility() {
    addTool("Utility");
  }

  function calcEmergency() {
    var amount =
      num(
        prompt(
          "Monthly expense:",
          "0"
        )
      );

    var months =
      num(
        prompt(
          "Emergency months:",
          "6"
        )
      );

    if (amount <= 0 || months <= 0)
      return;

    alert(
      "Emergency Fund Target: " +
      money(
        amount * months
      )
    );
  }

  function addDoc() {
    addTool("Document");
  }

  function addAnnual() {
    addTool("Annual Expense");
  }

  function renderTools() {}

  /* =========================================================
     SEARCH
     ========================================================= */

  function searchAllData(query) {
    var list =
      $("searchResults");

    if (!list) return;

    var q =
      String(query || "")
        .trim()
        .toLowerCase();

    if (!q) {
      list.innerHTML = "";
      return;
    }

    var results = [];

    function check(item, type, text) {
      if (
        JSON.stringify(item)
          .toLowerCase()
          .includes(q)
      ) {
        results.push({
          type: type,
          text: text
        });
      }
    }

    D.transactions.forEach(function (t) {
      check(
        t,
        "Transaction",
        (t.category ||
          "Transaction") +
        " - " +
        money(t.amount)
      );
    });

    D.khata.forEach(function (k) {
      check(
        k,
        "Udhaar",
        k.person +
        " - " +
        (k.type === "give"
          ? "Give "
          : "Receive ") +
        money(k.amount)
      );
    });

    D.business.forEach(function (b) {
      check(
        b,
        "Business",
        b.name
      );
    });

    D.sales.forEach(function (s) {
      check(
        s,
        "Sale",
        (s.customer || "Sale") +
        " - " +
        money(s.amount)
      );
    });

    D.purchases.forEach(function (p) {
      check(
        p,
        "Purchase",
        (p.supplier || "Purchase") +
        " - " +
        money(p.amount)
      );
    });

    D.bills.forEach(function (b) {
      check(
        b,
        "Bill",
        b.name +
        " - " +
        money(b.amount)
      );
    });

    D.loans.forEach(function (l) {
      check(
        l,
        "Loan",
        l.name +
        " - " +
        money(l.principal)
      );
    });

    D.goals.forEach(function (g) {
      check(
        g,
        "Goal",
        g.name +
        " - " +
        money(g.target)
      );
    });

    if (!results.length) {
      list.innerHTML =
        "No results.";
      return;
    }

    list.innerHTML =
      results
        .slice(0, 50)
        .map(function (r) {
          return (
            '<div class="hisab-entry-card">' +

            '<strong>' +
            esc(r.type) +
            '</strong>' +

            '<div>' +
            esc(r.text) +
            '</div>' +

            '</div>'
          );
        })
        .join("");
  }

  /* =========================================================
     QUICK ADD
     ========================================================= */

  function openQuickAdd() {
    var choice =
      prompt(
        "Quick Add:\n" +
        "1 = Income\n" +
        "2 = Expense\n" +
        "3 = Give\n" +
        "4 = Receive"
      );

    if (!choice) return;

    if (
      choice === "1" ||
      choice === "2"
    ) {
      show("transactions");

      if ($("transactionType")) {
        $("transactionType").value =
          choice === "1"
            ? "income"
            : "expense";
      }

      return;
    }

    if (
      choice === "3" ||
      choice === "4"
    ) {
      openKhataForm(D.mode);

      if ($("khataType")) {
        $("khataType").value =
          choice === "3"
            ? "give"
            : "receive";
      }
    }
  }

  /* =========================================================
     FINAL / SEARCH PAGE
     ========================================================= */

  function renderFinal() {
    var list =
      $("searchResults");

    if (list && !list.innerHTML.trim()) {
      list.innerHTML = "";
    }
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    try {
      loadData();
      initGate();

      if ($("transactionDate"))
        $("transactionDate").value =
          today();

      if ($("khataDate"))
        $("khataDate").value =
          today();

      if ($("reminderDate"))
        $("reminderDate").value =
          today();

      if ($("billDue"))
        $("billDue").value =
          today();

      if ($("cardDue"))
        $("cardDue").value =
          today();

      applyLanguage();

      show("home");

      renderHome();

    } catch (e) {
      console.error(
        "HISAB init error:",
        e
      );

      /*
        Never intentionally create a white screen.
        Keep app shell visible if initialization
        has a non-fatal rendering error.
      */

      var shell =
        $("appShell");

      var gate =
        $("guestGate");

      if (shell)
        shell.style.display = "";

      if (gate)
        gate.style.display = "none";
    }
  }

  /* =========================================================
     GLOBAL EXPORTS
     ========================================================= */

  window.D = D;

  window.enterGuestMode =
    enterGuestMode;

  window.show = show;
  window.setMode = setMode;

  window.toggleLanguage =
    toggleLanguage;

  window.toggleCurrency =
    toggleCurrency;

  window.openKhataForm =
    openKhataForm;

  window.closeKhataForm =
    closeKhataForm;

  window.saveKhataEntry =
    saveKhataEntry;

  window.searchKhata =
    searchKhata;

  window.filterKhata =
    filterKhata;

  window.editKhata =
    editKhata;

  window.deleteKhata =
    deleteKhata;

  window.openKhataDetail =
    openKhataDetail;

  window.closeKhataDetail =
    closeKhataDetail;

  window.detailFilter =
    detailFilter;

  window.openPaymentEntry =
    openPaymentEntry;

  window.shareKhata =
    shareKhata;

  window.exportKhataPDF =
    exportKhataPDF;

  window.businessFilter =
    businessFilter;

  window.addBusinessCustomer =
    addBusinessCustomer;

  window.addBusinessSupplier =
    addBusinessSupplier;

  window.addBusinessSales =
    addBusinessSales;

  window.addBusinessPurchase =
    addBusinessPurchase;

  window.deleteBusinessMaster =
    deleteBusinessMaster;

  window.editBusinessEntry =
    editBusinessEntry;

  window.deleteBusinessEntry =
    deleteBusinessEntry;

  window.payBusinessEntry =
    payBusinessEntry;

  window.businessHistory =
    businessHistory;

  window.addTransaction =
    addTransaction;

  window.calcBudget =
    calcBudget;

  window.calcGoal =
    calcGoal;

  window.addBill =
    addBill;

  window.calcEMI =
    calcEMI;

  window.payBill =
    payBill;

  window.billHistory =
    billHistory;

  window.payLoan =
    payLoan;

  window.loanHistory =
    loanHistory;

  window.toggleLoanStatus =
    toggleLoanStatus;

  window.deleteLoan =
    deleteLoan;

  window.exportSummary =
    exportSummary;

  window.exportSummaryPDF =
    exportSummaryPDF;

  window.addReminder =
    addReminder;

  window.deleteReminder =
    deleteReminder;

  window.setPin =
    setPin;

  window.lockApp =
    lockApp;

  window.exportBackup =
    exportBackup;

  window.importBackup =
    importBackup;

  window.addFamilyMember =
    addFamilyMember;

  window.deleteFamilyMember =
    deleteFamilyMember;

  window.calcFD =
    calcFD;

  window.addInsurance =
    addInsurance;

  window.addSchool =
    addSchool;

  window.addVehicle =
    addVehicle;

  window.addShopping =
    addShopping;

  window.addUtility =
    addUtility;

  window.calcEmergency =
    calcEmergency;

  window.addDoc =
    addDoc;

  window.addAnnual =
    addAnnual;

  window.searchAllData =
    searchAllData;

  window.openQuickAdd =
    openQuickAdd;

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
