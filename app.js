/* =========================================================
   HISAB GLOBAL V7
   FINAL APP.JS
   Local-first • Offline • Personal + Business
   Khatabook Style Udhaar / Khata
   ========================================================= */

"use strict";

/* =========================
   BASIC HELPERS
========================= */

const $ = id => document.getElementById(id);
const KEY = "hisab_v7_final";
const OLD_KEY = "hisabData";

const METHODS = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Debit Card",
  "Credit Card",
  "Wallet",
  "Cheque",
  "Other"
];

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v){
  const n = Math.abs(num(v));
  return (D.currency || "₹") + n.toLocaleString("en-IN");
}

function esc(v){
  return String(v ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function toast(msg){
  let x = $("hisabToast");

  if(!x){
    x = document.createElement("div");
    x.id = "hisabToast";
    x.style.cssText =
      "position:fixed;left:50%;bottom:85px;transform:translateX(-50%);" +
      "background:#10283d;color:#fff;padding:12px 18px;border-radius:14px;" +
      "z-index:99999;font-size:14px;box-shadow:0 8px 30px #0005;" +
      "max-width:90%;text-align:center;";
    document.body.appendChild(x);
  }

  x.textContent = msg;
  x.style.display = "block";

  clearTimeout(window.__hisabToast);
  window.__hisabToast =
    setTimeout(() => x.style.display = "none", 2200);
}

/* =========================
   DEFAULT DATA
========================= */

const DEFAULT_DATA = {
  version: 7,
  mode: "personal",
  currency: "₹",
  lang: "hi",
  pin: "",
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
  limits: {}
};

let D = loadData();

/* =========================
   LOAD / SAVE
========================= */

function loadData(){

  let raw = null;

  try{
    raw = JSON.parse(localStorage.getItem(KEY) || "null");
  }catch(e){}

  if(!raw){
    try{
      raw = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
    }catch(e){}
  }

  if(!raw) raw = {};

  const x = {...DEFAULT_DATA, ...raw};

  x.personal = Array.isArray(x.personal) ? x.personal : [];
  x.business = Array.isArray(x.business) ? x.business : [];
  x.transactions = Array.isArray(x.transactions) ? x.transactions : [];
  x.bills = Array.isArray(x.bills) ? x.bills : [];
  x.reminders = Array.isArray(x.reminders) ? x.reminders : [];
  x.goals = Array.isArray(x.goals) ? x.goals : [];
  x.budgets = Array.isArray(x.budgets) ? x.budgets : [];
  x.insurance = Array.isArray(x.insurance) ? x.insurance : [];
  x.schools = Array.isArray(x.schools) ? x.schools : [];
  x.vehicles = Array.isArray(x.vehicles) ? x.vehicles : [];
  x.family = Array.isArray(x.family) ? x.family : [];
  x.shopping = Array.isArray(x.shopping) ? x.shopping : [];
  x.utilities = Array.isArray(x.utilities) ? x.utilities : [];
  x.docs = Array.isArray(x.docs) ? x.docs : [];
  x.annual = Array.isArray(x.annual) ? x.annual : [];
  x.limits = x.limits && typeof x.limits === "object" ? x.limits : {};

  migrateOldData(x);

  return x;
}

function migrateOldData(x){

  /* old transactions */
  if(!x.transactions.length){
    try{
      const old = JSON.parse(
        localStorage.getItem("hisabTransactions") || "[]"
      );

      if(Array.isArray(old)){
        x.transactions = old;
      }
    }catch(e){}
  }

  /* old bills */
  if(!x.bills.length){
    try{
      const old = JSON.parse(
        localStorage.getItem("hisabBills") || "[]"
      );

      if(Array.isArray(old)){
        x.bills = old.map(b => ({
          id: b.id || uid(),
          name: b.name || "Bill",
          amount: num(b.amount),
          due: b.due || today(),
          kind: b.kind || "Bill",
          status: b.paid ? "settled" : "pending"
        }));
      }
    }catch(e){}
  }

  /* normalize people */
  ["personal","business"].forEach(type => {

    x[type] = x[type].map(p => {

      const person = {
        id: p.id || uid(),
        name: p.name || "Unnamed",
        phone: p.phone || "",
        partyType:
          p.partyType ||
          (type === "business" ? "customer" : "person"),
        created: p.created || today(),
        transactions: Array.isArray(p.transactions)
          ? p.transactions
          : []
      };

      person.transactions =
        person.transactions.map(t => ({
          id: t.id || uid(),
          kind:
            t.kind === "received"
              ? "receive"
              : t.kind === "given"
                ? "give"
                : (t.kind || "give"),
          amount: num(t.amount),
          note: t.note || "",
          date: t.date || today(),
          method: t.method || "Cash",
          status: t.status || "pending",
          type: t.type || "udhaar",
          created: t.created || Date.now()
        }));

      return person;
    });
  });
}

function save(){

  localStorage.setItem(KEY, JSON.stringify(D));

  /* compatibility */
  localStorage.setItem(OLD_KEY, JSON.stringify({
    business: D.business,
    personal: D.personal
  }));

  localStorage.setItem(
    "hisabTransactions",
    JSON.stringify(D.transactions)
  );

  localStorage.setItem(
    "hisabBills",
    JSON.stringify(D.bills)
  );

  localStorage.setItem(
    "hisabReminders",
    JSON.stringify(D.reminders)
  );

  renderAll();
}

/* =========================
   GUEST MODE
========================= */

const GUEST_KEY = "hisabGuestMode";

function enterGuestMode(){

  localStorage.setItem(GUEST_KEY,"true");

  $("guestGate")?.classList.add("hidden");
  $("appShell")?.classList.remove("hidden");

  toast("HISAB ready");
  renderAll();
}

function showGuestGate(){

  const gate = $("guestGate");
  const shell = $("appShell");

  if(localStorage.getItem(GUEST_KEY) === "true"){
    gate?.classList.add("hidden");
    shell?.classList.remove("hidden");
  }else{
    gate?.classList.remove("hidden");
    shell?.classList.add("hidden");
  }

  renderAll();
}

function resetGuestMode(){

  if(!confirm(
    "Guest mode reset karne par device ki HISAB data delete hogi. Continue?"
  )) return;

  localStorage.clear();
  location.reload();
}

/* =========================
   NAVIGATION
========================= */

function show(id){

  document.querySelectorAll(".screen").forEach(s =>
    s.classList.add("hidden")
  );

  const el = $(id);

  if(el){
    el.classList.remove("hidden");
    D.mode = id === "business" ? "business" :
             id === "personal" ? "personal" :
             D.mode;
  }

  saveQuiet();
  renderAll();
}

function saveQuiet(){
  localStorage.setItem(KEY, JSON.stringify(D));
}

/* =========================
   MODE
========================= */

function setMode(mode){

  D.mode = mode;

  if(mode === "personal"){
    show("personal");
  }else{
    show("business");
  }
}

/* =========================
   PARTY / KHATA
========================= */

function currentPeople(){

  return D.mode === "business"
    ? D.business
    : D.personal;
}

function partyList(type){

  return type === "business"
    ? D.business
    : D.personal;
}

function findParty(type,id){

  return partyList(type).find(p => p.id === id);
}

function addPerson(type){

  const business = type === "business";

  const name = prompt(
    business
      ? "Customer ya Supplier ka naam:"
      : "Person ka naam:"
  );

  if(!name || !name.trim()) return;

  let partyType = "person";

  if(business){
    const x = prompt(
      "Type likhein:\n1 = Customer\n2 = Supplier",
      "1"
    );

    partyType =
      String(x).trim() === "2"
        ? "supplier"
        : "customer";
  }

  partyList(type).push({
    id: uid(),
    name: name.trim(),
    phone: "",
    partyType,
    created: today(),
    transactions: []
  });

  save();

  toast(
    business
      ? `${partyType === "supplier" ? "Supplier" : "Customer"} added`
      : "Person added"
  );
}

/* =========================
   PARTY TOTALS
========================= */

function totals(p){

  let give = 0;
  let receive = 0;
  let pending = 0;
  let settled = 0;

  (p.transactions || []).forEach(t => {

    if(t.kind === "give"){
      give += num(t.amount);
    }else{
      receive += num(t.amount);
    }

    if(t.status === "settled"){
      settled += num(t.amount);
    }else{
      pending += num(t.amount);
    }
  });

  return {
    give,
    receive,
    balance: give - receive,
    pending,
    settled
  };
}

function totalGiven(list){
  return list.reduce(
    (s,p) => s + totals(p).give, 0
  );
}

function totalReceived(list){
  return list.reduce(
    (s,p) => s + totals(p).receive, 0
  );
}

/* =========================
   KHATA MODAL
========================= */

function ensureModal(){

  if($("khataModal")) return;

  const div = document.createElement("div");

  div.id = "khataModal";

  div.innerHTML = `
    <div id="khataOverlay"
      style="
        position:fixed;
        inset:0;
        background:#0008;
        z-index:99990;
        display:flex;
        align-items:flex-end;
        justify-content:center;
      ">

      <div id="khataBox"
        style="
          background:#fff;
          color:#111;
          width:100%;
          max-width:520px;
          max-height:92vh;
          overflow:auto;
          border-radius:24px 24px 0 0;
          padding:18px;
          box-sizing:border-box;
        ">

        <div id="khataContent"></div>

      </div>
    </div>
  `;

  document.body.appendChild(div);

  $("khataOverlay").onclick = e => {
    if(e.target.id === "khataOverlay"){
      closeKhata();
    }
  };
}

function closeKhata(){

  const m = $("khataModal");

  if(m) m.remove();
}

let activeParty = null;
let activeType = null;

function openKhata(type,id){

  const p = findParty(type,id);

  if(!p) return;

  activeParty = id;
  activeType = type;

  ensureModal();

  renderKhata();

  $("khataModal").style.display = "block";
}

function renderKhata(){

  const p = findParty(activeType,activeParty);

  if(!p) return closeKhata();

  const t = totals(p);

  const history =
    [...p.transactions]
      .sort((a,b) =>
        String(b.date).localeCompare(String(a.date))
      );

  $("khataContent").innerHTML = `

    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h2 style="margin:0">${esc(p.name)}</h2>
        <small>
          ${
            activeType === "business"
              ? (p.partyType === "supplier"
                  ? "Supplier"
                  : "Customer")
              : "Personal Udhaar"
          }
        </small>
      </div>

      <button onclick="closeKhata()"
        style="border:0;background:#eee;border-radius:50%;width:38px;height:38px">
        ✕
      </button>
    </div>

    <div style="
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:8px;
      margin:15px 0;
    ">

      <div style="padding:10px;background:#fff1f1;border-radius:12px">
        <small>Give</small>
        <b style="display:block;color:#d33">${money(t.give)}</b>
      </div>

      <div style="padding:10px;background:#effff4;border-radius:12px">
        <small>Receive</small>
        <b style="display:block;color:#159447">${money(t.receive)}</b>
      </div>

      <div style="padding:10px;background:#eef5ff;border-radius:12px">
        <small>Balance</small>
        <b style="display:block">
          ${t.balance > 0
            ? "You Get "+money(t.balance)
            : t.balance < 0
              ? "You Give "+money(t.balance)
              : "Settled"}
        </b>
      </div>

    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">

      <button
        onclick="newKhataEntry('give')"
        style="padding:13px;border:0;border-radius:12px;background:#ffe8e8">
        🔴 Give
      </button>

      <button
        onclick="newKhataEntry('receive')"
        style="padding:13px;border:0;border-radius:12px;background:#e8fff0">
        🟢 Receive
      </button>

    </div>

    <button
      onclick="shareKhataPDF()"
      style="width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px">
      📄 Share / Save Khata PDF
    </button>

    <h3 style="margin:20px 0 8px">Khata History</h3>

    ${
      history.length
      ? history.map(t => `
        <div style="
          padding:12px 0;
          border-bottom:1px solid #eee;
        ">

          <div style="display:flex;justify-content:space-between">

            <b style="
              color:${t.kind === "give" ? "#d33" : "#159447"}
            ">
              ${t.kind === "give" ? "Give" : "Receive"}
              ${money(t.amount)}
            </b>

            <small>${esc(t.date)}</small>

          </div>

          <div style="font-size:13px;margin-top:4px">
            ${esc(t.note || "No note")}
          </div>

          <div style="font-size:12px;color:#777;margin-top:3px">
            ${esc(t.method || "Cash")}
            ·
            ${t.status === "settled" ? "Settled" : "Pending"}
          </div>

          <div style="margin-top:7px">

            <button
              onclick="editKhataEntry('${t.id}')"
              style="padding:6px 10px">
              Edit
            </button>

            <button
              onclick="toggleKhataStatus('${t.id}')"
              style="padding:6px 10px">
              ${t.status === "settled"
                ? "Mark Pending"
                : "Mark Settled"}
            </button>

            <button
              onclick="deleteKhataEntry('${t.id}')"
              style="padding:6px 10px">
              Delete
            </button>

          </div>

        </div>
      `).join("")
      : `<div style="padding:25px;text-align:center;color:#777">
          No entries yet
         </div>`
    }

  `;
}

/* =========================
   ADD KHATA ENTRY
========================= */

function newKhataEntry(kind){

  const p = findParty(activeType,activeParty);

  if(!p) return;

  const amount = prompt(
    `${kind === "give" ? "Give" : "Receive"} amount:`
  );

  if(!amount || num(amount) <= 0){
    toast("Valid amount enter karein");
    return;
  }

  const note = prompt("Note:", "") || "";

  const methodInput = prompt(
    "Payment Method:\n" +
    "1 Cash\n" +
    "2 UPI\n" +
    "3 Bank Transfer\n" +
    "4 Debit Card\n" +
    "5 Credit Card\n" +
    "6 Wallet\n" +
    "7 Cheque\n" +
    "8 Other",
    "1"
  );

  const map = {
    "1":"Cash",
    "2":"UPI",
    "3":"Bank Transfer",
    "4":"Debit Card",
    "5":"Credit Card",
    "6":"Wallet",
    "7":"Cheque",
    "8":"Other"
  };

  const method = map[String(methodInput).trim()] || "Cash";

  const date = prompt(
    "Date (YYYY-MM-DD):",
    today()
  ) || today();

  const statusInput = prompt(
    "Status:\n1 Pending\n2 Settled",
    "1"
  );

  p.transactions.push({
    id: uid(),
    kind,
    amount:num(amount),
    note,
    date,
    method,
    status:String(statusInput).trim() === "2"
      ? "settled"
      : "pending",
    type:"udhaar",
    created:Date.now()
  });

  save();

  renderKhata();

  toast(
    kind === "give"
      ? "Give entry added"
      : "Receive entry added"
  );
}

/* =========================
   EDIT / DELETE / SETTLE
========================= */

function editKhataEntry(id){

  const p = findParty(activeType,activeParty);

  if(!p) return;

  const t = p.transactions.find(x => x.id === id);

  if(!t) return;

  const amount = prompt(
    "Amount:",
    t.amount
  );

  if(!amount || num(amount) <= 0) return;

  const note = prompt(
    "Note:",
    t.note || ""
  );

  const date = prompt(
    "Date:",
    t.date || today()
  );

  t.amount = num(amount);
  t.note = note || "";
  t.date = date || today();

  save();
  renderKhata();

  toast("Entry updated");
}

function toggleKhataStatus(id){

  const p = findParty(activeType,activeParty);

  if(!p) return;

  const t = p.transactions.find(x => x.id === id);

  if(!t) return;

  t.status =
    t.status === "settled"
      ? "pending"
      : "settled";

  save();
  renderKhata();
}

function deleteKhataEntry(id){

  if(!confirm("Entry delete karein?")) return;

  const p = findParty(activeType,activeParty);

  if(!p) return;

  p.transactions =
    p.transactions.filter(t => t.id !== id);

  save();
  renderKhata();

  toast("Entry deleted");
}

function deleteParty(type,id){

  if(!confirm("Pura khata delete karein?")) return;

  const list = partyList(type);

  const i = list.findIndex(p => p.id === id);

  if(i >= 0){
    list.splice(i,1);
    save();
  }
}

/* =========================
   PARTY LIST
========================= */

let partyFilter = "all";

function renderList(type,id){

  const el = $(id);

  if(!el) return;

  const list = partyList(type);

  const search =
    type === "business"
      ? ($("businessSearch")?.value || "")
      : ($("personalSearch")?.value || "");

  const q = search.toLowerCase().trim();

  const filtered = list.filter(p => {

    if(q){
      const text =
        p.name + " " +
        p.phone + " " +
        (p.partyType || "") + " " +
        p.transactions.map(t =>
          `${t.note} ${t.amount}`
        ).join(" ");

      if(!text.toLowerCase().includes(q))
        return false;
    }

    if(partyFilter === "given"){
      return totals(p).give > 0;
    }

    if(partyFilter === "received"){
      return totals(p).receive > 0;
    }

    if(partyFilter === "pending"){
      return p.transactions.some(
        t => t.status !== "settled"
      );
    }

    return true;
  });

  if(!filtered.length){

    el.innerHTML = `
      <div class="person" style="text-align:center;padding:25px">
        No Khata found
      </div>
    `;

    return;
  }

  el.innerHTML = filtered.map(p => {

    const t = totals(p);

    const balance =
      t.balance > 0
        ? `<span style="color:#d33">You Get ${money(t.balance)}</span>`
        : t.balance < 0
          ? `<span style="color:#159447">You Give ${money(t.balance)}</span>`
          : `<span>Settled</span>`;

    const last =
      p.transactions
        .slice()
        .sort((a,b) =>
          String(b.date).localeCompare(String(a.date))
        )[0];

    return `

      <div class="person"
        style="
          padding:15px;
          margin-bottom:10px;
          border-radius:16px;
        ">

        <div
          onclick="openKhata('${type}','${p.id}')"
          style="cursor:pointer">

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          ">

            <div>

              <h3 style="margin:0">
                ${esc(p.name)}
              </h3>

              <small>
                ${
                  type === "business"
                    ? (
                      p.partyType === "supplier"
                        ? "Supplier"
                        : "Customer"
                    )
                    : "Personal"
                }
              </small>

            </div>

            <b>${balance}</b>

          </div>

          <div style="
            display:flex;
            gap:14px;
            margin-top:10px;
            font-size:13px;
          ">

            <span style="color:#d33">
              Give ${money(t.give)}
            </span>

            <span style="color:#159447">
              Receive ${money(t.receive)}
            </span>

          </div>

          ${
            last
              ? `<small style="display:block;margin-top:8px;color:#777">
                   Last: ${esc(last.date)} ·
                   ${last.kind === "give" ? "Give" : "Receive"}
                   ${money(last.amount)}
                 </small>`
              : ""
          }

        </div>

        <div style="margin-top:10px">

          <button
            onclick="newEntryDirect('${type}','${p.id}','give')">
            🔴 Give
          </button>

          <button
            onclick="newEntryDirect('${type}','${p.id}','receive')">
            🟢 Receive
          </button>

          <button
            onclick="deleteParty('${type}','${p.id}')">
            Delete
          </button>

        </div>

      </div>
    `;

  }).join("");
}

function newEntryDirect(type,id,kind){

  activeType = type;
  activeParty = id;

  newKhataEntry(kind);
}

/* =========================
   PERSONAL / BUSINESS
========================= */

function enhancePersonal(){

  const s = $("personal");

  if(!s) return;

  const old = s.querySelector(".search-box");

  if(old && !$("personalSearch")){

    const input = old.querySelector("input");

    if(input){
      input.id = "personalSearch";
      input.oninput = () =>
        renderList("personal","personalList");
    }
  }

  const filters = s.querySelector(".filter-row");

  if(filters){

    [...filters.children].forEach((b,i) => {

      b.onclick = () => {

        partyFilter =
          ["all","given","received","pending"][i] || "all";

        [...filters.children].forEach(x =>
          x.classList.remove("active")
        );

        b.classList.add("active");

        renderList("personal","personalList");
      };

    });

  }
}

function enhanceBusiness(){

  const s = $("business");

  if(!s) return;

  if(!$("businessSearch")){

    const add = s.querySelector(".primary.full");

    if(add){

      const tools = document.createElement("div");

      tools.style.margin = "10px 0";

      tools.innerHTML = `
        <input
          id="businessSearch"
          placeholder="🔎 Search customer / supplier"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border-radius:12px;
            border:1px solid #ddd;
          ">

        <div style="
          display:flex;
          gap:7px;
          margin-top:8px;
        ">

          <button onclick="setBusinessFilter('all')">
            All
          </button>

          <button onclick="setBusinessFilter('customer')">
            Customers
          </button>

          <button onclick="setBusinessFilter('supplier')">
            Suppliers
          </button>

        </div>
      `;

      add.parentNode.insertBefore(
        tools,
        add.nextSibling
      );

      $("businessSearch").oninput = () =>
        renderBusiness();
    }
  }
}

let businessPartyFilter = "all";

function setBusinessFilter(v){

  businessPartyFilter = v;

  renderBusiness();
}

function renderBusiness(){

  const el = $("businessList");

  if(!el) return;

  let list = D.business;

  if(businessPartyFilter !== "all"){

    list = list.filter(
      p => (p.partyType || "customer") ===
           businessPartyFilter
    );
  }

  const original = D.business;

  D.business = list;

  renderList("business","businessList");

  D.business = original;
}

/* =========================
   HOME
========================= */

function renderHome(){

  const list = currentPeople();

  const given = totalGiven(list);
  const received = totalReceived(list);

  if($("receivable"))
    $("receivable").textContent = money(given);

  if($("payable"))
    $("payable").textContent = money(received);
}

/* =========================
   TRANSACTIONS
========================= */

function addTransaction(){

  const type = $("txType")?.value || "expense";
  const amount = num($("txAmount")?.value);

  if(amount <= 0){
    toast("Amount enter karein");
    return;
  }

  D.transactions.push({
    id:uid(),
    type,
    amount,
    category:$("txCat")?.value || "General",
    note:$("txNote")?.value || "",
    date:today()
  });

  save();
  toast("Transaction added");
}

function renderReports(){

  const income =
    D.transactions
      .filter(t => t.type === "income")
      .reduce((s,t) => s + num(t.amount),0);

  const expense =
    D.transactions
      .filter(t => t.type === "expense")
      .reduce((s,t) => s + num(t.amount),0);

  if($("rIncome"))
    $("rIncome").textContent = money(income);

  if($("rExpense"))
    $("rExpense").textContent = money(expense);

  if($("rSaving"))
    $("rSaving").textContent =
      money(income-expense);

  if($("rCount"))
    $("rCount").textContent =
      D.transactions.length;

  const cats = {};

  D.transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      cats[t.category] =
        (cats[t.category] || 0) + num(t.amount);
    });

  if($("catSummary")){

    $("catSummary").innerHTML =
      Object.entries(cats)
        .sort((a,b) => b[1]-a[1])
        .map(([k,v]) => `
          <div class="person">
            <b>${esc(k)}</b><br>
            ${money(v)}
          </div>
        `).join("") ||
      `<div class="person">No expenses</div>`;
  }

  if($("txList")){

    $("txList").innerHTML =
      D.transactions
        .slice()
        .reverse()
        .slice(0,50)
        .map(t => `
          <div class="person">
            <b>
              ${t.type === "income"
                ? "➕ Income"
                : "➖ Expense"}
            </b>
            · ${esc(t.category)}
            <br>
            ${money(t.amount)}
            · ${esc(t.date)}
            <br>
            ${esc(t.note || "")}
          </div>
        `).join("");
  }
}

