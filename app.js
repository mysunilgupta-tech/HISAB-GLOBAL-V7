/* =========================================================
   HISAB GLOBAL V7 — COMPLETE APP.JS
   Compatible with fixed HISAB V7 index.html
========================================================= */

const KEY = "hisab_v7_data";

const today = () => new Date().toISOString().slice(0,10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

let D = {
  mode: "personal",
  currency: "₹",
  language: "en",
  transactions: [],
  khata: [],
  business: [],
  goals: [],
  bills: [],
  reminders: [],
  family: [],
  budget: {},
  pin: "",
  emi: [],
  tools: []
};

let currentPerson = "";
let currentMode = "personal";
let khataFilter = "all";
let detailFilterMode = "all";
let bizFilter = "customer";
let editingKhataId = null;

/* =========================
   STORAGE
========================= */

function loadData(){
  try{
    const old = JSON.parse(localStorage.getItem(KEY) || "null");
    if(old && typeof old === "object") D = {...D,...old};
  }catch(e){ console.log(e); }

  [
    "transactions","khata","business","goals",
    "bills","reminders","family","emi","tools"
  ].forEach(k=>{
    if(!Array.isArray(D[k])) D[k]=[];
  });

  if(!D.budget || typeof D.budget !== "object") D.budget={};
  if(!D.mode) D.mode="personal";
  if(!D.currency) D.currency="₹";
  if(!D.language) D.language="en";
}

function saveData(){
  localStorage.setItem(KEY,JSON.stringify(D));
}

function toast(msg){
  alert(msg);
}

function money(n){
  n = Number(n)||0;
  return D.currency + n.toLocaleString("en-IN",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
}

function esc(v){
  return String(v ?? "").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#039;"
  }[m]));
}

/* =========================
   SCREEN / NAVIGATION
========================= */

function hidePages(){
  document.querySelectorAll(".page").forEach(p=>{
    p.style.display="none";
  });
}

function show(id){
  hidePages();
  const p=document.getElementById(id);
  if(p) p.style.display="block";

  if(id==="home") renderHome();
  if(id==="personal") renderPersonal();
  if(id==="business") renderBusiness();
  if(id==="transactions") renderTransactions();
  if(id==="planning") renderPlanning();
  if(id==="credit") renderBills();
  if(id==="reports") renderReports();
  if(id==="reminders") renderReminders();
  if(id==="privacy") renderPrivacy();
  if(id==="family") renderFamily();
  if(id==="final") searchAllData(
    document.getElementById("searchAll")?.value || ""
  );
}

function showGuestGate(){
  const gate=document.getElementById("guestGate");
  const shell=document.getElementById("appShell");
  if(gate) gate.style.display="flex";
  if(shell) shell.style.display="none";
  hidePages();
}

function enterGuestMode(){
  const gate=document.getElementById("guestGate");
  const shell=document.getElementById("appShell");

  if(gate) gate.style.display="none";
  if(shell) shell.style.display="block";

  D.mode="personal";
  currentMode="personal";
  saveData();
  show("welcome");
}

function setMode(mode){
  if(mode!=="personal" && mode!=="business") mode="personal";

  D.mode=mode;
  currentMode=mode;
  saveData();

  const label=document.getElementById("modeLabel");
  if(label) label.textContent=mode==="business"?"Business":"Personal";

  show("home");
}

/* =========================
   LANGUAGE / CURRENCY
========================= */

function toggleLanguage(){
  D.language=D.language==="en"?"hi":"en";
  saveData();

  const hi=D.language==="hi";
  document.documentElement.lang=hi?"hi":"en";

  const texts={
    "Dashboard":hi?"डैशबोर्ड":"Dashboard",
    "Personal Money":hi?"पर्सनल मनी":"Personal Money",
    "Business":hi?"बिज़नेस":"Business",
    "Transactions":hi?"लेन-देन":"Transactions",
    "Planning":hi?"प्लानिंग":"Planning",
    "Payments":hi?"पेमेंट्स":"Payments",
    "Reports & Analytics":hi?"रिपोर्ट्स और एनालिटिक्स":"Reports & Analytics",
    "Reminders":hi?"रिमाइंडर":"Reminders",
    "Security & Backup":hi?"सिक्योरिटी और बैकअप":"Security & Backup",
    "Settings":hi?"सेटिंग्स":"Settings"
  };

  document.querySelectorAll("h2").forEach(el=>{
    const t=el.textContent.trim();
    if(texts[t]) el.textContent=texts[t];
  });

  toast(hi?"भाषा: हिन्दी":"Language: English");
}

