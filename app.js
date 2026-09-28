/* =========================================================
   HISAB V7 — COMPACT ALL OPTIONS CONTROLLER
   index.html + repair.js compatible
   ========================================================= */
(function(){
"use strict";

const KEY="hisab_v7_data", GUEST="hisab_v7_guest";
const DEF={
 mode:"personal",currency:"₹",language:"hi",
 transactions:[],khata:[],business:[],sales:[],purchases:[],
 goals:[],savings:[],bills:[],loans:[],reminders:[],
 family:[],tools:[],budget:0,pin:""
};

let D=load();
D.ui=Object.assign({
 khataMode:"personal",khataFilter:"all",detailFilter:"all",
 businessFilter:"customer",selectedPerson:"",selectedMode:"personal"
},D.ui||{});
window.D=D;

const $=id=>document.getElementById(id);
const v=(id,d="")=>$(id)?.value?.trim()??d;
const n=x=>Number(x)||0;
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>new Date().toISOString().slice(0,10);
const arr=k=>Array.isArray(D[k])?D[k]:(D[k]=[]);
const money=x=>(D.currency||"₹")+n(x).toLocaleString("en-IN",{maximumFractionDigits:2});
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const set=(i,x)=>{if($(i))$(i).textContent=x};
const clone=o=>JSON.parse(JSON.stringify(o));

function load(){
 try{return Object.assign(clone(DEF),JSON.parse(localStorage.getItem(KEY)||"{}"))}
 catch(e){return clone(DEF)}
}
function save(){
 const x=clone(D);delete x.ui;
 localStorage.setItem(KEY,JSON.stringify(x));
 return x;
}
window.save=save;
window.HISAB={data:()=>D,save,render:renderAll};

/* ---------- NAVIGATION ---------- */
function hidePages(){
 document.querySelectorAll(".page,.screen,.app-page,[data-page]").forEach(x=>{
   if(x.id&&/screen|page/i.test(x.id))x.style.display="none";
 });
}
window.show=function(page){
 hidePages();
 const x=$(page)||document.querySelector(`[data-page="${page}"]`);
 if(x)x.style.display="block";
 renderAll();
};
function showGuestGate(){
 const g=$("guestGate")||$("guestScreen")||$("welcomeScreen");
 if(localStorage.getItem(GUEST)==="1"){
   if(g)g.style.display="none";
   const h=$("homeScreen");if(h)h.style.display="block";
 }else if(g)g.style.display="block";
}
window.showGuestGate=showGuestGate;
window.enterGuestMode=function(){
 localStorage.setItem(GUEST,"1");
 showGuestGate();
 show("homeScreen");
 renderAll();
};

/* ---------- LANGUAGE / CURRENCY ---------- */
window.toggleLanguage=function(){
 D.language=D.language==="hi"?"en":"hi";save();renderAll();
};
window.cycleCurrency=function(){
 D.currency=D.currency==="₹"?"$":D.currency==="$"?"€":"₹";
 save();renderAll();
};

/* ---------- MODE ---------- */
window.setMode=function(mode){
 D.mode=mode==="business"?"business":"personal";
 D.ui.selectedMode=D.mode;
 save();renderAll();
};

/* ---------- HOME ---------- */
function totals(mode=D.mode){
 let t=arr("transactions").filter(x=>x.mode===mode);
 let income=t.filter(x=>x.type==="income").reduce((a,x)=>a+n(x.amount),0);
 let expense=t.filter(x=>x.type==="expense").reduce((a,x)=>a+n(x.amount),0);
 let k=arr("khata").filter(x=>x.mode===mode);
 let give=k.filter(x=>x.type==="give").reduce((a,x)=>a+n(x.amount),0);
 let receive=k.filter(x=>x.type==="receive").reduce((a,x)=>a+n(x.amount),0);
 return {income,expense,give,receive,balance:income-expense+receive-give};
}
function renderHome(){
 const t=totals(D.mode);
 set("homeBalance",money(t.balance));
 set("receivable",money(t.receive));
 set("payable",money(t.give));
 set("modeLabel",D.mode==="business"?"Business":"Personal");
}

/* ---------- KHATA / UDHAR ---------- */
window.openKhataForm=function(mode){
 D.ui.khataMode=mode||D.mode;
 const name=prompt("Name / Customer / Supplier");
 if(name===null)return;
 const amount=n(prompt("Amount"));
 if(!amount)return alert("Amount required");
 const type=prompt("Give or Receive?","Give");
 const t=/receive/i.test(type||"")?"receive":"give";
 const note=prompt("Note","")||"";
 const method=prompt("Payment Method","Cash")||"Cash";
 arr("khata").push({
   id:id(),mode:D.ui.khataMode,name:name.trim(),amount,
   type:t,date:today(),note,method,status:"pending",createdAt:Date.now()
 });
 save();renderAll();
};
window.closeKhataForm=function(){};
window.saveKhataEntry=function(){return openKhataForm(D.ui.khataMode)};
window.searchKhata=function(){
 D.ui.khataSearch=v("khataSearch","");
 renderPersonal();
};
window.filterKhata=function(f){
 D.ui.khataFilter=f||"all";renderPersonal();
};
function khataMatches(x){
 let q=(D.ui.khataSearch||"").toLowerCase();
 return (!q||`${x.name} ${x.note} ${x.method}`.toLowerCase().includes(q)) &&
   (D.ui.khataFilter==="all"||x.type===D.ui.khataFilter);
}
function renderPersonal(){
 const list=$("personalKhataList")||$("khataList");
 if(!list)return;
 let a=arr("khata").filter(x=>x.mode==="personal"&&khataMatches(x));
 let g=a.filter(x=>x.type==="give").reduce((s,x)=>s+n(x.amount),0);
 let r=a.filter(x=>x.type==="receive").reduce((s,x)=>s+n(x.amount),0);
 set("totalGive",money(g));set("totalReceive",money(r));set("totalNet",money(r-g));
 const people={};
 a.forEach(x=>(people[x.name]=people[x.name]||[]).push(x));
 list.innerHTML=Object.keys(people).map(name=>{
   let z=people[name],G=z.filter(x=>x.type==="give").reduce((s,x)=>s+n(x.amount),0),
       R=z.filter(x=>x.type==="receive").reduce((s,x)=>s+n(x.amount),0);
   return `<div class="card" onclick="openKhataPerson('${esc(name).replace(/'/g,"&#39;")}')">
     <b>${esc(name)}</b><br><span>Give ${money(G)} · Receive ${money(R)}</span>
     </div>`;
 }).join("")||"<div class='card'>No Udhar entries</div>";
}
window.openKhataPerson=function(name){
 D.ui.selectedPerson=name;D.ui.detailFilter="all";
 renderKhataDetail();
 show("khataDetail");
};
window.detailFilter=function(f){
 D.ui.detailFilter=f||"all";renderKhataDetail();
};
function renderKhataDetail(){
 const list=$("khataDetailList")||$("detailList");
 if(!list)return;
 let a=arr("khata").filter(x=>x.mode===D.ui.selectedMode||x.mode===D.ui.khataMode)
 .filter(x=>x.name===D.ui.selectedPerson)
 .filter(x=>D.ui.detailFilter==="all"||x.type===D.ui.detailFilter);
 list.innerHTML=a.map(x=>`
 <div class="card">
  <b>${x.type==="give"?"Give":"Receive"} — ${money(x.amount)}</b>
  <div>${esc(x.date)} · ${esc(x.method||"Cash")}</div>
  <small>${esc(x.note||"")}</small>
  <button onclick="deleteKhata('${x.id}')">Delete</button>
 </div>`).join("")||"<div class='card'>No entries</div>";
}
window.deleteKhata=function(i){
 D.khata=D.khata.filter(x=>x.id!==i);save();renderAll();renderKhataDetail();
};
window.closeKhataDetail=function(){show("personal")};
window.openPaymentEntry=function(){openKhataForm(D.mode)};
window.shareKhata=function(){
 const a=arr("khata").filter(x=>x.name===D.ui.selectedPerson);
 const txt=a.map(x=>`${x.date} ${x.type} ${money(x.amount)} ${x.note||""}`).join("\n");
 if(navigator.share)navigator.share({title:"HISAB Udhar",text:txt});
 else navigator.clipboard?.writeText(txt).then(()=>alert("Copied"));
};
window.exportKhataPDF=function(){printDocument("Udhar Report")};

/* ---------- BUSINESS CONTACTS ---------- */
window.addBusinessCustomer=function(){addBusinessContact("customer")};
window.addBusinessSupplier=function(){addBusinessContact("supplier")};
window.addBusinessContact=function(type){
 const name=prompt(type==="supplier"?"Supplier Name":"Customer Name");
 if(!name)return;
 arr("business").push({id:id(),type,name:name.trim(),createdAt:Date.now()});
 save();renderBusiness();
};

/* ---------- BUSINESS SALES / PURCHASE ---------- */
function addSale(){
 const customer=prompt("Customer Name");if(!customer)return;
 const amount=n(prompt("Sale Amount"));if(!amount)return;
 arr("sales").push({
  id:id(),mode:"business",customer:customer.trim(),amount,
  date:today(),method:prompt("Payment Method","Cash")||"Cash",
  note:prompt("Note","")||"",createdAt:Date.now()
 });
 save();renderBusiness();
}
function addPurchase(){
 const supplier=prompt("Supplier Name");if(!supplier)return;
 const amount=n(prompt("Purchase Amount"));if(!amount)return;
 arr("purchases").push({
  id:id(),mode:"business",supplier:supplier.trim(),amount,
  date:today(),method:prompt("Payment Method","Cash")||"Cash",
  note:prompt("Note","")||"",createdAt:Date.now()
 });
 save();renderBusiness();
}
window.addBusinessSale=addSale;
window.addBusinessPurchase=addPurchase;
window.deleteBusinessSale=function(i){D.sales=D.sales.filter(x=>x.id!==i);save();renderBusiness()};
window.deleteBusinessPurchase=function(i){D.purchases=D.purchases.filter(x=>x.id!==i);save();renderBusiness()};

window.businessFilter=function(f){
 D.ui.businessFilter=f||"customer";renderBusiness();
};
function renderBusiness(){
 const list=$("businessList");if(!list)return;
 let f=D.ui.businessFilter||"customer";
 let html="";
 if(f==="sales"){
  html=`<button onclick="addBusinessSale()">+ Add Sale</button>`+
  arr("sales").map(x=>`<div class="card"><b>Sale — ${money(x.amount)}</b><br>${esc(x.customer)} · ${esc(x.date)}<br>${esc(x.method)} ${esc(x.note||"")}<br><button onclick="deleteBusinessSale('${x.id}')">Delete</button></div>`).join("");
 }else if(f==="purchase"){
  html=`<button onclick="addBusinessPurchase()">+ Add Purchase</button>`+
  arr("purchases").map(x=>`<div class="card"><b>Purchase — ${money(x.amount)}</b><br>${esc(x.supplier)} · ${esc(x.date)}<br>${esc(x.method)} ${esc(x.note||"")}<br><button onclick="deleteBusinessPurchase('${x.id}')">Delete</button></div>`).join("");
 }else{
  let a=arr("business").filter(x=>x.type===f);
  html=a.map(x=>`<div class="card"><b>${esc(x.name)}</b><br>${esc(x.type)}</div>`).join("");
 }
 list.innerHTML=html||"<div class='card'>No records</div>";
 let G=arr("khata").filter(x=>x.mode==="business"&&x.type==="give").reduce((s,x)=>s+n(x.amount),0);
 let R=arr("khata").filter(x=>x.mode==="business"&&x.type==="receive").reduce((s,x)=>s+n(x.amount),0);
 set("businessGiven",money(G));set("businessReceived",money(R));set("businessNet",money(R-G));
}

/* ---------- TRANSACTIONS ---------- */
window.addTransaction=function(){
 const type=prompt("Income or Expense?","Expense");
 const amount=n(prompt("Amount"));if(!amount)return;
 const note=prompt("Description","")||"";
 arr("transactions").push({
  id:id(),mode:D.mode,type:/income/i.test(type||"")?"income":"expense",
  amount,date:today(),note,createdAt:Date.now()
 });
 save();renderAll();
};
window.deleteTransaction=function(i){
 D.transactions=D.transactions.filter(x=>x.id!==i);save();renderAll();
};
function renderTransactions(){
 const list=$("transactionList")||$("transactionsList");if(!list)return;
 let a=arr("transactions").filter(x=>x.mode===D.mode);
 list.innerHTML=a.slice().reverse().map(x=>`
 <div class="card">
 <b>${x.type==="income"?"Income":"Expense"} — ${money(x.amount)}</b>
 <br>${esc(x.date)} · ${esc(x.note||"")}
 <button onclick="deleteTransaction('${x.id}')">Delete</button>
 </div>`).join("")||"<div class='card'>No transactions</div>";
}

/* ---------- BUDGET / GOALS / SAVINGS ---------- */
window.calcBudget=function(){
 const amount=n(prompt("Monthly Budget",D.budget||0));
 D.budget=amount;save();renderGoals();
};
function renderGoals(){
 const spent=arr("transactions").filter(x=>x.mode===D.mode&&x.type==="expense")
   .reduce((s,x)=>s+n(x.amount),0);
 set("budgetAmount",money(D.budget));
 set("budgetSpent",money(spent));
 set("budgetRemaining",money(Math.max(0,D.budget-spent)));
 set("budgetProgress",D.budget?Math.min(100,spent/D.budget*100).toFixed(0)+"%":"0%");
 const list=$("goalsList");if(!list)return;
 list.innerHTML=arr("goals").map(x=>`
 <div class="card"><b>${esc(x.name)}</b><br>${money(x.saved)} / ${money(x.target)}
 <button onclick="deleteGoal('${x.id}')">Delete</button></div>`).join("")||"<div class='card'>No goals</div>";
}
window.calcGoal=function(){
 const name=prompt("Goal Name");if(!name)return;
 const target=n(prompt("Target Amount"));if(!target)return;
 const saved=n(prompt("Saved Amount",0));
 arr("goals").push({id:id(),name,target,saved,createdAt:Date.now()});
 save();renderGoals();
};
window.deleteGoal=function(i){D.goals=D.goals.filter(x=>x.id!==i);save();renderGoals()};

/* ---------- BILLS / LOANS / EMI ---------- */
window.addBill=function(type="bill"){
 const name=prompt(type==="credit"?"Credit Card":"Bill Name");if(!name)return;
 const amount=n(prompt("Amount"));if(!amount)return;
 const date=prompt("Due Date",today())||today();
 arr("bills").push({
  id:id(),type,name:name.trim(),amount,date,status:"pending",
  paid:0,history:[],createdAt:Date.now()
 });
 save();renderBills();
};
window.calcEMI=function(){
 const name=prompt("Loan Name");if(!name)return;
 const principal=n(prompt("Loan Amount"));if(!principal)return;
 const rate=n(prompt("Annual Interest %",0));
 const months=n(prompt("Tenure Months",12));
 const r=rate/1200;
 const emi=r?principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1):principal/months;
 arr("loans").push({
  id:id(),name:name.trim(),principal,rate,months,
  emi:Math.round(emi*100)/100,nextDue:prompt("Next Due Date",today())||today(),
  status:"pending",history:[],createdAt:Date.now()
 });
 save();renderBills();
};
window.settleBill=function(i){
 let x=arr("bills").find(x=>x.id===i);
 if(!x)return;
 const p=n(prompt("Payment Amount",x.amount-x.paid));
 if(p>0){x.paid+=p;x.history.push({amount:p,date:today()})}
 if(x.paid>=x.amount)x.status="paid";
 save();renderBills();
};
window.deleteBill=function(i){D.bills=D.bills.filter(x=>x.id!==i);save();renderBills()};
window.deleteLoan=function(i){D.loans=D.loans.filter(x=>x.id!==i);save();renderBills()};
function renderBills(){
 const list=$("billsList")||$("paymentList");if(!list)return;
 let b=arr("bills").map(x=>`
 <div class="card"><b>${esc(x.name)}</b> — ${money(x.amount)}
 <br>Due: ${esc(x.date)} · ${x.status}
 <button onclick="settleBill('${x.id}')">Pay</button>
 <button onclick="deleteBill('${x.id}')">Delete</button></div>`).join("");
 let l=arr("loans").map(x=>`
 <div class="card"><b>${esc(x.name)}</b><br>
 EMI ${money(x.emi)} · Due ${esc(x.nextDue)} · ${x.status}
 <button onclick="deleteLoan('${x.id}')">Delete</button></div>`).join("");
 list.innerHTML=b+l||"<div class='card'>No bills or loans</div>";
}

/* ---------- REPORTS ---------- */
function reportTotals(){
 let t=totals(D.mode);
 let sales=arr("sales").reduce((s,x)=>s+n(x.amount),0);
 let purchase=arr("purchases").reduce((s,x)=>s+n(x.amount),0);
 return Object.assign(t,{sales,purchase});
}
function renderReports(){
 const r=reportTotals();
 set("reportIncome",money(r.income));
 set("reportExpense",money(r.expense));
 set("reportBalance",money(r.balance));
 set("reportSales",money(r.sales));
 set("reportPurchase",money(r.purchase));
 const list=$("reportList");if(list)
 list.innerHTML=`
 <div class="card">Income: ${money(r.income)}</div>
 <div class="card">Expense: ${money(r.expense)}</div>
 <div class="card">Sales: ${money(r.sales)}</div>
 <div class="card">Purchase: ${money(r.purchase)}</div>
 <div class="card">Udhar Give: ${money(r.give)}</div>
 <div class="card">Udhar Receive: ${money(r.receive)}</div>
 <div class="card"><b>Balance: ${money(r.balance)}</b></div>`;
}
window.exportSummary=function(){shareText(summaryText())};
function summaryText(){
 const r=reportTotals();
 return `HISAB REPORT\nIncome: ${money(r.income)}\nExpense: ${money(r.expense)}\nSales: ${money(r.sales)}\nPurchase: ${money(r.purchase)}\nGive: ${money(r.give)}\nReceive: ${money(r.receive)}\nBalance: ${money(r.balance)}`;
}
function shareText(txt){
 if(navigator.share)navigator.share({title:"HISAB Report",text:txt});
 else navigator.clipboard?.writeText(txt).then(()=>alert("Report copied"));
}
window.printDocument=function(title="HISAB Report"){
 const w=window.open("","_blank");
 if(!w)return;
 w.document.write(`<html><head><title>${title}</title>
 <meta name="viewport" content="width=device-width"></head>
 <body><h2>${title}</h2><pre>${esc(summaryText())}</pre>
 <script>window.print()<\/script></body></html>`);
 w.document.close();
};
window.exportSummaryPDF=function(){printDocument("HISAB Summary PDF")};

/* ---------- REMINDERS ---------- */
window.addReminder=function(){
 const title=prompt("Reminder");if(!title)return;
 const date=prompt("Date",today())||today();
 arr("reminders").push({id:id(),title,date,createdAt:Date.now()});
 save();renderReminders();
};
window.deleteReminder=function(i){
 D.reminders=D.reminders.filter(x=>x.id!==i);save();renderReminders();
};
function renderReminders(){
 const list=$("reminderList")||$("remindersList");if(!list)return;
 list.innerHTML=arr("reminders").map(x=>
 `<div class="card"><b>${esc(x.title)}</b><br>${esc(x.date)}
 <button onclick="deleteReminder('${x.id}')">Delete</button></div>`).join("")||"<div class='card'>No reminders</div>";
}

/* ---------- SECURITY ---------- */
window.setPin=function(){
 const p=prompt("Set 4 digit PIN");
 if(p===null)return;
 if(!/^\d{4}$/.test(p))return alert("PIN must be 4 digits");
 D.pin=p;save();alert("PIN saved");
};
window.lockApp=function(){
 if(!D.pin)return setPin();
 const p=prompt("Enter PIN");
 if(p!==D.pin)return alert("Wrong PIN");
 alert("Unlocked");
};

/* ---------- BACKUP / RESTORE ---------- */
window.exportBackup=function(){
 const blob=new Blob([JSON.stringify(D,null,2)],{type:"application/json"});
 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="HISAB-Backup.json";a.click();
};
window.importBackup=function(){
 const input=document.createElement("input");input.type="file";input.accept=".json";
 input.onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
   try{
    D=Object.assign(clone(DEF),JSON.parse(r.result));
    D.ui=Object.assign({},D.ui||{});
    window.D=D;save();renderAll();alert("Backup restored");
   }catch(err){alert("Invalid backup")}
  };r.readAsText(f);
 };input.click();
};

