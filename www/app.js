/* =========================================================
   HISAB — Money Manager V7
   Personal + Business
   Offline / Local Storage
   Android WebView Compatible
   ========================================================= */

"use strict";

const STORAGE_KEY = "hisab_global_v7_data";

/* ---------- DEFAULT DATA ---------- */

const defaultData = {
  mode: "personal",

  personal: {
    income: [],
    expense: [],
    lend: []
  },

  business: {
    income: [],
    expense: [],
    lend: []
  },

  savings: [],
  budgets: [],
  bills: [],
  emis: [],
  goals: [],

  settings: {
    currency: "₹"
  }
};

/* ---------- SAFE CLONE ---------- */

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultData));
}

/* ---------- LOAD DATA ---------- */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return cloneDefaultData();
    }

    const parsed = JSON.parse(saved);

    return {
      ...cloneDefaultData(),
      ...parsed,

      personal: {
        ...defaultData.personal,
        ...(parsed.personal || {})
      },

      business: {
        ...defaultData.business,
        ...(parsed.business || {})
      },

      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      }
    };

  } catch (error) {
    console.error("HISAB load error:", error);
    return cloneDefaultData();
  }
}

let appData = loadData();

/* ---------- SAVE DATA ---------- */

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(appData)
    );
  } catch (error) {
    console.error("HISAB save error:", error);
  }
}

/* ---------- HELPERS ---------- */

function $(id) {
  return document.getElementById(id);
}

function formatMoney(amount) {
  const currency =
    appData.settings?.currency || "₹";

  const number = Number(amount) || 0;

  return (
    currency +
    number.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })
  );
}

function today() {
  const d = new Date();

  return d.toLocaleDateString("en-IN");
}

function currentTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function makeId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- CURRENT ACCOUNT ---------- */

function getCurrentAccount() {
  return appData[appData.mode];
}

