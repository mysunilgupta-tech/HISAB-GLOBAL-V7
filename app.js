(() => {
  "use strict";

  /* =========================================================
     HISAB GLOBAL V7
     FINAL LOCAL-FIRST MONEY MANAGER
     Personal + Business
     PART 1 — CORE / DATA / DASHBOARD / INCOME / EXPENSE /
     LEN-DEN / SAFE ACTION SYSTEM
     ========================================================= */

  const APP_VERSION = 7;
  const STORAGE_KEY = "hisab_v7_complete";

  const PAYMENT_METHODS = [
    "Cash",
    "UPI",
    "Bank Transfer",
    "Debit Card",
    "Credit Card",
    "Wallet",
    "Cheque",
    "Other"
  ];

  const ENTRY_COLORS = [
    ["default", "Default"],
    ["green", "Green"],
    ["red", "Red"],
    ["blue", "Blue"],
    ["orange", "Orange"],
    ["purple", "Purple"],
    ["yellow", "Yellow"]
  ];

  const GOAL_PURPOSES = [
    "Emergency Fund",
    "Home",
    "Car / Bike",
    "Education",
    "Wedding",
    "Travel",
    "Shopping",
    "Business",
    "Investment",
    "Medical",
    "Child",
    "Retirement",
    "Other"
  ];

  const EXPENSE_CATEGORIES = [
    "Grocery",
    "Food",
    "Rent",
    "Home",
    "Fuel",
    "Travel",
    "Shopping",
    "Medical",
    "School",
    "Education",
    "Bills",
    "Insurance",
    "EMI",
    "Entertainment",
    "Subscription",
    "Business",
    "Family",
    "Other"
  ];

  const INCOME_CATEGORIES = [
    "Salary",
    "Business",
    "Freelance",
    "Interest",
    "Rent Received",
    "Gift",
    "Refund",
    "Other"
  ];

  const DEFAULT_DATA = {
    version: APP_VERSION,

    mode: "personal",

    currency: "₹",

    language: "English",

    theme: "light",

    transactions: [],

    ledger: [],

    budgets: [],

    savings: [],

    goals: [],

    bills: [],

    reminders: [],

    subscriptions: [],

    loans: [],

    business: {
      customers: [],
      suppliers: [],
      sales: [],
      purchases: [],
      transactions: []
    },

    accounts: [],

    familyMembers: [],

    shopping: [],

    utilities: [],

    insurance: [],

    schools: [],

    vehicles: [],

    documents: [],

    annualPlans: [],

    limits: {},

    deleted: [],

    categories: {
      income: [...INCOME_CATEGORIES],
      expense: [...EXPENSE_CATEGORIES]
    },

    settings: {
      currency: "₹",
      language: "English",
      theme: "light",
      hideBalances: false,
      autoBackupReminder: true,
      lockEnabled: false,
      autoLockMinutes: 0
    }
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function uid(prefix = "id") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 9)
    );
  }

  function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    const amount = safeNumber(value);

    if (
      data.settings &&
      data.settings.hideBalances
    ) {
      return "••••";
    }

    return (
      data.currency +
      amount.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    );
  }

  function dateOnly(value) {
    if (!value) return "";

    try {
      return new Date(value).toLocaleDateString(
        "en-IN"
      );
    } catch {
      return String(value);
    }
  }

  function dateTime(value) {
    if (!value) return "";

    try {
      return new Date(value).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );
    } catch {
      return String(value);
    }
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);

      return raw
        ? JSON.parse(raw)
        : null;
    } catch (error) {
      console.error(
        "HISAB load error:",
        key,
        error
      );

      return null;
    }
  }

  function mergeData(base, incoming) {
    if (
      !incoming ||
      typeof incoming !== "object"
    ) {
      return deepClone(base);
    }

    const output = deepClone(base);

    Object.keys(incoming).forEach(key => {
      const value = incoming[key];

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        output[key] &&
        typeof output[key] === "object" &&
        !Array.isArray(output[key])
      ) {
        output[key] = mergeData(
          output[key],
          value
        );
      } else {
        output[key] = value;
      }
    });

    return output;
  }

  /* =========================================================
     LOAD / SAVE
     ========================================================= */

  function convertLegacyPeople(obj) {
    if (
      !obj ||
      typeof obj !== "object"
    ) {
      return obj;
    }

    const result = deepClone(obj);

    if (!Array.isArray(result.ledger)) {
      result.ledger = [];
    }

    ["personal", "business"].forEach(
      scope => {
        if (
          !result[scope] ||
          typeof result[scope] !== "object"
        ) {
          return;
        }

        const people =
          result[scope].people;

        if (!Array.isArray(people)) {
          return;
        }

        people.forEach(person => {
          if (
            !person ||
            !Array.isArray(
              person.transactions
            )
          ) {
            return;
          }

          person.transactions.forEach(tx => {
            result.ledger.push({
              id: uid("legacy"),

              scope,

              person:
                person.name ||
                "Unknown",

              phone:
                person.phone ||
                "",

              kind:
                tx.kind ||
                tx.type ||
                "given",

              amount:
                safeNumber(tx.amount),

              paymentMethod:
                tx.paymentMethod ||
                "Cash",

              color:
                tx.color ||
                "default",

              note:
                tx.note ||
                "",

              date:
                tx.date ||
                today(),

              time:
                tx.time ||
                "",

              status:
                tx.status ||
                "pending",

              createdAt:
                tx.createdAt ||
                nowISO()
            });
          });
        });
      }
    );

    return result;
  }

  let loaded =
    loadJSON(STORAGE_KEY) ||
    loadJSON("hisab_v7_data") ||
    loadJSON("hisabData");

  loaded = convertLegacyPeople(
    loaded
  );

  let data = mergeData(
    DEFAULT_DATA,
    loaded || {}
  );

  function normalize() {
    if (
      !data ||
      typeof data !== "object"
    ) {
      data = deepClone(
        DEFAULT_DATA
      );
    }

    data.version = APP_VERSION;

    const arrays = [
      "transactions",
      "ledger",
      "budgets",
      "savings",
      "goals",
      "bills",
      "reminders",
      "subscriptions",
      "loans",
      "accounts",
      "familyMembers",
      "shopping",
      "utilities",
      "insurance",
      "schools",
      "vehicles",
      "documents",
      "annualPlans",
      "deleted"
    ];

    arrays.forEach(key => {
      if (!Array.isArray(data[key])) {
        data[key] = [];
      }
    });

    if (
      !data.business ||
      typeof data.business !== "object"
    ) {
      data.business =
        deepClone(
          DEFAULT_DATA.business
        );
    }

    [
      "customers",
      "suppliers",
      "sales",
      "purchases",
      "transactions"
    ].forEach(key => {
      if (
        !Array.isArray(
          data.business[key]
        )
      ) {
        data.business[key] = [];
      }
    });

    if (
      !data.categories ||
      typeof data.categories !== "object"
    ) {
      data.categories =
        deepClone(
          DEFAULT_DATA.categories
        );
    }

    if (
      !Array.isArray(
        data.categories.income
      )
    ) {
      data.categories.income =
        [...INCOME_CATEGORIES];
    }

    if (
      !Array.isArray(
        data.categories.expense
      )
    ) {
      data.categories.expense =
        [...EXPENSE_CATEGORIES];
    }

    if (
      !data.settings ||
      typeof data.settings !== "object"
    ) {
      data.settings =
        deepClone(
          DEFAULT_DATA.settings
        );
    }

    data.currency =
      data.currency ||
      data.settings.currency ||
      "₹";

    data.settings.currency =
      data.currency;

    data.language =
      data.language ||
      data.settings.language ||
      "English";

    data.settings.language =
      data.language;

    data.theme =
      data.theme ||
      data.settings.theme ||
      "light";

    data.settings.theme =
      data.theme;

    data.mode =
      data.mode === "business"
        ? "business"
        : "personal";

    data.ledger =
      data.ledger.map(item => ({
        id:
          item.id ||
          uid("ledger"),

        scope:
          item.scope ||
          "personal",

        person:
          item.person ||
          "Unknown",

        phone:
          item.phone ||
          "",

        kind:
          item.kind === "received"
            ? "received"
            : "given",

        amount:
          safeNumber(
            item.amount
          ),

        paymentMethod:
          item.paymentMethod ||
          "Cash",

        color:
          item.color ||
          "default",

        note:
          item.note ||
          "",

        date:
          item.date ||
          today(),

        time:
          item.time ||
          "",

        status:
          item.status ||
          "pending",

        createdAt:
          item.createdAt ||
          nowISO()
      }));

    data.transactions =
      data.transactions.map(
        item => ({
          id:
            item.id ||
            uid("txn"),

          type:
            item.type === "income"
              ? "income"
              : "expense",

          amount:
            safeNumber(
              item.amount
            ),

          category:
            item.category ||
            "Other",

          description:
            item.description ||
            item.note ||
            "",

          paymentMethod:
            item.paymentMethod ||
            "Cash",

          color:
            item.color ||
            "default",

          scope:
            item.scope ||
            data.mode,

          date:
            item.date ||
            today(),

          createdAt:
            item.createdAt ||
            nowISO()
        })
      );

    data.goals =
      data.goals.map(item => ({
        id:
          item.id ||
          uid("goal"),

        name:
          item.name ||
          "Goal",

        purpose:
          item.purpose ||
          "Other",

        target:
          safeNumber(
            item.target
          ),

        saved:
          safeNumber(
            item.saved
          ),

        deadline:
          item.deadline ||
          "",

        color:
          item.color ||
          "default",

        note:
          item.note ||
          "",

        createdAt:
          item.createdAt ||
          nowISO()
      }));

    data.savings =
      data.savings.map(item => ({
        id:
          item.id ||
          uid("saving"),

        name:
          item.name ||
          "Savings",

        amount:
          safeNumber(
            item.amount
          ),

        target:
          safeNumber(
            item.target
          ),

        note:
          item.note ||
          "",

        date:
          item.date ||
          today(),

        createdAt:
          item.createdAt ||
          nowISO()
      }));

    data.budgets =
      data.budgets.map(item => ({
        id:
          item.id ||
          uid("budget"),

        name:
          item.name ||
          "Budget",

        category:
          item.category ||
          "Overall",

        amount:
          safeNumber(
            item.amount
          ),

        spent:
          safeNumber(
            item.spent
          ),

        month:
          item.month ||
          today().slice(0, 7),

        note:
          item.note ||
          "",

        createdAt:
          item.createdAt ||
          nowISO()
      }));

    data.bills =
      data.bills.map(item => ({
        id:
          item.id ||
          uid("bill"),

        name:
          item.name ||
          "Bill",

        amount:
          safeNumber(
            item.amount
          ),

        dueDate:
          item.dueDate ||
          today(),

        category:
          item.category ||
          "Bills",

        paymentMethod:
          item.paymentMethod ||
          "Cash",

        recurring:
          Boolean(
            item.recurring
          ),

        frequency:
          item.frequency ||
          "monthly",

        paid:
          Boolean(item.paid),

        note:
          item.note ||
          "",

        createdAt:
          item.createdAt ||
          nowISO()
      }));

    data.loans =
      data.loans.map(item => ({
        id:
          item.id ||
          uid("loan"),

        name:
          item.name ||
          "Loan",

        lender:
          item.lender ||
          "",

        principal:
          safeNumber(
            item.principal
          ),

        emi:
          safeNumber(
            item.emi
          ),

        interest:
          safeNumber(
            item.interest
          ),

        tenure:
          safeNumber(
            item.tenure
          ),

        dueDate:
          item.dueDate ||
          today(),

        paid:
          safeNumber(
            item.paid
          ),

        paymentMethod:
          item.paymentMethod ||
          "Bank Transfer",

        note:
          item.note ||
          "",

        createdAt:
          item.createdAt ||
          nowISO()
      }));
  }

  normalize();

  function save() {
    try {
      data.version =
        APP_VERSION;

      data.settings.currency =
        data.currency;

      data.settings.language =
        data.language;

      data.settings.theme =
        data.theme;

      const serialized =
        JSON.stringify(data);

      localStorage.setItem(
        STORAGE_KEY,
        serialized
      );

      localStorage.setItem(
        "hisab_v7_data",
        serialized
      );

      localStorage.setItem(
        "hisabData",
        serialized
      );

      return true;

    } catch (error) {

      console.error(
        "HISAB save error:",
        error
      );

      return false;
    }
  }

  save();

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.HISAB =
    window.HISAB || {};

  window.HISAB.data =
    data;

  window.HISAB.saveData =
    save;

  window.HISAB.save =
    save;

  window.HISAB.version =
    APP_VERSION;

  window.HISAB.paymentMethods =
    PAYMENT_METHODS;

  window.HISAB.entryColors =
    ENTRY_COLORS;

  window.HISAB.goalPurposes =
    GOAL_PURPOSES;

  window.HISAB.incomeCategories =
    INCOME_CATEGORIES;

  window.HISAB.expenseCategories =
    EXPENSE_CATEGORIES;

  /* =========================================================
     SCREEN HELPERS
     ========================================================= */

  function hideElement(el) {
    if (!el) return;

    el.style.display = "none";
    el.classList.add("hidden");
  }

  function showElement(
    el,
    display = ""
  ) {
    if (!el) return;

    el.classList.remove(
      "hidden"
    );

    el.style.display =
      display;
  }

  function showHome() {

    const splash =
      $("splashScreen");

    const welcome =
      $("welcomeScreen");

    const home =
      $("homeScreen");

    hideElement(splash);
    hideElement(welcome);

    if (home) {
      showElement(
        home,
        "block"
      );
    }

    updateDashboard();

    renderRecentActivity();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  window.showHome =
    showHome;

  function enterGuestMode() {
    showHome();
  }

  window.enterGuestMode =
    enterGuestMode;

  function show(id) {

    const target =
      $(id);

    if (!target) {
      showHome();
      return;
    }

    document
      .querySelectorAll(
        ".screen"
      )
      .forEach(screen => {

        screen.style.display =
          "none";

        screen.classList.remove(
          "active"
        );
      });

    target.style.display =
      "block";

    target.classList.add(
      "active"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  window.showScreen =
    show;

  /* =========================================================
     CALCULATIONS
     ========================================================= */

  function totalIncome(
    scope = null
  ) {

    return data.transactions
      .filter(
        tx =>
          !scope ||
          tx.scope === scope
      )
      .filter(
        tx =>
          tx.type === "income"
      )
      .reduce(
        (sum, tx) =>
          sum +
          safeNumber(
            tx.amount
          ),
        0
      );
  }

  function totalExpense(
    scope = null
  ) {

    return data.transactions
      .filter(
        tx =>
          !scope ||
          tx.scope === scope
      )
      .filter(
        tx =>
          tx.type === "expense"
      )
      .reduce(
        (sum, tx) =>
          sum +
          safeNumber(
            tx.amount
          ),
        0
      );
  }

  function totalGiven(
    scope = null
  ) {

    return data.ledger
      .filter(
        tx =>
          !scope ||
          tx.scope === scope
      )
      .filter(
        tx =>
          tx.kind === "given"
      )
      .filter(
        tx =>
          tx.status !==
          "settled"
      )
      .reduce(
        (sum, tx) =>
          sum +
          safeNumber(
            tx.amount
          ),
        0
      );
  }

  function totalReceived(
    scope = null
  ) {

    return data.ledger
      .filter(
        tx =>
          !scope ||
          tx.scope === scope
      )
      .filter(
        tx =>
          tx.kind ===
          "received"
      )
      .filter(
        tx =>
          tx.status !==
          "settled"
      )
      .reduce(
        (sum, tx) =>
          sum +
          safeNumber(
            tx.amount
          ),
        0
      );
  }

  function balance(
    scope = null
  ) {

    return (
      totalIncome(scope) -
      totalExpense(scope) +
      totalReceived(scope) -
      totalGiven(scope)
    );
  }

  window.HISAB.totalIncome =
    totalIncome;

  window.HISAB.totalExpense =
    totalExpense;

  window.HISAB.totalGiven =
    totalGiven;

  window.HISAB.totalReceived =
    totalReceived;

  window.HISAB.balance =
    balance;

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function updateDashboard() {

    const scope =
      data.mode;

    const income =
      totalIncome(scope);

    const expense =
      totalExpense(scope);

    const bal =
      balance(scope);

    const balanceEl =
      $("totalBalance");

    const incomeEl =
      $("totalIncome");

    const expenseEl =
      $("totalExpense");

    const currencyEl =
      $("currencyLabel");

    if (balanceEl) {
      balanceEl.textContent =
        money(bal);
    }

    if (incomeEl) {
      incomeEl.textContent =
        money(income);
    }

    if (expenseEl) {
      expenseEl.textContent =
        money(expense);
    }

    if (currencyEl) {
      currencyEl.textContent =
        data.currency;
    }

    updateModeButtons();

    renderRecentActivity();
  }

  window.updateDashboard =
    updateDashboard;

  function updateModeButtons() {

    const personal =
      $("personalBtn");

    const business =
      $("businessBtn");

    if (personal) {

      personal.classList.toggle(
        "active",
        data.mode ===
          "personal"
      );
    }

    if (business) {

      business.classList.toggle(
        "active",
        data.mode ===
          "business"
      );
    }
  }

  function setMode(mode) {

    data.mode =
      mode === "business"
        ? "business"
        : "personal";

    save();

    updateDashboard();
  }

  window.setMode =
    setMode;

  /* =========================================================
     MODAL SYSTEM
     ========================================================= */

  function removeModal() {

    const old =
      $("hisabModal");

    if (old) {
      old.remove();
    }
  }

  function closeHisabModal() {
    removeModal();
  }

  window.closeHisabModal =
    closeHisabModal;

  function modal(
    title,
    body,
    buttons = ""
  ) {

    removeModal();

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.id =
      "hisabModal";

    wrapper.innerHTML = `
      <div
        class="modal-overlay"
        onclick="if(event.target===this)closeHisabModal()"
      >
        <div class="modal-card">

          <div class="modal-inner">

            <div style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:12px;
              margin-bottom:16px;
            ">

              <h2 style="margin:0">
                ${esc(title)}
              </h2>

              <button
                type="button"
                class="close-btn"
                onclick="closeHisabModal()"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <div>
              ${body}
            </div>

            ${
              buttons
                ? `
                  <div style="
                    display:flex;
                    gap:10px;
                    margin-top:18px;
                    flex-wrap:wrap;
                  ">
                    ${buttons}
                  </div>
                `
                : ""
            }

          </div>

        </div>
      </div>
    `;

    document.body.appendChild(
      wrapper
    );
  }

  function inputField(
    id,
    label,
    value = "",
    type = "text",
    placeholder = ""
  ) {

    return `
      <label style="
        display:block;
        margin-bottom:12px;
      ">

        <span style="
          display:block;
          font-weight:700;
          margin-bottom:6px;
        ">
          ${esc(label)}
        </span>

        <input
          id="${esc(id)}"
          type="${esc(type)}"
          value="${esc(value)}"
          placeholder="${esc(
            placeholder
          )}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border-radius:12px;
            border:1px solid #d7dee5;
            background:#fff;
            font:inherit;
          "
        >

      </label>
    `;
  }

  function selectField(
    id,
    label,
    options,
    selected = ""
  ) {

    return `
      <label style="
        display:block;
        margin-bottom:12px;
      ">

        <span style="
          display:block;
          font-weight:700;
          margin-bottom:6px;
        ">
          ${esc(label)}
        </span>

        <select
          id="${esc(id)}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border-radius:12px;
            border:1px solid #d7dee5;
            background:#fff;
            font:inherit;
          "
        >

          ${options
            .map(option => {

              const value =
                Array.isArray(option)
                  ? option[0]
                  : option;

              const text =
                Array.isArray(option)
                  ? option[1]
                  : option;

              return `
                <option
                  value="${esc(value)}"
                  ${
                    String(value) ===
                    String(selected)
                      ? "selected"
                      : ""
                  }
                >
                  ${esc(text)}
                </option>
              `;
            })
            .join("")}

        </select>

      </label>
    `;
  }

  function primaryButton(
    id,
    text
  ) {

    return `
      <button
        type="button"
        class="primary-btn"
        id="${esc(id)}"
      >
        ${esc(text)}
      </button>
    `;
  }

  function secondaryButton(
    id,
    text
  ) {

    return `
      <button
        type="button"
        class="secondary-btn"
        id="${esc(id)}"
      >
        ${esc(text)}
      </button>
    `;
  }

  /* =========================================================
     TRANSACTION FORM
     ========================================================= */

  function addTransaction(
    type
  ) {

    const isIncome =
      type === "income";

    const categories =
      isIncome
        ? data.categories.income
        : data.categories.expense;

    const body = `

      ${inputField(
        "txAmount",
        "Amount",
        "",
        "number",
        "Enter amount"
      )}

      ${selectField(
        "txCategory",
        "Category",
        categories
      )}

      ${inputField(
        "txDescription",
        "Description / Note",
        "",
        "text",
        "Optional"
      )}

      ${selectField(
        "txPayment",
        "Payment Method",
        PAYMENT_METHODS
      )}

      ${selectField(
        "txColor",
        "Colour",
        ENTRY_COLORS
      )}

      ${inputField(
        "txDate",
        "Date",
        today(),
        "date"
      )}

    `;

    modal(
      isIncome
        ? "Add Income"
        : "Add Expense",

      body,

      primaryButton(
        "saveTransactionBtn",
        "Save"
      ) +

      secondaryButton(
        "cancelTransactionBtn",
        "Cancel"
      )
    );

    const cancelBtn =
      $("cancelTransactionBtn");

    const saveBtn =
      $("saveTransactionBtn");

    if (cancelBtn) {
      cancelBtn.onclick =
        closeHisabModal;
    }

    if (saveBtn) {

      saveBtn.onclick = () => {

        const amount =
          safeNumber(
            $("txAmount")?.value
          );

        if (amount <= 0) {

          alert(
            "Please enter a valid amount."
          );

          return;
        }

        data.transactions.push({

          id: uid("txn"),

          type:
            isIncome
              ? "income"
              : "expense",

          amount,

          category:
            $("txCategory")?.value ||
            "Other",

          description:
            $("txDescription")
              ?.value
              .trim() ||
            "",

          paymentMethod:
            $("txPayment")?.value ||
            "Cash",

          color:
            $("txColor")?.value ||
            "default",

          scope:
            data.mode,

          date:
            $("txDate")?.value ||
            today(),

          createdAt:
            nowISO()
        });

        save();

        closeHisabModal();

        updateDashboard();

        renderRecentActivity();
      };
    }
  }

  window.addTransaction =
    addTransaction;

  window.showIncome =
    () =>
      addTransaction(
        "income"
      );

  window.showExpense =
    () =>
      addTransaction(
        "expense"
      );

  /* =========================================================
     PERSON / LEN-DEN
     ========================================================= */

  function getPeople(scope) {

    const names = [];

    data.ledger
      .filter(
        x =>
          x.scope === scope
      )
      .forEach(x => {

        if (
          x.person &&
          !names.includes(
            x.person
          )
        ) {
          names.push(
            x.person
          );
        }
      });

    if (
      scope === "business"
    ) {

      data.business.customers
        .forEach(x => {

          if (
            x.name &&
            !names.includes(
              x.name
            )
          ) {
            names.push(
              x.name
            );
          }
        });

      data.business.suppliers
        .forEach(x => {

          if (
            x.name &&
            !names.includes(
              x.name
            )
          ) {
            names.push(
              x.name
            );
          }
        });
    }

    return names;
  }

  function addPerson(
    scope = data.mode
  ) {

    const business =
      scope === "business";

    const body = `

      ${inputField(
        "personName",
        "Person / Party Name",
        "",
        "text",
        "Name"
      )}

      ${inputField(
        "personPhone",
        "Phone",
        "",
        "tel",
        "Optional"
      )}

      ${
        business
          ? selectField(
              "personType",
              "Type",
              [
                [
                  "customer",
                  "Customer"
                ],
                [
                  "supplier",
                  "Supplier"
                ],
                [
                  "both",
                  "Both"
                ]
              ]
            )
          : ""
      }

      ${inputField(
        "personNote",
        "Note",
        "",
        "text",
        "Optional"
      )}

    `;

    modal(

      business
        ? "Add Customer / Supplier"
        : "Add Person",

      body,

      primaryButton(
        "savePersonBtn",
        "Save"
      ) +

      secondaryButton(
        "cancelPersonBtn",
        "Cancel"
      )
    );

    const cancelBtn =
      $("cancelPersonBtn");

    const saveBtn =
      $("savePersonBtn");

    if (cancelBtn) {
      cancelBtn.onclick =
        closeHisabModal;
    }

    if (saveBtn) {

      saveBtn.onclick = () => {

        const name =
          $("personName")
            ?.value
            .trim();

        if (!name) {

          alert(
            "Please enter a name."
          );

          return;
        }

        const phone =
          $("personPhone")
            ?.value
            .trim() ||
          "";

        const note =
          $("personNote")
            ?.value
            .trim() ||
          "";

        if (business) {

          const type =
            $("personType")
              ?.value ||
            "customer";

          const person = {

            id:
              uid("person"),

            name,

            phone,

            note,

            createdAt:
              nowISO()
          };

          if (
            type === "customer" ||
            type === "both"
          ) {

            data.business.customers.push(
              deepClone(person)
            );
          }

          if (
            type === "supplier" ||
            type === "both"
          ) {

            data.business.suppliers.push(
              deepClone(person)
            );
          }
        }

        save();

        closeHisabModal();

        showLendDen();
      };
    }
  }

  window.addPerson =
    addPerson;

  function addTxn(
    scope,
    personIndex,
    kind
  ) {

    const people =
      getPeople(scope);

    const person =
      people[personIndex] ||
      "";

    const title =
      kind === "given"
        ? "Money Given"
        : "Money Received";

    const body = `

      ${
        people.length
          ? selectField(
              "ledgerPerson",
              "Person",
              people.map(
                x => [x, x]
              ),
              person
            )
          : inputField(
              "ledgerPerson",
              "Person",
              person,
              "text",
              "Enter person name"
            )
      }

      ${inputField(
        "ledgerAmount",
        "Amount",
        "",
        "number",
        "Enter amount"
      )}

      ${selectField(
        "ledgerPayment",
        "Payment Method",
        PAYMENT_METHODS
      )}

      ${selectField(
        "ledgerColor",
        "Colour",
        ENTRY_COLORS
      )}

      ${inputField(
        "ledgerNote",
        "Note",
        "",
        "text",
        "Optional"
      )}

      ${inputField(
        "ledgerDate",
        "Date",
        today(),
        "date"
      )}

    `;

    modal(

      title,

      body,

      primaryButton(
        "saveLedgerBtn",
        "Save"
      ) +

      secondaryButton(
        "cancelLedgerBtn",
        "Cancel"
      )
    );

    const cancelBtn =
      $("cancelLedgerBtn");

    const saveBtn =
      $("saveLedgerBtn");

    if (cancelBtn) {
      cancelBtn.onclick =
        closeHisabModal;
    }

    if (saveBtn) {

      saveBtn.onclick = () => {

        const name =
          $("ledgerPerson")
            ?.value
            .trim();

        const amount =
          safeNumber(
            $("ledgerAmount")
              ?.value
          );

        if (!name) {

          alert(
            "Please enter a person name."
          );

          return;
        }

        if (amount <= 0) {

          alert(
            "Please enter a valid amount."
          );

          return;
        }

        data.ledger.push({

          id:
            uid("ledger"),

          scope,

          person:
            name,

          kind,

          amount,

          paymentMethod:
            $("ledgerPayment")
              ?.value ||
            "Cash",

          color:
            $("ledgerColor")
              ?.value ||
            "default",

          note:
            $("ledgerNote")
              ?.value
              .trim() ||
            "",

          date:
            $("ledgerDate")
              ?.value ||
            today(),

          time:
            new Date().toLocaleTimeString(
              "en-IN",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            ),

          status:
            "pending",

          createdAt:
            nowISO()
        });

        save();

        closeHisabModal();

        updateDashboard();

        showLendDen();
      };
    }
  }

  window.addLedgerTransaction =
    addTxn;

  /* =========================================================
     LEN-DEN SCREEN
     ========================================================= */

  function showLendDen() {

    const scope =
      data.mode;

    const entries =
      data.ledger
        .filter(
          x =>
            x.scope === scope
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    const given =
      entries
        .filter(
          x =>
            x.kind ===
            "given"
        )
        .filter(
          x =>
            x.status !==
            "settled"
        )
        .reduce(
          (sum, x) =>
            sum +
            safeNumber(
              x.amount
            ),
          0
        );

    const received =
      entries
        .filter(
          x =>
            x.kind ===
            "received"
        )
        .filter(
          x =>
            x.status !==
            "settled"
        )
        .reduce(
          (sum, x) =>
            sum +
            safeNumber(
              x.amount
            ),
          0
        );

    const people =
      getPeople(scope);

    const rows =
      entries
        .map(item => {

          const isGiven =
            item.kind ===
            "given";

          return `

            <div style="
              padding:14px;
              border:1px solid #e3e8ed;
              border-radius:14px;
              margin-bottom:10px;
              background:#fff;
            ">

              <div style="
                display:flex;
                justify-content:space-between;
                gap:10px;
              ">

                <div>

                  <strong>
                    ${esc(
                      item.person
                    )}
                  </strong>

                  <div style="
                    font-size:12px;
                    opacity:.7;
                    margin-top:4px;
                  ">
                    ${
                      isGiven
                        ? "Given"
                        : "Received"
                    }

                    •
                    ${esc(
                      item.paymentMethod
                    )}
                  </div>

                </div>

                <strong>
                  ${money(
                    item.amount
                  )}
                </strong>

              </div>

              ${
                item.note
                  ? `
                    <div style="
                      margin-top:8px;
                      font-size:13px;
                    ">
                      ${esc(
                        item.note
                      )}
                    </div>
                  `
                  : ""
              }

              <div style="
                margin-top:8px;
                font-size:12px;
                opacity:.65;
              ">
                ${esc(
                  dateOnly(
                    item.date
                  )
                )}
              </div>

              <div style="
                display:flex;
                gap:8px;
                margin-top:10px;
                flex-wrap:wrap;
              ">

                <button
                  type="button"
                  data-settle-ledger="${esc(
                    item.id
                  )}"
                >
                  Mark Settled
                </button>

                <button
                  type="button"
                  data-delete-ledger="${esc(
                    item.id
                  )}"
                >
                  Delete
                </button>

              </div>

            </div>

          `;
        })
        .join("");

    const body = `

      <div style="
        display:grid;
        grid-template-columns:
          repeat(3,1fr);
        gap:8px;
        margin-bottom:16px;
      ">

        <div style="
          padding:12px;
          border-radius:14px;
          background:#fff3f3;
        ">
          <small>
            Total Diya
          </small>

          <strong
            style="display:block"
          >
            ${money(given)}
          </strong>
        </div>

        <div style="
          padding:12px;
          border-radius:14px;
          background:#effaf5;
        ">
          <small>
            Total Liya
          </small>

          <strong
            style="display:block"
          >
            ${money(received)}
          </strong>
        </div>

        <div style="
          padding:12px;
          border-radius:14px;
          background:#eef6ff;
        ">
          <small>
            Net
          </small>

          <strong
            style="display:block"
          >
            ${money(
              received - given
            )}
          </strong>
        </div>

      </div>

      <div style="
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-bottom:14px;
      ">

        <button
          type="button"
          id="addGivenBtn"
        >
          + Given
        </button>

        <button
          type="button"
          id="addReceivedBtn"
        >
          + Received
        </button>

        <button
          type="button"
          id="addPersonBtn"
        >
          + Person
        </button>

      </div>

      ${
        people.length
          ? `
            <div style="
              margin-bottom:12px;
              font-size:13px;
              opacity:.7;
            ">
              ${people.length}
              people / parties
            </div>
          `
          : ""
      }

      ${
        rows ||
        `
          <div style="
            padding:25px;
            text-align:center;
            opacity:.65;
          ">
            No Len-Den entries yet.
          </div>
        `
      }

    `;

    modal(

      "Paisa Len-Den",

      body,

      secondaryButton(
        "closeLedgerScreenBtn",
        "Close"
      )
    );

    const closeBtn =
      $("closeLedgerScreenBtn");

    if (closeBtn) {
      closeBtn.onclick =
        closeHisabModal;
    }

    const addGiven =
      $("addGivenBtn");

    if (addGiven) {
      addGiven.onclick = () =>
        addTxn(
          scope,
          -1,
          "given"
        );
    }

    const addReceived =
      $("addReceivedBtn");

    if (addReceived) {
      addReceived.onclick = () =>
        addTxn(
          scope,
          -1,
          "received"
        );
    }

    const addPersonBtn =
      $("addPersonBtn");

    if (addPersonBtn) {
      addPersonBtn.onclick =
        () =>
          addPerson(scope);
    }
  }

  window.showLendDen =
    showLendDen;

  /* =========================================================
     RECENT ACTIVITY
     ========================================================= */

  function renderRecentActivity() {

    const el =
      $("recentActivity");

    if (!el) return;

    const items =
      data.transactions
        .filter(
          tx =>
            tx.scope ===
            data.mode
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        )
        .slice(0, 5);

    if (!items.length) {

      el.innerHTML = `
        <div style="
          padding:18px;
          text-align:center;
          opacity:.65;
        ">
          No transactions yet.
        </div>
      `;

      return;
    }

    el.innerHTML =
      items
        .map(tx => {

          const income =
            tx.type ===
            "income";

          return `

            <div style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px;
              padding:12px 0;
              border-bottom:1px solid #edf0f2;
            ">

              <div>

                <strong>
                  ${esc(
                    tx.description ||
                    tx.category ||
                    "Transaction"
                  )}
                </strong>

                <div style="
                  font-size:12px;
                  opacity:.65;
                ">
                  ${esc(
                    tx.category
                  )}

                  •
                  ${esc(
                    dateOnly(
                      tx.date
                    )
                  )}
                </div>

              </div>

              <strong>
                ${
                  income
                    ? "+"
                    : "-"
                }${money(
                  tx.amount
                )}
              </strong>

            </div>

          `;
        })
        .join("");
  }

  window.renderRecentActivity =
    renderRecentActivity;

  /* =========================================================
     SAFE FUNCTION CALLER
     ========================================================= */

  function callIfAvailable(
    functionName,
    ...args
  ) {

    try {

      const fn =
        window[
          functionName
        ];

      if (
        typeof fn ===
        "function"
      ) {

        return fn(
          ...args
        );
      }

      console.warn(
        "HISAB: Function not available yet:",
        functionName
      );

      return false;

    } catch (error) {

      console.error(
        "HISAB action error:",
        functionName,
        error
      );

      alert(
        "This feature is not ready yet. Please try again after the app is fully loaded."
      );

      return false;
    }
  }

  window.HISAB.callIfAvailable =
    callIfAvailable;

  /* =========================================================
     GLOBAL ACTION HANDLER — SAFE
     ========================================================= */

  document.addEventListener(
    "click",
    event => {

      const actionButton =
        event.target.closest(
          "[data-action]"
        );

      if (actionButton) {

        const action =
          actionButton.dataset
            .action;

        switch (action) {

          case "income":

            callIfAvailable(
              "addTransaction",
              "income"
            );

            break;

          case "expense":

            callIfAvailable(
              "addTransaction",
              "expense"
            );

            break;

          case "lendden":

            callIfAvailable(
              "showLendDen"
            );

            break;

          case "savings":

            callIfAvailable(
              "showSavings"
            );

            break;

          case "budget":

            callIfAvailable(
              "showBudget"
            );

            break;

          case "bills":

            callIfAvailable(
              "showBills"
            );

            break;

          case "loans":

            callIfAvailable(
              "showLoans"
            );

            break;

          case "goals":

            callIfAvailable(
              "showGoals"
            );

            break;

          case "transactions":

            callIfAvailable(
              "showTransactions"
            );

            break;

          case "reports":

            callIfAvailable(
              "showReports"
            );

            break;

          case "backup":

            callIfAvailable(
              "showBackup"
            );

            break;

          case "security":

            callIfAvailable(
              "showSecurity"
            );

            break;

          case "settings":

            callIfAvailable(
              "showSettings"
            );

            break;

          default:

            console.warn(
              "HISAB: Unknown action:",
              action
            );
        }
      }

      /* =====================================================
         DELETE LEN-DEN
         ===================================================== */

      const deleteLedger =
        event.target.closest(
          "[data-delete-ledger]"
        );

      if (deleteLedger) {

        const id =
          deleteLedger.dataset
            .deleteLedger;

        if (
          confirm(
            "Delete this Len-Den entry?"
          )
        ) {

          data.ledger =
            data.ledger.filter(
              x =>
                x.id !== id
            );

          save();

          updateDashboard();

          showLendDen();
        }
      }

      /* =====================================================
         SETTLE LEN-DEN
         ===================================================== */

      const settleLedger =
        event.target.closest(
          "[data-settle-ledger]"
        );

      if (settleLedger) {

        const id =
          settleLedger.dataset
            .settleLedger;

        const item =
          data.ledger.find(
            x =>
              x.id === id
          );

        if (item) {

          item.status =
            "settled";

          save();

          updateDashboard();

          showLendDen();
        }
      }
    }
  );

  /* =========================================================
     HOME HTML COMPATIBILITY — SAFE
     ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      const personal =
        $("personalBtn");

      const business =
        $("businessBtn");

      if (personal) {

        personal.onclick =
          () =>
            setMode(
              "personal"
            );
      }

      if (business) {

        business.onclick =
          () =>
            setMode(
              "business"
            );
      }

      const settings =
        $("settingsBtn");

      if (settings) {

        settings.onclick =
          () => {

            if (
              typeof window
                .showSettings ===
              "function"
            ) {

              window.showSettings();

            } else {

              console.warn(
                "HISAB: showSettings() is not loaded yet."
              );
            }
          };
      }

      const viewAll =
        $("viewAllBtn");

      if (viewAll) {

        viewAll.onclick =
          () => {

            if (
              typeof window
                .showTransactions ===
              "function"
            ) {

              window.showTransactions();

            } else {

              console.warn(
                "HISAB: showTransactions() is not loaded yet."
              );
            }
          };
      }

      updateDashboard();
    }
  );

  /* =========================================================
     GLOBAL ERROR PROTECTION
     ========================================================= */

  window.addEventListener(
    "error",
    event => {

      console.error(
        "HISAB runtime error:",
        event.error ||
        event.message
      );
    }
  );

  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "HISAB promise error:",
        event.reason
      );
    }
  );
/* =========================================================
   SAVINGS
   ========================================================= */

function showSavings() {
  const totalSaved = data.savings.reduce(
    (sum, item) => sum + safeNumber(item.amount),
    0
  );

  const totalTarget = data.savings.reduce(
    (sum, item) => sum + safeNumber(item.target),
    0
  );

  const rows = data.savings
    .slice()
    .reverse()
    .map(item => {
      const amount = safeNumber(item.amount);
      const target = safeNumber(item.target);

      const percent =
        target > 0
          ? Math.min(100, Math.max(0, (amount / target) * 100))
          : 0;

      return `
        <div style="
          padding:14px;
          margin-bottom:10px;
          border:1px solid #e1e7eb;
          border-radius:14px;
          background:#fff;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
          ">
            <strong>${esc(item.name || "Savings")}</strong>
            <strong>${money(amount)}</strong>
          </div>

          ${
            target > 0
              ? `
                <div style="
                  margin-top:9px;
                  height:8px;
                  background:#edf1f3;
                  border-radius:20px;
                  overflow:hidden;
                ">
                  <div style="
                    width:${percent}%;
                    height:100%;
                    background:#16a085;
                  "></div>
                </div>

                <small>
                  ${percent.toFixed(0)}% of ${money(target)}
                </small>
              `
              : ""
          }

          ${
            item.note
              ? `
                <div style="
                  margin-top:7px;
                  font-size:13px;
                  opacity:.7;
                ">
                  ${esc(item.note)}
                </div>
              `
              : ""
          }

          ${
            item.date
              ? `
                <div style="
                  margin-top:5px;
                  font-size:12px;
                  opacity:.6;
                ">
                  ${esc(dateOnly(item.date))}
                </div>
              `
              : ""
          }

          <div style="
            margin-top:10px;
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          ">

            <button
              type="button"
              data-add-saving="${esc(item.id)}"
            >
              + Add Money
            </button>

            <button
              type="button"
              data-delete-saving="${esc(item.id)}"
            >
              Delete
            </button>

          </div>

        </div>
      `;
    })
    .join("");

  const body = `
    <div style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-bottom:15px;
    ">

      <div style="
        padding:14px;
        border-radius:14px;
        background:#effaf5;
      ">
        <small>Total Saved</small>
        <strong style="display:block">
          ${money(totalSaved)}
        </strong>
      </div>

      <div style="
        padding:14px;
        border-radius:14px;
        background:#eef6ff;
      ">
        <small>Total Target</small>
        <strong style="display:block">
          ${money(totalTarget)}
        </strong>
      </div>

    </div>

    <button
      type="button"
      id="newSavingBtn"
      style="width:100%; margin-bottom:14px;"
    >
      + Add Savings
    </button>

    ${
      rows ||
      `
        <div style="
          padding:25px;
          text-align:center;
          opacity:.65;
        ">
          No savings added yet.
        </div>
      `
    }
  `;

  modal(
    "Savings",
    body,
    secondaryButton("closeSavingsBtn", "Close")
  );

  const closeBtn = $("closeSavingsBtn");
  const newBtn = $("newSavingBtn");

  if (closeBtn) {
    closeBtn.onclick = closeHisabModal;
  }

  if (newBtn) {
    newBtn.onclick = addSaving;
  }
}

window.showSavings = showSavings;


/* =========================================================
   ADD SAVINGS
   ========================================================= */

function addSaving() {
  const body = `
    ${inputField(
      "savingName",
      "Savings Name",
      "",
      "text",
      "e.g. Emergency Fund"
    )}

    ${inputField(
      "savingAmount",
      "Current Amount",
      "",
      "number",
      "0"
    )}

    ${inputField(
      "savingTarget",
      "Target Amount",
      "",
      "number",
      "Optional"
    )}

    ${inputField(
      "savingNote",
      "Note",
      "",
      "text",
      "Optional"
    )}

    ${inputField(
      "savingDate",
      "Date",
      today(),
      "date"
    )}
  `;

  modal(
    "Add Savings",
    body,
    primaryButton("saveSavingBtn", "Save") +
      secondaryButton("cancelSavingBtn", "Cancel")
  );

  const cancelBtn = $("cancelSavingBtn");
  const saveBtn = $("saveSavingBtn");

  if (cancelBtn) {
    cancelBtn.onclick = closeHisabModal;
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      const name = $("savingName")?.value.trim() || "";
      const amount = safeNumber($("savingAmount")?.value);
      const target = safeNumber($("savingTarget")?.value);
      const note = $("savingNote")?.value.trim() || "";
      const date = $("savingDate")?.value || today();

      if (!name) {
        alert("Please enter savings name.");
        return;
      }

      if (amount < 0) {
        alert("Amount cannot be negative.");
        return;
      }

      if (target < 0) {
        alert("Target amount cannot be negative.");
        return;
      }

      data.savings.push({
        id: uid("saving"),
        name,
        amount,
        target,
        note,
        date,
        createdAt: nowISO()
      });

      save();
      closeHisabModal();
      updateDashboard();
      showSavings();
    };
  }
}


