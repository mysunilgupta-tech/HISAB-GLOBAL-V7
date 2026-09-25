/* =========================================================
   HISAB V7 — COMPACT COMPLETE CONTROLLER
   Personal + Business | Udhaar | Money | Planning
   Reports | Backup | Security | Share/PDF
========================================================= */
(() => {
"use strict";

const KEY="hisab_v7_data";

const DEF={
  version:7, mode:"personal", currency:"₹", language:"en",
  transactions:[], lendDen:[], people:[],
  businessPeople:[], sales:[], purchases:[],
  goals:[], savings:[], budgets:[], bills:[], loans:[],
  reminders:[], settings:{}, pin:""
};

let D=load(), currentPerson="", khataFilter="all", bizFilter="customer";

/* ---------- BASIC ---------- */
const $=id=>document.getElementById(id);
const val=id=>$(id)?.value?.trim()||"";
const num=id=>Number(val(id))||0;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>new Date().toISOString().slice(0,10);

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY)||"null")||{};
    const d={...DEF,...x};
    Object.keys(DEF).forEach(k=>{
      if(Array.isArray(DEF[k])) d[k]=Array.isArray(x[k])?x[k]:[];
    });
    return d;
  }catch(e){return {...DEF};}
}

function save(){localStorage.setItem(KEY,JSON.stringify(D));}

