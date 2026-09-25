/* =========================================================
   HISAB GLOBAL V7
   FINAL SAFE CONTROLLER
   Personal + Business + Udhaar + Income + Expense
   Customer/Supplier + Sales/Purchase + Reports + PDF
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

  budget: 0,
  pin: "",
  tools: [],

  filter: "all",
  businessFilter: "customer",

  detailPerson: "",
  detailPhone: "",
  detailMode: "personal",
  detailFilter: "all",

  businessEntryRole: "customer"
};

let editKhataId = null;

/* ================= BASIC ================= */

const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(n) {
  return D.currency +
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m] || m));
}

function val(id) {
  return $(id)?.value?.trim() || "";
}

function num(id) {
  return Number($(id)?.value || 0);
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(D));
  } catch (e) {
    console.error(e);
  }
}

function load() {
  try {
    const old = JSON.parse(
      localStorage.getItem(KEY) || "null"
    );

    if (old && typeof old === "object") {
      D = { ...D, ...old };
    }
  } catch (e) {
    console.error(e);
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

  if (!D.currency) D.currency = "₹";
  if (!D.mode) D.mode = "personal";
  if (!D.businessFilter) D.businessFilter = "customer";
}

/* ================= NAVIGATION ================= */

function hideAll() {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });
}

function show(id) {
  hideAll();

  const page = $(id);
  if (!page) return;

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

/* ================= BACK ================= */

function goBack() {
  const pages = [...document.querySelectorAll(".page")];

  const visible = pages.find(p => {
    return getComputedStyle(p).display !== "none";
  });

  const id = visible?.id || "";

  if (id === "khataEntry") {
    show(
      D.detailMode === "business"
        ? "business"
        : "personal"
    );
    return;
  }

  if (id === "khataDetail") {
    show(
      D.detailMode === "business"
        ? "business"
        : "personal"
    );
    return;
  }

  if (
    id === "personal" ||
    id === "business" ||
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
    show("home");
    return;
  }

  show(
    D.mode === "business"
      ? "business"
      : "home"
  );
}

/* ================= GUEST ================= */

function showGuestGate() {
  if ($("guestGate"))
    $("guestGate").style.display = "flex";

  if ($("appShell"))
    $("appShell").style.display = "none";
}

function enterGuestMode() {
  if ($("guestGate"))
    $("guestGate").style.display = "none";

  if ($("appShell"))
    $("appShell").style.display = "block";

  show("home");
}

/* ================= HOME MODE ================= */

function setMode(mode) {
  D.mode = mode;

  if (mode === "business" && !D.businessFilter) {
    D.businessFilter = "customer";
  }

  save();
  renderHome();

  if (mode === "business") {
    show("business");
  } else {
    show("home");
  }
}

function fixHomeButtons() {
  const home = $("home");
  if (!home) return;

  const title =
    home.querySelector(".page-title") ||
    home.querySelector("h1") ||
    home.querySelector("h2");

  let box = $("hisabModeBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "hisabModeBox";

    box.style.cssText =
      "display:flex;gap:8px;margin:10px 0 14px;padding:4px;background:#eef4f8;border-radius:14px;";

    if (title) {
      title.insertAdjacentElement("afterend", box);
    } else {
      home.prepend(box);
    }
  }

  box.innerHTML = `
    <button
      onclick="setMode('personal')"
      style="
        flex:1;
        padding:11px 8px;
        border:0;
        border-radius:11px;
        font-weight:700;
        background:${D.mode === "personal" ? "#0b5ed7" : "transparent"};
        color:${D.mode === "personal" ? "#fff" : "#0b1f33"};
      ">
      👤 Personal
    </button>

    <button
      onclick="setMode('business')"
      style="
        flex:1;
        padding:11px 8px;
        border:0;
        border-radius:11px;
        font-weight:700;
        background:${D.mode === "business" ? "#0b5ed7" : "transparent"};
        color:${D.mode === "business" ? "#fff" : "#0b1f33"};
      ">
      🏢 Business
    </button>
  `;
}

function renderHome() {
  fixHomeButtons();

  if ($("modeLabel")) {
    $("modeLabel").textContent =
      D.mode === "business"
        ? "Business"
        : "Personal";
  }

  const rows = khataData(D.mode);

  const given = rows.reduce(
    (a, x) => a + Number(x.give || 0),
    0
  );

  const received = rows.reduce(
    (a, x) => a + Number(x.receive || 0),
    0
  );

  if ($("receivable"))
    $("receivable").textContent = money(given);

  if ($("payable"))
    $("payable").textContent = money(received);

  if ($("homeBalance"))
    $("homeBalance").textContent =
      money(given - received);
}

/* ================= KHATA DATA ================= */

function khataData(mode = D.mode) {
  const map = {};

  D.khata
    .filter(x => (x.mode || "personal") === mode)
    .forEach(x => {
      const name = String(x.person || "").trim();
      if (!name) return;

      const phone = x.phone || "";
      const key = name.toLowerCase() + "|" + phone;

      if (!map[key]) {
        map[key] = {
          name,
          phone,
          give: 0,
          receive: 0,
          rows: []
        };
      }

      if (x.type === "given") {
        map[key].give += Number(x.amount || 0);
      } else if (x.type === "received") {
        map[key].receive += Number(x.amount || 0);
      }

      map[key].rows.push(x);
    });

  return Object.values(map);
}

function totalGive(mode = D.mode) {
  return khataData(mode).reduce(
    (a, x) => a + Number(x.give || 0),
    0
  );
}

function totalReceive(mode = D.mode) {
  return khataData(mode).reduce(
    (a, x) => a + Number(x.receive || 0),
    0
  );
}

/* ================= KHATA FORM ================= */

function openKhataForm(
  mode = "personal",
  person = "",
  phone = ""
) {
  D.detailMode = mode;
  D.businessEntryRole =
    mode === "business"
      ? (D.businessFilter || "customer")
      : "customer";

  editKhataId = null;

  show("khataEntry");

  setTimeout(() => {
    if ($("khataPerson"))
      $("khataPerson").value = person || "";

    if ($("khataAmount"))
      $("khataAmount").value = "";

    if ($("khataDate"))
      $("khataDate").value = today();

    if ($("khataNote"))
      $("khataNote").value = "";

    if ($("khataPhone"))
      $("khataPhone").value = phone || "";
  }, 20);
}

/* ================= SAVE KHATA ================= */

function saveKhataEntry() {
  const person = val("khataPerson");
  const amount = num("khataAmount");

  if (!person) {
    alert("Enter name");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const type =
    val("khataType") || "given";

  const date =
    val("khataDate") || today();

  const method =
    val("khataMethod") || "Cash";

  const status =
    val("khataStatus") || "pending";

  const note = val("khataNote");

  const phone =
    val("khataPhone") ||
    D.detailPhone ||
    "";

  const mode =
    D.detailMode || D.mode;

  const role =
    mode === "business"
      ? (D.businessEntryRole || D.businessFilter || "customer")
      : "personal";

  if (editKhataId) {
    const row = D.khata.find(
      x => x.id === editKhataId
    );

    if (row) {
      row.person = person;
      row.phone = phone;
      row.type = type;
      row.amount = amount;
      row.date = date;
      row.method = method;
      row.status = status;
      row.note = note;
      row.mode = mode;
      row.role = role;
    }

    editKhataId = null;
  } else {
    D.khata.push({
      id: uid(),
      mode,
      person,
      phone,
      type,
      amount,
      date,
      method,
      status,
      note,
      role,
      created: Date.now()
    });
  }

  save();

  if (mode === "business") {
    show("business");
  } else {
    show("personal");
  }
}

/* ================= PERSONAL ================= */

function renderPersonal() {
  const list = $("personalList");
  if (!list) return;

  const q =
    val("personalSearch").toLowerCase();

  let people = khataData("personal");

  if (q) {
    people = people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.phone || "").includes(q)
    );
  }

  const g = people.reduce(
    (a, x) => a + x.give,
    0
  );

  const r = people.reduce(
    (a, x) => a + x.receive,
    0
  );

  if ($("ledgerGiven"))
    $("ledgerGiven").textContent = money(g);

  if ($("ledgerReceived"))
    $("ledgerReceived").textContent = money(r);

  if ($("ledgerNet"))
    $("ledgerNet").textContent = money(g - r);

  list.innerHTML = people.length
    ? people.map(personCard).join("")
    : `<div class="card">No entries yet.</div>`;
}

