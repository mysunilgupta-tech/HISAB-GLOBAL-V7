/* =========================================================
   HISAB V7 — STABLE APP CONTROLLER
   Compatible with supplied HISAB V7 index.html
   White-screen safe navigation
   Personal + Business separate
   Business Sales + Purchase
   Udhar / Transactions / Planning / Payments / Reports
   Local-first • Offline • No Login
   ========================================================= */

(function () {
  "use strict";

  const KEY = "hisab_v7_data";
  const GUEST_KEY = "hisab_v7_guest";

  const DEFAULT = {
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
      selectedMode: "personal"
    }
  };

  let D = loadData();

  /* =========================================================
     HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function makeId() {
    return Date.now().toString(36) +
      Math.random().toString(36).slice(2, 9);
  }

  function today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function money(value) {
    const n = Number(value) || 0;

    return (D.currency || "₹") +
      n.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT));
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function normalizeData(saved) {
    const base = cloneDefault();

    if (!saved || typeof saved !== "object") {
      return base;
    }

    const out = {
      ...base,
      ...saved
    };

    out.transactions = arr(saved.transactions);
    out.khata = arr(saved.khata);
    out.business = arr(saved.business);
    out.sales = arr(saved.sales);
    out.purchases = arr(saved.purchases);
    out.goals = arr(saved.goals);
    out.savings = arr(saved.savings);
    out.bills = arr(saved.bills);
    out.loans = arr(saved.loans);
    out.reminders = arr(saved.reminders);
    out.family = arr(saved.family);
    out.tools = arr(saved.tools);

    out.ui = {
      ...base.ui,
      ...(saved.ui && typeof saved.ui === "object"
        ? saved.ui
        : {})
    };

    out.mode =
      saved.mode === "business"
        ? "business"
        : "personal";

    out.currency =
      saved.currency || "₹";

    out.language =
      saved.language === "en"
        ? "en"
        : "hi";

    out.budget =
      Number(saved.budget) || 0;

    out.pin =
      typeof saved.pin === "string"
        ? saved.pin
        : "";

    return out;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(KEY);

      if (!raw) {
        return cloneDefault();
      }

      return normalizeData(JSON.parse(raw));

    } catch (e) {
      console.error("HISAB load error:", e);
      return cloneDefault();
    }
  }

  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(D)
      );
    } catch (e) {
      console.error("HISAB save error:", e);
    }

    window.D = D;
  }

  function msg(text) {
    window.alert(String(text));
  }

  function value(id, fallback) {
    const el = $(id);
    if (!el) return fallback == null ? "" : fallback;
    return el.value == null ? fallback : el.value;
  }

  function setValue(id, v) {
    const el = $(id);
    if (el) el.value = v == null ? "" : v;
  }

  /* =========================================================
     PAGE NAVIGATION — WHITE SCREEN SAFE
     ========================================================= */

  function pageId(name) {
    const aliases = {
      home: ["home", "homeScreen"],
      personal: ["personal", "personalScreen"],
      business: ["business", "businessScreen"],
      khataEntry: ["khataEntry", "khataForm"],
      khataDetail: ["khataDetail", "khataDetailScreen"],
      transactions: ["transactions", "transactionScreen"],
      planning: ["planning", "planningScreen"],
      credit: ["credit", "payments", "creditScreen"],
      reports: ["reports", "reportScreen"],
      reminders: ["reminders", "reminderScreen"],
      privacy: ["privacy", "security", "privacyScreen"],
      family: ["family", "familyScreen"],
      ads: ["ads", "adsScreen"],
      familytools: ["familytools", "familyTools"],
      tools13: ["tools13", "tools"],
      final: ["final", "settings", "more"]
    };

    const list =
      aliases[name] ||
      [name];

    for (let i = 0; i < list.length; i++) {
      if ($(list[i])) {
        return list[i];
      }
    }

    return null;
  }

  function getPages() {
    return Array.from(
      document.querySelectorAll(".page")
    );
  }

  function show(name) {
    try {
      const target = pageId(name);

      if (!target) {
        console.warn(
          "HISAB: page not found:",
          name
        );
        return false;
      }

      const pages = getPages();

      pages.forEach(function (p) {
        p.style.display = "none";
        p.classList.remove("active");
      });

      const page = $(target);

      if (!page) return false;

      page.style.display = "block";
      page.classList.add("active");

      D.ui.lastPage = name;

      renderAll();

      window.scrollTo(0, 0);

      return true;

    } catch (e) {
      console.error(
        "HISAB navigation error:",
        e
      );

      const home =
        $("home") ||
        $("homeScreen");

      if (home) {
        getPages().forEach(function (p) {
          p.style.display = "none";
          p.classList.remove("active");
        });

        home.style.display = "block";
        home.classList.add("active");
      }

      return false;
    }
  }

  function goHome() {
    show("home");
  }

  function back() {
    show("home");
  }

  /* =========================================================
     GUEST
     ========================================================= */

  function showGuestGate() {
    const gate = $("guestGate");
    const shell = $("appShell");

    if (!gate || !shell) return;

    const started =
      localStorage.getItem(GUEST_KEY);

    if (started === "1") {
      gate.style.display = "none";
      shell.style.display = "block";
      show("home");
    } else {
      gate.style.display = "flex";
      shell.style.display = "none";
    }
  }

  function enterGuestMode() {
    localStorage.setItem(
      GUEST_KEY,
      "1"
    );

    const gate = $("guestGate");
    const shell = $("appShell");

    if (gate) gate.style.display = "none";
    if (shell) shell.style.display = "block";

    show("home");
  }

  /* =========================================================
     PERSONAL / BUSINESS
     ========================================================= */

  function setMode(mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.selectedMode = D.mode;

    save();

    const p = $("personalModeBtn");
    const b = $("businessModeBtn");
    const label = $("modeLabel");

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

    if (label) {
      label.textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction() {
    const type =
      value(
        "transactionType",
        "expense"
      );

    const amount =
      parseFloat(
        value("transactionAmount", "")
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      msg("Please enter a valid amount.");
      return;
    }

    const category =
      String(
        value(
          "transactionCategory",
          ""
        )
      ).trim() || "General";

    const note =
      String(
        value("transactionNote", "")
      ).trim();

    const date =
      value(
        "transactionDate",
        today()
      ) || today();

    D.transactions.push({
      id: makeId(),
      mode: D.mode,
      type: type,
      amount: amount,
      category: category,
      note: note,
      date: date,
      createdAt: Date.now()
    });

    save();

    setValue("transactionAmount", "");
    setValue("transactionCategory", "");
    setValue("transactionNote", "");

    renderAll();

    msg("Transaction added.");
  }

  function deleteTransaction(txId) {
    D.transactions =
      D.transactions.filter(
        x => x.id !== txId
      );

    save();
    renderAll();
  }

  function renderTransactions() {
    const list = $("transactionList");
    if (!list) return;

    const rows =
      D.transactions
        .filter(
          x =>
            (x.mode || "personal") === D.mode
        )
        .slice()
        .sort(
          (a, b) =>
            String(b.date)
              .localeCompare(
                String(a.date)
              )
        );

    if (!rows.length) {
      list.innerHTML =
        '<div class="empty-state">No transactions yet.</div>';
      return;
    }

    let html = "";

    rows.forEach(function (x) {
      html += `
        <div class="list-item">
          <strong>
            ${x.type === "income"
              ? "💰 Income"
              : "💸 Expense"}
          </strong>

          <div>${money(x.amount)}</div>

          <small>
            ${esc(x.date)}
            • ${esc(x.category)}
          </small>

          ${
            x.note
              ? `<p>${esc(x.note)}</p>`
              : ""
          }

          <button
            type="button"
            onclick="deleteTransaction('${esc(x.id)}')">
            🗑 Delete
          </button>
        </div>
      `;
    });

    list.innerHTML = html;
  }

  /* =========================================================
     UDHAR
     ========================================================= */

  function openKhataForm(mode) {
    D.ui.selectedMode =
      mode === "business"
        ? "business"
        : "personal";

    const page =
      $("khataEntry");

    if (!page) return;

    show("khataEntry");

    setValue(
      "khataDate",
      today()
    );

    const person =
      $("khataPerson");

    if (person) {
      setTimeout(
        () => person.focus(),
        50
      );
    }
  }

  function closeKhataForm() {
    show(
      D.ui.selectedMode === "business"
        ? "business"
        : "personal"
    );
  }

  function saveKhataEntry() {
    const person =
      String(
        value("khataPerson", "")
      ).trim();

    const type =
      value(
        "khataType",
        "give"
      );

    const amount =
      parseFloat(
        value("khataAmount", "")
      );

    if (!person) {
      msg("Please enter name.");
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      msg("Please enter valid amount.");
      return;
    }

    const mode =
      D.ui.selectedMode ||
      D.mode;

    const date =
      value(
        "khataDate",
        today()
      ) || today();

    const method =
      value(
        "khataMethod",
        "Cash"
      );

    const status =
      value(
        "khataStatus",
        "pending"
      );

    const note =
      String(
        value("khataNote", "")
      ).trim();

    D.khata.push({
      id: makeId(),
      mode: mode,
      person: person,
      type: type,
      amount: amount,
      date: date,
      method: method,
      status: status,
      note: note,
      createdAt: Date.now()
    });

    save();

    setValue("khataPerson", "");
    setValue("khataAmount", "");
    setValue("khataNote", "");

    renderAll();

    show(
      mode === "business"
        ? "business"
        : "personal"
    );

    msg("Udhar entry saved.");
  }

  function currentKhata(mode) {
    return D.khata.filter(
      x =>
        (x.mode || "personal") === mode
    );
  }

  function deleteKhata(kid) {
    D.khata =
      D.khata.filter(
        x => x.id !== kid
      );

    save();
    renderAll();
  }

  function searchKhata(mode) {
    if (mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }
  }

  function filterKhata(
    mode,
    filter,
    button
  ) {
    D.ui.khataFilter =
      filter || "all";

    document.querySelectorAll(
      ".filter-row button"
    ).forEach(function (b) {
      b.classList.remove("active");
    });

    if (button) {
      button.classList.add("active");
    }

    if (mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }
  }

  function openKhataDetail(
    person,
    mode
  ) {
    D.ui.selectedPerson =
      String(person || "");

    D.ui.selectedMode =
      mode === "business"
        ? "business"
        : "personal";

    show("khataDetail");
  }

  function closeKhataDetail() {
    show(
      D.ui.selectedMode === "business"
        ? "business"
        : "personal"
    );
  }

  function detailFilter(
    filter,
    button
  ) {
    D.ui.detailFilter =
      filter || "all";

    document.querySelectorAll(
      "#khataDetail .filter-row button"
    ).forEach(function (b) {
      b.classList.remove("active");
    });

    if (button) {
      button.classList.add("active");
    }

    renderKhataDetail();
  }

  function renderPersonal() {
    const list =
      $("personalList");

    const mode = "personal";

    let rows =
      currentKhata(mode);

    const search =
      String(
        value("personalSearch", "")
      )
        .trim()
        .toLowerCase();

    const filter =
      D.ui.khataFilter || "all";

    if (search) {
      rows =
        rows.filter(
          x =>
            `${x.person} ${x.note} ${x.type} ${x.amount}`
              .toLowerCase()
              .includes(search)
        );
    }

    if (
      filter !== "all" &&
      filter !== "pending"
    ) {
      rows =
        rows.filter(
          x => x.type === filter
        );
    }

    if (filter === "pending") {
      rows =
        rows.filter(
          x => x.status === "pending"
        );
    }

    let give = 0;
    let receive = 0;

    currentKhata(mode).forEach(
      function (x) {
        if (x.type === "give") {
          give += Number(x.amount) || 0;
        }

        if (x.type === "receive") {
          receive += Number(x.amount) || 0;
        }
      }
    );

    if ($("ledgerGiven"))
      $("ledgerGiven").textContent =
        money(give);

    if ($("ledgerReceived"))
      $("ledgerReceived").textContent =
        money(receive);

    if ($("ledgerNet"))
      $("ledgerNet").textContent =
        money(give - receive);

    if (!list) return;

    rows =
      rows.slice().sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );

    if (!rows.length) {
      list.innerHTML =
        '<div class="empty-state">No Udhar entries yet.</div>';
      return;
    }

    let html = "";

    rows.forEach(function (x) {
      const cls =
        x.type === "give"
          ? "give-entry"
          : "receive-entry";

      html += `
        <div class="list-item ${cls}">
          <strong>
            ${x.type === "give"
              ? "🔴 Give"
              : "🟢 Receive"}
            — ${esc(x.person)}
          </strong>

          <div>
            ${money(x.amount)}
          </div>

          <small>
            ${esc(x.date)}
            • ${esc(x.method || "Cash")}
            • ${esc(x.status || "pending")}
          </small>

          ${
            x.note
              ? `<p>${esc(x.note)}</p>`
              : ""
          }

          <button
            type="button"
            onclick="openKhataDetail('${esc(x.person)}','personal')">
            📒 History
          </button>

          <button
            type="button"
            onclick="deleteKhata('${esc(x.id)}')">
            🗑 Delete
          </button>
        </div>
      `;
    });

    list.innerHTML = html;
  }

  function renderKhataDetail() {
    const person =
      D.ui.selectedPerson;

    const mode =
      D.ui.selectedMode ||
      D.mode;

    const page =
      $("khataDetail");

    if (!page || !person) return;

    let rows =
      currentKhata(mode)
        .filter(
          x => x.person === person
        );

    let give = 0;
    let receive = 0;

    rows.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    if ($("detailPersonName"))
      $("detailPersonName").textContent =
        person;

    if ($("detailGive"))
      $("detailGive").textContent =
        money(give);

    if ($("detailReceive"))
      $("detailReceive").textContent =
        money(receive);

    if ($("detailBalance"))
      $("detailBalance").textContent =
        money(give - receive);

    const filter =
      D.ui.detailFilter || "all";

    if (filter === "give") {
      rows =
        rows.filter(
          x => x.type === "give"
        );
    }

    if (filter === "receive") {
      rows =
        rows.filter(
          x => x.type === "receive"
        );
    }

    if (filter === "pending") {
      rows =
        rows.filter(
          x => x.status === "pending"
        );
    }

    const history =
      $("khataHistory");

    if (!history) return;

    rows =
      rows.slice().sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );

    if (!rows.length) {
      history.innerHTML =
        '<div class="empty-state">No history found.</div>';
      return;
    }

    history.innerHTML =
      rows.map(function (x) {
        return `
          <div class="list-item">
            <strong>
              ${x.type === "give"
                ? "🔴 Give"
                : "🟢 Receive"}
              ${money(x.amount)}
            </strong>

            <small>
              ${esc(x.date)}
              • ${esc(x.method || "Cash")}
              • ${esc(x.status || "pending")}
            </small>

            ${
              x.note
                ? `<p>${esc(x.note)}</p>`
                : ""
            }

            <button
              type="button"
              onclick="deleteKhata('${esc(x.id)}')">
              🗑 Delete
            </button>
          </div>
        `;
      }).join("");
  }

  /* =========================================================
     BUSINESS CONTACTS
     ========================================================= */

  function addBusinessCustomer() {
    addBusinessContact("customer");
  }

  function addBusinessSupplier() {
    addBusinessContact("supplier");
  }

  function addBusinessContact(type) {
    const label =
      type === "supplier"
        ? "Supplier Name:"
        : "Customer Name:";

    const raw =
      window.prompt(label);

    if (!raw || !raw.trim()) return;

    const name =
      raw.trim();

    D.business.push({
      id: makeId(),
      type: type,
      name: name,
      createdAt: Date.now()
    });

    save();

    D.ui.businessFilter =
      type;

    renderBusiness();

    msg(
      type === "supplier"
        ? "Supplier added."
        : "Customer added."
    );
  }

  function deleteBusinessContact(id) {
    D.business =
      D.business.filter(
        x => x.id !== id
      );

    save();
    renderBusiness();
  }

  /* =========================================================
     BUSINESS SALES
     ========================================================= */

  function addBusinessSale() {
    const customer =
      window.prompt(
        "Customer Name:"
      );

    if (
      !customer ||
      !customer.trim()
    ) return;

    const item =
      window.prompt(
        "Item / Product Name:",
        ""
      ) || "";

    const amount =
      parseFloat(
        window.prompt(
          "Sale Amount:",
          "0"
        )
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      msg(
        "Please enter a valid Sale Amount."
      );
      return;
    }

    const date =
      window.prompt(
        "Sale Date:",
        today()
      ) || today();

    const method =
      window.prompt(
        "Payment Method:",
        "Cash"
      ) || "Cash";

    const statusInput =
      window.prompt(
        "Status (completed / pending):",
        "completed"
      ) || "completed";

    const status =
      statusInput
        .toLowerCase()
        .trim() === "pending"
        ? "pending"
        : "completed";

    const invoice =
      window.prompt(
        "Invoice / Reference:",
        ""
      ) || "";

    const note =
      window.prompt(
        "Sale Note:",
        ""
      ) || "";

    D.sales.push({
      id: makeId(),
      mode: "business",
      customer:
        customer.trim(),
      item: item.trim(),
      amount: amount,
      date: date,
      method: method.trim(),
      status: status,
      invoice: invoice.trim(),
      note: note.trim(),
      createdAt: Date.now()
    });

    /* Automatically create customer if missing */

    const exists =
      D.business.some(
        x =>
          x.type === "customer" &&
          String(x.name)
            .toLowerCase() ===
          customer
            .trim()
            .toLowerCase()
      );

    if (!exists) {
      D.business.push({
        id: makeId(),
        type: "customer",
        name: customer.trim(),
        createdAt: Date.now()
      });
    }

    save();

    D.ui.businessFilter =
      "sales";

    renderBusiness();

    msg(
      "Business Sale entry added successfully."
    );
  }

  function deleteBusinessSale(id) {
    D.sales =
      D.sales.filter(
        x => x.id !== id
      );

    save();
    renderBusiness();
  }

  /* =========================================================
     BUSINESS PURCHASE
     ========================================================= */

  function addBusinessPurchase() {
    const supplier =
      window.prompt(
        "Supplier Name:"
      );

    if (
      !supplier ||
      !supplier.trim()
    ) return;

    const item =
      window.prompt(
        "Item / Product Name:",
        ""
      ) || "";

    const amount =
      parseFloat(
        window.prompt(
          "Purchase Amount:",
          "0"
        )
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      msg(
        "Please enter a valid Purchase Amount."
      );
      return;
    }

    const date =
      window.prompt(
        "Purchase Date:",
        today()
      ) || today();

    const method =
      window.prompt(
        "Payment Method:",
        "Cash"
      ) || "Cash";

    const statusInput =
      window.prompt(
        "Status (completed / pending):",
        "completed"
      ) || "completed";

    const status =
      statusInput
        .toLowerCase()
        .trim() === "pending"
        ? "pending"
        : "completed";

    const invoice =
      window.prompt(
        "Bill / Invoice Reference:",
        ""
      ) || "";

    const note =
      window.prompt(
        "Purchase Note:",
        ""
      ) || "";

    D.purchases.push({
      id: makeId(),
      mode: "business",
      supplier:
        supplier.trim(),
      item: item.trim(),
      amount: amount,
      date: date,
      method: method.trim(),
      status: status,
      invoice: invoice.trim(),
      note: note.trim(),
      createdAt: Date.now()
    });

    const exists =
      D.business.some(
        x =>
          x.type === "supplier" &&
          String(x.name)
            .toLowerCase() ===
          supplier
            .trim()
            .toLowerCase()
      );

    if (!exists) {
      D.business.push({
        id: makeId(),
        type: "supplier",
        name: supplier.trim(),
        createdAt: Date.now()
      });
    }

    save();

    D.ui.businessFilter =
      "purchase";

    renderBusiness();

    msg(
      "Business Purchase entry added successfully."
    );
  }

  function deleteBusinessPurchase(id) {
    D.purchases =
      D.purchases.filter(
        x => x.id !== id
      );

    save();
    renderBusiness();
  }

  /* =========================================================
     BUSINESS FILTER
     ========================================================= */

  function businessFilter(
    filter,
    button
  ) {
    D.ui.businessFilter =
      filter || "customer";

    document.querySelectorAll(
      ".business-tabs button"
    ).forEach(function (b) {
      b.classList.remove("active");
    });

    if (button) {
      button.classList.add("active");
    }

    renderBusiness();
  }

  /* =========================================================
     BUSINESS RENDER
     ========================================================= */

  function renderBusiness() {
    const list =
      $("businessList");

    if (!list) return;

    const filter =
      D.ui.businessFilter ||
      "customer";

    const search =
      String(
        value("businessSearch", "")
      )
        .trim()
        .toLowerCase();

    let html = "";

    /* ---------------- SALES ---------------- */

    if (filter === "sales") {
      let rows =
        D.sales.slice();

      if (search) {
        rows =
          rows.filter(function (x) {
            return `
              ${x.customer}
              ${x.item}
              ${x.amount}
              ${x.date}
              ${x.method}
              ${x.status}
              ${x.invoice}
              ${x.note}
            `
              .toLowerCase()
              .includes(search);
          });
      }

      const total =
        rows.reduce(
          (sum, x) =>
            sum + (Number(x.amount) || 0),
          0
        );

      html += `
        <div class="summary-card">
          <small>Total Sales</small>
          <strong>${money(total)}</strong>
        </div>

        <button
          type="button"
          onclick="addBusinessSale()">
          ➕ Add Sale
        </button>
      `;

      rows.sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );

      if (!rows.length) {
        html += `
          <div class="empty-state">
            No sales entries yet.
          </div>
        `;
      }

      rows.forEach(function (x) {
        html += `
          <div class="list-item">
            <strong>
              🛒 ${esc(x.customer)}
            </strong>

            <div>
              ${money(x.amount)}
            </div>

            ${
              x.item
                ? `<small>Item: ${esc(x.item)}</small>`
                : ""
            }

            <small>
              ${esc(x.date)}
              • ${esc(x.method)}
              • ${esc(x.status)}
            </small>

            ${
              x.invoice
                ? `<small>Ref: ${esc(x.invoice)}</small>`
                : ""
            }

            ${
              x.note
                ? `<p>${esc(x.note)}</p>`
                : ""
            }

            <button
              type="button"
              onclick="deleteBusinessSale('${esc(x.id)}')">
              🗑 Delete
            </button>
          </div>
        `;
      });

      list.innerHTML = html;
      return;
    }

    /* ---------------- PURCHASE ---------------- */

    if (filter === "purchase") {
      let rows =
        D.purchases.slice();

      if (search) {
        rows =
          rows.filter(function (x) {
            return `
              ${x.supplier}
              ${x.item}
              ${x.amount}
              ${x.date}
              ${x.method}
              ${x.status}
              ${x.invoice}
              ${x.note}
            `
              .toLowerCase()
              .includes(search);
          });
      }

      const total =
        rows.reduce(
          (sum, x) =>
            sum + (Number(x.amount) || 0),
          0
        );

      html += `
        <div class="summary-card">
          <small>Total Purchase</small>
          <strong>${money(total)}</strong>
        </div>

        <button
          type="button"
          onclick="addBusinessPurchase()">
          ➕ Add Purchase
        </button>
      `;

      rows.sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );

      if (!rows.length) {
        html += `
          <div class="empty-state">
            No purchase entries yet.
          </div>
        `;
      }

      rows.forEach(function (x) {
        html += `
          <div class="list-item">
            <strong>
              📦 ${esc(x.supplier)}
            </strong>

            <div>
              ${money(x.amount)}
            </div>

            ${
              x.item
                ? `<small>Item: ${esc(x.item)}</small>`
                : ""
            }

            <small>
              ${esc(x.date)}
              • ${esc(x.method)}
              • ${esc(x.status)}
            </small>

            ${
              x.invoice
                ? `<small>Ref: ${esc(x.invoice)}</small>`
                : ""
            }

            ${
              x.note
                ? `<p>${esc(x.note)}</p>`
                : ""
            }

            <button
              type="button"
              onclick="deleteBusinessPurchase('${esc(x.id)}')">
              🗑 Delete
            </button>
          </div>
        `;
      });

      list.innerHTML = html;
      return;
    }

    /* ---------------- CUSTOMER / SUPPLIER ---------------- */

    const role =
      filter === "supplier"
        ? "supplier"
        : "customer";

    const contacts =
      D.business.filter(
        x =>
          x.type === role &&
          (
            !search ||
            String(x.name)
              .toLowerCase()
              .includes(search)
          )
      );

    html += `
      <button
        type="button"
        onclick="${
          role === "customer"
            ? "addBusinessCustomer()"
            : "addBusinessSupplier()"
        }">
        ➕ Add ${
          role === "customer"
            ? "Customer"
            : "Supplier"
        }
      </button>
    `;

    if (!contacts.length) {
      html += `
        <div class="empty-state">
          No ${role} entries yet.
        </div>
      `;
    }

    contacts.forEach(function (c) {
      let give = 0;
      let receive = 0;

      D.khata
        .filter(
          x =>
            x.mode === "business" &&
            x.person === c.name
        )
        .forEach(function (x) {
          if (x.type === "give") {
            give += Number(x.amount) || 0;
          }

          if (x.type === "receive") {
            receive += Number(x.amount) || 0;
          }
        });

      let salesTotal = 0;
      let purchaseTotal = 0;

      if (role === "customer") {
        D.sales
          .filter(
            x => x.customer === c.name
          )
          .forEach(function (x) {
            salesTotal +=
              Number(x.amount) || 0;
          });
      }

      if (role === "supplier") {
        D.purchases
          .filter(
            x => x.supplier === c.name
          )
          .forEach(function (x) {
            purchaseTotal +=
              Number(x.amount) || 0;
          });
      }

      html += `
        <div class="list-item">
          <strong>
            ${
              role === "customer"
                ? "👤"
                : "🚚"
            }
            ${esc(c.name)}
          </strong>

          ${
            role === "customer"
              ? `<small>Total Sales: ${money(salesTotal)}</small>`
              : `<small>Total Purchase: ${money(purchaseTotal)}</small>`
          }

          <small>
            Give: ${money(give)}
            • Receive: ${money(receive)}
          </small>

          <button
            type="button"
            onclick="openKhataDetail('${esc(c.name)}','business')">
            📒 History
          </button>

          <button
            type="button"
            onclick="deleteBusinessContact('${esc(c.id)}')">
            🗑 Delete
          </button>
        </div>
      `;
    });

    list.innerHTML = html;
  }

  /* =========================================================
     BUDGET
     ========================================================= */

  function calcBudget() {
    const amount =
      parseFloat(
        value("budgetAmount", "")
      );

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      msg("Please enter valid budget.");
      return;
    }

    D.budget = amount;

    save();
    renderAll();

    msg("Budget saved.");
  }

  /* =========================================================
     GOALS
     ========================================================= */

  function calcGoal() {
    const name =
      String(
        value("goalName", "")
      ).trim();

    const target =
      parseFloat(
        value("goalTarget", "")
      );

    const saved =
      parseFloat(
        value("goalSaved", "0")
      ) || 0;

    const date =
      value("goalDate", "") ||
      today();

    if (!name) {
      msg("Enter goal name.");
      return;
    }

    if (
      !Number.isFinite(target) ||
      target <= 0
    ) {
      msg("Enter valid target.");
      return;
    }

    D.goals.push({
      id: makeId(),
      mode: D.mode,
      name: name,
      target: target,
      saved: saved,
      date: date,
      createdAt: Date.now()
    });

    save();

    setValue("goalName", "");
    setValue("goalTarget", "");
    setValue("goalSaved", "");

    renderAll();

    msg("Goal saved.");
  }

  function renderGoals() {
    const list =
      $("goalList");

    if (!list) return;

    const rows =
      D.goals.filter(
        x =>
          !x.mode ||
          x.mode === D.mode
      );

    if (!rows.length) {
      list.innerHTML =
        '<div class="empty-state">No goals yet.</div>';
      return;
    }

    list.innerHTML =
      rows.map(function (x) {
        const percent =
          x.target > 0
            ? Math.min(
                100,
                (Number(x.saved) /
                  Number(x.target)) *
                  100
              )
            : 0;

        return `
          <div class="list-item">
            <strong>
              🎯 ${esc(x.name)}
            </strong>

            <div>
              ${money(x.saved)}
              / ${money(x.target)}
            </div>

            <small>
              ${percent.toFixed(0)}% complete
              • ${esc(x.date || "")}
            </small>
          </div>
        `;
      }).join("");
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function addBill(type) {
    let name;
    let amount;
    let due;

    if (type === "Credit Card") {
      name = "Credit Card";
      amount =
        parseFloat(
          value("cardBill", "")
        );
      due =
        value("cardDue", "") ||
        today();
    } else {
      name =
        String(
          value("billName", "")
        ).trim();

      amount =
        parseFloat(
          value("billAmount", "")
        );

      due =
        value("billDue", "") ||
        today();
    }

    if (!name) {
      name = type;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      msg("Enter valid bill amount.");
      return;
    }

    D.bills.push({
      id: makeId(),
      mode: D.mode,
      name: name,
      type: type,
      amount: amount,
      due: due,
      status: "pending",
      history: [],
      createdAt: Date.now()
    });

    save();
    renderAll();

    msg("Bill added.");
  }

  function renderBills() {
    const list =
      $("billList");

    if (!list) return;

    if (!D.bills.length) {
      list.innerHTML =
        '<div class="empty-state">No bills yet.</div>';
      return;
    }

    list.innerHTML =
      D.bills.map(function (x) {
        return `
          <div class="list-item">
            <strong>
              💳 ${esc(x.name)}
            </strong>

            <div>${money(x.amount)}</div>

            <small>
              ${esc(x.type)}
              • Due ${esc(x.due)}
              • ${esc(x.status)}
            </small>
          </div>
        `;
      }).join("");
  }

  /* =========================================================
     EMI
     ========================================================= */

  function calcEMI() {
    const principal =
      parseFloat(
        value("emiPrincipal", "")
      );

    const rate =
      parseFloat(
        value("emiRate", "")
      ) || 0;

    const months =
      parseInt(
        value("emiMonths", ""),
        10
      );

    if (
      !Number.isFinite(principal) ||
      principal <= 0 ||
      !Number.isFinite(months) ||
      months <= 0
    ) {
      msg(
        "Please enter valid loan details."
      );
      return;
    }

    const monthlyRate =
      rate / 12 / 100;

    let emi;

    if (monthlyRate === 0) {
      emi =
        principal / months;
    } else {
      emi =
        principal *
        monthlyRate *
        Math.pow(
          1 + monthlyRate,
          months
        ) /
        (
          Math.pow(
            1 + monthlyRate,
            months
          ) - 1
        );
    }

    const result =
      $("emiResult");

    if (result) {
      result.innerHTML = `
        <div class="summary-card">
          <small>Monthly EMI</small>
          <strong>${money(emi)}</strong>
        </div>

        <div>
          Total Payment:
          <strong>
            ${money(emi * months)}
          </strong>
        </div>
      `;
    }

    D.loans.push({
      id: makeId(),
      mode: D.mode,
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
  }

  /* =========================================================
     REMINDERS
     ========================================================= */

  function addReminder() {
    const name =
      String(
        value("reminderName", "")
      ).trim();

    const date =
      value(
        "reminderDate",
        ""
      ) || today();

    if (!name) {
      msg("Enter reminder.");
      return;
    }

    D.reminders.push({
      id: makeId(),
      name: name,
      date: date,
      createdAt: Date.now()
    });

    save();

    setValue(
      "reminderName",
      ""
    );

    renderAll();

    msg("Reminder added.");
  }

  function renderReminders() {
    const list =
      $("reminderList");

    if (!list) return;

    if (!D.reminders.length) {
      list.innerHTML =
        '<div class="empty-state">No reminders yet.</div>';
      return;
    }

    list.innerHTML =
      D.reminders.map(function (x) {
        return `
          <div class="list-item">
            <strong>🔔 ${esc(x.name)}</strong>
            <small>${esc(x.date)}</small>
          </div>
        `;
      }).join("");
  }

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamilyMember() {
    const name =
      String(
        value("familyName", "")
      ).trim();

    if (!name) {
      msg(
        "Enter family member name."
      );
      return;
    }

    D.family.push({
      id: makeId(),
      name: name,
      createdAt: Date.now()
    });

    save();

    setValue(
      "familyName",
      ""
    );

    renderAll();
  }

  function renderFamily() {
    const list =
      $("familyList");

    if (!list) return;

    if (!D.family.length) {
      list.innerHTML =
        '<div class="empty-state">No family members yet.</div>';
      return;
    }

    list.innerHTML =
      D.family.map(function (x) {
        return `
          <div class="list-item">
            👨‍👩‍👧
            <strong>${esc(x.name)}</strong>
          </div>
        `;
      }).join("");
  }

  /* =========================================================
     TOOLS
     ========================================================= */

  function calcFD() {
    const p =
      parseFloat(
        value("fdPrincipal", "")
      );

    const r =
      parseFloat(
        value("fdRate", "")
      ) || 0;

    const n =
      parseFloat(
        value("fdN", "")
      );

    if (
      !Number.isFinite(p) ||
      p <= 0 ||
      !Number.isFinite(n) ||
      n <= 0
    ) {
      msg("Enter valid FD details.");
      return;
    }

    const maturity =
      p *
      Math.pow(
        1 + r / 100 / 12,
        n
      );

    if ($("fdResult")) {
      $("fdResult").innerHTML =
        `<strong>Maturity: ${money(maturity)}</strong>`;
    }
  }

  function addTool(type, label) {
    const name =
      window.prompt(
        label || "Name:"
      );

    if (!name) return;

    D.tools.push({
      id: makeId(),
      type: type,
      name: name.trim(),
      createdAt: Date.now()
    });

    save();

    msg(
      label
        ? label.replace(":", "") +
          " added."
        : "Entry added."
    );
  }

  function addInsurance() {
    addTool(
      "insurance",
      "Insurance name:"
    );
  }

  function addSchool() {
    addTool(
      "school",
      "School / Education name:"
    );
  }

  function addVehicle() {
    addTool(
      "vehicle",
      "Vehicle name:"
    );
  }

  function addShopping() {
    addTool(
      "shopping",
      "Shopping item:"
    );
  }

  function addUtility() {
    addTool(
      "utility",
      "Utility name:"
    );
  }

  function calcEmergency() {
    const monthly =
      parseFloat(
        window.prompt(
          "Monthly essential expenses:",
          "0"
        )
      ) || 0;

    const months =
      parseFloat(
        window.prompt(
          "Emergency months:",
          "6"
        )
      ) || 6;

    msg(
      "Recommended Emergency Fund: " +
      money(
        monthly * months
      )
    );
  }

  function addDoc() {
    addTool(
      "document",
      "Document name:"
    );
  }

  function addAnnual() {
    addTool(
      "annual",
      "Annual plan:"
    );
  }

  /* =========================================================
     LANGUAGE / CURRENCY
     ========================================================= */

  function toggleLanguage() {
    D.language =
      D.language === "hi"
        ? "en"
        : "hi";

    save();
    applyLanguage();
    renderAll();
  }

  function toggleCurrency() {
    D.currency =
      D.currency === "₹"
        ? "$"
        : "₹";

    save();
    renderAll();
  }

  function applyLanguage() {
    document.documentElement.lang =
      D.language === "hi"
        ? "hi"
        : "en";
  }

  /* =========================================================
     BACKUP / RESTORE
     ========================================================= */

  function exportBackup() {
    try {
      const data =
        JSON.stringify(
          D,
          null,
          2
        );

      const blob =
        new Blob(
          [data],
          {
            type:
              "application/json"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href = url;
      a.download =
        "HISAB-backup-" +
        today() +
        ".json";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

    } catch (e) {
      msg(
        "Backup could not be created."
      );
    }
  }

  function importBackup(event) {
    const file =
      event &&
      event.target &&
      event.target.files
        ? event.target.files[0]
        : null;

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload =
      function () {
        try {
          const imported =
            JSON.parse(
              reader.result
            );

          D =
            normalizeData(
              imported
            );

          save();
          renderAll();

          msg(
            "Backup restored successfully."
          );

        } catch (e) {
          console.error(
            "Restore error:",
            e
          );

          msg(
            "Invalid backup file."
          );
        }
      };

    reader.readAsText(file);
  }

  /* =========================================================
     SECURITY
     ========================================================= */

  function setPin() {
    const pin =
      String(
        value("pinInput", "")
      ).trim();

    if (
      !/^\d{4,6}$/.test(pin)
    ) {
      msg(
        "PIN must be 4 to 6 digits."
      );
      return;
    }

    D.pin = pin;

    save();

    setValue(
      "pinInput",
      ""
    );

    msg(
      "Security PIN saved."
    );
  }

  function lockApp() {
    if (!D.pin) {
      msg(
        "Please set a PIN first."
      );
      return;
    }

    sessionStorage.removeItem(
      "hisab_unlocked"
    );

    msg(
      "HISAB locked. Reopen the app to unlock."
    );
  }

  /* =========================================================
     SEARCH EVERYTHING
     ========================================================= */

  function searchAllData(input) {
    const q =
      String(input || "")
        .trim()
        .toLowerCase();

    const box =
      $("searchResults");

    if (!box) return;

    if (!q) {
      box.innerHTML = "";
      return;
    }

    const results = [];

    D.transactions.forEach(
      function (x) {
        const text =
          `${x.type} ${x.category} ${x.note} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(q)
        ) {
          results.push(
            `💰 ${x.type} — ${money(x.amount)}`
          );
        }
      }
    );

    D.khata.forEach(
      function (x) {
        const text =
          `${x.person} ${x.type} ${x.note} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(q)
        ) {
          results.push(
            `📒 ${x.person} — ${x.type} ${money(x.amount)}`
          );
        }
      }
    );

    D.sales.forEach(
      function (x) {
        const text =
          `${x.customer} ${x.item} ${x.note} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(q)
        ) {
          results.push(
            `🛒 Sale — ${x.customer} — ${money(x.amount)}`
          );
        }
      }
    );

    D.purchases.forEach(
      function (x) {
        const text =
          `${x.supplier} ${x.item} ${x.note} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(q)
        ) {
          results.push(
            `📦 Purchase — ${x.supplier} — ${money(x.amount)}`
          );
        }
      }
    );

    D.business.forEach(
      function (x) {
        if (
          String(x.name)
            .toLowerCase()
            .includes(q)
        ) {
          results.push(
            `💼 ${x.type} — ${x.name}`
          );
        }
      }
    );

    box.innerHTML =
      results.length
        ? results.map(
            x =>
              `<div class="list-item">${esc(x)}</div>`
          ).join("")
        : `<div class="empty-state">No results found.</div>`;
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function renderReports() {
    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions.forEach(
      function (x) {
        if (
          (x.mode || "personal") !==
          D.mode
        ) return;

        if (x.type === "income") {
          income +=
            Number(x.amount) || 0;
        }

        if (x.type === "expense") {
          expense +=
            Number(x.amount) || 0;
        }
      }
    );

    currentKhata(
      D.mode
    ).forEach(
      function (x) {
        if (x.type === "give") {
          give +=
            Number(x.amount) || 0;
        }

        if (x.type === "receive") {
          receive +=
            Number(x.amount) || 0;
        }
      }
    );

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

    const content =
      $("reportContent");

    if (content) {
      const balance =
        income -
        expense +
        receive -
        give;

      content.innerHTML = `
        <div class="summary-card">
          <small>Current Balance</small>
          <strong>${money(balance)}</strong>
        </div>
      `;
    }
  }

  function exportSummary() {
    const text =
      "HISAB Money Summary\n\n" +
      "Income: " +
      (
        $("reportIncome")
          ? $("reportIncome").textContent
          : money(0)
      ) +
      "\nExpense: " +
      (
        $("reportExpense")
          ? $("reportExpense").textContent
          : money(0)
      ) +
      "\nGive: " +
      (
        $("reportGive")
          ? $("reportGive").textContent
          : money(0)
      ) +
      "\nReceive: " +
      (
        $("reportReceive")
          ? $("reportReceive").textContent
          : money(0)
      );

    if (
      navigator.share
    ) {
      navigator.share({
        title:
          "HISAB Summary",
        text: text
      }).catch(
        function () {}
      );
    } else {
      msg(text);
    }
  }

  function exportSummaryPDF() {
    try {
      window.print();
    } catch (e) {
      msg(
        "PDF print option is not available."
      );
    }
  }

  /* =========================================================
     KHATA SHARE / PDF
     ========================================================= */

  function khataText() {
    const person =
      D.ui.selectedPerson;

    const mode =
      D.ui.selectedMode ||
      D.mode;

    const rows =
      currentKhata(mode)
        .filter(
          x => x.person === person
        );

    let text =
      "HISAB Udhar Statement\n\n" +
      "Name: " +
      person +
      "\n\n";

    rows.forEach(function (x) {
      text +=
        x.date +
        " | " +
        x.type +
        " | " +
        money(x.amount) +
        " | " +
        (x.status || "") +
        "\n";
    });

    return text;
  }

  function shareKhata() {
    const text =
      khataText();

    if (navigator.share) {
      navigator.share({
        title:
          "HISAB Udhar Statement",
        text: text
      }).catch(
        function () {}
      );
    } else {
      msg(text);
    }
  }

  function exportKhataPDF() {
    window.print();
  }

  function openPaymentEntry() {
    openKhataForm(
      D.ui.selectedMode ||
      D.mode
    );

    if ($("khataPerson")) {
      $("khataPerson").value =
        D.ui.selectedPerson || "";
    }
  }

  /* =========================================================
     QUICK ADD
     ========================================================= */

  function openQuickAdd() {
    if (
      D.mode === "business"
    ) {
      show("business");
      return;
    }

    show("transactions");
  }

  /* =========================================================
     HOME
     ========================================================= */

  function renderHome() {
    const mode =
      D.mode;

    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions.forEach(
      function (x) {
        if (
          (x.mode || "personal") !==
          mode
        ) return;

        if (x.type === "income") {
          income +=
            Number(x.amount) || 0;
        }

        if (x.type === "expense") {
          expense +=
            Number(x.amount) || 0;
        }
      }
    );

    currentKhata(
      mode
    ).forEach(
      function (x) {
        if (x.type === "give") {
          give +=
            Number(x.amount) || 0;
        }

        if (x.type === "receive") {
          receive +=
            Number(x.amount) || 0;
        }
      }
    );

    const balance =
      income -
      expense +
      receive -
      give;

    if ($("homeBalance"))
      $("homeBalance").textContent =
        money(balance);

    if ($("receivable"))
      $("receivable").textContent =
        money(receive);

    if ($("payable"))
      $("payable").textContent =
        money(give);

    if ($("ledgerGiven"))
      $("ledgerGiven").textContent =
        money(give);

    if ($("ledgerReceived"))
      $("ledgerReceived").textContent =
        money(receive);

    if ($("ledgerNet"))
      $("ledgerNet").textContent =
        money(give - receive);

    if ($("modeLabel"))
      $("modeLabel").textContent =
        mode === "business"
          ? "Business"
          : "Personal";

    if ($("personalModeBtn")) {
      $("personalModeBtn")
        .classList.toggle(
          "active",
          mode === "personal"
        );
    }

    if ($("businessModeBtn")) {
      $("businessModeBtn")
        .classList.toggle(
          "active",
          mode === "business"
        );
    }
  }

  /* =========================================================
     RENDER ALL
     ========================================================= */

  function renderAll() {
    try {
      applyLanguage();
      renderHome();
      renderPersonal();
      renderBusiness();
      renderKhataDetail();
      renderTransactions();
      renderGoals();
      renderBills();
      renderReminders();
      renderFamily();
      renderReports();

      if ($("budgetAmount")) {
        $("budgetAmount").value =
          D.budget || "";
      }

      window.D = D;

    } catch (e) {
      console.error(
        "HISAB render error:",
        e
      );
    }
  }

  /* =========================================================
     GLOBAL FUNCTIONS
     ========================================================= */

  window.D = D;

  window.show = show;
  window.back = back;
  window.goHome = goHome;

  window.showGuestGate =
    showGuestGate;

  window.enterGuestMode =
    enterGuestMode;

  window.setMode =
    setMode;

  window.addTransaction =
    addTransaction;

  window.deleteTransaction =
    deleteTransaction;

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

  window.openKhataDetail =
    openKhataDetail;

  window.closeKhataDetail =
    closeKhataDetail;

  window.detailFilter =
    detailFilter;

  window.deleteKhata =
    deleteKhata;

  window.addBusinessCustomer =
    addBusinessCustomer;

  window.addBusinessSupplier =
    addBusinessSupplier;

  window.addBusinessSale =
    addBusinessSale;

  window.addBusinessPurchase =
    addBusinessPurchase;

  window.deleteBusinessSale =
    deleteBusinessSale;

  window.deleteBusinessPurchase =
    deleteBusinessPurchase;

  window.deleteBusinessContact =
    deleteBusinessContact;

  window.businessFilter =
    businessFilter;

  window.calcBudget =
    calcBudget;

  window.calcGoal =
    calcGoal;

  window.addBill =
    addBill;

  window.calcEMI =
    calcEMI;

  window.addReminder =
    addReminder;

  window.addFamilyMember =
    addFamilyMember;

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

  window.toggleLanguage =
    toggleLanguage;

  window.toggleCurrency =
    toggleCurrency;

  window.exportBackup =
    exportBackup;

  window.importBackup =
    importBackup;

  window.setPin =
    setPin;

  window.lockApp =
    lockApp;

  window.searchAllData =
    searchAllData;

  window.exportSummary =
    exportSummary;

  window.exportSummaryPDF =
    exportSummaryPDF;

  window.openPaymentEntry =
    openPaymentEntry;

  window.shareKhata =
    shareKhata;

  window.exportKhataPDF =
    exportKhataPDF;

  window.openQuickAdd =
    openQuickAdd;

  /* =========================================================
     STARTUP
     ========================================================= */

  function startup() {
    try {
      if (
        $("transactionDate") &&
        !$("transactionDate").value
      ) {
        $("transactionDate").value =
          today();
      }

      if (
        $("khataDate") &&
        !$("khataDate").value
      ) {
        $("khataDate").value =
          today();
      }

      if (
        $("billDue") &&
        !$("billDue").value
      ) {
        $("billDue").value =
          today();
      }

      if (
        $("cardDue") &&
        !$("cardDue").value
      ) {
        $("cardDue").value =
          today();
      }

      if (
        $("reminderDate") &&
        !$("reminderDate").value
      ) {
        $("reminderDate").value =
          today();
      }

      if (
        $("goalDate") &&
        !$("goalDate").value
      ) {
        $("goalDate").value =
          today();
      }

      renderAll();

      showGuestGate();

    } catch (e) {
      console.error(
        "HISAB startup error:",
        e
      );

      /*
       * Emergency fallback:
       * Never leave the app completely blank.
       */

      const gate =
        $("guestGate");

      const shell =
        $("appShell");

      if (gate)
        gate.style.display =
          "flex";

      if (shell)
        shell.style.display =
          "block";

      const home =
        $("home");

      if (home) {
        getPages().forEach(
          p =>
            p.style.display =
              "none"
        );

        home.style.display =
          "block";
      }
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startup
    );
  } else {
    startup();
  }

})();
