/* =========================================================
   HISAB GLOBAL V7 — FINAL SINGLE CONTROLLER
   Personal + Business + Udhaar + Customers/Suppliers
   Income + Expense + Planning + Payments + Reports
   Backup + Restore + PDF + WhatsApp + Settings
   ========================================================= */

const KEY = "hisab_v7_data";

let D = {
  mode: "personal",
  currency: "₹",
  language: "en",

  transactions: [],
  khata: [],
  business: [],
  goals: [],
  bills: [],
  cards: [],
  loans: [],
  emis: [],
  reminders: [],
  family: [],
  tools: [],

  budget: 0,
  pin: "",

  filter: "all",
  businessFilter: "customer",

  detailPerson: "",
  detailPhone: "",
  detailMode: "personal",
  detailFilter: "all",

  businessEntryRole: "customer"
};

let editKhataId = null;


/* =========================
   BASIC HELPERS
========================= */

const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function num(id) {
  const e = $(id);
  return e ? Number(e.value || 0) : 0;
}

function val(id) {
  const e = $(id);
  return e ? String(e.value || "") : "";
}

function money(n) {
  return D.currency + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(D));
}

function load() {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "null");

    if (x && typeof x === "object") {
      D = Object.assign(D, x);
    }
  } catch (e) {
    console.log("HISAB load error", e);
  }

  D.transactions ||= [];
  D.khata ||= [];
  D.business ||= [];
  D.goals ||= [];
  D.bills ||= [];
  D.cards ||= [];
  D.loans ||= [];
  D.emis ||= [];
  D.reminders ||= [];
  D.family ||= [];
  D.tools ||= [];

  D.businessFilter ||= "customer";
  D.businessEntryRole ||= "customer";
}


/* =========================
   NAVIGATION
========================= */

function hideAll() {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });
}

function show(id) {
  hideAll();

  const page = $(id);

  if (!page) {
    console.warn("HISAB page missing:", id);
    return;
  }

  page.style.display = "block";
  window.scrollTo(0, 0);

  if (id === "home") renderHome();
  if (id === "personal") renderPersonal();
  if (id === "business") renderBusiness();
  if (id === "transactions") renderTransactions();
  if (id === "planning") renderPlanning();
  if (id === "credit") renderPayments();
  if (id === "reports") showReports();
  if (id === "reminders") renderReminders();
  if (id === "privacy") renderPrivacy();
  if (id === "family") renderFamily();
  if (id === "familytools") renderFamilyTools();
  if (id === "tools13") renderTools();
  if (id === "final") renderSettings();
}

function goBack() {
  const pages = [...document.querySelectorAll(".page")];

  const visible = pages.find(p => {
    const s = getComputedStyle(p);
    return s.display !== "none";
  });

  const id = visible?.id || "";

  if (id === "khataEntry" || id === "khataDetail") {
    show(
      D.detailMode === "business"
        ? "business"
        : "personal"
    );
    return;
  }

  if (
    [
      "personal",
      "business",
      "transactions",
      "planning",
      "credit",
      "reports",
      "reminders",
      "privacy",
      "family",
      "familytools",
      "tools13",
      "final"
    ].includes(id)
  ) {
    show("home");
    return;
  }

  show("home");
}


/* =========================
   GUEST / STARTUP
========================= */

function showGuestGate() {
  load();

  const gate = $("guestGate");
  const shell = $("appShell");

  if (gate) gate.style.display = "none";
  if (shell) shell.style.display = "block";

  renderHome();

  setTimeout(() => {
    fixHomeButtons();
  }, 50);
}

function enterApp() {
  const gate = $("guestGate");
  const shell = $("appShell");

  if (gate) gate.style.display = "none";
  if (shell) shell.style.display = "block";

  show("home");
}


/* =========================
   HOME
========================= */

function setMode(mode) {
  D.mode = mode;
  D.businessFilter =
    D.businessFilter || "customer";
  D.businessEntryRole =
    D.businessEntryRole || "customer";

  save();

  if (mode === "business") {
    show("business");
  } else {
    show("home");
  }

  renderHome();
}

function renderHome() {
  const income = totalIncome();
  const expense = totalExpense();
  const given = totalGiven(D.mode);
  const received = totalReceive(D.mode);

  if ($("modeLabel"))
    $("modeLabel").textContent =
      D.mode === "business" ? "Business" : "Personal";

  if ($("receivable"))
    $("receivable").textContent = money(given);

  if ($("payable"))
    $("payable").textContent = money(received);

  if ($("homeBalance"))
    $("homeBalance").textContent =
      money(income - expense);

  fixHomeButtons();
}

function fixHomeButtons() {
  const box = $("hisabModeBox");

  if (!box) return;

  box.innerHTML = `
    <div style="
      display:flex;
      gap:8px;
      margin:10px 0 14px;
    ">
      <button
        type="button"
        onclick="setMode('personal')"
        style="
          flex:1;
          border:0;
          border-radius:12px;
          padding:12px;
          font-weight:700;
          background:${D.mode === "personal" ? "#0b5ed7" : "#eef2f7"};
          color:${D.mode === "personal" ? "#fff" : "#222"};
        ">
        Personal
      </button>

      <button
        type="button"
        onclick="setMode('business')"
        style="
          flex:1;
          border:0;
          border-radius:12px;
          padding:12px;
          font-weight:700;
          background:${D.mode === "business" ? "#0b5ed7" : "#eef2f7"};
          color:${D.mode === "business" ? "#fff" : "#222"};
        ">
        Business
      </button>
    </div>
  `;
}