/* =========================================================
   ADD MONEY TO SAVINGS
   ========================================================= */

function addSavingMoney(id) {
  const item = data.savings.find(x => x.id === id);

  if (!item) {
    alert("Savings entry not found.");
    return;
  }

  const body = `
    ${inputField(
      "addSavingAmount",
      "Amount to Add",
      "",
      "number",
      "Enter amount"
    )}

    ${selectField(
      "addSavingPaymentMethod",
      "Payment Method",
      PAYMENT_METHODS
    )}

    ${selectField(
      "addSavingColor",
      "Colour",
      ENTRY_COLORS
    )}

    ${inputField(
      "addSavingNote",
      "Note",
      "",
      "text",
      "Optional"
    )}

    ${inputField(
      "addSavingDate",
      "Date",
      today(),
      "date"
    )}
  `;

  modal(
    "Add Money to Savings",
    body,
    primaryButton(
      "confirmSavingAddBtn",
      "Add"
    ) +
      secondaryButton(
        "cancelSavingAddBtn",
        "Cancel"
      )
  );

  const cancelBtn = $("cancelSavingAddBtn");
  const confirmBtn = $("confirmSavingAddBtn");

  if (cancelBtn) {
    cancelBtn.onclick = closeHisabModal;
  }

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const amount = safeNumber(
        $("addSavingAmount")?.value
      );

      const note =
        $("addSavingNote")?.value.trim() || "";

      const paymentMethod =
        $("addSavingPaymentMethod")?.value || "Cash";

      const color =
        $("addSavingColor")?.value || "default";

      const date =
        $("addSavingDate")?.value || today();

      if (amount <= 0) {
        alert("Enter a valid amount.");
        return;
      }

      item.amount = safeNumber(item.amount) + amount;

      if (note) {
        item.note = item.note
          ? `${item.note} | ${note}`
          : note;
      }

      item.lastAddedAmount = amount;
      item.lastPaymentMethod = paymentMethod;
      item.lastColor = color;
      item.lastAddedDate = date;
      item.updatedAt = nowISO();

      save();
      closeHisabModal();
      updateDashboard();
      showSavings();
    };
  }
}


