(() => {
"use strict";

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

let state = load();

function load() {
try {
const saved = localStorage.getItem(KEY);

  if (!saved) {
    return JSON.parse(JSON.stringify(defaultData));
  }

  const data = JSON.parse(saved);

  return {
    ...JSON.parse(JSON.stringify(defaultData)),
    ...data,
    transactions: Array.isArray(data.transactions)
      ? data.transactions
      : [],
    lendDen: Array.isArray(data.lendDen)
      ? data.lendDen
      : [],
    savings: Array.isArray(data.savings)
      ? data.savings
      : [],
    goals: Array.isArray(data.goals)
      ? data.goals
      : [],
    bills: Array.isArray(data.bills)
      ? data.bills
      : [],
    loans: Array.isArray(data.loans)
      ? data.loans
      : []
  };
} catch {
  return JSON.parse(JSON.stringify(defaultData));
}

}

function save() {
localStorage.setItem(KEY, JSON.stringify(state));
}

function $(id) {
return document.getElementById(id);
}

function money(value) {
const number = Number(value) || 0;

return (
  state.currency +
  number.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })
);

}

function dateNow() {
const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;

}

function safe(value) {
return String(value ?? "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function openModal(title, content) {
const modal = $("modal");
const modalContent = $("modalContent");

if (!modal || !modalContent) return;

modalContent.innerHTML = `
  <h2>${safe(title)}</h2>
  ${content}
`;

modal.classList.remove("hidden");

}

function closeModal() {
$("modal")?.classList.add("hidden");
}

function showHome() {
$("splashScreen")?.classList.remove("active");
$("welcomeScreen")?.classList.remove("active");
$("homeScreen")?.classList.add("active");
}

function updateMode() {
$("personalBtn")?.classList.toggle(
"active",
state.mode === "personal"
);

$("businessBtn")?.classList.toggle(
  "active",
  state.mode === "business"
);

}

function currentTransactions() {
return state.transactions.filter(
item => item.mode === state.mode
);
}

function updateDashboard() {
const transactions = currentTransactions();

let income = 0;
let expense = 0;

transactions.forEach(item => {
  if (item.type === "income") {
    income += Number(item.amount) || 0;
  }

  if (item.type === "expense") {
    expense += Number(item.amount) || 0;
  }
});

const balance = income - expense;

if ($("totalBalance")) {
  $("totalBalance").textContent = money(balance);
}

if ($("totalIncome")) {
  $("totalIncome").textContent = money(income);
}

if ($("totalExpense")) {
  $("totalExpense").textContent = money(expense);
}

if ($("currencyLabel")) {
  $("currencyLabel").textContent = state.currency;
}

updateMode();
updateRecent();

}

function updateRecent() {
const box = $("recentActivity");

if (!box) return;

const list = currentTransactions()
  .slice()
  .sort((a, b) => b.id - a.id)
  .slice(0, 5);

if (!list.length) {
  box.innerHTML = `
    <div class="empty-state">
      <div>💰</div>
      <strong>No transactions yet</strong>
      <p>Add your first income or expense.</p>
    </div>
  `;

  return;
}

box.innerHTML = list
  .map(item => `
    <div class="activity-row">
      <div>
        <strong>${safe(item.title)}</strong>
        <small>${safe(item.date)}</small>
      </div>

      <strong>
        ${item.type === "income" ? "+" : "-"}${money(item.amount)}
      </strong>
    </div>
  `)
  .join("");

}

function addIncome() {
transactionForm("income");
}

function addExpense() {
transactionForm("expense");
}

function transactionForm(type) {
const income = type === "income";

openModal(
  income ? "Add Income" : "Add Expense",
  `
    <form id="transactionForm">

      <label>Title</label>
      <input
        id="transactionTitle"
        type="text"
        placeholder="${income ? "Salary / Business Income" : "Food / Shopping / Travel"}"
        required
      >

      <label>Amount</label>
      <input
        id="transactionAmount"
        type="number"
        min="0"
        step="0.01"
        placeholder="0"
        required
      >

      <label>Date</label>
      <input
        id="transactionDate"
        type="date"
        value="${dateNow()}"
        required
      >

      <label>Note</label>
      <textarea
        id="transactionNote"
        placeholder="Optional note"
      ></textarea>

      <button class="primary-btn" type="submit">
        Save ${income ? "Income" : "Expense"}
      </button>

    </form>
  `
);

$("transactionForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const title = $("transactionTitle").value.trim();
  const amount = Number($("transactionAmount").value);
  const date = $("transactionDate").value;
  const note = $("transactionNote").value.trim();

  if (!title || !amount || amount <= 0) {
    return;
  }

  state.transactions.push({
    id: Date.now(),
    mode: state.mode,
    type,
    title,
    amount,
    date,
    note
  });

  save();
  closeModal();
  updateDashboard();
});

}

