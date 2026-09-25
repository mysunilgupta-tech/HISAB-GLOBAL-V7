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
  }[m]));
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
  document
    .querySelectorAll(".page")
    .forEach(p => {
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
  const visible = document.querySelector(
    ".page[style*='display: block']"
  );

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
  D.businessFilter =
    mode === "business"
      ? (D.businessFilter || "customer")
      : D.businessFilter;

  save();

  renderHome();

  show(
    mode === "business"
      ? "business"
      : "home"
  );
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
      title.insertAdjacentElement(
        "afterend",
        box
      );
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
        background:${
          D.mode === "personal"
            ? "#0b5ed7"
            : "transparent"
        };
        color:${
          D.mode === "personal"
            ? "#fff"
            : "#0b1f33"
        };
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
        background:${
          D.mode === "business"
            ? "#0b5ed7"
            : "transparent"
        };
        color:${
          D.mode === "business"
            ? "#fff"
            : "#0b1f33"
        };
      ">
      💼 Business
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

  const income = totalIncome();
  const expense = totalExpense();

  if ($("receivable"))
    $("receivable").textContent =
      money(totalGive(D.mode));

  if ($("payable"))
    $("payable").textContent =
      money(totalReceive(D.mode));

  if ($("homeBalance"))
    $("homeBalance").textContent =
      money(income - expense);
}

/* ================= INCOME / EXPENSE ================= */

function addTransaction(type = "expense") {
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
    val("transactionCategory") ||
    "General";

  const date =
    val("transactionDate") ||
    today();

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

  show("transactions");
}

function openIncome() {
  show("transactions");

  setTimeout(() => {
    if ($("transactionType"))
      $("transactionType").value = "income";

    if ($("transactionDate") &&
        !$("transactionDate").value) {
      $("transactionDate").value =
        today();
    }
  }, 30);
}

function openExpense() {
  show("transactions");

  setTimeout(() => {
    if ($("transactionType"))
      $("transactionType").value = "expense";

    if ($("transactionDate") &&
        !$("transactionDate").value) {
      $("transactionDate").value =
        today();
    }
  }, 30);
}

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

function renderTransactions() {
  const box = $("transactions");
  if (!box) return;

  const rows = D.transactions
    .filter(x =>
      !x.mode || x.mode === D.mode
    )
    .slice()
    .sort(
      (a, b) =>
        Number(b.created || 0) -
        Number(a.created || 0)
    );

  box.innerHTML = `
    <div class="card"
      style="padding:14px">

      <h3>
        ${
          D.mode === "business"
            ? "Business Transactions"
            : "Personal Transactions"
        }
      </h3>

      <div
        style="
          display:flex;
          gap:8px;
          margin:10px 0">

        <button
          onclick="addTransaction('income')">
          + Income
        </button>

        <button
          onclick="addTransaction('expense')">
          + Expense
        </button>
      </div>

      ${
        rows.length
          ? rows.map(x => `
              <div
                class="card"
                style="
                  padding:11px;
                  margin:7px 0">

                <div
                  style="
                    display:flex;
                    justify-content:space-between">

                  <b style="
                    color:${
                      x.type === "income"
                        ? "#198754"
                        : "#dc3545"
                    }">
                    ${
                      x.type === "income"
                        ? "Income"
                        : "Expense"
                    }
                  </b>

                  <strong>
                    ${money(x.amount)}
                  </strong>
                </div>

                <div>
                  ${esc(
                    x.category ||
                    "General"
                  )}
                </div>

                <small>
                  ${esc(x.date || "")}
                </small>

                ${
                  x.note
                    ? `<div>
                        ${esc(x.note)}
                       </div>`
                    : ""
                }

                <button
                  onclick="
                    deleteTransaction(
                      '${x.id}'
                    )
                  ">
                  Delete
                </button>
              </div>
            `).join("")
          : `
            <div style="
              padding:20px;
              text-align:center">
              No transactions yet.
            </div>
          `
      }
    </div>
  `;
}

function deleteTransaction(id) {
  D.transactions =
    D.transactions.filter(
      x => x.id !== id
    );

  save();
  renderTransactions();
}

/* ================= KHATA CORE ================= */

function khataData(mode = D.mode) {
  return D.khata.filter(
    x => x.mode === mode
  );
}

function totalGive(
  mode = D.mode,
  person = ""
) {
  return khataData(mode)
    .filter(x =>
      x.type === "give" &&
      (!person ||
       x.person === person)
    )
    .reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );
}

function totalReceive(
  mode = D.mode,
  person = ""
) {
  return khataData(mode)
    .filter(x =>
      x.type === "receive" &&
      (!person ||
       x.person === person)
    )
    .reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );
}

function personRows(
  mode = "personal",
  search = ""
) {
  const map = {};

  khataData(mode).forEach(x => {
    const name =
      String(x.person || "Unknown")
        .trim();

    if (
      search &&
      !name.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    ) return;

    if (!map[name]) {
      map[name] = {
        name,
        phone: x.phone || "",
        give: 0,
        receive: 0,
        pending: 0
      };
    }

    if (
      x.phone &&
      !map[name].phone
    ) {
      map[name].phone = x.phone;
    }

    if (x.type === "give")
      map[name].give +=
        Number(x.amount || 0);

    if (x.type === "receive")
      map[name].receive +=
        Number(x.amount || 0);

    if (x.status !== "settled")
      map[name].pending +=
        Number(x.amount || 0);
  });

  return Object.values(map);
}

/* ================= KHATA ENTRY ================= */

function openKhataForm(
  mode = "personal",
  person = "",
  phone = ""
) {
  D.detailMode = mode;
  D.detailPerson = person;
  D.detailPhone = phone;

  editKhataId = null;

  show("khataEntry");

  if ($("khataPerson"))
    $("khataPerson").value =
      person;

  if ($("khataPhone"))
    $("khataPhone").value =
      phone;

  if ($("khataDate"))
    $("khataDate").value =
      today();

  if ($("khataType"))
    $("khataType").value =
      "give";

  if ($("khataAmount"))
    $("khataAmount").value = "";

  if ($("khataMethod"))
    $("khataMethod").value =
      "Cash";

  if ($("khataStatus"))
    $("khataStatus").value =
      "pending";

  if ($("khataNote"))
    $("khataNote").value = "";

  const form = $("khataEntry");

  if (
    form &&
    !form.querySelector("#khataPhone")
  ) {
    const input =
      document.createElement("input");

    input.id = "khataPhone";
    input.type = "tel";
    input.placeholder =
      "Mobile Number";

    input.style.cssText =
      "width:100%;padding:12px;margin:7px 0;border-radius:10px;border:1px solid #ddd;";

    $("khataPerson")
      ?.insertAdjacentElement(
        "afterend",
        input
      );

    input.value = phone || "";
  }
}

