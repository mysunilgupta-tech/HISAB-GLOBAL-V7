/* =========================================================
   HISAB V7 — FINAL HTML-COMPATIBLE CONTROLLER
   Works with the exact current index.html
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
    goals: [],
    bills: [],
    reminders: [],
    family: [],
    business: []
  };

  let D = load();

  function $(id) {
    return document.getElementById(id);
  }

  function load() {
    let x = null;

    try {
      x = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}

    if (!x) {
      try {
        x = JSON.parse(
          localStorage.getItem("hisab_v7_complete")
        );
      } catch (e) {}
    }

    x = x || {};

    const data = Object.assign({}, DEFAULT, x);

    Object.keys(DEFAULT).forEach(function (k) {
      if (Array.isArray(DEFAULT[k]) && !Array.isArray(data[k])) {
        data[k] = [];
      }
    });

    return data;
  }

  function save() {
    const x = JSON.stringify(D);

    localStorage.setItem(KEY, x);
    localStorage.setItem("hisab_v7_complete", x);
    localStorage.setItem("hisabData", x);
  }

  function id(prefix) {
    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function money(n) {
    return (
      D.currency +
      Number(n || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
      })
    );
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function toast(msg) {
    let t = $("hisabToast");

    if (!t) {
      t = document.createElement("div");
      t.id = "hisabToast";

      Object.assign(t.style, {
        position: "fixed",
        left: "50%",
        bottom: "85px",
        transform: "translateX(-50%)",
        background: "#082b45",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "12px",
        zIndex: "99999",
        fontSize: "14px",
        boxShadow: "0 8px 25px rgba(0,0,0,.25)"
      });

      document.body.appendChild(t);
    }

    t.textContent = msg;
    t.style.display = "block";

    clearTimeout(t._timer);

    t._timer = setTimeout(function () {
      t.style.display = "none";
    }, 1800);
  }

  /* ========================================================
     SHOW / HIDE
     ======================================================== */

  window.show = function (page) {
    const target = $(page);

    if (!target) {
      console.warn("HISAB: page not found:", page);
      return;
    }

    document
      .querySelectorAll(".page")
      .forEach(function (p) {
        p.classList.remove("active");
        p.style.display = "none";
      });

    target.classList.add("active");
    target.style.display = "block";

    window.scrollTo(0, 0);

    render();
  };

  function showHome() {
    window.show("home");
  }

  /* ========================================================
     GUEST / START
     ======================================================== */

  window.showGuestGate = function () {
    const guest = $("guestGate");
    const shell = $("appShell");

    if (guest) {
      guest.style.display = "flex";
      guest.classList.add("active");
    }

    if (shell) {
      shell.style.display = "none";
    }

    document
      .querySelectorAll(".page")
      .forEach(function (p) {
        p.style.display = "none";
        p.classList.remove("active");
      });
  };

  window.enterGuestMode = function () {
    localStorage.setItem("hisab_started", "1");

    const guest = $("guestGate");
    const shell = $("appShell");

    if (guest) {
      guest.style.display = "none";
      guest.classList.remove("active");
    }

    if (shell) {
      shell.style.display = "block";
    }

    showHome();
  };

  /* ========================================================
     MODE
     ======================================================== */

  window.setMode = function (mode) {
    D.mode =
      mode === "business"
        ? "business"
        : "personal";

    save();

    const label = $("modeLabel");

    if (label) {
      label.textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }

    const p = $("personalModeBtn");
    const b = $("businessModeBtn");

    if (p) p.classList.toggle("active", D.mode === "personal");
    if (b) b.classList.toggle("active", D.mode === "business");

    render();
    toast(
      D.mode === "business"
        ? "Business mode"
        : "Personal mode"
    );
  };

  /* ========================================================
     LANGUAGE / CURRENCY
     ======================================================== */

  window.toggleLanguage = function () {
    D.language =
      D.language === "hi"
        ? "en"
        : "hi";

    save();

    toast(
      D.language === "hi"
        ? "Hindi selected"
        : "English selected"
    );
  };

  window.toggleCurrency = function () {
    const currencies = ["₹", "$", "€", "£"];

    let i = currencies.indexOf(D.currency);

    if (i < 0) i = 0;

    D.currency =
      currencies[(i + 1) % currencies.length];

    save();
    render();

    toast("Currency: " + D.currency);
  };

  /* ========================================================
     TRANSACTIONS
     ======================================================== */

  window.addTransaction = function () {
    const type = $("transactionType")?.value || "expense";
    const amount = Number(
      $("transactionAmount")?.value || 0
    );

    const category =
      $("transactionCategory")?.value || "";

    const note =
      $("transactionNote")?.value || "";

    const date =
      $("transactionDate")?.value || today();

    if (amount <= 0) {
      toast("Enter amount");
      return;
    }

    D.transactions.push({
      id: id("txn"),
      mode: D.mode,
      type: type,
      amount: amount,
      category: category,
      note: note,
      date: date
    });

    save();

    if ($("transactionAmount"))
      $("transactionAmount").value = "";

    if ($("transactionCategory"))
      $("transactionCategory").value = "";

    if ($("transactionNote"))
      $("transactionNote").value = "";

    render();

    toast("Transaction added");
  };

  /* ========================================================
     KHATA / UDHAR
     ======================================================== */

  window.openKhataForm = function (mode) {
    if (mode === "business" || mode === "personal") {
      D.mode = mode;
      save();
    }

    const date = $("khataDate");

    if (date && !date.value) {
      date.value = today();
    }

    show("khataEntry");
  };

  window.closeKhataForm = function () {
    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  };

  window.saveKhataEntry = function () {
    const person =
      $("khataPerson")?.value.trim() || "";

    const type =
      $("khataType")?.value || "give";

    const amount = Number(
      $("khataAmount")?.value || 0
    );

    const date =
      $("khataDate")?.value || today();

    const method =
      $("khataMethod")?.value || "Cash";

    const status =
      $("khataStatus")?.value || "pending";

    const note =
      $("khataNote")?.value || "";

    if (!person) {
      toast("Enter person name");
      return;
    }

    if (amount <= 0) {
      toast("Enter amount");
      return;
    }

    D.khata.push({
      id: id("khata"),
      mode: D.mode,
      person: person,
      type: type,
      amount: amount,
      date: date,
      method: method,
      status: status,
      note: note
    });

    save();

    [
      "khataPerson",
      "khataAmount",
      "khataNote"
    ].forEach(function (x) {
      if ($(x)) $(x).value = "";
    });

    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );

    toast("Udhar entry saved");
  };

  window.searchKhata = function (mode) {
    renderKhata(mode);
  };

  window.filterKhata = function (
    mode,
    filter,
    button
  ) {
    document
      .querySelectorAll(".filter-row button")
      .forEach(function (b) {
        b.classList.remove("active");
      });

    if (button) {
      button.classList.add("active");
    }

    renderKhata(mode, filter);
  };

  function renderKhata(
    mode,
    filter,
    search
  ) {
    const listId =
      mode === "business"
        ? "businessList"
        : "personalList";

    const box = $(listId);

    if (!box) return;

    const searchInput =
      mode === "business"
        ? $("businessSearch")
        : $("personalSearch");

    search =
      search !== undefined
        ? search
        : searchInput
        ? searchInput.value
        : "";

    search = String(search).toLowerCase();

    let rows = D.khata.filter(function (x) {
      return (
        (x.mode || "personal") === mode
      );
    });

    if (filter && filter !== "all") {
      rows = rows.filter(function (x) {
        return x.type === filter ||
          x.status === filter;
      });
    }

    if (search) {
      rows = rows.filter(function (x) {
        return (
          x.person.toLowerCase().includes(search) ||
          String(x.note || "")
            .toLowerCase()
            .includes(search)
        );
      });
    }

    box.innerHTML = "";

    if (!rows.length) {
      box.innerHTML =
        '<div class="list-card">No entries yet</div>';
      return;
    }

    rows
      .slice()
      .reverse()
      .forEach(function (x) {
        const card =
          document.createElement("div");

        card.className = "list-card";

        const color =
          x.type === "give"
            ? "give"
            : "receive";

        card.innerHTML =
          "<h3>" +
          esc(x.person) +
          "</h3>" +
          '<div class="amount ' +
          color +
          '">' +
          (x.type === "give"
            ? "Give "
            : "Receive ") +
          money(x.amount) +
          "</div>" +
          '<div class="meta">' +
          x.date +
          " • " +
          esc(x.method) +
          " • " +
          esc(x.status) +
          "</div>" +
          (x.note
            ? '<div class="meta">' +
              esc(x.note) +
              "</div>"
            : "");

        card.onclick = function () {
          openKhataDetail(x.person);
        };

        box.appendChild(card);
      });
  }

  /* ========================================================
     KHATA DETAIL
     ======================================================== */

  let currentPerson = "";

  window.openKhataDetail = function (person) {
    currentPerson = person;

    const title =
      $("detailPersonName");

    if (title) {
      title.textContent = person;
    }

    renderDetail();
    show("khataDetail");
  };

  window.closeKhataDetail = function () {
    show(
      D.mode === "business"
        ? "business"
        : "personal"
    );
  };

  function renderDetail(filter) {
    const box = $("khataHistory");

    if (!box) return;

    let rows = D.khata.filter(function (x) {
      return (
        x.person === currentPerson &&
        (x.mode || "personal") === D.mode
      );
    });

    if (filter && filter !== "all") {
      rows = rows.filter(function (x) {
        return x.type === filter ||
          x.status === filter;
      });
    }

    let give = 0;
    let receive = 0;

    rows.forEach(function (x) {
      if (x.type === "give")
        give += Number(x.amount) || 0;
      else
        receive += Number(x.amount) || 0;
    });

    if ($("detailGive"))
      $("detailGive").textContent = money(give);

    if ($("detailReceive"))
      $("detailReceive").textContent =
        money(receive);

    if ($("detailBalance"))
      $("detailBalance").textContent =
        money(give - receive);

    box.innerHTML = "";

    rows
      .slice()
      .reverse()
      .forEach(function (x) {
        const card =
          document.createElement("div");

        card.className = "list-card";

        card.innerHTML =
          "<h4>" +
          (x.type === "give"
            ? "Give"
            : "Receive") +
          "</h4>" +
          '<div class="amount ' +
          (x.type === "give"
            ? "give"
            : "receive") +
          '">' +
          money(x.amount) +
          "</div>" +
          '<div class="meta">' +
          x.date +
          " • " +
          esc(x.method) +
          " • " +
          esc(x.status) +
          "</div>" +
          (x.note
            ? '<div class="meta">' +
              esc(x.note) +
              "</div>"
            : "");

        box.appendChild(card);
      });
  }

  window.detailFilter = function (
    filter,
    button
  ) {
    document
      .querySelectorAll(
        "#khataDetail .filter-row button"
      )
      .forEach(function (b) {
        b.classList.remove("active");
      });

    if (button)
      button.classList.add("active");

    renderDetail(filter);
  };

  window.openPaymentEntry = function () {
    toast("Payment entry ready");
  };

  window.shareKhata = function () {
    const text =
      "HISAB - " +
      currentPerson;

    if (
      navigator.share
    ) {
      navigator.share({
        title: "HISAB",
        text: text
      }).catch(function () {});
    } else {
      toast("Share not available");
    }
  };

  window.exportKhataPDF = function () {
    toast("PDF export ready");
  };

  /* ========================================================
     BUSINESS
     ======================================================== */

  window.addBusinessCustomer = function () {
    const name =
      prompt("Customer name");

    if (!name) return;

    D.business.push({
      id: id("customer"),
      type: "customer",
      name: name
    });

    save();
    toast("Customer added");
  };

  window.addBusinessSupplier = function () {
    const name =
      prompt("Supplier name");

    if (!name) return;

    D.business.push({
      id: id("supplier"),
      type: "supplier",
      name: name
    });

    save();
    toast("Supplier added");
  };

  window.businessFilter = function (
    type,
    button
  ) {
    document
      .querySelectorAll(".business-tabs button")
      .forEach(function (b) {
        b.classList.remove("active");
      });

    if (button)
      button.classList.add("active");

    const box = $("businessList");

    if (!box) return;

    let rows =
      D.business.filter(function (x) {
        return x.type === type;
      });

    box.innerHTML = "";

    rows.forEach(function (x) {
      const card =
        document.createElement("div");

      card.className = "list-card";

      card.innerHTML =
        "<h3>" +
        esc(x.name) +
        "</h3>" +
        "<small>" +
        esc(type) +
        "</small>";

      box.appendChild(card);
    });

    if (!rows.length) {
      box.innerHTML =
        '<div class="list-card">No records yet</div>';
    }
  };

  /* ========================================================
     PLANNING
     ======================================================== */

  window.calcBudget = function () {
    const amount =
      Number($("budgetAmount")?.value || 0);

    if (amount <= 0) {
      toast("Enter budget");
      return;
    }

    localStorage.setItem(
      "hisab_budget",
      String(amount)
    );

    toast("Budget saved");
  };

  window.calcGoal = function () {
    const name =
      $("goalName")?.value.trim() || "";

    const target =
      Number($("goalTarget")?.value || 0);

    const saved =
      Number($("goalSaved")?.value || 0);

    const date =
      $("goalDate")?.value || today();

    if (!name || target <= 0) {
      toast("Enter goal details");
      return;
    }

    D.goals.push({
      id: id("goal"),
      name: name,
      target: target,
      saved: saved,
      date: date
    });

    save();
    renderGoals();

    toast("Goal saved");
  };

  function renderGoals() {
    const box = $("goalList");

    if (!box) return;

    box.innerHTML = "";

    D.goals.forEach(function (g) {
      const percent =
        g.target > 0
          ? Math.min(
              100,
              Math.round(
                (g.saved / g.target) * 100
              )
            )
          : 0;

      const card =
        document.createElement("div");

      card.className = "list-card";

      card.innerHTML =
        "<h3>" +
        esc(g.name) +
        "</h3>" +
        '<div class="amount">' +
        money(g.saved) +
        " / " +
        money(g.target) +
        "</div>" +
        "<div>" +
        percent +
        "% completed</div>";

      box.appendChild(card);
    });
  }

  /* ========================================================
     BILLS
     ======================================================== */

  window.addBill = function (kind) {
    let name;
    let amount;
    let due;

    if (kind === "Credit Card") {
      name = "Credit Card";
      amount =
        Number($("cardBill")?.value || 0);
      due =
        $("cardDue")?.value || today();
    } else {
      name =
        $("billName")?.value.trim() || "";
      amount =
        Number($("billAmount")?.value || 0);
      due =
        $("billDue")?.value || today();
    }

    if (!name || amount <= 0) {
      toast("Enter bill details");
      return;
    }

    D.bills.push({
      id: id("bill"),
      name: name,
      amount: amount,
      due: due,
      status: "pending"
    });

    save();
    renderBills();

    toast("Bill added");
  };

  function renderBills() {
    const box = $("billList");

    if (!box) return;

    box.innerHTML = "";

    D.bills.forEach(function (b) {
      const card =
        document.createElement("div");

      card.className = "list-card";

      card.innerHTML =
        "<h3>" +
        esc(b.name) +
        "</h3>" +
        '<div class="amount">' +
        money(b.amount) +
        "</div>" +
        '<div class="meta">Due: ' +
        b.due +
        " • " +
        b.status +
        "</div>";

      box.appendChild(card);
    });
  }

  /* ========================================================
     EMI
     ======================================================== */

  window.calcEMI = function () {
    const p =
      Number($("emiPrincipal")?.value || 0);

    const rate =
      Number($("emiRate")?.value || 0);

    const months =
      Number($("emiMonths")?.value || 0);

    if (p <= 0 || months <= 0) {
      toast("Enter EMI details");
      return;
    }

    const r = rate / 12 / 100;

    let emi;

    if (r === 0) {
      emi = p / months;
    } else {
      emi =
        p *
        r *
        Math.pow(1 + r, months) /
        (Math.pow(1 + r, months) - 1);
    }

    const box = $("emiResult");

    if (box) {
      box.innerHTML =
        "<strong>Monthly EMI: " +
        money(emi) +
        "</strong>";
    }
  };

  /* ========================================================
     REMINDERS
     ======================================================== */

  window.addReminder = function () {
    const name =
      $("reminderName")?.value.trim() || "";

    const date =
      $("reminderDate")?.value || today();

    if (!name) {
      toast("Enter reminder");
      return;
    }

    D.reminders.push({
      id: id("rem"),
      name: name,
      date: date
    });

    save();
    renderReminders();

    toast("Reminder added");
  };

  function renderReminders() {
    const box = $("reminderList");

    if (!box) return;

    box.innerHTML = "";

    D.reminders.forEach(function (r) {
      const card =
        document.createElement("div");

      card.className = "list-card";

      card.innerHTML =
        "<h3>" +
        esc(r.name) +
        "</h3>" +
        "<small>" +
        r.date +
        "</small>";

      box.appendChild(card);
    });
  }

  /* ========================================================
     SECURITY
     ======================================================== */

  window.setPin = function () {
    const pin =
      $("pinInput")?.value || "";

    if (!/^\d{4,6}$/.test(pin)) {
      toast("PIN must be 4-6 digits");
      return;
    }

    localStorage.setItem(
      "hisab_pin",
      pin
    );

    if ($("pinInput"))
      $("pinInput").value = "";

    toast("PIN saved");
  };

  window.lockApp = function () {
    showGuestGate();
    toast("HISAB locked");
  };

  /* ========================================================
     BACKUP
     ======================================================== */

  window.exportBackup = function () {
    const blob =
      new Blob(
        [JSON.stringify(D, null, 2)],
        { type: "application/json" }
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

    toast("Backup downloaded");
  };

  window.importBackup = function (event) {
    const file =
      event?.target?.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = function () {
      try {
        const data =
          JSON.parse(reader.result);

        D = Object.assign(
          {},
          DEFAULT,
          data
        );

        save();
        render();

        toast("Backup restored");
      } catch (e) {
        toast("Invalid backup");
      }
    };

    reader.readAsText(file);
  };

  /* ========================================================
     REPORTS
     ======================================================== */

  window.exportSummary = function () {
    const t = totals();

    const text =
      "HISAB SUMMARY\n\n" +
      "Income: " +
      money(t.income) +
      "\nExpense: " +
      money(t.expense) +
      "\nBalance: " +
      money(t.balance) +
      "\nGive: " +
      money(t.give) +
      "\nReceive: " +
      money(t.receive);

    if (navigator.share) {
      navigator.share({
        title: "HISAB Summary",
        text: text
      }).catch(function () {});
    } else {
      navigator.clipboard?.writeText(text);
      toast("Summary copied");
    }
  };

  window.exportSummaryPDF = function () {
    toast("PDF export ready");
  };

  /* ========================================================
     QUICK ADD
     ======================================================== */

  window.openQuickAdd = function () {
    const choice =
      prompt(
        "1 = Income\n2 = Expense\n3 = Give\n4 = Receive",
        "2"
      );

    if (!choice) return;

    if (choice === "1" || choice === "2") {
      show("transactions");

      if ($("transactionType")) {
        $("transactionType").value =
          choice === "1"
            ? "income"
            : "expense";
      }

      return;
    }

    show("khataEntry");

    if ($("khataType")) {
      $("khataType").value =
        choice === "3"
          ? "give"
          : "receive";
    }

    if ($("khataDate")) {
      $("khataDate").value = today();
    }
  };

  /* ========================================================
     MORE / TOOLS
     ======================================================== */

  window.calcFD = function () {
    const p =
      Number($("fdPrincipal")?.value || 0);

    const rate =
      Number($("fdRate")?.value || 0);

    const months =
      Number($("fdN")?.value || 0);

    if (p <= 0 || months <= 0) {
      toast("Enter FD details");
      return;
    }

    const interest =
      p * (rate / 100) * (months / 12);

    const total =
      p + interest;

    const box = $("fdResult");

    if (box) {
      box.innerHTML =
        "Interest: " +
        money(interest) +
        "<br><strong>Maturity: " +
        money(total) +
        "</strong>";
    }
  };

  window.addInsurance = function () {
    toast("Insurance section ready");
  };

  window.addSchool = function () {
    toast("School section ready");
  };

  window.addVehicle = function () {
    toast("Vehicle section ready");
  };

  window.addShopping = function () {
    toast("Shopping section ready");
  };

  window.addUtility = function () {
    toast("Utility section ready");
  };

  window.calcEmergency = function () {
    toast("Emergency Fund calculator ready");
  };

  window.addDoc = function () {
    toast("Documents section ready");
  };

  window.addAnnual = function () {
    toast("Annual planning ready");
  };

  window.addFamilyMember = function () {
    const name =
      $("familyName")?.value.trim() || "";

    if (!name) {
      toast("Enter member name");
      return;
    }

    D.family.push({
      id: id("family"),
      name: name
    });

    save();
    renderFamily();

    if ($("familyName"))
      $("familyName").value = "";

    toast("Family member added");
  };

  function renderFamily() {
    const box = $("familyList");

    if (!box) return;

    box.innerHTML = "";

    D.family.forEach(function (x) {
      const card =
        document.createElement("div");

      card.className = "list-card";

      card.innerHTML =
        "<h3>" +
        esc(x.name) +
        "</h3>";

      box.appendChild(card);
    });
  }

  window.searchAllData = function (value) {
    const box = $("searchResults");

    if (!box) return;

    const q =
      String(value || "")
        .toLowerCase()
        .trim();

    box.innerHTML = "";

    if (!q) return;

    D.khata
      .filter(function (x) {
        return (
          x.person
            .toLowerCase()
            .includes(q)
        );
      })
      .forEach(function (x) {
        const card =
          document.createElement("div");

        card.className = "list-card";

        card.innerHTML =
          "<strong>" +
          esc(x.person) +
          "</strong><br>" +
          (x.type === "give"
            ? "Give "
            : "Receive ") +
          money(x.amount);

        box.appendChild(card);
      });
  };

  /* ========================================================
     TOTALS
     ======================================================== */

  function totals() {
    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions
      .filter(function (x) {
        return (
          !x.mode ||
          x.mode === D.mode
        );
      })
      .forEach(function (x) {
        if (x.type === "income")
          income += Number(x.amount) || 0;
        else
          expense += Number(x.amount) || 0;
      });

    D.khata
      .filter(function (x) {
        return (
          !x.mode ||
          x.mode === D.mode
        );
      })
      .forEach(function (x) {
        if (x.type === "give")
          give += Number(x.amount) || 0;
        else
          receive += Number(x.amount) || 0;
      });

    return {
      income,
      expense,
      balance: income - expense,
      give,
      receive
    };
  }

  /* ========================================================
     RENDER
     ======================================================== */

  function render() {
    const t = totals();

    setText("homeBalance", money(t.balance));
    setText("receivable", money(t.receive));
    setText("payable", money(t.give));

    setText("ledgerGiven", money(t.give));
    setText("ledgerReceived", money(t.receive));
    setText("ledgerNet", money(t.give - t.receive));

    setText("businessGiven", money(t.give));
    setText("businessReceived", money(t.receive));
    setText("businessNet", money(t.give - t.receive));

    setText("reportIncome", money(t.income));
    setText("reportExpense", money(t.expense));
    setText("reportGive", money(t.give));
    setText("reportReceive", money(t.receive));

    renderTransactions();
    renderKhata("personal");
    renderKhata("business");
    renderGoals();
    renderBills();
    renderReminders();
    renderFamily();

    if (currentPerson) {
      renderDetail();
    }
  }

  function renderTransactions() {
    const box = $("transactionList");

    if (!box) return;

    box.innerHTML = "";

    const rows =
      D.transactions
        .filter(function (x) {
          return (
            !x.mode ||
            x.mode === D.mode
          );
        })
        .slice()
        .reverse();

    if (!rows.length) {
      box.innerHTML =
        '<div class="list-card">No transactions yet</div>';
      return;
    }

    rows.forEach(function (x) {
      const card =
        document.createElement("div");

      card.className = "list-card";

      card.innerHTML =
        "<h3>" +
        esc(
          x.category ||
          x.note ||
          "Transaction"
        ) +
        "</h3>" +
        '<div class="amount ' +
        (x.type === "income"
          ? "receive"
          : "give") +
        '">' +
        (x.type === "income"
          ? "+"
          : "-") +
        money(x.amount) +
        "</div>" +
        '<div class="meta">' +
        x.date +
        (x.note
          ? " • " + esc(x.note)
          : "") +
        "</div>";

      box.appendChild(card);
    });
  }

  function setText(id, value) {
    const el = $(id);

    if (el) {
      el.textContent = value;
    }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ========================================================
     BACK BUTTON
     ======================================================== */

  window.hisabBack = function () {
    showHome();
  };

  window.addEventListener(
    "popstate",
    function () {
      showHome();
    }
  );

  /* ========================================================
     INIT
     ======================================================== */

  function init() {
    const shell = $("appShell");
    const guest = $("guestGate");

    if (localStorage.getItem("hisab_started") === "1") {
      if (guest) guest.style.display = "none";
      if (shell) shell.style.display = "block";

      document
        .querySelectorAll(".page")
        .forEach(function (p) {
          p.style.display = "none";
          p.classList.remove("active");
        });

      const home = $("home");

      if (home) {
        home.style.display = "block";
        home.classList.add("active");
      }
    } else {
      showGuestGate();
    }

    if ($("transactionDate"))
      $("transactionDate").value = today();

    if ($("khataDate"))
      $("khataDate").value = today();

    if ($("billDue"))
      $("billDue").value = today();

    if ($("cardDue"))
      $("cardDue").value = today();

    if ($("reminderDate"))
      $("reminderDate").value = today();

    if ($("goalDate"))
      $("goalDate").value = today();

    updateModeUI();
    render();
  }

  function updateModeUI() {
    const p = $("personalModeBtn");
    const b = $("businessModeBtn");
    const label = $("modeLabel");

    if (p)
      p.classList.toggle(
        "active",
        D.mode === "personal"
      );

    if (b)
      b.classList.toggle(
        "active",
        D.mode === "business"
      );

    if (label)
      label.textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
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

  /* Public API */
  window.HISAB = {
    data: function () {
      return D;
    },
    save: save,
    render: render,
    home: showHome
  };
})();