/* =========================
   TRANSACTIONS
========================= */

function totalIncome() {
  return D.transactions
    .filter(x =>
      x.type === "income" &&
      (!x.mode || x.mode === D.mode)
    )
    .reduce((a, x) => a + Number(x.amount || 0), 0);
}

function totalExpense() {
  return D.transactions
    .filter(x =>
      x.type === "expense" &&
      (!x.mode || x.mode === D.mode)
    )
    .reduce((a, x) => a + Number(x.amount || 0), 0);
}

function addTransaction(type = "") {
  type =
    type ||
    val("transactionType") ||
    "expense";

  let amount = num("transactionAmount");

  if (!amount) {
    amount = Number(
      prompt(
        type === "income"
          ? "Income amount"
          : "Expense amount"
      ) || 0
    );
  }

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  let note = val("transactionNote");

  if (!note) {
    note = prompt("Note") || "";
  }

  const category =
    val("transactionCategory") || "General";

  const date =
    val("transactionDate") || today();

  D.transactions.push({
    id: uid(),
    mode: D.mode,
    type,
    amount,
    category,
    note,
    date,
    created: Date.now()
  });

  if ($("transactionAmount"))
    $("transactionAmount").value = "";

  if ($("transactionCategory"))
    $("transactionCategory").value = "";

  if ($("transactionNote"))
    $("transactionNote").value = "";

  save();
  renderHome();
  renderTransactions();
}

function openIncome() {
  show("transactions");

  setTimeout(() => {
    if ($("transactionType"))
      $("transactionType").value = "income";

    if ($("transactionDate") &&
        !$("transactionDate").value)
      $("transactionDate").value = today();
  }, 30);
}

function openExpense() {
  show("transactions");

  setTimeout(() => {
    if ($("transactionType"))
      $("transactionType").value = "expense";

    if ($("transactionDate") &&
        !$("transactionDate").value)
      $("transactionDate").value = today();
  }, 30);
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;

  D.transactions =
    D.transactions.filter(x => x.id !== id);

  save();
  renderTransactions();
  renderHome();
}

function renderTransactions() {
  const list = $("transactionList");

  if (!list) return;

  const rows = D.transactions
    .filter(x =>
      !x.mode || x.mode === D.mode
    )
    .sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

  if (!rows.length) {
    list.innerHTML =
      `<div class="card">No transactions yet.</div>`;
    return;
  }

  list.innerHTML = rows.map(x => `
    <div class="card" style="margin-bottom:8px;">
      <div style="
        display:flex;
        justify-content:space-between;
        gap:10px;
      ">
        <div>
          <b>${esc(x.category)}</b>
          <div>${esc(x.note || "")}</div>
          <small>${esc(x.date)}</small>
        </div>

        <div style="
          font-weight:800;
          color:${x.type === "income" ? "#16823b" : "#c62828"};
        ">
          ${x.type === "income" ? "+" : "-"}
          ${money(x.amount)}
        </div>
      </div>

      <button
        type="button"
        onclick="deleteTransaction('${x.id}')">
        Delete
      </button>
    </div>
  `).join("");
}


/* =========================
   KHATA / UDHAAR
========================= */

function khataData(mode = "personal") {
  return D.khata.filter(x =>
    (x.mode || "personal") === mode
  );
}

function totalGive(mode = D.mode) {
  return khataData(mode)
    .filter(x => x.type === "given")
    .reduce((a, x) => a + Number(x.amount || 0), 0);
}

function totalReceive(mode = D.mode) {
  return khataData(mode)
    .filter(x => x.type === "received")
    .reduce((a, x) => a + Number(x.amount || 0), 0);
}

function openKhataForm(
  mode = "personal",
  person = "",
  phone = ""
) {
  D.detailMode = mode;
  D.detailPerson = person;
  D.detailPhone = phone;

  editKhataId = null;

  if ($("khataPerson"))
    $("khataPerson").value = person || "";

  if ($("khataAmount"))
    $("khataAmount").value = "";

  if ($("khataDate"))
    $("khataDate").value = today();

  if ($("khataMethod"))
    $("khataMethod").value = "Cash";

  if ($("khataStatus"))
    $("khataStatus").value = "pending";

  if ($("khataNote"))
    $("khataNote").value = "";

  if ($("khataType"))
    $("khataType").value = "given";

  show("khataEntry");
}