/* =========================================================
   GOALS
   ========================================================= */

function showGoals() {
  const totalTarget = data.goals.reduce(
    (sum, goal) => sum + safeNumber(goal.target),
    0
  );

  const totalSaved = data.goals.reduce(
    (sum, goal) => sum + safeNumber(goal.saved),
    0
  );

  const rows = data.goals
    .slice()
    .reverse()
    .map(goal => {
      const target = safeNumber(goal.target);
      const saved = safeNumber(goal.saved);

      const percent =
        target > 0
          ? Math.min(100, Math.max(0, (saved / target) * 100))
          : 0;

      return `
        <div style="
          padding:14px;
          border:1px solid #e1e7eb;
          border-radius:14px;
          margin-bottom:10px;
          background:#fff;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
          ">

            <div>
              <strong>
                ${esc(goal.name || "Goal")}
              </strong>

              <div style="
                font-size:12px;
                opacity:.65;
                margin-top:3px;
              ">
                ${esc(goal.purpose || "Other")}
              </div>
            </div>

            <strong>
              ${money(saved)}
            </strong>

          </div>

          <div style="
            margin-top:10px;
            height:8px;
            border-radius:20px;
            background:#edf1f3;
            overflow:hidden;
          ">
            <div style="
              width:${percent}%;
              height:100%;
              background:#087f8c;
            "></div>
          </div>

          <div style="
            margin-top:6px;
            font-size:12px;
            opacity:.7;
          ">
            ${percent.toFixed(0)}%
            • Target ${money(target)}
            ${
              goal.deadline
                ? ` • Due ${esc(dateOnly(goal.deadline))}`
                : ""
            }
          </div>

          ${
            goal.note
              ? `
                <div style="
                  margin-top:7px;
                  font-size:13px;
                ">
                  ${esc(goal.note)}
                </div>
              `
              : ""
          }

          <div style="
            margin-top:10px;
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          ">

            <button
              type="button"
              data-add-goal-money="${esc(goal.id)}"
            >
              + Add Money
            </button>

            <button
              type="button"
              data-edit-goal="${esc(goal.id)}"
            >
              Edit
            </button>

            <button
              type="button"
              data-delete-goal="${esc(goal.id)}"
            >
              Delete
            </button>

          </div>

        </div>
      `;
    })
    .join("");

  const body = `
    <div style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-bottom:15px;
    ">

      <div style="
        padding:13px;
        border-radius:14px;
        background:#eef6ff;
      ">
        <small>Total Target</small>
        <strong style="display:block">
          ${money(totalTarget)}
        </strong>
      </div>

      <div style="
        padding:13px;
        border-radius:14px;
        background:#effaf5;
      ">
        <small>Total Saved</small>
        <strong style="display:block">
          ${money(totalSaved)}
        </strong>
      </div>

    </div>

    <button
      type="button"
      id="newGoalBtn"
      style="width:100%; margin-bottom:14px;"
    >
      + Create Goal
    </button>

    ${
      rows ||
      `
        <div style="
          padding:25px;
          text-align:center;
          opacity:.65;
        ">
          No goals created yet.
        </div>
      `
    }
  `;

  modal(
    "Goals",
    body,
    secondaryButton("closeGoalsBtn", "Close")
  );

  const closeBtn = $("closeGoalsBtn");
  const newBtn = $("newGoalBtn");

  if (closeBtn) {
    closeBtn.onclick = closeHisabModal;
  }

  if (newBtn) {
    newBtn.onclick = addGoal;
  }
}

