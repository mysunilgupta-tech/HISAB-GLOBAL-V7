/* =========================================================
   HISAB GLOBAL V7 — STABLE CONTROLLER
   Personal + Business + Udhaar + Customer/Supplier
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
  detailPhone:"",
  detailMode:"personal",
  detailFilter:"all",
  businessEntryRole:"customer"
};

let editKhataId=null;

const $=id=>document.getElementById(id);

function uid(){
  return Date.now().toString(36)+Math.random().toString(36).slice(2,8);
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function val(id){
  return String($(id)?.value||"").trim();
}

function num(id){
  return Number($(id)?.value||0);
}

function money(n){
  return D.currency+Number(n||0).toLocaleString("en-IN",{
    maximumFractionDigits:2
  });
}

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function save(){
  localStorage.setItem(KEY,JSON.stringify(D));
}

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY)||"null");
    if(x&&typeof x==="object"){
      D={...D,...x};
    }
  }catch(e){}

  [
    "transactions","khata","business","goals","bills",
    "cards","loans","emis","reminders","family","tools"
  ].forEach(k=>{
    if(!Array.isArray(D[k]))D[k]=[];
  });

  D.businessFilter||="customer";
  D.businessEntryRole||="customer";
  D.filter||="all";

  /* Old data compatibility */
  D.khata.forEach(x=>{
    if(x.type==="given")x.type="give";
    if(x.type==="received")x.type="receive";
    if(x.mode==="business"&&!x.role)x.role="customer";
    if(!x.mode)x.mode="personal";
  });

  save();
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function hideAll(){
  document.querySelectorAll(".page").forEach(p=>{
    p.style.display="none";
  });
}

function show(id){
  hideAll();

  const page=$(id);
  if(!page)return;

  page.style.display="block";
  window.scrollTo(0,0);

  if(id==="home")renderHome();
  if(id==="personal")renderPersonal();
  if(id==="business")renderBusiness();
  if(id==="khataDetail")renderKhataDetail();
  if(id==="transactions")renderTransactions();
  if(id==="planning")renderPlanning();
  if(id==="credit")renderPayments();
  if(id==="reports")renderReports();
  if(id==="reminders")renderReminders();
  if(id==="privacy")renderPrivacy();
  if(id==="family")renderFamily();
  if(id==="familytools")renderFamilyTools();
  if(id==="tools13")renderTools();
  if(id==="final")renderSettings();
}

function currentPage(){
  return [...document.querySelectorAll(".page")]
    .find(p=>getComputedStyle(p).display!=="none");
}

function goBack(){
  const p=currentPage();
  const id=p?.id||"";

  if(id==="khataEntry"||id==="khataDetail"){
    show(
      D.detailMode==="business"
      ?"business"
      :"personal"
    );
    return;
  }

  if([
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
  ].includes(id)){
    show("home");
    return;
  }

  show("home");
}

/* =========================================================
   START / GUEST
   ========================================================= */

function showGuestGate(){
  load();

  if($("guestGate"))$("guestGate").style.display="none";
  if($("appShell"))$("appShell").style.display="block";

  show("home");
}

function enterGuestMode(){
  showGuestGate();
}

function enterApp(){
  showGuestGate();
}

/* =========================================================
   PERSONAL / BUSINESS MODE
   ========================================================= */

function setMode(mode){
  D.mode=mode;

  if(mode==="business"){
    D.businessFilter||="customer";
    D.businessEntryRole=D.businessFilter;
  }

  save();

  if(mode==="business"){
    show("business");
  }else{
    show("home");
  }
}

function openBusiness(){
  setMode("business");
}

function openPersonal(){
  setMode("personal");
}

/*
  Home ke andar Personal + Business buttons.
  Existing HTML ko replace nahi karta.
*/
function ensureModeSwitch(){
  const home=$("home");
  if(!home)return;

  let box=$("hisabModeSwitch");

  if(!box){
    box=document.createElement("div");
    box.id="hisabModeSwitch";
    box.style.cssText=
      "display:flex;gap:8px;padding:0 12px 12px;";

    home.insertBefore(box,home.firstElementChild);
  }

  box.innerHTML="";

  const personal=document.createElement("button");
  personal.type="button";
  personal.textContent="Personal";

  const business=document.createElement("button");
  business.type="button";
  business.textContent="Business";

  [personal,business].forEach(b=>{
    b.style.cssText=
      "flex:1;padding:12px;border:0;border-radius:12px;"+
      "font-weight:700;font-size:15px;";
  });

  personal.style.background=
    D.mode==="personal"?"#0b5ed7":"#eef2f7";

  personal.style.color=
    D.mode==="personal"?"#fff":"#222";

  business.style.background=
    D.mode==="business"?"#0b5ed7":"#eef2f7";

  business.style.color=
    D.mode==="business"?"#fff":"#222";

  personal.onclick=()=>setMode("personal");
  business.onclick=()=>setMode("business");

  box.appendChild(personal);
  box.appendChild(business);
}

function renderHome(){
  ensureModeSwitch();

  if($("modeLabel"))
    $("modeLabel").textContent=
      D.mode==="business"?"Business":"Personal";

  if($("receivable"))
    $("receivable").textContent=
      money(totalGive(D.mode));

  if($("payable"))
    $("payable").textContent=
      money(totalReceive(D.mode));

  if($("homeBalance"))
    $("homeBalance").textContent=
      money(totalIncome()-totalExpense());

  /* Existing Home Khata button */
  const home=$("home");

  if(home){
    const buttons=home.querySelectorAll(
      ".feature-grid button"
    );

    if(buttons[1]){
      buttons[1].onclick=()=>{
        openKhataForm(D.mode);
      };
    }
  }
}

/* =========================================================
   LANGUAGE / CURRENCY
   ========================================================= */

function toggleLanguage(){
  D.language=D.language==="en"?"hi":"en";
  save();

  alert(
    D.language==="hi"
    ?"भाषा हिन्दी की गई"
    :"Language changed to English"
  );
}

function toggleCurrency(){
  const a=["₹","$","€","£"];
  const i=a.indexOf(D.currency);

  D.currency=a[(i+1)%a.length];
  save();

  const p=currentPage();
  if(p)show(p.id);
}

/* =========================================================
   TRANSACTIONS
   ========================================================= */

