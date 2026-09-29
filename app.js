/* =========================================================
   HISAB V7 — COMPLETE STABLE CONTROLLER
   Compatible with current HISAB V7 index.html
   Single controller — no repair.js
   ========================================================= */

(function () {
  "use strict";

  var KEY = "hisab_v7_data";
  var GUEST_KEY = "hisab_v7_guest";

  function $(id) {
    return document.getElementById(id);
  }

  function safeNum(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function notify(msg) {
    try {
      alert(msg);
    } catch (e) {
      console.log(msg);
    }
  }

  function getValue(id) {
    var el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function setValue(id, value) {
    var el = $(id);
    if (el) el.value = value == null ? "" : value;
  }

  function setHTML(id, html) {
    var el = $(id);
    if (el) el.innerHTML = html;
  }

  var DEFAULT = {
    mode: "personal",
    currency: "₹",
    language: "hi",

    transactions: [],
    khata: [],
    business: [],
    sales: [],
    purchases: [],

    goals: [],
    savings: [],
    bills: [],
    loans: [],
    reminders: [],
    family: [],
    tools: [],

    budget: 0,
    pin: "",

    ui: {
      businessFilter: "customer",
      khataFilter: "all",
      detailFilter: "all",
      selectedPerson: "",
      selectedMode: "personal",
      returnPage: "home",
      lastPage: "home"
    }
  };

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT));
  }

  function normalizeData(raw) {
    var d = raw && typeof raw === "object" ? raw : {};
    var base = cloneDefault();

    Object.keys(base).forEach(function (key) {
      if (key !== "ui" && d[key] !== undefined) {
        base[key] = d[key];
      }
    });

    [
      "transactions",
      "khata",
      "business",
      "sales",
      "purchases",
      "goals",
      "savings",
      "bills",
      "loans",
      "reminders",
      "family",
      "tools"
    ].forEach(function (key) {
      base[key] = arr(base[key]);
    });

    if (d.ui && typeof d.ui === "object") {
      base.ui = Object.assign({}, cloneDefault().ui, d.ui);
    }

    base.mode = base.mode === "business" ? "business" : "personal";
    base.currency = base.currency || "₹";
    base.language = base.language === "en" ? "en" : "hi";
    base.budget = safeNum(base.budget);

    return base;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? normalizeData(JSON.parse(raw)) : cloneDefault();
    } catch (e) {
      console.error("HISAB load error", e);
      return cloneDefault();
    }
  }

  var D = load();
  window.D = D;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(D));
      window.D = D;
    } catch (e) {
      console.error("HISAB save error", e);
    }
  }

  function money(v) {
    return (D.currency || "₹") +
      safeNum(v).toLocaleString("en-IN", {
        maximumFractionDigits: 2
      });
  }

  /* =========================================================
     GUEST
     ========================================================= */

  function showGuestGate() {
    try {
      var gate = $("guestGate");
      var shell = $("appShell");

      if (!gate || !shell) return;

      var entered = localStorage.getItem(GUEST_KEY) === "1";

      gate.style.display = entered ? "none" : "";
      shell.style.display = entered ? "" : "none";
    } catch (e) {
      if ($("guestGate")) $("guestGate").style.display = "none";
      if ($("appShell")) $("appShell").style.display = "";
    }
  }

  function enterGuestMode() {
    try {
      localStorage.setItem(GUEST_KEY, "1");
    } catch (e) {}

    if ($("guestGate")) $("guestGate").style.display = "none";
    if ($("appShell")) $("appShell").style.display = "";

    show("home");
  }

  window.showGuestGate = showGuestGate;
  window.enterGuestMode = enterGuestMode;

  /* =========================================================
     NAVIGATION
     ========================================================= */

  var pages = [
    "home",
    "personal",
    "business",
    "khataEntry",
    "khataDetail",
    "transactions",
    "planning",
    "credit",
    "reports",
    "reminders",
    "privacy",
    "family",
    "ads",
    "familytools",
    "tools13",
    "final"
  ];

  var pageHistory = [];

  function getPage(id) {
    return $(id);
  }

  function currentPage() {
    return D.ui.lastPage || "home";
  }

  function show(pageId, remember) {
    try {
      var target = getPage(pageId);

      if (!target) {
        console.warn("Page not found:", pageId);
        return false;
      }

      if (remember !== false) {
        var old = currentPage();
        if (old !== pageId) pageHistory.push(old);
      }

      document.querySelectorAll(".page").forEach(function (p) {
        p.style.display = "none";
        p.classList.remove("active");
      });

      target.style.display = "";
      target.classList.add("active");

      D.ui.lastPage = pageId;
      save();

      renderAll();

      try {
        window.scrollTo(0, 0);
      } catch (e) {}

      addBackButton(target);
      return true;
    } catch (e) {
      console.error("show error:", e);

      var home = $("home");
      if (home) {
        document.querySelectorAll(".page").forEach(function (p) {
          p.style.display = "none";
          p.classList.remove("active");
        });
        home.style.display = "";
        home.classList.add("active");
      }

      return false;
    }
  }

  function goBack() {
    var previous = pageHistory.pop();

    if (previous && getPage(previous)) {
      show(previous, false);
    } else {
      pageHistory = [];
      show("home", false);
    }
  }

  function addBackButton(page) {
    if (!page || page.id === "home") return;
    if (page.querySelector(".hisab-auto-back")) return;

    var title = page.querySelector(".page-title");
    if (!title) return;

    var buttons = page.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      var txt = (buttons[i].textContent || "").trim();

      if (
        txt.indexOf("Back") !== -1 ||
        txt.indexOf("←") === 0 ||
        txt.indexOf("✕") === 0
      ) {
        return;
      }
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hisab-auto-back";
    btn.innerHTML = "← Back";

    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      goBack();
    };

    title.insertBefore(btn, title.firstChild);
  }

  function prepareBackButtons() {
    pages.forEach(function (id) {
      addBackButton($(id));
    });
  }

  window.show = show;

  /* =========================================================
     MODE
     ========================================================= */

  function selectedMode() {
    return D.mode === "business" ? "business" : "personal";
  }

  function setMode(mode) {
    D.mode = mode === "business" ? "business" : "personal";
    D.ui.selectedMode = D.mode;
    save();

    var p = $("personalModeBtn");
    var b = $("businessModeBtn");

    if (p) p.classList.toggle("active", D.mode === "personal");
    if (b) b.classList.toggle("active", D.mode === "business");

    var label = $("modeLabel");
    if (label) {
      label.textContent = D.mode === "business"
        ? "Business"
        : "Personal";
    }

    renderAll();
    show(D.mode === "business" ? "business" : "personal");
  }

  window.setMode = setMode;

  /* =========================================================
     KHATA / UDHAR
     ========================================================= */

  var khataContext = "personal";

  function openKhataForm(mode) {
    khataContext = mode === "business" ? "business" : "personal";

    setValue("khataPerson", "");
    setValue("khataType", "give");
    setValue("khataAmount", "");
    setValue("khataDate", today());
    setValue("khataMethod", "Cash");
    setValue("khataStatus", "pending");
    setValue("khataNote", "");

    var btn = document.querySelector("#khataEntry .primary-btn");
    if (btn) {
      btn.textContent = "Save Entry";
      btn.removeAttribute("data-edit-id");
    }

    D.ui.returnPage = khataContext;
    save();
    show("khataEntry");
  }

  function closeKhataForm() {
    show(khataContext === "business" ? "business" : "personal");
  }

  function saveKhataEntry() {
    var person = getValue("khataPerson");
    var type = getValue("khataType") === "receive"
      ? "receive"
      : "give";
    var amount = safeNum(getValue("khataAmount"));
    var date = getValue("khataDate") || today();
    var method = getValue("khataMethod") || "Cash";
    var status = getValue("khataStatus") || "pending";
    var note = getValue("khataNote");

    if (!person) {
      notify("Name enter karein.");
      return;
    }

    if (amount <= 0) {
      notify("Amount enter karein.");
      return;
    }

    var btn = document.querySelector("#khataEntry .primary-btn");
    var editId = btn ? btn.getAttribute("data-edit-id") : "";

    if (editId) {
      var existing = D.khata.find(function (x) {
        return String(x.id) === String(editId);
      });

      if (existing) {
        existing.person = person;
        existing.type = type;
        existing.amount = amount;
        existing.date = date;
        existing.method = method;
        existing.status = status;
        existing.note = note;
        existing.mode = khataContext;
      }
    } else {
      D.khata.push({
        id: uid("khata"),
        person: person,
        type: type,
        amount: amount,
        date: date,
        method: method,
        status: status,
        note: note,
        mode: khataContext,
        createdAt: Date.now()
      });
    }

    save();
    notify("Entry saved.");

    if (btn) {
      btn.removeAttribute("data-edit-id");
      btn.textContent = "Save Entry";
    }

    show(khataContext === "business" ? "business" : "personal");
  }

  function editKhata(id) {
    var item = D.khata.find(function (x) {
      return String(x.id) === String(id);
    });

    if (!item) return;

    khataContext = item.mode === "business"
      ? "business"
      : "personal";

    setValue("khataPerson", item.person);
    setValue("khataType", item.type);
    setValue("khataAmount", item.amount);
    setValue("khataDate", item.date);
    setValue("khataMethod", item.method || "Cash");
    setValue("khataStatus", item.status || "pending");
    setValue("khataNote", item.note || "");

    var btn = document.querySelector("#khataEntry .primary-btn");
    if (btn) {
      btn.setAttribute("data-edit-id", item.id);
      btn.textContent = "Update Entry";
    }

    show("khataEntry");
  }

  function deleteKhata(id) {
    if (!confirm("Delete this entry?")) return;

    D.khata = D.khata.filter(function (x) {
      return String(x.id) !== String(id);
    });

    save();
    renderAll();
  }

  function openKhataDetail(person, mode) {
    D.ui.selectedPerson = person;
    D.ui.selectedMode = mode === "business"
      ? "business"
      : "personal";
    D.ui.detailFilter = "all";
    save();
    show("khataDetail");
  }

  function closeKhataDetail() {
    show(D.ui.selectedMode === "business"
      ? "business"
      : "personal");
  }

  function detailFilter(type, btn) {
    D.ui.detailFilter = type || "all";
    save();

    if (btn) {
      btn.parentElement.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
    }

    renderKhataDetail();
  }

  function filterKhata(mode, type, btn) {
    D.ui.khataFilter = type || "all";
    save();

    if (btn) {
      btn.parentElement.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
    }

    renderKhata(mode);
  }

  function searchKhata(mode) {
    renderKhata(mode);
  }

  function shareKhata() {
    var person = D.ui.selectedPerson;
    var items = D.khata.filter(function (x) {
      return x.person === person &&
        (x.mode || "personal") === D.ui.selectedMode;
    });

    var text = "HISAB - " + person + "\n\n";

    items.forEach(function (x) {
      text +=
        x.date + " | " +
        x.type.toUpperCase() + " | " +
        money(x.amount) + " | " +
        (x.status || "pending") + "\n";
    });

    if (navigator.share) {
      navigator.share({
        title: "HISAB - " + person,
        text: text
      }).catch(function () {});
    } else {
      notify(text);
    }
  }

  function exportKhataPDF() {
    window.print();
  }

  function openPaymentEntry() {
    setValue("khataType", "receive");
    setValue("khataAmount", "");
    setValue("khataDate", today());
    setValue("khataStatus", "settled");
    show("khataEntry");
  }

  window.openKhataForm = openKhataForm;
  window.closeKhataForm = closeKhataForm;
  window.saveKhataEntry = saveKhataEntry;
  window.editKhata = editKhata;
  window.deleteKhata = deleteKhata;
  window.openKhataDetail = openKhataDetail;
  window.closeKhataDetail = closeKhataDetail;
  window.detailFilter = detailFilter;
  window.filterKhata = filterKhata;
  window.searchKhata = searchKhata;
  window.shareKhata = shareKhata;
  window.exportKhataPDF = exportKhataPDF;
  window.openPaymentEntry = openPaymentEntry;

  /* =========================================================
     BUSINESS
     ========================================================= */

  function addBusinessCustomer() {
    var name = prompt("Customer name:");
    if (!name) return;

    D.business.push({
      id: uid("customer"),
      type: "customer",
      name: name,
      createdAt: Date.now()
    });

    save();
    renderBusiness();
  }

  function addBusinessSupplier() {
    var name = prompt("Supplier name:");
    if (!name) return;

    D.business.push({
      id: uid("supplier"),
      type: "supplier",
      name: name,
      createdAt: Date.now()
    });

    save();
    renderBusiness();
  }

  function addBusinessEntry(kind) {
    var name = prompt(
      kind === "sales"
        ? "Customer name:"
        : "Supplier name:"
    );

    if (!name) return;

    var amount = safeNum(prompt("Amount:"));
    if (amount <= 0) return;

    var record = {
      id: uid(kind),
      name: name,
      amount: amount,
      date: today(),
      note: "",
      createdAt: Date.now()
    };

    if (kind === "sales") {
      D.sales.push(record);
    } else {
      D.purchases.push(record);
    }

    save();
    renderBusiness();
  }

  function businessFilter(type, btn) {
    D.ui.businessFilter = type || "customer";
    save();

    if (btn) {
      btn.parentElement.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
    }

    renderBusiness();
  }

  window.addBusinessCustomer = addBusinessCustomer;
  window.addBusinessSupplier = addBusinessSupplier;
  window.businessFilter = businessFilter;

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function addTransaction() {
    var type = getValue("transactionType") === "expense"
      ? "expense"
      : "income";

    var amount = safeNum(getValue("transactionAmount"));
    var category = getValue("transactionCategory");
    var note = getValue("transactionNote");
    var date = getValue("transactionDate") || today();

    if (amount <= 0) {
      notify("Amount enter karein.");
      return;
    }

    D.transactions.push({
      id: uid("txn"),
      type: type,
      amount: amount,
      category: category || "General",
      note: note,
      date: date,
      mode: selectedMode(),
      createdAt: Date.now()
    });

    save();

    setValue("transactionAmount", "");
    setValue("transactionCategory", "");
    setValue("transactionNote", "");
    setValue("transactionDate", today());

    renderAll();
    notify("Transaction added.");
  }

  function deleteTransaction(id) {
    if (!confirm("Delete transaction?")) return;

    D.transactions = D.transactions.filter(function (x) {
      return String(x.id) !== String(id);
    });

    save();
    renderAll();
  }

  window.addTransaction = addTransaction;

  /* =========================================================
     BUDGET / GOALS
     ========================================================= */

  function calcBudget() {
    var amount = safeNum(getValue("budgetAmount"));

    if (amount <= 0) {
      notify("Budget amount enter karein.");
      return;
    }

    D.budget = amount;
    save();
    renderPlanning();
    notify("Budget saved.");
  }

  function calcGoal() {
    var name = getValue("goalName");
    var target = safeNum(getValue("goalTarget"));
    var savedAmount = safeNum(getValue("goalSaved"));
    var date = getValue("goalDate");

    if (!name || target <= 0) {
      notify("Goal name aur target enter karein.");
      return;
    }

    D.goals.push({
      id: uid("goal"),
      name: name,
      target: target,
      saved: savedAmount,
      date: date,
      createdAt: Date.now()
    });

    save();

    setValue("goalName", "");
    setValue("goalTarget", "");
    setValue("goalSaved", "");
    setValue("goalDate", "");

    renderPlanning();
    notify("Goal saved.");
  }

  function deleteGoal(id) {
    D.goals = D.goals.filter(function (x) {
      return String(x.id) !== String(id);
    });

    save();
    renderPlanning();
  }

  window.calcBudget = calcBudget;
  window.calcGoal = calcGoal;

  /* =========================================================
     BILLS / EMI
     ========================================================= */

  function addBill(type) {
    var isCard = type === "Credit Card";

    var name = isCard
      ? "Credit Card"
      : getValue("billName");

    var amount = isCard
      ? safeNum(getValue("cardBill"))
      : safeNum(getValue("billAmount"));

    var due = isCard
      ? getValue("cardDue")
      : getValue("billDue");

    if (!name || amount <= 0) {
      notify("Bill name aur amount enter karein.");
      return;
    }

    D.bills.push({
      id: uid("bill"),
      type: type || "Bill",
      name: name,
      amount: amount,
      dueDate: due || today(),
      status: "pending",
      createdAt: Date.now()
    });

    save();
    renderCredit();
    notify("Bill added.");
  }

  function toggleBillStatus(id) {
    var item = D.bills.find(function (x) {
      return String(x.id) === String(id);
    });

    if (!item) return;

    item.status = item.status === "paid"
      ? "pending"
      : "paid";

    save();
    renderCredit();
  }

  function deleteBill(id) {
    D.bills = D.bills.filter(function (x) {
      return String(x.id) !== String(id);
    });

    save();
    renderCredit();
  }

  function calcEMI() {
    var principal = safeNum(getValue("emiPrincipal"));
    var rate = safeNum(getValue("emiRate"));
    var months = Math.max(1, Math.floor(
      safeNum(getValue("emiMonths"))
    ));

    if (principal <= 0 || months <= 0) {
      notify("Loan amount aur tenure enter karein.");
      return;
    }

    var monthlyRate = rate / 12 / 100;
    var emi;

    if (monthlyRate === 0) {
      emi = principal / months;
    } else {
      emi = principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    D.loans.push({
      id: uid("loan"),
      principal: principal,
      rate: rate,
      months: months,
      emi: emi,
      dueDate: today(),
      status: "pending",
      history: [],
      createdAt: Date.now()
    });

    save();

    setHTML(
      "emiResult",
      "<div class='summary-card'>" +
      "<small>Monthly EMI</small>" +
      "<strong>" + esc(money(emi)) + "</strong>" +
      "<p>Total payable approx. " +
      esc(money(emi * months)) +
      "</p></div>"
    );

    renderCredit();
  }

  window.addBill = addBill;
  window.toggleBillStatus = toggleBillStatus;
  window.deleteBill = deleteBill;
  window.calcEMI = calcEMI;

  /* =========================================================
     REMINDERS
     ========================================================= */

  function addReminder() {
    var name = getValue("reminderName");
    var date = getValue("reminderDate");

    if (!name || !date) {
      notify("Reminder aur date enter karein.");
      return;
    }

    D.reminders.push({
      id: uid("rem"),
      name: name,
      date: date,
      createdAt: Date.now()
    });

    save();

    setValue("reminderName", "");
    setValue("reminderDate", "");

    renderReminders();
  }

  function deleteReminder(id) {
    D.reminders = D.reminders.filter(function (x) {
      return String(x.id) !== String(id);
    });

    save();
    renderReminders();
  }

  window.addReminder = addReminder;

  /* =========================================================
     FAMILY
     ========================================================= */

  function addFamilyMember() {
    var name = getValue("familyName");

    if (!name) {
      notify("Name enter karein.");
      return;
    }

    D.family.push({
      id: uid("family"),
      name: name,
      createdAt: Date.now()
    });

    save();
    setValue("familyName", "");
    renderFamily();
  }

  function deleteFamilyMember(id) {
    D.family = D.family.filter(function (x) {
      return String(x.id) !== String(id);
    });

    save();
    renderFamily();
  }

  window.addFamilyMember = addFamilyMember;

  /* =========================================================
     TOOLS
     ========================================================= */

  function addTool(type) {
    D.tools.push({
      id: uid("tool"),
      type: type,
      date: today(),
      createdAt: Date.now()
    });

    save();
    notify(type + " added.");
    renderTools();
  }

  function calcFD() {
    var p = safeNum(getValue("fdPrincipal"));
    var r = safeNum(getValue("fdRate"));
    var months = safeNum(getValue("fdN"));

    if (p <= 0 || months <= 0) {
      notify("Principal aur months enter karein.");
      return;
    }

    var interest = p * r * months / 12 / 100;
    var maturity = p + interest;

    setHTML(
      "fdResult",
      "<div class='summary-card'>" +
      "<small>Interest</small>" +
      "<strong>" + esc(money(interest)) + "</strong>" +
      "<small>Maturity</small>" +
      "<strong>" + esc(money(maturity)) + "</strong>" +
      "</div>"
    );
  }

  function addInsurance() {
    addTool("Insurance");
  }

  function addSchool() {
    addTool("School");
  }

  function addVehicle() {
    addTool("Vehicle");
  }

  function addShopping() {
    addTool("Shopping");
  }

  function addUtility() {
    addTool("Utility");
  }

  function calcEmergency() {
    var monthly = safeNum(prompt("Monthly essential expense:"));
    var months = safeNum(prompt("Emergency months:")) || 6;

    if (monthly <= 0) return;

    notify(
      "Emergency Fund target: " +
      money(monthly * months)
    );
  }

  function addDoc() {
    addTool("Document");
  }

  function addAnnual() {
    addTool("Annual Planning");
  }

  window.calcFD = calcFD;
  window.addInsurance = addInsurance;
  window.addSchool = addSchool;
  window.addVehicle = addVehicle;
  window.addShopping = addShopping;
  window.addUtility = addUtility;
  window.calcEmergency = calcEmergency;
  window.addDoc = addDoc;
  window.addAnnual = addAnnual;

  /* =========================================================
     LANGUAGE / CURRENCY
     ========================================================= */

  function toggleLanguage() {
    D.language = D.language === "hi" ? "en" : "hi";
    document.documentElement.lang = D.language;
    save();

    notify(
      D.language === "hi"
        ? "Hindi selected."
        : "English selected."
    );

    renderAll();
  }

  function toggleCurrency() {
    var currencies = ["₹", "$", "€", "£", "AED"];
    var index = currencies.indexOf(D.currency);

    D.currency = currencies[
      (index + 1) % currencies.length
    ];

    save();
    renderAll();

    notify("Currency: " + D.currency);
  }

  window.toggleLanguage = toggleLanguage;
  window.toggleCurrency = toggleCurrency;

  /* =========================================================
     SECURITY
     ========================================================= */

  function setPin() {
    var pin = getValue("pinInput");

    if (!/^\d{4,6}$/.test(pin)) {
      notify("4 se 6 digit PIN enter karein.");
      return;
    }

    D.pin = pin;
    save();

    setValue("pinInput", "");
    notify("PIN saved.");
  }

  function lockApp() {
    if (!D.pin) {
      notify("Pehle PIN set karein.");
      return;
    }

    var entered = prompt("Enter PIN:");

    if (entered !== D.pin) {
      notify("Wrong PIN.");
      return;
    }

    try {
      localStorage.removeItem(GUEST_KEY);
    } catch (e) {}

    showGuestGate();
  }

  window.setPin = setPin;
  window.lockApp = lockApp;

  /* =========================================================
     BACKUP / RESTORE
     ========================================================= */

  function exportBackup() {
    try {
      var blob = new Blob(
        [JSON.stringify(D, null, 2)],
        { type: "application/json" }
      );

      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");

      a.href = url;
      a.download = "HISAB-backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      notify("Backup failed.");
    }
  }

  function importBackup(event) {
    var file = event &&
      event.target &&
      event.target.files &&
      event.target.files[0];

    if (!file) return;

    var reader = new FileReader();

    reader.onload = function () {
      try {
        D = normalizeData(JSON.parse(reader.result));
        window.D = D;
        save();
        renderAll();
        notify("Backup restored.");
      } catch (e) {
        notify("Invalid backup file.");
      }
    };

    reader.readAsText(file);
  }

  window.exportBackup = exportBackup;
  window.importBackup = importBackup;

  /* =========================================================
     REPORTS
     ========================================================= */

  function totals() {
    var income = 0;
    var expense = 0;
    var give = 0;
    var receive = 0;

    D.transactions.forEach(function (x) {
      if (x.type === "income") {
        income += safeNum(x.amount);
      } else {
        expense += safeNum(x.amount);
      }
    });

    D.khata.forEach(function (x) {
      if (x.type === "give") {
        give += safeNum(x.amount);
      } else {
        receive += safeNum(x.amount);
      }
    });

    return {
      income: income,
      expense: expense,
      give: give,
      receive: receive,
      balance: income - expense
    };
  }

  function exportSummary() {
    var t = totals();

    var text =
      "HISAB Money Manager\n\n" +
      "Income: " + money(t.income) + "\n" +
      "Expense: " + money(t.expense) + "\n" +
      "Give: " + money(t.give) + "\n" +
      "Receive: " + money(t.receive) + "\n" +
      "Balance: " + money(t.balance);

    if (navigator.share) {
      navigator.share({
        title: "HISAB Summary",
        text: text
      }).catch(function () {});
    } else {
      notify(text);
    }
  }

  function exportSummaryPDF() {
    window.print();
  }

  window.exportSummary = exportSummary;
  window.exportSummaryPDF = exportSummaryPDF;

  /* =========================================================
     QUICK ADD
     ========================================================= */

  function openQuickAdd() {
    var choice = prompt(
      "Enter:\n1 = Income\n2 = Expense\n3 = Udhar Give\n4 = Udhar Receive"
    );

    if (choice === "1" || choice === "2") {
      show("transactions");
      setValue(
        "transactionType",
        choice === "1" ? "income" : "expense"
      );
      return;
    }

    if (choice === "3" || choice === "4") {
      openKhataForm(selectedMode());
      setValue(
        "khataType",
        choice === "3" ? "give" : "receive"
      );
    }
  }

  window.openQuickAdd = openQuickAdd;

  /* =========================================================
     RENDER KHATA
     ========================================================= */

  function renderKhata(mode) {
    var listId = mode === "business"
      ? "businessList"
      : "personalList";

    var list = $(listId);
    if (!list) return;

    var searchEl = mode === "business"
      ? $("businessSearch")
      : $("personalSearch");

    var search = searchEl
      ? String(searchEl.value || "").toLowerCase()
      : "";

    var filter = D.ui.khataFilter || "all";

    var items = D.khata.filter(function (x) {
      return (x.mode || "personal") === mode;
    });

    if (search) {
      items = items.filter(function (x) {
        return String(x.person || "")
          .toLowerCase()
          .indexOf(search) !== -1;
      });
    }

    if (filter !== "all") {
      items = items.filter(function (x) {
        return filter === "pending"
          ? x.status === "pending"
          : x.type === filter;
      });
    }

    var give = 0;
    var receive = 0;

    D.khata.forEach(function (x) {
      if ((x.mode || "personal") !== mode) return;

      if (x.type === "give") {
        give += safeNum(x.amount);
      } else {
        receive += safeNum(x.amount);
      }
    });

    if (mode === "business") {
      setHTML("businessGiven", money(give));
      setHTML("businessReceived", money(receive));
      setHTML("businessNet", money(give - receive));
    } else {
      setHTML("ledgerGiven", money(give));
      setHTML("ledgerReceived", money(receive));
      setHTML("ledgerNet", money(give - receive));
    }

    if (!items.length) {
      list.innerHTML =
        "<div class='empty-state'>No entries yet.</div>";
      return;
    }

    var grouped = {};

    items.forEach(function (x) {
      var key = x.person || "Unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(x);
    });

    var html = "";

    Object.keys(grouped).forEach(function (person) {
      var arrItems = grouped[person];
      var g = 0;
      var r = 0;

      arrItems.forEach(function (x) {
        if (x.type === "give") g += safeNum(x.amount);
        else r += safeNum(x.amount);
      });

      html +=
        "<div class='list-card' onclick=\"openKhataDetail(" +
        JSON.stringify(person) + "," +
        JSON.stringify(mode) + ")\">" +
        "<div><strong>" + esc(person) + "</strong>" +
        "<small>" + arrItems.length + " entries</small></div>" +
        "<div>" +
        "<b>Give: " + esc(money(g)) + "</b><br>" +
        "<b>Receive: " + esc(money(r)) + "</b>" +
        "</div></div>";
    });

    list.innerHTML = html;
  }

  /* =========================================================
     DETAIL
     ========================================================= */

  function renderKhataDetail() {
    var person = D.ui.selectedPerson;
    var mode = D.ui.selectedMode || "personal";
    var filter = D.ui.detailFilter || "all";

    var items = D.khata.filter(function (x) {
      return x.person === person &&
        (x.mode || "personal") === mode;
    });

    var give = 0;
    var receive = 0;

    items.forEach(function (x) {
      if (x.type === "give") give += safeNum(x.amount);
      else receive += safeNum(x.amount);
    });

    setHTML("detailPersonName", esc(person || "Khata"));
    setHTML("detailGive", money(give));
    setHTML("detailReceive", money(receive));
    setHTML("detailBalance", money(give - receive));

    var history = items;

    if (filter !== "all") {
      history = items.filter(function (x) {
        return filter === "pending"
          ? x.status === "pending"
          : x.type === filter;
      });
    }

    if (!history.length) {
      setHTML(
        "khataHistory",
        "<div class='empty-state'>No history.</div>"
      );
      return;
    }

    history.sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });

    var html = "";

    history.forEach(function (x) {
      var cls = x.type === "give"
        ? "give-entry"
        : "receive-entry";

      html +=
        "<div class='list-card " + cls + "'>" +
        "<div>" +
        "<strong>" +
        esc(x.type === "give" ? "Give" : "Receive") +
        "</strong>" +
        "<small>" + esc(x.date) + "</small>" +
        "<small>" + esc(x.method || "Cash") + "</small>" +
        "<small>" + esc(x.status || "pending") + "</small>" +
        (x.note
          ? "<small>" + esc(x.note) + "</small>"
          : "") +
        "</div>" +
        "<div><strong>" + esc(money(x.amount)) + "</strong>" +
        "<br><button type='button' onclick=\"event.stopPropagation();editKhata(" +
        JSON.stringify(x.id) +
        ")\">Edit</button>" +
        "<button type='button' onclick=\"event.stopPropagation();deleteKhata(" +
        JSON.stringify(x.id) +
        ")\">Delete</button>" +
        "</div></div>";
    });

    setHTML("khataHistory", html);
  }

  /* =========================================================
     BUSINESS RENDER
     ========================================================= */

  function renderBusiness() {
    var list = $("businessList");
    if (!list) return;

    var filter = D.ui.businessFilter || "customer";

    var search = getValue("businessSearch").toLowerCase();

    var html = "";

    if (filter === "sales" || filter === "purchase") {
      var source = filter === "sales"
        ? D.sales
        : D.purchases;

      if (search) {
        source = source.filter(function (x) {
          return String(x.name || "")
            .toLowerCase()
            .indexOf(search) !== -1;
        });
      }

      html +=
        "<div class='action-row'>" +
        "<button type='button' onclick=\"addBusinessEntry(" +
        JSON.stringify(filter) +
        ")\">＋ Add " +
        (filter === "sales" ? "Sale" : "Purchase") +
        "</button></div>";

      source.forEach(function (x) {
        html +=
          "<div class='list-card'>" +
          "<div><strong>" + esc(x.name) + "</strong>" +
          "<small>" + esc(x.date) + "</small></div>" +
          "<strong>" + esc(money(x.amount)) + "</strong>" +
          "</div>";
      });

      if (!source.length) {
        html += "<div class='empty-state'>No entries.</div>";
      }

      list.innerHTML = html;
      return;
    }

    var contacts = D.business.filter(function (x) {
      return x.type === filter;
    });

    if (search) {
      contacts = contacts.filter(function (x) {
        return String(x.name || "")
          .toLowerCase()
          .indexOf(search) !== -1;
      });
    }

    contacts.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<div><strong>" + esc(x.name) + "</strong>" +
        "<small>" + esc(x.type) + "</small></div>" +
        "</div>";
    });

    if (!contacts.length) {
      html +=
        "<div class='empty-state'>No " +
        esc(filter) +
        " found.</div>";
    }

    list.innerHTML = html;
  }

  /* =========================================================
     TRANSACTION RENDER
     ========================================================= */

  function renderTransactions() {
    var list = $("transactionList");
    if (!list) return;

    var items = D.transactions
      .filter(function (x) {
        return (x.mode || "personal") === selectedMode();
      })
      .slice()
      .sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date));
      });

    if (!items.length) {
      list.innerHTML =
        "<div class='empty-state'>No transactions yet.</div>";
      return;
    }

    var html = "";

    items.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<div><strong>" +
        esc(x.type === "income" ? "Income" : "Expense") +
        "</strong>" +
        "<small>" + esc(x.category) + "</small>" +
        "<small>" + esc(x.date) + "</small>" +
        (x.note
          ? "<small>" + esc(x.note) + "</small>"
          : "") +
        "</div>" +
        "<div><strong>" +
        esc(money(x.amount)) +
        "</strong><br>" +
        "<button type='button' onclick=\"deleteTransaction(" +
        JSON.stringify(x.id) +
        ")\">Delete</button></div>" +
        "</div>";
    });

    list.innerHTML = html;
  }

  window.deleteTransaction = deleteTransaction;

  /* =========================================================
     PLANNING RENDER
     ========================================================= */

  function renderPlanning() {
    setValue("budgetAmount", D.budget || "");

    var list = $("goalList");
    if (!list) return;

    var spent = D.transactions
      .filter(function (x) {
        return x.type === "expense" &&
          (x.mode || "personal") === selectedMode();
      })
      .reduce(function (sum, x) {
        return sum + safeNum(x.amount);
      }, 0);

    var html =
      "<div class='summary-card'>" +
      "<small>Budget</small><strong>" +
      esc(money(D.budget)) +
      "</strong>" +
      "<small>Spent</small><strong>" +
      esc(money(spent)) +
      "</strong>" +
      "<small>Remaining</small><strong>" +
      esc(money(D.budget - spent)) +
      "</strong></div>";

    D.goals.forEach(function (g) {
      var progress = g.target > 0
        ? Math.min(100, g.saved / g.target * 100)
        : 0;

      html +=
        "<div class='list-card'>" +
        "<div><strong>" + esc(g.name) + "</strong>" +
        "<small>Target: " + esc(money(g.target)) + "</small>" +
        "<small>Saved: " + esc(money(g.saved)) + "</small>" +
        (g.date ? "<small>Date: " + esc(g.date) + "</small>" : "") +
        "</div>" +
        "<div><strong>" +
        progress.toFixed(0) +
        "%</strong><br>" +
        "<button type='button' onclick=\"deleteGoal(" +
        JSON.stringify(g.id) +
        ")\">Delete</button></div></div>";
    });

    list.innerHTML = html;
  }

  window.deleteGoal = deleteGoal;

  /* =========================================================
     CREDIT RENDER
     ========================================================= */

  function renderCredit() {
    var list = $("billList");
    if (!list) return;

    var html = "";

    D.bills.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<div><strong>" + esc(x.name) + "</strong>" +
        "<small>" + esc(x.type) + "</small>" +
        "<small>Due: " + esc(x.dueDate || "") + "</small>" +
        "<small>Status: " + esc(x.status || "pending") + "</small>" +
        "</div>" +
        "<div><strong>" + esc(money(x.amount)) + "</strong>" +
        "<br><button type='button' onclick=\"toggleBillStatus(" +
        JSON.stringify(x.id) +
        ")\">" +
        (x.status === "paid" ? "Mark Pending" : "Mark Paid") +
        "</button>" +
        "<button type='button' onclick=\"deleteBill(" +
        JSON.stringify(x.id) +
        ")\">Delete</button></div></div>";
    });

    D.loans.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<div><strong>Loan / EMI</strong>" +
        "<small>Principal: " + esc(money(x.principal)) + "</small>" +
        "<small>Rate: " + esc(x.rate) + "%</small>" +
        "<small>Tenure: " + esc(x.months) + " months</small>" +
        "</div><div><strong>" +
        esc(money(x.emi)) +
        "</strong><small>EMI</small></div></div>";
    });

    if (!html) {
      html = "<div class='empty-state'>No payment records.</div>";
    }

    list.innerHTML = html;
  }

  /* =========================================================
     REMINDERS RENDER
     ========================================================= */

  function renderReminders() {
    var list = $("reminderList");
    if (!list) return;

    if (!D.reminders.length) {
      list.innerHTML =
        "<div class='empty-state'>No reminders.</div>";
      return;
    }

    var html = "";

    D.reminders.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<div><strong>" + esc(x.name) + "</strong>" +
        "<small>" + esc(x.date) + "</small></div>" +
        "<button type='button' onclick=\"deleteReminder(" +
        JSON.stringify(x.id) +
        ")\">Delete</button></div>";
    });

    list.innerHTML = html;
  }

  window.deleteReminder = deleteReminder;

  /* =========================================================
     FAMILY RENDER
     ========================================================= */

  function renderFamily() {
    var list = $("familyList");
    if (!list) return;

    if (!D.family.length) {
      list.innerHTML =
        "<div class='empty-state'>No family members.</div>";
      return;
    }

    var html = "";

    D.family.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<strong>" + esc(x.name) + "</strong>" +
        "<button type='button' onclick=\"deleteFamilyMember(" +
        JSON.stringify(x.id) +
        ")\">Delete</button></div>";
    });

    list.innerHTML = html;
  }

  window.deleteFamilyMember = deleteFamilyMember;

  /* =========================================================
     TOOLS RENDER
     ========================================================= */

  function renderTools() {
    var container = $("tools13");
    if (!container) return;

    var old = container.querySelector(".hisab-tools-history");

    if (old) old.remove();

    if (!D.tools.length) return;

    var box = document.createElement("div");
    box.className = "form-card hisab-tools-history";

    var html = "<h3>Added Tools</h3>";

    D.tools.forEach(function (x) {
      html +=
        "<div class='list-card'>" +
        "<strong>" + esc(x.type) + "</strong>" +
        "<small>" + esc(x.date) + "</small>" +
        "</div>";
    });

    box.innerHTML = html;
    container.appendChild(box);
  }

  /* =========================================================
     HOME
     ========================================================= */

  function renderHome() {
    var t = totals();

    setHTML("receivable", money(t.receive));
    setHTML("payable", money(t.give));
    setHTML("homeBalance", money(t.balance));

    var p = $("personalModeBtn");
    var b = $("businessModeBtn");

    if (p) p.classList.toggle("active", D.mode === "personal");
    if (b) b.classList.toggle("active", D.mode === "business");

    var label = $("modeLabel");

    if (label) {
      label.textContent =
        D.mode === "business"
          ? "Business"
          : "Personal";
    }
  }

  /* =========================================================
     REPORT RENDER
     ========================================================= */

  function renderReports() {
    var t = totals();

    setHTML("reportIncome", money(t.income));
    setHTML("reportExpense", money(t.expense));
    setHTML("reportGive", money(t.give));
    setHTML("reportReceive", money(t.receive));

    var report = $("reportContent");
    if (!report) return;

    var balance = t.income - t.expense;

    report.innerHTML =
      "<div class='form-card'>" +
      "<h3>Overview</h3>" +
      "<p>Balance: <strong>" +
      esc(money(balance)) +
      "</strong></p>" +
      "<p>Transactions: " +
      esc(D.transactions.length) +
      "</p>" +
      "<p>Udhar Entries: " +
      esc(D.khata.length) +
      "</p>" +
      "<p>Bills: " +
      esc(D.bills.length) +
      "</p>" +
      "<p>Goals: " +
      esc(D.goals.length) +
      "</p>" +
      "</div>";
  }

  /* =========================================================
     SEARCH ALL
     ========================================================= */

  function searchAllData(value) {
    var q = String(value || "").toLowerCase();
    var list = $("searchResults");

    if (!list) return;

    if (!q) {
      list.innerHTML = "";
      return;
    }

    var results = [];

    D.transactions.forEach(function (x) {
      var text =
        (x.category || "") + " " +
        (x.note || "");

      if (text.toLowerCase().indexOf(q) !== -1) {
        results.push(
          "Transaction: " + x.category +
          " - " + money(x.amount)
        );
      }
    });

    D.khata.forEach(function (x) {
      if (
        String(x.person || "")
          .toLowerCase()
          .indexOf(q) !== -1
      ) {
        results.push(
          "Udhar: " + x.person +
          " - " + money(x.amount)
        );
      }
    });

    D.business.forEach(function (x) {
      if (
        String(x.name || "")
          .toLowerCase()
          .indexOf(q) !== -1
      ) {
        results.push(
          "Business: " + x.name
        );
      }
    });

    if (!results.length) {
      list.innerHTML =
        "<div class='empty-state'>No results.</div>";
      return;
    }

    list.innerHTML = results.map(function (x) {
      return "<div class='list-card'>" +
        esc(x) +
        "</div>";
    }).join("");
  }

  window.searchAllData = searchAllData;

  /* =========================================================
     RENDER ALL
     ========================================================= */

  function renderAll() {
    try {
      renderHome();
      renderKhata("personal");
      renderKhata("business");
      renderKhataDetail();
      renderBusiness();
      renderTransactions();
      renderPlanning();
      renderCredit();
      renderReminders();
      renderFamily();
      renderTools();
      renderReports();
      prepareBackButtons();
    } catch (e) {
      console.error("HISAB render error:", e);
    }
  }

  /* =========================================================
     STARTUP
     ========================================================= */

  function init() {
    try {
      document.documentElement.lang = D.language || "hi";

      showGuestGate();
      renderAll();

      var entered = false;

      try {
        entered =
          localStorage.getItem(GUEST_KEY) === "1";
      } catch (e) {}

      if (entered) {
        show(D.ui.lastPage || "home", false);
      } else {
        pages.forEach(function (id) {
          var p = $(id);
          if (p) {
            p.style.display = "none";
            p.classList.remove("active");
          }
        });
      }

      save();
    } catch (e) {
      console.error("HISAB startup error:", e);

      try {
        var gate = $("guestGate");
        var shell = $("appShell");
        var home = $("home");

        if (gate) gate.style.display = "none";
        if (shell) shell.style.display = "";

        if (home) {
          document.querySelectorAll(".page").forEach(function (p) {
            p.style.display = "none";
            p.classList.remove("active");
          });

          home.style.display = "";
          home.classList.add("active");
        }
      } catch (x) {
        console.error("Emergency startup failed:", x);
      }
    }
  }

  window.HISAB_REPAIR = {
    back: goBack,
    home: function () {
      pageHistory = [];
      show("home", false);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
