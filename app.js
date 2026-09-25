/* HISAB GLOBAL V7 — FINAL CONTROLLER
   Local-first • Personal/Business • Khata/Udhaar • Reports • Backup • PIN
*/
(function(){
'use strict';

const KEY='hisab_global_v7';
const LEGACY_KEYS=['hisab_money_manager_v4','hisab_v7_data'];

const DEFAULT={
  mode:'Personal',
  currency:'₹',
  language:'English',
  theme:'light',
  pin:'',
  locked:false,
  personal:[],
  business:[],
  transactions:[],
  lendings:[],
  bills:[],
  reminders:[],
  loans:[],
  goals:[],
  budgets:[],
  savings:[],
  insurance:[],
  school:[],
  vehicles:[],
  family:[],
  shopping:[],
  utilities:[],
  docs:[],
  annualPlans:[],
  limits:[],
  settings:{}
};

let data=load();
let ledgerFilter='all';
let ledgerSearch='';
let txFilter='all';
let selectedPerson=null;

const $=id=>document.getElementById(id);

function clone(o){
  return JSON.parse(JSON.stringify(o));
}

function load(){
  let x=null;

  try{
    x=JSON.parse(localStorage.getItem(KEY)||'null');
  }catch(e){}

  if(!x){
    for(const k of LEGACY_KEYS){
      try{
        x=JSON.parse(localStorage.getItem(k)||'null');
        if(x)break;
      }catch(e){}
    }
  }

  x=x&&typeof x==='object'?x:{};

  const d={
    ...clone(DEFAULT),
    ...x
  };

  [
    'personal','business','transactions','lendings','bills',
    'reminders','loans','goals','budgets','savings','insurance',
    'school','vehicles','family','shopping','utilities','docs',
    'annualPlans','limits'
  ].forEach(k=>{
    if(!Array.isArray(d[k]))d[k]=[];
  });

  d.settings={
    ...DEFAULT.settings,
    ...(d.settings||{})
  };

  return d;
}

function save(){
  try{
    localStorage.setItem(KEY,JSON.stringify(data));
    return true;
  }catch(e){
    alert('HISAB data save nahi ho saka. Device storage check karein.');
    return false;
  }
}

function uid(){
  return Date.now().toString(36)+Math.random().toString(36).slice(2,8);
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function time(){
  return new Date().toLocaleTimeString([],{
    hour:'2-digit',
    minute:'2-digit'
  });
}

function esc(v){
  return String(v??'').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

function num(id){
  return Number($(id)?.value||0);
}

function money(n){
  return `${data.currency||'₹'}${Number(n||0).toLocaleString('en-IN',{
    maximumFractionDigits:2
  })}`;
}

function mode(){
  return data.mode||'Personal';
}

function modeTx(){
  return data.transactions.filter(
    x=>(x.mode||'Personal')===mode()
  );
}

function modePeople(){
  return mode()==='Business'
    ?data.business
    :data.personal;
}

function modeLending(){
  return data.lendings.filter(
    x=>(x.mode||'Personal')===mode()
  );
}

function fmtDate(v){
  if(!v)return '';

  const s=String(v);

  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
    const [y,m,d]=s.split('-');
    return `${d}/${m}/${y}`;
  }

  return s;
}

function parseDate(v){
  if(!v)return null;

  const s=String(v);

  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){
    const [d,m,y]=s.split('/');
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }

  return new Date(s+'T00:00:00');
}

function dueState(date,remaining){
  if(!remaining||remaining<=0)return 'paid';

  const d=parseDate(date);

  if(!d)return 'due';

  const t=new Date();
  t.setHours(0,0,0,0);

  return d<t?'overdue':'due';
}

function toast(msg){
  let t=$('hisabToast');

  if(!t){
    t=document.createElement('div');
    t.id='hisabToast';

    Object.assign(t.style,{
      position:'fixed',
      left:'50%',
      bottom:'78px',
      transform:'translateX(-50%)',
      padding:'11px 15px',
      borderRadius:'12px',
      background:'#14202a',
      color:'#fff',
      zIndex:99999,
      fontSize:'12px',
      boxShadow:'0 8px 25px rgba(0,0,0,.2)',
      maxWidth:'90%',
      textAlign:'center'
    });

    document.body.appendChild(t);
  }

  t.textContent=msg;
  t.style.display='block';

  clearTimeout(window.__hisabToast);

  window.__hisabToast=setTimeout(()=>{
    t.style.display='none';
  },2200);
}

function hideScreens(){
  document.querySelectorAll('.screen').forEach(
    s=>s.classList.add('hidden')
  );
}

function show(id){

  if(data.locked&&id!=='lockScreen'){
    showLockOverlay();
    return;
  }

  hideScreens();

  const el=$(id)||$('home');

  if(el)el.classList.remove('hidden');

  renderAll();

  window.scrollTo(0,0);
}

function enterGuestMode(){
  localStorage.setItem('hisab_guest_mode','true');

  $('guestGate')?.classList.add('hidden');

  show('home');
}

function showGuestGate(){

  if(localStorage.getItem('hisab_guest_mode')==='true'){
    $('guestGate')?.classList.add('hidden');
    show('home');
  }else{
    $('guestGate')?.classList.remove('hidden');
  }
}

function setMode(m){

  data.mode=m==='Business'
    ?'Business'
    :'Personal';

  save();
  renderAll();

  toast(`${data.mode} mode`);
}

function toggleCurrency(){

  const list=['₹','$','€','£','¥','AED '];

  const i=list.indexOf(data.currency);

  data.currency=list[(i+1)%list.length];

  save();
  renderAll();

  toast('Currency: '+data.currency);
}

function toggleLanguage(){

  data.language=
    data.language==='English'
      ?'Hindi'
      :'English';

  save();

  toast('Language: '+data.language);
}

/* ================= PIN LOCK ================= */

function setPin(){

  const p=prompt('4-6 digit PIN set karein:');

  if(p===null)return;

  if(!/^\d{4,6}$/.test(p)){
    toast('PIN 4-6 digits ka hona chahiye');
    return;
  }

  data.pin=p;
  data.locked=false;

  save();

  toast('PIN saved');
}

function showLockOverlay(){

  let o=$('hisabLockOverlay');

  if(!o){

    o=document.createElement('div');
    o.id='hisabLockOverlay';

    Object.assign(o.style,{
      position:'fixed',
      inset:'0',
      background:'#0b1f33',
      color:'#fff',
      zIndex:100000,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:'25px',
      textAlign:'center'
    });

    o.innerHTML=`
      <div>
        <div style="font-size:52px">🔐</div>
        <h2>HISAB Locked</h2>
        <p>Enter your PIN to continue.</p>

        <input
          id="unlockPin"
          type="password"
          inputmode="numeric"
          maxlength="6"
          style="padding:14px;border-radius:12px;border:0;text-align:center;font-size:20px;width:150px"
        >

        <br>

        <button
          id="unlockBtn"
          style="margin-top:12px;padding:12px 22px;border:0;border-radius:12px"
        >
          Unlock
        </button>
      </div>
    `;

    document.body.appendChild(o);

    $('unlockBtn').onclick=unlock;

    setTimeout(()=>{
      $('unlockPin')?.focus();
    },50);
  }

  o.style.display='flex';
}

function unlock(){

  const p=$('unlockPin')?.value||'';

  if(p===data.pin){

    data.locked=false;

    save();

    $('hisabLockOverlay').style.display='none';

    toast('Unlocked');

  }else{
    toast('Wrong PIN');
  }
}

function lockApp(){

  if(!data.pin){
    toast('Pehle PIN set karein');
    setPin();
    return;
  }

  data.locked=true;

  save();

  showLockOverlay();
}

/* ================= QUICK ACTIONS ================= */

function quickTransaction(type){

  show('reports');

  setTimeout(()=>{
    if($('txType')){
      $('txType').value=
        type==='income'
          ?'Income'
          :'Expense';
    }

    $('txAmount')?.focus();

  },50);
}

function quickLending(type){

  show('personal');

  setTimeout(()=>{
    openLendingForm(type);
  },50);
}

function openLendingForm(type){

  const name=prompt(
    `${type==='given'
      ?'Jise paisa diya'
      :'Jisne paisa diya'} — naam:`
  );

  if(!name)return;

  const amount=Number(
    prompt('Amount:')||0
  );

  if(!amount)return;

  const people=modePeople();

  let p=people.find(
    x=>x.name.toLowerCase()===name.toLowerCase()
  );

  if(!p){

    p={
      id:uid(),
      name,
      phone:'',
      type:mode()==='Business'
        ?'customer'
        :'person',
      opening:0
    };

    people.push(p);
  }

  const l={
    id:uid(),
    personId:p.id,
    name:p.name,
    type:type==='received'
      ?'received'
      :'given',
    amount,
    paid:0,
    remaining:amount,
    date:today(),
    time:time(),
    note:'',
    mode:mode()
  };

  data.lendings.push(l);

  save();
  renderAll();

  toast('Khata entry added');
}

function saveLendingForm(){
  openLendingForm('given');
}

/* ================= PEOPLE / KHATA ================= */

function addPerson(m){

  const target=
    m==='Business'
      ?data.business
      :data.personal;

  const name=prompt(
    `${m==='Business'
      ?'Customer/Supplier'
      :'Person'} name:`
  );

  if(!name)return;

  const phone=prompt(
    'Mobile (optional):'
  )||'';

  if(target.some(
    p=>p.name.toLowerCase()===name.toLowerCase()
  )){
    toast('Name already exists');
    return;
  }

  target.push({
    id:uid(),
    name,
    phone,
    type:m==='Business'
      ?'customer'
      :'person',
    opening:0,
    created:today()
  });

  save();
  renderAll();

  toast('Person added');
}

function personBalance(p){

  const ls=data.lendings.filter(
    x=>
      x.personId===p.id &&
      (x.mode||'Personal')===mode()
  );

  let given=Number(p.opening||0);
  let received=0;

  ls.forEach(x=>{

    if(x.type==='given'){
      given+=Math.max(
        0,
        Number(x.amount||0)-Number(x.paid||0)
      );
    }else{
      received+=Math.max(
        0,
        Number(x.amount||0)-Number(x.paid||0)
      );
    }

  });

  return{
    given,
    received,
    net:given-received
  };
}

function addKhataTransaction(pid,type){

  const p=modePeople().find(
    x=>x.id===pid
  );

  if(!p)return;

  const amount=Number(
    prompt(
      `${type==='given'
        ?'Diya'
        :'Liya'} amount:`
    )||0
  );

  if(!amount)return;

  const note=prompt(
    'Note (optional):'
  )||'';

  data.lendings.push({
    id:uid(),
    personId:pid,
    name:p.name,
    type,
    amount,
    paid:0,
    remaining:amount,
    date:today(),
    time:time(),
    note,
    mode:mode()
  });

  save();
  renderAll();

  toast('Entry saved');
}

function markLendingPaid(id){

  const x=data.lendings.find(
    a=>a.id===id
  );

  if(!x)return;

  const rem=Math.max(
    0,
    Number(x.amount||0)-Number(x.paid||0)
  );

  const p=Number(
    prompt(
      `Remaining ${money(rem)}. Payment amount:`
    )||0
  );

  if(!p||p>rem){
    toast('Invalid payment');
    return;
  }

  x.paid=
    Number(x.paid||0)+p;

  x.remaining=
    Math.max(
      0,
      Number(x.amount||0)-x.paid
    );

  x.paymentHistory=
    x.paymentHistory||[];

  x.paymentHistory.push({
    amount:p,
    date:today(),
    time:time()
  });

  x.status=
    x.remaining
      ?'partial'
      :'paid';

  save();
  renderAll();

  toast(
    x.remaining
      ?'Partial payment saved'
      :'Paid'
  );
}

function deleteLending(id){

  if(!confirm('Delete this entry?'))return;

  data.lendings=
    data.lendings.filter(
      x=>x.id!==id
    );

  save();
  renderAll();
}

function editLending(id){

  const x=data.lendings.find(
    a=>a.id===id
  );

  if(!x)return;

  const a=Number(
    prompt(
      'New total amount:',
      x.amount
    )||0
  );

  if(!a)return;

  x.amount=a;

  x.remaining=
    Math.max(
      0,
      a-Number(x.paid||0)
    );

  const note=prompt(
    'Note:',
    x.note||''
  );

  if(note!==null)x.note=note;

  save();
  renderAll();
}

function showPersonHistory(pid){

  selectedPerson=pid;

  const p=modePeople().find(
    x=>x.id===pid
  );

  if(!p)return;

  const ls=modeLending()
    .filter(x=>x.personId===pid);

  let html=`
    <div class="person">
      <b>${esc(p.name)}</b>
      <p>${p.phone?esc(p.phone):''}</p>

      <button onclick="exportPersonPDF('${pid}')">
        📄 Statement / PDF
      </button>

      <button onclick="sharePerson('${pid}')">
        📤 Share
      </button>
    </div>
  `;

  html+=ls.length
    ?ls
      .sort((a,b)=>
        String(b.date)
        .localeCompare(String(a.date))
      )
      .map(x=>`
        <div class="person">

          <b>
            ${x.type==='given'
              ?'📤 Given'
              :'📥 Received'}
            ${money(x.amount)}
          </b>

          <div>
            ${fmtDate(x.date)}
            ${esc(x.time||'')}
          </div>

          <div>
            Paid: ${money(x.paid||0)}
            •
            Due: ${money(
              Math.max(
                0,
                (x.amount||0)-(x.paid||0)
              )
            )}
          </div>

          <div>${esc(x.note||'')}</div>

          <button onclick="markLendingPaid('${x.id}')">
            Payment
          </button>

          <button onclick="editLending('${x.id}')">
            Edit
          </button>

          <button onclick="deleteLending('${x.id}')">
            Delete
          </button>

        </div>
      `)
      .join('')
    :'<div class="person">No transactions yet.</div>';

  const box=$('personalList');

  if(box)box.innerHTML=html;
}

function sharePerson(pid){

  const p=modePeople().find(
    x=>x.id===pid
  );

  if(!p)return;

  const b=personBalance(p);

  const text=
`HISAB — ${p.name}
Given: ${money(b.given)}
Received: ${money(b.received)}
Net Due: ${money(b.net)}`;

  shareText(text);
}

function renderPeople(){

  const box=$('personalList');

  if(!box)return;

  let people=modePeople();

  const q=ledgerSearch.toLowerCase();

  people=people.filter(
    p=>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.phone||'').includes(q)
  );

  if(!people.length){
    box.innerHTML=
      '<div class="person">No people added. Tap Add Person.</div>';
    return;
  }

  box.innerHTML=
    people
      .map(p=>{

        const b=personBalance(p);

        let showEntry=
          ledgerFilter==='all' ||
          (
            ledgerFilter==='given' &&
            b.given>0
          ) ||
          (
            ledgerFilter==='received' &&
            b.received>0
          ) ||
          (
            ledgerFilter==='pending' &&
            (b.given>0||b.received>0)
          );

        if(!showEntry)return '';

        return `
          <div class="person">

            <div style="display:flex;justify-content:space-between">
              <b>${esc(p.name)}</b>
              <b>${money(b.net)}</b>
            </div>

            <small>${esc(p.phone||'')}</small>

            <div>
              Given: ${money(b.given)}
              •
              Received: ${money(b.received)}
            </div>

            <button onclick="addKhataTransaction('${p.id}','given')">
              + Given
            </button>

            <button onclick="addKhataTransaction('${p.id}','received')">
              + Received
            </button>

            <button onclick="showPersonHistory('${p.id}')">
              History
            </button>

            <button onclick="sharePerson('${p.id}')">
              Share
            </button>

          </div>
        `;
      })
      .join('')
      ||
      '<div class="person">No matching entries.</div>';
}

function filterLedger(f){
  ledgerFilter=f;
  renderPeople();
}

function searchLedger(v){
  ledgerSearch=v||'';
  renderPeople();
}

/* ================= TRANSACTIONS ================= */

function addTransaction(){

  const type=
    (($('txType')?.value||'Income')
      .toLowerCase()
      .includes('expense'))
      ?'expense'
      :'income';

  const amount=num('txAmount');

  if(!amount){
    toast('Amount enter karein');
    return;
  }

  const cat=
    $('txCat')?.value||'Other';

  const note=
    $('txNote')?.value||'';

  data.transactions.push({
    id:uid(),
    type,
    amount,
    category:cat,
    note,
    date:today(),
    time:time(),
    mode:mode()
  });

  save();
  renderAll();

  toast('Transaction saved');
}

function deleteTransaction(id){

  if(!confirm('Delete transaction?'))return;

  data.transactions=
    data.transactions.filter(
      x=>x.id!==id
    );

  save();
  renderAll();
}

function editTransaction(id){

  const x=data.transactions.find(
    a=>a.id===id
  );

  if(!x)return;

  const a=Number(
    prompt('Amount:',x.amount)||0
  );

  if(!a)return;

  x.amount=a;

  const note=prompt(
    'Note:',
    x.note||''
  );

  if(note!==null)x.note=note;

  save();
  renderAll();
}

function setTxType(t){

  if($('txType')){
    $('txType').value=t;
  }

  txFilter=t.toLowerCase();

  renderTransactions();
}

function totals(){

  const tx=modeTx();
  const ld=modeLending();

  const income=
    tx
      .filter(x=>x.type==='income')
      .reduce(
        (s,x)=>s+Number(x.amount||0),
        0
      );

  const expense=
    tx
      .filter(x=>x.type==='expense')
      .reduce(
        (s,x)=>s+Number(x.amount||0),
        0
      );

  const given=
    ld
      .filter(x=>x.type==='given')
      .reduce(
        (s,x)=>
          s+
          Math.max(
            0,
            Number(x.amount||0)-
            Number(x.paid||0)
          ),
        0
      );

  const received=
    ld
      .filter(x=>x.type==='received')
      .reduce(
        (s,x)=>
          s+
          Math.max(
            0,
            Number(x.amount||0)-
            Number(x.paid||0)
          ),
        0
      );

  return{
    income,
    expense,
    balance:income-expense,
    given,
    received,
    net:given-received
  };
}

function totalIncome(){
  return totals().income;
}

function totalExpense(){
  return totals().expense;
}

function moneyTransactions(){
  return modeTx();
}

function renderTransactions(){

  const box=$('txList');

  if(!box)return;

  let tx=
    modeTx()
      .slice()
      .reverse();

  if(
    txFilter==='income' ||
    txFilter==='expense'
  ){
    tx=
      tx.filter(
        x=>x.type===txFilter
      );
  }

  box.innerHTML=
    tx.length
      ?tx
        .map(x=>`
          <div class="person">

            <div>
              <b>
                ${x.type==='income'
                  ?'📈'
                  :'📉'}
                ${esc(x.category)}
              </b>

              <strong>
                ${x.type==='income'?'+':'-'}
                ${money(x.amount)}
              </strong>
            </div>

            <small>
              ${fmtDate(x.date)}
              ${esc(x.time||'')}
              •
              ${esc(x.note||'')}
            </small>

            <br>

            <button onclick="editTransaction('${x.id}')">
              Edit
            </button>

            <button onclick="deleteTransaction('${x.id}')">
              Delete
            </button>

          </div>
        `)
        .join('')
      :'<div class="person">No transactions.</div>';

  const cats={};

  modeTx()
    .filter(x=>x.type==='expense')
    .forEach(x=>{
      cats[x.category]=
        (cats[x.category]||0)+
        Number(x.amount||0);
    });

  if($('catSummary')){
    $('catSummary').innerHTML=
      Object.keys(cats).length
        ?Object
          .entries(cats)
          .map(([k,v])=>
            `<div>${esc(k)} — <b>${money(v)}</b></div>`
          )
          .join('')
        :'No expense data';
  }
}

/* ================= BUDGET / GOALS ================= */

function calcBudget(){

  const inc=num('monthlyIncome');
  const bud=num('monthlyBudget');
  const sav=num('monthlySaving');

  const spend=totalExpense();

  const remain=
    bud-spend-sav;

  const out=
`Budget: ${money(bud)}
<br>Spent: ${money(spend)}
<br>Saving target: ${money(sav)}
<br><b>Remaining: ${money(remain)}</b>`;

  if($('budgetResult')){
    $('budgetResult').innerHTML=out;
  }

  data.budgets.push({
    id:uid(),
    month:today().slice(0,7),
    income:inc,
    budget:bud,
    saving:sav,
    spent:spend,
    mode:mode()
  });

  save();

  toast('Budget calculated');
}

function calcGoal(){

  const name=
    $('goalName')?.value||'Goal';

  const target=num('goalTarget');
  const current=num('goalCurrent');
  const monthly=num('goalMonthly');

  if(!target){
    toast('Target enter karein');
    return;
  }

  const left=
    Math.max(0,target-current);

  const months=
    monthly
      ?Math.ceil(left/monthly)
      :0;

  if($('goalResult')){
    $('goalResult').innerHTML=`
      <b>${esc(name)}</b><br>
      Target: ${money(target)}<br>
      Current: ${money(current)}<br>
      Remaining: ${money(left)}<br>
      ${
        months
          ?'At this saving rate: '+months+' months'
          :'Set monthly saving to estimate.'
      }
    `;
  }

  const old=
    data.goals.find(
      g=>
        g.name===name &&
        g.mode===mode()
    );

  if(old){
    old.target=target;
    old.current=current;
    old.monthly=monthly;
  }else{
    data.goals.push({
      id:uid(),
      name,
      target,
      current,
      monthly,
      mode:mode()
    });
  }

  save();
}

/* ================= EMI ================= */

function calcEMI(){

  const p=num('loanAmount');
  const r=num('loanRate')/1200;
  const n=num('loanTenure');

  if(!p||!n){
    toast('Loan amount & tenure enter karein');
    return;
  }

  const emi=
    r
      ?p*r*Math.pow(1+r,n)/
       (Math.pow(1+r,n)-1)
      :p/n;

  const interest=
    emi*n-p;

  if($('emiResult')){
    $('emiResult').innerHTML=`
      <b>Monthly EMI: ${money(emi)}</b>
      <br>
      Total payment: ${money(emi*n)}
      <br>
      Total interest: ${money(interest)}
    `;
  }

  return emi;
}

/* ================= BILLS / REMINDERS ================= */

function addBill(kind){

  const name=prompt(
    `${kind||'Bill'} name:`
  );

  if(!name)return;

  const amount=Number(
    prompt('Amount:')||0
  );

  if(!amount)return;

  const due=
    prompt(
      'Due date (YYYY-MM-DD):',
      today()
    )||today();

  data.bills.push({
    id:uid(),
    name,
    amount,
    due,
    kind:kind||'Bill',
    paid:false,
    mode:mode()
  });

  save();
  renderAll();

  toast('Bill added');
}

function toggleBill(id){

  const x=data.bills.find(
    a=>a.id===id
  );

  if(x){
    x.paid=!x.paid;
    save();
    renderAll();
  }
}

function addReminder(){

  const name=
    $('remName')?.value||'Reminder';

  const type=
    $('remType')?.value||'Bill';

  const date=
    $('remDate')?.value||today();

  const amount=
    num('remAmount');

  const note=
    $('remNote')?.value||'';

  data.reminders.push({
    id:uid(),
    name,
    type,
    date,
    amount,
    note,
    done:false,
    mode:mode()
  });

  save();
  renderAll();

  toast('Reminder saved');
}

function markBillPaid(id){
  toggleBill(id);
}

function deleteBill(id){

  if(confirm('Delete bill?')){

    data.bills=
      data.bills.filter(
        x=>x.id!==id
      );

    save();
    renderAll();
  }
}

function saveReminderForm(){
  addReminder();
}

/* ================= BUSINESS ================= */

function saveBusiness(){
  addPerson('Business');
}

/* ================= FAMILY / TOOLS ================= */

function addFamilyMember(){

  const n=prompt(
    'Family member name:'
  );

  if(n){

    data.family.push({
      id:uid(),
      name:n
    });

    save();
    renderAll();
  }
}

function addShopping(){

  const n=prompt('Item:');

  if(n){

    data.shopping.push({
      id:uid(),
      name:n,
      done:false
    });

    save();
    renderAll();
  }
}

function addUtility(){

  const n=prompt(
    'Utility name:'
  );

  if(n){

    data.utilities.push({
      id:uid(),
      name:n,
      amount:Number(
        prompt('Amount:')||0
      )
    });

    save();
    renderAll();
  }
}

function calcFD(){

  const p=num('fdP');
  const r=num('fdR')/100;
  const n=num('fdN');

  const maturity=
    p*Math.pow(
      1+r/4,
      4*n/12
    );

  if($('fdResult')){
    $('fdResult').innerHTML=`
      Maturity:
      <b>${money(maturity)}</b>
      <br>
      Interest:
      ${money(maturity-p)}
    `;
  }
}

function addInsurance(){

  const name=
    $('insName')?.value||
    'Insurance';

  const premium=
    num('insPremium');

  const date=
    $('insDate')?.value||
    today();

  data.insurance.push({
    id:uid(),
    name,
    premium,
    date
  });

  save();
  renderAll();
}

function addSchool(){

  const child=
    $('child')?.value||
    'Child';

  const fee=
    num('schoolFee');

  const due=
    $('schoolDue')?.value||
    today();

  const books=
    num('schoolBooks');

  data.school.push({
    id:uid(),
    child,
    fee,
    due,
    books
  });

  save();
  renderAll();
}

function addVehicle(){

  const n=
    $('vehicle')?.value||
    prompt('Vehicle:')||
    '';

  if(n){

    data.vehicles.push({
      id:uid(),
      name:n
    });

    save();
    renderAll();
  }
}

function addDoc(){

  const n=
    $('docName')?.value||
    prompt('Document name:')||
    '';

  if(n){

    data.docs.push({
      id:uid(),
      name:n,
      date:today()
    });

    save();
    renderAll();
  }
}

function addAnnual(){

  const n=
    $('annualName')?.value||
    prompt('Plan name:')||
    '';

  if(n){

    data.annualPlans.push({
      id:uid(),
      name:n
    });

    save();
    renderAll();
  }
}

function saveLimit(){

  const n=
    $('limitName')?.value||
    prompt('Limit category:')||
    'Other';

  const v=
    num('limitAmount')||
    Number(
      prompt('Limit amount:')||0
    );

  data.limits.push({
    id:uid(),
    name:n,
    amount:v,
    mode:mode()
  });

  save();
  renderAll();
}

function calcEmergency(){

  const monthly=
    Number(
      prompt(
        'Monthly essential expense:'
      )||0
    );

  const months=
    Number(
      prompt(
        'Target months:',
        6
      )||6
    );

  const target=
    monthly*months;

  const el=$('emergencyResult');

  if(el){
    el.innerHTML=
      `Emergency Fund Target:
       <b>${money(target)}</b>`;
  }else{
    toast(
      `Emergency Fund: ${money(target)}`
    );
  }
}

function renderComparison(){

  const el=
    $('comparisonResult')||
    $('comparison');

  if(!el)return;

  const t=modeTx();

  const inc=
    t
      .filter(x=>x.type==='income')
      .reduce(
        (s,x)=>s+Number(x.amount||0),
        0
      );

  const exp=
    t
      .filter(x=>x.type==='expense')
      .reduce(
        (s,x)=>s+Number(x.amount||0),
        0
      );

  el.innerHTML=`
    <div class="person">
      Income: ${money(inc)}
      <br>
      Expense: ${money(exp)}
      <br>
      Balance: ${money(inc-exp)}
    </div>
  `;
}

function searchAllData(){

  const q=
    (prompt('Search HISAB:')||'')
      .toLowerCase();

  if(!q)return;

  const out=[
    ...modeTx().map(
      x=>`${x.category} ${x.note} ${x.amount}`
    ),
    ...modePeople().map(
      x=>`${x.name} ${x.phone}`
    ),
    ...modeLending().map(
      x=>`${x.name} ${x.note} ${x.amount}`
    )
  ].filter(
    x=>x.toLowerCase().includes(q)
  );

  alert(
    out.length
      ?out.join('\n')
      :'No result'
  );
}

/* ================= SHARE ================= */

function summaryText(){

  const t=totals();

  return `HISAB — ${mode()}
Income: ${money(t.income)}
Expense: ${money(t.expense)}
Balance: ${money(t.balance)}
Money Given: ${money(t.given)}
Money Received: ${money(t.received)}
Net Khata: ${money(t.net)}`;
}

function shareText(text){

  if(navigator.share){

    navigator.share({
      title:'HISAB',
      text
    }).catch(()=>{});

  }else{

    navigator.clipboard?.writeText(text);

    toast('Summary copied');
  }
}

function shareHisab(){
  shareText(summaryText());
}

/* ================= EXPORT ================= */

function download(
  name,
  content,
  type
){

  const a=
    document.createElement('a');

  a.href=
    URL.createObjectURL(
      new Blob(
        [content],
        {type}
      )
    );

  a.download=name;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    ()=>URL.revokeObjectURL(a.href),
    500
  );
}