function totalIncome(){
  return D.transactions
    .filter(x=>
      x.type==="income" &&
      (!x.mode||x.mode===D.mode)
    )
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function totalExpense(){
  return D.transactions
    .filter(x=>
      x.type==="expense" &&
      (!x.mode||x.mode===D.mode)
    )
    .reduce((a,x)=>a+Number(x.amount||0),0);
}

function addTransaction(type=""){
  type=type||val("transactionType")||"expense";

  let amount=num("transactionAmount");

  if(!amount){
    amount=Number(
      prompt(
        type==="income"
        ?"Income amount"
        :"Expense amount"
      )||0
    );
  }

  if(amount<=0){
    alert("Enter valid amount");
    return;
  }

  D.transactions.push({
    id:uid(),
    mode:D.mode,
    type,
    amount,
    category:val("transactionCategory")||"General",
    note:val("transactionNote"),
    date:val("transactionDate")||today(),
    created:Date.now()
  });

  [
    "transactionAmount",
    "transactionCategory",
    "transactionNote"
  ].forEach(id=>{
    if($(id))$(id).value="";
  });

  save();
  show("transactions");
}

function openIncome(){
  show("transactions");

  setTimeout(()=>{
    if($("transactionType"))
      $("transactionType").value="income";

    if($("transactionDate"))
      $("transactionDate").value=today();
  },30);
}

function openExpense(){
  show("transactions");

  setTimeout(()=>{
    if($("transactionType"))
      $("transactionType").value="expense";

    if($("transactionDate"))
      $("transactionDate").value=today();
  },30);
}

function renderTransactions(){
  const list=$("transactionList");
  if(!list)return;

  const rows=D.transactions
    .filter(x=>!x.mode||x.mode===D.mode)
    .sort((a,b)=>
      String(b.date).localeCompare(String(a.date))
    );

  list.innerHTML=rows.length
    ?rows.map(x=>`
      <div class="list-card">
        <h3 class="${x.type==="income"?"receive":"give"}">
          ${x.type==="income"?"Income":"Expense"}
          ${money(x.amount)}
        </h3>

        <div class="meta">
          ${esc(x.category||"General")} • ${esc(x.date||"")}
        </div>

        <div class="meta">
          ${esc(x.note||"")}
        </div>

        <button type="button"
          onclick="deleteTransaction('${x.id}')">
          Delete
        </button>
      </div>
    `).join("")
    :emptyCard(
      "No transactions",
      "Add your first income or expense."
    );
}

function deleteTransaction(id){
  if(!confirm("Delete transaction?"))return;

  D.transactions=D.transactions.filter(x=>x.id!==id);

  save();
  renderTransactions();
  renderHome();
}

/* =========================================================
   UDHAR CORE
   ========================================================= */

function khataData(mode){
  return D.khata.filter(x=>
    (x.mode||"personal")===mode
  );
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

function personRows(mode){
  const map={};

  khataData(mode).forEach(x=>{
    const name=String(x.person||"").trim();
    if(!name)return;

    const key=
      name.toLowerCase()+"|"+String(x.phone||"");

    if(!map[key]){
      map[key]={
        name,
        phone:x.phone||"",
        give:0,
        receive:0,
        pending:0,
        count:0
      };
    }

    map[key].count++;

    if(x.type==="give"){
      map[key].give+=Number(x.amount||0);
    }else{
      map[key].receive+=Number(x.amount||0);
    }

    if(x.status==="pending"){
      map[key].pending+=Number(x.amount||0);
    }
  });

  return Object.values(map).sort(
    (a,b)=>
      (b.give+b.receive)-(a.give+a.receive)
  );
}

function openKhataForm(
  mode="personal",
  person="",
  phone=""
){
  D.detailMode=mode;
  D.detailPerson=person;
  D.detailPhone=phone;
  editKhataId=null;

  if($("khataPerson"))
    $("khataPerson").value=person;

  if($("khataType"))
    $("khataType").value="give";

  if($("khataAmount"))
    $("khataAmount").value="";

  if($("khataDate"))
    $("khataDate").value=today();

  if($("khataMethod"))
    $("khataMethod").value="Cash";

  if($("khataStatus"))
    $("khataStatus").value="pending";

  if($("khataNote"))
    $("khataNote").value="";

  show("khataEntry");
}

function closeKhataForm(){
  show(
    D.detailMode==="business"
    ?"business"
    :"personal"
  );
}

function saveKhataEntry(){
  const person=val("khataPerson");
  const amount=num("khataAmount");

  if(!person){
    alert("Person / Customer name required");
    return;
  }

  if(amount<=0){
    alert("Enter valid amount");
    return;
  }

  const mode=D.detailMode||D.mode;

  const old=editKhataId
    ?D.khata.find(x=>x.id===editKhataId)
    :null;

  const row={
    id:editKhataId||uid(),
    mode,
    person,
    phone:
      D.detailPhone||
      old?.phone||
      "",
    type:
      val("khataType")||
      "give",
    amount,
    date:
      val("khataDate")||
      today(),
    method:
      val("khataMethod")||
      "Cash",
    status:
      val("khataStatus")||
      "pending",
    note:val("khataNote"),
    role:
      mode==="business"
      ?(D.businessEntryRole||D.businessFilter||"customer")
      :"customer",
    created:old?.created||Date.now()
  };

  if(editKhataId){
    const i=D.khata.findIndex(x=>
      x.id===editKhataId
    );

    if(i>=0)D.khata[i]=row;
    else D.khata.push(row);
  }else{
    D.khata.push(row);
  }

  editKhataId=null;

  save();

  if(mode==="business"){
    show("business");
  }else{
    show("personal");
  }
}

/* =========================================================
   PERSONAL
   ========================================================= */

function renderPersonal(){
  const list=$("personalList");
  if(!list)return;

  const q=val("personalSearch").toLowerCase();

  let rows=personRows("personal");

  if(D.filter==="give")
    rows=rows.filter(x=>x.give>0);

  if(D.filter==="receive")
    rows=rows.filter(x=>x.receive>0);

  if(D.filter==="pending")
    rows=rows.filter(x=>x.pending>0);

  if(q){
    rows=rows.filter(x=>
      x.name.toLowerCase().includes(q)||
      String(x.phone||"").includes(q)
    );
  }

  const give=rows.reduce(
    (a,x)=>a+x.give,0
  );

  const receive=rows.reduce(
    (a,x)=>a+x.receive,0
  );

  if($("ledgerGiven"))
    $("ledgerGiven").textContent=money(give);

  if($("ledgerReceived"))
    $("ledgerReceived").textContent=money(receive);

  if($("ledgerNet"))
    $("ledgerNet").textContent=
      money(give-receive);

  list.innerHTML=rows.length
    ?rows.map(personCard).join("")
    :emptyCard(
      "No Udhaar entries",
      "Add a person and create Give / Receive entry."
    );
}

function personCard(p){
  const balance=p.give-p.receive;

  return `
    <div class="list-card">
      <h3>${esc(p.name)}</h3>

      ${
        p.phone
        ?`<div class="meta">${esc(p.phone)}</div>`
        :""
      }

      <div class="meta">
        <span class="give">
          Give ${money(p.give)}
        </span>
        &nbsp; • &nbsp;
        <span class="receive">
          Receive ${money(p.receive)}
        </span>
      </div>

      <div class="amount ${
        balance>=0?"give":"receive"
      }">
        Balance ${money(Math.abs(balance))}
      </div>

      ${
        p.pending
        ?`<div class="pending">
            Pending ${money(p.pending)}
          </div>`
        :""
      }

      <div class="action-row" style="margin-top:10px">

        <button type="button"
          onclick='openKhataDetail("personal",${JSON.stringify(p.name)},${JSON.stringify(p.phone||"")})'>
          Khata
        </button>

        <button type="button"
          onclick='openKhataForm("personal",${JSON.stringify(p.name)},${JSON.stringify(p.phone||"")})'>
          + Entry
        </button>

      </div>
    </div>
  `;
}

function filterKhata(mode,type,btn){
  D.filter=type;

  document.querySelectorAll(
    "#personal .filter-row button"
  ).forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");

  renderPersonal();
}

function searchKhata(mode){
  if(mode==="business"){
    renderBusiness();
  }else{
    renderPersonal();
  }
}

/* =========================================================
   KHATA DETAIL
   ========================================================= */

function openKhataDetail(
  mode="personal",
  person="",
  phone=""
){
  D.detailMode=mode;
  D.detailPerson=person;
  D.detailPhone=phone;
  D.detailFilter="all";

  if($("detailPersonName"))
    $("detailPersonName").textContent=person;

  show("khataDetail");
}

function closeKhataDetail(){
  show(
    D.detailMode==="business"
    ?"business"
    :"personal"
  );
}

function renderKhataDetail(){
  const person=D.detailPerson||"";

  let rows=khataData(D.detailMode)
    .filter(x=>
      String(x.person||"").toLowerCase()===
      person.toLowerCase()
    )
    .sort((a,b)=>
      String(b.date).localeCompare(String(a.date))
    );

  const give=rows
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=rows
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  if($("detailPersonName"))
    $("detailPersonName").textContent=person;

  if($("detailGive"))
    $("detailGive").textContent=money(give);

  if($("detailReceive"))
    $("detailReceive").textContent=money(receive);

  if($("detailBalance"))
    $("detailBalance").textContent=
      money(give-receive);

  if(D.detailFilter==="give")
    rows=rows.filter(x=>x.type==="give");

  if(D.detailFilter==="receive")
    rows=rows.filter(x=>x.type==="receive");

  if(D.detailFilter==="pending")
    rows=rows.filter(x=>x.status==="pending");

  if($("khataHistory")){
    $("khataHistory").innerHTML=rows.length
      ?rows.map(khataEntryCard).join("")
      :emptyCard(
        "No history",
        "No matching Khata entry found."
      );
  }
}

function detailFilter(type,btn){
  D.detailFilter=type;

  document.querySelectorAll(
    "#khataDetail .filter-row button"
  ).forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");

  renderKhataDetail();
}

function khataEntryCard(x){
  return `
    <div class="list-card">

      <div class="amount ${
        x.type==="give"
        ?"give"
        :"receive"
      }">
        ${
          x.type==="give"
          ?"Give"
          :"Receive"
        }
        ${money(x.amount)}
      </div>

      <div class="meta">
        ${esc(x.date||"")} •
        ${esc(x.method||"Cash")}
      </div>

      <div class="meta">
        ${esc(x.note||"No note")}
      </div>

      <div style="margin-top:7px">
        <span class="${
          x.status==="pending"
          ?"status-pending"
          :"status-settled"
        }">
          ${esc(x.status||"pending")}
        </span>
      </div>

      <div class="action-row" style="margin-top:9px">

        <button type="button"
          onclick="editKhata('${x.id}')">
          Edit
        </button>

        <button type="button"
          onclick="deleteKhata('${x.id}')">
          Delete
        </button>

        ${
          x.status!=="settled"
          ?`<button type="button"
              onclick="settleKhata('${x.id}')">
              Settle
            </button>`
          :""
        }

      </div>
    </div>
  `;
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
    if($("khataPerson"))
      $("khataPerson").value=x.person||"";

    if($("khataType"))
      $("khataType").value=x.type||"give";

    if($("khataAmount"))
      $("khataAmount").value=x.amount||"";

    if($("khataDate"))
      $("khataDate").value=x.date||today();

    if($("khataMethod"))
      $("khataMethod").value=x.method||"Cash";

    if($("khataStatus"))
      $("khataStatus").value=x.status||"pending";

    if($("khataNote"))
      $("khataNote").value=x.note||"";
  },20);
}

