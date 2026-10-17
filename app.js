let data = JSON.parse(localStorage.getItem('akhata') || '[]');
let settings = JSON.parse(localStorage.getItem('akhata_settings') || '{}');
let curTile = 'Personal Khata';
let activeFilter = { p: null, b: null };
let selectedDateRange = 'all';
let currentSort = 'newest';
let userCityName = settings.userCity || 'Global';
let currSymbol = settings.currency || '$';
let activeCustomer = '';
let lastDeleted = null;
let undoTimer = null;

// Global Dictionary
const translations = {
  en: { pDiya: "Given (Diya)", pLiya: "Got (Liya)", pBal: "Net Balance", pRatio: "Given vs Got Ratio", bRatio: "Sales vs Expense Ratio", secPersonal: "Personal Ledger", secBusiness: "Business Ledger", tabPersonal: "Personal", tabBusiness: "Business", tabMore: "More", search: "🔍 Search name, amount..." },
  hi: { pDiya: "Diya (दिया)", pLiya: "Liya (लिया)", pBal: "Bacha (बचत)", pRatio: "Diya vs Liya Ratio", bRatio: "Sales vs Expense Ratio", secPersonal: "Personal Khata", secBusiness: "Business Khata", tabPersonal: "Personal", tabBusiness: "Business", tabMore: "More", search: "🔍 खोजें (Search)..." },
  es: { pDiya: "Dado (Diya)", pLiya: "Recibido", pBal: "Saldo Neto", pRatio: "Proporción", bRatio: "Ventas vs Gastos", secPersonal: "Libro Personal", secBusiness: "Libro Negocios", tabPersonal: "Personal", tabBusiness: "Negocios", tabMore: "Más", search: "🔍 Buscar..." },
  ar: { pDiya: "إعطاء (Diya)", pLiya: "أخذ (Liya)", pBal: "الرصيد", pRatio: "النسبة", bRatio: "المبيعات vs المصروفات", secPersonal: "الحساب الشخصي", secBusiness: "حساب الأعمال", tabPersonal: "شخصي", tabBusiness: "أعمال", tabMore: "المزيد", search: "🔍 بحث..." },
  fr: { pDiya: "Donné (Diya)", pLiya: "Reçu (Liya)", pBal: "Solde Net", pRatio: "Ratio", bRatio: "Ventes vs Dépenses", secPersonal: "Livre Personnel", secBusiness: "Livre Entreprise", tabPersonal: "Personnel", tabBusiness: "Entreprise", tabMore: "Plus", search: "🔍 Rechercher..." },
  de: { pDiya: "Gegeben", pLiya: "Erhalten", pBal: "Kontostand", pRatio: "Verhältnis", bRatio: "Umsatz vs Ausgaben", secPersonal: "Persönliches Buch", secBusiness: "Geschäftsbuch", tabPersonal: "Privat", tabBusiness: "Gewerbe", tabMore: "Mehr", search: "🔍 Suchen..." },
  zh: { pDiya: "给出 (Diya)", pLiya: "收到 (Liya)", pBal: "净余额", pRatio: "比例", bRatio: "销售与支出", secPersonal: "个人账本", secBusiness: "商业账本", tabPersonal: "个人", tabBusiness: "商业", tabMore: "更多", search: "🔍 搜索..." },
  ja: { pDiya: "支払った", pLiya: "受け取った", pBal: "残高", pRatio: "比率", bRatio: "売上対費用", secPersonal: "個人帳簿", secBusiness: "ビジネス帳簿", tabPersonal: "個人", tabBusiness: "ビジネス", tabMore: "その他", search: "🔍 検索..." },
  ru: { pDiya: "Отдано", pLiya: "Получено", pBal: "Баланс", pRatio: "Соотношение", bRatio: "Продажи / Расходы", secPersonal: "Личные счета", secBusiness: "Бизнес счета", tabPersonal: "Личный", tabBusiness: "Бизнес", tabMore: "Ещё", search: "🔍 Поиск..." }
};