/* =========================
   BUDGET
========================= */

function calcBudget(){

  const income = num($("mIncome")?.value);
  const budget = num($("mBudget")?.value);
  const target = num($("mSaving")?.value);

  const after = income - budget;
  const ok = after >= target;

  if($("budgetResult")){

    $("budgetResult").innerHTML = `
      <b>Monthly Result</b><br>
      Income: ${money(income)}<br>
      Budget: ${money(budget)}<br>
      Available: ${money(after)}<br>
      Saving Target: ${money(target)}<br><br>
      <strong>
        ${ok
          ? "✅ Saving target possible"
          : "⚠️ Budget / income adjust karein"}
      </strong>
    `;
  }
}

/* =========================
   GOALS
========================= */

function calcGoal(){

  const name = $("gName")?.value || "Goal";
  const target = num($("gTarget")?.value);
  const current = num($("gCurrent")?.value);
  const monthly = num($("gMonthly")?.value);

  const remain = Math.max(0,target-current);

  const months =
    monthly > 0
      ? Math.ceil(remain/monthly)
      : 0;

  const pct =
    target > 0
      ? Math.min(100,current/target*100)
      : 0;

  if($("goalResult")){

    $("goalResult").innerHTML = `
      <b>${esc(name)}</b><br>
      Target: ${money(target)}<br>
      Saved: ${money(current)}<br>
      Remaining: ${money(remain)}<br>
      Monthly Saving: ${money(monthly)}<br>
      Progress: ${pct.toFixed(0)}%<br>
      <strong>
        ${
          monthly
            ? `Approx ${months} months`
            : "Monthly saving enter karein"
        }
      </strong>
    `;
  }

  const existing =
    D.goals.find(g => g.name === name);

  if(existing){

    existing.target = target;
    existing.current = current;
    existing.monthly = monthly;

  }else{

    D.goals.push({
      id:uid(),
      name,
      target,
      current,
      monthly
    });
  }

  save();
}