function deleteKhata(id){
  if(!confirm("Delete this entry?"))return;

  D.khata=D.khata.filter(x=>x.id!==id);

  save();

  renderKhataDetail();
  renderPersonal();
  renderBusiness();
  renderHome();
}

function settleKhata(id){
  const x=D.khata.find(a=>a.id===id);
  if(!x)return;

  x.status="settled";

  save();

  renderKhataDetail();
  renderPersonal();
  renderBusiness();
  renderHome();
}

function openPaymentEntry(){
  openKhataForm(
    D.detailMode||"personal",
    D.detailPerson||"",
    D.detailPhone||""
  );
}

/* =========================================================
   BUSINESS CONTACTS
   ========================================================= */

function businessPeople(role){
  const map={};

  /* Saved business contacts */
  D.business
    .filter(x=>
      !x.type &&
      (x.role||"customer")===role
    )
    .forEach(x=>{
      const key=
        String(x.name||"").toLowerCase()+
        "|" + String(x.phone||"");

      if(!map[key]){
        map[key]={
          name:x.name||"",
          phone:x.phone||"",
          role,
          give:0,
          receive:0,
          pending:0
        };
      }
    });

  /* People already having business Khata */
  D.khata
    .filter(x=>
      (x.mode||"personal")==="business" &&
      (x.role||"customer")===role
    )
    .forEach(x=>{
      const key=
        String(x.person||"").toLowerCase()+
        "|" + String(x.phone||"");

      if(!map[key]){
        map[key]={
          name:x.person||"",
          phone:x.phone||"",
          role,
          give:0,
          receive:0,
          pending:0
        };
      }

      if(x.type==="give")
        map[key].give+=Number(x.amount||0);
      else
        map[key].receive+=Number(x.amount||0);

      if(x.status==="pending")
        map[key].pending+=Number(x.amount||0);
    });

  return Object.values(map);
}