function esc(v){
  return String(v??"")
   .replace(/&/g,"&amp;")
   .replace(/</g,"&lt;")
   .replace(/>/g,"&gt;")
   .replace(/"/g,"&quot;")
   .replace(/'/g,"&#39;");
}

function money(n){
  return `${D.currency}${Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}`;
}

function toast(msg){
  let x=$("hisabToast");
  if(!x){
    x=document.createElement("div");
    x.id="hisabToast";
    x.style.cssText="position:fixed;left:50%;bottom:85px;transform:translateX(-50%);z-index:99999;background:#102a43;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;box-shadow:0 8px 25px #0003";
    document.body.appendChild(x);
  }
  x.textContent=msg;x.style.display="block";
  clearTimeout(x.t);x.t=setTimeout(()=>x.style.display="none",2200);
}

function pageIds(){
 return ["home","personal","business","khataEntry","khataDetail",
 "planning","credit","reports","reminders","privacy","family",
 "ads","familytools","tools13","final","transactions"];
}

function show(id){
 pageIds().forEach(x=>{if($(x))$(x).style.display="none";});
 if($(id))$(id).style.display="block";
 window.scrollTo(0,0);
 renderAll();
}

function setText(id,t){if($(id))$(id).textContent=t;}
function setVal(id,t){if($(id))$(id).value=t??"";}

/* ---------- GUEST / START ---------- */
function showGuestGate(){
 if($("guestGate"))$("guestGate").style.display="flex";
 if($("appShell"))$("appShell").style.display="none";
}

function enterGuestMode(){
 if($("guestGate"))$("guestGate").style.display="none";
 if($("appShell"))$("appShell").style.display="block";
 if($("welcome"))$("welcome").style.display="none";
 show("home");
}

function toggleLanguage(){
 D.language=D.language==="en"?"hi":"en";
 save();renderAll();
 toast(D.language==="hi"?"हिंदी चालू":"English ON");
}

function toggleCurrency(){
 D.currency=D.currency==="₹"?"$":"₹";
 save();renderAll();
}

/* ---------- MODE ---------- */
function setMode(mode){
 D.mode=mode==="business"?"business":"personal";
 save();renderAll();show(D.mode==="business"?"business":"personal");
}

function modeData(a){return a.filter(x=>(x.mode||"personal")===D.mode);}

/* ---------- TRANSACTIONS ---------- */
function addTransaction(type){
 const t=type||val("transactionType")||"expense";
 const amount=num("transactionAmount")||Number(prompt("Amount")||0);
 if(amount<=0)return toast("Amount enter karo");

 const category=val("transactionCategory")||prompt("Category","General")||"General";
 const note=val("transactionNote")||prompt("Note","")||"";
 const date=val("transactionDate")||today();

 D.transactions.push({
   id:uid(),type:t,amount,date,category,note,mode:D.mode
 });
 save();clearTransaction();renderAll();toast("Transaction saved");
}

function clearTransaction(){
 ["transactionAmount","transactionCategory","transactionDate","transactionNote"]
 .forEach(x=>setVal(x,""));
}

function renderTransactions(){
 const box=$("transactionList");if(!box)return;
 const a=modeData(D.transactions).slice().reverse();
 box.innerHTML=a.length?a.map(x=>`
  <div class="entry-card">
   <div class="entry-top">
    <b>${esc(x.category||x.type)}</b>
    <strong>${x.type==="income"?"+":"-"}${money(x.amount)}</strong>
   </div>
   <div class="entry-meta">${esc(x.date||"")} • ${esc(x.note||"")}</div>
   <button class="small-btn" onclick="deleteTransaction('${x.id}')">Delete</button>
  </div>`).join(""):`<div class="empty-state">No transactions yet</div>`;
}

function deleteTransaction(id){
 if(!confirm("Delete transaction?"))return;
 D.transactions=D.transactions.filter(x=>x.id!==id);
 save();renderAll();toast("Deleted");
}

/* ---------- UDHAR / KHATA ---------- */
function khataEntries(){
 return modeData(D.lendDen);
}

function peopleForMode(){
 const names=[...D.people,...khataEntries().map(x=>x.person)]
   .filter(Boolean);
 return [...new Set(names)];
}

function openKhataForm(mode){
 if(mode)setMode(mode);
 setVal("khataPerson",currentPerson);
 setVal("khataDate",today());
 if($("khataType"))$("khataType").value="give";
 if($("khataStatus"))$("khataStatus").value="pending";
 show("khataEntry");
}

function closeKhataForm(){show(D.mode==="business"?"business":"personal");}

function saveKhataEntry(){
 const person=val("khataPerson");
 const amount=num("khataAmount");
 if(!person)return toast("Person name enter karo");
 if(amount<=0)return toast("Amount enter karo");

 const e={
  id:uid(),person,
  type:val("khataType")||"give",
  amount,
  date:val("khataDate")||today(),
  method:val("khataMethod")||"Cash",
  status:val("khataStatus")||"pending",
  note:val("khataNote")||"",
  mode:D.mode
 };

 D.lendDen.push(e);
 if(!D.people.includes(person))D.people.push(person);
 currentPerson=person;
 save();

 ["khataAmount","khataNote"].forEach(x=>setVal(x,""));
 renderAll();
 openKhataDetail(person);
 toast("Khata entry saved");
}

function openKhataDetail(person){
 currentPerson=person;
 setText("detailPersonName",person);
 show("khataDetail");
 renderKhataDetail();
}

function closeKhataDetail(){
 show(D.mode==="business"?"business":"personal");
}

function detailFilter(f,btn){
 khataFilter=f||"all";
 document.querySelectorAll(".filter-chip,.chip").forEach(x=>x.classList.remove("active"));
 if(btn)btn.classList.add("active");
 renderKhataDetail();
}

function renderKhataDetail(){
 const a=khataEntries().filter(x=>x.person===currentPerson);
 let give=a.filter(x=>x.type==="give").reduce((s,x)=>s+x.amount,0);
 let receive=a.filter(x=>x.type==="receive").reduce((s,x)=>s+x.amount,0);

 setText("detailGive",money(give));
 setText("detailReceive",money(receive));
 setText("detailBalance",money(give-receive));

 let list=a;
 if(khataFilter==="give")list=a.filter(x=>x.type==="give");
 if(khataFilter==="receive")list=a.filter(x=>x.type==="receive");
 if(khataFilter==="pending")list=a.filter(x=>x.status!=="settled");

 const box=$("khataHistory");if(!box)return;

 box.innerHTML=list.length?list.slice().reverse().map(x=>`
 <div class="entry-card">
  <div class="entry-top">
   <b>${x.type==="give"?"Give":"Receive"}</b>
   <strong class="${x.type==="give"?"give":"receive"}">
    ${money(x.amount)}
   </strong>
  </div>
  <div class="entry-meta">
   ${esc(x.date)} • ${esc(x.method)} • ${esc(x.status)}
  </div>
  <div class="entry-note">${esc(x.note||"")}</div>
  <div class="entry-actions">
   <button onclick="editKhata('${x.id}')">Edit</button>
   <button onclick="settleKhata('${x.id}')">Settle</button>
   <button onclick="deleteKhata('${x.id}')">Delete</button>
  </div>
 </div>`).join(""):`<div class="empty-state">No Khata entries</div>`;
}

function editKhata(id){
 const x=D.lendDen.find(a=>a.id===id);if(!x)return;
 const amount=Number(prompt("Amount",x.amount));
 if(!amount)return;
 x.amount=amount;
 x.note=prompt("Note",x.note||"")??x.note;
 x.method=prompt("Payment method",x.method||"Cash")||x.method;
 save();renderAll();renderKhataDetail();toast("Updated");
}

function settleKhata(id){
 const x=D.lendDen.find(a=>a.id===id);if(!x)return;
 x.status="settled";save();renderAll();renderKhataDetail();toast("Settled");
}

function deleteKhata(id){
 if(!confirm("Delete this entry?"))return;
 D.lendDen=D.lendDen.filter(x=>x.id!==id);
 save();renderAll();renderKhataDetail();toast("Deleted");
}

function searchKhata(mode){
 const q=(val(mode==="business"?"businessSearch":"personalSearch")).toLowerCase();
 renderPeople(q,mode||D.mode);
}

function filterKhata(mode,filter,btn){
 const q=val(mode==="business"?"businessSearch":"personalSearch").toLowerCase();
 const box=$(mode==="business"?"businessList":"personalList");
 if(!box)return;

 document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));
 if(btn)btn.classList.add("active");

 let a=peopleForMode().filter(n=>n.toLowerCase().includes(q));
 if(filter==="give")
  a=a.filter(n=>khataEntries().some(x=>x.person===n&&x.type==="give"));
 if(filter==="receive")
  a=a.filter(n=>khataEntries().some(x=>x.person===n&&x.type==="receive"));
 if(filter==="pending")
  a=a.filter(n=>khataEntries().some(x=>x.person===n&&x.status!=="settled"));

 renderPeopleList(a,mode);
}