/* =========================
   EMI
========================= */

function calcEMI(){

  const P = num($("loan")?.value);
  const annual = num($("rate")?.value);
  const n = num($("tenure")?.value);

  if(P <= 0 || n <= 0){
    toast("Loan amount aur tenure enter karein");
    return;
  }

  const r = annual / 12 / 100;

  const emi =
    r
      ? P*r*Math.pow(1+r,n) /
        (Math.pow(1+r,n)-1)
      : P/n;

  const total = emi*n;
  const interest = Math.max(0,total-P);

  if($("emiResult")){

    $("emiResult").innerHTML = `
      <b>Estimated EMI: ${money(emi)}</b><br>
      Total Payment: ${money(total)}<br>
      Total Interest: ${money(interest)}<br>
      Tenure: ${n} months
    `;
  }
}

/* =========================
   BILLS
========================= */

function addBill(kind){

  const isCard = kind === "Credit Card";

  const name =
    isCard
      ? "Credit Card"
      : ($("billName")?.value || "Bill");

  const amount =
    isCard
      ? num($("cardBill")?.value)
      : num($("billAmount")?.value);

  const due =
    isCard
      ? ($("cardDue")?.value || today())
      : ($("billDue")?.value || today());

  if(amount <= 0){
    toast("Bill amount enter karein");
    return;
  }

  D.bills.push({
    id:uid(),
    name,
    amount,
    due,
    kind:isCard ? "Credit Card" : "Bill",
    status:"pending"
  });

  save();
  toast("Bill added");
}

