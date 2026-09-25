/* =========================================================
   HISAB GLOBAL V7 — FINAL CONTROLLER
   Local-first • Personal + Business • Udhaar • Payments
   ========================================================= */

const KEY="hisab_v7_data";

let D={
  mode:"personal",
  currency:"₹",
  language:"en",
  transactions:[],
  khata:[],
  business:[],
  goals:[],
  bills:[],
  cards:[],
  loans:[],
  emis:[],
  reminders:[],
  family:[],
  budget:0,
  pin:"",
  tools:[],
  filter:"all",
  businessFilter:"customer",
  detailPerson:"",
  detailMode:"personal",
  detailFilter:"all"
};

let editKhataId=null;

const $=id=>document.getElementById(id);

function uid(){
  return Date.now().toString(36)+Math.random().toString(36).slice(2,7);
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function money(n){
  return D.currency+(Number(n)||0).toLocaleString("en-IN",{
    maximumFractionDigits:2
  });
}

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function save(){
  localStorage.setItem(KEY,JSON.stringify(D));
}

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY)||"null");
    if(x&&typeof x==="object") D={...D,...x};
  }catch(e){}
}

function val(id){
  return $(id)?.value?.trim()||"";
}

function num(id){
  return Number($(id)?.value||0);
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function showGuestGate(){
  $("guestGate").style.display="flex";
  $("appShell").style.display="none";
}

function enterGuestMode(){
  $("guestGate").style.display="none";
  $("appShell").style.display="block";
  show(D.mode==="business"?"business":"home");
}

function show(id){
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  const page=$(id);
  if(!page)return;

  page.style.display="block";
  window.scrollTo(0,0);

  if(id==="home") renderHome();
  if(id==="personal") renderPersonal();
  if(id==="business") renderBusiness();
  if(id==="transactions") renderTransactions();
  if(id==="planning") renderPlanning();
  if(id==="credit") renderPayments();
  if(id==="reports") renderReports();
  if(id==="reminders") renderReminders();
  if(id==="privacy") renderPrivacy();
  if(id==="family") renderFamily();
  if(id==="tools13") renderTools();
}

function setMode(mode){
  D.mode=mode;
  save();
  renderHome();
  show(mode==="business"?"business":"home");
}

function openHomeKhata(){
  openKhataForm(D.mode);
}

/* Fixed HTML originally points this button to personal.
   Change it at runtime so Home respects selected mode. */
function fixHomeButtons(){
  const home=$("home");
  if(!home)return;
  const buttons=home.querySelectorAll(".feature-grid button");
  if(buttons[1]){
    buttons[1].onclick=()=>openKhataForm(D.mode);
  }
}

function renderHome(){
  $("modeLabel").textContent=
    D.mode==="business"?"Business":"Personal";

  $("receivable").textContent=money(totalGive(D.mode));
  $("payable").textContent=money(totalReceive(D.mode));

  const income=D.transactions
    .filter(x=>x.mode===D.mode&&x.type==="income")
    .reduce((a,x)=>a+Number(x.amount),0);

  const expense=D.transactions
    .filter(x=>x.mode===D.mode&&x.type==="expense")
    .reduce((a,x)=>a+Number(x.amount),0);

  $("homeBalance").textContent=money(income-expense);

  fixHomeButtons();
}

/* =========================================================
   LANGUAGE / CURRENCY
   ========================================================= */

function toggleLanguage(){
  D.language=D.language==="en"?"hi":"en";
  save();

  const map={
    "Dashboard":"डैशबोर्ड",
    "Personal Money":"पर्सनल मनी",
    "Business":"बिज़नेस",
    "Transactions":"लेन-देन",
    "Planning":"प्लानिंग",
    "Payments":"पेमेंट्स",
    "Reports & Analytics":"रिपोर्ट्स और एनालिटिक्स",
    "Reminders":"रिमाइंडर्स",
    "Security & Backup":"सिक्योरिटी और बैकअप"
  };

  document.querySelectorAll("h2").forEach(el=>{
    const t=el.textContent.trim();
    if(D.language==="hi"&&map[t])el.textContent=map[t];
  });

  alert(D.language==="hi"?"भाषा हिन्दी की गई":"Language changed to English");
}

function toggleCurrency(){
  const currencies=["₹","$","€","£"];
  const i=currencies.indexOf(D.currency);
  D.currency=currencies[(i+1)%currencies.length];
  save();
  renderCurrent();
}

function renderCurrent(){
  const page=document.querySelector(".page[style*='display: block']");
  if(page)show(page.id);
}

/* =========================================================
   UDHAR / KHATA CORE
   ========================================================= */

function khataData(mode){
  return D.khata.filter(x=>x.mode===mode);
}

function totalGive(mode){
  return khataData(mode)
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount),0);
}