function closeKhataForm() {
  show(
    D.detailMode === "business"
      ? "business"
      : "personal"
  );
}

function saveKhataEntry() {
  const person =
    val("khataPerson");

  const amount =
    num("khataAmount");

  if (!person) {
    alert("Please enter name.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Please enter amount.");
    return;
  }

  const phone =
    val("khataPhone");

  const item = {
    id:
      editKhataId ||
      uid(),

    mode:
      D.detailMode ||
      D.mode,

    person,
    phone,

    type:
      val("khataType") ||
      "give",

    amount,

    date:
      val("khataDate") ||
      today(),

    method:
      val("khataMethod") ||
      "Cash",

    status:
      val("khataStatus") ||
      "pending",

    note:
      val("khataNote"),

    role:
      D.detailMode === "business"
        ? (
            D.businessEntryRole ||
            "customer"
          )
        : "personal",

    created:
      Date.now()
  };

  if (editKhataId) {
    const index =
      D.khata.findIndex(
        x => x.id === editKhataId
      );

    if (index >= 0)
      D.khata[index] = item;
  } else {
    D.khata.push(item);
  }

  editKhataId = null;

  save();

  show(
    item.mode === "business"
      ? "business"
      : "personal"
  );
}

/* ================= PERSONAL ================= */

function renderPersonal() {
  const search =
    val("personalSearch");

  let rows =
    personRows(
      "personal",
      search
    );

  if (D.filter === "given")
    rows =
      rows.filter(
        x => x.give > 0
      );

  if (D.filter === "received")
    rows =
      rows.filter(
        x => x.receive > 0
      );

  if (D.filter === "due")
    rows =
      rows.filter(
        x => x.pending > 0
      );

  if ($("ledgerGiven"))
    $("ledgerGiven").textContent =
      money(totalGive("personal"));

  if ($("ledgerReceived"))
    $("ledgerReceived").textContent =
      money(
        totalReceive("personal")
      );

  if ($("ledgerNet"))
    $("ledgerNet").textContent =
      money(
        totalGive("personal") -
        totalReceive("personal")
      );

  const list =
    $("personalList");

  if (!list) return;

  list.innerHTML =
    rows.length
      ? rows.map(personCard).join("")
      : `
        <div
          class="card"
          style="
            padding:20px;
            text-align:center">
          No Udhaar entries yet.
        </div>
      `;
}

function personCard(p) {
  const balance =
    p.give - p.receive;

  return `
    <div
      class="card"
      style="
        padding:13px;
        margin:8px 0;
        border-radius:14px">

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:8px">

        <div>
          <b>${esc(p.name)}</b>

          ${
            p.phone
              ? `<div style="font-size:12px">
                   ${esc(p.phone)}
                 </div>`
              : ""
          }
        </div>

        <b>
          ${money(Math.abs(balance))}
        </b>
      </div>

      <div
        style="
          font-size:12px;
          margin-top:6px">

        <span style="color:#dc3545">
          Give: ${money(p.give)}
        </span>

        &nbsp; | &nbsp;

        <span style="color:#198754">
          Receive: ${money(p.receive)}
        </span>
      </div>

      <div
        style="
          display:flex;
          gap:6px;
          margin-top:10px">

        <button
          onclick="
            openKhataDetail(
              '${esc(p.name)}',
              'personal',
              '${esc(p.phone)}'
            )
          ">
          Khata
        </button>

        <button
          onclick="
            openKhataForm(
              'personal',
              '${esc(p.name)}',
              '${esc(p.phone)}'
            )
          ">
          + Entry
        </button>

      </div>
    </div>
  `;
}

function filterPersonal(type) {
  D.filter = type;
  renderPersonal();
}

function filterKhata(
  mode,
  type
) {
  D.filter = type;
  renderPersonal();
}

function searchKhata(mode) {
  if (mode === "business")
    renderBusiness();
  else
    renderPersonal();
}

/* ================= KHATA DETAIL ================= */

function openKhataDetail(
  person,
  mode = "personal",
  phone = ""
) {
  D.detailPerson = person;
  D.detailMode = mode;
  D.detailPhone = phone;

  if (
    mode === "business" &&
    !D.businessEntryRole
  ) {
    D.businessEntryRole =
      "customer";
  }

  show("khataDetail");
  renderKhataDetail();
}

function renderKhataDetail() {
  const person =
    D.detailPerson;

  const mode =
    D.detailMode;

  if ($("detailPersonName"))
    $("detailPersonName")
      .textContent = person;

  const give =
    totalGive(mode, person);

  const receive =
    totalReceive(mode, person);

  if ($("detailGive"))
    $("detailGive").textContent =
      money(give);

  if ($("detailReceive"))
    $("detailReceive").textContent =
      money(receive);

  if ($("detailBalance"))
    $("detailBalance").textContent =
      money(give - receive);

  let rows =
    D.khata.filter(
      x =>
        x.mode === mode &&
        x.person === person
    );

  if (
    mode === "business" &&
    D.businessEntryRole
  ) {
    rows =
      rows.filter(
        x =>
          (x.role ||
           "customer") ===
          D.businessEntryRole
      );
  }

  if (D.detailFilter === "give")
    rows =
      rows.filter(
        x => x.type === "give"
      );

  if (D.detailFilter === "receive")
    rows =
      rows.filter(
        x => x.type === "receive"
      );

  if (D.detailFilter === "pending")
    rows =
      rows.filter(
        x => x.status !== "settled"
      );

  rows.sort(
    (a, b) =>
      String(b.date || "")
        .localeCompare(
          String(a.date || "")
        )
  );

  const list =
    $("khataHistory");

  if (!list) return;

  list.innerHTML =
    rows.length
      ? rows
          .map(khataEntryCard)
          .join("")
      : `
        <div style="padding:15px">
          No history.
        </div>
      `;
}

function detailFilter(
  type,
  btn
) {
  D.detailFilter = type;

  document
    .querySelectorAll(
      "#khataDetail .filter-row button"
    )
    .forEach(
      b =>
        b.classList.remove(
          "active"
        )
    );

  if (btn)
    btn.classList.add("active");

  renderKhataDetail();
}