function businessFilter(type,btn){
  D.businessFilter=type;
  D.businessEntryRole=
    type==="supplier"
    ?"supplier"
    :"customer";

  save();

  document.querySelectorAll(
    "#business .business-tabs button"
  ).forEach(b=>b.classList.remove("active"));

  if(btn)btn.classList.add("active");

  renderBusiness();
}

function setBusinessFilter(type){
  businessFilter(type);
}

function addBusinessCustomer(){
  openBusinessCustomerForm(
    "",
    "",
    "customer"
  );
}

function addBusinessSupplier(){
  openBusinessCustomerForm(
    "",
    "",
    "supplier"
  );
}

/*
  Contact picker:
  Android WebView mein native Contacts API har device
  par available nahi hoti. Agar available hai to use karega;
  warna manual mobile field rahega.
*/
async function selectBusinessContact(){
  try{
    if(navigator.contacts&&navigator.contacts.select){
      const contacts=
        await navigator.contacts.select(
          ["name","tel"],
          {multiple:false}
        );

      const c=contacts?.[0];

      if(c){
        if($("businessPersonName"))
          $("businessPersonName").value=
            Array.isArray(c.name)
            ?c.name[0]||""
            :c.name||"";

        if($("businessPersonPhone"))
          $("businessPersonPhone").value=
            Array.isArray(c.tel)
            ?c.tel[0]||""
            :"";

        return;
      }
    }
  }catch(e){}

  alert(
    "Phone contact picker is not available on this device. "+
    "Please enter Name and Mobile number manually."
  );
}