function toggleBill(i){

  const b = D.bills[i];

  if(!b) return;

  b.status =
    b.status === "settled"
      ? "pending"
      : "settled";

  save();
}

function renderBills(){

  const el = $("billList");

  if(!el) return;

  el.innerHTML =
    D.bills
      .slice()
      .sort((a,b) =>
        String(a.due).localeCompare(String(b.due))
      )
      .map((b,i) => `
        <div class="person">

          <b>
            ${b.status === "settled"
              ? "✅"
              : "⏳"}
            ${esc(b.name)}
          </b>

          <br>

          ${money(b.amount)}
          · Due ${esc(b.due)}

          <br>

          <button onclick="toggleBill(${i})">
            ${
              b.status === "settled"
                ? "Mark Pending"
                : "Mark Paid"
            }
          </button>

        </div>
      `).join("");
}

/* =========================
   REMINDERS
========================= */

function addReminder(){

  const name = $("remName")?.value || "Reminder";
  const type = $("remType")?.value || "General";
  const date = $("remDate")?.value;

  if(!date){
    toast("Date enter karein");
    return;
  }

  D.reminders.push({
    id:uid(),
    name,
    type,
    date,
    amount:num($("remAmount")?.value),
    note:$("remNote")?.value || "",
    done:false
  });

  save();
  toast("Reminder added");
}

