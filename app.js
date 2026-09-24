(() => {
"use strict";

/* =========================================================
HISAB GLOBAL V7
Complete Local-First Money Manager
Personal + Business
Income + Expense
Paisa Len-Den
Savings + Goals
Budget
Bills + Payments
Loans + EMI
Transactions
Reports
Backup + Restore
Security + Settings
========================================================= */

const STORAGE_KEY = "hisab_v7_data";

const DEFAULT_DATA = {
version: 7,
mode: "personal",
currency: "₹",

transactions: [],
lendDen: [],
savings: [],
goals: [],
bills: [],
loans: [],

budgets: {
  personal: 0,
  business: 0
},

settings: {
  name: "",
  language: "English",
  currency: "₹",
  pinEnabled: false,
  pin: ""
}

};

/* =========================================================
STORAGE
========================================================= */

function clone(obj) {
return JSON.parse(JSON.stringify(obj));
}

function loadData() {
try {
const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return clone(DEFAULT_DATA);
  }

  const saved = JSON.parse(raw);

  const data = clone(DEFAULT_DATA);

  Object.assign(data, saved);

  data.settings = Object.assign(
    {},
    DEFAULT_DATA.settings,
    saved.settings || {}
  );

  data.budgets = Object.assign(
    {},
    DEFAULT_DATA.budgets,
    saved.budgets || {}
  );

  if (!Array.isArray(data.transactions)) data.transactions = [];
  if (!Array.isArray(data.lendDen)) data.lendDen = [];
  if (!Array.isArray(data.savings)) data.savings = [];
  if (!Array.isArray(data.goals)) data.goals = [];
  if (!Array.isArray(data.bills)) data.bills = [];
  if (!Array.isArray(data.loans)) data.loans = [];

  return data;

} catch (error) {
  console.error("HISAB load error:", error);
  return clone(DEFAULT_DATA);
}

}

const data = loadData();

function saveData() {
try {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(data)
);

  updateDashboard();

} catch (error) {
  console.error("HISAB save error:", error);
  alert("Data save nahi ho paya.");
}

}

/* =========================================================
GLOBAL API
========================================================= */

window.HISAB = {
data,
saveData,
updateDashboard
};

/* =========================================================
HELPERS
========================================================= */

function currency() {
return data.currency || data.settings.currency || "₹";
}

function money(amount) {
const n = Number(amount || 0);

return (
  currency() +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
);

}

function number(value) {
const n = Number(value);
return Number.isFinite(n) ? n : 0;
}

function uid(prefix = "id") {
return (
prefix +
"" +
Date.now().toString(36) +
"" +
Math.random().toString(36).slice(2, 8)
);
}

function today() {
return new Date().toISOString().slice(0, 10);
}

function now() {
return new Date().toLocaleString("en-IN");
}

function escapeHTML(value) {
return String(value ?? "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function getMode() {
return data.mode === "business"
? "business"
: "personal";
}

function modeText() {
return getMode() === "business"
? "Business"
: "Personal";
}

function modeFilter(items) {
return items.filter(
item => !item.mode || item.mode === getMode()
);
}

function overlay() {
let el = document.getElementById("hisabOverlay");

if (!el) {
  el = document.createElement("div");
  el.id = "hisabOverlay";

  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,.55)",
    zIndex: "9998",
    display: "none",
    padding: "14px",
    overflowY: "auto"
  });

  document.body.appendChild(el);
}

return el;

}

function closeModal() {
const el = overlay();
el.innerHTML = "";
el.style.display = "none";
}

function showModal(title, content, options = {}) {
const el = overlay();

el.innerHTML = `
  <div id="hisabModalBox"
    style="
      max-width:520px;
      margin:30px auto;
      background:#fff;
      border-radius:20px;
      overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,.3);
    ">

    <div style="
      padding:18px;
      background:#0b1f33;
      color:#fff;
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">
      <strong style="font-size:19px;">
        ${escapeHTML(title)}
      </strong>

      <button
        id="hisabCloseBtn"
        type="button"
        style="
          border:0;
          background:rgba(255,255,255,.15);
          color:#fff;
          width:38px;
          height:38px;
          border-radius:50%;
          font-size:20px;
        "
      >×</button>
    </div>

    <div style="padding:18px;">
      ${content}
    </div>
  </div>
`;

el.style.display = "block";

document
  .getElementById("hisabCloseBtn")
  ?.addEventListener("click", closeModal);

if (options.onOpen) options.onOpen(el);

}

