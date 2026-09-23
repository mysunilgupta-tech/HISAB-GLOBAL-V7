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
      <p>Add your first income or expense.</p>
    </div>
  `;
  return;
}

box.innerHTML = list.map(t => {
  const income = t.type === "income";

  return `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:12px;
      border-bottom:1px solid #edf0f3;
    ">

      <div>
        <strong>${escapeHTML(t.title || t.category || "Transaction")}</strong>
        <small style="
          display:block;
          color:#777;
          margin-top:3px;
        ">
          ${escapeHTML(t.date || today())}
        </small>
      </div>

      <strong style="
        color:${income ? "#138a55" : "#d64545"};
      ">
        ${income ? "+" : "-"}${money(t.amount)}
      </strong>

    </div>
  `;
}).join("");

}

/* =========================================================
HOME
========================================================= */

function showHome() {
document
.querySelectorAll(".screen")
.forEach(s => {
s.style.display = "none";
});

const home =
  document.getElementById("homeScreen");

if (home) {
  home.style.display = "block";
}

updateDashboard();

}

window.showHome = showHome;

/* =========================================================
INCOME
========================================================= */

function showIncome(editId = null) {
const existing = editId
? data.transactions.find(t => t.id === editId)
: null;

showModal(
  existing ? "Edit Income" : "Add Income",

  `<form id="incomeForm">

    ${input(
      "Income Title",
      "title",
      "text",
      true,
      existing?.title || ""
    )}

    ${input(
      "Amount",
      "amount",
      "number",
      true,
      existing?.amount || ""
    )}

    ${input(
      "Date",
      "date",
      "date",
      true,
      existing?.date || today()
    )}

    ${input(
      "Category",
      "category",
      "text",
      false,
      existing?.category || ""
    )}

    ${textarea(
      "Note",
      "note",
      existing?.note || ""
    )}

    ${primaryButton(
      existing ? "Update Income" : "Save Income"
    )}

  </form>`,

  {
    onOpen() {
      document
        .getElementById("incomeForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("income"),
            type: "income",
            title: fd.get("title"),
            amount: number(fd.get("amount")),
            date: fd.get("date"),
            category: fd.get("category"),
            note: fd.get("note"),
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (item.amount <= 0) {
            alert("Amount sahi enter karo.");
            return;
          }

          if (existing) {
            const index =
              data.transactions.findIndex(
                t => t.id === existing.id
              );

            if (index >= 0) {
              data.transactions[index] = item;
            }

          } else {
            data.transactions.push(item);
          }

          saveData();
          closeModal();

          alert(
            existing
              ? "Income update ho gaya."
              : "Income save ho gaya."
          );
        });
    }
  }
);

}

window.showIncome = showIncome;

/* =========================================================
EXPENSE
========================================================= */

function showExpense(editId = null) {
const existing = editId
? data.transactions.find(t => t.id === editId)
: null;

showModal(
  existing ? "Edit Expense" : "Add Expense",

  `<form id="expenseForm">

    ${input(
      "Expense Title",
      "title",
      "text",
      true,
      existing?.title || ""
    )}

    ${input(
      "Amount",
      "amount",
      "number",
      true,
      existing?.amount || ""
    )}

    ${input(
      "Date",
      "date",
      "date",
      true,
      existing?.date || today()
    )}

    ${input(
      "Category",
      "category",
      "text",
      false,
      existing?.category || ""
    )}

    ${textarea(
      "Note",
      "note",
      existing?.note || ""
    )}

    ${primaryButton(
      existing ? "Update Expense" : "Save Expense"
    )}

  </form>`,

  {
    onOpen() {

      document
        .getElementById("expenseForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("expense"),
            type: "expense",
            title: fd.get("title"),
            amount: number(fd.get("amount")),
            date: fd.get("date"),
            category: fd.get("category"),
            note: fd.get("note"),
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (item.amount <= 0) {
            alert("Amount sahi enter karo.");
            return;
          }

          if (existing) {

            const index =
              data.transactions.findIndex(
                t => t.id === existing.id
              );

            if (index >= 0) {
              data.transactions[index] = item;
            }

          } else {

            data.transactions.push(item);

          }

          saveData();
          closeModal();

          alert(
            existing
              ? "Expense update ho gaya."
              : "Expense save ho gaya."
          );
        });
    }
  }
);

}

window.showExpense = showExpense;

/* =========================================================
PAISA LEN-DEN
IMPORTANT:
SAME PERSON'S GIVEN + RECEIVED STAY TOGETHER.

 person balance:
 Given = amount user gave
 Received = amount user received
 Net = Given - Received
 
 Net positive = person se lena hai
 Net negative = person ko dena hai
 ========================================================= */

function getPersonLedger(person) {
return modeFilter(data.lendDen)
.filter(
x =>
String(x.person).trim().toLowerCase() ===
String(person).trim().toLowerCase()
);
}

function personTotals(person) {
const list = getPersonLedger(person);

let given = 0;
let received = 0;

list.forEach(x => {
  if (x.type === "given") {
    given += number(x.amount);
  }

  if (x.type === "received") {
    received += number(x.amount);
  }
});

return {
  given,
  received,
  net: given - received
};

}

function allPersonSummary() {
const map = {};

modeFilter(data.lendDen).forEach(item => {

  const key =
    String(item.person || "").trim();

  if (!key) return;

  if (!map[key]) {
    map[key] = {
      person: key,
      given: 0,
      received: 0
    };
  }

  if (item.type === "given") {
    map[key].given += number(item.amount);
  }

  if (item.type === "received") {
    map[key].received += number(item.amount);
  }

});

return Object.values(map).map(x => ({
  ...x,
  net: x.given - x.received
}));

}

function showLendDen() {

const summary = allPersonSummary();

const totalGiven =
  summary.reduce((s, x) => s + x.given, 0);

const totalReceived =
  summary.reduce((s, x) => s + x.received, 0);

const net = totalGiven - totalReceived;

showModal(
  "Paisa Len-Den",

  `

  <div style="
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:8px;
    margin-bottom:15px;
  ">

    <div style="
      background:#fff3f3;
      padding:12px;
      border-radius:12px;
      text-align:center;
    ">
      <small>Total Diya</small>
      <strong style="display:block;color:#d64545;">
        ${money(totalGiven)}
      </strong>
    </div>

    <div style="
      background:#effaf4;
      padding:12px;
      border-radius:12px;
      text-align:center;
    ">
      <small>Total Liya</small>
      <strong style="display:block;color:#138a55;">
        ${money(totalReceived)}
      </strong>
    </div>

    <div style="
      background:#eef5ff;
      padding:12px;
      border-radius:12px;
      text-align:center;
    ">
      <small>Net</small>
      <strong style="display:block;">
        ${money(Math.abs(net))}
      </strong>
    </div>

  </div>

  <button
    type="button"
    id="addLendDenBtn"
    style="
      width:100%;
      padding:14px;
      border:0;
      border-radius:13px;
      background:#0b1f33;
      color:#fff;
      font-weight:700;
      font-size:16px;
      margin-bottom:14px;
    "
  >
    + Add Len-Den
  </button>

  ${summary.length
    ? summary.map(x => {

        let status = "Settled";
        let statusColor = "#667085";

        if (x.net > 0) {
          status = "Lena Hai";
          statusColor = "#d64545";
        }

        if (x.net < 0) {
          status = "Dena Hai";
          statusColor = "#138a55";
        }

        return `
          <div
            style="
              border:1px solid #e5e9ee;
              border-radius:15px;
              padding:14px;
              margin-bottom:10px;
              cursor:pointer;
            "
            data-person="${escapeHTML(x.person)}"
            class="lend-person-card"
          >

            <div style="
              display:flex;
              justify-content:space-between;
            ">
              <strong>
                ${escapeHTML(x.person)}
              </strong>

              <span style="
                color:${statusColor};
                font-weight:700;
              ">
                ${status}
              </span>
            </div>

            <div style="
              display:grid;
              grid-template-columns:1fr 1fr 1fr;
              gap:7px;
              margin-top:10px;
              font-size:13px;
            ">

              <div>
                <small>Diya</small>
                <strong style="
                  display:block;
                  color:#d64545;
                ">
                  ${money(x.given)}
                </strong>
              </div>

              <div>
                <small>Liya</small>
                <strong style="
                  display:block;
                  color:#138a55;
                ">
                  ${money(x.received)}
                </strong>
              </div>

              <div>
                <small>Net</small>
                <strong style="display:block;">
                  ${money(Math.abs(x.net))}
                </strong>
              </div>

            </div>

          </div>
        `;

      }).join("")
    : empty("Abhi koi Len-Den record nahi hai.")
  }

  `,

  {
    onOpen() {

      document
        .getElementById("addLendDenBtn")
        ?.addEventListener(
          "click",
          () => showAddLendDen()
        );

      document
        .querySelectorAll(".lend-person-card")
        .forEach(card => {

          card.addEventListener("click", () => {

            showPersonLedger(
              card.dataset.person
            );

          });

        });
    }
  }
);

}

window.showLendDen = showLendDen;

function showAddLendDen(existingId = null) {

const existing = existingId
  ? data.lendDen.find(x => x.id === existingId)
  : null;

showModal(
  existing
    ? "Edit Len-Den"
    : "Add Paisa Len-Den",

  `<form id="lendForm">

    ${input(
      "Person Name",
      "person",
      "text",
      true,
      existing?.person || ""
    )}

    ${select(
      "Type",
      "type",
      [
        {
          value: "given",
          label: "🔴 Given — Maine Paisa Diya"
        },
        {
          value: "received",
          label: "🟢 Received — Maine Paisa Liya"
        }
      ],
      existing?.type || "given"
    )}

    ${input(
      "Amount",
      "amount",
      "number",
      true,
      existing?.amount || ""
    )}

    ${input(
      "Date",
      "date",
      "date",
      true,
      existing?.date || today()
    )}

    ${input(
      "Time",
      "time",
      "time",
      false,
      existing?.time || ""
    )}

    ${textarea(
      "Note",
      "note",
      existing?.note || ""
    )}

    ${primaryButton(
      existing ? "Update Record" : "Save Record"
    )}

  </form>`,

  {
    onOpen() {

      document
        .getElementById("lendForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("lend"),
            person: String(
              fd.get("person") || ""
            ).trim(),
            type: fd.get("type"),
            amount: number(fd.get("amount")),
            date: fd.get("date"),
            time:
              fd.get("time") ||
              new Date().toTimeString().slice(0, 5),
            note: fd.get("note"),
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (!item.person) {
            alert("Person name enter karo.");
            return;
          }

          if (item.amount <= 0) {
            alert("Amount sahi enter karo.");
            return;
          }

          if (existing) {

            const index =
              data.lendDen.findIndex(
                x => x.id === existing.id
              );

            if (index >= 0) {
              data.lendDen[index] = item;
            }

          } else {

            data.lendDen.push(item);

          }

          saveData();
          showLendDen();

        });
    }
  }
);

}

function showPersonLedger(person) {

const list =
  getPersonLedger(person)
    .slice()
    .sort(
      (a, b) =>
        Number(b.createdAt || 0) -
        Number(a.createdAt || 0)
    );

const totals = personTotals(person);

showModal(
  person,

  `

  <div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-bottom:12px;
  ">

    <div style="
      background:#fff3f3;
      border-radius:12px;
      padding:12px;
    ">
      <small>Total Diya</small>
      <strong style="
        display:block;
        color:#d64545;
      ">
        ${money(totals.given)}
      </strong>
    </div>

    <div style="
      background:#effaf4;
      border-radius:12px;
      padding:12px;
    ">
      <small>Total Liya</small>
      <strong style="
        display:block;
        color:#138a55;
      ">
        ${money(totals.received)}
      </strong>
    </div>

  </div>

  <div style="
    background:#eef5ff;
    padding:13px;
    border-radius:12px;
    margin-bottom:15px;
  ">
    <strong>
      Net Balance:
      ${money(Math.abs(totals.net))}
    </strong>

    <div style="
      margin-top:4px;
      font-size:13px;
      color:#667085;
    ">
      ${
        totals.net > 0
          ? "Is person se paisa lena hai."
          : totals.net < 0
          ? "Is person ko paisa dena hai."
          : "Hisab barabar hai."
      }
    </div>
  </div>

  ${list.length
    ? list.map(item => {

        const given =
          item.type === "given";

        return `
          <div style="
            border:1px solid #e5e9ee;
            border-radius:14px;
            padding:13px;
            margin-bottom:9px;
            background:${given ? "#fffafa" : "#f9fffb"};
          ">

            <div style="
              display:flex;
              justify-content:space-between;
              align-items:center;
            ">

              <strong style="
                color:${given ? "#d64545" : "#138a55"};
              ">
                ${given ? "🔴 GIVEN" : "🟢 RECEIVED"}
              </strong>

              <strong style="
                color:${given ? "#d64545" : "#138a55"};
              ">
                ${money(item.amount)}
              </strong>

            </div>

            <small style="
              display:block;
              margin-top:6px;
              color:#667085;
            ">
              ${escapeHTML(item.date || "")}
              ${escapeHTML(item.time || "")}
            </small>

            ${
              item.note
                ? `<div style="
                    margin-top:7px;
                    color:#555;
                  ">
                    ${escapeHTML(item.note)}
                  </div>`
                : ""
            }

            <div style="
              display:flex;
              gap:7px;
              margin-top:10px;
            ">

              <button
                type="button"
                data-edit-lend="${item.id}"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                  background:#eef2f6;
                "
              >
                Edit
              </button>

              <button
                type="button"
                data-delete-lend="${item.id}"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                  background:#fff0f0;
                  color:#c62828;
                "
              >
                Delete
              </button>

            </div>

          </div>
        `;

      }).join("")
    : empty("Is person ka koi record nahi hai.")
  }

  ${secondaryButton(
    "Add New Len-Den",
    "window.showAddLendDen()"
  )}

  `,

  {
    onOpen() {

      document
        .querySelectorAll("[data-edit-lend]")
        .forEach(btn => {

          btn.addEventListener("click", () => {

            showAddLendDen(
              btn.dataset.editLend
            );

          });

        });

      document
        .querySelectorAll("[data-delete-lend]")
        .forEach(btn => {

          btn.addEventListener("click", () => {

            if (!confirm(
              "Kya ye record delete karna hai?"
            )) return;

            data.lendDen =
              data.lendDen.filter(
                x => x.id !== btn.dataset.deleteLend
              );

            saveData();

            showPersonLedger(person);

          });

        });
    }
  }
);

}

window.showAddLendDen = showAddLendDen;

/* =========================================================
SAVINGS
========================================================= */

function showSavings() {

const list = modeFilter(data.savings);

const total = list.reduce(
  (s, x) => s + number(x.amount),
  0
);

showModal(
  "Savings",

  `
  <div style="
    background:#effaf4;
    border-radius:14px;
    padding:15px;
    margin-bottom:14px;
  ">
    <small>Total Savings</small>
    <strong style="
      display:block;
      font-size:24px;
      color:#138a55;
    ">
      ${money(total)}
    </strong>
  </div>

  <button
    type="button"
    id="addSavingsBtn"
    style="
      width:100%;
      padding:13px;
      border:0;
      border-radius:12px;
      background:#0b1f33;
      color:#fff;
      font-weight:700;
      margin-bottom:13px;
    "
  >
    + Add Savings
  </button>

  ${
    list.length
      ? list.map(x => `
          ${card(`
            <div style="
              display:flex;
              justify-content:space-between;
            ">
              <div>
                <strong>
                  ${escapeHTML(x.title)}
                </strong>
                <small style="
                  display:block;
                  color:#777;
                  margin-top:4px;
                ">
                  ${escapeHTML(x.date)}
                </small>
              </div>

              <strong style="color:#138a55;">
                ${money(x.amount)}
              </strong>
            </div>

            <div style="
              display:flex;
              gap:7px;
              margin-top:10px;
            ">

              <button
                type="button"
                onclick="window.editSavings('${x.id}')"
                style="
                  flex:1;
                  padding:8px;
                  border:0;
                  border-radius:8px;
                "
              >
                Edit
              </button>

              <button
                type="button"
                onclick="window.deleteSavings('${x.id}')"
                style="
                  flex:1;
                  padding:8px;
                  border:0;
                  border-radius:8px;
                  color:#c62828;
                "
              >
                Delete
              </button>

            </div>
          `)}
        `).join("")
      : empty("Abhi savings nahi hai.")
  }

  `,

  {
    onOpen() {

      document
        .getElementById("addSavingsBtn")
        ?.addEventListener(
          "click",
          () => showSavingsForm()
        );

    }
  }
);

}

function showSavingsForm(editId = null) {

const existing = editId
  ? data.savings.find(x => x.id === editId)
  : null;

showModal(
  existing ? "Edit Savings" : "Add Savings",

  `<form id="savingsForm">

    ${input(
      "Title",
      "title",
      "text",
      true,
      existing?.title || ""
    )}

    ${input(
      "Amount",
      "amount",
      "number",
      true,
      existing?.amount || ""
    )}

    ${input(
      "Date",
      "date",
      "date",
      true,
      existing?.date || today()
    )}

    ${textarea(
      "Note",
      "note",
      existing?.note || ""
    )}

    ${primaryButton(
      existing ? "Update Savings" : "Save Savings"
    )}

  </form>`,

  {
    onOpen() {

      document
        .getElementById("savingsForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("saving"),
            title: fd.get("title"),
            amount: number(fd.get("amount")),
            date: fd.get("date"),
            note: fd.get("note"),
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (item.amount <= 0) {
            alert("Amount sahi enter karo.");
            return;
          }

          if (existing) {

            const i =
              data.savings.findIndex(
                x => x.id === existing.id
              );

            if (i >= 0) {
              data.savings[i] = item;
            }

          } else {

            data.savings.push(item);

          }

          saveData();
          showSavings();

        });

    }
  }
);

}

window.showSavings = showSavings;

window.editSavings = id =>
showSavingsForm(id);

window.deleteSavings = id => {

if (!confirm("Savings delete karni hai?")) return;

data.savings =
  data.savings.filter(x => x.id !== id);

saveData();
showSavings();

};

/* =========================================================
BUDGET
========================================================= */

function showBudget() {

const current =
  number(data.budgets[getMode()]);

const totals = calculateTotals();

const remaining =
  current - totals.expense;

showModal(
  "Budget",

  `
  <div style="
    background:#eef5ff;
    border-radius:15px;
    padding:16px;
    margin-bottom:14px;
  ">

    <small>${modeText()} Monthly Budget</small>

    <strong style="
      display:block;
      font-size:25px;
      margin-top:4px;
    ">
      ${money(current)}
    </strong>

    <div style="
      margin-top:8px;
      color:${remaining >= 0 ? "#138a55" : "#d64545"};
    ">
      ${remaining >= 0
        ? money(remaining) + " remaining"
        : money(Math.abs(remaining)) + " over budget"
      }
    </div>

  </div>

  <form id="budgetForm">

    ${input(
      "Monthly Budget",
      "budget",
      "number",
      true,
      current
    )}

    ${primaryButton("Save Budget")}

  </form>
  `,

  {
    onOpen() {

      document
        .getElementById("budgetForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const value =
            number(fd.get("budget"));

          if (value < 0) {
            alert("Budget sahi enter karo.");
            return;
          }

          data.budgets[getMode()] = value;

          saveData();
          closeModal();

          alert("Budget save ho gaya.");

        });

    }
  }
);

}

window.showBudget = showBudget;

/* =========================================================
GOALS
========================================================= */

function showGoals() {

const list = modeFilter(data.goals);

showModal(
  "Goals & Savings",

  `
  <button
    type="button"
    id="addGoalBtn"
    style="
      width:100%;
      padding:13px;
      border:0;
      border-radius:12px;
      background:#0b1f33;
      color:#fff;
      font-weight:700;
      margin-bottom:14px;
    "
  >
    + Add Goal
  </button>

  ${
    list.length
      ? list.map(g => {

          const target = number(g.target);
          const saved = number(g.saved);

          const percent =
            target > 0
              ? Math.min(
                  100,
                  Math.round(saved / target * 100)
                )
              : 0;

          return card(`

            <div style="
              display:flex;
              justify-content:space-between;
            ">
              <strong>
                🎯 ${escapeHTML(g.title)}
              </strong>

              <strong>
                ${percent}%
              </strong>
            </div>

            <div style="
              height:9px;
              background:#e9edf2;
              border-radius:20px;
              margin:10px 0;
              overflow:hidden;
            ">
              <div style="
                width:${percent}%;
                height:100%;
                background:#138a55;
              "></div>
            </div>

            <div style="
              font-size:13px;
              color:#667085;
            ">
              ${money(saved)} / ${money(target)}
            </div>

            <div style="
              display:flex;
              gap:7px;
              margin-top:10px;
            ">

              <button
                type="button"
                onclick="window.addGoalMoney('${g.id}')"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                  background:#effaf4;
                "
              >
                + Add Money
              </button>

              <button
                type="button"
                onclick="window.editGoal('${g.id}')"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                "
              >
                Edit
              </button>

              <button
                type="button"
                onclick="window.deleteGoal('${g.id}')"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                  color:#c62828;
                "
              >
                Delete
              </button>

            </div>

          `);

        }).join("")
      : empty("Abhi koi goal nahi hai.")
  }
  `,

  {
    onOpen() {

      document
        .getElementById("addGoalBtn")
        ?.addEventListener(
          "click",
          () => showGoalForm()
        );

    }
  }
);

}

function showGoalForm(editId = null) {

const existing = editId
  ? data.goals.find(x => x.id === editId)
  : null;

showModal(
  existing ? "Edit Goal" : "Add Goal",

  `<form id="goalForm">

    ${input(
      "Goal Name",
      "title",
      "text",
      true,
      existing?.title || ""
    )}

    ${input(
      "Target Amount",
      "target",
      "number",
      true,
      existing?.target || ""
    )}

    ${input(
      "Already Saved",
      "saved",
      "number",
      false,
      existing?.saved || 0
    )}

    ${input(
      "Target Date",
      "date",
      "date",
      false,
      existing?.date || ""
    )}

    ${primaryButton(
      existing ? "Update Goal" : "Save Goal"
    )}

  </form>`,

  {
    onOpen() {

      document
        .getElementById("goalForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("goal"),
            title: fd.get("title"),
            target: number(fd.get("target")),
            saved: number(fd.get("saved")),
            date: fd.get("date"),
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (
            !item.title ||
            item.target <= 0
          ) {
            alert("Goal details sahi enter karo.");
            return;
          }

          if (existing) {

            const i =
              data.goals.findIndex(
                x => x.id === existing.id
              );

            if (i >= 0) {
              data.goals[i] = item;
            }

          } else {

            data.goals.push(item);

          }

          saveData();
          showGoals();

        });

    }
  }
);

}

window.showGoals = showGoals;

window.editGoal = id =>
showGoalForm(id);

window.deleteGoal = id => {

if (!confirm("Goal delete karna hai?")) return;

data.goals =
  data.goals.filter(x => x.id !== id);

saveData();
showGoals();

};

window.addGoalMoney = id => {

const goal =
  data.goals.find(x => x.id === id);

if (!goal) return;

const amount =
  prompt("Kitna paisa add karna hai?");

if (amount === null) return;

const value = number(amount);

if (value <= 0) {
  alert("Amount sahi enter karo.");
  return;
}

goal.saved =
  number(goal.saved) + value;

saveData();
showGoals();

};

/* =========================================================
BILLS
========================================================= */

function showBills() {

const list = modeFilter(data.bills);

showModal(
  "Bills & Payments",

  `
  <button
    type="button"
    id="addBillBtn"
    style="
      width:100%;
      padding:13px;
      border:0;
      border-radius:12px;
      background:#0b1f33;
      color:#fff;
      font-weight:700;
      margin-bottom:14px;
    "
  >
    + Add Bill
  </button>

  ${
    list.length
      ? list.map(b => {

          const overdue =
            !b.paid &&
            b.dueDate &&
            b.dueDate < today();

          return card(`

            <div style="
              display:flex;
              justify-content:space-between;
            ">

              <strong>
                🧾 ${escapeHTML(b.title)}
              </strong>

              <strong>
                ${money(b.amount)}
              </strong>

            </div>

            <small style="
              display:block;
              margin-top:7px;
              color:${overdue ? "#d64545" : "#667085"};
            ">
              Due: ${escapeHTML(b.dueDate || "-")}
            </small>

            <div style="
              margin-top:8px;
              font-weight:700;
              color:${b.paid ? "#138a55" : overdue ? "#d64545" : "#b7791f"};
            ">
              ${b.paid ? "✓ Paid" : overdue ? "⚠ Overdue" : "Pending"}
            </div>

            <div style="
              display:flex;
              gap:7px;
              margin-top:10px;
            ">

              ${
                !b.paid
                  ? `
                    <button
                      type="button"
                      onclick="window.markBillPaid('${b.id}')"
                      style="
                        flex:1;
                        padding:9px;
                        border:0;
                        border-radius:9px;
                        background:#effaf4;
                      "
                    >
                      Mark Paid
                    </button>
                  `
                  : ""
              }

              <button
                type="button"
                onclick="window.editBill('${b.id}')"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                "
              >
                Edit
              </button>

              <button
                type="button"
                onclick="window.deleteBill('${b.id}')"
                style="
                  flex:1;
                  padding:9px;
                  border:0;
                  border-radius:9px;
                  color:#c62828;
                "
              >
                Delete
              </button>

            </div>

          `);

        }).join("")
      : empty("Abhi koi bill nahi hai.")
  }
  `,

  {
    onOpen() {

      document
        .getElementById("addBillBtn")
        ?.addEventListener(
          "click",
          () => showBillForm()
        );

    }
  }
);

}

function showBillForm(editId = null) {

const existing = editId
  ? data.bills.find(x => x.id === editId)
  : null;

showModal(
  existing ? "Edit Bill" : "Add Bill",

  `<form id="billForm">

    ${input(
      "Bill Name",
      "title",
      "text",
      true,
      existing?.title || ""
    )}

    ${input(
      "Amount",
      "amount",
      "number",
      true,
      existing?.amount || ""
    )}

    ${input(
      "Due Date",
      "dueDate",
      "date",
      true,
      existing?.dueDate || today()
    )}

    ${input(
      "Category",
      "category",
      "text",
      false,
      existing?.category || ""
    )}

    ${textarea(
      "Note",
      "note",
      existing?.note || ""
    )}

    ${primaryButton(
      existing ? "Update Bill" : "Save Bill"
    )}

  </form>`,

  {
    onOpen() {

      document
        .getElementById("billForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("bill"),
            title: fd.get("title"),
            amount: number(fd.get("amount")),
            dueDate: fd.get("dueDate"),
            category: fd.get("category"),
            note: fd.get("note"),
            paid: existing?.paid || false,
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (
            !item.title ||
            item.amount <= 0
          ) {
            alert("Bill details sahi enter karo.");
            return;
          }

          if (existing) {

            const i =
              data.bills.findIndex(
                x => x.id === existing.id
              );

            if (i >= 0) {
              data.bills[i] = item;
            }

          } else {

            data.bills.push(item);

          }

          saveData();
          showBills();

        });

    }
  }
);

}

window.showBills = showBills;

window.editBill = id =>
showBillForm(id);

window.deleteBill = id => {

if (!confirm("Bill delete karna hai?")) return;

data.bills =
  data.bills.filter(x => x.id !== id);

saveData();
showBills();

};

window.markBillPaid = id => {

const bill =
  data.bills.find(x => x.id === id);

if (!bill) return;

bill.paid = true;
bill.paidDate = today();

saveData();
showBills();

};

/* =========================================================
LOANS & EMI
========================================================= */

function showLoans() {

const list = modeFilter(data.loans);

showModal(
  "Loans & EMI",

  `
  <button
    type="button"
    id="addLoanBtn"
    style="
      width:100%;
      padding:13px;
      border:0;
      border-radius:12px;
      background:#0b1f33;
      color:#fff;
      font-weight:700;
      margin-bottom:14px;
    "
  >
    + Add Loan / EMI
  </button>

  ${
    list.length
      ? list.map(l => card(`

          <div style="
            display:flex;
            justify-content:space-between;
          ">
            <strong>
              🏠 ${escapeHTML(l.name)}
            </strong>

            <strong>
              ${money(l.emi)}
            </strong>
          </div>

          <div style="
            margin-top:7px;
            font-size:13px;
            color:#667085;
          ">
            ${
              escapeHTML(l.company || "Finance")
            }
          </div>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:8px;
            margin-top:10px;
          ">

            <div>
              <small>Loan Amount</small>
              <strong style="display:block;">
                ${money(l.amount)}
              </strong>
            </div>

            <div>
              <small>EMI</small>
              <strong style="display:block;">
                ${money(l.emi)}
              </strong>
            </div>

            <div>
              <small>Due Date</small>
              <strong style="display:block;">
                ${escapeHTML(l.dueDate || "-")}
              </strong>
            </div>

            <div>
              <small>Status</small>
              <strong style="
                display:block;
                color:${l.paid ? "#138a55" : "#b7791f"};
              ">
                ${l.paid ? "Paid" : "Pending"}
              </strong>
            </div>

          </div>

          <div style="
            display:flex;
            gap:7px;
            margin-top:10px;
          ">

            ${
              !l.paid
                ? `
                  <button
                    type="button"
                    onclick="window.markLoanPaid('${l.id}')"
                    style="
                      flex:1;
                      padding:9px;
                      border:0;
                      border-radius:9px;
                      background:#effaf4;
                    "
                  >
                    Mark EMI Paid
                  </button>
                `
                : ""
            }

            <button
              type="button"
              onclick="window.editLoan('${l.id}')"
              style="
                flex:1;
                padding:9px;
                border:0;
                border-radius:9px;
              "
            >
              Edit
            </button>

            <button
              type="button"
              onclick="window.deleteLoan('${l.id}')"
              style="
                flex:1;
                padding:9px;
                border:0;
                border-radius:9px;
                color:#c62828;
              "
            >
              Delete
            </button>

          </div>

        `).join("")
      : empty("Abhi koi loan/EMI nahi hai.")
  }
  `,

  {
    onOpen() {

      document
        .getElementById("addLoanBtn")
        ?.addEventListener(
          "click",
          () => showLoanForm()
        );

    }
  }
);

}

function showLoanForm(editId = null) {

const existing = editId
  ? data.loans.find(x => x.id === editId)
  : null;

showModal(
  existing ? "Edit Loan / EMI" : "Add Loan / EMI",

  `<form id="loanForm">

    ${input(
      "Loan Name",
      "name",
      "text",
      true,
      existing?.name || ""
    )}

    ${input(
      "Bank / Finance Company",
      "company",
      "text",
      false,
      existing?.company || ""
    )}

    ${input(
      "Loan Amount",
      "amount",
      "number",
      true,
      existing?.amount || ""
    )}

    ${input(
      "Monthly EMI",
      "emi",
      "number",
      true,
      existing?.emi || ""
    )}

    ${input(
      "EMI Due Date",
      "dueDate",
      "date",
      true,
      existing?.dueDate || today()
    )}

    ${input(
      "Tenure",
      "tenure",
      "number",
      false,
      existing?.tenure || ""
    )}

    ${primaryButton(
      existing ? "Update Loan" : "Save Loan"
    )}

  </form>`,

  {
    onOpen() {

      document
        .getElementById("loanForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd = new FormData(e.target);

          const item = {
            id: existing?.id || uid("loan"),
            name: fd.get("name"),
            company: fd.get("company"),
            amount: number(fd.get("amount")),
            emi: number(fd.get("emi")),
            dueDate: fd.get("dueDate"),
            tenure: number(fd.get("tenure")),
            paid: existing?.paid || false,
            mode: getMode(),
            createdAt:
              existing?.createdAt || Date.now()
          };

          if (
            !item.name ||
            item.amount <= 0 ||
            item.emi <= 0
          ) {
            alert("Loan details sahi enter karo.");
            return;
          }

          if (existing) {

            const i =
              data.loans.findIndex(
                x => x.id === existing.id
              );

            if (i >= 0) {
              data.loans[i] = item;
            }

          } else {

            data.loans.push(item);

          }

          saveData();
          showLoans();

        });

    }
  }
);

}

window.showLoans = showLoans;

window.editLoan = id =>
showLoanForm(id);

window.deleteLoan = id => {

if (!confirm("Loan delete karna hai?")) return;

data.loans =
  data.loans.filter(x => x.id !== id);

saveData();
showLoans();

};

window.markLoanPaid = id => {

const loan =
  data.loans.find(x => x.id === id);

if (!loan) return;

loan.paid = true;
loan.paidDate = today();

saveData();
showLoans();

};

/* =========================================================
TRANSACTIONS
========================================================= */

function showTransactions() {

let list = modeFilter(data.transactions)
  .slice()
  .sort(
    (a, b) =>
      Number(b.createdAt || 0) -
      Number(a.createdAt || 0)
  );

showModal(
  "Transactions",

  `
  <div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-bottom:12px;
  ">

    <button
      type="button"
      id="transactionIncomeBtn"
      style="
        padding:11px;
        border:0;
        border-radius:10px;
        background:#effaf4;
        color:#138a55;
        font-weight:700;
      "
    >
      + Income
    </button>

    <button
      type="button"
      id="transactionExpenseBtn"
      style="
        padding:11px;
        border:0;
        border-radius:10px;
        background:#fff3f3;
        color:#d64545;
        font-weight:700;
      "
    >
      - Expense
    </button>

  </div>

  <input
    id="transactionSearch"
    placeholder="Search transactions..."
    style="
      width:100%;
      box-sizing:border-box;
      padding:12px;
      border:1px solid #d8dee5;
      border-radius:11px;
      margin-bottom:12px;
    "
  >

  <div id="transactionList"></div>
  `,

  {
    onOpen() {

      const render = search => {

        const q =
          String(search || "")
            .trim()
            .toLowerCase();

        const filtered =
          list.filter(t => {

            if (!q) return true;

            return (
              String(t.title || "")
                .toLowerCase()
                .includes(q) ||

              String(t.category || "")
                .toLowerCase()
                .includes(q) ||

              String(t.note || "")
                .toLowerCase()
                .includes(q)
            );

          });

        const box =
          document.getElementById(
            "transactionList"
          );

        if (!box) return;

        if (!filtered.length) {
          box.innerHTML =
            empty("Koi transaction nahi mila.");
          return;
        }

        box.innerHTML =
          filtered.map(t => {

            const income =
              t.type === "income";

            return card(`

              <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
              ">

                <div>
                  <strong>
                    ${escapeHTML(
                      t.title ||
                      t.category ||
                      "Transaction"
                    )}
                  </strong>

                  <small style="
                    display:block;
                    margin-top:4px;
                    color:#667085;
                  ">
                    ${escapeHTML(t.date || "")}
                  </small>

                </div>

                <strong style="
                  color:${income ? "#138a55" : "#d64545"};
                ">
                  ${income ? "+" : "-"}
                  ${money(t.amount)}
                </strong>

              </div>

              ${
                t.note
                  ? `<div style="
                      margin-top:8px;
                      font-size:13px;
                      color:#667085;
                    ">
                      ${escapeHTML(t.note)}
                    </div>`
                  : ""
              }

              <div style="
                display:flex;
                gap:7px;
                margin-top:10px;
              ">

                <button
                  type="button"
                  onclick="${
                    income
                      ? `window.showIncome('${t.id}')`
                      : `window.showExpense('${t.id}')`
                  }"
                  style="
                    flex:1;
                    padding:8px;
                    border:0;
                    border-radius:8px;
                  "
                >
                  Edit
                </button>

                <button
                  type="button"
                  onclick="window.deleteTransaction('${t.id}')"
                  style="
                    flex:1;
                    padding:8px;
                    border:0;
                    border-radius:8px;
                    color:#c62828;
                  "
                >
                  Delete
                </button>

              </div>

            `);

          }).join("");

      };

      render("");

      document
        .getElementById("transactionSearch")
        ?.addEventListener(
          "input",
          e => render(e.target.value)
        );

      document
        .getElementById("transactionIncomeBtn")
        ?.addEventListener(
          "click",
          () => showIncome()
        );

      document
        .getElementById("transactionExpenseBtn")
        ?.addEventListener(
          "click",
          () => showExpense()
        );

    }
  }
);

}

window.showTransactions = showTransactions;

window.deleteTransaction = id => {

if (!confirm("Transaction delete karna hai?")) {
  return;
}

data.transactions =
  data.transactions.filter(
    x => x.id !== id
  );

saveData();
showTransactions();

};

/* =========================================================
REPORTS
========================================================= */

function showReports() {

const totals = calculateTotals();

const transactions =
  modeFilter(data.transactions);

const incomeCategories = {};
const expenseCategories = {};

transactions.forEach(t => {

  const category =
    t.category || "Other";

  if (t.type === "income") {

    incomeCategories[category] =
      (incomeCategories[category] || 0) +
      number(t.amount);

  }

  if (t.type === "expense") {

    expenseCategories[category] =
      (expenseCategories[category] || 0) +
      number(t.amount);

  }

});

const sortedExpenses =
  Object.entries(expenseCategories)
    .sort((a, b) => b[1] - a[1]);

showModal(
  "Reports & Analytics",

  `

  <div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
  ">

    ${card(`
      <small>Total Income</small>
      <strong style="
        display:block;
        color:#138a55;
        font-size:20px;
      ">
        ${money(totals.income)}
      </strong>
    `)}

    ${card(`
      <small>Total Expense</small>
      <strong style="
        display:block;
        color:#d64545;
        font-size:20px;
      ">
        ${money(totals.expense)}
      </strong>
    `)}

  </div>

  ${card(`
    <small>Current Balance</small>
    <strong style="
      display:block;
      font-size:25px;
      margin-top:4px;
    ">
      ${money(totals.balance)}
    </strong>
  `)}

  ${card(`
    <strong>Income Categories</strong>

    ${
      Object.keys(incomeCategories).length
        ? Object.entries(incomeCategories)
            .sort((a,b) => b[1] - a[1])
            .map(([k,v]) => `
              <div style="
                display:flex;
                justify-content:space-between;
                padding:9px 0;
                border-bottom:1px solid #edf0f3;
              ">
                <span>${escapeHTML(k)}</span>
                <strong style="color:#138a55;">
                  ${money(v)}
                </strong>
              </div>
            `).join("")
        : `<p style="color:#667085;">No income data.</p>`
    }
  `)}

  ${card(`
    <strong>Expense Categories</strong>

    ${
      sortedExpenses.length
        ? sortedExpenses
            .map(([k,v]) => `
              <div style="
                display:flex;
                justify-content:space-between;
                padding:9px 0;
                border-bottom:1px solid #edf0f3;
              ">
                <span>${escapeHTML(k)}</span>
                <strong style="color:#d64545;">
                  ${money(v)}
                </strong>
              </div>
            `).join("")
        : `<p style="color:#667085;">No expense data.</p>`
    }
  `)}

  <button
    type="button"
    id="printReportBtn"
    style="
      width:100%;
      padding:13px;
      border:0;
      border-radius:12px;
      background:#0b1f33;
      color:#fff;
      font-weight:700;
    "
  >
    🖨️ Print / Save as PDF
  </button>

  `,

  {
    onOpen() {

      document
        .getElementById("printReportBtn")
        ?.addEventListener(
          "click",
          () => printReport()
        );

    }
  }
);

}

window.showReports = showReports;

function printReport() {

const totals = calculateTotals();

const rows =
  modeFilter(data.transactions)
    .slice()
    .sort(
      (a,b) =>
        Number(b.createdAt || 0) -
        Number(a.createdAt || 0)
    )
    .map(t => `

      <tr>

        <td>${escapeHTML(t.date || "")}</td>

        <td>${escapeHTML(
          t.title ||
          t.category ||
          "Transaction"
        )}</td>

        <td>${t.type === "income"
          ? "Income"
          : "Expense"
        }</td>

        <td>${money(t.amount)}</td>

      </tr>

    `).join("");

const html = `

  <!doctype html>

  <html>

  <head>

    <meta charset="utf-8">

    <title>HISAB Report</title>

    <style>

      body {
        font-family: Arial, sans-serif;
        padding: 25px;
      }

      h1 {
        margin-bottom: 3px;
      }

      .summary {
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
        margin:20px 0;
      }

      .box {
        border:1px solid #ddd;
        border-radius:10px;
        padding:12px;
      }

      table {
        width:100%;
        border-collapse:collapse;
        margin-top:20px;
      }

      th, td {
        border:1px solid #ddd;
        padding:9px;
        text-align:left;
      }

      @media print {
        button {
          display:none;
        }
      }

    </style>

  </head>

  <body>

    <h1>HISAB</h1>

    <p>Money Manager — ${modeText()}</p>

    <div class="summary">

      <div class="box">
        <strong>Income</strong>
        <br>
        ${money(totals.income)}
      </div>

      <div class="box">
        <strong>Expense</strong>
        <br>
        ${money(totals.expense)}
      </div>

      <div class="box">
        <strong>Balance</strong>
        <br>
        ${money(totals.balance)}
      </div>

    </div>

    <h2>Transactions</h2>

    <table>

      <thead>

        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Type</th>
          <th>Amount</th>
        </tr>

      </thead>

      <tbody>

        ${rows || `
          <tr>
            <td colspan="4">
              No transactions
            </td>
          </tr>
        `}

      </tbody>

    </table>

    <p>
      Generated by HISAB •
      ${new Date().toLocaleString("en-IN")}
    </p>

    <script>
      window.onload = function() {
        window.print();
      };
    <\/script>

  </body>

  </html>