function toggleReminder(i){

  if(!D.reminders[i]) return;

  D.reminders[i].done =
    !D.reminders[i].done;

  save();
}

function deleteReminder(i){

  D.reminders.splice(i,1);
  save();
}

function renderReminders(){

  const pending =
    D.reminders.filter(x => !x.done);

  const todayDate = today();

  const due =
    pending.filter(x => x.date <= todayDate);

  if($("remSummary")){

    $("remSummary").innerHTML = `
      <b>Pending: ${pending.length}</b><br>
      Due / Overdue: ${due.length}
    `;
  }

  if($("remList")){

    $("remList").innerHTML =
      D.reminders
        .slice()
        .sort((a,b) =>
          String(a.date).localeCompare(String(b.date))
        )
        .map((r,i) => `
          <div class="person">

            <b>
              ${r.done ? "✅" : "🔔"}
              ${esc(r.name)}
            </b>

            <br>

            ${esc(r.type)}
            · Due ${esc(r.date)}

            ${
              r.amount
                ? `<br>${money(r.amount)}`
                : ""
            }

            ${
              r.note
                ? `<br>${esc(r.note)}`
                : ""
            }

            <br>

            <button onclick="toggleReminder(${i})">
              ${r.done
                ? "Mark Pending"
                : "Mark Done"}
            </button>

            <button onclick="deleteReminder(${i})">
              Delete
            </button>

          </div>
        `).join("");
  }
}

/* =========================
   FD
========================= */

function calcFD(){

  const p = num($("fdP")?.value);
  const r = num($("fdR")?.value);
  const months = num($("fdN")?.value);

  if(p <= 0 || months <= 0){
    toast("Principal aur months enter karein");
    return;
  }

  const years = months / 12;

  const maturity =
    p * Math.pow(1+r/400,4*years);

  if($("fdResult")){

    $("fdResult").innerHTML = `
      <b>Estimated Maturity: ${money(maturity)}</b><br>
      Principal: ${money(p)}<br>
      Estimated Interest: ${money(maturity-p)}<br>
      Period: ${months} months
    `;
  }
}

/* =========================
   INSURANCE / SCHOOL / VEHICLE
========================= */

function addInsurance(){

  const name = $("insName")?.value || "Insurance";
  const premium = num($("insPremium")?.value);
  const date = $("insDate")?.value;

  if(premium <= 0 || !date){
    toast("Premium aur date enter karein");
    return;
  }

  D.insurance.push({
    id:uid(),
    name,
    premium,
    date
  });

  save();
}

function addSchool(){

  const child = $("child")?.value || "Child";
  const fee = num($("schoolFee")?.value);
  const due = $("schoolDue")?.value;
  const books = num($("schoolBooks")?.value);

  if(fee <= 0 || !due){
    toast("Fee aur due date enter karein");
    return;
  }

  D.schools.push({
    id:uid(),
    child,
    fee,
    due,
    books
  });

  save();
}

function addVehicle(){

  const vehicle = $("vehicle")?.value || "Vehicle";
  const fuel = num($("fuel")?.value);

  const service = $("service")?.value || "";
  const vehicleIns = $("vehicleIns")?.value || "";
  const puc = $("puc")?.value || "";

  D.vehicles.push({
    id:uid(),
    vehicle,
    fuel,
    service,
    vehicleIns,
    puc
  });

  save();
}