function khataEntryCard(x) {
  const color =
    x.type === "give"
      ? "#dc3545"
      : "#198754";

  return `
    <div
      class="card"
      style="
        padding:12px;
        margin:7px 0">

      <div
        style="
          display:flex;
          justify-content:space-between">

        <b style="color:${color}">
          ${
            x.type === "give"
              ? "Give"
              : "Receive"
          }
        </b>

        <b>
          ${money(x.amount)}
        </b>

      </div>

      <div
        style="
          font-size:12px;
          margin-top:4px">

        ${esc(x.date || "")}
        •
        ${esc(x.method || "Cash")}
        •
        ${esc(x.status || "pending")}

      </div>

      ${
        x.note
          ? `
            <div
              style="margin-top:5px">
              ${esc(x.note)}
            </div>
          `
          : ""
      }

      ${
        x.phone
          ? `
            <div
              style="
                font-size:12px;
                margin-top:4px">
              📱 ${esc(x.phone)}
            </div>
          `
          : ""
      }

      <div
        style="
          display:flex;
          gap:6px;
          margin-top:8px">

        <button
          onclick="
            editKhata('${x.id}')
          ">
          Edit
        </button>

        <button
          onclick="
            deleteKhata('${x.id}')
          ">
          Delete
        </button>

        ${
          x.status !== "settled"
            ? `
              <button
                onclick="
                  settleKhata('${x.id}')
                ">
                Settle
              </button>
            `
            : ""
        }

      </div>
    </div>
  `;
}

function editKhata(id) {
  const x =
    D.khata.find(
      a => a.id === id
    );

  if (!x) return;

  editKhataId = id;

  D.detailMode = x.mode;
  D.detailPerson = x.person;
  D.detailPhone = x.phone || "";

  if (x.mode === "business")
    D.businessEntryRole =
      x.role || "customer";

  show("khataEntry");

  setTimeout(() => {
    if ($("khataPerson"))
      $("khataPerson").value =
        x.person;

    if ($("khataPhone"))
      $("khataPhone").value =
        x.phone || "";

    if ($("khataType"))
      $("khataType").value =
        x.type;

    if ($("khataAmount"))
      $("khataAmount").value =
        x.amount;

    if ($("khataDate"))
      $("khataDate").value =
        x.date;

    if ($("khataMethod"))
      $("khataMethod").value =
        x.method;

    if ($("khataStatus"))
      $("khataStatus").value =
        x.status;

    if ($("khataNote"))
      $("khataNote").value =
        x.note || "";
  }, 30);
}

function deleteKhata(id) {
  if (!confirm(
    "Delete this entry?"
  )) return;

  D.khata =
    D.khata.filter(
      x => x.id !== id
    );

  save();
  renderKhataDetail();
}

function settleKhata(id) {
  const x =
    D.khata.find(
      a => a.id === id
    );

  if (!x) return;

  x.status = "settled";

  save();
  renderKhataDetail();
}

/* ================= PAYMENT ================= */

function openPaymentEntry() {
  const amount =
    Number(
      prompt("Payment amount") || 0
    );

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const role =
    D.detailMode === "business"
      ? (
          D.businessEntryRole ||
          "customer"
        )
      : "personal";

  D.khata.push({
    id: uid(),
    mode: D.detailMode,
    person: D.detailPerson,
    phone: D.detailPhone || "",
    type: "receive",
    amount,
    date: today(),
    method: "Cash",
    status: "settled",
    role,
    note: "Payment / Settlement",
    created: Date.now()
  });

  save();
  renderKhataDetail();
}

function closeKhataDetail() {
  show(
    D.detailMode === "business"
      ? "business"
      : "personal"
  );
}

/* ================= BUSINESS CUSTOMER / SUPPLIER ================= */

