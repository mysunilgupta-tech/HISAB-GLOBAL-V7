(() => {
  "use strict";

  /* =========================================================
     HISAB GLOBAL V7
     Money Manager
     Personal + Business
     Local-first / No Login
     ========================================================= */

  const STORAGE_KEY = "hisab_global_v7_data";

  const DEFAULT_DATA = {
    version: 7,
    mode: "personal",

    personal: {
      income: [],
      expense: [],
      lendden: []
    },

    business: {
      income: [],
      expense: [],
      lendden: []
    },

    savings: [],
    budgets: [],
    bills: [],
    loans: [],
    goals: [],

    settings: {
      currency: "₹",
      language: "English",
      theme: "system"
    }
  };

  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uid(prefix = "id") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function nowTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function money(value) {
    const n = Number(value) || 0;
    const currency = appData.settings.currency || "₹";

    return (
      currency +
      n.toLocaleString("en-IN", {
        maximumFractionDigits: 2
      })
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

  function notify(message) {
    alert(message);
  }

  /* =========================================================
     DATA
     ========================================================= */

  function normalizeData(data) {
    const d = clone(DEFAULT_DATA);

    if (!data || typeof data !== "object") return d;

    d.version = 7;
    d.mode = data.mode === "business" ? "business" : "personal";

    ["personal", "business"].forEach((mode) => {
      if (data[mode]) {
        d[mode].income = Array.isArray(data[mode].income)
          ? data[mode].income
          : [];

        d[mode].expense = Array.isArray(data[mode].expense)
          ? data[mode].expense
          : [];

        d[mode].lendden = Array.isArray(data[mode].lendden)
          ? data[mode].lendden
          : [];
      }
    });

    ["savings", "budgets", "bills", "loans", "goals"].forEach((key) => {
      d[key] = Array.isArray(data[key]) ? data[key] : [];
    });

    d.settings = {
      ...d.settings,
      ...(data.settings || {})
    };

    return d;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return clone(DEFAULT_DATA);

      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.error("HISAB load error:", error);
      return clone(DEFAULT_DATA);
    }
  }

  let appData = loadData();

  function saveData() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
      );
      return true;
    } catch (error) {
      console.error("HISAB save error:", error);
      notify("Data save nahi ho paya.");
      return false;
    }
  }

  function account() {
    return appData[appData.mode];
  }

  /* =========================================================
     MODAL SYSTEM
     index.html ko change kiye bina modal banega
     ========================================================= */

  let modalHost = null;

  function createModalHost() {
    if (modalHost) return;

    modalHost = document.createElement("div");
    modalHost.id = "hisabModalHost";

    modalHost.innerHTML = `
      <div id="hisabModalOverlay"
           style="
             position:fixed;
             inset:0;
             background:rgba(0,0,0,.55);
             z-index:9999;
             display:none;
             overflow:auto;
             padding:16px;
             box-sizing:border-box;
           ">
        <div id="hisabModal"
             style="
               max-width:520px;
               margin:20px auto;
               background:#fff;
               border-radius:20px;
               overflow:hidden;
               box-shadow:0 20px 60px rgba(0,0,0,.25);
             ">
          <div id="hisabModalHeader"
               style="
                 display:flex;
                 align-items:center;
                 justify-content:space-between;
                 padding:16px 18px;
                 border-bottom:1px solid #eee;
                 position:sticky;
                 top:0;
                 background:#fff;
                 z-index:2;
               ">
            <strong id="hisabModalTitle"
                    style="font-size:19px;">
            </strong>

            <button id="hisabModalClose"
                    type="button"
                    style="
                      border:0;
                      background:#f1f3f5;
                      width:38px;
                      height:38px;
                      border-radius:50%;
                      font-size:20px;
                    ">
              ×
            </button>
          </div>

          <div id="hisabModalBody"
               style="padding:18px;">
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalHost);

    $("hisabModalClose").addEventListener(
      "click",
      closeModal
    );

    $("hisabModalOverlay").addEventListener(
      "click",
      (event) => {
        if (event.target.id === "hisabModalOverlay") {
          closeModal();
        }
      }
    );
  }

  function openModal(title, html) {
    createModalHost();

    $("hisabModalTitle").textContent = title;
    $("hisabModalBody").innerHTML = html;
    $("hisabModalOverlay").style.display = "block";

    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!$("hisabModalOverlay")) return;

    $("hisabModalOverlay").style.display = "none";
    $("hisabModalBody").innerHTML = "";

    document.body.style.overflow = "";
  }

  /* =========================================================
     FORM HELPERS
     ========================================================= */

  function input(
    id,
    label,
    type = "text",
    value = "",
    extra = ""
  ) {
    return `
      <label style="display:block;margin-bottom:13px;">
        <span style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        ">${escapeHTML(label)}</span>

        <input
          id="${id}"
          type="${type}"
          value="${escapeHTML(value)}"
          ${extra}
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #d9dde3;
            border-radius:10px;
            font-size:15px;
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
      <label style="display:block;margin-bottom:13px;">
        <span style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        ">${escapeHTML(label)}</span>

        <select
          id="${id}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #d9dde3;
            border-radius:10px;
            font-size:15px;
            background:#fff;
          "
        >
          ${options.map((o) => `
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

  function textareaField(id, label, value = "") {
    return `
      <label style="display:block;margin-bottom:13px;">
        <span style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        ">${escapeHTML(label)}</span>

        <textarea
          id="${id}"
          rows="3"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #d9dde3;
            border-radius:10px;
            font-size:15px;
            resize:vertical;
          "
        >${escapeHTML(value)}</textarea>
      </label>
    `;
  }

  function colorField(id, value = "#0b1f33") {
    return `
      <label style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:10px 0;
      ">
        <span style="font-weight:600;">
          Entry Color
        </span>

        <input
          id="${id}"
          type="color"
          value="${escapeHTML(value)}"
          style="
            width:55px;
            height:38px;
            border:0;
            background:none;
          "
        >
      </label>
    `;
  }

  function formButtons(saveText = "Save") {
    return `
      <div style="
        display:flex;
        gap:10px;
        margin-top:18px;
      ">
        <button
          type="button"
          id="hisabSaveBtn"
          style="
            flex:1;
            border:0;
            padding:13px;
            border-radius:11px;
            background:#0b1f33;
            color:#fff;
            font-weight:700;
            font-size:15px;
          "
        >
          ${escapeHTML(saveText)}
        </button>

        <button
          type="button"
          id="hisabCancelBtn"
          style="
            flex:1;
            border:1px solid #ddd;
            padding:13px;
            border-radius:11px;
            background:#fff;
            font-weight:600;
            font-size:15px;
          "
        >
          Cancel
        </button>
      </div>
    `;
  }

  function bindForm(saveFunction) {
    $("hisabSaveBtn").addEventListener(
      "click",
      saveFunction
    );

    $("hisabCancelBtn").addEventListener(
      "click",
      closeModal
    );
  }

  /* =========================================================
     HOME
     ========================================================= */

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const target = $(id);

    if (target) {
      target.classList.add("active");
    }
  }

  function updateModeButtons() {
    const personal = $("personalBtn");
    const business = $("businessBtn");

    if (personal) {
      personal.classList.toggle(
        "active",
        appData.mode === "personal"
      );
    }

    if (business) {
      business.classList.toggle(
        "active",
        appData.mode === "business"
      );
    }
  }

  function getTotals() {
    const acc = account();

    const income = acc.income.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const expense = acc.expense.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const given = acc.lendden
      .filter((x) => x.type === "given")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const received = acc.lendden
      .filter((x) => x.type === "received")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    return {
      income,
      expense,
      given,
      received,
      balance: income - expense - given + received
    };
  }

  function updateHome() {
    const totals = getTotals();

    if ($("currencyLabel")) {
      $("currencyLabel").textContent =
        appData.settings.currency;
    }

    if ($("totalBalance")) {
      $("totalBalance").textContent =
        money(totals.balance);
    }

    if ($("totalIncome")) {
      $("totalIncome").textContent =
        money(totals.income);
    }

    if ($("totalExpense")) {
      $("totalExpense").textContent =
        money(totals.expense);
    }

    updateModeButtons();
    renderRecentActivity();
  }

  function renderRecentActivity() {
    const box = $("recentActivity");

    if (!box) return;

    const acc = account();

    const all = [
      ...acc.income.map((x) => ({
        ...x,
        categoryType: "income"
      })),

      ...acc.expense.map((x) => ({
        ...x,
        categoryType: "expense"
      })),

      ...acc.lendden.map((x) => ({
        ...x,
        categoryType: x.type
      }))
    ]
      .sort((a, b) => {
        return String(b.createdAt || "").localeCompare(
          String(a.createdAt || "")
        );
      })
      .slice(0, 5);

    if (!all.length) {
      box.innerHTML = `
        <div class="empty-state">
          <div>💰</div>
          <strong>No transactions yet</strong>
          <p>Add your first income or expense.</p>
        </div>
      `;

      return;
    }

    box.innerHTML = all
      .map((item) => {
        let sign = "+";
        let icon = "💰";

        if (item.categoryType === "expense") {
          sign = "-";
          icon = "💸";
        }

        if (item.categoryType === "given") {
          sign = "-";
          icon = "🤝";
        }

        if (item.categoryType === "received") {
          sign = "+";
          icon = "🤝";
        }

        return `
          <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:12px 4px;
            border-bottom:1px solid #eee;
          ">
            <div>
              <strong>
                ${icon}
                ${escapeHTML(item.title || item.person || "Entry")}
              </strong>
              <small style="display:block;color:#777;">
                ${escapeHTML(item.date || "")}
                ${item.time ? " • " + escapeHTML(item.time) : ""}
              </small>
            </div>

            <strong>
              ${sign}${money(item.amount)}
            </strong>
          </div>
        `;
      })
      .join("");
  }

  /* =========================================================
     INCOME
     ========================================================= */

  function showIncome() {
    openModal(
      "Add Income",
      `
        ${input("incomeTitle", "Income Source / Title", "text", "")}

        ${input(
          "incomeAmount",
          "Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${selectField(
          "incomeMethod",
          "Payment Method",
          [
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank", label: "Bank Transfer" },
            { value: "card", label: "Card" },
            { value: "other", label: "Other" }
          ],
          "cash"
        )}

        ${input(
          "incomeDate",
          "Date",
          "date",
          today()
        )}

        ${textareaField(
          "incomeNote",
          "Note"
        )}

        ${colorField(
          "incomeColor",
          "#16a34a"
        )}

        ${formButtons("Save Income")}
      `
    );

    bindForm(() => {
      const title = $("incomeTitle").value.trim();
      const amount = Number($("incomeAmount").value);

      if (!title) {
        notify("Income source enter karo.");
        return;
      }

      if (!(amount > 0)) {
        notify("Valid amount enter karo.");
        return;
      }

      account().income.push({
        id: uid("income"),
        title,
        amount,
        method: $("incomeMethod").value,
        date: $("incomeDate").value || today(),
        time: nowTime(),
        note: $("incomeNote").value.trim(),
        color: $("incomeColor").value,
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     EXPENSE
     ========================================================= */

  function showExpense() {
    openModal(
      "Add Expense",
      `
        ${input("expenseTitle", "Expense / Category", "text", "")}

        ${input(
          "expenseAmount",
          "Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${selectField(
          "expenseMethod",
          "Payment Method",
          [
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank", label: "Bank Transfer" },
            { value: "card", label: "Card" },
            { value: "other", label: "Other" }
          ],
          "cash"
        )}

        ${input(
          "expenseDate",
          "Date",
          "date",
          today()
        )}

        ${textareaField(
          "expenseNote",
          "Note"
        )}

        ${colorField(
          "expenseColor",
          "#dc2626"
        )}

        ${formButtons("Save Expense")}
      `
    );

    bindForm(() => {
      const title = $("expenseTitle").value.trim();
      const amount = Number($("expenseAmount").value);

      if (!title) {
        notify("Expense title enter karo.");
        return;
      }

      if (!(amount > 0)) {
        notify("Valid amount enter karo.");
        return;
      }

      account().expense.push({
        id: uid("expense"),
        title,
        amount,
        method: $("expenseMethod").value,
        date: $("expenseDate").value || today(),
        time: nowTime(),
        note: $("expenseNote").value.trim(),
        color: $("expenseColor").value,
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     PAISA LEN-DEN
     ========================================================= */

  function showLendDen() {
    const acc = account();

    const given = acc.lendden
      .filter((x) => x.type === "given")
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    const received = acc.lendden
      .filter((x) => x.type === "received")
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    openModal(
      "Paisa Len-Den",
      `
        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          margin-bottom:16px;
        ">
          <div style="
            padding:13px;
            border-radius:12px;
            background:#fff4f4;
          ">
            <small>Total Diya</small>
            <strong style="display:block;">
              ${money(given)}
            </strong>
          </div>

          <div style="
            padding:13px;
            border-radius:12px;
            background:#f1fff5;
          ">
            <small>Total Liya</small>
            <strong style="display:block;">
              ${money(received)}
            </strong>
          </div>
        </div>

        ${selectField(
          "lendType",
          "Transaction Type",
          [
            { value: "given", label: "💸 Paisa Diya" },
            { value: "received", label: "💰 Paisa Liya" }
          ],
          "given"
        )}

        ${input(
          "lendPerson",
          "Person Name",
          "text"
        )}

        ${input(
          "lendAmount",
          "Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${input(
          "lendDate",
          "Date",
          "date",
          today()
        )}

        ${textareaField(
          "lendNote",
          "Note"
        )}

        ${selectField(
          "lendMethod",
          "Payment Method",
          [
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank", label: "Bank Transfer" },
            { value: "card", label: "Card" },
            { value: "other", label: "Other" }
          ],
          "cash"
        )}

        ${colorField(
          "lendColor",
          "#7c3aed"
        )}

        ${formButtons("Save Len-Den")}

        <hr style="margin:22px 0;">

        <div style="font-weight:700;margin-bottom:8px;">
          Recent Len-Den
        </div>

        <div>
          ${
            acc.lendden.length
              ? acc.lendden
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map(
                    (x) => `
                      <div style="
                        padding:10px 0;
                        border-bottom:1px solid #eee;
                      ">
                        <strong>
                          ${
                            x.type === "given"
                              ? "💸 Diya"
                              : "💰 Liya"
                          }
                          — ${escapeHTML(x.person)}
                        </strong>

                        <div>
                          ${money(x.amount)}
                        </div>

                        <small style="color:#777;">
                          ${escapeHTML(x.date || "")}
                          ${
                            x.note
                              ? " • " +
                                escapeHTML(x.note)
                              : ""
                          }
                        </small>
                      </div>
                    `
                  )
                  .join("")
              : `<small>No Len-Den entries.</small>`
          }
        </div>
      `
    );

    bindForm(() => {
      const person = $("lendPerson").value.trim();
      const amount = Number($("lendAmount").value);

      if (!person) {
        notify("Person name enter karo.");
        return;
      }

      if (!(amount > 0)) {
        notify("Valid amount enter karo.");
        return;
      }

      acc.lendden.push({
        id: uid("lend"),
        type: $("lendType").value,
        person,
        amount,
        date: $("lendDate").value || today(),
        time: nowTime(),
        note: $("lendNote").value.trim(),
        method: $("lendMethod").value,
        color: $("lendColor").value,
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     SAVINGS
     ========================================================= */

  function showSavings() {
    openModal(
      "Savings",
      `
        ${input(
          "savingTitle",
          "Savings Name",
          "text"
        )}

        ${input(
          "savingAmount",
          "Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${selectField(
          "savingMethod",
          "Payment Method",
          [
            { value: "cash", label: "Cash" },
            { value: "bank", label: "Bank" },
            { value: "upi", label: "UPI" },
            { value: "other", label: "Other" }
          ],
          "bank"
        )}

        ${input(
          "savingDate",
          "Date",
          "date",
          today()
        )}

        ${textareaField(
          "savingNote",
          "Note"
        )}

        ${colorField(
          "savingColor",
          "#0891b2"
        )}

        ${formButtons("Save Savings")}
      `
    );

    bindForm(() => {
      const title = $("savingTitle").value.trim();
      const amount = Number($("savingAmount").value);

      if (!title || !(amount > 0)) {
        notify("Savings name aur valid amount enter karo.");
        return;
      }

      appData.savings.push({
        id: uid("saving"),
        mode: appData.mode,
        title,
        amount,
        method: $("savingMethod").value,
        date: $("savingDate").value || today(),
        note: $("savingNote").value.trim(),
        color: $("savingColor").value,
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     BUDGET
     ========================================================= */

  function showBudget() {
    const currentMonth =
      new Date().toISOString().slice(0, 7);

    const budgets = appData.budgets.filter(
      (x) =>
        x.mode === appData.mode ||
        !x.mode
    );

    openModal(
      "Budget",
      `
        ${input(
          "budgetName",
          "Budget Name",
          "text",
          "Monthly Budget"
        )}

        ${input(
          "budgetAmount",
          "Budget Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${input(
          "budgetMonth",
          "Month",
          "month",
          currentMonth
        )}

        ${selectField(
          "budgetMethod",
          "Payment Tracking",
          [
            { value: "all", label: "All Payment Methods" },
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank", label: "Bank" },
            { value: "card", label: "Card" }
          ],
          "all"
        )}

        ${formButtons("Save Budget")}

        <hr style="margin:22px 0;">

        <strong>Saved Budgets</strong>

        <div style="margin-top:10px;">
          ${
            budgets.length
              ? budgets
                  .slice()
                  .reverse()
                  .map(
                    (b) => `
                      <div style="
                        padding:10px 0;
                        border-bottom:1px solid #eee;
                      ">
                        <strong>
                          ${escapeHTML(b.name)}
                        </strong>

                        <div>
                          ${money(b.amount)}
                          • ${escapeHTML(b.month)}
                        </div>

                        <small>
                          Payment:
                          ${escapeHTML(b.method)}
                        </small>
                      </div>
                    `
                  )
                  .join("")
              : "<small>No budget yet.</small>"
          }
        </div>
      `
    );

    bindForm(() => {
      const name = $("budgetName").value.trim();
      const amount = Number($("budgetAmount").value);

      if (!name || !(amount > 0)) {
        notify("Budget name aur amount enter karo.");
        return;
      }

      appData.budgets.push({
        id: uid("budget"),
        mode: appData.mode,
        name,
        amount,
        month: $("budgetMonth").value || currentMonth,
        method: $("budgetMethod").value,
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function showBills() {
    openModal(
      "Bills & Payments",
      `
        ${input(
          "billName",
          "Bill Name",
          "text"
        )}

        ${input(
          "billAmount",
          "Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${input(
          "billDue",
          "Due Date",
          "date",
          today()
        )}

        ${selectField(
          "billStatus",
          "Status",
          [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" }
          ],
          "pending"
        )}

        ${selectField(
          "billMethod",
          "Payment Method",
          [
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank", label: "Bank" },
            { value: "card", label: "Card" },
            { value: "other", label: "Other" }
          ],
          "upi"
        )}

        ${textareaField(
          "billNote",
          "Note"
        )}

        ${formButtons("Save Bill")}

        <hr style="margin:22px 0;">

        <strong>Saved Bills</strong>

        <div style="margin-top:10px;">
          ${
            appData.bills.length
              ? appData.bills
                  .slice()
                  .reverse()
                  .map(
                    (b) => `
                      <div style="
                        padding:11px 0;
                        border-bottom:1px solid #eee;
                      ">
                        <strong>
                          ${escapeHTML(b.name)}
                        </strong>

                        <div>
                          ${money(b.amount)}
                          • Due ${escapeHTML(b.dueDate)}
                        </div>

                        <small>
                          ${b.status === "paid"
                            ? "✅ Paid"
                            : "⏳ Pending"}
                        </small>
                      </div>
                    `
                  )
                  .join("")
              : "<small>No bills added.</small>"
          }
        </div>
      `
    );

    bindForm(() => {
      const name = $("billName").value.trim();
      const amount = Number($("billAmount").value);

      if (!name || !(amount > 0)) {
        notify("Bill name aur valid amount enter karo.");
        return;
      }

      appData.bills.push({
        id: uid("bill"),
        mode: appData.mode,
        name,
        amount,
        dueDate: $("billDue").value || today(),
        status: $("billStatus").value,
        method: $("billMethod").value,
        note: $("billNote").value.trim(),
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     LOANS & EMI
     ========================================================= */

  function showLoans() {
    openModal(
      "Loans & EMI",
      `
        ${input(
          "loanName",
          "Loan / Finance Name",
          "text"
        )}

        ${input(
          "loanPrincipal",
          "Loan Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${input(
          "loanEMI",
          "Monthly EMI",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${input(
          "loanDue",
          "Next EMI Due Date",
          "date",
          today()
        )}

        ${input(
          "loanTenure",
          "Tenure (Months)",
          "number",
          "",
          'min="1" step="1"'
        )}

        ${selectField(
          "loanStatus",
          "Status",
          [
            { value: "active", label: "Active" },
            { value: "paid", label: "Paid" }
          ],
          "active"
        )}

        ${selectField(
          "loanMethod",
          "Payment Method",
          [
            { value: "auto", label: "Auto Debit" },
            { value: "bank", label: "Bank" },
            { value: "upi", label: "UPI" },
            { value: "cash", label: "Cash" },
            { value: "other", label: "Other" }
          ],
          "auto"
        )}

        ${textareaField(
          "loanNote",
          "Note"
        )}

        ${formButtons("Save Loan / EMI")}

        <hr style="margin:22px 0;">

        <strong>Loans</strong>

        <div style="margin-top:10px;">
          ${
            appData.loans.length
              ? appData.loans
                  .slice()
                  .reverse()
                  .map(
                    (l) => `
                      <div style="
                        padding:11px 0;
                        border-bottom:1px solid #eee;
                      ">
                        <strong>
                          ${escapeHTML(l.name)}
                        </strong>

                        <div>
                          EMI ${money(l.emi)}
                          • Due ${escapeHTML(l.dueDate)}
                        </div>

                        <small>
                          ${escapeHTML(l.status)}
                          • ${escapeHTML(l.tenure)} months
                        </small>
                      </div>
                    `
                  )
                  .join("")
              : "<small>No loans added.</small>"
          }
        </div>
      `
    );

    bindForm(() => {
      const name = $("loanName").value.trim();
      const principal =
        Number($("loanPrincipal").value);

      const emi = Number($("loanEMI").value);

      if (
        !name ||
        !(principal > 0) ||
        !(emi > 0)
      ) {
        notify("Loan details complete karo.");
        return;
      }

      appData.loans.push({
        id: uid("loan"),
        mode: appData.mode,
        name,
        principal,
        emi,
        dueDate:
          $("loanDue").value || today(),
        tenure:
          Number($("loanTenure").value) || 0,
        status: $("loanStatus").value,
        method: $("loanMethod").value,
        note: $("loanNote").value.trim(),
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     GOALS
     ========================================================= */

  function showGoals() {
    openModal(
      "Goals & Savings",
      `
        ${input(
          "goalName",
          "Goal Name",
          "text"
        )}

        ${selectField(
          "goalPurpose",
          "Goal Purpose",
          [
            {
              value: "emergency",
              label: "Emergency Fund"
            },
            {
              value: "home",
              label: "Home"
            },
            {
              value: "car",
              label: "Car / Vehicle"
            },
            {
              value: "education",
              label: "Education"
            },
            {
              value: "travel",
              label: "Travel"
            },
            {
              value: "wedding",
              label: "Wedding"
            },
            {
              value: "business",
              label: "Business"
            },
            {
              value: "investment",
              label: "Investment"
            },
            {
              value: "other",
              label: "Other"
            }
          ],
          "emergency"
        )}

        ${input(
          "goalTarget",
          "Target Amount",
          "number",
          "",
          'min="0" step="0.01"'
        )}

        ${input(
          "goalSaved",
          "Already Saved",
          "number",
          "0",
          'min="0" step="0.01"'
        )}

        ${input(
          "goalDate",
          "Target Date",
          "date",
          today()
        )}

        ${textareaField(
          "goalNote",
          "Note"
        )}

        ${colorField(
          "goalColor",
          "#f59e0b"
        )}

        ${formButtons("Save Goal")}

        <hr style="margin:22px 0;">

        <strong>Your Goals</strong>

        <div style="margin-top:10px;">
          ${
            appData.goals.length
              ? appData.goals
                  .slice()
                  .reverse()
                  .map((g) => {
                    const target =
                      Number(g.target) || 0;

                    const saved =
                      Number(g.saved) || 0;

                    const percent =
                      target > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (saved / target) *
                                100
                            )
                          )
                        : 0;

                    return `
                      <div style="
                        padding:12px 0;
                        border-bottom:1px solid #eee;
                      ">
                        <strong>
                          🎯 ${escapeHTML(g.name)}
                        </strong>

                        <div>
                          ${money(saved)}
                          / ${money(target)}
                        </div>

                        <div style="
                          height:7px;
                          background:#eee;
                          border-radius:20px;
                          overflow:hidden;
                          margin:8px 0;
                        ">
                          <div style="
                            width:${percent}%;
                            height:100%;
                            background:${escapeHTML(g.color || "#f59e0b")};
                          "></div>
                        </div>

                        <small>
                          ${escapeHTML(g.purpose)}
                          • ${percent}% complete
                        </small>
                      </div>
                    `;
                  })
                  .join("")
              : "<small>No goals added.</small>"
          }
        </div>
      `
    );

    bindForm(() => {
      const name = $("goalName").value.trim();
      const target = Number($("goalTarget").value);

      if (!name || !(target > 0)) {
        notify("Goal name aur target amount enter karo.");
        return;
      }

      appData.goals.push({
        id: uid("goal"),
        mode: appData.mode,
        name,
        purpose: $("goalPurpose").value,
        target,
        saved:
          Number($("goalSaved").value) || 0,
        targetDate:
          $("goalDate").value || today(),
        note: $("goalNote").value.trim(),
        color: $("goalColor").value,
        createdAt: new Date().toISOString()
      });

      saveData();
      closeModal();
      updateHome();
    });
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function showTransactions() {
    const acc = account();

    const transactions = [
      ...acc.income.map((x) => ({
        ...x,
        kind: "Income",
        sign: "+"
      })),

      ...acc.expense.map((x) => ({
        ...x,
        kind: "Expense",
        sign: "-"
      })),

      ...acc.lendden.map((x) => ({
        ...x,
        kind:
          x.type === "given"
            ? "Given"
            : "Received",
        title: x.person,
        sign:
          x.type === "given"
            ? "-"
            : "+"
      }))
    ].sort((a, b) =>
      String(b.createdAt || "").localeCompare(
        String(a.createdAt || "")
      )
    );

    openModal(
      "Transactions",
      `
        ${
          transactions.length
            ? transactions
                .map(
                  (x) => `
                    <div style="
                      padding:12px 0;
                      border-bottom:1px solid #eee;
                    ">
                      <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:10px;
                      ">
                        <strong>
                          ${escapeHTML(
                            x.title ||
                              x.person ||
                              "Transaction"
                          )}
                        </strong>

                        <strong>
                          ${x.sign}${money(x.amount)}
                        </strong>
                      </div>

                      <small style="color:#777;">
                        ${escapeHTML(x.kind)}
                        • ${escapeHTML(x.date || "")}
                        ${
                          x.method
                            ? " • " +
                              escapeHTML(x.method)
                            : ""
                        }
                      </small>

                      ${
                        x.note
                          ? `<div style="margin-top:4px;">
                               ${escapeHTML(x.note)}
                             </div>`
                          : ""
                      }
                    </div>
                  `
                )
                .join("")
            : `
              <div style="
                text-align:center;
                padding:30px 10px;
                color:#777;
              ">
                No transactions found.
              </div>
            `
        }

        <button
          type="button"
          id="clearTransactionsBtn"
          style="
            width:100%;
            margin-top:18px;
            padding:12px;
            border:1px solid #dc2626;
            color:#dc2626;
            background:#fff;
            border-radius:10px;
            font-weight:700;
          "
        >
          Clear Current Mode Transactions
        </button>
      `
    );

    $("clearTransactionsBtn").addEventListener(
      "click",
      () => {
        if (
          confirm(
            "Current mode ki income, expense aur Len-Den entries delete karni hain?"
          )
        ) {
          acc.income = [];
          acc.expense = [];
          acc.lendden = [];

          saveData();
          closeModal();
          updateHome();
        }
      }
    );
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function showReports() {
    const totals = getTotals();
    const acc = account();

    const incomeCount = acc.income.length;
    const expenseCount = acc.expense.length;
    const lendCount = acc.lendden.length;

    const savingsTotal =
      appData.savings
        .filter(
          (x) =>
            x.mode === appData.mode
        )
        .reduce(
          (sum, x) =>
            sum + Number(x.amount || 0),
          0
        );

    const pendingBills =
      appData.bills
        .filter(
          (x) =>
            x.mode === appData.mode &&
            x.status === "pending"
        )
        .reduce(
          (sum, x) =>
            sum + Number(x.amount || 0),
          0
        );

    const activeEMI =
      appData.loans
        .filter(
          (x) =>
            x.mode === appData.mode &&
            x.status === "active"
        )
        .reduce(
          (sum, x) =>
            sum + Number(x.emi || 0),
          0
        );

    openModal(
      "Reports & Analytics",
      `
        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">
          ${reportCard(
            "Balance",
            money(totals.balance)
          )}

          ${reportCard(
            "Income",
            money(totals.income)
          )}

          ${reportCard(
            "Expense",
            money(totals.expense)
          )}

          ${reportCard(
            "Given",
            money(totals.given)
          )}

          ${reportCard(
            "Received",
            money(totals.received)
          )}

          ${reportCard(
            "Savings",
            money(savingsTotal)
          )}

          ${reportCard(
            "Pending Bills",
            money(pendingBills)
          )}

          ${reportCard(
            "Monthly EMI",
            money(activeEMI)
          )}
        </div>

        <hr style="margin:20px 0;">

        <div style="line-height:1.9;">
          <strong>Activity Summary</strong>

          <div>Income entries: ${incomeCount}</div>
          <div>Expense entries: ${expenseCount}</div>
          <div>Len-Den entries: ${lendCount}</div>
          <div>Goals: ${
            appData.goals.filter(
              (x) =>
                x.mode === appData.mode
            ).length
          }</div>
          <div>Bills: ${
            appData.bills.filter(
              (x) =>
                x.mode === appData.mode
            ).length
          }</div>
          <div>Loans: ${
            appData.loans.filter(
              (x) =>
                x.mode === appData.mode
            ).length
          }</div>
        </div>
      `
    );
  }

  function reportCard(title, value) {
    return `
      <div style="
        padding:14px;
        background:#f7f8fa;
        border-radius:12px;
      ">
        <small style="color:#777;">
          ${escapeHTML(title)}
        </small>

        <strong style="
          display:block;
          margin-top:4px;
          font-size:17px;
        ">
          ${escapeHTML(value)}
        </strong>
      </div>
    `;
  }

  /* =========================================================
     BACKUP & RESTORE
     ========================================================= */

  function showBackup() {
    openModal(
      "Backup & Restore",
      `
        <p style="color:#666;">
          Apna HISAB data phone me backup file ke
          roop me save karo aur baad me restore karo.
        </p>

        <button
          type="button"
          id="exportBackupBtn"
          style="
            width:100%;
            padding:13px;
            margin-bottom:10px;
            border:0;
            border-radius:11px;
            background:#0b1f33;
            color:#fff;
            font-weight:700;
          "
        >
          💾 Download Backup
        </button>

        <label style="
          display:block;
          padding:13px;
          border:1px dashed #aaa;
          border-radius:11px;
          text-align:center;
          font-weight:700;
        ">
          📂 Restore Backup

          <input
            id="restoreBackupInput"
            type="file"
            accept=".json,application/json"
            style="
              display:block;
              width:100%;
              margin-top:10px;
            "
          >
        </label>

        <button
          type="button"
          id="resetAllBtn"
          style="
            width:100%;
            padding:13px;
            margin-top:20px;
            border:1px solid #dc2626;
            border-radius:11px;
            background:#fff;
            color:#dc2626;
            font-weight:700;
          "
        >
          Delete All HISAB Data
        </button>
      `
    );

    $("exportBackupBtn").addEventListener(
      "click",
      exportBackup
    );

    $("restoreBackupInput").addEventListener(
      "change",
      restoreBackup
    );

    $("resetAllBtn").addEventListener(
      "click",
      () => {
        if (
          confirm(
            "WARNING: HISAB ka pura data delete ho jayega. Continue?"
          )
        ) {
          appData = clone(DEFAULT_DATA);
          saveData();
          closeModal();
          updateHome();
          notify("All HISAB data deleted.");
        }
      }
    );
  }

  function exportBackup() {
    const payload = {
      app: "HISAB",
      version: 7,
      exportedAt:
        new Date().toISOString(),
      data: appData
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
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
      "HISAB-Backup-" +
      today() +
      ".json";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function restoreBackup(event) {
    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed =
          JSON.parse(reader.result);

        const restored =
          parsed.data || parsed;

        if (
          !restored ||
          typeof restored !== "object"
        ) {
          throw new Error("Invalid backup");
        }

        if (
          !confirm(
            "Current HISAB data replace karke backup restore karna hai?"
          )
        ) {
          return;
        }

        appData =
          normalizeData(restored);

        saveData();
        closeModal();
        updateHome();

        notify(
          "Backup successfully restored."
        );
      } catch (error) {
        console.error(error);
        notify(
          "Backup file valid nahi hai."
        );
      }
    };

    reader.readAsText(file);
  }

  /* =========================================================
     SECURITY
     ========================================================= */

  function showSecurity() {
    openModal(
      "Security",
      `
        <div style="
          padding:14px;
          background:#f7f8fa;
          border-radius:12px;
          margin-bottom:16px;
        ">
          <strong>🔐 Local Privacy</strong>
          <p style="margin-bottom:0;color:#666;">
            HISAB ka current data device ke local
            storage me save hota hai. Login required nahi hai.
          </p>
        </div>

        <button
          type="button"
          id="securityInfoBtn"
          style="
            width:100%;
            padding:13px;
            border:1px solid #ddd;
            background:#fff;
            border-radius:10px;
            font-weight:700;
          "
        >
          Security Information
        </button>
      `
    );

    $("securityInfoBtn").addEventListener(
      "click",
      () => {
        notify(
          "HISAB V7 local-first hai. Sensitive data ko backup file share karte waqt carefully handle karein."
        );
      }
    );
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function showSettings() {
    openModal(
      "Settings",
      `
        ${selectField(
          "settingsCurrency",
          "Currency",
          [
            { value: "₹", label: "₹ Indian Rupee" },
            { value: "$", label: "$ US Dollar" },
            { value: "€", label: "€ Euro" },
            { value: "£", label: "£ British Pound" },
            { value: "¥", label: "¥ Yen / Yuan" },
            { value: "AED", label: "AED Dirham" },
            { value: "SAR", label: "SAR Riyal" }
          ],
          appData.settings.currency
        )}

        ${selectField(
          "settingsTheme",
          "Theme",
          [
            {
              value: "system",
              label: "System Default"
            },
            {
              value: "light",
              label: "Light"
            },
            {
              value: "dark",
              label: "Dark"
            }
          ],
          appData.settings.theme
        )}

        ${selectField(
          "settingsLanguage",
          "Language",
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
          appData.settings.language
        )}

        ${formButtons("Save Settings")}
      `
    );

    bindForm(() => {
      appData.settings.currency =
        $("settingsCurrency").value;

      appData.settings.theme =
        $("settingsTheme").value;

      appData.settings.language =
        $("settingsLanguage").value;

      saveData();

      applyTheme();

      closeModal();
      updateHome();
    });
  }

  function applyTheme() {
    const theme =
      appData.settings.theme;

    if (theme === "dark") {
      document.documentElement.style.colorScheme =
        "dark";
    } else if (theme === "light") {
      document.documentElement.style.colorScheme =
        "light";
    } else {
      document.documentElement.style.colorScheme =
        "normal";
    }
  }

  /* =========================================================
     BUSINESS EXTRA VIEW
     ========================================================= */

  function showBusinessInfo() {
    openModal(
      "Business Money",
      `
        <div style="display:grid;gap:10px;">

          ${businessCard(
            "🛒 Sales",
            "Business income / sales records"
          )}

          ${businessCard(
            "📦 Purchase",
            "Business purchase / expense records"
          )}

          ${businessCard(
            "👥 Customers",
            "Customer-wise Len-Den records"
          )}

          ${businessCard(
            "🚚 Suppliers",
            "Supplier-wise payment records"
          )}

          ${businessCard(
            "📊 Business Reports",
            "Income, expense and activity analytics"
          )}

        </div>

        <p style="
          margin-top:18px;
          color:#777;
          font-size:13px;
        ">
          Business mode me Income, Expense aur
          Paisa Len-Den records automatically
          separate account me save hote hain.
        </p>
      `
    );
  }

  function businessCard(title, text) {
    return `
      <div style="
        padding:14px;
        border:1px solid #eee;
        border-radius:12px;
      ">
        <strong>${escapeHTML(title)}</strong>
        <small style="
          display:block;
          color:#777;
          margin-top:4px;
        ">
          ${escapeHTML(text)}
        </small>
      </div>
    `;
  }

  /* =========================================================
     ACTION ROUTER
     Exact index.html data-action names
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
     EVENTS
     ========================================================= */

  function setupEvents() {
    document.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-action]"
          );

        if (!button) return;

        const action =
          button.getAttribute(
            "data-action"
          );

        handleAction(action);
      }
    );

    if ($("continueBtn")) {
      $("continueBtn").addEventListener(
        "click",
        () => {
          showScreen("homeScreen");
          updateHome();
        }
      );
    }

    if ($("personalBtn")) {
      $("personalBtn").addEventListener(
        "click",
        () => {
          appData.mode = "personal";
          saveData();
          updateHome();
        }
      );
    }

    if ($("businessBtn")) {
      $("businessBtn").addEventListener(
        "click",
        () => {
          appData.mode = "business";
          saveData();
          updateHome();
        }
      );
    }

    if ($("settingsBtn")) {
      $("settingsBtn").addEventListener(
        "click",
        showSettings
      );
    }

    if ($("viewAllBtn")) {
      $("viewAllBtn").addEventListener(
        "click",
        showTransactions
      );
    }
  }

  /* =========================================================
     START
     ========================================================= */

  function startApp() {
    createModalHost();
    setupEvents();
    applyTheme();
    updateHome();

    setTimeout(() => {
      if (
        $("splashScreen") &&
        $("welcomeScreen")
      ) {
        showScreen("welcomeScreen");
      }
    }, 1200);
  }

  /* =========================================================
     GLOBAL API
     ========================================================= */

  window.HISAB = {
    version: 7,

    getData() {
      return clone(appData);
    },

    save() {
      return saveData();
    },

    refresh() {
      updateHome();
    },

    open(action) {
      handleAction(action);
    },

    backup() {
      exportBackup();
    },

    reset() {
      appData = clone(DEFAULT_DATA);
      saveData();
      updateHome();
    }
  };

  /* =========================================================
     BOOT
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      { once: true }
    );
  } else {
    startApp();
  }

})();
