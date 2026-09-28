/* =========================================================
   HISAB V7 — COMPLETE STABLE APP CONTROLLER
   #1 BUSINESS SALES + PURCHASE
   Local-first • Offline • No Login
   Compatible with current HISAB V7 index.html
   ========================================================= */

(function () {
  "use strict";

  const KEY = "hisab_v7_data";
  const GUEST_KEY = "hisab_v7_guest";

  const DEFAULT = {
    mode: "personal",
    currency: "₹",
    language: "hi",

    transactions: [],
    khata: [],
    business: [],

    /* #1 Business */
    sales: [],
    purchases: [],

    goals: [],
    savings: [],
    bills: [],
    loans: [],
    reminders: [],
    family: [],
    tools: [],

    budget: 0,
    pin: ""
  };

  /* =======================================================
     HELPERS
     ======================================================= */

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(KEY);

      if (!raw) return clone(DEFAULT);

      const saved = JSON.parse(raw);

      return Object.assign(clone(DEFAULT), saved || {});
    } catch (e) {
      console.error("HISAB load error:", e);
      return clone(DEFAULT);
    }
  }

  let D = loadData();

  window.D = D;

  D.ui = Object.assign({
    khataMode: "personal",
    khataFilter: "all",
    detailFilter: "all",
    businessFilter: "customer",
    selectedPerson: "",
    selectedMode: "personal"
  }, D.ui || {});

  function save() {
    try {
      const copy = clone(D);
      delete copy.ui;

      localStorage.setItem(KEY, JSON.stringify(copy));
      window.D = D;
    } catch (e) {
      console.error("HISAB save error:", e);
    }
  }

  window.save = save;

  function $(id) {
    return document.getElementById(id);
  }

  function value(id) {
    const el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function number(id) {
    const n = parseFloat(value(id));
    return Number.isFinite(n) ? n : 0;
  }

  function today() {
    const d = new Date();

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }

  function id() {
    return Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);
  }

  function money(n) {
    n = Number(n) || 0;

    return D.currency +
      n.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(idName, text) {
    const el = $(idName);
    if (el) el.textContent = text;
  }

  function setValue(idName, val) {
    const el = $(idName);
    if (el) el.value = val == null ? "" : val;
  }

  function arr(x) {
    return Array.isArray(x) ? x : [];
  }

  function currentKhata(mode) {
    return arr(D.khata).filter(function (x) {
      return (x.mode || "personal") === mode;
    });
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function hidePages() {
    document.querySelectorAll(".page").forEach(function (page) {
      page.classList.remove("active");
    });
  }

  function show(pageId) {
    const page = $(pageId);

    if (!page) {
      console.warn("HISAB: page not found:", pageId);
      return;
    }

    const shell = $("appShell");
    const gate = $("guestGate");

    if (gate) gate.classList.remove("active");
    if (shell) shell.style.display = "block";

    hidePages();

    page.classList.add("active");

    window.scrollTo(0, 0);

    renderAll();
  }

  window.show = show;

  function showGuestGate() {
    const gate = $("guestGate");
    const shell = $("appShell");

    if (shell) shell.style.display = "none";
    if (gate) gate.classList.add("active");
  }

  window.showGuestGate = showGuestGate;

  function enterGuestMode() {
    localStorage.setItem(GUEST_KEY, "1");

    const shell = $("appShell");
    const gate = $("guestGate");

    if (gate) gate.classList.remove("active");
    if (shell) shell.style.display = "block";

    show("home");
  }

  window.enterGuestMode = enterGuestMode;

  /* =======================================================
     LANGUAGE / CURRENCY
     ======================================================= */

  function toggleLanguage() {
    D.language = D.language === "hi" ? "en" : "hi";

    save();
    renderAll();

    alert(
      D.language === "hi"
        ? "Language: Hindi"
        : "Language: English"
    );
  }

  window.toggleLanguage = toggleLanguage;

  function toggleCurrency() {
    if (D.currency === "₹") {
      D.currency = "$";
    } else if (D.currency === "$") {
      D.currency = "€";
    } else {
      D.currency = "₹";
    }

    save();
    renderAll();

    alert("Currency changed to " + D.currency);
  }

  window.toggleCurrency = toggleCurrency;

  /* =======================================================
     MODE
     ======================================================= */

  function setMode(mode) {
    if (mode !== "personal" && mode !== "business") {
      mode = "personal";
    }

    D.mode = mode;
    D.ui.selectedMode = mode;

    save();

    setText(
      "modeLabel",
      mode === "business" ? "Business" : "Personal"
    );

    show(mode === "business" ? "business" : "personal");
  }

  window.setMode = setMode;

  /* =======================================================
     HOME
     ======================================================= */

  function renderHome() {
    const mode = D.mode || "personal";

    const khata = currentKhata(mode);

    let give = 0;
    let receive = 0;

    khata.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    const tx = arr(D.transactions).filter(function (x) {
      return (x.mode || "personal") === mode;
    });

    let income = 0;
    let expense = 0;

    tx.forEach(function (x) {
      if (x.type === "income") {
        income += Number(x.amount) || 0;
      }

      if (x.type === "expense") {
        expense += Number(x.amount) || 0;
      }
    });

    const balance =
      income - expense + receive - give;

    setText("receivable", money(give));
    setText("payable", money(receive));
    setText("homeBalance", money(balance));

    const p = $("personalModeBtn");
    const b = $("businessModeBtn");

    if (p) {
      p.classList.toggle("active", mode === "personal");
    }

    if (b) {
      b.classList.toggle("active", mode === "business");
    }

    setText(
      "modeLabel",
      mode === "business"
        ? "Business"
        : "Personal"
    );
  }

  /* =======================================================
     KHATA / UDHAR
     ======================================================= */

  function openKhataForm(mode) {
    D.ui.khataMode =
      mode === "business"
        ? "business"
        : "personal";

    setValue("khataPerson", "");
    setValue("khataAmount", "");
    setValue("khataDate", today());
    setValue("khataNote", "");
    setValue("khataType", "give");
    setValue("khataMethod", "Cash");
    setValue("khataStatus", "pending");

    show("khataEntry");
  }

  window.openKhataForm = openKhataForm;

  function closeKhataForm() {
    show(
      D.ui.khataMode === "business"
        ? "business"
        : "personal"
    );
  }

  window.closeKhataForm = closeKhataForm;

  function saveKhataEntry() {
    const person = value("khataPerson");
    const amount = number("khataAmount");

    if (!person) {
      alert("Please enter person / customer name.");
      return;
    }

    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const entry = {
      id: id(),
      mode: D.ui.khataMode || D.mode || "personal",
      person: person,
      type: value("khataType") || "give",
      amount: amount,
      date: value("khataDate") || today(),
      method: value("khataMethod") || "Cash",
      status: value("khataStatus") || "pending",
      note: value("khataNote"),
      createdAt: Date.now()
    };

    D.khata.push(entry);

    save();

    alert("Udhar entry saved.");

    openKhataPerson(
      person,
      entry.mode
    );
  }

  window.saveKhataEntry = saveKhataEntry;

  function searchKhata(mode) {
    if (mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }
  }

  window.searchKhata = searchKhata;

  function filterKhata(mode, filter, button) {
    D.ui.khataFilter = filter || "all";

    if (button) {
      const parent = button.parentElement;

      if (parent) {
        parent.querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });
      }

      button.classList.add("active");
    }

    if (mode === "business") {
      renderBusiness();
    } else {
      renderPersonal();
    }
  }

  window.filterKhata = filterKhata;

  function khataMatches(entry, filter) {
    if (filter === "give") {
      return entry.type === "give";
    }

    if (filter === "receive") {
      return entry.type === "receive";
    }

    if (filter === "pending") {
      return entry.status === "pending";
    }

    return true;
  }

  function renderPersonal() {
    const list = $("personalList");

    if (!list) return;

    const data = currentKhata("personal");

    const search =
      value("personalSearch").toLowerCase();

    const filter =
      D.ui.khataFilter || "all";

    let give = 0;
    let receive = 0;

    data.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    setText("ledgerGiven", money(give));
    setText("ledgerReceived", money(receive));
    setText("ledgerNet", money(give - receive));

    const groups = {};

    data.forEach(function (x) {
      if (!khataMatches(x, filter)) return;

      const name = x.person || "Unknown";

      if (
        search &&
        !name.toLowerCase().includes(search)
      ) {
        return;
      }

      if (!groups[name]) {
        groups[name] = {
          give: 0,
          receive: 0,
          pending: 0,
          count: 0
        };
      }

      groups[name].count++;

      if (x.type === "give") {
        groups[name].give +=
          Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        groups[name].receive +=
          Number(x.amount) || 0;
      }

      if (x.status === "pending") {
        groups[name].pending++;
      }
    });

    const names = Object.keys(groups);

    if (!names.length) {
      list.innerHTML =
        '<div class="list-card"><small>No Udhar entries yet.</small></div>';
      return;
    }

    list.innerHTML = names.map(function (name) {
      const g = groups[name];

      return `
        <div class="list-card"
             data-person="${esc(name)}">

          <h3>${esc(name)}</h3>

          <div class="meta">
            ${g.count}
            entr${g.count === 1 ? "y" : "ies"}
            ${g.pending
              ? " • " + g.pending + " pending"
              : ""}
          </div>

          <div class="amount">
            <span class="give">
              Give ${money(g.give)}
            </span>

            &nbsp; | &nbsp;

            <span class="receive">
              Receive ${money(g.receive)}
            </span>
          </div>

          <button type="button"
                  data-open-person="${esc(name)}">
            View History
          </button>

        </div>
      `;
    }).join("");

    list.querySelectorAll(
      "[data-open-person]"
    ).forEach(function (btn) {
      btn.addEventListener(
        "click",
        function () {
          openKhataPerson(
            btn.getAttribute(
              "data-open-person"
            ),
            "personal"
          );
        }
      );
    });
  }

  function openKhataPerson(person, mode) {
    D.ui.selectedPerson = person;
    D.ui.selectedMode =
      mode || "personal";
    D.ui.detailFilter = "all";

    setText(
      "detailPersonName",
      person
    );

    show("khataDetail");
  }

  window.openKhataPerson =
    openKhataPerson;

  function detailFilter(filter, button) {
    D.ui.detailFilter =
      filter || "all";

    if (button) {
      const parent =
        button.parentElement;

      if (parent) {
        parent.querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });
      }

      button.classList.add("active");
    }

    renderKhataDetail();
  }

  window.detailFilter = detailFilter;

  function renderKhataDetail() {
    const list = $("khataHistory");

    if (!list) return;

    const person =
      D.ui.selectedPerson;

    const mode =
      D.ui.selectedMode ||
      "personal";

    const filter =
      D.ui.detailFilter ||
      "all";

    const all =
      currentKhata(mode).filter(
        function (x) {
          return x.person === person;
        }
      );

    let give = 0;
    let receive = 0;

    all.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    setText(
      "detailGive",
      money(give)
    );

    setText(
      "detailReceive",
      money(receive)
    );

    setText(
      "detailBalance",
      money(give - receive)
    );

    const data = all.filter(
      function (x) {
        return khataMatches(
          x,
          filter
        );
      }
    );

    if (!data.length) {
      list.innerHTML =
        '<div class="list-card"><small>No entries found.</small></div>';
      return;
    }

    list.innerHTML = data
      .slice()
      .sort(function (a, b) {
        return String(b.date)
          .localeCompare(
            String(a.date)
          );
      })
      .map(function (x) {
        const cls =
          x.type === "give"
            ? "give"
            : "receive";

        return `
          <div class="list-card">

            <h4 class="${cls}">
              ${
                x.type === "give"
                  ? "Give"
                  : "Receive"
              }
              ${money(x.amount)}
            </h4>

            <div class="meta">
              ${esc(x.date || "")}
              •
              ${esc(x.method || "Cash")}
            </div>

            ${
              x.status === "pending"
                ? '<span class="status-pending">Pending</span>'
                : '<span class="status-settled">Settled</span>'
            }

            ${
              x.note
                ? `<div class="meta">${esc(x.note)}</div>`
                : ""
            }

            <button type="button"
                    onclick="deleteKhata('${x.id}')">
              Delete
            </button>

          </div>
        `;
      })
      .join("");
  }

  window.deleteKhata =
    function (entryId) {
      if (!confirm(
        "Delete this entry?"
      )) return;

      D.khata =
        arr(D.khata).filter(
          function (x) {
            return x.id !== entryId;
          }
        );

      save();
      renderKhataDetail();
      renderAll();
    };

  function closeKhataDetail() {
    show(
      D.ui.selectedMode === "business"
        ? "business"
        : "personal"
    );
  }

  window.closeKhataDetail =
    closeKhataDetail;

  function openPaymentEntry() {
    const person =
      D.ui.selectedPerson;

    const mode =
      D.ui.selectedMode ||
      "personal";

    if (!person) {
      alert("Person not selected.");
      return;
    }

    const amount =
      parseFloat(
        prompt("Payment amount:")
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    const method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    D.khata.push({
      id: id(),
      mode: mode,
      person: person,
      type: "receive",
      amount: amount,
      date: today(),
      method: method,
      status: "settled",
      note: "Payment",
      createdAt: Date.now()
    });

    save();

    renderKhataDetail();
    renderAll();

    alert("Payment added.");
  }

  window.openPaymentEntry =
    openPaymentEntry;

  function shareKhata() {
    const person =
      D.ui.selectedPerson;

    const mode =
      D.ui.selectedMode ||
      "personal";

    const data =
      currentKhata(mode).filter(
        function (x) {
          return x.person === person;
        }
      );

    let give = 0;
    let receive = 0;

    data.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    const text =
      `HISAB - ${person}\n` +
      `Give: ${money(give)}\n` +
      `Receive: ${money(receive)}\n` +
      `Balance: ${money(give - receive)}`;

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {
      navigator.share({
        title:
          "HISAB - " + person,
        text: text
      }).catch(function () {});

      return;
    }

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          alert(
            "Khata summary copied."
          );
        })
        .catch(function () {
          alert(text);
        });
    } else {
      alert(text);
    }
  }

  window.shareKhata = shareKhata;

  /* =======================================================
     BUSINESS CONTACTS + #1 SALES / PURCHASE
     ======================================================= */

  function addBusinessCustomer() {
    addBusinessContact("customer");
  }

  window.addBusinessCustomer =
    addBusinessCustomer;

  function addBusinessSupplier() {
    addBusinessContact("supplier");
  }

  window.addBusinessSupplier =
    addBusinessSupplier;

  function addBusinessContact(type) {
    const name = prompt(
      type === "customer"
        ? "Customer name:"
        : "Supplier name:"
    );

    if (!name || !name.trim()) {
      return;
    }

    D.business.push({
      id: id(),
      type: type,
      name: name.trim(),
      createdAt: Date.now()
    });

    save();
    renderBusiness();

    alert(
      type === "customer"
        ? "Customer added."
        : "Supplier added."
    );
  }

  /*
   #1 — Proper Business Sale Entry
   Separate record.
  */

  function addBusinessSale() {
    const customer =
      prompt("Customer name:");

    if (!customer || !customer.trim()) {
      return;
    }

    const amount =
      parseFloat(
        prompt("Sale amount:")
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert("Enter a valid sale amount.");
      return;
    }

    const date =
      prompt(
        "Sale date:",
        today()
      ) || today();

    const method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    const note =
      prompt(
        "Sale note:",
        ""
      ) || "";

    D.sales.push({
      id: id(),
      mode: "business",
      customer: customer.trim(),
      amount: amount,
      date: date,
      method: method,
      note: note,
      status: "completed",
      createdAt: Date.now()
    });

    save();
    renderBusiness();

    alert("Sale entry added.");
  }

  window.addBusinessSale =
    addBusinessSale;

  /*
   #1 — Proper Business Purchase Entry
   Separate record.
  */

  function addBusinessPurchase() {
    const supplier =
      prompt("Supplier name:");

    if (!supplier || !supplier.trim()) {
      return;
    }

    const amount =
      parseFloat(
        prompt("Purchase amount:")
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Enter a valid purchase amount."
      );
      return;
    }

    const date =
      prompt(
        "Purchase date:",
        today()
      ) || today();

    const method =
      prompt(
        "Payment method:",
        "Cash"
      ) || "Cash";

    const note =
      prompt(
        "Purchase note:",
        ""
      ) || "";

    D.purchases.push({
      id: id(),
      mode: "business",
      supplier: supplier.trim(),
      amount: amount,
      date: date,
      method: method,
      note: note,
      status: "completed",
      createdAt: Date.now()
    });

    save();
    renderBusiness();

    alert("Purchase entry added.");
  }

  window.addBusinessPurchase =
    addBusinessPurchase;

  function deleteBusinessSale(entryId) {
    if (!confirm(
      "Delete this sale?"
    )) return;

    D.sales =
      arr(D.sales).filter(
        function (x) {
          return x.id !== entryId;
        }
      );

    save();
    renderBusiness();
  }

  window.deleteBusinessSale =
    deleteBusinessSale;

  function deleteBusinessPurchase(entryId) {
    if (!confirm(
      "Delete this purchase?"
    )) return;

    D.purchases =
      arr(D.purchases).filter(
        function (x) {
          return x.id !== entryId;
        }
      );

    save();
    renderBusiness();
  }

  window.deleteBusinessPurchase =
    deleteBusinessPurchase;

  function businessFilter(filter, button) {
    D.ui.businessFilter =
      filter || "customer";

    if (button) {
      const parent =
        button.parentElement;

      if (parent) {
        parent.querySelectorAll("button")
          .forEach(function (b) {
            b.classList.remove("active");
          });
      }

      button.classList.add("active");
    }

    renderBusiness();
  }

  window.businessFilter =
    businessFilter;

  function renderBusiness() {
    const list =
      $("businessList");

    if (!list) return;

    const modeData =
      currentKhata("business");

    let give = 0;
    let receive = 0;

    modeData.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    setText(
      "businessGiven",
      money(give)
    );

    setText(
      "businessReceived",
      money(receive)
    );

    setText(
      "businessNet",
      money(give - receive)
    );

    const filter =
      D.ui.businessFilter ||
      "customer";

    const search =
      value("businessSearch")
        .toLowerCase();

    /* -----------------------------------
       CUSTOMER / SUPPLIER
       ----------------------------------- */

    if (
      filter === "customer" ||
      filter === "supplier"
    ) {
      const contacts =
        arr(D.business).filter(
          function (x) {
            return (
              x.type === filter &&
              (
                !search ||
                String(x.name)
                  .toLowerCase()
                  .includes(search)
              )
            );
          }
        );

      if (!contacts.length) {
        list.innerHTML =
          '<div class="list-card"><small>No contacts yet.</small></div>';
        return;
      }

      list.innerHTML =
        contacts.map(function (x) {
          const entries =
            modeData.filter(
              function (k) {
                return k.person === x.name;
              }
            );

          let g = 0;
          let r = 0;

          entries.forEach(
            function (k) {
              if (k.type === "give") {
                g += Number(k.amount) || 0;
              }

              if (k.type === "receive") {
                r += Number(k.amount) || 0;
              }
            }
          );

          return `
            <div class="list-card">

              <h3>
                ${esc(x.name)}
              </h3>

              <div class="meta">
                ${
                  filter === "customer"
                    ? "Customer"
                    : "Supplier"
                }
              </div>

              <div class="amount">
                <span class="give">
                  Give ${money(g)}
                </span>

                &nbsp; | &nbsp;

                <span class="receive">
                  Receive ${money(r)}
                </span>
              </div>

              <button type="button"
                      data-business-person="${esc(x.name)}">
                View History
              </button>

            </div>
          `;
        }).join("");

      list.querySelectorAll(
        "[data-business-person]"
      ).forEach(function (btn) {
        btn.addEventListener(
          "click",
          function () {
            openKhataPerson(
              btn.getAttribute(
                "data-business-person"
              ),
              "business"
            );
          }
        );
      });

      return;
    }

    /* -----------------------------------
       #1 SALES
       ----------------------------------- */

    if (filter === "sales") {
      const sales =
        arr(D.sales).filter(
          function (x) {
            return (
              !search ||
              String(x.customer)
                .toLowerCase()
                .includes(search)
            );
          }
        );

      let total = 0;

      sales.forEach(function (x) {
        total += Number(x.amount) || 0;
      });

      let html = `
        <div class="list-card">
          <h3>Sales</h3>
          <div class="amount receive">
            Total Sales: ${money(total)}
          </div>
          <button type="button"
                  onclick="addBusinessSale()">
            + Add Sale
          </button>
        </div>
      `;

      if (!sales.length) {
        html +=
          '<div class="list-card"><small>No sales entries yet.</small></div>';
      } else {
        html += sales
          .slice()
          .sort(function (a, b) {
            return String(b.date)
              .localeCompare(
                String(a.date)
              );
          })
          .map(function (x) {
            return `
              <div class="list-card">

                <h3>
                  Sale — ${money(x.amount)}
                </h3>

                <div class="meta">
                  Customer:
                  ${esc(x.customer)}
                </div>

                <div class="meta">
                  Date:
                  ${esc(x.date)}
                  •
                  ${esc(x.method)}
                </div>

                ${
                  x.note
                    ? `<div class="meta">${esc(x.note)}</div>`
                    : ""
                }

                <span class="status-settled">
                  ${esc(x.status || "completed")}
                </span>

                <br><br>

                <button type="button"
                        onclick="deleteBusinessSale('${x.id}')">
                  Delete
                </button>

              </div>
            `;
          }).join("");
      }

      list.innerHTML = html;
      return;
    }

    /* -----------------------------------
       #1 PURCHASE
       ----------------------------------- */

    if (filter === "purchase") {
      const purchases =
        arr(D.purchases).filter(
          function (x) {
            return (
              !search ||
              String(x.supplier)
                .toLowerCase()
                .includes(search)
            );
          }
        );

      let total = 0;

      purchases.forEach(function (x) {
        total += Number(x.amount) || 0;
      });

      let html = `
        <div class="list-card">
          <h3>Purchase</h3>
          <div class="amount give">
            Total Purchase: ${money(total)}
          </div>
          <button type="button"
                  onclick="addBusinessPurchase()">
            + Add Purchase
          </button>
        </div>
      `;

      if (!purchases.length) {
        html +=
          '<div class="list-card"><small>No purchase entries yet.</small></div>';
      } else {
        html += purchases
          .slice()
          .sort(function (a, b) {
            return String(b.date)
              .localeCompare(
                String(a.date)
              );
          })
          .map(function (x) {
            return `
              <div class="list-card">

                <h3>
                  Purchase — ${money(x.amount)}
                </h3>

                <div class="meta">
                  Supplier:
                  ${esc(x.supplier)}
                </div>

                <div class="meta">
                  Date:
                  ${esc(x.date)}
                  •
                  ${esc(x.method)}
                </div>

                ${
                  x.note
                    ? `<div class="meta">${esc(x.note)}</div>`
                    : ""
                }

                <span class="status-settled">
                  ${esc(x.status || "completed")}
                </span>

                <br><br>

                <button type="button"
                        onclick="deleteBusinessPurchase('${x.id}')">
                  Delete
                </button>

              </div>
            `;
          }).join("");
      }

      list.innerHTML = html;
      return;
    }

    /* Fallback */

    list.innerHTML =
      '<div class="list-card"><small>No business entries yet.</small></div>';
  }

  /* =======================================================
     TRANSACTIONS
     ======================================================= */

  function addTransaction() {
    const amount =
      number("transactionAmount");

    if (amount <= 0) {
      alert(
        "Please enter a valid amount."
      );
      return;
    }

    D.transactions.push({
      id: id(),
      mode:
        D.mode || "personal",
      type:
        value("transactionType") ||
        "expense",
      amount: amount,
      category:
        value("transactionCategory") ||
        "General",
      note:
        value("transactionNote"),
      date:
        value("transactionDate") ||
        today(),
      createdAt: Date.now()
    });

    save();

    setValue(
      "transactionAmount",
      ""
    );

    setValue(
      "transactionCategory",
      ""
    );

    setValue(
      "transactionNote",
      ""
    );

    setValue(
      "transactionDate",
      today()
    );

    renderTransactions();
    renderAll();

    alert("Transaction added.");
  }

  window.addTransaction =
    addTransaction;

  function renderTransactions() {
    const list =
      $("transactionList");

    if (!list) return;

    const data =
      arr(D.transactions)
        .filter(function (x) {
          return (
            (x.mode || "personal") ===
            (D.mode || "personal")
          );
        })
        .slice()
        .sort(function (a, b) {
          return String(b.date)
            .localeCompare(
              String(a.date)
            );
        });

    if (!data.length) {
      list.innerHTML =
        '<div class="list-card"><small>No transactions yet.</small></div>';
      return;
    }

    list.innerHTML =
      data.map(function (x) {
        return `
          <div class="list-card">

            <h4 class="${
              x.type === "income"
                ? "receive"
                : "give"
            }">

              ${
                x.type === "income"
                  ? "Income"
                  : "Expense"
              }

              ${money(x.amount)}

            </h4>

            <div class="meta">
              ${esc(x.category)}
              •
              ${esc(x.date)}
            </div>

            ${
              x.note
                ? `<div class="meta">${esc(x.note)}</div>`
                : ""
            }

            <button type="button"
                    onclick="deleteTransaction('${x.id}')">
              Delete
            </button>

          </div>
        `;
      }).join("");
  }

  window.deleteTransaction =
    function (entryId) {
      if (!confirm(
        "Delete transaction?"
      )) return;

      D.transactions =
        arr(D.transactions)
          .filter(function (x) {
            return x.id !== entryId;
          });

      save();
      renderAll();
    };

  /* =======================================================
     PLANNING
     ======================================================= */

  function calcBudget() {
    const amount =
      number("budgetAmount");

    if (amount <= 0) {
      alert(
        "Enter a valid budget."
      );
      return;
    }

    D.budget = amount;

    save();

    alert(
      "Monthly budget saved: " +
      money(amount)
    );
  }

  window.calcBudget =
    calcBudget;

  function calcGoal() {
    const name =
      value("goalName");

    const target =
      number("goalTarget");

    const saved =
      number("goalSaved");

    if (!name) {
      alert(
        "Enter goal name."
      );
      return;
    }

    if (target <= 0) {
      alert(
        "Enter target amount."
      );
      return;
    }

    D.goals.push({
      id: id(),
      mode:
        D.mode || "personal",
      name: name,
      target: target,
      saved: saved,
      date:
        value("goalDate"),
      createdAt: Date.now()
    });

    save();

    setValue(
      "goalName",
      ""
    );

    setValue(
      "goalTarget",
      ""
    );

    setValue(
      "goalSaved",
      ""
    );

    setValue(
      "goalDate",
      ""
    );

    renderGoals();

    alert("Goal saved.");
  }

  window.calcGoal =
    calcGoal;

  function renderGoals() {
    const list =
      $("goalList");

    if (!list) return;

    const data =
      arr(D.goals).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            (D.mode || "personal")
          );
        }
      );

    if (!data.length) {
      list.innerHTML =
        '<div class="list-card"><small>No goals yet.</small></div>';
      return;
    }

    list.innerHTML =
      data.map(function (x) {
        const percent =
          x.target > 0
            ? Math.min(
                100,
                Math.round(
                  (x.saved / x.target) *
                  100
                )
              )
            : 0;

        return `
          <div class="list-card">

            <h3>
              ${esc(x.name)}
            </h3>

            <div class="amount">
              ${money(x.saved)}
              /
              ${money(x.target)}
            </div>

            <div class="meta">
              Progress:
              ${percent}%
              ${
                x.date
                  ? " • " + esc(x.date)
                  : ""
              }
            </div>

            <button type="button"
                    onclick="deleteGoal('${x.id}')">
              Delete
            </button>

          </div>
        `;
      }).join("");
  }

  window.deleteGoal =
    function (entryId) {
      if (!confirm(
        "Delete goal?"
      )) return;

      D.goals =
        arr(D.goals).filter(
          function (x) {
            return x.id !== entryId;
          }
        );

      save();
      renderGoals();
    };

  /* =======================================================
     BILLS / CREDIT CARD / EMI
     ======================================================= */

  function addBill(type) {
    let name = "";
    let amount = 0;
    let due = "";

    if (type === "Credit Card") {
      name = "Credit Card";
      amount = number("cardBill");
      due = value("cardDue");
    } else {
      name = value("billName");
      amount = number("billAmount");
      due = value("billDue");
    }

    if (!name) {
      alert(
        "Enter bill name."
      );
      return;
    }

    if (amount <= 0) {
      alert(
        "Enter valid amount."
      );
      return;
    }

    D.bills.push({
      id: id(),
      mode:
        D.mode || "personal",
      type: type || "Bill",
      name: name,
      amount: amount,
      due: due || today(),
      status: "pending",
      createdAt: Date.now()
    });

    save();

    if (type === "Credit Card") {
      setValue(
        "cardBill",
        ""
      );

      setValue(
        "cardDue",
        ""
      );
    } else {
      setValue(
        "billName",
        ""
      );

      setValue(
        "billAmount",
        ""
      );

      setValue(
        "billDue",
        ""
      );
    }

    renderBills();

    alert(
      (type || "Bill") +
      " added."
    );
  }

  window.addBill =
    addBill;

  function calcEMI() {
    const principal =
      number("emiPrincipal");

    const annualRate =
      number("emiRate");

    const months =
      number("emiMonths");

    if (
      principal <= 0 ||
      months <= 0
    ) {
      alert(
        "Enter valid loan amount and tenure."
      );
      return;
    }

    const r =
      annualRate / 12 / 100;

    let emi;

    if (r === 0) {
      emi =
        principal / months;
    } else {
      emi =
        principal *
        r *
        Math.pow(
          1 + r,
          months
        ) /
        (
          Math.pow(
            1 + r,
            months
          ) - 1
        );
    }

    const total =
      emi * months;

    const interest =
      total - principal;

    setText(
      "emiResult",
      `EMI: ${money(emi)} | Total: ${money(total)} | Interest: ${money(interest)}`
    );

    D.loans.push({
      id: id(),
      mode:
        D.mode || "personal",
      principal:
        principal,
      rate:
        annualRate,
      months:
        months,
      emi:
        emi,
      total:
        total,
      interest:
        interest,
      nextDue:
        today(),
      status:
        "pending",
      history: [],
      createdAt:
        Date.now()
    });

    save();

    alert(
      "EMI calculated: " +
      money(emi)
    );

    renderBills();
  }

  window.calcEMI =
    calcEMI;

  function renderBills() {
    const list =
      $("billList");

    if (!list) return;

    const bills =
      arr(D.bills).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            (D.mode || "personal")
          );
        }
      );

    const loans =
      arr(D.loans).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            (D.mode || "personal")
          );
        }
      );

    let html = "";

    bills.forEach(function (x) {
      html += `
        <div class="list-card">

          <h3>
            ${esc(x.name)}
          </h3>

          <div class="amount give">
            ${money(x.amount)}
          </div>

          <div class="meta">
            ${esc(x.type)}
            • Due
            ${esc(x.due)}
          </div>

          <span class="${
            x.status === "settled"
              ? "status-settled"
              : "status-pending"
          }">
            ${esc(x.status)}
          </span>

          <br><br>

          <button type="button"
                  onclick="settleBill('${x.id}')">
            Mark Settled
          </button>

          <button type="button"
                  onclick="deleteBill('${x.id}')">
            Delete
          </button>

        </div>
      `;
    });

    loans.forEach(function (x) {
      html += `
        <div class="list-card">

          <h3>
            Loan / EMI
          </h3>

          <div class="amount">
            EMI ${money(x.emi)}
          </div>

          <div class="meta">
            Principal
            ${money(x.principal)}
            • ${x.rate}%
            • ${x.months} months
          </div>

          <div class="meta">
            Due:
            ${esc(x.nextDue || "-")}
            •
            ${esc(x.status || "pending")}
          </div>

          <button type="button"
                  onclick="deleteLoan('${x.id}')">
            Delete
          </button>

        </div>
      `;
    });

    if (!html) {
      html =
        '<div class="list-card"><small>No bills or EMI entries yet.</small></div>';
    }

    list.innerHTML = html;
  }

  window.settleBill =
    function (entryId) {
      const x =
        arr(D.bills).find(
          function (b) {
            return b.id === entryId;
          }
        );

      if (!x) return;

      x.status =
        "settled";

      save();
      renderBills();
    };

  window.deleteBill =
    function (entryId) {
      if (!confirm(
        "Delete bill?"
      )) return;

      D.bills =
        arr(D.bills).filter(
          function (x) {
            return x.id !== entryId;
          }
        );

      save();
      renderBills();
    };

  window.deleteLoan =
    function (entryId) {
      if (!confirm(
        "Delete EMI record?"
      )) return;

      D.loans =
        arr(D.loans).filter(
          function (x) {
            return x.id !== entryId;
          }
        );

      save();
      renderBills();
    };

  /* =======================================================
     REPORTS
     ======================================================= */

  function reportTotals() {
    const mode =
      D.mode || "personal";

    const tx =
      arr(D.transactions).filter(
        function (x) {
          return (
            (x.mode || "personal") ===
            mode
          );
        }
      );

    const khata =
      currentKhata(mode);

    let income = 0;
    let expense = 0;
    let give = 0;
    let receive = 0;

    tx.forEach(function (x) {
      if (x.type === "income") {
        income += Number(x.amount) || 0;
      }

      if (x.type === "expense") {
        expense += Number(x.amount) || 0;
      }
    });

    khata.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    const sales =
      D.mode === "business"
        ? arr(D.sales).reduce(
            function (s, x) {
              return s +
                (Number(x.amount) || 0);
            },
            0
          )
        : 0;

    const purchases =
      D.mode === "business"
        ? arr(D.purchases).reduce(
            function (s, x) {
              return s +
                (Number(x.amount) || 0);
            },
            0
          )
        : 0;

    return {
      income,
      expense,
      give,
      receive,
      sales,
      purchases
    };
  }

  function renderReports() {
    const r =
      reportTotals();

    setText(
      "reportIncome",
      money(r.income)
    );

    setText(
      "reportExpense",
      money(r.expense)
    );

    setText(
      "reportGive",
      money(r.give)
    );

    setText(
      "reportReceive",
      money(r.receive)
    );

    const content =
      $("reportContent");

    if (!content) return;

    const balance =
      r.income -
      r.expense +
      r.receive -
      r.give;

    content.innerHTML = `
      <h3>Overview</h3>

      <p class="meta">
        Income: ${money(r.income)}
      </p>

      <p class="meta">
        Expense: ${money(r.expense)}
      </p>

      ${
        D.mode === "business"
          ? `
            <p class="meta">
              Sales: ${money(r.sales)}
            </p>

            <p class="meta">
              Purchase: ${money(r.purchases)}
            </p>
          `
          : ""
      }

      <p class="meta">
        Udhar Give: ${money(r.give)}
      </p>

      <p class="meta">
        Udhar Receive: ${money(r.receive)}
      </p>

      <hr>

      <h3>
        Net Balance
      </h3>

      <div class="amount">
        ${money(balance)}
      </div>
    `;
  }

  function exportSummary() {
    const r =
      reportTotals();

    const text =
      `HISAB Money Summary\n\n` +
      `Income: ${money(r.income)}\n` +
      `Expense: ${money(r.expense)}\n` +
      `Sales: ${money(r.sales)}\n` +
      `Purchase: ${money(r.purchases)}\n` +
      `Give: ${money(r.give)}\n` +
      `Receive: ${money(r.receive)}\n` +
      `Balance: ${money(
        r.income -
        r.expense +
        r.receive -
        r.give
      )}`;

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {
      navigator.share({
        title:
          "HISAB Summary",
        text: text
      }).catch(function () {});

      return;
    }

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          alert(
            "Summary copied."
          );
        })
        .catch(function () {
          alert(text);
        });
    } else {
      alert(text);
    }
  }

  window.exportSummary =
    exportSummary;

  function printDocument(
    title,
    body
  ) {
    const win =
      window.open(
        "",
        "_blank"
      );

    if (!win) {
      alert(
        "Popup blocked. Please allow popups to create PDF."
      );
      return;
    }

    win.document.write(`
      <!doctype html>

      <html>

      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width"
        >

        <title>
          ${esc(title)}
        </title>

        <style>
          body{
            font-family:Arial,sans-serif;
            padding:25px;
            color:#182230;
          }

          h1{
            margin-bottom:20px;
          }

          .row{
            padding:10px 0;
            border-bottom:1px solid #ddd;
          }
        </style>

      </head>

      <body>

        ${body}

        <script>
          window.onload=function(){
            setTimeout(function(){
              window.print();
            },300);
          };
        <\/script>

      </body>

      </html>
    `);

    win.document.close();
  }

  function exportSummaryPDF() {
    const r =
      reportTotals();

    printDocument(
      "HISAB Summary",
      `
        <h1>
          HISAB Money Summary
        </h1>

        <div class="row">
          Income:
          ${money(r.income)}
        </div>

        <div class="row">
          Expense:
          ${money(r.expense)}
        </div>

        <div class="row">
          Sales:
          ${money(r.sales)}
        </div>

        <div class="row">
          Purchase:
          ${money(r.purchases)}
        </div>

        <div class="row">
          Give:
          ${money(r.give)}
        </div>

        <div class="row">
          Receive:
          ${money(r.receive)}
        </div>

        <div class="row">
          Balance:
          ${money(
            r.income -
            r.expense +
            r.receive -
            r.give
          )}
        </div>
      `
    );
  }

  window.exportSummaryPDF =
    exportSummaryPDF;

  function exportKhataPDF() {
    const person =
      D.ui.selectedPerson;

    const mode =
      D.ui.selectedMode ||
      "personal";

    const data =
      currentKhata(mode).filter(
        function (x) {
          return x.person === person;
        }
      );

    let give = 0;
    let receive = 0;

    data.forEach(function (x) {
      if (x.type === "give") {
        give += Number(x.amount) || 0;
      }

      if (x.type === "receive") {
        receive += Number(x.amount) || 0;
      }
    });

    const rows =
      data.map(function (x) {
        return `
          <div class="row">

            ${esc(x.date)}
            -
            ${
              x.type === "give"
                ? "Give"
                : "Receive"
            }
            -
            ${money(x.amount)}
            -
            ${esc(x.method || "")}
            -
            ${esc(x.status || "")}

          </div>
        `;
      }).join("");

    printDocument(
      "HISAB - " + person,
      `
        <h1>
          HISAB - ${esc(person)}
        </h1>

        <div class="row">
          Total Give:
          ${money(give)}
        </div>

        <div class="row">
          Total Receive:
          ${money(receive)}
        </div>

        <div class="row">
          Balance:
          ${money(give - receive)}
        </div>

        <h2>
          History
        </h2>

        ${rows}
      `
    );
  }

  window.exportKhataPDF =
    exportKhataPDF;

  /* =======================================================
     REMINDERS
     ======================================================= */

  function addReminder() {
    const name =
      value("reminderName");

    const date =
      value("reminderDate");

    if (!name) {
      alert(
        "Enter reminder."
      );
      return;
    }

    D.reminders.push({
      id: id(),
      name: name,
      date:
        date || today(),
      createdAt:
        Date.now()
    });

    save();

    setValue(
      "reminderName",
      ""
    );

    setValue(
      "reminderDate",
      ""
    );

    renderReminders();

    alert(
      "Reminder added."
    );
  }

  window.addReminder =
    addReminder;

  function renderReminders() {
    const list =
      $("reminderList");

    if (!list) return;

    const data =
      arr(D.reminders)
        .slice()
        .sort(function (a, b) {
          return String(a.date)
            .localeCompare(
              String(b.date)
            );
        });

    if (!data.length) {
      list.innerHTML =
        '<div class="list-card"><small>No reminders yet.</small></div>';
      return;
    }

    list.innerHTML =
      data.map(function (x) {
        return `
          <div class="list-card">

            <h3>
              ${esc(x.name)}
            </h3>

            <div class="meta">
              ${esc(x.date)}
            </div>

            <button type="button"
                    onclick="deleteReminder('${x.id}')">
              Delete
            </button>

          </div>
        `;
      }).join("");
  }

  window.deleteReminder =
    function (entryId) {
      if (!confirm(
        "Delete reminder?"
      )) return;

      D.reminders =
        arr(D.reminders)
          .filter(function (x) {
            return x.id !== entryId;
          });

      save();
      renderReminders();
    };

  /* =======================================================
     SECURITY
     ======================================================= */

  function setPin() {
    const pin =
      value("pinInput");

    if (!/^\d{4,6}$/.test(pin)) {
      alert(
        "PIN must be 4 to 6 digits."
      );
      return;
    }

    D.pin = pin;

    save();

    setValue(
      "pinInput",
      ""
    );

    alert(
      "Security PIN saved."
    );
  }

  window.setPin =
    setPin;

  function lockApp() {
    if (!D.pin) {
      alert(
        "First set a Security PIN."
      );
      return;
    }

    const entered =
      prompt(
        "Enter PIN to lock/unlock:"
      );

    if (entered === null) return;

    if (entered === D.pin) {
      showGuestGate();

      alert(
        "App locked."
      );
    } else {
      alert(
        "Incorrect PIN."
      );
    }
  }

  window.lockApp =
    lockApp;

  /* =======================================================
     BACKUP / RESTORE
     ======================================================= */

  function exportBackup() {
    const copy =
      clone(D);

    delete copy.ui;

    const blob =
      new Blob(
        [
          JSON.stringify(
            copy,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      "HISAB-Backup-" +
      today() +
      ".json";

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);
  }

  window.exportBackup =
    exportBackup;

  function importBackup(event) {
    const file =
      event &&
      event.target &&
      event.target.files
        ? event.target.files[0]
        : null;

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload =
      function () {
        try {
          const imported =
            JSON.parse(
              reader.result
            );

          D =
            Object.assign(
              clone(DEFAULT),
              imported || {}
            );

          D.ui = {
            khataMode:
              "personal",
            khataFilter:
              "all",
            detailFilter:
              "all",
            businessFilter:
              "customer",
            selectedPerson:
              "",
            selectedMode:
              "personal"
          };

          window.D = D;

          save();
          renderAll();

          alert(
            "Backup restored successfully."
          );
        } catch (e) {
          alert(
            "Invalid HISAB backup file."
          );
        }

        event.target.value = "";
      };

    reader.readAsText(file);
  }

  window.importBackup =
    importBackup;

  /* =======================================================
     FAMILY
     ======================================================= */

  function addFamilyMember() {
    const name =
      value("familyName");

    if (!name) {
      alert(
        "Enter family member name."
      );
      return;
    }

    D.family.push({
      id: id(),
      name: name,
      createdAt:
        Date.now()
    });

    save();

    setValue(
      "familyName",
      ""
    );

    renderFamily();

    alert(
      "Family member added."
    );
  }

  window.addFamilyMember =
    addFamilyMember;

  function renderFamily() {
    const list =
      $("familyList");

    if (!list) return;

    if (!D.family.length) {
      list.innerHTML =
        '<div class="list-card"><small>No family members yet.</small></div>';
      return;
    }

    list.innerHTML =
      D.family.map(function (x) {
        return `
          <div class="list-card">

            <h3>
              ${esc(x.name)}
            </h3>

            <button type="button"
                    onclick="deleteFamily('${x.id}')">
              Delete
            </button>

          </div>
        `;
      }).join("");
  }

  window.deleteFamily =
    function (entryId) {
      if (!confirm(
        "Delete family member?"
      )) return;

      D.family =
        arr(D.family)
          .filter(function (x) {
            return x.id !== entryId;
          });

      save();
      renderFamily();
    };

  /* =======================================================
     MORE TOOLS
     ======================================================= */

  function calcFD() {
    const principal =
      number("fdPrincipal");

    const rate =
      number("fdRate");

    const months =
      number("fdN");

    if (
      principal <= 0 ||
      months <= 0
    ) {
      alert(
        "Enter valid FD details."
      );
      return;
    }

    const maturity =
      principal *
      Math.pow(
        1 +
          rate / 100 / 12,
        months
      );

    setText(
      "fdResult",
      `Maturity Amount: ${money(maturity)} | Interest: ${money(maturity - principal)}`
    );
  }

  window.calcFD =
    calcFD;

  function toolAction(name) {
    D.tools.push({
      id: id(),
      name: name,
      date: today(),
      createdAt:
        Date.now()
    });

    save();

    alert(
      name +
      " section is ready."
    );

    renderAll();
  }

  function addInsurance() {
    toolAction(
      "Insurance"
    );
  }

  function addSchool() {
    toolAction(
      "School"
    );
  }

  function addVehicle() {
    toolAction(
      "Vehicle"
    );
  }

  function addShopping() {
    toolAction(
      "Shopping"
    );
  }

  function addUtility() {
    toolAction(
      "Utility"
    );
  }

  function calcEmergency() {
    const monthly =
      parseFloat(
        prompt(
          "Monthly essential expenses:",
          "0"
        )
      );

    if (
      !Number.isFinite(
        monthly
      ) ||
      monthly <= 0
    ) {
      return;
    }

    const months =
      parseFloat(
        prompt(
          "Emergency fund months:",
          "6"
        )
      );

    if (
      !Number.isFinite(
        months
      ) ||
      months <= 0
    ) {
      return;
    }

    alert(
      "Recommended Emergency Fund: " +
      money(
        monthly * months
      )
    );
  }

  function addDoc() {
    toolAction(
      "Documents"
    );
  }

  function addAnnual() {
    toolAction(
      "Annual Planning"
    );
  }

  window.addInsurance =
    addInsurance;

  window.addSchool =
    addSchool;

  window.addVehicle =
    addVehicle;

  window.addShopping =
    addShopping;

  window.addUtility =
    addUtility;

  window.calcEmergency =
    calcEmergency;

  window.addDoc =
    addDoc;

  window.addAnnual =
    addAnnual;

  /* =======================================================
     SEARCH EVERYTHING
     ======================================================= */

  function searchAllData(query) {
    const list =
      $("searchResults");

    if (!list) return;

    query =
      String(query || "")
        .trim()
        .toLowerCase();

    if (!query) {
      list.innerHTML = "";
      return;
    }

    const results = [];

    arr(D.transactions)
      .forEach(function (x) {
        const text =
          `${x.type} ${x.category} ${x.note} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Transaction • ${money(x.amount)} • ${x.category}`
          );
        }
      });

    arr(D.khata)
      .forEach(function (x) {
        const text =
          `${x.person} ${x.type} ${x.note} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Udhar • ${x.person} • ${x.type} • ${money(x.amount)}`
          );
        }
      });

    arr(D.bills)
      .forEach(function (x) {
        const text =
          `${x.name} ${x.type} ${x.amount}`;

        if (
          text
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Payment • ${x.name} • ${money(x.amount)}`
          );
        }
      });

    arr(D.goals)
      .forEach(function (x) {
        if (
          String(x.name)
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Goal • ${x.name} • ${money(x.target)}`
          );
        }
      });

    arr(D.reminders)
      .forEach(function (x) {
        if (
          String(x.name)
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Reminder • ${x.name} • ${x.date}`
          );
        }
      });

    arr(D.sales)
      .forEach(function (x) {
        if (
          `${x.customer} ${x.amount} ${x.note}`
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Sale • ${x.customer} • ${money(x.amount)}`
          );
        }
      });

    arr(D.purchases)
      .forEach(function (x) {
        if (
          `${x.supplier} ${x.amount} ${x.note}`
            .toLowerCase()
            .includes(query)
        ) {
          results.push(
            `Purchase • ${x.supplier} • ${money(x.amount)}`
          );
        }
      });

    if (!results.length) {
      list.innerHTML =
        '<div class="list-card"><small>No results found.</small></div>';
      return;
    }

    list.innerHTML =
      results.map(function (x) {
        return `
          <div class="list-card">
            ${esc(x)}
          </div>
        `;
      }).join("");
  }

  window.searchAllData =
    searchAllData;

  /* =======================================================
     QUICK ADD
     ======================================================= */

  function openQuickAdd() {
    const choice =
      confirm(
        "OK = Add Udhar\nCancel = Add Transaction"
      );

    if (choice) {
      openKhataForm(
        D.mode || "personal"
      );
    } else {
      show("transactions");
    }
  }

  window.openQuickAdd =
    openQuickAdd;

  /* =======================================================
     MASTER RENDER
     ======================================================= */

  function renderAll() {
    try {
      renderHome();
      renderPersonal();
      renderBusiness();
      renderKhataDetail();
      renderTransactions();
      renderGoals();
      renderBills();
      renderReports();
      renderReminders();
      renderFamily();

      window.D = D;
    } catch (e) {
      console.error(
        "HISAB render error:",
        e
      );
    }
  }

  window.HISAB = {
    render: renderAll,
    save: save,
    data: function () {
      return D;
    }
  };

  /* =======================================================
     STARTUP
     ======================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      try {
        window.D = D;

        const guest =
          localStorage.getItem(
            GUEST_KEY
          );

        if (guest === "1") {
          const shell =
            $("appShell");

          const gate =
            $("guestGate");

          if (gate) {
            gate.classList.remove(
              "active"
            );
          }

          if (shell) {
            shell.style.display =
              "block";
          }

          show("home");
        } else {
          showGuestGate();
        }

        renderAll();

      } catch (e) {
        console.error(
          "HISAB startup error:",
          e
        );

        const gate =
          $("guestGate");

        if (gate) {
          gate.classList.add(
            "active"
          );
        }
      }
    }
  );

})();