function totalReceive(mode){
  return khataData(mode)
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount),0);
}

function personRows(mode){
  const map={};

  khataData(mode).forEach(x=>{
    const name=x.person.trim();
    if(!map[name]){
      map[name]={
        name,
        give:0,
        receive:0,
        pending:0,
        count:0
      };
    }

    map[name].count++;

    if(x.type==="give")map[name].give+=Number(x.amount);
    else map[name].receive+=Number(x.amount);

    if(x.status==="pending")map[name].pending+=Number(x.amount);
  });

  return Object.values(map).sort((a,b)=>
    (b.give+b.receive)-(a.give+a.receive)
  );
}

function openKhataForm(mode="personal",person=""){
  D.detailMode=mode;
  editKhataId=null;

  $("khataPerson").value=person;
  $("khataType").value="give";
  $("khataAmount").value="";
  $("khataDate").value=today();
  $("khataMethod").value="Cash";
  $("khataStatus").value="pending";
  $("khataNote").value="";

  show("khataEntry");
}

function closeKhataForm(){
  show(D.detailMode==="business"?"business":"personal");
}

function saveKhataEntry(){
  const person=val("khataPerson");
  const amount=num("khataAmount");

  if(!person)return alert("Person / Customer name required");
  if(amount<=0)return alert("Enter a valid amount");

  const item={
    id:editKhataId||uid(),
    mode:D.detailMode||D.mode,
    person,
    type:val("khataType")||"give",
    amount,
    date:val("khataDate")||today(),
    method:val("khataMethod")||"Cash",
    status:val("khataStatus")||"pending",
    note:val("khataNote"),
    created:Date.now()
  };

  if(editKhataId){
    const i=D.khata.findIndex(x=>x.id===editKhataId);
    if(i>=0)D.khata[i]=item;
  }else{
    D.khata.push(item);
  }

  editKhataId=null;
  save();

  openKhataDetail(person,item.mode);
}

function renderPersonal(){
  const mode="personal";
  const rows=personRows(mode);

  $("ledgerGiven").textContent=money(totalGive(mode));
  $("ledgerReceived").textContent=money(totalReceive(mode));
  $("ledgerNet").textContent=
    money(totalGive(mode)-totalReceive(mode));

  const search=(val("personalSearch")||"").toLowerCase();

  const filtered=rows.filter(p=>{
    if(!p.name.toLowerCase().includes(search))return false;
    if(D.filter==="give"&&p.give<=0)return false;
    if(D.filter==="receive"&&p.receive<=0)return false;
    if(D.filter==="pending"&&p.pending<=0)return false;
    return true;
  });

  $("personalList").innerHTML=
    filtered.map(personCard).join("")||
    emptyCard("No Udhaar entries yet","Add a person and create Give / Receive entry.");
}

function personCard(p){
  const balance=p.give-p.receive;
  return `
  <div class="list-card">
    <h3>${esc(p.name)}</h3>
    <div class="meta">
      Give <span class="give">${money(p.give)}</span>
      &nbsp; • &nbsp;
      Receive <span class="receive">${money(p.receive)}</span>
    </div>
    <div class="amount ${balance>=0?"give":"receive"}">
      Balance ${money(Math.abs(balance))}
    </div>
    ${p.pending?`<div class="pending">Pending ${money(p.pending)}</div>`:""}
    <div class="action-row" style="margin-top:10px">
      <button onclick="openKhataDetail('${esc(p.name)}','${p.mode||"personal"}')">Khata</button>
      <button onclick="openKhataForm('${D.mode}','${esc(p.name)}')">+ Entry</button>
    </div>
  </div>`;
}