function openBusinessCustomerForm(
  name="",
  phone="",
  role="customer"
){
  D.businessEntryRole=role;

  const old=$("businessPersonModal");
  if(old)old.remove();

  const modal=document.createElement("div");

  modal.id="businessPersonModal";

  modal.style.cssText=
    "position:fixed;inset:0;background:rgba(0,0,0,.55);"+
    "z-index:99999;display:flex;align-items:center;"+
    "justify-content:center;padding:18px;";

  modal.innerHTML=`
    <div style="
      background:#fff;
      width:100%;
      max-width:430px;
      border-radius:18px;
      padding:18px;
      box-shadow:0 10px 40px rgba(0,0,0,.25);
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">
        <h3>
          ${
            role==="supplier"
            ?"Add Supplier"
            :"Add Customer"
          }
        </h3>

        <button type="button"
          id="closeBusinessCustomer"
          style="
            border:0;
            background:transparent;
            font-size:28px;
          ">
          ×
        </button>
      </div>

      <input
        id="businessPersonName"
        placeholder="${
          role==="supplier"
          ?"Supplier name"
          :"Customer name"
        }"
        value="${esc(name)}"
        style="
          width:100%;
          padding:12px;
          margin:10px 0;
        "
      >

      <input
        id="businessPersonPhone"
        placeholder="Mobile number"
        value="${esc(phone)}"
        inputmode="tel"
        style="
          width:100%;
          padding:12px;
          margin-bottom:10px;
        "
      >

      <button type="button"
        id="selectBusinessContact"
        style="
          width:100%;
          padding:12px;
          margin-bottom:8px;
        ">
        📱 Select Contact
      </button>

      <button type="button"
        id="saveBusinessPerson"
        style="
          width:100%;
          padding:12px;
        ">
        Save
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  $("closeBusinessCustomer").onclick=()=>{
    modal.remove();
  };

  $("selectBusinessContact").onclick=
    selectBusinessContact;

  $("saveBusinessPerson").onclick=()=>{
    const n=
      String(
        $("businessPersonName")?.value||""
      ).trim();

    const p=
      String(
        $("businessPersonPhone")?.value||""
      ).trim();

    if(!n){
      alert("Enter name");
      return;
    }

    const exists=D.business.some(x=>
      !x.type &&
      (x.role||"customer")===role &&
      String(x.name).toLowerCase()===n.toLowerCase() &&
      String(x.phone||"")===p
    );

    if(!exists){
      D.business.push({
        id:uid(),
        role,
        name:n,
        phone:p,
        created:Date.now()
      });
    }

    D.businessFilter=role;
    D.businessEntryRole=role;

    save();

    modal.remove();

    renderBusiness();
  };
}

/* =========================================================
   BUSINESS PAGE
   ========================================================= */

function renderBusiness(){
  const list=$("businessList");
  if(!list)return;

  const type=D.businessFilter||"customer";

  if($("businessGiven"))
    $("businessGiven").textContent=
      money(totalGive("business"));

  if($("businessReceived"))
    $("businessReceived").textContent=
      money(totalReceive("business"));

  if($("businessNet"))
    $("businessNet").textContent=
      money(
        totalGive("business")-
        totalReceive("business")
      );

  const search=
    val("businessSearch").toLowerCase();

  if(type==="sales"||type==="purchase"){
    renderBusinessRecords(type);
    return;
  }

  const role=
    type==="supplier"
    ?"supplier"
    :"customer";

  let people=businessPeople(role);

  if(search){
    people=people.filter(p=>
      p.name.toLowerCase().includes(search)||
      String(p.phone||"").includes(search)
    );
  }

  list.innerHTML=`
    <div style="
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:10px;
    ">

      <button type="button"
        onclick="${
          role==="customer"
          ?"addBusinessCustomer()"
          :"addBusinessSupplier()"
        }">
        + ${
          role==="customer"
          ?"Customer"
          :"Supplier"
        }
      </button>

    </div>

    ${
      people.length
      ?people.map(businessPersonCard).join("")
      :emptyCard(
        role==="customer"
        ?"No customers yet"
        :"No suppliers yet",
        "Use + button to add one."
      )
    }
  `;
}

function businessPersonCard(p){
  const balance=p.give-p.receive;

  return `
    <div class="list-card">

      <h3>${esc(p.name)}</h3>

      ${
        p.phone
        ?`<div class="meta">${esc(p.phone)}</div>`
        :""
      }

      <div class="meta">
        ${p.role==="customer"?"Customer":"Supplier"}
      </div>

      <div class="meta">
        <span class="give">
          Give ${money(p.give)}
        </span>
        &nbsp; • &nbsp;
        <span class="receive">
          Receive ${money(p.receive)}
        </span>
      </div>

      <div class="amount ${
        balance>=0?"give":"receive"
      }">
        Balance ${money(Math.abs(balance))}
      </div>

      ${
        p.pending
        ?`<div class="pending">
            Pending ${money(p.pending)}
          </div>`
        :""
      }

      <div class="action-row"
        style="
          margin-top:9px;
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        ">

        <button type="button"
          onclick='openBusinessDetail(${JSON.stringify(p.name)},${JSON.stringify(p.phone||"")},${JSON.stringify(p.role)})'>
          Khata
        </button>

        <button type="button"
          onclick='openBusinessEntry(${JSON.stringify(p.role)},${JSON.stringify(p.name)},${JSON.stringify(p.phone||"")})'>
          + Entry
        </button>

        <button type="button"
          onclick='businessStatement(${JSON.stringify(p.name)},${JSON.stringify(p.role)})'>
          Statement
        </button>

        ${
          p.phone
          ?`<button type="button"
              onclick='businessWhatsApp(${JSON.stringify(p.name)},${JSON.stringify(p.phone)},${JSON.stringify(p.role)})'>
              WhatsApp
            </button>`
          :""
        }

      </div>
    </div>
  `;
}

function openBusinessEntry(
  role="customer",
  person="",
  phone=""
){
  D.businessEntryRole=role;

  openKhataForm(
    "business",
    person,
    phone
  );
}

function openBusinessDetail(
  person,
  phone="",
  role="customer"
){
  D.businessEntryRole=role;
  D.detailPerson=person;
  D.detailPhone=phone;
  D.detailMode="business";
  D.detailFilter="all";

  show("khataDetail");
}

/* =========================================================
   BUSINESS SALES / PURCHASE
   ========================================================= */

function addBusinessRecord(type="sales"){
  const name=prompt(
    type==="sales"
    ?"Customer / Sale name"
    :"Supplier / Purchase name"
  );

  if(!name)return;

  const amount=
    Number(prompt("Amount")||0);

  if(amount<=0){
    alert("Enter valid amount");
    return;
  }

  const note=prompt("Note")||"";

  D.business.push({
    id:uid(),
    type,
    name:name.trim(),
    amount,
    note,
    date:today(),
    created:Date.now()
  });

  save();
  renderBusiness();
}

function renderBusinessRecords(type){
  const list=$("businessList");
  if(!list)return;

  const rows=D.business.filter(x=>
    x.type===type
  );

  list.innerHTML=`
    <div style="
      display:flex;
      gap:8px;
      margin-bottom:10px;
    ">
      <button type="button"
        onclick="addBusinessRecord('${type}')">
        + Add ${
          type==="sales"
          ?"Sale"
          :"Purchase"
        }
      </button>
    </div>

    ${
      rows.length
      ?rows.map(x=>`
        <div class="list-card">

          <h3>${esc(x.name)}</h3>

          <div class="amount ${
            type==="sales"
            ?"receive"
            :"give"
          }">
            ${money(x.amount)}
          </div>

          <div class="meta">
            ${esc(x.date||"")} •
            ${esc(x.note||"")}
          </div>

          <button type="button"
            onclick="deleteBusinessRecord('${x.id}')">
            Delete
          </button>

        </div>
      `).join("")
      :emptyCard(
        "No records",
        "Add your first record."
      )
    }
  `;
}

function deleteBusinessRecord(id){
  if(!confirm("Delete this record?"))return;

  D.business=D.business.filter(x=>
    x.id!==id
  );

  save();
  renderBusiness();
}

/* =========================================================
   BUSINESS STATEMENT / WHATSAPP
   ========================================================= */

function statementRows(
  person,
  mode="business",
  role=""
){
  return D.khata.filter(x=>
    (x.mode||"personal")===mode &&
    String(x.person||"").toLowerCase()===
      String(person||"").toLowerCase() &&
    (!role||
      (x.role||"customer")===role)
  );
}

function businessStatement(
  person,
  role="customer"
){
  const rows=
    statementRows(
      person,
      "business",
      role
    );

  let text=
    "HISAB BUSINESS STATEMENT\n\n"+
    "Name: "+person+"\n"+
    "Role: "+role+"\n\n";

  rows.forEach(x=>{
    text+=
      `${x.date} | `+
      `${x.type==="give"?"Give":"Receive"} | `+
      `${money(x.amount)} | `+
      `${x.status||"pending"}\n`;
  });

  const give=rows
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=rows
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  text+=
    "\nGive: "+money(give)+
    "\nReceive: "+money(receive)+
    "\nBalance: "+money(give-receive);

  shareText(
    text,
    "HISAB Statement"
  );
}

function businessWhatsApp(
  person,
  phone,
  role="customer"
){
  let n=String(phone||"")
    .replace(/\D/g,"");

  if(n.length===10)
    n="91"+n;

  if(n.length<10){
    alert("Mobile number not available");
    return;
  }

  const rows=
    statementRows(
      person,
      "business",
      role
    );

  const give=rows
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=rows
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const text=
`HISAB Statement
Name: ${person}

Give: ${money(give)}
Receive: ${money(receive)}
Balance: ${money(give-receive)}