function saveKhataEntry() {
  const person =
    val("khataPerson").trim();

  const amount =
    num("khataAmount");

  if (!person) {
    alert("Enter name");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const mode =
    D.detailMode || "personal";

  const row = {
    id: editKhataId || uid(),
    mode,
    person,
    phone: D.detailPhone || "",
    type:
      val("khataType") || "given",
    amount,
    date:
      val("khataDate") || today(),
    method:
      val("khataMethod") || "Cash",
    status:
      val("khataStatus") || "pending",
    note:
      val("khataNote") || "",
    role:
      mode === "business"
        ? (D.businessEntryRole || D.businessFilter || "customer")
        : "customer",
    created: Date.now()
  };

  if (editKhataId) {
    const i =
      D.khata.findIndex(x => x.id === editKhataId);

    if (i >= 0)
      D.khata[i] = row;
    else
      D.khata.push(row);
  } else {
    D.khata.push(row);
  }

  editKhataId = null;

  save();

  if (mode === "business")
    show("business");
  else
    show("personal");
}

function renderPersonal() {
  const list = $("personalList");

  if (!list) return;

  const q =
    val("personalSearch").toLowerCase();

  let rows = khataData("personal");

  if (D.filter !== "all") {
    rows = rows.filter(x =>
      x.type === D.filter
    );
  }

  if (q) {
    rows = rows.filter(x =>
      String(x.person || "")
        .toLowerCase()
        .includes(q) ||
      String(x.phone || "")
        .includes(q)
    );
  }

  const given = rows
    .filter(x => x.type === "given")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  const received = rows
    .filter(x => x.type === "received")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  if ($("ledgerGiven"))
    $("ledgerGiven").textContent = money(given);

  if ($("ledgerReceived"))
    $("ledgerReceived").textContent = money(received);

  if ($("ledgerNet"))
    $("ledgerNet").textContent =
      money(given - received);

  const people = {};

  rows.forEach(x => {
    const key =
      String(x.person).toLowerCase() +
      "|" +
      String(x.phone || "");

    if (!people[key]) {
      people[key] = {
        name: x.person,
        phone: x.phone || "",
        rows: []
      };
    }

    people[key].rows.push(x);
  });

  const arr = Object.values(people);

  list.innerHTML = arr.length
    ? arr.map(p => personCard(p)).join("")
    : `<div class="card">No Udhaar entries yet.</div>`;
}

function personCard(p) {
  const give = p.rows
    .filter(x => x.type === "given")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  const receive = p.rows
    .filter(x => x.type === "received")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  return `
    <div class="card" style="margin-bottom:10px;">
      <b>${esc(p.name)}</b>
      ${p.phone
        ? `<div>${esc(p.phone)}</div>`
        : ""}

      <div style="margin-top:6px;">
        <span style="color:#c62828;">
          Give ${money(give)}
        </span>
        &nbsp;
        <span style="color:#16823b;">
          Receive ${money(receive)}
        </span>
      </div>

      <div style="
        display:flex;
        gap:6px;
        flex-wrap:wrap;
        margin-top:8px;
      ">
        <button type="button"
          onclick="openKhataDetail('personal','${esc(p.name)}','${esc(p.phone)}')">
          Khata
        </button>

        <button type="button"
          onclick="openKhataForm('personal','${esc(p.name)}','${esc(p.phone)}')">
          + Entry
        </button>
      </div>
    </div>
  `;
}

function setPersonalFilter(filter) {
  D.filter = filter;
  save();
  renderPersonal();
}

function openKhataDetail(
  mode,
  person,
  phone = ""
) {
  D.detailMode = mode;
  D.detailPerson = person;
  D.detailPhone = phone;

  show("khataDetail");
  renderKhataDetail();
}

function renderKhataDetail() {
  const person =
    D.detailPerson || "";

  const rows =
    khataData(D.detailMode)
      .filter(x =>
        String(x.person).toLowerCase() ===
        person.toLowerCase()
      )
      .sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );

  const give = rows
    .filter(x => x.type === "given")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  const receive = rows
    .filter(x => x.type === "received")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  if ($("detailPersonName"))
    $("detailPersonName").textContent = person;

  if ($("detailGive"))
    $("detailGive").textContent = money(give);

  if ($("detailReceive"))
    $("detailReceive").textContent = money(receive);

  if ($("detailBalance"))
    $("detailBalance").textContent =
      money(give - receive);

  const list = $("khataHistory");

  if (!list) return;

  list.innerHTML = rows.length
    ? rows.map(khataEntryCard).join("")
    : `<div class="card">No history.</div>`;
}

function khataEntryCard(x) {
  return `
    <div class="card" style="margin-bottom:8px;">
      <div style="
        display:flex;
        justify-content:space-between;
      ">
        <b style="
          color:${x.type === "given"
            ? "#c62828"
            : "#16823b"};
        ">
          ${x.type === "given"
            ? "Give"
            : "Receive"}
        </b>

        <b>${money(x.amount)}</b>
      </div>

      <div>${esc(x.date)}</div>

      <div>
        ${esc(x.method || "")}
        ${x.status
          ? " • " + esc(x.status)
          : ""}
      </div>

      <div>${esc(x.note || "")}</div>

      <div style="
        display:flex;
        gap:6px;
        margin-top:7px;
      ">
        <button type="button"
          onclick="editKhata('${x.id}')">
          Edit
        </button>

        <button type="button"
          onclick="deleteKhata('${x.id}')">
          Delete
        </button>

        ${
          x.status !== "settled"
            ? `<button type="button"
                onclick="settleKhata('${x.id}')">
                Settle
              </button>`
            : ""
        }
      </div>
    </div>
  `;
}

