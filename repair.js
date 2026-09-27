 /* =========================================================
    HISAB V7 — FINAL REPAIR CONTROLLER
    Works with existing:
    index.html + app.js + style.css

    Includes:
    • Visible Back Button
    • Android/Browser Back
    • Personal / Business mode safety
    • Contact picker
    • Bills Paid/Pending
    • Multiple Bill records
    • Loan payment support
    • Loan payment history
    • EMI Paid/Pending
    • EMI history
    • Budget helpers
    • Savings helpers
    • PDF/Share connectors

    IMPORTANT:
    This file does not replace the main app controller.
    ========================================================= */

(function () {

  "use strict";

  /* =======================================================
     SAFE HELPERS
     ======================================================= */

  const $ = id =>
    document.getElementById(id);

  function getData() {
    try {
      return D;
    } catch (e) {
      return null;
    }
  }

  function saveSafe() {
    try {
      if (typeof save === "function") {
        save();
      }
    } catch (e) {}
  }

  function safeUid() {
    try {
      if (typeof uid === "function") {
        return uid();
      }
    } catch (e) {}

    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function safeToday() {
    try {
      if (typeof today === "function") {
        return today();
      }
    } catch (e) {}

    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  function safeMoney(value) {

    try {
      if (typeof money === "function") {
        return money(value);
      }
    } catch (e) {}

    const d = getData();

    return (
      (d?.currency || "₹") +
      Number(value || 0)
        .toLocaleString(
          "en-IN",
          {
            maximumFractionDigits: 2
          }
        )
    );
  }

  function safeEsc(value) {

    try {
      if (typeof esc === "function") {
        return esc(value);
      }
    } catch (e) {}

    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        function (m) {
          return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          }[m];
        }
      );
  }

  /* =======================================================
     BACK BUTTON
     ======================================================= */

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

  let backButton = null;

  let backBusy = false;

  let currentHistoryPage = "home";

  function createBackButton() {

    if (
      backButton &&
      document.body &&
      document.body.contains(backButton)
    ) {
      return;
    }

    if (!document.body) {
      return;
    }

    backButton =
      document.createElement("button");

    backButton.id =
      "hisabGlobalBackButton";

    backButton.type =
      "button";

    backButton.textContent =
      "← Back";

    backButton.setAttribute(
      "aria-label",
      "Back"
    );

    backButton.style.cssText = `
      position:fixed;
      left:12px;
      top:calc(8px + env(safe-area-inset-top));
      z-index:999999;
      display:none;
      padding:10px 16px;
      min-height:42px;
      border:0;
      border-radius:12px;
      background:#eef2f7;
      color:#082b45;
      font-size:15px;
      font-weight:700;
      line-height:20px;
      box-shadow:0 3px 12px rgba(0,0,0,.18);
      cursor:pointer;
      -webkit-tap-highlight-color:transparent;
    `;

    backButton.onclick =
      function () {

        if (backBusy) {
          return;
        }

        backBusy = true;

        try {

          /* Khata Entry / Detail should return
             directly to the correct parent screen. */

          let pageId = "";

          try {
            const p =
              typeof currentPage ===
              "function"
                ? currentPage()
                : null;

            pageId =
              p?.id || "";
          } catch (e) {}

          if (
            pageId ===
              "khataEntry" ||
            pageId ===
              "khataDetail"
          ) {

            const d =
              getData();

            const parent =
              d &&
              d.detailMode ===
                "business"
                ? "business"
                : "personal";

            if (
              typeof window.show ===
              "function"
            ) {
              window.show(parent);
            }

            setTimeout(
              function () {
                backBusy = false;
                updateBackButton();
              },
              200
            );

            return;
          }

          /* Normal pages */

          if (
            typeof window.back ===
            "function"
          ) {
            window.back();

          } else if (
            typeof window.goBack ===
            "function"
          ) {
            window.goBack();

          } else {

            if (
              typeof window.show ===
              "function"
            ) {
              window.show("home");
            }

          }

        } catch (e) {

          try {

            if (
              typeof window.show ===
              "function"
            ) {
              window.show("home");
            }

          } catch (x) {}

        }

        setTimeout(
          function () {
            backBusy = false;
            updateBackButton();
          },
          250
        );

      };

    document.body.appendChild(
      backButton
    );
  }

  function getCurrentPageId() {

    try {

      if (
        typeof currentPage ===
        "function"
      ) {

        const p =
          currentPage();

        if (p && p.id) {
          return p.id;
        }

      }

    } catch (e) {}

    return "";
  }

  function updateBackButton() {

    if (!document.body) {
      return;
    }

    createBackButton();

    if (!backButton) {
      return;
    }

    const id =
      getCurrentPageId();

    if (
      BACK_PAGES.includes(id)
    ) {

      backButton.style.display =
        "block";

    } else {

      backButton.style.display =
        "none";

    }
  }

  /* =======================================================
     SHOW WRAPPER
     ======================================================= */

  const appShow =
    typeof window.show ===
    "function"
      ? window.show
      : null;

  if (appShow) {

    window.show =
      function (id) {

        currentHistoryPage =
          id || "home";

        try {

          const d =
            getData();

          if (d) {

            if (
              id === "personal"
            ) {
              d.mode =
                "personal";
            }

            if (
              id === "business"
            ) {
              d.mode =
                "business";
            }

            saveSafe();

          }

        } catch (e) {}

        let result;

        try {

          result =
            appShow.apply(
              this,
              arguments
            );

        } catch (e) {

          result =
            undefined;

        }

        setTimeout(
          updateBackButton,
          30
        );

        return result;
      };

  }

  /* =======================================================
     INITIAL HISTORY STATE
     ======================================================= */

  function setupHistory() {

    try {

      if (
        !history.state ||
        !history.state.hisabPage
      ) {

        history.replaceState(
          {
            hisabPage: "home"
          },
          "",
          "#home"
        );

      }

    } catch (e) {}

  }

  /* =======================================================
     POPSTATE
     ======================================================= */

  window.addEventListener(
    "popstate",
    function () {

      let id =
        "home";

      try {

        id =
          location.hash
            ? location.hash
                .substring(1)
            : "home";

      } catch (e) {}

      if (!$(id)) {
        id = "home";
      }

      currentHistoryPage =
        id;

      try {

        if (appShow) {
          appShow(id);
        }

      } catch (e) {}

      setTimeout(
        updateBackButton,
        50
      );

    }
  );

  /* =======================================================
     ANDROID BACK EVENT
     ======================================================= */

  document.addEventListener(
    "backbutton",
    function (e) {

      try {
        e.preventDefault();
      } catch (x) {}

      if (
        backButton &&
        backButton.style.display !==
          "none"
      ) {

        backButton.click();

      } else {

        try {

          if (
            typeof window.show ===
            "function"
          ) {
            window.show("home");
          }

        } catch (x) {}

      }

    },
    false
  );

  /* =======================================================
     CAPACITOR APP BACK SUPPORT
     ======================================================= */

  function setupCapacitorBack() {

    try {

      if (
        window.Capacitor &&
        typeof
          window.Capacitor.Plugins !==
          "undefined"
      ) {

        const App =
          window.Capacitor.Plugins.App;

        if (
          App &&
          typeof App.addListener ===
            "function"
        ) {

          App.addListener(
            "backButton",
            function () {

              if (
                backButton &&
                backButton.style.display !==
                  "none"
              ) {

                backButton.click();

              } else {

                try {

                  if (
                    typeof window.show ===
                    "function"
                  ) {
                    window.show(
                      "home"
                    );
                  }

                } catch (e) {}

              }

            }
          );

        }

      }

    } catch (e) {}

  }

  /* =======================================================
     BUSINESS CONTACT
     ======================================================= */

  function fillBusinessContact(
    contact
  ) {

    if (!contact) {
      return;
    }

    let name = "";
    let phone = "";

    try {

      if (
        Array.isArray(
          contact.name
        )
      ) {

        name =
          contact.name[0] ||
          "";

      } else {

        name =
          contact.name ||
          "";

      }

    } catch (e) {}

    try {

      if (
        Array.isArray(
          contact.phones
        )
      ) {

        phone =
          contact.phones[0]?.number ||
          contact.phones[0]?.value ||
          "";

      }

    } catch (e) {}

    try {

      if (
        !phone &&
        Array.isArray(
          contact.tel
        )
      ) {

        phone =
          contact.tel[0] ||
          "";

      }

    } catch (e) {}

    if (
      $("businessPersonName")
    ) {

      $("businessPersonName")
        .value = name;

    }

    if (
      $("businessPersonPhone")
    ) {

      $("businessPersonPhone")
        .value = phone;

    }

  }

  window.selectBusinessContact =
    async function () {

      try {

        /* Capacitor plugin */

        if (
          window.Capacitor &&
          typeof
            window.Capacitor
              .registerPlugin ===
            "function"
        ) {

          const Contacts =
            window.Capacitor
              .registerPlugin(
                "Contacts"
              );

          if (
            Contacts &&
            typeof
              Contacts.pickContact ===
              "function"
          ) {

            const result =
              await Contacts
                .pickContact();

            const contact =
              result?.contact ||
              result;

            if (contact) {

              fillBusinessContact(
                contact
              );

              return;

            }

          }

          if (
            Contacts &&
            typeof
              Contacts.pickContacts ===
              "function"
          ) {

            const result =
              await Contacts
                .pickContacts({
                  multiple:false
                });

            const contact =
              result?.contacts?.[0] ||
              result?.[0];

            if (contact) {

              fillBusinessContact(
                contact
              );

              return;

            }

          }

        }

        /* Browser Contacts API */

        if (
          navigator.contacts &&
          typeof
            navigator.contacts.select ===
            "function"
        ) {

          const contacts =
            await navigator.contacts
              .select(
                ["name","tel"],
                {
                  multiple:false
                }
              );

          if (
            contacts &&
            contacts[0]
          ) {

            fillBusinessContact(
              contacts[0]
            );

            return;

          }

        }

        throw new Error(
          "Contact picker unavailable"
        );

      } catch (e) {

        alert(
          "Phone contact picker available nahi hai.\n\n" +
          "Name aur Mobile number manually enter karein."
        );

      }

    };

  function connectContactButton() {

    const btn =
      $("selectBusinessContact");

    if (!btn) {
      return;
    }

    btn.onclick =
      window.selectBusinessContact;
  }

  /* =======================================================
     BILL DATA
     ======================================================= */

  function ensureBillData() {

    const d =
      getData();

    if (!d) {
      return;
    }

    if (
      !Array.isArray(d.bills)
    ) {

      d.bills = [];

    }

    let changed = false;

    d.bills.forEach(
      function (x) {

        if (!x.id) {

          x.id =
            safeUid();

          changed = true;

        }

        if (!x.status) {

          x.status =
            "pending";

          changed = true;

        }

        if (!x.date) {

          x.date =
            x.due ||
            safeToday();

          changed = true;

        }

        if (
          x.paid ===
          undefined
        ) {

          x.paid =
            x.status ===
            "settled";

          changed = true;

        }

        if (
          !Array.isArray(
            x.history
          )
        ) {

          x.history = [];

          changed = true;

        }

      }
    );

    if (changed) {
      saveSafe();
    }

  }

  /* =======================================================
     BILL PAID
     ======================================================= */

  window.markBillPaid =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const bill =
        d.bills.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!bill) {
        return;
      }

      bill.status =
        "settled";

      bill.paid = true;

      bill.paidDate =
        safeToday();

      if (
        !Array.isArray(
          bill.history
        )
      ) {
        bill.history = [];
      }

      bill.history.push({
        id:safeUid(),
        type:"payment",
        amount:Number(
          bill.amount || 0
        ),
        date:safeToday()
      });

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     BILL PENDING
     ======================================================= */

  window.markBillPending =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const bill =
        d.bills.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!bill) {
        return;
      }

      bill.status =
        "pending";

      bill.paid =
        false;

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     BILL HISTORY
     ======================================================= */

  window.viewBillHistory =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const bill =
        d.bills.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!bill) {
        return;
      }

      const history =
        Array.isArray(
          bill.history
        )
          ? bill.history
          : [];

      let text =
        "HISAB BILL HISTORY\n\n";

      text +=
        "Bill: " +
        (bill.name || "") +
        "\n";

      text +=
        "Amount: " +
        safeMoney(
          bill.amount
        ) +
        "\n\n";

      if (!history.length) {

        text +=
          "No payment history yet.";

      } else {

        history.forEach(
          function (p,i) {

            text +=
              (i + 1) +
              ". " +
              (p.date || "-") +
              "  " +
              safeMoney(
                p.amount || 0
              ) +
              "\n";

          }
        );

      }

      shareTextSafe(
        text,
        "HISAB Bill History"
      );

    };

  /* =======================================================
     ORIGINAL ADD BILL WRAPPER
     ======================================================= */

  const originalAddBill =
    window.addBill;

  if (
    typeof originalAddBill ===
    "function"
  ) {

    window.addBill =
      function (kind = "Bill") {

        originalAddBill(
          kind
        );

        setTimeout(
          function () {

            ensureBillData();

            try {
              renderEnhancedPayments();
            } catch (e) {}

          },
          40
        );

      };

  }

  /* =======================================================
     LOAN DATA
     ======================================================= */

  function ensureLoanData() {

    const d =
      getData();

    if (!d) {
      return;
    }

    if (
      !Array.isArray(
        d.loans
      )
    ) {

      d.loans = [];

    }

    if (
      !Array.isArray(
        d.emis
      )
    ) {

      d.emis = [];

    }

    let changed = false;

    d.loans.forEach(
      function (x) {

        if (!x.id) {

          x.id =
            safeUid();

          changed = true;

        }

        if (!x.date) {

          x.date =
            safeToday();

          changed = true;

        }

        if (!x.status) {

          x.status =
            "active";

          changed = true;

        }

        if (
          x.paid ===
          undefined
        ) {

          x.paid = 0;

          changed = true;

        }

        if (
          x.remaining ===
          undefined
        ) {

          x.remaining =
            Math.max(
              0,
              Number(
                x.amount || 0
              ) -
              Number(
                x.paid || 0
              )
            );

          changed = true;

        }

        if (
          !Array.isArray(
            x.history
          )
        ) {

          x.history = [];

          changed = true;

        }

      }
    );

    d.emis.forEach(
      function (x) {

        if (!x.id) {

          x.id =
            safeUid();

          changed = true;

        }

        if (!x.date) {

          x.date =
            safeToday();

          changed = true;

        }

        if (!x.status) {

          x.status =
            "pending";

          changed = true;

        }

        if (
          !Array.isArray(
            x.history
          )
        ) {

          x.history = [];

          changed = true;

        }

      }
    );

    if (changed) {
      saveSafe();
    }

  }

  /* =======================================================
     LOAN PAYMENT
     ======================================================= */

  window.addLoanPayment =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const loan =
        d.loans.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!loan) {
        return;
      }

      const amount =
        Number(
          prompt(
            "Payment amount"
          ) || 0
        );

      if (amount <= 0) {

        alert(
          "Enter valid payment amount"
        );

        return;

      }

      const remaining =
        Math.max(
          0,
          Number(
            loan.amount || 0
          ) -
          Number(
            loan.paid || 0
          )
        );

      if (
        amount > remaining &&
        remaining > 0
      ) {

        alert(
          "Payment cannot be greater than remaining amount."
        );

        return;

      }

      if (
        !Array.isArray(
          loan.history
        )
      ) {

        loan.history = [];

      }

      loan.history.push({
        id:safeUid(),
        amount,
        date:safeToday()
      });

      loan.paid =
        Number(
          loan.paid || 0
        ) +
        amount;

      loan.remaining =
        Math.max(
          0,
          Number(
            loan.amount || 0
          ) -
          loan.paid
        );

      loan.lastPaymentDate =
        safeToday();

      if (
        loan.remaining <= 0
      ) {

        loan.status =
          "completed";

      } else {

        loan.status =
          "active";

      }

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     LOAN HISTORY
     ======================================================= */

  window.viewLoanHistory =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const loan =
        d.loans.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!loan) {
        return;
      }

      const history =
        Array.isArray(
          loan.history
        )
          ? loan.history
          : [];

      let text =
        "HISAB LOAN PAYMENT HISTORY\n\n";

      text +=
        "Loan: " +
        (loan.name || "") +
        "\n\n";

      if (!history.length) {

        text +=
          "No payments yet.";

      } else {

        history.forEach(
          function (p,i) {

            text +=
              (i + 1) +
              ". " +
              (p.date || "-") +
              "  " +
              safeMoney(
                p.amount || 0
              ) +
              "\n";

          }
        );

      }

      text +=
        "\nTotal Paid: " +
        safeMoney(
          loan.paid || 0
        );

      text +=
        "\nRemaining: " +
        safeMoney(
          loan.remaining || 0
        );

      shareTextSafe(
        text,
        "HISAB Loan History"
      );

    };

  /* =======================================================
     EMI PAID
     ======================================================= */

  window.markEMIPaid =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const emi =
        d.emis.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!emi) {
        return;
      }

      emi.status =
        "paid";

      emi.paidDate =
        safeToday();

      if (
        !Array.isArray(
          emi.history
        )
      ) {

        emi.history = [];

      }

      emi.history.push({
        id:safeUid(),
        amount:Number(
          emi.emi || 0
        ),
        date:safeToday()
      });

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     EMI PENDING
     ======================================================= */

  window.markEMIPending =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const emi =
        d.emis.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!emi) {
        return;
      }

      emi.status =
        "pending";

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     EMI HISTORY
     ======================================================= */

  window.viewEMIHistory =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const emi =
        d.emis.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!emi) {
        return;
      }

      const history =
        Array.isArray(
          emi.history
        )
          ? emi.history
          : [];

      let text =
        "HISAB EMI PAYMENT HISTORY\n\n";

      text +=
        "EMI: " +
        safeMoney(
          emi.emi || 0
        ) +
        "\n\n";

      if (!history.length) {

        text +=
          "No payments yet.";

      } else {

        history.forEach(
          function (p,i) {

            text +=
              (i + 1) +
              ". " +
              (p.date || "-") +
              "  " +
              safeMoney(
                p.amount ||
                emi.emi ||
                0
              ) +
              "\n";

          }
        );

      }

      shareTextSafe(
        text,
        "HISAB EMI History"
      );

    };

  /* =======================================================
     ORIGINAL LOAN / EMI WRAPPERS
     ======================================================= */

  const originalSaveLoan =
    window.saveLoan;

  if (
    typeof originalSaveLoan ===
    "function"
  ) {

    window.saveLoan =
      function () {

        originalSaveLoan();

        setTimeout(
          function () {

            ensureLoanData();

            try {
              renderEnhancedPayments();
            } catch (e) {}

          },
          40
        );

      };

  }

  const originalCalcEMI =
    window.calcEMI;

  if (
    typeof originalCalcEMI ===
    "function"
  ) {

    window.calcEMI =
      function () {

        originalCalcEMI();

        setTimeout(
          function () {

            ensureLoanData();

            try {
              renderEnhancedPayments();
            } catch (e) {}

          },
          40
        );

      };

  }

  /* =======================================================
     ENHANCED PAYMENT DISPLAY
     ======================================================= */

  window.renderEnhancedPayments =
    function () {

      ensureBillData();
      ensureLoanData();

      const list =
        $("billList");

      if (!list) {
        return;
      }

      const d =
        getData();

      if (!d) {
        return;
      }

      const bills =
        d.bills.filter(
          function (x) {
            return x.kind === "bill";
          }
        );

      const cards =
        d.bills.filter(
          function (x) {
            return x.kind === "card";
          }
        );

      const loans =
        d.loans || [];

      const emis =
        d.emis || [];

      list.innerHTML = `

        <!-- BILLS -->

        <div class="list-card">

          <h3>🧾 Bills</h3>

          ${
            bills.length

            ? bills.map(
                function (x) {

                  const paid =
                    x.status ===
                    "settled";

                  return `

                    <div class="list-card">

                      <b>
                        ${safeEsc(
                          x.name
                        )}
                      </b>

                      <div class="amount">
                        ${safeMoney(
                          x.amount
                        )}
                      </div>

                      <div class="meta">
                        Date:
                        ${safeEsc(
                          x.date || "-"
                        )}
                      </div>

                      <div class="meta">
                        Due:
                        ${safeEsc(
                          x.due || "-"
                        )}
                      </div>

                      <div
                        style="
                          margin-top:8px;
                          font-weight:700;
                        "
                      >

                        ${
                          paid

                          ? `
                            <span
                              class="status-settled"
                            >
                              ✓ Paid
                            </span>
                          `

                          : `
                            <span
                              class="status-pending"
                            >
                              🟠 Pending
                            </span>
                          `
                        }

                      </div>

                      <div
                        class="action-row"
                        style="margin-top:9px"
                      >

                        ${
                          !paid

                          ? `
                            <button
                              type="button"
                              onclick="markBillPaid('${x.id}')"
                            >
                              ✓ Mark Paid
                            </button>
                          `

                          : `
                            <button
                              type="button"
                              onclick="markBillPending('${x.id}')"
                            >
                              ↩ Pending
                            </button>
                          `
                        }

                        ${
                          x.history &&
                          x.history.length

                          ? `
                            <button
                              type="button"
                              onclick="viewBillHistory('${x.id}')"
                            >
                              History
                            </button>
                          `

                          : ""
                        }

                        <button
                          type="button"
                          onclick="deleteBill('${x.id}')"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  `;

                }
              ).join("")

            : `
              <div class="meta">
                No bills yet.
              </div>
            `
          }

        </div>


        <!-- CREDIT CARDS -->

        <div class="list-card">

          <h3>💳 Credit Cards</h3>

          ${
            cards.length

            ? cards.map(
                function (x) {

                  const paid =
                    x.status ===
                    "settled";

                  return `

                    <div class="list-card">

                      <b>
                        ${safeEsc(
                          x.name
                        )}
                      </b>

                      <div class="amount">
                        ${safeMoney(
                          x.amount
                        )}
                      </div>

                      <div class="meta">
                        Due:
                        ${safeEsc(
                          x.due || "-"
                        )}
                      </div>

                      <div
                        style="margin-top:8px"
                      >

                        ${
                          paid

                          ? `
                            <span
                              class="status-settled"
                            >
                              ✓ Paid
                            </span>
                          `

                          : `
                            <span
                              class="status-pending"
                            >
                              🟠 Pending
                            </span>
                          `
                        }

                      </div>

                      <div
                        class="action-row"
                        style="margin-top:9px"
                      >

                        ${
                          !paid

                          ? `
                            <button
                              type="button"
                              onclick="markBillPaid('${x.id}')"
                            >
                              ✓ Mark Paid
                            </button>
                          `

                          : `
                            <button
                              type="button"
                              onclick="markBillPending('${x.id}')"
                            >
                              ↩ Pending
                            </button>
                          `
                        }

                        ${
                          x.history &&
                          x.history.length

                          ? `
                            <button
                              type="button"
                              onclick="viewBillHistory('${x.id}')"
                            >
                              History
                            </button>
                          `

                          : ""
                        }

                        <button
                          type="button"
                          onclick="deleteBill('${x.id}')"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  `;

                }
              ).join("")

            : `
              <div class="meta">
                No credit card bills.
              </div>
            `
          }

        </div>


        <!-- LOANS -->

        <div class="list-card">

          <h3>🏦 Loans</h3>

          ${
            loans.length

            ? loans.map(
                function (x) {

                  const amount =
                    Number(
                      x.amount || 0
                    );

                  const paid =
                    Number(
                      x.paid || 0
                    );

                  const remaining =
                    Math.max(
                      0,
                      Number(
                        x.remaining !==
                        undefined
                          ? x.remaining
                          : amount - paid
                      )
                    );

                  const percent =
                    amount > 0

                    ? Math.min(
                        100,
                        Math.round(
                          paid /
                          amount *
                          100
                        )
                      )

                    : 0;

                  const completed =
                    remaining <= 0;

                  return `

                    <div class="list-card">

                      <b>
                        ${safeEsc(
                          x.name
                        )}
                      </b>

                      <div class="amount">
                        ${safeMoney(
                          amount
                        )}
                      </div>

                      <div class="meta">
                        Interest:
                        ${safeEsc(
                          x.rate || 0
                        )}%
                        •
                        ${safeEsc(
                          x.months || 0
                        )}
                        months
                      </div>

                      <div class="meta">
                        Loan Date:
                        ${safeEsc(
                          x.date || "-"
                        )}
                      </div>

                      <div class="meta">
                        Paid:
                        ${safeMoney(
                          paid
                        )}
                      </div>

                      <div class="meta">
                        Remaining:
                        ${safeMoney(
                          remaining
                        )}
                      </div>

                      <div
                        style="
                          margin-top:9px;
                          background:#edf1f7;
                          border-radius:10px;
                          overflow:hidden;
                          height:9px;
                        "
                      >

                        <div
                          style="
                            width:${percent}%;
                            height:100%;
                            background:var(--green,#12a875);
                          "
                        ></div>

                      </div>

                      <div class="meta">
                        ${percent}%
                        completed
                      </div>

                      <div
                        style="margin-top:8px"
                      >

                        ${
                          completed

                          ? `
                            <span
                              class="status-settled"
                            >
                              ✓ Completed
                            </span>
                          `

                          : `
                            <span
                              class="status-pending"
                            >
                              🟠 Active
                            </span>
                          `
                        }

                      </div>

                      <div
                        class="action-row"
                        style="margin-top:9px"
                      >

                        ${
                          !completed

                          ? `
                            <button
                              type="button"
                              onclick="addLoanPayment('${x.id}')"
                            >
                              💵 Payment
                            </button>
                          `

                          : ""
                        }

                        ${
                          x.history &&
                          x.history.length

                          ? `
                            <button
                              type="button"
                              onclick="viewLoanHistory('${x.id}')"
                            >
                              History
                            </button>
                          `

                          : ""
                        }

                        <button
                          type="button"
                          onclick="deleteLoan('${x.id}')"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  `;

                }
              ).join("")

            : `
              <div class="meta">
                No loans yet.
              </div>
            `
          }

        </div>


        <!-- EMI -->

        <div class="list-card">

          <h3>📅 EMI</h3>

          ${
            emis.length

            ? emis.map(
                function (x) {

                  const paid =
                    x.status ===
                    "paid";

                  return `

                    <div class="list-card">

                      <b>
                        EMI
                        ${safeMoney(
                          x.emi
                        )}
                      </b>

                      <div class="meta">
                        Principal:
                        ${safeMoney(
                          x.principal
                        )}
                      </div>

                      <div class="meta">
                        Tenure:
                        ${safeEsc(
                          x.months || 0
                        )}
                        months
                      </div>

                      <div class="meta">
                        Date:
                        ${safeEsc(
                          x.date || "-"
                        )}
                      </div>

                      <div
                        style="margin-top:8px"
                      >

                        ${
                          paid

                          ? `
                            <span
                              class="status-settled"
                            >
                              ✓ Paid
                            </span>
                          `

                          : `
                            <span
                              class="status-pending"
                            >
                              🟠 Pending
                            </span>
                          `
                        }

                      </div>

                      <div
                        class="action-row"
                        style="margin-top:9px"
                      >

                        ${
                          !paid

                          ? `
                            <button
                              type="button"
                              onclick="markEMIPaid('${x.id}')"
                            >
                              ✓ EMI Paid
                            </button>
                          `

                          : `
                            <button
                              type="button"
                              onclick="markEMIPending('${x.id}')"
                            >
                              ↩ Pending
                            </button>
                          `
                        }

                        ${
                          x.history &&
                          x.history.length

                          ? `
                            <button
                              type="button"
                              onclick="viewEMIHistory('${x.id}')"
                            >
                              History
                            </button>
                          `

                          : ""
                        }

                        <button
                          type="button"
                          onclick="deleteEMI('${x.id}')"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  `;

                }
              ).join("")

            : `
              <div class="meta">
                No EMI records.
              </div>
            `
          }

        </div>

      `;

    };

  /* =======================================================
     BUDGET HELPERS
     ======================================================= */

  window.viewBudget =
    function () {

      const d =
        getData();

      if (!d) {
        return;
      }

      let spent = 0;

      try {

        if (
          typeof totalExpense ===
          "function"
        ) {
          spent =
            totalExpense();
        }

      } catch (e) {}

      const budget =
        Number(
          d.budget || 0
        );

      alert(
        "Monthly Budget\n\n" +
        "Budget: " +
        safeMoney(
          budget
        ) +
        "\nSpent: " +
        safeMoney(
          spent
        ) +
        "\nRemaining: " +
        safeMoney(
          budget - spent
        )
      );

    };

  window.changeBudget =
    function () {

      const d =
        getData();

      if (!d) {
        return;
      }

      const amount =
        Number(
          prompt(
            "Enter new monthly budget",
            d.budget || 0
          ) || 0
        );

      if (amount < 0) {

        alert(
          "Invalid budget"
        );

        return;

      }

      d.budget =
        amount;

      saveSafe();

      try {

        if (
          typeof renderPlanning ===
          "function"
        ) {
          renderPlanning();
        }

      } catch (e) {}

    };

  /* =======================================================
     SAVINGS
     ======================================================= */

  window.updateSavings =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      const goal =
        d.goals.find(
          function (x) {
            return x.id === id;
          }
        );

      if (!goal) {
        return;
      }

      const amount =
        Number(
          prompt(
            "Add saved amount",
            0
          ) || 0
        );

      if (amount <= 0) {

        alert(
          "Enter valid amount"
        );

        return;

      }

      goal.saved =
        Number(
          goal.saved || 0
        ) +
        amount;

      saveSafe();

      try {

        if (
          typeof renderPlanning ===
          "function"
        ) {
          renderPlanning();
        }

      } catch (e) {}

    };

  window.deleteGoal =
    function (id) {

      const d =
        getData();

      if (!d) {
        return;
      }

      if (
        !confirm(
          "Delete this savings goal?"
        )
      ) {
        return;
      }

      d.goals =
        (d.goals || [])
          .filter(
            function (x) {
              return x.id !== id;
            }
          );

      saveSafe();

      try {

        if (
          typeof renderPlanning ===
          "function"
        ) {
          renderPlanning();
        }

      } catch (e) {}

    };

  /* =======================================================
     FAMILY DELETE
     ======================================================= */

  if (
    typeof window.deleteFamily !==
    "function"
  ) {

    window.deleteFamily =
      function (id) {

        const d =
          getData();

        if (!d) {
          return;
        }

        d.family =
          (d.family || [])
            .filter(
              function (x) {
                return x.id !== id;
              }
            );

        saveSafe();

        try {

          if (
            typeof renderFamily ===
            "function"
          ) {
            renderFamily();
          }

        } catch (e) {}

      };

  }

  /* =======================================================
     PLANNING ACTIONS
     ======================================================= */

  const originalPlanning =
    window.renderPlanning;

  if (
    typeof originalPlanning ===
    "function"
  ) {

    window.renderPlanning =
      function () {

        originalPlanning();

        setTimeout(
          function () {

            const list =
              $("goalList");

            const d =
              getData();

            if (
              !list ||
              !d ||
              !Array.isArray(
                d.goals
              ) ||
              !d.goals.length
            ) {
              return;
            }

            const cards =
              list.querySelectorAll(
                ".list-card"
              );

            d.goals.forEach(
              function (g,i) {

                const card =
                  cards[i + 1];

                if (!card) {
                  return;
                }

                if (
                  card.querySelector(
                    ".hisab-goal-actions"
                  )
                ) {
                  return;
                }

                const actions =
                  document.createElement(
                    "div"
                  );

                actions.className =
                  "hisab-goal-actions action-row";

                actions.style.marginTop =
                  "9px";

                actions.innerHTML = `

                  <button
                    type="button"
                    onclick="updateSavings('${g.id}')"
                  >
                    + Save
                  </button>

                  <button
                    type="button"
                    onclick="deleteGoal('${g.id}')"
                  >
                    Delete
                  </button>

                `;

                card.appendChild(
                  actions
                );

              }
            );

          },
          30
        );

      };

  }

  /* =======================================================
     SHARE / PDF
     ======================================================= */

  window.shareCurrentKhata =
    function () {

      try {

        if (
          typeof shareKhata ===
          "function"
        ) {

          shareKhata();
          return;

        }

      } catch (e) {}

      alert(
        "Share function unavailable"
      );

    };

  window.pdfCurrentKhata =
    function () {

      try {

        if (
          typeof exportKhataPDF ===
          "function"
        ) {

          exportKhataPDF();
          return;

        }

      } catch (e) {}

      alert(
        "PDF function unavailable"
      );

    };

  /* =======================================================
     STARTUP
     ======================================================= */

  function startupRepair() {

    try {
      setupHistory();
    } catch (e) {}

    try {
      ensureBillData();
    } catch (e) {}

    try {
      ensureLoanData();
    } catch (e) {}

    try {
      connectContactButton();
    } catch (e) {}

    try {
      setupCapacitorBack();
    } catch (e) {}

    setTimeout(
      function () {

        try {
          createBackButton();
        } catch (e) {}

        try {
          connectContactButton();
        } catch (e) {}

        try {

          if (
            typeof ensureModeSwitch ===
            "function"
          ) {
            ensureModeSwitch();
          }

        } catch (e) {}

        try {

          if (
            typeof renderEnhancedPayments ===
            "function"
          ) {
            renderEnhancedPayments();
          }

        } catch (e) {}

        try {
          updateBackButton();
        } catch (e) {}

      },
      250
    );

  }

  /* =======================================================
     DOM OBSERVER
     ======================================================= */

  function startObserver() {

    if (!document.body) {
      return;
    }

    try {

      const observer =
        new MutationObserver(
          function () {

            connectContactButton();

            /*
              Do not constantly recreate
              the Back button.
            */

            if (
              !backButton ||
              !document.body.contains(
                backButton
              )
            ) {
              createBackButton();
            }

            updateBackButton();

          }
        );

      observer.observe(
        document.body,
        {
          childList:true,
          subtree:true
        }
      );

    } catch (e) {}

  }

  /* =======================================================
     START
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      function () {

        startupRepair();
        startObserver();

      }
    );

  } else {

    startupRepair();
    startObserver();

  }

})();