window.showGoals = showGoals;


/* =========================================================
   ADD GOAL
   ========================================================= */

function addGoal() {
  const body = `
    ${inputField(
      "goalName",
      "Goal Name",
      "",
      "text",
      "e.g. New Bike"
    )}

    ${selectField(
      "goalPurpose",
      "Purpose",
      GOAL_PURPOSES
    )}

    ${inputField(
      "goalTarget",
      "Target Amount",
      "",
      "number",
      "Enter target"
    )}

    ${inputField(
      "goalSaved",
      "Already Saved",
      "0",
      "number",
      "0"
    )}

    ${inputField(
      "goalDeadline",
      "Target Date",
      "",
      "date"
    )}

    ${selectField(
      "goalColor",
      "Colour",
      ENTRY_COLORS
    )}

    ${inputField(
      "goalNote",
      "Note",
      "",
      "text",
      "Optional"
    )}
  `;

  modal(
    "Create Goal",
    body,
    primaryButton(
      "saveGoalBtn",
      "Create Goal"
    ) +
      secondaryButton(
        "cancelGoalBtn",
        "Cancel"
      )
  );

  const cancelBtn = $("cancelGoalBtn");
  const saveBtn = $("saveGoalBtn");

  if (cancelBtn) {
    cancelBtn.onclick = closeHisabModal;
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      const name =
        $("goalName")?.value.trim() || "";

      const target =
        safeNumber($("goalTarget")?.value);

      const saved =
        safeNumber($("goalSaved")?.value);

      if (!name) {
        alert("Please enter goal name.");
        return;
      }

      if (target <= 0) {
        alert("Please enter target amount.");
        return;
      }

      if (saved < 0) {
        alert("Saved amount cannot be negative.");
        return;
      }

      data.goals.push({
        id: uid("goal"),
        name,
        purpose:
          $("goalPurpose")?.value || "Other",
        target,
        saved,
        deadline:
          $("goalDeadline")?.value || "",
        color:
          $("goalColor")?.value || "default",
        note:
          $("goalNote")?.value.trim() || "",
        createdAt: nowISO()
      });

      save();
      closeHisabModal();
      updateDashboard();
      showGoals();
    };
  }
}