function toggleCurrency(){
  const currencies=["₹","$","€","£","AED","SAR"];
  let i=currencies.indexOf(D.currency);
  D.currency=currencies[(i+1)%currencies.length];
  saveData();
  renderAll();
  toast("Currency: "+D.currency);
}

/* =========================
   TOTALS
========================= */

function totalIncome(mode=D.mode){
  return D.transactions
    .filter(x=>(x.mode||"personal")===mode && x.type==="income")
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function totalExpense(mode=D.mode){
  return D.transactions
    .filter(x=>(x.mode||"personal")===mode && x.type==="expense")
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function modeKhata(mode){
  return D.khata.filter(x=>(x.mode||"personal")===mode);
}

function totalGiven(mode=D.mode){
  return modeKhata(mode)
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function totalReceived(mode=D.mode){
  return modeKhata(mode)
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function balance(mode=D.mode){
  return totalIncome(mode)-totalExpense(mode)
    -totalGiven(mode)+totalReceived(mode);
}

/* =========================
   HOME
========================= */

function renderHome(){
  const mode=D.mode;

  setText("modeLabel",mode==="business"?"Business":"Personal");
  setText("receivable",money(totalGiven(mode)));
  setText("payable",money(totalReceived(mode)));
  setText("homeBalance",money(balance(mode)));
}

/* =========================
   KHATA / UDHAAR
========================= */

function openKhataForm(mode="personal",id=null){
  currentMode=mode;
  editingKhataId=id;

  show("khataEntry");

  const x=id ? D.khata.find(a=>a.id===id) : null;

  setVal("khataPerson",x?.person||"");
  setVal("khataType",x?.type||"give");
  setVal("khataAmount",x?.amount||"");
  setVal("khataDate",x?.date||today());
  setVal("khataMethod",x?.method||"Cash");
  setVal("khataStatus",x?.status||"pending");
  setVal("khataNote",x?.note||"");
}

function closeKhataForm(){
  editingKhataId=null;
  show(currentMode==="business"?"business":"personal");
}

function saveKhataEntry(){
  const person=document.getElementById("khataPerson")?.value.trim();
  const type=document.getElementById("khataType")?.value;
  const amount=Number(document.getElementById("khataAmount")?.value);
  const date=document.getElementById("khataDate")?.value||today();
  const method=document.getElementById("khataMethod")?.value||"Cash";
  const status=document.getElementById("khataStatus")?.value||"pending";
  const note=document.getElementById("khataNote")?.value.trim();

  if(!person) return toast("Person / Customer name required");
  if(!(amount>0)) return toast("Enter a valid amount");

  if(editingKhataId){
    const x=D.khata.find(a=>a.id===editingKhataId);
    if(x){
      Object.assign(x,{
        person,type,amount,date,method,status,note,
        mode:currentMode
      });
    }
  }else{
    D.khata.push({
      id:uid(),
      person,type,amount,date,method,status,note,
      mode:currentMode,
      role:currentMode==="business" ?
        (bizFilter==="supplier"?"supplier":"customer")
        : "personal",
      created:Date.now()
    });
  }

  saveData();
  editingKhataId=null;
  currentPerson=person;

  toast("Entry saved");
  show(currentMode==="business"?"business":"personal");
}

function renderPersonal(){
  const data=filteredKhata("personal");

  setText("ledgerGiven",money(totalGiven("personal")));
  setText("ledgerReceived",money(totalReceived("personal")));
  setText("ledgerNet",
    money(totalGiven("personal")-totalReceived("personal"))
  );

  renderKhataList("personalList",data);
}

function renderKhataList(id,data){
  const el=document.getElementById(id);
  if(!el) return;

  if(!data.length){
    el.innerHTML="<div class='empty'>No entries yet</div>";
    return;
  }

  el.innerHTML=data.map(x=>`
    <div class="list-card" data-id="${esc(x.id)}">
      <div>
        <strong>${esc(x.person)}</strong>
        <small>${esc(x.date)} • ${esc(x.method)}</small>
        ${x.note?`<small>${esc(x.note)}</small>`:""}
      </div>
      <div>
        <strong style="color:${x.type==="give"?"#c62828":"#168447"}">
          ${x.type==="give"?"Give":"Receive"} ${money(x.amount)}
        </strong>
        <small>${esc(x.status)}</small>
      </div>
      <div class="action-row">
        <button onclick="openKhataForm('${esc(x.mode||'personal')}','${esc(x.id)}')">Edit</button>
        <button onclick="settleKhata('${esc(x.id)}')">
          ${x.status==="settled"?"Pending":"Settle"}
        </button>
        <button onclick="deleteKhata('${esc(x.id)}')">Delete</button>
        <button onclick="openKhataDetail('${esc(x.person)}','${esc(x.mode||'personal')}')">History</button>
      </div>
    </div>
  `).join("");
}

function filteredKhata(mode){
  let arr=modeKhata(mode);

  const q=document.getElementById(
    mode==="business"?"businessSearch":"personalSearch"
  )?.value.toLowerCase().trim();

  if(q) arr=arr.filter(x=>
    [x.person,x.note,x.method,x.status,x.role]
      .join(" ").toLowerCase().includes(q)
  );

  if(mode==="personal"){
    if(khataFilter==="give") arr=arr.filter(x=>x.type==="give");
    if(khataFilter==="receive") arr=arr.filter(x=>x.type==="receive");
    if(khataFilter==="pending") arr=arr.filter(x=>x.status==="pending");
  }

  return arr.sort((a,b)=>
    String(b.date).localeCompare(String(a.date))
  );
}

function filterKhata(mode,type){
  khataFilter=type;
  renderPersonal();
}

function searchKhata(mode){
  if(mode==="personal") renderPersonal();
  else renderBusiness();
}

function settleKhata(id){
  const x=D.khata.find(a=>a.id===id);
  if(!x) return;

  x.status=x.status==="settled"?"pending":"settled";
  saveData();
  renderAll();
}

function deleteKhata(id){
  if(!confirm("Delete this entry?")) return;
  D.khata=D.khata.filter(x=>x.id!==id);
  saveData();
  renderAll();
}

/* =========================
   KHATA DETAIL
========================= */

function openKhataDetail(person,mode="personal"){
  currentPerson=person;
  currentMode=mode;
  detailFilterMode="all";
  show("khataDetail");
  renderKhataDetail();
}

function closeKhataDetail(){
  show(currentMode==="business"?"business":"personal");
}

function detailFilter(type){
  detailFilterMode=type;
  renderKhataDetail();
}

function renderKhataDetail(){
  const arr=modeKhata(currentMode)
    .filter(x=>x.person===currentPerson);

  const give=arr.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=arr.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  setText("detailPersonName",currentPerson||"Khata");
  setText("detailGive",money(give));
  setText("detailReceive",money(receive));
  setText("detailBalance",money(give-receive));

  let list=arr;

  if(detailFilterMode==="give")
    list=list.filter(x=>x.type==="give");
  if(detailFilterMode==="receive")
    list=list.filter(x=>x.type==="receive");
  if(detailFilterMode==="pending")
    list=list.filter(x=>x.status==="pending");

  renderKhataList("khataHistory",list);
}

function openPaymentEntry(){
  openKhataForm(currentMode);
  setVal("khataPerson",currentPerson);
  setVal("khataType","receive");
  setVal("khataStatus","settled");
}

function shareKhata(){
  const arr=modeKhata(currentMode)
    .filter(x=>x.person===currentPerson);

  const text=[
    "HISAB - Udhaar",
    "Person: "+currentPerson,
    "",
    ...arr.map(x=>
      `${x.date} | ${x.type.toUpperCase()} | ${money(x.amount)} | ${x.status}`
    )
  ].join("\n");

  shareText("HISAB Udhaar - "+currentPerson,text);
}

function exportKhataPDF(){
  const arr=modeKhata(currentMode)
    .filter(x=>x.person===currentPerson);

  const html=`
    <h1>HISAB - Udhaar</h1>
    <h2>${esc(currentPerson)}</h2>
    ${arr.map(x=>`
      <p>
      ${esc(x.date)} -
      <b>${esc(x.type)}</b> -
      ${money(x.amount)} -
      ${esc(x.status)}
      </p>
    `).join("")}
  `;

  printPDF("HISAB Udhaar - "+currentPerson,html);
}

/* =========================
   BUSINESS
========================= */

function businessFilter(type){
  bizFilter=type;
  renderBusiness();
}

function renderBusiness(){
  let arr=modeKhata("business");

  if(bizFilter==="customer")
    arr=arr.filter(x=>x.role!=="supplier");

  if(bizFilter==="supplier")
    arr=arr.filter(x=>x.role==="supplier");

  if(bizFilter==="sales")
    arr=D.business.filter(x=>x.type==="sales");

  if(bizFilter==="purchase")
    arr=D.business.filter(x=>x.type==="purchase");

  const q=document.getElementById("businessSearch")?.value
    .toLowerCase().trim();

  if(q){
    arr=arr.filter(x=>
      JSON.stringify(x).toLowerCase().includes(q)
    );
  }

  setText("businessGiven",money(totalGiven("business")));
  setText("businessReceived",money(totalReceived("business")));
  setText("businessNet",
    money(totalGiven("business")-totalReceived("business"))
  );

  const el=document.getElementById("businessList");
  if(!el) return;

  let top="";

  if(bizFilter==="sales" || bizFilter==="purchase"){
    top=`
      <div class="action-row">
        <button onclick="addBusinessRecord('${bizFilter}')">
          ➕ Add ${bizFilter==="sales"?"Sale":"Purchase"}
        </button>
      </div>
    `;
  }

  if(!arr.length){
    el.innerHTML=top+"<div class='empty'>No business records</div>";
    return;
  }

  el.innerHTML=top+arr.map(x=>{
    if(x.type==="sales" || x.type==="purchase"){
      return `
      <div class="list-card">
        <div>
          <strong>${esc(x.name)}</strong>
          <small>${esc(x.date)} • ${esc(x.note||"")}</small>
        </div>
        <strong>${money(x.amount)}</strong>
        <div class="action-row">
          <button onclick="deleteBusinessRecord('${esc(x.id)}')">Delete</button>
        </div>
      </div>`;
    }

    return `
      <div class="list-card">
        <div>
          <strong>${esc(x.person)}</strong>
          <small>${esc(x.role||"customer")} • ${esc(x.date)}</small>
        </div>
        <strong style="color:${x.type==="give"?"#c62828":"#168447"}">
          ${esc(x.type)} ${money(x.amount)}
        </strong>
        <div class="action-row">
          <button onclick="openKhataForm('business','${esc(x.id)}')">Edit</button>
          <button onclick="deleteKhata('${esc(x.id)}')">Delete</button>
          <button onclick="openKhataDetail('${esc(x.person)}','business')">History</button>
        </div>
      </div>
    `;
  }).join("");
}

function addBusinessRecord(type){
  const name=prompt(
    type==="sales"?"Customer / Sale name":"Supplier / Purchase name"
  );
  if(!name) return;

  const amount=Number(prompt("Amount"));
  if(!(amount>0)) return toast("Invalid amount");

  const note=prompt("Note")||"";

  D.business.push({
    id:uid(),
    type,
    name,
    amount,
    note,
    date:today(),
    mode:"business"
  });

  saveData();
  renderBusiness();
}

function deleteBusinessRecord(id){
  if(!confirm("Delete this record?")) return;
  D.business=D.business.filter(x=>x.id!==id);
  saveData();
  renderBusiness();
}

/* =========================
   TRANSACTIONS
========================= */

function addTransaction(){
  const type=document.getElementById("transactionType")?.value;
  const amount=Number(document.getElementById("transactionAmount")?.value);
  const category=document.getElementById("transactionCategory")?.value.trim();
  const note=document.getElementById("transactionNote")?.value.trim();
  const date=document.getElementById("transactionDate")?.value||today();

  if(!(amount>0)) return toast("Enter valid amount");

  D.transactions.push({
    id:uid(),
    mode:D.mode,
    type,
    amount,
    category:category||"General",
    note,
    date
  });

  saveData();

  setVal("transactionAmount","");
  setVal("transactionCategory","");
  setVal("transactionNote","");

  renderTransactions();
  toast("Transaction added");
}

function renderTransactions(){
  const el=document.getElementById("transactionList");
  if(!el) return;

  const arr=D.transactions
    .filter(x=>(x.mode||"personal")===D.mode)
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  if(!arr.length){
    el.innerHTML="<div class='empty'>No transactions</div>";
    return;
  }

  el.innerHTML=arr.map(x=>`
    <div class="list-card">
      <div>
        <strong>${esc(x.category)}</strong>
        <small>${esc(x.date)} ${x.note?"• "+esc(x.note):""}</small>
      </div>
      <strong style="color:${x.type==="income"?"#168447":"#c62828"}">
        ${x.type==="income"?"+":"-"}${money(x.amount)}
      </strong>
      <button onclick="deleteTransaction('${esc(x.id)}')">Delete</button>
    </div>
  `).join("");
}

function deleteTransaction(id){
  if(!confirm("Delete transaction?")) return;
  D.transactions=D.transactions.filter(x=>x.id!==id);
  saveData();
  renderTransactions();
  renderHome();
}

/* =========================
   BUDGET / GOALS
========================= */

function calcBudget(){
  const amount=Number(document.getElementById("budgetAmount")?.value);
  if(!(amount>=0)) return toast("Enter budget");

  const month=today().slice(0,7);

  D.budget[D.mode+"_"+month]=amount;
  saveData();

  renderPlanning();
  toast("Budget saved");
}

function calcGoal(){
  const name=document.getElementById("goalName")?.value.trim();
  const target=Number(document.getElementById("goalTarget")?.value);
  const saved=Number(document.getElementById("goalSaved")?.value)||0;
  const date=document.getElementById("goalDate")?.value||"";

  if(!name) return toast("Goal name required");
  if(!(target>0)) return toast("Enter target amount");
  if(saved<0) return toast("Invalid saved amount");

  D.goals.push({
    id:uid(),
    mode:D.mode,
    name,target,saved,date
  });

  saveData();

  setVal("goalName","");
  setVal("goalTarget","");
  setVal("goalSaved","");
  setVal("goalDate","");

  renderPlanning();
  toast("Goal saved");
}

function renderPlanning(){
  const month=today().slice(0,7);
  const budget=Number(D.budget[D.mode+"_"+month]||0);
  const expense=totalExpense(D.mode);

  setVal("budgetAmount",budget||"");

  const el=document.getElementById("goalList");
  if(!el) return;

  const goals=D.goals.filter(x=>(x.mode||"personal")===D.mode);

  let budgetHTML=`
    <div class="list-card">
      <div>
        <strong>Monthly Budget</strong>
        <small>Used ${money(expense)} / ${money(budget)}</small>
      </div>
      <strong>${budget>0?Math.max(0,budget-expense).toFixed(2):"—"}</strong>
    </div>
  `;

  el.innerHTML=budgetHTML+goals.map(x=>{
    const pct=Math.min(100,Math.round((x.saved/x.target)*100));
    return `
      <div class="list-card">
        <div>
          <strong>${esc(x.name)}</strong>
          <small>${money(x.saved)} / ${money(x.target)} ${x.date?"• "+esc(x.date):""}</small>
        </div>
        <strong>${pct}%</strong>
        <button onclick="deleteGoal('${esc(x.id)}')">Delete</button>
      </div>
    `;
  }).join("");
}

function deleteGoal(id){
  if(!confirm("Delete goal?")) return;
  D.goals=D.goals.filter(x=>x.id!==id);
  saveData();
  renderPlanning();
}

/* =========================
   BILLS / CREDIT / EMI
========================= */

function addBill(kind){
  let name,amount,due;

  if(kind==="Credit Card"){
    name="Credit Card";
    amount=Number(document.getElementById("cardBill")?.value);
    due=document.getElementById("cardDue")?.value||today();
  }else{
    name=document.getElementById("billName")?.value.trim();
    amount=Number(document.getElementById("billAmount")?.value);
    due=document.getElementById("billDue")?.value||today();
  }

  if(!name) return toast("Bill name required");
  if(!(amount>0)) return toast("Enter valid amount");

  D.bills.push({
    id:uid(),
    mode:D.mode,
    kind,
    name,
    amount,
    due,
    status:"pending"
  });

  saveData();

  setVal("billName","");
  setVal("billAmount","");
  setVal("billDue","");
  setVal("cardBill","");
  setVal("cardDue","");

  renderBills();
  toast("Bill added");
}

function renderBills(){
  const el=document.getElementById("billList");
  if(!el) return;

  const arr=D.bills.filter(x=>(x.mode||"personal")===D.mode);

  el.innerHTML=arr.length?arr.map(x=>`
    <div class="list-card">
      <div>
        <strong>${esc(x.name)}</strong>
        <small>${esc(x.kind)} • Due ${esc(x.due)}</small>
      </div>
      <strong>${money(x.amount)}</strong>
      <div class="action-row">
        <button onclick="toggleBill('${esc(x.id)}')">
          ${x.status==="paid"?"Pending":"Paid"}
        </button>
        <button onclick="deleteBill('${esc(x.id)}')">Delete</button>
      </div>
    </div>
  `).join(""):"<div class='empty'>No bills</div>";
}

function toggleBill(id){
  const x=D.bills.find(a=>a.id===id);
  if(!x) return;
  x.status=x.status==="paid"?"pending":"paid";
  saveData();
  renderBills();
}

function deleteBill(id){
  if(!confirm("Delete bill?")) return;
  D.bills=D.bills.filter(x=>x.id!==id);
  saveData();
  renderBills();
}

function calcEMI(){
  const p=Number(document.getElementById("emiPrincipal")?.value);
  const rate=Number(document.getElementById("emiRate")?.value)||0;
  const n=Number(document.getElementById("emiMonths")?.value);

  if(!(p>0) || !(n>0))
    return toast("Enter loan amount and tenure");

  const r=rate/12/100;
  const emi=r===0?p/n:(p*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
  const total=emi*n;
  const interest=total-p;

  const html=`
    <div class="summary-card">
      <small>Monthly EMI</small>
      <strong>${money(emi)}</strong>
      <small>Total Interest: ${money(interest)}</small>
      <small>Total Payment: ${money(total)}</small>
    </div>
  `;

  const el=document.getElementById("emiResult");
  if(el) el.innerHTML=html;

  D.emi.push({
    id:uid(),mode:D.mode,
    principal:p,rate,months:n,emi,
    created:today()
  });

  saveData();
}

/* =========================
   REMINDERS
========================= */

function addReminder(){
  const name=document.getElementById("reminderName")?.value.trim();
  const date=document.getElementById("reminderDate")?.value||today();

  if(!name) return toast("Reminder required");

  D.reminders.push({
    id:uid(),
    mode:D.mode,
    name,date,
    done:false
  });

  saveData();

  setVal("reminderName","");
  setVal("reminderDate","");

  renderReminders();
}

function renderReminders(){
  const el=document.getElementById("reminderList");
  if(!el) return;

  const arr=D.reminders
    .filter(x=>(x.mode||"personal")===D.mode)
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));

  el.innerHTML=arr.length?arr.map(x=>`
    <div class="list-card">
      <div>
        <strong>${esc(x.name)}</strong>
        <small>${esc(x.date)}</small>
      </div>
      <button onclick="toggleReminder('${esc(x.id)}')">
        ${x.done?"Done":"Pending"}
      </button>
      <button onclick="deleteReminder('${esc(x.id)}')">Delete</button>
    </div>
  `).join(""):"<div class='empty'>No reminders</div>";
}

function toggleReminder(id){
  const x=D.reminders.find(a=>a.id===id);
  if(!x) return;
  x.done=!x.done;
  saveData();
  renderReminders();
}

function deleteReminder(id){
  D.reminders=D.reminders.filter(x=>x.id!==id);
  saveData();
  renderReminders();
}

/* =========================
   REPORTS
========================= */

function renderReports(){
  const mode=D.mode;
  const income=totalIncome(mode);
  const expense=totalExpense(mode);
  const give=totalGiven(mode);
  const receive=totalReceived(mode);

  setText("reportIncome",money(income));
  setText("reportExpense",money(expense));
  setText("reportGive",money(give));
  setText("reportReceive",money(receive));

  const el=document.getElementById("reportContent");
  if(!el) return;

  el.innerHTML=`
    <div class="report-cards">
      <div class="summary-card">
        <small>Cashflow</small>
        <strong>${money(income-expense)}</strong>
      </div>
      <div class="summary-card">
        <small>Udhaar Net</small>
        <strong>${money(give-receive)}</strong>
      </div>
      <div class="summary-card">
        <small>Overall Balance</small>
        <strong>${money(balance(mode))}</strong>
      </div>
    </div>
  `;
}

function exportSummary(){
  const text=summaryText();
  shareText("HISAB Summary",text);
}

function exportSummaryPDF(){
  const html=`
    <h1>HISAB Money Manager</h1>
    <p>Mode: ${esc(D.mode)}</p>
    <p>Total Income: ${money(totalIncome())}</p>
    <p>Total Expense: ${money(totalExpense())}</p>
    <p>Total Give: ${money(totalGiven())}</p>
    <p>Total Receive: ${money(totalReceived())}</p>
    <p>Balance: ${money(balance())}</p>
  `;
  printPDF("HISAB Summary",html);
}

function summaryText(){
  return [
    "HISAB MONEY MANAGER",
    "Mode: "+D.mode,
    "",
    "Income: "+money(totalIncome()),
    "Expense: "+money(totalExpense()),
    "Give: "+money(totalGiven()),
    "Receive: "+money(totalReceived()),
    "Balance: "+money(balance()),
    "",
    "Generated: "+today()
  ].join("\n");
}

/* =========================
   BACKUP / RESTORE
========================= */

function exportBackup(){
  const data=JSON.stringify(D,null,2);
  const blob=new Blob([data],{type:"application/json"});
  const file=new File([blob],"HISAB-Backup.json",{
    type:"application/json"
  });

  if(navigator.share && navigator.canShare &&
     navigator.canShare({files:[file]})){
    navigator.share({
      title:"HISAB Backup",
      files:[file]
    }).catch(()=>downloadBlob(blob,"HISAB-Backup.json"));
  }else{
    downloadBlob(blob,"HISAB-Backup.json");
  }
}

function importBackup(event){
  const file=event.target.files?.[0];
  if(!file) return;

  const reader=new FileReader();

  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);

      if(!data || typeof data!=="object")
        throw new Error();

      D={...D,...data};
      loadData();
      saveData();
      renderAll();

      toast("Backup restored");
    }catch(err){
      toast("Invalid HISAB backup");
    }
  };

  reader.readAsText(file);
}