function personCard(p) {
  const balance =
    p.give - p.receive;

  return `
    <div class="card" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <div>
          <b>${esc(p.name)}</b>
          ${
            p.phone
              ? `<div class="muted">${esc(p.phone)}</div>`
              : ""
          }
        </div>

        <b>${money(balance)}</b>
      </div>

      <div class="muted" style="margin-top:6px;">
        Given: ${money(p.give)}
        &nbsp; • &nbsp;
        Received: ${money(p.receive)}
      </div>

      <div style="display:flex;gap:6px;margin-top:10px;">
        <button onclick="
          openKhataDetail(
            '${esc(p.name)}',
            'personal',
            '${esc(p.phone || "")}'
          )
        ">Khata</button>

        <button onclick="
          openKhataForm(
            'personal',
            '${esc(p.name)}',
            '${esc(p.phone || "")}'
          )
        ">+ Entry</button>
      </div>
    </div>
  `;
}

function setPersonalFilter(filter) {
  D.filter = filter || "all";
  renderPersonal();
}

/* ================= KHATA DETAIL ================= */

function openKhataDetail(
  person,
  mode = "personal",
  phone = ""
) {
  D.detailPerson = person;
  D.detailPhone = phone;
  D.detailMode = mode;
  D.detailFilter = "all";

  if (
    mode === "business" &&
    !D.businessEntryRole
  ) {
    D.businessEntryRole =
      D.businessFilter || "customer";
  }

  show("khataDetail");
  renderKhataDetail();
}