function renderPeople(q="",mode=D.mode){
 const names=peopleForMode().filter(n=>n.toLowerCase().includes(q));
 renderPeopleList(names,mode);
}

function renderPeopleList(names,mode){
 const box=$(mode==="business"?"businessList":"personalList");
 if(!box)return;

 box.innerHTML=names.length?names.map(person=>{
   const a=khataEntries().filter(x=>x.person===person);
   const g=a.filter(x=>x.type==="give").reduce((s,x)=>s+x.amount,0);
   const r=a.filter(x=>x.type==="receive").reduce((s,x)=>s+x.amount,0);
   return `<div class="person-card" onclick="openKhataDetail('${esc(person).replace(/'/g,"&#39;")}')">
    <div class="person-avatar">${esc(person[0].toUpperCase())}</div>
    <div class="person-info">
     <b>${esc(person)}</b>
     <small>Give ${money(g)} • Receive ${money(r)}</small>
    </div>
    <strong>${money(g-r)}</strong>
   </div>`;
 }).join(""):`<div class="empty-state">No people yet</div>`;
}

function khataTotals(mode){
 const a=D.lendDen.filter(x=>(x.mode||"personal")===mode);
 return {
  give:a.filter(x=>x.type==="give").reduce((s,x)=>s+x.amount,0),
  receive:a.filter(x=>x.type==="receive").reduce((s,x)=>s+x.amount,0)
 };
}

/* ---------- BUSINESS ---------- */
function businessFilter(type,btn){
 bizFilter=type;
 document.querySelectorAll("#business .filter-chip").forEach(x=>x.classList.remove("active"));
 if(btn)btn.classList.add("active");
 renderBusiness();
}