/* =========================
   SECURITY
========================= */

function setPin(){
  const pin=document.getElementById("pinInput")?.value.trim();

  if(!/^\d{4,6}$/.test(pin))
    return toast("PIN must be 4 to 6 digits");

  D.pin=pin;
  saveData();

  setVal("pinInput","");
  toast("PIN saved");
}

function lockApp(){
  if(!D.pin)
    return toast("First set a PIN");

  const pin=prompt("Enter HISAB PIN");

  if(pin===D.pin){
    toast("Already unlocked");
    return;
  }

  const shell=document.getElementById("appShell");
  if(shell) shell.style.display="none";

  const gate=document.getElementById("guestGate");
  if(gate){
    gate.style.display="flex";
    const btn=gate.querySelector("button");
    if(btn){
      btn.textContent="Unlock HISAB";
      btn.onclick=function(){
        const p=prompt("Enter PIN");
        if(p===D.pin){
          gate.style.display="none";
          shell.style.display="block";
          show("home");
        }else{
          toast("Wrong PIN");
        }
      };
    }
  }
}

function renderPrivacy(){}

/* =========================
   FAMILY
========================= */

function addFamilyMember(){
  const name=document.getElementById("familyName")?.value.trim();
  if(!name) return toast("Name required");

  D.family.push({
    id:uid(),
    mode:D.mode,
    name
  });

  saveData();
  setVal("familyName","");
  renderFamily();
}