/* =========================================================
   ADD MONEY TO GOAL
   ========================================================= */

function addGoalMoney(id) {
  const goal = data.goals.find(
    x => x.id === id
  );

  if (!goal) {
    alert("Goal not found.");
    return;
  }

  const body = `
    ${inputField(
      "goalAddAmount",
      "Amount",
      "",
      "number",
      "Enter amount"
    )}

    ${selectField(
      "goalAddPaymentMethod",
      "Payment Method",
      PAYMENT_METHODS
    )}

    ${selectField(
      "goalAddColor",
      "Colour",
      ENTRY_COLORS
    )}

    ${inputField(
      "goalAddNote",
      "Note",
      "",
      "text",
      "Optional"
    )}

    ${inputField(
      "goalAddDate",
      "Date",
      today(),
      "date"
    )}
  `;

  modal(
    "Add Money to Goal",
    body,
    primaryButton(
      "confirmGoalAddBtn",
      "Add"
    ) +
      secondaryButton(
        "cancelGoalAddBtn",
        "Cancel"
      )
  );

  const cancelBtn = $("cancelGoalAddBtn");
  const confirmBtn = $("confirmGoalAddBtn");

  if (cancelBtn) {
    cancelBtn.onclick = closeHisabModal;
  }

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const amount =
        safeNumber($("goalAddAmount")?.value);

      if (amount <= 0) {
        alert("Enter a valid amount.");
        return;
      }

      const note =
        $("goalAddNote")?.value.trim() || "";

      const paymentMethod =
        $("goalAddPaymentMethod")?.value ||
        "Cash";

      const color =
        $("goalAddColor")?.value ||
        "default";

      const date =
        $("goalAddDate")?.value ||
        today();

      goal.saved =
        safeNumber(goal.saved) + amount;

      if (note) {
        goal.note = goal.note
          ? `${goal.note} | ${note}`
          : note;
      }

      goal.lastAddedAmount = amount;
      goal.lastPaymentMethod = paymentMethod;
      goal.lastColor = color;
      goal.lastAddedDate = date;
      goal.updatedAt = nowISO();

      save();
      closeHisabModal();
      updateDashboard();
      showGoals();
    };
  }
}