function openBusinessCustomerForm(
  name = "",
  phone = "",
  role = "customer"
) {
  let modal =
    $("businessCustomerModal");

  if (!modal) {
    modal =
      document.createElement("div");

    modal.id =
      "businessCustomerModal";

    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:15px;";

    modal.innerHTML = `
      <div
        style="
          background:#fff;
          border-radius:18px;
          padding:18px;
          width:100%;
          max-width:420px">

        <h3 id="bcTitle">
          Add Customer
        </h3>

        <input
          id="bcName"
          placeholder="Customer / Supplier Name"
          style="
            width:100%;
            padding:12px;
            margin:8px 0;
            border:1px solid #ddd;
            border-radius:10px">

        <input
          id="bcPhone"
          type="tel"
          placeholder="Mobile Number"
          style="
            width:100%;
            padding:12px;
            margin:8px 0;
            border:1px solid #ddd;
            border-radius:10px">

        <button
          onclick="selectContactOptional()"
          style="margin-top:5px">
          📱 Select Contact
        </button>

        <div
          style="
            display:flex;
            gap:8px;
            margin-top:15px;
            flex-wrap:wrap">

          <button
            onclick="
              saveBusinessCustomer(
                'customer'
              )
            ">
            Save Customer
          </button>

          <button
            onclick="
              saveBusinessCustomer(
                'supplier'
              )
            ">
            Save Supplier
          </button>

          <button
            onclick="
              closeBusinessCustomerForm()
            ">
            Cancel
          </button>

        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  $("bcName").value = name;
  $("bcPhone").value = phone;

  $("bcTitle").textContent =
    role === "supplier"
      ? "Add Supplier"
      : "Add Customer";

  modal.style.display = "flex";
}

function closeBusinessCustomerForm() {
  $("businessCustomerModal")
    ?.remove();
}

async function selectContactOptional() {
  if (!navigator.contacts?.select) {
    alert(
      "Contact Picker is not available here. Please enter name and mobile number manually."
    );
    return;
  }

  try {
    const contacts =
      await navigator.contacts.select(
        ["name", "tel"],
        {
          multiple: false
        }
      );

    const c =
      contacts?.[0];

    if (!c) return;

    $("bcName").value =
      Array.isArray(c.name)
        ? c.name[0]
        : c.name || "";

    $("bcPhone").value =
      Array.isArray(c.tel)
        ? c.tel[0]
        : c.tel || "";

  } catch (e) {}
}

function saveBusinessCustomer(
  role = "customer"
) {
  const name =
    val("bcName");

  const phone =
    val("bcPhone");

  if (!name) {
    alert(
      "Please enter name."
    );
    return;
  }

  const duplicate =
    D.business.some(
      x =>
        x.role === role &&
        String(x.name)
          .toLowerCase() ===
          name.toLowerCase() &&
        String(x.phone || "") ===
          String(phone || "")
    );

  if (duplicate) {
    alert(
      `${
        role === "customer"
          ? "Customer"
          : "Supplier"
      } already added.`
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

  closeBusinessCustomerForm();

  D.businessFilter = role;

  renderBusiness();
}

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

/* ================= BUSINESS PEOPLE ================= */

function getBusinessPeople(
  role = "customer"
) {
  const map = {};

  D.business
    .filter(
      x =>
        x.role === role ||
        x.type === role
    )
    .forEach(x => {
      const key =
        `${x.name}|${x.phone || ""}`;

      if (!map[key]) {
        map[key] = {
          id: x.id,
          name: x.name,
          phone: x.phone || "",
          role,
          give: 0,
          receive: 0,
          pending: 0
        };
      }
    });

  D.khata
    .filter(
      x =>
        x.mode === "business" &&
        (
          x.role ||
          "customer"
        ) === role
    )
    .forEach(x => {
      const key =
        `${x.person}|${x.phone || ""}`;

      if (!map[key]) {
        map[key] = {
          id: uid(),
          name: x.person,
          phone: x.phone || "",
          role,
          give: 0,
          receive: 0,
          pending: 0
        };
      }

      if (x.type === "give")
        map[key].give +=
          Number(x.amount || 0);

      if (x.type === "receive")
        map[key].receive +=
          Number(x.amount || 0);

      if (x.status !== "settled")
        map[key].pending +=
          Number(x.amount || 0);
    });

  return Object.values(map);
}

/* ================= BUSINESS ================= */

function businessFilter(
  type,
  btn
) {
  D.businessFilter = type;

  document
    .querySelectorAll(
      "#business .business-tabs button"
    )
    .forEach(
      b =>
        b.classList.remove(
          "active"
        )
    );

  if (btn)
    btn.classList.add("active");

  renderBusiness();
}

function openBusinessEntry(
  role = "customer",
  person = "",
  phone = ""
) {
  D.businessEntryRole = role;
  D.detailMode = "business";

  openKhataForm(
    "business",
    person,
    phone
  );
}

function renderBusiness() {
  const box =
    $("businessList");

  const role =
    D.businessFilter ||
    "customer";

  const search =
    val("businessSearch")
      .toLowerCase();

  if (
    role === "sales" ||
    role === "purchase"
  ) {
    renderBusinessSales(role);
    return;
  }

  const people =
    getBusinessPeople(role)
      .filter(x =>
        !search ||
        x.name
          .toLowerCase()
          .includes(search) ||
        x.phone
          .toLowerCase()
          .includes(search)
      );

  const give =
    people.reduce(
      (a, x) =>
        a + Number(x.give || 0),
      0
    );

  const receive =
    people.reduce(
      (a, x) =>
        a + Number(x.receive || 0),
      0
    );

  if ($("businessGiven"))
    $("businessGiven").textContent =
      money(give);

  if ($("businessReceived"))
    $("businessReceived").textContent =
      money(receive);

  if ($("businessNet"))
    $("businessNet").textContent =
      money(give - receive);

  if (!box) return;

  const addButton =
    role === "customer"
      ? `
        <button
          onclick="addBusinessCustomer()">
          + Add Customer
        </button>
      `
      : `
        <button
          onclick="addBusinessSupplier()">
          + Add Supplier
        </button>
      `;

  box.innerHTML =
    addButton +
    (
      people.length
        ? people.map(p => `
            <div
              class="card"
              style="
                padding:13px;
                margin:8px 0">

              <div
                style="
                  display:flex;
                  justify-content:space-between">

                <div>
                  <b>
                    ${esc(p.name)}
                  </b>

                  ${
                    p.phone
                      ? `<div
                          style="
                            font-size:12px">
                          📱 ${esc(p.phone)}
                         </div>`
                      : ""
                  }
                </div>

                <b>
                  ${money(
                    Math.abs(
                      p.give -
                      p.receive
                    )
                  )}
                </b>
              </div>

              <div
                style="
                  font-size:12px;
                  margin-top:6px">

                <span
                  style="color:#dc3545">
                  Give:
                  ${money(p.give)}
                </span>

                &nbsp; | &nbsp;

                <span
                  style="color:#198754">
                  Receive:
                  ${money(p.receive)}
                </span>
              </div>

              ${
                p.pending
                  ? `
                    <div
                      style="
                        font-size:12px;
                        margin-top:5px">
                      Pending:
                      ${money(p.pending)}
                    </div>
                  `
                  : ""
              }

              <div
                style="
                  display:flex;
                  gap:6px;
                  flex-wrap:wrap;
                  margin-top:10px">

                <button
                  onclick="
                    openBusinessEntry(
                      '${role}',
                      '${esc(p.name)}',
                      '${esc(p.phone)}'
                    )
                  ">
                  + Entry
                </button>

                <button
                  onclick="
                    openBusinessPerson(
                      '${esc(p.name)}',
                      '${esc(p.phone)}',
                      '${role}'
                    )
                  ">
                  Khata
                </button>

                ${
                  p.phone
                    ? `
                      <button
                        onclick="
                          businessWhatsApp(
                            '${esc(p.name)}',
                            '${esc(p.phone)}'
                          )
                        ">
                        WhatsApp
                      </button>
                    `
                    : ""
                }
              </div>
            </div>
          `).join("")
        : `
          <div
            class="card"
            style="
              padding:20px;
              text-align:center;
              margin-top:10px">

            No ${
              role === "customer"
                ? "customers"
                : "suppliers"
            } yet.

            <br><br>

            Add your first ${
              role === "customer"
                ? "customer"
                : "supplier"
            }.
          </div>
        `
    );
}

function openBusinessPerson(
  name,
  phone,
  role
) {
  D.businessEntryRole =
    role;

  openKhataDetail(
    name,
    "business",
    phone
  );
}

function renderBusinessSales(
  type
) {
  const box =
    $("businessList");

  if (!box) return;

  const data =
    D.business.filter(
      x => x.type === type
    );

  box.innerHTML = `
    <button
      onclick="
        addBusinessRecord(
          '${type}'
        )
      ">
      + Add ${
        type === "sales"
          ? "Sale"
          : "Purchase"
      }
    </button>

    ${
      data.length
        ? data.map(x => `
            <div
              class="card"
              style="
                padding:12px;
                margin:8px 0">

              <b>
                ${esc(x.name)}
              </b>

              <div
                style="margin-top:5px">
                ${money(x.amount)}
              </div>

              <small>
                ${esc(x.date || "")}
              </small>

              ${
                x.note
                  ? `<div>
                       ${esc(x.note)}
                     </div>`
                  : ""
              }

              <button
                onclick="
                  deleteBusinessRecord(
                    '${x.id}'
                  )
                ">
                Delete
              </button>
            </div>
          `).join("")
        : `
          <div
            style="
              padding:20px;
              text-align:center">
            No ${
              type === "sales"
                ? "sales"
                : "purchase"
            } records.
          </div>
        `
    }
  `;
}

function addBusinessRecord(
  type = "sales"
) {
  const name =
    prompt(
      type === "sales"
        ? "Customer / Sale name"
        : "Supplier / Purchase name"
    );

  if (!name) return;

  const amount =
    Number(
      prompt("Amount") || 0
    );

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const note =
    prompt("Note") || "";

  D.business.push({
    id: uid(),
    type,
    name: name.trim(),
    amount,
    note,
    date: today(),
    created: Date.now()
  });

  save();
  renderBusiness();
}

function deleteBusinessRecord(id) {
  if (!confirm(
    "Delete this record?"
  )) return;

  D.business =
    D.business.filter(
      x => x.id !== id
    );

  save();
  renderBusiness();
}

function businessStatement(
  person,
  role = "customer"
) {
  const rows =
    D.khata.filter(
      x =>
        x.mode === "business" &&
        x.person === person &&
        (x.role ||
         "customer") === role
    );

  let text =
    `HISAB BUSINESS STATEMENT\n\n` +
    `Name: ${person}\n` +
    `Role: ${role}\n\n`;

  rows.forEach(x => {
    text +=
      `${x.date} | ` +
      `${x.type.toUpperCase()} | ` +
      `${money(x.amount)} | ` +
      `${x.status}\n`;
  });

  return text;
}

function businessWhatsApp(
  person,
  phone
) {
  let number =
    String(phone || "")
      .replace(/\D/g, "");

  if (!number) {
    alert("Mobile number missing.");
    return;
  }

  if (
    number.length === 10
  ) {
    number = "91" + number;
  }

  const text =
    businessStatement(
      person,
      D.businessEntryRole ||
      "customer"
    );

  const url =
    "https://wa.me/" +
    number +
    "?text=" +
    encodeURIComponent(text);

  window.open(
    url,
    "_blank"
  );
}

/* ================= BUSINESS TABS ================= */

function addBusinessCustomerOrSupplier() {
  if (
    D.businessFilter ===
    "supplier"
  )
    addBusinessSupplier();
  else
    addBusinessCustomer();
}

/* ================= PLANNING ================= */

function renderPlanning() {
  const box =
    $("planning");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Budget
      </h3>

      <div>
        Current Budget:
        <b>${money(D.budget)}</b>
      </div>

      <button
        onclick="setBudget()">
        Set Budget
      </button>

    </div>

    <div
      class="card"
      style="
        padding:15px;
        margin-top:10px">

      <h3>
        Goals & Savings
      </h3>

      <button
        onclick="addGoal()">
        + Add Goal
      </button>

      ${
        D.goals.length
          ? D.goals.map(x => `
              <div
                style="
                  margin-top:10px;
                  padding:8px">

                <b>
                  ${esc(x.name)}
                </b>

                <div>
                  Target:
                  ${money(
                    x.amount ||
                    x.target
                  )}
                </div>

                <button
                  onclick="
                    deleteGoal(
                      '${x.id}'
                    )
                  ">
                  Delete
                </button>
              </div>
            `).join("")
          : `
            <div
              style="margin-top:10px">
              No goals yet.
            </div>
          `
      }

    </div>
  `;
}

function setBudget() {
  const n =
    Number(
      prompt(
        "Budget amount",
        D.budget || 0
      ) || 0
    );

  if (n < 0) return;

  D.budget = n;

  save();
  renderPlanning();
}

function addGoal() {
  const name =
    prompt("Goal name");

  if (!name) return;

  const amount =
    Number(
      prompt("Target amount") || 0
    );

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  D.goals.push({
    id: uid(),
    name,
    amount,
    target: amount,
    saved: 0,
    date: today()
  });

  save();
  renderPlanning();
}

function deleteGoal(id) {
  D.goals =
    D.goals.filter(
      x => x.id !== id
    );

  save();
  renderPlanning();
}

/* ================= PAYMENTS ================= */

function renderPayments() {
  const box =
    $("credit");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Bills & Loans / EMI
      </h3>

      <button
        onclick="addBill()">
        + Bill
      </button>

      <button
        onclick="addLoan()">
        + Loan
      </button>

      <button
        onclick="calcEMI()">
        EMI Calculator
      </button>

      <div
        id="emiResult"
        style="margin-top:10px">
      </div>

      <div
        style="margin-top:15px">

        ${
          D.bills.length
            ? D.bills.map(x => `
                <div
                  class="card"
                  style="
                    padding:10px;
                    margin:6px 0">

                  🧾
                  <b>
                    ${esc(x.name)}
                  </b>

                  —
                  ${money(x.amount)}

                  <div>
                    Due:
                    ${esc(x.due || "-")}
                  </div>

                  <button
                    onclick="
                      deleteBill(
                        '${x.id}'
                      )
                    ">
                    Delete
                  </button>

                </div>
              `).join("")
            : "No bills."
        }

      </div>

      <div
        style="margin-top:15px">

        ${
          D.loans.length
            ? D.loans.map(x => `
                <div
                  class="card"
                  style="
                    padding:10px;
                    margin:6px 0">

                  🏦
                  <b>
                    ${esc(x.name)}
                  </b>

                  —
                  ${money(x.amount)}

                  <button
                    onclick="
                      deleteLoan(
                        '${x.id}'
                      )
                    ">
                    Delete
                  </button>

                </div>
              `).join("")
            : ""
        }

      </div>
    </div>
  `;
}

function addBill() {
  const name =
    prompt("Bill name");

  if (!name) return;

  const amount =
    Number(
      prompt("Amount") || 0
    );

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const due =
    prompt(
      "Due date",
      today()
    ) || today();

  D.bills.push({
    id: uid(),
    name,
    amount,
    due,
    kind: "bill",
    created: Date.now()
  });

  save();
  renderPayments();
}

function deleteBill(id) {
  D.bills =
    D.bills.filter(
      x => x.id !== id
    );

  save();
  renderPayments();
}

function addLoan() {
  const name =
    prompt("Loan name");

  if (!name) return;

  const amount =
    Number(
      prompt("Loan amount") || 0
    );

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  D.loans.push({
    id: uid(),
    name,
    amount,
    rate: 0,
    months: 0,
    created: Date.now()
  });

  save();
  renderPayments();
}

function deleteLoan(id) {
  D.loans =
    D.loans.filter(
      x => x.id !== id
    );

  save();
  renderPayments();
}

function calcEMI() {
  const principal =
    Number(
      prompt("Loan amount") || 0
    );

  const rate =
    Number(
      prompt("Annual interest %") || 0
    );

  const months =
    Number(
      prompt("Months") || 0
    );

  if (
    !principal ||
    principal <= 0 ||
    !months ||
    months <= 0
  ) {
    alert(
      "Enter valid loan details"
    );
    return;
  }

  const r =
    rate / 12 / 100;

  const emi =
    r === 0
      ? principal / months
      : principal *
        r *
        Math.pow(
          1 + r,
          months
        ) /
        (
          Math.pow(
            1 + r,
            months
          ) - 1
        );

  D.emis.push({
    id: uid(),
    principal,
    rate,
    months,
    emi,
    created: Date.now()
  });

  save();

  renderPayments();

  const result =
    $("emiResult");

  if (result) {
    result.innerHTML = `
      <div
        class="card"
        style="padding:12px">

        <b>
          Monthly EMI:
          ${money(emi)}
        </b>

        <div>
          Total:
          ${money(emi * months)}
        </div>

      </div>
    `;
  }
}

/* ================= REPORTS ================= */

function totalMoney(
  type,
  mode = D.mode
) {
  return D.transactions
    .filter(
      x =>
        x.type === type &&
        (
          !x.mode ||
          x.mode === mode
        )
    )
    .reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );
}

function showReports() {
  renderReports();
}

function renderReports() {
  const box =
    $("reports");

  if (!box) return;

  const income =
    totalMoney(
      "income",
      D.mode
    );

  const expense =
    totalMoney(
      "expense",
      D.mode
    );

  const given =
    totalGive(D.mode);

  const received =
    totalReceive(D.mode);

  const sales =
    D.business
      .filter(
        x => x.type === "sales"
      )
      .reduce(
        (a, x) =>
          a + Number(
            x.amount || 0
          ),
        0
      );

  const purchase =
    D.business
      .filter(
        x =>
          x.type === "purchase"
      )
      .reduce(
        (a, x) =>
          a + Number(
            x.amount || 0
          ),
        0
      );

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Reports & Analytics
      </h3>

      <p>
        Income:
        <b>${money(income)}</b>
      </p>

      <p>
        Expense:
        <b>${money(expense)}</b>
      </p>

      <p>
        Give:
        <b>${money(given)}</b>
      </p>

      <p>
        Receive:
        <b>${money(received)}</b>
      </p>

      <p>
        Net Cash:
        <b>
          ${money(
            income - expense
          )}
        </b>
      </p>

      ${
        D.mode === "business"
          ? `
            <hr>

            <p>
              Sales:
              <b>
                ${money(sales)}
              </b>
            </p>

            <p>
              Purchase:
              <b>
                ${money(purchase)}
              </b>
            </p>
          `
          : ""
      }

      <button
        onclick="
          exportSummaryPDF()
        ">
        PDF / Share
      </button>

    </div>
  `;
}

/* ================= PDF ================= */

function pdfEscape(s) {
  return String(s)
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /\(/g,
      "\\("
    )
    .replace(
      /\)/g,
      "\\)"
    );
}