function renderFamily(){

  if($("insList")){

    $("insList").innerHTML =
      D.insurance.map(x => `
        <div class="person">
          <b>${esc(x.name)}</b><br>
          Premium: ${money(x.premium)}<br>
          Renewal: ${esc(x.date)}
        </div>
      `).join("");
  }

  if($("schoolList")){

    $("schoolList").innerHTML =
      D.schools.map(x => `
        <div class="person">
          <b>${esc(x.child)}</b><br>
          Fee: ${money(x.fee)}<br>
          Due: ${esc(x.due)}<br>
          Books: ${money(x.books)}
        </div>
      `).join("");
  }

  if($("vehicleList")){

    $("vehicleList").innerHTML =
      D.vehicles.map(x => `
        <div class="person">
          <b>${esc(x.vehicle)}</b><br>
          Fuel Budget: ${money(x.fuel)}/month<br>
          Service: ${esc(x.service || "-")}<br>
          Insurance: ${esc(x.vehicleIns || "-")}<br>
          PUC: ${esc(x.puc || "-")}
        </div>
      `).join("");
  }
}

/* =========================
   FAMILY TOOLS
========================= */

function addFamilyMember(){

  const name = $("fmName")?.value?.trim();

  if(!name) return;

  D.family.push({
    id:uid(),
    name
  });

  save();
}

function addShopping(){

  const item = $("shopItem")?.value?.trim();
  const budget = num($("shopBudget")?.value);

  if(!item || budget <= 0) return;

  D.shopping.push({
    id:uid(),
    item,
    budget,
    bought:false
  });

  save();
}

function toggleShopping(i){

  if(!D.shopping[i]) return;

  D.shopping[i].bought =
    !D.shopping[i].bought;

  save();
}

function addUtility(){

  const name = $("utilityName")?.value || "Utility";
  const amount = num($("utilityAmount")?.value);
  const month = $("utilityMonth")?.value;

  if(amount <= 0 || !month) return;

  D.utilities.push({
    id:uid(),
    name,
    amount,
    month
  });

  save();
}

function renderFamilyTools(){

  if($("fmList")){

    $("fmList").innerHTML =
      D.family.map(x =>
        `<span class="person"
          style="display:inline-block">
          ${esc(x.name)}
        </span>`
      ).join("");
  }

  if($("shopList")){

    $("shopList").innerHTML =
      D.shopping.map((x,i) => `
        <div class="person">
          ${x.bought ? "✅" : "🛒"}
          <b>${esc(x.item)}</b>
          · ${money(x.budget)}
          <br>
          <button onclick="toggleShopping(${i})">
            ${x.bought
              ? "Mark Pending"
              : "Mark Bought"}
          </button>
        </div>
      `).join("");
  }

  if($("utilityList")){

    $("utilityList").innerHTML =
      D.utilities
        .slice()
        .reverse()
        .map(x => `
          <div class="person">
            <b>${esc(x.name)}</b>
            · ${esc(x.month)}
            <br>
            ${money(x.amount)}
          </div>
        `).join("");
  }
}

/* =========================
   COMPARISON
========================= */

function renderComparison(){

  const now = new Date();

  const cm = now.getMonth();
  const cy = now.getFullYear();

  let curI = 0;
  let curE = 0;
  let prevI = 0;
  let prevE = 0;

  D.transactions.forEach(t => {

    const d = new Date(t.date);

    if(Number.isNaN(d.getTime())) return;

    const m = d.getMonth();
    const y = d.getFullYear();

    if(m === cm && y === cy){

      if(t.type === "income")
        curI += num(t.amount);
      else
        curE += num(t.amount);

    }else{

      const prevMonth =
        cm === 0 ? 11 : cm-1;

      const prevYear =
        cm === 0 ? cy-1 : cy;

      if(m === prevMonth && y === prevYear){

        if(t.type === "income")
          prevI += num(t.amount);
        else
          prevE += num(t.amount);
      }
    }
  });

  if($("compareResult")){

    $("compareResult").innerHTML = `
      <b>Current Month</b><br>
      Income: ${money(curI)}<br>
      Expense: ${money(curE)}<br><br>

      <b>Previous Month</b><br>
      Income: ${money(prevI)}<br>
      Expense: ${money(prevE)}<br><br>

      Expense Difference:
      ${money(curE-prevE)}
    `;
  }
}

/* =========================
   EMERGENCY
========================= */

function calcEmergency(){

  const expense = num($("emExpense")?.value);
  const months = num($("emMonths")?.value);
  const current = num($("emCurrent")?.value);

  const target = expense * months;
  const remain = Math.max(0,target-current);

  const pct =
    target > 0
      ? Math.min(100,current/target*100)
      : 0;

  if($("emResult")){

    $("emResult").innerHTML = `
      <div class="person">
        <b>Emergency Fund Target: ${money(target)}</b><br>
        Current: ${money(current)}<br>
        Remaining: ${money(remain)}<br>
        Progress: ${pct.toFixed(0)}%
      </div>
    `;
  }
}

/* =========================
   TOOLS 13
========================= */

function addDoc(){

  const name = $("docName")?.value?.trim();
  const date = $("docDate")?.value || "";

  if(!name) return;

  D.docs.push({
    id:uid(),
    name,
    date
  });

  save();
}

function addAnnual(){

  const name = $("annualName")?.value?.trim();
  const amount = num($("annualAmount")?.value);
  const month = $("annualMonth")?.value;

  if(!name || amount <= 0 || !month) return;

  D.annual.push({
    id:uid(),
    name,
    amount,
    month
  });

  save();
}

function saveLimit(){

  const cat = $("limitCat")?.value || "General";
  const amount = num($("limitAmount")?.value);

  if(amount <= 0) return;

  D.limits[cat] = amount;

  save();
}

function renderTools13(){

  if($("docList")){

    $("docList").innerHTML =
      D.docs.map(x => `
        <div class="person">
          <b>📄 ${esc(x.name)}</b><br>
          ${x.date
            ? "Expiry: "+esc(x.date)
            : "No expiry date"}
        </div>
      `).join("");
  }

  if($("annualList")){

    $("annualList").innerHTML =
      D.annual
        .slice()
        .sort((a,b) =>
          String(a.month).localeCompare(String(b.month))
        )
        .map(x => `
          <div class="person">
            <b>${esc(x.name)}</b><br>
            ${money(x.amount)} · ${esc(x.month)}
          </div>
        `).join("");
  }

  if($("limitList")){

    $("limitList").innerHTML =
      Object.entries(D.limits)
        .map(([k,v]) => `
          <div class="person">
            <b>${esc(k)}</b><br>
            Monthly Limit: ${money(v)}
          </div>
        `).join("");
  }
}

/* =========================
   SMART SEARCH
========================= */

