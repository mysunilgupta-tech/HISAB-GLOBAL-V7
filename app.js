/* =========================================================
   HISAB GLOBAL V7 — FINAL CONTROLLER
   Personal + Business + Udhaar + Customer/Supplier
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

/* ================= BASIC ================= */

const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(n) {
  return D.currency + Number(n || 0).toLocaleString("en-IN", {
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
  localStorage.setItem(KEY, JSON.stringify(D));
}

function load() {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (x && typeof x === "object") D = { ...D, ...x };
  } catch {}

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
}

/* ================= NAVIGATION ================= */

function hideAll() {
  document.querySelectorAll(".page,section[id]").forEach(el => {
    if (el.id && !["guestGate", "appShell"].includes(el.id)) {
      el.style.display = "none";
    }
  });
}

function show(id) {
  hideAll();

  const el = $(id);
  if (!el) return;

  el.style.display = "block";

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

/* ================= GUEST ================= */

function showGuestGate() {
  if ($("guestGate")) $("guestGate").style.display = "flex";
  if ($("appShell")) $("appShell").style.display = "none";
}

function enterGuestMode() {
  if ($("guestGate")) $("guestGate").style.display = "none";
  if ($("appShell")) $("appShell").style.display = "block";
  show("home");
}

/* ================= HOME MODE ================= */

function setMode(mode) {
  D.mode = mode;
  save();
  renderHome();

  if (mode === "business") show("business");
  else show("personal");
}

function fixHomeButtons() {
  const title =
    document.querySelector("#home .page-title") ||
    document.querySelector("#home h1") ||
    document.querySelector("#home h2");

  let box = $("hisabModeBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "hisabModeBox";

    box.style.cssText =
      "display:flex;gap:8px;margin:10px 0 14px;padding:4px;background:#eef4f8;border-radius:14px;";

    if (title) {
      title.insertAdjacentElement("afterend", box);
    } else {
      $("home")?.prepend(box);
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
      💼 Business
    </button>
  `;
}

function renderHome() {
  fixHomeButtons();

  if ($("modeLabel")) {
    $("modeLabel").textContent =
      D.mode === "business" ? "Business" : "Personal";
  }

  const all = D.khata.filter(x => x.mode === D.mode);

  const given = all
    .filter(x => x.type === "give")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  const received = all
    .filter(x => x.type === "receive")
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  if ($("receivable")) $("receivable").textContent = money(given);
  if ($("payable")) $("payable").textContent = money(received);
  if ($("homeBalance"))
    $("homeBalance").textContent = money(given - received);
}

/* ================= KHATA ================= */

function khataData(mode = D.mode) {
  return D.khata.filter(x => x.mode === mode);
}

function totalGive(mode = D.mode, person = "") {
  return khataData(mode)
    .filter(x =>
      x.type === "give" &&
      (!person || x.person === person)
    )
    .reduce((a, x) => a + Number(x.amount || 0), 0);
}

function totalReceive(mode = D.mode, person = "") {
  return khataData(mode)
    .filter(x =>
      x.type === "receive" &&
      (!person || x.person === person)
    )
    .reduce((a, x) => a + Number(x.amount || 0), 0);
}

function personRows(mode = "personal", search = "") {
  const map = {};

  khataData(mode).forEach(x => {
    const name = x.person || "Unknown";

    if (
      search &&
      !name.toLowerCase().includes(search.toLowerCase())
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

    if (x.phone && !map[name].phone) {
      map[name].phone = x.phone;
    }

    if (x.type === "give") {
      map[name].give += Number(x.amount || 0);
    }

    if (x.type === "receive") {
      map[name].receive += Number(x.amount || 0);
    }

    if (x.status !== "settled") {
      map[name].pending += Number(x.amount || 0);
    }
  });

  return Object.values(map);
}

function openKhataForm(mode = "personal", person = "", phone = "") {
  D.detailMode = mode;
  D.detailPerson = person;
  D.detailPhone = phone;

  show("khataEntry");

  if ($("khataPerson")) $("khataPerson").value = person;
  if ($("khataDate")) $("khataDate").value = today();
  if ($("khataType")) $("khataType").value = "give";
  if ($("khataAmount")) $("khataAmount").value = "";
  if ($("khataMethod")) $("khataMethod").value = "Cash";
  if ($("khataStatus")) $("khataStatus").value = "pending";
  if ($("khataNote")) $("khataNote").value = "";

  const form = $("khataEntry");

  if (form && !form.querySelector("#khataPhone")) {
    const input = document.createElement("input");

    input.id = "khataPhone";
    input.type = "tel";
    input.placeholder = "Mobile Number";

    input.style.cssText =
      "width:100%;padding:12px;margin:7px 0;border-radius:10px;border:1px solid #ddd;";

    $("khataPerson")?.insertAdjacentElement("afterend", input);
  }

  if ($("khataPhone")) {
    $("khataPhone").value = phone || "";
  }
}

function saveKhataEntry() {
  const person = val("khataPerson");
  const amount = num("khataAmount");

  if (!person) {
    alert("Please enter name.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Please enter amount.");
    return;
  }

  const phone = val("khataPhone");

  D.khata.push({
    id: uid(),
    mode: D.detailMode || D.mode,
    person,
    phone,
    type: $("khataType")?.value || "give",
    amount,
    date: val("khataDate") || today(),
    method: $("khataMethod")?.value || "Cash",
    status: $("khataStatus")?.value || "pending",
    note: val("khataNote"),
    role:
      D.detailMode === "business"
        ? D.businessEntryRole || "customer"
        : "personal",
    created: Date.now()
  });

  save();

  if (D.detailMode === "business") {
    show("business");
  } else {
    show("personal");
  }
}

function renderPersonal() {
  const search = val("personalSearch");

  let rows = personRows("personal", search);

  if (D.filter === "given") {
    rows = rows.filter(x => x.give > 0);
  }

  if (D.filter === "received") {
    rows = rows.filter(x => x.receive > 0);
  }

  if (D.filter === "due") {
    rows = rows.filter(x => x.pending > 0);
  }

  if ($("ledgerGiven"))
    $("ledgerGiven").textContent = money(totalGive("personal"));

  if ($("ledgerReceived"))
    $("ledgerReceived").textContent =
      money(totalReceive("personal"));

  if ($("ledgerNet"))
    $("ledgerNet").textContent =
      money(
        totalGive("personal") -
        totalReceive("personal")
      );

  const list = $("personalList");
  if (!list) return;

  list.innerHTML = rows.length
    ? rows.map(personCard).join("")
    : `<div style="padding:20px;text-align:center">
        No Udhaar entries yet.
       </div>`;
}

function personCard(p) {
  const bal = p.give - p.receive;

  return `
    <div class="card" style="margin:8px 0;padding:13px;border-radius:14px">

      <div style="display:flex;justify-content:space-between;gap:8px">

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

        <b>${money(Math.abs(bal))}</b>
      </div>

      <div style="font-size:12px;margin-top:6px">
        <span style="color:#198754">
          Give: ${money(p.give)}
        </span>

        &nbsp; | &nbsp;

        <span style="color:#dc3545">
          Receive: ${money(p.receive)}
        </span>
      </div>

      <div style="display:flex;gap:6px;margin-top:10px">

        <button
          onclick="openKhataDetail('${esc(p.name)}','personal','${esc(p.phone)}')">
          Khata
        </button>

        <button
          onclick="openKhataForm('personal','${esc(p.name)}','${esc(p.phone)}')">
          Entry
        </button>

      </div>
    </div>
  `;
}

function filterPersonal(type) {
  D.filter = type;
  renderPersonal();
}

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
    D.businessEntryRole !== "supplier"
  ) {
    const supplier = getBusinessPeople("supplier")
      .some(x =>
        x.name === person &&
        x.phone === phone
      );

    if (supplier) {
      D.businessEntryRole = "supplier";
    }
  }

  show("khataDetail");
  renderKhataDetail();
}

function renderKhataDetail() {
  const p = D.detailPerson;
  const mode = D.detailMode;

  if ($("detailPersonName"))
    $("detailPersonName").textContent = p;

  const give = totalGive(mode, p);
  const receive = totalReceive(mode, p);

  if ($("detailGive"))
    $("detailGive").textContent = money(give);

  if ($("detailReceive"))
    $("detailReceive").textContent =
      money(receive);

  if ($("detailBalance"))
    $("detailBalance").textContent =
      money(give - receive);

  const list = $("khataHistory");
  if (!list) return;

  let rows = D.khata.filter(
    x =>
      x.mode === mode &&
      x.person === p
  );

  if (
    mode === "business" &&
    D.businessEntryRole
  ) {
    rows = rows.filter(
      x =>
        (x.role || "customer") ===
        D.businessEntryRole
    );
  }

  rows.sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );

  list.innerHTML = rows.length
    ? rows.map(khataEntryCard).join("")
    : `<div style="padding:15px">No history.</div>`;
}

function khataEntryCard(x) {
  const color =
    x.type === "give"
      ? "#dc3545"
      : "#198754";

  return `
    <div class="card" style="margin:7px 0;padding:12px">

      <div style="display:flex;justify-content:space-between">

        <b style="color:${color}">
          ${x.type === "give" ? "Give" : "Receive"}
        </b>

        <b>${money(x.amount)}</b>

      </div>

      <div style="font-size:12px;margin-top:4px">
        ${esc(x.date)}
        • ${esc(x.method || "Cash")}
        • ${esc(x.status || "pending")}
      </div>

      ${
        x.note
          ? `<div style="margin-top:5px">
               ${esc(x.note)}
             </div>`
          : ""
      }

      <div style="display:flex;gap:6px;margin-top:8px">

        <button onclick="editKhata('${x.id}')">
          Edit
        </button>

        <button onclick="deleteKhata('${x.id}')">
          Delete
        </button>

        ${
          x.status !== "settled"
            ? `<button onclick="settleKhata('${x.id}')">
                 Settle
               </button>`
            : ""
        }

      </div>
    </div>
  `;
}

function editKhata(id) {
  const x = D.khata.find(a => a.id === id);
  if (!x) return;

  D.detailMode = x.mode;
  D.detailPerson = x.person;
  D.detailPhone = x.phone || "";

  if (x.mode === "business") {
    D.businessEntryRole =
      x.role || "customer";
  }

  openKhataForm(
    x.mode,
    x.person,
    x.phone || ""
  );

  if ($("khataType"))
    $("khataType").value = x.type;

  if ($("khataAmount"))
    $("khataAmount").value = x.amount;

  if ($("khataDate"))
    $("khataDate").value = x.date;

  if ($("khataMethod"))
    $("khataMethod").value = x.method;

  if ($("khataStatus"))
    $("khataStatus").value = x.status;

  if ($("khataNote"))
    $("khataNote").value = x.note || "";

  D.khata =
    D.khata.filter(a => a.id !== id);

  save();
}

function deleteKhata(id) {
  if (!confirm("Delete this entry?")) return;

  D.khata =
    D.khata.filter(x => x.id !== id);

  save();
  renderKhataDetail();
}

function settleKhata(id) {
  const x =
    D.khata.find(a => a.id === id);

  if (!x) return;

  x.status = "settled";

  save();
  renderKhataDetail();
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
      "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:15px;";

    modal.innerHTML = `
      <div style="
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

        <div style="
          display:flex;
          gap:8px;
          margin-top:15px">

          <button
            onclick="saveBusinessCustomer('customer')">
            Customer
          </button>

          <button
            onclick="saveBusinessCustomer('supplier')">
            Supplier
          </button>

          <button
            onclick="closeBusinessCustomerForm()">
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
  $("businessCustomerModal")?.remove();
}

async function selectContactOptional() {
  if (!navigator.contacts?.select) {
    alert(
      "Contact Picker is not available. Please enter name and mobile manually."
    );
    return;
  }

  try {
    const contacts =
      await navigator.contacts.select(
        ["name", "tel"],
        { multiple: false }
      );

    const c = contacts?.[0];

    if (!c) return;

    $("bcName").value =
      Array.isArray(c.name)
        ? c.name[0]
        : c.name || "";

    $("bcPhone").value =
      Array.isArray(c.tel)
        ? c.tel[0]
        : c.tel || "";

  } catch {}
}

function saveBusinessCustomer(
  role = "customer"
) {
  const name = val("bcName");
  const phone = val("bcPhone");

  if (!name) {
    alert("Please enter name.");
    return;
  }

  const duplicate =
    D.business.some(x =>
      x.role === role &&
      String(x.name).toLowerCase() ===
      name.toLowerCase() &&
      String(x.phone || "") ===
      String(phone || "")
    );

  if (duplicate) {
    alert(
      `${role === "customer" ? "Customer" : "Supplier"} already added.`
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

/* ================= BUSINESS ================= */

function getBusinessPeople(
  role = "customer"
) {
  const map = {};

  D.business
    .filter(x => x.role === role)
    .forEach(x => {
      const key = `${x.name}|${x.phone || ""}`;

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
    .filter(x =>
      x.mode === "business" &&
      (x.role || "customer") === role
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

      if (x.type === "give") {
        map[key].give +=
          Number(x.amount || 0);
      }

      if (x.type === "receive") {
        map[key].receive +=
          Number(x.amount || 0);
      }

      if (x.status !== "settled") {
        map[key].pending +=
          Number(x.amount || 0);
      }
    });

  return Object.values(map);
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
  const role =
    D.businessFilter || "customer";

  const search =
    val("businessSearch").toLowerCase();

  const people =
    getBusinessPeople(role).filter(x =>
      !search ||
      x.name.toLowerCase().includes(search) ||
      x.phone.toLowerCase().includes(search)
    );

  const give =
    people.reduce(
      (a, x) => a + x.give,
      0
    );

  const receive =
    people.reduce(
      (a, x) => a + x.receive,
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

  const list =
    $("businessList");

  if (!list) return;

  list.innerHTML = `
    <div style="
      display:flex;
      gap:7px;
      margin-bottom:10px;
      flex-wrap:wrap">

      <button
        onclick="
          D.businessFilter='customer';
          renderBusiness()
        ">
        Customers
      </button>

      <button
        onclick="
          D.businessFilter='supplier';
          renderBusiness()
        ">
        Suppliers
      </button>

      <button
        onclick="
          openBusinessCustomerForm(
            '',
            '',
            '${role}'
          )
        ">
        + Add
      </button>
    </div>

    ${
      people.length
        ? people
            .map(businessPersonCard)
            .join("")
        : `
          <div style="
            padding:20px;
            text-align:center">
            No ${role}s added yet.
          </div>
        `
    }
  `;
}

function businessPersonCard(p) {
  const bal =
    p.give - p.receive;

  return `
    <div class="card"
      style="
        margin:8px 0;
        padding:13px;
        border-radius:14px">

      <div style="
        display:flex;
        justify-content:space-between;
        gap:8px">

        <div>
          <b>${esc(p.name)}</b>

          ${
            p.phone
              ? `
                <div style="font-size:12px">
                  ${esc(p.phone)}
                </div>
              `
              : `
                <div style="
                  font-size:12px;
                  color:#777">
                  No mobile
                </div>
              `
          }
        </div>

        <b>
          ${money(Math.abs(bal))}
        </b>
      </div>

      <div style="
        font-size:12px;
        margin-top:6px">

        <span style="color:#198754">
          Give: ${money(p.give)}
        </span>

        &nbsp; | &nbsp;

        <span style="color:#dc3545">
          Receive: ${money(p.receive)}
        </span>
      </div>

      <div style="
        display:flex;
        gap:5px;
        flex-wrap:wrap;
        margin-top:9px">

        <button
          onclick="
            openKhataDetail(
              '${esc(p.name)}',
              'business',
              '${esc(p.phone)}'
            );
            D.businessEntryRole='${p.role}';
          ">
          Khata
        </button>

        <button
          onclick="
            openBusinessEntry(
              '${p.role}',
              '${esc(p.name)}',
              '${esc(p.phone)}'
            )
          ">
          Entry
        </button>

        <button
          onclick="
            businessStatement(
              '${esc(p.name)}',
              '${p.role}'
            )
          ">
          Statement
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
  `;
}

function businessFilter(role) {
  D.businessFilter = role;
  renderBusiness();
}

/* ================= SALES / PURCHASE ================= */

function renderBusinessSales() {
  const box =
    $("businessList");

  if (!box) return;

  const records =
    D.business
      .filter(x =>
        x.recordType === "sale" ||
        x.recordType === "purchase"
      )
      .sort(
        (a, b) =>
          b.created - a.created
      );

  box.innerHTML = `
    <button
      onclick="addBusinessRecord('sale')">
      + Sale
    </button>

    <button
      onclick="addBusinessRecord('purchase')">
      + Purchase
    </button>

    <div style="margin-top:10px">

      ${
        records.length
          ? records
              .map(x => `
                <div
                  class="card"
                  style="
                    padding:12px;
                    margin:7px 0">

                  <b>
                    ${
                      x.recordType === "sale"
                        ? "Sale"
                        : "Purchase"
                    }
                  </b>

                  <div>
                    ${esc(x.name || "")}
                  </div>

                  <b>
                    ${money(x.amount)}
                  </b>

                  <div>
                    ${esc(x.date || today())}
                  </div>

                  <button
                    onclick="
                      deleteBusinessRecord(
                        '${x.id}'
                      )
                    ">
                    Delete
                  </button>

                </div>
              `)
              .join("")
          : "No records."
      }

    </div>
  `;
}

function addBusinessRecord(
  type = "sale"
) {
  const name =
    prompt(
      type === "sale"
        ? "Customer name"
        : "Supplier name"
    );

  if (!name) return;

  const amount =
    Number(
      prompt("Amount") || 0
    );

  if (!amount) return;

  D.business.push({
    id: uid(),
    recordType: type,
    name,
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
      x.mode === "business" &&
      x.person === person &&
      (x.role || "customer") === role
    );

  let textMsg =
    `HISAB Statement\n${person}\n\n`;

  let give = 0;
  let receive = 0;

  rows.forEach(x => {
    if (x.type === "give")
      give += Number(x.amount || 0);
    else
      receive += Number(x.amount || 0);

    textMsg +=
      `${x.date} - ` +
      `${x.type === "give" ? "Give" : "Receive"} - ` +
      `${money(x.amount)}` +
      `${x.note ? ` - ${x.note}` : ""}\n`;
  });

  textMsg +=
    `\nTotal Give: ${money(give)}` +
    `\nTotal Receive: ${money(receive)}` +
    `\nBalance: ${money(give - receive)}`;

  if (navigator.share) {
    navigator.share({
      title: `HISAB - ${person}`,
      text: textMsg
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(textMsg);
    alert("Statement copied.");
  }
}

/* ================= WHATSAPP ================= */

function businessWhatsApp(
  person,
  phone
) {
  if (!phone) {
    alert(
      "Mobile number not available."
    );
    return;
  }

  const rows =
    D.khata.filter(x =>
      x.mode === "business" &&
      x.person === person &&
      (x.role || "customer") ===
      "customer"
    );

  let give = 0;
  let receive = 0;

  rows.forEach(x => {
    if (x.type === "give")
      give += Number(x.amount || 0);
    else
      receive += Number(x.amount || 0);
  });

  const message =
    `HISAB Statement\n\n` +
    `${person}\n` +
    `Give: ${money(give)}\n` +
    `Receive: ${money(receive)}\n` +
    `Balance: ${money(give - receive)}`;

  const clean =
    String(phone).replace(/\D/g, "");

  if (!clean) {
    alert(
      "Invalid mobile number."
    );
    return;
  }

  const url =
    `https://wa.me/${clean}?text=` +
    encodeURIComponent(message);

  window.open(url, "_blank");
}

/* ================= PAYMENT ================= */

function openPaymentEntry() {
  const role =
    D.detailMode === "business"
      ? (
          D.businessEntryRole ||
          "customer"
        )
      : "personal";

  const person =
    D.detailPerson || "";

  openKhataForm(
    D.detailMode || "personal",
    person,
    D.detailPhone || ""
  );

  if ($("khataType"))
    $("khataType").value =
      "receive";

  if (D.detailMode === "business")
    D.businessEntryRole = role;
}

/* ================= TRANSACTIONS ================= */

function totalIncome() {
  return D.transactions
    .filter(x =>
      x.type === "income"
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
      x.type === "expense"
    )
    .reduce(
      (a, x) =>
        a + Number(x.amount || 0),
      0
    );
}

function addTransaction(
  type = "expense"
) {
  const amount =
    Number(
      prompt("Amount") || 0
    );

  if (!amount) return;

  const note =
    prompt("Note") || "";

  D.transactions.push({
    id: uid(),
    type,
    amount,
    note,
    date: today(),
    created: Date.now()
  });

  save();
  renderTransactions();
}

function renderTransactions() {
  const box =
    $("transactions");

  if (!box) return;

  const rows =
    D.transactions
      .slice()
      .sort(
        (a, b) =>
          b.created - a.created
      );

  box.innerHTML = `
    <button
      onclick="addTransaction('income')">
      + Income
    </button>

    <button
      onclick="addTransaction('expense')">
      + Expense
    </button>

    <div style="margin-top:10px">

      ${
        rows.length
          ? rows
              .map(x => `
                <div
                  class="card"
                  style="
                    padding:11px;
                    margin:6px 0">

                  <b
                    style="
                      color:${
                        x.type === "income"
                          ? "#198754"
                          : "#dc3545"
                      }">
                    ${x.type}
                  </b>

                  <strong>
                    ${money(x.amount)}
                  </strong>

                  <div>
                    ${esc(x.note)}
                  </div>

                  <small>
                    ${esc(x.date)}
                  </small>

                  <button
                    onclick="
                      deleteTransaction(
                        '${x.id}'
                      )
                    ">
                    Delete
                  </button>

                </div>
              `)
              .join("")
          : "No transactions."
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

/* ================= PLANNING ================= */

function renderPlanning() {
  const box =
    $("planning");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>Budget</h3>

      <div>
        Current Budget:
        ${money(D.budget)}
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

      <h3>Goals & Savings</h3>

      <button
        onclick="addGoal()">
        + Add Goal
      </button>

      ${
        D.goals
          .map(x => `
            <div style="margin-top:8px">

              <b>
                ${esc(x.name)}
              </b>

              —
              ${money(x.amount)}

              <button
                onclick="
                  deleteGoal(
                    '${x.id}'
                  )
                ">
                Delete
              </button>

            </div>
          `)
          .join("")
      }

    </div>
  `;
}

function setBudget() {
  const n =
    Number(
      prompt(
        "Budget amount",
        D.budget
      ) || 0
    );

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

  D.goals.push({
    id: uid(),
    name,
    amount
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
      style="padding:14px">

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
        style="margin-top:12px">

        ${
          D.bills
            .map(x => `
              <div>

                🧾 ${esc(x.name)}
                —
                ${money(x.amount)}

                <button
                  onclick="
                    deleteBill(
                      '${x.id}'
                    )
                  ">
                  Delete
                </button>

              </div>
            `)
            .join("")
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

  D.bills.push({
    id: uid(),
    name,
    amount,
    due: today()
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

  D.loans.push({
    id: uid(),
    name,
    amount
  });

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

  if (!principal || !months)
    return;

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

  renderPayments();

  const result =
    $("emiResult");

  if (result) {
    result.innerHTML =
      `<b>
        Monthly EMI: ${money(emi)}
       </b>`;
  }
}

/* ================= REPORTS ================= */

function showReports() {
  const box =
    $("reports");

  if (!box) return;

  const income =
    totalIncome();

  const expense =
    totalExpense();

  const given =
    totalGive(D.mode);

  const received =
    totalReceive(D.mode);

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

      <button
        onclick="exportSummaryPDF()">
        PDF / Share
      </button>

    </div>
  `;
}

/* ================= PDF ================= */

function pdfEscape(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function makeSimplePDF(
  title,
  lines
) {
  const safeLines =
    [title, ...lines]
      .map(x =>
        String(x)
          .replace(/[^\x20-\x7E]/g, "")
          .slice(0, 110)
      );

  let y = 760;

  let stream =
    "BT\n/F1 12 Tf\n";

  safeLines.forEach(line => {
    stream +=
      `50 ${y} Td ` +
      `(${pdfEscape(line)}) Tj\n`;

    y -= 18;

    if (y < 40)
      y = 760;
  });

  stream += "ET";

  const objects = [];

  objects.push(
    "<< /Type /Catalog /Pages 2 0 R >>"
  );

  objects.push(
    "<< /Type /Pages " +
    "/Kids [3 0 R] /Count 1 >>"
  );

  objects.push(
    "<< /Type /Page " +
    "/Parent 2 0 R " +
    "/MediaBox [0 0 612 792] " +
    "/Resources << /Font << " +
    "/F1 5 0 R >> >> " +
    "/Contents 4 0 R >>"
  );

  objects.push(
    `<< /Length ${stream.length} >>\n` +
    `stream\n${stream}\nendstream`
  );

  objects.push(
    "<< /Type /Font " +
    "/Subtype /Type1 " +
    "/BaseFont /Helvetica >>"
  );

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
    `<< /Size ${objects.length + 1} ` +
    `/Root 1 0 R >>\n` +
    `startxref\n${xref}\n%%EOF`;

  return new Blob(
    [pdf],
    { type: "application/pdf" }
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
      { type: "application/pdf" }
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
  } catch {}

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
    `Income: ${money(totalIncome())}`,
    `Expense: ${money(totalExpense())}`,
    `Give: ${money(totalGive(D.mode))}`,
    `Receive: ${money(totalReceive(D.mode))}`,
    `Balance: ${money(
      totalGive(D.mode) -
      totalReceive(D.mode)
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
  const p =
    D.detailPerson;

  const mode =
    D.detailMode;

  const rows =
    D.khata.filter(
      x =>
        x.mode === mode &&
        x.person === p
    );

  const lines = [
    `Person: ${p}`,
    `Give: ${money(
      totalGive(mode, p)
    )}`,
    `Receive: ${money(
      totalReceive(mode, p)
    )}`,
    `Balance: ${money(
      totalGive(mode, p) -
      totalReceive(mode, p)
    )}`,
    ""
  ];

  rows.forEach(x => {
    lines.push(
      `${x.date} ` +
      `${x.type} ` +
      `${money(x.amount)} ` +
      `${x.note || ""}`
    );
  });

  const blob =
    makeSimplePDF(
      `HISAB - ${p}`,
      lines
    );

  await sharePDF(
    blob,
    `HISAB-${p.replace(
      /[^a-z0-9]/gi,
      "_"
    )}.pdf`,
    `HISAB Statement - ${p}`
  );
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

      <h3>Reminders</h3>

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
                    style="padding:8px 0">

                    🔔
                    ${esc(x.text)}

                    <small>
                      ${esc(x.date)}
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

      <h3>Security</h3>

      <button
        onclick="setPIN()">
        Set / Change PIN
      </button>

      <button
        onclick="clearPIN()">
        Remove PIN
      </button>

      <p style="margin-top:10px">
        PIN:
        ${D.pin ? "Enabled" : "Not Set"}
      </p>

    </div>
  `;
}

function setPIN() {
  const pin =
    prompt("Enter PIN");

  if (!pin) return;

  D.pin = pin;

  save();
  renderPrivacy();
}

function clearPIN() {
  D.pin = "";

  save();
  renderPrivacy();
}

/* ================= BACKUP ================= */

function backupData() {
  const blob =
    new Blob(
      [JSON.stringify(
        D,
        null,
        2
      )],
      { type: "application/json" }
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

function restoreData() {
  const input =
    document.createElement("input");

  input.type = "file";
  input.accept =
    ".json,application/json";

  input.onchange =
    e => {
      const file =
        e.target.files?.[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
        () => {
          try {
            D = {
              ...D,
              ...JSON.parse(
                reader.result
              )
            };

            save();

            alert(
              "Backup restored."
            );

            show("home");

          } catch {
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
    $("family");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>Family</h3>

      <button
        onclick="addFamily()">
        + Add Member
      </button>

      ${
        D.family
          .map(x => `
            <div style="margin-top:8px">

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
          `)
          .join("")
      }

    </div>
  `;
}

function addFamily() {
  const name =
    prompt("Member name");

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

      <h3>Family Tools</h3>

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

      <h3>Tools</h3>

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

/* ================= SETTINGS ================= */

function renderSettings() {
  const box =
    $("final");

  if (!box) return;

  box.innerHTML = `
    <div
      class="card"
      style="padding:15px">

      <h3>Settings</h3>

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
    val("settingsCurrency") || "₹";

  D.language =
    val("settingsLanguage") || "en";

  save();

  alert(
    "Settings saved."
  );

  show("home");
}

/* ================= SEARCH ================= */

function globalSearch(q = "") {
  q =
    String(q)
      .toLowerCase()
      .trim();

  if (!q) return;

  const foundKhata =
    D.khata.filter(x =>
      String(x.person)
        .toLowerCase()
        .includes(q) ||
      String(x.note || "")
        .toLowerCase()
        .includes(q)
    );

  const foundBusiness =
    D.business.filter(x =>
      String(x.name || "")
        .toLowerCase()
        .includes(q) ||
      String(x.phone || "")
        .toLowerCase()
        .includes(q)
    );

  if (foundBusiness.length) {
    D.businessFilter =
      foundBusiness[0].role ||
      "customer";

    show("business");
    return;
  }

  if (foundKhata.length) {
    openKhataDetail(
      foundKhata[0].person,
      foundKhata[0].mode,
      foundKhata[0].phone || ""
    );
    return;
  }

  alert(
    "No result found."
  );
}

/* ================= TOPBAR ================= */

function toggleLanguage() {
  D.language =
    D.language === "en"
      ? "hi"
      : "en";

  save();
  renderHome();
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

/* ================= ADS ================= */

function showAds() {
  show("ads");
}

/* ================= STARTUP ================= */

load();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    fixHomeButtons();

    if ($("khataDate")) {
      $("khataDate").value =
        today();
    }
  }
);

window.addEventListener(
  "load",
  () => {
    load();

    setTimeout(
      () => {
        fixHomeButtons();
      },
      200
    );
  }
);
