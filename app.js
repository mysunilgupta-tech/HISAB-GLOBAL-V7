/* =========================================================
   HISAB V7 — COMPLETE STABLE CONTROLLER
   Compatible with current HISAB V7 index.html
   Single controller
   No repair.js required
   Defensive startup — white-screen safe
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  var KEY = "hisab_v7_data";
  var GUEST_KEY = "hisab_v7_guest";

  function $(id) {
    return document.getElementById(id);
  }

  function safeNum(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function money(v) {
    return (D.currency || "₹") + safeNum(v).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
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
    return new Date().toISOString().slice(0, 10);
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function selectedMode() {
    return D.mode === "business" ? "business" : "personal";
  }

  function notify(msg) {
    try {
      alert(msg);
    } catch (e) {}
  }

  function setHTML(id, html) {
    var el = $(id);
    if (el) el.innerHTML = html;
  }

  function setValue(id, value) {
    var el = $(id);
    if (el) el.value = value == null ? "" : value;
  }

  function getValue(id) {
    var el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  /* =========================================================
     DEFAULT DATA
     ========================================================= */

  var DEFAULT = {
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

    budget: 0,
    pin: "",

    ui: {
      businessFilter: "customer",
      khataFilter: "all",
      detailFilter: "all",
      selectedPerson: "",
      selectedMode: "personal",
      returnPage: "home",
      lastPage: "home"
    }
  };

  /* =========================================================
     LOAD / NORMALIZE
     ========================================================= */

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT));
  }

  function normalizeData(raw) {
    var d = raw && typeof raw === "object" ? raw : {};
    var base = cloneDefault();

    Object.keys(base).forEach(function (key) {
      if (key === "ui") return;

      if (d[key] !== undefined) {
        base[key] = d[key];
      }
    });

    [
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
    ].forEach(function (key) {
      base[key] = arr(base[key]);
    });

    if (!d.ui || typeof d.ui !== "object") {
      base.ui = cloneDefault().ui;
    } else {
      base.ui = Object.assign(
        {},
        cloneDefault().ui,
        d.ui
      );
    }

    base.mode =
      base.mode === "business"
        ? "business"
        : "personal";

    base.currency =
      base.currency ||
      "₹";

    base.language =
      base.language === "en"
        ? "en"
        : "hi";

    base.budget = safeNum(base.budget);

    return base;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);

      if (!raw) {
        return cloneDefault();
      }

      return normalizeData(JSON.parse(raw));
    } catch (e) {
      console.error("HISAB load error:", e);
      return cloneDefault();
    }
  }

  var D = load();

  function save() {
    try {
      var copy = JSON.parse(JSON.stringify(D));
      localStorage.setItem(KEY, JSON.stringify(copy));
      window.D = D;
    } catch (e) {
      console.error("HISAB save error:", e);
    }
  }

  window.D = D;

  /* =========================================================
     GUEST SYSTEM
     ========================================================= */

  function showGuestGate() {
    try {
      var gate = $("guestGate");
      var shell = $("appShell");

      if (!gate || !shell) return;

      var entered =
        localStorage.getItem(GUEST_KEY) === "1";

      if (entered) {
        gate.style.display = "none";
        shell.style.display = "";
      } else {
        gate.style.display = "";
        shell.style.display = "none";
      }
    } catch (e) {
      console.error("Guest gate:", e);

      if ($("guestGate")) {
        $("guestGate").style.display = "none";
      }

      if ($("appShell")) {
        $("appShell").style.display = "";
      }
    }
  }

  function enterGuestMode() {
    try {
      localStorage.setItem(GUEST_KEY, "1");
    } catch (e) {}

    if ($("guestGate")) {
      $("guestGate").style.display = "none";
    }

    if ($("appShell")) {
      $("appShell").style.display = "";
    }

    show("home");
  }

  window.showGuestGate = showGuestGate;
  window.enterGuestMode = enterGuestMode;

  /* =========================================================
     PAGE NAVIGATION
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

  var pageHistory = [];

  function getPage(id) {
    return $(id);
  }

  function currentPage() {
    return D.ui.lastPage || "home";
  }

  function show(pageId, remember) {
    try {
      var target = getPage(pageId);

      if (!target) {
        console.warn("HISAB: page not found:", pageId);
        return false;
      }

      if (remember !== false) {
        var old = currentPage();

        if (old !== pageId) {
          pageHistory.push(old);
        }
      }

      document
        .querySelectorAll(".page")
        .forEach(function (p) {
          p.style.display = "none";
          p.classList.remove("active");
        });

      target.style.display = "";
      target.classList.add("active");

      D.ui.lastPage = pageId;
      save();

      renderAll();

      try {
        window.scrollTo(0, 0);
      } catch (e) {}

      addBackButton(target);

      return true;
    } catch (e) {
      console.error("HISAB show error:", e);

      try {
        var home = $("home");

        if (home) {
          document
            .querySelectorAll(".page")
            .forEach(function (p) {
              p.style.display = "none";
              p.classList.remove("active");
            });

          home.style.display = "";
          home.classList.add("active");
          D.ui.lastPage = "home";
        }
      } catch (x) {}

      return false;
    }
  }

  function goBack() {
    try {
      var previous = pageHistory.pop();

      if (previous && getPage(previous)) {
        show(previous, false);
      } else {
        pageHistory = [];
        show("home", false);
      }
    } catch (e) {
      pageHistory = [];
      show("home", false);
    }
  }

  function addBackButton(page) {
    if (!page || page.id === "home") return;

    if (page.querySelector(".hisab-auto-back")) {
      return;
    }

    var title = page.querySelector(".page-title");

    if (!title) return;

    var buttons = page.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var txt = (
        buttons[i].textContent || ""
      ).trim().toLowerCase();

      if (
        txt.indexOf("back") !== -1 ||
        txt.indexOf("←") === 0 ||
        txt.indexOf("✕") === 0
      ) {
        return;
      }
    }

    var btn = document.createElement("button");

    btn.type = "button";
    btn.className = "hisab-auto-back";
    btn.innerHTML = "← Back";

    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      goBack();
    };

    title.insertBefore(btn, title.firstChild);
  }

  function prepareBackButtons() {
    pages.forEach(function (id) {
      addBackButton($(id));
    });
  }

  window.show = show;

  /* =========================================================
     MODE
     ========================================================= */

  function setMode(mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.selectedMode = D.mode;

    save();

    var p = $("personalModeBtn");
    var b = $("businessModeBtn");

    if (p) {
      p.classList.toggle(
        "active",
        D.mode === "personal"
      );
    }

    if (b) {
      b.classList.toggle(
        "active",
        D.mode === "business"
      );
    }

    var label = $("modeLabel");

    if (label) {
      label.textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }

    renderAll();

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  window.setMode = setMode;

  /* =========================================================
     KHATA / UDHAR
     ========================================================= */

  function openKhataForm(mode, person) {
    D.ui.returnPage =
      currentPage() === "khataEntry"
        ? "home"
        : currentPage();

    D.ui.selectedMode =
      mode === "business"
        ? "business"
        : "personal";

    show("khataEntry");

    setValue("khataPerson", person || "");
    setValue("khataAmount", "");
    setValue("khataDate", today());
    setValue("khataNote", "");

    if ($("khataType")) {
      $("khataType").value = "give";
    }

    if ($("khataMethod")) {
      $("khataMethod").value = "Cash";
    }

    if ($("khataStatus")) {
      $("khataStatus").value = "pending";
    }
  }

  function closeKhataForm() {
    show(
      D.ui.returnPage || D.mode,
      false
    );
  }

  function saveKhataEntry() {
    try {
      var person = getValue("khataPerson");
      var type = getValue("khataType") || "give";
      var amount = safeNum(
        getValue("khataAmount")
      );

      if (!person) {
        notify("Person name enter karein.");
        return;
      }

      if (amount <= 0) {
        notify("Valid amount enter karein.");
        return;
      }

      var mode =
        D.ui.selectedMode === "business"
          ? "business"
          : "personal";

      D.khata.push({
        id: uid("khata"),
        mode: mode,
        person: person,
        type:
          type === "receive"
            ? "receive"
            : "give",
        amount: amount,
        date:
          getValue("khataDate") ||
          today(),
        method:
          getValue("khataMethod") ||
          "Cash",
        status:
          getValue("khataStatus") ||
          "pending",
        note: getValue("khataNote"),
        createdAt: Date.now()
      });

      save();

      notify("Entry saved.");

      D.ui.selectedPerson = person;

      show(
        mode === "business"
          ? "business"
          : "personal"
      );
    } catch (e) {
      console.error("saveKhataEntry:", e);
      notify("Entry save nahi ho paayi.");
    }
  }

  function khataMatches(entry, mode) {
    return (
      entry &&
      (entry.mode || "personal") === mode
    );
  }

  function khataFilterMatch(entry, filter) {
    if (!filter || filter === "all") {
      return true;
    }

    if (
      filter === "give" ||
      filter === "receive"
    ) {
      return entry.type === filter;
    }

    if (filter === "pending") {
      return (
        String(entry.status || "").toLowerCase() ===
        "pending"
      );
    }

    if (filter === "settled") {
      return (
        String(entry.status || "").toLowerCase() ===
        "settled"
      );
    }

    return true;
  }

  function renderKhataList(mode) {
    var listId =
      mode === "business"
        ? "businessList"
        : "personalList";

    var searchId =
      mode === "business"
        ? "businessSearch"
        : "personalSearch";

    var list = $(listId);

    if (!list) return;

    var search = getValue(searchId).toLowerCase();

    var filter =
      D.ui.khataFilter || "all";

    var records = arr(D.khata).filter(
      function (x) {
        return (
          khataMatches(x, mode) &&
          khataFilterMatch(x, filter)
        );
      }
    );

    if (search) {
      records = records.filter(function (x) {
        return (
          String(x.person || "")
            .toLowerCase()
            .indexOf(search) !== -1 ||
          String(x.note || "")
            .toLowerCase()
            .indexOf(search) !== -1
        );
      });
    }

    records.sort(function (a, b) {
      return String(b.date || "").localeCompare(
        String(a.date || "")
      );
    });

    if (!records.length) {
      list.innerHTML =
        '<div class="empty-state">No entries found.</div>';
      return;
    }

    list.innerHTML = records
      .map(function (x) {
        var isGive = x.type === "give";

        return `
          <div class="data-card">
            <div style="display:flex;justify-content:space-between;gap:10px">
              <div>
                <strong>${esc(x.person)}</strong>
                <div>${esc(x.date || "")}</div>
                <div>${esc(x.method || "")} • ${esc(x.status || "")}</div>
                ${
                  x.note
                    ? `<div>${esc(x.note)}</div>`
                    : ""
                }
              </div>

              <div style="font-weight:800;color:${
                isGive ? "#d63b3b" : "#159447"
              }">
                ${isGive ? "Give" : "Receive"}<br>
                ${money(x.amount)}
              </div>
            </div>

            <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">
              <button type="button"
                onclick="openKhataDetail('${esc(x.person).replace(/'/g, "\\'")}','${mode}')">
                History
              </button>

              <button type="button"
                onclick="editKhata('${x.id}')">
                Edit
              </button>

              <button type="button"
                onclick="deleteKhata('${x.id}')">
                Delete
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function searchKhata(mode) {
    renderKhataList(
      mode === "business"
        ? "business"
        : "personal"
    );
  }

  function filterKhata(
    mode,
    filter,
    button
  ) {
    D.ui.khataFilter =
      filter || "all";

    if (button) {
      var parent = button.parentElement;

      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });
      }

      button.classList.add("active");
    }

    renderKhataList(
      mode === "business"
        ? "business"
        : "personal"
    );
  }

  function editKhata(id) {
    var x = D.khata.find(function (v) {
      return v.id === id;
    });

    if (!x) return;

    D.ui.returnPage =
      x.mode === "business"
        ? "business"
        : "personal";

    D.ui.selectedMode = x.mode;

    show("khataEntry");

    setValue("khataPerson", x.person);
    setValue("khataType", x.type);
    setValue("khataAmount", x.amount);
    setValue("khataDate", x.date);
    setValue("khataMethod", x.method);
    setValue("khataStatus", x.status);
    setValue("khataNote", x.note);

    var saveButton =
      $("khataEntry")
        ? $("khataEntry").querySelector(
            "button[onclick*='saveKhataEntry']"
          )
        : null;

    if (saveButton) {
      saveButton.dataset.editId = id;
    }
  }

  function deleteKhata(id) {
    var ok = confirm(
      "Is Udhar entry ko delete karein?"
    );

    if (!ok) return;

    D.khata = D.khata.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderAll();
  }

  window.openKhataForm = openKhataForm;
  window.closeKhataForm = closeKhataForm;
  window.saveKhataEntry = saveKhataEntry;
  window.searchKhata = searchKhata;
  window.filterKhata = filterKhata;
  window.editKhata = editKhata;
  window.deleteKhata = deleteKhata;

  /* =========================================================
     KHATA DETAIL
     ========================================================= */

  function openKhataDetail(
    person,
    mode
  ) {
    D.ui.selectedPerson = person;
    D.ui.selectedMode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.returnPage =
      mode === "business"
        ? "business"
        : "personal";

    show("khataDetail");
  }

  function renderKhataDetail() {
    var person =
      D.ui.selectedPerson || "";

    if (!person) return;

    var mode =
      D.ui.selectedMode === "business"
        ? "business"
        : "personal";

    var records = arr(D.khata).filter(
      function (x) {
        return (
          (x.mode || "personal") === mode &&
          String(x.person || "").toLowerCase() ===
            String(person).toLowerCase()
        );
      }
    );

    var give = records
      .filter(function (x) {
        return x.type === "give";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var receive = records
      .filter(function (x) {
        return x.type === "receive";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var balance = give - receive;

    setHTML(
      "detailPersonName",
      esc(person)
    );

    setHTML(
      "detailGive",
      money(give)
    );

    setHTML(
      "detailReceive",
      money(receive)
    );

    setHTML(
      "detailBalance",
      money(balance)
    );

    var history =
      $("khataHistory");

    if (!history) return;

    var filter =
      D.ui.detailFilter || "all";

    var filtered = records.filter(
      function (x) {
        return khataFilterMatch(
          x,
          filter
        );
      }
    );

    filtered.sort(function (a, b) {
      return String(b.date || "").localeCompare(
        String(a.date || "")
      );
    });

    if (!filtered.length) {
      history.innerHTML =
        '<div class="empty-state">No history found.</div>';
      return;
    }

    history.innerHTML = filtered
      .map(function (x) {
        var isGive =
          x.type === "give";

        return `
          <div class="data-card">
            <div style="display:flex;justify-content:space-between">
              <div>
                <strong>${esc(x.date || "")}</strong>
                <div>${esc(x.method || "")}</div>
                <div>${esc(x.status || "")}</div>
                ${
                  x.note
                    ? `<div>${esc(x.note)}</div>`
                    : ""
                }
              </div>

              <div style="font-weight:800;color:${
                isGive ? "#d63b3b" : "#159447"
              }">
                ${isGive ? "Give" : "Receive"}<br>
                ${money(x.amount)}
              </div>
            </div>

            <div style="margin-top:8px">
              <button type="button"
                onclick="editKhata('${x.id}')">
                Edit
              </button>

              <button type="button"
                onclick="deleteKhata('${x.id}');openKhataDetail('${esc(person).replace(/'/g, "\\'")}','${mode}')">
                Delete
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function closeKhataDetail() {
    show(
      D.ui.returnPage || "personal",
      false
    );
  }

  function detailFilter(
    filter,
    button
  ) {
    D.ui.detailFilter =
      filter || "all";

    if (button) {
      var parent = button.parentElement;

      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });
      }

      button.classList.add("active");
    }

    renderKhataDetail();
  }

  function openPaymentEntry() {
    var person =
      D.ui.selectedPerson || "";

    var amount = prompt(
      "Receive payment amount:"
    );

    if (amount === null) return;

    amount = safeNum(amount);

    if (amount <= 0) {
      notify("Valid amount enter karein.");
      return;
    }

    var method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    D.khata.push({
      id: uid("payment"),
      mode:
        D.ui.selectedMode === "business"
          ? "business"
          : "personal",
      person: person,
      type: "receive",
      amount: amount,
      date: today(),
      method: method,
      status: "settled",
      note: "Payment received",
      createdAt: Date.now()
    });

    save();
    renderKhataDetail();

    notify("Payment added.");
  }

  function shareKhata() {
    var person =
      D.ui.selectedPerson || "";

    var records = arr(D.khata).filter(
      function (x) {
        return (
          String(x.person || "").toLowerCase() ===
          String(person).toLowerCase() &&
          (x.mode || "personal") ===
            (D.ui.selectedMode || "personal")
        );
      }
    );

    var text =
      "HISAB — Udhar Statement\n" +
      "Person: " +
      person +
      "\n\n";

    records.forEach(function (x) {
      text +=
        (x.type === "give"
          ? "Give"
          : "Receive") +
        ": " +
        money(x.amount) +
        " | " +
        (x.date || "") +
        " | " +
        (x.method || "") +
        "\n";
    });

    if (
      navigator.share
    ) {
      navigator
        .share({
          title: "HISAB Statement",
          text: text
        })
        .catch(function () {});
    } else if (
      navigator.clipboard
    ) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          notify("Statement copied.");
        })
        .catch(function () {
          notify(text);
        });
    } else {
      notify(text);
    }
  }

  function exportKhataPDF() {
    try {
      window.print();
    } catch (e) {
      notify("Print/PDF option available nahi hai.");
    }
  }

  window.openKhataDetail = openKhataDetail;
  window.renderKhataDetail = renderKhataDetail;
  window.closeKhataDetail = closeKhataDetail;
  window.detailFilter = detailFilter;
  window.openPaymentEntry = openPaymentEntry;
  window.shareKhata = shareKhata;
  window.exportKhataPDF = exportKhataPDF;

  /* =========================================================
     BUSINESS CONTACTS
     ========================================================= */

  function addBusinessContact(role) {
    var name = prompt(
      role === "customer"
        ? "Customer name:"
        : "Supplier name:"
    );

    if (!name) return;

    name = name.trim();

    var exists = D.business.some(
      function (x) {
        return (
          String(x.name || "").toLowerCase() ===
            name.toLowerCase() &&
          x.role === role
        );
      }
    );

    if (!exists) {
      D.business.push({
        id: uid("contact"),
        name: name,
        role: role,
        phone: "",
        createdAt: Date.now()
      });

      save();
      renderBusiness();
    }
  }

  function addBusinessCustomer() {
    addBusinessContact("customer");
  }

  function addBusinessSupplier() {
    addBusinessContact("supplier");
  }

  function businessFilter(filter) {
    D.ui.businessFilter =
      filter || "customer";

    renderBusiness();
  }

  window.addBusinessCustomer =
    addBusinessCustomer;

  window.addBusinessSupplier =
    addBusinessSupplier;

  window.businessFilter =
    businessFilter;

  /* =========================================================
     BUSINESS SALES / PURCHASE
     ========================================================= */

  function addBusinessSale() {
    var customer = prompt(
      "Customer name:"
    );

    if (!customer) return;

    var item = prompt(
      "Product / item:"
    ) || "";

    var quantity = prompt(
      "Quantity:",
      "1"
    ) || "1";

    var amount = safeNum(
      prompt("Sale amount:")
    );

    if (amount <= 0) {
      notify("Valid sale amount enter karein.");
      return;
    }

    var date =
      prompt(
        "Date (YYYY-MM-DD):",
        today()
      ) || today();

    var method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    var status =
      prompt(
        "Status (completed/pending):",
        "completed"
      ) || "completed";

    var invoice =
      prompt(
        "Invoice / Bill no. (optional):",
        ""
      ) || "";

    var note =
      prompt(
        "Note (optional):",
        ""
      ) || "";

    D.sales.push({
      id: uid("sale"),
      mode: "business",
      customer: customer.trim(),
      item: item.trim(),
      quantity: quantity,
      amount: amount,
      date: date,
      method: method,
      status:
        status.toLowerCase() === "pending"
          ? "pending"
          : "completed",
      invoice: invoice,
      note: note,
      createdAt: Date.now()
    });

    ensureBusinessContact(
      customer,
      "customer"
    );

    save();
    renderBusiness();

    notify("Sale entry saved.");
  }

  function addBusinessPurchase() {
    var supplier = prompt(
      "Supplier name:"
    );

    if (!supplier) return;

    var item = prompt(
      "Product / item:"
    ) || "";

    var quantity = prompt(
      "Quantity:",
      "1"
    ) || "1";

    var amount = safeNum(
      prompt("Purchase amount:")
    );

    if (amount <= 0) {
      notify(
        "Valid purchase amount enter karein."
      );
      return;
    }

    var date =
      prompt(
        "Date (YYYY-MM-DD):",
        today()
      ) || today();

    var method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    var status =
      prompt(
        "Status (completed/pending):",
        "completed"
      ) || "completed";

    var invoice =
      prompt(
        "Invoice / Bill no. (optional):",
        ""
      ) || "";

    var note =
      prompt(
        "Note (optional):",
        ""
      ) || "";

    D.purchases.push({
      id: uid("purchase"),
      mode: "business",
      supplier: supplier.trim(),
      item: item.trim(),
      quantity: quantity,
      amount: amount,
      date: date,
      method: method,
      status:
        status.toLowerCase() === "pending"
          ? "pending"
          : "completed",
      invoice: invoice,
      note: note,
      createdAt: Date.now()
    });

    ensureBusinessContact(
      supplier,
      "supplier"
    );

    save();
    renderBusiness();

    notify("Purchase entry saved.");
  }

  function ensureBusinessContact(
    name,
    role
  ) {
    name = String(name || "").trim();

    if (!name) return;

    var exists = D.business.some(
      function (x) {
        return (
          String(x.name || "").toLowerCase() ===
            name.toLowerCase() &&
          x.role === role
        );
      }
    );

    if (!exists) {
      D.business.push({
        id: uid("contact"),
        name: name,
        role: role,
        phone: "",
        createdAt: Date.now()
      });
    }
  }

  function editBusinessEntry(
    type,
    id
  ) {
    var list =
      type === "sale"
        ? D.sales
        : D.purchases;

    var x = list.find(function (v) {
      return v.id === id;
    });

    if (!x) return;

    var party =
      type === "sale"
        ? x.customer
        : x.supplier;

    var newParty = prompt(
      type === "sale"
        ? "Customer name:"
        : "Supplier name:",
      party
    );

    if (!newParty) return;

    var item = prompt(
      "Product / item:",
      x.item || ""
    );

    var quantity = prompt(
      "Quantity:",
      x.quantity || "1"
    );

    var amount = safeNum(
      prompt(
        "Amount:",
        x.amount
      )
    );

    if (amount <= 0) return;

    var date = prompt(
      "Date:",
      x.date || today()
    );

    var method = prompt(
      "Payment method:",
      x.method || "Cash"
    );

    var status = prompt(
      "Status (completed/pending):",
      x.status || "completed"
    );

    var invoice = prompt(
      "Invoice / Bill no.:",
      x.invoice || ""
    );

    var note = prompt(
      "Note:",
      x.note || ""
    );

    if (type === "sale") {
      x.customer = newParty.trim();
    } else {
      x.supplier = newParty.trim();
    }

    x.item = item || "";
    x.quantity = quantity || "1";
    x.amount = amount;
    x.date = date || today();
    x.method = method || "Cash";
    x.status =
      String(status || "").toLowerCase() ===
      "pending"
        ? "pending"
        : "completed";
    x.invoice = invoice || "";
    x.note = note || "";
    x.updatedAt = Date.now();

    ensureBusinessContact(
      newParty,
      type === "sale"
        ? "customer"
        : "supplier"
    );

    save();
    renderBusiness();
  }

  function deleteBusinessEntry(
    type,
    id
  ) {
    if (
      !confirm(
        "Is entry ko delete karein?"
      )
    ) {
      return;
    }

    if (type === "sale") {
      D.sales = D.sales.filter(
        function (x) {
          return x.id !== id;
        }
      );
    } else {
      D.purchases = D.purchases.filter(
        function (x) {
          return x.id !== id;
        }
      );
    }

    save();
    renderBusiness();
  }

  window.addBusinessSale =
    addBusinessSale;

  window.addBusinessPurchase =
    addBusinessPurchase;

  window.editBusinessEntry =
    editBusinessEntry;

  window.deleteBusinessEntry =
    deleteBusinessEntry;

  /* =========================================================
     BUSINESS RENDER
     ========================================================= */

  function renderBusiness() {
    var list = $("businessList");

    var search =
      getValue("businessSearch").toLowerCase();

    var filter =
      D.ui.businessFilter ||
      "customer";

    var contacts = arr(D.business).filter(
      function (x) {
        return (
          x.role === filter &&
          (!search ||
            String(x.name || "")
              .toLowerCase()
              .indexOf(search) !== -1)
        );
      }
    );

    var give = arr(D.khata)
      .filter(function (x) {
        return (
          x.mode === "business" &&
          x.type === "give"
        );
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var receive = arr(D.khata)
      .filter(function (x) {
        return (
          x.mode === "business" &&
          x.type === "receive"
        );
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    setHTML(
      "businessGiven",
      money(give)
    );

    setHTML(
      "businessReceived",
      money(receive)
    );

    setHTML(
      "businessNet",
      money(give - receive)
    );

    if (!list) return;

    var html = "";

    if (contacts.length) {
      html += `
        <div class="data-card">
          <strong>${
            filter === "customer"
              ? "Customers"
              : "Suppliers"
          }</strong>
          ${contacts
            .map(function (c) {
              return `
                <div style="padding:9px 0;border-bottom:1px solid #eee">
                  <strong>${esc(c.name)}</strong>
                  <div>
                    ${
                      c.role === "customer"
                        ? "Customer"
                        : "Supplier"
                    }
                  </div>
                  <button type="button"
                    onclick="openKhataDetail('${esc(c.name).replace(/'/g, "\\'")}','business')">
                    History
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    var salesTotal = arr(D.sales)
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var purchaseTotal = arr(D.purchases)
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var pendingSales = arr(D.sales)
      .filter(function (x) {
        return x.status === "pending";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var pendingPurchases = arr(D.purchases)
      .filter(function (x) {
        return x.status === "pending";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    html += `
      <div class="data-card">
        <strong>Sales / Purchase Summary</strong>
        <div>Sales: ${money(salesTotal)}</div>
        <div>Purchase: ${money(purchaseTotal)}</div>
        <div>Pending Sales: ${money(pendingSales)}</div>
        <div>Pending Purchase: ${money(pendingPurchases)}</div>
        <div style="font-weight:800">
          Business Difference: ${money(
            salesTotal - purchaseTotal
          )}
        </div>
      </div>
    `;

    if (D.sales.length) {
      html += `
        <div class="data-card">
          <strong>Sales Entries</strong>
          ${D.sales
            .slice()
            .sort(function (a, b) {
              return String(b.date || "").localeCompare(
                String(a.date || "")
              );
            })
            .map(function (x) {
              return `
                <div style="padding:10px 0;border-bottom:1px solid #eee">
                  <div style="display:flex;justify-content:space-between">
                    <strong>${esc(x.customer)}</strong>
                    <strong style="color:#159447">
                      ${money(x.amount)}
                    </strong>
                  </div>
                  <div>
                    ${esc(x.item || "Sale")}
                    ${
                      x.quantity
                        ? " × " + esc(x.quantity)
                        : ""
                    }
                  </div>
                  <div>
                    ${esc(x.date || "")} •
                    ${esc(x.method || "")} •
                    ${esc(x.status || "")}
                  </div>
                  ${
                    x.invoice
                      ? `<div>Invoice: ${esc(x.invoice)}</div>`
                      : ""
                  }
                  ${
                    x.note
                      ? `<div>${esc(x.note)}</div>`
                      : ""
                  }
                  <button type="button"
                    onclick="editBusinessEntry('sale','${x.id}')">
                    Edit
                  </button>
                  <button type="button"
                    onclick="deleteBusinessEntry('sale','${x.id}')">
                    Delete
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (D.purchases.length) {
      html += `
        <div class="data-card">
          <strong>Purchase Entries</strong>
          ${D.purchases
            .slice()
            .sort(function (a, b) {
              return String(b.date || "").localeCompare(
                String(a.date || "")
              );
            })
            .map(function (x) {
              return `
                <div style="padding:10px 0;border-bottom:1px solid #eee">
                  <div style="display:flex;justify-content:space-between">
                    <strong>${esc(x.supplier)}</strong>
                    <strong style="color:#d63b3b">
                      ${money(x.amount)}
                    </strong>
                  </div>
                  <div>
                    ${esc(x.item || "Purchase")}
                    ${
                      x.quantity
                        ? " × " + esc(x.quantity)
                        : ""
                    }
                  </div>
                  <div>
                    ${esc(x.date || "")} •
                    ${esc(x.method || "")} •
                    ${esc(x.status || "")}
                  </div>
                  ${
                    x.invoice
                      ? `<div>Invoice: ${esc(x.invoice)}</div>`
                      : ""
                  }
                  ${
                    x.note
                      ? `<div>${esc(x.note)}</div>`
                      : ""
                  }
                  <button type="button"
                    onclick="editBusinessEntry('purchase','${x.id}')">
                    Edit
                  </button>
                  <button type="button"
                    onclick="deleteBusinessEntry('purchase','${x.id}')">
                    Delete
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (!contacts.length &&
        !D.sales.length &&
        !D.purchases.length) {
      html +=
        '<div class="empty-state">No business entries yet.</div>';
    }

    list.innerHTML = html;
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction() {
    var type =
      getValue("transactionType") ||
      "income";

    var amount = safeNum(
      getValue("transactionAmount")
    );

    if (amount <= 0) {
      notify("Valid amount enter karein.");
      return;
    }

    D.transactions.push({
      id: uid("txn"),
      mode: selectedMode(),
      type:
        type === "expense"
          ? "expense"
          : "income",
      amount: amount,
      category:
        getValue("transactionCategory") ||
        "General",
      note:
        getValue("transactionNote"),
      date:
        getValue("transactionDate") ||
        today(),
      createdAt: Date.now()
    });

    save();

    setValue("transactionAmount", "");
    setValue("transactionNote", "");

    renderAll();

    notify("Transaction added.");
  }

  function deleteTransaction(id) {
    if (!confirm("Delete transaction?")) {
      return;
    }

    D.transactions =
      D.transactions.filter(function (x) {
        return x.id !== id;
      });

    save();
    renderAll();
  }

  function renderTransactions() {
    var list =
      $("transactionList");

    if (!list) return;

    var records = arr(D.transactions)
      .filter(function (x) {
        return (
          (x.mode || "personal") ===
          selectedMode()
        );
      })
      .sort(function (a, b) {
        return String(b.date || "").localeCompare(
          String(a.date || "")
        );
      });

    if (!records.length) {
      list.innerHTML =
        '<div class="empty-state">No transactions yet.</div>';
      return;
    }

    list.innerHTML = records
      .map(function (x) {
        var income =
          x.type === "income";

        return `
          <div class="data-card">
            <div style="display:flex;justify-content:space-between">
              <div>
                <strong>${esc(x.category)}</strong>
                <div>${esc(x.date || "")}</div>
                <div>${esc(x.note || "")}</div>
              </div>

              <strong style="color:${
                income
                  ? "#159447"
                  : "#d63b3b"
              }">
                ${income ? "+" : "-"}${money(x.amount)}
              </strong>
            </div>

            <button type="button"
              onclick="deleteTransaction('${x.id}')">
              Delete
            </button>
          </div>
        `;
      })
      .join("");
  }

  window.addTransaction =
    addTransaction;

  window.deleteTransaction =
    deleteTransaction;

  /* =========================================================
     BUDGET
     ========================================================= */

  function calcBudget() {
    var amount = safeNum(
      getValue("budgetAmount")
    );

    if (amount < 0) {
      notify("Valid budget enter karein.");
      return;
    }

    D.budget = amount;

    save();
    renderPlanning();
    renderReports();

    notify("Budget saved.");
  }

  function getCurrentMonthExpense() {
    var month =
      today().slice(0, 7);

    return arr(D.transactions)
      .filter(function (x) {
        return (
          (x.mode || "personal") ===
            selectedMode() &&
          x.type === "expense" &&
          String(x.date || "").slice(0, 7) ===
            month
        );
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);
  }

  /* =========================================================
     GOALS
     ========================================================= */

  function calcGoal() {
    var name =
      getValue("goalName");

    var target = safeNum(
      getValue("goalTarget")
    );

    var saved = safeNum(
      getValue("goalSaved")
    );

    if (!name || target <= 0) {
      notify("Goal name aur target enter karein.");
      return;
    }

    D.goals.push({
      id: uid("goal"),
      mode: selectedMode(),
      name: name,
      target: target,
      saved: saved,
      date:
        getValue("goalDate") ||
        today(),
      createdAt: Date.now()
    });

    save();

    setValue("goalName", "");
    setValue("goalTarget", "");
    setValue("goalSaved", "");

    renderPlanning();

    notify("Goal added.");
  }

  function deleteGoal(id) {
    D.goals = D.goals.filter(
      function (x) {
        return x.id !== id;
      }
    );

    save();
    renderPlanning();
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function addBill() {
    var name =
      getValue("billName");

    var amount = safeNum(
      getValue("billAmount")
    );

    if (!name || amount <= 0) {
      notify("Bill name aur amount enter karein.");
      return;
    }

    D.bills.push({
      id: uid("bill"),
      mode: selectedMode(),
      name: name,
      amount: amount,
      due:
        getValue("billDue") ||
        today(),
      cardBill:
        getValue("cardBill"),
      cardDue:
        getValue("cardDue"),
      status: "pending",
      createdAt: Date.now()
    });

    save();

    setValue("billName", "");
    setValue("billAmount", "");

    renderCredit();

    notify("Bill added.");
  }

  function toggleBill(id) {
    var x = D.bills.find(
      function (v) {
        return v.id === id;
      }
    );

    if (!x) return;

    x.status =
      x.status === "paid"
        ? "pending"
        : "paid";

    save();
    renderCredit();
  }

  function deleteBill(id) {
    D.bills = D.bills.filter(
      function (x) {
        return x.id !== id;
      }
    );

    save();
    renderCredit();
  }

  /* =========================================================
     EMI / LOANS
     ========================================================= */

  function calcEMI() {
    var principal = safeNum(
      getValue("emiPrincipal")
    );

    var rate = safeNum(
      getValue("emiRate")
    );

    var months = safeNum(
      getValue("emiMonths")
    );

    if (
      principal <= 0 ||
      months <= 0
    ) {
      notify("Loan amount aur months enter karein.");
      return;
    }

    var r =
      rate > 0
        ? rate / 12 / 100
        : 0;

    var emi;

    if (r === 0) {
      emi = principal / months;
    } else {
      emi =
        principal *
        r *
        Math.pow(1 + r, months) /
        (Math.pow(1 + r, months) - 1);
    }

    setHTML(
      "emiResult",
      "<strong>Monthly EMI: " +
        money(emi) +
        "</strong>"
    );

    D.loans.push({
      id: uid("loan"),
      mode: selectedMode(),
      principal: principal,
      rate: rate,
      months: months,
      emi: emi,
      dueDate: today(),
      status: "pending",
      history: [],
      createdAt: Date.now()
    });

    save();
    renderCredit();
  }

  function toggleLoan(id) {
    var x = D.loans.find(
      function (v) {
        return v.id === id;
      }
    );

    if (!x) return;

    x.status =
      x.status === "paid"
        ? "pending"
        : "paid";

    x.history =
      arr(x.history);

    x.history.push({
      date: today(),
      status: x.status,
      amount: x.emi
    });

    save();
    renderCredit();
  }

  /* =========================================================
     REMINDERS
     ========================================================= */

  function addReminder() {
    var name =
      getValue("reminderName");

    var date =
      getValue("reminderDate");

    if (!name) {
      notify("Reminder name enter karein.");
      return;
    }

    D.reminders.push({
      id: uid("reminder"),
      mode: selectedMode(),
      name: name,
      date: date || today(),
      status: "pending",
      createdAt: Date.now()
    });

    save();

    setValue("reminderName", "");

    renderReminders();

    notify("Reminder added.");
  }

  function toggleReminder(id) {
    var x = D.reminders.find(
      function (v) {
        return v.id === id;
      }
    );

    if (!x) return;

    x.status =
      x.status === "done"
        ? "pending"
        : "done";

    save();
    renderReminders();
  }

  function deleteReminder(id) {
    D.reminders =
      D.reminders.filter(
        function (x) {
          return x.id !== id;
        }
      );

    save();
    renderReminders();
  }

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamilyMember() {
    var name =
      getValue("familyName");

    if (!name) {
      notify("Family member name enter karein.");
      return;
    }

    D.family.push({
      id: uid("family"),
      name: name,
      createdAt: Date.now()
    });

    save();
    setValue("familyName", "");
    renderFamily();
  }

  function deleteFamilyMember(id) {
    D.family = D.family.filter(
      function (x) {
        return x.id !== id;
      }
    );

    save();
    renderFamily();
  }

  /* =========================================================
     TOOLS
     ========================================================= */

  function calcFD() {
    var p = safeNum(
      getValue("fdPrincipal")
    );

    var r = safeNum(
      getValue("fdRate")
    );

    var n = safeNum(
      getValue("fdN")
    );

    if (p <= 0 || n <= 0) {
      notify("FD details enter karein.");
      return;
    }

    var maturity =
      p *
      Math.pow(
        1 + r / 100,
        n
      );

    setHTML(
      "fdResult",
      "<strong>Maturity: " +
        money(maturity) +
        "</strong>"
    );
  }

  function addInsurance() {
    addTool(
      "Insurance",
      prompt("Insurance name:") || ""
    );
  }

  function addSchool() {
    addTool(
      "School",
      prompt("School expense/name:") || ""
    );
  }

  function addVehicle() {
    addTool(
      "Vehicle",
      prompt("Vehicle expense/name:") || ""
    );
  }

  function addShopping() {
    addTool(
      "Shopping",
      prompt("Shopping item:") || ""
    );
  }

  function addUtility() {
    addTool(
      "Utility",
      prompt("Utility name:") || ""
    );
  }

  function calcEmergency() {
    var monthly = safeNum(
      prompt(
        "Monthly essential expense:"
      )
    );

    var months = safeNum(
      prompt(
        "Emergency months:",
        "6"
      )
    );

    if (
      monthly <= 0 ||
      months <= 0
    ) {
      return;
    }

    notify(
      "Emergency fund target: " +
        money(monthly * months)
    );
  }

  function addDoc() {
    addTool(
      "Document",
      prompt("Document name:") || ""
    );
  }

  function addAnnual() {
    addTool(
      "Annual Expense",
      prompt("Annual expense name:") || ""
    );
  }

  function addTool(type, name) {
    if (!name) return;

    D.tools.push({
      id: uid("tool"),
      type: type,
      name: name,
      createdAt: Date.now()
    });

    save();
    renderTools();
  }

  /* =========================================================
     RENDER PLANNING
     ========================================================= */

  function renderPlanning() {
    var list =
      $("goalList");

    var spent =
      getCurrentMonthExpense();

    var budget =
      safeNum(D.budget);

    var remaining =
      budget - spent;

    var percent =
      budget > 0
        ? Math.min(
            100,
            (spent / budget) * 100
          )
        : 0;

    var html = `
      <div class="data-card">
        <strong>Budget</strong>
        <div>Budget: ${money(budget)}</div>
        <div>Spent: ${money(spent)}</div>
        <div>Remaining: ${money(remaining)}</div>
        <div>Progress: ${percent.toFixed(1)}%</div>
        <div style="height:8px;background:#eee;border-radius:10px;margin-top:7px">
          <div style="height:8px;width:${percent}%;border-radius:10px;background:#2457d6"></div>
        </div>
      </div>
    `;

    var goals =
      arr(D.goals).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            selectedMode()
          );
        }
      );

    if (goals.length) {
      html += `
        <div class="data-card">
          <strong>Goals</strong>
          ${goals
            .map(function (x) {
              var pct =
                x.target > 0
                  ? Math.min(
                      100,
                      (safeNum(x.saved) /
                        safeNum(x.target)) *
                        100
                    )
                  : 0;

              return `
                <div style="padding:9px 0;border-bottom:1px solid #eee">
                  <strong>${esc(x.name)}</strong>
                  <div>
                    ${money(x.saved)} / ${money(x.target)}
                  </div>
                  <div>${pct.toFixed(1)}%</div>
                  <button type="button"
                    onclick="deleteGoal('${x.id}')">
                    Delete
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (list) {
      list.innerHTML = html;
    }
  }

  window.calcBudget =
    calcBudget;

  window.calcGoal =
    calcGoal;

  window.deleteGoal =
    deleteGoal;

  /* =========================================================
     RENDER CREDIT
     ========================================================= */

  function renderCredit() {
    var list =
      $("billList");

    if (!list) return;

    var bills = arr(D.bills).filter(
      function (x) {
        return (
          (x.mode || "personal") ===
          selectedMode()
        );
      }
    );

    var loans = arr(D.loans).filter(
      function (x) {
        return (
          (x.mode || "personal") ===
          selectedMode()
        );
      }
    );

    var html = "";

    if (bills.length) {
      html += `
        <div class="data-card">
          <strong>Bills</strong>
          ${bills
            .map(function (x) {
              return `
                <div style="padding:9px 0;border-bottom:1px solid #eee">
                  <strong>${esc(x.name)}</strong>
                  <div>${money(x.amount)}</div>
                  <div>Due: ${esc(x.due)}</div>
                  <div>Status: ${esc(x.status)}</div>

                  <button type="button"
                    onclick="toggleBill('${x.id}')">
                    Mark ${x.status === "paid" ? "Pending" : "Paid"}
                  </button>

                  <button type="button"
                    onclick="deleteBill('${x.id}')">
                    Delete
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (loans.length) {
      html += `
        <div class="data-card">
          <strong>Loans / EMI</strong>
          ${loans
            .map(function (x) {
              return `
                <div style="padding:9px 0;border-bottom:1px solid #eee">
                  <strong>Loan ${money(x.principal)}</strong>
                  <div>EMI: ${money(x.emi)}</div>
                  <div>Rate: ${esc(x.rate)}%</div>
                  <div>Tenure: ${esc(x.months)} months</div>
                  <div>Due: ${esc(x.dueDate)}</div>
                  <div>Status: ${esc(x.status)}</div>

                  <button type="button"
                    onclick="toggleLoan('${x.id}')">
                    Mark ${x.status === "paid" ? "Pending" : "Paid"}
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (!html) {
      html =
        '<div class="empty-state">No bills or loans yet.</div>';
    }

    list.innerHTML = html;
  }

  window.addBill = addBill;
  window.toggleBill = toggleBill;
  window.deleteBill = deleteBill;
  window.calcEMI = calcEMI;
  window.toggleLoan = toggleLoan;

  /* =========================================================
     RENDER REMINDERS
     ========================================================= */

  function renderReminders() {
    var list =
      $("reminderList");

    if (!list) return;

    var records =
      arr(D.reminders).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            selectedMode()
          );
        }
      );

    if (!records.length) {
      list.innerHTML =
        '<div class="empty-state">No reminders yet.</div>';
      return;
    }

    list.innerHTML = records
      .map(function (x) {
        return `
          <div class="data-card">
            <strong>${esc(x.name)}</strong>
            <div>${esc(x.date)}</div>
            <div>Status: ${esc(x.status)}</div>

            <button type="button"
              onclick="toggleReminder('${x.id}')">
              Mark ${x.status === "done" ? "Pending" : "Done"}
            </button>

            <button type="button"
              onclick="deleteReminder('${x.id}')">
              Delete
            </button>
          </div>
        `;
      })
      .join("");
  }

  window.addReminder =
    addReminder;

  window.toggleReminder =
    toggleReminder;

  window.deleteReminder =
    deleteReminder;

  /* =========================================================
     RENDER FAMILY
     ========================================================= */

  function renderFamily() {
    var list =
      $("familyList");

    if (!list) return;

    if (!D.family.length) {
      list.innerHTML =
        '<div class="empty-state">No family members added.</div>';
      return;
    }

    list.innerHTML =
      D.family
        .map(function (x) {
          return `
            <div class="data-card">
              <strong>${esc(x.name)}</strong>
              <button type="button"
                onclick="deleteFamilyMember('${x.id}')">
                Delete
              </button>
            </div>
          `;
        })
        .join("");
  }

  window.addFamilyMember =
    addFamilyMember;

  window.deleteFamilyMember =
    deleteFamilyMember;

  /* =========================================================
     RENDER TOOLS
     ========================================================= */

  function renderTools() {
    var list =
      $("tools13");

    if (!list) return;

    /* Do not replace complete tools page.
       Only render if a dedicated tool list exists. */
    var toolList =
      list.querySelector(".tool-list");

    if (!toolList) return;

    toolList.innerHTML =
      D.tools
        .map(function (x) {
          return `
            <div class="data-card">
              <strong>${esc(x.type)}</strong>
              <div>${esc(x.name)}</div>
            </div>
          `;
        })
        .join("");
  }

  window.calcFD = calcFD;
  window.addInsurance = addInsurance;
  window.addSchool = addSchool;
  window.addVehicle = addVehicle;
  window.addShopping = addShopping;
  window.addUtility = addUtility;
  window.calcEmergency = calcEmergency;
  window.addDoc = addDoc;
  window.addAnnual = addAnnual;

  /* =========================================================
     HOME
     ========================================================= */

  function renderHome() {
    var mode =
      selectedMode();

    var txns =
      arr(D.transactions).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            mode
          );
        }
      );

    var income = txns
      .filter(function (x) {
        return x.type === "income";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var expense = txns
      .filter(function (x) {
        return x.type === "expense";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var give = arr(D.khata)
      .filter(function (x) {
        return (
          (x.mode || "personal") === mode &&
          x.type === "give"
        );
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var receive = arr(D.khata)
      .filter(function (x) {
        return (
          (x.mode || "personal") === mode &&
          x.type === "receive"
        );
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    setHTML(
      "receivable",
      money(receive)
    );

    setHTML(
      "payable",
      money(give)
    );

    setHTML(
      "homeBalance",
      money(income - expense)
    );

    setHTML(
      "ledgerGiven",
      money(give)
    );

    setHTML(
      "ledgerReceived",
      money(receive)
    );

    setHTML(
      "ledgerNet",
      money(give - receive)
    );
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function renderReports() {
    var mode =
      selectedMode();

    var txns =
      arr(D.transactions).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            mode
          );
        }
      );

    var income = txns
      .filter(function (x) {
        return x.type === "income";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var expense = txns
      .filter(function (x) {
        return x.type === "expense";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var khata =
      D.khata.filter(function (x) {
        return (
          (x.mode || "personal") ===
          mode
        );
      });

    var give = khata
      .filter(function (x) {
        return x.type === "give";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    var receive = khata
      .filter(function (x) {
        return x.type === "receive";
      })
      .reduce(function (s, x) {
        return s + safeNum(x.amount);
      }, 0);

    setHTML(
      "reportIncome",
      money(income)
    );

    setHTML(
      "reportExpense",
      money(expense)
    );

    setHTML(
      "reportGive",
      money(give)
    );

    setHTML(
      "reportReceive",
      money(receive)
    );

    var content =
      $("reportContent");

    if (!content) return;

    var html = `
      <div class="data-card">
        <strong>${mode === "business" ? "Business" : "Personal"} Summary</strong>
        <div>Income: ${money(income)}</div>
        <div>Expense: ${money(expense)}</div>
        <div>Net Cash: ${money(income - expense)}</div>
        <div>Give: ${money(give)}</div>
        <div>Receive: ${money(receive)}</div>
        <div>Udhar Net: ${money(give - receive)}</div>
      </div>
    `;

    if (mode === "business") {
      var sales =
        arr(D.sales).reduce(
          function (s, x) {
            return s + safeNum(x.amount);
          },
          0
        );

      var purchases =
        arr(D.purchases).reduce(
          function (s, x) {
            return s + safeNum(x.amount);
          },
          0
        );

      html += `
        <div class="data-card">
          <strong>Business Sales / Purchase</strong>
          <div>Sales: ${money(sales)}</div>
          <div>Purchase: ${money(purchases)}</div>
          <div>Difference: ${money(sales - purchases)}</div>
        </div>
      `;
    }

    content.innerHTML = html;
  }

  /* =========================================================
     SEARCH ALL
     ========================================================= */

  function searchAllData() {
    var q =
      getValue("searchAll").toLowerCase();

    var list =
      $("searchResults");

    if (!list) return;

    if (!q) {
      list.innerHTML =
        '<div class="empty-state">Search something.</div>';
      return;
    }

    var results = [];

    D.transactions.forEach(
      function (x) {
        if (
          JSON.stringify(x)
            .toLowerCase()
            .indexOf(q) !== -1
        ) {
          results.push(
            "Transaction: " +
              (x.note || x.category || "")
          );
        }
      }
    );

    D.khata.forEach(
      function (x) {
        if (
          JSON.stringify(x)
            .toLowerCase()
            .indexOf(q) !== -1
        ) {
          results.push(
            "Udhar: " +
              x.person +
              " — " +
              money(x.amount)
          );
        }
      }
    );

    D.business.forEach(
      function (x) {
        if (
          JSON.stringify(x)
            .toLowerCase()
            .indexOf(q) !== -1
        ) {
          results.push(
            "Contact: " +
              x.name
          );
        }
      }
    );

    D.sales.forEach(
      function (x) {
        if (
          JSON.stringify(x)
            .toLowerCase()
            .indexOf(q) !== -1
        ) {
          results.push(
            "Sale: " +
              x.customer +
              " — " +
              money(x.amount)
          );
        }
      }
    );

    D.purchases.forEach(
      function (x) {
        if (
          JSON.stringify(x)
            .toLowerCase()
            .indexOf(q) !== -1
        ) {
          results.push(
            "Purchase: " +
              x.supplier +
              " — " +
              money(x.amount)
          );
        }
      }
    );

    if (!results.length) {
      list.innerHTML =
        '<div class="empty-state">No results.</div>';
      return;
    }

    list.innerHTML =
      results
        .map(function (x) {
          return `
            <div class="data-card">
              ${esc(x)}
            </div>
          `;
        })
        .join("");
  }

  window.searchAllData =
    searchAllData;

  /* =========================================================
     LANGUAGE / CURRENCY
     ========================================================= */

  function toggleLanguage() {
    D.language =
      D.language === "hi"
        ? "en"
        : "hi";

    document.documentElement.lang =
      D.language === "hi"
        ? "hi"
        : "en";

    save();

    notify(
      D.language === "hi"
        ? "Hindi selected."
        : "English selected."
    );
  }

  function toggleCurrency() {
    D.currency =
      D.currency === "₹"
        ? "$"
        : D.currency === "$"
        ? "€"
        : "₹";

    save();
    renderAll();

    notify(
      "Currency: " +
        D.currency
    );
  }

  window.toggleLanguage =
    toggleLanguage;

  window.toggleCurrency =
    toggleCurrency;

  /* =========================================================
     PIN / SECURITY
     ========================================================= */

  function setPin() {
    var pin =
      getValue("pinInput");

    if (!/^\d{4,6}$/.test(pin)) {
      notify(
        "4-6 digit PIN enter karein."
      );
      return;
    }

    D.pin = pin;

    save();

    setValue("pinInput", "");

    notify("PIN saved.");
  }

  function lockApp() {
    notify(
      "App locked. Security PIN saved hai. App reopen karne par PIN use karein."
    );
  }

  window.setPin = setPin;
  window.lockApp = lockApp;

  /* =========================================================
     BACKUP / RESTORE
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
        "HISAB-V7-backup-" +
        today() +
        ".json";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      notify(
        "Backup export nahi ho paaya."
      );
    }
  }

  function importBackup() {
    var input =
      document.createElement("input");

    input.type = "file";
    input.accept =
      "application/json,.json";

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
              D = normalizeData(
                JSON.parse(
                  reader.result
                )
              );

              window.D = D;

              save();

              renderAll();

              notify(
                "Backup restored."
              );
            } catch (e) {
              notify(
                "Invalid backup file."
              );
            }
          };

        reader.readAsText(file);
      };

    input.click();
  }

  window.exportBackup =
    exportBackup;

  window.importBackup =
    importBackup;

  /* =========================================================
     SUMMARY EXPORT
     ========================================================= */

  function makeSummaryText() {
    var mode =
      selectedMode();

    var txns =
      D.transactions.filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            mode
          );
        }
      );

    var income =
      txns
        .filter(function (x) {
          return x.type === "income";
        })
        .reduce(function (s, x) {
          return s + safeNum(x.amount);
        }, 0);

    var expense =
      txns
        .filter(function (x) {
          return x.type === "expense";
        })
        .reduce(function (s, x) {
          return s + safeNum(x.amount);
        }, 0);

    return (
      "HISAB V7 Summary\n" +
      "Mode: " +
      mode +
      "\n" +
      "Income: " +
      money(income) +
      "\n" +
      "Expense: " +
      money(expense) +
      "\n" +
      "Balance: " +
      money(income - expense) +
      "\n" +
      "Date: " +
      today()
    );
  }

  function exportSummary() {
    var text =
      makeSummaryText();

    if (
      navigator.share
    ) {
      navigator.share({
        title: "HISAB Summary",
        text: text
      }).catch(function () {});
    } else {
      notify(text);
    }
  }

  function exportSummaryPDF() {
    try {
      window.print();
    } catch (e) {
      notify(
        "PDF/Print unavailable."
      );
    }
  }

  window.exportSummary =
    exportSummary;

  window.exportSummaryPDF =
    exportSummaryPDF;

  /* =========================================================
     QUICK ADD
     ========================================================= */

  function openQuickAdd() {
    show("transactions");
  }

  window.openQuickAdd =
    openQuickAdd;

  /* =========================================================
     RENDER PERSONAL
     ========================================================= */

  function renderPersonal() {
    renderKhataList("personal");
  }

  /* =========================================================
     RENDER ALL
     ========================================================= */

  function renderAll() {
    try {
      renderHome();
    } catch (e) {
      console.error("renderHome:", e);
    }

    try {
      renderPersonal();
    } catch (e) {
      console.error("renderPersonal:", e);
    }

    try {
      renderBusiness();
    } catch (e) {
      console.error("renderBusiness:", e);
    }

    try {
      renderKhataDetail();
    } catch (e) {
      console.error("renderKhataDetail:", e);
    }

    try {
      renderTransactions();
    } catch (e) {
      console.error("renderTransactions:", e);
    }

    try {
      renderPlanning();
    } catch (e) {
      console.error("renderPlanning:", e);
    }

    try {
      renderCredit();
    } catch (e) {
      console.error("renderCredit:", e);
    }

    try {
      renderReports();
    } catch (e) {
      console.error("renderReports:", e);
    }

    try {
      renderReminders();
    } catch (e) {
      console.error("renderReminders:", e);
    }

    try {
      renderFamily();
    } catch (e) {
      console.error("renderFamily:", e);
    }

    try {
      renderTools();
    } catch (e) {
      console.error("renderTools:", e);
    }

    setValue(
      "budgetAmount",
      D.budget || ""
    );

    setValue(
      "transactionDate",
      getValue("transactionDate") ||
        today()
    );

    setValue(
      "goalDate",
      getValue("goalDate") ||
        today()
    );

    setValue(
      "billDue",
      getValue("billDue") ||
        today()
    );

    setValue(
      "reminderDate",
      getValue("reminderDate") ||
        today()
    );

    var p =
      $("personalModeBtn");

    var b =
      $("businessModeBtn");

    if (p) {
      p.classList.toggle(
        "active",
        D.mode === "personal"
      );
    }

    if (b) {
      b.classList.toggle(
        "active",
        D.mode === "business"
      );
    }

    var label =
      $("modeLabel");

    if (label) {
      label.textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }

    document.documentElement.lang =
      D.language === "en"
        ? "en"
        : "hi";
  }

  /* =========================================================
     SAFE STARTUP
     ========================================================= */

  function injectBackStyle() {
    if (
      $("hisab-back-style")
    ) {
      return;
    }

    var style =
      document.createElement("style");

    style.id =
      "hisab-back-style";

    style.textContent = `
      .hisab-auto-back{
        flex:0 0 auto !important;
        width:auto !important;
        min-width:72px !important;
        height:40px !important;
        padding:8px 12px !important;
        margin:0 10px 0 0 !important;
        border-radius:11px !important;
        background:#fff !important;
        color:#2457d6 !important;
        border:1px solid #dfe5ef !important;
        font-size:13px !important;
        font-weight:700 !important;
        box-shadow:0 3px 10px rgba(30,55,90,.06) !important;
        white-space:nowrap !important;
      }

      .hisab-auto-back:active{
        transform:scale(.96) !important;
      }

      .page-title{
        gap:8px;
      }
    `;

    document.head.appendChild(style);
  }

  function init() {
    try {
      injectBackStyle();

      showGuestGate();

      renderAll();

      prepareBackButtons();

      /*
       * If guest mode is already entered,
       * open home safely.
       */
      try {
        if (
          localStorage.getItem(
            GUEST_KEY
          ) === "1"
        ) {
          show(
            getPage(
              D.ui.lastPage
            )
              ? D.ui.lastPage
              : "home",
            false
          );
        }
      } catch (e) {
        show("home", false);
      }

      save();
    } catch (e) {
      console.error(
        "HISAB startup error:",
        e
      );

      /*
       * Emergency fallback.
       * Never leave the user on a blank screen.
       */
      try {
        if ($("guestGate")) {
          $("guestGate").style.display =
            "none";
        }

        if ($("appShell")) {
          $("appShell").style.display =
            "";
        }

        document
          .querySelectorAll(".page")
          .forEach(function (p) {
            p.style.display =
              "none";
            p.classList.remove(
              "active"
            );
          });

        if ($("home")) {
          $("home").style.display =
            "";
          $("home").classList.add(
            "active"
          );
        }
      } catch (x) {
        console.error(
          "Emergency fallback failed:",
          x
        );
      }
    }
  }

  /* =========================================================
     GLOBAL BACK API
     ========================================================= */

  window.HISAB_REPAIR = {
    back: goBack,

    home: function () {
      pageHistory = [];
      show(
        "home",
        false
      );
    }
  };

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