function searchAllData(value){

  if(value === undefined){
    value = $("searchAll")?.value || "";
  }

  const q = String(value)
    .toLowerCase()
    .trim();

  const el = $("searchResults");

  if(!el) return;

  if(!q){
    el.innerHTML = "";
    return;
  }

  const out = [];

  ["personal","business"].forEach(type => {

    D[type].forEach(p => {

      const text =
        p.name + " " +
        p.phone + " " +
        p.partyType + " " +
        p.transactions
          .map(t =>
            `${t.note} ${t.amount} ${t.method}`
          ).join(" ");

      if(text.toLowerCase().includes(q)){

        const t = totals(p);

        out.push(`
          <div class="person"
            onclick="openKhata('${type}','${p.id}')">

            <b>
              ${type === "business"
                ? "🏢"
                : "🤝"}
              ${esc(p.name)}
            </b>

            <br>

            Give ${money(t.give)}
            · Receive ${money(t.receive)}

          </div>
        `);
      }
    });
  });

  D.transactions.forEach(t => {

    const text =
      `${t.category} ${t.note} ${t.amount}`;

    if(text.toLowerCase().includes(q)){

      out.push(`
        <div class="person">
          💰 ${esc(t.category)}
          · ${money(t.amount)}
        </div>
      `);
    }
  });

  D.bills.forEach(b => {

    if(
      `${b.name} ${b.amount}`
        .toLowerCase()
        .includes(q)
    ){

      out.push(`
        <div class="person">
          🧾 ${esc(b.name)}
          · ${money(b.amount)}
        </div>
      `);
    }
  });

  D.reminders.forEach(r => {

    if(
      `${r.name} ${r.type}`
        .toLowerCase()
        .includes(q)
    ){

      out.push(`
        <div class="person">
          🔔 ${esc(r.name)}
        </div>
      `);
    }
  });

  el.innerHTML =
    out.length
      ? out.join("")
      : `<div class="person">No result</div>`;
}

/* =========================
   PDF GENERATOR
   Simple dependency-free PDF
========================= */

function pdfEscape(s){

  return String(s)
    .replace(/\\/g,"\\\\")
    .replace(/\(/g,"\\(")
    .replace(/\)/g,"\\)");
}

function makePDF(lines){

  const safe =
    lines
      .map(x =>
        String(x)
          .replace(/₹/g,"Rs.")
          .replace(/[^\x20-\x7E]/g,"")
      )
      .slice(0,55);

  let content = "BT\n/F1 10 Tf\n";

  let y = 800;

  safe.forEach(line => {

    content +=
      `40 ${y} Td (${pdfEscape(line)}) Tj\n`;

    y -= 14;

    if(y < 40){
      y = 800;
    }
  });

  content += "ET";

  const objects = [];

  objects[1] =
    "<< /Type /Catalog /Pages 2 0 R >>";

  objects[2] =
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";

  objects[3] =
    "<< /Type /Page /Parent 2 0 R " +
    "/MediaBox [0 0 595 842] " +
    "/Resources << /Font << /F1 4 0 R >> >> " +
    "/Contents 5 0 R >>";

  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  objects[5] =
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for(let i=1;i<=5;i++){

    offsets[i] = pdf.length;

    pdf += `${i} 0 obj\n`;
    pdf += objects[i];
    pdf += "\nendobj\n";
  }

  const xref = pdf.length;

  pdf += "xref\n0 6\n";
  pdf += "0000000000 65535 f \n";

  for(let i=1;i<=5;i++){

    pdf += String(offsets[i])
      .padStart(10,"0") +
      " 00000 n \n";
  }

  pdf +=
    "trailer\n" +
    "<< /Size 6 /Root 1 0 R >>\n" +
    "startxref\n" +
    xref +
    "\n%%EOF";

  return new Blob([pdf],{
    type:"application/pdf"
  });
}

async function shareKhataPDF(){

  const p = findParty(activeType,activeParty);

  if(!p) return;

  const t = totals(p);

  const lines = [
    "HISAB - KHATA",
    "",
    "Name: " + p.name,
    "Type: " +
      (p.partyType === "supplier"
        ? "Supplier"
        : p.partyType === "customer"
          ? "Customer"
          : "Personal"),
    "",
    "Total Give: " + money(t.give),
    "Total Receive: " + money(t.receive),
    "Balance: " +
      (t.balance >= 0
        ? "You Get "
        : "You Give ") +
      money(t.balance),
    "",
    "HISTORY",
    ""
  ];

  p.transactions
    .slice()
    .sort((a,b) =>
      String(a.date).localeCompare(String(b.date))
    )
    .forEach(x => {

      lines.push(
        `${x.date} | ` +
        `${x.kind === "give" ? "Give" : "Receive"} | ` +
        `${money(x.amount)} | ` +
        `${x.method} | ` +
        `${x.status}`
      );

      if(x.note)
        lines.push("Note: " + x.note);
    });

  const blob = makePDF(lines);

  const file = new File(
    [blob],
    `${p.name.replace(/[^a-z0-9]/gi,"_")}_Khata.pdf`,
    {type:"application/pdf"}
  );

  try{

    if(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({files:[file]})
    ){

      await navigator.share({
        title:`${p.name} Khata`,
        text:"HISAB Khata",
        files:[file]
      });

      return;
    }

  }catch(e){

    if(e && e.name === "AbortError")
      return;
  }

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();

  setTimeout(() =>
    URL.revokeObjectURL(a.href),1000
  );

  toast("PDF saved");
}

/* =========================
   SUMMARY PDF / SHARE
========================= */

async function shareHisab(){

  const income =
    D.transactions
      .filter(t => t.type === "income")
      .reduce((s,t) => s + num(t.amount),0);

  const expense =
    D.transactions
      .filter(t => t.type === "expense")
      .reduce((s,t) => s + num(t.amount),0);

  const lines = [
    "HISAB SUMMARY",
    "",
    "Income: " + money(income),
    "Expense: " + money(expense),
    "Saving: " + money(income-expense),
    "",
    "Personal Khata: " + D.personal.length,
    "Business Khata: " + D.business.length,
    "Transactions: " + D.transactions.length,
    "Bills: " + D.bills.length,
    "Reminders: " + D.reminders.length
  ];

  const blob = makePDF(lines);

  const file =
    new File(
      [blob],
      "HISAB-Summary.pdf",
      {type:"application/pdf"}
    );

  try{

    if(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({files:[file]})
    ){

      await navigator.share({
        title:"HISAB Summary",
        files:[file]
      });

      return;
    }

  }catch(e){

    if(e?.name === "AbortError")
      return;
  }

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();

  setTimeout(() =>
    URL.revokeObjectURL(a.href),1000
  );
}

function exportSummary(){

  shareHisab();
}