Thank you.`;

  const url=
    "https://wa.me/"+
    n+
    "?text="+
    encodeURIComponent(text);

  window.open(url,"_blank");
}

/* =========================================================
   SHARE / PDF
   ========================================================= */

function shareText(text,title="HISAB"){
  if(navigator.share){
    navigator.share({
      title,
      text
    }).catch(()=>{});
    return;
  }

  copyText(text);
}

function copyText(text){
  if(navigator.clipboard){
    navigator.clipboard.writeText(text)
      .then(()=>alert("Copied"));
  }else{
    prompt("Copy this:",text);
  }
}

function khataText(){
  const rows=
    statementRows(
      D.detailPerson,
      D.detailMode,
      D.detailMode==="business"
      ?D.businessEntryRole
      :""
    );

  let t=
    "HISAB KHATA\n\n"+
    "Name: "+D.detailPerson+"\n\n";

  rows.forEach(x=>{
    t+=
      `${x.date} | `+
      `${x.type==="give"?"Give":"Receive"} | `+
      `${money(x.amount)} | `+
      `${x.status||"pending"}\n`;
  });

  return t||"No entries";
}

function shareKhata(){
  shareText(
    khataText(),
    "HISAB Khata"
  );
}

function pdfText(s){
  return String(s)
    .replace(/\\/g,"\\\\")
    .replace(/\(/g,"\\(")
    .replace(/\)/g,"\\)");
}

function makeSimplePDF(lines){
  const safe=lines.map(x=>
    String(x).replace(/[^\x20-\x7E]/g,"")
  );

  const content=
`BT
/F1 10 Tf
50 800 Td
${
  safe.map((x,i)=>
    `${i?"0 -16 Td ":""}(${pdfText(x)}) Tj`
  ).join("\n")
}
ET`;

  return new Blob([`
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 842]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
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
%%EOF
`],{
    type:"application/pdf"
  });
}

async function sharePDF(blob,filename){
  const file=new File(
    [blob],
    filename,
    {type:"application/pdf"}
  );

  try{
    if(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({files:[file]})
    ){
      await navigator.share({
        title:"HISAB PDF",
        files:[file]
      });
      return;
    }
  }catch(e){}

  const url=
    URL.createObjectURL(blob);

  const a=
    document.createElement("a");

  a.href=url;
  a.download=filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>{
    URL.revokeObjectURL(url);
  },1500);
}

function exportKhataPDF(){
  const rows=
    statementRows(
      D.detailPerson,
      D.detailMode,
      D.detailMode==="business"
      ?D.businessEntryRole
      :""
    );

  const lines=[
    "HISAB KHATA",
    "",
    "Name: "+D.detailPerson,
    ""
  ];

  rows.forEach(x=>{
    lines.push(
      `${x.date}  ${
        x.type==="give"
        ?"Give"
        :"Receive"
      }  ${money(x.amount)}  ${
        x.status||"pending"
      }`
    );
  });

  const give=rows
    .filter(x=>x.type==="give")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const receive=rows
    .filter(x=>x.type==="receive")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  lines.push("");
  lines.push("Give: "+money(give));
  lines.push("Receive: "+money(receive));
  lines.push("Balance: "+money(give-receive));

  sharePDF(
    makeSimplePDF(lines),
    "HISAB-Khata.pdf"
  );
}

function summaryText(){
  return `HISAB SUMMARY

Mode: ${D.mode}

