/* HISAB V7 - APP.JS FINAL FIXED - VERIFIED */
(function(){
"use strict";
var KEY="hisab_v7_data";
var D={
  mode:"personal",currency:"₹",language:"hi",
  transactions:[],khata:[],business:[],sales:[],purchases:[],
  goals:[],bills:[],loans:[],reminders:[],family:[],tools:[],
  budget:{personal:0,business:0},pinHash:"",
  ui:{page:"home",khataEditId:null,businessFilter:"customer",khataFilter:"all",detailPerson:"",detailFilter:"all"}
};
function $(id){return document.getElementById(id);}
function num(v){var n=parseFloat(v);return isFinite(n)?n:0;}
function uid(p){return (p||"id")+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);}
function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function money(v){return D.currency+" "+num(v).toLocaleString("en-IN",{maximumFractionDigits:2});}
function safeDate(v){return v||today();}
function actionButton(a,i,t){return '<button class="btn" type="button" data-hisab-action="'+esc(a)+'" data-hisab-id="'+esc(i==null?"":i)+'">'+esc(t)+'</button>';}
function actionButton2(a,i,i2,t){return '<button class="btn" type="button" data-hisab-action="'+esc(a)+'" data-hisab-id="'+esc(i==null?"":i)+'" data-hisab-id2="'+esc(i2==null?"":i2)+'">'+esc(t)+'</button>';}
function normalize(){
["transactions","khata","business","sales","purchases","goals","bills","loans","reminders","family","tools"].forEach(function(k){if(!Array.isArray(D[k])) D[k]=[];});
if(!D.budget||typeof D.budget!=="object") D.budget={personal:0,business:0};
D.budget.personal=num(D.budget.personal); D.budget.business=num(D.budget.business);
if(!D.ui||typeof D.ui!=="object") D.ui={};
D.ui.page=D.ui.page||"home"; D.ui.khataEditId=D.ui.khataEditId||null; D.ui.businessFilter=D.ui.businessFilter||"customer"; D.ui.khataFilter=D.ui.khataFilter||"all"; D.ui.detailPerson=D.ui.detailPerson||""; D.ui.detailFilter=D.ui.detailFilter||"all";
if(D.mode!=="personal"&&D.mode!=="business") D.mode="personal";
D.khata.forEach(function(x){x.id=x.id||uid("khata");x.mode=x.mode==="business"?"business":"personal";x.person=x.person||"";x.amount=num(x.amount);x.paid=num(x.paid);x.type=x.type==="receive"?"receive":"give";x.status=x.status||"pending";x.method=x.method||"Cash";x.date=x.date||today();x.note=x.note||"";if(!Array.isArray(x.history)) x.history=[];});
D.transactions.forEach(function(x){x.id=x.id||uid("txn");x.mode=x.mode==="business"?"business":"personal";x.amount=num(x.amount);x.type=x.type==="income"?"income":"expense";x.date=x.date||today();x.category=x.category||"";x.note=x.note||"";});
D.business.forEach(function(x){x.id=x.id||uid("biz");x.mode="business";x.type=x.type==="supplier"?"supplier":"customer";x.name=x.name||"";x.phone=x.phone||"";x.date=x.date||today();});
[D.sales,D.purchases].forEach(function(arr){arr.forEach(function(x){x.id=x.id||uid("entry");x.mode="business";x.businessId=x.businessId||null;x.customer=x.customer||"";x.supplier=x.supplier||"";x.item=x.item||"";x.quantity=num(x.quantity)||1;x.rate=num(x.rate);x.amount=num(x.amount);x.paid=num(x.paid);x.status=x.status||"pending";x.date=x.date||today();x.method=x.method||"Cash";x.note=x.note||"";if(!Array.isArray(x.history)) x.history=[];});});
}
function load(){try{var raw=localStorage.getItem(KEY);if(raw){var s=JSON.parse(raw);if(s) Object.keys(s).forEach(function(k){D[k]=s[k];});}}catch(e){console.error("HISAB load error",e);} normalize();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(D));}catch(e){console.error("HISAB save error",e);}}
var PAGES=["home","personal","business","khataEntry","khataDetail","transactions","reports"];
function setMode(mode){
  D.mode=mode==="business"?"business":"personal";
  D.ui.page= D.mode==="business" ? "business" : "personal";
  save(); renderAll(); show(D.ui.page);
}
function show(page){
  if(PAGES.indexOf(page)===-1) page="home";
  PAGES.forEach(function(id){var el=$(id);if(el) el.classList.toggle("active",id===page);});
  document.querySelectorAll(".top-nav button").forEach(function(b){b.classList.toggle("active",b.id==="nav-"+page);});
  D.ui.page=page;
  if(page==="personal") D.mode="personal";
  if(page==="business") D.mode="business";
  save(); renderPage(page);
  try{window.scrollTo(0,0);}catch(e){}
}
function renderPage(p){
  if(p==="home") renderHome();
  if(p==="personal") renderKhata("personal");
  if(p==="business") renderBusiness();
  if(p==="khataDetail") renderKhataDetail();
  if(p==="transactions") renderTransactions();
  if(p==="reports") renderReports();
}
function khataTotals(mode){
  var g=0,r=0;
  D.khata.forEach(function(x){if((x.mode||"personal")!==mode) return; if(x.type==="give") g+=num(x.amount); else r+=num(x.amount);});
  return{give:g,receive:r,net:g-r};
}
function renderHome(){
  var inc=0,exp=0;
  D.transactions.forEach(function(x){if(x.mode!==D.mode) return; if(x.type==="income") inc+=num(x.amount); else exp+=num(x.amount);});
  var kh=khataTotals(D.mode); var bal=inc-exp+kh.receive-kh.give;
  if($("homeBalance")) $("homeBalance").textContent=money(bal);
  if($("receivable")) $("receivable").textContent=money(kh.receive);
  if($("payable")) $("payable").textContent=money(kh.give);
  var list=$("homeRecent"); if(!list) return;
  var recent=D.khata.concat(D.sales).concat(D.purchases).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).slice(0,8);
  list.innerHTML=recent.map(function(x){
    if(x.person) return '<div class="hisab-entry-card"><b>'+esc(x.person)+'</b> • '+esc(x.type)+" • "+money(x.amount)+'<div style="font-size:12px;opacity:.7">'+esc(x.date)+'</div></div>';
    return businessCard(x,x.customer?"sale":"purchase");
  }).join("") || '<div class="empty-state">Koi entry nahi hai</div>';
}
function ensureModalRoot(){
  var r=$("modalRoot"); if(!r){r=document.createElement("div");r.id="modalRoot";document.body.appendChild(r);} return r;
}
function closeModal(){var r=$("modalRoot"); if(r) r.innerHTML="";}
function getKhata(mode){return D.khata.filter(function(x){return (x.mode||"personal")===mode;});}
function renderKhata(mode){
  var list=$("personalList"); if(!list) return; if(mode!=="personal") return;
  var data=getKhata(mode); var filter=D.ui.khataFilter||"all";
  if(filter!=="all") data=data.filter(function(x){return x.type===filter || x.status===filter;});
  var search=$("personalSearch"); var q=search?search.value.trim().toLowerCase():"";
  if(q) data=data.filter(function(x){return [x.person,x.note,x.date,x.type,x.status].join(" ").toLowerCase().includes(q);});
  data.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  if(!data.length){list.innerHTML='<div class="empty-state">No Udhar entries yet.</div>'; return;}
  list.innerHTML=data.map(function(item){
    var col=item.type==="give"?"#d32f2f":"#168a45";
    return '<div class="hisab-entry-card"><strong>'+esc(item.person)+'</strong><div style="color:'+col+';font-weight:700">'+esc(item.type==="give"?"Give":"Receive")+" • "+money(item.amount)+'</div><div style="font-size:12px;opacity:.7">'+esc(item.date)+" • "+esc(item.method)+" • "+esc(item.status)+'</div>'+(item.note?'<div>'+esc(item.note)+'</div>':"")+'<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">'+actionButton2("khata-view",item.person,mode,"View")+actionButton("khata-edit",item.id,"Edit")+actionButton("khata-delete",item.id,"Delete")+'</div></div>';
  }).join("");
}
function searchKhata(mode){renderKhata(mode||D.mode);}
function filterKhata(mode,type){if(type===undefined){type=mode;mode=D.mode;} D.ui.khataFilter=type||"all"; save(); renderKhata(mode||D.mode);}
function openKhataForm(mode){
  D.mode=mode==="business"?"business":"personal"; D.ui.khataEditId=null;
  if($("khataPerson")) $("khataPerson").value=""; if($("khataAmount")) $("khataAmount").value=""; if($("khataNote")) $("khataNote").value=""; if($("khataType")) $("khataType").value="give"; if($("khataDate")) $("khataDate").value=today(); if($("khataMethod")) $("khataMethod").value="Cash"; if($("khataStatus")) $("khataStatus").value="pending";
  show("khataEntry");
}
function closeKhataForm(){show(D.mode==="business"?"business":"personal");}
function saveKhataEntry(){
  var person=$("khataPerson")?$("khataPerson").value.trim():""; var amount=$("khataAmount")?num($("khataAmount").value):0;
  if(!person||amount<=0){alert("Name aur valid amount enter karein");return;}
  var id=D.ui.khataEditId; var item=id?D.khata.find(function(x){return x.id===id;}):null;
  if(!item){item={id:uid("khata"),paid:0,history:[]}; D.khata.push(item);}
  item.mode=D.mode; item.person=person; item.type=$("khataType")?$("khataType").value:"give"; item.amount=amount; item.date=safeDate($("khataDate")?$("khataDate").value:today()); item.method=$("khataMethod")?$("khataMethod").value:"Cash"; item.status=$("khataStatus")?$("khataStatus").value:"pending"; item.note=$("khataNote")?$("khataNote").value.trim():"";
  D.ui.khataEditId=null; save(); show(D.mode==="business"?"business":"personal");
}
function editKhata(id){var item=D.khata.find(function(x){return x.id===id;}); if(!item) return; D.mode=item.mode==="business"?"business":"personal"; D.ui.khataEditId=id; if($("khataPerson")) $("khataPerson").value=item.person||""; if($("khataType")) $("khataType").value=item.type||"give"; if($("khataAmount")) $("khataAmount").value=item.amount||""; if($("khataDate")) $("khataDate").value=item.date||today(); if($("khataMethod")) $("khataMethod").value=item.method||"Cash"; if($("khataStatus")) $("khataStatus").value=item.status||"pending"; if($("khataNote")) $("khataNote").value=item.note||""; show("khataEntry");}
function deleteKhata(id){if(!confirm("Delete?")) return; D.khata=D.khata.filter(function(x){return x.id!==id;}); save(); renderAll();}
function openKhataDetail(person,mode){D.mode=mode==="business"?"business":"personal"; D.ui.detailPerson=person||""; D.ui.detailFilter="all"; show("khataDetail");}
function closeKhataDetail(){show(D.mode==="business"?"business":"personal");}
function renderKhataDetail(){
  var list=$("khataHistory"); if(!list) return; var person=D.ui.detailPerson||""; var filter=D.ui.detailFilter||"all";
  var data=getKhata(D.mode).filter(function(x){if(String(x.person||"").toLowerCase()!==String(person).toLowerCase()) return false; if(filter!=="all"&&x.type!==filter&&x.status!==filter) return false; return true;});
  var g=0,r=0; data.forEach(function(x){if(x.type==="give") g+=num(x.amount); else r+=num(x.amount);});
  if($("detailPersonName")) $("detailPersonName").textContent=person||"Khata"; if($("detailGive")) $("detailGive").textContent=money(g); if($("detailReceive")) $("detailReceive").textContent=money(r); if($("detailBalance")) $("detailBalance").textContent=money(g-r);
  if(!data.length){list.innerHTML='<div class="empty-state">No entries</div>';return;}
  data.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  list.innerHTML=data.map(function(item){
    var col=item.type==="give"?"#d32f2f":"#168a45";
    return '<div class="hisab-entry-card"><strong style="color:'+col+'">'+esc(item.type==="give"?"Give":"Receive")+" • "+money(item.amount)+'</strong><div style="font-size:12px;opacity:.7">'+esc(item.date)+" • "+esc(item.method)+" • "+esc(item.status)+'</div>'+(item.note?'<div>'+esc(item.note)+'</div>':"")+'<div style="margin-top:6px;display:flex;gap:6px">'+actionButton("khata-edit",item.id,"Edit")+actionButton("khata-delete",item.id,"Delete")+actionButton("khata-payment",item.id,"Payment")+'</div></div>';
  }).join("");
}
function openPaymentEntry(id){
  var item=D.khata.find(function(x){return x.id===id;}); if(!item) return; var rem=Math.max(0,num(item.amount)-num(item.paid));
  var root=ensureModalRoot();
  root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-box"><h3>Payment - Due '+money(rem)+'</h3><input id="khPayAmt" type="number" value="'+rem+'"><select id="khPayMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Debit Card</option><option>Credit Card</option><option>Wallet</option><option>Cheque</option><option>Other</option></select><div class="m-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="confirmKhataPay(\''+item.id+'\')">Pay</button></div></div></div>';
}
function confirmKhataPay(id){
  var item=D.khata.find(function(x){return x.id===id;}); if(!item) return; var amt=num($("khPayAmt")?$("khPayAmt").value:0); if(!(amt>0)) return; var rem=Math.max(0,num(item.amount)-num(item.paid)); amt=Math.min(amt,rem); var method=$("khPayMethod")?$("khPayMethod").value:"Cash";
  item.paid+=amt; item.history=item.history||[]; item.history.push({id:uid("pay"),date:today(),amount:amt,method:method});
  if(item.paid>=num(item.amount)){item.paid=num(item.amount); item.status="settled";}else{item.status="partial";}
  closeModal(); save(); renderAll(); renderKhataDetail();
}
function businessFilter(f){
  if(typeof f==="object"&&f.target) f=f.target.value;
  if(["customer","supplier","sales","purchase"].indexOf(f)===-1) f="customer";
  D.ui.businessFilter=f; save(); renderBusiness();
}
function findMasterByName(type,name){
  var n=String(name||"").trim().toLowerCase();
  return D.business.find(function(x){return x.type===type && String(x.name||"").trim().toLowerCase()===n;})||null;
}
function masterNameExists(type,name,ignoreId){
  var n=String(name||"").trim().toLowerCase();
  return D.business.some(function(x){return x.type===type && x.id!==ignoreId && String(x.name||"").trim().toLowerCase()===n;});
}
function openMasterModal(type){
  var root=ensureModalRoot();
  root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-box"><h3>'+(type==="customer"?"New Customer":"New Supplier")+'</h3><input id="mName" placeholder="Name*"><input id="mPhone" placeholder="Phone (optional)"><div class="m-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveMaster(\''+type+'\')">Save</button></div></div></div>';
}
function saveMaster(type){
  var name=$("mName")?$("mName").value.trim():""; var phone=$("mPhone")?$("mPhone").value.trim():"";
  if(!name){alert("Name zaruri hai");return;}
  if(masterNameExists(type,name,null)){alert(type==="customer"?"Customer already exists":"Supplier already exists");return;}
  D.business.push({id:uid("biz"),mode:"business",type:type,name:name,phone:phone,date:today()});
  closeModal(); save(); renderBusiness();
}
function addBusinessMaster(type){openMasterModal(type);}
function addBusinessCustomer(){addBusinessMaster("customer");}
function addBusinessSupplier(){addBusinessMaster("supplier");}
function openEntryModal(type){
  var isSale=type==="sale"; var masters=D.business.filter(function(x){return x.type===(isSale?"customer":"supplier");});
  var opts=masters.map(function(x){return '<option value="'+esc(x.name)+'"></option>';}).join("");
  var root=ensureModalRoot();
  root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-box"><h3>'+(isSale?"New Sale":"New Purchase")+'</h3><input list="bMasterList" id="eName" placeholder="'+(isSale?"Customer Name*":"Supplier Name*")+'"><datalist id="bMasterList">'+opts+'</datalist><input id="eItem" placeholder="Item / Product"><div style="display:flex;gap:8px"><input id="eQty" type="number" value="1"><input id="eRate" type="number" placeholder="Rate*"></div><input id="eDate" type="date" value="'+today()+'"><select id="eMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Debit Card</option><option>Credit Card</option><option>Wallet</option><option>Cheque</option><option>Other</option></select><input id="eNote" placeholder="Note (optional)"><div class="m-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEntry(\''+type+'\')">Save</button></div></div></div>';
}
function saveEntry(type){
  var isSale=type==="sale"; var name=$("eName")?$("eName").value.trim():""; var itemName=$("eItem")?$("eItem").value.trim():""; var qty=$("eQty")?num($("eQty").value):1; var rate=$("eRate")?num($("eRate").value):0; var date=$("eDate")?safeDate($("eDate").value):today(); var method=$("eMethod")?$("eMethod").value:"Cash"; var note=$("eNote")?$("eNote").value.trim():"";
  if(!name){alert("Name zaruri hai");return;} if(qty<=0){alert("Valid qty");return;} if(rate<=0){alert("Valid rate");return;}
  var master=findMasterByName(isSale?"customer":"supplier",name);
  if(!master){master={id:uid("biz"),mode:"business",type:isSale?"customer":"supplier",name:name,phone:"",date:today()}; D.business.push(master);}
  var total=qty*rate;
  var obj={id:uid(type),mode:"business",businessId:master.id,customer:isSale?name:"",supplier:isSale?"":name,amount:total,paid:0,status:"pending",date:date,method:method,note:note,item:itemName,quantity:qty,rate:rate,history:[]};
  if(isSale) D.sales.push(obj); else D.purchases.push(obj);
  closeModal(); save(); renderBusiness(); renderHome(); renderReports();
}
function addBusinessSales(){openEntryModal("sale");}
function addBusinessPurchase(){openEntryModal("purchase");}
function getBusinessSales(){return D.sales.filter(function(x){return x.mode==="business";});}
function getBusinessPurchases(){return D.purchases.filter(function(x){return x.mode==="business";});}
function findBusiness(type,id){return (type==="sale"?D.sales:D.purchases).find(function(x){return x.id===id;})||null;}
function salesForCustomer(m){return getBusinessSales().filter(function(x){return x.businessId===m.id || String(x.customer||"").toLowerCase()===String(m.name||"").toLowerCase();});}
function purchasesForSupplier(m){return getBusinessPurchases().filter(function(x){return x.businessId===m.id || String(x.supplier||"").toLowerCase()===String(m.name||"").toLowerCase();});}
function businessCard(item,type){
  var name=type==="sale"?item.customer:item.supplier; var rem=Math.max(0,num(item.amount)-num(item.paid));
  return '<div class="hisab-entry-card"><strong>'+esc(name||"")+'</strong><div style="font-weight:700">'+esc(type==="sale"?"SALE":"PURCHASE")+" • "+money(item.amount)+'</div>'+(item.item?'<div style="font-size:12px;opacity:.7">Item: '+esc(item.item)+' • Qty:'+esc(item.quantity||1)+' × '+money(item.rate||0)+'</div>':"")+'<div style="font-size:12px;opacity:.7">'+esc(item.date)+" • "+esc(item.status||"pending")+'</div><div>Paid: '+money(item.paid)+' • Due: <b style="color:#d32f2f">'+money(rem)+'</b></div><div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">'+actionButton2("business-payment",type,item.id,type==="sale"?"Receive":"Pay")+actionButton2("business-edit",type,item.id,"Edit")+actionButton2("business-delete",type,item.id,"Delete")+actionButton2("business-history",type,item.id,"History")+'</div></div>';
}
function customerCard(master){
  var entries=salesForCustomer(master); var total=0,paid=0; entries.forEach(function(x){total+=num(x.amount);paid+=num(x.paid);});
  return '<div class="hisab-entry-card"><strong>'+esc(master.name)+'</strong><div style="font-size:12px;opacity:.7">'+esc(master.phone||"")+'</div><div style="margin-top:5px">Sales: <b>'+money(total)+'</b> • Due: <b style="color:#d32f2f">'+money(Math.max(0,total-paid))+'</b></div><div style="font-size:12px;opacity:.7">'+entries.length+' sale(s)</div>'+actionButton("business-master-delete",master.id,"Delete")+(entries.length?'<div style="margin-top:10px">'+entries.map(function(x){return businessCard(x,"sale");}).join("")+'</div>':"")+'</div>';
}
function supplierCard(master){
  var entries=purchasesForSupplier(master); var total=0,paid=0; entries.forEach(function(x){total+=num(x.amount);paid+=num(x.paid);});
  return '<div class="hisab-entry-card"><strong>'+esc(master.name)+'</strong><div style="font-size:12px;opacity:.7">'+esc(master.phone||"")+'</div><div style="margin-top:5px">Purchases: <b>'+money(total)+'</b> • Due: <b style="color:#d32f2f">'+money(Math.max(0,total-paid))+'</b></div><div style="font-size:12px;opacity:.7">'+entries.length+' purchase(s)</div>'+actionButton("business-master-delete",master.id,"Delete")+(entries.length?'<div style="margin-top:10px">'+entries.map(function(x){return businessCard(x,"purchase");}).join("")+'</div>':"")+'</div>';
}
function renderBusiness(){
  var list=$("businessList"); if(!list) return; var filter=D.ui.businessFilter||"customer";
  document.querySelectorAll(".filter-btn").forEach(function(btn){if(btn.dataset.f) btn.classList.toggle("active",btn.dataset.f===filter);});
  var html="";
  if(filter==="customer"){
    var customers=D.business.filter(function(x){return x.type==="customer";});
    customers.forEach(function(x){html+=customerCard(x);});
    var linked={}; customers.forEach(function(c){salesForCustomer(c).forEach(function(s){linked[s.id]=true;});});
    var other=getBusinessSales().filter(function(x){return !linked[x.id];});
    if(other.length) html+='<div class="hisab-entry-card"><strong>Other Sales</strong>'+other.map(function(x){return businessCard(x,"sale");}).join("")+'</div>';
  }else if(filter==="supplier"){
    var suppliers=D.business.filter(function(x){return x.type==="supplier";});
    suppliers.forEach(function(x){html+=supplierCard(x);});
    var linkedP={}; suppliers.forEach(function(s){purchasesForSupplier(s).forEach(function(p){linkedP[p.id]=true;});});
    var otherP=getBusinessPurchases().filter(function(x){return !linkedP[x.id];});
    if(otherP.length) html+='<div class="hisab-entry-card"><strong>Other Purchases</strong>'+otherP.map(function(x){return businessCard(x,"purchase");}).join("")+'</div>';
  }else if(filter==="sales"){
    getBusinessSales().slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).forEach(function(x){html+=businessCard(x,"sale");});
  }else if(filter==="purchase"){
    getBusinessPurchases().slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).forEach(function(x){html+=businessCard(x,"purchase");});
  }
  list.innerHTML=html||'<div class="empty-state">No entries</div>';
}
function payBusinessEntry(type,id){
  var item=findBusiness(type,id); if(!item) return; var rem=Math.max(0,num(item.amount)-num(item.paid));
  if(rem<=0){item.status="paid";save();renderBusiness();return;}
  var root=ensureModalRoot();
  root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-box"><h3>'+(type==="sale"?"Receive Payment":"Pay Supplier")+'</h3><div>Due: <b>'+money(rem)+'</b></div><input id="pAmount" type="number" value="'+rem+'"><select id="pMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Debit Card</option><option>Credit Card</option><option>Wallet</option><option>Cheque</option><option>Other</option></select><div class="m-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="confirmPayBusiness(\''+type+'\',\''+id+'\')">Save</button></div></div></div>';
}
function confirmPayBusiness(type,id){
  var item=findBusiness(type,id); if(!item) return; var rem=Math.max(0,num(item.amount)-num(item.paid)); var amt=num($("pAmount")?$("pAmount").value:0); if(amt<=0){alert("Valid amount likho");return;} amt=Math.min(amt,rem); var method=$("pMethod")?$("pMethod").value:"Cash";
  item.paid=num(item.paid)+amt; item.history=item.history||[]; item.history.push({id:uid("payment"),date:today(),amount:amt,method:method});
  if(item.paid>=num(item.amount)){item.paid=num(item.amount);item.status="paid";}else{item.status="partial";}
  closeModal(); save(); renderBusiness(); renderHome(); renderReports();
}
function editBusinessEntry(type,id){
  var item=findBusiness(type,id); if(!item) return;
  var root=ensureModalRoot();
  root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-box"><h3>Edit '+(type==="sale"?"Sale":"Purchase")+'</h3><input id="beName" value="'+esc(type==="sale"?item.customer:item.supplier)+'"><input id="beItem" value="'+esc(item.item||"")+'"><div style="display:flex;gap:8px"><input id="beQty" type="number" value="'+num(item.quantity||1)+'"><input id="beRate" type="number" value="'+num(item.rate||0)+'"></div><input id="beDate" type="date" value="'+esc(item.date||today())+'"><select id="beMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Debit Card</option><option>Credit Card</option><option>Wallet</option><option>Cheque</option><option>Other</option></select><input id="beNote" value="'+esc(item.note||"")+'"><div class="m-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="confirmEditBusiness(\''+type+'\',\''+id+'\')">Update</button></div></div></div>';
  if($("beMethod")) $("beMethod").value=item.method||"Cash";
}
function confirmEditBusiness(type,id){
  var item=findBusiness(type,id); if(!item) return; var isSale=type==="sale"; var name=$("beName")?$("beName").value.trim():""; var itemName=$("beItem")?$("beItem").value.trim():""; var qty=$("beQty")?num($("beQty").value):1; var rate=$("beRate")?num($("beRate").value):0;
  if(!name||qty<=0||rate<=0){alert("Name, qty, rate sahi likho");return;}
  var master=findMasterByName(isSale?"customer":"supplier",name);
  if(!master){master={id:uid("biz"),mode:"business",type:isSale?"customer":"supplier",name:name,phone:"",date:today()}; D.business.push(master);}
  item.businessId=master.id; if(isSale){item.customer=name;item.supplier="";}else{item.supplier=name;item.customer="";}
  item.item=itemName; item.quantity=qty; item.rate=rate; item.amount=qty*rate; item.date=$("beDate")?safeDate($("beDate").value):today(); item.method=$("beMethod")?$("beMethod").value:"Cash"; item.note=$("beNote")?$("beNote").value.trim():"";
  item.paid=Math.min(num(item.paid),item.amount); if(item.paid>=item.amount) item.status="paid"; else if(item.paid>0) item.status="partial"; else item.status="pending";
  closeModal(); save(); renderBusiness(); renderHome(); renderReports();
}
function deleteBusinessEntry(type,id){if(!confirm("Delete this entry?")) return; if(type==="sale") D.sales=D.sales.filter(function(x){return x.id!==id;}); else D.purchases=D.purchases.filter(function(x){return x.id!==id;}); save(); renderBusiness(); renderHome(); renderReports();}
function deleteBusinessMaster(id){
  var master=D.business.find(function(x){return x.id===id;}); if(!master) return; if(!confirm("Delete "+master.type+"?")) return;
  if(master.type==="customer") D.sales.forEach(function(x){if(x.businessId===id||String(x.customer).toLowerCase()===String(master.name).toLowerCase()) x.businessId=null;});
  else D.purchases.forEach(function(x){if(x.businessId===id||String(x.supplier).toLowerCase()===String(master.name).toLowerCase()) x.businessId=null;});
  D.business=D.business.filter(function(x){return x.id!==id;}); save(); renderBusiness();
}
function businessHistory(type,id){
  var item=findBusiness(type,id); if(!item) return; var h=Array.isArray(item.history)?item.history:[]; var html=h.length?h.map(function(x){return '<div style="padding:8px 0;border-bottom:1px solid #eee">'+esc(x.date||"")+" • "+money(x.amount)+" • "+esc(x.method||"Cash")+'</div>';}).join(""):"<div>No payment history</div>";
  var due=Math.max(0,num(item.amount)-num(item.paid)); var root=ensureModalRoot();
  root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-box"><h3>History - '+esc(type==="sale"?item.customer:item.supplier)+'</h3><div style="max-height:300px;overflow:auto">'+html+'</div><div style="margin-top:12px">Total: '+money(item.amount)+'<br>Paid: '+money(item.paid)+'<br>Due: '+money(due)+'</div><button class="btn-save" style="width:100%;margin-top:12px" onclick="closeModal()">Close</button></div></div>';
}
function addTransaction(type){
  var tType=type||($("transactionType")?$("transactionType").value:"expense"); var amount=$("transactionAmount")?num($("transactionAmount").value):0; var cat=$("transactionCategory")?$("transactionCategory").value.trim():""; var note=$("transactionNote")?$("transactionNote").value.trim():""; var date=$("transactionDate")?safeDate($("transactionDate").value):today();
  if(amount<=0){alert("Amount enter karein");return;}
  D.transactions.push({id:uid("txn"),mode:D.mode,type:tType,amount:amount,category:cat,note:note,date:date});
  if($("transactionAmount")) $("transactionAmount").value=""; if($("transactionCategory")) $("transactionCategory").value=""; if($("transactionNote")) $("transactionNote").value="";
  save(); renderAll(); show("transactions");
}
function deleteTransaction(id){if(!confirm("Delete?")) return; D.transactions=D.transactions.filter(function(x){return x.id!==id;}); save(); renderAll();}
function renderTransactions(){
  var list=$("transactionList"); if(!list) return; var data=D.transactions.filter(function(x){return x.mode===D.mode;}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  if(!data.length){list.innerHTML='<div class="empty-state">No transactions</div>';return;}
  list.innerHTML=data.map(function(x){var col=x.type==="income"?"#168a45":"#d32f2f"; return '<div class="hisab-entry-card"><strong style="color:'+col+'">'+esc(x.type)+" • "+money(x.amount)+'</strong><div style="font-size:12px;opacity:.7">'+esc(x.date)+" • "+esc(x.category||"")+'</div>'+(x.note?'<div>'+esc(x.note)+'</div>':"")+'<div style="margin-top:6px">'+actionButton("transaction-delete",x.id,"Delete")+'</div></div>';}).join("");
}
function renderReports(){
  var inc=0,exp=0; D.transactions.forEach(function(x){if(x.mode!==D.mode) return; if(x.type==="income") inc+=num(x.amount); else exp+=num(x.amount);});
  var kh=khataTotals(D.mode); var sales=getBusinessSales().reduce(function(s,x){return s+num(x.amount);},0); var pur=getBusinessPurchases().reduce(function(s,x){return s+num(x.amount);},0);
  var box=$("reportContent"); if(!box) return;
  box.innerHTML='<div class="hisab-entry-card"><strong>Personal Summary</strong><div>Income: '+money(inc)+'</div><div>Expense: '+money(exp)+'</div><div>Net: '+money(inc-exp)+'</div></div><div class="hisab-entry-card"><strong>Udhaar Summary</strong><div>Give: '+money(kh.give)+'</div><div>Receive: '+money(kh.receive)+'</div><div>Net: '+money(kh.give-kh.receive)+'</div></div><div class="hisab-entry-card"><strong>Business Summary</strong><div>Sales: '+money(sales)+'</div><div>Purchase: '+money(pur)+'</div><div>Profit: '+money(sales-pur)+'</div></div>';
}
function handleAction(btn){
  var a=btn.getAttribute("data-hisab-action"); var id=btn.getAttribute("data-hisab-id"); var id2=btn.getAttribute("data-hisab-id2");
  switch(a){
    case "khata-view": openKhataDetail(id,id2); break;
    case "khata-edit": editKhata(id); break;
    case "khata-delete": deleteKhata(id); break;
    case "khata-payment": openPaymentEntry(id); break;
    case "business-payment": payBusinessEntry(id,id2); break;
    case "business-edit": editBusinessEntry(id,id2); break;
    case "business-delete": deleteBusinessEntry(id,id2); break;
    case "business-history": businessHistory(id,id2); break;
    case "business-master-delete": deleteBusinessMaster(id); break;
    case "transaction-delete": deleteTransaction(id); break;
  }
}
document.addEventListener("click",function(e){var b=e.target.closest("[data-hisab-action]"); if(!b) return; e.preventDefault(); try{handleAction(b);}catch(err){console.error(err);}},false);
function renderAll(){renderHome(); renderKhata("personal"); renderBusiness(); renderTransactions(); renderReports();}
function init(){
  load();
  if($("khataDate")) $("khataDate").value=today();
  if($("transactionDate")) $("transactionDate").value=today();
  if(!$("modalRoot")){var mr=document.createElement("div"); mr.id="modalRoot"; document.body.appendChild(mr);}
  renderAll(); show(D.ui.page||"home");
}
window.show=show; window.setMode=setMode;
window.openKhataForm=openKhataForm; window.closeKhataForm=closeKhataForm; window.saveKhataEntry=saveKhataEntry;
window.searchKhata=searchKhata; window.filterKhata=filterKhata;
window.openKhataDetail=openKhataDetail; window.closeKhataDetail=closeKhataDetail;
window.openPaymentEntry=openPaymentEntry; window.confirmKhataPay=confirmKhataPay; window.closeModal=closeModal;
window.businessFilter=businessFilter; window.addBusinessCustomer=addBusinessCustomer; window.addBusinessSupplier=addBusinessSupplier;
window.addBusinessSales=addBusinessSales; window.addBusinessPurchase=addBusinessPurchase;
window.saveMaster=saveMaster; window.saveEntry=saveEntry; window.openEntryModal=openEntryModal;
window.confirmPayBusiness=confirmPayBusiness; window.confirmEditBusiness=confirmEditBusiness;
window.addTransaction=addTransaction;
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init);}else{init();}
})();