/* =========================
   BACKUP / RESTORE
========================= */

function allHisabData(){

  return {
    app:"HISAB",
    version:7,
    exportedAt:new Date().toISOString(),
    data:D
  };
}

function downloadFile(name,text,type){

  const blob =
    new Blob([text],{type});

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download = name;
  a.click();

  setTimeout(() =>
    URL.revokeObjectURL(a.href),1000
  );
}

function exportBackup(){

  downloadFile(
    "HISAB-backup.json",
    JSON.stringify(allHisabData(),null,2),
    "application/json"
  );

  toast("Backup exported");
}

function importBackup(event){

  const file =
    event?.target?.files?.[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {

    try{

      const x =
        JSON.parse(reader.result);

      if(x.data){
        D = {
          ...DEFAULT_DATA,
          ...x.data
        };
      }else if(x.personal || x.business){
        D = {
          ...DEFAULT_DATA,
          ...x
        };
      }else{
        throw new Error("Invalid");
      }

      migrateOldData(D);
      save();

      toast("Backup restored");

    }catch(e){

      alert("Invalid HISAB backup file");
    }
  };

  reader.readAsText(file);
}

/* =========================
   SECURITY PIN
========================= */

function setPin(){

  const p =
    prompt("4-6 digit PIN set karein:");

  if(!/^\d{4,6}$/.test(p || "")){

    alert("PIN 4-6 digits ka hona chahiye");
    return;
  }

  D.pin = p;

  localStorage.setItem(
    "hisabPin",
    p
  );

  saveQuiet();

  toast("PIN saved");
}

function lockApp(){

  const pin =
    D.pin ||
    localStorage.getItem("hisabPin");

  if(!pin){

    alert("Pehle PIN set karein");
    return;
  }

  const overlay =
    document.createElement("div");

  overlay.id = "pinLock";

  overlay.style.cssText =
    "position:fixed;inset:0;background:#0b1f33;" +
    "z-index:100000;color:#fff;display:flex;" +
    "align-items:center;justify-content:center;" +
    "padding:25px;box-sizing:border-box;";

  overlay.innerHTML = `
    <div style="
      width:100%;
      max-width:360px;
      text-align:center;
    ">

      <div style="font-size:45px">🔒</div>

      <h2>HISAB Locked</h2>

      <input
        id="unlock"
        type="password"
        inputmode="numeric"
        maxlength="6"
        placeholder="Enter PIN"
        style="
          width:100%;
          box-sizing:border-box;
          padding:14px;
          border-radius:12px;
          border:0;
        ">

      <button
        onclick="unlockApp()"
        style="
          width:100%;
          margin-top:10px;
          padding:14px;
          border:0;
          border-radius:12px;
        ">
        Unlock
      </button>

    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() =>
    $("unlock")?.focus(),100
  );
}

function unlockApp(){

  const pin =
    D.pin ||
    localStorage.getItem("hisabPin");

  if($("unlock")?.value === pin){

    $("pinLock")?.remove();
    toast("Unlocked");

  }else{

    toast("Wrong PIN");
  }
}

/* =========================
   LANGUAGE / CURRENCY
========================= */

function changeLanguage(){

  D.lang =
    D.lang === "hi"
      ? "en"
      : "hi";

  saveQuiet();

  toast(
    D.lang === "hi"
      ? "Hindi selected"
      : "English selected"
  );
}

function changeCurrency(){

  const x =
    prompt(
      "Currency symbol enter karein:",
      D.currency || "₹"
    );

  if(!x) return;

  D.currency = x.trim();

  save();
  toast("Currency updated");
}

/* =========================
   TOP BUTTONS
========================= */

function wireTopButtons(){

  const buttons =
    document.querySelectorAll(
      ".top-actions .icon-btn"
    );

  if(buttons[0])
    buttons[0].onclick = changeLanguage;

  if(buttons[1])
    buttons[1].onclick = changeCurrency;
}

/* =========================
   BOTTOM NAV
========================= */

function wireBottomNav(){

  const nav =
    document.querySelectorAll(
      ".bottom-nav button, nav button"
    );

  nav.forEach(b => {

    const text =
      (b.textContent || "").toLowerCase();

    if(text.includes("home"))
      b.onclick = () => show("home");

    else if(
      text.includes("khata") ||
      text.includes("udhaar")
    )
      b.onclick = () => show("personal");

    else if(text.includes("add"))
      b.onclick = () => show("reports");

    else if(text.includes("report"))
      b.onclick = () => show("reports");

    else if(text.includes("more"))
      b.onclick = () => show("tools13");
  });
}

/* =========================
   SEARCH / FILTER WIRING
========================= */

function wireSearch(){

  if($("searchAll"))
    $("searchAll").oninput =
      e => searchAllData(e.target.value);

  enhancePersonal();
  enhanceBusiness();
}

/* =========================
   RENDER ALL
========================= */

function renderAll(){

  renderHome();

  enhancePersonal();
  enhanceBusiness();

  renderList(
    "personal",
    "personalList"
  );

  renderBusiness();

  renderReports();
  renderBills();
  renderReminders();
  renderFamily();
  renderFamilyTools();
  renderTools13();

  if($("searchAll")?.value)
    searchAllData(
      $("searchAll").value
    );
}

/* =========================
   INITIALIZATION
========================= */

function init(){

  wireTopButtons();
  wireBottomNav();
  wireSearch();

  renderAll();

  /* guest gate is also called
     by index.html */
}

/* =========================
   GLOBAL HANDLERS
   Needed by current HTML
========================= */

Object.assign(window,{

  enterGuestMode,
  showGuestGate,
  resetGuestMode,

  show,
  setMode,

  addPerson,
  addTransaction,

  calcBudget,
  calcGoal,
  calcEMI,
  addBill,

  addReminder,
  toggleReminder,
  deleteReminder,

  setPin,
  lockApp,
  unlockApp,

  exportBackup,
  exportSummary,
  importBackup,

  calcFD,
  addInsurance,
  addSchool,
  addVehicle,

  addFamilyMember,
  addShopping,
  toggleShopping,
  addUtility,

  renderComparison,
  calcEmergency,

  addDoc,
  addAnnual,
  saveLimit,

  searchAllData,
  shareHisab,

  openKhata,
  closeKhata,
  newKhataEntry,
  editKhataEntry,
  deleteKhataEntry,
  toggleKhataStatus,
  deleteParty,

  newEntryDirect,
  shareKhataPDF,

  setBusinessFilter,

  changeLanguage,
  changeCurrency
});

init();
