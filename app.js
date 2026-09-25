/* HISAB GLOBAL V7 — FINAL CONTROLLER
   Personal + Business + Udhar + Customers/Suppliers
*/

const KEY="hisab_v7_data";

let D={
  mode:"personal",currency:"₹",language:"en",
  transactions:[],khata:[],business:[],
  goals:[],bills:[],cards:[],loans:[],emis:[],
  reminders:[],family:[],tools:[],budget:0,pin:"",
  filter:"all",businessFilter:"customer",
  detailPerson:"",detailPhone:"",detailMode:"personal",
  detailFilter:"all",businessEntryRole:"customer"
};

let editKhataId=null;

const $=id=>document.getElementById(id);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const today=()=>new Date().toISOString().slice(0,10);
const val=id=>String($(id)?.value||"").trim();
const num=id=>Number($(id)?.value||0);

function money(n){
  return D.currency+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
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

  [
    "transactions","khata","business","goals","bills","cards",
    "loans","emis","reminders","family","tools"
  ].forEach(k=>D[k] ||= []);

  D.businessFilter ||= "customer";
  D.businessEntryRole ||= "customer";
  D.filter ||= "all";

  /* old data migration */
  D.khata.forEach(x=>{
    if(x.type==="given")x.type="give";
    if(x.type==="received")x.type="receive";
    if(x.mode==="business"&&!x.role)x.role="customer";
  });

  save();
}


/* ================= NAVIGATION ================= */

function hideAll(){
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
}

function show(id){
  hideAll();
  const p=$(id);
  if(!p)return;
  p.style.display="block";
  window.scrollTo(0,0);

  if(id==="home")renderHome();
  if(id==="personal")renderPersonal();
  if(id==="business")renderBusiness();
  if(id==="transactions")renderTransactions();
  if(id==="planning")renderPlanning();
  if(id==="credit")renderPayments();
  if(id==="reports")showReports();
  if(id==="reminders")renderReminders();
  if(id==="privacy")renderPrivacy();
  if(id==="family")renderFamily();
  if(id==="familytools")renderFamilyTools();
  if(id==="tools13")renderTools();
  if(id==="final")renderSettings();
}

function goBack(){
  const p=[...document.querySelectorAll(".page")]
    .find(x=>getComputedStyle(x).display!=="none");
  const id=p?.id||"";

  if(id==="khataEntry"||id==="khataDetail"){
    show(D.detailMode==="business"?"business":"personal");
    return;
  }

  if([
    "personal","business","transactions","planning","credit",
    "reports","reminders","privacy","family","familytools",
    "tools13","final"
  ].includes(id)){
    show("home");
    return;
  }

  show("home");
}


/* ================= START ================= */

function showGuestGate(){
  load();

  const gate=$("guestGate"),shell=$("appShell");
  if(gate)gate.style.display="none";
  if(shell)shell.style.display="block";

  show(D.mode==="business"?"business":"home");
}

function enterGuestMode(){
  showGuestGate();
}

function enterApp(){
  showGuestGate();
}


/* ================= HOME / MODE ================= */

function setMode(mode){
  D.mode=mode;
  if(mode==="business"){
    D.businessFilter=D.businessFilter||"customer";
    D.businessEntryRole=D.businessFilter;
  }
  save();

  if(mode==="business")show("business");
  else show("home");
}

function openBusiness(){
  setMode("business");
}

function openPersonal(){
  setMode("personal");
}

function renderHome(){
  if($("modeLabel"))
    $("modeLabel").textContent=D.mode==="business"?"Business":"Personal";

  if($("receivable"))
    $("receivable").textContent=money(totalGive(D.mode));

  if($("payable"))
    $("payable").textContent=money(totalReceive(D.mode));

  if($("homeBalance"))
    $("homeBalance").textContent=
      money(totalIncome()-totalExpense());

  fixHomeButtons();
}

function fixHomeButtons(){
  const box=$("hisabModeBox");
  if(!box)return;

  box.innerHTML=`
    <div style="display:flex;gap:8px;margin:10px 0 14px">
      <button type="button"
        onclick="setMode('personal')"
        style="flex:1;border:0;border-radius:12px;padding:12px;
        font-weight:700;background:${D.mode==="personal"?"#0b5ed7":"#eef2f7"};
        color:${D.mode==="personal"?"#fff":"#222"}">
        Personal
      </button>

      <button type="button"
        onclick="setMode('business')"
        style="flex:1;border:0;border-radius:12px;padding:12px;
        font-weight:700;background:${D.mode==="business"?"#0b5ed7":"#eef2f7"};
        color:${D.mode==="business"?"#fff":"#222"}">
        Business
      </button>
    </div>`;
}


/* ================= LANGUAGE / CURRENCY ================= */

function toggleLanguage(){
  D.language=D.language==="en"?"hi":"en";
  save();
  alert(D.language==="hi"?"भाषा हिन्दी की गई":"Language changed to English");
}

function toggleCurrency(){
  const a=["₹","$","€","£"];
  D.currency=a[(a.indexOf(D.currency)+1)%a.length];
  save();
  const p=[...document.querySelectorAll(".page")]
    .find(x=>getComputedStyle(x).display!=="none");
  if(p)show(p.id);
}