function emptyCard(title,text){
  return `
  <div class="list-card">
    <h3>${esc(title)}</h3>
    <small>${esc(text)}</small>
  </div>`;
}

function openKhataDetail(person,mode="personal"){
  D.detailPerson=person;
  D.detailMode=mode;
  D.detailFilter="all";
  $("detailPersonName").textContent=person;
  show("khataDetail");
  renderKhataDetail();
}

function renderKhataDetail(){
  const data=khataData(D.detailMode)
    .filter(x=>x.person===D.detailPerson)
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  const give=data
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount),0);

  const receive=data
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount),0);

  $("detailGive").textContent=money(give);
  $("detailReceive").textContent=money(receive);
  $("detailBalance").textContent=money(give-receive);

  let list=data;

  if(D.detailFilter==="give")
    list=list.filter(x=>x.type==="give");

  if(D.detailFilter==="receive")
    list=list.filter(x=>x.type==="receive");

  if(D.detailFilter==="pending")
    list=list.filter(x=>x.status==="pending");

  $("khataHistory").innerHTML=
    list.map(khataEntryCard).join("")||
    emptyCard("No entries","No matching Khata entry found.");
}

function khataEntryCard(x){
  const color=x.type==="give"?"give":"receive";
  return `
  <div class="list-card">
    <div class="amount ${color}">
      ${x.type==="give"?"Give":"Receive"} ${money(x.amount)}
    </div>
    <div class="meta">
      ${esc(x.date)} • ${esc(x.method)}
    </div>
    <div class="meta">${esc(x.note||"No note")}</div>
    <div style="margin-top:7px">
      <span class="${x.status==="pending"?"status-pending":"status-settled"}">
        ${esc(x.status)}
      </span>
    </div>
    <div class="action-row" style="margin-top:9px">
      <button onclick="editKhata('${x.id}')">Edit</button>
      <button onclick="deleteKhata('${x.id}')">Delete</button>
      ${x.status==="pending"
        ?`<button onclick="settleKhata('${x.id}')">Settle</button>`:""}
    </div>
  </div>`;
}

function editKhata(id){
  const x=D.khata.find(a=>a.id===id);
  if(!x)return;

  editKhataId=id;
  D.detailMode=x.mode;

  $("khataPerson").value=x.person;
  $("khataType").value=x.type;
  $("khataAmount").value=x.amount;
  $("khataDate").value=x.date;
  $("khataMethod").value=x.method;
  $("khataStatus").value=x.status;
  $("khataNote").value=x.note||"";

  show("khataEntry");
}

function deleteKhata(id){
  if(!confirm("Delete this entry?"))return;
  D.khata=D.khata.filter(x=>x.id!==id);
  save();
  renderKhataDetail();
}

function settleKhata(id){
  const x=D.khata.find(a=>a.id===id);
  if(!x)return;
  x.status="settled";
  save();
  renderKhataDetail();
}

function closeKhataDetail(){
  show(D.detailMode==="business"?"business":"personal");
}

function filterKhata(mode,type,btn){
  D.filter=type;
  document.querySelectorAll("#personal .filter-row button")
    .forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");
  renderPersonal();
}

function detailFilter(type,btn){
  D.detailFilter=type;
  document.querySelectorAll("#khataDetail .filter-row button")
    .forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");
  renderKhataDetail();
}

function searchKhata(mode){
  mode==="business"?renderBusiness():renderPersonal();
}

function addKhataPerson(mode){
  const name=prompt("Person / Customer name");
  if(!name)return;
  openKhataForm(mode,name.trim());
}

/* =========================================================
   PAYMENT / SETTLEMENT
   ========================================================= */

function openPaymentEntry(){
  const amount=prompt("Payment amount");
  if(!amount)return;

  const n=Number(amount);
  if(n<=0)return alert("Invalid amount");

  const target=D.khata
    .filter(x=>x.mode===D.detailMode&&x.person===D.detailPerson&&x.status==="pending")
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];

  if(target){
    target.status="settled";
    target.settlement=n;
  }

  D.khata.push({
    id:uid(),
    mode:D.detailMode,
    person:D.detailPerson,
    type:"receive",
    amount:n,
    date:today(),
    method:"Cash",
    status:"settled",
    note:"Payment / Settlement",
    created:Date.now()
  });

  save();
  renderKhataDetail();
}

