/* =========================================================
   HISAB — Money Manager V7
   Personal + Business
   Offline / Local Storage
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "hisab_global_v7_data";

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

let appData = loadData();

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
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
    console.error("HISAB data load error:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (error) {
    console.error("HISAB data save error:", error);
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function formatMoney(value) {
  const number = Number(value) || 0;
  const currency = appData.settings.currency || "₹";

  return (
    currency +
    number.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
      type: item.direction === "given" ? "given" : "received"
    }))
  ].sort((a, b) => {
    const dateA = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`);
    const dateB = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`);

    return dateB - dateA;
  });
}

/* =========================================================
   SCREEN CONTROL
   ========================================================= */

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = $(screenId);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   SPLASH
   ========================================================= */

function startSplash() {
  const splash = $("splashScreen");

  if (!splash) {
    showScreen("welcomeScreen");
    return;
  }

  setTimeout(() => {
    showScreen("welcomeScreen");
  }, 1400);
}

/* =========================================================
   HOME
   ========================================================= */

function updateHome() {
  const account = getCurrentAccount();

  const income = (account.income || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const expense = (account.expense || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const balance = income - expense;

  if ($("totalBalance")) {
    $("totalBalance").textContent = formatMoney(balance);
  }

  if ($("totalIncome")) {
    $("totalIncome").textContent = formatMoney(income);
  }

  if ($("totalExpense")) {
    $("totalExpense").textContent = formatMoney(expense);
  }

  if ($("currencyLabel")) {
    $("currencyLabel").textContent =
      appData.settings.currency || "₹";
  }

  updateModeButtons();
  renderRecentActivity();
}

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

/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

function renderRecentActivity() {
  const container = $("recentActivity");

  if (!container) {
    return;
  }

  const transactions = getTransactions().slice(0, 5);

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

  container.innerHTML = transactions
    .map(item => {
      let icon = "💰";
      let label = "Income";
      let sign = "+";

      if (item.type === "expense") {
        icon = "💸";
        label = "Expense";
        sign = "-";
      }

      if (item.type === "given") {
        icon = "🤝";
        label = "Given";
        sign = "-";
      }

      if (item.type === "received") {
        icon = "🤝";
        label = "Received";
        sign = "+";
      }

      return `
        <div class="activity-row">
          <div class="activity-icon">${icon}</div>

          <div class="activity-info">
            <strong>${escapeHTML(item.title || label)}</strong>
            <small>
              ${escapeHTML(item.date || "")}
              ${item.time ? " • " + escapeHTML(item.time) : ""}
            </small>
          </div>

          <strong class="activity-amount">
            ${sign}${formatMoney(item.amount)}
          </strong>
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   MODAL
   ========================================================= */

function openModal(content) {
  const modal = $("modal");
  const modalContent = $("modalContent");

  if (!modal || !modalContent) {
    return;
  }

  modalContent.innerHTML = content;
  modal.classList.remove("hidden");

  document.body.classList.add("modal-open");
}

function closeModal() {
  const modal = $("modal");

  if (!modal) {
    return;
  }

  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

/* =========================================================
   INCOME
   ========================================================= */

function showIncomeForm() {
  openModal(`
    <div class="modal-form">
      <h2>Add Income</h2>
      <p>Record money received.</p>

      <label>Amount</label>
      <input id="incomeAmount" type="number" inputmode="decimal"
        placeholder="Enter amount">

      <label>Source</label>
      <input id="incomeSource" type="text"
        placeholder="Salary, business, freelance...">

      <label>Date</label>
      <input id="incomeDate" type="date" value="${today()}">

      <label>Note</label>
      <textarea id="incomeNote"
        placeholder="Optional note"></textarea>

      <button id="saveIncomeBtn" class="primary-btn">
        Save Income
      </button>
    </div>
  `);

  const saveBtn = $("saveIncomeBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveIncome);
  }
}

function saveIncome() {
  const amount = Number($("incomeAmount")?.value || 0);
  const source = $("incomeSource")?.value.trim() || "Income";
  const date = $("incomeDate")?.value || today();
  const note = $("incomeNote")?.value.trim() || "";

  if (amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  getCurrentAccount().income.push({
    id: makeId(),
    amount,
    title: source,
    date,
    time: currentTime(),
    note
  });

  saveData();
  closeModal();
  updateHome();
}

/* =========================================================
   EXPENSE
   ========================================================= */

function showExpenseForm() {
  openModal(`
    <div class="modal-form">
      <h2>Add Expense</h2>
      <p>Record money spent.</p>

      <label>Amount</label>
      <input id="expenseAmount" type="number" inputmode="decimal"
        placeholder="Enter amount">

      <label>Category</label>
      <input id="expenseCategory" type="text"
        placeholder="Food, travel, shopping...">

      <label>Date</label>
      <input id="expenseDate" type="date" value="${today()}">

      <label>Note</label>
      <textarea id="expenseNote"
        placeholder="Optional note"></textarea>

      <button id="saveExpenseBtn" class="primary-btn">
        Save Expense
      </button>
    </div>
  `);

  const saveBtn = $("saveExpenseBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveExpense);
  }
}

function saveExpense() {
  const amount = Number($("expenseAmount")?.value || 0);
  const category =
    $("expenseCategory")?.value.trim() || "Expense";
  const date = $("expenseDate")?.value || today();
  const note = $("expenseNote")?.value.trim() || "";

  if (amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  getCurrentAccount().expense.push({
    id: makeId(),
    amount,
    title: category,
    date,
    time: currentTime(),
    note
  });

  saveData();
  closeModal();
  updateHome();
}

/* =========================================================
   PAISA LEN-DEN
   ========================================================= */

function showLendForm() {
  openModal(`
    <div class="modal-form">
      <h2>Paisa Len-Den</h2>
      <p>Record money given or received.</p>

      <label>Type</label>
      <select id="lendDirection">
        <option value="given">Money Given</option>
        <option value="received">Money Received</option>
      </select>

      <label>Person</label>
      <input id="lendPerson" type="text"
        placeholder="Person name">

      <label>Amount</label>
      <input id="lendAmount" type="number"
        inputmode="decimal"
        placeholder="Enter amount">

      <label>Date</label>
      <input id="lendDate" type="date" value="${today()}">

      <label>Note</label>
      <textarea id="lendNote"
        placeholder="Optional note"></textarea>

      <button id="saveLendBtn" class="primary-btn">
        Save Record
      </button>
    </div>
  `);

  $("saveLendBtn")?.addEventListener("click", saveLend);
}

function saveLend() {
  const direction = $("lendDirection")?.value || "given";
  const person = $("lendPerson")?.value.trim() || "Person";
  const amount = Number($("lendAmount")?.value || 0);
  const date = $("lendDate")?.value || today();
  const note = $("lendNote")?.value.trim() || "";

  if (amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  getCurrentAccount().lend.push({
    id: makeId(),
    direction,
    person,
    title: person,
    amount,
    date,
    time: currentTime(),
    note
  });

  saveData();
  closeModal();
  updateHome();
}

/* =========================================================
   SAVINGS
   ========================================================= */

function showSavings() {
  const totalSavings = appData.savings.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  openModal(`
    <div class="modal-form">
      <h2>🏦 Savings</h2>

      <p>
        Total saved:
        <strong>${formatMoney(totalSavings)}</strong>
      </p>

      <label>Saving Amount</label>
      <input id="savingAmount" type="number"
        inputmode="decimal"
        placeholder="Enter amount">

      <label>Purpose</label>
      <input id="savingPurpose" type="text"
        placeholder="Car, emergency, education...">

      <button id="saveSavingBtn" class="primary-btn">
        Add Savings
      </button>
    </div>
  `);

  $("saveSavingBtn")?.addEventListener("click", () => {
    const amount = Number($("savingAmount")?.value || 0);
    const purpose =
      $("savingPurpose")?.value.trim() || "Savings";

    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    appData.savings.push({
      id: makeId(),
      amount,
      purpose,
      date: today()
    });

    saveData();
    closeModal();
  });
}

/* =========================================================
   BUDGET
   ========================================================= */

function showBudget() {
  const totalBudget = appData.budgets.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  openModal(`
    <div class="modal-form">
      <h2>📊 Budget</h2>

      <p>
        Total planned budget:
        <strong>${formatMoney(totalBudget)}</strong>
      </p>

      <label>Budget Amount</label>
      <input id="budgetAmount" type="number"
        inputmode="decimal"
        placeholder="Monthly budget">

      <label>Category</label>
      <input id="budgetCategory" type="text"
        placeholder="Food, shopping, travel...">

      <button id="saveBudgetBtn" class="primary-btn">
        Save Budget
      </button>
    </div>
  `);

  $("saveBudgetBtn")?.addEventListener("click", () => {
    const amount = Number($("budgetAmount")?.value || 0);
    const category =
      $("budgetCategory")?.value.trim() || "Monthly Budget";

    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    appData.budgets.push({
      id: makeId(),
      amount,
      category,
      date: today()
    });

    saveData();
    closeModal();
  });
}

/* =========================================================
   BILLS
   ========================================================= */

function showBills() {
  openModal(`
    <div class="modal-form">
      <h2>🧾 Bills & Payments</h2>

      <label>Bill Name</label>
      <input id="billName" type="text"
        placeholder="Electricity, mobile, rent...">

      <label>Amount</label>
      <input id="billAmount" type="number"
        inputmode="decimal"
        placeholder="Bill amount">

      <label>Due Date</label>
      <input id="billDate" type="date">

      <button id="saveBillBtn" class="primary-btn">
        Save Bill
      </button>
    </div>
  `);

  $("saveBillBtn")?.addEventListener("click", () => {
    const name = $("billName")?.value.trim() || "Bill";
    const amount = Number($("billAmount")?.value || 0);
    const dueDate = $("billDate")?.value || today();

    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    appData.bills.push({
      id: makeId(),
      name,
      amount,
      dueDate,
      paid: false
    });

    saveData();
    closeModal();
  });
}

/* =========================================================
   EMI
   ========================================================= */

function showEMI() {
  openModal(`
    <div class="modal-form">
      <h2>🏠 Loans & EMI</h2>

      <label>Loan / Bank Name</label>
      <input id="emiName" type="text"
        placeholder="Bank or finance company">

      <label>EMI Amount</label>
      <input id="emiAmount" type="number"
        inputmode="decimal"
        placeholder="Monthly EMI">

      <label>Due Date</label>
      <input id="emiDate" type="date">

      <label>Total Tenure</label>
      <input id="emiTenure" type="number"
        placeholder="Months">

      <button id="saveEMIBtn" class="primary-btn">
        Save EMI
      </button>
    </div>
  `);

  $("saveEMIBtn")?.addEventListener("click", () => {
    const name = $("emiName")?.value.trim() || "Loan";
    const amount = Number($("emiAmount")?.value || 0);
    const dueDate = $("emiDate")?.value || today();
    const tenure = Number($("emiTenure")?.value || 0);

    if (amount <= 0) {
      alert("Please enter a valid EMI amount.");
      return;
    }

    appData.emis.push({
      id: makeId(),
      name,
      amount,
      dueDate,
      tenure,
      paid: false
    });

    saveData();
    closeModal();
  });
}

/* =========================================================
   GOALS
   ========================================================= */

function showGoals() {
  const goals = appData.goals || [];

  openModal(`
    <div class="modal-form">
      <h2>🎯 Goals</h2>

      ${
        goals.length
          ? goals
              .map(
                goal => `
                  <div class="goal-row">
                    <strong>${escapeHTML(goal.name)}</strong>
                    <small>
                      ${formatMoney(goal.saved)}
                      / ${formatMoney(goal.target)}
                    </small>
                  </div>
                `
              )
              .join("")
          : `
            <p>No goals created yet.</p>
          `
      }

      <hr>

      <label>Goal Name</label>
      <input id="goalName" type="text"
        placeholder="New car, bike, emergency fund...">

      <label>Target Amount</label>
      <input id="goalTarget" type="number"
        inputmode="decimal"
        placeholder="Target amount">

      <button id="saveGoalBtn" class="primary-btn">
        Create Goal
      </button>
    </div>
  `);

  $("saveGoalBtn")?.addEventListener("click", () => {
    const name = $("goalName")?.value.trim();
    const target = Number($("goalTarget")?.value || 0);

    if (!name) {
      alert("Please enter a goal name.");
      return;
    }

    if (target <= 0) {
      alert("Please enter a valid target amount.");
      return;
    }

    appData.goals.push({
      id: makeId(),
      name,
      target,
      saved: 0,
      date: today()
    });

    saveData();
    closeModal();
  });
}

/* =========================================================
   REPORTS
   ========================================================= */

function showReports() {
  const account = getCurrentAccount();

  const income = (account.income || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const expense = (account.expense || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const balance = income - expense;

  openModal(`
    <div class="modal-form">
      <h2>📈 Reports</h2>

      <div class="report-box">
        <span>Total Income</span>
        <strong>${formatMoney(income)}</strong>
      </div>

      <div class="report-box">
        <span>Total Expense</span>
        <strong>${formatMoney(expense)}</strong>
      </div>

      <div class="report-box">
        <span>Balance</span>
        <strong>${formatMoney(balance)}</strong>
      </div>

      <div class="report-box">
        <span>Transactions</span>
        <strong>${getTransactions().length}</strong>
      </div>
    </div>
  `);
}

/* =========================================================
   VIEW ALL
   ========================================================= */

function showAllTransactions() {
  const transactions = getTransactions();

  if (!transactions.length) {
    openModal(`
      <div class="modal-form">
        <h2>Recent Activity</h2>
        <p>No transactions yet.</p>
      </div>
    `);

    return;
  }

  openModal(`
    <div class="modal-form">
      <h2>All Transactions</h2>

      ${transactions
        .map(item => {
          let type = "Income";
          let sign = "+";

          if (item.type === "expense") {
            type = "Expense";
            sign = "-";
          }

          if (item.type === "given") {
            type = "Given";
            sign = "-";
          }

          if (item.type === "received") {
            type = "Received";
            sign = "+";
          }

          return `
            <div class="transaction-row">
              <div>
                <strong>
                  ${escapeHTML(item.title || type)}
                </strong>

                <small>
                  ${type} • ${escapeHTML(item.date || "")}
                </small>
              </div>

              <strong>
                ${sign}${formatMoney(item.amount)}
              </strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `);
}

/* =========================================================
   SETTINGS
   ========================================================= */

function showSettings() {
  openModal(`
    <div class="modal-form">
      <h2>⚙️ Settings</h2>

      <label>Currency</label>

      <select id="currencySelect">
        <option value="₹">₹ Indian Rupee</option>
        <option value="$">$ US Dollar</option>
        <option value="€">€ Euro</option>
        <option value="£">£ Pound</option>
      </select>

      <button id="saveSettingsBtn" class="primary-btn">
        Save Settings
      </button>

      <hr>

      <button id="clearDataBtn" class="secondary-btn">
        Clear All Data
      </button>
    </div>
  `);

  const currencySelect = $("currencySelect");

  if (currencySelect) {
    currencySelect.value =
      appData.settings.currency || "₹";
  }

  $("saveSettingsBtn")?.addEventListener("click", () => {
    appData.settings.currency =
      $("currencySelect")?.value || "₹";

    saveData();
    closeModal();
    updateHome();
  });

  $("clearDataBtn")?.addEventListener("click", () => {
    const confirmClear = confirm(
      "Are you sure you want to delete all HISAB data?"
    );

    if (!confirmClear) {
      return;
    }

    appData = structuredClone(defaultData);
    saveData();

    closeModal();
    updateHome();

    alert("All data has been cleared.");
  });
}

/* =========================================================
   ACTION ROUTER
   ========================================================= */

function handleAction(action) {
  switch (action) {
    case "income":
      showIncomeForm();
      break;

    case "expense":
      showExpenseForm();
      break;

    case "lend":
      showLendForm();
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

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {

  /* Continue */
  $("continueBtn")?.addEventListener("click", () => {
    showScreen("homeScreen");
    updateHome();
  });

  /* Personal */
  $("personalBtn")?.addEventListener("click", () => {
    appData.mode = "personal";
    saveData();
    updateHome();
  });

  /* Business */
  $("businessBtn")?.addEventListener("click", () => {
    appData.mode = "business";
    saveData();
    updateHome();
  });

  /* Settings */
  $("settingsBtn")?.addEventListener("click", showSettings);

  /* View All */
  $("viewAllBtn")?.addEventListener(
    "click",
    showAllTransactions
  );

  /* All action cards */
  document
    .querySelectorAll("[data-action]")
    .forEach(element => {
      element.addEventListener("click", () => {
        const action = element.dataset.action;
        handleAction(action);
      });
    });

  /* Close modal */
  $("closeModal")?.addEventListener("click", closeModal);

  $("modalOverlay")?.addEventListener(
    "click",
    closeModal
  );

  /* Escape key */
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

/* =========================================================
   APP START
   ========================================================= */

function startApp() {
  console.log("HISAB V7 starting...");

  setupEvents();

  updateHome();

  startSplash();
}

/* =========================================================
   DOM READY
   ========================================================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
