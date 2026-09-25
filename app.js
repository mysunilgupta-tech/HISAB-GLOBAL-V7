(() => {
  "use strict";

  /* =========================================================
     HISAB GLOBAL V7
     Single Controller
     Personal + Business
     Khatabook-style Udhaar / Khata
     Transactions + Budget + Goals + Bills + EMI
     Reports + Backup + Search + Share/Print
     Local-first / Offline
  ========================================================= */

  const STORAGE_KEY = "hisab_v7_data";
  const OLD_KEYS = [
    "hisab_v7_complete",
    "hisab_v7_final",
    "hisabData"
  ];

  const $ = id => document.getElementById(id);

  const uid = () =>
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);

  const today = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const num = v => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const esc = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const DEFAULT_DATA = {
    version: 7,
    mode: "personal",
    currency: "₹",
    lang: "hi",
    pin: "",
    locked: false,

    personal: [],
    business: [],

    transactions: [],
    bills: [],
    reminders: [],
    goals: [],
    budgets: [],

    insurance: [],
    schools: [],
    vehicles: [],
    family: [],
    shopping: [],
    utilities: [],
    docs: [],
    annual: [],
    limits: []
  };

  let D = loadData();
  let selectedMode = D.mode || "personal";
  let selectedPersonId = null;
  let editingEntryId = null;
  let editingPersonId = null;
  let currentBusinessFilter = "customer";

  /* =========================================================
     STORAGE
  ========================================================= */

  function normaliseData(data) {
    const x = data && typeof data === "object" ? data : {};

    const out = {
      ...DEFAULT_DATA,
      ...x
    };

    const arrays = [
      "personal",
      "business",
      "transactions",
      "bills",
      "reminders",
      "goals",
      "budgets",
      "insurance",
      "schools",
      "vehicles",
      "family",
      "shopping",
      "utilities",
      "docs",
      "annual",
      "limits"
    ];

    arrays.forEach(k => {
      if (!Array.isArray(out[k])) out[k] = [];
    });

    out.personal = out.personal.map(normalisePerson);
    out.business = out.business.map(normalisePerson);

    return out;
  }

  function normalisePerson(p) {
    const person = {
      id: p.id || uid(),
      name: String(p.name || p.person || p.customer || "Unnamed"),
      phone: p.phone || "",
      category: p.category || p.type || "person",
      mode: p.mode || "personal",
      entries: Array.isArray(p.entries) ? p.entries : []
    };

    person.entries = person.entries.map(e => ({
      id: e.id || uid(),
      type: e.type === "receive" ? "receive" : "give",
      amount: num(e.amount),
      date: e.date || today(),
      method: e.method || "Cash",
      status: e.status === "settled" ? "settled" : "pending",
      note: e.note || "",
      createdAt: e.createdAt || Date.now()
    }));

    return person;
  }

  function loadData() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);

      if (current) {
        return normaliseData(JSON.parse(current));
      }

      for (const key of OLD_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const migrated = normaliseData(JSON.parse(raw));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (e) {
      console.error("HISAB load error", e);
    }

    return normaliseData(DEFAULT_DATA);
  }

  function save() {
    try {
      D.version = 7;
      D.mode = selectedMode;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(D));
    } catch (e) {
      console.error("HISAB save error", e);
      toast("Data save nahi ho paya");
    }

    renderAll();
  }

  /* =========================================================
     BASIC UI
  ========================================================= */

  function toast(message) {
    let box = $("hisabToast");

    if (!box) {
      box = document.createElement("div");
      box.id = "hisabToast";
      box.style.cssText =
        "position:fixed;left:50%;bottom:85px;transform:translateX(-50%);" +
        "background:#082b45;color:#fff;padding:12px 18px;border-radius:12px;" +
        "z-index:99999;font-size:14px;max-width:90%;text-align:center;" +
        "box-shadow:0 8px 25px rgba(0,0,0,.25)";
      document.body.appendChild(box);
    }

    box.textContent = message;
    box.style.display = "block";

    clearTimeout(box._timer);
    box._timer = setTimeout(() => {
      box.style.display = "none";
    }, 2200);
  }

  function show(id) {
    const target = $(id);
    if (!target) return;

    document.querySelectorAll(
      "#home,#personal,#business,#planning,#credit,#reports,#reminders," +
      "#privacy,#family,#ads,#familytools,#tools13,#final,#khataEntry,#khataDetail"
    ).forEach(el => {
      el.style.display = "none";
    });

    target.style.display = "block";

    try {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } catch (_) {}

    renderAll();
  }

  function enterGuestMode() {
    const gate = $("guestGate");
    if (gate) gate.style.display = "none";

    const shell = $("appShell");
    if (shell) shell.style.display = "block";

    const welcome = $("welcome");
    if (welcome) welcome.style.display = "none";

    selectedMode = D.mode || "personal";
    renderAll();
  }

  function setMode(mode) {
    mode = mode === "business" ? "business" : "personal";

    selectedMode = mode;
    D.mode = mode;
    save();

    toast(
      mode === "business"
        ? "Business Mode selected"
        : "Personal Mode selected"
    );

    show("home");
  }

  function toggleLanguage() {
    D.lang = D.lang === "hi" ? "en" : "hi";
    save();
    toast(D.lang === "hi" ? "Hindi selected" : "English selected");
  }

  function toggleCurrency() {
    D.currency = D.currency === "₹" ? "$" : "₹";
    save();
    toast(`Currency: ${D.currency}`);
  }

  function money(value) {
    return `${D.currency}${num(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })}`;
  }

  /* =========================================================
     PEOPLE / KHATA
  ========================================================= */

  function currentPeople(mode = selectedMode) {
    return mode === "business" ? D.business : D.personal;
  }

  function peopleArray(mode) {
    return mode === "business" ? D.business : D.personal;
  }

  function totalGiven(people) {
    return people.reduce(
      (sum, p) =>
        sum +
        p.entries
          .filter(e => e.type === "give")
          .reduce((a, e) => a + num(e.amount), 0),
      0
    );
  }

  function totalReceived(people) {
    return people.reduce(
      (sum, p) =>
        sum +
        p.entries
          .filter(e => e.type === "receive")
          .reduce((a, e) => a + num(e.amount), 0),
      0
    );
  }

  function personGiven(person) {
    return person.entries
      .filter(e => e.type === "give")
      .reduce((a, e) => a + num(e.amount), 0);
  }

  function personReceived(person) {
    return person.entries
      .filter(e => e.type === "receive")
      .reduce((a, e) => a + num(e.amount), 0);
  }

  function personBalance(person) {
    return personGiven(person) - personReceived(person);
  }

  function openKhataForm(mode = selectedMode, personId = null) {
    selectedMode = mode === "business" ? "business" : "personal";
    editingPersonId = personId || null;
    editingEntryId = null;

    const person = personId
      ? peopleArray(selectedMode).find(p => p.id === personId)
      : null;

    if ($("khataPerson")) {
      $("khataPerson").value = person ? person.name : "";
    }

    if ($("khataType")) $("khataType").value = "give";
    if ($("khataAmount")) $("khataAmount").value = "";
    if ($("khataDate")) $("khataDate").value = today();
    if ($("khataMethod")) $("khataMethod").value = "Cash";
    if ($("khataStatus")) $("khataStatus").value = "pending";
    if ($("khataNote")) $("khataNote").value = "";

    show("khataEntry");
  }

  function closeKhataForm() {
    show(selectedMode === "business" ? "business" : "personal");
  }

  function saveKhataEntry() {
    const name = String($("khataPerson")?.value || "").trim();
    const type =
      $("khataType")?.value === "receive" ? "receive" : "give";
    const amount = num($("khataAmount")?.value);
    const date = $("khataDate")?.value || today();
    const method = $("khataMethod")?.value || "Cash";
    const status =
      $("khataStatus")?.value === "settled" ? "settled" : "pending";
    const note = String($("khataNote")?.value || "").trim();

    if (!name) {
      toast("Person ka naam enter karein");
      return;
    }

    if (amount <= 0) {
      toast("Amount enter karein");
      return;
    }

    const list = peopleArray(selectedMode);

    let person = editingPersonId
      ? list.find(p => p.id === editingPersonId)
      : null;

    if (!person) {
      person = list.find(
        p => p.name.trim().toLowerCase() === name.toLowerCase()
      );
    }

    if (!person) {
      person = {
        id: uid(),
        name,
        phone: "",
        category:
          selectedMode === "business" ? "customer" : "person",
        mode: selectedMode,
        entries: []
      };

      list.push(person);
    } else {
      person.name = name;
    }

    if (editingEntryId) {
      const entry = person.entries.find(e => e.id === editingEntryId);

      if (entry) {
        entry.type = type;
        entry.amount = amount;
        entry.date = date;
        entry.method = method;
        entry.status = status;
        entry.note = note;
      }

      toast("Khata entry updated");
    } else {
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

      toast(
        type === "give"
          ? "Give entry added"
          : "Receive entry added"
      );
    }

    selectedPersonId = person.id;
    editingPersonId = null;
    editingEntryId = null;

    save();
    openKhataDetail(selectedMode, person.id);
  }

  function openKhataDetail(mode, personId) {
    selectedMode = mode === "business" ? "business" : "personal";

    const person = peopleArray(selectedMode).find(
      p => p.id === personId
    );

    if (!person) {
      toast("Khata nahi mila");
      return;
    }

    selectedPersonId = person.id;

    if ($("detailPersonName"))
      $("detailPersonName").textContent = person.name;

    if ($("detailGive"))
      $("detailGive").textContent = money(personGiven(person));

    if ($("detailReceive"))
      $("detailReceive").textContent = money(personReceived(person));

    if ($("detailBalance"))
      $("detailBalance").textContent = money(personBalance(person));

    renderKhataHistory(person, "all");
    show("khataDetail");
  }

  function closeKhataDetail() {
    show(selectedMode === "business" ? "business" : "personal");
  }

  function renderKhataHistory(person, filter = "all") {
    const box = $("khataHistory");
    if (!box) return;

    let entries = [...person.entries].sort(
      (a, b) =>
        new Date(b.date || 0) - new Date(a.date || 0) ||
        num(b.createdAt) - num(a.createdAt)
    );

    if (filter === "give") {
      entries = entries.filter(e => e.type === "give");
    }

    if (filter === "receive") {
      entries = entries.filter(e => e.type === "receive");
    }

    if (filter === "pending") {
      entries = entries.filter(e => e.status === "pending");
    }

    if (!entries.length) {
      box.innerHTML =
        '<div style="padding:15px;text-align:center">No entries found</div>';
      return;
    }

    box.innerHTML = entries
      .map(e => {
        const isGive = e.type === "give";
        const amountColor = isGive ? "#d33" : "#159447";
        const typeText = isGive ? "GIVE" : "RECEIVE";

        return `
          <div style="
            padding:12px;
            margin:8px 0;
            border-radius:12px;
            background:#fff;
            border:1px solid #e4e8ed;
          ">
            <div style="display:flex;justify-content:space-between;gap:8px">
              <strong style="color:${amountColor}">
                ${typeText} ${money(e.amount)}
              </strong>
              <span>${esc(e.date)}</span>
            </div>

            <div style="font-size:13px;margin-top:5px">
              ${esc(e.method)} • ${esc(e.status)}
            </div>

            ${
              e.note
                ? `<div style="font-size:13px;margin-top:5px">${esc(
                    e.note
                  )}</div>`
                : ""
            }

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
              <button onclick="editKhataEntry('${person.id}','${e.id}')">
                Edit
              </button>

              <button onclick="toggleKhataStatus('${person.id}','${e.id}')">
                ${e.status === "pending" ? "Settle" : "Pending"}
              </button>

              <button onclick="deleteKhataEntry('${person.id}','${e.id}')">
                Delete
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function detailFilter(filter, button) {
    if (button) {
      document
        .querySelectorAll("#khataDetail button[data-filter]")
        .forEach(b => b.classList.remove("active"));

      button.classList.add("active");
    }

    const person = peopleArray(selectedMode).find(
      p => p.id === selectedPersonId
    );

    if (person) renderKhataHistory(person, filter);
  }

  function editKhataEntry(personId, entryId) {
    const person = peopleArray(selectedMode).find(
      p => p.id === personId
    );

    if (!person) return;

    const entry = person.entries.find(e => e.id === entryId);

    if (!entry) return;

    editingPersonId = person.id;
    editingEntryId = entry.id;

    if ($("khataPerson")) $("khataPerson").value = person.name;
    if ($("khataType")) $("khataType").value = entry.type;
    if ($("khataAmount")) $("khataAmount").value = entry.amount;
    if ($("khataDate")) $("khataDate").value = entry.date;
    if ($("khataMethod")) $("khataMethod").value = entry.method;
    if ($("khataStatus")) $("khataStatus").value = entry.status;
    if ($("khataNote")) $("khataNote").value = entry.note;

    show("khataEntry");
  }

  function deleteKhataEntry(personId, entryId) {
    const person = peopleArray(selectedMode).find(
      p => p.id === personId
    );

    if (!person) return;

    person.entries = person.entries.filter(e => e.id !== entryId);

    save();

    toast("Entry deleted");

    openKhataDetail(selectedMode, person.id);
  }

  function toggleKhataStatus(personId, entryId) {
    const person = peopleArray(selectedMode).find(
      p => p.id === personId
    );

    if (!person) return;

    const entry = person.entries.find(e => e.id === entryId);

    if (!entry) return;

    entry.status =
      entry.status === "pending" ? "settled" : "pending";

    save();

    openKhataDetail(selectedMode, person.id);

    toast(
      entry.status === "settled"
        ? "Payment settled"
        : "Payment pending"
    );
  }

  function openPaymentEntry() {
    if (selectedPersonId) {
      openKhataForm(selectedMode, selectedPersonId);
    } else {
      openKhataForm(selectedMode);
    }
  }

  function shareKhata() {
    const person = peopleArray(selectedMode).find(
      p => p.id === selectedPersonId
    );

    if (!person) return;

    const text = createKhataText(person);

    if (navigator.share) {
      navigator.share({
        title: `HISAB - ${person.name}`,
        text
      }).catch(() => {});
    } else {
      copyText(text);
      toast("Khata text copied");
    }
  }

  function createKhataText(person) {
    let text = `HISAB - Khata\n`;
    text += `Person: ${person.name}\n`;
    text += `Total Give: ${money(personGiven(person))}\n`;
    text += `Total Receive: ${money(personReceived(person))}\n`;
    text += `Balance: ${money(personBalance(person))}\n`;
    text += `-------------------------\n`;

    person.entries
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(e => {
        text += `${e.date} | ${e.type.toUpperCase()} | `;
        text += `${money(e.amount)} | ${e.method} | ${e.status}`;
        if (e.note) text += ` | ${e.note}`;
        text += `\n`;
      });

    return text;
  }

  /* =========================================================
     SEARCH / FILTER
  ========================================================= */

  function searchKhata(mode, value) {
    const q = String(
      value ??
        (mode === "business"
          ? $("businessSearch")?.value
          : $("personalSearch")?.value) ??
        ""
    )
      .toLowerCase()
      .trim();

    renderPeople(mode, q);
  }

  function filterKhata(mode, filter, button) {
    if (button) {
      const parent = button.parentElement;
      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(b => b.classList.remove("active"));
      }

      button.classList.add("active");
    }

    const q =
      mode === "business"
        ? String($("businessSearch")?.value || "").toLowerCase()
        : String($("personalSearch")?.value || "").toLowerCase();

    renderPeople(mode, q, filter);
  }

  function businessFilter(filter, button) {
    currentBusinessFilter = filter;

    if (button) {
      const parent = button.parentElement;
      if (parent) {
        parent
          .querySelectorAll("button")
          .forEach(b => b.classList.remove("active"));
      }

      button.classList.add("active");
    }

    renderBusiness(filter);
  }

  function renderPeople(mode, query = "", filter = "all") {
    const box =
      mode === "business"
        ? $("businessList")
        : $("personalList");

    if (!box) return;

    let list = peopleArray(mode);

    if (query) {
      list = list.filter(p =>
        `${p.name} ${p.phone || ""} ${p.category || ""}`
          .toLowerCase()
          .includes(query)
      );
    }

    if (filter === "give") {
      list = list.filter(p => personGiven(p) > 0);
    }

    if (filter === "receive") {
      list = list.filter(p => personReceived(p) > 0);
    }

    if (filter === "pending") {
      list = list.filter(p =>
        p.entries.some(e => e.status === "pending")
      );
    }

    if (!list.length) {
      box.innerHTML =
        '<div style="padding:15px;text-align:center">No Khata found</div>';
      return;
    }

    box.innerHTML = list
      .map(p => {
        const bal = personBalance(p);

        return `
          <div style="
            padding:13px;
            margin:8px 0;
            background:#fff;
            border-radius:14px;
            border:1px solid #e2e7ec;
          ">
            <div style="display:flex;justify-content:space-between;gap:8px">
              <strong>${esc(p.name)}</strong>
              <strong>${money(bal)}</strong>
            </div>

            <div style="font-size:13px;margin-top:5px">
              <span style="color:#d33">
                Give: ${money(personGiven(p))}
              </span>
              &nbsp;|&nbsp;
              <span style="color:#159447">
                Receive: ${money(personReceived(p))}
              </span>
            </div>

            <div style="font-size:12px;margin-top:5px">
              ${p.entries.length} entries
              ${p.category ? " • " + esc(p.category) : ""}
            </div>

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
              <button onclick="openKhataDetail('${mode}','${p.id}')">
                Open Khata
              </button>

              <button onclick="openKhataForm('${mode}','${p.id}')">
                Add Entry
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /* =========================================================
     BUSINESS
  ========================================================= */

  function addBusinessPerson(category) {
    const label =
      category === "supplier"
        ? "Supplier"
        : "Customer";

    const name = prompt(`${label} name enter karein`);

    if (!name || !name.trim()) return;

    const person = {
      id: uid(),
      name: name.trim(),
      phone: "",
      category,
      mode: "business",
      entries: []
    };

    D.business.push(person);

    save();

    toast(`${label} added`);
    renderBusiness(category);
  }

  function addBusinessSale() {
    const customer = prompt("Customer name");
    if (!customer) return;

    const amount = num(prompt("Sale amount"));

    if (amount <= 0) {
      toast("Valid amount enter karein");
      return;
    }

    let person = D.business.find(
      p =>
        p.name.toLowerCase() === customer.trim().toLowerCase() &&
        p.category === "customer"
    );

    if (!person) {
      person = {
        id: uid(),
        name: customer.trim(),
        phone: "",
        category: "customer",
        mode: "business",
        entries: []
      };

      D.business.push(person);
    }

    person.entries.push({
      id: uid(),
      type: "receive",
      amount,
      date: today(),
      method: "Other",
      status: "pending",
      note: "Sale",
      createdAt: Date.now()
    });

    save();
    toast("Sale added");
  }

  function addBusinessPurchase() {
    const supplier = prompt("Supplier name");
    if (!supplier) return;

    const amount = num(prompt("Purchase amount"));

    if (amount <= 0) {
      toast("Valid amount enter karein");
      return;
    }

    let person = D.business.find(
      p =>
        p.name.toLowerCase() === supplier.trim().toLowerCase() &&
        p.category === "supplier"
    );

    if (!person) {
      person = {
        id: uid(),
        name: supplier.trim(),
        phone: "",
        category: "supplier",
        mode: "business",
        entries: []
      };

      D.business.push(person);
    }

    person.entries.push({
      id: uid(),
      type: "give",
      amount,
      date: today(),
      method: "Other",
      status: "pending",
      note: "Purchase",
      createdAt: Date.now()
    });

    save();
    toast("Purchase added");
  }

  function renderBusiness(filter = currentBusinessFilter) {
    const list = D.business.filter(p => {
      if (filter === "customer") return p.category === "customer";
      if (filter === "supplier") return p.category === "supplier";
      if (filter === "sales")
        return p.entries.some(e => e.note === "Sale");
      if (filter === "purchase")
        return p.entries.some(e => e.note === "Purchase");
      return true;
    });

    const box = $("businessList");
    if (!box) return;

    const q = String($("businessSearch")?.value || "")
      .toLowerCase()
      .trim();

    const filtered = list.filter(p =>
      p.name.toLowerCase().includes(q)
    );

    if (!filtered.length) {
      box.innerHTML =
        '<div style="padding:15px;text-align:center">No business records found</div>';
      return;
    }

    box.innerHTML = filtered
      .map(p => {
        const sales = p.entries
          .filter(e => e.note === "Sale")
          .reduce((a, e) => a + num(e.amount), 0);

        const purchases = p.entries
          .filter(e => e.note === "Purchase")
          .reduce((a, e) => a + num(e.amount), 0);

        return `
          <div style="
            padding:13px;
            margin:8px 0;
            background:#fff;
            border:1px solid #e2e7ec;
            border-radius:14px;
          ">
            <strong>${esc(p.name)}</strong>
            <div style="font-size:12px;margin-top:4px">
              ${esc(p.category)}
            </div>

            <div style="margin-top:6px">
              Balance: <strong>${money(personBalance(p))}</strong>
            </div>

            <div style="font-size:12px;margin-top:4px">
              Sales: ${money(sales)} |
              Purchase: ${money(purchases)}
            </div>

            <div style="display:flex;gap:6px;margin-top:9px">
              <button onclick="openKhataDetail('business','${p.id}')">
                Open Khata
              </button>
              <button onclick="openKhataForm('business','${p.id}')">
                Add Entry
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /* =========================================================
     TRANSACTIONS
  ========================================================= */

  function addTransaction(type) {
    const amount =
      num($("transactionAmount")?.value) ||
      num($("amount")?.value) ||
      num(prompt(`${type || "Transaction"} amount`));

    if (amount <= 0) {
      toast("Valid amount enter karein");
      return;
    }

    const name =
      $("transactionNote")?.value ||
      $("expenseNote")?.value ||
      $("incomeNote")?.value ||
      prompt("Note / description") ||
      "";

    D.transactions.push({
      id: uid(),
      type:
        String(type || "").toLowerCase().includes("income") ||
        String(type || "").toLowerCase().includes("receive")
          ? "income"
          : "expense",
      amount,
      date: today(),
      note: name,
      mode: selectedMode
    });

    if ($("transactionAmount")) $("transactionAmount").value = "";

    save();
    toast("Transaction added");
  }

  function totalIncome() {
    return D.transactions
      .filter(
        t =>
          t.type === "income" &&
          (!t.mode || t.mode === selectedMode)
      )
      .reduce((a, t) => a + num(t.amount), 0);
  }

  function totalExpense() {
    return D.transactions
      .filter(
        t =>
          t.type === "expense" &&
          (!t.mode || t.mode === selectedMode)
      )
      .reduce((a, t) => a + num(t.amount), 0);
  }

  /* =========================================================
     BUDGET
  ========================================================= */

  function calcBudget() {
    const amount =
      num($("budgetAmount")?.value) ||
      num(prompt("Monthly budget amount"));

    if (amount <= 0) {
      toast("Budget amount enter karein");
      return;
    }

    const category =
      $("budgetCategory")?.value ||
      prompt("Budget category") ||
      "General";

    D.budgets.push({
      id: uid(),
      category,
      amount,
      month: new Date().toISOString().slice(0, 7)
    });

    save();
    toast("Budget saved");
  }

  /* =========================================================
     GOALS + SAVINGS
  ========================================================= */

  function calcGoal() {
    const name =
      $("goalName")?.value ||
      prompt("Goal name / kis liye paisa chahiye?");

    if (!name) return;

    const target =
      num($("goalTarget")?.value) ||
      num(prompt("Target amount"));

    if (target <= 0) {
      toast("Target amount enter karein");
      return;
    }

    const saved =
      num($("goalSaved")?.value) ||
      num(prompt("Already saved amount") || 0);

    const deadline =
      $("goalDate")?.value ||
      $("goalDeadline")?.value ||
      "";

    D.goals.push({
      id: uid(),
      name,
      target,
      saved,
      deadline,
      createdAt: Date.now()
    });

    save();
    renderGoals();

    toast("Goal saved");
  }

  function renderGoals() {
    const box = $("goalList");
    if (!box) return;

    if (!D.goals.length) {
      box.innerHTML =
        '<div style="padding:12px">No goals yet</div>';
      return;
    }

    box.innerHTML = D.goals
      .map(g => {
        const percent =
          g.target > 0
            ? Math.min(100, (g.saved / g.target) * 100)
            : 0;

        return `
          <div style="
            padding:12px;
            margin:8px 0;
            background:#fff;
            border-radius:12px;
          ">
            <strong>${esc(g.name)}</strong>
            <div>${money(g.saved)} / ${money(g.target)}</div>
            <div style="margin-top:5px">
              ${percent.toFixed(0)}% complete
            </div>
            <button onclick="deleteGoal('${g.id}')">
              Delete
            </button>
          </div>
        `;
      })
      .join("");
  }

  function deleteGoal(id) {
    D.goals = D.goals.filter(g => g.id !== id);
    save();
    toast("Goal deleted");
  }

  /* =========================================================
     BILLS
  ========================================================= */

  function addBill(kind = "Bill") {
    const isCard = kind === "Credit Card";

    const name = isCard
      ? "Credit Card"
      : $("billName")?.value || "Bill";

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
  }

  /* =========================================================
     EMI
  ========================================================= */

  function calcEMI() {
    const principal =
      num($("loanAmount")?.value) ||
      num(prompt("Loan amount"));

    const rate =
      num($("loanRate")?.value) ||
      num(prompt("Annual interest %") || 0);

    const months =
      num($("loanTenure")?.value) ||
      num(prompt("Tenure months"));

    if (principal <= 0 || months <= 0) {
      toast("Loan details enter karein");
      return;
    }

    const r = rate / 12 / 100;

    const emi =
      r === 0
        ? principal / months
        : principal * r * Math.pow(1 + r, months) /
          (Math.pow(1 + r, months) - 1);

    const text = `EMI: ${money(emi)}`;

    if ($("emiResult"))
      $("emiResult").textContent = text;

    toast(text);
  }

  /* =========================================================
     REMINDERS
  ========================================================= */

  function addReminder() {
    const text =
      $("reminderText")?.value ||
      $("reminderName")?.value ||
      prompt("Reminder");

    if (!text) return;

    const date =
      $("reminderDate")?.value ||
      today();

    D.reminders.push({
      id: uid(),
      text,
      date,
      done: false
    });

    save();
    toast("Reminder added");
  }

  /* =========================================================
     REPORTS
  ========================================================= */

  function showReports() {
    const income = totalIncome();
    const expense = totalExpense();
    const people = currentPeople();

    const given = totalGiven(people);
    const received = totalReceived(people);
    const balance = income - expense;

    const html = `
      <div style="padding:12px">
        <h3>HISAB Report</h3>
        <p>Income: <strong>${money(income)}</strong></p>
        <p>Expense: <strong>${money(expense)}</strong></p>
        <p>Net Cashflow: <strong>${money(balance)}</strong></p>
        <hr>
        <p>Give: <strong>${money(given)}</strong></p>
        <p>Receive: <strong>${money(received)}</strong></p>
        <p>Khata Balance: <strong>${money(given - received)}</strong></p>
        <p>Transactions: ${D.transactions.length}</p>
        <p>People: ${people.length}</p>
      </div>
    `;

    const box =
      $("reports")?.querySelector(".report-content") ||
      $("reportContent");

    if (box) box.innerHTML = html;

    show("reports");
  }

  function createSummaryText() {
    const people = currentPeople();

    return [
      "HISAB MONEY MANAGER",
      "====================",
      `Mode: ${selectedMode}`,
      `Date: ${today()}`,
      "",
      `Income: ${money(totalIncome())}`,
      `Expense: ${money(totalExpense())}`,
      `Net: ${money(totalIncome() - totalExpense())}`,
      "",
      `Give: ${money(totalGiven(people))}`,
      `Receive: ${money(totalReceived(people))}`,
      `Khata Balance: ${money(
        totalGiven(people) - totalReceived(people)
      )}`,
      "",
      `People: ${people.length}`,
      `Transactions: ${D.transactions.length}`,
      `Bills: ${D.bills.length}`,
      `Goals: ${D.goals.length}`
    ].join("\n");
  }

  function exportSummary() {
    const text = createSummaryText();

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `HISAB-Summary-${today()}.txt`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast("Summary exported");
  }

  /* =========================================================
     PRINT / PDF
  ========================================================= */

  function printHtml(title, content) {
    const win = window.open("", "_blank");

    if (!win) {
      toast("Popup allow karein");
      return;
    }

    win.document.open();

    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${esc(title)}</title>
        <style>
          body{
            font-family:Arial,sans-serif;
            padding:20px;
            color:#111;
          }
          h1,h2,h3{margin-top:0}
          table{
            width:100%;
            border-collapse:collapse;
            margin-top:15px;
          }
          th,td{
            border:1px solid #bbb;
            padding:8px;
            text-align:left;
          }
          .give{color:#c62828}
          .receive{color:#16823b}
        </style>
      </head>
      <body>
        ${content}
        <script>
          setTimeout(function(){
            window.print();
          },300);
        <\/script>
      </body>
      </html>
    `);

    win.document.close();
  }

  function exportKhataPDF() {
    const person = peopleArray(selectedMode).find(
      p => p.id === selectedPersonId
    );

    if (!person) {
      toast("Khata select karein");
      return;
    }

    const rows = person.entries
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(
        e => `
          <tr>
            <td>${esc(e.date)}</td>
            <td class="${e.type}">
              ${e.type.toUpperCase()}
            </td>
            <td>${money(e.amount)}</td>
            <td>${esc(e.method)}</td>
            <td>${esc(e.status)}</td>
            <td>${esc(e.note)}</td>
          </tr>
        `
      )
      .join("");

    const content = `
      <h1>HISAB - Khata</h1>
      <h2>${esc(person.name)}</h2>

      <p>
        Total Give:
        <strong>${money(personGiven(person))}</strong>
      </p>

      <p>
        Total Receive:
        <strong>${money(personReceived(person))}</strong>
      </p>

      <p>
        Balance:
        <strong>${money(personBalance(person))}</strong>
      </p>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    printHtml(`HISAB Khata - ${person.name}`, content);
  }

  function exportSummaryPDF() {
    const people = currentPeople();

    const rows = people
      .map(
        p => `
          <tr>
            <td>${esc(p.name)}</td>
            <td>${money(personGiven(p))}</td>
            <td>${money(personReceived(p))}</td>
            <td>${money(personBalance(p))}</td>
          </tr>
        `
      )
      .join("");

    const content = `
      <h1>HISAB Money Manager</h1>
      <p>Mode: ${esc(selectedMode)}</p>
      <p>Date: ${today()}</p>

      <h3>Summary</h3>
      <p>Income: ${money(totalIncome())}</p>
      <p>Expense: ${money(totalExpense())}</p>
      <p>Net: ${money(totalIncome() - totalExpense())}</p>

      <h3>Khata Summary</h3>
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Give</th>
            <th>Receive</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    printHtml("HISAB Summary", content);
  }

  /* =========================================================
     BACKUP / RESTORE
  ========================================================= */

  function exportBackup() {
    const blob = new Blob(
      [JSON.stringify(D, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `HISAB-Backup-${today()}.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast("Backup downloaded");
  }

  function importBackup(event) {
    const file = event?.target?.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = normaliseData(
          JSON.parse(reader.result)
        );

        D = imported;
        selectedMode = D.mode || "personal";

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(D)
        );

        renderAll();

        toast("Backup restored");
      } catch (e) {
        console.error(e);
        toast("Invalid backup file");
      }
    };

    reader.readAsText(file);
  }

  /* =========================================================
     SECURITY
  ========================================================= */

  function setPin() {
    const pin = prompt("4 digit PIN set karein");

    if (!pin) return;

    if (!/^\d{4}$/.test(pin)) {
      toast("PIN exactly 4 digits ka hona chahiye");
      return;
    }

    D.pin = pin;
    save();

    toast("PIN saved");
  }

  function lockApp() {
    if (!D.pin) {
      toast("Pehle PIN set karein");
      return;
    }

    D.locked = true;
    save();

    showLockScreen();
  }

  function showLockScreen() {
    let lock = $("hisabLockScreen");

    if (!lock) {
      lock = document.createElement("div");
      lock.id = "hisabLockScreen";
      lock.style.cssText =
        "position:fixed;inset:0;background:#082b45;color:#fff;" +
        "z-index:100000;display:flex;align-items:center;" +
        "justify-content:center;padding:25px;text-align:center";

      lock.innerHTML = `
        <div style="width:100%;max-width:320px">
          <h2>HISAB Locked</h2>
          <p>Enter your PIN</p>
          <input id="unlockPin"
            type="password"
            inputmode="numeric"
            maxlength="4"
            style="width:100%;padding:13px;border-radius:10px">
          <button id="unlockBtn"
            style="margin-top:12px;padding:12px 20px">
            Unlock
          </button>
        </div>
      `;

      document.body.appendChild(lock);

      $("unlockBtn").onclick = unlockApp;
    }

    lock.style.display = "flex";
  }

  function unlockApp() {
    const pin = $("unlockPin")?.value || "";

    if (pin !== D.pin) {
      toast("Wrong PIN");
      return;
    }

    D.locked = false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(D));

    const lock = $("hisabLockScreen");
    if (lock) lock.style.display = "none";

    toast("App unlocked");
  }

  /* =========================================================
     OTHER TOOLS
  ========================================================= */

  function calcFD() {
    const principal =
      num($("fdAmount")?.value) ||
      num(prompt("FD amount"));

    const rate =
      num($("fdRate")?.value) ||
      num(prompt("Annual interest %"));

    const months =
      num($("fdN")?.value) ||
      num(prompt("FD months"));

    if (principal <= 0 || months <= 0) {
      toast("FD details enter karein");
      return;
    }

    const maturity =
      principal *
      Math.pow(
        1 + rate / 100,
        months / 12
      );

    const interest = maturity - principal;

    const text =
      `Maturity: ${money(maturity)} | Interest: ${money(interest)}`;

    if ($("fdResult"))
      $("fdResult").textContent = text;

    toast("FD calculated");
  }

  function addInsurance() {
    const name =
      $("insuranceName")?.value ||
      prompt("Insurance name");

    if (!name) return;

    D.insurance.push({
      id: uid(),
      name,
      date: $("insuranceDate")?.value || today(),
      amount: num($("insuranceAmount")?.value)
    });

    save();
    toast("Insurance added");
  }

  function addSchool() {
    const name =
      $("schoolName")?.value ||
      prompt("School / education name");

    if (!name) return;

    D.schools.push({
      id: uid(),
      name,
      amount: num($("schoolAmount")?.value),
      date: $("schoolDate")?.value || today()
    });

    save();
    toast("Education entry added");
  }

  function addVehicle() {
    const name =
      $("vehicleName")?.value ||
      prompt("Vehicle name");

    if (!name) return;

    D.vehicles.push({
      id: uid(),
      name,
      serviceDate:
        $("vehicleService")?.value ||
        $("serviceDate")?.value ||
        "",
      insuranceDate:
        $("vehicleIns")?.value ||
        $("vehicleInsurance")?.value ||
        "",
      pucDate:
        $("vehiclePuc")?.value ||
        $("pucDate")?.value ||
        ""
    });

    save();
    toast("Vehicle added");
  }

  function addFamilyMember() {
    const name =
      $("familyName")?.value ||
      prompt("Family member name");

    if (!name) return;

    D.family.push({
      id: uid(),
      name
    });

    save();
    toast("Family member added");
  }

  function addShopping() {
    const name =
      $("shoppingName")?.value ||
      prompt("Shopping item");

    if (!name) return;

    D.shopping.push({
      id: uid(),
      name,
      amount: num($("shoppingAmount")?.value)
    });

    save();
    toast("Shopping item added");
  }

  function addUtility() {
    const name =
      $("utilityName")?.value ||
      prompt("Utility");

    if (!name) return;

    D.utilities.push({
      id: uid(),
      name,
      amount: num($("utilityAmount")?.value),
      due: $("utilityDue")?.value || today()
    });

    save();
    toast("Utility added");
  }

  function renderComparison() {
    const income = totalIncome();
    const expense = totalExpense();

    const text =
      `Income ${money(income)} | Expense ${money(expense)} | ` +
      `Net ${money(income - expense)}`;

    if ($("comparisonResult"))
      $("comparisonResult").textContent = text;

    toast("Comparison updated");
  }

  function calcEmergency() {
    const monthly =
      num($("monthlyExpense")?.value) ||
      num(prompt("Monthly expense"));

    const months =
      num($("emergencyMonths")?.value) ||
      num(prompt("How many months"));

    if (monthly <= 0 || months <= 0) {
      toast("Details enter karein");
      return;
    }

    const result = monthly * months;

    if ($("emergencyResult"))
      $("emergencyResult").textContent =
        `Emergency Fund: ${money(result)}`;

    toast(`Emergency Fund: ${money(result)}`);
  }

  function addDoc() {
    const name =
      $("docName")?.value ||
      prompt("Document name");

    if (!name) return;

    D.docs.push({
      id: uid(),
      name,
      date: today()
    });

    save();
    toast("Document added");
  }

  function addAnnual() {
    const name =
      $("annualName")?.value ||
      prompt("Annual expense");

    if (!name) return;

    D.annual.push({
      id: uid(),
      name,
      amount: num($("annualAmount")?.value)
    });

    save();
    toast("Annual expense added");
  }

  function saveLimit() {
    const name =
      $("limitName")?.value ||
      prompt("Limit name");

    if (!name) return;

    const amount =
      num($("limitAmount")?.value) ||
      num(prompt("Limit amount"));

    if (amount <= 0) return;

    D.limits.push({
      id: uid(),
      name,
      amount
    });

    save();
    toast("Limit saved");
  }

  /* =========================================================
     GLOBAL SEARCH
  ========================================================= */

  function searchAllData(value) {
    if (value === undefined) {
      value = $("searchAll")?.value || "";
    }

    const q = String(value).toLowerCase().trim();

    if (!q) {
      toast("Search name, note, amount...");
      return;
    }

    const results = [];

    D.transactions.forEach(t => {
      const text =
        `${t.type} ${t.amount} ${t.note} ${t.date}`.toLowerCase();

      if (text.includes(q)) {
        results.push(
          `Transaction: ${t.type} ${money(t.amount)} ${t.note || ""}`
        );
      }
    });

    [...D.personal, ...D.business].forEach(p => {
      if (p.name.toLowerCase().includes(q)) {
        results.push(`Khata: ${p.name}`);
      }

      p.entries.forEach(e => {
        const text =
          `${p.name} ${e.type} ${e.amount} ${e.note} ${e.method}`
            .toLowerCase();

        if (text.includes(q)) {
          results.push(
            `Khata: ${p.name} - ${e.type} ${money(e.amount)}`
          );
        }
      });
    });

    D.bills.forEach(b => {
      if (
        `${b.name} ${b.amount} ${b.kind}`
          .toLowerCase()
          .includes(q)
      ) {
        results.push(`Bill: ${b.name} ${money(b.amount)}`);
      }
    });

    if (!results.length) {
      toast("Kuch nahi mila");
      return;
    }

    alert(results.slice(0, 30).join("\n"));
  }

  /* =========================================================
     SHARE HISAB
  ========================================================= */

  function copyText(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";

    document.body.appendChild(area);
    area.select();

    try {
      document.execCommand("copy");
    } catch (_) {}

    area.remove();
  }

  function shareHisab() {
    const text = createSummaryText();

    if (navigator.share) {
      navigator
        .share({
          title: "HISAB Money Manager",
          text
        })
        .catch(() => {});
    } else {
      copyText(text);
      toast("HISAB summary copied");
    }
  }

  /* =========================================================
     QUICK ADD
  ========================================================= */

  function openQuickAdd() {
    const choice = prompt(
      "Quick Add:\n" +
      "1 = Give\n" +
      "2 = Receive\n" +
      "3 = Income\n" +
      "4 = Expense"
    );

    if (choice === "1") {
      openKhataForm(selectedMode);
      if ($("khataType")) $("khataType").value = "give";
      return;
    }

    if (choice === "2") {
      openKhataForm(selectedMode);
      if ($("khataType")) $("khataType").value = "receive";
      return;
    }

    if (choice === "3") {
      addTransaction("Income");
      return;
    }

    if (choice === "4") {
      addTransaction("Expense");
    }
  }

  /* =========================================================
     HOME RENDER
  ========================================================= */

  function renderHome() {
    const list = currentPeople();

    const given = totalGiven(list);
    const received = totalReceived(list);

    if ($("receivable"))
      $("receivable").textContent = money(given);

    if ($("payable"))
      $("payable").textContent = money(received);

    if ($("totalIncome"))
      $("totalIncome").textContent = money(totalIncome());

    if ($("totalExpense"))
      $("totalExpense").textContent = money(totalExpense());
  }

  function renderPersonal() {
    const list = D.personal;

    if ($("ledgerGiven"))
      $("ledgerGiven").textContent = money(totalGiven(list));

    if ($("ledgerReceived"))
      $("ledgerReceived").textContent =
        money(totalReceived(list));

    if ($("ledgerNet"))
      $("ledgerNet").textContent =
        money(totalGiven(list) - totalReceived(list));

    const q = String($("personalSearch")?.value || "")
      .toLowerCase()
      .trim();

    renderPeople("personal", q);
  }

  function renderBusinessSummary() {
    const given = totalGiven(D.business);
    const received = totalReceived(D.business);

    if ($("businessGiven"))
      $("businessGiven").textContent = money(given);

    if ($("businessReceived"))
      $("businessReceived").textContent = money(received);

    if ($("businessNet"))
      $("businessNet").textContent = money(given - received);
  }

  /* =========================================================
     GENERAL RENDER
  ========================================================= */

  function renderAll() {
    renderHome();
    renderPersonal();
    renderBusinessSummary();
    renderBusiness(currentBusinessFilter);
    renderGoals();

    if (
      $("detailPersonName") &&
      selectedPersonId
    ) {
      const person = peopleArray(selectedMode).find(
        p => p.id === selectedPersonId
      );

      if (person) {
        $("detailPersonName").textContent = person.name;

        if ($("detailGive"))
          $("detailGive").textContent =
            money(personGiven(person));

        if ($("detailReceive"))
          $("detailReceive").textContent =
            money(personReceived(person));

        if ($("detailBalance"))
          $("detailBalance").textContent =
            money(personBalance(person));
      }
    }
  }

  /* =========================================================
     INITIAL SETUP
  ========================================================= */

  function init() {
    if ($("guestGate")) {
      $("guestGate").style.display = "block";
    }

    const shell = $("appShell");

    if (shell) {
      shell.style.display = "block";
    }

    document.querySelectorAll(
      "#khataEntry,#khataDetail"
    ).forEach(el => {
      el.style.display = "none";
    });

    if ($("khataDate"))
      $("khataDate").value = today();

    if ($("fdN")) {
      $("fdN").setAttribute(
        "placeholder",
        "Months"
      );
    }

    renderAll();

    if (D.locked && D.pin) {
      setTimeout(showLockScreen, 100);
    }
  }

  /* =========================================================
     WINDOW EXPORTS
     IMPORTANT:
     Inline HTML onclick handlers need window functions.
  ========================================================= */

  window.enterGuestMode = enterGuestMode;
  window.show = show;
  window.setMode = setMode;

  window.toggleLanguage = toggleLanguage;
  window.toggleCurrency = toggleCurrency;

  window.openKhataForm = openKhataForm;
  window.closeKhataForm = closeKhataForm;
  window.saveKhataEntry = saveKhataEntry;

  window.openKhataDetail = openKhataDetail;
  window.closeKhataDetail = closeKhataDetail;

  window.searchKhata = searchKhata;
  window.filterKhata = filterKhata;
  window.detailFilter = detailFilter;
  window.businessFilter = businessFilter;

  window.editKhataEntry = editKhataEntry;
  window.deleteKhataEntry = deleteKhataEntry;
  window.toggleKhataStatus = toggleKhataStatus;

  window.openPaymentEntry = openPaymentEntry;
  window.shareKhata = shareKhata;
  window.exportKhataPDF = exportKhataPDF;
  window.exportSummaryPDF = exportSummaryPDF;

  window.addBusinessPerson = addBusinessPerson;
  window.addBusinessSale = addBusinessSale;
  window.addBusinessPurchase = addBusinessPurchase;

  window.addTransaction = addTransaction;
  window.calcBudget = calcBudget;
  window.calcGoal = calcGoal;
  window.deleteGoal = deleteGoal;
  window.calcEMI = calcEMI;
  window.addBill = addBill;
  window.addReminder = addReminder;

  window.showReports = showReports;
  window.exportSummary = exportSummary;

  window.setPin = setPin;
  window.lockApp = lockApp;

  window.exportBackup = exportBackup;
  window.importBackup = importBackup;

  window.calcFD = calcFD;
  window.addInsurance = addInsurance;
  window.addSchool = addSchool;
  window.addVehicle = addVehicle;
  window.addFamilyMember = addFamilyMember;
  window.addShopping = addShopping;
  window.addUtility = addUtility;
  window.renderComparison = renderComparison;
  window.calcEmergency = calcEmergency;
  window.addDoc = addDoc;
  window.addAnnual = addAnnual;
  window.saveLimit = saveLimit;

  window.searchAllData = searchAllData;
  window.shareHisab = shareHisab;
  window.openQuickAdd = openQuickAdd;

  /* =========================================================
     START
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