function lendDen() {
const list = state.lendDen.filter(
item => item.mode === state.mode
);

const given = list
  .filter(item => item.type === "given")
  .reduce((total, item) => total + Number(item.amount), 0);

const received = list
  .filter(item => item.type === "received")
  .reduce((total, item) => total + Number(item.amount), 0);

openModal(
  "Paisa Len-Den",
  `
    <div class="balance-row">
      <div>
        <span>Given</span>
        <strong>${money(given)}</strong>
      </div>

      <div>
        <span>Received</span>
        <strong>${money(received)}</strong>
      </div>
    </div>

    <button id="newLend" class="primary-btn">
      + Add Paisa Len-Den
    </button>

    <div class="list-area">
      ${
        list.length
          ? list.slice().reverse().map(item => `
            <div class="activity-row">
              <div>
                <strong>${safe(item.person)}</strong>
                <small>
                  ${item.type === "given"
                    ? "Paisa Diya"
                    : "Paisa Liya"}
                  • ${safe(item.date)}
                </small>
              </div>

              <strong>${money(item.amount)}</strong>
            </div>
          `).join("")
          : "<p>No Paisa Len-Den records yet.</p>"
      }
    </div>
  `
);

$("newLend")?.addEventListener("click", addLend);

}

function addLend() {
openModal(
"Add Paisa Len-Den",
`
<form id="lendForm">

      <label>Person Name</label>
      <input id="lendPerson" required placeholder="Person name">

      <label>Type</label>
      <select id="lendType">
        <option value="given">Paisa Diya</option>
        <option value="received">Paisa Liya</option>
      </select>

      <label>Amount</label>
      <input
        id="lendAmount"
        type="number"
        min="0"
        step="0.01"
        required
      >

      <label>Date</label>
      <input
        id="lendDate"
        type="date"
        value="${dateNow()}"
        required
      >

      <label>Note</label>
      <textarea id="lendNote"></textarea>

      <button class="primary-btn" type="submit">
        Save Entry
      </button>

    </form>
  `
);

$("lendForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const person = $("lendPerson").value.trim();
  const type = $("lendType").value;
  const amount = Number($("lendAmount").value);
  const date = $("lendDate").value;
  const note = $("lendNote").value.trim();

  if (!person || !amount || amount <= 0) {
    return;
  }

  state.lendDen.push({
    id: Date.now(),
    mode: state.mode,
    person,
    type,
    amount,
    date,
    note
  });

  save();
  lendDen();
});

}

function savings() {
const total = state.savings.reduce(
(sum, item) => sum + Number(item.amount),
0
);

openModal(
  "Savings",
  `
    <div class="balance-card">
      <span>Total Savings</span>
      <h2>${money(total)}</h2>
    </div>

    <form id="savingForm">

      <label>Purpose</label>
      <input
        id="savingPurpose"
        placeholder="Emergency / FD / Future"
        required
      >

      <label>Amount</label>
      <input
        id="savingAmount"
        type="number"
        min="0"
        required
      >

      <button class="primary-btn" type="submit">
        Add Saving
      </button>

    </form>
  `
);

$("savingForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const purpose = $("savingPurpose").value.trim();
  const amount = Number($("savingAmount").value);

  if (!purpose || !amount || amount <= 0) {
    return;
  }

  state.savings.push({
    id: Date.now(),
    purpose,
    amount,
    date: dateNow()
  });

  save();
  savings();
});

}

function budget() {
openModal(
"Monthly Budget",
`
<form id="budgetForm">

      <label>Monthly Budget</label>

      <input
        id="budgetAmount"
        type="number"
        min="0"
        step="0.01"
        value="${state.budget || ""}"
        placeholder="0"
        required
      >

      <button class="primary-btn" type="submit">
        Save Budget
      </button>

    </form>
  `
);

$("budgetForm")?.addEventListener("submit", event => {
  event.preventDefault();

  state.budget = Number($("budgetAmount").value) || 0;

  save();

  openModal(
    "Budget Saved",
    `
      <div class="empty-state">
        <div>📊</div>
        <strong>Monthly Budget</strong>
        <p>${money(state.budget)}</p>
      </div>
    `
  );
});

}