function editKhata(id) {
  const x =
    D.khata.find(a => a.id === id);

  if (!x) return;

  editKhataId = id;
  D.detailMode = x.mode || "personal";
  D.detailPerson = x.person || "";
  D.detailPhone = x.phone || "";
  D.businessEntryRole =
    x.role || "customer";

  show("khataEntry");

  setTimeout(() => {
    if ($("khataPerson"))
      $("khataPerson").value = x.person || "";

    if ($("khataType"))
      $("khataType").value = x.type || "given";

    if ($("khataAmount"))
      $("khataAmount").value = x.amount || "";

    if ($("khataDate"))
      $("khataDate").value =
        x.date || today();

    if ($("khataMethod"))
      $("khataMethod").value =
        x.method || "Cash";

    if ($("khataStatus"))
      $("khataStatus").value =
        x.status || "pending";

    if ($("khataNote"))
      $("khataNote").value =
        x.note || "";
  }, 20);
}

function deleteKhata(id) {
  if (!confirm("Delete this entry?")) return;

  D.khata =
    D.khata.filter(x => x.id !== id);

  save();

  if ($("khataDetail") &&
      getComputedStyle($("khataDetail")).display !== "none") {
    renderKhataDetail();
  }

  renderPersonal();
  renderBusiness();
}

function settleKhata(id) {
  const x =
    D.khata.find(a => a.id === id);

  if (!x) return;

  x.status = "settled";

  save();
  renderKhataDetail();
  renderPersonal();
  renderBusiness();
}


/* =========================
   BUSINESS
========================= */

function addBusinessCustomer() {
  openBusinessCustomerForm("", "", "customer");
}

function addBusinessSupplier() {
  openBusinessCustomerForm("", "", "supplier");
}

function openBusinessCustomerForm(
  name = "",
  phone = "",
  role = "customer"
) {
  D.businessEntryRole = role;

  const old = $("businessPersonModal");
  if (old) old.remove();

  const modal =
    document.createElement("div");

  modal.id = "businessPersonModal";

  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    z-index:99999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
  `;

  modal.innerHTML = `
    <div style="
      background:#fff;
      width:100%;
      max-width:430px;
      border-radius:18px;
      padding:18px;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">
        <h3>
          ${role === "supplier"
            ? "Add Supplier"
            : "Add Customer"}
        </h3>

        <button
          type="button"
          id="closeBusinessCustomer"
          style="
            font-size:22px;
            border:0;
            background:transparent;
          ">
          ×
        </button>
      </div>

      <input
        id="businessPersonName"
        placeholder="Name"
        value="${esc(name)}"
        style="width:100%;margin:10px 0;padding:12px;"
      >

      <input
        id="businessPersonPhone"
        placeholder="Mobile number"
        value="${esc(phone)}"
        inputmode="tel"
        style="width:100%;margin:0 0 10px;padding:12px;"
      >

      <button
        type="button"
        id="selectBusinessContact"
        style="width:100%;margin-bottom:8px;">
        📱 Select Contact
      </button>

      <button
        type="button"
        id="saveBusinessPerson"
        style="width:100%;">
        Save
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  $("closeBusinessCustomer")
    ?.addEventListener("click", () => {
      modal.remove();
    });

  $("selectBusinessContact")
    ?.addEventListener("click", selectBusinessContact);

  $("saveBusinessPerson")
    ?.addEventListener("click", () => {
      const n =
        String($("businessPersonName")?.value || "")
          .trim();

      const p =
        String($("businessPersonPhone")?.value || "")
          .trim();

      if (!n) {
        alert("Enter name");
        return;
      }

      const exists =
        D.business.some(x =>
          (x.role || "customer") === role &&
          String(x.name || x.person || "")
            .toLowerCase() === n.toLowerCase() &&
          String(x.phone || "") === p
        );

      if (!exists) {
        D.business.push({
          id: uid(),
          role,
          name: n,
          phone: p,
          created: Date.now()
        });
      }

      save();
      modal.remove();
      D.businessFilter = role;
      renderBusiness();
    });
}

async function selectBusinessContact() {
  try {
    if (navigator.contacts &&
        navigator.contacts.select) {

      const contacts =
        await navigator.contacts.select(
          ["name", "tel"],
          { multiple: false }
        );

      if (contacts && contacts[0]) {
        const c = contacts[0];

        if ($("businessPersonName"))
          $("businessPersonName").value =
            c.name?.[0] || "";

        if ($("businessPersonPhone"))
          $("businessPersonPhone").value =
            c.tel?.[0] || "";
      }

      return;
    }
  } catch (e) {
    console.log(e);
  }

  alert(
    "Contact picker is not available on this WebView. Please enter name and mobile number manually."
  );
}