/* =========================================================
   EDIT GOAL
   ========================================================= */

function editGoal(id) {
  const goal = data.goals.find(
    x => x.id === id
  );

  if (!goal) {
    alert("Goal not found.");
    return;
  }

  const body = `
    ${inputField(
      "editGoalName",
      "Goal Name",
      goal.name || ""
    )}

    ${selectField(
      "editGoalPurpose",
      "Purpose",
      GOAL_PURPOSES,
      goal.purpose || "Other"
    )}

    ${inputField(
      "editGoalTarget",
      "Target Amount",
      goal.target || 0,
      "number"
    )}

    ${inputField(
      "editGoalSaved",
      "Saved Amount",
      goal.saved || 0,
      "number"
    )}

    ${inputField(
      "editGoalDeadline",
      "Target Date",
      goal.deadline || "",
      "date"
    )}

    ${selectField(
      "editGoalColor",
      "Colour",
      ENTRY_COLORS,
      goal.color || "default"
    )}

    ${inputField(
      "editGoalNote",
      "Note",
      goal.note || ""
    )}
  `;

  modal(
    "Edit Goal",
    body,
    primaryButton(
      "updateGoalBtn",
      "Update"
    ) +
      secondaryButton(
        "cancelEditGoalBtn",
        "Cancel"
      )
  );

  const cancelBtn =
    $("cancelEditGoalBtn");

  const updateBtn =
    $("updateGoalBtn");

  if (cancelBtn) {
    cancelBtn.onclick = closeHisabModal;
  }

  if (updateBtn) {
    updateBtn.onclick = () => {
      const name =
        $("editGoalName")?.value.trim() || "";

      const target =
        safeNumber($("editGoalTarget")?.value);

      const saved =
        safeNumber($("editGoalSaved")?.value);

      if (!name || target <= 0) {
        alert("Enter valid goal details.");
        return;
      }

      if (saved < 0) {
        alert("Saved amount cannot be negative.");
        return;
      }

      goal.name = name;

      goal.purpose =
        $("editGoalPurpose")?.value ||
        "Other";

      goal.target = target;
      goal.saved = saved;

      goal.deadline =
        $("editGoalDeadline")?.value || "";

      goal.color =
        $("editGoalColor")?.value ||
        "default";

      goal.note =
        $("editGoalNote")?.value.trim() ||
        "";

      goal.updatedAt = nowISO();

      save();
      closeHisabModal();
      updateDashboard();
      showGoals();
    };
  }
}