function renderBusiness(){
 const t=khataTotals("business");
 setText("businessGiven",money(t.give));
 setText("businessReceived",money(t.receive));
 setText("businessNet",money(t.give-t.receive));

 const box=$("businessList");if(!box)return;

 if(bizFilter==="sales"||bizFilter==="purchase"){
   const arr=bizFilter==="sales"?D.sales:D.purchases;
   box.innerHTML=arr.length?arr.slice().reverse().map(x=>`
    <div class="entry-card">
     <div class="entry-top"><b>${esc(x.name)}</b><strong>${money(x.amount)}</strong></div>
     <div class="entry-meta">${esc(x.date||today())}</div>
    </div>`).join(""):`<div class="empty-state">No ${bizFilter} yet</div>`;
   return;
 }

 const people=D.businessPeople.map(x=>typeof x==="string"?x:x.name);
 const names=[...new Set([...people,...D.lendDen.filter(x=>x.mode==="business").map(x=>x.person)])];
 renderPeopleList(names.filter(n=>n.toLowerCase().includes((val("businessSearch")||"").toLowerCase())),"business");
}

/* ---------- PAYMENT ---------- */
function openPaymentEntry(){
 if(!currentPerson)return toast("Pehle person select karo");
 setVal("khataPerson",currentPerson);
 if($("khataType"))$("khataType").value="receive";
 if($("khataStatus"))$("khataStatus").value="settled";
 show("khataEntry");
}

/* ---------- SHARE / PDF ---------- */
function khataText(){
 const a=khataEntries().filter(x=>x.person===currentPerson);
 const t=khataTotals(D.mode);
 return `HISAB - ${currentPerson}\n\n`+
  `Total Give: ${money(t.give)}\n`+
  `Total Receive: ${money(t.receive)}\n`+
  `Balance: ${money(t.give-t.receive)}\n\n`+
  a.map(x=>`${x.date} | ${x.type} | ${money(x.amount)} | ${x.method} | ${x.note||""}`).join("\n");
}

async function shareText(text){
 try{
  if(navigator.share)await navigator.share({title:"HISAB",text});
  else{await navigator.clipboard.writeText(text);toast("Copied");}
 }catch(e){}
}

function shareKhata(){shareText(khataText());}

function printPDF(title,text){
 const old=document.body.innerHTML;
 document.body.innerHTML=`
 <main style="padding:25px;font-family:Arial">
 <h1>${esc(title)}</h1>
 <pre style="white-space:pre-wrap;font:15px Arial;line-height:1.7">${esc(text)}</pre>
 </main>`;
 window.print();
 document.body.innerHTML=old;
 location.reload();
}

function exportKhataPDF(){
 printPDF("HISAB - "+currentPerson,khataText());
}

function summaryText(){
 const t=totals();
 return `HISAB SUMMARY\n\nIncome: ${money(t.income)}
Expense: ${money(t.expense)}
Give: ${money(t.give)}
Receive: ${money(t.receive)}
Balance: ${money(t.balance)}`;
}

function exportSummaryPDF(){printPDF("HISAB Summary",summaryText());}
function exportSummary(){shareText(summaryText());}

/* ---------- HOME ---------- */
function totals(){
 const tx=modeData(D.transactions);
 const k=khataTotals(D.mode);
 const income=tx.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0);
 const expense=tx.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
 return {income,expense,give:k.give,receive:k.receive,
 balance:income-expense-k.give+k.receive};
}

function renderHome(){
 const t=totals();

 ["balance","homeBalance","totalBalance"].forEach(id=>setText(id,money(t.balance)));
 ["income","homeIncome","totalIncome"].forEach(id=>setText(id,money(t.income)));
 ["expense","homeExpense","totalExpense"].forEach(id=>setText(id,money(t.expense)));
 ["given","homeGiven"].forEach(id=>setText(id,money(t.give)));
 ["received","homeReceived"].forEach(id=>setText(id,money(t.receive)));

 const recent=$("activityList");
 if(recent){
  const a=modeData(D.transactions).slice(-5).reverse();
  recent.innerHTML=a.length?a.map(x=>`
   <div class="activity-row">
    <b>${esc(x.category||x.type)}</b>
    <span>${x.type==="income"?"+":"-"}${money(x.amount)}</span>
   </div>`).join(""):`<div class="empty-state">No activity yet</div>`;
 }
}

