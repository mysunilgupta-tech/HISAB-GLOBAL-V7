/* =========================================================
   HISAB V7 — STABLE CONTROLLER
   FIX #1 — BUSINESS SALES + PURCHASE
   Compatible with current HISAB V7 HTML
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
      selectedMode: "personal",
      lastPage: ""
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

  function normaliseData(saved) {
    saved = saved && typeof saved === "object"
      ? saved
      : {};

    const base = cloneDefault();

    const data = {
      ...base,
      ...saved
    };

    const arrays = [
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
      data[key] = Array.isArray(saved[key])
        ? saved[key]
        : [];
    });

    data.ui = {
      ...base.ui,
      ...(saved.ui || {})
    };

    return data;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(KEY);

      if (!raw) {
        return cloneDefault();
      }

      return normaliseData(JSON.parse(raw));

    } catch (e) {
      console.error("HISAB load error:", e);
      return cloneDefault();
    }
  }

  function save() {
    try {
      const copy = JSON.parse(JSON.stringify(D));

      delete copy.ui;

      localStorage.setItem(
        KEY,
        JSON.stringify(copy)
      );

      window.D = D;

    } catch (e) {
      console.error("HISAB save error:", e);
    }
  }

  function alertMsg(message) {
    window.alert(String(message));
  }

  function safePrompt(message, value) {
    try {
      return window.prompt(message, value);
    } catch (e) {
      return null;
    }
  }

  /* =========================================================
     PAGE NAVIGATION
     Supports both old and current IDs
     ========================================================= */

  function findPage(pageId) {
    const aliases = {
      home: ["home", "homeScreen"],
      personal: ["personal", "personalScreen"],
      business: ["business", "businessScreen"],
      transactions: ["transactions", "transactionsScreen"],
      reports: ["reports", "reportsScreen"],
      settings: ["settings", "settingsScreen"],
      more: ["more", "moreScreen"],
      add: ["add", "addScreen"],
      khataDetail: ["khataDetail", "khataDetailScreen"]
    };

    const ids = aliases[pageId] || [pageId];

    for (let i = 0; i < ids.length; i++) {
      const el = $(ids[i]);

      if (el) {
        return el;
      }
    }

    return null;
  }

  function show(pageId) {
    const pages = document.querySelectorAll(".page");

    pages.forEach(function (page) {
      page.style.display = "none";
      page.classList.remove("active");
    });

    const page = findPage(pageId);

    if (page) {
      page.style.display = "";
      page.classList.add("active");

      D.ui.lastPage = page.id || pageId;
    } else {
      console.warn(
        "HISAB page not found:",
        pageId
      );
    }

    renderAll();
  }

  function goHome() {
    show("home");
  }

  function back() {
    show("home");
  }

  /* =========================================================
     MODE
     ========================================================= */

  function setMode(mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    D.ui.selectedMode = D.mode;

    if ($("modeLabel")) {
      $("modeLabel").textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }

    if ($("personalModeBtn")) {
      $("personalModeBtn")
        .classList.toggle(
          "active",
          D.mode === "personal"
        );
    }

    if ($("businessModeBtn")) {
      $("businessModeBtn")
        .classList.toggle(
          "active",
          D.mode === "business"
        );
    }

    save();

    if (D.mode === "business") {
      show("business");
    } else {
      show("personal");
    }
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction() {
    const typeEl = $("transactionType");
    const amountEl = $("transactionAmount");
    const categoryEl = $("transactionCategory");
    const noteEl = $("transactionNote");
    const dateEl = $("transactionDate");

    const type = typeEl
      ? typeEl.value
      : "expense";

    const amount = parseFloat(
      amountEl ? amountEl.value : ""
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Please enter a valid amount.");
      return;
    }

    const category = categoryEl
      ? categoryEl.value.trim()
      : "";

    const note = noteEl
      ? noteEl.value.trim()
      : "";

    const date = dateEl
      ? dateEl.value || today()
      : today();

    D.transactions.push({
      id: makeId(),
      mode: D.mode,
      type: type,
      amount: amount,
      category: category || "General",
      note: note,
      date: date,
      createdAt: Date.now()
    });

    save();

    if (amountEl) amountEl.value = "";
    if (categoryEl) categoryEl.value = "";
    if (noteEl) noteEl.value = "";

    renderAll();

    alertMsg("Transaction added.");
  }

  function deleteTransaction(txId) {
    D.transactions =
      D.transactions.filter(function (x) {
        return x.id !== txId;
      });

    save();
    renderAll();
  }

  /* =========================================================
     UDHAR
     ========================================================= */

  function openKhataForm(mode) {
    D.ui.selectedMode =
      mode === "business"
        ? "business"
        : D.mode;

    const form = $("khataForm");

    if (form) {
      form.style.display = "";
      form.classList.add("active");
    }

    if ($("khataDate")) {
      $("khataDate").value = today();
    }

    if ($("khataPerson")) {
      $("khataPerson").focus();
    }
  }

  function closeKhataForm() {
    const form = $("khataForm");

    if (form) {
      form.style.display = "none";
      form.classList.remove("active");
    }
  }

  function saveKhataEntry() {
    const person = $("khataPerson")
      ? $("khataPerson").value.trim()
      : "";

    const type = $("khataType")
      ? $("khataType").value
      : "give";

    const amount = parseFloat(
      $("khataAmount")
        ? $("khataAmount").value
        : ""
    );

    if (!person) {
      alertMsg("Please enter name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Please enter valid amount.");
      return;
    }

    const date = $("khataDate")
      ? $("khataDate").value || today()
      : today();

    const method = $("khataMethod")
      ? $("khataMethod").value || "Cash"
      : "Cash";

    const status = $("khataStatus")
      ? $("khataStatus").value || "pending"
      : "pending";

    const note = $("khataNote")
      ? $("khataNote").value.trim()
      : "";

    D.khata.push({
      id: makeId(),
      mode: D.ui.selectedMode || D.mode,
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
    closeKhataForm();

    if ($("khataPerson")) $("khataPerson").value = "";
    if ($("khataAmount")) $("khataAmount").value = "";
    if ($("khataNote")) $("khataNote").value = "";

    renderAll();

    alertMsg("Udhar entry saved.");
  }

  function currentKhata(mode) {
    return D.khata.filter(function (x) {
      return (x.mode || "personal") === mode;
    });
  }

  function deleteKhata(kid) {
    D.khata =
      D.khata.filter(function (x) {
        return x.id !== kid;
      });

    save();
    renderAll();
  }

  function openKhataDetail(person, mode) {
    D.ui.selectedPerson = person;
    D.ui.selectedMode =
      mode === "business"
        ? "business"
        : (mode || D.mode);

    const page = findPage("khataDetail");

    if (page) {
      document.querySelectorAll(".page")
        .forEach(function (p) {
          p.style.display = "none";
          p.classList.remove("active");
        });

      page.style.display = "";
      page.classList.add("active");
    }

    renderKhataDetail();
  }

  function closeKhataDetail() {
    const page = findPage("khataDetail");

    if (page) {
      page.style.display = "none";
      page.classList.remove("active");
    }

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function renderKhataDetail() {
    const person = D.ui.selectedPerson;
    const mode =
      D.ui.selectedMode || D.mode;

    if (!person) return;

    const list =
      currentKhata(mode).filter(function (x) {
        return x.person === person;
      });

    let give = 0;
    let receive = 0;

    list.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    if ($("detailPersonName")) {
      $("detailPersonName").textContent =
        person;
    }

    if ($("detailGive")) {
      $("detailGive").textContent =
        money(give);
    }

    if ($("detailReceive")) {
      $("detailReceive").textContent =
        money(receive);
    }

    if ($("detailBalance")) {
      $("detailBalance").textContent =
        money(give - receive);
    }

    const listEl = $("khataDetailList");

    if (!listEl) return;

    if (!list.length) {
      listEl.innerHTML =
        '<div class="empty-state">No entries yet.</div>';

      return;
    }

    const sorted = list.slice().sort(function (a, b) {
      return String(b.date)
        .localeCompare(String(a.date));
    });

    listEl.innerHTML = sorted.map(function (x) {
      const isGive = x.type === "give";

      return `
        <div class="list-item">
          <strong style="color:${isGive ? "#d93025" : "#188038"}">
            ${isGive ? "Give" : "Receive"} —
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
          <button type="button"
            onclick="deleteKhata('${x.id}')">
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

    const result =
      safePrompt(label, "");

    if (result === null) return;

    const name = result.trim();

    if (!name) return;

    const exists = D.business.some(function (x) {
      return (
        x.type === type &&
        String(x.name).toLowerCase() ===
          name.toLowerCase()
      );
    });

    if (exists) {
      alertMsg(
        "This " +
        (type === "supplier"
          ? "supplier"
          : "customer") +
        " already exists."
      );
      return;
    }

    D.business.push({
      id: makeId(),
      type: type,
      name: name,
      createdAt: Date.now()
    });

    save();
    renderBusiness();

    alertMsg(
      type === "supplier"
        ? "Supplier added."
        : "Customer added."
    );
  }

  function deleteBusinessContact(contactId) {
    D.business =
      D.business.filter(function (x) {
        return x.id !== contactId;
      });

    save();
    renderBusiness();
  }

  /* =========================================================
     #1 BUSINESS SALE
     ========================================================= */

  function addBusinessSale() {
    const customerResult =
      safePrompt("Customer Name:", "");

    if (customerResult === null) return;

    const customer =
      customerResult.trim();

    if (!customer) {
      alertMsg("Please enter customer name.");
      return;
    }

    const amountResult =
      safePrompt("Sale Amount:", "");

    if (amountResult === null) return;

    const amount =
      parseFloat(amountResult);

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Please enter a valid Sale Amount.");
      return;
    }

    const dateResult =
      safePrompt("Sale Date:", today());

    if (dateResult === null) return;

    const date =
      dateResult.trim() || today();

    const methodResult =
      safePrompt(
        "Payment Method:",
        "Cash"
      );

    if (methodResult === null) return;

    const method =
      methodResult.trim() || "Cash";

    const noteResult =
      safePrompt("Sale Note:", "");

    if (noteResult === null) return;

    const statusResult =
      safePrompt(
        "Status (completed / pending):",
        "completed"
      );

    if (statusResult === null) return;

    const status =
      statusResult.trim().toLowerCase() ===
      "pending"
        ? "pending"
        : "completed";

    const sale = {
      id: makeId(),
      mode: "business",
      customer: customer,
      amount: amount,
      date: date,
      method: method,
      note: noteResult.trim(),
      status: status,
      createdAt: Date.now()
    };

    D.sales.push(sale);

    /* Automatically create customer contact */
    const customerExists =
      D.business.some(function (x) {
        return (
          x.type === "customer" &&
          String(x.name).toLowerCase() ===
            customer.toLowerCase()
        );
      });

    if (!customerExists) {
      D.business.push({
        id: makeId(),
        type: "customer",
        name: customer,
        createdAt: Date.now()
      });
    }

    save();

    D.ui.businessFilter = "sales";

    renderBusiness();

    alertMsg(
      "Sale entry added successfully."
    );
  }

  /* =========================================================
     #1 BUSINESS PURCHASE
     ========================================================= */

  function addBusinessPurchase() {
    const supplierResult =
      safePrompt("Supplier Name:", "");

    if (supplierResult === null) return;

    const supplier =
      supplierResult.trim();

    if (!supplier) {
      alertMsg("Please enter supplier name.");
      return;
    }

    const amountResult =
      safePrompt("Purchase Amount:", "");

    if (amountResult === null) return;

    const amount =
      parseFloat(amountResult);

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg(
        "Please enter a valid Purchase Amount."
      );
      return;
    }

    const dateResult =
      safePrompt("Purchase Date:", today());

    if (dateResult === null) return;

    const date =
      dateResult.trim() || today();

    const methodResult =
      safePrompt(
        "Payment Method:",
        "Cash"
      );

    if (methodResult === null) return;

    const method =
      methodResult.trim() || "Cash";

    const noteResult =
      safePrompt("Purchase Note:", "");

    if (noteResult === null) return;

    const statusResult =
      safePrompt(
        "Status (completed / pending):",
        "completed"
      );

    if (statusResult === null) return;

    const status =
      statusResult.trim().toLowerCase() ===
      "pending"
        ? "pending"
        : "completed";

    const purchase = {
      id: makeId(),
      mode: "business",
      supplier: supplier,
      amount: amount,
      date: date,
      method: method,
      note: noteResult.trim(),
      status: status,
      createdAt: Date.now()
    };

    D.purchases.push(purchase);

    /* Automatically create supplier contact */
    const supplierExists =
      D.business.some(function (x) {
        return (
          x.type === "supplier" &&
          String(x.name).toLowerCase() ===
            supplier.toLowerCase()
        );
      });

    if (!supplierExists) {
      D.business.push({
        id: makeId(),
        type: "supplier",
        name: supplier,
        createdAt: Date.now()
      });
    }

    save();

    D.ui.businessFilter = "purchase";

    renderBusiness();

    alertMsg(
      "Purchase entry added successfully."
    );
  }

  function deleteBusinessSale(saleId) {
    D.sales =
      D.sales.filter(function (x) {
        return x.id !== saleId;
      });

    save();
    renderBusiness();
  }

  function deleteBusinessPurchase(purchaseId) {
    D.purchases =
      D.purchases.filter(function (x) {
        return x.id !== purchaseId;
      });

    save();
    renderBusiness();
  }

  /* =========================================================
     BUSINESS FILTER
     ========================================================= */

  function businessFilter(filter, button) {
    D.ui.businessFilter =
      filter || "customer";

    document.querySelectorAll(
      ".business-filter button, .business-tabs button"
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
    const list = $("businessList");

    if (!list) return;

    const filter =
      D.ui.businessFilter || "customer";

    const searchEl =
      $("businessSearch");

    const search =
      searchEl
        ? searchEl.value.trim().toLowerCase()
        : "";

    /* -------------------------
       BUSINESS UDHAR SUMMARY
       ------------------------- */

    const businessKhata =
      currentKhata("business");

    let given = 0;
    let received = 0;

    businessKhata.forEach(function (x) {
      if (x.type === "give") {
        given += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        received += Number(x.amount) || 0;
      }
    });

    if ($("businessGiven")) {
      $("businessGiven").textContent =
        money(given);
    }

    if ($("businessReceived")) {
      $("businessReceived").textContent =
        money(received);
    }

    if ($("businessNet")) {
      $("businessNet").textContent =
        money(given - received);
    }

    /* =====================================================
       SALES
       ===================================================== */

    if (filter === "sales") {
      let sales =
        D.sales.filter(function (x) {
          return (x.mode || "business") ===
            "business";
        });

      if (search) {
        sales = sales.filter(function (x) {
          return (
            `${x.customer} ${x.amount} ${x.date} ${x.method} ${x.note} ${x.status}`
              .toLowerCase()
              .includes(search)
          );
        });
      }

      sales.sort(function (a, b) {
        return (
          String(b.date)
            .localeCompare(String(a.date)) ||
          Number(b.createdAt || 0) -
            Number(a.createdAt || 0)
        );
      });

      const total =
        sales.reduce(function (sum, x) {
          return sum + Number(x.amount || 0);
        }, 0);

      const pending =
        sales
          .filter(function (x) {
            return x.status === "pending";
          })
          .reduce(function (sum, x) {
            return sum + Number(x.amount || 0);
          }, 0);

      let html = `
        <div class="summary-card">
          <small>Total Sales</small>
          <strong>${money(total)}</strong>
        </div>

        <div class="summary-card">
          <small>Pending Sales</small>
          <strong>${money(pending)}</strong>
        </div>

        <button type="button"
          onclick="addBusinessSale()">
          ➕ Add Sale
        </button>
      `;

      if (!sales.length) {
        html += `
          <div class="empty-state">
            No sales entries yet.
          </div>
        `;
      }

      sales.forEach(function (x) {
        const status =
          x.status || "completed";

        html += `
          <div class="list-item business-sale-item">

            <strong>
              🛒 ${esc(x.customer)}
            </strong>

            <div>
              ${money(x.amount)}
            </div>

            <small>
              ${esc(x.date)}
              • ${esc(x.method || "Cash")}
              • ${esc(status)}
            </small>

            ${
              x.note
                ? `<p>${esc(x.note)}</p>`
                : ""
            }

            <button type="button"
              onclick="deleteBusinessSale('${x.id}')">
              🗑 Delete
            </button>

          </div>
        `;
      });

      list.innerHTML = html;
      return;
    }

    /* =====================================================
       PURCHASE
       ===================================================== */

    if (filter === "purchase") {
      let purchases =
        D.purchases.filter(function (x) {
          return (x.mode || "business") ===
            "business";
        });

      if (search) {
        purchases =
          purchases.filter(function (x) {
            return (
              `${x.supplier} ${x.amount} ${x.date} ${x.method} ${x.note} ${x.status}`
                .toLowerCase()
                .includes(search)
            );
          });
      }

      purchases.sort(function (a, b) {
        return (
          String(b.date)
            .localeCompare(String(a.date)) ||
          Number(b.createdAt || 0) -
            Number(a.createdAt || 0)
        );
      });

      const total =
        purchases.reduce(function (sum, x) {
          return sum + Number(x.amount || 0);
        }, 0);

      const pending =
        purchases
          .filter(function (x) {
            return x.status === "pending";
          })
          .reduce(function (sum, x) {
            return sum + Number(x.amount || 0);
          }, 0);

      let html = `
        <div class="summary-card">
          <small>Total Purchase</small>
          <strong>${money(total)}</strong>
        </div>

        <div class="summary-card">
          <small>Pending Purchase</small>
          <strong>${money(pending)}</strong>
        </div>

        <button type="button"
          onclick="addBusinessPurchase()">
          ➕ Add Purchase
        </button>
      `;

      if (!purchases.length) {
        html += `
          <div class="empty-state">
            No purchase entries yet.
          </div>
        `;
      }

      purchases.forEach(function (x) {
        const status =
          x.status || "completed";

        html += `
          <div class="list-item business-purchase-item">

            <strong>
              📦 ${esc(x.supplier)}
            </strong>

            <div>
              ${money(x.amount)}
            </div>

            <small>
              ${esc(x.date)}
              • ${esc(x.method || "Cash")}
              • ${esc(status)}
            </small>

            ${
              x.note
                ? `<p>${esc(x.note)}</p>`
                : ""
            }

            <button type="button"
              onclick="deleteBusinessPurchase('${x.id}')">
              🗑 Delete
            </button>

          </div>
        `;
      });

      list.innerHTML = html;
      return;
    }

    /* =====================================================
       CUSTOMERS / SUPPLIERS
       ===================================================== */

    if (
      filter === "customer" ||
      filter === "supplier"
    ) {
      let contacts =
        D.business.filter(function (x) {
          return x.type === filter;
        });

      if (search) {
        contacts =
          contacts.filter(function (x) {
            return String(x.name)
              .toLowerCase()
              .includes(search);
          });
      }

      contacts.sort(function (a, b) {
        return String(a.name)
          .localeCompare(String(b.name));
      });

      let html =
        filter === "customer"
          ? `
            <button type="button"
              onclick="addBusinessCustomer()">
              ➕ Add Customer
            </button>
          `
          : `
            <button type="button"
              onclick="addBusinessSupplier()">
              ➕ Add Supplier
            </button>
          `;

      if (!contacts.length) {
        html += `
          <div class="empty-state">
            No ${filter} entries yet.
          </div>
        `;
      }

      contacts.forEach(function (c) {
        /* Only same contact type history */
        const history =
          businessKhata.filter(function (x) {
            return (
              String(x.person).toLowerCase() ===
                String(c.name).toLowerCase()
            );
          });

        let give = 0;
        let receive = 0;

        history.forEach(function (x) {
          if (x.type === "give") {
            give += Number(x.amount) || 0;
          }

          if (x.type === "receive") {
            receive += Number(x.amount) || 0;
          }
        });

        /* Sales total for customer */
        let salesTotal = 0;

        if (filter === "customer") {
          D.sales.forEach(function (x) {
            if (
              String(x.customer).toLowerCase() ===
              String(c.name).toLowerCase()
            ) {
              salesTotal +=
                Number(x.amount) || 0;
            }
          });
        }

        /* Purchase total for supplier */
        let purchaseTotal = 0;

        if (filter === "supplier") {
          D.purchases.forEach(function (x) {
            if (
              String(x.supplier).toLowerCase() ===
              String(c.name).toLowerCase()
            ) {
              purchaseTotal +=
                Number(x.amount) || 0;
            }
          });
        }

        html += `
          <div class="list-item">

            <strong>
              ${
                filter === "customer"
                  ? "👤"
                  : "🚚"
              }
              ${esc(c.name)}
            </strong>

            ${
              filter === "customer"
                ? `
                  <small>
                    Sales: ${money(salesTotal)}
                  </small>
                `
                : `
                  <small>
                    Purchase: ${money(purchaseTotal)}
                  </small>
                `
            }

            <small>
              Give: ${money(give)}
              • Receive: ${money(receive)}
            </small>

            <button type="button"
              onclick="openKhataDetail('${esc(c.name)}','business')">
              📒 History
            </button>

            <button type="button"
              onclick="deleteBusinessContact('${c.id}')">
              🗑 Delete
            </button>

          </div>
        `;
      });

      list.innerHTML = html;
      return;
    }

    list.innerHTML = `
      <div class="empty-state">
        No business entries.
      </div>
    `;
  }

  /* =========================================================
     BUDGET
     ========================================================= */

  function calcBudget() {
    const amount = parseFloat(
      $("budgetAmount")
        ? $("budgetAmount").value
        : ""
    );

    if (!Number.isFinite(amount) || amount < 0) {
      alertMsg("Please enter valid budget.");
      return;
    }

    D.budget = amount;

    save();
    renderAll();

    alertMsg("Budget saved.");
  }

  /* =========================================================
     GOALS
     ========================================================= */

  function calcGoal() {
    const name = $("goalName")
      ? $("goalName").value.trim()
      : "";

    const target = parseFloat(
      $("goalTarget")
        ? $("goalTarget").value
        : ""
    );

    const savedAmount =
      parseFloat(
        $("goalSaved")
          ? $("goalSaved").value
          : "0"
      ) || 0;

    const date = $("goalDate")
      ? $("goalDate").value
      : "";

    if (!name) {
      alertMsg("Enter goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      alertMsg("Enter valid target.");
      return;
    }

    D.goals.push({
      id: makeId(),
      name: name,
      target: target,
      saved: savedAmount,
      date: date || today(),
      createdAt: Date.now()
    });

    save();
    renderAll();

    alertMsg("Goal saved.");
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function addBill(type) {
    let name = "";
    let amount = 0;
    let due = "";

    if (type === "Credit Card") {
      name = "Credit Card";

      amount = parseFloat(
        $("cardBill")
          ? $("cardBill").value
          : ""
      );

      due = $("cardDue")
        ? $("cardDue").value
        : "";

    } else {
      name = $("billName")
        ? $("billName").value.trim()
        : "";

      amount = parseFloat(
        $("billAmount")
          ? $("billAmount").value
          : ""
      );

      due = $("billDue")
        ? $("billDue").value
        : "";
    }

    if (!name) {
      name = type || "Bill";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Enter valid bill amount.");
      return;
    }

    D.bills.push({
      id: makeId(),
      name: name,
      type: type || "Bill",
      amount: amount,
      due: due || today(),
      status: "pending",
      history: [],
      createdAt: Date.now()
    });

    save();
    renderAll();

    alertMsg("Bill added.");
  }

  /* =========================================================
     EMI
     ========================================================= */

  function calcEMI() {
    const principal = parseFloat(
      $("emiPrincipal")
        ? $("emiPrincipal").value
        : ""
    );

    const rate = parseFloat(
      $("emiRate")
        ? $("emiRate").value
        : "0"
    ) || 0;

    const months = parseInt(
      $("emiMonths")
        ? $("emiMonths").value
        : "",
      10
    );

    if (
      !Number.isFinite(principal) ||
      principal <= 0 ||
      !Number.isFinite(months) ||
      months <= 0
    ) {
      alertMsg(
        "Please enter valid loan details."
      );
      return;
    }

    const monthlyRate =
      rate / 12 / 100;

    let emi;

    if (monthlyRate === 0) {
      emi = principal / months;
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

    if ($("emiResult")) {
      $("emiResult").innerHTML = `
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
    const name = $("reminderName")
      ? $("reminderName").value.trim()
      : "";

    const date = $("reminderDate")
      ? $("reminderDate").value
      : "";

    if (!name) {
      alertMsg("Enter reminder.");
      return;
    }

    D.reminders.push({
      id: makeId(),
      name: name,
      date: date || today(),
      createdAt: Date.now()
    });

    save();

    if ($("reminderName")) {
      $("reminderName").value = "";
    }

    renderAll();

    alertMsg("Reminder added.");
  }

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamilyMember() {
    const name = $("familyName")
      ? $("familyName").value.trim()
      : "";

    if (!name) {
      alertMsg(
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

    if ($("familyName")) {
      $("familyName").value = "";
    }

    renderAll();
  }

  /* =========================================================
     TOOLS
     ========================================================= */

  function calcFD() {
    const p = parseFloat(
      $("fdPrincipal")
        ? $("fdPrincipal").value
        : ""
    );

    const r = parseFloat(
      $("fdRate")
        ? $("fdRate").value
        : "0"
    ) || 0;

    const n = parseFloat(
      $("fdN")
        ? $("fdN").value
        : ""
    );

    if (!p || p <= 0 || !n || n <= 0) {
      alertMsg("Enter valid FD details.");
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

  function addTool(type, message) {
    const name = safePrompt(message, "");

    if (name === null || !name.trim()) {
      return;
    }

    D.tools.push({
      id: makeId(),
      type: type,
      name: name.trim(),
      createdAt: Date.now()
    });

    save();

    alertMsg(
      type.charAt(0).toUpperCase() +
      type.slice(1) +
      " entry added."
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
        safePrompt(
          "Monthly essential expenses:",
          "0"
        ) || "0"
      ) || 0;

    const months =
      parseFloat(
        safePrompt(
          "Emergency months:",
          "6"
        ) || "6"
      ) || 6;

    alertMsg(
      "Recommended Emergency Fund: " +
      money(monthly * months)
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
     BACKUP
     ========================================================= */

  function exportBackup() {
    try {
      const data =
        JSON.stringify(D, null, 2);

      const blob = new Blob(
        [data],
        { type: "application/json" }
      );

      const url =
        URL.createObjectURL(blob);

      const a =
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
      console.error(e);
      alertMsg(
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

    reader.onload = function () {
      try {
        const imported =
          JSON.parse(
            reader.result
          );

        D = normaliseData(
          imported
        );

        save();
        renderAll();

        alertMsg(
          "Backup restored successfully."
        );

      } catch (e) {
        console.error(e);

        alertMsg(
          "Invalid backup file."
        );
      }

      if (
        event &&
        event.target
      ) {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  /* =========================================================
     SECURITY
     ========================================================= */

  function setPin() {
    const pin = $("pinInput")
      ? $("pinInput").value.trim()
      : "";

    if (!/^\d{4,6}$/.test(pin)) {
      alertMsg(
        "PIN must be 4 to 6 digits."
      );
      return;
    }

    D.pin = pin;

    save();

    if ($("pinInput")) {
      $("pinInput").value = "";
    }

    alertMsg(
      "Security PIN saved."
    );
  }

  function lockApp() {
    if (!D.pin) {
      alertMsg(
        "Please set a PIN first."
      );
      return;
    }

    sessionStorage.removeItem(
      "hisab_unlocked"
    );

    alertMsg(
      "HISAB locked. Reopen the app to unlock."
    );
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  function searchAllData(value) {
    const q =
      String(value || "")
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

    D.transactions.forEach(function (x) {
      const text =
        `${x.type} ${x.category} ${x.note} ${x.amount} ${x.date}`;

      if (
        text.toLowerCase().includes(q)
      ) {
        results.push(
          `💰 ${x.type} — ${money(x.amount)}`
        );
      }
    });

    D.khata.forEach(function (x) {
      const text =
        `${x.person} ${x.type} ${x.note} ${x.amount} ${x.date}`;

      if (
        text.toLowerCase().includes(q)
      ) {
        results.push(
          `📒 ${x.person} — ${x.type} ${money(x.amount)}`
        );
      }
    });

    D.sales.forEach(function (x) {
      const text =
        `${x.customer} ${x.note} ${x.amount} ${x.date} ${x.method}`;

      if (
        text.toLowerCase().includes(q)
      ) {
        results.push(
          `🛒 Sale — ${x.customer} — ${money(x.amount)}`
        );
      }
    });

    D.purchases.forEach(function (x) {
      const text =
        `${x.supplier} ${x.note} ${x.amount} ${x.date} ${x.method}`;

      if (
        text.toLowerCase().includes(q)
      ) {
        results.push(
          `📦 Purchase — ${x.supplier} — ${money(x.amount)}`
        );
      }
    });

    D.business.forEach(function (x) {
      if (
        String(x.name)
          .toLowerCase()
          .includes(q)
      ) {
        results.push(
          `💼 ${x.type} — ${x.name}`
        );
      }
    });

    box.innerHTML =
      results.length
        ? results.map(function (x) {
            return `
              <div class="list-item">
                ${esc(x)}
              </div>
            `;
          }).join("")
        : `
          <div class="empty-state">
            No results found.
          </div>
        `;
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function renderReports() {
    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions.forEach(function (x) {
      if (
        (x.mode || "personal") !==
        D.mode
      ) {
        return;
      }

      if (x.type === "income") {
        income +=
          Number(x.amount) || 0;
      }

      if (x.type === "expense") {
        expense +=
          Number(x.amount) || 0;
      }
    });

    currentKhata(D.mode)
      .forEach(function (x) {
        if (x.type === "give") {
          give +=
            Number(x.amount) || 0;
        }

        if (x.type === "receive") {
          receive +=
            Number(x.amount) || 0;
        }
      });

    if ($("reportIncome")) {
      $("reportIncome").textContent =
        money(income);
    }

    if ($("reportExpense")) {
      $("reportExpense").textContent =
        money(expense);
    }

    if ($("reportGive")) {
      $("reportGive").textContent =
        money(give);
    }

    if ($("reportReceive")) {
      $("reportReceive").textContent =
        money(receive);
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
      navigator.share &&
      typeof navigator.share === "function"
    ) {
      navigator.share({
        title: "HISAB Summary",
        text: text
      }).catch(function () {});
    } else {
      alertMsg(text);
    }
  }

  function exportSummaryPDF() {
    alertMsg(
      "PDF export will open the print/share option."
    );

    setTimeout(function () {
      try {
        window.print();
      } catch (e) {
        console.error(e);
      }
    }, 150);
  }

  /* =========================================================
     HOME
     ========================================================= */

  function renderHome() {
    const mode = D.mode;

    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions.forEach(function (x) {
      if (
        (x.mode || "personal") !==
        mode
      ) {
        return;
      }

      if (x.type === "income") {
        income +=
          Number(x.amount) || 0;
      }

      if (x.type === "expense") {
        expense +=
          Number(x.amount) || 0;
      }
    });

    currentKhata(mode)
      .forEach(function (x) {
        if (x.type === "give") {
          give +=
            Number(x.amount) || 0;
        }

        if (x.type === "receive") {
          receive +=
            Number(x.amount) || 0;
        }
      });

    /*
      Personal/Business balance:
      Income - Expense + Receive - Give
    */
    const balance =
      income -
      expense +
      receive -
      give;

    if ($("homeBalance")) {
      $("homeBalance").textContent =
        money(balance);
    }

    if ($("receivable")) {
      $("receivable").textContent =
        money(receive);
    }

    if ($("payable")) {
      $("payable").textContent =
        money(give);
    }

    if ($("ledgerGiven")) {
      $("ledgerGiven").textContent =
        money(give);
    }

    if ($("ledgerReceived")) {
      $("ledgerReceived").textContent =
        money(receive);
    }

    if ($("ledgerNet")) {
      $("ledgerNet").textContent =
        money(give - receive);
    }

    if ($("modeLabel")) {
      $("modeLabel").textContent =
        mode === "business"
          ? "Business"
          : "Personal";
    }

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
      renderBusiness();
      renderReports();

      if (D.ui.selectedPerson) {
        renderKhataDetail();
      }

      const budgetEl =
        $("budgetAmount");

      if (
        budgetEl &&
        Number(D.budget) >= 0
      ) {
        budgetEl.value =
          D.budget || "";
      }

    } catch (e) {
      /*
        Never let one render error
        produce a completely blank app.
      */
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

  window.setMode = setMode;

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

  window.openKhataDetail =
    openKhataDetail;

  window.closeKhataDetail =
    closeKhataDetail;

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

      const guestGate =
        $("guestGate");

      if (guestGate) {
        const guest =
          localStorage.getItem(
            GUEST_KEY
          );

        if (!guest) {
          guestGate.style.display = "";
        }
      }

      renderAll();

    } catch (e) {
      console.error(
        "HISAB startup error:",
        e
      );

      /*
        Keep the page visible even if
        an optional element is missing.
      */
      renderAll();
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