function bills() {
openModal(
"Bills & Payments",
`
<form id="billForm">

      <label>Bill Name</label>
      <input id="billName" required placeholder="Electricity / Rent / Mobile">

      <label>Amount</label>
      <input id="billAmount" type="number" min="0" required>

      <label>Due Date</label>
      <input id="billDate" type="date" required>

      <button class="primary-btn" type="submit">
        Add Bill
      </button>

    </form>

    <div class="list-area">
      ${
        state.bills.length
          ? state.bills.slice().reverse().map(item => `
            <div class="activity-row">
              <div>
                <strong>${safe(item.name)}</strong>
                <small>Due: ${safe(item.date)}</small>
              </div>

              <strong>${money(item.amount)}</strong>
            </div>
          `).join("")
          : "<p>No bills added yet.</p>"
      }
    </div>
  `
);

$("billForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("billName").value.trim();
  const amount = Number($("billAmount").value);
  const date = $("billDate").value;

  if (!name || !amount || !date) {
    return;
  }

  state.bills.push({
    id: Date.now(),
    name,
    amount,
    date
  });

  save();
  bills();
});

}

function loans() {
openModal(
"Loans & EMI",
`
<form id="loanForm">

      <label>Loan / EMI Name</label>
      <input id="loanName" required placeholder="Bike EMI / Home Loan">

      <label>EMI Amount</label>
      <input id="loanAmount" type="number" min="0" required>

      <label>Due Date</label>
      <input id="loanDate" type="date" required>

      <label>Tenure (Months)</label>
      <input id="loanTenure" type="number" min="1">

      <button class="primary-btn" type="submit">
        Add Loan / EMI
      </button>

    </form>

    <div class="list-area">
      ${
        state.loans.length
          ? state.loans.slice().reverse().map(item => `
            <div class="activity-row">
              <div>
                <strong>${safe(item.name)}</strong>
                <small>
                  Due: ${safe(item.date)}
                  • ${item.tenure || 0} months
                </small>
              </div>

              <strong>${money(item.amount)}</strong>
            </div>
          `).join("")
          : "<p>No loans or EMI added yet.</p>"
      }
    </div>
  `
);

$("loanForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("loanName").value.trim();
  const amount = Number($("loanAmount").value);
  const date = $("loanDate").value;
  const tenure = Number($("loanTenure").value) || 0;

  if (!name || !amount || !date) {
    return;
  }

  state.loans.push({
    id: Date.now(),
    mode: state.mode,
    name,
    amount,
    date,
    tenure
  });

  save();
  loans();
});

}

function goals() {
openModal(
"Goals",
`
<form id="goalForm">

      <label>Goal Name</label>
      <input
        id="goalName"
        required
        placeholder="Car / Bike / Emergency Fund"
      >

      <label>Target Amount</label>
      <input
        id="goalTarget"
        type="number"
        min="0"
        required
      >

      <label>Already Saved</label>
      <input
        id="goalSaved"
        type="number"
        min="0"
        value="0"
      >

      <button class="primary-btn" type="submit">
        Add Goal
      </button>

    </form>

    <div class="list-area">
      ${
        state.goals.length
          ? state.goals.slice().reverse().map(item => {
              const target = Number(item.target) || 0;
              const saved = Number(item.saved) || 0;

              const percent = target > 0
                ? Math.min(100, Math.round((saved / target) * 100))
                : 0;

              return `
                <div class="activity-row">
                  <div>
                    <strong>${safe(item.name)}</strong>
                    <small>
                      ${money(saved)} / ${money(target)}
                      • ${percent}%
                    </small>
                  </div>
                </div>
              `;
            }).join("")
          : "<p>No goals added yet.</p>"
      }
    </div>
  `
);

$("goalForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("goalName").value.trim();
  const target = Number($("goalTarget").value);
  const saved = Number($("goalSaved").value) || 0;

  if (!name || !target || target <= 0) {
    return;
  }

  state.goals.push({
    id: Date.now(),
    name,
    target,
    saved
  });

  save();
  goals();
});

}