function shareKhata(){
  const text=khataText();

  if(navigator.share){
    navigator.share({
      title:"HISAB - "+D.detailPerson,
      text
    }).catch(()=>{});
  }else{
    copyText(text);
  }
}

function khataText(){
  const data=khataData(D.detailMode)
    .filter(x=>x.person===D.detailPerson);

  let t=`HISAB - ${D.detailPerson}\n\n`;

  data.forEach(x=>{
    t+=`${x.date} | ${x.type.toUpperCase()} | ${money(x.amount)} | ${x.status}\n`;
  });

  return t;
}

function exportKhataPDF(){
  printDocument(
    "HISAB - "+D.detailPerson,
    khataText().replace(/\n/g,"<br>")
  );
}

/* =========================================================
   BUSINESS
   ========================================================= */

function businessFilter(type,btn){
  D.businessFilter=type;

  document.querySelectorAll("#business .business-tabs button")
    .forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");
  renderBusiness();
}

function renderBusiness(){
  const mode="business";
  const rows=personRows(mode);
  const type=D.businessFilter||"customer";
  const search=(val("businessSearch")||"").toLowerCase();

  $("businessGiven").textContent=money(totalGive(mode));
  $("businessReceived").textContent=money(totalReceive(mode));
  $("businessNet").textContent=
    money(totalGive(mode)-totalReceive(mode));

  if(type==="sales"||type==="purchase"){
    renderBusinessSales(type);
    return;
  }

  const role=type==="supplier"?"supplier":"customer";

  const people=rows.filter(p=>
    p.name.toLowerCase().includes(search)
  );

  $("businessList").innerHTML=
    people.map(p=>`
      <div class="list-card">
        <h3>${esc(p.name)}</h3>
        <small>${role==="customer"?"Customer":"Supplier"}</small>
        <div class="amount">
          Give ${money(p.give)} • Receive ${money(p.receive)}
        </div>
        <div class="action-row" style="margin-top:9px">
          <button onclick="openKhataDetail('${esc(p.name)}','business')">
            Khata
          </button>
          <button onclick="openKhataForm('business','${esc(p.name)}')">
            + Entry
          </button>
        </div>
      </div>
    `).join("")||
    emptyCard(
      role==="customer"?"No customers yet":"No suppliers yet",
      "Add a business Udhaar entry to create a ledger."
    );
}

function renderBusinessSales(type){
  const data=D.business.filter(x=>x.type===type);

  $("businessList").innerHTML=
    `<div class="action-row">
      <button onclick="addBusinessRecord('${type}')">
        + Add ${type==="sales"?"Sale":"Purchase"}
      </button>
    </div>`+
    (data.map(x=>`
      <div class="list-card">
        <h3>${esc(x.name)}</h3>
        <div class="amount ${type==="sales"?"receive":"give"}">
          ${money(x.amount)}
        </div>
        <div class="meta">
          ${esc(x.date)} • ${esc(x.note||"")}
        </div>
        <button onclick="deleteBusinessRecord('${x.id}')">
          Delete
        </button>
      </div>
    `).join("")||
    emptyCard("No records","Add your first business record."));
}

function addBusinessRecord(type="sales"){
  const name=prompt(
    type==="sales"?"Customer / Sale name":"Supplier / Purchase name"
  );
  if(!name)return;

  const amount=Number(prompt("Amount"));
  if(!amount||amount<=0)return alert("Invalid amount");

  const note=prompt("Note")||"";

  D.business.push({
    id:uid(),
    type,
    name:name.trim(),
    amount,
    note,
    date:today()
  });

  save();
  renderBusiness();
}

function deleteBusinessRecord(id){
  if(!confirm("Delete this record?"))return;
  D.business=D.business.filter(x=>x.id!==id);
  save();
  renderBusiness();
}

/* =========================================================
   MONEY / TRANSACTIONS
   ========================================================= */