/* =========================================================
   BUDGET
   ========================================================= */

function showBudget() {
  const month =
    today().slice(0, 7);

  const currentBudgets =
    data.budgets.filter(
      x => x.month === month
    );

  const totalBudget =
    currentBudgets.reduce(
      (sum, x) =>
        sum + safeNumber(x.amount),
      0
    );

  const totalSpent =
    currentBudgets.reduce(
      (sum, x) =>
        sum + safeNumber(x.spent),
      0
    );

  const rows = currentBudgets
    .map(item => {
      const amount =
        safeNumber(item.amount);

      const spent =
        safeNumber(item.spent);

      const percent =
        amount > 0
          ? Math.min(
              100,
              Math.max(0, (spent / amount) * 100)
            )
          : 0;

      return `
        <div style="
          padding:14px;
          margin-bottom:10px;
          border:1px solid #e1e7eb;
          border-radius:14px;
          background:#fff;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
          ">
            <strong>
              ${esc(item.name || "Budget")}
            </strong>

            <strong>
              ${money(amount)}
            </strong>
          </div>

          <div style="
            font-size:12px;
            opacity:.65;
            margin-top:3px;
          ">
            ${esc(item.category || "Overall")}
          </div>

          <div style="
            margin-top:9px;
            height:8px;
            background:#edf1f3;
            border-radius:20px;
            overflow:hidden;
          ">
            <div style="
              width:${percent}%;
              height:100%;
              background:#087f8c;
            "></div>
          </div>

          <div style="
            margin-top:6px;
            font-size:12px;
          ">
            Spent ${money(spent)}
            • ${percent.toFixed(0)}%
          </div>

          ${
            item.note
              ? `
                <div style="
                  margin-top:6px;
                  font-size:12px;
                  opacity:.7;
                ">
                  ${esc(item.note)}
                </div>
              `
              : ""
          }

          <div style="
            display:flex;
            gap:8px;
            margin-top:10px;
            flex-wrap:wrap;
          ">

            <button
              type="button"
              data-budget-payment="${esc(item.id)}"
            >
              + Payment
            </button>

            <button
              type="button"
              data-delete-budget="${esc(item.id)}"
            >
              Delete
            </button>

          </div>

        </div>
      `;
    })
    .join("");

  const body = `
    <div style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-bottom:15px;
    ">

      <div style="
        padding:13px;
        background:#eef6ff;
        border-radius:14px;
      ">
        <small>Budget</small>
        <strong style="display:block">
          ${money(totalBudget)}
        </strong>
      </div>

      <div style="
        padding:13px;
        background:#fff4f4;
        border-radius:14px;
      ">
        <small>Spent</small>
        <strong style="display:block">
          ${money(totalSpent)}
        </strong>
      </div>

    </div>

    <button
      type="button"
      id="newBudgetBtn"
      style="width:100%; margin-bottom:14px;"
    >
      + Add Budget
    </button>

    ${
      rows ||
      `
        <div style="
          padding:25px;
          text-align:center;
          opacity:.65;
        ">
          No budget created for this month.
        </div>
      `
    }
  `;

  modal(
    "Budget",
    body,
    secondaryButton(
      "closeBudgetBtn",
      "Close"
    )
  );

  const closeBtn =
    $("closeBudgetBtn");

  const newBtn =
    $("newBudgetBtn");

  if (closeBtn) {
    closeBtn.onclick =
      closeHisabModal;
  }

  if (newBtn) {
    newBtn.onclick = addBudget;
  }
}