function makeSimplePDF(
  title,
  lines
) {
  const safe =
    [title, ...lines]
      .map(x =>
        String(x)
          .replace(
            /[^\x20-\x7E]/g,
            ""
          )
          .slice(0, 110)
      );

  let y = 760;

  let stream =
    "BT\n/F1 12 Tf\n";

  safe.forEach(line => {
    stream +=
      `50 ${y} Td ` +
      `(${pdfEscape(line)}) Tj\n`;

    y -= 18;

    if (y < 40) {
      stream +=
        "ET\nBT\n/F1 12 Tf\n";
      y = 760;
    }
  });

  stream += "ET";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",

    "<< /Type /Pages " +
      "/Kids [3 0 R] /Count 1 >>",

    "<< /Type /Page " +
      "/Parent 2 0 R " +
      "/MediaBox [0 0 612 792] " +
      "/Resources << /Font << " +
      "/F1 5 0 R >> >> " +
      "/Contents 4 0 R >>",

    `<< /Length ${stream.length} >>\n` +
      `stream\n${stream}\nendstream`,

    "<< /Type /Font " +
      "/Subtype /Type1 " +
      "/BaseFont /Helvetica >>"
  ];

  let pdf =
    "%PDF-1.4\n";

  const offsets = [0];

  objects.forEach(
    (obj, i) => {
      offsets[i + 1] =
        pdf.length;

      pdf +=
        `${i + 1} 0 obj\n` +
        `${obj}\n` +
        `endobj\n`;
    }
  );

  const xref =
    pdf.length;

  pdf +=
    `xref\n0 ${objects.length + 1}\n` +
    `0000000000 65535 f \n`;

  for (
    let i = 1;
    i <= objects.length;
    i++
  ) {
    pdf +=
      String(offsets[i])
        .padStart(10, "0") +
      " 00000 n \n";
  }

  pdf +=
    `trailer\n` +
    `<< /Size ${
      objects.length + 1
    } /Root 1 0 R >>\n` +
    `startxref\n${xref}\n` +
    `%%EOF`;

  return new Blob(
    [pdf],
    {
      type:
        "application/pdf"
    }
  );
}

