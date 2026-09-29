/* =========================================================
   HISAB V7 — STABLE FINAL REPAIR — MATCHED TO YOUR HTML
   ========================================================= */
(function () {
  "use strict";
  var KEY = "hisab_v7_data";
  var SESSION_KEY = "hisab_v7_guest";

  var D = {
    mode: "personal", currency: "₹", language: "hi",
    transactions: [], khata: [], business: [], sales: [], purchases: [],
    goals: [], bills: [], loans: [], reminders: [], family: [], tools: [],
    budget: { personal: 0, business: 0 },
    pinHash: "",
    ui: { page: "home", khataEditId: null, businessFilter: "customer", khataFilter: "all", detailPerson: "", detailFilter: "all" }
  };

  function $(id){ return document.getElementById(id); }
  function num(v){ var n=parseFloat(v); return isFinite(n)?n:0; }
  function uid(p){ return (p||"id")+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,6); }
  function today(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function esc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
  function money(v){ return D.currency+" "+num(v).toLocaleString("en-IN",{maximumFractionDigits:2}); }
  function safeDate(v){ return v||today(); }
  function actionButton(a,i,t){ return '<button type="button" data-hisab-action="'+esc(a)+'" data-hisab-id="'+esc(i==null?"":i)+'">'+esc(t)+'</button>'; }
  function actionButton2(a,i,i2,t){ return '<button type="button" data-hisab-action="'+esc(a)+'" data-hisab-id="'+esc(i==null?"":i)+'" data-hisab-id2="'+esc(i2==null?"":i2)+'">'+esc(t)+'</button>'; }

  function normalize(){
    ["transactions","khata","business","sales","purchases","goals","bills","loans","reminders","family","tools"].forEach(k=>{ if(!Array.isArray(D[k])) D[k]=[]; });
    if(!D.budget||typeof D.budget!=="object") D.budget={personal:0,business:0};
    D.budget.personal=num(D.budget.personal); D.budget.business=num(D.budget.business);
    D.ui=D.ui||{}; D.ui.page=D.ui.page||"home"; D.ui.khataEditId=D.ui.khataEditId||null;
    D.ui.businessFilter=D.ui.businessFilter||"customer"; D.ui.khataFilter=D.ui.khataFilter||"all";
    D.ui.detailPerson=D.ui.detailPerson||""; D.ui.detailFilter=D.ui.detailFilter||"all";
    if(D.mode!=="personal"&&D.mode!=="business") D.mode="personal";
    D.khata.forEach(x=>{ x.mode=x.mode==="business"?"business":"personal"; x.amount=num(x.amount); x.paid=num(x.paid); x.type=x.type==="receive"?"receive":"give"; x.status=x.status||"pending"; x.method=x.method||"Cash"; x.date=x.date||today(); if(!Array.isArray(x.history)) x.history=[]; });
    D.transactions.forEach(x=>{ x.amount=num(x.amount); x.mode=x.mode==="business"?"business":"personal"; x.date=x.date||today(); });
    [D.sales,D.purchases,D.bills,D.loans].forEach(arr=>arr.forEach(x=>{ x.paid=num(x.paid); if(!Array.isArray(x.history)) x.history=[]; x.status=x.status||"pending"; }));
  }
  function load(){ try{ var raw=localStorage.getItem(KEY); if(raw){ var s=JSON.parse(raw); if(s) Object.keys(s).forEach(k=>D[k]=s[k]); } }catch(e){} normalize(); }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(D)); }catch(e){} }

  function toggleLanguage(){ D.language=D.language==="hi"?"en":"hi"; save(); applyLanguage(); }
  function toggleCurrency(){ var c=["₹","$","€","£"]; D.currency=c[(c.indexOf(D.currency)+1)%c.length]; save(); renderAll(); }
  function applyLanguage(){ try{ document.documentElement.lang=D.language==="hi"?"hi":"en"; }catch(e){} }

  var PAGES=["home","personal","business","khataEntry","khataDetail","transactions","planning","credit","reports","reminders","privacy","family","ads","familytools","tools13","final"];
  function show(page){
    if(PAGES.indexOf(page)===-1) page="home";
    PAGES.forEach(id=>{ var el=$(id); if(el) el.classList.toggle("active",id===page); });
    D.ui.page=page; save(); renderPage(page);
    try{ window.scrollTo(0,0);}catch(e){}
  }
  function renderPage(p){
    if(p==="home") renderHome();
    if(p==="personal") renderKhata("personal");
    if(p==="business") renderBusiness();
    if(p==="khataDetail") renderKhataDetail();
    if(p==="transactions") renderTransactions();
    if(p==="planning") renderPlanning();
    if(p==="credit") renderCredit();
    if(p==="reports") renderReports();
    if(p==="reminders") renderReminders();
    if(p==="family") renderFamily();
  }
  function setMode(m){ D.mode=m==="business"?"business":"personal"; save(); renderAll(); show("home"); }

  function getKhata(mode){ return D.khata.filter(i=>(i.mode||"personal")===mode); }
  function khataTotals(mode){ var g=0,r=0; getKhata(mode).forEach(i=>{ if(i.type==="give") g+=num(i.amount); else r+=num(i.amount); }); return {give:g,receive:r,net:g-r}; }

  function renderHome(){
    var inc=0,exp=0; D.transactions.forEach(i=>{ if(i.mode!==D.mode) return; if(i.type==="income") inc+=num(i.amount); else exp+=num(i.amount); });
    var kh=khataTotals(D.mode); var bal=inc-exp+kh.receive-kh.give;
    if($("homeBalance")) $("homeBalance").textContent=money(bal);
    if($("receivable")) $("receivable").textContent=money(kh.receive);
    if($("payable")) $("payable").textContent=money(kh.give);
    if($("modeLabel")) $("modeLabel").textContent=D.mode==="business"?"Business":"Personal";
    if($("personalModeBtn")) $("personalModeBtn").classList.toggle("active",D.mode==="personal");
    if($("businessModeBtn")) $("businessModeBtn").classList.toggle("active",D.mode==="business");
  }

  function renderKhata(mode){
    var list=$(mode==="business"?"businessList":"personalList"); if(!list) return;
    var data=getKhata(mode); var filter=D.ui.khataFilter||"all";
    if(filter!=="all") data=data.filter(i=>i.type===filter||i.status===filter);
    var search=$(mode==="business"?"businessSearch":"personalSearch"); var q=search?search.value.trim().toLowerCase():"";
    if(q) data=data.filter(i=>[i.person,i.note,i.date,i.type,i.status].join(" ").toLowerCase().includes(q));
    data.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    var t=khataTotals(mode);
    var gEl=$(mode==="business"?"businessGiven":"ledgerGiven"), rEl=$(mode==="business"?"businessReceived":"ledgerReceived"), nEl=$(mode==="business"?"businessNet":"ledgerNet");
    if(gEl) gEl.textContent=money(t.give); if(rEl) rEl.textContent=money(t.receive); if(nEl) nEl.textContent=money(t.net);
    if(!data.length){ list.innerHTML='<div class="empty-state">No Udhar entries yet.</div>'; return; }
    list.innerHTML=data.map(item=>{
      return '<div class="hisab-entry-card"><strong>'+esc(item.person)+'</strong><div style="color:'+(item.type==="give"?"#d32f2f":"#168a45")+';font-weight:700">'+esc(item.type)+" • "+money(item.amount)+'</div><div style="font-size:12px;opacity:.7">'+esc(item.date)+" • "+esc(item.method)+' • '+esc(item.status)+'</div>'+(item.note?'<div>'+esc(item.note)+'</div>':"")+'<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">'+actionButton2("khata-view",item.person,mode,"View")+actionButton("khata-edit",item.id,"Edit")+actionButton("khata-delete",item.id,"Delete")+'</div></div>';
    }).join("");
  }
  function searchKhata(mode){ renderKhata(mode||D.mode); }
  function filterKhata(mode,type){ if(type===undefined){ type=mode; mode=D.mode; } if(typeof type==="object") type="all"; D.ui.khataFilter=type||"all"; save(); renderKhata(mode||D.mode); }
  function openKhataForm(mode){ D.mode=mode==="business"?"business":"personal"; D.ui.khataEditId=null; if($("khataPerson")) $("khataPerson").value=""; if($("khataAmount")) $("khataAmount").value=""; if($("khataNote")) $("khataNote").value=""; if($("khataType")) $("khataType").value="give"; if($("khataDate")) $("khataDate").value=today(); if($("khataMethod")) $("khataMethod").value="Cash"; if($("khataStatus")) $("khataStatus").value="pending"; show("khataEntry"); }
  function closeKhataForm(){ show(D.mode==="business"?"business":"personal"); }
  function saveKhataEntry(){
    var person=$("khataPerson")?$("khataPerson").value.trim():""; var amount=$("khataAmount")?num($("khataAmount").value):0;
    if(!person||amount<=0){ alert("Name aur valid amount enter karein"); return; }
    var id=D.ui.khataEditId; var item=id?D.khata.find(x=>x.id===id):null;
    if(!item){ item={id:uid("khata"),paid:0,history:[]}; D.khata.push(item); }
    item.mode=D.mode; item.person=person; item.type=$("khataType")?$("khataType").value:"give"; item.amount=amount;
    item.date=safeDate($("khataDate")?$("khataDate").value:today()); item.method=$("khataMethod")?$("khataMethod").value:"Cash"; item.status=$("khataStatus")?$("khataStatus").value:"pending"; item.note=$("khataNote")?$("khataNote").value.trim():"";
    D.ui.khataEditId=null; save(); show(D.mode==="business"?"business":"personal");
  }
  function editKhata(id){ var item=D.khata.find(x=>x.id===id); if(!item) return; D.mode=item.mode==="business"?"business":"personal"; D.ui.khataEditId=id; if($("khataPerson")) $("khataPerson").value=item.person||""; if($("khataType")) $("khataType").value=item.type||"give"; if($("khataAmount")) $("khataAmount").value=item.amount||""; if($("khataDate")) $("khataDate").value=item.date||today(); if($("khataMethod")) $("khataMethod").value=item.method||"Cash"; if($("khataStatus")) $("khataStatus").value=item.status||"pending"; if($("khataNote")) $("khataNote").value=item.note||""; show("khataEntry"); }
  function deleteKhata(id){ if(!confirm("Delete?")) return; D.khata=D.khata.filter(x=>x.id!==id); save(); renderAll(); }
  function openKhataDetail(person,mode){ D.mode=mode==="business"?"business":"personal"; D.ui.detailPerson=person||""; D.ui.detailFilter="all"; show("khataDetail"); }
  function closeKhataDetail(){ show(D.mode==="business"?"business":"personal"); }
  function detailFilter(type){ if(typeof type==="object") type="all"; D.ui.detailFilter=type||"all"; renderKhataDetail(); }
  function renderKhataDetail(){
    var list=$("khataHistory")||$("khataDetailList"); if(!list) return; var person=D.ui.detailPerson||""; var filter=D.ui.detailFilter||"all";
    var data=getKhata(D.mode).filter(i=>{ if(String(i.person||"").toLowerCase()!==String(person).toLowerCase()) return false; if(filter!=="all"&&i.type!==filter&&i.status!==filter) return false; return true; });
    var g=0,r=0; data.forEach(i=>{ if(i.type==="give") g+=num(i.amount); else r+=num(i.amount); });
    if($("detailPersonName")) $("detailPersonName").textContent=person||"Khata"; if($("detailGive")) $("detailGive").textContent=money(g); if($("detailReceive")) $("detailReceive").textContent=money(r); if($("detailBalance")) $("detailBalance").textContent=money(g-r);
    if(!data.length){ list.innerHTML='<div class="empty-state">No entries</div>'; return; }
    data.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    list.innerHTML=data.map(item=>'<div class="hisab-entry-card"><strong style="color:'+(item.type==="give"?"#d32f2f":"#168a45")+'">'+esc(item.type)+" • "+money(item.amount)+'</strong><div style="font-size:12px;opacity:.7">'+esc(item.date)+" • "+esc(item.method)+" • "+esc(item.status)+'</div>'+(item.note?'<div>'+esc(item.note)+'</div>':"")+'<div style="margin-top:6px;display:flex;gap:6px">'+actionButton("khata-edit",item.id,"Edit")+actionButton("khata-delete",item.id,"Delete")+actionButton("khata-payment",item.id,"Payment")+'</div></div>').join("");
  }
  function openPaymentEntry(id){
    var item=D.khata.find(x=>x.id===id)||getKhata(D.mode).filter(x=>x.person===D.ui.detailPerson&&x.status!=="settled")[0];
    if(!item){ alert("No pending entry"); return; }
    var rem=Math.max(0,num(item.amount)-num(item.paid)); var amt=num(prompt("Payment amount:",String(rem))); if(!(amt>0)) return;
    item.paid+=amt; if(item.paid>=num(item.amount)){ item.paid=num(item.amount); item.status="settled"; }
    item.history=item.history||[]; item.history.push({date:today(),amount:amt,method:"Cash"}); save(); renderAll(); renderKhataDetail();
  }
  function shareText(text){ if(navigator.share){ navigator.share({title:"HISAB",text:text}).catch(()=>{}); return; } if(navigator.clipboard){ navigator.clipboard.writeText(text).then(()=>alert("Copied")).catch(()=>alert(text)); } else alert(text); }
  function shareKhata(p,m){ p=p||D.ui.detailPerson; m=m||D.mode; var data=getKhata(m).filter(i=>String(i.person).toLowerCase()===String(p).toLowerCase()); var t="HISAB Statement - "+p+"\n\n"; data.forEach(i=>{ t+=(i.type==="give"?"Give":"Receive")+": "+money(i.amount)+" ("+i.date+") "+(i.status||"")+"\n"; }); shareText(t); }
  function printHTML(title,body){ var w=window.open("","_blank"); if(!w){ alert("Popup blocked"); return; } w.document.write("<html><head><meta charset='utf-8'><title>"+esc(title)+"</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px}</style></head><body>"+body+"</body></html>"); w.document.close(); setTimeout(()=>{ try{w.print();}catch(e){} },400); }
  function exportKhataPDF(p,m){ p=p||D.ui.detailPerson; m=m||D.mode; var data=getKhata(m).filter(i=>String(i.person).toLowerCase()===String(p).toLowerCase()); var html="<h2>"+esc(p)+"</h2><table><tr><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr>"+data.map(i=>"<tr><td>"+esc(i.type)+"</td><td>"+money(i.amount)+"</td><td>"+esc(i.date)+"</td><td>"+esc(i.status)+"</td></tr>").join("")+"</table>"; printHTML("Khata - "+p,html); }

  // Business
  function businessFilter(f){ if(typeof f==="object") f="customer"; D.ui.businessFilter=f||"customer"; save(); renderBusiness(); }
  function addBusinessMaster(type){ var name=prompt(type==="customer"?"Customer name:":"Supplier name:"); if(!name||!name.trim()) return; var phone=prompt("Phone (optional):","")||""; D.business.push({id:uid("biz"),mode:"business",type:type,name:name.trim(),phone:phone.trim(),date:today()}); save(); renderBusiness(); }
  function addBusinessCustomer(){ addBusinessMaster("customer"); } function addBusinessSupplier(){ addBusinessMaster("supplier"); }
  function businessEntry(type){ var sale=type==="sale"; var name=prompt(sale?"Customer name:":"Supplier name:"); if(!name||!name.trim()) return; var amount=num(prompt("Amount:")); if(amount<=0) return; var date=prompt("Date:",today())||today(); var item={id:uid(type),mode:"business",customer:sale?name.trim():"",supplier:sale?"":name.trim(),amount:amount,paid:0,status:"pending",date:date,method:"Cash",note:"",history:[]}; if(sale) D.sales.push(item); else D.purchases.push(item); save(); renderBusiness(); renderHome(); }
  function addBusinessSales(){ businessEntry("sale"); } function addBusinessPurchase(){ businessEntry("purchase"); }
  function getBusinessSales(){ return D.sales.filter(i=>i.mode==="business"); } function getBusinessPurchases(){ return D.purchases.filter(i=>i.mode==="business"); }
  function businessCard(item,type){ var name=type==="sale"?item.customer:item.supplier; var rem=Math.max(0,num(item.amount)-num(item.paid)); return '<div class="hisab-entry-card"><strong>'+esc(name||"")+'</strong><div>'+esc(type==="sale"?"Sale":"Purchase")+' • '+money(item.amount)+'</div><div style="font-size:12px;opacity:.7">'+esc(item.date)+' • '+esc(item.status)+'</div><div>Paid: '+money(item.paid)+' • Rem: '+money(rem)+'</div><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">'+actionButton2("business-payment",type,item.id,"Pay")+actionButton2("business-edit",type,item.id,"Edit")+actionButton2("business-delete",type,item.id,"Del")+actionButton2("business-history",type,item.id,"History")+'</div></div>'; }
  function renderBusiness(){
    var list=$("businessList"); if(!list) return; var f=D.ui.businessFilter||"customer"; var html="";
    if(f==="customer"||f==="sales") getBusinessSales().forEach(i=>html+=businessCard(i,"sale"));
    if(f==="supplier"||f==="purchase") getBusinessPurchases().forEach(i=>html+=businessCard(i,"purchase"));
    if(f==="customer"||f==="supplier") D.business.filter(i=>i.type===f).forEach(i=>{ html+='<div class="hisab-entry-card"><strong>'+esc(i.name)+'</strong><div style="font-size:12px;opacity:.7">'+esc(i.phone||"")+'</div>'+actionButton("business-master-delete",i.id,"Delete")+'</div>'; });
    list.innerHTML=html||'<div class="empty-state">No entries</div>';
  }
  function findBusiness(type,id){ return (type==="sale"?D.sales:D.purchases).find(x=>x.id===id); }
  function payBusinessEntry(type,id){ var item=findBusiness(type,id); if(!item) return; var rem=Math.max(0,num(item.amount)-num(item.paid)); var a=num(prompt("Pay:",String(rem))); if(!(a>0)) return; a=Math.min(a,rem); item.paid+=a; item.history.push({date:today(),amount:a,method:"Cash"}); item.status=item.paid>=item.amount?"paid":"pending"; save(); renderBusiness(); }
  function editBusinessEntry(type,id){ var item=findBusiness(type,id); if(!item) return; var a=num(prompt("Amount:",String(item.amount))); if(a<=0) return; item.amount=a; item.paid=Math.min(num(item.paid),a); save(); renderBusiness(); }
  function deleteBusinessEntry(type,id){ if(!confirm("Delete?")) return; if(type==="sale") D.sales=D.sales.filter(x=>x.id!==id); else D.purchases=D.purchases.filter(x=>x.id!==id); save(); renderBusiness(); }
  function deleteBusinessMaster(id){ D.business=D.business.filter(x=>x.id!==id); save(); renderBusiness(); }
  function businessHistory(type,id){ var item=findBusiness(type,id); var h=item?item.history||[]:[]; alert(h.length?h.map(x=>x.date+" • "+money(x.amount)).join("\n"):"No history"); }

  // Transactions - FIXED FOR YOUR HTML FORM
  function addTransaction(type){
    var tType = type || ($("transactionType")?$("transactionType").value:"expense");
    var tAmount = $("transactionAmount")?num($("transactionAmount").value):0;
    var tCat = $("transactionCategory")?$("transactionCategory").value.trim():"";
    var tNote = $("transactionNote")?$("transactionNote").value.trim():"";
    var tDate = $("transactionDate")?safeDate($("transactionDate").value):today();

    // fallback to prompts if form empty (quick add)
    if(!type && !tAmount){
      tAmount=num(prompt(tType==="income"?"Income amount:":"Expense amount:"));
      if(tAmount<=0) return;
      tCat=prompt("Category:","")||"";
      tNote=prompt("Note:","")||"";
    }
    if(tAmount<=0){ alert("Amount enter karein"); return; }

    D.transactions.push({id:uid("txn"),mode:D.mode,type:tType,amount:tAmount,category:tCat,note:tNote,date:tDate});
    if($("transactionAmount")) $("transactionAmount").value=""; if($("transactionCategory")) $("transactionCategory").value=""; if($("transactionNote")) $("transactionNote").value="";
    save(); renderAll(); show("transactions");
  }
  function deleteTransaction(id){ if(!confirm("Delete?")) return; D.transactions=D.transactions.filter(x=>x.id!==id); save(); renderAll(); }
  function renderTransactions(){
    var list=$("transactionList"); if(!list) return;
    var data=D.transactions.filter(i=>i.mode===D.mode).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    if(!data.length){ list.innerHTML='<div class="empty-state">No transactions</div>'; return; }
    list.innerHTML=data.map(i=>'<div class="hisab-entry-card"><strong style="color:'+(i.type==="income"?"#168a45":"#d32f2f")+'">'+esc(i.type)+" • "+money(i.amount)+'</strong><div style="font-size:12px;opacity:.7">'+esc(i.date)+" • "+esc(i.category||"")+'</div>'+(i.note?'<div>'+esc(i.note)+'</div>':"")+'<div style="margin-top:6px">'+actionButton("transaction-delete",i.id,"Delete")+'</div></div>').join("");
  }

  function calcBudget(){ var amt=$("budgetAmount")?num($("budgetAmount").value):0; if(amt<=0){ amt=num(prompt("Budget amount:")); if(amt<=0) return; } D.budget[D.mode]=amt; save(); renderPlanning(); renderReports(); }
  function calcGoal(){ var name=$("goalName")?$("goalName").value.trim():""; var target=$("goalTarget")?num($("goalTarget").value):0; var saved=$("goalSaved")?num($("goalSaved").value):0; if(!name||target<=0){ alert("Goal name/target"); return; } D.goals.push({id:uid("goal"),mode:D.mode,name:name,target:target,saved:Math.min(saved,target),date:$("goalDate")?safeDate($("goalDate").value):today()}); if($("goalName")) $("goalName").value=""; if($("goalTarget")) $("goalTarget").value=""; if($("goalSaved")) $("goalSaved").value=""; save(); renderPlanning(); }
  function addGoalSaving(id){ var g=D.goals.find(x=>x.id===id); if(!g) return; var a=num(prompt("Saving amount:")); if(a<=0) return; g.saved=Math.min(num(g.target),num(g.saved)+a); save(); renderPlanning(); }
  function deleteGoal(id){ D.goals=D.goals.filter(x=>x.id!==id); save(); renderPlanning(); }
  function renderPlanning(){
    if($("budgetAmount") && D.budget[D.mode]) $("budgetAmount").value=D.budget[D.mode];
    var list=$("goalList"); if(!list) return; var data=D.goals.filter(x=>x.mode===D.mode);
    list.innerHTML=data.length?data.map(g=>{ var p=g.target?(num(g.saved)/num(g.target))*100:0; return '<div class="hisab-entry-card"><strong>'+esc(g.name)+'</strong><div>'+money(g.saved)+' / '+money(g.target)+' ('+p.toFixed(1)+'%)</div>'+actionButton("goal-saving",g.id,"Add")+actionButton("goal-delete",g.id,"Delete")+'</div>'; }).join(""):'<div class="empty-state">No goals</div>';
  }

  function addBill(type){
    var name="",amount=0,due=today();
    if(type==="Credit Card"){ name="Credit Card"; amount=$("cardBill")?num($("cardBill").value):0; due=$("cardDue")?safeDate($("cardDue").value):today(); if($("cardBill")) $("cardBill").value=""; }
    else { name=$("billName")?$("billName").value.trim():""; amount=$("billAmount")?num($("billAmount").value):0; due=$("billDue")?safeDate($("billDue").value):today(); if($("billName")) $("billName").value=""; if($("billAmount")) $("billAmount").value=""; }
    if(!name||amount<=0){ alert("Bill name/amount"); return; }
    D.bills.push({id:uid("bill"),mode:D.mode,name:name,amount:amount,due:due,paid:0,status:"pending",history:[],date:today()}); save(); renderCredit();
  }
  function payBill(id){ var b=D.bills.find(x=>x.id===id); if(!b) return; var rem=Math.max(0,num(b.amount)-num(b.paid)); var a=num(prompt("Pay:",String(rem))); if(!(a>0)) return; b.paid+=Math.min(a,rem); b.history.push({date:today(),amount:a,method:"Cash"}); b.status=b.paid>=b.amount?"paid":"partial"; save(); renderCredit(); }
  function billHistory(id){ var b=D.bills.find(x=>x.id===id); var h=b?b.history||[]:[]; alert(h.length?h.map(x=>x.date+" • "+money(x.amount)).join("\n"):"No history"); }
  function deleteBill(id){ D.bills=D.bills.filter(x=>x.id!==id); save(); renderCredit(); }

  function calcEMI(){
    var p=$("emiPrincipal")?num($("emiPrincipal").value):0; var r=$("emiRate")?num($("emiRate").value):0; var m=$("emiMonths")?num($("emiMonths").value):0;
    if(p<=0||m<=0){ alert("Loan amount/tenure"); return; }
    var mr=r/1200; var emi=mr? p*mr*Math.pow(1+mr,m)/(Math.pow(1+mr,m)-1) : p/m;
    if($("emiResult")) $("emiResult").innerHTML='<div class="hisab-entry-card"><strong>EMI: '+money(emi)+'</strong><div>Total: '+money(emi*m)+'</div></div>';
    D.loans.push({id:uid("loan"),mode:D.mode,name:"Loan",principal:p,rate:r,months:m,emi:emi,amount:emi*m,due:today(),paid:0,status:"pending",history:[]}); save(); renderCredit();
  }
  function payLoan(id){ var l=D.loans.find(x=>x.id===id); if(!l) return; var rem=Math.max(0,num(l.amount)-num(l.paid)); var a=num(prompt("Pay:",String(Math.min(rem,num(l.emi)||rem)))); if(!(a>0)) return; l.paid+=Math.min(a,rem); l.history.push({date:today(),amount:a,method:"Cash"}); l.status=l.paid>=l.amount?"paid":"partial"; save(); renderCredit(); }
  function loanHistory(id){ var l=D.loans.find(x=>x.id===id); var h=l?l.history||[]:[]; alert(h.length?h.map(x=>x.date+" • "+money(x.amount)).join("\n"):"No history"); }
  function toggleLoanStatus(id){ var l=D.loans.find(x=>x.id===id); if(!l) return; if(l.status==="paid") l.status="pending"; else { l.status="paid"; l.paid=num(l.amount); } save(); renderCredit(); }
  function deleteLoan(id){ D.loans=D.loans.filter(x=>x.id!==id); save(); renderCredit(); }
  function renderCredit(){
    var billList=$("billList"); if(!billList) return;
    var bills=D.bills.filter(x=>x.mode===D.mode); var loans=D.loans.filter(x=>x.mode===D.mode);
    var html="";
    if(bills.length) html+=bills.map(b=>{ var rem=Math.max(0,num(b.amount)-num(b.paid)); return '<div class="hisab-entry-card"><strong>'+esc(b.name)+'</strong><div>Due: '+esc(b.due)+'</div><div>'+money(b.amount)+' • Paid: '+money(b.paid)+' • Rem: '+money(rem)+'</div><div>'+actionButton("bill-pay",b.id,"Pay")+actionButton("bill-history",b.id,"History")+actionButton("bill-delete",b.id,"Del")+'</div></div>'; }).join("");
    if(loans.length) html+=loans.map(l=>{ var rem=Math.max(0,num(l.amount)-num(l.paid)); return '<div class="hisab-entry-card" style="border-left:4px solid #6a5af9"><strong>Loan • EMI: '+money(l.emi)+'</strong><div>Total: '+money(l.amount)+' • Paid: '+money(l.paid)+' • Rem: '+money(rem)+'</div><div>'+esc(l.status)+'</div><div>'+actionButton("loan-pay",l.id,"Pay")+actionButton("loan-history",l.id,"History")+actionButton("loan-status",l.id,"Toggle")+actionButton("loan-delete",l.id,"Del")+'</div></div>'; }).join("");
    billList.innerHTML=html||'<div class="empty-state">No bills/loans</div>';
  }

  function renderReports(){
    var inc=0,exp=0; D.transactions.forEach(i=>{ if(i.mode!==D.mode) return; if(i.type==="income") inc+=num(i.amount); else exp+=num(i.amount); });
    var kh=khataTotals(D.mode); if($("reportIncome")) $("reportIncome").textContent=money(inc); if($("reportExpense")) $("reportExpense").textContent=money(exp); if($("reportGive")) $("reportGive").textContent=money(kh.give); if($("reportReceive")) $("reportReceive").textContent=money(kh.receive);
    var box=$("reportContent"); if(!box) return; var budget=num(D.budget[D.mode]); var net=inc-exp+kh.receive-kh.give;
    box.innerHTML='<div class="hisab-entry-card"><strong>Net: '+money(net)+'</strong><div>Budget: '+money(budget)+' • Spent: '+money(exp)+' • Rem: '+money(budget-exp)+'</div></div>';
    if(D.mode==="business"){ var s=getBusinessSales().reduce((t,i)=>t+num(i.amount),0); var p=getBusinessPurchases().reduce((t,i)=>t+num(i.amount),0); box.innerHTML+='<div class="hisab-entry-card"><strong>Business</strong><div>Sales: '+money(s)+'</div><div>Purchase: '+money(p)+'</div><div>Diff: '+money(s-p)+'</div></div>'; }
  }
  function summaryText(){ var inc=0,exp=0; D.transactions.forEach(i=>{ if(i.mode!==D.mode) return; if(i.type==="income") inc+=num(i.amount); else exp+=num(i.amount); }); var kh=khataTotals(D.mode); return "HISAB Summary\nMode: "+D.mode+"\nIncome: "+money(inc)+"\nExpense: "+money(exp)+"\nGive: "+money(kh.give)+"\nReceive: "+money(kh.receive)+"\nNet: "+money(inc-exp+kh.receive-kh.give); }
  function exportSummary(){ shareText(summaryText()); }
  function exportSummaryPDF(){ printHTML("HISAB Summary","<pre>"+esc(summaryText())+"</pre>"); }

  function addReminder(){ var name=$("reminderName")?$("reminderName").value.trim():""; var date=$("reminderDate")?safeDate($("reminderDate").value):today(); if(!name){ alert("Reminder"); return; } D.reminders.push({id:uid("rem"),name:name,date:date}); if($("reminderName")) $("reminderName").value=""; save(); renderReminders(); }
  function deleteReminder(id){ D.reminders=D.reminders.filter(x=>x.id!==id); save(); renderReminders(); }
  function renderReminders(){ var list=$("reminderList"); if(!list) return; list.innerHTML=D.reminders.length?D.reminders.map(i=>'<div class="hisab-entry-card"><strong>'+esc(i.name)+'</strong><div>'+esc(i.date)+'</div>'+actionButton("reminder-delete",i.id,"Delete")+'</div>').join(""):'<div class="empty-state">No reminders</div>'; }

  async function hashPin(pin){ try{ if(window.crypto&&crypto.subtle){ var buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(pin)); return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join(""); } }catch(e){} var h=2166136261; for(var i=0;i<pin.length;i++){ h^=pin.charCodeAt(i); h+=h<<1; h+=h<<4; h+=h<<7; h+=h<<8; h+=h<<24; } return String(h>>>0); }
  async function setPin(){ var input=$("pinInput"); var pin=input?input.value.trim():""; if(!/^\d{4,8}$/.test(pin)){ alert("PIN 4-8 digit"); return; } D.pinHash=await hashPin(pin); save(); if(input) input.value=""; alert("PIN saved"); }
  function enterGuestMode(){ try{ localStorage.setItem(SESSION_KEY,"1"); var gate=$("guestGate"), shell=$("appShell"); if(gate) gate.style.display="none"; if(shell) shell.style.display=""; show(D.ui.page||"home"); renderAll(); }catch(e){ localStorage.setItem(SESSION_KEY,"1"); location.reload(); } }
  function lockApp(){ localStorage.removeItem(SESSION_KEY); initGate(); }
  function initGate(){ var gate=$("guestGate"), shell=$("appShell"); var unlocked=localStorage.getItem(SESSION_KEY)==="1"; if(gate) gate.style.display=unlocked?"none":"flex"; if(shell) shell.style.display=unlocked?"":"none"; }

  function addFamilyMember(){ var name=$("familyName")?$("familyName").value.trim():""; if(!name) return; D.family.push({id:uid("fam"),name:name,date:today()}); if($("familyName")) $("familyName").value=""; save(); renderFamily(); }
  function deleteFamilyMember(id){ D.family=D.family.filter(x=>x.id!==id); save(); renderFamily(); }
  function renderFamily(){ var list=$("familyList"); if(!list) return; list.innerHTML=D.family.length?D.family.map(i=>'<div class="hisab-entry-card"><strong>'+esc(i.name)+'</strong><div>'+esc(i.date)+'</div>'+actionButton("family-delete",i.id,"Delete")+'</div>').join(""):'<div class="empty-state">No family</div>'; }
  function renderTools(){}

  function exportBackup(){ try{ var blob=new Blob([JSON.stringify(D,null,2)],{type:"application/json"}); var url=URL.createObjectURL(blob); var a=document.createElement("a"); a.href=url; a.download="HISAB-backup-"+today()+".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); }catch(e){ alert("Backup fail"); } }
  function importBackup(e){ var file=e&&e.target&&e.target.files&&e.target.files[0]; if(!file) return; var r=new FileReader(); r.onload=function(){ try{ var data=JSON.parse(r.result); Object.keys(data).forEach(k=>D[k]=data[k]); normalize(); save(); alert("Restored"); renderAll(); show("home"); }catch(err){ alert("Invalid file"); } }; r.readAsText(file); }
  function searchAllData(q){ var list=$("searchResults"); if(!list) return; q=String(q||"").trim().toLowerCase(); if(!q){ list.innerHTML=""; return; } var res=[]; function add(t,ti,am,da){ if([t,ti,am,da].join(" ").toLowerCase().includes(q)) res.push({type:t,title:ti,amount:am,date:da}); } D.transactions.forEach(x=>add("Txn",x.category||x.type,x.amount,x.date)); D.khata.forEach(x=>add("Udhar",x.person,x.amount,x.date)); D.sales.forEach(x=>add("Sale",x.customer,x.amount,x.date)); D.purchases.forEach(x=>add("Purchase",x.supplier,x.amount,x.date)); list.innerHTML=res.length?res.slice(0,50).map(x=>'<div class="hisab-entry-card"><strong>'+esc(x.type)+'</strong><div>'+esc(x.title)+'</div><div>'+money(x.amount)+' • '+esc(x.date)+'</div></div>').join(""):"No results"; }
  function openQuickAdd(){ var ch=prompt("1=Income 2=Expense 3=Give 4=Receive"); if(ch==="1") { show("transactions"); if($("transactionType")) $("transactionType").value="income"; } else if(ch==="2"){ show("transactions"); if($("transactionType")) $("transactionType").value="expense"; } else if(ch==="3"||ch==="4"){ openKhataForm(D.mode); if($("khataType")) $("khataType").value=ch==="3"?"give":"receive"; } }

  function handleAction(btn){ var a=btn.getAttribute("data-hisab-action"), id=btn.getAttribute("data-hisab-id"), id2=btn.getAttribute("data-hisab-id2"); switch(a){ case "khata-view": openKhataDetail(id,id2); break; case "khata-edit": editKhata(id); break; case "khata-delete": deleteKhata(id); break; case "khata-payment": openPaymentEntry(id); break; case "business-payment": payBusinessEntry(id,id2); break; case "business-edit": editBusinessEntry(id,id2); break; case "business-delete": deleteBusinessEntry(id,id2); break; case "business-history": businessHistory(id,id2); break; case "business-master-delete": deleteBusinessMaster(id); break; case "transaction-delete": deleteTransaction(id); break; case "goal-saving": addGoalSaving(id); break; case "goal-delete": deleteGoal(id); break; case "bill-pay": payBill(id); break; case "bill-history": billHistory(id); break; case "bill-delete": deleteBill(id); break; case "loan-pay": payLoan(id); break; case "loan-history": loanHistory(id); break; case "loan-status": toggleLoanStatus(id); break; case "loan-delete": deleteLoan(id); break; case "reminder-delete": deleteReminder(id); break; case "family-delete": deleteFamilyMember(id); break; } }
  function installHandler(){ document.addEventListener("click",e=>{ var t=e.target.closest("[data-hisab-action]"); if(!t) return; e.preventDefault(); try{ handleAction(t);}catch(err){ console.error(err);} },false); }
  function renderAll(){ renderHome(); renderKhata("personal"); renderBusiness(); renderTransactions(); renderPlanning(); renderCredit(); renderReports(); renderReminders(); renderFamily(); }
  function init(){ load(); if($("khataDate")) $("khataDate").value=today(); if($("transactionDate")) $("transactionDate").value=today(); if($("reminderDate")) $("reminderDate").value=today(); if($("billDue")) $("billDue").value=today(); if($("cardDue")) $("cardDue").value=today(); if($("goalDate")) $("goalDate").value=today(); initGate(); renderAll(); if(localStorage.getItem(SESSION_KEY)==="1") show(PAGES.indexOf(D.ui.page)>=0?D.ui.page:"home"); }

  window.D=D; window.show=show; window.setMode=setMode; window.toggleLanguage=toggleLanguage; window.toggleCurrency=toggleCurrency;
  window.enterGuestMode=enterGuestMode; window.lockApp=lockApp; window.setPin=setPin;
  window.openKhataForm=openKhataForm; window.closeKhataForm=closeKhataForm; window.saveKhataEntry=saveKhataEntry; window.searchKhata=searchKhata; window.filterKhata=filterKhata; window.editKhata=editKhata; window.deleteKhata=deleteKhata; window.openKhataDetail=openKhataDetail; window.closeKhataDetail=closeKhataDetail; window.detailFilter=detailFilter; window.openPaymentEntry=openPaymentEntry; window.shareKhata=shareKhata; window.exportKhataPDF=exportKhataPDF;
  window.businessFilter=businessFilter; window.addBusinessCustomer=addBusinessCustomer; window.addBusinessSupplier=addBusinessSupplier; window.addBusinessSales=addBusinessSales; window.addBusinessPurchase=addBusinessPurchase; window.payBusinessEntry=payBusinessEntry; window.editBusinessEntry=editBusinessEntry; window.deleteBusinessEntry=deleteBusinessEntry; window.deleteBusinessMaster=deleteBusinessMaster; window.businessHistory=businessHistory;
  window.addTransaction=addTransaction; window.deleteTransaction=deleteTransaction;
  window.calcBudget=calcBudget; window.calcGoal=calcGoal; window.addGoalSaving=addGoalSaving; window.deleteGoal=deleteGoal;
  window.addBill=addBill; window.payBill=payBill; window.billHistory=billHistory; window.deleteBill=deleteBill;
  window.calcEMI=calcEMI; window.payLoan=payLoan; window.loanHistory=loanHistory; window.toggleLoanStatus=toggleLoanStatus; window.deleteLoan=deleteLoan;
  window.exportSummary=exportSummary; window.exportSummaryPDF=exportSummaryPDF;
  window.addReminder=addReminder; window.deleteReminder=deleteReminder;
  window.addFamilyMember=addFamilyMember; window.deleteFamilyMember=deleteFamilyMember;
  window.exportBackup=exportBackup; window.importBackup=importBackup; window.searchAllData=searchAllData; window.openQuickAdd=openQuickAdd;
  window.calcFD=function(){ var p=num($("fdPrincipal")?$("fdPrincipal").value:0), r=num($("fdRate")?$("fdRate").value:0), m=num($("fdN")?$("fdN").value:0); if(p<=0||m<=0) return; var mat=p*Math.pow(1+r/100,m/12); if($("fdResult")) $("fdResult").textContent="Maturity: "+money(mat); };
  window.addInsurance=function(){ D.tools.push({id:uid("tool"),name:"Insurance",date:today()}); save(); alert("Insurance added"); };
  window.addSchool=function(){ D.tools.push({id:uid("tool"),name:"School",date:today()}); save(); alert("School added"); };
  window.addVehicle=function(){ D.tools.push({id:uid("tool"),name:"Vehicle",date:today()}); save(); alert("Vehicle added"); };
  window.addShopping=function(){ D.tools.push({id:uid("tool"),name:"Shopping",date:today()}); save(); alert("Shopping added"); };
  window.addUtility=function(){ D.tools.push({id:uid("tool"),name:"Utility",date:today()}); save(); alert("Utility added"); };
  window.calcEmergency=function(){ var m=num(prompt("Monthly expense:")); var mo=num(prompt("Months:","6")); if(m>0&&mo>0) alert("Emergency: "+money(m*mo)); };
  window.addDoc=function(){ D.tools.push({id:uid("tool"),name:"Document",date:today()}); save(); alert("Document added"); };
  window.addAnnual=function(){ D.tools.push({id:uid("tool"),name:"Annual Planning",date:today()}); save(); alert("Annual Planning added"); };

  installHandler();
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