function input(
label,
name,
type = "text",
required = false,
value = ""
) {
return `
<label style="display:block;margin-bottom:13px;">
<span style="
display:block;
margin-bottom:6px;
font-weight:600;
">
${escapeHTML(label)}
</span>

    <input
      name="${escapeHTML(name)}"
      type="${escapeHTML(type)}"
      value="${escapeHTML(value)}"
      ${required ? "required" : ""}
      style="
        width:100%;
        box-sizing:border-box;
        padding:12px;
        border:1px solid #d8dee5;
        border-radius:12px;
        font-size:16px;
      "
    >
  </label>
`;

}

function textarea(label, name, value = "") {
return `
<label style="display:block;margin-bottom:13px;">
<span style="
display:block;
margin-bottom:6px;
font-weight:600;
">
${escapeHTML(label)}
</span>

    <textarea
      name="${escapeHTML(name)}"
      rows="3"
      style="
        width:100%;
        box-sizing:border-box;
        padding:12px;
        border:1px solid #d8dee5;
        border-radius:12px;
        font-size:16px;
        resize:vertical;
      "
    >${escapeHTML(value)}</textarea>
  </label>
`;

}

function select(label, name, options, selected = "") {
return `
<label style="display:block;margin-bottom:13px;">
<span style="
display:block;
margin-bottom:6px;
font-weight:600;
">
${escapeHTML(label)}
</span>

    <select
      name="${escapeHTML(name)}"
      style="
        width:100%;
        box-sizing:border-box;
        padding:12px;
        border:1px solid #d8dee5;
        border-radius:12px;
        font-size:16px;
        background:#fff;
      "
    >
      ${options.map(o => `
        <option
          value="${escapeHTML(o.value)}"
          ${o.value === selected ? "selected" : ""}
        >
          ${escapeHTML(o.label)}
        </option>
      `).join("")}
    </select>
  </label>
`;

}

function primaryButton(text, id = "") {
return "<button type="submit" ${id ?"id="${id}"": ""} style=" width:100%; padding:14px; border:0; border-radius:13px; background:#0b1f33; color:#fff; font-weight:700; font-size:16px; margin-top:6px; " > ${escapeHTML(text)} </button>";
}

function secondaryButton(text, onclick = "") {
return "<button type="button" ${onclick ?"onclick="${onclick}"": ""} style=" width:100%; padding:12px; border:1px solid #d8dee5; border-radius:13px; background:#fff; color:#0b1f33; font-weight:700; font-size:15px; margin-top:8px; " > ${escapeHTML(text)} </button>";
}

function card(content, extra = "") {
return "<div style=" background:#fff; border:1px solid #e5e9ee; border-radius:16px; padding:15px; margin-bottom:12px; ${extra} "> ${content} </div>";
}

function empty(text) {
return "<div style=" text-align:center; padding:28px 12px; color:#667085; "> <div style="font-size:34px;">📭</div> <strong>${escapeHTML(text)}</strong> </div>";
}

function backButton() {
return "<button type="button" onclick="window.showHome()" style=" border:0; background:#eef2f6; border-radius:10px; padding:9px 13px; font-weight:700; " > ← Back </button>";
}

/* =========================================================
DASHBOARD
========================================================= */

function calculateTotals() {
const transactions = modeFilter(data.transactions);

let income = 0;
let expense = 0;

transactions.forEach(t => {
  if (t.type === "income") {
    income += number(t.amount);
  }

  if (t.type === "expense") {
    expense += number(t.amount);
  }
});

return {
  income,
  expense,
  balance: income - expense
};

}

function updateDashboard() {
const totals = calculateTotals();

const incomeEl =
  document.getElementById("totalIncome");

const expenseEl =
  document.getElementById("totalExpense");

const balanceEl =
  document.getElementById("totalBalance");

const currencyEl =
  document.getElementById("currencyLabel");

if (incomeEl) {
  incomeEl.textContent = money(totals.income);
}

if (expenseEl) {
  expenseEl.textContent = money(totals.expense);
}

if (balanceEl) {
  balanceEl.textContent = money(totals.balance);
}

if (currencyEl) {
  currencyEl.textContent = currency();
}

updateRecentActivity();
updateModeButtons();

}

function updateModeButtons() {
const p = document.getElementById("personalBtn");
const b = document.getElementById("businessBtn");

if (!p || !b) return;

p.classList.toggle("active", getMode() === "personal");
b.classList.toggle("active", getMode() === "business");

}

function updateRecentActivity() {
const box =
document.getElementById("recentActivity");

if (!box) return;

const list = modeFilter(data.transactions)
  .slice()
  .sort((a, b) => {
    return Number(b.createdAt || 0) -
           Number(a.createdAt || 0);
  })
  .slice(0, 5);

if (!list.length) {
  box.innerHTML = `
    <div class="empty-state">
      <div>💰</div>
      <strong>No transactions yet</strong>
      <p>Add your m