function addTransaction(){
  const amount=num("transactionAmount");
  if(amount<=0)return alert("Enter valid amount");

  D.transactions.push({
    id:uid(),
    mode:D.mode,
    type:val("transactionType")||"expense",
    amount,
    category:val("transactionCategory")||"General",
    note:val("transactionNote"),
    date:val("transactionDate")||today()
  });

  ["transactionAmount","transactionCategory","transactionNote"]
    .forEach(id=>{if($(id))$(id).value=""});

  save();
  renderTransactions();
}

function renderTransactions(){
  const data=D.transactions
    .filter(x=>x.mode===D.mode)
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  $("transactionList").innerHTML=
    data.map(x=>`
      <div class="list-card">
        <h3 class="${x.type==="income"?"receive":"give"}">
          ${x.type==="income"?"Income":"Expense"} ${money(x.amount)}
        </h3>
        <div class="meta">
          ${esc(x.category)} • ${esc(x.date)}
        </div>
        <div class="meta">${esc(x.note||"")}</div>
        <button onclick="deleteTransaction('${x.id}')">Delete</button>
      </div>
    `).join("")||
    emptyCard("No transactions","Add your first income or expense.");
}

function deleteTransaction(id){
  if(!confirm("Delete transaction?"))return;
  D.transactions=D.transactions.filter(x=>x.id!==id);
  save();
  renderTransactions();
}

/* =========================================================
   PLANNING
   ========================================================= */

function calcBudget(){
  const amount=num("budgetAmount");
  if(amount<=0)return alert("Enter budget amount");

  D.budget=amount;
  save();
  renderPlanning();
  alert("Budget saved");
}

function calcGoal(){
  const name=val("goalName");
  const target=num("goalTarget");
  const saved=num("goalSaved");

  if(!name||target<=0)return alert("Enter goal name and target");

  D.goals.push({
    id:uid(),
    name,
    target,
    saved,
    date:val("goalDate")
  });

  save();
  renderPlanning();

  $("goalName").value="";
  $("goalTarget").value="";
  $("goalSaved").value="";
  $("goalDate").value="";
}

function renderPlanning(){
  if($("budgetAmount"))
    $("budgetAmount").value=D.budget||"";

  $("goalList").innerHTML=
    `<div class="list-card">
      <h3>Monthly Budget</h3>
      <div class="amount">${money(D.budget)}</div>
    </div>`+
    (D.goals.map(g=>{
      const percent=Math.min(
        100,
        Math.round((Number(g.saved)/Number(g.target))*100)
      );

      return `
      <div class="list-card">
        <h3>${esc(g.name)}</h3>
        <div class="amount">${money(g.saved)} / ${money(g.target)}</div>
        <div class="meta">${percent}% complete ${
          g.date?`• ${esc(g.date)}`:""
        }</div>
        <button onclick="deleteGoal('${g.id}')">Delete</button>
      </div>`;
    }).join("")||
    emptyCard("No goals","Create a savings goal."));
}

function deleteGoal(id){
  D.goals=D.goals.filter(x=>x.id!==id);
  save();
  renderPlanning();
}

/* =========================================================
   PAYMENTS — SEPARATE BILL / CARD / LOAN / EMI
   ========================================================= */

function renderPayments(){
  $("billList").innerHTML=`
    <div class="list-card">
      <h3>🧾 Bills</h3>
      <small>Electricity, mobile, rent and other bills</small>
      ${D.bills.filter(x=>x.kind==="bill").map(paymentCard).join("")}
    </div>

    <div class="list-card">
      <h3>💳 Credit Cards</h3>
      <small>Card bills and due dates</small>
      ${D.bills.filter(x=>x.kind==="card").map(paymentCard).join("")}
    </div>

    <div class="list-card">
      <h3>🏦 Loans</h3>
      <small>Loan details and outstanding amount</small>
      ${D.loans.map(loanCard).join("")}
    </div>

    <div class="list-card">
      <h3>📅 EMI</h3>
      <small>Monthly EMI calculations</small>
      ${D.emis.map(emiCard).join("")}
    </div>
  `;
}

function paymentCard(x){
  return `
    <div class="list-card" style="margin-top:9px">
      <h4>${esc(x.name)}</h4>
      <div class="amount">${money(x.amount)}</div>
      <div class="meta">Due: ${esc(x.due||"-")}</div>
      <button onclick="deleteBill('${x.id}')">Delete</button>
    </div>`;
}