function renderKhataDetail() {
  const person = D.detailPerson;
  const mode = D.detailMode || "personal";
  const phone = D.detailPhone || "";

  let rows = D.khata.filter(x =>
    (x.mode || "personal") === mode &&
    String(x.person || "").trim().toLowerCase() ===
      String(person || "").trim().toLowerCase()
  );

  if (mode === "business") {
    const role =
      D.businessEntryRole ||
      D.businessFilter ||
      "customer";

    rows = rows.filter(x =>
      (x.role || "customer") === role
    );
  }

  if (D.detailFilter === "given") {
    rows = rows.filter(x =>
      x.type === "given"
    );
  }

  if (D.detailFilter === "received") {
    rows = rows.filter(x =>
      x.type === "received"
    );
  }

  const give = rows
    .filter(x => x.type === "given")
    .reduce(
      (a, x) => a + Number(x.amount || 0),
      0
    );

  const receive = rows
    .filter(x => x.type === "received")
    .reduce(
      (a, x) => a + Number(x.amount || 0),
      0
    );

  if ($("detailPersonName"))
    $("detailPersonName").textContent =
      person || "Khata";

  if ($("detailGive"))
    $("detailGive").textContent =
      money(give);

  if ($("detailReceive"))
    $("detailReceive").textContent =
      money(receive);

  if ($("detailBalance"))
    $("detailBalance").textContent =
      money(give - receive);

  const list = $("khataHistory");
  if (!list) return;

  list.innerHTML = rows.length
    ? rows
        .slice()
        .sort(
          (a, b) =>
            Number(b.created || 0) -
            Number(a.created || 0)
        )
        .map(khataEntryCard)
        .join("")
    : `<div class="card">No transaction history.</div>`;
}

function setDetailFilter(filter) {
  D.detailFilter = filter || "all";
  renderKhataDetail();
}

function khataEntryCard(x) {
  return `
    <div class="card" style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;">
        <b>
          ${
            x.type === "given"
              ? "Given"
              : "Received"
          }
        </b>

        <b>${money(x.amount)}</b>
      </div>

      <div class="muted">
        ${esc(x.date || "")}
        ${x.method ? " • " + esc(x.method) : ""}
        ${x.status ? " • " + esc(x.status) : ""}
      </div>

      ${
        x.note
          ? `<div style="margin-top:5px;">${esc(x.note)}</div>`
          : ""
      }

      <div style="display:flex;gap:6px;margin-top:8px;">
        <button onclick="editKhata('${x.id}')">
          Edit
        </button>

        <button onclick="deleteKhata('${x.id}')">
          Delete
        </button>

        <button onclick="settleKhata('${x.id}')">
          Settle
        </button>
      </div>
    </div>
  `;
}