async function sharePDF(
  blob,
  filename,
  textMsg
) {
  const file =
    new File(
      [blob],
      filename,
      {
        type:
          "application/pdf"
      }
    );

  try {
    if (
      navigator.share &&
      (
        !navigator.canShare ||
        navigator.canShare({
          files: [file]
        })
      )
    ) {
      await navigator.share({
        title: "HISAB PDF",
        text: textMsg,
        files: [file]
      });

      return true;
    }
  } catch (e) {}

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    3000
  );

  return false;
}

async function exportSummaryPDF() {
  const lines = [
    `Date: ${today()}`,
    `Mode: ${D.mode}`,
    `Income: ${money(
      totalMoney(
        "income",
        D.mode
      )
    )}`,
    `Expense: ${money(
      totalMoney(
        "expense",
        D.mode
      )
    )}`,
    `Give: ${money(
      totalGive(D.mode)
    )}`,
    `Receive: ${money(
      totalReceive(D.mode)
    )}`,
    `Balance: ${money(
      totalMoney(
        "income",
        D.mode
      ) -
      totalMoney(
        "expense",
        D.mode
      )
    )}`
  ];

  const blob =
    makeSimplePDF(
      "HISAB Summary",
      lines
    );

  await sharePDF(
    blob,
    `HISAB-Summary-${today()}.pdf`,
    "HISAB Summary"
  );
}

