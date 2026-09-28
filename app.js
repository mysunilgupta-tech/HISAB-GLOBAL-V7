/* =========================================================
   HISAB V7 — STABLE APP CONTROLLER
   Compatible with current HISAB V7 index.html
   Single main JavaScript controller
   Local-first / Offline
   ========================================================= */

(function () {
  "use strict";

  const KEY = "hisab_v7_data";

  const DEFAULT = {
    mode: "personal",
    currency: "₹",
    language: "hi",

    transactions: [],
    khata: [],
    business: [],
    goals: [],
    savings: [],
    bills: [],
    loans: [],
    budget: []
  };

  /* ---------------------------------------------------------
     BASIC HELPERS
     --------------------------------------------------------- */

  function $(id) {
    return document.getElementById(id);
  }

  function all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function safeJSON(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function loadData() {
    let data = safeJSON(localStorage.getItem(KEY), null);

    if (!data) {
      data =
        safeJSON(localStorage.getItem("hisab_v7_complete"), null) ||
        safeJSON(localStorage.getItem("hisabData"), null) ||
        {};
    }

    const result = Object.assign({}, DEFAULT, data || {});

    Object.keys(DEFAULT).forEach(function (key) {
      if (Array.isArray(DEFAULT[key]) && !Array.isArray(result[key])) {
        result[key] = [];
      }
    });

    return result;
  }

  let DATA = loadData();

  function saveData() {
    const value = JSON.stringify(DATA);

    localStorage.setItem(KEY, value);

    /* Compatibility with older HISAB builds */
    localStorage.setItem("hisab_v7_complete", value);
    localStorage.setItem("hisabData", value);
  }

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function money(value) {
    const number = Number(value) || 0;

    return (
      DATA.currency +
      number.toLocaleString("en-IN", {
        maximumFractionDigits: 2
      })
    );
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function notify(message) {
    let box = $("hisabToast");

    if (!box) {
      box = document.createElement("div");
      box.id = "hisabToast";

      box.style.position = "fixed";
      box.style.left = "50%";
      box.style.bottom = "80px";
      box.style.transform = "translateX(-50%)";
      box.style.zIndex = "99999";
      box.style.background = "#082b45";
      box.style.color = "#fff";
      box.style.padding = "12px 18px";
      box.style.borderRadius = "12px";
      box.style.fontSize = "14px";
      box.style.boxShadow = "0 8px 30px rgba(0,0,0,.25)";
      box.style.display = "none";

      document.body.appendChild(box);
    }

    box.textContent = message;
    box.style.display = "block";

    clearTimeout(box._timer);

    box._timer = setTimeout(function () {
      box.style.display = "none";
    }, 1800);
  }

  /* ---------------------------------------------------------
     SCREEN / PAGE CONTROL
     --------------------------------------------------------- */

  function hideAllScreens() {
    const ids = [
      "splashScreen",
      "welcomeScreen",
      "homeScreen",
      "personalScreen",
      "businessScreen",
      "transactionScreen",
      "transactionsScreen",
      "udharScreen",
      "khataScreen",
      "goalsScreen",
      "savingsScreen",
      "budgetScreen",
      "billsScreen",
      "loansScreen",
      "reportsScreen",
      "settingsScreen",
      "moreScreen"
    ];

    ids.forEach(function (id) {
      const el = $(id);
      if (el) {
        el.style.display = "none";
        el.classList.remove("active", "show");
      }
    });

    all(
      ".screen,.page,.app-screen,.section-screen,.modal-screen"
    ).forEach(function (el) {
      if (
        el.id !== "splashScreen" &&
        el.id !== "welcomeScreen" &&
        el.id !== "homeScreen"
      ) {
        el.style.display = "none";
      }
    });
  }

  function showElement(el) {
    if (!el) return false;

    el.style.display = "";
    el.style.visibility = "visible";
    el.classList.add("active", "show");

    return true;
  }

  function showScreen(id) {
    const target = $(id);

    if (!target) return false;

    hideAllScreens();
    showElement(target);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    return true;
  }

  function showHome() {
    const home = $("homeScreen");

    if (home) {
      hideAllScreens();
      showElement(home);
      return;
    }

    /* Fallback for designs without homeScreen */
    all(
      ".screen,.page,.app-screen,.section-screen,.modal-screen"
    ).forEach(function (el) {
      el.style.display = "none";
    });

    const main = document.querySelector("main");

    if (main) {
      main.style.display = "";
    }
  }

  /* ---------------------------------------------------------
     SPLASH / WELCOME
     --------------------------------------------------------- */

  function startApp() {
    const splash = $("splashScreen");
    const welcome = $("welcomeScreen");
    const home = $("homeScreen");

    if (splash) {
      splash.style.display = "";
    }

    setTimeout(function () {
      if (welcome && !localStorage.getItem("hisab_started")) {
        hideAllScreens();
        showElement(welcome);
      } else {
        localStorage.setItem("hisab_started", "1");

        if (home) {
          hideAllScreens();
          showElement(home);
        }
      }

      renderAll();
    }, 700);
  }

  function continueToApp() {
    localStorage.setItem("hisab_started", "1");
    showHome();
    renderAll();
  }

  /* ---------------------------------------------------------
     MODE
     --------------------------------------------------------- */

  function setMode(mode) {
    DATA.mode = mode === "business" ? "business" : "personal";
    saveData();

    updateModeUI();
    renderAll();

    notify(
      DATA.mode === "business"
        ? "Business mode"
        : "Personal mode"
    );
  }

  function updateModeUI() {
    const mode = DATA.mode;

    all(
      '[data-mode="personal"],#personalMode,#personalBtn'
    ).forEach(function (el) {
      el.classList.toggle("active", mode === "personal");
      el.setAttribute("aria-selected", mode === "personal");
    });

    all(
      '[data-mode="business"],#businessMode,#businessBtn'
    ).forEach(function (el) {
      el.classList.toggle("active", mode === "business");
      el.setAttribute("aria-selected", mode === "business");
    });
  }

  /* ---------------------------------------------------------
     TRANSACTIONS
     --------------------------------------------------------- */

  function addTransaction(type, amount, note, date) {
    const value = Number(amount);

    if (!value || value <= 0) {
      notify("Enter a valid amount");
      return false;
    }

    DATA.transactions.push({
      id: uid("txn"),
      type: type === "income" ? "income" : "expense",
      amount: value,
      note: note || "",
      date: date || today(),
      mode: DATA.mode
    });

    saveData();
    renderAll();

    notify("Transaction added");
    return true;
  }

  function deleteTransaction(id) {
    DATA.transactions = DATA.transactions.filter(function (item) {
      return item.id !== id;
    });

    saveData();
    renderAll();
    notify("Transaction deleted");
  }

  /* ---------------------------------------------------------
     UDHAR / KHATA
     --------------------------------------------------------- */

  function addUdhar(
    person,
    type,
    amount,
    note,
    date,
    method
  ) {
    const value = Number(amount);

    if (!person || !String(person).trim()) {
      notify("Name required");
      return false;
    }

    if (!value || value <= 0) {
      notify("Enter a valid amount");
      return false;
    }

    DATA.khata.push({
      id: uid("udhar"),
      person: String(person).trim(),
      type: type === "receive" ? "receive" : "give",
      amount: value,
      note: note || "",
      date: date || today(),
      method: method || "Cash",
      status: "pending",
      mode: DATA.mode
    });

    saveData();
    renderAll();

    notify("Udhar entry added");
    return true;
  }

  function deleteUdhar(id) {
    DATA.khata = DATA.khata.filter(function (item) {
      return item.id !== id;
    });

    saveData();
    renderAll();

    notify("Udhar deleted");
  }

  function settleUdhar(id) {
    const item = DATA.khata.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    item.status =
      item.status === "settled"
        ? "pending"
        : "settled";

    saveData();
    renderAll();

    notify(
      item.status === "settled"
        ? "Marked settled"
        : "Marked pending"
    );
  }

  /* ---------------------------------------------------------
     GOALS
     --------------------------------------------------------- */

  function addGoal(name, target, saved) {
    const amount = Number(target);

    if (!name || !amount || amount <= 0) {
      notify("Enter goal details");
      return false;
    }

    DATA.goals.push({
      id: uid("goal"),
      name: String(name).trim(),
      target: amount,
      saved: Number(saved) || 0,
      date: today()
    });

    saveData();
    renderAll();

    notify("Goal added");
    return true;
  }

  /* ---------------------------------------------------------
     SAVINGS
     --------------------------------------------------------- */

  function addSaving(name, amount, note) {
    const value = Number(amount);

    if (!name || !value || value <= 0) {
      notify("Enter saving details");
      return false;
    }

    DATA.savings.push({
      id: uid("save"),
      name: String(name).trim(),
      amount: value,
      note: note || "",
      date: today()
    });

    saveData();
    renderAll();

    notify("Saving added");
    return true;
  }

  /* ---------------------------------------------------------
     BUDGET
     --------------------------------------------------------- */

  function addBudget(name, amount) {
    const value = Number(amount);

    if (!name || !value || value <= 0) {
      notify("Enter budget details");
      return false;
    }

    DATA.budget.push({
      id: uid("budget"),
      name: String(name).trim(),
      amount: value,
      spent: 0,
      date: today()
    });

    saveData();
    renderAll();

    notify("Budget added");
    return true;
  }

  /* ---------------------------------------------------------
     BILLS
     --------------------------------------------------------- */

  function addBill(name, amount, dueDate, status) {
    const value = Number(amount);

    if (!name || !value || value <= 0) {
      notify("Enter bill details");
      return false;
    }

    DATA.bills.push({
      id: uid("bill"),
      name: String(name).trim(),
      amount: value,
      dueDate: dueDate || today(),
      status: status || "pending"
    });

    saveData();
    renderAll();

    notify("Bill added");
    return true;
  }

  function toggleBill(id) {
    const item = DATA.bills.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    item.status =
      item.status === "paid"
        ? "pending"
        : "paid";

    saveData();
    renderAll();

    notify(
      item.status === "paid"
        ? "Bill marked paid"
        : "Bill marked pending"
    );
  }

  /* ---------------------------------------------------------
     LOANS / EMI
     --------------------------------------------------------- */

  function addLoan(
    name,
    amount,
    dueDate,
    status
  ) {
    const value = Number(amount);

    if (!name || !value || value <= 0) {
      notify("Enter loan/EMI details");
      return false;
    }

    DATA.loans.push({
      id: uid("loan"),
      name: String(name).trim(),
      amount: value,
      dueDate: dueDate || today(),
      status: status || "pending"
    });

    saveData();
    renderAll();

    notify("Loan/EMI added");
    return true;
  }

  function toggleLoan(id) {
    const item = DATA.loans.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    item.status =
      item.status === "paid"
        ? "pending"
        : "paid";

    saveData();
    renderAll();

    notify(
      item.status === "paid"
        ? "EMI marked paid"
        : "EMI marked pending"
    );
  }

  /* ---------------------------------------------------------
     SUMMARY
     --------------------------------------------------------- */

  function totals() {
    const txns = DATA.transactions.filter(function (x) {
      return !x.mode || x.mode === DATA.mode;
    });

    let income = 0;
    let expense = 0;

    txns.forEach(function (item) {
      if (item.type === "income") {
        income += Number(item.amount) || 0;
      } else {
        expense += Number(item.amount) || 0;
      }
    });

    let give = 0;
    let receive = 0;

    DATA.khata
      .filter(function (x) {
        return !x.mode || x.mode === DATA.mode;
      })
      .forEach(function (item) {
        if (item.type === "give") {
          give += Number(item.amount) || 0;
        } else {
          receive += Number(item.amount) || 0;
        }
      });

    return {
      income: income,
      expense: expense,
      balance: income - expense,
      give: give,
      receive: receive,
      netUdhar: give - receive
    };
  }

  /* ---------------------------------------------------------
     DOM TEXT UPDATES
     --------------------------------------------------------- */

  function setText(ids, value) {
    ids.forEach(function (id) {
      const el = $(id);

      if (el) {
        el.textContent = value;
      }
    });
  }

  function renderSummary() {
    const t = totals();

    setText(
      [
        "totalIncome",
        "incomeTotal",
        "homeIncome",
        "incomeAmount"
      ],
      money(t.income)
    );

    setText(
      [
        "totalExpense",
        "expenseTotal",
        "homeExpense",
        "expenseAmount"
      ],
      money(t.expense)
    );

    setText(
      [
        "balance",
        "totalBalance",
        "homeBalance",
        "balanceAmount"
      ],
      money(t.balance)
    );

    setText(
      [
        "totalGive",
        "giveTotal",
        "udharGive"
      ],
      money(t.give)
    );

    setText(
      [
        "totalReceive",
        "receiveTotal",
        "udharReceive"
      ],
      money(t.receive)
    );

    setText(
      [
        "netUdhar",
        "udharNet"
      ],
      money(t.netUdhar)
    );
  }

  /* ---------------------------------------------------------
     GENERIC LIST RENDERING
     --------------------------------------------------------- */

  function renderTransactions() {
    const containers = [
      $("transactionList"),
      $("transactionsList"),
      $("recentTransactions"),
      $("homeTransactions")
    ].filter(Boolean);

    if (!containers.length) return;

    const list = DATA.transactions
      .filter(function (x) {
        return !x.mode || x.mode === DATA.mode;
      })
      .slice()
      .reverse();

    containers.forEach(function (container) {
      container.innerHTML = "";

      if (!list.length) {
        container.innerHTML =
          '<div class="empty-state">No transactions yet</div>';
        return;
      }

      list.slice(0, 20).forEach(function (item) {
        const row = document.createElement("div");

        row.className =
          "hisab-list-row transaction-row " +
          item.type;

        const sign =
          item.type === "income" ? "+" : "-";

        row.innerHTML =
          '<div class="hisab-row-main">' +
          "<strong>" +
          (item.note || "Transaction") +
          "</strong>" +
          "<small>" +
          item.date +
          "</small>" +
          "</div>" +
          '<div class="hisab-row-amount">' +
          sign +
          money(item.amount) +
          "</div>";

        row.addEventListener("click", function () {
          if (
            confirm(
              "Delete this transaction?"
            )
          ) {
            deleteTransaction(item.id);
          }
        });

        container.appendChild(row);
      });
    });
  }

  function renderUdhar() {
    const containers = [
      $("udharList"),
      $("khataList"),
      $("lenDenList"),
      $("udharEntries")
    ].filter(Boolean);

    if (!containers.length) return;

    const list = DATA.khata
      .filter(function (x) {
        return !x.mode || x.mode === DATA.mode;
      })
      .slice()
      .reverse();

    containers.forEach(function (container) {
      container.innerHTML = "";

      if (!list.length) {
        container.innerHTML =
          '<div class="empty-state">No Udhar entries yet</div>';
        return;
      }

      list.forEach(function (item) {
        const row = document.createElement("div");

        row.className =
          "hisab-list-row udhar-row " +
          item.type;

        const label =
          item.type === "give"
            ? "Give"
            : "Receive";

        row.innerHTML =
          '<div class="hisab-row-main">' +
          "<strong>" +
          escapeHTML(item.person) +
          "</strong>" +
          "<small>" +
          label +
          " • " +
          item.date +
          (item.note
            ? " • " + escapeHTML(item.note)
            : "") +
          "</small>" +
          "</div>" +
          '<div class="hisab-row-right">' +
          '<strong class="udhar-amount">' +
          money(item.amount) +
          "</strong>" +
          '<small>' +
          (item.status || "pending") +
          "</small>" +
          "</div>";

        row.addEventListener("click", function () {
          if (
            confirm(
              "OK = Settle/Pending\nCancel = Delete"
            )
          ) {
            settleUdhar(item.id);
          } else if (
            confirm("Delete this Udhar entry?")
          ) {
            deleteUdhar(item.id);
          }
        });

        container.appendChild(row);
      });
    });
  }

  function renderGoals() {
    const containers = [
      $("goalList"),
      $("goalsList")
    ].filter(Boolean);

    containers.forEach(function (container) {
      container.innerHTML = "";

      DATA.goals.forEach(function (item) {
        const percent =
          item.target > 0
            ? Math.min(
                100,
                Math.round(
                  (Number(item.saved) /
                    Number(item.target)) *
                    100
                )
              )
            : 0;

        const row =
          document.createElement("div");

        row.className = "hisab-card";

        row.innerHTML =
          "<strong>" +
          escapeHTML(item.name) +
          "</strong>" +
          "<div>" +
          money(item.saved) +
          " / " +
          money(item.target) +
          "</div>" +
          "<div>" +
          percent +
          "%</div>";

        container.appendChild(row);
      });
    });
  }

  function renderBills() {
    const containers = [
      $("billList"),
      $("billsList")
    ].filter(Boolean);

    containers.forEach(function (container) {
      container.innerHTML = "";

      DATA.bills.forEach(function (item) {
        const row =
          document.createElement("div");

        row.className = "hisab-list-row";

        row.innerHTML =
          "<div>" +
          "<strong>" +
          escapeHTML(item.name) +
          "</strong>" +
          "<small>" +
          item.dueDate +
          "</small>" +
          "</div>" +
          "<div>" +
          money(item.amount) +
          "<br><small>" +
          item.status +
          "</small>" +
          "</div>";

        row.addEventListener("click", function () {
          toggleBill(item.id);
        });

        container.appendChild(row);
      });
    });
  }

  function renderLoans() {
    const containers = [
      $("loanList"),
      $("loansList"),
      $("emiList")
    ].filter(Boolean);

    containers.forEach(function (container) {
      container.innerHTML = "";

      DATA.loans.forEach(function (item) {
        const row =
          document.createElement("div");

        row.className = "hisab-list-row";

        row.innerHTML =
          "<div>" +
          "<strong>" +
          escapeHTML(item.name) +
          "</strong>" +
          "<small>" +
          item.dueDate +
          "</small>" +
          "</div>" +
          "<div>" +
          money(item.amount) +
          "<br><small>" +
          item.status +
          "</small>" +
          "</div>";

        row.addEventListener("click", function () {
          toggleLoan(item.id);
        });

        container.appendChild(row);
      });
    });
  }

  function renderAll() {
    updateModeUI();
    renderSummary();
    renderTransactions();
    renderUdhar();
    renderGoals();
    renderBills();
    renderLoans();
  }

  /* ---------------------------------------------------------
     HTML ESCAPE
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ---------------------------------------------------------
     BUTTON ACTIONS
     --------------------------------------------------------- */

  function action(name) {
    switch (name) {
      case "home":
        showHome();
        break;

      case "personal":
        setMode("personal");
        showHome();
        break;

      case "business":
        setMode("business");
        showHome();
        break;

      case "transactions":
      case "transaction":
        showScreen(
          $("transactionsScreen")
            ? "transactionsScreen"
            : "transactionScreen"
        );
        break;

      case "udhar":
      case "khata":
      case "lend":
      case "lendden":
        showScreen(
          $("udharScreen")
            ? "udharScreen"
            : "khataScreen"
        );
        break;

      case "goals":
        showScreen("goalsScreen");
        break;

      case "savings":
        showScreen("savingsScreen");
        break;

      case "budget":
        showScreen("budgetScreen");
        break;

      case "bills":
        showScreen("billsScreen");
        break;

      case "loans":
      case "emi":
        showScreen("loansScreen");
        break;

      case "reports":
      case "analytics":
        showScreen("reportsScreen");
        break;

      case "settings":
        showScreen("settingsScreen");
        break;

      case "more":
        showScreen("moreScreen");
        break;

      case "back":
        showHome();
        break;

      case "add":
      case "addtransaction":
        openAddTransaction();
        break;

      case "addudhar":
        openAddUdhar();
        break;

      default:
        return false;
    }

    return true;
  }

  /* ---------------------------------------------------------
     SIMPLE ADD FORMS
     --------------------------------------------------------- */

  function openAddTransaction() {
    const amount = prompt("Amount");

    if (amount === null) return;

    const type =
      prompt(
        "Type: income or expense",
        "expense"
      );

    const note =
      prompt("Note", "");

    addTransaction(
      String(type).toLowerCase() ===
        "income"
        ? "income"
        : "expense",
      amount,
      note,
      today()
    );
  }

  function openAddUdhar() {
    const person =
      prompt("Person name");

    if (person === null) return;

    const type =
      prompt(
        "Type: give or receive",
        "give"
      );

    const amount =
      prompt("Amount");

    if (amount === null) return;

    const note =
      prompt("Note", "");

    addUdhar(
      person,
      String(type).toLowerCase() ===
        "receive"
        ? "receive"
        : "give",
      amount,
      note,
      today(),
      "Cash"
    );
  }

  /* ---------------------------------------------------------
     DATA EXPORT / IMPORT
     --------------------------------------------------------- */

  function exportBackup() {
    const data = JSON.stringify(
      DATA,
      null,
      2
    );

    const blob = new Blob(
      [data],
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

    notify("Backup created");
  }

  function importBackup(file) {
    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = function () {
      const imported =
        safeJSON(
          reader.result,
          null
        );

      if (!imported) {
        notify("Invalid backup");
        return;
      }

      DATA = Object.assign(
        {},
        DEFAULT,
        imported
      );

      saveData();
      renderAll();

      notify("Backup restored");
    };

    reader.readAsText(file);
  }

  /* ---------------------------------------------------------
     EVENT DELEGATION
     --------------------------------------------------------- */

  function bindEvents() {
    document.addEventListener(
      "click",
      function (event) {
        const button =
          event.target.closest(
            "[data-action]"
          );

        if (!button) return;

        const name =
          button.getAttribute(
            "data-action"
          );

        action(name);
      }
    );

    document.addEventListener(
      "click",
      function (event) {
        const modeButton =
          event.target.closest(
            "[data-mode]"
          );

        if (!modeButton) return;

        const mode =
          modeButton.getAttribute(
            "data-mode"
          );

        if (
          mode === "personal" ||
          mode === "business"
        ) {
          setMode(mode);
        }
      }
    );

    /* Back buttons */
    document.addEventListener(
      "click",
      function (event) {
        const back =
          event.target.closest(
            "#backBtn,.backBtn,[data-back]"
          );

        if (!back) return;

        event.preventDefault();
        event.stopPropagation();

        showHome();
      }
    );
  }

  /* ---------------------------------------------------------
     GLOBAL API
     --------------------------------------------------------- */

  window.HISAB = {
    data: function () {
      return DATA;
    },

    save: saveData,

    home: showHome,

    screen: showScreen,

    mode: setMode,

    addTransaction: addTransaction,

    addUdhar: addUdhar,

    addGoal: addGoal,

    addSaving: addSaving,

    addBudget: addBudget,

    addBill: addBill,

    addLoan: addLoan,

    deleteTransaction: deleteTransaction,

    deleteUdhar: deleteUdhar,

    settleUdhar: settleUdhar,

    toggleBill: toggleBill,

    toggleLoan: toggleLoan,

    backup: exportBackup,

    restore: importBackup,

    render: renderAll
  };

  /* ---------------------------------------------------------
     START
     --------------------------------------------------------- */

  function init() {
    bindEvents();
    renderAll();
    startApp();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