function getTransactions() {
  const account = getCurrentAccount();

  return [
    ...(account.income || []).map(item => ({
      ...item,
      type: "income"
    })),

    ...(account.expense || []).map(item => ({
      ...item,
      type: "expense"
    })),

    ...(account.lend || []).map(item => ({
      ...item,
      type: "lend"
    }))
  ].sort((a, b) => {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

/* ---------- SCREEN ---------- */

function showScreen(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  const target = $(screenId);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo(0, 0);
}

/* ---------- SPLASH ---------- */

function startSplash() {
  setTimeout(() => {
    showScreen("welcomeScreen");
  }, 1200);
}

/* ---------- HOME ---------- */

function updateHome() {
  const account = getCurrentAccount();

  const income =
    (account.income || []).reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const expense =
    (account.expense || []).reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const balance = income - expense;

  if ($("currencyLabel")) {
    $("currencyLabel").textContent =
      appData.settings.currency;
  }

  if ($("totalIncome")) {
    $("totalIncome").textContent =
      formatMoney(income);
  }

  if ($("totalExpense")) {
    $("totalExpense").textContent =
      formatMoney(expense);
  }

  if ($("totalBalance")) {
    $("totalBalance").textContent =
      formatMoney(balance);
  }

  updateModeButtons();
  renderRecentActivity();
}

/* ---------- MODE BUTTONS ---------- */

function updateModeButtons() {
  const personalBtn = $("personalBtn");
  const businessBtn = $("businessBtn");

  if (personalBtn) {
    personalBtn.classList.toggle(
      "active",
      appData.mode === "personal"
    );
  }

  if (businessBtn) {
    businessBtn.classList.toggle(
      "active",
      appData.mode === "business"
    );
  }
}

/* ---------- RECENT ACTIVITY ---------- */

function renderRecentActivity() {
  const container = $("recentActivity");

  if (!container) return;

  const transactions =
    getTransactions().slice(0, 5);

  if (!transactions.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div>💰</div>
        <strong>No transactions yet</strong>
        <p>Add your first income or expense.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    transactions
      .map(item => {

        let icon = "💰";
        let title = item.title || "Transaction";

        if (item.type === "expense") {
          icon = "💸";
        }

        if (item.type === "lend") {
          icon = "🤝";
        }

        return `
          <div class="activity-item">
            <div class="activity-icon">
              ${icon}
            </div>

            <div class="activity-info">
              <strong>
                ${escapeHTML(title)}
              </strong>

              <small>
                ${escapeHTML(item.date || today())}
                •
                ${escapeHTML(item.time || "")}
              </small>
            </div>

            <strong class="activity-amount">
              ${formatMoney(item.amount)}
            </strong>
          </div>
        `;
      })
      .join("");
}

/* ---------- MODAL ---------- */

function openModal(content) {
  const modal = $("modal");
  const modalContent = $("modalContent");

  if (!modal || !modalContent) return;

  modalContent.innerHTML = content;

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = $("modal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* ---------- INCOME ---------- */

function showIncome() {
  openModal(`
    <h2>Add Income</h2>

    <form id="incomeForm">

      <label>Income Name</label>
      <input
        id="incomeTitle"
        type="text"
        placeholder="Salary / Business / Other"
        required
      >

      <label>Amount</label>
      <input
        id="incomeAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Amount"
        required
      >

      <button class="primary-btn" type="submit">
        Save Income
      </button>

    </form>
  `);

  $("incomeForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("incomeTitle").value.trim();
    const amount = Number($("incomeAmount").value);

    if (!title || amount <= 0) return;

    getCurrentAccount().income.push({
      id: makeId(),
      title,
      amount,
      date: today(),
      time: currentTime(),
      createdAt: Date.now()
    });

    saveData();
    closeModal();
    updateHome();
  });
}

/* ---------- EXPENSE ---------- */

function showExpense() {
  openModal(`
    <h2>Add Expense</h2>

    <form id="expenseForm">

      <label>Expense Name</label>
      <input
        id="expenseTitle"
        type="text"
        placeholder="Food / Travel / Shopping"
        required
      >

      <label>Amount</label>
      <input
        id="expenseAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Amount"
        required
      >

      <button class="primary-btn" type="submit">
        Save Expense
      </button>

    </form>
  `);

  $("expenseForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("expenseTitle").value.trim();
    const amount = Number($("expenseAmount").value);

    if (!title || amount <= 0) return;

    getCurrentAccount().expense.push({
      id: makeId(),
      title,
      amount,
      date: today(),
      time: currentTime(),
      createdAt: Date.now()
    });

    saveData();
    closeModal();
    updateHome();
  });
}

/* ---------- PAISA LEN-DEN ---------- */

function showLend() {
  openModal(`
    <h2>Paisa Len-Den</h2>

    <form id="lendForm">

      <label>Person Name</label>
      <input
        id="lendPerson"
        type="text"
        placeholder="Name"
        required
      >

      <label>Amount</label>
      <input
        id="lendAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Amount"
        required
      >

      <label>Type</label>
      <select id="lendType">
        <option value="given">Paisa Diya</option>
        <option value="received">Paisa Liya</option>
      </select>

      <button class="primary-btn" type="submit">
        Save Record
      </button>

    </form>
  `);

  $("lendForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const person = $("lendPerson").value.trim();
    const amount = Number($("lendAmount").value);
    const type = $("lendType").value;

    if (!person || amount <= 0) return;

    getCurrentAccount().lend.push({
      id: makeId(),
      title: person,
      amount,
      lendType: type,
      date: today(),
      time: currentTime(),
      createdAt: Date.now()
    });

    saveData();
    closeModal();
    updateHome();
  });
}

/* ---------- SAVINGS ---------- */

function showSavings() {
  openModal(`
    <h2>Add Savings</h2>

    <form id="savingsForm">

      <label>Purpose</label>
      <input
        id="savingTitle"
        type="text"
        placeholder="Car / Bike / Emergency"
        required
      >

      <label>Amount</label>
      <input
        id="savingAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Amount"
        required
      >

      <button class="primary-btn" type="submit">
        Save Savings
      </button>

    </form>
  `);

  $("savingsForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("savingTitle").value.trim();
    const amount = Number($("savingAmount").value);

    if (!title || amount <= 0) return;

    appData.savings.push({
      id: makeId(),
      title,
      amount,
      date: today(),
      createdAt: Date.now()
    });

    saveData();
    closeModal();
  });
}

/* ---------- BUDGET ---------- */

function showBudget() {
  openModal(`
    <h2>Monthly Budget</h2>

    <form id="budgetForm">

      <label>Budget Name</label>
      <input
        id="budgetTitle"
        type="text"
        placeholder="Monthly Budget"
        required
      >

      <label>Amount</label>
      <input
        id="budgetAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Amount"
        required
      >

      <button class="primary-btn" type="submit">
        Save Budget
      </button>

    </form>
  `);

  $("budgetForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("budgetTitle").value.trim();
    const amount = Number($("budgetAmount").value);

    if (!title || amount <= 0) return;

    appData.budgets.push({
      id: makeId(),
      title,
      amount,
      date: today(),
      createdAt: Date.now()
    });

    saveData();
    closeModal();
  });
}

/* ---------- BILLS ---------- */

function showBills() {
  openModal(`
    <h2>Bills & Payments</h2>

    <form id="billForm">

      <label>Bill Name</label>
      <input
        id="billTitle"
        type="text"
        placeholder="Electricity / Mobile / Rent"
        required
      >

      <label>Amount</label>
      <input
        id="billAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Amount"
        required
      >

      <button class="primary-btn" type="submit">
        Save Bill
      </button>

    </form>
  `);

  $("billForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("billTitle").value.trim();
    const amount = Number($("billAmount").value);

    if (!title || amount <= 0) return;

    appData.bills.push({
      id: makeId(),
      title,
      amount,
      date: today(),
      status: "pending",
      createdAt: Date.now()
    });

    saveData();
    closeModal();
  });
}

