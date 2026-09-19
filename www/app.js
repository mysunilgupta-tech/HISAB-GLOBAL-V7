const KEY = "hisab_v7_data";

const defaultData = {
  mode: "personal",
  currency: "₹",
  transactions: [],
  lendDen: [],
  savings: [],
  goals: [],
  bills: [],
  loans: [],
  budget: 0
};

let data = loadData();

function loadData() {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return structuredClone(defaultData);

    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultData),
      ...parsed,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      lendDen: Array.isArray(parsed.lendDen) ? parsed.lendDen : [],
      savings: Array.isArray(parsed.savings) ? parsed.savings : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      bills: Array.isArray(parsed.bills) ? parsed.bills : [],
      loans: Array.isArray(parsed.loans) ? parsed.loans : []
    };
  } catch (error) {
    console.error("HISAB data load error:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function safe(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  const amount = Number(value) || 0;

  return `${data.currency || "₹"} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getEl(id) {
  return document.getElementById(id);
}

function show(id) {
  const el = getEl(id);
  if (el) el.style.display = "";
}

function hide(id) {
  const el = getEl(id);
  if (el) el.style.display = "none";
}

function modal(title, content) {
  const modalEl = getEl("modal");

  if (!modalEl) return;

  modalEl.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-box" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>${safe(title)}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-content">
          ${content}
        </div>
      </div>
    </div>
  `;

  modalEl.style.display = "block";
}

function closeModal() {
  const modalEl = getEl("modal");
  if (modalEl) {
    modalEl.innerHTML = "";
    modalEl.style.display = "none";
  }
}

function toast(message) {
  let toastEl = getEl("toast");

  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "toast";
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

function setMode(mode) {
  data.mode = mode;
  saveData();

  document.querySelectorAll("[data-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  updateDashboard();
  toast(`${mode === "personal" ? "Personal" : "Business"} mode selected`);
}

function calculateBalance() {
  let income = 0;
  let expense = 0;

  data.transactions.forEach(item => {
    if (item.type === "income") {
      income += Number(item.amount) || 0;
    } else if (item.type === "expense") {
      expense += Number(item.amount) || 0;
    }
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}

function calculateLendDen() {
  let given = 0;
  let received = 0;

  data.lendDen.forEach(item => {
    if (item.type === "given") {
      given += Number(item.amount) || 0;
    } else if (item.type === "received") {
      received += Number(item.amount) || 0;
    }
  });

  return {
    given,
    received,
    balance: given - received
  };
}

function updateDashboard() {
  const totals = calculateBalance();
  const lend = calculateLendDen();

  const balanceEl = getEl("balance");
  const incomeEl = getEl("incomeTotal");
  const expenseEl = getEl("expenseTotal");
  const lendEl = getEl("lendTotal");

  if (balanceEl) balanceEl.textContent = money(totals.balance);
  if (incomeEl) incomeEl.textContent = money(totals.income);
  if (expenseEl) expenseEl.textContent = money(totals.expense);
  if (lendEl) lendEl.textContent = money(lend.balance);

  const modeEl = getEl("currentMode");
  if (modeEl) {
    modeEl.textContent =
      data.mode === "personal" ? "Personal" : "Business";
  }

  renderRecentActivity();
}

function renderRecentActivity() {
  const container = getEl("recentActivity");

  if (!container) return;

  const items = [...data.transactions]
    .sort((a, b) => {
      return String(b.date || "").localeCompare(String(a.date || ""));
    })
    .slice(0, 5);

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">₹</div>
        <h4>No transactions yet</h4>
        <p>Add your first income or expense.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="activity-row">
      <div>
        <strong>${safe(item.title || item.category || "Transaction")}</strong>
        <small>${safe(item.date || "")}</small>
      </div>
      <strong class="${item.type === "income" ? "income-text" : "expense-text"}">
        ${item.type === "income" ? "+" : "-"}${money(item.amount)}
      </strong>
    </div>
  `).join("");
}

function addTransaction(type) {
  modal(
    type === "income" ? "Add Income" : "Add Expense",
    `
      <form id="transactionForm">
        <label>Amount</label>
        <input id="transactionAmount" type="number" min="0" step="0.01" required>

        <label>Category / Title</label>
        <input id="transactionTitle" type="text" placeholder="e.g. Salary, Food" required>

        <label>Date</label>
        <input id="transactionDate" type="date" value="${today()}" required>

        <label>Note</label>
        <textarea id="transactionNote" placeholder="Optional note"></textarea>

        <button class="primary-btn" type="submit">
          Save ${type === "income" ? "Income" : "Expense"}
        </button>
      </form>
    `
  );

  const form = getEl("transactionForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const amount = Number(getEl("transactionAmount")?.value || 0);
    const title = getEl("transactionTitle")?.value.trim() || "";
    const date = getEl("transactionDate")?.value || today();
    const note = getEl("transactionNote")?.value.trim() || "";

    if (amount <= 0 || !title) {
      toast("Please enter valid details");
      return;
    }

    data.transactions.push({
      id: Date.now(),
      mode: data.mode,
      type,
      amount,
      title,
      date,
      note,
      createdAt: new Date().toISOString()
    });

    saveData();
    closeModal();
    updateDashboard();
    toast(`${type === "income" ? "Income" : "Expense"} added`);
  });
}

function addLendDen(type) {
  modal(
    type === "given" ? "Paisa Diya" : "Paisa Mila",
    `
      <form id="lendForm">
        <label>Person Name</label>
        <input id="lendPerson" type="text" placeholder="Name" required>

        <label>Amount</label>
        <input id="lendAmount" type="number" min="0" step="0.01" required>

        <label>Date</label>
        <input id="lendDate" type="date" value="${today()}" required>

        <label>Note</label>
        <textarea id="lendNote" placeholder="Optional note"></textarea>

        <button class="primary-btn" type="submit">
          Save
        </button>
      </form>
    `
  );

  const form = getEl("lendForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const person = getEl("lendPerson")?.value.trim() || "";
    const amount = Number(getEl("lendAmount")?.value || 0);
    const date = getEl("lendDate")?.value || today();
    const note = getEl("lendNote")?.value.trim() || "";

    if (!person || amount <= 0) {
      toast("Please enter valid details");
      return;
    }

    data.lendDen.push({
      id: Date.now(),
      mode: data.mode,
      type,
      person,
      amount,
      date,
      note,
      createdAt: new Date().toISOString()
    });

    saveData();
    closeModal();
    updateDashboard();
    toast("Paisa Len-Den saved");
  });
}

function showLendDen() {
  const totals = calculateLendDen();

  const rows = [...data.lendDen]
    .sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

  modal(
    "Paisa Len-Den",
    `
      <div class="summary-grid">
        <div>
          <small>Diya</small>
          <strong>${money(totals.given)}</strong>
        </div>
        <div>
          <small>Mila</small>
          <strong>${money(totals.received)}</strong>
        </div>
        <div>
          <small>Net</small>
          <strong>${money(totals.balance)}</strong>
        </div>
      </div>

      <div class="action-row">
        <button class="primary-btn" onclick="addLendDen('given')">
          + Paisa Diya
        </button>
        <button class="secondary-btn" onclick="addLendDen('received')">
          + Paisa Mila
        </button>
      </div>

      <div class="ledger-list">
        ${
          rows.length
            ? rows.map(item => `
              <div class="ledger-row">
                <div>
                  <strong>${safe(item.person)}</strong>
                  <small>${safe(item.date)}${item.note ? " • " + safe(item.note) : ""}</small>
                </div>
                <strong>
                  ${item.type === "given" ? "-" : "+"}${money(item.amount)}
                </strong>
              </div>
            `).join("")
            : `
              <div class="empty-state">
                <h4>No records yet</h4>
                <p>Add money given or received.</p>
              </div>
            `
        }
      </div>
    `
  );
}

function addSavings() {
  modal(
    "Add Savings",
    `
      <form id="savingsForm">
        <label>Purpose</label>
        <input id="savingPurpose" type="text" placeholder="Car, Emergency, etc." required>

        <label>Amount</label>
        <input id="savingAmount" type="number" min="0" step="0.01" required>

        <label>Date</label>
        <input id="savingDate" type="date" value="${today()}" required>

        <button class="primary-btn" type="submit">Save</button>
      </form>
    `
  );

  const form = getEl("savingsForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const purpose = getEl("savingPurpose")?.value.trim() || "";
    const amount = Number(getEl("savingAmount")?.value || 0);
    const date = getEl("savingDate")?.value || today();

    if (!purpose || amount <= 0) {
      toast("Please enter valid details");
      return;
    }

    data.savings.push({
      id: Date.now(),
      mode: data.mode,
      purpose,
      amount,
      date
    });

    saveData();
    closeModal();
    toast("Savings added");
  });
}

function showSavings() {
  const total = data.savings.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  modal(
    "Savings",
    `
      <div class="feature-summary">
        <span>Total Savings</span>
        <strong>${money(total)}</strong>
      </div>

      <button class="primary-btn" onclick="addSavings()">+ Add Savings</button>

      <div class="ledger-list">
        ${
          data.savings.length
            ? data.savings.map(item => `
              <div class="ledger-row">
                <div>
                  <strong>${safe(item.purpose)}</strong>
                  <small>${safe(item.date)}</small>
                </div>
                <strong>${money(item.amount)}</strong>
              </div>
            `).join("")
            : `<div class="empty-state"><p>No savings added yet.</p></div>`
        }
      </div>
    `
  );
}

function showBudget() {
  modal(
    "Budget",
    `
      <form id="budgetForm">
        <label>Monthly Budget</label>
        <input id="budgetAmount" type="number" min="0" step="0.01"
          value="${Number(data.budget) || 0}">

        <button class="primary-btn" type="submit">Save Budget</button>
      </form>

      <div class="feature-summary">
        <span>Current Budget</span>
        <strong>${money(data.budget)}</strong>
      </div>
    `
  );

  const form = getEl("budgetForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    data.budget = Number(getEl("budgetAmount")?.value || 0);
    saveData();
    closeModal();
    toast("Budget saved");
  });
}

function addGoal() {
  modal(
    "Add Goal",
    `
      <form id="goalForm">
        <label>Goal Name</label>
        <input id="goalName" type="text" placeholder="New Bike, Car, etc." required>

        <label>Target Amount</label>
        <input id="goalTarget" type="number" min="0" step="0.01" required>

        <label>Saved Amount</label>
        <input id="goalSaved" type="number" min="0" step="0.01" value="0">

        <button class="primary-btn" type="submit">Save Goal</button>
      </form>
    `
  );

  const form = getEl("goalForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = getEl("goalName")?.value.trim() || "";
    const target = Number(getEl("goalTarget")?.value || 0);
    const saved = Number(getEl("goalSaved")?.value || 0);

    if (!name || target <= 0) {
      toast("Please enter valid details");
      return;
    }

    data.goals.push({
      id: Date.now(),
      mode: data.mode,
      name,
      target,
      saved
    });

    saveData();
    closeModal();
    toast("Goal added");
  });
}

function showGoals() {
  modal(
    "Goals",
    `
      <button class="primary-btn" onclick="addGoal()">+ Add Goal</button>

      <div class="goal-list">
        ${
          data.goals.length
            ? data.goals.map(goal => {
                const target = Number(goal.target) || 0;
                const saved = Number(goal.saved) || 0;
                const percent = target
                  ? Math.min(100, Math.round((saved / target) * 100))
                  : 0;

                return `
                  <div class="goal-card">
                    <strong>${safe(goal.name)}</strong>
                    <div class="goal-amount">
                      ${money(saved)} / ${money(target)}
                    </div>
                    <div class="progress">
                      <div class="progress-bar" style="width:${percent}%"></div>
                    </div>
                    <small>${percent}% completed</small>
                  </div>
                `;
              }).join("")
            : `<div class="empty-state"><p>No goals added yet.</p></div>`
        }
      </div>
    `
  );
}

function addBill() {
  modal(
    "Add Bill",
    `
      <form id="billForm">
        <label>Bill Name</label>
        <input id="billName" type="text" placeholder="Electricity, Rent, etc." required>

        <label>Amount</label>
        <input id="billAmount" type="number" min="0" step="0.01" required>

        <label>Due Date</label>
        <input id="billDate" type="date" required>

        <button class="primary-btn" type="submit">Save Bill</button>
      </form>
    `
  );

  const form = getEl("billForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = getEl("billName")?.value.trim() || "";
    const amount = Number(getEl("billAmount")?.value || 0);
    const dueDate = getEl("billDate")?.value || "";

    if (!name || amount <= 0 || !dueDate) {
      toast("Please enter valid details");
      return;
    }

    data.bills.push({
      id: Date.now(),
      mode: data.mode,
      name,
      amount,
      dueDate,
      paid: false
    });

    saveData();
    closeModal();
    toast("Bill added");
  });
}

function showBills() {
  modal(
    "Bills & Payments",
    `
      <button class="primary-btn" onclick="addBill()">+ Add Bill</button>

      <div class="ledger-list">
        ${
          data.bills.length
            ? data.bills.map(bill => `
              <div class="ledger-row">
                <div>
                  <strong>${safe(bill.name)}</strong>
                  <small>Due: ${safe(bill.dueDate)}</small>
                </div>
                <div>
                  <strong>${money(bill.amount)}</strong>
                  <button class="small-btn" onclick="toggleBill(${bill.id})">
                    ${bill.paid ? "Paid" : "Mark Paid"}
                  </button>
                </div>
              </div>
            `).join("")
            : `<div class="empty-state"><p>No bills added yet.</p></div>`
        }
      </div>
    `
  );
}

function toggleBill(id) {
  const bill = data.bills.find(item => item.id === id);

  if (!bill) return;

  bill.paid = !bill.paid;
  saveData();
  showBills();
}

function addLoan() {
  modal(
    "Add Loan / EMI",
    `
      <form id="loanForm">
        <label>Loan Name</label>
        <input id="loanName" type="text" placeholder="Home Loan, Bike Loan" required>

        <label>Loan Amount</label>
        <input id="loanAmount" type="number" min="0" step="0.01" required>

        <label>EMI Amount</label>
        <input id="loanEmi" type="number" min="0" step="0.01" required>

        <label>Due Date</label>
        <input id="loanDate" type="date" required>

        <button class="primary-btn" type="submit">Save Loan</button>
      </form>
    `
  );

  const form = getEl("loanForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = getEl("loanName")?.value.trim() || "";
    const amount = Number(getEl("loanAmount")?.value || 0);
    const emi = Number(getEl("loanEmi")?.value || 0);
    const dueDate = getEl("loanDate")?.value || "";

    if (!name || amount <= 0 || emi <= 0 || !dueDate) {
      toast("Please enter valid details");
      return;
    }

    data.loans.push({
      id: Date.now(),
      mode: data.mode,
      name,
      amount,
      emi,
      dueDate,
      paid: false
    });

    saveData();
    closeModal();
    toast("Loan / EMI added");
  });
}

function showLoans() {
  modal(
    "Loans & EMI",
    `
      <button class="primary-btn" onclick="addLoan()">+ Add Loan / EMI</button>

      <div class="ledger-list">
        ${
          data.loans.length
            ? data.loans.map(loan => `
              <div class="ledger-row">
                <div>
                  <strong>${safe(loan.name)}</strong>
                  <small>Due: ${safe(loan.dueDate)}</small>
                </div>
                <div>
                  <strong>EMI ${money(loan.emi)}</strong>
                  <small>Total ${money(loan.amount)}</small>
                </div>
              </div>
            `).join("")
            : `<div class="empty-state"><p>No loans / EMI added yet.</p></div>`
        }
      </div>
    `
  );
}

function showReports() {
  const totals = calculateBalance();
  const lend = calculateLendDen();

  modal(
    "Reports",
    `
      <div class="report-grid">
        <div>
          <span>Income</span>
          <strong>${money(totals.income)}</strong>
        </div>

        <div>
          <span>Expense</span>
          <strong>${money(totals.expense)}</strong>
        </div>

        <div>
          <span>Balance</span>
          <strong>${money(totals.balance)}</strong>
        </div>

        <div>
          <span>Paisa Len-Den</span>
          <strong>${money(lend.balance)}</strong>
        </div>
      </div>

      <h4>Transactions</h4>
      <p>Total: ${data.transactions.length}</p>

      <h4>Savings</h4>
      <p>Total entries: ${data.savings.length}</p>

      <h4>Goals</h4>
      <p>Total goals: ${data.goals.length}</p>

      <h4>Bills</h4>
      <p>Total bills: ${data.bills.length}</p>

      <h4>Loans / EMI</h4>
      <p>Total loans: ${data.loans.length}</p>
    `
  );
}

function showAllTransactions() {
  const items = [...data.transactions]
    .sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

  modal(
    "All Transactions",
    `
      <div class="ledger-list">
        ${
          items.length
            ? items.map(item => `
              <div class="ledger-row">
                <div>
                  <strong>${safe(item.title)}</strong>
                  <small>${safe(item.date)}${item.note ? " • " + safe(item.note) : ""}</small>
                </div>
                <strong>
                  ${item.type === "income" ? "+" : "-"}${money(item.amount)}
                </strong>
              </div>
            `).join("")
            : `<div class="empty-state"><p>No transactions yet.</p></div>`
        }
      </div>
    `
  );
}

function showSettings() {
  modal(
    "Settings",
    `
      <form id="settingsForm">
        <label>Currency</label>
        <select id="currencySelect">
          <option value="₹" ${data.currency === "₹" ? "selected" : ""}>₹ Indian Rupee</option>
          <option value="$" ${data.currency === "$" ? "selected" : ""}>$ US Dollar</option>
          <option value="€" ${data.currency === "€" ? "selected" : ""}>€ Euro</option>
          <option value="£" ${data.currency === "£" ? "selected" : ""}>£ Pound</option>
          <option value="¥" ${data.currency === "¥" ? "selected" : ""}>¥ Yen</option>
        </select>

        <button class="primary-btn" type="submit">
          Save Settings
        </button>
      </form>

      <hr>

      <button class="danger-btn" onclick="clearAllData()">
        Clear All Data
      </button>
    `
  );

  const form = getEl("settingsForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const currency = getEl("currencySelect")?.value || "₹";

    data.currency = currency;
    saveData();
    closeModal();
    updateDashboard();
    toast("Settings saved");
  });
}

function clearAllData() {
  const confirmed = confirm(
    "Are you sure? All HISAB data stored on this device will be deleted."
  );

  if (!confirmed) return;

  localStorage.removeItem(KEY);
  data = structuredClone(defaultData);

  closeModal();
  updateDashboard();

  toast("All data cleared");
}

function handleAction(action) {
  switch (action) {
    case "income":
      addTransaction("income");
      break;

    case "expense":
      addTransaction("expense");
      break;

    case "lend":
    case "lendden":
    case "paisa":
      showLendDen();
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

    case "loans":
    case "emi":
      showLoans();
      break;

    case "goals":
      showGoals();
      break;

    case "reports":
      showReports();
      break;

    case "all":
    case "transactions":
      showAllTransactions();
      break;

    case "settings":
      showSettings();
      break;

    default:
      toast("Feature opening soon");
  }
}

function bindActions() {
  document.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-action]");

    if (actionButton) {
      event.preventDefault();
      handleAction(actionButton.dataset.action);
      return;
    }

    const modeButton = event.target.closest("[data-mode]");

    if (modeButton) {
      event.preventDefault();
      setMode(modeButton.dataset.mode);
    }

    if (
      event.target.matches(".modal-close") ||
      event.target.closest(".modal-close")
    ) {
      closeModal();
    }
  });
}

function setupContinueButton() {
  const button = getEl("continueBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    hide("welcomeScreen");
    show("homeScreen");

    updateDashboard();
  });
}

function setupCloseButtons() {
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

function init() {
  bindActions();
  setupContinueButton();
  setupCloseButtons();

  const welcome = getEl("welcomeScreen");
  const home = getEl("homeScreen");

  if (welcome && home) {
    home.style.display = "none";
  }

  updateDashboard();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