function renderFamily(){
  const el=document.getElementById("familyList");
  if(!el) return;

  const arr=D.family.filter(x=>(x.mode||"personal")===D.mode);

  el.innerHTML=arr.length?arr.map(x=>`
    <div class="list-card">
      <strong>${esc(x.name)}</strong>
      <button onclick="deleteFamily('${esc(x.id)}')">Delete</button>
    </div>
  `).join(""):"<div class='empty'>No family members</div>";
}

function deleteFamily(id){
  D.family=D.family.filter(x=>x.id!==id);
  saveData();
  renderFamily();
}

/* =========================
   MORE TOOLS
========================= */

function calcFD(){
  const p=Number(document.getElementById("fdPrincipal")?.value);
  const rate=Number(document.getElementById("fdRate")?.value);
  const months=Number(document.getElementById("fdN")?.value);

  if(!(p>0) || !(months>0))
    return toast("Enter principal and months");

  const interest=p*(rate/100)*(months/12);
  const maturity=p+interest;

  setText("fdResult",
    `Interest: ${money(interest)} | Maturity: ${money(maturity)}`
  );
}

function addTool(name){
  D.tools.push({
    id:uid(),
    mode:D.mode,
    name,
    date:today()
  });
  saveData();
  toast(name+" added");
}

function addInsurance(){ addTool("Insurance"); }
function addSchool(){ addTool("School"); }
function addVehicle(){ addTool("Vehicle"); }
function addShopping(){ addTool("Shopping"); }
function addUtility(){ addTool("Utility"); }
function addDoc(){ addTool("Document"); }
function addAnnual(){ addTool("Annual Planning"); }