function getBusinessPeople(role) {
  const map = {};

  D.business
    .filter(x =>
      (x.role || "customer") === role
    )
    .forEach(x => {
      const name =
        String(x.name || x.person || "")
          .trim();

      if (!name) return;

      const phone =
        String(x.phone || "");

      const key =
        name.toLowerCase() + "|" + phone;

      if (!map[key]) {
        map[key] = {
          name,
          phone,
          role,
          give: 0,
          receive: 0,
          rows: []
        };
      }
    });

  D.khata
    .filter(x =>
      (x.mode || "personal") === "business" &&
      (x.role || "customer") === role
    )
    .forEach(x => {
      const name =
        String(x.person || "").trim();

      if (!name) return;

      const phone =
        String(x.phone || "");

      const key =
        name.toLowerCase() + "|" + phone;

      if (!map[key]) {
        map[key] = {
          name,
          phone,
          role,
          give: 0,
          receive: 0,
          rows: []
        };
      }

      if (x.type === "given")
        map[key].give +=
          Number(x.amount || 0);

      if (x.type === "received")
        map[key].receive +=
          Number(x.amount || 0);

      map[key].rows.push(x);
    });

  return Object.values(map);
}

function renderBusiness() {
  const list = $("businessList");

  if (!list) return;

  const role =
    D.businessFilter || "customer";

  const q =
    val("businessSearch").toLowerCase();

  let people =
    getBusinessPeople(role);

  if (q) {
    people = people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.phone || "").includes(q)
    );
  }

  const given =
    people.reduce(
      (a, x) => a + x.give, 0
    );

  const received =
    people.reduce(
      (a, x) => a + x.receive, 0
    );

  if ($("businessGiven"))
    $("businessGiven").textContent =
      money(given);

  if ($("businessReceived"))
    $("businessReceived").textContent =
      money(received);

  if ($("businessNet"))
    $("businessNet").textContent =
      money(given - received);

  list.innerHTML = `
    <div style="
      display:flex;
      gap:8px;
      margin-bottom:10px;
    ">
      <button
        type="button"
        onclick="setBusinessFilter('customer')"
        style="
          flex:1;
          background:${role === "customer"
            ? "#0b5ed7"
            : ""};
          color:${role === "customer"
            ? "#fff"
            : ""};
        ">
        Customers
      </button>

      <button
        type="button"
        onclick="setBusinessFilter('supplier')"
        style="
          flex:1;
          background:${role === "supplier"
            ? "#0b5ed7"
            : ""};
          color:${role === "supplier"
            ? "#fff"
            : ""};
        ">
        Suppliers
      </button>
    </div>

    <div style="
      display:flex;
      gap:8px;
      margin-bottom:10px;
    ">
      <button
        type="button"
        onclick="addBusinessCustomer()"
        style="flex:1;">
        + Customer
      </button>

      <button
        type="button"
        onclick="addBusinessSupplier()"
        style="flex:1;">
        + Supplier
      </button>
    </div>

    ${
      people.length
        ? people.map(businessPersonCard).join("")
        : `<div class="card">
             No ${role}s yet.
           </div>`
    }
  `;
}

function setBusinessFilter(role) {
  D.businessFilter = role;
  D.businessEntryRole = role;
  save();
  renderBusiness();
}

function businessPersonCard(p) {
  return `
    <div class="card" style="margin-bottom:10px;">
      <b>${esc(p.name)}</b>

      ${
        p.phone
          ? `<div>${esc(p.phone)}</div>`
          : ""
      }

      <div style="margin-top:6px;">
        <span style="color:#c62828;">
          Give ${money(p.give)}
        </span>
        &nbsp;
        <span style="color:#16823b;">
          Receive ${money(p.receive)}
        </span>
      </div>

      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin-top:9px;
      ">
        <button type="button"
          onclick="openBusinessDetail('${esc(p.name)}','${esc(p.phone)}','${p.role}')">
          Khata
        </button>

        <button type="button"
          onclick="openBusinessEntry('${p.role}','${esc(p.name)}','${esc(p.phone)}')">
          + Entry
        </button>

        <button type="button"
          onclick="businessStatement('${esc(p.name)}','${p.role}')">
          Statement
        </button>

        <button type="button"
          onclick="businessWhatsApp('${esc(p.name)}','${esc(p.phone)}','${p.role}')">
          WhatsApp
        </button>
      </div>
    </div>
  `;
}

function openBusinessEntry(
  role = "customer",
  person = "",
  phone = ""
) {
  D.businessEntryRole = role;
  D.detailMode = "business";
  D.detailPerson = person;
  D.detailPhone = phone;

  openKhataForm(
    "business",
    person,
    phone
  );
}

function openBusinessDetail(
  person,
  phone = "",
  role = "customer"
) {
  D.detailMode = "business";
  D.detailPerson = person;
  D.detailPhone = phone;
  D.businessEntryRole = role;

  show("khataDetail");
  renderKhataDetail();
}


/* =========================
   BUSINESS SALES / PURCHASE
========================= */

function addBusinessRecord(type = "sale") {
  const name =
    prompt(
      type === "purchase"
        ? "Supplier name"
        : "Customer name"
    );

  if (!name) return;

  const amount =
    Number(prompt("Amount") || 0);

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  D.business.push({
    id: uid(),
    role:
      type === "purchase"
        ? "supplier"
        : "customer",
    recordType: type,
    name,
    amount,
    date: today(),
    created: Date.now()
  });

  save();
  renderBusiness();
}