function loanCard(x){
  return `
    <div class="list-card" style="margin-top:9px">
      <h4>${esc(x.name)}</h4>
      <div class="amount">${money(x.amount)}</div>
      <div class="meta">
        Rate ${x.rate}% • ${x.months} months
      </div>
      <button onclick="deleteLoan('${x.id}')">Delete</button>
    </div>`;
}

function emiCard(x){
  return `
    <div class="list-card" style="margin-top:9px">
      <h4>EMI ${money(x.emi)}</h4>
      <div class="meta">
        Principal ${money(x.principal)} •
        ${x.rate}% • ${x.months} months
      </div>
      <button onclick="deleteEMI('${x.id}')">Delete</button>
    </div>`;
}

function addBill(kind){
  let name,amount,due;

  if(kind==="Credit Card"){
    amount=num("cardBill");
    due=val("cardDue");
    name="Credit Card";
  }else{
    name=val("billName");
    amount=num("billAmount");
    due=val("billDue");
  }

  if(!name||amount<=0)return alert("Enter valid bill details");

  D.bills.push({
    id:uid(),
    kind:kind==="Credit Card"?"card":"bill",
    name,
    amount,
    due
  });

  save();
  renderPayments();
}

function deleteBill(id){
  D.bills=D.bills.filter(x=>x.id!==id);
  save();
  renderPayments();
}

function calcEMI(){
  const p=num("emiPrincipal");
  const rate=num("emiRate");
  const months=num("emiMonths");

  if(p<=0||months<=0)return alert("Enter valid loan details");

  const r=rate/12/100;
  const emi=r
    ?p*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1)
    :p/months;

  const record={
    id:uid(),
    principal:p,
    rate,
    months,
    emi
  };

  D.emis.push(record);
  save();

  $("emiResult").innerHTML=
    `<div class="list-card">
      <h3>Monthly EMI: ${money(emi)}</h3>
      <small>Total payment: ${money(emi*months)}</small>
    </div>`;

  renderPayments();
}

function deleteEMI(id){
  D.emis=D.emis.filter(x=>x.id!==id);
  save();
  renderPayments();
}

function saveLoan(){
  const name=prompt("Loan name");
  if(!name)return;

  const amount=Number(prompt("Loan amount"));
  const rate=Number(prompt("Interest %"));
  const months=Number(prompt("Tenure months"));

  if(!amount||!months)return alert("Invalid loan");

  D.loans.push({
    id:uid(),
    name,
    amount,
    rate,
    months
  });

  save();
  renderPayments();
}

function deleteLoan(id){
  D.loans=D.loans.filter(x=>x.id!==id);
  save();
  renderPayments();
}

/* =========================================================
   REMINDERS
   ========================================================= */

function addReminder(){
  const name=val("reminderName");
  const date=val("reminderDate");

  if(!name||!date)return alert("Enter reminder and date");

  D.reminders.push({
    id:uid(),
    name,
    date
  });

  save();
  renderReminders();

  $("reminderName").value="";
  $("reminderDate").value="";
}

function renderReminders(){
  const data=[...D.reminders]
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));

  $("reminderList").innerHTML=
    data.map(x=>`
      <div class="list-card">
        <h3>${esc(x.name)}</h3>
        <div class="meta">${esc(x.date)}</div>
        <button onclick="deleteReminder('${x.id}')">Delete</button>
      </div>
    `).join("")||
    emptyCard("No reminders","Add bills or important dates.");
}

function deleteReminder(id){
  D.reminders=D.reminders.filter(x=>x.id!==id);
  save();
  renderReminders();
}

/* =========================================================
   REPORTS
   ========================================================= */

function totalMoney(type,mode){
  return D.transactions
    .filter(x=>x.mode===mode&&x.type===type)
    .reduce((a,x)=>a+Number(x.amount),0);
}