/* ---------- FAMILY ---------- */
window.addFamilyMember=function(){
 const name=prompt("Family Member");if(!name)return;
 arr("family").push({id:id(),name,createdAt:Date.now()});
 save();renderFamily();
};
window.deleteFamilyMember=function(i){
 D.family=D.family.filter(x=>x.id!==i);save();renderFamily();
};
function renderFamily(){
 const list=$("familyList");if(!list)return;
 list.innerHTML=arr("family").map(x=>
 `<div class="card">${esc(x.name)}
 <button onclick="deleteFamilyMember('${x.id}')">Delete</button></div>`).join("")||"<div class='card'>No family members</div>";
}

/* ---------- EXTRA TOOLS ---------- */
window.calcFD=function(){
 const p=n(prompt("Principal")), rate=n(prompt("Annual Rate %")), years=n(prompt("Years"));
 if(p)alert("Maturity: "+money(p*Math.pow(1+rate/100,years)));
};
window.calcEmergency=function(){
 const monthly=n(prompt("Monthly Expenses")),months=n(prompt("Months",6));
 if(monthly)alert("Emergency Fund: "+money(monthly*months));
};
window.addInsurance=function(){addTool("Insurance")};
window.addSchool=function(){addTool("School")};
window.addVehicle=function(){addTool("Vehicle")};
window.addShopping=function(){addTool("Shopping")};
window.addUtility=function(){addTool("Utility")};
window.addDoc=function(){addTool("Document")};
window.addAnnual=function(){addTool("Annual Payment")};
function addTool(type){
 const name=prompt(type+" Name");if(!name)return;
 const amount=n(prompt("Amount",0));
 arr("tools").push({id:id(),type,name,amount,date:today()});
 save();renderTools();
}
window.toolAction=function(type){addTool(type||"Tool")};
function renderTools(){
 const list=$("toolsList");if(!list)return;
 list.innerHTML=arr("tools").map(x=>
 `<div class="card"><b>${esc(x.type)}</b> · ${esc(x.name)}
 <br>${money(x.amount)} · ${esc(x.date)}</div>`).join("")||"<div class='card'>No tools entries</div>";
}