function calcEmergency(){
  const monthly=Number(
    prompt("Enter average monthly expense")||0
  );

  if(!(monthly>0)) return;

  const fund=monthly*6;
  toast("6 month Emergency Fund: "+money(fund));
}

/* =========================
   QUICK ADD
========================= */

function openQuickAdd(){
  const choice=prompt(
    "Quick Add:\n1 = Income\n2 = Expense\n3 = Udhaar Give\n4 = Udhaar Receive"
  );

  if(choice==="1" || choice==="2"){
    show("transactions");
    setVal("transactionType",choice==="1"?"income":"expense");
    return;
  }

  if(choice==="3" || choice==="4"){
    openKhataForm(D.mode);
    setVal("khataType",choice==="3"?"give":"receive");
  }
}

/* =========================
   SEARCH EVERYTHING
========================= */

function searchAllData(query){
  const el=document.getElementById("searchResults");
  if(!el) return;

  query=String(query||"").toLowerCase().trim();

  if(!query){
    el.innerHTML="";
    return;
  }

  const results=[];

  D.transactions.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Transaction: ${x.type} ${money(x.amount)}`);
  });

  D.khata.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Udhaar: ${x.person} - ${x.type} ${money(x.amount)}`);
  });

  D.business.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Business: ${x.name} - ${money(x.amount)}`);
  });

  D.goals.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Goal: ${x.name} - ${money(x.target)}`);
  });

  D.bills.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Bill: ${x.name} - ${money(x.amount)}`);
  });

  D.reminders.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Reminder: ${x.name}`);
  });

  D.family.forEach(x=>{
    if(JSON.stringify(x).toLowerCase().includes(query))
      results.push(`Family: ${x.name}`);
  });

  el.innerHTML=results.length
    ? results.map(x=>`<div class="list-card">${esc(x)}</div>`).join("")
    : "<div class='empty'>Nothing found</div>";
}