async function exportKhataPDF() {
  const person =
    D.detailPerson;

  const mode =
    D.detailMode;

  const rows =
    D.khata.filter(
      x =>
        x.mode === mode &&
        x.person === person
    );

  const lines = [
    `Person: ${person}`,
    `Give: ${money(
      totalGive(
        mode,
        person
      )
    )}`,
    `Receive: ${money(
      totalReceive(
        mode,
        person
      )
    )}`,
    `Balance: ${money(
      totalGive(
        mode,
        person
      ) -
      totalReceive(
        mode,
        person
      )
    )}`,
    ""
  ];

  rows.forEach(x => {
    lines.push(
      `${x.date} | ` +
      `${x.type} | ` +
      `${money(x.amount)} | ` +
      `${x.status} | ` +
      `${x.note || ""}`
    );
  });

  const safeName =
    person
      .replace(
        /[^a-z0-9]/gi,
        "_"
      );

  const blob =
    makeSimplePDF(
      `HISAB - ${person}`,
      lines
    );

  await sharePDF(
    blob,
    `HISAB-${safeName}.pdf`,
    `HISAB Statement - ${person}`
  );
}

function shareKhata() {
  const text =
    khataText();

  if (navigator.share) {
    navigator.share({
      title:
        "HISAB - " +
        D.detailPerson,
      text
    }).catch(() => {});
  } else {
    copyText(text);
  }
}

function khataText() {
  const rows =
    D.khata.filter(
      x =>
        x.mode ===
          D.detailMode &&
        x.person ===
          D.detailPerson
    );

  let text =
    `HISAB - ${D.detailPerson}\n\n`;

  rows.forEach(x => {
    text +=
      `${x.date} | ` +
      `${x.type.toUpperCase()} | ` +
      `${money(x.amount)} | ` +
      `${x.status}\n`;
  });

  return text;
}

/* ================= REMINDERS ================= */

function renderReminders() {
  const box =
    $("reminders");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Reminders
      </h3>

      <button
        onclick="addReminder()">
        + Add Reminder
      </button>

      <div
        style="margin-top:10px">

        ${
          D.reminders.length
            ? D.reminders
                .map(x => `
                  <div
                    style="
                      padding:8px 0">

                    🔔
                    ${esc(
                      x.text ||
                      x.name ||
                      ""
                    )}

                    <small>
                      ${esc(
                        x.date ||
                        ""
                      )}
                    </small>

                    <button
                      onclick="
                        deleteReminder(
                          '${x.id}'
                        )
                      ">
                      Delete
                    </button>

                  </div>
                `)
                .join("")
            : "No reminders."
        }

      </div>
    </div>
  `;
}

function addReminder() {
  const text =
    prompt("Reminder");

  if (!text) return;

  D.reminders.push({
    id: uid(),
    text,
    date: today()
  });

  save();
  renderReminders();
}

function deleteReminder(id) {
  D.reminders =
    D.reminders.filter(
      x => x.id !== id
    );

  save();
  renderReminders();
}

/* ================= SECURITY ================= */

function renderPrivacy() {
  const box =
    $("privacy");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Security
      </h3>

      <button
        onclick="setPIN()">
        Set / Change PIN
      </button>

      <button
        onclick="clearPIN()">
        Remove PIN
      </button>

      <p
        style="margin-top:10px">
        PIN:
        ${
          D.pin
            ? "Enabled"
            : "Not Set"
        }
      </p>

    </div>
  `;
}

function setPIN() {
  const pin =
    prompt(
      "Enter 4-6 digit PIN"
    );

  if (!pin) return;

  if (
    !/^\d{4,6}$/.test(pin)
  ) {
    alert(
      "PIN must be 4 to 6 digits."
    );
    return;
  }

  D.pin = pin;

  save();
  renderPrivacy();

  alert("PIN saved.");
}

function clearPIN() {
  if (
    D.pin &&
    !confirm(
      "Remove PIN?"
    )
  ) return;

  D.pin = "";

  save();
  renderPrivacy();
}

function lockApp() {
  if (!D.pin) {
    alert(
      "First set a PIN."
    );
    return;
  }

  const p =
    prompt("Enter PIN");

  if (p !== D.pin) {
    alert("Wrong PIN");
    return;
  }

  showGuestGate();
}

/* ================= BACKUP ================= */