function renderReports(){
  const income=totalMoney("income",D.mode);
  const expense=totalMoney("expense",D.mode);
  const give=totalGive(D.mode);
  const receive=totalReceive(D.mode);

  $("reportIncome").textContent=money(income);
  $("reportExpense").textContent=money(expense);
  $("reportGive").textContent=money(give);
  $("reportReceive").textContent=money(receive);

  $("reportContent").innerHTML=`
    <h3>${D.mode==="business"?"Business":"Personal"} Overview</h3>
    <p style="margin-top:10px">
      Balance: <b>${money(income-expense)}</b>
    </p>
    <p style="margin-top:8px">
      Udhaar Balance: <b>${money(give-receive)}</b>
    </p>
    ${
      D.mode==="business"
      ?`
      <hr>
      <p>Sales:
        <b>${money(
          D.business.filter(x=>x.type==="sales")
          .reduce((a,x)=>a+Number(x.amount),0)
        )}</b>
      </p>
      <p style="margin-top:8px">Purchase:
        <b>${money(
          D.business.filter(x=>x.type==="purchase")
          .reduce((a,x)=>a+Number(x.amount),0)
        )}</b>
      </p>`
      :""
    }
  `;
}

function exportSummary(){
  const text=summaryText();

  if(navigator.share){
    navigator.share({
      title:"HISAB Summary",
      text
    }).catch(()=>{});
  }else{
    copyText(text);
  }
}

function summaryText(){
  return `HISAB SUMMARY

Mode: ${D.mode}
Income: ${money(totalMoney("income",D.mode))}
Expense: ${money(totalMoney("expense",D.mode))}
Give: ${money(totalGive(D.mode))}
Receive: ${money(totalReceive(D.mode))}
Balance: ${money(
  totalMoney("income",D.mode)-totalMoney("expense",D.mode)
)}`;
}

function exportSummaryPDF(){
  printDocument(
    "HISAB Summary",
    summaryText().replace(/\n/g,"<br>")
  );
}

/* =========================================================
   BACKUP / RESTORE
   ========================================================= */

function exportBackup(){
  const blob=new Blob(
    [JSON.stringify(D,null,2)],
    {type:"application/json"}
  );

  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="HISAB-Backup-"+today()+".json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importBackup(event){
  const file=event.target.files?.[0];
  if(!file)return;

  const reader=new FileReader();

  reader.onload=()=>{
    try{
      const x=JSON.parse(reader.result);

      if(!x||typeof x!=="object")
        throw new Error();

      D={...D,...x};
      save();
      alert("Backup restored successfully");
      show("home");
    }catch(e){
      alert("Invalid HISAB backup");
    }
  };

  reader.readAsText(file);
}

/* =========================================================
   SECURITY
   ========================================================= */

function setPin(){
  const p=val("pinInput");

  if(!/^\d{4,6}$/.test(p))
    return alert("PIN must be 4 to 6 digits");

  D.pin=p;
  save();
  $("pinInput").value="";
  alert("PIN saved");
}

function lockApp(){
  if(!D.pin)return alert("First set a PIN");

  const p=prompt("Enter PIN to lock/continue");

  if(p!==D.pin)return alert("Wrong PIN");

  showGuestGate();
}

/* =========================================================
   FAMILY
   ========================================================= */

function addFamilyMember(){
  const name=val("familyName");
  if(!name)return alert("Enter member name");

  D.family.push({
    id:uid(),
    name
  });

  save();
  renderFamily();
  $("familyName").value="";
}

function renderFamily(){
  $("familyList").innerHTML=
    D.family.map(x=>`
      <div class="list-card">
        <h3>${esc(x.name)}</h3>
        <button onclick="deleteFamily('${x.id}')">Delete</button>
      </div>
    `).join("")||
    emptyCard("No family members","Add a family member.");
}

function deleteFamily(id){
  D.family=D.family.filter(x=>x.id!==id);
  save();
  renderFamily();
}

/* =========================================================
   EXTRA TOOLS
   ========================================================= */

function addTool(type){
  D.tools.push({
    id:uid(),
    type,
    date:today()
  });
  save();
  alert(type+" added");
}

function addInsurance(){addTool("Insurance");}
function addSchool(){addTool("School");}
function addVehicle(){addTool("Vehicle");}
function addShopping(){addTool("Shopping");}
function addUtility(){addTool("Utility");}
function addDoc(){addTool("Document");}
function addAnnual(){addTool("Annual Planning");}