function exportBackup(){

  download(
    `HISAB-Backup-${today()}.json`,
    JSON.stringify(
      data,
      null,
      2
    ),
    'application/json'
  );

  toast('Backup exported');
}

function importBackup(event){

  const file=
    event?.target?.files?.[0];

  if(!file)return;

  const r=
    new FileReader();

  r.onload=e=>{

    try{

      const x=
        JSON.parse(
          e.target.result
        );

      if(
        !x ||
        !Array.isArray(x.transactions) ||
        !Array.isArray(x.lendings)
      ){
        throw Error();
      }

      data={
        ...clone(DEFAULT),
        ...x
      };

      data.settings={
        ...DEFAULT.settings,
        ...(x.settings||{})
      };

      save();
      renderAll();

      toast('Backup restored');

    }catch(err){

      toast(
        'Invalid HISAB backup'
      );
    }
  };

  r.readAsText(file);
}

function exportSummary(){

  download(
    `HISAB-Summary-${today()}.txt`,
    summaryText(),
    'text/plain'
  );

  toast('Summary exported');
}

function csvEscape(v){

  return `"${String(v??'')
    .replaceAll('"','""')}"`;
}

function exportCSV(){

  const rows=[
    [
      'Date',
      'Time',
      'Mode',
      'Type',
      'Category',
      'Amount',
      'Note'
    ],
    ...modeTx().map(x=>[
      x.date,
      x.time,
      x.mode,
      x.type,
      x.category,
      x.amount,
      x.note
    ])
  ];

  download(
    `HISAB-${mode()}-${today()}.csv`,
    rows
      .map(r=>
        r.map(csvEscape).join(',')
      )
      .join('\n'),
    'text/csv'
  );

  toast('CSV exported');
}