function editKhata(id) {
  const x = D.khata.find(
    r => r.id === id
  );

  if (!x) return;

  editKhataId = id;
  D.detailMode =
    x.mode || "personal";
  D.detailPhone =
    x.phone || "";
  D.businessEntryRole =
    x.role || "customer";

  show("khataEntry");

  setTimeout(() => {
    if ($("khataPerson"))
      $("khataPerson").value =
        x.person || "";

    if ($("khataPhone"))
      $("khataPhone").value =
        x.phone || "";

    if ($("khataType"))
      $("khataType").value =
        x.type || "given";

    if ($("khataAmount"))
      $("khataAmount").value =
        x.amount || "";

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
  if (!confirm("Delete this entry?"))
    return;

  D.khata =
    D.khata.filter(x => x.id !== id);

  save();
  renderKhataDetail();
  renderPersonal();
  renderBusiness();
  renderHome();
}

function settleKhata(id) {
  const x = D.khata.find(
    r => r.id === id
  );

  if (!x) return;

  x.status = "paid";

  save();
  renderKhataDetail();
  renderPersonal();
  renderBusiness();
  renderHome();
}

/* ================= BUSINESS CUSTOMER / SUPPLIER ================= */

function addBusinessCustomer() {
  openBusinessCustomerForm(
    "",
    "",
    "customer"
  );
}

function addBusinessSupplier() {
  openBusinessCustomerForm(
    "",
    "",
    "supplier"
  );
}

function openBusinessCustomerForm(
  name = "",
  phone = "",
  role = "customer"
) {
  const old = $("businessCustomerModal");
  if (old) old.remove();

  const modal =
    document.createElement("div");

  modal.id =
    "businessCustomerModal";

  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:9999;
    background:rgba(0,0,0,.45);
    display:flex;
    align-items:flex-end;
    justify-content:center;
  `;

  modal.innerHTML = `
    <div style="
      background:#fff;
      width:100%;
      max-width:520px;
      border-radius:20px 20px 0 0;
      padding:18px;
      box-sizing:border-box;
    ">
      <h3>
        ${
          role === "supplier"
            ? "Add Supplier"
            : "Add Customer"
        }
      </h3>

      <input
        id="businessPersonName"
        placeholder="Name"
        value="${esc(name)}"
        style="width:100%;padding:12px;margin-top:10px;"
      >

      <input
        id="businessPersonPhone"
        placeholder="Mobile Number"
        inputmode="tel"
        value="${esc(phone)}"
        style="width:100%;padding:12px;margin-top:8px;"
      >

      <button
        onclick="selectContactOptional()"
        style="width:100%;margin-top:10px;"
      >
        📱 Select Contact
      </button>

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button
          onclick="saveBusinessCustomer('${role}')"
          style="flex:1;"
        >
          Save
        </button>

        <button
          onclick="document.getElementById('businessCustomerModal')?.remove()"
          style="flex:1;"
        >
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function selectContactOptional() {
  if (
    navigator.contacts &&
    typeof navigator.contacts.select === "function"
  ) {
    try {
      const contacts =
        await navigator.contacts.select(
          ["name", "tel"],
          { multiple: false }
        );

      const c = contacts?.[0];

      if (c) {
        const name =
          Array.isArray(c.name)
            ? c.name[0]
            : c.name || "";

        const tel =
          Array.isArray(c.tel)
            ? c.tel[0]
            : c.tel || "";

        if ($("businessPersonName"))
          $("businessPersonName").value =
            name;

        if ($("businessPersonPhone"))
          $("businessPersonPhone").value =
            tel;
      }

      return;
    } catch (e) {
      console.error(e);
    }
  }

  alert(
    "Contact picker is not available on this device. Enter name and mobile number manually."
  );
}

function saveBusinessCustomer(role = "customer") {
  const name =
    $("businessPersonName")?.value?.trim() ||
    "";

  const phone =
    $("businessPersonPhone")?.value?.trim() ||
    "";

  if (!name) {
    alert("Enter name");
    return;
  }

  const exists =
    D.business.some(x =>
      String(x.name || "").trim().toLowerCase() ===
        name.toLowerCase() &&
      (x.role || "customer") === role &&
      (!phone || x.phone === phone)
    );

  if (exists) {
    alert(
      role === "supplier"
        ? "Supplier already exists"
        : "Customer already exists"
    );
    return;
  }

  D.business.push({
    id: uid(),
    name,
    person: name,
    phone,
    role,
    type: role,
    created: Date.now()
  });

  save();

  $("businessCustomerModal")?.remove();

  D.businessFilter = role;
  renderBusiness();
}

function getBusinessPeople(role) {
  const map = {};

  D.business
    .filter(x =>
      (x.role || "customer") === role
    )
    .forEach(x => {
      const name =
        String(x.name || x.person || "").trim();

      if (!name) return;

      const phone = x.phone || "";
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

      const phone = x.phone || "";
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

/* ================= BUSINESS ================= */

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
      (a, x) => a + x.give,
      0
    );

  const received =
    people.reduce(
      (a, x) => a + x.receive,
      0
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
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button
        onclick="setBusinessFilter('customer')"
        style="
          flex:1;
          background:${
            role === "customer"
              ? "#0b5ed7"
              : ""
          };
          color:${
            role === "customer"
              ? "#fff"
              : ""
          };
        "
      >
        Customers
      </button>

      <button
        onclick="setBusinessFilter('supplier')"
        style="
          flex:1;
          background:${
            role === "supplier"
              ? "#0b5ed7"
              : ""
          };
          color:${
            role === "supplier"
              ? "#fff"
              : ""
          };
        "
      >
        Suppliers
      </button>
    </div>

    ${
      people.length
        ? people.map(
            businessPersonCard
          ).join("")
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
  const balance =
    p.give - p.receive;

  const role =
    p.role || D.businessFilter || "customer";

  return `
    <div class="card" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <div>
          <b>${esc(p.name)}</b>

          ${
            p.phone
              ? `<div class="muted">${esc(p.phone)}</div>`
              : ""
          }
        </div>

        <b>${money(balance)}</b>
      </div>

      <div class="muted" style="margin-top:6px;">
        Given: ${money(p.give)}
        &nbsp; • &nbsp;
        Received: ${money(p.receive)}
      </div>

      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;">
        <button onclick="
          openKhataDetail(
            '${esc(p.name)}',
            'business',
            '${esc(p.phone || "")}'
          );
          D.businessEntryRole='${role}';
        ">
          Khata
        </button>

        <button onclick="
          D.businessEntryRole='${role}';
          openKhataForm(
            'business',
            '${esc(p.name)}',
            '${esc(p.phone || "")}'
          );
        ">
          + Entry
        </button>

        <button onclick="
          businessStatement(
            '${esc(p.name)}',
            '${role}'
          )
        ">
          Statement
        </button>

        <button onclick="
          businessWhatsApp(
            '${esc(p.name)}',
            '${esc(p.phone || "")}',
            '${role}'
          )
        ">
          WhatsApp
        </button>
      </div>
    </div>
  `;
}

/* ================= BUSINESS ENTRY ================= */

function openBusinessEntry(
  role = "customer",
  person = "",
  phone = ""
) {
  D.businessEntryRole = role;

  openKhataForm(
    "business",
    person,
    phone
  );
}

/* ================= BUSINESS SALES / PURCHASE ================= */

function renderBusinessSales() {
  const box =
    $("businessSalesList");

  if (!box) return;

  const rows =
    D.business.filter(x =>
      x.recordType === "sale" ||
      x.recordType === "purchase"
    );

  box.innerHTML =
    rows.length
      ? rows.map(x => `
        <div class="card">
          <b>${esc(x.recordType)}</b>
          <div>${money(x.amount)}</div>
          <div class="muted">
            ${esc(x.person || "")}
            • ${esc(x.date || "")}
          </div>

          <button onclick="
            deleteBusinessRecord('${x.id}')
          ">
            Delete
          </button>
        </div>
      `).join("")
      : `<div class="card">
          No records yet.
        </div>`;
}

function addBusinessRecord(
  recordType = "sale"
) {
  const person =
    prompt(
      recordType === "purchase"
        ? "Supplier"
        : "Customer"
    ) || "";

  const amount =
    Number(
      prompt("Amount") || 0
    );

  if (!person || !amount) return;

  D.business.push({
    id: uid(),
    recordType,
    person,
    amount,
    date: today(),
    created: Date.now()
  });

  save();
  renderBusinessSales();
}

function deleteBusinessRecord(id) {
  if (!confirm("Delete record?"))
    return;

  D.business =
    D.business.filter(
      x => x.id !== id
    );

  save();
  renderBusinessSales();
}

/* ================= BUSINESS STATEMENT ================= */

function businessStatement(
  person,
  role = "customer"
) {
  const rows =
    D.khata.filter(x =>
      (x.mode || "personal") === "business" &&
      (x.role || "customer") === role &&
      String(x.person || "").trim().toLowerCase() ===
        String(person || "").trim().toLowerCase()
    );

  if (!rows.length) {
    alert("No transactions found.");
    return;
  }

  const text =
    `HISAB - ${role === "supplier" ? "Supplier" : "Customer"} Statement\n\n` +
    `Name: ${person}\n` +
    `Mobile: ${rows[0].phone || ""}\n\n` +
    rows.map(x =>
      `${x.date || ""} | ${
        x.type === "given"
          ? "Given"
          : "Received"
      } | ${money(x.amount)}${
        x.note
          ? " | " + x.note
          : ""
      }`
    ).join("\n");

  if (navigator.share) {
    navigator.share({
      title: "HISAB Statement",
      text
    }).catch(() => {});
  } else {
    alert(text);
  }
}

function businessWhatsApp(
  person,
  phone,
  role = "customer"
) {
  const clean =
    String(phone || "")
      .replace(/\D/g, "");

  if (!clean) {
    alert("Mobile number not available.");
    return;
  }

  const rows =
    D.khata.filter(x =>
      (x.mode || "personal") === "business" &&
      (x.role || "customer") === role &&
      String(x.person || "").trim().toLowerCase() ===
        String(person || "").trim().toLowerCase()
    );

  const given =
    rows
      .filter(x => x.type === "given")
      .reduce(
        (a, x) => a + Number(x.amount || 0),
        0
      );

  const received =
    rows
      .filter(x => x.type === "received")
      .reduce(
        (a, x) => a + Number(x.amount || 0),
        0
      );

  const balance =
    given - received;

  const message =
    `HISAB Statement\n` +
    `Name: ${person}\n` +
    `Given: ${money(given)}\n` +
    `Received: ${money(received)}\n` +
    `Balance: ${money(balance)}`;

  const url =
    "https://wa.me/" +
    clean +
    "?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank");
}

/* ================= PAYMENT ================= */

function openPaymentEntry() {
  const role =
    D.detailMode === "business"
      ? (
          D.businessEntryRole ||
          D.businessFilter ||
          "customer"
        )
      : "customer";

  openKhataForm(
    D.detailMode || "personal",
    D.detailPerson || "",
    D.detailPhone || ""
  );

  if (D.detailMode === "business") {
    D.businessEntryRole = role;
  }
}

/* ================= TRANSACTIONS ================= */

function totalIncome() {
  return D.transactions
    .filter(x =>
      x.type === "income" &&
      (!x.mode || x.mode === D.mode)
    )
    .reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );
}

function totalExpense() {
  return D.transactions
    .filter(x =>
      x.type === "expense" &&
      (!x.mode || x.mode === D.mode)
    )
    .reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );
}

function addTransaction(type = "") {
  const finalType =
    type ||
    val("transactionType") ||
    "expense";

  let amount =
    num("transactionAmount");

  if (!amount) {
    amount = Number(
      prompt(
        finalType === "income"
          ? "Income amount"
          : "Expense amount"
      ) || 0
    );
  }

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  let note =
    val("transactionNote");

  if (!note) {
    note =
      prompt("Note") || "";
  }

  const category =
    val("transactionCategory") ||
    "General";

  const date =
    val("transactionDate") ||
    today();

  D.transactions.push({
    id: uid(),
    mode: D.mode,
    type: finalType,
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

  show("transactions");
}

function openIncome() {
  show("transactions");

  setTimeout(() => {
    if ($("transactionType"))
      $("transactionType").value =
        "income";

    if (
      $("transactionDate") &&
      !$("transactionDate").value
    ) {
      $("transactionDate").value =
        today();
    }
  }, 30);
}

function openExpense() {
  show("transactions");

  setTimeout(() => {
    if ($("transactionType"))
      $("transactionType").value =
        "expense";

    if (
      $("transactionDate") &&
      !$("transactionDate").value
    ) {
      $("transactionDate").value =
        today();
    }
  }, 30);
}

function renderTransactions() {
  const list =
    $("transactionList");

  if (!list) return;

  const rows =
    D.transactions
      .filter(x =>
        !x.mode ||
        x.mode === D.mode
      )
      .slice()
      .sort(
        (a, b) =>
          Number(b.created || 0) -
          Number(a.created || 0)
      );

  list.innerHTML =
    rows.length
      ? rows.map(x => `
        <div class="card" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;">
            <b>
              ${
                x.type === "income"
                  ? "Income"
                  : "Expense"
              }
            </b>

            <b>${money(x.amount)}</b>
          </div>

          <div class="muted">
            ${esc(x.category || "General")}
            • ${esc(x.date || "")}
          </div>

          ${
            x.note
              ? `<div style="margin-top:5px;">
                  ${esc(x.note)}
                </div>`
              : ""
          }

          <button
            onclick="deleteTransaction('${x.id}')"
            style="margin-top:7px;"
          >
            Delete
          </button>
        </div>
      `).join("")
      : `<div class="card">
          No transactions yet.
        </div>`;
}

function deleteTransaction(id) {
  if (!confirm("Delete transaction?"))
    return;

  D.transactions =
    D.transactions.filter(
      x => x.id !== id
    );

  save();
  renderTransactions();
}

/* ================= PLANNING ================= */

function renderPlanning() {
  const box = $("planningList");
  if (!box) return;

  box.innerHTML = `
    <div class="card">
      <b>Budget</b>
      <div style="font-size:22px;margin-top:5px;">
        ${money(D.budget)}
      </div>

      <button onclick="setBudget()">
        Set Budget
      </button>
    </div>

    <div class="card">
      <b>Goals & Savings</b>
      <button onclick="addGoal()">
        + Add Goal
      </button>

      <div style="margin-top:8px;">
        ${
          D.goals.length
            ? D.goals.map(
                (g, i) => `
                  <div style="padding:7px 0;">
                    ${esc(g.name)}
                    -
                    ${money(g.amount)}
                    <button onclick="deleteGoal(${i})">
                      Delete
                    </button>
                  </div>
                `
              ).join("")
            : "No goals yet."
        }
      </div>
    </div>
  `;
}

function setBudget() {
  const amount =
    Number(
      prompt("Monthly budget", D.budget || 0) ||
      0
    );

  if (amount < 0) return;

  D.budget = amount;
  save();
  renderPlanning();
}

function addGoal() {
  const name =
    prompt("Goal name") || "";

  if (!name) return;

  const amount =
    Number(
      prompt("Goal amount") || 0
    );

  if (!amount) return;

  D.goals.push({
    id: uid(),
    name,
    amount,
    created: Date.now()
  });

  save();
  renderPlanning();
}

function deleteGoal(i) {
  D.goals.splice(i, 1);
  save();
  renderPlanning();
}

/* ================= PAYMENTS ================= */

function renderPayments() {
  const box = $("creditList");
  if (!box) return;

  box.innerHTML = `
    <div class="card">
      <b>Bills & Reminders</b>
      <button onclick="addBill()">
        + Add Bill
      </button>

      ${
        D.bills.length
          ? D.bills.map(
              (b, i) => `
                <div style="margin-top:8px;">
                  ${esc(b.name)}
                  - ${money(b.amount)}
                  - ${esc(b.date)}
                  <button onclick="deleteBill(${i})">
                    Delete
                  </button>
                </div>
              `
            ).join("")
          : `<div class="muted">No bills.</div>`
      }
    </div>

    <div class="card">
      <b>Loans & EMI</b>
      <button onclick="addLoan()">
        + Add Loan
      </button>

      ${
        D.loans.length
          ? D.loans.map(
              (l, i) => `
                <div style="margin-top:8px;">
                  ${esc(l.name)}
                  - ${money(l.amount)}
                  <button onclick="deleteLoan(${i})">
                    Delete
                  </button>
                </div>
              `
            ).join("")
          : `<div class="muted">No loans.</div>`
      }
    </div>

    <div class="card">
      <b>EMI Calculator</b>

      <input id="emiPrincipal"
        type="number"
        placeholder="Principal">

      <input id="emiRate"
        type="number"
        placeholder="Annual interest %">

      <input id="emiMonths"
        type="number"
        placeholder="Months">

      <button onclick="calcEMI()">
        Calculate EMI
      </button>

      <div id="emiResult"></div>
    </div>
  `;
}

function addBill() {
  const name =
    prompt("Bill name") || "";

  if (!name) return;

  const amount =
    Number(
      prompt("Amount") || 0
    );

  if (!amount) return;

  const date =
    prompt(
      "Due date",
      today()
    ) || today();

  D.bills.push({
    id: uid(),
    name,
    amount,
    date,
    created: Date.now()
  });

  save();
  renderPayments();
}

function deleteBill(i) {
  D.bills.splice(i, 1);
  save();
  renderPayments();
}

function addLoan() {
  const name =
    prompt("Loan name") || "";

  if (!name) return;

  const amount =
    Number(
      prompt("Loan amount") || 0
    );

  if (!amount) return;

  D.loans.push({
    id: uid(),
    name,
    amount,
    created: Date.now()
  });

  save();
  renderPayments();
}

function deleteLoan(i) {
  D.loans.splice(i, 1);
  save();
  renderPayments();
}

function calcEMI() {
  const p =
    Number(
      $("emiPrincipal")?.value || 0
    );

  const annual =
    Number(
      $("emiRate")?.value || 0
    );

  const n =
    Number(
      $("emiMonths")?.value || 0
    );

  if (!p || !n) {
    alert("Enter principal and months");
    return;
  }

  const r =
    annual / 12 / 100;

  let emi;

  if (!r) {
    emi = p / n;
  } else {
    emi =
      p *
      r *
      Math.pow(1 + r, n) /
      (Math.pow(1 + r, n) - 1);
  }

  const result =
    $("emiResult");

  if (result) {
    result.innerHTML = `
      <div style="margin-top:10px;">
        Monthly EMI:
        <b>${money(emi)}</b>
      </div>
    `;
  }
}

/* ================= REPORTS ================= */

function showReports() {
  const box = $("reportContent");
  if (!box) return;

  const income =
    totalIncome();

  const expense =
    totalExpense();

  const balance =
    income - expense;

  box.innerHTML = `
    <div class="card">
      <b>Income</b>
      <div>${money(income)}</div>
    </div>

    <div class="card">
      <b>Expense</b>
      <div>${money(expense)}</div>
    </div>

    <div class="card">
      <b>Balance</b>
      <div>${money(balance)}</div>
    </div>

    <button onclick="exportSummaryPDF()">
      Export PDF
    </button>
  `;
}

/* ================= PDF ================= */

function makeSimplePDF(lines) {
  const clean =
    lines.map(x =>
      String(x)
        .replace(/[^\x20-\x7E]/g, "")
    );

  const body =
    clean.map(
      (line, i) =>
        `BT /F1 11 Tf 40 ${760 - i * 16} Td (${line.replace(/[()\\]/g, "\\$&")}) Tj ET`
    ).join("\n");

  const objects = [];

  objects.push(
    "<< /Type /Catalog /Pages 2 0 R >>"
  );

  objects.push(
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
  );

  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"
  );

  objects.push(
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`
  );

  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );

  let pdf =
    "%PDF-1.4\n";

  const offsets = [0];

  objects.forEach((obj, i) => {
    offsets[i + 1] =
      pdf.length;

    pdf +=
      `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xref =
    pdf.length;

  pdf +=
    `xref\n0 ${objects.length + 1}\n`;

  pdf +=
    "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i++) {
    pdf +=
      String(offsets[i]).padStart(10, "0") +
      " 00000 n \n";
  }

  pdf +=
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob(
    [pdf],
    { type: "application/pdf" }
  );
}

async function sharePDF(
  blob,
  filename = "HISAB.pdf"
) {
  const file =
    new File(
      [blob],
      filename,
      { type: "application/pdf" }
    );

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({
      files: [file]
    })
  ) {
    try {
      await navigator.share({
        title: "HISAB",
        text: "HISAB Statement",
        files: [file]
      });

      return true;
    } catch (e) {
      console.error(e);
    }
  }

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );

  return false;
}

function exportSummaryPDF() {
  const lines = [
    "HISAB - Money Manager",
    "",
    `Mode: ${D.mode}`,
    `Income: ${money(totalIncome())}`,
    `Expense: ${money(totalExpense())}`,
    `Balance: ${money(
      totalIncome() -
      totalExpense()
    )}`,
    "",
    `Date: ${today()}`
  ];

  const blob =
    makeSimplePDF(lines);

  sharePDF(
    blob,
    "HISAB-Summary.pdf"
  );
}

function exportKhataPDF() {
  const person =
    D.detailPerson || "Khata";

  const mode =
    D.detailMode || "personal";

  let rows =
    D.khata.filter(x =>
      (x.mode || "personal") === mode &&
      String(x.person || "").trim().toLowerCase() ===
        String(person || "").trim().toLowerCase()
    );

  if (mode === "business") {
    const role =
      D.businessEntryRole ||
      D.businessFilter ||
      "customer";

    rows = rows.filter(x =>
      (x.role || "customer") === role
    );
  }

  const lines = [
    "HISAB KHATA",
    "",
    `Name: ${person}`,
    `Mobile: ${D.detailPhone || ""}`,
    ""
  ];

  rows.forEach(x => {
    lines.push(
      `${x.date || ""}  ${
        x.type === "given"
          ? "Given"
          : "Received"
      }  ${money(x.amount)}`
    );

    if (x.note)
      lines.push(
        "Note: " + x.note
      );
  });

  const blob =
    makeSimplePDF(lines);

  sharePDF(
    blob,
    "HISAB-Khata.pdf"
  );
}

function shareKhata() {
  const person =
    D.detailPerson || "Khata";

  const rows =
    D.khata.filter(x =>
      (x.mode || "personal") ===
        (D.detailMode || "personal") &&
      String(x.person || "").trim().toLowerCase() ===
        String(person || "").trim().toLowerCase()
    );

  const text =
    `HISAB Khata\n\n` +
    `Name: ${person}\n` +
    rows.map(x =>
      `${x.date || ""} ${
        x.type === "given"
          ? "Given"
          : "Received"
      }: ${money(x.amount)}`
    ).join("\n");

  if (navigator.share) {
    navigator.share({
      title: "HISAB Khata",
      text
    }).catch(() => {});
  } else {
    alert(text);
  }
}

/* ================= REMINDERS ================= */

function renderReminders() {
  const box =
    $("reminderList");

  if (!box) return;

  box.innerHTML =
    D.reminders.length
      ? D.reminders.map(
          (r, i) => `
            <div class="card">
              <b>${esc(r.title)}</b>
              <div>${esc(r.date || "")}</div>
              <button onclick="deleteReminder(${i})">
                Delete
              </button>
            </div>
          `
        ).join("")
      : `<div class="card">
          No reminders.
        </div>`;
}

function addReminder() {
  const title =
    prompt("Reminder") || "";

  if (!title) return;

  const date =
    prompt(
      "Date",
      today()
    ) || today();

  D.reminders.push({
    id: uid(),
    title,
    date,
    created: Date.now()
  });

  save();
  renderReminders();
}

function deleteReminder(i) {
  D.reminders.splice(i, 1);
  save();
  renderReminders();
}

/* ================= SECURITY ================= */

function renderPrivacy() {
  const box =
    $("privacyContent");

  if (!box) return;

  box.innerHTML = `
    <div class="card">
      <b>Security</b>

      <button onclick="setPIN()">
        ${D.pin ? "Change PIN" : "Set PIN"}
      </button>

      ${
        D.pin
          ? `
            <button onclick="removePIN()">
              Remove PIN
            </button>
          `
          : ""
      }
    </div>
  `;
}

function setPIN() {
  const pin =
    prompt("Set 4 digit PIN") || "";

  if (!/^\d{4}$/.test(pin)) {
    alert("Enter exactly 4 digits");
    return;
  }

  D.pin = pin;
  save();
  renderPrivacy();
}

function removePIN() {
  D.pin = "";
  save();
  renderPrivacy();
}

/* ================= BACKUP ================= */

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
    "HISAB-backup.json";

  a.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

function restoreData() {
  const input =
    document.createElement("input");

  input.type = "file";
  input.accept =
    "application/json";

  input.onchange = e => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const data =
          JSON.parse(
            reader.result
          );

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "Invalid backup"
          );
        }

        D = {
          ...D,
          ...data
        };

        save();

        alert(
          "Backup restored successfully."
        );

        location.reload();
      } catch (err) {
        alert(
          "Invalid backup file."
        );
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

/* ================= FAMILY ================= */

function renderFamily() {
  const box =
    $("familyList");

  if (!box) return;

  box.innerHTML =
    D.family.length
      ? D.family.map(
          (x, i) => `
            <div class="card">
              <b>${esc(x.name)}</b>
              <div>${esc(x.phone || "")}</div>
              <button onclick="deleteFamily(${i})">
                Delete
              </button>
            </div>
          `
        ).join("")
      : `<div class="card">
          No family members.
        </div>`;
}

function addFamily() {
  const name =
    prompt("Name") || "";

  if (!name) return;

  const phone =
    prompt("Mobile number") || "";

  D.family.push({
    id: uid(),
    name,
    phone,
    created: Date.now()
  });

  save();
  renderFamily();
}

function deleteFamily(i) {
  D.family.splice(i, 1);
  save();
  renderFamily();
}

function renderFamilyTools() {
  const box =
    $("familyToolsContent");

  if (!box) return;

  box.innerHTML = `
    <div class="card">
      Family tools are ready.
    </div>
  `;
}

/* ================= TOOLS ================= */

function renderTools() {
  const box =
    $("toolsContent");

  if (!box) return;

  box.innerHTML = `
    <div class="card">
      <b>Tools</b>

      <button onclick="backupData()">
        Backup
      </button>

      <button onclick="restoreData()">
        Restore
      </button>
    </div>
  `;
}

/* ================= SETTINGS ================= */

function renderSettings() {
  const box =
    $("settingsContent");

  if (!box) return;

  box.innerHTML = `
    <div class="card">
      <b>Currency</b>

      <select
        onchange="changeCurrency(this.value)"
      >
        <option value="₹"
          ${D.currency === "₹" ? "selected" : ""}>
          ₹ INR
        </option>

        <option value="$"
          ${D.currency === "$" ? "selected" : ""}>
          $ USD
        </option>

        <option value="€"
          ${D.currency === "€" ? "selected" : ""}>
          € EUR
        </option>

        <option value="£"
          ${D.currency === "£" ? "selected" : ""}>
          £ GBP
        </option>
      </select>
    </div>

    <div class="card">
      <button onclick="backupData()">
        Backup Data
      </button>

      <button onclick="restoreData()">
        Restore Data
      </button>

      <button onclick="clearAllData()">
        Clear All Data
      </button>
    </div>
  `;
}

function changeCurrency(currency) {
  D.currency =
    currency || "₹";

  save();

  renderHome();
  renderPersonal();
  renderBusiness();
  renderTransactions();
  renderPlanning();
  renderPayments();
  showReports();
}

function clearAllData() {
  if (
    !confirm(
      "Delete all HISAB data?"
    )
  ) {
    return;
  }

  localStorage.removeItem(KEY);

  location.reload();
}

/* ================= SEARCH ================= */

function searchBusiness() {
  renderBusiness();
}

function searchPersonal() {
  renderPersonal();
}

/* ================= TOPBAR ================= */

function toggleLanguage() {
  D.language =
    D.language === "en"
      ? "hi"
      : "en";

  save();

  alert(
    D.language === "hi"
      ? "Hindi mode selected."
      : "English mode selected."
  );
}

function showReminders() {
  show("reminders");
}

function showSettings() {
  show("final");
}

/* ================= ADS ================= */

function showAd() {
  try {
    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.AdMob
    ) {
      console.log(
        "AdMob available"
      );
    }
  } catch (e) {
    console.error(e);
  }
}

/* ================= STARTUP ================= */

load();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    fixHomeButtons();

    if ($("transactionDate") &&
        !$("transactionDate").value) {
      $("transactionDate").value =
        today();
    }
  }
);

window.addEventListener(
  "load",
  () => {
    fixHomeButtons();
  }
);