/* ---------- EMI ---------- */

function showEMI() {
  openModal(`
    <h2>Loans & EMI</h2>

    <form id="emiForm">

      <label>Loan / EMI Name</label>
      <input
        id="emiTitle"
        type="text"
        placeholder="Home Loan / Bike EMI"
        required
      >

      <label>EMI Amount</label>
      <input
        id="emiAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ EMI"
        required
      >

      <button class="primary-btn" type="submit">
        Save EMI
      </button>

    </form>
  `);

  $("emiForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("emiTitle").value.trim();
    const amount = Number($("emiAmount").value);

    if (!title || amount <= 0) return;

    appData.emis.push({
      id: makeId(),
      title,
      amount,
      date: today(),
      status: "pending",
      createdAt: Date.now()
    });

    saveData();
    closeModal();
  });
}

/* ---------- GOALS ---------- */

function showGoals() {
  openModal(`
    <h2>Money Goals</h2>

    <form id="goalForm">

      <label>Goal Name</label>
      <input
        id="goalTitle"
        type="text"
        placeholder="Car / Bike / Emergency Fund"
        required
      >

      <label>Target Amount</label>
      <input
        id="goalAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="₹ Target"
        required
      >

      <button class="primary-btn" type="submit">
        Save Goal
      </button>

    </form>
  `);

  $("goalForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = $("goalTitle").value.trim();
    const amount = Number($("goalAmount").value);

    if (!title || amount <= 0) return;

    appData.goals.push({
      id: makeId(),
      title,
      target: amount,
      saved: 0,
      date: today(),
      createdAt: Date.now()
    });

    saveData();
    closeModal();
  });
}

/* ---------- REPORTS ---------- */

function showReports() {
  const account = getCurrentAccount();

  const income =
    (account.income || []).reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const expense =
    (account.expense || []).reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const balance = income - expense;

  openModal(`
    <h2>Money Reports</h2>

    <div class="report-box">
      <strong>Total Income</strong>
      <span>${formatMoney(income)}</span>
    </div>

    <div class="report-box">
      <strong>Total Expense</strong>
      <span>${formatMoney(expense)}</span>
    </div>

    <div class="report-box">
      <strong>Balance</strong>
      <span>${formatMoney(balance)}</span>
    </div>
  `);
}

/* ---------- VIEW ALL ---------- */

function showAllTransactions() {
  const transactions = getTransactions();

  if (!transactions.length) {
    openModal(`
      <h2>All Transactions</h2>
      <div class="empty-state">
        <div>💰</div>
        <strong>No transactions yet</strong>
        <p>Your transaction history will appear here.</p>
      </div>
    `);

    return;
  }

  openModal(`
    <h2>All Transactions</h2>

    <div class="transaction-list">

      ${transactions.map(item => `
        <div class="transaction-row">

          <strong>
            ${escapeHTML(item.title || "Transaction")}
          </strong>

          <span>
            ${formatMoney(item.amount)}
          </span>

          <small>
            ${escapeHTML(item.date || "")}
            •
            ${escapeHTML(item.time || "")}
          </small>

        </div>
      `).join("")}

    </div>
  `);
}

