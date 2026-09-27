/* =========================================================
   HISAB V7 — FINAL REPAIR CONTROLLER
   Stable repair layer
   - Reliable Back buttons
   - Business contacts
   - Bills / Loans / EMI helpers
   - Budget / Savings helpers
   - Family delete
   - PDF / Share connectors
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     SAFE HELPERS
     --------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);

  function getData() {
    try {
      if (window.D && typeof window.D === "object") return window.D;

      const raw =
        localStorage.getItem("hisab_v7_data") ||
        localStorage.getItem("hisabData") ||
        "{}";

      const data = JSON.parse(raw);
      window.D = data;
      return data;
    } catch (e) {
      window.D = window.D || {};
      return window.D;
    }
  }

  function saveSafe() {
    try {
      if (typeof window.save === "function") {
        window.save();
        return;
      }

      const d = getData();
      localStorage.setItem("hisab_v7_data", JSON.stringify(d));
    } catch (e) {}
  }

  function safeUid() {
    try {
      if (typeof window.uid === "function") return window.uid();
    } catch (e) {}

    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function safeToday() {
    try {
      if (typeof window.today === "function") return window.today();
    } catch (e) {}

    return new Date().toISOString().slice(0, 10);
  }

  function safeMoney(n) {
    try {
      if (typeof window.money === "function") return window.money(n);
    } catch (e) {}

    const d = getData();
    const currency = d.currency || "₹";
    return (
      currency +
      Number(n || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
      })
    );
  }

  function safeEsc(v) {
    try {
      if (typeof window.esc === "function") return window.esc(v);
    } catch (e) {}

    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ---------------------------------------------------------
     RELIABLE BACK SYSTEM
     --------------------------------------------------------- */

  const BACK_PAGES = [
    "personal",
    "business",
    "khataEntry",
    "khataDetail",
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
  ];

  function goHisabBack() {
    const d = getData();

    const page =
      document.querySelector(".page.active") ||
      document.querySelector(".page[style*='display: block']");

    const id = page ? page.id : "";

    /* Udhaar form/detail */
    if (id === "khataEntry" || id === "khataDetail") {
      const parent =
        d.detailMode === "business"
          ? "business"
          : "personal";

      if (typeof window.show === "function") {
        window.show(parent);
      }

      updateBackButtons();
      return;
    }

    /* Main pages */
    if (BACK_PAGES.includes(id)) {
      if (typeof window.goBack === "function") {
        window.goBack();
      } else if (typeof window.show === "function") {
        window.show("home");
      }

      setTimeout(updateBackButtons, 40);
      return;
    }

    if (typeof window.show === "function") {
      window.show("home");
    }

    setTimeout(updateBackButtons, 40);
  }

  window.hisabBack = goHisabBack;

  function installBackButtons() {
    document.querySelectorAll(".page").forEach((page) => {
      if (!BACK_PAGES.includes(page.id)) return;

      /*
       * If a page already has its own HISAB back button,
       * don't create another one.
       */
      if (page.querySelector(".hisab-page-back")) return;

      const btn = document.createElement("button");

      btn.type = "button";
      btn.className = "hisab-page-back";
      btn.textContent = "← Back";

      btn.style.cssText = [
        "display:block",
        "width:100%",
        "margin:0 0 12px",
        "padding:10px 14px",
        "border:0",
        "border-radius:12px",
        "background:#eef4f7",
        "color:#082b45",
        "font-size:15px",
        "font-weight:700",
        "text-align:left",
        "cursor:pointer",
        "box-sizing:border-box"
      ].join(";");

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        goHisabBack();
      });

      page.insertBefore(btn, page.firstElementChild);
    });
  }

  function updateBackButtons() {
    const active =
      document.querySelector(".page.active") ||
      document.querySelector(".page[style*='display: block']");

    document.querySelectorAll(".hisab-page-back").forEach((btn) => {
      const page = btn.closest(".page");

      if (active && page === active) {
        btn.style.display = "block";
      } else {
        btn.style.display = "none";
      }
    });
  }

  /*
   * Wrap show() only to refresh Back buttons.
   * No browser history / hash manipulation.
   */
  function connectShow() {
    if (typeof window.show !== "function") return;

    if (window.__hisabShowWrapped) return;
    window.__hisabShowWrapped = true;

    const originalShow = window.show;

    window.show = function (id) {
      try {
        const d = getData();

        if (id === "personal") d.mode = "personal";
        if (id === "business") d.mode = "business";

        saveSafe();
      } catch (e) {}

      const result = originalShow.apply(this, arguments);

      setTimeout(updateBackButtons, 30);
      setTimeout(updateBackButtons, 150);

      return result;
    };
  }

  /* ---------------------------------------------------------
     ANDROID / WEBVIEW BACK
     --------------------------------------------------------- */

  function setupSystemBack() {
    /*
     * Browser / Android WebView fallback.
     */
    document.addEventListener(
      "backbutton",
      function (e) {
        try {
          if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
          }
        } catch (x) {}

        goHisabBack();
      },
      false
    );

    /*
     * Capacitor App plugin, if installed.
     * This is optional and won't break the app if unavailable.
     */
    try {
      const cap = window.Capacitor;

      if (
        cap &&
        cap.Plugins &&
        cap.Plugins.App &&
        typeof cap.Plugins.App.addListener === "function"
      ) {
        if (window.__hisabCapBack) return;

        window.__hisabCapBack = true;

        cap.Plugins.App.addListener(
          "backButton",
          function () {
            goHisabBack();
          }
        );
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     BUSINESS CONTACT PICKER
     --------------------------------------------------------- */

  function connectBusinessContactPicker() {
    if (typeof window.openBusinessContactPicker !== "function") {
      window.openBusinessContactPicker = function (role) {
        const d = getData();

        d.business = Array.isArray(d.business)
          ? d.business
          : [];

        const customers = d.business.filter(
          (x) => x.role === "customer"
        );

        const suppliers = d.business.filter(
          (x) => x.role === "supplier"
        );

        const list =
          role === "supplier"
            ? suppliers
            : customers;

        if (!list.length) {
          if (typeof window.addBusinessContact === "function") {
            window.addBusinessContact(role || "customer");
          }
          return;
        }

        const names = list
          .map(
            (x, i) =>
              `${i + 1}. ${x.name || "Unnamed"}`
          )
          .join("\n");

        const choice = prompt(
          `Select ${role || "customer"}:\n\n${names}\n\nEnter number:`
        );

        if (!choice) return;

        const index = Number(choice) - 1;

        if (index < 0 || index >= list.length) return;

        const selected = list[index];

        d.businessEntryRole =
          role || selected.role || "customer";

        d.selectedBusinessContact =
          selected.id;

        saveSafe();

        if (typeof window.show === "function") {
          window.show("business");
        }
      };
    }
  }

  /* ---------------------------------------------------------
     BILLS
     --------------------------------------------------------- */

  function normalizeBills() {
    const d = getData();

    d.bills = Array.isArray(d.bills)
      ? d.bills
      : [];

    d.bills = d.bills.map((b) => ({
      id: b.id || safeUid(),
      name: b.name || b.title || "Bill",
      amount: Number(
        b.amount ??
        b.value ??
        0
      ),
      dueDate:
        b.dueDate ||
        b.date ||
        safeToday(),
      date:
        b.date ||
        b.dueDate ||
        safeToday(),
      status:
        b.status ||
        "pending",
      note: b.note || "",
      history: Array.isArray(b.history)
        ? b.history
        : []
    }));

    saveSafe();

    return d.bills;
  }

  window.markBillPaid = function (id) {
    const d = getData();
    normalizeBills();

    const bill = d.bills.find(
      (x) => String(x.id) === String(id)
    );

    if (!bill) return;

    bill.status = "paid";

    bill.history.push({
      id: safeUid(),
      type: "paid",
      amount: Number(bill.amount || 0),
      date: safeToday()
    });

    saveSafe();

    if (typeof window.renderPayments === "function") {
      window.renderPayments();
    }
  };

  window.markBillPending = function (id) {
    const d = getData();
    normalizeBills();

    const bill = d.bills.find(
      (x) => String(x.id) === String(id)
    );

    if (!bill) return;

    bill.status = "pending";

    bill.history.push({
      id: safeUid(),
      type: "pending",
      amount: Number(bill.amount || 0),
      date: safeToday()
    });

    saveSafe();

    if (typeof window.renderPayments === "function") {
      window.renderPayments();
    }
  };

  window.viewBillHistory = function (id) {
    const d = getData();
    normalizeBills();

    const bill = d.bills.find(
      (x) => String(x.id) === String(id)
    );

    if (!bill) return;

    const history = Array.isArray(bill.history)
      ? bill.history
      : [];

    const text = history.length
      ? history
          .map(
            (h) =>
              `${h.date || ""} — ${h.type || ""} — ${safeMoney(
                h.amount || 0
              )}`
          )
          .join("\n")
      : "No payment history";

    alert(
      `${bill.name}\n\nAmount: ${safeMoney(
        bill.amount
      )}\nStatus: ${bill.status}\n\nHistory:\n${text}`
    );
  };

  function connectBillAdd() {
    if (typeof window.addBill !== "function") return;
    if (window.__hisabBillWrapped) return;

    window.__hisabBillWrapped = true;

    const originalAddBill = window.addBill;

    window.addBill = function () {
      const result =
        originalAddBill.apply(this, arguments);

      normalizeBills();

      setTimeout(() => {
        if (typeof window.renderPayments === "function") {
          window.renderPayments();
        }
      }, 30);

      return result;
    };
  }

  /* ---------------------------------------------------------
     LOANS
     --------------------------------------------------------- */

  function normalizeLoans() {
    const d = getData();

    d.loans = Array.isArray(d.loans)
      ? d.loans
      : [];

    d.loans = d.loans.map((loan) => ({
      id: loan.id || safeUid(),
      name:
        loan.name ||
        loan.title ||
        "Loan",
      amount: Number(
        loan.amount ??
        loan.principal ??
        0
      ),
      paid: Number(
        loan.paid ??
        0
      ),
      dueDate:
        loan.dueDate ||
        loan.date ||
        safeToday(),
      status:
        loan.status ||
        "pending",
      history: Array.isArray(loan.history)
        ? loan.history
        : []
    }));

    saveSafe();

    return d.loans;
  }

  window.addLoanPayment = function (
    id,
    amount
  ) {
    const d = getData();
    normalizeLoans();

    const loan = d.loans.find(
      (x) => String(x.id) === String(id)
    );

    if (!loan) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    loan.paid =
      Number(loan.paid || 0) +
      value;

    loan.history.push({
      id: safeUid(),
      type: "payment",
      amount: value,
      date: safeToday()
    });

    if (
      Number(loan.amount || 0) > 0 &&
      loan.paid >= loan.amount
    ) {
      loan.status = "paid";
    } else {
      loan.status = "pending";
    }

    saveSafe();

    if (typeof window.renderPayments === "function") {
      window.renderPayments();
    }
  };

  window.viewLoanHistory = function (id) {
    const d = getData();
    normalizeLoans();

    const loan = d.loans.find(
      (x) => String(x.id) === String(id)
    );

    if (!loan) return;

    const history = Array.isArray(loan.history)
      ? loan.history
      : [];

    const text = history.length
      ? history
          .map(
            (h) =>
              `${h.date || ""} — ${safeMoney(
                h.amount || 0
              )}`
          )
          .join("\n")
      : "No payment history";

    alert(
      `${loan.name}\n\nTotal: ${safeMoney(
        loan.amount
      )}\nPaid: ${safeMoney(
        loan.paid
      )}\nRemaining: ${safeMoney(
        Math.max(
          0,
          Number(loan.amount || 0) -
            Number(loan.paid || 0)
        )
      )}\n\nHistory:\n${text}`
    );
  };

  function connectLoanAdd() {
    if (typeof window.saveLoan !== "function") return;
    if (window.__hisabLoanWrapped) return;

    window.__hisabLoanWrapped = true;

    const originalSaveLoan = window.saveLoan;

    window.saveLoan = function () {
      const result =
        originalSaveLoan.apply(this, arguments);

      normalizeLoans();

      setTimeout(() => {
        if (typeof window.renderPayments === "function") {
          window.renderPayments();
        }
      }, 30);

      return result;
    };
  }

  /* ---------------------------------------------------------
     EMI
     --------------------------------------------------------- */

  window.markEMIPaid = function (id) {
    const d = getData();

    d.emis = Array.isArray(d.emis)
      ? d.emis
      : [];

    const emi = d.emis.find(
      (x) => String(x.id) === String(id)
    );

    if (!emi) return;

    emi.status = "paid";

    emi.history = Array.isArray(emi.history)
      ? emi.history
      : [];

    emi.history.push({
      id: safeUid(),
      type: "paid",
      amount: Number(
        emi.amount ??
        emi.emi ??
        0
      ),
      date: safeToday()
    });

    saveSafe();

    if (typeof window.renderPayments === "function") {
      window.renderPayments();
    }
  };

  window.markEMIPending = function (id) {
    const d = getData();

    d.emis = Array.isArray(d.emis)
      ? d.emis
      : [];

    const emi = d.emis.find(
      (x) => String(x.id) === String(id)
    );

    if (!emi) return;

    emi.status = "pending";

    saveSafe();

    if (typeof window.renderPayments === "function") {
      window.renderPayments();
    }
  };

  window.viewEMIHistory = function (id) {
    const d = getData();

    d.emis = Array.isArray(d.emis)
      ? d.emis
      : [];

    const emi = d.emis.find(
      (x) => String(x.id) === String(id)
    );

    if (!emi) return;

    const history = Array.isArray(emi.history)
      ? emi.history
      : [];

    const text = history.length
      ? history
          .map(
            (h) =>
              `${h.date || ""} — ${h.type || ""} — ${safeMoney(
                h.amount || 0
              )}`
          )
          .join("\n")
      : "No EMI history";

    alert(
      `EMI History\n\nAmount: ${safeMoney(
        emi.amount ??
        emi.emi ??
        0
      )}\n\n${text}`
    );
  };

  /* ---------------------------------------------------------
     ENHANCED PAYMENT DISPLAY
     --------------------------------------------------------- */

  function enhancePaymentRenderer() {
    if (typeof window.renderPayments !== "function") {
      return;
    }

    if (window.__hisabPaymentWrapped) return;
    window.__hisabPaymentWrapped = true;

    const originalRenderPayments =
      window.renderPayments;

    window.renderPayments = function () {
      normalizeBills();
      normalizeLoans();

      try {
        return originalRenderPayments.apply(
          this,
          arguments
        );
      } catch (e) {
        return undefined;
      }
    };
  }

  /* ---------------------------------------------------------
     BUDGET
     --------------------------------------------------------- */

  window.saveHisabBudget = function (value) {
    const d = getData();

    d.budget = Number(value || 0);

    saveSafe();

    if (typeof window.renderPlanning === "function") {
      window.renderPlanning();
    }
  };

  /* ---------------------------------------------------------
     SAVINGS
     --------------------------------------------------------- */

  window.addHisabSavings = function (
    name,
    amount,
    date,
    note
  ) {
    const d = getData();

    d.goals = Array.isArray(d.goals)
      ? d.goals
      : [];

    d.goals.push({
      id: safeUid(),
      name:
        name ||
        "Savings",
      amount: Number(
        amount || 0
      ),
      saved: 0,
      date:
        date ||
        safeToday(),
      note:
        note ||
        "",
      type: "savings"
    });

    saveSafe();

    if (typeof window.renderPlanning === "function") {
      window.renderPlanning();
    }
  };

  window.addSavingsAmount = function (
    id,
    amount
  ) {
    const d = getData();

    d.goals = Array.isArray(d.goals)
      ? d.goals
      : [];

    const goal = d.goals.find(
      (x) => String(x.id) === String(id)
    );

    if (!goal) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      alert("Enter a valid savings amount.");
      return;
    }

    goal.saved =
      Number(goal.saved || 0) +
      value;

    saveSafe();

    if (typeof window.renderPlanning === "function") {
      window.renderPlanning();
    }
  };

  /* ---------------------------------------------------------
     FAMILY DELETE
     --------------------------------------------------------- */

  window.deleteHisabFamilyMember = function (id) {
    const d = getData();

    d.family = Array.isArray(d.family)
      ? d.family
      : [];

    const index = d.family.findIndex(
      (x) => String(x.id) === String(id)
    );

    if (index < 0) return;

    if (
      !confirm(
        "Delete this family member?"
      )
    ) {
      return;
    }

    d.family.splice(index, 1);

    saveSafe();

    if (typeof window.renderFamily === "function") {
      window.renderFamily();
    }
  };

  /* ---------------------------------------------------------
     SHARE
     --------------------------------------------------------- */

  window.hisabShareText = async function (
    title,
    textValue
  ) {
    const text = String(
      textValue || ""
    );

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title:
            title ||
            "HISAB",
          text
        });

        return true;
      }
    } catch (e) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("Text copied. You can paste it anywhere.");
      return true;
    } catch (e) {
      alert(text);
      return false;
    }
  };

  /* ---------------------------------------------------------
     PDF / PRINT
     --------------------------------------------------------- */

  window.hisabPDF = function (
    title,
    content
  ) {
    const t =
      title ||
      "HISAB Report";

    const c =
      content ||
      document.querySelector(
        "#reportContent"
      )?.innerText ||
      "";

    const win = window.open(
      "",
      "_blank"
    );

    if (!win) {
      alert(
        "Please allow pop-ups to create the PDF."
      );
      return;
    }

    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${safeEsc(t)}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body{
            font-family:Arial,sans-serif;
            padding:24px;
            color:#111;
            line-height:1.5;
          }
          h1{
            margin-top:0;
          }
          pre{
            white-space:pre-wrap;
            font-family:Arial,sans-serif;
          }
        </style>
      </head>
      <body>
        <h1>${safeEsc(t)}</h1>
        <pre>${safeEsc(c)}</pre>
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
  };

  /* ---------------------------------------------------------
     PLANNING RENDERER REFRESH
     --------------------------------------------------------- */

  function connectPlanning() {
    if (typeof window.renderPlanning !== "function") {
      return;
    }

    if (window.__hisabPlanningWrapped) return;
    window.__hisabPlanningWrapped = true;

    const original =
      window.renderPlanning;

    window.renderPlanning = function () {
      try {
        return original.apply(
          this,
          arguments
        );
      } catch (e) {
        return undefined;
      }
    };
  }

  /* ---------------------------------------------------------
     INPUT SAFETY
     --------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    function (e) {
      /*
       * Prevent accidental form submission by Enter
       * only where explicitly marked.
       */
      if (
        e.key === "Enter" &&
        e.target &&
        e.target.dataset &&
        e.target.dataset.noSubmit === "true"
      ) {
        e.preventDefault();
      }
    },
    false
  );

  /* ---------------------------------------------------------
     STARTUP
     --------------------------------------------------------- */

  function startRepair() {
    try {
      getData();

      /*
       * IMPORTANT:
       * No history.replaceState()
       * No history.pushState()
       * No popstate routing.
       *
       * Back is controlled directly by app.js goBack().
       */

      connectShow();

      normalizeBills();
      normalizeLoans();

      connectBusinessContactPicker();
      connectBillAdd();
      connectLoanAdd();
      enhancePaymentRenderer();
      connectPlanning();
      setupSystemBack();

      installBackButtons();

      setTimeout(installBackButtons, 100);
      setTimeout(installBackButtons, 500);
      setTimeout(updateBackButtons, 600);
    } catch (e) {
      console.log(
        "HISAB repair startup:",
        e
      );
    }
  }

  /* ---------------------------------------------------------
     MUTATION OBSERVER
     --------------------------------------------------------- */

  try {
    const observer =
      new MutationObserver(function () {
        installBackButtons();
        updateBackButtons();
      });

    if (document.body) {
      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );
    }
  } catch (e) {}

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startRepair,
      {
        once: true
      }
    );
  } else {
    startRepair();
  }

})();