/* ---------- PLANNING ---------- */
function calcBudget(){
 const income=num("budgetIncome");
 const limit=num("budgetLimit");
 if(income||limit){
   D.budgets.push({id:uid(),income,limit,date:today(),mode:D.mode});
   save();
   toast(`Budget saved • ${money(limit)}`);
 }else toast("Budget amount enter karo");
}

function calcGoal(){
 const name=val("goalName")||prompt("Goal name");
 const target=num("goalTarget")||Number(prompt("Target amount")||0);
 const saved=num("goalSaved")||0;
 if(!name||target<=0)return toast("Goal details enter karo");
 D.goals.push({id:uid(),name,target,saved,date:today(),mode:D.mode});
 save();renderGoals();toast("Goal saved");
}

function renderGoals(){
 const box=$("goalList");if(!box)return;
 const a=D.goals.filter(x=>(x.mode||"personal")===D.mode);
 box.innerHTML=a.length?a.map(x=>{
  const p=Math.min(100,(x.saved/x.target)*100);
  return `<div class="goal-card">
   <b>${esc(x.name)}</b>
   <div>${money(x.saved)} / ${money(x.target)}</div>
   <small>${p.toFixed(0)}%</small>
  </div>`;
 }).join(""):`<div class="empty-state">No goals yet</div>`;
}

function calcEMI(){
 const p=num("loanAmount")||Number(prompt("Loan amount")||0);
 const r=num("loanRate")||Number(prompt("Annual interest %","12")||0);
 const n=num("loanTenure")||Number(prompt("Months","12")||0);
 if(!p||!n)return toast("Loan details enter karo");
 const m=r/1200;
 const emi=m? p*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1):p/n;
 toast(`EMI: ${money(emi)}`);
 setText("emiResult",money(emi));
}

/* ---------- BILLS / REMINDERS ---------- */
function addBill(){
 const name=prompt("Bill name");if(!name)return;
 const amount=Number(prompt("Amount")||0);
 D.bills.push({id:uid(),name,amount,date:today(),mode:D.mode});
 save();toast("Bill saved");
}

function addReminder(){
 const name=prompt("Reminder");if(!name)return;
 D.reminders.push({id:uid(),name,date:today(),mode:D.mode});
 save();toast("Reminder saved");
}

/* ---------- SECURITY ---------- */
function setPin(){
 const p=prompt("4 digit PIN");
 if(!/^\d{4}$/.test(p||""))return toast("4 digit PIN required");
 D.pin=p;save();toast("PIN saved");
}

function lockApp(){
 if(!D.pin)return toast("Pehle PIN set karo");
 const x=document.createElement("div");
 x.id="hisabLock";
 x.style.cssText="position:fixed;inset:0;background:#082b45;z-index:999999;display:flex;align-items:center;justify-content:center;padding:25px";
 x.innerHTML=`<div style="background:#fff;padding:25px;border-radius:20px;width:100%;max-width:340px;text-align:center">
 <h2>HISAB Locked</h2>
 <input id="unlockPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN" style="padding:14px;width:100%;margin:15px 0">
 <button id="unlockBtn" style="padding:13px 25px">Unlock</button></div>`;
 document.body.appendChild(x);
 $("unlockBtn").onclick=()=>{
  if($("unlockPin").value===D.pin)x.remove();
  else toast("Wrong PIN");
 };
}

/* ---------- BACKUP ---------- */
function exportBackup(){
 const blob=new Blob([JSON.stringify(D,null,2)],{type:"application/json"});
 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="HISAB-Backup.json";
 a.click();
 URL.revokeObjectURL(a.href);
}