Income: ${money(totalIncome())}
Expense: ${money(totalExpense())}
Give: ${money(totalGive(D.mode))}
Receive: ${money(totalReceive(D.mode))}
Balance: ${money(totalIncome()-totalExpense())}`;
}

function exportSummary(){
  shareText(
    summaryText(),
    "HISAB Summary"
  );
}

function exportSummaryPDF(){
  const lines=summaryText().split("\n");

  sharePDF(
    makeSimplePDF(lines),
    "HISAB-Report.pdf"
  );
}

/* =========================================================
   PLANNING
   ========================================================= */

function calcBudget(){
  const amount=num("budgetAmount");

  if(amount<0){
    alert("Invalid budget");
    return;
  }

  D.budget=amount;
  save();
  renderPlanning();

  alert("Budget saved");
}

function calcGoal(){
  const name=val("goalName");
  const target=num("goalTarget");
  const saved=num("goalSaved");

  if(!name||target<=0){
    alert("Enter goal details");
    return;
  }

  D.goals.push({
    id:uid(),
    name,
    target,
    saved,
    date:val("goalDate")||today()
  });

  save();
  renderPlanning();

  [
    "goalName",
    "goalTarget",
    "goalSaved",
    "goalDate"
  ].forEach(id=>{
    if($(id))$(id).value="";
  });
}

function renderPlanning(){
  if($("budgetAmount"))
    $("budgetAmount").value=D.budget||"";

  const list=$("goalList");
  if(!list)return;

  list.innerHTML=`
    <div class="list-card">
      <h3>Monthly Budget</h3>
      <div class="amount">
        ${money(D.budget)}
      </div>
      <div class="meta">
        Spent ${money(totalExpense())}
      </div>
    </div>

    ${
      D.goals.map(g=>{
        const percent=Math.min(
          100,
          Math.round(
            Number(g.saved||0)/
            Number(g.target||1)*100
          )
        );

        return `
          <div class="list-card">
            <h3>${esc(g.name)}</h3>
            <div class="amount">
              ${money(g.saved)}
              /
              ${money(g.target)}
            </div>
            <div class="meta">
              ${percent}% complete
            </div>
          </div>
        `;
      }).join("")
      ||
      emptyCard(
        "No goals",
        "Create a savings goal."
      )
    }
  `;
}

/* =========================================================
   PAYMENTS
   ========================================================= */

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

  if(!name||amount<=0){
    alert("Enter valid bill details");
    return;
  }

  D.bills.push({
    id:uid(),
    kind:
      kind==="Credit Card"
      ?"card"
      :"bill",
    name,
    amount,
    due,
    status:"pending"
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

  if(p<=0||months<=0){
    alert("Enter valid loan details");
    return;
  }

  const r=rate/12/100;

  const emi=r
    ?p*r*Math.pow(1+r,months)/
      (Math.pow(1+r,months)-1)
    :p/months;

  D.emis.push({
    id:uid(),
    principal:p,
    rate,
    months,
    emi
  });

  save();

  if($("emiResult")){
    $("emiResult").innerHTML=`
      <div class="list-card">
        <h3>
          Monthly EMI: ${money(emi)}
        </h3>
        <small>
          Total: ${money(emi*months)}
        </small>
      </div>
    `;
  }

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

  const amount=
    Number(prompt("Loan amount")||0);

  const rate=
    Number(prompt("Interest %")||0);

  const months=
    Number(prompt("Tenure months")||0);

  if(amount<=0||months<=0){
    alert("Invalid loan");
    return;
  }

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

function renderPayments(){
  const list=$("billList");
  if(!list)return;

  list.innerHTML=`
    <div class="list-card">

      <h3>🧾 Bills</h3>

      ${
        D.bills
          .filter(x=>x.kind==="bill")
          .map(x=>`
            <div class="list-card">
              <b>${esc(x.name)}</b>
              <div>
                ${money(x.amount)}
              </div>
              <small>
                Due: ${esc(x.due||"-")}
              </small>
              <br>
              <button type="button"
                onclick="deleteBill('${x.id}')">
                Delete
              </button>
            </div>
          `).join("")
        ||"<div>No bills.</div>"
      }

    </div>

    <div class="list-card">

      <h3>💳 Credit Cards</h3>

      ${
        D.bills
          .filter(x=>x.kind==="card")
          .map(x=>`
            <div class="list-card">
              <b>${esc(x.name)}</b>
              <div>${money(x.amount)}</div>
              <small>
                Due: ${esc(x.due||"-")}
              </small>
              <br>
              <button type="button"
                onclick="deleteBill('${x.id}')">
                Delete
              </button>
            </div>
          `).join("")
        ||"<div>No card bills.</div>"
      }

    </div>

    <div class="list-card">

      <h3>🏦 Loans</h3>

      ${
        D.loans.map(x=>`
          <div class="list-card">
            <b>${esc(x.name)}</b>
            <div>${money(x.amount)}</div>
            <small>
              ${x.rate}% •
              ${x.months} months
            </small>
            <br>
            <button type="button"
              onclick="deleteLoan('${x.id}')">
              Delete
            </button>
          </div>
        `).join("")
        ||"<div>No loans.</div>"
      }

    </div>

    <div class="list-card">

      <h3>📅 EMI</h3>

      ${
        D.emis.map(x=>`
          <div class="list-card">
            <b>
              EMI ${money(x.emi)}
            </b>
            <small>
              ${x.months} months
            </small>
            <br>
            <button type="button"
              onclick="deleteEMI('${x.id}')">
              Delete
            </button>
          </div>
        `).join("")
        ||"<div>No EMI.</div>"
      }

    </div>
  `;
}

/* =========================================================
   REPORTS
   ========================================================= */

function renderReports(){
  const income=totalIncome();
  const expense=totalExpense();
  const give=totalGive(D.mode);
  const receive=totalReceive(D.mode);

  if($("reportIncome"))
    $("reportIncome").textContent=money(income);

  if($("reportExpense"))
    $("reportExpense").textContent=money(expense);

  if($("reportGive"))
    $("reportGive").textContent=money(give);

  if($("reportReceive"))
    $("reportReceive").textContent=money(receive);

  if($("reportContent")){
    $("reportContent").innerHTML=`
      <div class="list-card">

        <h3>
          ${
            D.mode==="business"
            ?"Business"
            :"Personal"
          }
          Overview
        </h3>

        <p>
          Balance:
          <b>${money(income-expense)}</b>
        </p>

        <p>
          Udhaar Balance:
          <b>${money(give-receive)}</b>
        </p>

        ${
          D.mode==="business"
          ?`
            <p>
              Sales:
              <b>${money(
                D.business
                  .filter(x=>x.type==="sales")
                  .reduce(
                    (a,x)=>
                      a+Number(x.amount||0),
                    0
                  )
              )}</b>
            </p>

            <p>
              Purchase:
              <b>${money(
                D.business
                  .filter(x=>x.type==="purchase")
                  .reduce(
                    (a,x)=>
                      a+Number(x.amount||0),
                    0
                  )
              )}</b>
            </p>
          `
          :""
        }

      </div>
    `;
  }
}

/* =========================================================
   REMINDERS
   ========================================================= */

function addReminder(){
  const name=val("reminderName");
  const date=val("reminderDate");

  if(!name||!date){
    alert("Enter reminder and date");
    return;
  }

  D.reminders.push({
    id:uid(),
    name,
    date
  });

  save();
  renderReminders();

  if($("reminderName"))
    $("reminderName").value="";

  if($("reminderDate"))
    $("reminderDate").value="";
}

function renderReminders(){
  const list=$("reminderList");
  if(!list)return;

  const rows=
    [...D.reminders].sort((a,b)=>
      String(a.date).localeCompare(
        String(b.date)
      )
    );

  list.innerHTML=rows.length
    ?rows.map(x=>`
      <div class="list-card">
        <h3>${esc(x.name||"Reminder")}</h3>
        <div class="meta">
          ${esc(x.date||"")}
        </div>
        <button type="button"
          onclick="deleteReminder('${x.id}')">
          Delete
        </button>
      </div>
    `).join("")
    :emptyCard(
      "No reminders",
      "Add an important date."
    );
}

function deleteReminder(id){
  D.reminders=D.reminders.filter(x=>x.id!==id);
  save();
  renderReminders();
}

/* =========================================================
   SECURITY
   ========================================================= */

function setPin(){
  const p=val("pinInput");

  if(!/^\d{4,6}$/.test(p)){
    alert("PIN must be 4 to 6 digits");
    return;
  }

  D.pin=p;
  save();

  if($("pinInput"))
    $("pinInput").value="";

  alert("PIN saved");
}

function setPIN(){
  setPin();
}

function lockApp(){
  if(!D.pin){
    alert("First set a PIN");
    return;
  }

  const p=prompt("Enter PIN");

  if(p!==D.pin){
    alert("Wrong PIN");
    return;
  }

  if($("guestGate"))
    $("guestGate").style.display="flex";

  if($("appShell"))
    $("appShell").style.display="none";
}

function removePIN(){
  D.pin="";
  save();
  renderPrivacy();
}

function renderPrivacy(){
  const box=$("privacyContent");

  if(box){
    box.innerHTML=`
      <div class="list-card">
        Security PIN:
        <b>
          ${D.pin?"Enabled":"Not set"}
        </b>
      </div>
    `;
  }
}

/* =========================================================
   BACKUP
   ========================================================= */

function exportBackup(){
  const blob=new Blob(
    [JSON.stringify(D,null,2)],
    {type:"application/json"}
  );

  const url=
    URL.createObjectURL(blob);

  const a=
    document.createElement("a");

  a.href=url;
  a.download=
    "HISAB-Backup-"+today()+".json";

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>{
    URL.revokeObjectURL(url);
  },1000);
}

function importBackup(e){
  const file=e.target.files?.[0];
  if(!file)return;

  const reader=new FileReader();

  reader.onload=()=>{
    try{
      const x=JSON.parse(reader.result);

      if(!x||typeof x!=="object")
        throw new Error();

      D={...D,...x};

      load();
      save();

      alert(
        "Backup restored successfully"
      );

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
  const input=
    document.createElement("input");

  input.type="file";
  input.accept=".json,application/json";

  input.onchange=importBackup;

  input.click();
}

/* =========================================================
   FAMILY
   ========================================================= */

function addFamilyMember(){
  const name=val("familyName");

  if(!name){
    alert("Enter member name");
    return;
  }

  D.family.push({
    id:uid(),
    name
  });

  save();
  renderFamily();

  if($("familyName"))
    $("familyName").value="";
}

function renderFamily(){
  const list=$("familyList");
  if(!list)return;

  list.innerHTML=D.family.length
    ?D.family.map(x=>`
      <div class="list-card">
        <h3>${esc(x.name)}</h3>
        <button type="button"
          onclick="deleteFamily('${x.id}')">
          Delete
        </button>
      </div>
    `).join("")
    :emptyCard(
      "No family members",
      "Add a family member."
    );
}

function deleteFamily(id){
  D.family=D.family.filter(x=>x.id!==id);
  save();
  renderFamily();
}

function renderFamilyTools(){
  const box=$("familyToolsList");

  if(box){
    box.innerHTML=
      `<div class="list-card">
        Family tools ready.
      </div>`;
  }
}

/* =========================================================
   TOOLS
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

function addInsurance(){
  addTool("Insurance");
}

function addSchool(){
  addTool("School");
}

function addVehicle(){
  addTool("Vehicle");
}

function addShopping(){
  addTool("Shopping");
}

function addUtility(){
  addTool("Utility");
}

function addDoc(){
  addTool("Document");
}

function addAnnual(){
  addTool("Annual Planning");
}

function calcEmergency(){
  const monthly=
    Number(
      prompt("Monthly essential expense")||0
    );

  const months=
    Number(
      prompt("How many months?")||6
    );

  if(monthly>0){
    alert(
      "Emergency Fund Target: "+
      money(monthly*months)
    );
  }
}

function calcFD(){
  const p=
    Number(
      $("fdPrincipal")?.value||
      prompt("Principal")||
      0
    );

  const rate=
    Number(
      $("fdRate")?.value||
      prompt("Interest %")||
      0
    );

  const months=
    Number(
      $("fdN")?.value||
      prompt("Months")||
      0
    );

  if(p<=0||months<=0){
    alert("Enter valid FD details");
    return;
  }

  const interest=
    p*rate*(months/12)/100;

  const maturity=p+interest;

  if($("fdResult")){
    $("fdResult").innerHTML=`
      <div class="list-card">
        <h3>
          Maturity: ${money(maturity)}
        </h3>
        <small>
          Interest: ${money(interest)}
        </small>
      </div>
    `;
  }else{
    alert(
      "Maturity: "+money(maturity)
    );
  }
}

function renderTools(){}

/* =========================================================
   SEARCH
   ========================================================= */

function searchAllData(q){
  const list=$("searchResults");
  if(!list)return;

  q=String(q||"")
    .toLowerCase()
    .trim();

  if(!q){
    list.innerHTML="";
    return;
  }

  const result=[];

  D.transactions.forEach(x=>{
    if(
      JSON.stringify(x)
        .toLowerCase()
        .includes(q)
    ){
      result.push(`
        <div class="list-card">
          <b>Transaction</b>
          <br>
          ${esc(x.category||"General")}
          • ${money(x.amount)}
        </div>
      `);
    }
  });

  D.khata.forEach(x=>{
    if(
      JSON.stringify(x)
        .toLowerCase()
        .includes(q)
    ){
      result.push(`
        <div class="list-card">
          <b>Udhaar</b>
          <br>
          ${esc(x.person)}
          • ${x.type}
          • ${money(x.amount)}
        </div>
      `);
    }
  });

  D.business.forEach(x=>{
    if(
      JSON.stringify(x)
        .toLowerCase()
        .includes(q)
    ){
      result.push(`
        <div class="list-card">
          <b>Business</b>
          <br>
          ${esc(x.name||"")}
          ${x.phone?"• "+esc(x.phone):""}
        </div>
      `);
    }
  });

  list.innerHTML=
    result.join("")||
    emptyCard(
      "Nothing found",
      "Try another search."
    );
}

/* =========================================================
   QUICK ADD
   ========================================================= */

function openQuickAdd(){
  const c=prompt(
`HISAB Quick Add

