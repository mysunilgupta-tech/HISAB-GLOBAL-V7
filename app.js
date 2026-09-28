/* =========================================================
   HISAB V7 — STABLE CONTROLLER
   Compatible with current HISAB index.html
   No dependency on extra HTML pages
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
    budget: [],
    bills: [],
    loans: [],
    reminders: [],
    family: [],
    tools: [],

    pin: "",
    locked: false
  };

  let D = load();

  let currentKhataMode = "personal";
  let currentKhataFilter = "all";
  let currentBusinessFilter = "customer";
  let currentPerson = "";
  let editingKhataId = null;
  let editingTransactionId = null;
  let backHistory = [];


  /* =========================================================
     BASIC
     ========================================================= */

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function load() {
    try {
      const raw =
        localStorage.getItem(KEY) ||
        localStorage.getItem("hisab_v7_complete") ||
        localStorage.getItem("hisabData");

      if (!raw) return clone(DEFAULT);

      const x = JSON.parse(raw);

      return {
        ...clone(DEFAULT),
        ...x,

        transactions: Array.isArray(x.transactions) ? x.transactions : [],
        khata: Array.isArray(x.khata) ? x.khata : [],
        business: Array.isArray(x.business) ? x.business : [],
        goals: Array.isArray(x.goals) ? x.goals : [],
        savings: Array.isArray(x.savings) ? x.savings : [],
        budget: Array.isArray(x.budget) ? x.budget : [],
        bills: Array.isArray(x.bills) ? x.bills : [],
        loans: Array.isArray(x.loans) ? x.loans : [],
        reminders: Array.isArray(x.reminders) ? x.reminders : [],
        family: Array.isArray(x.family) ? x.family : [],
        tools: Array.isArray(x.tools) ? x.tools : []
      };
    } catch (e) {
      return clone(DEFAULT);
    }
  }


  function save() {
    try {
      const raw = JSON.stringify(D);

      localStorage.setItem(KEY, raw);
      localStorage.setItem("hisab_v7_complete", raw);
      localStorage.setItem("hisabData", raw);
    } catch (e) {
      console.error("HISAB save error", e);
    }
  }


  function get(id) {
    return document.getElementById(id);
  }


  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }


  function today() {
    return new Date().toISOString().slice(0, 10);
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


  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }


  function money(v) {
    return (
      D.currency +
      num(v).toLocaleString("en-IN", {
        maximumFractionDigits: 2
      })
    );
  }


  /* =========================================================
     NOTIFICATION
     ========================================================= */

  function notify(message) {
    let box = get("hisabToast");

    if (!box) {
      box = document.createElement("div");
      box.id = "hisabToast";

      box.style.cssText =
        "position:fixed;" +
        "left:16px;" +
        "right:16px;" +
        "bottom:92px;" +
        "z-index:999999;" +
        "background:#082b45;" +
        "color:#fff;" +
        "padding:13px 16px;" +
        "border-radius:14px;" +
        "font-weight:700;" +
        "text-align:center;" +
        "box-shadow:0 8px 25px rgba(0,0,0,.2);";

      document.body.appendChild(box);
    }

    box.textContent = message;

    clearTimeout(box._timer);

    box._timer = setTimeout(function () {
      if (box.parentNode) box.remove();
    }, 1800);
  }


  /* =========================================================
     SCREEN / NAVIGATION
     ========================================================= */

  function pages() {
    return document.querySelectorAll(".page.screen, #guestGate");
  }


  function showPage(id, remember) {
    const target = get(id);

    if (!target) return;

    const active = document.querySelector(
      ".page.screen.active, #guestGate.active"
    );

    if (
      remember !== false &&
      active &&
      active.id &&
      active.id !== id
    ) {
      backHistory.push(active.id);
    }

    pages().forEach(function (p) {
      p.classList.remove("active");
    });

    target.classList.add("active");

    if (id !== "guestGate") {
      const shell = get("appShell");
      if (shell) shell.style.display = "block";
    }

    renderPage(id);
  }


  window.show = function (id) {
    showPage(id, true);
  };


  window.goBack = function () {
    const previous = backHistory.pop();

    if (previous && get(previous)) {
      showPage(previous, false);
      return;
    }

    showPage("home", false);
  };


  function renderPage(id) {
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
  }


  /* =========================================================
     GUEST
     ========================================================= */

  window.showGuestGate = function () {
    const gate = get("guestGate");
    const shell = get("appShell");

    if (gate) gate.classList.add("active");
    if (shell) shell.style.display = "none";

    pages().forEach(function (p) {
      if (p.id !== "guestGate") {
        p.classList.remove("active");
      }
    });
  };


  window.enterGuestMode = function () {
    const gate = get("guestGate");
    const shell = get("appShell");

    if (gate) gate.classList.remove("active");
    if (shell) shell.style.display = "block";

    backHistory = [];

    showPage("welcome", false);
  };

  /* =========================================================
     MODE
     ========================================================= */

