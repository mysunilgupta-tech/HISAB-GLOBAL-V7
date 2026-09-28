/* =========================================================
   HISAB V7 — COMPLETE STABLE CONTROLLER
   #1 BUSINESS SALES + PURCHASE
   Compatible with supplied HISAB V7 HTML
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
     BASIC HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function id() {
    return Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
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

  function loadData() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));

      const saved = JSON.parse(raw);

      return {
        ...JSON.parse(JSON.stringify(DEFAULT)),
        ...saved,
        transactions: Array.isArray(saved.transactions)
          ? saved.transactions : [],
        khata: Array.isArray(saved.khata)
          ? saved.khata : [],
        business: Array.isArray(saved.business)
          ? saved.business : [],
        sales: Array.isArray(saved.sales)
          ? saved.sales : [],
        purchases: Array.isArray(saved.purchases)
          ? saved.purchases : [],
        goals: Array.isArray(saved.goals)
          ? saved.goals : [],
        savings: Array.isArray(saved.savings)
          ? saved.savings : [],
        bills: Array.isArray(saved.bills)
          ? saved.bills : [],
        loans: Array.isArray(saved.loans)
          ? saved.loans : [],
        reminders: Array.isArray(saved.reminders)
          ? saved.reminders : [],
        family: Array.isArray(saved.family)
          ? saved.family : [],
        tools: Array.isArray(saved.tools)
          ? saved.tools : [],
        ui: {
          ...DEFAULT.ui,
          ...(saved.ui || {})
        }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  function save() {
    try {
      const copy = JSON.parse(JSON.stringify(D));
      delete copy.ui;
      localStorage.setItem(KEY, JSON.stringify(copy));
    } catch (e) {
      console.error("HISAB save error", e);
    }
  }

  function alertMsg(msg) {
    window.alert(msg);
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function show(pageId) {
    document.querySelectorAll(".page").forEach(function (p) {
      p.style.display = "none";
      p.classList.remove("active");
    });

    const page = $(pageId);

    if (page) {
      page.style.display = "";
      page.classList.add("active");
    }

    D.ui.lastPage = pageId;

    renderAll();
  }

  function goHome() {
    show("home");
  }

  function back() {
    show("home");
  }

  /* =========================================================
     PERSONAL / BUSINESS MODE
     ========================================================= */

  function setMode(mode) {
    D.mode = mode === "business" ? "business" : "personal";
    D.ui.selectedMode = D.mode;

    const label = $("modeLabel");
    if (label) {
      label.textContent =
        D.mode === "business" ? "Business" : "Personal";
    }

    const p = $("personalModeBtn");
    const b = $("businessModeBtn");

    if (p) p.classList.toggle("active", D.mode === "personal");
    if (b) b.classList.toggle("active", D.mode === "business");

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
    const type = $("transactionType")
      ? $("transactionType").value
      : "expense";

    const amount = parseFloat(
      $("transactionAmount")
        ? $("transactionAmount").value
        : ""
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Please enter a valid amount.");
      return;
    }

    const category = $("transactionCategory")
      ? $("transactionCategory").value.trim()
      : "";

    const note = $("transactionNote")
      ? $("transactionNote").value.trim()
      : "";

    const date = $("transactionDate")
      ? ($("transactionDate").value || today())
      : today();

    D.transactions.push({
      id: id(),
      mode: D.mode,
      type: type,
      amount: amount,
      category: category || "General",
      note: note,
      date: date,
      createdAt: Date.now()
    });

    save();

    if ($("transactionAmount")) $("transactionAmount").value = "";
    if ($("transactionCategory")) $("transactionCategory").value = "";
    if ($("transactionNote")) $("transactionNote").value = "";

    renderAll();
    alertMsg("Transaction added.");
  }

  function deleteTransaction(txId) {
    D.transactions = D.transactions.filter(x => x.id !== txId);
    save();
    renderAll();
  }

  /* =========================================================
     UDHAR / KHATA
     ========================================================= */

  function openKhataForm(mode) {
    D.ui.selectedMode = mode || D.mode;

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
    if (form) form.style.display = "none";
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
      ? ($("khataDate").value || today())
      : today();

    const method = $("khataMethod")
      ? $("khataMethod").value
      : "Cash";

    const status = $("khataStatus")
      ? $("khataStatus").value
      : "pending";

    const note = $("khataNote")
      ? $("khataNote").value.trim()
      : "";

    D.khata.push({
      id: id(),
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
    return D.khata.filter(x =>
      (x.mode || "personal") === mode
    );
  }

  function deleteKhata(kid) {
    D.khata = D.khata.filter(x => x.id !== kid);
    save();
    renderAll();
  }

  function openKhataDetail(person, mode) {
    D.ui.selectedPerson = person;
    D.ui.selectedMode = mode || D.mode;

    const page = $("khataDetail");
    if (page) {
      page.style.display = "";
      page.classList.add("active");
    }

    renderKhataDetail();
  }

  function closeKhataDetail() {
    const page = $("khataDetail");
    if (page) page.style.display = "none";
  }

  function renderKhataDetail() {
    const person = D.ui.selectedPerson;
    const mode = D.ui.selectedMode || D.mode;

    const list = currentKhata(mode)
      .filter(x => x.person === person);

    let give = 0;
    let receive = 0;

    list.forEach(x => {
      if (x.type === "give") give += Number(x.amount) || 0;
      if (x.type === "receive") receive += Number(x.amount) || 0;
    });

    if ($("detailPersonName"))
      $("detailPersonName").textContent = person || "Khata";

    if ($("detailGive"))
      $("detailGive").textContent = money(give);

    if ($("detailReceive"))
      $("detailReceive").textContent = money(receive);

    if ($("detailBalance"))
      $("detailBalance").textContent = money(give - receive);
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
    const label = type === "supplier"
      ? "Supplier Name:"
      : "Customer Name:";

    const name = prompt(label);

    if (!name || !name.trim()) return;

    D.business.push({
      id: id(),
      type: type,
      name: name.trim(),
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
    D.business = D.business.filter(x => x.id !== contactId);
    save();
    renderBusiness();
  }

  /* =========================================================
     #1 BUSINESS SALES
     ========================================================= */

  function addBusinessSale() {
    const customer = prompt("Customer Name:");

    if (!customer || !customer.trim()) return;

    const amount = parseFloat(
      prompt("Sale Amount:")
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Please enter a valid Sale Amount.");
      return;
    }

    const date =
      prompt("Sale Date:", today()) || today();

    const method =
      prompt("Payment Method:", "Cash") || "Cash";

    const note =
      prompt("Sale Note:", "") || "";

    const statusInput =
      prompt(
        "Status (completed / pending):",
        "completed"
      ) || "completed";

    const status =
      statusInput.toLowerCase() === "pending"
        ? "pending"
        : "completed";

    D.sales.push({
      id: id(),
      mode: "business",
      customer: customer.trim(),
      amount: amount,
      date: date,
      method: method.trim(),
      note: note.trim(),
      status: status,
      createdAt: Date.now()
    });

    save();
    renderBusiness();

    alertMsg("Sale entry added successfully.");
  }

  /* =========================================================
     #1 BUSINESS PURCHASE
     ========================================================= */

  function addBusinessPurchase() {
    const supplier = prompt("Supplier Name:");

    if (!supplier || !supplier.trim()) return;

    const amount = parseFloat(
      prompt("Purchase Amount:")
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Please enter a valid Purchase Amount.");
      return;
    }

    const date =
      prompt("Purchase Date:", today()) || today();

    const method =
      prompt("Payment Method:", "Cash") || "Cash";

    const note =
      prompt("Purchase Note:", "") || "";

    const statusInput =
      prompt(
        "Status (completed / pending):",
        "completed"
      ) || "completed";

    const status =
      statusInput.toLowerCase() === "pending"
        ? "pending"
        : "completed";

    D.purchases.push({
      id: id(),
      mode: "business",
      supplier: supplier.trim(),
      amount: amount,
      date: date,
      method: method.trim(),
      note: note.trim(),
      status: status,
      createdAt: Date.now()
    });

    save();
    renderBusiness();

    alertMsg("Purchase entry added successfully.");
  }

  function deleteBusinessSale(saleId) {
    D.sales = D.sales.filter(x => x.id !== saleId);
    save();
    renderBusiness();
  }

  function deleteBusinessPurchase(purchaseId) {
    D.purchases = D.purchases.filter(x => x.id !== purchaseId);
    save();
    renderBusiness();
  }

  /* =========================================================
     BUSINESS FILTER
     ========================================================= */

  function businessFilter(filter, button) {
    D.ui.businessFilter = filter;

    document.querySelectorAll(
      ".business-filter button, .business-tabs button"
    ).forEach(function (b) {
      b.classList.remove("active");
    });

    if (button) button.classList.add("active");

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

    const searchEl = $("businessSearch");
    const search = searchEl
      ? searchEl.value.trim().toLowerCase()
      : "";

    const businessKhata = currentKhata("business");

    let given = 0;
    let received = 0;

    businessKhata.forEach(x => {
      if (x.type === "give")
        given += Number(x.amount) || 0;

      if (x.type === "receive")
        received += Number(x.amount) || 0;
    });

    if ($("businessGiven"))
      $("businessGiven").textContent = money(given);

    if ($("businessReceived"))
      $("businessReceived").textContent = money(received);

    if ($("businessNet"))
      $("businessNet").textContent = money(given - received);

    /* SALES */

    if (filter === "sales") {
      let sales = D.sales.slice();

      if (search) {
        sales = sales.filter(x =>
          `${x.customer} ${x.amount} ${x.date} ${x.method} ${x.note}`
            .toLowerCase()
            .includes(search)
        );
      }

      const total = sales.reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

      let html = `
        <div class="summary-card">
          <small>Total Sales</small>
          <strong>${money(total)}</strong>
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

      sales.sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );

      sales.forEach(function (x) {
        html += `
          <div class="list-item business-sale-item">
            <strong>🛒 ${esc(x.customer)}</strong>
            <div>${money(x.amount)}</div>
            <small>
              ${esc(x.date)}
              • ${esc(x.method)}
              • ${esc(x.status || "completed")}
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

    /* PURCHASE */

    if (filter === "purchase") {
      let purchases = D.purchases.slice();

      if (search) {
        purchases = purchases.filter(x =>
          `${x.supplier} ${x.amount} ${x.date} ${x.method} ${x.note}`
            .toLowerCase()
            .includes(search)
        );
      }

      const total = purchases.reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

      let html = `
        <div class="summary-card">
          <small>Total Purchase</small>
          <strong>${money(total)}</strong>
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

      purchases.sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );

      purchases.forEach(function (x) {
        html += `
          <div class="list-item business-purchase-item">
            <strong>📦 ${esc(x.supplier)}</strong>
            <div>${money(x.amount)}</div>
            <small>
              ${esc(x.date)}
              • ${esc(x.method)}
              • ${esc(x.status || "completed")}
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

    /* CUSTOMERS / SUPPLIERS */

    if (
      filter === "customer" ||
      filter === "supplier"
    ) {
      const contacts = D.business.filter(x =>
        x.type === filter &&
        (
          !search ||
          x.name.toLowerCase().includes(search)
        )
      );

      let html = "";

      if (filter === "customer") {
        html += `
          <button type="button"
            onclick="addBusinessCustomer()">
            ➕ Add Customer
          </button>
        `;
      } else {
        html += `
          <button type="button"
            onclick="addBusinessSupplier()">
            ➕ Add Supplier
          </button>
        `;
      }

      if (!contacts.length) {
        html += `
          <div class="empty-state">
            No ${filter} entries yet.
          </div>
        `;
      }

      contacts.forEach(function (c) {
        const history = businessKhata.filter(
          x =>
            x.person === c.name &&
            (
              filter === "customer" ||
              filter === "supplier"
            )
        );

        let give = 0;
        let receive = 0;

        history.forEach(function (x) {
          if (x.type === "give")
            give += Number(x.amount) || 0;

          if (x.type === "receive")
            receive += Number(x.amount) || 0;
        });

        html += `
          <div class="list-item">
            <strong>
              ${filter === "customer" ? "👤" : "🚚"}
              ${esc(c.name)}
            </strong>

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

    const savedAmount = parseFloat(
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
      id: id(),
      name: name,
      target: target,
      saved: savedAmount,
      date: date,
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
        $("cardBill") ? $("cardBill").value : ""
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

    if (!name) name = type;

    if (!Number.isFinite(amount) || amount <= 0) {
      alertMsg("Enter valid bill amount.");
      return;
    }

    D.bills.push({
      id: id(),
      name: name,
      type: type,
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
        : ""
    );

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
      alertMsg("Please enter valid loan details.");
      return;
    }

    const monthlyRate = rate / 12 / 100;

    let emi;

    if (monthlyRate === 0) {
      emi = principal / months;
    } else {
      emi =
        principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    const result = $("emiResult");

    if (result) {
      result.innerHTML = `
        <div class="summary-card">
          <small>Monthly EMI</small>
          <strong>${money(emi)}</strong>
        </div>
        <div>
          Total Payment:
          <strong>${money(emi * months)}</strong>
        </div>
      `;
    }

    D.loans.push({
      id: id(),
      principal: principal,
      rate: rate || 0,
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
      id: id(),
      name: name,
      date: date || today(),
      createdAt: Date.now()
    });

    save();
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
      alertMsg("Enter family member name.");
      return;
    }

    D.family.push({
      id: id(),
      name: name,
      createdAt: Date.now()
    });

    save();

    if ($("familyName"))
      $("familyName").value = "";

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
        : ""
    );

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
      p * Math.pow(
        1 + ((r || 0) / 100) / 12,
        n
      );

    if ($("fdResult")) {
      $("fdResult").innerHTML =
        `<strong>Maturity: ${money(maturity)}</strong>`;
    }
  }

  function addInsurance() {
    const name = prompt("Insurance name:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "insurance",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Insurance added.");
  }

  function addSchool() {
    const name = prompt("School / Education name:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "school",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Education entry added.");
  }

  function addVehicle() {
    const name = prompt("Vehicle name:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "vehicle",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Vehicle entry added.");
  }

  function addShopping() {
    const name = prompt("Shopping item:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "shopping",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Shopping entry added.");
  }

  function addUtility() {
    const name = prompt("Utility name:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "utility",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Utility added.");
  }

  function calcEmergency() {
    const monthly = parseFloat(
      prompt("Monthly essential expenses:", "0")
    ) || 0;

    const months = parseFloat(
      prompt("Emergency months:", "6")
    ) || 6;

    alertMsg(
      "Recommended Emergency Fund: " +
      money(monthly * months)
    );
  }

  function addDoc() {
    const name = prompt("Document name:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "document",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Document entry added.");
  }

  function addAnnual() {
    const name = prompt("Annual plan:");
    if (!name) return;

    D.tools.push({
      id: id(),
      type: "annual",
      name: name,
      createdAt: Date.now()
    });

    save();
    alertMsg("Annual planning entry added.");
  }

  /* =========================================================
     LANGUAGE / CURRENCY
     ========================================================= */

  function toggleLanguage() {
    D.language =
      D.language === "hi" ? "en" : "hi";

    save();
    applyLanguage();
    renderAll();
  }

  function toggleCurrency() {
    D.currency =
      D.currency === "₹" ? "$" : "₹";

    save();
    renderAll();
  }

  function applyLanguage() {
    document.documentElement.lang =
      D.language === "hi" ? "hi" : "en";
  }

  /* =========================================================
     BACKUP / RESTORE
     ========================================================= */

  function exportBackup() {
    const data = JSON.stringify(D, null, 2);

    const blob = new Blob(
      [data],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
      "HISAB-backup-" + today() + ".json";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function importBackup(event) {
    const file =
      event &&
      event.target &&
      event.target.files
        ? event.target.files[0]
        : null;

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
      try {
        const imported =
          JSON.parse(reader.result);

        D = {
          ...JSON.parse(JSON.stringify(DEFAULT)),
          ...imported,
          transactions:
            Array.isArray(imported.transactions)
              ? imported.transactions
              : [],
          khata:
            Array.isArray(imported.khata)
              ? imported.khata
              : [],
          business:
            Array.isArray(imported.business)
              ? imported.business
              : [],
          sales:
            Array.isArray(imported.sales)
              ? imported.sales
              : [],
          purchases:
            Array.isArray(imported.purchases)
              ? imported.purchases
              : []
        };

        save();
        renderAll();

        alertMsg("Backup restored successfully.");
      } catch (e) {
        alertMsg("Invalid backup file.");
      }
    };

    reader.readAsText(file);
  }

  /* =========================================================
     SECURITY PIN
     ========================================================= */

  function setPin() {
    const pin = $("pinInput")
      ? $("pinInput").value.trim()
      : "";

    if (!/^\d{4,6}$/.test(pin)) {
      alertMsg("PIN must be 4 to 6 digits.");
      return;
    }

    D.pin = pin;
    save();

    if ($("pinInput"))
      $("pinInput").value = "";

    alertMsg("Security PIN saved.");
  }

  function lockApp() {
    if (!D.pin) {
      alertMsg("Please set a PIN first.");
      return;
    }

    sessionStorage.removeItem("hisab_unlocked");

    alertMsg(
      "HISAB locked. Reopen the app to unlock."
    );
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  function searchAllData(value) {
    const q = String(value || "")
      .trim()
      .toLowerCase();

    const box = $("searchResults");
    if (!box) return;

    if (!q) {
      box.innerHTML = "";
      return;
    }

    const results = [];

    D.transactions.forEach(x => {
      const text =
        `${x.type} ${x.category} ${x.note} ${x.amount}`;

      if (text.toLowerCase().includes(q)) {
        results.push(
          `💰 ${x.type} — ${money(x.amount)}`
        );
      }
    });

    D.khata.forEach(x => {
      const text =
        `${x.person} ${x.type} ${x.note} ${x.amount}`;

      if (text.toLowerCase().includes(q)) {
        results.push(
          `📒 ${x.person} — ${x.type} ${money(x.amount)}`
        );
      }
    });

    D.sales.forEach(x => {
      const text =
        `${x.customer} ${x.note} ${x.amount}`;

      if (text.toLowerCase().includes(q)) {
        results.push(
          `🛒 Sale — ${x.customer} — ${money(x.amount)}`
        );
      }
    });

    D.purchases.forEach(x => {
      const text =
        `${x.supplier} ${x.note} ${x.amount}`;

      if (text.toLowerCase().includes(q)) {
        results.push(
          `📦 Purchase — ${x.supplier} — ${money(x.amount)}`
        );
      }
    });

    D.business.forEach(x => {
      if (x.name.toLowerCase().includes(q)) {
        results.push(
          `💼 ${x.type} — ${x.name}`
        );
      }
    });

    box.innerHTML = results.length
      ? results.map(x =>
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

    D.transactions.forEach(x => {
      if (x.mode !== D.mode) return;

      if (x.type === "income")
        income += Number(x.amount) || 0;

      if (x.type === "expense")
        expense += Number(x.amount) || 0;
    });

    currentKhata(D.mode).forEach(x => {
      if (x.type === "give")
        give += Number(x.amount) || 0;

      if (x.type === "receive")
        receive += Number(x.amount) || 0;
    });

    if ($("reportIncome"))
      $("reportIncome").textContent = money(income);

    if ($("reportExpense"))
      $("reportExpense").textContent = money(expense);

    if ($("reportGive"))
      $("reportGive").textContent = money(give);

    if ($("reportReceive"))
      $("reportReceive").textContent = money(receive);
  }

  function exportSummary() {
    const text =
      "HISAB Money Summary\n\n" +
      "Income: " +
      ($("reportIncome")
        ? $("reportIncome").textContent
        : money(0)) +
      "\nExpense: " +
      ($("reportExpense")
        ? $("reportExpense").textContent
        : money(0)) +
      "\nGive: " +
      ($("reportGive")
        ? $("reportGive").textContent
        : money(0)) +
      "\nReceive: " +
      ($("reportReceive")
        ? $("reportReceive").textContent
        : money(0));

    if (navigator.share) {
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
      "PDF export will use the browser print/share option."
    );

    setTimeout(function () {
      window.print();
    }, 100);
  }

  /* =========================================================
     HOME SUMMARY
     ========================================================= */

  function renderHome() {
    const mode = D.mode;

    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions.forEach(x => {
      if (x.mode !== mode) return;

      if (x.type === "income")
        income += Number(x.amount) || 0;

      if (x.type === "expense")
        expense += Number(x.amount) || 0;
    });

    currentKhata(mode).forEach(x => {
      if (x.type === "give")
        give += Number(x.amount) || 0;

      if (x.type === "receive")
        receive += Number(x.amount) || 0;
    });

    const balance =
      income - expense + receive - give;

    if ($("homeBalance"))
      $("homeBalance").textContent = money(balance);

    if ($("receivable"))
      $("receivable").textContent = money(receive);

    if ($("payable"))
      $("payable").textContent = money(give);

    if ($("ledgerGiven"))
      $("ledgerGiven").textContent = money(give);

    if ($("ledgerReceived"))
      $("ledgerReceived").textContent = money(receive);

    if ($("ledgerNet"))
      $("ledgerNet").textContent =
        money(give - receive);

    if ($("modeLabel"))
      $("modeLabel").textContent =
        mode === "business"
          ? "Business"
          : "Personal";
  }

  /* =========================================================
     RENDER ALL
     ========================================================= */

  function renderAll() {
    applyLanguage();
    renderHome();
    renderBusiness();
    renderReports();
    renderKhataDetail();

    const budgetEl = $("budgetAmount");

    if (budgetEl && D.budget) {
      budgetEl.value = D.budget;
    }
  }

  /* =========================================================
     GLOBAL EXPORTS
     ========================================================= */

  window.D = D;

  window.show = show;
  window.back = back;
  window.goHome = goHome;

  window.setMode = setMode;

  window.addTransaction = addTransaction;
  window.deleteTransaction = deleteTransaction;

  window.openKhataForm = openKhataForm;
  window.closeKhataForm = closeKhataForm;
  window.saveKhataEntry = saveKhataEntry;
  window.openKhataDetail = openKhataDetail;
  window.closeKhataDetail = closeKhataDetail;
  window.deleteKhata = deleteKhata;

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

  window.calcBudget = calcBudget;
  window.calcGoal = calcGoal;

  window.addBill = addBill;
  window.calcEMI = calcEMI;

  window.addReminder = addReminder;
  window.addFamilyMember = addFamilyMember;

  window.calcFD = calcFD;
  window.addInsurance = addInsurance;
  window.addSchool = addSchool;
  window.addVehicle = addVehicle;
  window.addShopping = addShopping;
  window.addUtility = addUtility;
  window.calcEmergency = calcEmergency;
  window.addDoc = addDoc;
  window.addAnnual = addAnnual;

  window.toggleLanguage = toggleLanguage;
  window.toggleCurrency = toggleCurrency;

  window.exportBackup = exportBackup;
  window.importBackup = importBackup;

  window.setPin = setPin;
  window.lockApp = lockApp;

  window.searchAllData = searchAllData;

  window.exportSummary = exportSummary;
  window.exportSummaryPDF = exportSummaryPDF;

  /* =========================================================
     STARTUP
     ========================================================= */

  document.addEventListener("DOMContentLoaded", function () {

    if ($("transactionDate") &&
        !$("transactionDate").value) {
      $("transactionDate").value = today();
    }

    if ($("khataDate") &&
        !$("khataDate").value) {
      $("khataDate").value = today();
    }

    if ($("billDue") &&
        !$("billDue").value) {
      $("billDue").value = today();
    }

    if ($("cardDue") &&
        !$("cardDue").value) {
      $("cardDue").value = today();
    }

    if ($("reminderDate") &&
        !$("reminderDate").value) {
      $("reminderDate").value = today();
    }

    if ($("goalDate") &&
        !$("goalDate").value) {
      $("goalDate").value = today();
    }

    const guestGate = $("guestGate");

    if (guestGate) {
      const guest =
        localStorage.getItem(GUEST_KEY);

      if (!guest) {
        guestGate.style.display = "";
      }
    }

    renderAll();
  });

})();