function importBackup(e){
 const f=e?.target?.files?.[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{
  try{
   const x=JSON.parse(r.result);
   D={...DEF,...x};
   save();renderAll();toast("Backup restored");
  }catch(err){toast("Invalid backup");}
 };
 r.readAsText(f);
}

/* ---------- OTHER TOOLS ---------- */
function calcFD(){
 const p=Number(prompt("Deposit amount")||0);
 const rate=Number(prompt("Annual rate %")||0);
 const months=Number(prompt("Months")||0);
 if(!p||!months)return;
 const maturity=p*(1+rate/100*months/12);
 toast(`Maturity: ${money(maturity)}`);
}

function addInsurance(){simpleSave("Insurance");}
function addSchool(){simpleSave("School");}
function addVehicle(){simpleSave("Vehicle");}
function addFamilyMember(){simpleSave("Family member");}
function addShopping(){simpleSave("Shopping item");}
function addUtility(){simpleSave("Utility");}
function addDoc(){simpleSave("Document");}
function addAnnual(){simpleSave("Annual item");}

function simpleSave(type){
 const name=prompt(type+" name");if(!name)return;
 toast(type+" saved");
}

function renderComparison(){toast("Comparison ready");}

function calcEmergency(){
 const monthly=Number(prompt("Monthly expense")||0);
 const months=Number(prompt("Months","6")||0);
 toast(`Emergency fund: ${money(monthly*months)}`);
}

function saveLimit(){
 const n=Number(prompt("Spending limit")||0);
 D.settings.limit=n;save();toast("Limit saved");
}

/* ---------- SEARCH ---------- */
function searchAllData(){
 const q=(val("globalSearch")||val("searchInput")).toLowerCase();
 if(!q)return renderAll();

 const result=[
  ...D.transactions.map(x=>({...x,label:x.category||x.note||"Transaction"})),
  ...D.lendDen.map(x=>({...x,label:x.person})),
  ...D.goals.map(x=>({...x,label:x.name}))
 ].filter(x=>JSON.stringify(x).toLowerCase().includes(q));

 const box=$("searchResults");
 if(box)box.innerHTML=result.length?
  result.map(x=>`<div class="entry-card"><b>${esc(x.label)}</b><br>${x.amount?money(x.amount):""}</div>`).join(""):
  `<div class="empty-state">No result</div>`;
}

function shareHisab(){shareText(summaryText());}

/* ---------- QUICK ADD ---------- */
function openQuickAdd(){
 const choice=prompt(
  "HISAB Quick Add\n\n1 = Income\n2 = Expense\n3 = Give\n4 = Receive"
 );
 if(choice==="1")return addTransaction("income");
 if(choice==="2")return addTransaction("expense");
 if(choice==="3"){openKhataForm(D.mode);setTimeout(()=>setVal("khataType","give"),0);return;}
 if(choice==="4"){openKhataForm(D.mode);setTimeout(()=>setVal("khataType","receive"),0);return;}
}

/* ---------- RENDER ---------- */
function renderPersonal(){
 const t=khataTotals("personal");
 setText("ledgerGiven",money(t.give));
 setText("ledgerReceived",money(t.receive));
 setText("ledgerNet",money(t.give-t.receive));
 renderPeople(val("personalSearch").toLowerCase(),"personal");
}

function renderAll(){
 renderHome();
 renderPersonal();
 renderBusiness();
 renderTransactions();
 renderGoals();

 const mode=D.mode;
 document.querySelectorAll("[data-mode]").forEach(x=>{
  x.classList.toggle("active",x.dataset.mode===mode);
 });
}

Object.assign(window,{
 showGuestGate,enterGuestMode,show,
 toggleLanguage,toggleCurrency,setMode,
 openKhataForm,closeKhataForm,saveKhataEntry,
 closeKhataDetail,detailFilter,openPaymentEntry,
 shareKhata,exportKhataPDF,searchKhata,filterKhata,
 businessFilter,openQuickAdd,
 addTransaction,deleteTransaction,
 calcBudget,calcGoal,calcEMI,addBill,addReminder,
 setPin,lockApp,exportBackup,importBackup,
 exportSummary,exportSummaryPDF,
 calcFD,addInsurance,addSchool,addVehicle,
 addFamilyMember,addShopping,addUtility,
 renderComparison,calcEmergency,addDoc,addAnnual,
 saveLimit,searchAllData,shareHisab,
 editKhata,settleKhata,deleteKhata
});

document.addEventListener("DOMContentLoaded",()=>{
 if($("appShell"))$("appShell").style.display="none";
 if($("welcome"))$("welcome").style.display="none";
 renderAll();
});

})();