window.setMode = function (mode) {
  if (mode !== "personal" && mode !== "business") {
    mode = "personal";
  }

  D.mode = mode;
  save();

  backHistory = [];

  // Same old Home screen
  showPage("home", false);

  // Refresh Home according to selected mode
  renderHome();

  notify(
    mode === "personal"
      ? "Personal mode selected"
      : "Business mode selected"
  );
};
  /* =========================================================
     HOME
     ========================================================= */

  function renderHome() {
    const mode = D.mode;

    const tx = D.transactions.filter(function (x) {
      return x.mode === mode;
    });

    const income = tx
      .filter(function (x) {
        return x.type === "income";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const expense = tx
      .filter(function (x) {
        return x.type === "expense";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const khata = D.khata.filter(function (x) {
      return x.mode === mode;
    });

    const give = khata
      .filter(function (x) {
        return x.type === "give";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const receive = khata
      .filter(function (x) {
        return x.type === "receive";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const balance = income - expense;

    if (get("modeLabel")) {
      get("modeLabel").textContent =
        mode === "personal" ? "Personal" : "Business";
    }

    if (get("receivable")) {
      get("receivable").textContent = money(receive);
    }

    if (get("payable")) {
      get("payable").textContent = money(give);
    }

    if (get("homeBalance")) {
      get("homeBalance").textContent = money(balance);
    }
  }


  /* =========================================================
     LANGUAGE / CURRENCY
     ========================================================= */

  window.toggleLanguage = function () {
    D.language = D.language === "hi" ? "en" : "hi";
    save();

    notify(
      D.language === "hi"
        ? "Hindi selected"
        : "English selected"
    );
  };


  window.toggleCurrency = function () {
    const list = ["₹", "$", "€", "£"];

    let index = list.indexOf(D.currency);

    if (index < 0) index = 0;

    D.currency = list[(index + 1) % list.length];

    save();

    renderAll();

    notify("Currency: " + D.currency);
  };


  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  window.addTransaction = function () {
    const type = get("transactionType")?.value || "income";
    const amount = num(get("transactionAmount")?.value);

    const category =
      get("transactionCategory")?.value.trim() ||
      "General";

    const note =
      get("transactionNote")?.value.trim() ||
      "";

    const date =
      get("transactionDate")?.value ||
      today();

    if (!(amount > 0)) {
      notify("Amount enter karein");
      return;
    }

    if (editingTransactionId) {
      const item = D.transactions.find(function (x) {
        return x.id === editingTransactionId;
      });

      if (item) {
        item.type = type;
        item.amount = amount;
        item.category = category;
        item.note = note;
        item.date = date;
      }

      editingTransactionId = null;
      notify("Transaction updated");
    } else {
      D.transactions.unshift({
        id: uid("tx"),
        mode: D.mode,
        type: type,
        amount: amount,
        category: category,
        note: note,
        date: date
      });

      notify("Transaction saved");
    }

    save();
    clearTransactionForm();
    renderTransactions();
    renderHome();
  };


  function clearTransactionForm() {
    if (get("transactionAmount"))
      get("transactionAmount").value = "";

    if (get("transactionCategory"))
      get("transactionCategory").value = "";

    if (get("transactionNote"))
      get("transactionNote").value = "";

    if (get("transactionDate"))
      get("transactionDate").value = today();
  }


  window.editTransaction = function (id) {
    const x = D.transactions.find(function (a) {
      return a.id === id;
    });

    if (!x) return;

    editingTransactionId = id;

    if (get("transactionType"))
      get("transactionType").value = x.type;

    if (get("transactionAmount"))
      get("transactionAmount").value = x.amount;

    if (get("transactionCategory"))
      get("transactionCategory").value = x.category;

    if (get("transactionNote"))
      get("transactionNote").value = x.note || "";

    if (get("transactionDate"))
      get("transactionDate").value = x.date || today();

    notify("Edit mode");
  };


  window.deleteTransaction = function (id) {
    if (!confirm("Delete this transaction?")) return;

    D.transactions = D.transactions.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderTransactions();
    renderHome();

    notify("Transaction deleted");
  };


  function renderTransactions() {
    const box = get("transactionList");

    if (!box) return;

    const list = D.transactions.filter(function (x) {
      return x.mode === D.mode;
    });

    if (!list.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        "<strong>No transactions yet</strong>" +
        "<p>Add Income or Expense.</p>" +
        "</div>";

      return;
    }

    box.innerHTML = list
      .map(function (x) {
        const cls =
          x.type === "income"
            ? "color:#087a56"
            : "color:#e5484d";

        return (
          '<div class="list-item" style="padding:14px;border-bottom:1px solid #e7ebf2">' +
          "<b>" +
          esc(x.category) +
          "</b>" +
          '<div style="' +
          cls +
          ';font-weight:800;margin-top:4px">' +
          (x.type === "income" ? "+" : "-") +
          money(x.amount) +
          "</div>" +
          "<small>" +
          esc(x.date || "") +
          (x.note ? " • " + esc(x.note) : "") +
          "</small>" +
          '<div style="margin-top:8px">' +
          '<button onclick="editTransaction(\'' +
          x.id +
          "')\">Edit</button> " +
          '<button onclick="deleteTransaction(\'' +
          x.id +
          "')\">Delete</button>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }


  /* =========================================================
     KHATA / UDHAR
     ========================================================= */

  window.openKhataForm = function (mode) {
    currentKhataMode = mode || D.mode;
    editingKhataId = null;

    D.mode = currentKhataMode;
    save();

    setValue("khataPerson", "");
    setValue("khataType", "give");
    setValue("khataAmount", "");
    setValue("khataDate", today());
    setValue("khataMethod", "Cash");
    setValue("khataStatus", "pending");
    setValue("khataNote", "");

    showPage("khataEntry", true);
  };


  window.closeKhataForm = function () {
    showPage(
      currentKhataMode === "business"
        ? "business"
        : "personal",
      false
    );
  };


  window.saveKhataEntry = function () {
    const person =
      get("khataPerson")?.value.trim() || "";

    const type =
      get("khataType")?.value || "give";

    const amount =
      num(get("khataAmount")?.value);

    const date =
      get("khataDate")?.value || today();

    const method =
      get("khataMethod")?.value || "Cash";

    const status =
      get("khataStatus")?.value || "pending";

    const note =
      get("khataNote")?.value.trim() || "";

    if (!person) {
      notify("Name enter karein");
      return;
    }

    if (!(amount > 0)) {
      notify("Amount enter karein");
      return;
    }

    if (editingKhataId) {
      const x = D.khata.find(function (a) {
        return a.id === editingKhataId;
      });

      if (x) {
        x.person = person;
        x.type = type;
        x.amount = amount;
        x.date = date;
        x.method = method;
        x.status = status;
        x.note = note;
      }

      notify("Udhar updated");
    } else {
      D.khata.unshift({
        id: uid("khata"),
        mode: currentKhataMode,
        person: person,
        type: type,
        amount: amount,
        date: date,
        method: method,
        status: status,
        note: note,
        history: []
      });

      notify("Udhar saved");
    }

    editingKhataId = null;

    save();

    showPage(
      currentKhataMode === "business"
        ? "business"
        : "personal",
      false
    );
  };


  function khataList(mode) {
    return D.khata.filter(function (x) {
      return x.mode === mode;
    });
  }


  function filteredKhata(mode) {
    let list = khataList(mode);

    if (currentKhataFilter !== "all") {
      list = list.filter(function (x) {
        return x.type === currentKhataFilter ||
          x.status === currentKhataFilter;
      });
    }

    const search =
      get(
        mode === "business"
          ? "businessSearch"
          : "personalSearch"
      )?.value
        .trim()
        .toLowerCase() || "";

    if (search) {
      list = list.filter(function (x) {
        return (
          String(x.person)
            .toLowerCase()
            .includes(search) ||
          String(x.note)
            .toLowerCase()
            .includes(search)
        );
      });
    }

    return list;
  }


  function renderKhata(mode) {
    const list = filteredKhata(mode);

    const box = get(
      mode === "business"
        ? "businessList"
        : "personalList"
    );

    if (!box) return;

    const all = khataList(mode);

    const give = all
      .filter(function (x) {
        return x.type === "give";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const receive = all
      .filter(function (x) {
        return x.type === "receive";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const prefix =
      mode === "business"
        ? "business"
        : "ledger";

    if (get(prefix + "Given"))
      get(prefix + "Given").textContent = money(give);

    if (get(prefix + "Received"))
      get(prefix + "Received").textContent =
        money(receive);

    if (get(prefix + "Net"))
      get(prefix + "Net").textContent =
        money(give - receive);

    if (!list.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        "<strong>No Udhar entries</strong>" +
        "<p>Add Give or Receive entry.</p>" +
        "</div>";

      return;
    }

    box.innerHTML = list
      .map(function (x) {
        const color =
          x.type === "give"
            ? "#e5484d"
            : "#087a56";

        const label =
          x.type === "give"
            ? "Give"
            : "Receive";

        return (
          '<div class="list-item" style="padding:14px;border-bottom:1px solid #e7ebf2">' +
          '<div style="display:flex;justify-content:space-between;gap:8px">' +
          "<div>" +
          "<b>" +
          esc(x.person) +
          "</b>" +
          "<br>" +
          "<small>" +
          esc(x.date || "") +
          " • " +
          esc(x.method || "Cash") +
          "</small>" +
          "</div>" +
          '<strong style="color:' +
          color +
          '">' +
          label +
          " " +
          money(x.amount) +
          "</strong>" +
          "</div>" +
          "<small>Status: " +
          esc(x.status || "pending") +
          (x.note
            ? " • " + esc(x.note)
            : "") +
          "</small>" +
          '<div style="margin-top:8px">' +
          '<button onclick="openKhataDetail(\'' +
          x.person.replace(/'/g, "\\'") +
          "','" +
          mode +
          "')\">View</button> " +
          '<button onclick="editKhata(\'' +
          x.id +
          "')\">Edit</button> " +
          '<button onclick="deleteKhata(\'' +
          x.id +
          "')\">Delete</button>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }


  window.editKhata = function (id) {
    const x = D.khata.find(function (a) {
      return a.id === id;
    });

    if (!x) return;

    editingKhataId = id;
    currentKhataMode = x.mode;

    setValue("khataPerson", x.person);
    setValue("khataType", x.type);
    setValue("khataAmount", x.amount);
    setValue("khataDate", x.date);
    setValue("khataMethod", x.method || "Cash");
    setValue("khataStatus", x.status || "pending");
    setValue("khataNote", x.note || "");

    showPage("khataEntry", true);
  };


  window.deleteKhata = function (id) {
    if (!confirm("Delete this Udhar entry?")) return;

    D.khata = D.khata.filter(function (x) {
      return x.id !== id;
    });

    save();

    renderPersonal();
    renderBusiness();

    notify("Udhar deleted");
  };


  window.searchKhata = function (mode) {
    renderKhata(mode);
  };


  window.filterKhata = function (mode, filter, btn) {
    currentKhataFilter = filter;

    renderKhata(mode);

    if (btn) {
      const parent = btn.parentElement;

      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });

        btn.classList.add("active");
      }
    }
  };


  window.openKhataDetail = function (person, mode) {
    currentPerson = person;
    currentKhataMode = mode;

    const list = khataList(mode).filter(function (x) {
      return x.person === person;
    });

    const give = list
      .filter(function (x) {
        return x.type === "give";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const receive = list
      .filter(function (x) {
        return x.type === "receive";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    setText("detailPersonName", person);
    setText("detailGive", money(give));
    setText("detailReceive", money(receive));
    setText("detailBalance", money(give - receive));

    renderKhataHistory();

    showPage("khataDetail", true);
  };


  function renderKhataHistory(filter) {
    const box = get("khataHistory");

    if (!box) return;

    let list = khataList(currentKhataMode).filter(
      function (x) {
        return x.person === currentPerson;
      }
    );

    if (filter && filter !== "all") {
      list = list.filter(function (x) {
        return (
          x.type === filter ||
          x.status === filter
        );
      });
    }

    box.innerHTML = list.length
      ? list
          .map(function (x) {
            const color =
              x.type === "give"
                ? "#e5484d"
                : "#087a56";

            return (
              '<div style="padding:12px;border-bottom:1px solid #ddd">' +
              '<b style="color:' +
              color +
              '">' +
              (x.type === "give"
                ? "Give"
                : "Receive") +
              " " +
              money(x.amount) +
              "</b><br>" +
              "<small>" +
              esc(x.date) +
              " • " +
              esc(x.method || "Cash") +
              " • " +
              esc(x.status || "pending") +
              "</small>" +
              (x.note
                ? "<br>" + esc(x.note)
                : "") +
              "</div>"
            );
          })
          .join("")
      : "<p>No history found.</p>";
  }


  window.detailFilter = function (filter, btn) {
    renderKhataHistory(filter);

    if (btn) {
      const parent = btn.parentElement;

      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });

        btn.classList.add("active");
      }
    }
  };


  window.closeKhataDetail = function () {
    showPage(
      currentKhataMode === "business"
        ? "business"
        : "personal",
      false
    );
  };


  window.openPaymentEntry = function () {
    if (!currentPerson) return;

    openKhataForm(currentKhataMode);

    setValue("khataPerson", currentPerson);
    setValue("khataType", "receive");
  };


  window.shareKhata = function () {
    const list = khataList(currentKhataMode).filter(
      function (x) {
        return x.person === currentPerson;
      }
    );

    const text =
      "HISAB - " +
      currentPerson +
      "\n\n" +
      list
        .map(function (x) {
          return (
            (x.type === "give"
              ? "Give"
              : "Receive") +
            ": " +
            money(x.amount) +
            " | " +
            x.date
          );
        })
        .join("\n");

    shareText(text);
  };


  window.exportKhataPDF = function () {
    const list = khataList(currentKhataMode).filter(
      function (x) {
        return x.person === currentPerson;
      }
    );

    const html =
      "<html><body>" +
      "<h1>HISAB</h1>" +
      "<h2>" +
      esc(currentPerson) +
      "</h2>" +
      list
        .map(function (x) {
          return (
            "<p>" +
            (x.type === "give"
              ? "Give"
              : "Receive") +
            " — " +
            money(x.amount) +
            " — " +
            esc(x.date) +
            "</p>"
          );
        })
        .join("") +
      "</body></html>";

    printDocument(html);
  };


  /* =========================================================
     PERSONAL / BUSINESS
     ========================================================= */

  function renderPersonal() {
    renderKhata("personal");
  }


  function renderBusiness() {
    renderKhata("business");

    const box = get("businessList");

    if (!box) return;

    if (currentBusinessFilter === "customer") {
      const customers = D.business.filter(function (x) {
        return (
          x.mode === "business" &&
          x.kind === "customer"
        );
      });

      if (customers.length) {
        box.innerHTML += customers
          .map(function (x) {
            return (
              '<div style="padding:12px;border-bottom:1px solid #ddd">' +
              "👤 <b>" +
              esc(x.name) +
              "</b>" +
              "</div>"
            );
          })
          .join("");
      }
    }

    if (currentBusinessFilter === "supplier") {
      const suppliers = D.business.filter(function (x) {
        return (
          x.mode === "business" &&
          x.kind === "supplier"
        );
      });

      if (suppliers.length) {
        box.innerHTML += suppliers
          .map(function (x) {
            return (
              '<div style="padding:12px;border-bottom:1px solid #ddd">' +
              "🚚 <b>" +
              esc(x.name) +
              "</b>" +
              "</div>"
            );
          })
          .join("");
      }
    }
  }


  window.businessFilter = function (type, btn) {
    currentBusinessFilter = type;

    renderBusiness();

    if (btn) {
      const parent = btn.parentElement;

      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });

        btn.classList.add("active");
      }
    }
  };


  window.addBusinessCustomer = function () {
    addBusinessPerson("customer");
  };


  window.addBusinessSupplier = function () {
    addBusinessPerson("supplier");
  };


  function addBusinessPerson(kind) {
    const name = prompt(
      kind === "customer"
        ? "Customer name"
        : "Supplier name"
    );

    if (!name || !name.trim()) return;

    D.business.unshift({
      id: uid("business"),
      mode: "business",
      kind: kind,
      name: name.trim(),
      date: today()
    });

    save();
    renderBusiness();

    notify(
      kind === "customer"
        ? "Customer added"
        : "Supplier added"
    );
  }


  /* =========================================================
     PLANNING
     ========================================================= */

  window.calcBudget = function () {
    const amount = num(
      get("budgetAmount")?.value
    );

    if (!(amount > 0)) {
      notify("Budget amount enter karein");
      return;
    }

    D.budget.unshift({
      id: uid("budget"),
      mode: D.mode,
      amount: amount,
      month: today().slice(0, 7),
      date: today()
    });

    save();

    notify("Budget saved");
  };


  window.calcGoal = function () {
    const name =
      get("goalName")?.value.trim() ||
      "";

    const target =
      num(get("goalTarget")?.value);

    const saved =
      num(get("goalSaved")?.value);

    const date =
      get("goalDate")?.value ||
      today();

    if (!name) {
      notify("Goal name enter karein");
      return;
    }

    if (!(target > 0)) {
      notify("Target amount enter karein");
      return;
    }

    D.goals.unshift({
      id: uid("goal"),
      mode: D.mode,
      name: name,
      target: target,
      saved: saved,
      date: date
    });

    save();

    renderPlanning();

    notify("Goal saved");
  };


  function renderPlanning() {
    const box = get("goalList");

    if (!box) return;

    const goals = D.goals.filter(function (x) {
      return x.mode === D.mode;
    });

    box.innerHTML = goals.length
      ? goals
          .map(function (x) {
            const percent =
              x.target > 0
                ? Math.min(
                    100,
                    Math.round(
                      (num(x.saved) /
                        num(x.target)) *
                        100
                    )
                  )
                : 0;

            return (
              '<div style="padding:14px;border-bottom:1px solid #ddd">' +
              "<b>" +
              esc(x.name) +
              "</b>" +
              "<br>" +
              money(x.saved) +
              " / " +
              money(x.target) +
              "<br>" +
              "<small>" +
              percent +
              "% • " +
              esc(x.date) +
              "</small>" +
              "</div>"
            );
          })
          .join("")
      : "<p>No goals yet.</p>";
  }


  /* =========================================================
     BILLS
     ========================================================= */

  window.addBill = function (type) {
    let name = "";
    let amount = 0;
    let due = today();

    if (type === "Credit Card") {
      name = "Credit Card";
      amount = num(get("cardBill")?.value);
      due = get("cardDue")?.value || today();
    } else {
      name =
        get("billName")?.value.trim() ||
        "Bill";

      amount =
        num(get("billAmount")?.value);

      due =
        get("billDue")?.value ||
        today();
    }

    if (!(amount > 0)) {
      notify("Bill amount enter karein");
      return;
    }

    D.bills.unshift({
      id: uid("bill"),
      mode: D.mode,
      name: name,
      amount: amount,
      due: due,
      status: "pending",
      history: [],
      created: today()
    });

    save();

    renderCredit();

    notify("Bill added");
  };


  function renderCredit() {
    const box = get("billList");

    if (!box) return;

    const bills = D.bills.filter(function (x) {
      return x.mode === D.mode;
    });

    box.innerHTML = bills.length
      ? bills
          .map(function (x) {
            return (
              '<div style="padding:14px;border-bottom:1px solid #ddd">' +
              "<b>" +
              esc(x.name) +
              "</b>" +
              "<br>" +
              money(x.amount) +
              " • Due " +
              esc(x.due) +
              "<br>" +
              "<small>Status: " +
              esc(x.status) +
              "</small>" +
              '<div style="margin-top:8px">' +
              '<button onclick="markBillPaid(\'' +
              x.id +
              "')\">Mark Paid</button> " +
              '<button onclick="deleteBill(\'' +
              x.id +
              "')\">Delete</button>" +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : "<p>No bills yet.</p>";
  }


  window.markBillPaid = function (id) {
    const x = D.bills.find(function (a) {
      return a.id === id;
    });

    if (!x) return;

    x.status = "paid";

    if (!Array.isArray(x.history))
      x.history = [];

    x.history.push({
      date: today(),
      status: "paid",
      amount: x.amount
    });

    save();

    renderCredit();

    notify("Bill marked paid");
  };


  window.deleteBill = function (id) {
    if (!confirm("Delete this bill?")) return;

    D.bills = D.bills.filter(function (x) {
      return x.id !== id;
    });

    save();
    renderCredit();

    notify("Bill deleted");
  };


  /* =========================================================
     EMI
     ========================================================= */

  window.calcEMI = function () {
    const principal =
      num(get("emiPrincipal")?.value);

    const rate =
      num(get("emiRate")?.value);

    const months =
      Math.max(
        1,
        Math.floor(
          num(get("emiMonths")?.value)
        )
      );

    if (!(principal > 0)) {
      notify("Loan amount enter karein");
      return;
    }

    let emi;

    if (rate > 0) {
      const r = rate / 12 / 100;

      emi =
        principal *
        r *
        Math.pow(1 + r, months) /
        (Math.pow(1 + r, months) - 1);
    } else {
      emi = principal / months;
    }

    if (get("emiResult")) {
      get("emiResult").innerHTML =
        '<div style="padding:14px;margin-top:12px;border-radius:14px;background:#eef8f4">' +
        "<b>Monthly EMI</b>" +
        '<div style="font-size:24px;margin-top:5px">' +
        money(emi) +
        "</div>" +
        "<small>Total payable: " +
        money(emi * months) +
        "</small>" +
        "</div>" +
        '<button style="margin-top:10px" onclick="saveLoan(' +
        principal +
        "," +
        rate +
        "," +
        months +
        "," +
        emi +
        ')">Save Loan</button>';
    }
  };


  window.saveLoan = function (
    principal,
    rate,
    months,
    emi
  ) {
    D.loans.unshift({
      id: uid("loan"),
      mode: D.mode,
      principal: num(principal),
      rate: num(rate),
      months: num(months),
      emi: num(emi),
      paid: 0,
      status: "pending",
      date: today(),
      history: []
    });

    save();

    notify("Loan saved");
  };


  /* =========================================================
     REPORTS
     ========================================================= */

  function renderReports() {
    const tx = D.transactions.filter(function (x) {
      return x.mode === D.mode;
    });

    const income = tx
      .filter(function (x) {
        return x.type === "income";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const expense = tx
      .filter(function (x) {
        return x.type === "expense";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const khata = D.khata.filter(function (x) {
      return x.mode === D.mode;
    });

    const give = khata
      .filter(function (x) {
        return x.type === "give";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    const receive = khata
      .filter(function (x) {
        return x.type === "receive";
      })
      .reduce(function (a, x) {
        return a + num(x.amount);
      }, 0);

    setText("reportIncome", money(income));
    setText("reportExpense", money(expense));
    setText("reportGive", money(give));
    setText("reportReceive", money(receive));

    if (get("reportContent")) {
      get("reportContent").innerHTML =
        '<div class="form-card">' +
        "<p><b>Balance:</b> " +
        money(income - expense) +
        "</p>" +
        "<p><b>Net Udhar:</b> " +
        money(give - receive) +
        "</p>" +
        "<p><b>Transactions:</b> " +
        tx.length +
        "</p>" +
        "<p><b>Udhar Entries:</b> " +
        khata.length +
        "</p>" +
        "</div>";
    }
  }


  window.exportSummary = function () {
    const text =
      "HISAB Summary\n\n" +
      "Mode: " +
      D.mode +
      "\n" +
      "Currency: " +
      D.currency +
      "\n\n" +
      "Income: " +
      get("reportIncome")?.textContent +
      "\n" +
      "Expense: " +
      get("reportExpense")?.textContent +
      "\n" +
      "Give: " +
      get("reportGive")?.textContent +
      "\n" +
      "Receive: " +
      get("reportReceive")?.textContent;

    shareText(text);
  };


  window.exportSummaryPDF = function () {
    const html =
      "<html><body>" +
      "<h1>HISAB</h1>" +
      "<h2>Money Summary</h2>" +
      "<p>Mode: " +
      esc(D.mode) +
      "</p>" +
      "<p>Income: " +
      esc(
        get("reportIncome")?.textContent
      ) +
      "</p>" +
      "<p>Expense: " +
      esc(
        get("reportExpense")?.textContent
      ) +
      "</p>" +
      "<p>Give: " +
      esc(
        get("reportGive")?.textContent
      ) +
      "</p>" +
      "<p>Receive: " +
      esc(
        get("reportReceive")?.textContent
      ) +
      "</p>" +
      "</body></html>";

    printDocument(html);
  };


  /* =========================================================
     REMINDERS
     ========================================================= */

  window.addReminder = function () {
    const name =
      get("reminderName")?.value.trim() ||
      "";

    const date =
      get("reminderDate")?.value ||
      today();

    if (!name) {
      notify("Reminder name enter karein");
      return;
    }

    D.reminders.unshift({
      id: uid("rem"),
      mode: D.mode,
      name: name,
      date: date,
      status: "pending"
    });

    save();

    renderReminders();

    notify("Reminder added");
  };


  function renderReminders() {
    const box = get("reminderList");

    if (!box) return;

    const list = D.reminders.filter(function (x) {
      return x.mode === D.mode;
    });

    box.innerHTML = list.length
      ? list
          .map(function (x) {
            return (
              '<div style="padding:14px;border-bottom:1px solid #ddd">' +
              "<b>" +
              esc(x.name) +
              "</b><br>" +
              "<small>" +
              esc(x.date) +
              " • " +
              esc(x.status) +
              "</small>" +
              "</div>"
            );
          })
          .join("")
      : "<p>No reminders.</p>";
  }


  /* =========================================================
     SECURITY / PIN
     ========================================================= */

  window.setPin = function () {
    const pin =
      get("pinInput")?.value.trim() || "";

    if (!/^\d{4,6}$/.test(pin)) {
      notify("4-6 digit PIN enter karein");
      return;
    }

    D.pin = pin;
    D.locked = false;

    save();

    if (get("pinInput"))
      get("pinInput").value = "";

    notify("PIN saved");
  };


  window.lockApp = function () {
    if (!D.pin) {
      notify("Pehle PIN set karein");
      return;
    }

    D.locked = true;
    save();

    const pin = prompt("HISAB PIN enter karein");

    if (pin !== D.pin) {
      notify("Wrong PIN");
      return;
    }

    D.locked = false;
    save();

    notify("Unlocked");
  };


  function renderPrivacy() {}


  /* =========================================================
     BACKUP / RESTORE
     ========================================================= */

  window.exportBackup = function () {
    const blob = new Blob(
      [JSON.stringify(D, null, 2)],
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

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);

    notify("Backup ready");
  };


  window.importBackup = function (event) {
    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
      try {
        const x =
          JSON.parse(reader.result);

        D = {
          ...clone(DEFAULT),
          ...x
        };

        save();
        renderAll();

        notify("Backup restored");
      } catch (e) {
        notify("Invalid backup file");
      }
    };

    reader.readAsText(file);
  };


  /* =========================================================
     FAMILY
     ========================================================= */

  window.addFamilyMember = function () {
    const name =
      get("familyName")?.value.trim() ||
      "";

    if (!name) {
      notify("Name enter karein");
      return;
    }

    D.family.unshift({
      id: uid("family"),
      name: name,
      date: today()
    });

    save();

    if (get("familyName"))
      get("familyName").value = "";

    renderFamily();

    notify("Family member added");
  };


  function renderFamily() {
    const box = get("familyList");

    if (!box) return;

    box.innerHTML = D.family.length
      ? D.family
          .map(function (x) {
            return (
              '<div style="padding:12px;border-bottom:1px solid #ddd">' +
              "👤 " +
              esc(x.name) +
              "</div>"
            );
          })
          .join("")
      : "<p>No family members.</p>";
  }


  /* =========================================================
     TOOLS
     ========================================================= */

  function toolPrompt(title) {
    const name = prompt(title);

    if (!name) return;

    D.tools.unshift({
      id: uid("tool"),
      type: title,
      title: name,
      date: today()
    });

    save();

    notify(title + " saved");
  }


  window.addInsurance = function () {
    toolPrompt("Insurance name");
  };


  window.addSchool = function () {
    toolPrompt("School / Education");
  };


  window.addVehicle = function () {
    toolPrompt("Vehicle");
  };


  window.addShopping = function () {
    toolPrompt("Shopping item");
  };


  window.addUtility = function () {
    toolPrompt("Utility");
  };


  window.addDoc = function () {
    toolPrompt("Document name");
  };


  window.addAnnual = function () {
    toolPrompt("Annual planning item");
  };


  window.calcEmergency = function () {
    const monthly = num(
      prompt("Monthly essential expense")
    );

    const months = num(
      prompt("Emergency fund months", "6")
    );

    if (!(monthly > 0) || !(months > 0)) {
      notify("Valid amount enter karein");
      return;
    }

    alert(
      "Emergency Fund: " +
      money(monthly * months)
    );
  };


  window.calcFD = function () {
    const principal =
      num(get("fdPrincipal")?.value);

    const rate =
      num(get("fdRate")?.value);

    const months =
      Math.max(
        1,
        num(get("fdN")?.value)
      );

    if (!(principal > 0)) {
      notify("Principal enter karein");
      return;
    }

    const result =
      principal *
      Math.pow(
        1 + rate / 100,
        months / 12
      );

    if (get("fdResult")) {
      get("fdResult").innerHTML =
        '<div style="padding:14px;margin-top:10px;background:#eef8f4;border-radius:14px">' +
        "<b>Maturity Amount</b>" +
        '<div style="font-size:23px">' +
        money(result) +
        "</div>" +
        "</div>";
    }
  };


  /* =========================================================
     QUICK ADD
     ========================================================= */

  window.openQuickAdd = function () {
    const choice = prompt(
      "Enter:\n1 = Income\n2 = Expense\n3 = Udhar"
    );

    if (choice === "1" || choice === "2") {
      showPage("transactions", true);

      if (get("transactionType")) {
        get("transactionType").value =
          choice === "1"
            ? "income"
            : "expense";
      }

      return;
    }

    if (choice === "3") {
      openKhataForm(D.mode);
    }
  };


  /* =========================================================
     SEARCH EVERYTHING
     ========================================================= */

  window.searchAllData = function (value) {
    const box = get("searchResults");

    if (!box) return;

    const q =
      String(value || "")
        .trim()
        .toLowerCase();

    if (!q) {
      box.innerHTML = "";
      return;
    }

    const result = [];

    D.transactions.forEach(function (x) {
      if (
        String(x.category)
          .toLowerCase()
          .includes(q) ||
        String(x.note)
          .toLowerCase()
          .includes(q)
      ) {
        result.push(
          "Transaction: " +
          x.category +
          " — " +
          money(x.amount)
        );
      }
    });

    D.khata.forEach(function (x) {
      if (
        String(x.person)
          .toLowerCase()
          .includes(q) ||
        String(x.note)
          .toLowerCase()
          .includes(q)
      ) {
        result.push(
          "Udhar: " +
          x.person +
          " — " +
          money(x.amount)
        );
      }
    });

    D.bills.forEach(function (x) {
      if (
        String(x.name)
          .toLowerCase()
          .includes(q)
      ) {
        result.push(
          "Bill: " +
          x.name +
          " — " +
          money(x.amount)
        );
      }
    });

    D.goals.forEach(function (x) {
      if (
        String(x.name)
          .toLowerCase()
          .includes(q)
      ) {
        result.push(
          "Goal: " +
          x.name +
          " — " +
          money(x.target)
        );
      }
    });

    box.innerHTML = result.length
      ? result
          .map(function (x) {
            return (
              '<div style="padding:10px;border-bottom:1px solid #ddd">' +
              esc(x) +
              "</div>"
            );
          })
          .join("")
      : "<p>No result found.</p>";
  };


  /* =========================================================
     SHARE / PRINT
     ========================================================= */

  function shareText(text) {
    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {
      navigator.share({
        title: "HISAB",
        text: text
      }).catch(function () {});
      return;
    }

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          notify("Summary copied");
        })
        .catch(function () {
          alert(text);
        });

      return;
    }

    alert(text);
  }


  function printDocument(html) {
    const win = window.open("", "_blank");

    if (!win) {
      notify("Print window blocked");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();

    setTimeout(function () {
      win.print();
    }, 400);
  }


  /* =========================================================
     HELPERS
     ========================================================= */

  function setValue(id, value) {
    const x = get(id);

    if (x) x.value = value == null ? "" : value;
  }


  function setText(id, value) {
    const x = get(id);

    if (x) x.textContent = value;
  }


  function renderAll() {
    renderHome();
    renderPersonal();
    renderBusiness();
    renderTransactions();
    renderPlanning();
    renderCredit();
    renderReports();
    renderReminders();
    renderFamily();
  }


  /* =========================================================
     GLOBAL EXPORTS
     ========================================================= */

  window.D = D;
  window.save = save;

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


  /* =========================================================
     STARTUP
     ========================================================= */

  function startup() {
    try {
      save();

      const shell = get("appShell");
      const gate = get("guestGate");

      if (shell) {
        shell.style.display = "block";
      }

      if (gate) {
        gate.classList.add("active");
      }

      if (shell) {
        shell.style.display = "none";
      }

      setValue("transactionDate", today());
      setValue("khataDate", today());
      setValue("billDue", today());
      setValue("cardDue", today());
      setValue("goalDate", today());
      setValue("reminderDate", today());

      renderAll();

    } catch (e) {
      console.error("HISAB startup error:", e);
    }
  }


  /* =========================================================
     ANDROID BACK
     ========================================================= */

  document.addEventListener(
    "backbutton",
    function () {
      window.goBack();
    },
    false
  );


  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startup,
      { once: true }
    );
  } else {
    startup();
  }

})();