/* ================= TRANSACTIONS ================= */

function totalIncome(){
  return D.transactions
    .filter(x=>x.type==="income"&&(!x.mode||x.mode===D.mode))
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function totalExpense(){
  return D.transactions
    .filter(x=>x.type==="expense"&&(!x.mode||x.mode===D.mode))
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function addTransaction(type=""){
  type=type||val("transactionType")||"expense";

  let amount=num("transactionAmount");
  if(!amount)
    amount=Number(prompt(type==="income"?"Income amount":"Expense amount")||0);

  if(amount<=0)return alert("Enter valid amount");

  const row={
    id:uid(),
    mode:D.mode,
    type,
    amount,
    category:val("transactionCategory")||"General",
    note:val("transactionNote"),
    date:val("transactionDate")||today(),
    created:Date.now()
  };

  D.transactions.push(row);

  ["transactionAmount","transactionCategory","transactionNote"]
    .forEach(id=>{if($(id))$(id).value=""});

  save();
  show("transactions");
}

function openIncome(){
  show("transactions");
  setTimeout(()=>{
    if($("transactionType"))$("transactionType").value="income";
    if($("transactionDate"))$("transactionDate").value=today();
  },30);
}

function openExpense(){
  show("transactions");
  setTimeout(()=>{
    if($("transactionType"))$("transactionType").value="expense";
    if($("transactionDate"))$("transactionDate").value=today();
  },30);
}

function deleteTransaction(id){
  if(!confirm("Delete this transaction?"))return;
  D.transactions=D.transactions.filter(x=>x.id!==id);
  save();
  renderTransactions();
  renderHome();
}

function renderTransactions(){
  const list=$("transactionList");
  if(!list)return;

  const rows=D.transactions
    .filter(x=>!x.mode||x.mode===D.mode)
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  list.innerHTML=rows.length?rows.map(x=>`
    <div class="card" style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:10px">
        <div>
          <b>${esc(x.category)}</b>
          <div>${esc(x.note||"")}</div>
          <small>${esc(x.date)}</small>
        </div>
        <b style="color:${x.type==="income"?"#16823b":"#c62828"}">
          ${x.type==="income"?"+":"-"}${money(x.amount)}
        </b>
      </div>
      <button type="button" onclick="deleteTransaction('${x.id}')">
        Delete
      </button>
    </div>
  `).join(""):`<div class="card">No transactions yet.</div>`;
}


/* ================= UDHAAR ================= */

function khataData(mode){
  return D.khata.filter(x=>(x.mode||"personal")===mode);
}

function totalGive(mode=D.mode){
  return khataData(mode)
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function totalReceive(mode=D.mode){
  return khataData(mode)
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function openKhataForm(mode="personal",person="",phone=""){
  D.detailMode=mode;
  D.detailPerson=person;
  D.detailPhone=phone;
  editKhataId=null;

  if($("khataPerson"))$("khataPerson").value=person;
  if($("khataType"))$("khataType").value="give";
  if($("khataAmount"))$("khataAmount").value="";
  if($("khataDate"))$("khataDate").value=today();
  if($("khataMethod"))$("khataMethod").value="Cash";
  if($("khataStatus"))$("khataStatus").value="pending";
  if($("khataNote"))$("khataNote").value="";

  show("khataEntry");
}

function closeKhataForm(){
  show(D.detailMode==="business"?"business":"personal");
}

function saveKhataEntry(){
  const person=val("khataPerson");
  const amount=num("khataAmount");

  if(!person)return alert("Enter name");
  if(amount<=0)return alert("Enter valid amount");

  const mode=D.detailMode||"personal";

  const row={
    id:editKhataId||uid(),
    mode,
    person,
    phone:D.detailPhone||"",
    type:val("khataType")||"give",
    amount,
    date:val("khataDate")||today(),
    method:val("khataMethod")||"Cash",
    status:val("khataStatus")||"pending",
    note:val("khataNote"),
    role:mode==="business"
      ?(D.businessEntryRole||D.businessFilter||"customer")
      :"customer",
    created:Date.now()
  };

  if(editKhataId){
    const i=D.khata.findIndex(x=>x.id===editKhataId);
    if(i>=0)D.khata[i]=row;
    else D.khata.push(row);
  }else D.khata.push(row);

  editKhataId=null;
  save();

  show(mode==="business"?"business":"personal");
}

function filterKhata(mode,type,btn){
  D.filter=type;
  document.querySelectorAll("#personal .filter-row button")
    .forEach(b=>b.classList.remove("active"));
  if(btn)btn.classList.add("active");
  renderPersonal();
}

function searchKhata(mode){
  mode==="business"?renderBusiness():renderPersonal();
}

function renderPersonal(){
  const list=$("personalList");
  if(!list)return;

  const q=val("personalSearch").toLowerCase();

  let rows=khataData("personal");

  if(D.filter==="give")
    rows=rows.filter(x=>x.type==="give");
  else if(D.filter==="receive")
    rows=rows.filter(x=>x.type==="receive");
  else if(D.filter==="pending")
    rows=rows.filter(x=>x.status==="pending");

  if(q){
    rows=rows.filter(x=>
      String(x.person).toLowerCase().includes(q)||
      String(x.phone||"").includes(q)
    );
  }

  const give=rows.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=rows.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  if($("ledgerGiven"))$("ledgerGiven").textContent=money(give);
  if($("ledgerReceived"))$("ledgerReceived").textContent=money(receive);
  if($("ledgerNet"))$("ledgerNet").textContent=money(give-receive);

  const people={};

  rows.forEach(x=>{
    const k=String(x.person).toLowerCase()+"|"+String(x.phone||"");
    if(!people[k])
      people[k]={name:x.person,phone:x.phone||"",rows:[]};
    people[k].rows.push(x);
  });

  const arr=Object.values(people);

  list.innerHTML=arr.length
    ?arr.map(personCard).join("")
    :`<div class="card">No Udhaar entries yet.</div>`;
}

function personCard(p){
  const give=p.rows.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=p.rows.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  return `
    <div class="card" style="margin-bottom:10px">
      <b>${esc(p.name)}</b>
      ${p.phone?`<div>${esc(p.phone)}</div>`:""}

      <div style="margin-top:6px">
        <span style="color:#c62828">Give ${money(give)}</span>
        &nbsp;
        <span style="color:#16823b">Receive ${money(receive)}</span>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        <button type="button"
          onclick="openKhataDetail('personal','${esc(p.name)}','${esc(p.phone)}')">
          Khata
        </button>
        <button type="button"
          onclick="openKhataForm('personal','${esc(p.name)}','${esc(p.phone)}')">
          + Entry
        </button>
      </div>
    </div>`;
}

function openKhataDetail(mode,person,phone=""){
  D.detailMode=mode;
  D.detailPerson=person;
  D.detailPhone=phone;
  D.detailFilter="all";
  show("khataDetail");
}

function closeKhataDetail(){
  show(D.detailMode==="business"?"business":"personal");
}

function detailFilter(type,btn){
  D.detailFilter=type;
  document.querySelectorAll("#khataDetail .filter-row button")
    .forEach(b=>b.classList.remove("active"));
  if(btn)btn.classList.add("active");
  renderKhataDetail();
}

function renderKhataDetail(){
  const person=D.detailPerson||"";

  let rows=khataData(D.detailMode)
    .filter(x=>String(x.person).toLowerCase()===person.toLowerCase())
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  const give=rows.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=rows.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  if($("detailPersonName"))$("detailPersonName").textContent=person;
  if($("detailGive"))$("detailGive").textContent=money(give);
  if($("detailReceive"))$("detailReceive").textContent=money(receive);
  if($("detailBalance"))$("detailBalance").textContent=money(give-receive);

  if(D.detailFilter==="give")rows=rows.filter(x=>x.type==="give");
  if(D.detailFilter==="receive")rows=rows.filter(x=>x.type==="receive");
  if(D.detailFilter==="pending")rows=rows.filter(x=>x.status==="pending");

  if($("khataHistory"))
    $("khataHistory").innerHTML=rows.length
      ?rows.map(khataEntryCard).join("")
      :`<div class="card">No history.</div>`;
}

function khataEntryCard(x){
  return `
    <div class="card" style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between">
        <b style="color:${x.type==="give"?"#c62828":"#16823b"}">
          ${x.type==="give"?"Give":"Receive"}
        </b>
        <b>${money(x.amount)}</b>
      </div>
      <div>${esc(x.date)} • ${esc(x.method||"Cash")}</div>
      <div>${esc(x.note||"")}</div>
      <div>${esc(x.status||"pending")}</div>

      <div style="display:flex;gap:6px;margin-top:7px">
        <button type="button" onclick="editKhata('${x.id}')">Edit</button>
        <button type="button" onclick="deleteKhata('${x.id}')">Delete</button>
        ${x.status!=="settled"
          ?`<button type="button" onclick="settleKhata('${x.id}')">Settle</button>`
          :""}
      </div>
    </div>`;
}

function editKhata(id){
  const x=D.khata.find(a=>a.id===id);
  if(!x)return;

  editKhataId=id;
  D.detailMode=x.mode||"personal";
  D.detailPerson=x.person||"";
  D.detailPhone=x.phone||"";
  D.businessEntryRole=x.role||"customer";

  show("khataEntry");

  setTimeout(()=>{
    if($("khataPerson"))$("khataPerson").value=x.person||"";
    if($("khataType"))$("khataType").value=x.type||"give";
    if($("khataAmount"))$("khataAmount").value=x.amount||"";
    if($("khataDate"))$("khataDate").value=x.date||today();
    if($("khataMethod"))$("khataMethod").value=x.method||"Cash";
    if($("khataStatus"))$("khataStatus").value=x.status||"pending";
    if($("khataNote"))$("khataNote").value=x.note||"";
  },20);
}

function deleteKhata(id){
  if(!confirm("Delete this entry?"))return;
  D.khata=D.khata.filter(x=>x.id!==id);
  save();
  renderKhataDetail();
  renderPersonal();
  renderBusiness();
}

function settleKhata(id){
  const x=D.khata.find(a=>a.id===id);
  if(!x)return;
  x.status="settled";
  save();
  renderKhataDetail();
  renderPersonal();
  renderBusiness();
}

function openPaymentEntry(){
  openKhataForm(
    D.detailMode||"personal",
    D.detailPerson||"",
    D.detailPhone||""
  );
}


/* ================= BUSINESS ================= */

function businessFilter(type,btn){
  D.businessFilter=type;
  D.businessEntryRole=
    type==="supplier"?"supplier":"customer";
  save();

  document.querySelectorAll("#business .business-tabs button")
    .forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");

  renderBusiness();
}

function setBusinessFilter(type){
  D.businessFilter=type;
  D.businessEntryRole=type;
  save();
  renderBusiness();
}

function addBusinessCustomer(){
  openBusinessCustomerForm("","","customer");
}

function addBusinessSupplier(){
  openBusinessCustomerForm("","","supplier");
}

function openBusinessCustomerForm(name="",phone="",role="customer"){
  D.businessEntryRole=role;

  const old=$("businessPersonModal");
  if(old)old.remove();

  const modal=document.createElement("div");
  modal.id="businessPersonModal";

  modal.style.cssText=
    "position:fixed;inset:0;background:rgba(0,0,0,.55);"+
    "z-index:99999;display:flex;align-items:center;"+
    "justify-content:center;padding:18px";

  modal.innerHTML=`
    <div style="
      background:#fff;width:100%;max-width:430px;
      border-radius:18px;padding:18px;
      box-shadow:0 10px 40px rgba(0,0,0,.25)
    ">
      <div style="
        display:flex;justify-content:space-between;
        align-items:center
      ">
        <h3>${role==="supplier"?"Add Supplier":"Add Customer"}</h3>

        <button type="button"
          id="closeBusinessCustomer"
          style="
            border:0;background:transparent;
            font-size:28px;line-height:1
          ">×</button>
      </div>

      <input id="businessPersonName"
        placeholder="Name"
        value="${esc(name)}"
        style="width:100%;padding:12px;margin:10px 0">

      <input id="businessPersonPhone"
        placeholder="Mobile number"
        value="${esc(phone)}"
        inputmode="tel"
        style="width:100%;padding:12px;margin-bottom:10px">

      <button type="button"
        id="selectBusinessContact"
        style="width:100%;padding:12px;margin-bottom:8px">
        📱 Select Contact
      </button>

      <button type="button"
        id="saveBusinessPerson"
        style="width:100%;padding:12px">
        Save
      </button>
    </div>`;

  document.body.appendChild(modal);

  $("closeBusinessCustomer").onclick=()=>modal.remove();

  $("selectBusinessContact").onclick=selectBusinessContact;

  $("saveBusinessPerson").onclick=()=>{
    const n=String($("businessPersonName")?.value||"").trim();
    const p=String($("businessPersonPhone")?.value||"").trim();

    if(!n)return alert("Enter name");

    D.business.push({
      id:uid(),
      role,
      name:n,
      phone:p,
      created:Date.now()
    });

    save();
    modal.remove();
    D.businessFilter=role;
    D.businessEntryRole=role;
    renderBusiness();
  };
}

async function selectBusinessContact(){
  try{
    if(navigator.contacts?.select){
      const c=await navigator.contacts.select(
        ["name","tel"],
        {multiple:false}
      );

      if(c?.[0]){
        if($("businessPersonName"))
          $("businessPersonName").value=c[0].name?.[0]||"";

        if($("businessPersonPhone"))
          $("businessPersonPhone").value=c[0].tel?.[0]||"";
      }
      return;
    }
  }catch(e){}

  alert("Contact picker is not available here. Enter name and mobile number manually.");
}

function getBusinessPeople(role){
  const map={};

  D.business
    .filter(x=>x.role===role&&x.name)
    .forEach(x=>{
      const k=String(x.name).toLowerCase()+"|"+String(x.phone||"");
      if(!map[k])
        map[k]={
          name:x.name,
          phone:x.phone||"",
          role,
          rows:[]
        };
    });

  D.khata
    .filter(x=>
      x.mode==="business"&&
      (x.role||"customer")===role
    )
    .forEach(x=>{
      const k=String(x.person).toLowerCase()+"|"+String(x.phone||"");

      if(!map[k])
        map[k]={
          name:x.person,
          phone:x.phone||"",
          role,
          rows:[]
        };

      map[k].rows.push(x);
    });

  return Object.values(map).map(p=>({
    ...p,
    give:p.rows
      .filter(x=>x.type==="give")
      .reduce((a,x)=>a+Number(x.amount||0),0),
    receive:p.rows
      .filter(x=>x.type==="receive")
      .reduce((a,x)=>a+Number(x.amount||0),0)
  }));
}

function openBusinessEntry(role="customer",person="",phone=""){
  D.businessEntryRole=role;
  D.detailMode="business";
  D.detailPerson=person;
  D.detailPhone=phone;
  openKhataForm("business",person,phone);
}

function openBusinessDetail(person,phone="",role="customer"){
  D.detailMode="business";
  D.detailPerson=person;
  D.detailPhone=phone;
  D.businessEntryRole=role;
  show("khataDetail");
}

function renderBusiness(){
  const list=$("businessList");
  if(!list)return;

  const type=D.businessFilter||"customer";
  const q=val("businessSearch").toLowerCase();

  if(type==="sales"||type==="purchase"){
    renderBusinessRecords(type);
    return;
  }

  const role=type==="supplier"?"supplier":"customer";

  let people=getBusinessPeople(role);

  if(q){
    people=people.filter(p=>
      p.name.toLowerCase().includes(q)||
      String(p.phone||"").includes(q)
    );
  }

  const give=people.reduce((a,x)=>a+x.give,0);
  const receive=people.reduce((a,x)=>a+x.receive,0);

  if($("businessGiven"))$("businessGiven").textContent=money(give);
  if($("businessReceived"))$("businessReceived").textContent=money(receive);
  if($("businessNet"))$("businessNet").textContent=money(give-receive);

  list.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button type="button"
        onclick="businessFilter('customer',this)"
        style="flex:1;background:${role==="customer"?"#0b5ed7":"#eef2f7"};
        color:${role==="customer"?"#fff":"#222"}">
        Customers
      </button>

      <button type="button"
        onclick="businessFilter('supplier',this)"
        style="flex:1;background:${role==="supplier"?"#0b5ed7":"#eef2f7"};
        color:${role==="supplier"?"#fff":"#222"}">
        Suppliers
      </button>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button type="button"
        onclick="addBusinessCustomer()" style="flex:1">
        + Customer
      </button>

      <button type="button"
        onclick="addBusinessSupplier()" style="flex:1">
        + Supplier
      </button>
    </div>

    ${
      people.length
      ?people.map(businessPersonCard).join("")
      :`<div class="card">No ${role}s yet.</div>`
    }`;
}

function businessPersonCard(p){
  return `
    <div class="card" style="margin-bottom:10px">
      <b>${esc(p.name)}</b>
      ${p.phone?`<div>${esc(p.phone)}</div>`:""}

      <div style="margin-top:6px">
        <span style="color:#c62828">
          Give ${money(p.give)}
        </span>
        &nbsp;
        <span style="color:#16823b">
          Receive ${money(p.receive)}
        </span>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
        <button type="button"
          onclick="openBusinessDetail(${JSON.stringify(p.name)},${JSON.stringify(p.phone)},${JSON.stringify(p.role)})">
          Khata
        </button>

        <button type="button"
          onclick="openBusinessEntry(${JSON.stringify(p.role)},${JSON.stringify(p.name)},${JSON.stringify(p.phone)})">
          + Entry
        </button>

        <button type="button"
          onclick="businessStatement(${JSON.stringify(p.name)},${JSON.stringify(p.role)})">
          Statement
        </button>

        <button type="button"
          onclick="businessWhatsApp(${JSON.stringify(p.name)},${JSON.stringify(p.phone)},${JSON.stringify(p.role)})">
          WhatsApp
        </button>
      </div>
    </div>`;
}


/* ================= BUSINESS SALES / PURCHASE ================= */

function addBusinessRecord(type="sales"){
  const name=prompt(
    type==="purchase"?"Supplier name":"Customer name"
  );

  if(!name)return;

  const amount=Number(prompt("Amount")||0);
  if(amount<=0)return alert("Enter valid amount");

  D.business.push({
    id:uid(),
    role:type==="purchase"?"supplier":"customer",
    recordType:type,
    name:name.trim(),
    amount,
    date:today(),
    note:prompt("Note")||"",
    created:Date.now()
  });

  save();
  renderBusiness();
}

function renderBusinessRecords(type){
  const list=$("businessList");
  const rows=D.business.filter(x=>x.recordType===type);

  list.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button type="button"
        onclick="addBusinessRecord('${type}')">
        + Add ${type==="purchase"?"Purchase":"Sale"}
      </button>
    </div>

    ${
      rows.length
      ?rows.map(x=>`
        <div class="card" style="margin-bottom:8px">
          <b>${esc(x.name)}</b>
          <div>${money(x.amount)}</div>
          <small>${esc(x.date)} • ${esc(x.note||"")}</small>
          <br>
          <button type="button"
            onclick="deleteBusinessRecord('${x.id}')">
            Delete
          </button>
        </div>
      `).join("")
      :`<div class="card">No records yet.</div>`
    }`;
}

function deleteBusinessRecord(id){
  if(!confirm("Delete record?"))return;
  D.business=D.business.filter(x=>x.id!==id);
  save();
  renderBusiness();
}


/* ================= STATEMENT / WHATSAPP ================= */

function statementRows(person,mode="business",role=""){
  return D.khata.filter(x=>
    (x.mode||"personal")===mode&&
    String(x.person).toLowerCase()===String(person).toLowerCase()&&
    (!role||(x.role||"customer")===role)
  );
}

function businessStatement(person,role="customer"){
  const rows=statementRows(person,"business",role);

  let t=`HISAB Business Statement\n\nName: ${person}\n\n`;

  rows.forEach(x=>{
    t+=`${x.date} | ${x.type==="give"?"Give":"Receive"} | ${money(x.amount)} | ${x.status}\n`;
  });

  const g=rows.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const r=rows.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  t+=`\nGive: ${money(g)}\nReceive: ${money(r)}\nBalance: ${money(g-r)}`;

  shareText(t,"HISAB Statement");
}

function businessWhatsApp(person,phone,role="customer"){
  let n=String(phone||"").replace(/\D/g,"");

  if(n.length===10)n="91"+n;

  if(!n){
    alert("Mobile number not available");
    return;
  }

  const rows=statementRows(person,"business",role);

  const g=rows.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const r=rows.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const t=
`HISAB Statement
Name: ${person}

Give: ${money(g)}
Receive: ${money(r)}
Balance: ${money(g-r)}

Thank you.`;

  window.open(
    "https://wa.me/"+n+"?text="+encodeURIComponent(t),
    "_blank"
  );
}


/* ================= SHARING / PDF ================= */

function shareText(text,title="HISAB"){
  if(navigator.share){
    navigator.share({title,text}).catch(()=>{});
  }else if(navigator.clipboard){
    navigator.clipboard.writeText(text)
      .then(()=>alert("Copied"));
  }else{
    prompt("Copy:",text);
  }
}

function khataText(){
  const rows=statementRows(
    D.detailPerson,
    D.detailMode,
    D.detailMode==="business"?D.businessEntryRole:""
  );

  let t=`HISAB KHATA\n\nName: ${D.detailPerson}\n\n`;

  rows.forEach(x=>{
    t+=`${x.date} | ${x.type==="give"?"Give":"Receive"} | ${money(x.amount)} | ${x.status}\n`;
  });

  return t||"No entries";
}

function shareKhata(){
  shareText(khataText(),"HISAB Khata");
}

function makeSimplePDF(lines){
  const safe=lines.map(x=>String(x)
    .replace(/[^\x20-\x7E]/g,""));

  const content=
`BT
/F1 10 Tf
50 800 Td
${safe.map((x,i)=>
  `${i?"0 -16 Td ":""}(${pdfText(x)}) Tj`
).join("\n")}
ET`;

  const pdf=
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842]
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
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;

  return new Blob([pdf],{type:"application/pdf"});
}

function pdfText(s){
  return String(s)
    .replace(/\\/g,"\\\\")
    .replace(/\(/g,"\\(")
    .replace(/\)/g,"\\)");
}

async function sharePDF(blob,filename){
  const file=new File([blob],filename,{type:"application/pdf"});

  try{
    if(navigator.share&&navigator.canShare&&
       navigator.canShare({files:[file]})){
      await navigator.share({
        title:"HISAB PDF",
        files:[file]
      });
      return;
    }
  }catch(e){}

  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();

  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportKhataPDF(){
  const rows=statementRows(
    D.detailPerson,
    D.detailMode,
    D.detailMode==="business"?D.businessEntryRole:""
  );

  const lines=[
    "HISAB KHATA",
    "",
    "Name: "+D.detailPerson,
    ""
  ];

  rows.forEach(x=>{
    lines.push(
      `${x.date}  ${x.type==="give"?"Give":"Receive"}  ${money(x.amount)}  ${x.status}`
    );
  });

  const g=rows.filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const r=rows.filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  lines.push("");
  lines.push("Give: "+money(g));
  lines.push("Receive: "+money(r));
  lines.push("Balance: "+money(g-r));

  sharePDF(makeSimplePDF(lines),"HISAB-Khata.pdf");
}

function exportSummaryPDF(){
  const lines=[
    "HISAB REPORT",
    "",
    "Mode: "+(D.mode==="business"?"Business":"Personal"),
    "",
    "Income: "+money(totalIncome()),
    "Expense: "+money(totalExpense()),
    "Give: "+money(totalGive(D.mode)),
    "Receive: "+money(totalReceive(D.mode)),
    "Balance: "+money(totalIncome()-totalExpense())
  ];

  sharePDF(makeSimplePDF(lines),"HISAB-Report.pdf");
}

function exportSummary(){
  shareText(
    `HISAB SUMMARY

Mode: ${D.mode}
Income: ${money(totalIncome())}
Expense: ${money(totalExpense())}
Give: ${money(totalGive(D.mode))}
Receive: ${money(totalReceive(D.mode))}
Balance: ${money(totalIncome()-totalExpense())}`,
    "HISAB Summary"
  );
}


/* ================= PLANNING ================= */

function calcBudget(){
  const a=Number($("budgetAmount")?.value||0);
  if(a<0)return alert("Invalid budget");
  D.budget=a;
  save();
  renderPlanning();
  alert("Budget saved");
}

function calcGoal(){
  const name=val("goalName");
  const target=num("goalTarget");
  const saved=num("goalSaved");

  if(!name||target<=0)return alert("Enter goal details");

  D.goals.push({
    id:uid(),
    name,
    target,
    saved,
    date:val("goalDate")||today()
  });

  save();
  renderPlanning();

  ["goalName","goalTarget","goalSaved","goalDate"]
    .forEach(id=>{if($(id))$(id).value=""});
}

function renderPlanning(){
  if($("budgetAmount"))$("budgetAmount").value=D.budget||"";

  const list=$("goalList");
  if(!list)return;

  list.innerHTML=`
    <div class="card">
      <b>Monthly Budget</b>
      <div>${money(D.budget)}</div>
      <div>Spent: ${money(totalExpense())}</div>
    </div>

    ${
      D.goals.map(g=>`
        <div class="card" style="margin-top:8px">
          <b>${esc(g.name)}</b>
          <div>${money(g.saved)} / ${money(g.target)}</div>
          <small>
            ${Math.min(100,Math.round(Number(g.saved||0)/Number(g.target||1)*100))}% complete
          </small>
        </div>
      `).join("")
    }`;
}


/* ================= PAYMENTS ================= */

function addBill(kind="Bill"){
  let name,amount,due;

  if(kind==="Credit Card"){
    name="Credit Card";
    amount=num("cardBill");
    due=val("cardDue");
  }else{
    name=val("billName");
    amount=num("billAmount");
    due=val("billDue");
  }

  if(!name||amount<=0)return alert("Enter valid bill details");

  D.bills.push({
    id:uid(),
    name,
    amount,
    dueDate:due||today(),
    status:"pending",
    kind
  });

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

  D.emis.push({
    id:uid(),principal:p,rate,months,emi
  });

  save();

  if($("emiResult"))
    $("emiResult").innerHTML=`
      <div class="card">
        <b>Monthly EMI: ${money(emi)}</b>
        <br>
        Total: ${money(emi*months)}
      </div>`;

  renderPayments();
}

function renderPayments(){
  const list=$("billList");
  if(!list)return;

  list.innerHTML=`
    <div class="card">
      <b>Bills</b>
      ${D.bills.map(x=>`
        <div style="margin-top:8px">
          ${esc(x.name)} — ${money(x.amount)}
          <small>Due: ${esc(x.dueDate||"-")}</small>
        </div>
      `).join("")||"<div>No bills.</div>"}
    </div>

    <div class="card" style="margin-top:8px">
      <b>EMI</b>
      ${D.emis.map(x=>`
        <div style="margin-top:8px">
          EMI ${money(x.emi)}
          <small>${x.months} months</small>
        </div>
      `).join("")||"<div>No EMI.</div>"}
    </div>`;
}


/* ================= REPORTS ================= */

function showReports(){
  const i=totalIncome();
  const e=totalExpense();
  const g=totalGive(D.mode);
  const r=totalReceive(D.mode);

  if($("reportIncome"))$("reportIncome").textContent=money(i);
  if($("reportExpense"))$("reportExpense").textContent=money(e);
  if($("reportGive"))$("reportGive").textContent=money(g);
  if($("reportReceive"))$("reportReceive").textContent=money(r);

  if($("reportContent"))
    $("reportContent").innerHTML=`
      <div class="card">
        <b>Balance:</b> ${money(i-e)}
        <br>
        <b>Udhaar Balance:</b> ${money(g-r)}
      </div>`;
}


/* ================= REMINDERS ================= */

function addReminder(){
  const name=val("reminderName");
  const date=val("reminderDate");

  if(!name||!date)return alert("Enter reminder and date");

  D.reminders.push({
    id:uid(),
    title:name,
    date
  });

  save();
  renderReminders();

  if($("reminderName"))$("reminderName").value="";
  if($("reminderDate"))$("reminderDate").value="";
}

function renderReminders(){
  const list=$("reminderList");
  if(!list)return;

  list.innerHTML=D.reminders.length
    ?D.reminders.map(x=>`
      <div class="card">
        <b>${esc(x.title||"Reminder")}</b>
        <div>${esc(x.date||"")}</div>
      </div>
    `).join("")
    :`<div class="card">No reminders.</div>`;
}


/* ================= SECURITY ================= */

function setPin(){
  const p=val("pinInput");

  if(!/^\d{4,6}$/.test(p))
    return alert("PIN must be 4 to 6 digits");

  D.pin=p;
  save();

  if($("pinInput"))$("pinInput").value="";

  alert("PIN saved");
}

function setPIN(){
  setPin();
}

function lockApp(){
  if(!D.pin)return alert("First set a PIN");

  const p=prompt("Enter PIN");

  if(p!==D.pin)return alert("Wrong PIN");

  const gate=$("guestGate"),shell=$("appShell");
  if(gate)gate.style.display="flex";
  if(shell)shell.style.display="none";
}

function removePIN(){
  D.pin="";
  save();
  renderPrivacy();
}

function renderPrivacy(){
  const box=$("privacyContent");
  if(box)
    box.innerHTML=`
      <div class="card">
        Security PIN:
        <b>${D.pin?"Enabled":"Not set"}</b>
      </div>`;
}


/* ================= BACKUP ================= */

function exportBackup(){
  const blob=new Blob(
    [JSON.stringify(D,null,2)],
    {type:"application/json"}
  );

  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");

  a.href=url;
  a.download="HISAB-Backup-"+today()+".json";
  a.click();

  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function importBackup(e){
  const file=e.target.files?.[0];
  if(!file)return;

  const reader=new FileReader();

  reader.onload=()=>{
    try{
      const x=JSON.parse(reader.result);

      if(!x||typeof x!=="object")throw 0;

      D={...D,...x};
      load();
      save();

      alert("Backup restored successfully");
      show("home");
    }catch(err){
      alert("Invalid HISAB backup");
    }
  };

  reader.readAsText(file);
}

function backupData(){
  exportBackup();
}

function restoreData(){
  const i=document.createElement("input");
  i.type="file";
  i.accept=".json,application/json";
  i.onchange=importBackup;
  i.click();
}


/* ================= FAMILY ================= */

function addFamilyMember(){
  const name=val("familyName");
  if(!name)return alert("Enter member name");

  D.family.push({
    id:uid(),
    name
  });

  save();
  renderFamily();

  if($("familyName"))$("familyName").value="";
}

function renderFamily(){
  const list=$("familyList");
  if(!list)return;

  list.innerHTML=D.family.length
    ?D.family.map(x=>`
      <div class="card">
        <b>${esc(x.name)}</b>
      </div>
    `).join("")
    :`<div class="card">No family members.</div>`;
}

function renderFamilyTools(){
  const box=$("familyToolsList");
  if(box)
    box.innerHTML=`<div class="card">Family tools ready.</div>`;
}


/* ================= TOOLS ================= */

function addTool(type){
  D.tools.push({
    id:uid(),
    type,
    date:today()
  });
  save();
  alert(type+" added");
}

function addInsurance(){addTool("Insurance")}
function addSchool(){addTool("School")}
function addVehicle(){addTool("Vehicle")}
function addShopping(){addTool("Shopping")}
function addUtility(){addTool("Utility")}
function addDoc(){addTool("Document")}
function addAnnual(){addTool("Annual Planning")}

function calcEmergency(){
  const m=Number(prompt("Monthly essential expense")||0);
  const n=Number(prompt("How many months?")||6);
  if(m>0)alert("Emergency Fund Target: "+money(m*n));
}

function calcFD(){
  const p=Number($("fdPrincipal")?.value||0);
  const r=Number($("fdRate")?.value||0);
  const m=Number($("fdN")?.value||0);

  if(p<=0||m<=0)return alert("Enter valid FD details");

  const interest=p*r*(m/12)/100;

  if($("fdResult"))
    $("fdResult").innerHTML=`
      <div class="card">
        <b>Maturity: ${money(p+interest)}</b>
        <br>Interest: ${money(interest)}
      </div>`;
}

function renderTools(){}


/* ================= SEARCH ================= */

function searchAllData(q){
  const list=$("searchResults");
  if(!list)return;

  q=String(q||"").toLowerCase().trim();

  if(!q){
    list.innerHTML="";
    return;
  }

  const all=[
    ...D.transactions.map(x=>({type:"Transaction",data:x})),
    ...D.khata.map(x=>({type:"Udhar",data:x})),
    ...D.business.map(x=>({type:"Business",data:x}))
  ].filter(x=>JSON.stringify(x.data).toLowerCase().includes(q));

  list.innerHTML=all.length
    ?all.map(x=>`
      <div class="card">
        <b>${x.type}</b><br>
        ${esc(JSON.stringify(x.data))}
      </div>
    `).join("")
    :`<div class="card">Nothing found.</div>`;
}


/* ================= QUICK ADD ================= */

function openQuickAdd(){
  const c=prompt(
`HISAB Quick Add

1 = Income
2 = Expense
3 = Udhar Give
4 = Udhar Receive`
  );

  if(c==="1")openIncome();
  else if(c==="2")openExpense();
  else if(c==="3"||c==="4"){
    openKhataForm(D.mode);
    setTimeout(()=>{
      if($("khataType"))
        $("khataType").value=c==="3"?"give":"receive";
    },20);
  }
}


/* ================= GLOBAL EXPORTS ================= */

Object.assign(window,{
  show,goBack,enterGuestMode,enterApp,
  setMode,openBusiness,openPersonal,
  toggleLanguage,toggleCurrency,

  openIncome,openExpense,addTransaction,
  deleteTransaction,

  openKhataForm,closeKhataForm,saveKhataEntry,
  filterKhata,searchKhata,openKhataDetail,
  closeKhataDetail,detailFilter,editKhata,
  deleteKhata,settleKhata,openPaymentEntry,

  businessFilter,setBusinessFilter,
  addBusinessCustomer,addBusinessSupplier,
  openBusinessCustomerForm,selectBusinessContact,
  openBusinessEntry,openBusinessDetail,
  businessStatement,businessWhatsApp,
  addBusinessRecord,deleteBusinessRecord,

  calcBudget,calcGoal,
  addBill,calcEMI,

  exportSummary,exportSummaryPDF,
  shareKhata,exportKhataPDF,

  addReminder,

  setPin,setPIN,lockApp,removePIN,

  exportBackup,importBackup,
  backupData,restoreData,

  addFamilyMember,

  addInsurance,addSchool,addVehicle,
  addShopping,addUtility,addDoc,addAnnual,
  calcEmergency,calcFD,

  searchAllData,openQuickAdd,
  fixHomeButtons
});


/* ================= INPUT EVENTS ================= */

document.addEventListener("input",e=>{
  if(e.target?.id==="personalSearch")
    renderPersonal();

  if(e.target?.id==="businessSearch")
    renderBusiness();
});


/* ================= START ================= */

load();

window.addEventListener("DOMContentLoaded",()=>{
  if($("khataDate")&&!$("khataDate").value)
    $("khataDate").value=today();

  if($("transactionDate")&&!$("transactionDate").value)
    $("transactionDate").value=today();

  showGuestGate();
});