/* ================= PDF / PRINT ================= */

function printHTML(
  title,
  body
){

  const w=
    window.open(
      '',
      '_blank'
    );

  if(!w){
    toast('Popup blocked');
    return;
  }

  w.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>${esc(title)}</title>

      <meta
        name="viewport"
        content="width=device-width"
      >

      <style>
        body{
          font-family:Arial;
          padding:20px;
          color:#111
        }

        table{
          width:100%;
          border-collapse:collapse
        }

        td,th{
          border:1px solid #ccc;
          padding:7px;
          text-align:left
        }

        h1{
          color:#0b1f33
        }
      </style>
    </head>

    <body>
      ${body}

      <script>
        window.onload=()=>window.print()
      <\/script>

    </body>
    </html>
  `);

  w.document.close();
}

function exportPDF(){

  const t=totals();

  const body=`
    <h1>HISAB — ${mode()}</h1>

    <p>
      Generated ${fmtDate(today())}
    </p>

    <table>

      <tr>
        <th>Item</th>
        <th>Amount</th>
      </tr>

      <tr>
        <td>Income</td>
        <td>${money(t.income)}</td>
      </tr>

      <tr>
        <td>Expense</td>
        <td>${money(t.expense)}</td>
      </tr>

      <tr>
        <td>Balance</td>
        <td>${money(t.balance)}</td>
      </tr>

      <tr>
        <td>Money Given</td>
        <td>${money(t.given)}</td>
      </tr>

      <tr>
        <td>Money Received</td>
        <td>${money(t.received)}</td>
      </tr>

    </table>
  `;

  printHTML(
    'HISAB Report',
    body
  );
}

function exportPersonPDF(pid){

  const p=
    modePeople().find(
      x=>x.id===pid
    );

  if(!p)return;

  const b=
    personBalance(p);

  const rows=
    modeLending()
      .filter(
        x=>x.personId===pid
      )
      .map(x=>`
        <tr>
          <td>${fmtDate(x.date)}</td>
          <td>${x.type}</td>
          <td>${money(x.amount)}</td>
          <td>${money(x.paid||0)}</td>
          <td>${money(
            Math.max(
              0,
              x.amount-(x.paid||0)
            )
          )}</td>
          <td>${esc(x.note||'')}</td>
        </tr>
      `)
      .join('');

  printHTML(
    `HISAB - ${p.name}`,
    `
      <h1>HISAB Statement</h1>

      <h2>${esc(p.name)}</h2>

      <p>
        Given: ${money(b.given)}
        |
        Received: ${money(b.received)}
        |
        Net: ${money(b.net)}
      </p>

      <table>

        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Paid</th>
          <th>Due</th>
          <th>Note</th>
        </tr>

        ${rows}

      </table>
    `
  );
}

/* ================= DASHBOARD ================= */

function calcNetWorth(){

  const t=totals();

  return t.balance+
    t.received-
    t.given;
}

function renderDashboard(){

  const t=totals();

  const map={
    totalIncome:t.income,
    totalExpense:t.expense,
    ledgerGiven:t.given,
    ledgerReceived:t.received,
    ledgerNet:t.net,
    rIncome:t.income,
    rExpense:t.expense,
    rCount:modeTx().length,
    rSaving:Math.max(0,t.balance)
  };

  Object.entries(map)
    .forEach(([id,v])=>{

      const e=$(id);

      if(!e)return;

      e.textContent=
        id.startsWith('r') &&
        id!=='rCount'
          ?money(v)
          :id==='rCount'
            ?v
            :money(v);
    });

  const b=$('todaySummary');

  if(b){

    b.innerHTML=`
      <b>
        ${mode()} • ${data.currency}
      </b>

      <br>

      Balance:
      <b>${money(t.balance)}</b>

      <br>

      Net Khata:
      ${money(t.net)}
    `;
  }

  const m=$('businessList');

  if(
    m &&
    mode()==='Business'
  ){

    m.innerHTML=
      data.business
        .map(p=>`
          <div class="person">

            <b>${esc(p.name)}</b>

            <br>

            ${esc(p.phone||'')}

            <br>

            <button
              onclick="showPersonHistory('${p.id}')"
            >
              Open Khata
            </button>

          </div>
        `)
        .join('')
      ||
      '<div class="person">No customers/suppliers.</div>';
  }
}

/* ================= BILLS RENDER ================= */

function renderBills(){

  const box=$('remList');

  if(box){

    const bs=
      data.bills.filter(
        x=>
          (x.mode||'Personal')===mode()
      );

    box.innerHTML=
      bs
        .map(x=>`
          <div class="person">

            <b>${esc(x.name)}</b>
            —
            ${money(x.amount)}

            <br>

            ${esc(x.kind)}
            •
            Due ${fmtDate(x.due)}
            •
            ${dueState(
              x.due,
              x.paid
                ?0
                :x.amount
            )}

            <br>

            <button
              onclick="toggleBill('${x.id}')"
            >
              ${
                x.paid
                  ?'Mark Pending'
                  :'Mark Paid'
              }
            </button>

            <button
              onclick="deleteBill('${x.id}')"
            >
              Delete
            </button>

          </div>
        `)
        .join('')
      ||
      '';
  }

  const rs=$('remSummary');

  if(rs){

    const rr=
      data.reminders.filter(
        x=>
          (x.mode||'Personal')===mode()
      );

    rs.innerHTML=`
      <b>${rr.length}</b>
      reminders
      •
      ${rr.filter(x=>!x.done).length}
      active
    `;
  }
}

/* ================= FAMILY RENDER ================= */

function renderFamily(){

  const maps={
    insList:data.insurance,
    schoolList:data.school,
    vehicleList:data.vehicles,
    familyList:data.family,
    shoppingList:data.shopping,
    utilityList:data.utilities,
    docsList:data.docs,
    annualList:data.annualPlans,
    limitsList:data.limits
  };

  for(
    const [id,arr]
    of Object.entries(maps)
  ){

    const e=$(id);

    if(!e)continue;

    e.innerHTML=
      arr
        .map(x=>`
          <div class="person">

            ${esc(
              x.name||
              x.child||
              x.item||
              'Entry'
            )}

            ${
              x.amount
                ?`— ${money(x.amount)}`
                :''
            }

          </div>
        `)
        .join('')
      ||
      '';
  }
}

/* ================= THEME ================= */

function applyTheme(){
  document.body.dataset.theme=
    data.theme||'light';
}

function toggleTheme(){

  data.theme=
    data.theme==='dark'
      ?'light'
      :'dark';

  save();
  applyTheme();

  toast(
    data.theme+' mode'
  );
}

/* ================= RESET ================= */

function resetData(){

  if(
    !confirm(
      'HISAB ka sara local data delete karna hai?'
    )
  )return;

  data=clone(DEFAULT);

  save();
  renderAll();

  toast('All data cleared');
}

/* ================= COMPATIBILITY HANDLERS ================= */

function saveBudgetForm(){
  calcBudget();
}

function saveGoalForm(){
  calcGoal();
}

function addGoalSaving(){
  calcGoal();
}

function withdrawGoalSaving(){
  toast(
    'Goal withdrawal: add an expense transaction for accurate balance'
  );
}

function deleteGoal(id){

  data.goals=
    data.goals.filter(
      x=>x.id!==id
    );

  save();
  renderAll();
}

function deleteLoan(id){

  data.loans=
    data.loans.filter(
      x=>x.id!==id
    );

  save();
  renderAll();
}

function payEMI(id){

  toast(
    'EMI payment ko Expenses/transaction me record karein'
  );
}

function calculateEMIForm(){
  calcEMI();
}

function saveLoanForm(){

  const amount=
    Number(
      prompt('Loan amount:')||0
    );

  const rate=
    Number(
      prompt('Annual rate %:')||0
    );

  const tenure=
    Number(
      prompt('Tenure months:')||0
    );

  if(
    amount &&
    tenure
  ){

    data.loans.push({
      id:uid(),
      amount,
      rate,
      tenure,
      mode:mode()
    });

    save();
    renderAll();

    toast('Loan saved');
  }
}

function searchHisab(){
  searchAllData();
}

/* ================= RENDER ALL ================= */

function renderAll(){

  applyTheme();

  renderDashboard();
  renderPeople();
  renderTransactions();
  renderBills();
  renderFamily();
  renderComparison();
}

/* ================= START ================= */

function restore(){

  try{

    const s=
      localStorage.getItem(KEY);

    if(!s)save();

  }catch(e){}
}

/* ================= GLOBAL FUNCTIONS ================= */

Object.assign(window,{

  show,
  enterGuestMode,
  showGuestGate,

  setMode,
  toggleCurrency,
  toggleLanguage,

  setPin,
  lockApp,

  quickTransaction,
  quickLending,

  openLendingForm,
  saveLendingForm,

  addPerson,
  addKhataTransaction,
  showPersonHistory,
  sharePerson,

  filterLedger,
  searchLedger,

  markLendingPaid,
  deleteLending,
  editLending,

  addTransaction,
  deleteTransaction,
  editTransaction,
  setTxType,

  totalIncome,
  totalExpense,
  moneyTransactions,

  calcBudget,
  calcGoal,
  calcEMI,

  addBill,
  toggleBill,

  addReminder,
  markBillPaid,
  deleteBill,

  saveReminderForm,
  saveBusiness,

  addFamilyMember,
  addShopping,
  addUtility,

  calcFD,
  addInsurance,
  addSchool,
  addVehicle,

  addDoc,
  addAnnual,
  saveLimit,

  calcEmergency,
  renderComparison,
  searchAllData,

  summaryText,
  shareHisab,

  exportBackup,
  importBackup,
  exportSummary,
  exportCSV,

  exportPDF,
  exportPersonPDF,

  toggleTheme,
  resetData,

  saveBudgetForm,
  saveGoalForm,
  addGoalSaving,
  withdrawGoalSaving,

  deleteGoal,
  deleteLoan,
  payEMI,
  calculateEMIForm,
  saveLoanForm,

  searchHisab
});

document.addEventListener(
  'DOMContentLoaded',
  ()=>{
    restore();
    showGuestGate();

    if(
      data.locked &&
      data.pin
    ){
      showLockOverlay();
    }

    renderAll();
  }
);

})();
