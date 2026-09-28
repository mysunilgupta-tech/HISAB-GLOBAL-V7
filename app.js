/* =========================================================
   HISAB V7 — COMPLETE APP CONTROLLER
   Personal + Business | Udhaar | Bills | Loans | Goals
   Reports | PDF | Backup | PIN | Settings | Tools
   ========================================================= */

(function () {
  "use strict";

  /* ---------- STORAGE ---------- */

  const STORAGE_KEY = "hisab_v7_data";

  const DEFAULT_DATA = {
    mode: "personal",
    currency: "₹",
    language: "en",

    transactions: [],
    khata: [],
    business: [],

    goals: [],
    savings: [],
    budget: [],

    bills: [],
    loans: [],
    emis: [],
    reminders: [],

    cards: [],
    family: [],
    tools: [],

    pin: "",
    locked: false,

    filters: {
      transaction: "",
      khata: "",
      business: ""
    }
  };

  let D = loadData();

  /* ---------- BASIC HELPERS ---------- */

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadData() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("hisab_v7_complete") ||
        localStorage.getItem("hisabData");

      if (!raw) return clone(DEFAULT_DATA);

      const parsed = JSON.parse(raw);

      return {
        ...clone(DEFAULT_DATA),
        ...parsed,
        filters: {
          ...DEFAULT_DATA.filters,
          ...(parsed.filters || {})
        }
      };
    } catch (e) {
      return clone(DEFAULT_DATA);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(D));
      localStorage.setItem("hisab_v7_complete", JSON.stringify(D));
      localStorage.setItem("hisabData", JSON.stringify(D));
    } catch (e) {
      console.error("HISAB save error:", e);
    }
  }

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function money(n) {
    n = Number(n || 0);

    const symbol =
      D.currency === "INR" ? "₹" :
      D.currency === "USD" ? "$" :
      D.currency === "EUR" ? "€" :
      D.currency === "GBP" ? "£" :
      D.currency;

    return symbol + n.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function num(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  function findIndex(arr, id) {
    return arr.findIndex(x => String(x.id) === String(id));
  }

  function removeItem(arr, id) {
    const i = findIndex(arr, id);
    if (i >= 0) arr.splice(i, 1);
    return i >= 0;
  }

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    if (typeof window.toast === "function") {
      window.toast(message);
      return;
    }

    alert(message);
  }

  /* ---------- DOM HELPERS ---------- */

  function page(id) {
    return document.getElementById(id);
  }

  function clearDynamic(id) {
    const el = page(id);
    if (!el) return null;

    el.querySelectorAll(".hisab-dynamic").forEach(x => x.remove());

    return el;
  }

  function addDynamic(id, html) {
    const el = page(id);
    if (!el) return null;

    const box = document.createElement("div");
    box.className = "hisab-dynamic";
    box.innerHTML = html;
    el.appendChild(box);

    return box;
  }

  function modal(title, body, buttons) {
    document.getElementById("hisabModal")?.remove();

    const div = document.createElement("div");
    div.id = "hisabModal";

    div.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.55);
        z-index:99999;
        display:flex;
        align-items:flex-end;
        justify-content:center;
        padding:12px;
      ">
        <div style="
          width:100%;
          max-width:520px;
          max-height:92vh;
          overflow:auto;
          background:#fff;
          border-radius:22px;
          padding:18px;
          box-shadow:0 15px 50px rgba(0,0,0,.3);
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
            margin-bottom:15px;
          ">
            <h3 style="margin:0">${esc(title)}</h3>
            <button
              type="button"
              onclick="closeModal()"
              style="
                border:0;
                background:#eee;
                width:38px;
                height:38px;
                border-radius:50%;
                font-size:20px;
              "
            >×</button>
          </div>

          ${body}

          <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:16px;
          ">
            ${buttons || ""}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    return div;
  }

  function input(label, value = "", type = "text", id = "") {
    return `
      <label style="display:block;margin:10px 0">
        <span style="display:block;font-size:13px;margin-bottom:5px">
          ${esc(label)}
        </span>
        <input
          id="${esc(id)}"
          type="${type}"
          value="${esc(value)}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #ddd;
            border-radius:12px;
            font-size:15px;
          "
        >
      </label>
    `;
  }

  function selectBox(label, value, options, id) {
    return `
      <label style="display:block;margin:10px 0">
        <span style="display:block;font-size:13px;margin-bottom:5px">
          ${esc(label)}
        </span>
        <select
          id="${esc(id)}"
          style="
            width:100%;
            padding:12px;
            border:1px solid #ddd;
            border-radius:12px;
            background:#fff;
            font-size:15px;
          "
        >
          ${options.map(o => `
            <option
              value="${esc(o.value)}"
              ${String(o.value) === String(value) ? "selected" : ""}
            >${esc(o.label)}</option>
          `).join("")}
        </select>
      </label>
    `;
  }

  function actionButton(text, action, type = "button") {
    return `
      <button
        type="${type}"
        onclick="${action}"
        style="
          flex:1;
          min-width:110px;
          border:0;
          border-radius:12px;
          padding:12px;
          font-weight:600;
          background:#0b6b68;
          color:white;
        "
      >${esc(text)}</button>
    `;
  }

  window.closeModal = function () {
    document.getElementById("hisabModal")?.remove();
  };

  /* ---------- NAVIGATION ---------- */

  window.show = function (id) {
    const pages = document.querySelectorAll(".page, .screen");

    pages.forEach(p => {
      p.classList.remove("active");
      p.style.display = "none";
    });

    const target = page(id);

    if (target) {
      target.classList.add("active");
      target.style.display = "";
    }

    if (id === "home") renderHome();
    if (id === "personal") renderPersonal();
    if (id === "business") renderBusiness();
    if (id === "transactions") renderTransactions();
    if (id === "planning") renderPlanning();
    if (id === "credit") renderCredit();
    if (id === "reports") renderReports();
    if (id === "reminders") renderReminders();
    if (id === "privacy") renderPrivacy();
    if (id === "family") renderFamily();
    if (id === "familytools") renderFamilyTools();
    if (id === "tools13") renderTools();
    if (id === "final") renderSettings();

    setTimeout(() => {
      if (typeof window.repairBackButtons === "function") {
        window.repairBackButtons();
      }
    }, 0);
  };

  window.goBack = function () {
    const active =
      document.querySelector(".page.active, .screen.active");

    const id = active ? active.id : "";

    if (
      id === "khataDetail" ||
      id === "khataEntry" ||
      id === "transactions" ||
      id === "planning" ||
      id === "credit" ||
      id === "reports" ||
      id === "reminders" ||
      id === "privacy" ||
      id === "family" ||
      id === "familytools" ||
      id === "tools13" ||
      id === "final"
    ) {
      show(D.mode === "business" ? "business" : "personal");
      return;
    }

    if (id === "business" || id === "personal") {
      show("home");
      return;
    }

    show("home");
  };

  /* IMPORTANT:
     Existing index.html has onclick="closeKhataDetail()".
  */
  window.closeKhataDetail = function () {
    show(D.mode === "business" ? "business" : "personal");
  };

  window.setMode = function (mode) {
    D.mode = mode === "business" ? "business" : "personal";
    saveData();
    show(D.mode);
  };

  /* ---------- HOME ---------- */

  function totalIncome() {
    return D.transactions
      .filter(x => x.type === "income" && x.mode === "personal")
      .reduce((a, x) => a + num(x.amount), 0);
  }

  function totalExpense() {
    return D.transactions
      .filter(x => x.type === "expense" && x.mode === "personal")
      .reduce((a, x) => a + num(x.amount), 0);
  }

  function totalGive() {
    return D.khata
      .filter(x => x.mode === "personal" && x.type === "give" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);
  }

  function totalReceive() {
    return D.khata
      .filter(x => x.mode === "personal" && x.type === "receive" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);
  }

  function renderHome() {
    const el = clearDynamic("home");
    if (!el) return;

    const income = totalIncome();
    const expense = totalExpense();

    addDynamic("home", `
      <div class="hisab-dashboard" style="padding:12px">

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">
          <div style="padding:15px;border-radius:16px;background:#eefaf4">
            <small>Income</small>
            <h3>${money(income)}</h3>
          </div>

          <div style="padding:15px;border-radius:16px;background:#fff2f2">
            <small>Expense</small>
            <h3>${money(expense)}</h3>
          </div>

          <div style="padding:15px;border-radius:16px;background:#f0f7ff">
            <small>Give</small>
            <h3>${money(totalGive())}</h3>
          </div>

          <div style="padding:15px;border-radius:16px;background:#fff7ec">
            <small>Receive</small>
            <h3>${money(totalReceive())}</h3>
          </div>
        </div>

        <div style="
          margin-top:15px;
          padding:15px;
          border-radius:16px;
          background:#f6f7f8;
        ">
          <b>Balance</b>
          <div style="font-size:25px;margin-top:6px">
            ${money(income - expense)}
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          margin-top:15px;
        ">
          <button onclick="quickIncome()">＋ Income</button>
          <button onclick="quickExpense()">－ Expense</button>
          <button onclick="openKhataForm('give')">Give Udhaar</button>
          <button onclick="openKhataForm('receive')">Receive Udhaar</button>
        </div>

      </div>
    `);

    renderNavState();
  }

  function renderNavState() {}

  /* ---------- TRANSACTIONS ---------- */

  window.openTransactionForm = function (id = "") {
    const old = id
      ? D.transactions[findIndex(D.transactions, id)]
      : null;

    modal(
      id ? "Edit Transaction" : "Add Transaction",
      `
        ${selectBox(
          "Type",
          old?.type || "income",
          [
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" }
          ],
          "txType"
        )}

        ${input("Amount", old?.amount || "", "number", "txAmount")}
        ${input("Category", old?.category || "", "text", "txCategory")}
        ${input("Date", old?.date || today(), "date", "txDate")}
        ${input("Note", old?.note || "", "text", "txNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveTransaction('${id}')`
      )
    );
  };

  window.saveTransaction = function (id = "") {
    const item = {
      id: id || uid("tx"),
      mode: "personal",
      type: document.getElementById("txType")?.value || "expense",
      amount: num(document.getElementById("txAmount")?.value),
      category: document.getElementById("txCategory")?.value.trim() || "General",
      date: document.getElementById("txDate")?.value || today(),
      note: document.getElementById("txNote")?.value.trim() || ""
    };

    if (item.amount <= 0) {
      notify("Amount enter karein");
      return;
    }

    const i = findIndex(D.transactions, item.id);

    if (i >= 0) D.transactions[i] = item;
    else D.transactions.unshift(item);

    saveData();
    closeModal();
    renderTransactions();
  };

  window.deleteTransaction = function (id) {
    if (!confirm("Transaction delete karein?")) return;

    removeItem(D.transactions, id);
    saveData();
    renderTransactions();
  };

  function renderTransactions() {
    const el = clearDynamic("transactions");
    if (!el) return;

    const list = D.transactions
      .filter(x => x.mode === "personal")
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    addDynamic("transactions", `
      <div class="hisab-list" style="padding:12px">

        <button onclick="openTransactionForm()">
          ＋ Add Transaction
        </button>

        ${list.length ? list.map(x => `
          <div style="
            margin-top:10px;
            padding:14px;
            border:1px solid #eee;
            border-radius:16px;
          ">
            <div style="display:flex;justify-content:space-between">
              <b>${esc(x.category)}</b>
              <b>${money(x.amount)}</b>
            </div>

            <small>${esc(x.date)} • ${esc(x.note)}</small>

            <div style="display:flex;gap:7px;margin-top:10px">
              <button onclick="openTransactionForm('${x.id}')">Edit</button>
              <button onclick="deleteTransaction('${x.id}')">Delete</button>
            </div>
          </div>
        `).join("") : `
          <p style="text-align:center;padding:30px">
            No transactions yet.
          </p>
        `}
      </div>
    `);
  }

  /* ---------- QUICK ADD ---------- */

  window.openQuickAdd = function () {
    modal(
      "Quick Add",
      `
        <button onclick="quickIncome();closeModal()">＋ Income</button>
        <button onclick="quickExpense();closeModal()">－ Expense</button>
        <button onclick="openKhataForm('give')">Give Udhaar</button>
        <button onclick="openKhataForm('receive')">Receive Udhaar</button>
        <button onclick="openBillForm()">＋ Bill</button>
        <button onclick="openLoanForm()">＋ Loan</button>
      `,
      ""
    );
  };

  window.quickIncome = function () {
    closeModal();
    openTransactionForm("");
    setTimeout(() => {
      const e = document.getElementById("txType");
      if (e) e.value = "income";
    }, 20);
  };

  window.quickExpense = function () {
    closeModal();
    openTransactionForm("");
    setTimeout(() => {
      const e = document.getElementById("txType");
      if (e) e.value = "expense";
    }, 20);
  };

  /* ---------- UDHAR / KHATA ---------- */

  const PAYMENT_METHODS = [
    { value: "Cash", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Debit Card", label: "Debit Card" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "Wallet", label: "Wallet" },
    { value: "Cheque", label: "Cheque" },
    { value: "Other", label: "Other" }
  ];

  window.openKhataForm = function (type = "give", id = "") {
    const old = id
      ? D.khata[findIndex(D.khata, id)]
      : null;

    modal(
      id ? "Edit Udhaar" : "Add Udhaar",
      `
        ${input("Person Name", old?.person || "", "text", "khPerson")}
        ${selectBox(
          "Type",
          old?.type || type,
          [
            { value: "give", label: "Give" },
            { value: "receive", label: "Receive" }
          ],
          "khType"
        )}
        ${input("Amount", old?.amount || "", "number", "khAmount")}
        ${input("Date", old?.date || today(), "date", "khDate")}
        ${selectBox(
          "Payment Method",
          old?.paymentMethod || "Cash",
          PAYMENT_METHODS,
          "khMethod"
        )}
        ${selectBox(
          "Status",
          old?.status || "pending",
          [
            { value: "pending", label: "Pending" },
            { value: "settled", label: "Settled" }
          ],
          "khStatus"
        )}
        ${input("Note", old?.note || "", "text", "khNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveKhata('${id}')`
      )
    );
  };

  window.saveKhata = function (id = "") {
    const item = {
      id: id || uid("kh"),
      mode: D.mode === "business" ? "business" : "personal",
      person: document.getElementById("khPerson")?.value.trim() || "",
      type: document.getElementById("khType")?.value || "give",
      amount: num(document.getElementById("khAmount")?.value),
      date: document.getElementById("khDate")?.value || today(),
      paymentMethod: document.getElementById("khMethod")?.value || "Cash",
      status: document.getElementById("khStatus")?.value || "pending",
      note: document.getElementById("khNote")?.value.trim() || "",
      history: id
        ? (D.khata[findIndex(D.khata, id)]?.history || [])
        : []
    };

    if (!item.person) {
      notify("Person name enter karein");
      return;
    }

    if (item.amount <= 0) {
      notify("Amount enter karein");
      return;
    }

    const i = findIndex(D.khata, item.id);

    if (i >= 0) D.khata[i] = item;
    else D.khata.unshift(item);

    saveData();
    closeModal();

    if (D.mode === "business") renderBusiness();
    else renderPersonal();
  };

  window.deleteKhata = function (id) {
    if (!confirm("Udhaar entry delete karein?")) return;

    removeItem(D.khata, id);
    saveData();

    if (D.mode === "business") renderBusiness();
    else renderPersonal();
  };

  window.settleKhata = function (id) {
    const i = findIndex(D.khata, id);
    if (i < 0) return;

    const x = D.khata[i];

    if (!Array.isArray(x.history)) x.history = [];

    x.history.unshift({
      id: uid("khp"),
      date: today(),
      amount: x.amount,
      method: x.paymentMethod || "Cash"
    });

    x.status = "settled";

    saveData();
    renderPersonal();
  };

  window.openKhataDetail = function (person, mode = "personal") {
    D.detailMode = mode;

    const items = D.khata.filter(
      x =>
        x.person === person &&
        x.mode === mode
    );

    const give = items
      .filter(x => x.type === "give" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);

    const receive = items
      .filter(x => x.type === "receive" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);

    const el = page("khataDetail");

    if (el) {
      const name = page("detailPersonName");
      if (name) name.textContent = person;

      const old = el.querySelector(".hisab-khata-detail");
      if (old) old.remove();

      const box = document.createElement("div");
      box.className = "hisab-khata-detail hisab-dynamic";
      box.style.padding = "12px";

      box.innerHTML = `
        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">
          <div style="padding:14px;border-radius:15px;background:#fff0f0">
            <small>Give</small>
            <h3>${money(give)}</h3>
          </div>

          <div style="padding:14px;border-radius:15px;background:#eefaf4">
            <small>Receive</small>
            <h3>${money(receive)}</h3>
          </div>
        </div>

        <h3 style="margin-top:18px">Complete History</h3>

        ${items.length ? items.map(x => `
          <div style="
            padding:13px;
            margin-top:9px;
            border:1px solid #eee;
            border-radius:15px;
          ">
            <b style="color:${x.type === "give" ? "#d33" : "#14804a"}">
              ${x.type === "give" ? "Give" : "Receive"}
              ${money(x.amount)}
            </b>

            <div>
              ${esc(x.date)} • ${esc(x.paymentMethod)}
            </div>

            <small>
              ${esc(x.note)}
              • ${esc(x.status)}
            </small>
          </div>
        `).join("") : `
          <p>No history.</p>
        `}
      `;

      el.appendChild(box);
    }

    show("khataDetail");
  };

  function renderPersonal() {
    const el = clearDynamic("personal");
    if (!el) return;

    const people = {};

    D.khata
      .filter(x => x.mode === "personal")
      .forEach(x => {
        people[x.person] = true;
      });

    addDynamic("personal", `
      <div style="padding:12px">

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">
          <button onclick="openKhataForm('give')">
            + Give
          </button>

          <button onclick="openKhataForm('receive')">
            + Receive
          </button>
        </div>

        <div style="
          margin-top:14px;
          padding:15px;
          border-radius:16px;
          background:#f6f7f8;
        ">
          <b>Udhaar Summary</b>
          <div style="margin-top:7px">
            Give: ${money(totalGive())}
          </div>
          <div>
            Receive: ${money(totalReceive())}
          </div>
          <div>
            Net: ${money(totalGive() - totalReceive())}
          </div>
        </div>

        <h3 style="margin-top:18px">People</h3>

        ${Object.keys(people).length
          ? Object.keys(people).map(name => `
            <div style="
              padding:14px;
              border:1px solid #eee;
              border-radius:15px;
              margin-top:9px;
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:8px;
            ">
              <b>${esc(name)}</b>

              <button
                onclick="openKhataDetail('${esc(name)}','personal')"
              >
                History
              </button>
            </div>
          `).join("")
          : `
            <p style="text-align:center;padding:25px">
              No Udhaar entries.
            </p>
          `
        }

      </div>
    `);
  }

  /* ---------- PLANNING ---------- */

  window.openGoalForm = function (id = "") {
    const old = id
      ? D.goals[findIndex(D.goals, id)]
      : null;

    modal(
      id ? "Edit Goal" : "Add Goal",
      `
        ${input("Goal Name", old?.name || "", "text", "goalName")}
        ${input("Target Amount", old?.target || "", "number", "goalTarget")}
        ${input("Saved Amount", old?.saved || 0, "number", "goalSaved")}
        ${input("Target Date", old?.date || "", "date", "goalDate")}
        ${input("Note", old?.note || "", "text", "goalNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveGoal('${id}')`
      )
    );
  };

  window.saveGoal = function (id = "") {
    const item = {
      id: id || uid("goal"),
      name: document.getElementById("goalName")?.value.trim() || "",
      target: num(document.getElementById("goalTarget")?.value),
      saved: num(document.getElementById("goalSaved")?.value),
      date: document.getElementById("goalDate")?.value || "",
      note: document.getElementById("goalNote")?.value.trim() || ""
    };

    if (!item.name || item.target <= 0) {
      notify("Goal name aur target amount enter karein");
      return;
    }

    const i = findIndex(D.goals, item.id);

    if (i >= 0) D.goals[i] = item;
    else D.goals.unshift(item);

    saveData();
    closeModal();
    renderPlanning();
  };

  window.deleteGoal = function (id) {
    if (!confirm("Goal delete karein?")) return;

    removeItem(D.goals, id);
    saveData();
    renderPlanning();
  };

  window.addGoalSaving = function (id) {
    const i = findIndex(D.goals, id);
    if (i < 0) return;

    modal(
      "Add Saving",
      input("Amount", "", "number", "saveAmount"),
      actionButton(
        "Add",
        `saveGoalAmount('${id}')`
      )
    );
  };

  window.saveGoalAmount = function (id) {
    const amount = num(
      document.getElementById("saveAmount")?.value
    );

    if (amount <= 0) {
      notify("Amount enter karein");
      return;
    }

    const i = findIndex(D.goals, id);
    if (i < 0) return;

    D.goals[i].saved = num(D.goals[i].saved) + amount;

    D.savings.unshift({
      id: uid("sav"),
      goalId: id,
      amount,
      date: today()
    });

    saveData();
    closeModal();
    renderPlanning();
  };

  function renderPlanning() {
    const el = clearDynamic("planning");
    if (!el) return;

    addDynamic("planning", `
      <div style="padding:12px">

        <button onclick="openGoalForm()">
          ＋ Add Goal
        </button>

        <h3>Goals & Savings</h3>

        ${D.goals.length
          ? D.goals.map(x => {
            const pct = Math.min(
              100,
              Math.round(
                num(x.saved) /
                Math.max(1, num(x.target)) *
                100
              )
            );

            return `
              <div style="
                margin-top:10px;
                padding:15px;
                border:1px solid #eee;
                border-radius:16px;
              ">
                <b>${esc(x.name)}</b>

                <div style="margin-top:6px">
                  ${money(x.saved)} / ${money(x.target)}
                </div>

                <div style="
                  margin-top:8px;
                  height:8px;
                  background:#e8e8e8;
                  border-radius:20px;
                  overflow:hidden;
                ">
                  <div style="
                    width:${pct}%;
                    height:100%;
                    background:#0b6b68;
                  "></div>
                </div>

                <small>${pct}% complete</small>

                <div style="
                  display:flex;
                  gap:7px;
                  margin-top:10px;
                  flex-wrap:wrap;
                ">
                  <button onclick="addGoalSaving('${x.id}')">
                    + Saving
                  </button>

                  <button onclick="openGoalForm('${x.id}')">
                    Edit
                  </button>

                  <button onclick="deleteGoal('${x.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `;
          }).join("")
          : `<p>No goals yet.</p>`
        }

      </div>
    `);
  }

  /* ---------- BILLS ---------- */

  window.openBillForm = function (id = "") {
    const old = id
      ? D.bills[findIndex(D.bills, id)]
      : null;

    modal(
      id ? "Edit Bill" : "Add Bill",
      `
        ${input("Bill Name", old?.name || "", "text", "billName")}
        ${input("Amount", old?.amount || "", "number", "billAmount")}
        ${input("Due Date", old?.dueDate || today(), "date", "billDue")}
        ${input("Reminder Date", old?.reminderDate || "", "date", "billReminder")}

        ${selectBox(
          "Status",
          old?.status || "pending",
          [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" }
          ],
          "billStatus"
        )}

        ${selectBox(
          "Repeat",
          old?.repeat || "none",
          [
            { value: "none", label: "One Time" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" }
          ],
          "billRepeat"
        )}

        ${input("Note", old?.note || "", "text", "billNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveBill('${id}')`
      )
    );
  };

  window.saveBill = function (id = "") {
    const old = id
      ? D.bills[findIndex(D.bills, id)]
      : null;

    const item = {
      id: id || uid("bill"),
      name: document.getElementById("billName")?.value.trim() || "",
      amount: num(document.getElementById("billAmount")?.value),
      dueDate: document.getElementById("billDue")?.value || today(),
      reminderDate: document.getElementById("billReminder")?.value || "",
      status: document.getElementById("billStatus")?.value || "pending",
      repeat: document.getElementById("billRepeat")?.value || "none",
      note: document.getElementById("billNote")?.value.trim() || "",
      history: old?.history || []
    };

    if (!item.name || item.amount <= 0) {
      notify("Bill name aur amount enter karein");
      return;
    }

    const i = findIndex(D.bills, item.id);

    if (i >= 0) D.bills[i] = item;
    else D.bills.unshift(item);

    saveData();
    closeModal();
    renderCredit();
  };

  window.deleteBill = function (id) {
    if (!confirm("Bill delete karein?")) return;

    removeItem(D.bills, id);
    saveData();
    renderCredit();
  };

  window.markBillPaid = function (id) {
    const i = findIndex(D.bills, id);
    if (i < 0) return;

    const bill = D.bills[i];

    if (!Array.isArray(bill.history)) bill.history = [];

    bill.history.unshift({
      id: uid("bh"),
      date: today(),
      amount: bill.amount,
      status: "paid"
    });

    bill.status = "paid";
    bill.paidDate = today();

    saveData();
    renderCredit();
  };

  window.billHistory = function (id) {
    const bill = D.bills[findIndex(D.bills, id)];
    if (!bill) return;

    modal(
      "Bill Payment History",
      `
        <b>${esc(bill.name)}</b>
        <p>Total: ${money(bill.amount)}</p>

        ${
          bill.history?.length
            ? bill.history.map(h => `
              <div style="
                padding:10px;
                border-bottom:1px solid #eee;
              ">
                ${esc(h.date)} —
                ${money(h.amount)}
              </div>
            `).join("")
            : "<p>No payment history.</p>"
        }
      `,
      ""
    );
  };

  /* ---------- LOANS / EMI ---------- */

  function calculateEMI(principal, annualRate, months) {
    principal = num(principal);
    annualRate = num(annualRate);
    months = Math.max(1, Math.floor(num(months)));

    if (!principal) return 0;

    if (!annualRate) {
      return principal / months;
    }

    const r = annualRate / 12 / 100;

    return (
      principal *
      r *
      Math.pow(1 + r, months) /
      (Math.pow(1 + r, months) - 1)
    );
  }

  window.openLoanForm = function (id = "") {
    const old = id
      ? D.loans[findIndex(D.loans, id)]
      : null;

    modal(
      id ? "Edit Loan / EMI" : "Add Loan / EMI",
      `
        ${input("Loan Name", old?.name || "", "text", "loanName")}
        ${input("Principal Amount", old?.amount || "", "number", "loanAmount")}
        ${input("Interest %", old?.rate || 0, "number", "loanRate")}
        ${input("Tenure (Months)", old?.months || "", "number", "loanMonths")}
        ${input("Due Date", old?.dueDate || today(), "date", "loanDue")}
        ${input("Note", old?.note || "", "text", "loanNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveLoan('${id}')`
      )
    );
  };

  window.saveLoan = function (id = "") {
    const old = id
      ? D.loans[findIndex(D.loans, id)]
      : null;

    const amount = num(
      document.getElementById("loanAmount")?.value
    );

    const rate = num(
      document.getElementById("loanRate")?.value
    );

    const months = Math.max(
      1,
      Math.floor(
        num(document.getElementById("loanMonths")?.value)
      )
    );

    const item = {
      id: id || uid("loan"),
      name: document.getElementById("loanName")?.value.trim() || "",
      amount,
      rate,
      months,
      emi: calculateEMI(amount, rate, months),
      dueDate: document.getElementById("loanDue")?.value || today(),
      note: document.getElementById("loanNote")?.value.trim() || "",
      paid: num(old?.paid),
      history: old?.history || []
    };

    if (!item.name || item.amount <= 0) {
      notify("Loan name aur amount enter karein");
      return;
    }

    const i = findIndex(D.loans, item.id);

    if (i >= 0) D.loans[i] = item;
    else D.loans.unshift(item);

    saveData();
    closeModal();
    renderCredit();
  };

  window.deleteLoan = function (id) {
    if (!confirm("Loan delete karein?")) return;

    removeItem(D.loans, id);
    saveData();
    renderCredit();
  };

  window.payLoan = function (id) {
    const i = findIndex(D.loans, id);
    if (i < 0) return;

    modal(
      "Loan Payment",
      `
        ${input("Payment Amount", D.loans[i].emi || "", "number", "loanPay")}
        ${input("Payment Date", today(), "date", "loanPayDate")}
        ${input("Note", "", "text", "loanPayNote")}
      `,
      actionButton(
        "Save Payment",
        `saveLoanPayment('${id}')`
      )
    );
  };

  window.saveLoanPayment = function (id) {
    const i = findIndex(D.loans, id);
    if (i < 0) return;

    const amount = num(
      document.getElementById("loanPay")?.value
    );

    if (amount <= 0) {
      notify("Payment amount enter karein");
      return;
    }

    const loan = D.loans[i];

    if (!Array.isArray(loan.history)) loan.history = [];

    loan.paid = num(loan.paid) + amount;

    loan.history.unshift({
      id: uid("lp"),
      amount,
      date:
        document.getElementById("loanPayDate")?.value ||
        today(),
      note:
        document.getElementById("loanPayNote")?.value.trim() ||
        ""
    });

    saveData();
    closeModal();
    renderCredit();
  };

  window.loanHistory = function (id) {
    const loan = D.loans[findIndex(D.loans, id)];
    if (!loan) return;

    modal(
      "Loan Payment History",
      `
        <b>${esc(loan.name)}</b>

        <p>
          Principal: ${money(loan.amount)}
        </p>

        <p>
          Paid: ${money(loan.paid)}
        </p>

        <p>
          Remaining:
          ${money(Math.max(0, num(loan.amount) - num(loan.paid)))}
        </p>

        ${
          loan.history?.length
            ? loan.history.map(h => `
              <div style="
                padding:10px;
                border-bottom:1px solid #eee;
              ">
                ${esc(h.date)} —
                ${money(h.amount)}
                ${h.note ? " • " + esc(h.note) : ""}
              </div>
            `).join("")
            : "<p>No payment history.</p>"
        }
      `,
      ""
    );
  };

  function renderCredit() {
    const el = clearDynamic("credit");
    if (!el) return;

    addDynamic("credit", `
      <div style="padding:12px">

        <h3>Bills</h3>

        <button onclick="openBillForm()">
          ＋ Add Bill
        </button>

        ${
          D.bills.length
            ? D.bills.map(b => `
              <div style="
                margin-top:10px;
                padding:14px;
                border:1px solid #eee;
                border-radius:15px;
              ">
                <b>${esc(b.name)}</b>
                <div>${money(b.amount)}</div>
                <small>
                  Due: ${esc(b.dueDate)}
                  • ${esc(b.status)}
                </small>

                <div style="
                  display:flex;
                  gap:7px;
                  flex-wrap:wrap;
                  margin-top:9px;
                ">
                  ${
                    b.status !== "paid"
                      ? `<button onclick="markBillPaid('${b.id}')">
                           Mark Paid
                         </button>`
                      : ""
                  }

                  <button onclick="billHistory('${b.id}')">
                    History
                  </button>

                  <button onclick="openBillForm('${b.id}')">
                    Edit
                  </button>

                  <button onclick="deleteBill('${b.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `).join("")
            : "<p>No bills yet.</p>"
        }

        <h3 style="margin-top:25px">Loans / EMI</h3>

        <button onclick="openLoanForm()">
          ＋ Add Loan / EMI
        </button>

        ${
          D.loans.length
            ? D.loans.map(l => {
              const remaining = Math.max(
                0,
                num(l.amount) - num(l.paid)
              );

              const pct = Math.min(
                100,
                Math.round(
                  num(l.paid) /
                  Math.max(1, num(l.amount)) *
                  100
                )
              );

              return `
                <div style="
                  margin-top:10px;
                  padding:14px;
                  border:1px solid #eee;
                  border-radius:15px;
                ">
                  <b>${esc(l.name)}</b>

                  <div>
                    Loan: ${money(l.amount)}
                  </div>

                  <div>
                    Monthly EMI: ${money(l.emi)}
                  </div>

                  <div>
                    Paid: ${money(l.paid)}
                  </div>

                  <div>
                    Remaining: ${money(remaining)}
                  </div>

                  <div style="
                    margin-top:8px;
                    height:8px;
                    background:#eee;
                    border-radius:20px;
                    overflow:hidden;
                  ">
                    <div style="
                      width:${pct}%;
                      height:100%;
                      background:#0b6b68;
                    "></div>
                  </div>

                  <small>${pct}% paid</small>

                  <div style="
                    display:flex;
                    gap:7px;
                    flex-wrap:wrap;
                    margin-top:9px;
                  ">
                    <button onclick="payLoan('${l.id}')">
                      + Payment
                    </button>

                    <button onclick="loanHistory('${l.id}')">
                      History
                    </button>

                    <button onclick="openLoanForm('${l.id}')">
                      Edit
                    </button>

                    <button onclick="deleteLoan('${l.id}')">
                      Delete
                    </button>
                  </div>
                </div>
              `;
            }).join("")
            : "<p>No loans yet.</p>"
        }

      </div>
    `);
  }

  /* ---------- REMINDERS ---------- */

  window.openReminderForm = function (id = "") {
    const old = id
      ? D.reminders[findIndex(D.reminders, id)]
      : null;

    modal(
      id ? "Edit Reminder" : "Add Reminder",
      `
        ${input("Reminder Title", old?.title || "", "text", "remTitle")}
        ${input("Date", old?.date || today(), "date", "remDate")}
        ${input("Time", old?.time || "", "time", "remTime")}

        ${selectBox(
          "Repeat",
          old?.repeat || "none",
          [
            { value: "none", label: "One Time" },
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" }
          ],
          "remRepeat"
        )}

        ${input("Note", old?.note || "", "text", "remNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveReminder('${id}')`
      )
    );
  };

  window.saveReminder = function (id = "") {
    const item = {
      id: id || uid("rem"),
      title: document.getElementById("remTitle")?.value.trim() || "",
      date: document.getElementById("remDate")?.value || today(),
      time: document.getElementById("remTime")?.value || "",
      repeat: document.getElementById("remRepeat")?.value || "none",
      note: document.getElementById("remNote")?.value.trim() || "",
      done: false
    };

    if (!item.title) {
      notify("Reminder title enter karein");
      return;
    }

    const i = findIndex(D.reminders, item.id);

    if (i >= 0) {
      item.done = D.reminders[i].done;
      D.reminders[i] = item;
    } else {
      D.reminders.unshift(item);
    }

    saveData();
    closeModal();
    renderReminders();
  };

  window.deleteReminder = function (id) {
    if (!confirm("Reminder delete karein?")) return;

    removeItem(D.reminders, id);
    saveData();
    renderReminders();
  };

  window.toggleReminder = function (id) {
    const i = findIndex(D.reminders, id);
    if (i < 0) return;

    D.reminders[i].done = !D.reminders[i].done;

    saveData();
    renderReminders();
  };

  function renderReminders() {
    const el = clearDynamic("reminders");
    if (!el) return;

    addDynamic("reminders", `
      <div style="padding:12px">

        <button onclick="openReminderForm()">
          ＋ Add Reminder
        </button>

        ${
          D.reminders.length
            ? D.reminders.map(r => `
              <div style="
                margin-top:10px;
                padding:14px;
                border:1px solid #eee;
                border-radius:15px;
              ">
                <b style="${r.done ? "text-decoration:line-through" : ""}">
                  ${esc(r.title)}
                </b>

                <div>
                  ${esc(r.date)}
                  ${r.time ? " • " + esc(r.time) : ""}
                </div>

                <small>
                  Repeat: ${esc(r.repeat)}
                  ${r.note ? " • " + esc(r.note) : ""}
                </small>

                <div style="
                  display:flex;
                  gap:7px;
                  margin-top:9px;
                  flex-wrap:wrap;
                ">
                  <button onclick="toggleReminder('${r.id}')">
                    ${r.done ? "Undo" : "Done"}
                  </button>

                  <button onclick="openReminderForm('${r.id}')">
                    Edit
                  </button>

                  <button onclick="deleteReminder('${r.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `).join("")
            : "<p>No reminders yet.</p>"
        }

        <p style="font-size:12px;margin-top:15px">
          Reminder data is stored locally. Native background notification
          scheduling requires Android notification integration.
        </p>

      </div>
    `);
  }

  /* ---------- BUSINESS ---------- */

  window.openBusinessPersonForm = function (id = "") {
    const old = id
      ? D.business[findIndex(D.business, id)]
      : null;

    modal(
      id ? "Edit Customer / Supplier" : "Add Customer / Supplier",
      `
        ${selectBox(
          "Type",
          old?.personType || "customer",
          [
            { value: "customer", label: "Customer" },
            { value: "supplier", label: "Supplier" }
          ],
          "bpType"
        )}

        ${input("Name", old?.name || "", "text", "bpName")}
        ${input("Phone", old?.phone || "", "tel", "bpPhone")}
        ${input("Address", old?.address || "", "text", "bpAddress")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveBusinessPerson('${id}')`
      )
    );
  };

  window.saveBusinessPerson = function (id = "") {
    const old = id
      ? D.business[findIndex(D.business, id)]
      : null;

    const item = {
      id: id || uid("bp"),
      recordType: "person",
      personType:
        document.getElementById("bpType")?.value || "customer",
      name:
        document.getElementById("bpName")?.value.trim() || "",
      phone:
        document.getElementById("bpPhone")?.value.trim() || "",
      address:
        document.getElementById("bpAddress")?.value.trim() || "",
      date: old?.date || today()
    };

    if (!item.name) {
      notify("Name enter karein");
      return;
    }

    const i = findIndex(D.business, item.id);

    if (i >= 0) D.business[i] = item;
    else D.business.unshift(item);

    saveData();
    closeModal();
    renderBusiness();
  };

  window.deleteBusiness = function (id) {
    if (!confirm("Record delete karein?")) return;

    removeItem(D.business, id);
    saveData();
    renderBusiness();
  };

  window.openBusinessEntryForm = function (
    type = "sale",
    id = ""
  ) {
    const old = id
      ? D.business[findIndex(D.business, id)]
      : null;

    modal(
      id ? "Edit Sale / Purchase" : "Add Sale / Purchase",
      `
        ${selectBox(
          "Entry",
          old?.entryType || type,
          [
            { value: "sale", label: "Sale" },
            { value: "purchase", label: "Purchase" }
          ],
          "beType"
        )}

        ${input("Party / Customer", old?.party || "", "text", "beParty")}
        ${input("Item", old?.item || "", "text", "beItem")}
        ${input("Amount", old?.amount || "", "number", "beAmount")}
        ${input("Date", old?.date || today(), "date", "beDate")}

        ${selectBox(
          "Payment Status",
          old?.status || "pending",
          [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" }
          ],
          "beStatus"
        )}

        ${input("Note", old?.note || "", "text", "beNote")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveBusinessEntry('${id}')`
      )
    );
  };

  window.saveBusinessEntry = function (id = "") {
    const item = {
      id: id || uid("be"),
      recordType: "entry",
      entryType:
        document.getElementById("beType")?.value || "sale",
      party:
        document.getElementById("beParty")?.value.trim() || "",
      item:
        document.getElementById("beItem")?.value.trim() || "",
      amount:
        num(document.getElementById("beAmount")?.value),
      date:
        document.getElementById("beDate")?.value || today(),
      status:
        document.getElementById("beStatus")?.value || "pending",
      note:
        document.getElementById("beNote")?.value.trim() || ""
    };

    if (!item.party || item.amount <= 0) {
      notify("Party aur amount enter karein");
      return;
    }

    const i = findIndex(D.business, item.id);

    if (i >= 0) D.business[i] = item;
    else D.business.unshift(item);

    saveData();
    closeModal();
    renderBusiness();
  };

  window.toggleBusinessStatus = function (id) {
    const i = findIndex(D.business, id);
    if (i < 0) return;

    D.business[i].status =
      D.business[i].status === "paid"
        ? "pending"
        : "paid";

    saveData();
    renderBusiness();
  };

  function renderBusiness() {
    const el = clearDynamic("business");
    if (!el) return;

    const people = D.business.filter(
      x => x.recordType === "person"
    );

    const entries = D.business.filter(
      x => x.recordType === "entry"
    );

    const sales = entries
      .filter(x => x.entryType === "sale")
      .reduce((a, x) => a + num(x.amount), 0);

    const purchases = entries
      .filter(x => x.entryType === "purchase")
      .reduce((a, x) => a + num(x.amount), 0);

    addDynamic("business", `
      <div style="padding:12px">

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">
          <div style="padding:14px;border-radius:15px;background:#eefaf4">
            <small>Sales</small>
            <h3>${money(sales)}</h3>
          </div>

          <div style="padding:14px;border-radius:15px;background:#fff2f2">
            <small>Purchase</small>
            <h3>${money(purchases)}</h3>
          </div>
        </div>

        <h3>Customers & Suppliers</h3>

        <button onclick="openBusinessPersonForm()">
          ＋ Add Customer / Supplier
        </button>

        ${
          people.length
            ? people.map(p => `
              <div style="
                margin-top:9px;
                padding:13px;
                border:1px solid #eee;
                border-radius:15px;
              ">
                <b>${esc(p.name)}</b>
                <div>${esc(p.personType)}</div>
                <small>${esc(p.phone)}</small>

                <div style="margin-top:8px">
                  <button onclick="openBusinessPersonForm('${p.id}')">
                    Edit
                  </button>
                  <button onclick="deleteBusiness('${p.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `).join("")
            : "<p>No customers/suppliers.</p>"
        }

        <h3 style="margin-top:22px">Sales & Purchase</h3>

        <button onclick="openBusinessEntryForm('sale')">
          ＋ Sale
        </button>

        <button onclick="openBusinessEntryForm('purchase')">
          ＋ Purchase
        </button>

        ${
          entries.length
            ? entries.map(x => `
              <div style="
                margin-top:9px;
                padding:13px;
                border:1px solid #eee;
                border-radius:15px;
              ">
                <b>
                  ${x.entryType === "sale" ? "Sale" : "Purchase"}
                </b>

                <div>
                  ${esc(x.party)}
                  ${x.item ? " • " + esc(x.item) : ""}
                </div>

                <div>${money(x.amount)}</div>

                <small>
                  ${esc(x.date)} • ${esc(x.status)}
                </small>

                <div style="
                  display:flex;
                  gap:7px;
                  flex-wrap:wrap;
                  margin-top:8px;
                ">
                  <button onclick="toggleBusinessStatus('${x.id}')">
                    ${x.status === "paid" ? "Mark Pending" : "Mark Paid"}
                  </button>

                  <button onclick="openBusinessEntryForm('${x.entryType}','${x.id}')">
                    Edit
                  </button>

                  <button onclick="deleteBusiness('${x.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `).join("")
            : "<p>No sales/purchase entries.</p>"
        }

      </div>
    `);
  }

  /* ---------- REPORTS ---------- */

  function renderReports() {
    const el = clearDynamic("reports");
    if (!el) return;

    const income = D.transactions
      .filter(x => x.type === "income")
      .reduce((a, x) => a + num(x.amount), 0);

    const expense = D.transactions
      .filter(x => x.type === "expense")
      .reduce((a, x) => a + num(x.amount), 0);

    const categories = {};

    D.transactions.forEach(x => {
      const key = x.category || "General";

      if (!categories[key]) {
        categories[key] = {
          income: 0,
          expense: 0
        };
      }

      categories[key][x.type] += num(x.amount);
    });

    const months = {};

    D.transactions.forEach(x => {
      const month = String(x.date || "").slice(0, 7);

      if (!month) return;

      if (!months[month]) {
        months[month] = {
          income: 0,
          expense: 0
        };
      }

      months[month][x.type] += num(x.amount);
    });

    addDynamic("reports", `
      <div style="padding:12px">

        <div style="
          padding:16px;
          border-radius:16px;
          background:#f6f7f8;
        ">
          <b>Financial Summary</b>

          <div>Income: ${money(income)}</div>
          <div>Expense: ${money(expense)}</div>
          <div>
            Net: ${money(income - expense)}
          </div>
        </div>

        <h3>Category Report</h3>

        ${
          Object.keys(categories).length
            ? Object.entries(categories).map(([name, v]) => `
              <div style="
                padding:12px;
                border-bottom:1px solid #eee;
              ">
                <b>${esc(name)}</b>
                <div>Income: ${money(v.income)}</div>
                <div>Expense: ${money(v.expense)}</div>
              </div>
            `).join("")
            : "<p>No report data.</p>"
        }

        <h3>Monthly Report</h3>

        ${
          Object.keys(months).length
            ? Object.entries(months)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, v]) => `
                  <div style="
                    padding:12px;
                    border-bottom:1px solid #eee;
                  ">
                    <b>${esc(month)}</b>
                    <div>
                      Income: ${money(v.income)}
                    </div>
                    <div>
                      Expense: ${money(v.expense)}
                    </div>
                    <div>
                      Net: ${money(v.income - v.expense)}
                    </div>
                  </div>
                `).join("")
            : "<p>No monthly data.</p>"
        }

        <div style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:18px;
        ">
          <button onclick="exportPDF()">
            Export PDF
          </button>

          <button onclick="sharePDF()">
            Share PDF
          </button>
        </div>

      </div>
    `);
  }

  /* ---------- PDF ---------- */

  function pdfSafe(text) {
    return String(text)
      .replace(/₹/g, "INR ")
      .replace(/[^\x20-\x7E]/g, "");
  }

  function makePDF() {
    const lines = [];

    lines.push("HISAB - MONEY MANAGER");
    lines.push("Financial Report");
    lines.push("--------------------------------");

    let income = 0;
    let expense = 0;

    D.transactions.forEach(x => {
      if (x.type === "income") income += num(x.amount);
      if (x.type === "expense") expense += num(x.amount);
    });

    lines.push("Income: " + pdfSafe(money(income)));
    lines.push("Expense: " + pdfSafe(money(expense)));
    lines.push("Net: " + pdfSafe(money(income - expense)));
    lines.push("");

    lines.push("TRANSACTIONS");
    lines.push("--------------------------------");

    D.transactions.slice(0, 100).forEach(x => {
      lines.push(
        `${x.date} | ${x.type} | ${x.category} | ${money(x.amount)}`
      );
    });

    lines.push("");
    lines.push("UDHAAR");
    lines.push("--------------------------------");

    D.khata.slice(0, 100).forEach(x => {
      lines.push(
        `${x.date} | ${x.person} | ${x.type} | ${money(x.amount)} | ${x.status}`
      );
    });

    const body = lines
      .map(pdfSafe)
      .map(x => x.slice(0, 100))
      .join("\n");

    const stream =
      `BT