`;

const win =
  window.open(
    "",
    "_blank"
  );

if (!win) {
  alert(
    "Browser ne print window block kar di. Popup allow karo."
  );
  return;
}

win.document.write(html);
win.document.close();

}

/* =========================================================
BACKUP & RESTORE
========================================================= */

function showBackup() {

showModal(
  "Backup & Restore",

  `

  ${card(`
    <strong>Backup</strong>

    <p style="
      color:#667085;
      font-size:13px;
    ">
      Apne HISAB ka complete data JSON file mein
      save kar sakte ho.
    </p>

    <button
      type="button"
      id="backupBtn"
      style="
        width:100%;
        padding:12px;
        border:0;
        border-radius:11px;
        background:#0b1f33;
        color:#fff;
        font-weight:700;
      "
    >
      ⬇️ Download Backup
    </button>
  `)}

  ${card(`
    <strong>Restore</strong>

    <p style="
      color:#667085;
      font-size:13px;
    ">
      Pehle se saved HISAB JSON backup restore karo.
    </p>

    <input
      id="restoreInput"
      type="file"
      accept=".json,application/json"
      style="
        width:100%;
        margin-top:8px;
      "
    >
  `)}

  ${secondaryButton(
    "Share Backup",
    "window.shareBackup()"
  )}

  `,

  {
    onOpen() {

      document
        .getElementById("backupBtn")
        ?.addEventListener(
          "click",
          downloadBackup
        );

      document
        .getElementById("restoreInput")
        ?.addEventListener(
          "change",
          restoreBackup
        );

    }
  }
);

}

window.showBackup = showBackup;

function downloadBackup() {

const blob =
  new Blob(
    [
      JSON.stringify(
        data,
        null,
        2
      )
    ],
    {
      type: "application/json"
    }
  );

const url =
  URL.createObjectURL(blob);

const a =
  document.createElement("a");

a.href = url;

a.download =
  `HISAB_Backup_${today()}.json`;

document.body.appendChild(a);

a.click();

a.remove();

URL.revokeObjectURL(url);

alert("Backup download ho gaya.");

}

async function restoreBackup(e) {

const file =
  e.target.files?.[0];

if (!file) return;

try {

  const text =
    await file.text();

  const restored =
    JSON.parse(text);

  if (
    !restored ||
    typeof restored !== "object"
  ) {
    throw new Error("Invalid backup");
  }

  if (!confirm(
    "Restore karne se current data replace ho jayega. Continue?"
  )) {
    e.target.value = "";
    return;
  }

  const fresh =
    Object.assign(
      clone(DEFAULT_DATA),
      restored
    );

  Object.keys(data)
    .forEach(k => delete data[k]);

  Object.assign(
    data,
    fresh
  );

  saveData();

  alert(
    "Backup successfully restore ho gaya."
  );

  showHome();

} catch (error) {

  console.error(error);

  alert(
    "Backup file valid nahi hai."
  );

}

}

window.shareBackup = async function() {

const text =
  JSON.stringify(
    data,
    null,
    2
  );

try {

  if (
    navigator.share
  ) {

    await navigator.share({
      title: "HISAB Backup",
      text
    });

  } else {

    await navigator.clipboard.writeText(text);

    alert(
      "Backup data clipboard mein copy ho gaya."
    );

  }

} catch (error) {

  console.log(
    "Share cancelled:",
    error
  );

}

};

/* =========================================================
SECURITY
========================================================= */

function showSecurity() {

showModal(
  "Security",

  `

  ${card(`
    <strong>App Lock</strong>

    <p style="
      color:#667085;
      font-size:13px;
    ">
      PIN protection enable kar sakte ho.
    </p>

    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">

      <span>
        PIN Lock
      </span>

      <button
        type="button"
        id="pinToggleBtn"
        style="
          padding:9px 14px;
          border:0;
          border-radius:9px;
          background:#eef2f6;
          font-weight:700;
        "
      >
        ${data.settings.pinEnabled
          ? "ON"
          : "OFF"
        }
      </button>

    </div>
  `)}

  ${card(`
    <strong>Data Privacy</strong>

    <p style="
      color:#667085;
      font-size:13px;
      margin-bottom:0;
    ">
      HISAB V7 ka primary data local device storage
      mein rakha jata hai. Login required nahi hai.
    </p>
  `)}

  `,

  {
    onOpen() {

      document
        .getElementById("pinToggleBtn")
        ?.addEventListener(
          "click",
          togglePIN
        );

    }
  }
);

}

window.showSecurity = showSecurity;

function togglePIN() {

if (data.settings.pinEnabled) {

  data.settings.pinEnabled = false;
  data.settings.pin = "";

  saveData();
  showSecurity();

  return;
}

const pin =
  prompt(
    "4 digit PIN set karo:"
  );

if (!/^\d{4}$/.test(pin || "")) {

  alert(
    "PIN exactly 4 digits ka hona chahiye."
  );

  return;
}

data.settings.pin = pin;
data.settings.pinEnabled = true;

saveData();

showSecurity();

}

/* =========================================================
SETTINGS
========================================================= */

function showSettings() {

showModal(
  "Settings",

  `<form id="settingsForm">

    ${input(
      "Your Name",
      "name",
      "text",
      false,
      data.settings.name || ""
    )}

    ${select(
      "Currency",
      "currency",
      [
        { value: "₹", label: "₹ Indian Rupee" },
        { value: "$", label: "$ US Dollar" },
        { value: "€", label: "€ Euro" },
        { value: "£", label: "£ British Pound" },
        { value: "¥", label: "¥ Yen / Yuan" },
        { value: "AED", label: "AED UAE Dirham" },
        { value: "SAR", label: "SAR Saudi Riyal" }
      ],
      data.currency || "₹"
    )}

    ${select(
      "Language",
      "language",
      [
        {
          value: "English",
          label: "English"
        },
        {
          value: "Hindi",
          label: "Hindi"
        }
      ],
      data.settings.language || "English"
    )}

    ${primaryButton(
      "Save Settings"
    )}

  </form>

  <hr style="
    border:0;
    border-top:1px solid #e5e9ee;
    margin:18px 0;
  ">

  ${secondaryButton(
    "💾 Backup & Restore",
    "window.showBackup()"
  )}

  ${secondaryButton(
    "🔐 Security",
    "window.showSecurity()"
  )}

  <button
    type="button"
    id="clearDataBtn"
    style="
      width:100%;
      padding:12px;
      border:0;
      border-radius:12px;
      background:#fff0f0;
      color:#c62828;
      font-weight:700;
      margin-top:8px;
    "
  >
    ⚠️ Clear All Data
  </button>

  `,

  {
    onOpen() {

      document
        .getElementById("settingsForm")
        ?.addEventListener("submit", e => {

          e.preventDefault();

          const fd =
            new FormData(e.target);

          data.settings.name =
            String(
              fd.get("name") || ""
            ).trim();

          data.settings.currency =
            fd.get("currency") || "₹";

          data.settings.language =
            fd.get("language") || "English";

          data.currency =
            data.settings.currency;

          saveData();

          closeModal();

          updateDashboard();

          alert(
            "Settings save ho gayi."
          );

        });

      document
        .getElementById("clearDataBtn")
        ?.addEventListener(
          "click",
          clearAllData
        );

    }
  }
);

}

window.showSettings = showSettings;

function clearAllData() {

const first =
  confirm(
    "Kya tum sach mein HISAB ka sara data delete karna chahte ho?"
  );

if (!first) return;

const second =
  confirm(
    "WARNING: Transactions, Len-Den, Goals, Bills, Loans sab delete honge. Continue?"
  );

if (!second) return;

localStorage.removeItem(
  STORAGE_KEY
);

location.reload();

}

/* =========================================================
ACTION ROUTER
========================================================= */

function handleAction(action) {

switch (action) {

  case "income":
    showIncome();
    break;

  case "expense":
    showExpense();
    break;

  case "lendden":
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
    showLoans();
    break;

  case "goals":
    showGoals();
    break;

  case "transactions":
    showTransactions();
    break;

  case "reports":
    showReports();
    break;

  case "backup":
    showBackup();
    break;

  case "security":
    showSecurity();
    break;

  default:
    console.warn(
      "Unknown HISAB action:",
      action
    );

}

}

/* =========================================================
BUTTON BINDING
========================================================= */

function bindButtons() {

document
  .querySelectorAll("[data-action]")
  .forEach(btn => {

    if (btn.dataset.hisabBound === "1") {
      return;
    }

    btn.dataset.hisabBound = "1";

    btn.addEventListener(
      "click",
      function () {

        const action =
          this.dataset.action;

        handleAction(action);

      }
    );

  });

}

/* =========================================================
MODE SWITCH
========================================================= */

function bindModeButtons() {

const personal =
  document.getElementById(
    "personalBtn"
  );

const business =
  document.getElementById(
    "businessBtn"
  );

if (personal) {

  personal.addEventListener(
    "click",
    () => {

      data.mode = "personal";

      saveData();

      updateModeButtons();

    }
  );

}

if (business) {

  business.addEventListener(
    "click",
    () => {

      data.mode = "business";

      saveData();

      updateModeButtons();

    }
  );

}

}

/* =========================================================
SPLASH / WELCOME
========================================================= */

function bindContinue() {

const btn =
  document.getElementById(
    "continueBtn"
  );

if (!btn) return;

btn.addEventListener(
  "click",
  () => {

    const welcome =
      document.getElementById(
        "welcomeScreen"
      );

    const home =
      document.getElementById(
        "homeScreen"
      );

    if (welcome) {
      welcome.style.display = "none";
    }

    if (home) {
      home.style.display = "block";
    }

    updateDashboard();

  }
);

}

/* =========================================================
APP START
========================================================= */

function init() {

bindButtons();

/*
  index.html already has screen connection.
  Duplicate handlers ko avoid karne ke liye
  app.js sirf action buttons bind karta hai.
*/

updateDashboard();

console.log(
  "HISAB GLOBAL V7 loaded successfully."
);

}

if (
document.readyState === "loading"
) {

document.addEventListener(
  "DOMContentLoaded",
  init
);

} else {

init();

}

})();
