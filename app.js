/* =========================================================
   HISAB V7 — STABLE FINAL REPAIR CONTROLLER
   Compatible with current HISAB V7 index.html
   Replace ONLY app.js
   ========================================================= */

(function () {
  "use strict";

  var KEY = "hisab_v7_data";
  var SESSION_KEY = "hisab_v7_guest";

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
     HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function uid(prefix) {
    return (
      (prefix || "id") +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");

    return d.getFullYear() + "-" + m + "-" + day;
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(v) {
    return (
      D.currency +
      " " +
      num(v).toLocaleString("en-IN", {
        maximumFractionDigits: 2
      })
    );
  }

  function safeDate(v) {
    return v || today();
  }

  /*
   * IMPORTANT:
   * No generated HTML uses inline onclick.
   * This prevents the previous quote/syntax error.
   */

  function actionButton(action, id, text, extra) {
    return (
      '<button type="button" data-hisab-action="' +
      esc(action) +
      '" data-hisab-id="' +
      esc(id == null ? "" : id) +
      '"' +
      (extra ? " " + extra : "") +
      ">" +
      esc(text) +
      "</button>"
    );
  }

  function actionButton2(action, id, id2, text) {
    return (
      '<button type="button" data-hisab-action="' +
      esc(action) +
      '" data-hisab-id="' +
      esc(id == null ? "" : id) +
      '" data-hisab-id2="' +
      esc(id2 == null ? "" : id2) +
      '">' +
      esc(text) +
      "</button>"
    );
  }

  /* =========================================================
     STORAGE
     ========================================================= */

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

    arrays.forEach(function (key) {
      if (!Array.isArray(D[key])) D[key] = [];
    });

    if (!D.budget || typeof D.budget !== "object") {
      D.budget = { personal: 0, business: 0 };
    }

    D.budget.personal = num(D.budget.personal);
    D.budget.business = num(D.budget.business);

    if (!D.ui || typeof D.ui !== "object") {
      D.ui = {};
    }

    D.ui.page = D.ui.page || "home";
    D.ui.khataEditId = D.ui.khataEditId || null;
    D.ui.businessFilter = D.ui.businessFilter || "customer";
    D.ui.khataFilter = D.ui.khataFilter || "all";
    D.ui.detailPerson = D.ui.detailPerson || "";
    D.ui.detailFilter = D.ui.detailFilter || "all";

    if (D.mode !== "personal" && D.mode !== "business") {
      D.mode = "personal";
    }

    if (!D.currency) D.currency = "₹";
    if (!D.language) D.language = "hi";

    D.sales.forEach(function (x) {
      x.mode = "business";
      x.paid = num(x.paid);
      x.status = x.status || "pending";
      if (!Array.isArray(x.history)) x.history = [];
    });

    D.purchases.forEach(function (x) {
      x.mode = "business";
      x.paid = num(x.paid);
      x.status = x.status || "pending";
      if (!Array.isArray(x.history)) x.history = [];
    });

    D.bills.forEach(function (x) {
      x.paid = num(x.paid);
      x.status = x.status || "pending";
      if (!Array.isArray(x.history)) x.history = [];
    });

    D.loans.forEach(function (x) {
      x.paid = num(x.paid);
      x.status = x.status || "pending";
      if (!Array.isArray(x.history)) x.history = [];
    });

    D.khata.forEach(function (x) {
      x.mode = x.mode === "business" ? "business" : "personal";
      x.amount = num(x.amount);
      x.paid = num(x.paid);
      x.type = x.type === "receive" ? "receive" : "give";
      x.status = x.status || "pending";
      x.method = x.method || "Cash";
      x.date = x.date || today();
    });

    D.transactions.forEach(function (x) {
      x.amount = num(x.amount);
      x.mode = x.mode === "business" ? "business" : "personal";
    });
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);

      if (raw) {
        var saved = JSON.parse(raw);

        if (saved && typeof saved === "object") {
          Object.keys(saved).forEach(function (key) {
            D[key] = saved[key];
          });
        }
      }
    } catch (e) {
      console.error("HISAB storage load error", e);
    }

    normalize();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(D));
    } catch (e) {
      console.error("HISAB storage save error", e);
    }
  }

  /* =========================================================
     LANGUAGE
     ========================================================= */

  var HI = {
    Personal: "पर्सनल",
    Business: "बिज़नेस",
    Income: "आय",
    Expense: "खर्च",
    Give: "देना",
    Receive: "लेना",
    Sales: "बिक्री",
    Purchase: "खरीद",
    Customer: "ग्राहक",
    Supplier: "सप्लायर",
    Payment: "भुगतान",
    Pending: "बाकी",
    Settled: "निपटाया",
    Reports: "रिपोर्ट",
    Transactions: "लेन-देन",
    Budget: "बजट",
    Goal: "लक्ष्य",
    Bill: "बिल",
    Loan: "लोन",
    Family: "परिवार",
    Save: "सेव",
    Delete: "हटाएँ",
    Edit: "संपादित करें",
    History: "इतिहास"
  };

  function L(text) {
    if (D.language === "hi" && HI[text]) return HI[text];
    return text;
  }

  function applyLanguage() {
    try {
      document.documentElement.lang =
        D.language === "hi" ? "hi" : "en";

      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        el.textContent = L(key);
      });
    } catch (e) {}
  }

  function toggleLanguage() {
    D.language = D.language === "hi" ? "en" : "hi";
    save();
    renderAll();
  }

  function toggleCurrency() {
    var currencies = ["₹", "$", "€", "£"];
    var index = currencies.indexOf(D.currency);

    index++;
    if (index >= currencies.length) index = 0;

    D.currency = currencies[index];

    save();
    renderAll();
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  var PAGES = [
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

  function show(page) {
    if (PAGES.indexOf(page) === -1) {
      page = "home";
    }

    PAGES.forEach(function (id) {
      var el = $(id);

      if (el) {
        el.classList.toggle("active", id === page);

        if (id !== page && !el.classList.contains("active")) {
          if (el.style.display === "block") {
            el.style.display = "";
          }
        }
      }
    });

    D.ui.page = page;
    save();

    renderPage(page);

    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  }

  function renderPage(page) {
    try {
      if (page === "home") renderHome();
      if (page === "personal") renderPersonal();
      if (page === "business") renderBusiness();
      if (page === "khataDetail") renderKhataDetail();
      if (page === "transactions") renderTransactions();
      if (page === "planning") renderPlanning();
      if (page === "credit") renderCredit();
      if (page === "reports") renderReports();
      if (page === "reminders") renderReminders();
      if (page === "family") renderFamily();
      if (page === "tools13") renderTools();
    } catch (e) {
      console.error("HISAB page error", page, e);
    }
  }

  /* =========================================================
     MODE
     ========================================================= */

  function setMode(mode) {
    D.mode = mode === "business" ? "business" : "personal";
    save();
    renderAll();
    show("home");
  }

  /* =========================================================
     HOME
     ========================================================= */

  function getKhata(mode) {
    return D.khata.filter(function (item) {
      return (item.mode || "personal") === mode;
    });
  }

  function khataTotals(mode) {
    var give = 0;
    var receive = 0;

    getKhata(mode).forEach(function (item) {
      if (item.type === "give") give += num(item.amount);
      if (item.type === "receive") receive += num(item.amount);
    });

    return {
      give: give,
      receive: receive,
      net: give - receive
    };
  }

  function renderHome() {
    var income = 0;
    var expense = 0;

    D.transactions.forEach(function (item) {
      if (item.mode !== D.mode) return;

      if (item.type === "income") income += num(item.amount);
      if (item.type === "expense") expense += num(item.amount);
    });

    var khata = khataTotals(D.mode);

    var balance =
      income -
      expense +
      khata.receive -
      khata.give;

    if ($("homeBalance")) {
      $("homeBalance").textContent = money(balance);
    }

    if ($("receivable")) {
      $("receivable").textContent = money(khata.receive);
    }

    if ($("payable")) {
      $("payable").textContent = money(khata.give);
    }

    if ($("modeLabel")) {
      $("modeLabel").textContent =
        D.mode === "business" ? "Business" : "Personal";
    }

    if ($("personalModeBtn")) {
      $("personalModeBtn").classList.toggle(
        "active",
        D.mode === "personal"
      );
    }

    if ($("businessModeBtn")) {
      $("businessModeBtn").classList.toggle(
        "active",
        D.mode === "business"
      );
    }
  }

  function renderPersonal() {
    renderKhata("personal");
  }

  /* =========================================================
     UDHAR
     ========================================================= */

  function renderKhata(mode) {
    var list = $(
      mode === "business" ? "businessList" : "personalList"
    );

    if (!list) return;

    var data = getKhata(mode);
    var filter = D.ui.khataFilter || "all";

    if (filter !== "all") {
      data = data.filter(function (item) {
        return item.type === filter || item.status === filter;
      });
    }

    var search = $(
      mode === "business"
        ? "businessSearch"
        : "personalSearch"
    );

    var q = search
      ? search.value.trim().toLowerCase()
      : "";

    if (q) {
      data = data.filter(function (item) {
        return [
          item.person,
          item.note,
          item.date,
          item.type,
          item.status,
          item.method
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }

    data.sort(function (a, b) {
      return String(b.date || "").localeCompare(
        String(a.date || "")
      );
    });

    var totals = khataTotals(mode);

    var giveEl = $(
      mode === "business"
        ? "businessGiven"
        : "ledgerGiven"
    );

    var receiveEl = $(
      mode === "business"
        ? "businessReceived"
        : "ledgerReceived"
    );

    var netEl = $(
      mode === "business"
        ? "businessNet"
        : "ledgerNet"
    );

    if (giveEl) giveEl.textContent = money(totals.give);
    if (receiveEl) receiveEl.textContent = money(totals.receive);
    if (netEl) netEl.textContent = money(totals.net);

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No Udhar entries yet.</div>';
      return;
    }

    list.innerHTML = data
      .map(function (item) {
        var isGive = item.type === "give";

        return (
          '<div class="hisab-entry-card">' +
          "<strong>" +
          esc(item.person || "Unnamed") +
          "</strong>" +

          '<div style="color:' +
          (isGive ? "#d32f2f" : "#168a45") +
          ';font-weight:700;margin-top:5px;">' +

          (isGive ? "Give" : "Receive") +
          " • " +
          money(item.amount) +
          "</div>" +

          '<div style="font-size:12px;opacity:.7;margin-top:4px;">' +
          esc(item.date || "") +
          " • " +
          esc(item.method || "Cash") +
          " • " +
          esc(item.status || "pending") +
          "</div>" +

          (item.note
            ? '<div style="margin-top:5px;">' +
              esc(item.note) +
              "</div>"
            : "") +

          '<div style="margin-top:8px;">' +

          actionButton2(
            "khata-view",
            item.person,
            mode,
            "View"
          ) +

          actionButton(
            "khata-edit",
            item.id,
            "Edit"
          ) +

          actionButton(
            "khata-delete",
            item.id,
            "Delete"
          ) +

          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function searchKhata(mode) {
    renderKhata(mode || D.mode);
  }

  function filterKhata(mode, type) {
    if (type === undefined) {
      type = mode;
      mode = D.mode;
    }

    D.ui.khataFilter = type || "all";
    save();
    renderKhata(mode || D.mode);
  }

  function openKhataForm(mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.khataEditId = null;

    ["khataPerson", "khataAmount", "khataNote"].forEach(
      function (id) {
        if ($(id)) $(id).value = "";
      }
    );

    if ($("khataType")) $("khataType").value = "give";
    if ($("khataDate")) $("khataDate").value = today();
    if ($("khataMethod")) $("khataMethod").value = "Cash";
    if ($("khataStatus")) $("khataStatus").value = "pending";

    show("khataEntry");
  }

  function closeKhataForm() {
    show(D.mode === "business" ? "business" : "personal");
  }

  function saveKhataEntry() {
    var person = $("khataPerson")
      ? $("khataPerson").value.trim()
      : "";

    var amount = $("khataAmount")
      ? num($("khataAmount").value)
      : 0;

    var type = $("khataType")
      ? $("khataType").value
      : "give";

    if (!person || amount <= 0) {
      alert("Name aur valid amount enter karein.");
      return;
    }

    var id = D.ui.khataEditId;

    var item = id
      ? D.khata.find(function (x) {
          return x.id === id;
        })
      : null;

    if (!item) {
      item = {
        id: uid("khata"),
        mode: D.mode,
        paid: 0
      };

      D.khata.push(item);
    }

    item.mode = D.mode;
    item.person = person;
    item.type = type === "receive" ? "receive" : "give";
    item.amount = amount;

    item.date = safeDate(
      $("khataDate")
        ? $("khataDate").value
        : today()
    );

    item.method = $("khataMethod")
      ? $("khataMethod").value
      : "Cash";

    item.status = $("khataStatus")
      ? $("khataStatus").value
      : "pending";

    item.note = $("khataNote")
      ? $("khataNote").value.trim()
      : "";

    D.ui.khataEditId = null;

    save();

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function editKhata(id) {
    var item = D.khata.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    D.mode =
      item.mode === "business"
        ? "business"
        : "personal";

    D.ui.khataEditId = id;

    if ($("khataPerson")) $("khataPerson").value = item.person || "";
    if ($("khataType")) $("khataType").value = item.type || "give";
    if ($("khataAmount")) $("khataAmount").value = item.amount || "";
    if ($("khataDate")) $("khataDate").value = item.date || today();
    if ($("khataMethod")) $("khataMethod").value = item.method || "Cash";
    if ($("khataStatus")) $("khataStatus").value = item.status || "pending";
    if ($("khataNote")) $("khataNote").value = item.note || "";

    show("khataEntry");
  }

  function deleteKhata(id) {
    if (!confirm("Delete this entry?")) return;

    D.khata = D.khata.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderAll();
  }

  function openKhataDetail(person, mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.detailPerson = person || "";
    D.ui.detailFilter = "all";

    show("khataDetail");
  }

  function closeKhataDetail() {
    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function detailFilter(type) {
    D.ui.detailFilter = type || "all";
    renderKhataDetail();
  }

  function renderKhataDetail() {
    var root = $("khataDetail");
    var list = $("khataDetailList") || $("khataHistory");

    if (!root || !list) return;

    var person = D.ui.detailPerson || "";
    var filter = D.ui.detailFilter || "all";

    var data = getKhata(D.mode).filter(function (item) {
      if (
        String(item.person || "").toLowerCase() !==
        String(person).toLowerCase()
      ) {
        return false;
      }

      if (
        filter !== "all" &&
        item.type !== filter &&
        item.status !== filter
      ) {
        return false;
      }

      return true;
    });

    var give = 0;
    var receive = 0;

    data.forEach(function (item) {
      if (item.type === "give") {
        give += num(item.amount);
      } else {
        receive += num(item.amount);
      }
    });

    if ($("detailPersonName")) {
      $("detailPersonName").textContent = person || "Udhar";
    }

    if ($("detailGive")) {
      $("detailGive").textContent = money(give);
    }

    if ($("detailReceive")) {
      $("detailReceive").textContent = money(receive);
    }

    if ($("detailBalance")) {
      $("detailBalance").textContent = money(give - receive);
    }

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No entries found.</div>';
      return;
    }

    data.sort(function (a, b) {
      return String(b.date || "").localeCompare(
        String(a.date || "")
      );
    });

    list.innerHTML = data
      .map(function (item) {
        var isGive = item.type === "give";

        return (
          '<div class="hisab-entry-card">' +

          '<strong style="color:' +
          (isGive ? "#d32f2f" : "#168a45") +
          ';">' +

          (isGive ? "Give" : "Receive") +
          " • " +
          money(item.amount) +
          "</strong>" +

          '<div style="font-size:12px;opacity:.7;margin-top:5px;">' +
          esc(item.date || "") +
          " • " +
          esc(item.method || "Cash") +
          " • " +
          esc(item.status || "pending") +
          "</div>" +

          (item.note
            ? '<div style="margin-top:5px;">' +
              esc(item.note) +
              "</div>"
            : "") +

          '<div style="margin-top:8px;">' +

          actionButton(
            "khata-edit",
            item.id,
            "Edit"
          ) +

          actionButton(
            "khata-delete",
            item.id,
            "Delete"
          ) +

          actionButton(
            "khata-payment",
            item.id,
            "Payment"
          ) +

          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function openPaymentEntry(id) {
    var item = D.khata.find(function (x) {
      return x.id === id;
    });

    if (!item) {
      var pending = getKhata(D.mode).filter(function (x) {
        return (
          x.person === D.ui.detailPerson &&
          x.status !== "settled"
        );
      });

      item = pending[0];
    }

    if (!item) {
      alert("Pending entry nahi mili.");
      return;
    }

    var remaining = Math.max(
      0,
      num(item.amount) - num(item.paid)
    );

    var amount = num(
      prompt(
        "Payment amount:",
        String(remaining)
      )
    );

    if (amount <= 0) return;

    item.paid = num(item.paid) + amount;

    if (item.paid >= num(item.amount)) {
      item.paid = num(item.amount);
      item.status = "settled";
    }

    item.history = item.history || [];

    item.history.push({
      date: today(),
      amount: amount,
      method: "Cash"
    });

    save();
    renderAll();
    renderKhataDetail();
  }

  /* =========================================================
     SHARE / PDF
     ========================================================= */

  function shareText(text, title) {
    if (navigator.share) {
      navigator.share({
        title: title || "HISAB",
        text: text
      }).catch(function () {});
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          alert("Statement copied.");
        })
        .catch(function () {
          alert(text);
        });

      return;
    }

    alert(text);
  }

  function shareKhata(person, mode) {
    person = person || D.ui.detailPerson;
    mode = mode || D.mode;

    var data = getKhata(mode).filter(function (item) {
      return (
        String(item.person).toLowerCase() ===
        String(person).toLowerCase()
      );
    });

    var text =
      "HISAB - Udhar Statement\n\n" +
      "Name: " +
      person +
      "\n\n";

    data.forEach(function (item) {
      text +=
        (item.type === "give" ? "Give" : "Receive") +
        ": " +
        money(item.amount) +
        "\nDate: " +
        item.date +
        "\nStatus: " +
        (item.status || "pending") +
        "\n\n";
    });

    shareText(text, "HISAB Udhar Statement");
  }

  function printHTML(title, body) {
    var w = window.open("", "_blank");

    if (!w) {
      alert("PDF/Print window open nahi hui.");
      return;
    }

    w.document.write(
      "<!doctype html>" +
      "<html><head>" +
      "<meta charset='utf-8'>" +
      "<title>" +
      esc(title) +
      "</title>" +
      "<style>" +
      "body{font-family:Arial;padding:20px}" +
      "table{width:100%;border-collapse:collapse}" +
      "th,td{border:1px solid #ccc;padding:8px;text-align:left}" +
      "</style>" +
      "</head><body>" +
      body +
      "</body></html>"
    );

    w.document.close();

    setTimeout(function () {
      try {
        w.print();
      } catch (e) {}
    }, 500);
  }

  function exportKhataPDF(person, mode) {
    person = person || D.ui.detailPerson;
    mode = mode || D.mode;

    var data = getKhata(mode).filter(function (item) {
      return (
        String(item.person).toLowerCase() ===
        String(person).toLowerCase()
      );
    });

    var html =
      "<h2>HISAB Udhar Statement</h2>" +
      "<p><b>Name:</b> " +
      esc(person) +
      "</p>" +
      "<table>" +
      "<tr>" +
      "<th>Type</th>" +
      "<th>Amount</th>" +
      "<th>Date</th>" +
      "<th>Method</th>" +
      "<th>Status</th>" +
      "</tr>";

    data.forEach(function (item) {
      html +=
        "<tr>" +
        "<td>" +
        esc(item.type === "give" ? "Give" : "Receive") +
        "</td>" +
        "<td>" +
        money(item.amount) +
        "</td>" +
        "<td>" +
        esc(item.date) +
        "</td>" +
        "<td>" +
        esc(item.method || "Cash") +
        "</td>" +
        "<td>" +
        esc(item.status || "pending") +
        "</td>" +
        "</tr>";
    });

    html += "</table>";

    printHTML("HISAB Udhar Statement", html);
  }

  /* =========================================================
     BUSINESS
     ========================================================= */

  function businessFilter(filter) {
    D.ui.businessFilter = filter || "customer";
    save();
    renderBusiness();
  }

  function addBusinessMaster(type) {
    var name = prompt(
      type === "customer"
        ? "Customer name:"
        : "Supplier name:"
    );

    if (!name || !name.trim()) return;

    var phone = prompt("Phone (optional):", "") || "";

    D.business.push({
      id: uid("business"),
      mode: "business",
      type: type,
      name: name.trim(),
      phone: phone.trim(),
      date: today()
    });

    save();
    renderBusiness();
  }

  function addBusinessCustomer() {
    addBusinessMaster("customer");
  }

  function addBusinessSupplier() {
    addBusinessMaster("supplier");
  }

  function businessEntry(type) {
    var sale = type === "sale";

    var name = prompt(
      sale ? "Customer name:" : "Supplier name:"
    );

    if (!name || !name.trim()) return;

    var amount = num(prompt("Amount:"));

    if (amount <= 0) return;

    var date =
      prompt("Date (YYYY-MM-DD):", today()) || today();

    var method =
      prompt("Payment method:", "Cash") || "Cash";

    var note = prompt("Note:", "") || "";

    var item = {
      id: uid(type),
      mode: "business",
      customer: sale ? name.trim() : "",
      supplier: sale ? "" : name.trim(),
      amount: amount,
      paid: 0,
      status: "pending",
      date: date,
      method: method,
      note: note,
      history: []
    };

    if (sale) {
      D.sales.push(item);
    } else {
      D.purchases.push(item);
    }

    save();
    renderBusiness();
    renderHome();
  }

  function addBusinessSales() {
    businessEntry("sale");
  }

  function addBusinessPurchase() {
    businessEntry("purchase");
  }

  function getBusinessSales() {
    return D.sales.filter(function (item) {
      return item.mode === "business";
    });
  }

  function getBusinessPurchases() {
    return D.purchases.filter(function (item) {
      return item.mode === "business";
    });
  }

  function businessCard(item, type) {
    var name =
      type === "sale"
        ? item.customer
        : item.supplier;

    var paid = num(item.paid);

    var remaining = Math.max(
      0,
      num(item.amount) - paid
    );

    return (
      '<div class="hisab-entry-card">' +

      "<strong>" +
      esc(name || "") +
      "</strong>" +

      "<div>" +
      (type === "sale" ? "Sales" : "Purchase") +
      " • " +
      money(item.amount) +
      "</div>" +

      '<div style="font-size:12px;opacity:.7;">' +
      esc(item.date || "") +
      " • " +
      esc(item.method || "Cash") +
      "</div>" +

      "<div>" +
      "Paid: " +
      money(paid) +
      " • Remaining: " +
      money(remaining) +
      "</div>" +

      '<div style="font-weight:700;color:' +
      (item.status === "paid" ? "#168a45" : "#d32f2f") +
      ';">' +
      esc(item.status || "pending") +
      "</div>" +

      '<div style="margin-top:8px;">' +

      actionButton2(
        "business-payment",
        type,
        item.id,
        "Payment"
      ) +

      actionButton2(
        "business-edit",
        type,
        item.id,
        "Edit"
      ) +

      actionButton2(
        "business-delete",
        type,
        item.id,
        "Delete"
      ) +

      actionButton2(
        "business-history",
        type,
        item.id,
        "History"
      ) +

      "</div>" +
      "</div>"
    );
  }

  function renderBusiness() {
    var list = $("businessList");

    if (!list) return;

    var filter =
      D.ui.businessFilter || "customer";

    var html = "";

    if (
      filter === "customer" ||
      filter === "sales"
    ) {
      getBusinessSales().forEach(function (item) {
        html += businessCard(item, "sale");
      });
    }

    if (
      filter === "supplier" ||
      filter === "purchase"
    ) {
      getBusinessPurchases().forEach(function (item) {
        html += businessCard(item, "purchase");
      });
    }

    if (
      filter === "customer" ||
      filter === "supplier"
    ) {
      D.business
        .filter(function (item) {
          return (
            item.mode === "business" &&
            item.type === filter
          );
        })
        .forEach(function (item) {
          html +=
            '<div class="hisab-entry-card">' +
            "<strong>" +
            esc(item.name) +
            "</strong>" +
            '<div style="font-size:12px;opacity:.7;">' +
            esc(item.phone || "") +
            "</div>" +
            actionButton(
              "business-master-delete",
              item.id,
              "Delete"
            ) +
            "</div>";
        });
    }

    if (!html) {
      html =
        '<div class="empty-state">No business entries yet.</div>';
    }

    list.innerHTML = html;
  }

  function findBusiness(type, id) {
    var arr =
      type === "sale"
        ? D.sales
        : D.purchases;

    return arr.find(function (item) {
      return item.id === id;
    });
  }

  function payBusinessEntry(type, id) {
    var item = findBusiness(type, id);

    if (!item) return;

    var remaining = Math.max(
      0,
      num(item.amount) - num(item.paid)
    );

    if (remaining <= 0) {
      item.status = "paid";
      save();
      renderBusiness();
      return;
    }

    var amount = num(
      prompt(
        "Payment amount:",
        String(remaining)
      )
    );

    if (amount <= 0) return;

    amount = Math.min(amount, remaining);

    var method =
      prompt("Payment method:", "Cash") || "Cash";

    item.paid = num(item.paid) + amount;
    item.history = item.history || [];

    item.history.push({
      date: today(),
      amount: amount,
      method: method
    });

    item.status =
      item.paid >= item.amount
        ? "paid"
        : "pending";

    save();
    renderBusiness();
  }

  function editBusinessEntry(type, id) {
    var item = findBusiness(type, id);

    if (!item) return;

    var amount = num(
      prompt(
        "Amount:",
        String(item.amount)
      )
    );

    if (amount <= 0) return;

    item.amount = amount;

    item.date =
      prompt(
        "Date:",
        item.date || today()
      ) || item.date;

    item.method =
      prompt(
        "Payment method:",
        item.method || "Cash"
      ) ||
      item.method ||
      "Cash";

    item.note =
      prompt(
        "Note:",
        item.note || ""
      ) || "";

    item.paid = Math.min(
      num(item.paid),
      amount
    );

    item.status =
      item.paid >= amount
        ? "paid"
        : "pending";

    save();
    renderBusiness();
  }

  function deleteBusinessEntry(type, id) {
    if (!confirm("Delete this entry?")) return;

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

  function deleteBusinessMaster(id) {
    D.business = D.business.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderBusiness();
  }

  function businessHistory(type, id) {
    var item = findBusiness(type, id);

    if (!item) return;

    var history = item.history || [];

    if (!history.length) {
      alert("No payment history.");
      return;
    }

    alert(
      history
        .map(function (x) {
          return (
            x.date +
            " • " +
            money(x.amount) +
            " • " +
            x.method
          );
        })
        .join("\n")
    );
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction(type) {
    var amount = num(
      prompt(
        type === "income"
          ? "Income amount:"
          : "Expense amount:"
      )
    );

    if (amount <= 0) return;

    var category = prompt("Category:", "") || "";
    var note = prompt("Note:", "") || "";

    var date =
      prompt("Date (YYYY-MM-DD):", today()) ||
      today();

    D.transactions.push({
      id: uid("txn"),
      mode: D.mode,
      type: type,
      amount: amount,
      category: category.trim(),
      note: note.trim(),
      date: safeDate(date)
    });

    save();
    renderAll();
  }

  function deleteTransaction(id) {
    if (!confirm("Delete transaction?")) return;

    D.transactions = D.transactions.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderAll();
  }

  function renderTransactions() {
    var list = $("transactionList");

    if (!list) return;

    var data = D.transactions
      .filter(function (item) {
        return item.mode === D.mode;
      })
      .sort(function (a, b) {
        return String(b.date || "").localeCompare(
          String(a.date || "")
        );
      });

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No transactions yet.</div>';
      return;
    }

    list.innerHTML = data
      .map(function (item) {
        return (
          '<div class="hisab-entry-card">' +

          '<strong style="color:' +
          (item.type === "income"
            ? "#168a45"
            : "#d32f2f") +
          ';">' +

          (item.type === "income"
            ? "Income"
            : "Expense") +

          " • " +
          money(item.amount) +
          "</strong>" +

          '<div style="font-size:12px;opacity:.7;">' +
          esc(item.date) +
          " • " +
          esc(item.category || "") +
          "</div>" +

          (item.note
            ? "<div>" + esc(item.note) + "</div>"
            : "") +

          actionButton(
            "transaction-delete",
            item.id,
            "Delete"
          ) +

          "</div>"
        );
      })
      .join("");
  }

  /* =========================================================
     BUDGET / GOALS
     ========================================================= */

  function calcBudget() {
    var amount = $("budgetAmount")
      ? num($("budgetAmount").value)
      : num(
          prompt(
            "Budget amount:",
            String(D.budget[D.mode] || "")
          )
        );

    if (amount < 0) return;

    D.budget[D.mode] = amount;

    save();

    renderPlanning();
    renderReports();
  }

  function calcGoal() {
    var name = $("goalName")
      ? $("goalName").value.trim()
      : "";

    var target = $("goalTarget")
      ? num($("goalTarget").value)
      : 0;

    var saved = $("goalSaved")
      ? num($("goalSaved").value)
      : 0;

    if (!name || target <= 0) {
      alert("Goal name aur target enter karein.");
      return;
    }

    D.goals.push({
      id: uid("goal"),
      mode: D.mode,
      name: name,
      target: target,
      saved: Math.min(saved, target),
      date: today()
    });

    save();

    ["goalName", "goalTarget", "goalSaved"].forEach(
      function (id) {
        if ($(id)) $(id).value = "";
      }
    );

    renderPlanning();
  }

  function addGoalSaving(id) {
    var goal = D.goals.find(function (x) {
      return x.id === id;
    });

    if (!goal) return;

    var amount = num(
      prompt("Saving amount:")
    );

    if (amount <= 0) return;

    goal.saved = Math.min(
      num(goal.target),
      num(goal.saved) + amount
    );

    save();
    renderPlanning();
  }

  function deleteGoal(id) {
    D.goals = D.goals.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderPlanning();
  }

  function renderPlanning() {
    if ($("budgetAmount")) {
      $("budgetAmount").value =
        D.budget[D.mode] || "";
    }

    var list = $("goalList");

    if (!list) return;

    var data = D.goals.filter(function (x) {
      return x.mode === D.mode;
    });

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No goals yet.</div>';
      return;
    }

    list.innerHTML = data
      .map(function (goal) {
        var percent = goal.target
          ? (num(goal.saved) / num(goal.target)) * 100
          : 0;

        percent = Math.min(100, percent);

        return (
          '<div class="hisab-entry-card">' +

          "<strong>" +
          esc(goal.name) +
          "</strong>" +

          "<div>" +
          money(goal.saved) +
          " / " +
          money(goal.target) +
          "</div>" +

          '<div style="font-size:12px;opacity:.7;">' +
          percent.toFixed(1) +
          "% • " +
          esc(goal.date) +
          "</div>" +

          actionButton(
            "goal-saving",
            goal.id,
            "Add Saving"
          ) +

          actionButton(
            "goal-delete",
            goal.id,
            "Delete"
          ) +

          "</div>"
        );
      })
      .join("");
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function addBill(type) {
    var name = "";
    var amount = 0;
    var due = today();

    if (type === "Credit Card") {
      name = "Credit Card";

      amount = $("cardBill")
        ? num($("cardBill").value)
        : 0;

      due = $("cardDue")
        ? safeDate($("cardDue").value)
        : today();
    } else {
      name = $("billName")
        ? $("billName").value.trim()
        : "";

      amount = $("billAmount")
        ? num($("billAmount").value)
        : 0;

      due = $("billDue")
        ? safeDate($("billDue").value)
        : today();
    }

    if (!name || amount <= 0) {
      alert("Bill name aur amount enter karein.");
      return;
    }

    D.bills.push({
      id: uid("bill"),
      mode: D.mode,
      name: name,
      amount: amount,
      due: due,
      paid: 0,
      status: "pending",
      history: [],
      date: today()
    });

    ["billName", "billAmount", "cardBill"].forEach(
      function (id) {
        if ($(id)) $(id).value = "";
      }
    );

    save();
    renderCredit();
  }

  function payBill(id) {
    var bill = D.bills.find(function (x) {
      return x.id === id;
    });

    if (!bill) return;

    var remaining = Math.max(
      0,
      num(bill.amount) - num(bill.paid)
    );

    var amount = num(
      prompt(
        "Payment amount:",
        String(remaining)
      )
    );

    if (amount <= 0) return;

    amount = Math.min(amount, remaining);

    var method =
      prompt("Payment method:", "Cash") || "Cash";

    bill.paid += amount;

    bill.history.push({
      date: today(),
      amount: amount,
      method: method
    });

    bill.status =
      bill.paid >= bill.amount
        ? "paid"
        : "partial";

    save();
    renderCredit();
  }

  function billHistory(id) {
    var bill = D.bills.find(function (x) {
      return x.id === id;
    });

    if (!bill) return;

    var history = bill.history || [];

    alert(
      history.length
        ? history
            .map(function (x) {
              return (
                x.date +
                " • " +
                money(x.amount) +
                " • " +
                x.method
              );
            })
            .join("\n")
        : "No payment history."
    );
  }

  function deleteBill(id) {
    D.bills = D.bills.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderCredit();
  }

  /* =========================================================
     LOAN / EMI
     ========================================================= */

  function calcEMI() {
    var principal = $("emiPrincipal")
      ? num($("emiPrincipal").value)
      : 0;

    var rate = $("emiRate")
      ? num($("emiRate").value)
      : 0;

    var months = $("emiMonths")
      ? num($("emiMonths").value)
      : 0;

    if (principal <= 0 || months <= 0) {
      alert("Loan amount aur tenure enter karein.");
      return;
    }

    var monthlyRate = rate / 1200;
    var emi;

    if (monthlyRate) {
      emi =
        principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      emi = principal / months;
    }

    if ($("emiResult")) {
      $("emiResult").innerHTML =
        '<div class="hisab-entry-card">' +
        "<strong>Monthly EMI: " +
        money(emi) +
        "</strong>" +
        "<div>Total: " +
        money(emi * months) +
        "</div>" +
        "</div>";
    }

    D.loans.push({
      id: uid("loan"),
      mode: D.mode,
      name: "Loan / EMI",
      principal: principal,
      rate: rate,
      months: months,
      emi: emi,
      amount: emi * months,
      due: today(),
      paid: 0,
      status: "pending",
      history: []
    });

    save();
    renderCredit();
  }

  function payLoan(id) {
    var loan = D.loans.find(function (x) {
      return x.id === id;
    });

    if (!loan) return;

    var remaining = Math.max(
      0,
      num(loan.amount) - num(loan.paid)
    );

    var amount = num(
      prompt(
        "Payment amount:",
        String(
          Math.min(
            remaining,
            num(loan.emi) || remaining
          )
        )
      )
    );

    if (amount <= 0) return;

    amount = Math.min(amount, remaining);

    var method =
      prompt("Payment method:", "Cash") || "Cash";

    loan.paid += amount;

    loan.history.push({
      date: today(),
      amount: amount,
      method: method
    });

    loan.status =
      loan.paid >= loan.amount
        ? "paid"
        : "partial";

    save();
    renderCredit();
  }

  function loanHistory(id) {
    var loan = D.loans.find(function (x) {
      return x.id === id;
    });

    if (!loan) return;

    var history = loan.history || [];

    alert(
      history.length
        ? history
            .map(function (x) {
              return (
                x.date +
                " • " +
                money(x.amount) +
                " • " +
                x.method
              );
            })
            .join("\n")
        : "No payment history."
    );
  }

  function toggleLoanStatus(id) {
    var loan = D.loans.find(function (x) {
      return x.id === id;
    });

    if (!loan) return;

    if (loan.status === "paid") {
      loan.status = "pending";
    } else {
      loan.status = "paid";
      loan.paid = num(loan.amount);
    }

    save();
    renderCredit();
  }

  function deleteLoan(id) {
    D.loans = D.loans.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderCredit();
  }

  function renderCredit() {
    var billList = $("billList");
    var loanList = $("loanList");

    if (billList) {
      var bills = D.bills.filter(function (x) {
        return x.mode === D.mode;
      });

      billList.innerHTML = bills.length
        ? bills
            .map(function (bill) {
              var remaining = Math.max(
                0,
                num(bill.amount) - num(bill.paid)
              );

              return (
                '<div class="hisab-entry-card">' +

                "<strong>" +
                esc(bill.name) +
                "</strong>" +

                "<div>Due: " +
                esc(bill.due) +
                "</div>" +

                "<div>Total: " +
                money(bill.amount) +
                " • Paid: " +
                money(bill.paid) +
                " • Remaining: " +
                money(remaining) +
                "</div>" +

                "<div>" +
                esc(bill.status) +
                "</div>" +

                actionButton(
                  "bill-pay",
                  bill.id,
                  "Pay"
                ) +

                actionButton(
                  "bill-history",
                  bill.id,
                  "History"
                ) +

                actionButton(
                  "bill-delete",
                  bill.id,
                  "Delete"
                ) +

                "</div>"
              );
            })
            .join("")
        : '<div class="empty-state">No bills yet.</div>';
    }

    if (loanList) {
      var loans = D.loans.filter(function (x) {
        return x.mode === D.mode;
      });

      loanList.innerHTML = loans.length
        ? loans
            .map(function (loan) {
              var remaining = Math.max(
                0,
                num(loan.amount) - num(loan.paid)
              );

              return (
                '<div class="hisab-entry-card">' +

                "<strong>" +
                esc(loan.name) +
                "</strong>" +

                "<div>EMI: " +
                money(loan.emi) +
                "</div>" +

                "<div>Due: " +
                esc(loan.due) +
                "</div>" +

                "<div>Paid: " +
                money(loan.paid) +
                " • Remaining: " +
                money(remaining) +
                "</div>" +

                "<div>" +
                esc(loan.status) +
                "</div>" +

                actionButton(
                  "loan-pay",
                  loan.id,
                  "Pay"
                ) +

                actionButton(
                  "loan-history",
                  loan.id,
                  "History"
                ) +

                actionButton(
                  "loan-status",
                  loan.id,
                  "Status"
                ) +

                actionButton(
                  "loan-delete",
                  loan.id,
                  "Delete"
                ) +

                "</div>"
              );
            })
            .join("")
        : '<div class="empty-state">No loans yet.</div>';
    }
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function renderReports() {
    var income = 0;
    var expense = 0;

    D.transactions.forEach(function (item) {
      if (item.mode !== D.mode) return;

      if (item.type === "income") {
        income += num(item.amount);
      } else {
        expense += num(item.amount);
      }
    });

    var khata = khataTotals(D.mode);
    var budget = num(D.budget[D.mode]);
    var remaining = budget - expense;

    var net =
      income -
      expense +
      khata.receive -
      khata.give;

    if ($("reportIncome")) {
      $("reportIncome").textContent = money(income);
    }

    if ($("reportExpense")) {
      $("reportExpense").textContent = money(expense);
    }

    if ($("reportGive")) {
      $("reportGive").textContent = money(khata.give);
    }

    if ($("reportReceive")) {
      $("reportReceive").textContent = money(khata.receive);
    }

    var box = $("reportContent");

    if (!box) return;

    var budgetPercent =
      budget > 0
        ? Math.min(
            100,
            (expense / budget) * 100
          )
        : 0;

    box.innerHTML =
      '<div class="hisab-entry-card">' +
      "<strong>Net Balance</strong>" +
      "<div>" +
      money(net) +
      "</div>" +
      "</div>" +

      '<div class="hisab-entry-card">' +
      "<strong>Budget</strong>" +
      "<div>" +
      money(budget) +
      "</div>" +
      "<div>Spent: " +
      money(expense) +
      " • Remaining: " +
      money(remaining) +
      "</div>" +
      "<div>Used: " +
      budgetPercent.toFixed(1) +
      "%</div>" +
      "</div>";

    if (D.mode === "business") {
      var sales = getBusinessSales().reduce(
        function (total, item) {
          return total + num(item.amount);
        },
        0
      );

      var purchases = getBusinessPurchases().reduce(
        function (total, item) {
          return total + num(item.amount);
        },
        0
      );

      box.innerHTML +=
        '<div class="hisab-entry-card">' +
        "<strong>Business</strong>" +
        "<div>Sales: " +
        money(sales) +
        "</div>" +
        "<div>Purchase: " +
        money(purchases) +
        "</div>" +
        "<div>Gross Difference: " +
        money(sales - purchases) +
        "</div>" +
        "</div>";
    }
  }

  function summaryText() {
    var income = 0;
    var expense = 0;

    D.transactions.forEach(function (item) {
      if (item.mode !== D.mode) return;

      if (item.type === "income") {
        income += num(item.amount);
      } else {
        expense += num(item.amount);
      }
    });

    var khata = khataTotals(D.mode);

    return (
      "HISAB Summary\n\n" +
      "Mode: " +
      D.mode +
      "\n" +
      "Income: " +
      money(income) +
      "\n" +
      "Expense: " +
      money(expense) +
      "\n" +
      "Give: " +
      money(khata.give) +
      "\n" +
      "Receive: " +
      money(khata.receive) +
      "\n" +
      "Net: " +
      money(
        income -
        expense +
        khata.receive -
        khata.give
      )
    );
  }

  function exportSummary() {
    shareText(summaryText(), "HISAB Summary");
  }

  function exportSummaryPDF() {
    printHTML(
      "HISAB Summary",
      "<h2>HISAB Summary</h2>" +
      "<pre>" +
      esc(summaryText()) +
      "</pre>"
    );
  }

  /* =========================================================
     REMINDERS
     ========================================================= */

  function addReminder() {
    var name = $("reminderName")
      ? $("reminderName").value.trim()
      : "";

    var date = $("reminderDate")
      ? safeDate($("reminderDate").value)
      : today();

    if (!name) {
      alert("Reminder enter karein.");
      return;
    }

    D.reminders.push({
      id: uid("reminder"),
      name: name,
      date: date
    });

    save();

    if ($("reminderName")) {
      $("reminderName").value = "";
    }

    renderReminders();
  }

  function deleteReminder(id) {
    D.reminders = D.reminders.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderReminders();
  }

  function renderReminders() {
    var list = $("reminderList");

    if (!list) return;

    if (!D.reminders.length) {
      list.innerHTML =
        '<div class="empty-state">No reminders.</div>';
      return;
    }

    list.innerHTML = D.reminders
      .map(function (item) {
        return (
          '<div class="hisab-entry-card">' +
          "<strong>" +
          esc(item.name) +
          "</strong>" +
          "<div>" +
          esc(item.date) +
          "</div>" +
          actionButton(
            "reminder-delete",
            item.id,
            "Delete"
          ) +
          "</div>"
        );
      })
      .join("");
  }

  /* =========================================================
     SECURITY
     ========================================================= */

  async function hashPin(pin) {
    try {
      if (
        window.crypto &&
        crypto.subtle &&
        window.TextEncoder
      ) {
        var buffer =
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(pin)
          );

        return Array.from(
          new Uint8Array(buffer)
        )
          .map(function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("");
      }
    } catch (e) {}

    var hash = 2166136261;

    for (var i = 0; i < pin.length; i++) {
      hash ^= pin.charCodeAt(i);
      hash += hash << 1;
      hash += hash << 4;
      hash += hash << 7;
      hash += hash << 8;
      hash += hash << 24;
    }

    return String(hash >>> 0);
  }

  async function setPin() {
    var input = $("pinInput");

    var pin = input
      ? input.value.trim()
      : "";

    if (!/^\d{4,8}$/.test(pin)) {
      alert("PIN 4 se 8 digit ka hona chahiye.");
      return;
    }

    D.pinHash = await hashPin(pin);

    save();

    if (input) input.value = "";

    alert("PIN saved.");
  }

  async function enterGuestMode() {
    if (D.pinHash) {
      var pin = prompt("Enter HISAB PIN:");

      if (pin === null) return;

      var hash = await hashPin(pin);

      if (hash !== D.pinHash) {
        alert("Wrong PIN.");
        return;
      }
    }

    localStorage.setItem(SESSION_KEY, "1");

    initGate();
    show("home");
  }

  function lockApp() {
    localStorage.removeItem(SESSION_KEY);
    initGate();
  }

  function initGate() {
    var gate = $("guestGate");
    var shell = $("appShell");

    var unlocked =
      localStorage.getItem(SESSION_KEY) === "1";

    if (gate) {
      gate.style.display =
        unlocked ? "none" : "flex";
    }

    if (shell) {
      shell.style.display =
        unlocked ? "" : "none";
    }
  }

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamilyMember() {
    var name = $("familyName")
      ? $("familyName").value.trim()
      : "";

    if (!name) return;

    D.family.push({
      id: uid("family"),
      name: name,
      date: today()
    });

    save();

    if ($("familyName")) {
      $("familyName").value = "";
    }

    renderFamily();
  }

  function deleteFamilyMember(id) {
    D.family = D.family.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderFamily();
  }

  function renderFamily() {
    var list = $("familyList");

    if (!list) return;

    list.innerHTML = D.family.length
      ? D.family
          .map(function (item) {
            return (
              '<div class="hisab-entry-card">' +
              "<strong>" +
              esc(item.name) +
              "</strong>" +
              "<div>" +
              esc(item.date) +
              "</div>" +
              actionButton(
                "family-delete",
                item.id,
                "Delete"
              ) +
              "</div>"
            );
          })
          .join("")
      : '<div class="empty-state">No family members.</div>';
  }

  /* =========================================================
     TOOLS
     ========================================================= */

  function addTool(name) {
    D.tools.push({
      id: uid("tool"),
      name: name,
      date: today()
    });

    save();
    renderTools();

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

  function addDoc() {
    addTool("Document");
  }

  function addAnnual() {
    addTool("Annual Planning");
  }

  function calcEmergency() {
    var monthly = num(
      prompt(
        "Monthly expense:",
        "0"
      )
    );

    var months = num(
      prompt(
        "Emergency months:",
        "6"
      )
    );

    if (monthly <= 0 || months <= 0) return;

    alert(
      "Emergency Fund Target: " +
      money(monthly * months)
    );
  }

  function calcFD() {
    var principal = $("fdPrincipal")
      ? num($("fdPrincipal").value)
      : 0;

    var rate = $("fdRate")
      ? num($("fdRate").value)
      : 0;

    var years = $("fdN")
      ? num($("fdN").value)
      : 0;

    if (principal <= 0 || years <= 0) return;

    var maturity =
      principal *
      Math.pow(
        1 + rate / 100,
        years
      );

    if ($("fdResult")) {
      $("fdResult").textContent =
        "Maturity: " +
        money(maturity);
    }
  }

  function renderTools() {
    var list = $("toolsList");

    if (!list) return;

    list.innerHTML = D.tools.length
      ? D.tools
          .map(function (item) {
            return (
              '<div class="hisab-entry-card">' +
              "<strong>" +
              esc(item.name) +
              "</strong>" +
              "<div>" +
              esc(item.date) +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : '<div class="empty-state">No tools yet.</div>';
  }

  /* =========================================================
     BACKUP
     ========================================================= */

  function exportBackup() {
    try {
      var blob = new Blob(
        [JSON.stringify(D, null, 2)],
        {
          type: "application/json"
        }
      );

      var url = URL.createObjectURL(blob);

      var a = document.createElement("a");

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
      alert("Backup create nahi ho saka.");
    }
  }

  function importBackup(event) {
    var file =
      event &&
      event.target &&
      event.target.files &&
      event.target.files[0];

    if (!file) return;

    var reader = new FileReader();

    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);

        if (!data || typeof data !== "object") {
          throw new Error();
        }

        Object.keys(data).forEach(function (key) {
          D[key] = data[key];
        });

        normalize();
        save();

        alert("Backup restored.");

        renderAll();
        show("home");
      } catch (e) {
        alert("Invalid backup file.");
      }
    };

    reader.readAsText(file);
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  function searchAllData(query) {
    var list = $("searchResults");

    if (!list) return;

    var q = String(query || "")
      .trim()
      .toLowerCase();

    if (!q) {
      list.innerHTML = "";
      return;
    }

    var results = [];

    function add(type, title, amount, date) {
      var text = [
        type,
        title,
        amount,
        date
      ]
        .join(" ")
        .toLowerCase();

      if (text.includes(q)) {
        results.push({
          type: type,
          title: title,
          amount: amount,
          date: date
        });
      }
    }

    D.transactions.forEach(function (x) {
      add(
        "Transaction",
        x.category || x.type,
        x.amount,
        x.date
      );
    });

    D.khata.forEach(function (x) {
      add(
        "Udhar",
        x.person,
        x.amount,
        x.date
      );
    });

    D.sales.forEach(function (x) {
      add(
        "Sale",
        x.customer,
        x.amount,
        x.date
      );
    });

    D.purchases.forEach(function (x) {
      add(
        "Purchase",
        x.supplier,
        x.amount,
        x.date
      );
    });

    D.bills.forEach(function (x) {
      add(
        "Bill",
        x.name,
        x.amount,
        x.due
      );
    });

    D.loans.forEach(function (x) {
      add(
        "Loan",
        x.name,
        x.amount,
        x.due
      );
    });

    D.goals.forEach(function (x) {
      add(
        "Goal",
        x.name,
        x.target,
        x.date
      );
    });

    list.innerHTML = results.length
      ? results
          .slice(0, 50)
          .map(function (x) {
            return (
              '<div class="hisab-entry-card">' +
              "<strong>" +
              esc(x.type) +
              "</strong>" +
              "<div>" +
              esc(x.title) +
              "</div>" +
              "<div>" +
              money(x.amount) +
              " • " +
              esc(x.date) +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : "No results.";
  }

  /* =========================================================
     QUICK ADD
     ========================================================= */

  function openQuickAdd() {
    var choice = prompt(
      "Quick Add:\n" +
      "1 = Income\n" +
      "2 = Expense\n" +
      "3 = Give\n" +
      "4 = Receive"
    );

    if (choice === "1") {
      addTransaction("income");
      return;
    }

    if (choice === "2") {
      addTransaction("expense");
      return;
    }

    if (choice === "3" || choice === "4") {
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
     SAFE BUTTON EVENT HANDLER
     ========================================================= */

  function handleAction(button) {
    var action =
      button.getAttribute("data-hisab-action");

    var id =
      button.getAttribute("data-hisab-id");

    var id2 =
      button.getAttribute("data-hisab-id2");

    if (!action) return;

    switch (action) {
      case "khata-view":
        openKhataDetail(id, id2);
        break;

      case "khata-edit":
        editKhata(id);
        break;

      case "khata-delete":
        deleteKhata(id);
        break;

      case "khata-payment":
        openPaymentEntry(id);
        break;

      case "business-payment":
        payBusinessEntry(id, id2);
        break;

      case "business-edit":
        editBusinessEntry(id, id2);
        break;

      case "business-delete":
        deleteBusinessEntry(id, id2);
        break;

      case "business-history":
        businessHistory(id, id2);
        break;

      case "business-master-delete":
        deleteBusinessMaster(id);
        break;

      case "transaction-delete":
        deleteTransaction(id);
        break;

      case "goal-saving":
        addGoalSaving(id);
        break;

      case "goal-delete":
        deleteGoal(id);
        break;

      case "bill-pay":
        payBill(id);
        break;

      case "bill-history":
        billHistory(id);
        break;

      case "bill-delete":
        deleteBill(id);
        break;

      case "loan-pay":
        payLoan(id);
        break;

      case "loan-history":
        loanHistory(id);
        break;

      case "loan-status":
        toggleLoanStatus(id);
        break;

      case "loan-delete":
        deleteLoan(id);
        break;

      case "reminder-delete":
        deleteReminder(id);
        break;

      case "family-delete":
        deleteFamilyMember(id);
        break;
    }
  }

  function installActionHandler() {
    document.addEventListener(
      "click",
      function (event) {
        var target =
          event.target.closest(
            "[data-hisab-action]"
          );

        if (!target) return;

        event.preventDefault();

        try {
          handleAction(target);
        } catch (e) {
          console.error(
            "HISAB button error",
            e
          );
        }
      },
      false
    );
  }

  /* =========================================================
     FINAL RENDER
     ========================================================= */

  function renderAll() {
    renderHome();
    renderPersonal();
    renderBusiness();
    renderTransactions();
    renderPlanning();
    renderCredit();
    renderReports();
    renderReminders();
    renderFamily();
    renderTools();
    applyLanguage();
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    try {
      load();

      if ($("khataDate")) {
        $("khataDate").value = today();
      }

      if ($("reminderDate")) {
        $("reminderDate").value = today();
      }

      if ($("billDue")) {
        $("billDue").value = today();
      }

      if ($("cardDue")) {
        $("cardDue").value = today();
      }

      initGate();
      renderAll();

      if (
        localStorage.getItem(
          SESSION_KEY
        ) === "1"
      ) {
        show(
          PAGES.indexOf(
            D.ui.page
          ) >= 0
            ? D.ui.page
            : "home"
        );
      }
    } catch (e) {
      console.error(
        "HISAB INIT ERROR:",
        e
      );

      try {
        var shell = $("appShell");
        var gate = $("guestGate");

        if (shell) shell.style.display = "";
        if (gate) gate.style.display = "none";

        show("home");
      } catch (ignore) {}
    }
  }

  /* =========================================================
     PUBLIC FUNCTIONS
     ========================================================= */

  window.D = D;

  window.show = show;
  window.setMode = setMode;

  window.toggleLanguage = toggleLanguage;
  window.toggleCurrency = toggleCurrency;

  window.enterGuestMode = enterGuestMode;
  window.lockApp = lockApp;
  window.setPin = setPin;

  window.openKhataForm = openKhataForm;
  window.closeKhataForm = closeKhataForm;
  window.saveKhataEntry = saveKhataEntry;
  window.searchKhata = searchKhata;
  window.filterKhata = filterKhata;
  window.editKhata = editKhata;
  window.deleteKhata = deleteKhata;

  window.openKhataDetail = openKhataDetail;
  window.closeKhataDetail = closeKhataDetail;
  window.detailFilter = detailFilter;
  window.openPaymentEntry = openPaymentEntry;

  window.shareKhata = shareKhata;
  window.exportKhataPDF = exportKhataPDF;

  window.businessFilter = businessFilter;
  window.addBusinessCustomer = addBusinessCustomer;
  window.addBusinessSupplier = addBusinessSupplier;
  window.addBusinessSales = addBusinessSales;
  window.addBusinessPurchase = addBusinessPurchase;
  window.payBusinessEntry = payBusinessEntry;
  window.editBusinessEntry = editBusinessEntry;
  window.deleteBusinessEntry = deleteBusinessEntry;
  window.deleteBusinessMaster = deleteBusinessMaster;
     /* =========================================================
     GUEST START / UNLOCK
     ========================================================= */

  async function enterGuestMode() {
    try {
      localStorage.setItem(SESSION_KEY, "1");

      var gate = document.getElementById("guestGate");
      var shell = document.getElementById("appShell");

      if (gate) gate.style.display = "none";
      if (shell) shell.style.display = "";

      if (typeof show === "function") {
        show("home");
      }

      if (typeof renderAll === "function") {
        renderAll();
      }
    } catch (e) {
      console.error("Guest start error:", e);
      localStorage.setItem(SESSION_KEY, "1");
      location.reload();
    }
  }

  window.enterGuestMode = enterGuestMode;
  window.businessHistory = businessHistory;

  window.addTransaction = addTransaction;
  window.deleteTransaction = deleteTransaction;

  window.calcBudget = calcBudget;
  window.calcGoal = calcGoal;
  window.addGoalSaving = addGoalSaving;
  window.deleteGoal = deleteGoal;

  window.addBill = addBill;
  window.payBill = payBill;
  window.billHistory = billHistory;
  window.deleteBill = deleteBill;

  window.calcEMI = calcEMI;
  window.payLoan = payLoan;
  window.loanHistory = loanHistory;
  window.toggleLoanStatus = toggleLoanStatus;
  window.deleteLoan = deleteLoan;

  window.exportSummary = exportSummary;
  window.exportSummaryPDF = exportSummaryPDF;

  window.addReminder = addReminder;
  window.deleteReminder = deleteReminder;

  window.addFamilyMember = addFamilyMember;
  window.deleteFamilyMember = deleteFamilyMember;

  window.calcFD = calcFD;
  window.addInsurance = addInsurance;
  window.addSchool = addSchool;
  window.addVehicle = addVehicle;
  window.addShopping = addShopping;
  window.addUtility = addUtility;
  window.calcEmergency = calcEmergency;
  window.addDoc = addDoc;
  window.addAnnual = addAnnual;
  window.renderTools = renderTools;

  window.exportBackup = exportBackup;
  window.importBackup = importBackup;
  window.searchAllData = searchAllData;
  window.openQuickAdd = openQuickAdd;

  /* =========================================================
     START
     ========================================================= */

  installActionHandler();

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