/F1 10 Tf
40 800 Td
12 TL
${body
  .split("\n")
  .map(line => `(${line.replace(/[()\\]/g, "\\$&")}) Tj T*`)
  .join("\n")}
ET`;

    const objects = [];

    objects.push(
      `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`
    );

    objects.push(
      `2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`
    );

    objects.push(
      `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Resources << /Font << /F1 5 0 R >> >>
/Contents 4 0 R
>>
endobj`
    );

    objects.push(
      `4 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj`
    );

    objects.push(
      `5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`
    );

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach(obj => {
      offsets.push(pdf.length);
      pdf += obj + "\n";
    });

    const xref = pdf.length;

    pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;

    for (let i = 1; i < offsets.length; i++) {
      pdf += String(offsets[i]).padStart(10, "0") +
        " 00000 n \n";
    }

    pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xref}
%%EOF`;

    return new Blob([pdf], {
      type: "application/pdf"
    });
  }

  window.exportPDF = function () {
    try {
      const blob = makePDF();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        "HISAB-Report-" +
        today() +
        ".pdf";

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 2000);

      notify("PDF ready hai");
    } catch (e) {
      console.error(e);
      notify("PDF create nahi ho paya");
    }
  };

  window.sharePDF = async function () {
    try {
      const blob = makePDF();

      const file = new File(
        [blob],
        "HISAB-Report-" + today() + ".pdf",
        { type: "application/pdf" }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "HISAB Report",
          text: "HISAB Financial Report",
          files: [file]
        });

        return;
      }

      exportPDF();
    } catch (e) {
      if (e?.name !== "AbortError") {
        exportPDF();
      }
    }
  };

  /* ---------- BACKUP / RESTORE ---------- */

  window.backupData = function () {
    const blob = new Blob(
      [JSON.stringify(D, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "HISAB-Backup-" + today() + ".json";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  window.restoreData = function () {
    const inputEl = document.createElement("input");

    inputEl.type = "file";
    inputEl.accept = ".json,application/json";

    inputEl.onchange = async function () {
      const file = inputEl.files?.[0];
      if (!file) return;

      try {
        const textData = await file.text();
        const imported = JSON.parse(textData);

        D = {
          ...clone(DEFAULT_DATA),
          ...imported,
          filters: {
            ...DEFAULT_DATA.filters,
            ...(imported.filters || {})
          }
        };

        saveData();

        notify("Backup restore ho gaya");

        show("home");
      } catch (e) {
        notify("Backup file valid nahi hai");
      }
    };

    inputEl.click();
  };

  /* ---------- SECURITY ---------- */

  window.setPIN = function () {
    modal(
      "Security PIN",
      `
        ${input("New PIN", "", "password", "newPin")}
        ${input("Confirm PIN", "", "password", "confirmPin")}
      `,
      actionButton("Save PIN", "savePIN()")
    );
  };

  window.savePIN = function () {
    const a =
      document.getElementById("newPin")?.value || "";

    const b =
      document.getElementById("confirmPin")?.value || "";

    if (!a || a.length < 4) {
      notify("PIN kam se kam 4 digit ka ho");
      return;
    }

    if (a !== b) {
      notify("PIN match nahi hai");
      return;
    }

    D.pin = a;
    saveData();

    closeModal();

    notify("PIN save ho gaya");
  };

  window.removePIN = function () {
    if (!D.pin) {
      notify("PIN set nahi hai");
      return;
    }

    modal(
      "Remove PIN",
      input("Current PIN", "", "password", "removePin"),
      actionButton("Remove", "confirmRemovePIN()")
    );
  };

  window.confirmRemovePIN = function () {
    const p =
      document.getElementById("removePin")?.value || "";

    if (p !== D.pin) {
      notify("Wrong PIN");
      return;
    }

    D.pin = "";
    D.locked = false;

    saveData();
    closeModal();

    notify("PIN remove ho gaya");
  };

  window.unlockApp = function () {
    if (!D.pin) return true;

    const p = prompt("HISAB PIN enter karein:");

    if (p === D.pin) {
      D.locked = false;
      return true;
    }

    notify("Wrong PIN");
    return false;
  };

  /* ---------- SETTINGS ---------- */

  function renderSettings() {
    const el = clearDynamic("final");
    if (!el) return;

    addDynamic("final", `
      <div style="padding:12px">

        <h3>Settings</h3>

        <div style="
          padding:14px;
          border:1px solid #eee;
          border-radius:15px;
          margin-bottom:10px;
        ">
          <b>Language</b>

          <div style="margin-top:8px">
            <button onclick="setLanguage('en')">
              English
            </button>

            <button onclick="setLanguage('hi')">
              Hindi
            </button>
          </div>

          <p>
            Current:
            ${D.language === "hi" ? "Hindi" : "English"}
          </p>
        </div>

        <div style="
          padding:14px;
          border:1px solid #eee;
          border-radius:15px;
          margin-bottom:10px;
        ">
          <b>Currency</b>

          <div style="margin-top:8px">
            <button onclick="setCurrency('₹')">₹ INR</button>
            <button onclick="setCurrency('$')">$ USD</button>
            <button onclick="setCurrency('€')">€ EUR</button>
            <button onclick="setCurrency('£')">£ GBP</button>
          </div>
        </div>

        <h3>Security</h3>

        <button onclick="setPIN()">
          Set / Change PIN
        </button>

        <button onclick="removePIN()">
          Remove PIN
        </button>

        <h3>Backup</h3>

        <button onclick="backupData()">
          Export Backup
        </button>

        <button onclick="restoreData()">
          Restore Backup
        </button>

        <h3>About</h3>

        <p>
          HISAB Money Manager<br>
          Track • Plan • Grow
        </p>

      </div>
    `);
  }

  window.setLanguage = function (lang) {
    D.language = lang === "hi" ? "hi" : "en";
    saveData();
    renderSettings();
  };

  window.setCurrency = function (currency) {
    D.currency = currency;
    saveData();
    renderSettings();
  };

  /* ---------- PRIVACY ---------- */

  function renderPrivacy() {
    const el = clearDynamic("privacy");
    if (!el) return;

    addDynamic("privacy", `
      <div style="padding:15px">
        <h3>Privacy</h3>

        <p>
          HISAB stores app data locally on the device.
        </p>

        <p>
          No account/login is required for the local data flow.
        </p>

        <p>
          Backup files are created only when you choose
          to export them.
        </p>
      </div>
    `);
  }

  /* ---------- FAMILY ---------- */

  window.openFamilyForm = function (id = "") {
    const old = id
      ? D.family[findIndex(D.family, id)]
      : null;

    modal(
      id ? "Edit Family Member" : "Add Family Member",
      `
        ${input("Name", old?.name || "", "text", "famName")}
        ${input("Relation", old?.relation || "", "text", "famRelation")}
        ${input("Phone", old?.phone || "", "tel", "famPhone")}
      `,
      actionButton(
        id ? "Update" : "Save",
        `saveFamily('${id}')`
      )
    );
  };

  window.saveFamily = function (id = "") {
    const item = {
      id: id || uid("fam"),
      name: document.getElementById("famName")?.value.trim() || "",
      relation:
        document.getElementById("famRelation")?.value.trim() || "",
      phone:
        document.getElementById("famPhone")?.value.trim() || ""
    };

    if (!item.name) {
      notify("Name enter karein");
      return;
    }

    const i = findIndex(D.family, item.id);

    if (i >= 0) D.family[i] = item;
    else D.family.unshift(item);

    saveData();
    closeModal();
    renderFamily();
  };

  window.deleteFamily = function (id) {
    if (!confirm("Family member delete karein?")) return;

    removeItem(D.family, id);
    saveData();
    renderFamily();
  };

  function renderFamily() {
    const el = clearDynamic("family");
    if (!el) return;

    addDynamic("family", `
      <div style="padding:12px">

        <button onclick="openFamilyForm()">
          ＋ Add Family Member
        </button>

        ${
          D.family.length
            ? D.family.map(f => `
              <div style="
                margin-top:10px;
                padding:14px;
                border:1px solid #eee;
                border-radius:15px;
              ">
                <b>${esc(f.name)}</b>
                <div>${esc(f.relation)}</div>
                <small>${esc(f.phone)}</small>

                <div style="margin-top:8px">
                  <button onclick="openFamilyForm('${f.id}')">
                    Edit
                  </button>

                  <button onclick="deleteFamily('${f.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `).join("")
            : "<p>No family members.</p>"
        }

      </div>
    `);
  }

  /* ---------- FAMILY TOOLS ---------- */

  function renderFamilyTools() {
    const el = clearDynamic("familytools");
    if (!el) return;

    addDynamic("familytools", `
      <div style="padding:12px">

        <h3>Family Tools</h3>

        <button onclick="openCalculator('emergency')">
          Emergency Fund
        </button>

        <button onclick="openCalculator('fd')">
          FD Calculator
        </button>

        <button onclick="openCalculator('annual')">
          Annual Expense
        </button>

      </div>
    `);
  }

  /* ---------- TOOLS ---------- */

  function renderTools() {
    const el = clearDynamic("tools13");
    if (!el) return;

    addDynamic("tools13", `
      <div style="padding:12px">

        <h3>Money Tools</h3>

        <button onclick="openCalculator('emergency')">
          Emergency Fund Calculator
        </button>

        <button onclick="openCalculator('fd')">
          FD Calculator
        </button>

        <button onclick="openCalculator('annual')">
          Annual Expense Calculator
        </button>

        <button onclick="openCalculator('budget')">
          Budget Calculator
        </button>

        <h3>Other Records</h3>

        <button onclick="openSimpleTool('insurance')">
          Insurance
        </button>

        <button onclick="openSimpleTool('school')">
          School
        </button>

        <button onclick="openSimpleTool('vehicle')">
          Vehicle
        </button>

        <button onclick="openSimpleTool('shopping')">
          Shopping
        </button>

        <button onclick="openSimpleTool('utility')">
          Utility
        </button>

        <button onclick="openSimpleTool('document')">
          Documents
        </button>

      </div>
    `);
  }

  window.openSimpleTool = function (type) {
    const old = D.tools.find(x => x.type === type);

    modal(
      type.charAt(0).toUpperCase() + type.slice(1),
      `
        ${input("Title", old?.title || "", "text", "toolTitle")}
        ${input("Amount", old?.amount || "", "number", "toolAmount")}
        ${input("Date", old?.date || today(), "date", "toolDate")}
        ${input("Note", old?.note || "", "text", "toolNote")}
      `,
      actionButton("Save", `saveSimpleTool('${type}')`)
    );
  };

  window.saveSimpleTool = function (type) {
    const old = D.tools.find(x => x.type === type);

    const item = {
      id: old?.id || uid("tool"),
      type,
      title:
        document.getElementById("toolTitle")?.value.trim() || "",
      amount:
        num(document.getElementById("toolAmount")?.value),
      date:
        document.getElementById("toolDate")?.value || today(),
      note:
        document.getElementById("toolNote")?.value.trim() || ""
    };

    const i = findIndex(D.tools, item.id);

    if (i >= 0) D.tools[i] = item;
    else D.tools.unshift(item);

    saveData();
    closeModal();
    renderTools();
  };

  /* ---------- CALCULATORS ---------- */

  window.openCalculator = function (type) {
    let title = "Calculator";
    let body = "";

    if (type === "emergency") {
      title = "Emergency Fund";

      body = `
        ${input("Monthly Expense", "", "number", "c1")}
        ${input("Months", "6", "number", "c2")}

        <div id="calcResult" style="margin-top:12px"></div>
      `;
    }

    if (type === "fd") {
      title = "FD Calculator";

      body = `
        ${input("Principal", "", "number", "c1")}
        ${input("Annual Interest %", "", "number", "c2")}
        ${input("Years", "1", "number", "c3")}

        <div id="calcResult" style="margin-top:12px"></div>
      `;
    }

    if (type === "annual") {
      title = "Annual Expense";

      body = `
        ${input("Monthly Expense", "", "number", "c1")}

        <div id="calcResult" style="margin-top:12px"></div>
      `;
    }

    if (type === "budget") {
      title = "Budget Calculator";

      body = `
        ${input("Monthly Income", "", "number", "c1")}
        ${input("Monthly Expense", "", "number", "c2")}

        <div id="calcResult" style="margin-top:12px"></div>
      `;
    }

    modal(
      title,
      body,
      actionButton("Calculate", `calculate('${type}')`)
    );
  };

  window.calculate = function (type) {
    const a = num(
      document.getElementById("c1")?.value
    );

    const b = num(
      document.getElementById("c2")?.value
    );

    const c = num(
      document.getElementById("c3")?.value
    );

    let result = 0;

    if (type === "emergency") {
      result = a * Math.max(1, b);
    }

    if (type === "annual") {
      result = a * 12;
    }

    if (type === "budget") {
      result = a - b;
    }

    if (type === "fd") {
      result = a * Math.pow(
        1 + b / 100,
        Math.max(1, c)
      );
    }

    const el = document.getElementById("calcResult");

    if (el) {
      el.innerHTML = `
        <div style="
          padding:14px;
          border-radius:14px;
          background:#f0f7f4;
        ">
          <b>Result</b>
          <div style="font-size:22px;margin-top:6px">
            ${money(result)}
          </div>
        </div>
      `;
    }
  };

  /* ---------- GUEST GATE ---------- */

  window.showGuestGate = function () {
    /* Existing app can call this safely.
       PIN is handled separately and is never forced
       unless the user explicitly uses the security flow.
    */
    return true;
  };

  /* ---------- STARTUP ---------- */

  function startup() {
    saveData();

    const active =
      document.querySelector(".page.active, .screen.active");

    if (!active) {
      if (page("home")) show("home");
    }

    setTimeout(() => {
      if (typeof window.repairBackButtons === "function") {
        window.repairBackButtons();
      }
    }, 50);
  }

  /* ---------- GLOBAL COMPATIBILITY ---------- */

  window.D = D;
  window.save = saveData;

  window.renderHome = renderHome;
  window.renderPersonal = renderPersonal;
  window.renderBusiness = renderBusiness;
  window.renderTransactions = renderTransactions;
  window.renderPlanning = renderPlanning;
  window.renderCredit = renderCredit;
  window.renderReports = renderReports;
  window.renderReminders = renderReminders;
  window.renderPrivacy = renderPrivacy;
  window.renderFamily = renderFamily;
  window.renderFamilyTools = renderFamilyTools;
  window.renderTools = renderTools;
  window.renderSettings = renderSettings;

  window.openTransactionForm = openTransactionForm;
  window.openKhataForm = openKhataForm;
  window.openGoalForm = openGoalForm;
  window.openBillForm = openBillForm;
  window.openLoanForm = openLoanForm;
  window.openReminderForm = openReminderForm;

  window.backup = backupData;
  window.restore = restoreData;

  /* Keep state reference usable after load. */
  Object.defineProperty(window, "HISAB_DATA", {
    configurable: true,
    get: function () {
      return D;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startup);
  } else {
    startup();
  }

})();