const personalTiles = [
  { name: 'Personal Khata', icon: '📘' },
  { name: 'Udhaar', icon: '💸' },
  { name: 'Cashbook', icon: '📒' },
  { name: 'Expense', icon: '💰' },
  { name: 'Customers', icon: '👥' },
  { name: 'Staff', icon: '👷' },
  { name: 'Tijori', icon: '🔒' }
];

const businessTiles = [
  { name: 'Business Khata', icon: '🏢' },
  { name: 'Sales', icon: '🛒' },
  { name: 'Purchase', icon: '📦' },
  { name: 'Suppliers', icon: '🚚' },
  { name: 'Stock Book', icon: '📚' },
  { name: 'Bank', icon: '🏦' },
  { name: 'Business Card', icon: '💳' },
  { name: 'Online Dukaan', icon: '🛍️' }
];

// Global City & Currency Detection
function detectGlobalLocation() {
  if (settings.userCity && settings.currency) {
    userCityName = settings.userCity;
    currSymbol = settings.currency;
    updateCurrencyUI();
    document.getElementById('userCity').innerText = userCityName;
    return;
  }
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(info => {
      if (info && info.city) {
        userCityName = `${info.city}, ${info.country_code || 'Global'}`;
        let country = info.country_code || 'US';
        
        // Auto Currency Selection
        if (country === 'IN') currSymbol = '₹';
        else if (country === 'GB') currSymbol = '£';
        else if (['DE','FR','IT','ES','NL'].includes(country)) currSymbol = '€';
        else if (country === 'AE') currSymbol = 'AED';
        else if (country === 'JP' || country === 'CN') currSymbol = '¥';
        else if (country === 'CA') currSymbol = 'C$';
        else if (country === 'AU') currSymbol = 'A$';
        else currSymbol = '$';

        settings.userCity = userCityName;
        settings.currency = currSymbol;
        localStorage.setItem('akhata_settings', JSON.stringify(settings));
        
        updateCurrencyUI();
        document.getElementById('userCity').innerText = userCityName;
      } else {
        document.getElementById('userCity').innerText = "Global View";
      }
    })
    .catch(() => {
      document.getElementById('userCity').innerText = "Global View";
    });
}

function updateCurrencyUI() {
  document.querySelectorAll('.curr-sym').forEach(el => el.innerText = currSymbol);
  if (document.getElementById('currencySelect')) document.getElementById('currencySelect').value = currSymbol;
}

function changeCurrency(val) {
  currSymbol = val;
  settings.currency = val;
  localStorage.setItem('akhata_settings', JSON.stringify(settings));
  updateCurrencyUI();
  render();
}

function autoDetectLanguage() {
  let savedLang = settings.lang;
  if (savedLang && savedLang !== 'auto') {
    changeLanguage(savedLang);
    document.getElementById('langSelect').value = savedLang;
  } else {
    let browserLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2);
    let targetLang = translations[browserLang] ? browserLang : 'en';
    changeLanguage(targetLang);
  }
}

function changeLanguage(langKey) {
  if (langKey === 'auto') {
    let browserLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2);
    langKey = translations[browserLang] ? browserLang : 'en';
  }
  settings.lang = langKey;
  localStorage.setItem('akhata_settings', JSON.stringify(settings));

  let t = translations[langKey] || translations['en'];
  
  if (document.getElementById('lbl-pDiya')) document.getElementById('lbl-pDiya').innerText = t.pDiya;
  if (document.getElementById('lbl-pLiya')) document.getElementById('lbl-pLiya').innerText = t.pLiya;
  if (document.getElementById('lbl-pBal')) document.getElementById('lbl-pBal').innerText = t.pBal;
  if (document.getElementById('lbl-bDiya')) document.getElementById('lbl-bDiya').innerText = t.pDiya;
  if (document.getElementById('lbl-bLiya')) document.getElementById('lbl-bLiya').innerText = t.pLiya;
  if (document.getElementById('lbl-bBal')) document.getElementById('lbl-bBal').innerText = t.pBal;
  if (document.getElementById('lbl-secPersonal')) document.getElementById('lbl-secPersonal').innerText = t.secPersonal;
  if (document.getElementById('lbl-secBusiness')) document.getElementById('lbl-secBusiness').innerText = t.secBusiness;
  if (document.getElementById('tab-personal')) document.getElementById('tab-personal').innerText = t.tabPersonal;
  if (document.getElementById('tab-business')) document.getElementById('tab-business').innerText = t.tabBusiness;
  if (document.getElementById('tab-more')) document.getElementById('tab-more').innerText = t.tabMore;
  if (document.getElementById('searchInput')) document.getElementById('searchInput').placeholder = t.search;
}