function deleteBusinessRecord(id) {
  if (!confirm("Delete record?")) return;

  D.business =
    D.business.filter(x => x.id !== id);

  save();
  renderBusiness();
}


/* =========================
   STATEMENT / WHATSAPP
========================= */

function statementRows(
  person,
  mode = "business",
  role = ""
) {
  return D.khata
    .filter(x =>
      (x.mode || "personal") === mode &&
      String(x.person).toLowerCase() ===
        String(person).toLowerCase() &&
      (!role || (x.role || "customer") === role)
    )
    .sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
}

function businessStatement(
  person,
  role = "customer"
) {
  const rows =
    statementRows(
      person,
      "business",
      role
    );

  let text =
    "HISAB Business Statement\n\n";

  text += "Name: " + person + "\n";

  rows.forEach(x => {
    text +=
      `${x.date} | ${
        x.type === "given"
          ? "Give"
          : "Receive"
      } | ${money(x.amount)}${
        x.note
          ? " | " + x.note
          : ""
      }\n`;
  });

  const give =
    rows
      .filter(x => x.type === "given")
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  const receive =
    rows
      .filter(x => x.type === "received")
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  text +=
    "\nGive: " + money(give);

  text +=
    "\nReceive: " + money(receive);

  text +=
    "\nBalance: " +
    money(give - receive);

  if (navigator.share) {
    navigator.share({
      title: "HISAB Statement",
      text
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
    alert("Statement copied");
  }
}

function businessWhatsApp(
  person,
  phone,
  role = "customer"
) {
  let number =
    String(phone || "")
      .replace(/\D/g, "");

  if (number.length === 10)
    number = "91" + number;

  const rows =
    statementRows(
      person,
      "business",
      role
    );

  const give =
    rows
      .filter(x => x.type === "given")
      .reduce(
        (a, x) => a + Number(x.amount || 0),
        0
      );

  const receive =
    rows
      .filter(x => x.type === "received")
      .reduce(
        (a, x) => a + Number(x.amount || 0),
        0
      );

  const text =
`HISAB Statement
Name: ${person}

Give: ${money(give)}
Receive: ${money(receive)}
Balance: ${money(give - receive)}

Thank you.`;

  const url =
    "https://wa.me/" +
    number +
    "?text=" +
    encodeURIComponent(text);

  window.open(url, "_blank");
}


/* =========================
   PAYMENT
========================= */

function openPaymentEntry() {
  const role =
    D.detailMode === "business"
      ? (
          D.businessEntryRole ||
          D.businessFilter ||
          "customer"
        )
      : "customer";

  if (D.detailMode === "business")
    D.businessEntryRole = role;

  openKhataForm(
    D.detailMode || "personal",
    D.detailPerson || "",
    D.detailPhone || ""
  );
}


/* =========================
   PLANNING
========================= */

function renderPlanning() {
  const page = $("planning");
  if (!page) return;

  const totalGoals =
    D.goals.reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );

  const budget =
    Number(D.budget || 0);

  const spent = totalExpense();

  const target =
    page.querySelector("#planningSummary");

  if (target) {
    target.innerHTML = `
      <div class="card">
        <b>Budget:</b> ${money(budget)}
        <br>
        <b>Spent:</b> ${money(spent)}
        <br>
        <b>Goals:</b> ${money(totalGoals)}
      </div>
    `;
  }
}

function addGoal() {
  const name =
    prompt("Goal name");

  if (!name) return;

  const amount =
    Number(prompt("Target amount") || 0);

  D.goals.push({
    id: uid(),
    name,
    amount,
    saved: 0,
    created: Date.now()
  });

  save();
  renderPlanning();
}

function addBudget() {
  const amount =
    Number(prompt("Budget amount") || 0);

  if (amount < 0) return;

  D.budget = amount;
  save();
  renderPlanning();
}


/* =========================
   PAYMENTS / CREDIT
========================= */

function renderPayments() {
  const list = $("creditList");
  if (!list) return;

  const rows = [
    ...D.bills.map(x => ({
      ...x,
      itemType: "Bill"
    })),
    ...D.loans.map(x => ({
      ...x,
      itemType: "Loan"
    })),
    ...D.emis.map(x => ({
      ...x,
      itemType: "EMI"
    }))
  ];

  list.innerHTML =
    rows.length
      ? rows.map(x => `
          <div class="card">
            <b>${esc(x.name || x.title || x.itemType)}</b>
            <div>${money(x.amount || x.emi || 0)}</div>
            <small>
              ${esc(x.dueDate || x.date || "")}
            </small>
          </div>
        `).join("")
      : `<div class="card">No payment records.</div>`;
}

function addBill() {
  const name =
    prompt("Bill name");

  if (!name) return;

  const amount =
    Number(prompt("Amount") || 0);

  D.bills.push({
    id: uid(),
    name,
    amount,
    dueDate: today(),
    status: "pending"
  });

  save();
  renderPayments();
}

function addLoan() {
  const name =
    prompt("Loan name");

  if (!name) return;

  const amount =
    Number(prompt("Loan amount") || 0);

  D.loans.push({
    id: uid(),
    name,
    amount,
    dueDate: today(),
    status: "pending"
  });

  save();
  renderPayments();
}


/* =========================
   REPORTS
========================= */

function showReports() {
  const page = $("reports");
  if (!page) return;

  const income = totalIncome();
  const expense = totalExpense();
  const given = totalGiven(D.mode);
  const received = totalReceive(D.mode);

  const box =
    page.querySelector("#reportSummary");

  if (box) {
    box.innerHTML = `
      <div class="card">
        <b>Income:</b> ${money(income)}
        <br>
        <b>Expense:</b> ${money(expense)}
        <br>
        <b>Give:</b> ${money(given)}
        <br>
        <b>Receive:</b> ${money(received)}
        <br>
        <b>Balance:</b> ${money(income - expense)}
      </div>
    `;
  }
}


/* =========================
   REMINDERS
========================= */

function renderReminders() {
  const list = $("reminderList");
  if (!list) return;

  list.innerHTML =
    D.reminders.length
      ? D.reminders.map(x => `
          <div class="card">
            <b>${esc(x.title || "Reminder")}</b>
            <div>${esc(x.date || "")}</div>
            <div>${esc(x.note || "")}</div>
          </div>
        `).join("")
      : `<div class="card">No reminders.</div>`;
}

function addReminder() {
  const title =
    prompt("Reminder");

  if (!title) return;

  D.reminders.push({
    id: uid(),
    title,
    date: today(),
    note: ""
  });

  save();
  renderReminders();
}


/* =========================
   SECURITY / PRIVACY
========================= */

function renderPrivacy() {
  const box = $("privacyContent");
  if (!box) return;

  box.innerHTML = `
    <div class="card">
      <b>Security</b>
      <p>
        ${
          D.pin
            ? "PIN protection is enabled."
            : "No PIN is set."
        }
      </p>
    </div>
  `;
}

function setPIN() {
  const pin =
    prompt("Enter 4 digit PIN");

  if (!/^\d{4}$/.test(pin || "")) {
    alert("Use exactly 4 digits");
    return;
  }

  D.pin = pin;
  save();

  alert("PIN saved");
  renderPrivacy();
}

function removePIN() {
  D.pin = "";
  save();
  renderPrivacy();
}


/* =========================
   FAMILY
========================= */

function renderFamily() {
  const list = $("familyList");
  if (!list) return;

  list.innerHTML =
    D.family.length
      ? D.family.map(x => `
          <div class="card">
            <b>${esc(x.name)}</b>
            <div>${esc(x.phone || "")}</div>
          </div>
        `).join("")
      : `<div class="card">No family members.</div>`;
}

function addFamilyMember() {
  const name =
    prompt("Name");

  if (!name) return;

  const phone =
    prompt("Mobile number") || "";

  D.family.push({
    id: uid(),
    name,
    phone
  });

  save();
  renderFamily();
}

function renderFamilyTools() {
  const box = $("familyToolsList");
  if (!box) return;

  box.innerHTML =
    `<div class="card">
       Family tools ready.
     </div>`;
}


/* =========================
   TOOLS
========================= */

function renderTools() {
  const box = $("toolsList");
  if (!box) return;

  box.innerHTML =
    `<div class="card">
       HISAB tools are ready.
     </div>`;
}


/* =========================
   SETTINGS
========================= */

function renderSettings() {
  if ($("currencySelect"))
    $("currencySelect").value =
      D.currency;

  if ($("languageSelect"))
    $("languageSelect").value =
      D.language;
}

function saveSettings() {
  if ($("currencySelect"))
    D.currency =
      $("currencySelect").value ||
      D.currency;

  if ($("languageSelect"))
    D.language =
      $("languageSelect").value ||
      D.language;

  save();
  renderHome();

  alert("Settings saved");
}

function setCurrency(currency) {
  D.currency = currency;
  save();
  renderHome();
}

function setLanguage(language) {
  D.language = language;
  save();
}


/* =========================
   BACKUP / RESTORE
========================= */

function backupData() {
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
    "HISAB-backup-" +
    today() +
    ".json";

  a.click();

  setTimeout(() =>
    URL.revokeObjectURL(url), 1000);
}

function restoreData() {
  const input =
    document.createElement("input");

  input.type = "file";
  input.accept = ".json,application/json";

  input.onchange = e => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const data =
          JSON.parse(reader.result);

        if (!data ||
            typeof data !== "object") {
          throw new Error();
        }

        D = Object.assign(D, data);
        save();

        alert("Backup restored");
        location.reload();
      } catch {
        alert("Invalid backup file");
      }
    };

    reader.readAsText(file);
  };

  input.click();
}


