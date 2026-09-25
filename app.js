(() => {
  "use strict";

  /* =========================================================
     HISAB GLOBAL V7
     Personal + Business
     Money + Udhaar/Khata + Budget + Goals
     Bills + EMI + Reports + Backup + Security
  ========================================================= */

  const STORAGE_KEY = "hisab_v7_data";

  const DEFAULT_DATA = {
    version: 7,
    mode: "personal",
    currency: "₹",
    lang: "hi",
    pin: "",
    transactions: [],
    people: [],
    bills: [],
    reminders: [],
    goals: [],
    budget: 0,
    family: [],
    insurance: [],
    schools: [],
    vehicles: [],
    shopping: [],
    utilities: [],
    docs: [],
    annual: [],
    limits: []
  };

  let D = loadData();
  let currentKhataMode = "personal";
  let currentPersonId = null;
  let currentKhataFilter = "all";
  let currentBusinessFilter = "customer";

  /* ================= BASIC HELPERS ================= */

  const $ = id => document.getElementById(id);

  const num = value => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const today = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const money = value => {
    const n = num(value);
    return `${D.currency}${n.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })}`;
  };

  const esc = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const toast = message => {
    let t = $("hisabToast");

    if (!t) {
      t = document.createElement("div");
      t.id = "hisabToast";
      t.style.cssText =
        "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);" +
        "background:#082b45;color:#fff;padding:12px 18px;border-radius:12px;" +
        "z-index:99999;font-size:14px;box-shadow:0 5px 20px #0004";
      document.body.appendChild(t);
    }

    t.textContent = message;
    t.style.display = "block";

    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.style.display = "none";
    }, 2200);
  };

  /* ================= STORAGE ================= */

  function loadData() {
    let raw = null;

    const keys = [
      STORAGE_KEY,
      "hisab_v7_complete",
      "hisab_v7_final",
      "hisabData"
    ];

    for (const key of keys) {
      try {
        raw = localStorage.getItem(key);
        if (raw) break;
      } catch (_) {}
    }

    if (!raw) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    try {
      const old = JSON.parse(raw);
      const data = {
        ...JSON.parse(JSON.stringify(DEFAULT_DATA)),
        ...old
      };

      if (!Array.isArray(data.transactions)) data.transactions = [];
      if (!Array.isArray(data.people)) data.people = [];
      if (!Array.isArray(data.bills)) data.bills = [];
      if (!Array.isArray(data.reminders)) data.reminders = [];
      if (!Array.isArray(data.goals)) data.goals = [];
      if (!Array.isArray(data.family)) data.family = [];

      return data;
    } catch (_) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(D));
      localStorage.setItem("hisab_v7_complete", JSON.stringify(D));
    } catch (_) {
      toast("Data save nahi ho saka");
    }
  }

  /* ================= GUEST / START ================= */

  function showGuestGate() {
    const gate = $("guestGate");
    const shell = $("appShell");

    if (gate) gate.style.display = "flex";
    if (shell) shell.style.display = "none";
  }

  function enterGuestMode() {
    const gate = $("guestGate");
    const shell = $("appShell");

    if (gate) gate.style.display = "none";
    if (shell) shell.style.display = "block";

    setMode(D.mode || "personal");
    show("home");
  }

  /* ================= NAVIGATION ================= */

  function show(id) {
    document.querySelectorAll(".page").forEach(page => {
      page.style.display = "none";
    });

    const page = $(id);

    if (page) {
      page.style.display = "block";
      window.scrollTo(0, 0);
    }

    if (id === "home") renderHome();
    if (id === "personal") renderPersonal();
    if (id === "business") renderBusiness();
    if (id === "transactions") renderTransactions();
    if (id === "planning") renderGoals();
    if (id === "credit") renderBills();
    if (id === "reports") renderReports();
    if (id === "reminders") renderReminders();
    if (id === "family") renderFamily();
  }

  /* ================= MODE ================= */

  function setMode(mode) {
    D.mode = mode === "business" ? "business" : "personal";
    save();

    const label = $("modeLabel");
    if (label) {
      label.textContent =
        D.mode === "business" ? "Business" : "Personal";
    }

    show(D.mode === "business" ? "business" : "home");
    renderHome();
  }

  function toggleLanguage() {
    D.lang = D.lang === "hi" ? "en" : "hi";
    save();

    toast(
      D.lang === "hi"
        ? "Language: Hindi"
        : "Language: English"
    );
  }

  function toggleCurrency() {
    const currencies = ["₹", "$", "€", "£"];
    const i = currencies.indexOf(D.currency);
    D.currency = currencies[(i + 1) % currencies.length];

    save();
    renderAll();

    toast(`Currency: ${D.currency}`);
  }

  /* ================= HOME ================= */

  function currentPeople() {
    return D.people.filter(
      p => (p.mode || "personal") === D.mode
    );
  }

  function totalGiven(people = currentPeople()) {
    return people.reduce((sum, p) => {
      return (
        sum +
        (p.entries || []).reduce(
          (s, e) => s + (e.type === "give" ? num(e.amount) : 0),
          0
        )
      );
    }, 0);
  }

  function totalReceived(people = currentPeople()) {
    return people.reduce((sum, p) => {
      return (
        sum +
        (p.entries || []).reduce(
          (s, e) =>
            s + (e.type === "receive" ? num(e.amount) : 0),
          0
        )
      );
    }, 0);
  }

  function renderHome() {
    const people = currentPeople();

    const given = totalGiven(people);
    const received = totalReceived(people);
    const income = D.transactions
      .filter(t => t.type === "income")
      .reduce((s, t) => s + num(t.amount), 0);

    const expense = D.transactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + num(t.amount), 0);

    if ($("receivable"))
      $("receivable").textContent = money(given);

    if ($("payable"))
      $("payable").textContent = money(received);

    if ($("homeBalance"))
      $("homeBalance").textContent =
        money(income - expense);

    if ($("modeLabel"))
      $("modeLabel").textContent =
        D.mode === "business" ? "Business" : "Personal";
  }

  /* ================= KHATA / UDHAR ================= */

  function openKhataForm(mode = D.mode) {
    currentKhataMode =
      mode === "business" ? "business" : "personal";

    if ($("khataPerson")) $("khataPerson").value = "";
    if ($("khataAmount")) $("khataAmount").value = "";
    if ($("khataNote")) $("khataNote").value = "";
    if ($("khataDate")) $("khataDate").value = today();

    if ($("khataType")) $("khataType").value = "give";
    if ($("khataStatus"))
      $("khataStatus").value = "pending";

    show("khataEntry");
  }

  function closeKhataForm() {
    show(
      currentKhataMode === "business"
        ? "business"
        : "personal"
    );
  }

  function saveKhataEntry() {
    const name = ($("khataPerson")?.value || "").trim();
    const type = $("khataType")?.value || "give";
    const amount = num($("khataAmount")?.value);
    const date = $("khataDate")?.value || today();
    const method = $("khataMethod")?.value || "Cash";
    const status = $("khataStatus")?.value || "pending";
    const note = ($("khataNote")?.value || "").trim();

    if (!name) {
      toast("Person ka naam enter karein");
      return;
    }

    if (amount <= 0) {
      toast("Amount enter karein");
      return;
    }

    let person = D.people.find(
      p =>
        p.mode === currentKhataMode &&
        p.name.toLowerCase() === name.toLowerCase()
    );

    if (!person) {
      person = {
        id: uid(),
        name,
        mode: currentKhataMode,
        category:
          currentKhataMode === "business"
            ? "customer"
            : "person",
        entries: []
      };

      D.people.push(person);
    }

    if (!Array.isArray(person.entries)) {
      person.entries = [];
    }

    person.entries.push({
      id: uid(),
      type,
      amount,
      date,
      method,
      status,
      note,
      createdAt: Date.now()
    });

    save();

    toast(
      type === "give"
        ? "Give entry saved"
        : "Receive entry saved"
    );

    currentPersonId = person.id;

    renderAll();
    openKhataDetail(person.id);
  }

  function searchKhata(mode) {
    if (mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }
  }

  function filterKhata(mode, filter, button) {
    currentKhataFilter = filter;

    if (button) {
      button.parentElement
        ?.querySelectorAll("button")
        .forEach(b => b.classList.remove("active"));

      button.classList.add("active");
    }

    if (mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }
  }

  function businessFilter(filter, button) {
    currentBusinessFilter = filter;

    if (button) {
      button.parentElement
        ?.querySelectorAll("button")
        .forEach(b => b.classList.remove("active"));

      button.classList.add("active");
    }

    renderBusiness();
  }

  function personBalance(person) {
    const give = (person.entries || [])
      .filter(e => e.type === "give")
      .reduce((s, e) => s + num(e.amount), 0);

    const receive = (person.entries || [])
      .filter(e => e.type === "receive")
      .reduce((s, e) => s + num(e.amount), 0);

    return {
      give,
      receive,
      balance: give - receive
    };
  }

  function renderPersonal() {
    const people = currentPeople();
    const q = (
      $("personalSearch")?.value || ""
    ).toLowerCase().trim();

    const given = totalGiven(people);
    const received = totalReceived(people);

    if ($("ledgerGiven"))
      $("ledgerGiven").textContent = money(given);

    if ($("ledgerReceived"))
      $("ledgerReceived").textContent = money(received);

    if ($("ledgerNet"))
      $("ledgerNet").textContent =
        money(given - received);

    const list = $("personalList");
    if (!list) return;

    const filtered = people.filter(p => {
      if (
        q &&
        !p.name.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (currentKhataFilter === "give") {
        return (p.entries || []).some(
          e => e.type === "give"
        );
      }

      if (currentKhataFilter === "receive") {
        return (p.entries || []).some(
          e => e.type === "receive"
        );
      }

      if (currentKhataFilter === "pending") {
        return (p.entries || []).some(
          e => e.status === "pending"
        );
      }

      return true;
    });

    list.innerHTML =
      filtered.length
        ? filtered.map(personCard).join("")
        : `<div class="empty">No Udhar entries yet.</div>`;
  }

  function renderBusiness() {
    const people = D.people.filter(
      p => p.mode === "business"
    );

    const q = (
      $("businessSearch")?.value || ""
    ).toLowerCase().trim();

    const given = totalGiven(people);
    const received = totalReceived(people);

    if ($("businessGiven"))
      $("businessGiven").textContent = money(given);

    if ($("businessReceived"))
      $("businessReceived").textContent =
        money(received);

    if ($("businessNet"))
      $("businessNet").textContent =
        money(given - received);

    const list = $("businessList");
    if (!list) return;

    const filtered = people.filter(p => {
      if (
        q &&
        !p.name.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (
        currentBusinessFilter &&
        p.category &&
        p.category !== currentBusinessFilter
      ) {
        return false;
      }

      return true;
    });

    list.innerHTML =
      filtered.length
        ? filtered.map(personCard).join("")
        : `<div class="empty">No business entries yet.</div>`;
  }

  function personCard(person) {
    const b = personBalance(person);

    const last =
      (person.entries || [])
        .slice()
        .sort((a, z) =>
          String(z.date).localeCompare(String(a.date))
        )[0];

    const lastText = last
      ? `${esc(last.date)} • ${esc(last.method)}`
      : "No entries";

    return `
      <div class="list-card"
           onclick="openKhataDetail('${esc(person.id)}')">

        <div class="list-main">
          <strong>${esc(person.name)}</strong>
          <small>${lastText}</small>
        </div>

        <div class="list-money">
          <span style="color:#c62828">
            Give ${money(b.give)}
          </span>
          <span style="color:#168a4a">
            Receive ${money(b.receive)}
          </span>
          <b>${money(b.balance)}</b>
        </div>

      </div>
    `;
  }

  /* ================= KHATA DETAIL ================= */

  function openKhataDetail(personId) {
    const person = D.people.find(
      p => p.id === personId
    );

    if (!person) {
      toast("Khata nahi mila");
      return;
    }

    currentPersonId = personId;

    if ($("detailPersonName"))
      $("detailPersonName").textContent = person.name;

    const b = personBalance(person);

    if ($("detailGive"))
      $("detailGive").textContent = money(b.give);

    if ($("detailReceive"))
      $("detailReceive").textContent =
        money(b.receive);

    if ($("detailBalance"))
      $("detailBalance").textContent =
        money(b.balance);

    renderKhataHistory();
    show("khataDetail");
  }

  function closeKhataDetail() {
    const person = D.people.find(
      p => p.id === currentPersonId
    );

    show(
      person?.mode === "business"
        ? "business"
        : "personal"
    );
  }

  function detailFilter(filter, button) {
    currentKhataFilter = filter;

    if (button) {
      button.parentElement
        ?.querySelectorAll("button")
        .forEach(b => b.classList.remove("active"));

      button.classList.add("active");
    }

    renderKhataHistory();
  }

  function renderKhataHistory() {
    const person = D.people.find(
      p => p.id === currentPersonId
    );

    const box = $("khataHistory");
    if (!box || !person) return;

    let entries = Array.isArray(person.entries)
      ? [...person.entries]
      : [];

    if (currentKhataFilter !== "all") {
      entries = entries.filter(e => {
        if (
          currentKhataFilter === "pending"
        ) {
          return e.status === "pending";
        }

        return e.type === currentKhataFilter;
      });
    }

    entries.sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    box.innerHTML =
      entries.length
        ? entries.map(e => entryCard(e)).join("")
        : `<div class="empty">No entries.</div>`;
  }

  function entryCard(entry) {
    const give = entry.type === "give";

    return `
      <div class="list-card">

        <div class="list-main">
          <strong style="color:${give ? "#c62828" : "#168a4a"}">
            ${give ? "Give" : "Receive"} ${money(entry.amount)}
          </strong>

          <small>
            ${esc(entry.date)}
            • ${esc(entry.method)}
            • ${esc(entry.status)}
          </small>

          ${
            entry.note
              ? `<small>${esc(entry.note)}</small>`
              : ""
          }
        </div>

        <div class="entry-actions">
          <button onclick="event.stopPropagation();editKhataEntry('${esc(entry.id)}')">
            ✏️
          </button>

          <button onclick="event.stopPropagation();toggleKhataStatus('${esc(entry.id)}')">
            ${entry.status === "pending" ? "✓" : "↩"}
          </button>

          <button onclick="event.stopPropagation();deleteKhataEntry('${esc(entry.id)}')">
            🗑
          </button>
        </div>

      </div>
    `;
  }

  function findCurrentEntry(entryId) {
    const person = D.people.find(
      p => p.id === currentPersonId
    );

    if (!person) return null;

    return {
      person,
      entry: (person.entries || []).find(
        e => e.id === entryId
      )
    };
  }

  function editKhataEntry(entryId) {
    const found = findCurrentEntry(entryId);

    if (!found?.entry) return;

    const e = found.entry;

    currentKhataMode = found.person.mode;

    if ($("khataPerson"))
      $("khataPerson").value = found.person.name;

    if ($("khataType"))
      $("khataType").value = e.type;

    if ($("khataAmount"))
      $("khataAmount").value = e.amount;

    if ($("khataDate"))
      $("khataDate").value = e.date;

    if ($("khataMethod"))
      $("khataMethod").value = e.method;

    if ($("khataStatus"))
      $("khataStatus").value = e.status;

    if ($("khataNote"))
      $("khataNote").value = e.note || "";

    window._editingKhataEntry = entryId;

    show("khataEntry");
  }

  const originalSaveKhataEntry = saveKhataEntry;

  function saveEditedOrNewKhata() {
    if (!window._editingKhataEntry) {
      originalSaveKhataEntry();
      return;
    }

    const found = findCurrentEntry(
      window._editingKhataEntry
    );

    if (!found?.entry) {
      window._editingKhataEntry = null;
      originalSaveKhataEntry();
      return;
    }

    const name = ($("khataPerson")?.value || "").trim();
    const amount = num($("khataAmount")?.value);

    if (!name || amount <= 0) {
      toast("Name aur amount enter karein");
      return;
    }

    found.person.name = name;

    found.entry.type =
      $("khataType")?.value || "give";

    found.entry.amount = amount;
    found.entry.date =
      $("khataDate")?.value || today();

    found.entry.method =
      $("khataMethod")?.value || "Cash";

    found.entry.status =
      $("khataStatus")?.value || "pending";

    found.entry.note =
      ($("khataNote")?.value || "").trim();

    window._editingKhataEntry = null;

    save();

    toast("Entry updated");

    renderAll();
    openKhataDetail(found.person.id);
  }

  function deleteKhataEntry(entryId) {
    const found = findCurrentEntry(entryId);

    if (!found?.entry) return;

    if (
      !confirm(
        "Kya aap ye entry delete karna chahte hain?"
      )
    ) {
      return;
    }

    found.person.entries =
      found.person.entries.filter(
        e => e.id !== entryId
      );

    save();
    toast("Entry deleted");

    renderAll();
    openKhataDetail(found.person.id);
  }

  function toggleKhataStatus(entryId) {
    const found = findCurrentEntry(entryId);

    if (!found?.entry) return;

    found.entry.status =
      found.entry.status === "pending"
        ? "settled"
        : "pending";

    save();
    renderKhataHistory();
    renderAll();

    toast(
      found.entry.status === "settled"
        ? "Payment settled"
        : "Payment pending"
    );
  }

  function openPaymentEntry() {
    if (!currentPersonId) return;

    openKhataForm(
      D.people.find(
        p => p.id === currentPersonId
      )?.mode || "personal"
    );

    const person = D.people.find(
      p => p.id === currentPersonId
    );

    if (person && $("khataPerson")) {
      $("khataPerson").value = person.name;
    }

    if ($("khataType"))
      $("khataType").value = "receive";

    if ($("khataStatus"))
      $("khataStatus").value = "settled";
  }

  /* ================= TRANSACTIONS ================= */

  function addTransaction() {
    const type =
      $("transactionType")?.value || "expense";

    const amount =
      num($("transactionAmount")?.value);

    if (amount <= 0) {
      toast("Amount enter karein");
      return;
    }

    D.transactions.push({
      id: uid(),
      type,
      amount,
      category:
        ($("transactionCategory")?.value || "Other").trim(),
      note:
        ($("transactionNote")?.value || "").trim(),
      date:
        $("transactionDate")?.value || today()
    });

    save();

    if ($("transactionAmount"))
      $("transactionAmount").value = "";

    if ($("transactionCategory"))
      $("transactionCategory").value = "";

    if ($("transactionNote"))
      $("transactionNote").value = "";

    toast("Transaction added");
    renderAll();
  }

  function renderTransactions() {
    const box = $("transactionList");
    if (!box) return;

    const items = [...D.transactions].sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    box.innerHTML =
      items.length
        ? items
            .map(
              t => `
          <div class="list-card">
            <div class="list-main">
              <strong>
                ${esc(t.category)}
              </strong>
              <small>
                ${esc(t.date)}
                ${t.note ? " • " + esc(t.note) : ""}
              </small>
            </div>

            <strong style="color:${t.type === "income" ? "#168a4a" : "#c62828"}">
              ${t.type === "income" ? "+" : "-"}${money(t.amount)}
            </strong>
          </div>
        `
            )
            .join("")
        : `<div class="empty">No transactions.</div>`;
  }

  /* ================= BUDGET ================= */

  function calcBudget() {
    const amount = num(
      $("budgetAmount")?.value
    );

    if (amount <= 0) {
      toast("Budget amount enter karein");
      return;
    }

    D.budget = amount;
    save();

    toast("Budget saved");
  }

  /* ================= GOALS ================= */

  function calcGoal() {
    const name =
      ($("goalName")?.value || "").trim();

    const target =
      num($("goalTarget")?.value);

    const saved =
      num($("goalSaved")?.value);

    const date =
      $("goalDate")?.value || "";

    if (!name || target <= 0) {
      toast("Goal name aur target enter karein");
      return;
    }

    D.goals.push({
      id: uid(),
      name,
      target,
      saved,
      date
    });

    save();

    toast("Goal saved");
    renderGoals();
  }

  function renderGoals() {
    const box = $("goalList");
    if (!box) return;

    box.innerHTML =
      D.goals.length
        ? D.goals
            .map(g => {
              const percent = Math.min(
                100,
                Math.round(
                  (num(g.saved) / num(g.target)) *
                    100
                )
              );

              return `
                <div class="list-card">
                  <div class="list-main">
                    <strong>${esc(g.name)}</strong>
                    <small>
                      ${money(g.saved)} / ${money(g.target)}
                      ${g.date ? " • " + esc(g.date) : ""}
                    </small>
                  </div>
                  <strong>${percent}%</strong>
                </div>
              `;
            })
            .join("")
        : `<div class="empty">No goals yet.</div>`;
  }

  /* ================= BILLS ================= */

  function addBill(kind = "Bill") {
    const isCard = kind === "Credit Card";

    const name = isCard
      ? "Credit Card"
      : ($("billName")?.value || "Bill").trim();

    const amount = isCard
      ? num($("cardBill")?.value)
      : num($("billAmount")?.value);

    const due = isCard
      ? $("cardDue")?.value || today()
      : $("billDue")?.value || today();

    if (amount <= 0) {
      toast("Bill amount enter karein");
      return;
    }

    D.bills.push({
      id: uid(),
      name,
      amount,
      due,
      kind,
      status: "pending"
    });

    save();
    toast(`${kind} added`);
    renderBills();
  }

  function renderBills() {
    const box = $("billList");
    if (!box) return;

    box.innerHTML =
      D.bills.length
        ? D.bills
            .map(
              b => `
          <div class="list-card">
            <div class="list-main">
              <strong>${esc(b.name)}</strong>
              <small>
                ${esc(b.due)} • ${esc(b.status)}
              </small>
            </div>
            <strong>${money(b.amount)}</strong>
          </div>
        `
            )
            .join("")
        : `<div class="empty">No bills.</div>`;
  }

  /* ================= EMI ================= */

  function calcEMI() {
    const principal =
      num($("emiPrincipal")?.value);

    const rate =
      num($("emiRate")?.value);

    const months =
      num($("emiMonths")?.value);

    if (
      principal <= 0 ||
      months <= 0
    ) {
      toast("Loan amount aur tenure enter karein");
      return;
    }

    let emi;

    if (rate <= 0) {
      emi = principal / months;
    } else {
      const r = rate / 12 / 100;

      emi =
        (principal * r * Math.pow(1 + r, months)) /
        (Math.pow(1 + r, months) - 1);
    }

    if ($("emiResult")) {
      $("emiResult").innerHTML = `
        <div class="result-card">
          <strong>Monthly EMI: ${money(emi)}</strong>
        </div>
      `;
    }
  }

  /* ================= REMINDERS ================= */

  function addReminder() {
    const name =
      ($("reminderName")?.value || "").trim();

    const date =
      $("reminderDate")?.value || today();

    if (!name) {
      toast("Reminder name enter karein");
      return;
    }

    D.reminders.push({
      id: uid(),
      name,
      date
    });

    save();
    toast("Reminder added");
    renderReminders();
  }

  function renderReminders() {
    const box = $("reminderList");
    if (!box) return;

    box.innerHTML =
      D.reminders.length
        ? D.reminders
            .map(
              r => `
          <div class="list-card">
            <div class="list-main">
              <strong>${esc(r.name)}</strong>
              <small>${esc(r.date)}</small>
            </div>
          </div>
        `
            )
            .join("")
        : `<div class="empty">No reminders.</div>`;
  }

  /* ================= REPORTS ================= */

  function totalIncome() {
    return D.transactions
      .filter(t => t.type === "income")
      .reduce((s, t) => s + num(t.amount), 0);
  }

  function totalExpense() {
    return D.transactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + num(t.amount), 0);
  }

  function showReports() {
    renderReports();
    show("reports");
  }

  function renderReports() {
    const income = totalIncome();
    const expense = totalExpense();

    const given = totalGiven(D.people);
    const received = totalReceived(D.people);

    if ($("reportIncome"))
      $("reportIncome").textContent = money(income);

    if ($("reportExpense"))
      $("reportExpense").textContent = money(expense);

    if ($("reportGive"))
      $("reportGive").textContent = money(given);

    if ($("reportReceive"))
      $("reportReceive").textContent =
        money(received);

    if ($("reportContent")) {
      $("reportContent").innerHTML = `
        <div class="report-summary">
          <h3>Net Money</h3>
          <strong>${money(income - expense)}</strong>
        </div>
      `;
    }
  }

  /* ================= BACKUP ================= */

  function exportBackup() {
    const data = JSON.stringify(D, null, 2);
    const blob = new Blob([data], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
      `HISAB-Backup-${today()}.json`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    toast("Backup downloaded");
  }

  function importBackup(event) {
    const file =
      event?.target?.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const imported =
          JSON.parse(e.target.result);

        if (
          !imported ||
          typeof imported !== "object"
        ) {
          throw new Error("Invalid");
        }

        D = {
          ...JSON.parse(
            JSON.stringify(DEFAULT_DATA)
          ),
          ...imported
        };

        save();
        renderAll();

        toast("Backup restored");
      } catch (_) {
        toast("Invalid backup file");
      }
    };

    reader.readAsText(file);
  }

  /* ================= SHARE / PDF ================= */

  function summaryText() {
    return [
      "HISAB MONEY MANAGER",
      "===================",
      `Date: ${today()}`,
      "",
      `Income: ${money(totalIncome())}`,
      `Expense: ${money(totalExpense())}`,
      `Give: ${money(totalGiven(D.people))}`,
      `Receive: ${money(totalReceived(D.people))}`,
      "",
      "Track • Plan • Grow"
    ].join("\n");
  }

  async function shareHisab() {
    const text = summaryText();

    if (
      navigator.share
    ) {
      try {
        await navigator.share({
          title: "HISAB Summary",
          text
        });

        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(text);
      toast("Summary copied");
    } catch (_) {
      toast("Share available nahi hai");
    }
  }

  function exportSummary() {
    shareHisab();
  }

  function khataText(person) {
    const b = personBalance(person);

    const lines = [
      "HISAB - KHATA",
      "==============",
      `Name: ${person.name}`,
      "",
      `Total Give: ${money(b.give)}`,
      `Total Receive: ${money(b.receive)}`,
      `Balance: ${money(b.balance)}`,
      "",
      "History",
      "-------"
    ];

    (person.entries || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.date) - new Date(b.date)
      )
      .forEach(e => {
        lines.push(
          `${e.date} | ${
            e.type === "give"
              ? "Give"
              : "Receive"
          } | ${money(e.amount)} | ${
            e.method
          } | ${e.status}${
            e.note ? ` | ${e.note}` : ""
          }`
        );
      });

    return lines.join("\n");
  }

  async function shareKhata() {
    const person = D.people.find(
      p => p.id === currentPersonId
    );

    if (!person) return;

    const text = khataText(person);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `HISAB Khata - ${person.name}`,
          text
        });

        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(text);
      toast("Khata copied");
    } catch (_) {
      toast("Share available nahi hai");
    }
  }

  function printText(title, text) {
    const w = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!w) {
      toast("Popup allow karein");
      return;
    }

    w.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>${esc(title)}</title>
        <style>
          body{
            font-family:Arial,sans-serif;
            padding:30px;
            white-space:pre-wrap;
            line-height:1.6;
          }
          h1{
            font-size:22px;
          }
          @media print{
            button{display:none}
          }
        </style>
      </head>
      <body>
        <h1>${esc(title)}</h1>
        <div>${esc(text)}</div>
        <button onclick="window.print()">Print / Save PDF</button>
      </body>
      </html>
    `);

    w.document.close();

    setTimeout(() => {
      try {
        w.print();
      } catch (_) {}
    }, 400);
  }

  function exportKhataPDF() {
    const person = D.people.find(
      p => p.id === currentPersonId
    );

    if (!person) return;

    printText(
      `HISAB Khata - ${person.name}`,
      khataText(person)
    );
  }

  function exportSummaryPDF() {
    printText(
      "HISAB Money Summary",
      summaryText()
    );
  }

  /* ================= QUICK ADD ================= */

  function openQuickAdd() {
    if (D.mode === "business") {
      openKhataForm("business");
    } else {
      show("transactions");
    }
  }

  /* ================= FAMILY ================= */

  function addFamilyMember() {
    const name =
      ($("familyName")?.value || "").trim();

    if (!name) {
      toast("Name enter karein");
      return;
    }

    D.family.push({
      id: uid(),
      name
    });

    save();
    toast("Family member added");
    renderFamily();
  }

  function renderFamily() {
    const box = $("familyList");
    if (!box) return;

    box.innerHTML =
      D.family.length
        ? D.family
            .map(
              f => `
          <div class="list-card">
            <strong>${esc(f.name)}</strong>
          </div>
        `
            )
            .join("")
        : `<div class="empty">No family members.</div>`;
  }

  /* ================= TOOLS ================= */

  function calcFD() {
    const principal =
      num($("fdPrincipal")?.value);

    const rate =
      num($("fdRate")?.value);

    const months =
      num($("fdN")?.value);

    if (
      principal <= 0 ||
      months <= 0
    ) {
      toast("Principal aur months enter karein");
      return;
    }

    const interest =
      principal *
      (rate / 100) *
      (months / 12);

    const maturity =
      principal + interest;

    if ($("fdResult")) {
      $("fdResult").innerHTML = `
        <div class="result-card">
          <p>Interest: ${money(interest)}</p>
          <strong>
            Maturity: ${money(maturity)}
          </strong>
        </div>
      `;
    }
  }

  function addInsurance() {
    D.insurance.push({
      id: uid(),
      date: today()
    });

    save();
    toast("Insurance record added");
  }

  function addSchool() {
    D.schools.push({
      id: uid(),
      date: today()
    });

    save();
    toast("School record added");
  }

  function addVehicle() {
    D.vehicles.push({
      id: uid(),
      date: today(),
      service: today(),
      insurance: today(),
      puc: today()
    });

    save();
    toast("Vehicle record added");
  }

  function addShopping() {
    D.shopping.push({
      id: uid(),
      date: today()
    });

    save();
    toast("Shopping record added");
  }

  function addUtility() {
    D.utilities.push({
      id: uid(),
      date: today()
    });

    save();
    toast("Utility record added");
  }

  function calcEmergency() {
    const monthly =
      num(
        prompt(
          "Monthly essential expense enter karein:"
        )
      );

    if (monthly <= 0) return;

    const target = monthly * 6;

    alert(
      `6 months Emergency Fund:\n${money(target)}`
    );
  }

  function addDoc() {
    D.docs.push({
      id: uid(),
      date: today()
    });

    save();
    toast("Document record added");
  }

  function addAnnual() {
    D.annual.push({
      id: uid(),
      date: today()
    });

    save();
    toast("Annual record added");
  }

  function saveLimit() {
    toast("Limit saved");
  }

  function renderComparison() {
    toast("Comparison ready");
  }

  /* ================= SEARCH ================= */

  function searchAllData(value) {
    if (value === undefined) {
      value = $("searchAll")?.value || "";
    }

    const q = String(value)
      .toLowerCase()
      .trim();

    const box = $("searchResults");
    if (!box) return;

    if (!q) {
      box.innerHTML = "";
      return;
    }

    const results = [];

    D.people.forEach(p => {
      if (
        p.name.toLowerCase().includes(q)
      ) {
        results.push(
          `<div class="list-card"
                onclick="openKhataDetail('${esc(p.id)}')">
             <strong>📒 ${esc(p.name)}</strong>
             <small>Udhar / Khata</small>
           </div>`
        );
      }
    });

    D.transactions.forEach(t => {
      const text =
        `${t.category} ${t.note || ""}`.toLowerCase();

      if (text.includes(q)) {
        results.push(`
          <div class="list-card">
            <strong>${esc(t.category)}</strong>
            <small>${esc(t.date)}</small>
            <b>${money(t.amount)}</b>
          </div>
        `);
      }
    });

    box.innerHTML =
      results.length
        ? results.join("")
        : `<div class="empty">No result.</div>`;
  }

  /* ================= RENDER ALL ================= */

  function renderAll() {
    renderHome();
    renderPersonal();
    renderBusiness();
    renderTransactions();
    renderGoals();
    renderBills();
    renderReports();
    renderReminders();
    renderFamily();
  }

  /* ================= WINDOW EXPORTS ================= */

  window.showGuestGate = showGuestGate;
  window.enterGuestMode = enterGuestMode;
  window.show = show;

  window.setMode = setMode;
  window.toggleLanguage = toggleLanguage;
  window.toggleCurrency = toggleCurrency;

  window.openKhataForm = openKhataForm;
  window.closeKhataForm = closeKhataForm;

  /*
    Edit mode aware save function.
  */
  window.saveKhataEntry = saveEditedOrNewKhata;

  window.searchKhata = searchKhata;
  window.filterKhata = filterKhata;
  window.businessFilter = businessFilter;

  window.openKhataDetail = openKhataDetail;
  window.closeKhataDetail = closeKhataDetail;
  window.detailFilter = detailFilter;

  window.editKhataEntry = editKhataEntry;
  window.deleteKhataEntry = deleteKhataEntry;
  window.toggleKhataStatus = toggleKhataStatus;

  window.openPaymentEntry = openPaymentEntry;
  window.shareKhata = shareKhata;
  window.exportKhataPDF = exportKhataPDF;

  window.addTransaction = addTransaction;

  window.calcBudget = calcBudget;
  window.calcGoal = calcGoal;

  window.addBill = addBill;
  window.calcEMI = calcEMI;

  window.addReminder = addReminder;

  window.setPin = function () {
    const pin =
      ($("pinInput")?.value || "").trim();

    if (!/^\d{4,6}$/.test(pin)) {
      toast("4-6 digit PIN enter karein");
      return;
    }

    D.pin = pin;
    save();

    if ($("pinInput"))
      $("pinInput").value = "";

    toast("PIN saved");
  };

  window.lockApp = function () {
    if (!D.pin) {
      toast("Pehle PIN set karein");
      return;
    }

    const pin = prompt("HISAB PIN enter karein:");

    if (pin !== D.pin) {
      toast("Wrong PIN");
      return;
    }

    show("home");
    toast("App unlocked");
  };

  window.exportBackup = exportBackup;
  window.importBackup = importBackup;

  window.exportSummary = exportSummary;
  window.exportSummaryPDF = exportSummaryPDF;
  window.shareHisab = shareHisab;

  window.openQuickAdd = openQuickAdd;

  window.addFamilyMember = addFamilyMember;

  window.calcFD = calcFD;
  window.addInsurance = addInsurance;
  window.addSchool = addSchool;
  window.addVehicle = addVehicle;
  window.addShopping = addShopping;
  window.addUtility = addUtility;
  window.calcEmergency = calcEmergency;
  window.addDoc = addDoc;
  window.addAnnual = addAnnual;
  window.saveLimit = saveLimit;
  window.renderComparison = renderComparison;

  window.searchAllData = searchAllData;

  /* ================= STARTUP ================= */

  document.addEventListener("DOMContentLoaded", () => {
    if ($("khataDate"))
      $("khataDate").value = today();

    if ($("transactionDate"))
      $("transactionDate").value = today();

    if ($("billDue"))
      $("billDue").value = today();

    if ($("cardDue"))
      $("cardDue").value = today();

    if ($("reminderDate"))
      $("reminderDate").value = today();

    renderAll();

    document
      .querySelectorAll(".page")
      .forEach(page => {
        page.style.display = "none";
      });
  });

})();