if (settings.darkMode) document.body.classList.add('dark-mode');
if (settings.pin && settings.pin.trim() !== '') {
  document.getElementById('lockScreen').style.display = 'flex';
} else {
  document.getElementById('lockScreen').style.display = 'none';
}

function unlockApp() {
  if (document.getElementById('inputPin').value === settings.pin) {
    document.getElementById('lockScreen').style.display = 'none';
  } else { alert('Wrong PIN!'); }
}

function switchTab(viewName, btn) {
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active-view'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('on'));
  
  document.getElementById(`view-${viewName}`).classList.add('active-view');
  btn.classList.add('on');
}

function openCalc() {
  document.getElementById('calcDisplay').value = '0';
  document.getElementById('calcModal').style.display = 'flex';
}

function cIn(v) {
  let d = document.getElementById('calcDisplay');
  if (v === 'C') d.value = '0';
  else d.value = d.value === '0' ? v : d.value + v;
}

function cEq() {
  let d = document.getElementById('calcDisplay');
  try { d.value = eval(d.value); } catch(e) { d.value = 'Error'; }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  settings.darkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('akhata_settings', JSON.stringify(settings));
  document.getElementById('darkBtn').innerText = settings.darkMode ? '☀️' : '🌙';
}

function saveSettings() {
  settings.pin = document.getElementById('pin').value;
  settings.bname = document.getElementById('bname').value;
  settings.gst = document.getElementById('gst').value;
  localStorage.setItem('akhata_settings', JSON.stringify(settings));
  renderSettings();
}

function renderSettings() {
  if (settings.pin) document.getElementById('pin').value = settings.pin;
  if (settings.bname) document.getElementById('bname').value = settings.bname;
  if (settings.gst) document.getElementById('gst').value = settings.gst;
  document.getElementById('hdrTitle').innerText = settings.bname || 'All Khata Pro';
  document.getElementById('hdrSub').innerHTML = `📍 ${userCityName} ${settings.gst ? ' | Tax ID: ' + settings.gst : ''}`;
}