/* ---------- SEARCH ---------- */
window.searchAllData=function(){
 const q=v("globalSearch",v("search","")).toLowerCase();
 if(!q)return renderAll();
 document.querySelectorAll(".card").forEach(x=>{
   x.style.display=x.textContent.toLowerCase().includes(q)?"":"none";
 });
};

/* ---------- QUICK ADD ---------- */
window.openQuickAdd=function(){
 const x=prompt("1 Income\n2 Expense\n3 Udhar Give\n4 Udhar Receive\n5 Sale\n6 Purchase");
 const m={
  "1":()=>{D.mode=D.mode;const a=n(prompt("Income Amount"));if(a)arr("transactions").push({id:id(),mode:D.mode,type:"income",amount:a,date:today()})},
  "2":()=>{D.mode=D.mode;const a=n(prompt("Expense Amount"));if(a)arr("transactions").push({id:id(),mode:D.mode,type:"expense",amount:a,date:today()})},
  "3":()=>openKhataForm(D.mode),
  "4":()=>{const name=prompt("Name");const a=n(prompt("Receive Amount"));if(name&&a)arr("khata").push({id:id(),mode:D.mode,name,amount:a,type:"receive",date:today(),status:"pending"})},
  "5":addSale,"6":addPurchase
 };
 if(m[x]){m[x]();save();renderAll()}
};

/* ---------- RENDER ---------- */
function renderAll(){
 renderHome();
 renderPersonal();
 renderBusiness();
 renderTransactions();
 renderGoals();
 renderBills();
 renderReports();
 renderReminders();
 renderFamily();
 renderTools();
}
function render(){renderAll()}
window.render=render;

document.addEventListener("DOMContentLoaded",function(){
 showGuestGate();
 renderAll();
 setTimeout(()=>renderAll(),300);
});

})();