function reports() {
const transactions = currentTransactions();

const income = transactions
  .filter(item => item.type === "income")
  .reduce((sum, item) => sum + Number(item.amount), 0);

const expense = transactions
  .filter(item => item.type === "expense")
  .reduce((sum, item) => sum + Number(item.amount), 0);

openModal(
  "Reports",
  `
    <div class="balance-card">
      <span>Current Balance</span>
      <h2>${money(income - expense)}</h2>
    </div>

    <div class="balance-row">
      <div>
        <span>Total Income</span>
        <strong>${money(income)}</strong>
      </div>

      <div>
        <span>Total Expense</span>
        <strong>${money(expense)}</strong>
      </div>
    </div>

    <p>
      Total transactions: <strong>${transactions.length}</strong>
    </p>
  `
);

}

function viewAll() {
const transactions = currentTransactions()
.slice()
.sort((a, b) => b.id - a.id);

openModal(
  "All Transactions",
  `
    <div class="list-area">
      ${
        transactions.length
          ? transactions.map(item => `
            <div class="activity-row">
              <div>
                <strong>${safe(item.title)}</strong>
                <small>
                  ${safe(item.date)}
                  • ${item.type === "income" ? "Income" : "Expense"}
                </small>
              </div>

              <strong>
                ${item.type === "income" ? "+" : "-"}${money(item.amount)}
              </strong>
            </div>
          `).join("")
          : "<p>No transactions yet.</p>"
      }
    </div>
  `
);

}

function settings() {
openModal(
"Settings",
`
<div class="feature-list">

      <button id="currencySetting" class="feature-item">
        <span class="feature-icon">💱</span>

        <span>
          <strong>Currency</strong>
          <small>Current: ${safe(state.currency)}</small>
        </span>

        <b>›</b>
      </button>

      <button id="clearSetting" class="feature-item">
        <span class="feature-icon">🗑️</span>

        <span>
          <strong>Clear Data</strong>
          <small>Delete all local HISAB data</small>
        </span>

        <b>›</b>
      </button>

    </div>
  `
);

$("currencySetting")?.addEventListener(
  "click",
  currency
);

$("clearSetting")?.addEventListener(
  "click",
  clearData
);

}

function currency() {
openModal(
"Currency",
`
<button class="primary-btn currency-btn" data-currency="₹">
₹ INR
</button>

    <button class="primary-btn currency-btn" data-currency="$">
      $ USD
    </button>

    <button class="primary-btn currency-btn" data-currency="€">
      € EUR
    </button>

    <button class="primary-btn currency-btn" data-currency="£">
      £ GBP
    </button>

    <button class="primary-btn currency-btn" data-currency="AED">
      AED
    </button>
  `
);

document.querySelectorAll(".currency-btn")
  .forEach(button => {
    button.addEventListener("click", () => {
      state.currency = button.dataset.currency;

      save();
      closeModal();
      updateDashboard();
    });
  });

}

function clearData() {
const confirmDelete = window.confirm(
"Delete all HISAB data from this device?"
);

if (!confirmDelete) return;

localStorage.removeItem(KEY);

state = JSON.parse(
  JSON.stringify(defaultData)
);

closeModal();
updateDashboard();

}

function action(actionName) {
switch (actionName) {
case "income":
addIncome();
break;

  case "expense":
    addExpense();
    break;

  case "lend":
    lendDen();
    break;

  case "savings":
    savings();
    break;

  case "budget":
    budget();
    break;

  case "bills":
    bills();
    break;

  case "emi":
    loans();
    break;

  case "goals":
    goals();
    break;

  case "reports":
    reports();
    break;
}

}

function init() {

$("continueBtn")?.addEventListener(
  "click",
  showHome
);

$("settingsBtn")?.addEventListener(
  "click",
  settings
);

$("viewAllBtn")?.addEventListener(
  "click",
  viewAll
);

$("closeModal")?.addEventListener(
  "click",
  closeModal
);

$("modalOverlay")?.addEventListener(
  "click",
  closeModal
);

$("personalBtn")?.addEventListener(
  "click",
  () => {
    state.mode = "personal";
    save();
    updateDashboard();
  }
);

$("businessBtn")?.addEventListener(
  "click",
  () => {
    state.mode = "business";
    save();
    updateDashboard();
  }
);

document.querySelectorAll("[data-action]")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => action(button.dataset.action)
    );
  });

updateDashboard();

setTimeout(() => {
  $("splashScreen")?.classList.remove("active");
  $("welcomeScreen")?.classList.add("active");
}, 1400);

}

document.addEventListener(
"DOMContentLoaded",
init
);

})();