function backupData() {
  const blob =
    new Blob(
      [
        JSON.stringify(
          D,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download =
    `HISAB-Backup-${today()}.json`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    2000
  );
}

function exportBackup() {
  backupData();
}

function restoreData() {
  const input =
    document.createElement(
      "input"
    );

  input.type = "file";
  input.accept =
    ".json,application/json";

  input.onchange = e => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const restored =
          JSON.parse(
            reader.result
          );

        if (
          !restored ||
          typeof restored !==
            "object"
        ) {
          throw new Error();
        }

        D = {
          ...D,
          ...restored
        };

        load();
        save();

        alert(
          "Backup restored successfully."
        );

        show("home");

      } catch (e) {
        alert(
          "Invalid HISAB backup."
        );
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

function importBackup(event) {
  const file =
    event.target.files?.[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {
    try {
      const restored =
        JSON.parse(
          reader.result
        );

      D = {
        ...D,
        ...restored
      };

      save();

      alert(
        "Backup restored successfully."
      );

      show("home");

    } catch (e) {
      alert(
        "Invalid HISAB backup."
      );
    }
  };

  reader.readAsText(file);
}

/* ================= FAMILY ================= */

function renderFamily() {
  const box =
    $("family");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Family
      </h3>

      <button
        onclick="addFamily()">
        + Add Member
      </button>

      ${
        D.family.length
          ? D.family.map(x => `
              <div
                style="margin-top:8px">

                ${esc(x.name)}

                <button
                  onclick="
                    deleteFamily(
                      '${x.id}'
                    )
                  ">
                  Delete
                </button>

              </div>
            `).join("")
          : `
            <div
              style="margin-top:10px">
              No family members.
            </div>
          `
      }

    </div>
  `;
}

function addFamily() {
  const name =
    prompt(
      "Member name"
    );

  if (!name) return;

  D.family.push({
    id: uid(),
    name
  });

  save();
  renderFamily();
}

function deleteFamily(id) {
  D.family =
    D.family.filter(
      x => x.id !== id
    );

  save();
  renderFamily();
}

function renderFamilyTools() {
  const box =
    $("familytools");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Family Tools
      </h3>

      <p>
        Shared family money tools.
      </p>

    </div>
  `;
}

/* ================= TOOLS ================= */

function renderTools() {
  const box =
    $("tools13");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Tools
      </h3>

      <button
        onclick="backupData()">
        Backup
      </button>

      <button
        onclick="restoreData()">
        Restore
      </button>

      <button
        onclick="show('reports')">
        Reports
      </button>

    </div>
  `;
}

function addTool(type) {
  D.tools.push({
    id: uid(),
    type,
    date: today()
  });

  save();

  alert(
    type + " added"
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

function addDoc() {
  addTool("Document");
}

function addAnnual() {
  addTool(
    "Annual Planning"
  );
}

function calcEmergency() {
  const monthly =
    Number(
      prompt(
        "Monthly essential expense"
      ) || 0
    );

  const months =
    Number(
      prompt(
        "How many months?",
        "6"
      ) || 6
    );

  if (
    monthly <= 0 ||
    months <= 0
  ) return;

  alert(
    "Emergency Fund Target: " +
    money(
      monthly * months
    )
  );
}

function calcFD() {
  const p =
    Number(
      $("fdPrincipal")?.value ||
      prompt("Principal") ||
      0
    );

  const rate =
    Number(
      $("fdRate")?.value ||
      prompt("Interest %") ||
      0
    );

  const months =
    Number(
      $("fdN")?.value ||
      prompt("Months") ||
      0
    );

  if (
    p <= 0 ||
    months <= 0
  ) {
    alert(
      "Enter valid FD details"
    );
    return;
  }

  const interest =
    p *
    rate *
    (months / 12) /
    100;

  const maturity =
    p + interest;

  if ($("fdResult")) {
    $("fdResult").innerHTML = `
      <div
        class="card"
        style="padding:12px">

        <h3>
          Maturity:
          ${money(maturity)}
        </h3>

        <small>
          Interest:
          ${money(interest)}
        </small>

      </div>
    `;
  } else {
    alert(
      "Maturity: " +
      money(maturity)
    );
  }
}

/* ================= SEARCH ================= */

function globalSearch(q = "") {
  q =
    String(q)
      .toLowerCase()
      .trim();

  if (!q) return;

  const business =
    D.business.filter(
      x =>
        String(x.name || "")
          .toLowerCase()
          .includes(q) ||
        String(x.phone || "")
          .toLowerCase()
          .includes(q)
    );

  if (business.length) {
    D.businessFilter =
      business[0].role ||
      "customer";

    show("business");
    return;
  }

  const khata =
    D.khata.filter(
      x =>
        String(x.person || "")
          .toLowerCase()
          .includes(q) ||
        String(x.phone || "")
          .toLowerCase()
          .includes(q) ||
        String(x.note || "")
          .toLowerCase()
          .includes(q)
    );

  if (khata.length) {
    openKhataDetail(
      khata[0].person,
      khata[0].mode,
      khata[0].phone || ""
    );
    return;
  }

  const transactions =
    D.transactions.filter(
      x =>
        JSON.stringify(x)
          .toLowerCase()
          .includes(q)
    );

  if (transactions.length) {
    show("transactions");
    return;
  }

  alert(
    "No result found."
  );
}

function searchAllData(q) {
  globalSearch(q);
}

/* ================= LANGUAGE ================= */

function toggleLanguage() {
  D.language =
    D.language === "en"
      ? "hi"
      : "en";

  save();

  alert(
    D.language === "hi"
      ? "भाषा हिन्दी की गई"
      : "Language changed to English"
  );
}

function changeCurrency() {
  const c =
    prompt(
      "Currency symbol",
      D.currency
    );

  if (!c) return;

  D.currency = c;

  save();

  renderHome();
}

function toggleCurrency() {
  changeCurrency();
}

/* ================= SETTINGS ================= */

function renderSettings() {
  const box =
    $("final");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>
        Settings
      </h3>

      <label>
        Currency
      </label>

      <input
        id="settingsCurrency"
        value="${esc(D.currency)}"
        style="
          width:100%;
          padding:10px;
          margin:5px 0">

      <label>
        Language
      </label>

      <select
        id="settingsLanguage"
        style="
          width:100%;
          padding:10px;
          margin:5px 0">

        <option
          value="en"
          ${
            D.language === "en"
              ? "selected"
              : ""
          }>
          English
        </option>

        <option
          value="hi"
          ${
            D.language === "hi"
              ? "selected"
              : ""
          }>
          हिन्दी
        </option>

      </select>

      <button
        onclick="saveSettings()">
        Save Settings
      </button>

      <button
        onclick="backupData()">
        Backup
      </button>

      <button
        onclick="restoreData()">
        Restore
      </button>

    </div>
  `;
}

function saveSettings() {
  D.currency =
    val("settingsCurrency") ||
    "₹";

  D.language =
    val("settingsLanguage") ||
    "en";

  save();

  alert(
    "Settings saved."
  );

  show("home");
}

/* ================= QUICK ADD ================= */

function openQuickAdd() {
  const choice =
    prompt(
      "Quick Add:\n" +
      "1 = Income\n" +
      "2 = Expense\n" +
      "3 = Udhaar Give\n" +
      "4 = Udhaar Receive\n" +
      "5 = Reminder"
    );

  if (
    choice === "1"
  ) {
    addTransaction(
      "income"
    );
    return;
  }

  if (
    choice === "2"
  ) {
    addTransaction(
      "expense"
    );
    return;
  }

  if (
    choice === "3" ||
    choice === "4"
  ) {
    openKhataForm(
      D.mode
    );

    setTimeout(() => {
      if ($("khataType"))
        $("khataType").value =
          choice === "3"
            ? "give"
            : "receive";
    }, 30);

    return;
  }

  if (
    choice === "5"
  ) {
    show("reminders");
  }
}

/* ================= PAYMENT SECTION ================= */

function showPaymentSection() {
  show("credit");
}

/* ================= ADS ================= */

function showAds() {
  show("ads");
}

/* ================= FINAL BUTTON FIX ================= */

function fixMoneyButtons() {
  document
    .querySelectorAll("button")
    .forEach(btn => {
      const text =
        (
          btn.textContent ||
          ""
        )
          .trim()
          .toLowerCase();

      if (
        text === "income" ||
        text === "+ income" ||
        text.includes("add income")
      ) {
        btn.onclick = () =>
          addTransaction(
            "income"
          );
      }

      if (
        text === "expense" ||
        text === "+ expense" ||
        text.includes("add expense")
      ) {
        btn.onclick = () =>
          addTransaction(
            "expense"
          );
      }
    });
}

/* ================= STARTUP ================= */

load();

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if ($("khataDate") &&
        !$("khataDate").value) {
      $("khataDate").value =
        today();
    }

    if ($("transactionDate") &&
        !$("transactionDate").value) {
      $("transactionDate").value =
        today();
    }

    fixHomeButtons();
    fixMoneyButtons();

    showGuestGate();
  }
);

window.addEventListener(
  "load",
  () => {
    setTimeout(() => {
      fixHomeButtons();
      fixMoneyButtons();
    }, 200);
  }
);