window.showBudget = showBudget;


/* =========================================================
   ADD BUDGET
   ========================================================= */

function addBudget() {
  const body = `
    ${inputField(
      "budgetName",
      "Budget Name",
      "",
      "text",
      "Monthly Budget"
    )}

    ${selectField(
      "budgetCategory",
      "Category",
      [
        "Overall",
        ...(
          Array.isArray(data.categories?.expense)
            ? data.categories.expense
            : []
        )
      ]
    )}

    ${inputField(
      "budgetAmount",
      "Budget Amount",
      "",
      "number",
      "Enter amount"
    )}

    ${inputField(
      "budgetMonth",
      "Month",
      today().slice(0, 7),
      "month"
    )}

    ${inputField(
      "budgetNote",
      "Note",
      "",
      "text",
      "Optional"
    )}
  `;

  modal(
    "Add Budget",
    body,
    primaryButton(
      "saveBudgetBtn",
      "Save"
    ) +
      secondaryButton(
        "cancelBudgetBtn",
        "Cancel"
      )
  );

  const cancelBtn =
    $("cancelBudgetBtn");

  const saveBtn =
    $("saveBudgetBtn");

  if (cancelBtn) {
    cancelBtn.onclick =
      closeHisabModal;
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      const name =
        $("budgetName")?.value.trim() ||
        "";

      const amount =
        safeNumber($("budgetAmount")?.value);

      const category =
        $("budgetCategory")?.value ||
        "Overall";

      const month =
        $("budgetMonth")?.value ||
        today().slice(0, 7);

      const note =
        $("budgetNote")?.value.trim() ||
        "";

      if (!name || amount <= 0) {
        alert(
          "Enter valid budget details."
        );
        return;
      }

      data.budgets.push({
        id: uid("budget"),
        name,
        category,
        amount,
        spent: 0,
        month,
        note,
        createdAt: nowISO()
      });

      save();
      closeHisabModal();
      showBudget();
    };
  }
}


/* =========================================================
   BUDGET PAYMENT
   ========================================================= */

function addBudgetPayment(id) {
  const budget =
    data.budgets.find(
      x => x.id === id
    );

  if (!budget) {
    alert("Budget not found.");
    return;
  }

  const body = `
    ${inputField(
      "budgetPaymentAmount",
      "Payment Amount",
      "",
      "number",
      "Enter amount"
    )}

    ${selectField(
      "budgetPaymentMethod",
      "Payment Method",
      PAYMENT_METHODS
    )}

    ${selectField(
      "budgetPaymentColor",
      "Colour",
      ENTRY_COLORS
    )}

    ${inputField(
      "budgetPaymentNote",
      "Note",
      "",
      "text",
      "Optional"
    )}

    ${inputField(
      "budgetPaymentDate",
      "Date",
      today(),
      "date"
    )}
  `;

  modal(
    "Budget Payment",
    body,
    primaryButton(
      "saveBudgetPaymentBtn",
      "Save Payment"
    ) +
      secondaryButton(
        "cancelBudgetPaymentBtn",
        "Cancel"
      )
  );

  const cancelBtn =
    $("cancelBudgetPaymentBtn");

  const saveBtn =
    $("saveBudgetPaymentBtn");

  if (cancelBtn) {
    cancelBtn.onclick =
      closeHisabModal;
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      const amount =
        safeNumber(
          $("budgetPaymentAmount")?.value
        );

      if (amount <= 0) {
        alert("Enter a valid amount.");
        return;
      }

      const paymentMethod =
        $("budgetPaymentMethod")?.value ||
        "Cash";

      const color =
        $("budgetPaymentColor")?.value ||
        "default";

      const note =
        $("budgetPaymentNote")?.value.trim() ||
        "";

      const date =
        $("budgetPaymentDate")?.value ||
        today();

      budget.spent =
        safeNumber(budget.spent) +
        amount;

      /*
       * Budget payment is also recorded
       * in the main transaction list so
       * Reports/Transactions can use it.
       */
      data.transactions.push({
        id: uid("txn"),
        type: "expense",
        amount,
        category:
          budget.category === "Overall"
            ? "Budget Payment"
            : budget.category,
        description:
          note ||
          `Budget: ${budget.name}`,
        paymentMethod,
        color,
        scope: data.mode,
        date,
        budgetId: budget.id,
        budgetName: budget.name,
        createdAt: nowISO()
      });

      save();
      closeHisabModal();
      updateDashboard();
      showBudget();
    };
  }
}


/* =========================================================
   EVENT HANDLERS
   SAVINGS / GOALS / BUDGET
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const addSavingButton =
      event.target.closest(
        "[data-add-saving]"
      );

    if (addSavingButton) {
      addSavingMoney(
        addSavingButton.dataset.addSaving
      );
      return;
    }


    const deleteSavingButton =
      event.target.closest(
        "[data-delete-saving]"
      );

    if (deleteSavingButton) {
      const id =
        deleteSavingButton.dataset.deleteSaving;

      if (
        confirm(
          "Delete this savings entry?"
        )
      ) {
        data.savings =
          data.savings.filter(
            x => x.id !== id
          );

        save();
        updateDashboard();
        showSavings();
      }

      return;
    }


    const addGoalButton =
      event.target.closest(
        "[data-add-goal-money]"
      );

    if (addGoalButton) {
      addGoalMoney(
        addGoalButton.dataset.addGoalMoney
      );
      return;
    }


    const editGoalButton =
      event.target.closest(
        "[data-edit-goal]"
      );

    if (editGoalButton) {
      editGoal(
        editGoalButton.dataset.editGoal
      );
      return;
    }


    const deleteGoalButton =
      event.target.closest(
        "[data-delete-goal]"
      );

    if (deleteGoalButton) {
      const id =
        deleteGoalButton.dataset.deleteGoal;

      if (
        confirm(
          "Delete this goal?"
        )
      ) {
        data.goals =
          data.goals.filter(
            x => x.id !== id
          );

        save();
        updateDashboard();
        showGoals();
      }

      return;
    }


    const budgetPaymentButton =
      event.target.closest(
        "[data-budget-payment]"
      );

    if (budgetPaymentButton) {
      addBudgetPayment(
        budgetPaymentButton.dataset.budgetPayment
      );
      return;
    }


    const deleteBudgetButton =
      event.target.closest(
        "[data-delete-budget]"
      );

    if (deleteBudgetButton) {
      const id =
        deleteBudgetButton.dataset.deleteBudget;

      if (
        confirm(
          "Delete this budget?"
        )
      ) {
        data.budgets =
          data.budgets.filter(
            x => x.id !== id
          );

        save();
        showBudget();
      }

      return;
    }

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.addSaving = addSaving;
window.addSavingMoney = addSavingMoney;

window.addGoal = addGoal;
window.addGoalMoney = addGoalMoney;
window.editGoal = editGoal;

window.addBudget = addBudget;
window.addBudgetPayment = addBudgetPayment;


/* =========================================================
   PART 2 END
   ========================================================= */