1 = Income
2 = Expense
3 = Udhaar Give
4 = Udhaar Receive`
  );

  if(c==="1"){
    openIncome();
  }else if(c==="2"){
    openExpense();
  }else if(c==="3"||c==="4"){
    openKhataForm(D.mode);

    setTimeout(()=>{
      if($("khataType")){
        $("khataType").value=
          c==="3"
          ?"give"
          :"receive";
      }
    },20);
  }
}

/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings(){}

/* =========================================================
   COMMON
   ========================================================= */

function emptyCard(title,text){
  return `
    <div class="list-card">
      <h3>${esc(title)}</h3>
      <small>${esc(text)}</small>
    </div>
  `;
}

/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

Object.assign(window,{

  show,
  goBack,

  showGuestGate,
  enterGuestMode,
  enterApp,

  setMode,
  openBusiness,
  openPersonal,

  toggleLanguage,
  toggleCurrency,

  openIncome,
  openExpense,
  addTransaction,
  deleteTransaction,

  openKhataForm,
  closeKhataForm,
  saveKhataEntry,

  filterKhata,
  searchKhata,

  openKhataDetail,
  closeKhataDetail,
  renderKhataDetail,
  detailFilter,

  editKhata,
  deleteKhata,
  settleKhata,
  openPaymentEntry,

  businessFilter,
  setBusinessFilter,

  addBusinessCustomer,
  addBusinessSupplier,

  openBusinessCustomerForm,
  selectBusinessContact,

  openBusinessEntry,
  openBusinessDetail,

  businessStatement,
  businessWhatsApp,

  addBusinessRecord,
  renderBusinessRecords,
  deleteBusinessRecord,

  calcBudget,
  calcGoal,

  addBill,
  deleteBill,
  calcEMI,
  deleteEMI,
  saveLoan,
  deleteLoan,

  exportSummary,
  exportSummaryPDF,

  shareKhata,
  exportKhataPDF,

  addReminder,
  deleteReminder,

  setPin,
  setPIN,
  lockApp,
  removePIN,

  exportBackup,
  importBackup,
  backupData,
  restoreData,

  addFamilyMember,

  addInsurance,
  addSchool,
  addVehicle,
  addShopping,
  addUtility,
  addDoc,
  addAnnual,

  calcEmergency,
  calcFD,

  searchAllData,
  openQuickAdd,

  ensureModeSwitch
});

/* =========================================================
   LIVE SEARCH
   ========================================================= */

document.addEventListener("input",e=>{
  if(e.target?.id==="personalSearch"){
    renderPersonal();
  }

  if(e.target?.id==="businessSearch"){
    renderBusiness();
  }
});

/* =========================================================
   STARTUP
   ========================================================= */

load();

window.addEventListener("DOMContentLoaded",()=>{
  if($("khataDate")&&!$("khataDate").value)
    $("khataDate").value=today();

  if(
    $("transactionDate")&&
    !$("transactionDate").value
  ){
    $("transactionDate").value=today();
  }

  showGuestGate();
});
