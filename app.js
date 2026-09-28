/* =========================================================
   HISAB V7 — FINAL COMPATIBLE APP CONTROLLER
   Compatible with current index.html
   Personal + Business
   Udhaar | Transactions | Goals | Bills | EMI
   Reports | Reminders | Backup | PIN | Tools
   ========================================================= */

(function () {
  "use strict";

  const KEY = "hisab_v7_data";

  const DEFAULT = {
    mode: "personal",
    currency: "₹",
    language: "en",
    transactions: [],
    khata: [],
    business: [],
    goals: [],
    savings: [],
    budget: [],
    bills: [],
    loans: [],
    reminders: [],
    family: [],
    tools: [],
    pin: "",
    locked: false
  };

  let D = load();

  /* ================= BASIC ================= */

  function load() {
    try {
      const raw =
        localStorage.getItem(KEY) ||
        localStorage.getItem("hisab_v7_complete") ||
        localStorage.getItem("hisabData");

      if (!raw) return clone(DEFAULT);

      const x = JSON.parse(raw);

      return {
        ...clone(DEFAULT),
        ...x,
        transactions: Array.isArray(x.transactions) ? x.transactions : [],
        khata: Array.isArray(x.khata) ? x.khata : [],
        business: Array.isArray(x.business) ? x.business : [],
        goals: Array.isArray(x.goals) ? x.goals : [],
        savings: Array.isArray(x.savings) ? x.savings : [],
        budget: Array.isArray(x.budget) ? x.budget : [],
        bills: Array.isArray(x.bills) ? x.bills : [],
        loans: Array.isArray(x.loans) ? x.loans : [],
        reminders: Array.isArray(x.reminders) ? x.reminders : [],
        family: Array.isArray(x.family) ? x.family : [],
        tools: Array.isArray(x.tools) ? x.tools : []
      };
    } catch (e) {
      return clone(DEFAULT);
    }
  }

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function save() {
    try {
      const raw = JSON.stringify(D);
      localStorage.setItem(KEY, raw);
      localStorage.setItem("hisab_v7_complete", raw);
      localStorage.setItem("hisabData", raw);
    } catch (e) {
      console.error("HISAB save:", e);
    }
  }

  function id(prefix) {
    return prefix + "_" +
      Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 7);
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function money(v) {
    const n = num(v);

    let s = D.currency;

    if (s === "INR") s = "₹";
    if (s === "USD") s = "$";
    if (s === "EUR") s = "€";
    if (s === "GBP") s = "£";

    return s + n.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function notify(msg) {
    if (typeof window.showToast === "function") {
      window.showToast(msg);
    } else {
      alert(msg);
    }
  }

  function remove(arr, itemId) {
    const i = arr.findIndex(
      x => String(x.id) === String(itemId)
    );

    if (i >= 0) {
      arr.splice(i, 1);
      return true;
    }

    return false;
  }

  function get(id) {
    return document.getElementById(id);
  }

  /* ================= MODAL ================= */

  function modal(title, body, buttons) {
    get("hisabModal")?.remove();

    const m = document.createElement("div");
    m.id = "hisabModal";

    m.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(0,0,0,.55);
        display:flex;
        align-items:flex-end;
        justify-content:center;
        padding:12px;
      ">
        <div style="
          width:100%;
          max-width:520px;
          max-height:90vh;
          overflow:auto;
          background:white;
          border-radius:22px;
          padding:18px;
          box-sizing:border-box;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:12px;
          ">
            <h3 style="margin:0">${esc(title)}</h3>
            <button
              type="button"
              onclick="closeModal()"
              style="
                border:0;
                border-radius:50%;
                width:38px;
                height:38px;
              "
            >×</button>
          </div>

          ${body}

          <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:15px;
          ">
            ${buttons || ""}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(m);
  }

  window.closeModal = function () {
    get("hisabModal")?.remove();
  };

  function field(label, value, type, id) {
    return `
      <label style="display:block;margin:10px 0">
        <span style="display:block;margin-bottom:5px">
          ${esc(label)}
        </span>
        <input
          id="${esc(id)}"
          type="${type || "text"}"
          value="${esc(value || "")}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #ddd;
            border-radius:12px;
          "
        >
      </label>
    `;
  }

  function select(label, value, options, id) {
    return `
      <label style="display:block;margin:10px 0">
        <span style="display:block;margin-bottom:5px">
          ${esc(label)}
        </span>
        <select
          id="${esc(id)}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #ddd;
            border-radius:12px;
            background:white;
          "
        >
          ${options.map(o => `
            <option
              value="${esc(o.value)}"
              ${String(o.value) === String(value) ? "selected" : ""}
            >
              ${esc(o.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `;
  }

  function button(text, action) {
    return `
      <button
        type="button"
        onclick="${action}"
        style="
          flex:1;
          min-width:110px;
          border:0;
          border-radius:12px;
          padding:12px;
          background:#0b6b68;
          color:white;
          font-weight:700;
        "
      >${esc(text)}</button>
    `;
  }

  /* ================= NAVIGATION ================= */

  window.show = function (name) {
    document.querySelectorAll(".page").forEach(p => {
      p.classList.remove("active");
      p.style.display = "none";
    });

    const p = get(name);

    if (!p) return;

    p.classList.add("active");
    p.style.display = "";

    if (name === "home") renderHome();
    if (name === "personal") renderPersonal();
    if (name === "business") renderBusiness();
    if (name === "transactions") renderTransactions();
    if (name === "planning") renderPlanning();
    if (name === "credit") renderCredit();
    if (name === "reports") renderReports();
    if (name === "reminders") renderReminders();
    if (name === "privacy") renderPrivacy();
    if (name === "family") renderFamily();
    if (name === "familytools") renderFamilyTools();
    if (name === "tools13") renderTools();
    if (name === "final") renderSettings();

    setTimeout(() => {
      if (typeof window.repairBackButtons === "function") {
        window.repairBackButtons();
      }
    }, 50);
  };

  window.goBack = function () {
    const p = document.querySelector(".page.active");
    const current = p ? p.id : "";

    if (
      current === "khataEntry" ||
      current === "khataDetail" ||
      current === "transactions" ||
      current === "planning" ||
      current === "credit" ||
      current === "reports" ||
      current === "reminders" ||
      current === "privacy" ||
      current === "family" ||
      current === "familytools" ||
      current === "tools13" ||
      current === "final"
    ) {
      show(D.mode === "business" ? "business" : "personal");
      return;
    }

    if (current === "personal" || current === "business") {
      show("home");
      return;
    }

    if (current === "home") return;

    show("home");
  };

  window.closeKhataDetail = function () {
    show(D.mode === "business" ? "business" : "personal");
  };

  window.closeKhataForm = function () {
    show(D.mode === "business" ? "business" : "personal");
  };

  /* ================= MODE ================= */

  window.setMode = function (mode) {
    D.mode = mode === "business" ? "business" : "personal";
    save();
    show(D.mode);
  };

  /* ================= GUEST ================= */

  window.enterGuestMode = function () {
    const gate = get("guestGate");
    if (gate) gate.style.display = "none";

    const shell = get("appShell");
    if (shell) shell.style.display = "";

    show("welcome");
  };

  window.showGuestGate = function () {
    const gate = get("guestGate");
    const shell = get("appShell");

    if (gate) gate.style.display = "";
    if (shell) shell.style.display = "none";
  };

  /* ================= HOME ================= */

  function personalTransactions() {
    return D.transactions.filter(x => x.mode === "personal");
  }

  function personalKhata() {
    return D.khata.filter(x => x.mode === "personal");
  }

  function businessKhata() {
    return D.khata.filter(x => x.mode === "business");
  }

  function sumTransactions(type, mode) {
    return D.transactions
      .filter(x => x.type === type && x.mode === mode)
      .reduce((a, x) => a + num(x.amount), 0);
  }

  function sumKhata(type, mode, pendingOnly) {
    return D.khata
      .filter(x =>
        x.mode === mode &&
        x.type === type &&
        (!pendingOnly || x.status !== "settled")
      )
      .reduce((a, x) => a + num(x.amount), 0);
  }

  function renderHome() {
    const income = sumTransactions("income", "personal");
    const expense = sumTransactions("expense", "personal");
    const give = sumKhata("give", "personal", true);
    const receive = sumKhata("receive", "personal", true);

    const r = get("receivable");
    const p = get("payable");
    const b = get("homeBalance");
    const mode = get("modeLabel");

    if (r) r.textContent = money(receive);
    if (p) p.textContent = money(give);
    if (b) b.textContent = money(income - expense);
    if (mode) mode.textContent = "Personal";

    const old = get("homeExtra");
    if (old) old.remove();

    const home = get("home");

    if (!home) return;

    const box = document.createElement("div");
    box.id = "homeExtra";
    box.style.padding = "12px";

    box.innerHTML = `
      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-top:10px;
      ">
        <div class="summary-card">
          <small>Income</small>
          <strong>${money(income)}</strong>
        </div>

        <div class="summary-card">
          <small>Expense</small>
          <strong>${money(expense)}</strong>
        </div>

        <div class="summary-card">
          <small>Give</small>
          <strong>${money(give)}</strong>
        </div>

        <div class="summary-card">
          <small>Receive</small>
          <strong>${money(receive)}</strong>
        </div>
      </div>
    `;

    home.appendChild(box);
  }

  /* ================= TRANSACTIONS ================= */

  window.addTransaction = function () {
    const type = get("transactionType")?.value || "expense";
    const amount = num(get("transactionAmount")?.value);
    const category = get("transactionCategory")?.value.trim() || "General";
    const note = get("transactionNote")?.value.trim() || "";
    const date = get("transactionDate")?.value || today();

    if (amount <= 0) {
      notify("Amount enter karein");
      return;
    }

    D.transactions.unshift({
      id: id("tx"),
      mode: D.mode,
      type,
      amount,
      category,
      note,
      date
    });

    save();

    if (get("transactionAmount")) get("transactionAmount").value = "";
    if (get("transactionCategory")) get("transactionCategory").value = "";
    if (get("transactionNote")) get("transactionNote").value = "";

    renderTransactions();
    notify("Transaction save ho gaya");
  };

  function renderTransactions() {
    const box = get("transactionList");
    if (!box) return;

    const list = D.transactions
      .filter(x => x.mode === D.mode)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    box.innerHTML = list.length
      ? list.map(x => `
        <div style="
          padding:14px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:15px;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
          ">
            <b>${esc(x.category)}</b>
            <b>${money(x.amount)}</b>
          </div>

          <small>
            ${esc(x.type)} • ${esc(x.date)}
          </small>

          <div>${esc(x.note)}</div>

          <div style="margin-top:8px">
            <button onclick="editTransaction('${x.id}')">
              Edit
            </button>

            <button onclick="deleteTransaction('${x.id}')">
              Delete
            </button>
          </div>
        </div>
      `).join("")
      : `<p style="text-align:center;padding:25px">
          No transactions yet.
        </p>`;
  }

  window.editTransaction = function (itemId) {
    const x = D.transactions.find(a => a.id === itemId);
    if (!x) return;

    modal(
      "Edit Transaction",
      `
        ${select(
          "Type",
          x.type,
          [
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" }
          ],
          "eType"
        )}

        ${field("Amount", x.amount, "number", "eAmount")}
        ${field("Category", x.category, "text", "eCategory")}
        ${field("Date", x.date, "date", "eDate")}
        ${field("Note", x.note, "text", "eNote")}
      `,
      button("Update", `updateTransaction('${x.id}')`)
    );
  };

  window.updateTransaction = function (itemId) {
    const x = D.transactions.find(a => a.id === itemId);
    if (!x) return;

    x.type = get("eType")?.value || x.type;
    x.amount = num(get("eAmount")?.value);
    x.category = get("eCategory")?.value.trim() || "General";
    x.date = get("eDate")?.value || today();
    x.note = get("eNote")?.value.trim() || "";

    if (x.amount <= 0) {
      notify("Amount enter karein");
      return;
    }

    save();
    closeModal();
    renderTransactions();
  };

  window.deleteTransaction = function (itemId) {
    if (!confirm("Transaction delete karein?")) return;

    remove(D.transactions, itemId);
    save();
    renderTransactions();
  };

  /* ================= QUICK ADD ================= */

  window.openQuickAdd = function () {
    modal(
      "Quick Add",
      `
        <button onclick="quickIncome();closeModal()">
          ＋ Income
        </button>

        <button onclick="quickExpense();closeModal()">
          － Expense
        </button>

        <button onclick="openKhataForm('give')">
          Give Udhar
        </button>

        <button onclick="openKhataForm('receive')">
          Receive Udhar
        </button>

        <button onclick="show('credit');closeModal()">
          Payments
        </button>
      `,
      ""
    );
  };

  window.quickIncome = function () {
    const e = get("transactionType");
    if (e) e.value = "income";

    show("transactions");

    setTimeout(() => {
      get("transactionAmount")?.focus();
    }, 100);
  };

  window.quickExpense = function () {
    const e = get("transactionType");
    if (e) e.value = "expense";

    show("transactions");

    setTimeout(() => {
      get("transactionAmount")?.focus();
    }, 100);
  };

  /* ================= UDHAR ================= */

  const METHODS = [
    { value: "Cash", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Debit Card", label: "Debit Card" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "Wallet", label: "Wallet" },
    { value: "Cheque", label: "Cheque" },
    { value: "Other", label: "Other" }
  ];

  window.openKhataForm = function (type = "give", itemId = "") {
    let x = null;

    if (itemId) {
      x = D.khata.find(a => a.id === itemId);
    }

    if (type === "personal" || type === "business") {
      D.mode = type;
      type = "give";
    }

    modal(
      itemId ? "Edit Udhar" : "Add Udhar",
      `
        ${field(
          "Person / Customer",
          x?.person || "",
          "text",
          "kPerson"
        )}

        ${select(
          "Entry Type",
          x?.type || type,
          [
            { value: "give", label: "Give" },
            { value: "receive", label: "Receive" }
          ],
          "kType"
        )}

        ${field(
          "Amount",
          x?.amount || "",
          "number",
          "kAmount"
        )}

        ${field(
          "Date",
          x?.date || today(),
          "date",
          "kDate"
        )}

        ${select(
          "Payment Method",
          x?.paymentMethod || "Cash",
          METHODS,
          "kMethod"
        )}

        ${select(
          "Status",
          x?.status || "pending",
          [
            { value: "pending", label: "Pending" },
            { value: "settled", label: "Settled" }
          ],
          "kStatus"
        )}

        ${field(
          "Note",
          x?.note || "",
          "text",
          "kNote"
        )}
      `,
      button(
        itemId ? "Update" : "Save",
        `saveKhataEntry('${itemId}')`
      )
    );
  };

  window.saveKhataEntry = function (itemId = "") {
    const person = get("kPerson")?.value.trim() || "";
    const type = get("kType")?.value || "give";
    const amount = num(get("kAmount")?.value);
    const date = get("kDate")?.value || today();
    const paymentMethod = get("kMethod")?.value || "Cash";
    const status = get("kStatus")?.value || "pending";
    const note = get("kNote")?.value.trim() || "";

    if (!person) {
      notify("Name enter karein");
      return;
    }

    if (amount <= 0) {
      notify("Amount enter karein");
      return;
    }

    if (itemId) {
      const x = D.khata.find(a => a.id === itemId);

      if (x) {
        x.person = person;
        x.type = type;
        x.amount = amount;
        x.date = date;
        x.paymentMethod = paymentMethod;
        x.status = status;
        x.note = note;
      }
    } else {
      D.khata.unshift({
        id: id("kh"),
        mode: D.mode,
        person,
        type,
        amount,
        date,
        paymentMethod,
        status,
        note,
        history: []
      });
    }

    save();
    closeModal();

    if (D.mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }

    notify("Udhar save ho gaya");
  };

  window.deleteKhata = function (itemId) {
    if (!confirm("Udhar entry delete karein?")) return;

    remove(D.khata, itemId);
    save();

    D.mode === "business"
      ? renderBusiness()
      : renderPersonal();
  };

  window.settleKhata = function (itemId) {
    const x = D.khata.find(a => a.id === itemId);
    if (!x) return;

    x.status = "settled";

    x.history = x.history || [];

    x.history.push({
      id: id("pay"),
      date: today(),
      amount: x.amount,
      type: "settled"
    });

    save();

    D.mode === "business"
      ? renderBusiness()
      : renderPersonal();
  };

  function renderKhataList(list, targetId) {
    const box = get(targetId);
    if (!box) return;

    box.innerHTML = list.length
      ? list.map(x => {
          const color =
            x.type === "give" ? "#c62828" : "#168447";

          return `
            <div style="
              padding:14px;
              margin:8px 0;
              border:1px solid #ddd;
              border-radius:15px;
            ">
              <div style="
                display:flex;
                justify-content:space-between;
              ">
                <b>${esc(x.person)}</b>

                <strong style="color:${color}">
                  ${x.type === "give" ? "Give" : "Receive"}
                  ${money(x.amount)}
                </strong>
              </div>

              <small>
                ${esc(x.date)} •
                ${esc(x.paymentMethod)} •
                ${esc(x.status)}
              </small>

              <div>${esc(x.note)}</div>

              <div style="margin-top:8px">
                <button
                  onclick="openKhataForm('${x.type}','${x.id}')">
                  Edit
                </button>

                <button
                  onclick="deleteKhata('${x.id}')">
                  Delete
                </button>

                ${
                  x.status !== "settled"
                    ? `<button
                        onclick="settleKhata('${x.id}')">
                        Settle
                       </button>`
                    : ""
                }

                <button
                  onclick="openKhataDetail('${x.person}','${x.mode}')">
                  History
                </button>
              </div>
            </div>
          `;
        }).join("")
      : `<p style="text-align:center;padding:25px">
          No Udhar entries.
        </p>`;
  }

  window.openKhataDetail = function (person, mode) {
    D.mode = mode === "business" ? "business" : "personal";

    show("khataDetail");

    const title = get("detailPersonName");
    if (title) title.textContent = person;

    renderDetail(person);
  };

  function renderDetail(person) {
    const list = D.khata.filter(
      x => x.mode === D.mode && x.person === person
    );

    const give = list
      .filter(x => x.type === "give")
      .reduce((a, x) => a + num(x.amount), 0);

    const receive = list
      .filter(x => x.type === "receive")
      .reduce((a, x) => a + num(x.amount), 0);

    const dg = get("detailGive");
    const dr = get("detailReceive");
    const db = get("detailBalance");

    if (dg) dg.textContent = money(give);
    if (dr) dr.textContent = money(receive);
    if (db) db.textContent = money(give - receive);

    const box = get("khataHistory");
    if (!box) return;

    box.innerHTML = list.length
      ? list.map(x => `
        <div style="
          padding:12px;
          border-bottom:1px solid #ddd;
        ">
          <b style="
            color:${x.type === "give" ? "#c62828" : "#168447"};
          ">
            ${x.type === "give" ? "Give" : "Receive"}
            ${money(x.amount)}
          </b>

          <div>
            ${esc(x.date)} •
            ${esc(x.paymentMethod)}
          </div>

          <small>
            ${esc(x.status)} • ${esc(x.note)}
          </small>
        </div>
      `).join("")
      : "<p>No history.</p>";
  }

  window.detailFilter = function () {
    const person = get("detailPersonName")?.textContent || "";
    renderDetail(person);
  };

  window.openPaymentEntry = function () {
    const person = get("detailPersonName")?.textContent || "";

    openKhataForm("receive");

    setTimeout(() => {
      if (get("kPerson")) {
        get("kPerson").value = person;
      }
    }, 50);
  };

  window.shareKhata = function () {
    const person = get("detailPersonName")?.textContent || "Khata";

    const text =
      "HISAB Udhar\n" +
      person + "\n\n" +
      "Give: " + get("detailGive")?.textContent + "\n" +
      "Receive: " + get("detailReceive")?.textContent + "\n" +
      "Balance: " + get("detailBalance")?.textContent;

    if (navigator.share) {
      navigator.share({
        title: "HISAB Udhar",
        text
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      notify("Summary copy ho gaya");
    }
  };

  window.exportKhataPDF = function () {
    exportSummaryPDF();
  };

  /* ================= PERSONAL ================= */

  function renderPersonal() {
    const list = personalKhata();

    const give = list
      .filter(x => x.type === "give" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);

    const receive = list
      .filter(x => x.type === "receive" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);

    if (get("ledgerGiven"))
      get("ledgerGiven").textContent = money(give);

    if (get("ledgerReceived"))
      get("ledgerReceived").textContent = money(receive);

    if (get("ledgerNet"))
      get("ledgerNet").textContent = money(give - receive);

    renderKhataList(list, "personalList");
  }

  window.searchKhata = function (mode) {
    const value =
      get(mode === "business"
        ? "businessSearch"
        : "personalSearch")?.value
        .trim()
        .toLowerCase() || "";

    const list = D.khata.filter(x =>
      x.mode === mode &&
      (
        !value ||
        String(x.person).toLowerCase().includes(value) ||
        String(x.note).toLowerCase().includes(value)
      )
    );

    renderKhataList(
      list,
      mode === "business"
        ? "businessList"
        : "personalList"
    );
  };

  window.filterKhata = function (mode, filter) {
    let list = D.khata.filter(x => x.mode === mode);

    if (filter === "give" || filter === "receive") {
      list = list.filter(x => x.type === filter);
    }

    if (filter === "pending") {
      list = list.filter(x => x.status !== "settled");
    }

    renderKhataList(
      list,
      mode === "business"
        ? "businessList"
        : "personalList"
    );
  };

  /* ================= BUSINESS ================= */

  window.addBusinessCustomer = function () {
    openBusinessForm("customer");
  };

  window.addBusinessSupplier = function () {
    openBusinessForm("supplier");
  };

  function openBusinessForm(type) {
    modal(
      type === "customer"
        ? "Add Customer"
        : "Add Supplier",
      `
        ${field("Name", "", "text", "bName")}
        ${field("Phone", "", "tel", "bPhone")}
        ${field("Note", "", "text", "bNote")}
      `,
      button(
        "Save",
        `saveBusiness('${type}')`
      )
    );
  }

  window.saveBusiness = function (type) {
    const name = get("bName")?.value.trim() || "";
    const phone = get("bPhone")?.value.trim() || "";
    const note = get("bNote")?.value.trim() || "";

    if (!name) {
      notify("Name enter karein");
      return;
    }

    D.business.unshift({
      id: id("biz"),
      mode: "business",
      type,
      name,
      phone,
      note
    });

    save();
    closeModal();
    renderBusiness();
  };

  window.businessFilter = function (type) {
    const box = get("businessList");
    if (!box) return;

    if (type === "customer" || type === "supplier") {
      const list = D.business.filter(
        x => x.mode === "business" && x.type === type
      );

      box.innerHTML = list.length
        ? list.map(x => `
          <div style="
            padding:14px;
            margin:8px 0;
            border:1px solid #ddd;
            border-radius:15px;
          ">
            <b>${esc(x.name)}</b>
            <div>${esc(x.phone)}</div>
            <small>${esc(x.note)}</small>

            <div style="margin-top:8px">
              <button onclick="editBusiness('${x.id}')">
                Edit
              </button>
              <button onclick="deleteBusiness('${x.id}')">
                Delete
              </button>
            </div>
          </div>
        `).join("")
        : "<p>No records.</p>";

      return;
    }

    if (type === "sales") {
      renderKhataList(
        D.khata.filter(
          x => x.mode === "business" && x.type === "receive"
        ),
        "businessList"
      );
      return;
    }

    if (type === "purchase") {
      renderKhataList(
        D.khata.filter(
          x => x.mode === "business" && x.type === "give"
        ),
        "businessList"
      );
    }
  };

  window.editBusiness = function (itemId) {
    const x = D.business.find(a => a.id === itemId);
    if (!x) return;

    modal(
      "Edit " + x.type,
      `
        ${field("Name", x.name, "text", "ebName")}
        ${field("Phone", x.phone, "tel", "ebPhone")}
        ${field("Note", x.note, "text", "ebNote")}
      `,
      button("Update", `updateBusiness('${x.id}')`)
    );
  };

  window.updateBusiness = function (itemId) {
    const x = D.business.find(a => a.id === itemId);
    if (!x) return;

    x.name = get("ebName")?.value.trim() || "";
    x.phone = get("ebPhone")?.value.trim() || "";
    x.note = get("ebNote")?.value.trim() || "";

    save();
    closeModal();
    renderBusiness();
  };

  window.deleteBusiness = function (itemId) {
    if (!confirm("Record delete karein?")) return;

    remove(D.business, itemId);
    save();
    renderBusiness();
  };

  function renderBusiness() {
    const list = businessKhata();

    const give = list
      .filter(x => x.type === "give" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);

    const receive = list
      .filter(x => x.type === "receive" && x.status !== "settled")
      .reduce((a, x) => a + num(x.amount), 0);

    if (get("businessGiven"))
      get("businessGiven").textContent = money(give);

    if (get("businessReceived"))
      get("businessReceived").textContent = money(receive);

    if (get("businessNet"))
      get("businessNet").textContent = money(give - receive);

    renderKhataList(list, "businessList");
  }

  /* ================= PLANNING ================= */

  window.calcBudget = function () {
    const amount = num(get("budgetAmount")?.value);

    if (amount <= 0) {
      notify("Budget amount enter karein");
      return;
    }

    D.budget.unshift({
      id: id("budget"),
      mode: D.mode,
      amount,
      date: today()
    });

    save();
    renderPlanning();
    notify("Budget save ho gaya");
  };

  window.calcGoal = function () {
    const name = get("goalName")?.value.trim() || "";
    const target = num(get("goalTarget")?.value);
    const saved = num(get("goalSaved")?.value);
    const date = get("goalDate")?.value || "";

    if (!name || target <= 0) {
      notify("Goal details enter karein");
      return;
    }

    D.goals.unshift({
      id: id("goal"),
      mode: D.mode,
      name,
      target,
      saved,
      date
    });

    save();
    renderPlanning();
    notify("Goal save ho gaya");
  };

  window.deleteGoal = function (itemId) {
    if (!confirm("Goal delete karein?")) return;

    remove(D.goals, itemId);
    save();
    renderPlanning();
  };

  function renderPlanning() {
    const box = get("goalList");
    if (!box) return;

    const goals = D.goals.filter(x => x.mode === D.mode);

    box.innerHTML = `
      <div style="padding:10px">
        ${
          D.budget
            .filter(x => x.mode === D.mode)
            .slice(0, 1)
            .map(x => `
              <div class="summary-card">
                <small>Monthly Budget</small>
                <strong>${money(x.amount)}</strong>
              </div>
            `).join("")
        }

        ${
          goals.length
            ? goals.map(x => {
                const percent =
                  x.target > 0
                    ? Math.min(
                        100,
                        Math.round(x.saved / x.target * 100)
                      )
                    : 0;

                return `
                  <div style="
                    padding:14px;
                    margin:8px 0;
                    border:1px solid #ddd;
                    border-radius:15px;
                  ">
                    <b>${esc(x.name)}</b>

                    <div>
                      ${money(x.saved)}
                      / ${money(x.target)}
                    </div>

                    <div style="
                      height:8px;
                      background:#eee;
                      border-radius:8px;
                      margin:8px 0;
                    ">
                      <div style="
                        width:${percent}%;
                        height:100%;
                        background:#0b6b68;
                        border-radius:8px;
                      "></div>
                    </div>

                    <small>${percent}%</small>

                    <button
                      onclick="deleteGoal('${x.id}')">
                      Delete
                    </button>
                  </div>
                `;
              }).join("")
            : "<p>No goals yet.</p>"
        }
      </div>
    `;
  }

  /* ================= BILLS ================= */

  window.addBill = function (kind) {
    let name = "";
    let amount = 0;
    let due = "";

    if (kind === "Credit Card") {
      name = "Credit Card";
      amount = num(get("cardBill")?.value);
      due = get("cardDue")?.value || "";
    } else {
      name = get("billName")?.value.trim() || "";
      amount = num(get("billAmount")?.value);
      due = get("billDue")?.value || "";
    }

    if (!name || amount <= 0) {
      notify("Bill details enter karein");
      return;
    }

    D.bills.unshift({
      id: id("bill"),
      mode: D.mode,
      name,
      kind,
      amount,
      due,
      status: "pending",
      history: []
    });

    save();
    renderCredit();
    notify("Bill save ho gaya");
  };

  window.editBill = function (itemId) {
    const x = D.bills.find(a => a.id === itemId);
    if (!x) return;

    modal(
      "Edit Bill",
      `
        ${field("Name", x.name, "text", "ebillName")}
        ${field("Amount", x.amount, "number", "ebillAmount")}
        ${field("Due Date", x.due, "date", "ebillDue")}

        ${select(
          "Status",
          x.status,
          [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" }
          ],
          "ebillStatus"
        )}
      `,
      button("Update", `updateBill('${x.id}')`)
    );
  };

  window.updateBill = function (itemId) {
    const x = D.bills.find(a => a.id === itemId);
    if (!x) return;

    x.name = get("ebillName")?.value.trim() || "";
    x.amount = num(get("ebillAmount")?.value);
    x.due = get("ebillDue")?.value || "";
    x.status = get("ebillStatus")?.value || "pending";

    save();
    closeModal();
    renderCredit();
  };

  window.payBill = function (itemId) {
    const x = D.bills.find(a => a.id === itemId);
    if (!x) return;

    x.status = "paid";
    x.history = x.history || [];

    x.history.push({
      date: today(),
      amount: x.amount,
      status: "paid"
    });

    save();
    renderCredit();
  };

  window.deleteBill = function (itemId) {
    if (!confirm("Bill delete karein?")) return;

    remove(D.bills, itemId);
    save();
    renderCredit();
  };

  function renderCredit() {
    const box = get("billList");
    if (!box) return;

    const list = D.bills.filter(x => x.mode === D.mode);

    box.innerHTML = list.length
      ? list.map(x => `
        <div style="
          padding:14px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:15px;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
          ">
            <b>${esc(x.name)}</b>
            <strong>${money(x.amount)}</strong>
          </div>

          <small>
            ${esc(x.kind)} • Due ${esc(x.due)}
          </small>

          <div>
            Status:
            <b>${esc(x.status)}</b>
          </div>

          <div style="margin-top:8px">
            <button onclick="editBill('${x.id}')">
              Edit
            </button>

            ${
              x.status !== "paid"
                ? `<button onclick="payBill('${x.id}')">
                    Mark Paid
                   </button>`
                : ""
            }

            <button onclick="deleteBill('${x.id}')">
              Delete
            </button>
          </div>
        </div>
      `).join("")
      : "<p>No bills yet.</p>";
  }

  /* ================= EMI ================= */

  window.calcEMI = function () {
    const principal = num(get("emiPrincipal")?.value);
    const rate = num(get("emiRate")?.value);
    const months = Math.floor(num(get("emiMonths")?.value));

    if (principal <= 0 || months <= 0) {
      notify("Loan amount aur tenure enter karein");
      return;
    }

    const monthlyRate = rate / 12 / 100;

    let emi;

    if (monthlyRate === 0) {
      emi = principal / months;
    } else {
      emi =
        principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    const result = get("emiResult");

    if (result) {
      result.innerHTML = `
        <div style="
          padding:14px;
          margin-top:10px;
          border-radius:14px;
          background:#eef8f4;
        ">
          <b>Monthly EMI</b>
          <div style="font-size:24px">
            ${money(emi)}
          </div>

          <button onclick="
            saveLoan(${principal},${rate},${months},${emi})
          ">
            Save Loan
          </button>
        </div>
      `;
    }
  };

  window.saveLoan = function (
    principal,
    rate,
    months,
    emi
  ) {
    D.loans.unshift({
      id: id("loan"),
      mode: D.mode,
      name: "Loan / EMI",
      principal,
      rate,
      months,
      emi,
      paid: 0,
      paidHistory: [],
      due: "",
      status: "pending",
      created: today()
    });

    save();
    renderCredit();
    notify("Loan save ho gaya");
  };

  window.deleteLoan = function (itemId) {
    if (!confirm("Loan delete karein?")) return;

    remove(D.loans, itemId);
    save();
    renderCredit();
  };

  window.payLoan = function (itemId) {
    const x = D.loans.find(a => a.id === itemId);
    if (!x) return;

    x.paid = Math.min(
      num(x.principal),
      num(x.paid) + num(x.emi)
    );

    x.paidHistory = x.paidHistory || [];

    x.paidHistory.push({
      date: today(),
      amount: x.emi
    });

    if (x.paid >= x.principal) {
      x.status = "paid";
    }

    save();
    renderCredit();
  };

  /* ================= REMINDERS ================= */

  window.addReminder = function () {
    const name = get("reminderName")?.value.trim() || "";
    const date = get("reminderDate")?.value || "";

    if (!name || !date) {
      notify("Reminder details enter karein");
      return;
    }

    D.reminders.unshift({
      id: id("rem"),
      mode: D.mode,
      name,
      date,
      done: false
    });

    save();
    renderReminders();
    notify("Reminder save ho gaya");
  };

  window.openReminderForm = function (itemId = "") {
    const x = D.reminders.find(a => a.id === itemId);

    modal(
      itemId ? "Edit Reminder" : "Add Reminder",
      `
        ${field(
          "Reminder",
          x?.name || "",
          "text",
          "rName"
        )}

        ${field(
          "Date",
          x?.date || today(),
          "date",
          "rDate"
        )}
      `,
      button(
        itemId ? "Update" : "Save",
        `saveReminder('${itemId}')`
      )
    );
  };

  window.saveReminder = function (itemId = "") {
    const name = get("rName")?.value.trim() || "";
    const date = get("rDate")?.value || today();

    if (!name) {
      notify("Reminder name enter karein");
      return;
    }

    if (itemId) {
      const x = D.reminders.find(a => a.id === itemId);

      if (x) {
        x.name = name;
        x.date = date;
      }
    } else {
      D.reminders.unshift({
        id: id("rem"),
        mode: D.mode,
        name,
        date,
        done: false
      });
    }

    save();
    closeModal();
    renderReminders();
  };

  window.doneReminder = function (itemId) {
    const x = D.reminders.find(a => a.id === itemId);
    if (!x) return;

    x.done = !x.done;
    save();
    renderReminders();
  };

  window.deleteReminder = function (itemId) {
    if (!confirm("Reminder delete karein?")) return;

    remove(D.reminders, itemId);
    save();
    renderReminders();
  };

  function renderReminders() {
    const box = get("reminderList");
    if (!box) return;

    const list = D.reminders.filter(x => x.mode === D.mode);

    box.innerHTML = list.length
      ? list.map(x => `
        <div style="
          padding:14px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:15px;
        ">
          <b style="
            text-decoration:${x.done ? "line-through" : "none"};
          ">
            ${esc(x.name)}
          </b>

          <div>${esc(x.date)}</div>

          <button onclick="doneReminder('${x.id}')">
            ${x.done ? "Undo" : "Done"}
          </button>

          <button onclick="openReminderForm('${x.id}')">
            Edit
          </button>

          <button onclick="deleteReminder('${x.id}')">
            Delete
          </button>
        </div>
      `).join("")
      : "<p>No reminders.</p>";
  }

  /* ================= REPORTS ================= */

  function renderReports() {
    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    D.transactions
      .filter(x => x.mode === D.mode)
      .forEach(x => {
        if (x.type === "income") income += num(x.amount);
        if (x.type === "expense") expense += num(x.amount);
      });

    D.khata
      .filter(x => x.mode === D.mode)
      .forEach(x => {
        if (x.type === "give") give += num(x.amount);
        if (x.type === "receive") receive += num(x.amount);
      });

    if (get("reportIncome"))
      get("reportIncome").textContent = money(income);

    if (get("reportExpense"))
      get("reportExpense").textContent = money(expense);

    if (get("reportGive"))
      get("reportGive").textContent = money(give);

    if (get("reportReceive"))
      get("reportReceive").textContent = money(receive);

    const box = get("reportContent");

    if (box) {
      box.innerHTML = `
        <div style="padding:12px">
          <div class="summary-card">
            <b>Net Cashflow</b>
            <h2>${money(income - expense)}</h2>
          </div>

          <div class="summary-card">
            <b>Udhar Balance</b>
            <h2>${money(give - receive)}</h2>
          </div>

          <p>
            Transactions:
            ${D.transactions.filter(x => x.mode === D.mode).length}
          </p>

          <p>
            Udhar Entries:
            ${D.khata.filter(x => x.mode === D.mode).length}
          </p>

          <p>
            Bills:
            ${D.bills.filter(x => x.mode === D.mode).length}
          </p>

          <p>
            Loans:
            ${D.loans.filter(x => x.mode === D.mode).length}
          </p>
        </div>
      `;
    }
  }

  /* ================= PDF / SHARE ================= */

  function reportText() {
    let text = "HISAB MONEY MANAGER\n";
    text += "========================\n\n";

    let income = 0;
    let expense = 0;

    D.transactions
      .filter(x => x.mode === D.mode)
      .forEach(x => {
        if (x.type === "income") income += num(x.amount);
        if (x.type === "expense") expense += num(x.amount);
      });

    text += "Income: " + money(income) + "\n";
    text += "Expense: " + money(expense) + "\n";
    text += "Balance: " + money(income - expense) + "\n\n";

    text += "UDHAR\n";
    text += "========================\n";

    D.khata
      .filter(x => x.mode === D.mode)
      .slice(0, 100)
      .forEach(x => {
        text +=
          x.date + " | " +
          x.person + " | " +
          x.type + " | " +
          money(x.amount) + " | " +
          x.status + "\n";
      });

    text += "\nTRANSACTIONS\n";
    text += "========================\n";

    D.transactions
      .filter(x => x.mode === D.mode)
      .slice(0, 100)
      .forEach(x => {
        text +=
          x.date + " | " +
          x.type + " | " +
          x.category + " | " +
          money(x.amount) + "\n";
      });

    return text;
  }

  window.exportSummary = function () {
    const text = reportText();

    if (navigator.share) {
      navigator.share({
        title: "HISAB Summary",
        text
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      notify("Summary copy ho gaya");
    }
  };

  window.exportSummaryPDF = function () {
    const text = reportText()
      .replace(/₹/g, "INR ");

    const lines = text
      .split("\n")
      .map(x =>
        x.replace(/[^\x20-\x7E]/g, "")
      );

    const stream =
      "BT\n" +
      "/F1 9 Tf\n" +
      "40 800 Td\n" +
      "12 TL\n" +
      lines.map(x =>
        "(" +
        x.replace(/[()\\]/g, "\\$&") +
        ") Tj T*\n"
      ).join("") +
      "ET";

    const objects = [
      `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`,

      `2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`,

      `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Resources << /Font << /F1 5 0 R >> >>
/Contents 4 0 R
>>
endobj`,

      `4 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj`,

      `5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach(o => {
      offsets.push(pdf.length);
      pdf += o + "\n";
    });

    const start = pdf.length;

    pdf +=
      `xref\n0 6\n` +
      `0000000000 65535 f \n`;

    for (let i = 1; i < offsets.length; i++) {
      pdf +=
        String(offsets[i]).padStart(10, "0") +
        " 00000 n \n";
    }

    pdf +=
      `trailer
<< /Size 6 /Root 1 0 R >>
startxref
${start}
%%EOF`;

    const blob = new Blob(
      [pdf],
      { type: "application/pdf" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      "HISAB-Report-" + today() + ".pdf";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      2000
    );

    notify("PDF ready hai");
  };

  window.sharePDF = function () {
    exportSummary();
  };

  /* ================= BACKUP ================= */

  window.exportBackup = function () {
    const blob = new Blob(
      [JSON.stringify(D, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      "HISAB-Backup-" + today() + ".json";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      2000
    );

    notify("Backup ready hai");
  };

  window.importBackup = function (event) {
    const file = event?.target?.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
      try {
        const x = JSON.parse(reader.result);

        D = {
          ...clone(DEFAULT),
          ...x
        };

        save();

        notify("Backup restore ho gaya");
        show("home");
      } catch (e) {
        notify("Backup file valid nahi hai");
      }
    };

    reader.readAsText(file);
  };

  /* ================= SECURITY ================= */

  window.setPin = function () {
    const p = get("pinInput")?.value || "";

    if (!/^\d{4,6}$/.test(p)) {
      notify("PIN 4 se 6 digit ka hona chahiye");
      return;
    }

    D.pin = p;
    D.locked = false;

    save();

    if (get("pinInput")) {
      get("pinInput").value = "";
    }

    notify("PIN save ho gaya");
  };

  window.setPIN = window.setPin;

  window.lockApp = function () {
    if (!D.pin) {
      notify("Pehle PIN set karein");
      return;
    }

    D.locked = true;
    save();

    alert("HISAB locked hai. App dobara kholkar PIN enter karein.");
  };

  window.unlockApp = function () {
    if (!D.pin) return true;

    const p = prompt("HISAB PIN enter karein:");

    if (p === D.pin) {
      D.locked = false;
      save();
      return true;
    }

    notify("Wrong PIN");
    return false;
  };

  /* ================= LANGUAGE / CURRENCY ================= */

  window.toggleLanguage = function () {
    D.language = D.language === "en" ? "hi" : "en";
    save();

    notify(
      D.language === "hi"
        ? "Hindi selected"
        : "English selected"
    );
  };

  window.toggleCurrency = function () {
    const list = ["₹", "$", "€", "£"];
    const i = list.indexOf(D.currency);

    D.currency =
      list[(i + 1) % list.length];

    save();

    show(
      document.querySelector(".page.active")?.id ||
      "home"
    );
  };

  window.setLanguage = function (x) {
    D.language = x === "hi" ? "hi" : "en";
    save();
    renderSettings();
  };

  window.setCurrency = function (x) {
    D.currency = x;
    save();
    renderSettings();
  };

  /* ================= PRIVACY ================= */

  function renderPrivacy() {
    const box = get("privacy");
    if (!box) return;

    const old = get("privacyInfo");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "privacyInfo";
    div.style.padding = "12px";

    div.innerHTML = `
      <div class="form-card">
        <h3>Privacy</h3>
        <p>
          HISAB app data device ke local storage
          mein save hota hai.
        </p>
        <p>
          Login required nahi hai.
        </p>
        <p>
          Backup tabhi create hota hai jab aap
          manually Backup choose karte hain.
        </p>
      </div>
    `;

    box.appendChild(div);
  }

  /* ================= FAMILY ================= */

  window.addFamilyMember = function () {
    const name = get("familyName")?.value.trim() || "";

    if (!name) {
      notify("Name enter karein");
      return;
    }

    D.family.unshift({
      id: id("family"),
      name,
      relation: "",
      phone: ""
    });

    save();

    if (get("familyName"))
      get("familyName").value = "";

    renderFamily();
  };

  window.openFamilyForm = function (itemId = "") {
    const x = D.family.find(a => a.id === itemId);

    modal(
      itemId ? "Edit Family Member" : "Add Family Member",
      `
        ${field("Name", x?.name || "", "text", "fName")}
        ${field("Relation", x?.relation || "", "text", "fRelation")}
        ${field("Phone", x?.phone || "", "tel", "fPhone")}
      `,
      button(
        itemId ? "Update" : "Save",
        `saveFamily('${itemId}')`
      )
    );
  };

  window.saveFamily = function (itemId = "") {
    const name = get("fName")?.value.trim() || "";

    if (!name) {
      notify("Name enter karein");
      return;
    }

    if (itemId) {
      const x = D.family.find(a => a.id === itemId);

      if (x) {
        x.name = name;
        x.relation = get("fRelation")?.value.trim() || "";
        x.phone = get("fPhone")?.value.trim() || "";
      }
    } else {
      D.family.unshift({
        id: id("family"),
        name,
        relation: get("fRelation")?.value.trim() || "",
        phone: get("fPhone")?.value.trim() || ""
      });
    }

    save();
    closeModal();
    renderFamily();
  };

  window.deleteFamily = function (itemId) {
    if (!confirm("Family member delete karein?")) return;

    remove(D.family, itemId);
    save();
    renderFamily();
  };

  function renderFamily() {
    const box = get("familyList");
    if (!box) return;

    box.innerHTML = D.family.length
      ? D.family.map(x => `
        <div style="
          padding:14px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:15px;
        ">
          <b>${esc(x.name)}</b>
          <div>${esc(x.relation)}</div>
          <small>${esc(x.phone)}</small>

          <div>
            <button onclick="openFamilyForm('${x.id}')">
              Edit
            </button>

            <button onclick="deleteFamily('${x.id}')">
              Delete
            </button>
          </div>
        </div>
      `).join("")
      : "<p>No family members.</p>";
  }

  /* ================= FAMILY TOOLS ================= */

  function renderFamilyTools() {
    /* Static HTML already exists.
       No destructive rewrite needed. */
  }

  /* ================= TOOLS ================= */

  window.calcFD = function () {
    const p = num(get("fdPrincipal")?.value);
    const rate = num(get("fdRate")?.value);
    const months = num(get("fdN")?.value);

    if (p <= 0 || months <= 0) {
      notify("FD details enter karein");
      return;
    }

    const result =
      p * Math.pow(
        1 + rate / 100,
        months / 12
      );

    const box = get("fdResult");

    if (box) {
      box.innerHTML =
        "<b>Maturity Amount: </b>" +
        money(result);
    }

    return result;
  };

  window.calcEmergency = function () {
    openCalculator("emergency");
  };

  window.openCalculator = function (type) {
    let title = "Calculator";
    let body = "";

    if (type === "emergency") {
      title = "Emergency Fund";

      body =
        field("Monthly Expense", "", "number", "c1") +
        field("Months", "6", "number", "c2") +
        `<div id="calcResult"></div>`;
    }

    if (type === "fd") {
      title = "FD Calculator";

      body =
        field("Principal", "", "number", "c1") +
        field("Interest %", "", "number", "c2") +
        field("Years", "1", "number", "c3") +
        `<div id="calcResult"></div>`;
    }

    if (type === "annual") {
      title = "Annual Expense";

      body =
        field("Monthly Expense", "", "number", "c1") +
        `<div id="calcResult"></div>`;
    }

    if (type === "budget") {
      title = "Budget Calculator";

      body =
        field("Income", "", "number", "c1") +
        field("Expense", "", "number", "c2") +
        `<div id="calcResult"></div>`;
    }

    modal(
      title,
      body,
      button("Calculate", `calculate('${type}')`)
    );
  };

  window.calculate = function (type) {
    const a = num(get("c1")?.value);
    const b = num(get("c2")?.value);
    const c = num(get("c3")?.value);

    let result = 0;

    if (type === "emergency") {
      result = a * Math.max(1, b);
    }

    if (type === "annual") {
      result = a * 12;
    }

    if (type === "budget") {
      result = a - b;
    }

    if (type === "fd") {
      result =
        a * Math.pow(
          1 + b / 100,
          Math.max(1, c)
        );
    }

    const box = get("calcResult");

    if (box) {
      box.innerHTML = `
        <div style="
          padding:14px;
          margin-top:10px;
          border-radius:14px;
          background:#eef8f4;
        ">
          <b>Result</b>
          <div style="font-size:22px">
            ${money(result)}
          </div>
        </div>
      `;
    }
  };

  window.addInsurance = function () {
    openSimpleTool("insurance");
  };

  window.addSchool = function () {
    openSimpleTool("school");
  };

  window.addVehicle = function () {
    openSimpleTool("vehicle");
  };

  window.addShopping = function () {
    openSimpleTool("shopping");
  };

  window.addUtility = function () {
    openSimpleTool("utility");
  };

  window.addDoc = function () {
    openSimpleTool("document");
  };

  window.addAnnual = function () {
    openCalculator("annual");
  };

  window.openSimpleTool = function (type) {
    modal(
      type.charAt(0).toUpperCase() + type.slice(1),
      `
        ${field("Title", "", "text", "tTitle")}
        ${field("Amount", "", "number", "tAmount")}
        ${field("Date", today(), "date", "tDate")}
        ${field("Note", "", "text", "tNote")}
      `,
      button(
        "Save",
        `saveSimpleTool('${type}')`
      )
    );
  };

  window.saveSimpleTool = function (type) {
    D.tools.unshift({
      id: id("tool"),
      type,
      title: get("tTitle")?.value.trim() || type,
      amount: num(get("tAmount")?.value),
      date: get("tDate")?.value || today(),
      note: get("tNote")?.value.trim() || ""
    });

    save();
    closeModal();

    notify("Record save ho gaya");
  };

  function renderTools() {
    /* Current static Tools HTML remains intact. */
  }

  /* ================= SEARCH ================= */

  window.searchAllData = function (value) {
    const q = String(value || "")
      .trim()
      .toLowerCase();

    const box = get("searchResults");

    if (!box) return;

    if (!q) {
      box.innerHTML = "";
      return;
    }

    const results = [];

    D.transactions.forEach(x => {
      if (
        String(x.category).toLowerCase().includes(q) ||
        String(x.note).toLowerCase().includes(q)
      ) {
        results.push(
          `Transaction: ${x.category} — ${money(x.amount)}`
        );
      }
    });

    D.khata.forEach(x => {
      if (
        String(x.person).toLowerCase().includes(q) ||
        String(x.note).toLowerCase().includes(q)
      ) {
        results.push(
          `Udhar: ${x.person} — ${money(x.amount)}`
        );
      }
    });

    D.bills.forEach(x => {
      if (String(x.name).toLowerCase().includes(q)) {
        results.push(
          `Bill: ${x.name} — ${money(x.amount)}`
        );
      }
    });

    D.goals.forEach(x => {
      if (String(x.name).toLowerCase().includes(q)) {
        results.push(
          `Goal: ${x.name} — ${money(x.target)}`
        );
      }
    });

    box.innerHTML = results.length
      ? results.map(x => `
          <div style="
            padding:10px;
            border-bottom:1px solid #ddd;
          ">
            ${esc(x)}
          </div>
        `).join("")
      : "<p>No result found.</p>";
  };

  /* ================= SETTINGS ================= */

  function renderSettings() {
    /* Static Settings HTML remains intact. */
  }

  /* ================= STARTUP ================= */

  window.D = D;
  window.save = save;

  window.renderHome = renderHome;
  window.renderPersonal = renderPersonal;
  window.renderBusiness = renderBusiness;
  window.renderTransactions = renderTransactions;
  window.renderPlanning = renderPlanning;
  window.renderCredit = renderCredit;
  window.renderReports = renderReports;
  window.renderReminders = renderReminders;
  window.renderPrivacy = renderPrivacy;
  window.renderFamily = renderFamily;
  window.renderFamilyTools = renderFamilyTools;
  window.renderTools = renderTools;
  window.renderSettings = renderSettings;

  function startup() {
    save();

    const shell = get("appShell");
    const gate = get("guestGate");

    if (shell && gate) {
      shell.style.display = "none";
      gate.style.display = "";
    }

    /*
      Existing HTML calls showGuestGate()
      after both JS files load.
    */
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startup,
      { once: true }
    );
  } else {
    startup();
  }

})();