function calcEmergency(){
  const monthly=Number(prompt("Monthly essential expense")||0);
  const months=Number(prompt("How many months?")||6);

  if(monthly<=0)return;

  alert(
    "Emergency Fund Target: "+
    money(monthly*months)
  );
}

function calcFD(){
  const p=Number($("fdPrincipal")?.value||prompt("Principal")||0);
  const rate=Number($("fdRate")?.value||prompt("Interest %")||0);
  const months=Number($("fdN")?.value||prompt("Months")||0);

  if(p<=0||months<=0)return alert("Enter valid FD details");

  const interest=p*rate*(months/12)/100;
  const maturity=p+interest;

  if($("fdResult")){
    $("fdResult").innerHTML=`
      <div class="list-card">
        <h3>Maturity: ${money(maturity)}</h3>
        <small>Interest: ${money(interest)}</small>
      </div>`;
  }else{
    alert("Maturity: "+money(maturity));
  }
}

function renderTools(){
  /* Extra tools remain available from fixed HTML.
     Stored tool entries are shown below calculator. */
}

/* =========================================================
   SEARCH EVERYTHING
   ========================================================= */

function searchAllData(q){
  q=(q||"").toLowerCase().trim();

  if(!q){
    $("searchResults").innerHTML="";
    return;
  }

  const result=[];

  D.transactions.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(q))
      result.push(
        `<div class="list-card">
          <b>Transaction</b><br>
          ${esc(x.category)} • ${money(x.amount)}
        </div>`
      );
  });

  D.khata.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(q))
      result.push(
        `<div class="list-card">
          <b>Udhaar</b><br>
          ${esc(x.person)} • ${x.type} • ${money(x.amount)}
        </div>`
      );
  });

  D.business.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(q))
      result.push(
        `<div class="list-card">
          <b>Business</b><br>
          ${esc(x.name)} • ${money(x.amount)}
        </div>`
      );
  });

  $("searchResults").innerHTML=
    result.join("")||
    emptyCard("Nothing found","Try another search.");
}

/* =========================================================
   PRIVACY / SETTINGS
   ========================================================= */

function renderPrivacy(){
  if($("pinInput"))$("pinInput").value="";
}

/* =========================================================
   PRINT / PDF FALLBACK
   ========================================================= */

function printDocument(title,body){
  const w=window.open("","_blank");

  if(!w){
    return alert(
      "Print window blocked. Browser permission allow karke retry karein."
    );
  }

  w.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>${esc(title)}</title>
      <meta name="viewport" content="width=device-width">
      <style>
        body{
          font-family:Arial;
          padding:25px;
          line-height:1.6;
        }
        h1{margin-bottom:20px}
      </style>
    </head>
    <body>
      <h1>${esc(title)}</h1>
      <div>${body}</div>
      <script>
        window.onload=function(){window.print();}
      <\/script>
    </body>
    </html>
  `);

  w.document.close();
}

function copyText(text){
  if(navigator.clipboard){
    navigator.clipboard.writeText(text)
      .then(()=>alert("Copied"));
  }else{
    prompt("Copy this:",text);
  }
}

/* =========================================================
   MISC
   ========================================================= */

function showPaymentSection(section){
  renderPayments();
}

function openQuickAdd(){
  const choice=prompt(
    "Quick Add:\n"+
    "1 = Income\n"+
    "2 = Expense\n"+
    "3 = Udhaar Give\n"+
    "4 = Udhaar Receive\n"+
    "5 = Reminder"
  );

  if(choice==="1"||choice==="2"){
    show("transactions");
    $("transactionType").value=
      choice==="1"?"income":"expense";
  }

  if(choice==="3"||choice==="4"){
    openKhataForm(D.mode);
    $("khataType").value=
      choice==="3"?"give":"receive";
  }

  if(choice==="5")show("reminders");
}

/* =========================================================
   STARTUP
   ========================================================= */

load();

document.addEventListener("DOMContentLoaded",()=>{
  if(!$("guestGate")||!$("appShell"))return;

  if(!$("khataDate").value)
    $("khataDate").value=today();

  if(!$("transactionDate").value)
    $("transactionDate").value=today();

  showGuestGate();
  fixHomeButtons();
});