function setDateFilter(range, btn) {
  selectedDateRange = range;
  document.querySelectorAll('.df-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function setSort(val) {
  currentSort = val;
  render();
}

function openM(tile, id = null, predefinedName = '') {
  curTile = tile;
  document.getElementById('mTitle').innerText = id ? 'Edit Entry' : 'Add in ' + tile;
  document.getElementById('editId').value = id || '';

  if (id) {
    let item = data.find(x => x.id === id);
    if (item) {
      document.getElementById('cname').value = item.name;
      document.getElementById('phone').value = item.phone || '';
      document.getElementById('amt').value = item.amt;
      document.getElementById('qty').value = item.qty || '';
      document.getElementById('type').value = item.type;
      document.getElementById('payMode').value = item.payMode || 'Cash';
      document.getElementById('date').value = item.date;
      document.getElementById('dueDate').value = item.dueDate || '';
      document.getElementById('note').value = item.note || '';
    }
  } else {
    document.getElementById('cname').value = predefinedName || '';
    document.getElementById('phone').value = '';
    document.getElementById('amt').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('type').value = 'Diya';
    document.getElementById('payMode').value = 'Cash';
    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('dueDate').value = '';
    document.getElementById('note').value = '';
    
    if (personalTiles.map(t=>t.name).includes(tile)) {
      activeFilter.p = tile;
    } else {
      activeFilter.b = tile;
    }
  }
  document.getElementById('modal').style.display = 'flex';
}

function closeM() { document.getElementById('modal').style.display = 'none'; }

function clearFilter(type) {
  if (type === 'p') activeFilter.p = null;
  if (type === 'b') activeFilter.b = null;
  render();
}

function save() {
  let editId = document.getElementById('editId').value;
  let nameVal = document.getElementById('cname').value.trim();
  let amtVal = +document.getElementById('amt').value || 0;

  if (!nameVal || !amtVal) return alert('Please enter name and amount');

  if (editId) {
    let item = data.find(x => x.id == editId);
    if (item) {
      item.name = nameVal;
      item.phone = document.getElementById('phone').value;
      item.amt = amtVal;
      item.qty = document.getElementById('qty').value;
      item.type = document.getElementById('type').value;
      item.payMode = document.getElementById('payMode').value;
      item.date = document.getElementById('date').value;
      item.dueDate = document.getElementById('dueDate').value;
      item.note = document.getElementById('note').value;
    }
  } else {
    data.push({
      tile: curTile,
      name: nameVal,
      phone: document.getElementById('phone').value,
      amt: amtVal,
      qty: document.getElementById('qty').value,
      type: document.getElementById('type').value,
      payMode: document.getElementById('payMode').value,
      date: document.getElementById('date').value || new Date().toISOString().slice(0, 10),
      dueDate: document.getElementById('dueDate').value,
      note: document.getElementById('note').value,
      id: Date.now()
    });
  }

  localStorage.setItem('akhata', JSON.stringify(data));
  closeM();
  render();
  if (activeCustomer) openLedger(activeCustomer);
}

function openReceipt(id) {
  let item = data.find(x => x.id === id);
  if (!item) return;

  document.getElementById('receiptBody').innerHTML = `
    <h2>${settings.bname || 'All Khata Pro'}</h2>
    <small>📍 Location: ${userCityName} ${settings.gst ? '| Tax ID: ' + settings.gst : ''}</small>
    <div class="r-amt ${item.type === 'Diya' ? 'red' : 'green'}">${item.type === 'Diya' ? '-' : '+'} ${currSymbol}${item.amt}</div>
    <div class="r-row"><span>Customer:</span><b>${item.name}</b></div>
    <div class="r-row"><span>Category:</span><b>${item.tile}</b></div>
    <div class="r-row"><span>Payment Mode:</span><b>${item.payMode || 'Cash'}</b></div>
    <div class="r-row"><span>Date:</span><b>${item.date}</b></div>
    ${item.qty ? `<div class="r-row"><span>Quantity:</span><b>${item.qty}</b></div>` : ''}
    ${item.note ? `<div class="r-row"><span>Note:</span><b>${item.note}</b></div>` : ''}
    <p style="margin-top:14px;font-size:11px;color:#888">Thank you for your business!</p>
  `;
  document.getElementById('receiptModal').style.display = 'flex';
}

function openLedger(customerName) {
  activeCustomer = customerName;
  let cData = data.filter(d => d.name.toLowerCase() === customerName.toLowerCase());
  document.getElementById('ledgerTitle').innerText = customerName + ' Statement';
  
  let diya = cData.filter(x => x.type === 'Diya').reduce((s, x) => s + x.amt, 0);
  let liya = cData.filter(x => x.type === 'Liya').reduce((s, x) => s + x.amt, 0);

  document.getElementById('lDiya').innerText = currSymbol + diya;
  document.getElementById('lLiya').innerText = currSymbol + liya;
  document.getElementById('lBal').innerText = currSymbol + (liya - diya);

  document.getElementById('ledgerList').innerHTML = cData.map(x => `
    <div style="padding:8px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
      <div><b>${x.tile}</b> (${x.date}) ${x.qty ? '• Qty: ' + x.qty : ''}<br><small>${x.note || ''}</small></div>
      <div class="${x.type === 'Diya' ? 'red' : 'green'}"><b>${currSymbol}${x.amt}</b> (${x.type})</div>
    </div>
  `).join('');

  document.getElementById('ledgerAddBtn').onclick = function() {
    document.getElementById('ledgerModal').style.display = 'none';
    openM('Udhaar', null, customerName);
  };

  document.getElementById('ledgerModal').style.display = 'flex';
}

function sendWhatsApp(name, amt, type, date, phone) {
  let msg = `Hello ${name},\nYour account entry of ${currSymbol}${amt} (${type}) has been recorded.\nDate: ${date}\nThank you! - ${settings.bname || 'All Khata Pro'} (${userCityName})`;
  let phoneNum = phone ? phone.replace(/[^0-9]/g, '') : '';
  if (!phoneNum) {
    phoneNum = prompt('Please enter mobile number with country code for WhatsApp:');
  }
  let url = phoneNum ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function del(id) {
  let idx = data.findIndex(d => d.id === id);
  if (idx !== -1) {
    lastDeleted = { item: data[idx], index: idx };
    data.splice(idx, 1);
    localStorage.setItem('akhata', JSON.stringify(data));
    render();

    let toast = document.getElementById('undoToast');
    toast.style.display = 'flex';
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }
}

function undoDelete() {
  if (lastDeleted) {
    data.splice(lastDeleted.index, 0, lastDeleted.item);
    localStorage.setItem('akhata', JSON.stringify(data));
    lastDeleted = null;
    document.getElementById('undoToast').style.display = 'none';
    render();
  }
}

function renderGrid(tilesArray, containerId) {
  let html = tilesArray.map(t => {
    let tileData = data.filter(d => d.tile === t.name);
    let diyaSum = tileData.filter(d => d.type === 'Diya').reduce((s, d) => s + d.amt, 0);
    let liyaSum = tileData.filter(d => d.type === 'Liya').reduce((s, d) => s + d.amt, 0);
    let diff = liyaSum - diyaSum;

    return `
      <div class="tile" onclick="openM('${t.name}')">
        <div class="icon">${t.icon}</div>
        <div class="info">
          <div class="name">${t.name}</div>
          <div class="tile-amt ${diff < 0 ? 'red' : 'green'}">${currSymbol}${Math.abs(diff)}</div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById(containerId).innerHTML = html;
}

function render() {
  let query = document.getElementById('searchInput').value.toLowerCase();
  let today = new Date().toISOString().slice(0, 10);
  let currentMonth = today.slice(0, 7);
  
  renderGrid(personalTiles, 'pGrid');
  renderGrid(businessTiles, 'bGrid');

  let pAll = data.filter(d => personalTiles.map(t=>t.name).includes(d.tile));
  let bAll = data.filter(d => businessTiles.map(t=>t.name).includes(d.tile));

  function filterByDate(arr) {
    if (selectedDateRange === 'today') return arr.filter(d => d.date === today);
    if (selectedDateRange === 'month') return arr.filter(d => d.date.startsWith(currentMonth));
    return arr;
  }

  function matchesQuery(d) {
    return d.name.toLowerCase().includes(query) ||
           (d.note && d.note.toLowerCase().includes(query)) ||
           (d.phone && d.phone.includes(query)) ||
           (d.payMode && d.payMode.toLowerCase().includes(query)) ||
           d.amt.toString().includes(query);
  }

  function sortArray(arr) {
    let copy = arr.slice();
    if (currentSort === 'newest') return copy.sort((a,b) => b.id - a.id);
    if (currentSort === 'oldest') return copy.sort((a,b) => a.id - b.id);
    if (currentSort === 'high') return copy.sort((a,b) => b.amt - a.amt);
    if (currentSort === 'low') return copy.sort((a,b) => a.amt - b.amt);
    return copy;
  }

  let pShow = sortArray(filterByDate(pAll).filter(d => (!activeFilter.p || d.tile === activeFilter.p) && matchesQuery(d)));
  let bShow = sortArray(filterByDate(bAll).filter(d => (!activeFilter.b || d.tile === activeFilter.b) && matchesQuery(d)));

  document.getElementById('pFilterTag').innerText = activeFilter.p ? 'Filter: ' + activeFilter.p + ' (❌)' : 'Show All';
  document.getElementById('bFilterTag').innerText = activeFilter.b ? 'Filter: ' + activeFilter.b + ' (❌)' : 'Show All';

  function sum(arr, t) { return arr.filter(x => x.type === t).reduce((s, x) => s + x.amt, 0); }

  let pD = sum(pAll, 'Diya'), pL = sum(pAll, 'Liya');
  let bD = sum(bAll, 'Diya'), bL = sum(bAll, 'Liya');

  document.getElementById('pDiya').innerText = currSymbol + pD;
  document.getElementById('pLiya').innerText = currSymbol + pL;
  document.getElementById('pBal').innerText = currSymbol + (pL - pD);

  document.getElementById('bDiya').innerText = currSymbol + bD;
  document.getElementById('bLiya').innerText = currSymbol + bL;
  document.getElementById('bBal').innerText = currSymbol + (bL - bD);

  let pTotal = pD + pL || 1;
  document.getElementById('pRedBar').style.width = ((pD / pTotal) * 100) + '%';
  document.getElementById('pGreenBar').style.width = ((pL / pTotal) * 100) + '%';
  document.getElementById('pRatio').innerText = Math.round((pL / pTotal) * 100) + '% Got';

  let bTotal = bD + bL || 1;
  document.getElementById('bRedBar').style.width = ((bD / bTotal) * 100) + '%';
  document.getElementById('bGreenBar').style.width = ((bL / bTotal) * 100) + '%';
  document.getElementById('bRatio').innerText = Math.round((bL / bTotal) * 100) + '% Got';

  function listHTML(arr) {
    if (arr.length === 0) return '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px">No entries found</div>';
    return arr.map(x => `
      <div class="item">
        <div class="item-info">
          <div class="title" onclick="openLedger('${x.name}')">${x.name} <span class="pay-tag">${x.payMode || 'Cash'}</span> ${x.qty ? `<span class="qty-badge">${x.qty}</span>` : ''}</div>
          <div class="meta">${x.date} • ${x.tile} ${x.phone ? '• 📞 ' + x.phone : ''} ${x.note ? '• ' + x.note : ''}</div>
          ${x.dueDate ? `<div class="due-badge">Due: ${x.dueDate}${x.dueDate <= today ? '⚠️ Pending' : ''}</div>` : ''}
        </div>
        <div class="item-action">
          <div class="amt ${x.type === 'Diya' ? 'red' : 'green'}">${x.type === 'Diya' ? '-' : '+'} ${currSymbol}${x.amt}</div>
          <div class="btns">
            <button class="btn-icon" onclick="openReceipt(${x.id})">🧾</button>
            <button class="btn-icon btn-wa" onclick="sendWhatsApp('${x.name}', ${x.amt}, '${x.type}', '${x.date}', '${x.phone || ''}')">📲</button>
            <button class="btn-icon" onclick="openM('${x.tile}', ${x.id})">✏️</button>
            <button class="btn-icon" onclick="del(${x.id})">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('pList').innerHTML = listHTML(pShow);
  document.getElementById('bList').innerHTML = listHTML(bShow);
}

function exportData() {
  let blob = new Blob([JSON.stringify({ data, settings })], { type: 'application/json' });
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'khata_backup_global.json';
  a.click();
}

function importData(event) {
  let file = event.target.files[0];
  if (!file) return;
  let reader = new FileReader();
  reader.onload = function(e) {
    try {
      let imported = JSON.parse(e.target.result);
      data = imported.data || imported;
      settings = imported.settings || {};
      localStorage.setItem('akhata', JSON.stringify(data));
      localStorage.setItem('akhata_settings', JSON.stringify(settings));
      renderSettings();
      render();
      alert('Data imported successfully!');
    } catch (err) { alert('Invalid file format!'); }
  };
  reader.readAsText(file);
}

function clearData() {
  if (confirm('Are you sure you want to clear all data?')) {
    data = []; settings = {};
    localStorage.removeItem('akhata');
    localStorage.removeItem('akhata_settings');
    renderSettings();
    render();
  }
}

detectGlobalLocation();
autoDetectLanguage();
renderSettings();
render();