/* =========================
   SIMPLE PDF
========================= */

function makeSimplePDF(lines) {
  const clean =
    lines.map(x =>
      String(x)
        .replace(/[^\x20-\x7E]/g, "")
    );

  let y = 800;

  const objects = [];

  const content =
    "BT\n" +
    "/F1 11 Tf\n" +
    "50 800 Td\n" +
    clean.map((line, i) =>
      i === 0
        ? `(${pdfText(line)}) Tj`
        : `0 -18 Td (${pdfText(line)}) Tj`
    ).join("\n") +
    "\nET";

  const pdf =
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R
/MediaBox [0 0 612 842]
/Resources << /Font << /F1 4 0 R >> >>
/Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${content.length} >>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000282 00000 n 
0000000352 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${352 + content.length + 20}
%%EOF`;

  return new Blob(
    [pdf],
    { type: "application/pdf" }
  );
}

function pdfText(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

async function sharePDF(
  blob,
  filename
) {
  const file =
    new File(
      [blob],
      filename,
      { type: "application/pdf" }
    );

  try {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: "HISAB PDF",
        files: [file]
      });
      return;
    }
  } catch (e) {
    console.log(e);
  }

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() =>
    URL.revokeObjectURL(url), 1000);
}

function exportSummaryPDF() {
  const lines = [
    "HISAB REPORT",
    "",
    "Mode: " +
      (D.mode === "business"
        ? "Business"
        : "Personal"),
    "",
    "Income: " +
      money(totalIncome()),
    "Expense: " +
      money(totalExpense()),
    "Give: " +
      money(totalGiven(D.mode)),
    "Receive: " +
      money(totalReceive(D.mode)),
    "Balance: " +
      money(
        totalIncome() -
        totalExpense()
      )
  ];

  const blob =
    makeSimplePDF(lines);

  sharePDF(
    blob,
    "HISAB-Report.pdf"
  );
}

function exportKhataPDF() {
  const rows =
    statementRows(
      D.detailPerson,
      D.detailMode,
      D.detailMode === "business"
        ? D.businessEntryRole
        : ""
    );

  const lines = [
    "HISAB KHATA",
    "",
    "Name: " +
      D.detailPerson
  ];

  rows.forEach(x => {
    lines.push(
      `${x.date}  ${
        x.type === "given"
          ? "Give"
          : "Receive"
      }  ${money(x.amount)}`
    );
  });

  const give =
    rows
      .filter(x => x.type === "given")
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  const receive =
    rows
      .filter(x => x.type === "received")
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  lines.push("");
  lines.push(
    "Give: " + money(give)
  );
  lines.push(
    "Receive: " + money(receive)
  );
  lines.push(
    "Balance: " +
    money(give - receive)
  );

  const blob =
    makeSimplePDF(lines);

  sharePDF(
    blob,
    "HISAB-Khata.pdf"
  );
}

function shareKhata() {
  exportKhataPDF();
}


/* =========================
   QUICK ACTIONS
========================= */

function openUdhaar() {
  show("personal");
}

function openBusiness() {
  D.mode = "business";
  D.businessFilter ||= "customer";
  D.businessEntryRole =
    D.businessFilter;

  save();
  show("business");
}

function openPersonal() {
  D.mode = "personal";
  save();
  show("personal");
}


/* =========================
   SEARCH
========================= */

document.addEventListener(
  "input",
  e => {
    if (e.target?.id === "personalSearch")
      renderPersonal();

    if (e.target?.id === "businessSearch")
      renderBusiness();
  }
);


/* =========================
   START
========================= */

load();

window.addEventListener(
  "DOMContentLoaded",
  () => {
    showGuestGate();
  }
);


/* =========================
   GLOBAL SAFETY
   Existing index buttons
========================= */

window.show = show;
window.goBack = goBack;
window.setMode = setMode;

window.openIncome = openIncome;
window.openExpense = openExpense;
window.addTransaction = addTransaction;

window.openKhataForm = openKhataForm;
window.saveKhataEntry = saveKhataEntry;
window.openKhataDetail = openKhataDetail;
window.editKhata = editKhata;
window.deleteKhata = deleteKhata;
window.settleKhata = settleKhata;
window.openPaymentEntry = openPaymentEntry;

window.addBusinessCustomer =
  addBusinessCustomer;

window.addBusinessSupplier =
  addBusinessSupplier;

window.openBusinessCustomerForm =
  openBusinessCustomerForm;

window.selectBusinessContact =
  selectBusinessContact;

window.setBusinessFilter =
  setBusinessFilter;

window.openBusinessEntry =
  openBusinessEntry;

window.openBusinessDetail =
  openBusinessDetail;

window.businessStatement =
  businessStatement;

window.businessWhatsApp =
  businessWhatsApp;

window.addBusinessRecord =
  addBusinessRecord;

window.deleteBusinessRecord =
  deleteBusinessRecord;

window.addGoal = addGoal;
window.addBudget = addBudget;

window.addBill = addBill;
window.addLoan = addLoan;

window.addReminder = addReminder;

window.setPIN = setPIN;
window.removePIN = removePIN;

window.addFamilyMember =
  addFamilyMember;

window.backupData = backupData;
window.restoreData = restoreData;

window.exportSummaryPDF =
  exportSummaryPDF;

window.exportKhataPDF =
  exportKhataPDF;

window.shareKhata =
  shareKhata;

window.saveSettings =
  saveSettings;

window.setCurrency =
  setCurrency;

window.setLanguage =
  setLanguage;

window.openUdhaar =
  openUdhaar;

window.openBusiness =
  openBusiness;

window.openPersonal =
  openPersonal;

window.showGuestGate =
  showGuestGate;