/* ---------- SETTINGS ---------- */

function showSettings() {
  openModal(`
    <h2>Settings</h2>

    <form id="settingsForm">

      <label>Currency</label>

      <select id="currencySelect">

        <option value="₹"
          ${appData.settings.currency === "₹" ? "selected" : ""}>
          ₹ Indian Rupee
        </option>

        <option value="$"
          ${appData.settings.currency === "$" ? "selected" : ""}>
          $ US Dollar
        </option>

        <option value="€"
          ${appData.settings.currency === "€" ? "selected" : ""}>
          € Euro
        </option>

        <option value="£"
          ${appData.settings.currency === "£" ? "selected" : ""}>
          £ Pound
        </option>

      </select>

      <button class="primary-btn" type="submit">
        Save Settings
      </button>

    </form>

    <button id="clearDataBtn" class="danger-btn">
      Clear All Data
    </button>
  `);

  $("settingsForm").addEventListener("submit", function(e) {
    e.preventDefault();

    appData.settings.currency =
      $("currencySelect").value;

    saveData();
    closeModal();
    updateHome();
  });

  $("clearDataBtn").addEventListener("click", function() {

    const confirmed =
      window.confirm(
        "Clear all HISAB data from this device?"
      );

    if (!confirmed) return;

    appData = cloneDefaultData();

    saveData();
    closeModal();
    updateHome();
  });
}

/* ---------- ACTION HANDLER ---------- */

function handleAction(action) {

  switch (action) {

    case "income":
      showIncome();
      break;

    case "expense":
      showExpense();
      break;

    case "lend":
      showLend();
      break;

    case "savings":
      showSavings();
      break;

    case "budget":
      showBudget();
      break;

    case "bills":
      showBills();
      break;

    case "emi":
      showEMI();
      break;

    case "goals":
      showGoals();
      break;

    case "reports":
      showReports();
      break;

    default:
      console.log("Unknown action:", action);
  }
}

/* ---------- EVENTS ---------- */

function setupEvents() {

  /* Continue */
  const continueBtn = $("continueBtn");

  if (continueBtn) {
    continueBtn.addEventListener("click", function() {
      showScreen("homeScreen");
      updateHome();
    });
  }

  /* Personal */
  const personalBtn = $("personalBtn");

  if (personalBtn) {
    personalBtn.addEventListener("click", function() {

      appData.mode = "personal";

      saveData();
      updateHome();
    });
  }

  /* Business */
  const businessBtn = $("businessBtn");

  if (businessBtn) {
    businessBtn.addEventListener("click", function() {

      appData.mode = "business";

      saveData();
      updateHome();
    });
  }

  /* Settings */
  const settingsBtn = $("settingsBtn");

  if (settingsBtn) {
    settingsBtn.addEventListener(
      "click",
      showSettings
    );
  }

  /* View All */
  const viewAllBtn = $("viewAllBtn");

  if (viewAllBtn) {
    viewAllBtn.addEventListener(
      "click",
      showAllTransactions
    );
  }

  /* Action Cards */
  document
    .querySelectorAll("[data-action]")
    .forEach(button => {

      button.addEventListener(
        "click",
        function() {

          const action =
            this.getAttribute("data-action");

          handleAction(action);
        }
      );

    });

  /* Close Modal */
  const closeBtn = $("closeModal");

  if (closeBtn) {
    closeBtn.addEventListener(
      "click",
      closeModal
    );
  }

  /* Modal Overlay */
  const overlay = $("modalOverlay");

  if (overlay) {
    overlay.addEventListener(
      "click",
      closeModal
    );
  }

  /* Escape key */
  document.addEventListener(
    "keydown",
    function(event) {

      if (event.key === "Escape") {
        closeModal();
      }

    }
  );
}

/* ---------- START APP ---------- */

function startApp() {

  try {

    setupEvents();
    updateHome();
    startSplash();

  } catch (error) {

    console.error(
      "HISAB startup error:",
      error
    );

    /* Keep app from completely crashing */
    showScreen("welcomeScreen");

  }
}

/* ---------- START ---------- */

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    startApp
  );

} else {

  startApp();

}
