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

        '<div style="margin-top:6px;font-weight:700;color:' +
        (isGive ? "#d32f2f" : "#168a45") +
        ';">' +

        (isGive ? "Give" : "Receive") +
        " • " +
        money(k.amount) +

        '</div>' +

        '<div style="font-size:12px;margin-top:4px;">' +
        'Status: ' +
        esc(k.status || "pending") +
        '</div>' +

        '</div>' +

        '<div style="margin-top:8px;">' +

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

        '</div>'
      );
    }).join("");
  }

  function searchKhata() {
    renderKhata(D.mode);
  }

  function filterKhata(type) {
    D.ui.khataFilter = type || "all";
    save();
    renderKhata(D.mode);
  }

  function editKhata(id) {
    var item = D.khata.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    D.mode = item.mode || "personal";
    D.ui.khataEditId = item.id;

    if ($("khataPerson")) {
      $("khataPerson").value = item.person || "";
    }

    if ($("khataType")) {
      $("khataType").value = item.type || "give";
    }

    if ($("khataAmount")) {
      $("khataAmount").value = item.amount || "";
    }

    if ($("khataDate")) {
      $("khataDate").value =
        item.date || today();
    }

    if ($("khataMethod")) {
      $("khataMethod").value =
        item.method || "Cash";
    }

    if ($("khataStatus")) {
      $("khataStatus").value =
        item.status || "pending";
    }

    if ($("khataNote")) {
      $("khataNote").value =
        item.note || "";
    }

    show("khataEntry");
  }

  function deleteKhata(id) {
    if (!confirm("Delete this entry?")) {
      return;
    }

    D.khata = D.khata.filter(function (x) {
      return x.id !== id;
    });

    save();

    renderKhata(D.mode);
    renderHome();
  }

  function openKhataDetail(person, mode) {
    D.ui.detailPerson = person || "";
    D.ui.detailFilter = "all";

    if (mode) {
      D.mode = mode;
    }

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
    if (!root) return;

    var person = D.ui.detailPerson || "";
    var mode = D.mode;

    var data = getKhata(mode).filter(function (k) {
      return String(k.person || "").toLowerCase() ===
        String(person).toLowerCase();
    });

    var filter =
      D.ui.detailFilter || "all";

    if (filter !== "all") {
      data = data.filter(function (k) {
        return k.type === filter;
      });
    }

    data.sort(function (a, b) {
      return String(b.date)
        .localeCompare(String(a.date));
    });

    var give = 0;
    var receive = 0;

    data.forEach(function (k) {
      if (k.type === "give") {
        give += num(k.amount);
      }

      if (k.type === "receive") {
        receive += num(k.amount);
      }
    });

    var title = root.querySelector(".page-title");

    if (title) {
      title.textContent =
        person || "Udhar Detail";
    }

    var summary = root.querySelector(
      ".khata-detail-summary"
    );

    if (summary) {
      summary.innerHTML =
        '<div><strong>Give</strong><br>' +
        money(give) +
        '</div>' +

        '<div><strong>Receive</strong><br>' +
        money(receive) +
        '</div>' +

        '<div><strong>Net</strong><br>' +
        money(give - receive) +
        '</div>';
    }

    var list =
      $("khataDetailList") ||
      root.querySelector(".khata-detail-list");

    if (!list) return;

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No entries found.</div>';
      return;
    }

    list.innerHTML = data.map(function (k) {
      var isGive = k.type === "give";

      return (
        '<div class="hisab-entry-card">' +

        '<strong>' +
        (isGive ? "Give" : "Receive") +
        '</strong>' +

        '<div style="color:' +
        (isGive ? "#d32f2f" : "#168a45") +
        ';font-weight:700;margin-top:4px;">' +
        money(k.amount) +
        '</div>' +

        '<div style="font-size:12px;opacity:.7;margin-top:4px;">' +
        esc(k.date) +
        ' • ' +
        esc(k.method || "Cash") +
        ' • ' +
        esc(k.status || "pending") +
        '</div>' +

        (k.note
          ? '<div style="margin-top:5px;">' +
            esc(k.note) +
            '</div>'
          : "") +

        '<div style="margin-top:8px;">' +

        '<button type="button" onclick="editKhata(\'' +
        esc(k.id) +
        '\')">Edit</button> ' +

        '<button type="button" onclick="deleteKhata(\'' +
        esc(k.id) +
        '\')">Delete</button>' +

        '</div>' +

        '</div>'
      );
    }).join("");
  }

  function openPaymentEntry(id) {
    var item = D.khata.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    var amount = prompt(
      "Payment amount:",
      String(item.amount || "")
    );

    if (amount === null) return;

    amount = num(amount);

    if (amount <= 0) {
      alert("Valid amount enter karein.");
      return;
    }

    item.status = "settled";
    item.paid = amount;

    save();

    renderKhata(D.mode);
    renderKhataDetail();
  }

  function shareKhata(person, mode) {
    var data = getKhata(mode || D.mode).filter(function (k) {
      return String(k.person || "").toLowerCase() ===
        String(person || "").toLowerCase();
    });

    var text =
      "HISAB - Udhar Statement\n\n" +
      "Name: " +
      (person || "") +
      "\n\n";

    data.forEach(function (k) {
      text +=
        (k.type === "give" ? "Give" : "Receive") +
        ": " +
        money(k.amount) +
        "\nDate: " +
        k.date +
        "\nStatus: " +
        (k.status || "pending") +
        "\n\n";
    });

    if (
      navigator.share &&
      window.isSecureContext
    ) {
      navigator.share({
        title: "HISAB Udhar Statement",
        text: text
      }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(function () {
          alert("Statement copied.");
        })
        .catch(function () {
          alert(text);
        });
    } else {
      alert(text);
    }
  }

  function exportKhataPDF(person, mode) {
    var data = getKhata(mode || D.mode).filter(function (k) {
      return String(k.person || "").toLowerCase() ===
        String(person || "").toLowerCase();
    });

    var html =
      '<!doctype html>' +
      '<html><head><meta charset="utf-8">' +
      '<title>HISAB Udhar Statement</title>' +
      '<style>' +
      'body{font-family:Arial;padding:20px;}' +
      'table{width:100%;border-collapse:collapse;}' +
      'th,td{border:1px solid #ccc;padding:8px;text-align:left;}' +
      '</style></head><body>' +

      '<h2>HISAB Udhar Statement</h2>' +
      '<p><b>Name:</b> ' +
      esc(person) +
      '</p>' +

      '<table>' +
      '<tr>' +
      '<th>Type</th>' +
      '<th>Amount</th>' +
      '<th>Date</th>' +
      '<th>Status</th>' +
      '</tr>' +

      data.map(function (k) {
        return (
          '<tr>' +
          '<td>' +
          (k.type === "give" ? "Give" : "Receive") +
          '</td>' +
          '<td>' +
          money(k.amount) +
          '</td>' +
          '<td>' +
          esc(k.date) +
          '</td>' +
          '<td>' +
          esc(k.status || "pending") +
          '</td>' +
          '</tr>'
        );
      }).join("") +

      '</table>' +
      '</body></html>';

    var win =
      window.open("", "_blank");

    if (!win) {
      alert("PDF window open nahi ho saki.");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();

    setTimeout(function () {
      win.print();
    }, 400);
  }
   if (item.paid >= total) {
      item.paid = total;
      item.status = "paid";
    } else {
      item.status = "pending";
    }

    save();
    renderBusiness();
  }

  function renderBusiness() {
    var list = $("businessList");
    if (!list) return;

    var filter =
      D.ui.businessFilter || "customer";

    var html = "";

    if (
      filter === "sales" ||
      filter === "customer"
    ) {
      var sales = getBusinessSales();

      if (filter === "sales") {
        html +=
          '<div class="section-title">Sales</div>';
      }

      sales.forEach(function (x) {
        var paid = num(x.paid);
        var remaining =
          Math.max(0, num(x.amount) - paid);

        html +=
          '<div class="hisab-entry-card">' +

          '<strong>' +
          esc(x.customer || "Customer") +
          '</strong>' +

          '<div style="margin-top:5px;">' +
          "Sale • " +
          money(x.amount) +
          '</div>' +

          '<div style="font-size:12px;opacity:.7;">' +
          esc(x.date) +
          " • " +
          esc(x.method || "Cash") +
          '</div>' +

          '<div style="margin-top:5px;">' +
          "Paid: " +
          money(paid) +
          " • Remaining: " +
          money(remaining) +
          '</div>' +

          '<div style="color:' +
          (x.status === "paid"
            ? "#168a45"
            : "#d93025") +
          ';font-weight:700;margin-top:4px;">' +
          esc(x.status || "pending") +
          '</div>' +

          (x.note
            ? '<div style="margin-top:5px;">' +
              esc(x.note) +
              '</div>'
            : "") +

          '<div style="margin-top:8px;">' +

          '<button type="button" onclick="payBusinessEntry(\'sale\',\'' +
          esc(x.id) +
          '\')">Payment</button> ' +

          '<button type="button" onclick="editBusinessEntry(\'sale\',\'' +
          esc(x.id) +
          '\')">Edit</button> ' +

          '<button type="button" onclick="deleteBusinessEntry(\'sale\',\'' +
          esc(x.id) +
          '\')">Delete</button>' +

          '</div>' +

          '</div>';
      });
    }

    if (
      filter === "purchase" ||
      filter === "supplier"
    ) {
      var purchases =
        getBusinessPurchases();

      if (filter === "purchase") {
        html +=
          '<div class="section-title">Purchase</div>';
      }

      purchases.forEach(function (x) {
        var paid = num(x.paid);
        var remaining =
          Math.max(0, num(x.amount) - paid);

        html +=
          '<div class="hisab-entry-card">' +

          '<strong>' +
          esc(x.supplier || "Supplier") +
          '</strong>' +

          '<div style="margin-top:5px;">' +
          "Purchase • " +
          money(x.amount) +
          '</div>' +

          '<div style="font-size:12px;opacity:.7;">' +
          esc(x.date) +
          " • " +
          esc(x.method || "Cash") +
          '</div>' +

          '<div style="margin-top:5px;">' +
          "Paid: " +
          money(paid) +
          " • Remaining: " +
          money(remaining) +
          '</div>' +

          '<div style="color:' +
          (x.status === "paid"
            ? "#168a45"
            : "#d93025") +
          ';font-weight:700;margin-top:4px;">' +
          esc(x.status || "pending") +
          '</div>' +

          (x.note
            ? '<div style="margin-top:5px;">' +
              esc(x.note) +
              '</div>'
            : "") +

          '<div style="margin-top:8px;">' +

          '<button type="button" onclick="payBusinessEntry(\'purchase\',\'' +
          esc(x.id) +
          '\')">Payment</button> ' +

          '<button type="button" onclick="editBusinessEntry(\'purchase\',\'' +
          esc(x.id) +
          '\')">Edit</button> ' +

          '<button type="button" onclick="deleteBusinessEntry(\'purchase\',\'' +
          esc(x.id) +
          '\')">Delete</button>' +

          '</div>' +

          '</div>';
      });
    }

    if (
      filter === "customer" ||
      filter === "supplier"
    ) {
      var masters =
        D.business.filter(function (b) {
          return (
            b.type === filter &&
            b.mode === "business"
          );
        });

      masters.forEach(function (b) {
        html +=
          '<div class="hisab-entry-card">' +

          '<strong>' +
          esc(b.name) +
          '</strong>' +

          '<div style="font-size:12px;opacity:.7;">' +
          esc(b.phone || "") +
          '</div>' +

          '<div style="margin-top:8px;">' +

          '<button type="button" onclick="deleteBusinessMaster(\'' +
          esc(b.id) +
          '\')">Delete</button>' +

          '</div>' +

          '</div>';
      });
    }

    if (!html) {
      html =
        '<div class="empty-state">No business entries yet.</div>';
    }

    list.innerHTML = html;
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction(type) {
    var amount =
      num(prompt(
        type === "income"
          ? "Income amount:"
          : "Expense amount:"
      ));

    if (amount <= 0) {
      alert("Valid amount enter karein.");
      return;
    }

    var category =
      prompt("Category:") || "";

    var note =
      prompt("Note (optional):") || "";

    var date =
      prompt(
        "Date (YYYY-MM-DD):",
        today()
      ) || today();

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
    renderTransactions();
    renderHome();
  }

  function deleteTransaction(id) {
    if (!confirm("Transaction delete karein?")) {
      return;
    }

    D.transactions =
      D.transactions.filter(function (t) {
        return t.id !== id;
      });

    save();
    renderTransactions();
    renderHome();
  }

  function renderTransactions() {
    var list = $("transactionList");
    if (!list) return;

    var data =
      D.transactions.filter(function (t) {
        return t.mode === D.mode;
      });

    data.sort(function (a, b) {
      return String(b.date)
        .localeCompare(String(a.date));
    });

    if (!data.length) {
      list.innerHTML =
        '<div class="empty-state">No transactions yet.</div>';
      return;
    }

    list.innerHTML = data.map(function (t) {
      var income =
        t.type === "income";

      return (
        '<div class="hisab-entry-card">' +

        '<strong>' +
        (income ? "Income" : "Expense") +
        '</strong>' +

        '<div style="color:' +
        (income ? "#168a45" : "#d93025") +
        ';font-weight:700;margin-top:5px;">' +
        money(t.amount) +
        '</div>' +

        '<div style="font-size:12px;opacity:.7;">' +
        esc(t.date) +
        (t.category
          ? " • " + esc(t.category)
          : "") +
        '</div>' +

        (t.note
          ? '<div style="margin-top:5px;">' +
            esc(t.note) +
            '</div>'
          : "") +

        '<div style="margin-top:8px;">' +

        '<button type="button" onclick="deleteTransaction(\'' +
        esc(t.id) +
        '\')">Delete</button>' +

        '</div>' +

        '</div>'
      );
    }).join("");
  }

  /* =========================================================
     PLANNING / BUDGET
     ========================================================= */

  function setBudget() {
    var current =
      D.mode === "business"
        ? num(D.budget.business)
        : num(D.budget.personal);

    var value =
      num(
        prompt(
          "Budget amount:",
          String(current || "")
        )
      );

    if (value < 0) return;

    if (D.mode === "business") {
      D.budget.business = value;
    } else {
      D.budget.personal = value;
    }

    save();
    renderPlanning();
    renderHome();
  }

  function addGoal() {
    var name =
      prompt("Goal name:");

    if (!name || !name.trim()) return;

    var target =
      num(prompt("Target amount:"));

    if (target <= 0) return;

    D.goals.push({
      id: uid("goal"),
      mode: D.mode,
      name: name.trim(),
      target: target,
      saved: 0,
      date: today()
    });

    save();
    renderPlanning();
  }

  function addGoalSaving(id) {
    var goal =
      D.goals.find(function (g) {
        return g.id === id;
      });

    if (!goal) return;

    var amount =
      num(prompt("Saving amount:"));

    if (amount <= 0) return;

    goal.saved =
      num(goal.saved) + amount;

    save();
    renderPlanning();
  }

  function deleteGoal(id) {
    if (!confirm("Goal delete karein?")) {
      return;
    }

    D.goals =
      D.goals.filter(function (g) {
        return g.id !== id;
      });

    save();
    renderPlanning();
  }
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
      status: "pending",
      paid: 0,
      history: [],
      date: today()
    });

    if ($("billName"))
      $("billName").value = "";

    if ($("billAmount"))
      $("billAmount").value = "";

    save();
    renderCredit();
  }

  function payBill(id) {
    var bill =
      D.bills.find(function (b) {
        return b.id === id;
      });

    if (!bill) return;

    var remaining =
      Math.max(
        0,
        num(bill.amount) -
        num(bill.paid)
      );

    if (remaining <= 0) {
      bill.status = "paid";
      save();
      renderCredit();
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
        "Cash"
      ) || "Cash";

    bill.paid =
      num(bill.paid) + amount;

    if (!Array.isArray(bill.history)) {
      bill.history = [];
    }

    bill.history.push({
      id: uid("billpay"),
      date: today(),
      amount: amount,
      method: method
    });

    if (bill.paid >= num(bill.amount)) {
      bill.paid = num(bill.amount);
      bill.status = "paid";
    } else {
      bill.status = "partial";
    }

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
      "Bill Payment History\n\n";

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

  function deleteBill(id) {
    if (!confirm("Bill delete karein?")) {
      return;
    }

    D.bills =
      D.bills.filter(function (b) {
        return b.id !== id;
      });

    save();
    renderCredit();
  }

  function addLoan() {
    var name =
      $("loanName")
        ? $("loanName").value.trim()
        : "";

    var amount =
      $("loanAmount")
        ? num($("loanAmount").value)
        : 0;

    var due =
      $("loanDue")
        ? safeDate($("loanDue").value)
        : today();

    if (!name || amount <= 0) {
      alert("Loan name aur amount enter karein.");
      return;
    }

    D.loans.push({
      id: uid("loan"),
      mode: D.mode,
      name: name,
      amount: amount,
      due: due,
      status: "pending",
      paid: 0,
      history: [],
      date: today()
    });

    if ($("loanName"))
      $("loanName").value = "";

    if ($("loanAmount"))
      $("loanAmount").value = "";

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
        num(loan.amount) -
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

    if (loan.paid >= num(loan.amount)) {
      loan.paid = num(loan.amount);
      loan.status = "paid";
    } else {
      loan.status = "partial";
    }

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
      "Loan / EMI Payment History\n\n";

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

  function deleteLoan(id) {
    if (!confirm("Loan / EMI delete karein?")) {
      return;
    }

    D.loans =
      D.loans.filter(function (l) {
        return l.id !== id;
      });

    save();
    renderCredit();
  }

  function renderCredit() {
    var page = $("credit");
    if (!page) return;

    var billList = $("billList");
    var loanList = $("loanList");

    var bills =
      D.bills.filter(function (b) {
        return b.mode === D.mode;
      });

    var loans =
      D.loans.filter(function (l) {
        return l.mode === D.mode;
      });

    if (billList) {
      if (!bills.length) {
        billList.innerHTML =
          '<div class="empty-state">No bills yet.</div>';
      } else {
        billList.innerHTML =
          bills.map(function (b) {
            var remaining =
              Math.max(
                0,
                num(b.amount) -
                num(b.paid)
              );

            return (
              '<div class="hisab-entry-card">' +

              '<div>' +
              '<strong>' +
              esc(b.name) +
              '</strong>' +

              '<div>' +
              "Due: " +
              esc(b.due) +
              '</div>' +

              '<div style="font-size:12px;margin-top:4px;">' +
              "Total: " +
              money(b.amount) +
              " • Paid: " +
              money(b.paid) +
              " • Remaining: " +
              money(remaining) +
              '</div>' +

              '<div style="color:' +
              (b.status === "paid"
                ? "#168a45"
                : "#d93025") +
              ';font-weight:700;">' +
              esc(b.status || "pending") +
              '</div>' +

              '</div>' +

              '<div style="margin-top:8px;">' +

              (remaining > 0
                ? '<button type="button" onclick="payBill(\'' +
                  esc(b.id) +
                  '\')">Pay</button> '
                : "") +

              '<button type="button" onclick="billHistory(\'' +
              esc(b.id) +
              '\')">History</button> ' +

              '<button type="button" onclick="deleteBill(\'' +
              esc(b.id) +
              '\')">Delete</button>' +

              '</div>' +

              '</div>'
            );
          }).join("");
      }
    }

    if (loanList) {
      if (!loans.length) {
        loanList.innerHTML =
          '<div class="empty-state">No loans / EMI yet.</div>';
      } else {
        loanList.innerHTML =
          loans.map(function (l) {
            var remaining =
              Math.max(
                0,
                num(l.amount) -
                num(l.paid)
              );

            return (
              '<div class="hisab-entry-card">' +

              '<div>' +
              '<strong>' +
              esc(l.name) +
              '</strong>' +

              '<div>' +
              "Due: " +
              esc(l.due) +
              '</div>' +

              '<div style="font-size:12px;margin-top:4px;">' +
              "Total: " +
              money(l.amount) +
              " • Paid: " +
              money(l.paid) +
              " • Remaining: " +
              money(remaining) +
              '</div>' +

              '<div style="color:' +
              (l.status === "paid"
                ? "#168a45"
                : "#d93025") +
              ';font-weight:700;">' +
              esc(l.status || "pending") +
              '</div>' +

              '</div>' +

              '<div style="margin-top:8px;">' +

              (remaining > 0
                ? '<button type="button" onclick="payLoan(\'' +
                  esc(l.id) +
                  '\')">Pay</button> '
                : "") +

              '<button type="button" onclick="loanHistory(\'' +
              esc(l.id) +
              '\')">History</button> ' +

              '<button type="button" onclick="deleteLoan(\'' +
              esc(l.id) +
              '\')">Delete</button>' +

              '</div>' +

              '</div>'
            );
          }).join("");
      }
    }
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function renderReports() {
    var root = $("reports");
    if (!root) return;

    var transactions =
      D.transactions.filter(function (t) {
        return t.mode === D.mode;
      });

    var income = 0;
    var expense = 0;

    transactions.forEach(function (t) {
      if (t.type === "income") {
        income += num(t.amount);
      }

      if (t.type === "expense") {
        expense += num(t.amount);
      }
    });

    var give = 0;
    var receive = 0;

    getKhata(D.mode).forEach(function (k) {
      if (k.type === "give") {
        give += num(k.amount);
      }

      if (k.type === "receive") {
        receive += num(k.amount);
      }
    });

    var salesTotal =
      getBusinessSales().reduce(function (s, x) {
        return s + num(x.amount);
      }, 0);

    var purchaseTotal =
      getBusinessPurchases().reduce(function (s, x) {
        return s + num(x.amount);
      }, 0);

    var budget =
      num(D.budget[D.mode]);

    var spent =
      transactions.reduce(function (s, x) {
        return x.type === "expense"
          ? s + num(x.amount)
          : s;
      }, 0);

    var remaining =
      budget - spent;

    var net =
      income -
      expense +
      receive -
      give;

    var box =
      root.querySelector(
        ".hisab-report-box"
      );

    if (!box) {
      box =
        document.createElement("div");

      box.className =
        "hisab-report-box";

      root.prepend(box);
    }

    box.innerHTML =
      '<div class="hisab-entry-card">' +
      '<strong>Income</strong><br>' +
      money(income) +
      '</div>' +

      '<div class="hisab-entry-card">' +
      '<strong>Expense</strong><br>' +
      money(expense) +
      '</div>' +

      '<div class="hisab-entry-card">' +
      '<strong>Net Balance</strong><br>' +
      money(net) +
      '</div>' +

      '<div class="hisab-entry-card">' +
      '<strong>Give</strong><br>' +
      money(give) +
      '</div>' +

      '<div class="hisab-entry-card">' +
      '<strong>Receive</strong><br>' +
      money(receive) +
      '</div>' +

      '<div class="hisab-entry-card">' +
      '<strong>Budget</strong><br>' +
      money(budget) +
      '<br>Spent: ' +
      money(spent) +
      '<br>Remaining: ' +
      money(remaining) +
      '</div>' +

      (D.mode === "business"
        ? '<div class="hisab-entry-card">' +
          '<strong>Sales</strong><br>' +
          money(salesTotal) +
          '<br>Purchases: ' +
          money(purchaseTotal) +
          '</div>'
        : "");

  }
function deleteReminder(id) {
    if (!confirm("Reminder delete karein?")) {
      return;
    }

    D.reminders =
      D.reminders.filter(function (r) {
        return r.id !== id;
      });

    save();
    renderReminders();
  }

  /* =========================================================
     PRIVACY / SECURITY
     ========================================================= */

  function renderPrivacy() {
    var root = $("privacy");
    if (!root) return;

    var status =
      root.querySelector(
        ".pin-status"
      );

    if (status) {
      status.textContent =
        D.pinHash
          ? "PIN is enabled"
          : "PIN is not set";
    }
  }

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamily() {
    var name =
      $("familyName")
        ? $("familyName").value.trim()
        : "";

    if (!name) {
      alert("Family member name enter karein.");
      return;
    }

    D.family.push({
      id: uid("family"),
      name: name,
      date: today()
    });

    if ($("familyName"))
      $("familyName").value = "";

    save();
    renderFamily();
  }

  function deleteFamily(id) {
    if (!confirm("Family member delete karein?")) {
      return;
    }

    D.family =
      D.family.filter(function (f) {
        return f.id !== id;
      });

    save();
    renderFamily();
  }

  function renderFamily() {
    var list = $("familyList");
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

          '<div style="font-size:12px;opacity:.7;">' +
          esc(f.date) +
          '</div>' +

          '<button type="button" onclick="deleteFamily(\'' +
          esc(f.id) +
          "')\">Delete</button>" +

          '</div>'
        );
      }).join("");
  }

  /* =========================================================
     TOOLS
     ========================================================= */

  function addTool() {
    var name =
      prompt("Tool name:");

    if (!name || !name.trim()) return;

    D.tools.push({
      id: uid("tool"),
      name: name.trim(),
      date: today()
    });

    save();
    renderTools();
  }

  function deleteTool(id) {
    D.tools =
      D.tools.filter(function (t) {
        return t.id !== id;
      });

    save();
    renderTools();
  }

  function renderTools() {
    var list = $("toolsList");
    if (!list) return;

    if (!D.tools.length) {
      list.innerHTML =
        '<div class="empty-state">No tools yet.</div>';
      return;
    }

    list.innerHTML =
      D.tools.map(function (t) {
        return (
          '<div class="hisab-entry-card">' +

          '<strong>' +
          esc(t.name) +
          '</strong>' +

          '<div style="font-size:12px;opacity:.7;">' +
          esc(t.date) +
          '</div>' +

          '<button type="button" onclick="deleteTool(\'' +
          esc(t.id) +
          "')\">Delete</button>" +

          '</div>'
        );
      }).join("");
  }

  /* =========================================================
     BACKUP / RESTORE
     ========================================================= */

  function backupData() {
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
          type: "application/json"
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
  }

  function restoreData() {
    var input =
      $("restoreFile");

    if (!input) {
      alert("Restore file option not found.");
      return;
    }

    input.onchange =
      function () {
        var file =
          input.files &&
          input.files[0];

        if (!file) return;

        var reader =
          new FileReader();

        reader.onload =
          function () {
            try {
              var parsed =
                JSON.parse(
                  reader.result
                );

              if (
                !parsed ||
                typeof parsed !== "object"
              ) {
                throw new Error(
                  "Invalid backup"
                );
              }

              D =
                Object.assign(
                  {},
                  D,
                  parsed
                );

              normalize();
              save();

              alert(
                "Backup restored successfully."
              );

              show("home");
            } catch (e) {
              alert(
                "Invalid HISAB backup file."
              );
            }
          };

        reader.readAsText(file);
      };

    input.click();
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  function globalSearch() {
    var input =
      $("globalSearch");

    var q =
      input
        ? input.value.trim().toLowerCase()
        : "";

    if (!q) {
      renderHome();
      return;
    }

    var results = [];

    D.transactions.forEach(function (t) {
      if (t.mode !== D.mode) return;

      var text =
        [
          t.category,
          t.note,
          t.date,
          t.type
        ]
          .join(" ")
          .toLowerCase();

      if (text.includes(q)) {
        results.push({
          type: "Transaction",
          title:
            t.category ||
            t.type,
          amount: t.amount,
          date: t.date
        });
      }
    });

    D.khata.forEach(function (k) {
      if (k.mode !== D.mode) return;

      var text =
        [
          k.person,
          k.note,
          k.date,
          k.type
        ]
          .join(" ")
          .toLowerCase();

      if (text.includes(q)) {
        results.push({
          type: "Udhaar",
          title: k.person,
          amount: k.amount,
          date: k.date
        });
      }
    });

    if (D.mode === "business") {
      getBusinessSales().forEach(function (s) {
        var text =
          [
            s.customer,
            s.note,
            s.date
          ]
            .join(" ")
            .toLowerCase();

        if (text.includes(q)) {
          results.push({
            type: "Sale",
            title: s.customer,
            amount: s.amount,
            date: s.date
          });
        }
      });

      getBusinessPurchases().forEach(function (p) {
        var text =
          [
            p.supplier,
            p.note,
            p.date
          ]
            .join(" ")
            .toLowerCase();

        if (text.includes(q)) {
          results.push({
            type: "Purchase",
            title: p.supplier,
            amount: p.amount,
            date: p.date
          });
        }
      });
    }

    var list =
      $("searchResults");

    if (!list) {
      alert(
        results.length
          ? results.map(function (r) {
              return (
                r.type +
                ": " +
                r.title +
                " • " +
                money(r.amount)
              );
            }).join("\n")
          : "No results found."
      );

      return;
    }

    if (!results.length) {
      list.innerHTML =
        '<div class="empty-state">No results found.</div>';
      return;
    }

    list.innerHTML =
      results.map(function (r) {
        return (
          '<div class="hisab-entry-card">' +

          '<strong>' +
          esc(r.type) +
          '</strong>' +

          '<div>' +
          esc(r.title) +
          '</div>' +

          '<div>' +
          money(r.amount) +
          " • " +
          esc(r.date) +
          '</div>' +

          '</div>'
        );
      }).join("");
  }

  /* =========================================================
     QUICK ADD
     ========================================================= */

  function quickAdd(type) {
    if (type === "income") {
      addTransaction("income");
      return;
    }

    if (type === "expense") {
      addTransaction("expense");
      return;
    }

    if (type === "give") {
      openKhataForm(D.mode);

      if ($("khataType")) {
        $("khataType").value =
          "give";
      }

      return;
    }

    if (type === "receive") {
      openKhataForm(D.mode);

      if ($("khataType")) {
        $("khataType").value =
          "receive";
      }

      return;
    }

    if (type === "sale") {
      addBusinessSales();
      return;
    }

    if (type === "purchase") {
      addBusinessPurchase();
      return;
    }
  }

  /* =========================================================
     FINAL PAGE
     ========================================================= */

  function renderFinal() {
    var root = $("final");
    if (!root) return;

    var summary =
      root.querySelector(
        ".final-summary"
      );

    if (!summary) return;

    summary.innerHTML =
      "<strong>HISAB</strong><br>" +
      "Mode: " +
      esc(D.mode) +
      "<br>" +
      "Currency: " +
      esc(D.currency);
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    try {
      loadData();
      initGate();
      applyLanguage();

      if (
        D.ui &&
        D.ui.page &&
        pages.indexOf(D.ui.page) !== -1
      ) {
        show(D.ui.page);
      } else {
        show("home");
      }

      if ($("splashScreen")) {
        setTimeout(function () {
          var splash =
            $("splashScreen");

          if (splash) {
            splash.style.display =
              "none";
          }
        }, 1200);
      }
    } catch (e) {
      console.error(
        "HISAB init error:",
        e
      );

      /*
        Never leave a blank white screen
        because of a render error.
      */
      try {
        if ($("splashScreen")) {
          $("splashScreen").style.display =
            "none";
        }

        if ($("welcomeScreen")) {
          $("welcomeScreen").style.display =
            "none";
        }

        if ($("homeScreen")) {
          $("homeScreen").style.display =
            "";
        }
      } catch (ignore) {}
    }
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