/* =========================
   SHARE / DOWNLOAD / PDF
========================= */

function shareText(title,text){
  if(navigator.share){
    navigator.share({title,text}).catch(()=>{});
  }else{
    downloadBlob(new Blob([text],{type:"text/plain"}),
      title.replace(/\s+/g,"-")+".txt");
  }
}

function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function printPDF(title,html){
  const w=window.open("","_blank");

  if(!w){
    toast("Allow popups to create PDF");
    return;
  }

  w.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>${esc(title)}</title>
      <meta name="viewport" content="width=device-width">
      <style>
        body{font-family:Arial,sans-serif;padding:24px;line-height:1.6}
        h1{margin-bottom:20px}
        p{border-bottom:1px solid #ddd;padding:8px 0}
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);

  w.document.close();
  w.focus();

  setTimeout(()=>{
    w.print();
  },400);
}

/* =========================
   HELPERS
========================= */

function setText(id,value){
  const el=document.getElementById(id);
  if(el) el.textContent=value;
}

function setVal(id,value){
  const el=document.getElementById(id);
  if(el) el.value=value;
}

/* =========================
   RENDER ALL
========================= */

function renderAll(){
  renderHome();
  renderPersonal();
  renderBusiness();
  renderTransactions();
  renderPlanning();
  renderBills();
  renderReminders();
  renderReports();
  renderFamily();
}

/* =========================
   STARTUP
========================= */

document.addEventListener("DOMContentLoaded",()=>{
  loadData();

  setVal("khataDate",today());
  setVal("transactionDate",today());
  setVal("reminderDate",today());

  renderAll();

  /* Fixed index.html already calls showGuestGate().
     Do not automatically bypass the guest screen. */
});
