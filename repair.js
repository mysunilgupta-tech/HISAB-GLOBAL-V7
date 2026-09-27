/* =========================================================
   HISAB V7 — FINAL REPAIR / FUNCTION CONNECTOR
   Personal + Business + Udhaar
   Bills + Loans + EMI
   Payment Status + History Support
   Visible Back Button
   Works with existing index.html + app.js + style.css
   ========================================================= */

(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  /* =======================================================
     SAFE ACCESS
     ======================================================= */

  function data() {
    try {
      return D;
    } catch (e) {
      return null;
    }
  }

  function saveSafe() {
    try {
      if (typeof save === "function") save();
    } catch (e) {}
  }

  function refreshPage() {
    try {
      const p =
        typeof currentPage === "function"
          ? currentPage()
          : null;

      if (p && typeof window.show === "function") {
        window.show(p.id);
      }
    } catch (e) {}
  }

  /* =======================================================
     FIX SHOW / MODE
     ======================================================= */

  const originalShow =
    typeof window.show === "function"
      ? window.show
      : null;

  window.show = function (id) {

    try {
      const d = data();

      if (d) {
        if (id === "personal") {
          d.mode = "personal";
        }

        if (id === "business") {
          d.mode = "business";
        }

        saveSafe();
      }
    } catch (e) {}

    if (originalShow) {
      return originalShow(id);
    }
  };

  /* =======================================================
     BACK HISTORY
     ======================================================= */

  let lastPage = "home";

  const originalShowForHistory = window.show;

  window.show = function (id) {

    if (id && id !== lastPage) {
      try {
        history.pushState(
          { hisabPage: id },
          "",
          "#" + id
        );
      } catch (e) {}
    }

    lastPage = id || "home";

    const result =
      originalShowForHistory
        ? originalShowForHistory(id)
        : undefined;

    setTimeout(addVisibleBackButton, 20);

    return result;
  };

  /* =======================================================
     VISIBLE BACK BUTTON
     ======================================================= */

  const backPages = [
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

  function addVisibleBackButton() {

    try {

      document
        .querySelectorAll(".hisab-visible-back")
        .forEach(x => x.remove());

      const page =
        typeof currentPage === "function"
          ? currentPage()
          : null;

      if (!page) return;

      if (!backPages.includes(page.id)) {
        return;
      }

      const btn =
        document.createElement("button");

      btn.className =
        "hisab-visible-back";

      btn.type = "button";

      btn.textContent = "← Back";

      btn.style.cssText = `
        display:block;
        width:calc(100% - 24px);
        margin:10px 12px 6px;
        padding:11px 14px;
        border:0;
        border-radius:12px;
        background:#eef2f7;
        color:#082b45;
        font-size:15px;
        font-weight:700;
        text-align:left;
        cursor:pointer;
        box-sizing:border-box;
      `;

      btn.onclick = function () {

        if (
          typeof window.back ===
          "function"
        ) {
          window.back();
          return;
        }

        if (
          typeof window.goBack ===
          "function"
        ) {
          window.goBack();
          return;
        }

        if (
          typeof window.show ===
          "function"
        ) {
          window.show("home");
        }

      };

      page.insertBefore(
        btn,
        page.firstElementChild
      );

    } catch (e) {}
  }

  /* =======================================================
     BACK BUTTON FUNCTION
     ======================================================= */

  window.back = function () {

    try {

      if (
        location.hash &&
        history.length > 1
      ) {
        history.back();
        return;
      }

    } catch (e) {}

    try {

      if (
        typeof window.goBack ===
        "function"
      ) {
        window.goBack();
        return;
      }

    } catch (e) {}

    try {

      if (
        typeof window.show ===
        "function"
      ) {
        window.show("home");
      }

    } catch (e) {}

  };

  /* =======================================================
     POPSTATE
     ======================================================= */

  window.addEventListener(
    "popstate",
    function () {

      let id = "home";

      try {

        id =
          location.hash
            ? location.hash.substring(1)
            : "home";

      } catch (e) {}

      if (!$(id)) {
        id = "home";
      }

      lastPage = id;

      try {

        if (
          typeof originalShowForHistory ===
          "function"
        ) {
          originalShowForHistory(id);
        }

      } catch (e) {}

      setTimeout(
        addVisibleBackButton,
        30
      );

    }
  );

  /* =======================================================
     ANDROID / BROWSER BACK
     ======================================================= */

  document.addEventListener(
    "backbutton",
    function (e) {

      try {
        e.preventDefault();
      } catch (x) {}

      window.back();

    },
    false
  );

  /* =======================================================
     BUSINESS CONTACT PICKER
     ======================================================= */

  function fillBusinessContact(contact) {

    if (!contact) return;

    let name = "";
    let phone = "";

    if (Array.isArray(contact.name)) {
      name =
        contact.name[0] || "";
    } else {
      name =
        contact.name || "";
    }

    if (Array.isArray(contact.phones)) {

      phone =
        contact.phones[0]?.number ||
        contact.phones[0]?.value ||
        "";

    }

    if (
      !phone &&
      Array.isArray(contact.tel)
    ) {
      phone =
        contact.tel[0] || "";
    }

    if ($("businessPersonName")) {
      $("businessPersonName").value =
        name;
    }

    if ($("businessPersonPhone")) {
      $("businessPersonPhone").value =
        phone;
    }

  }

  window.selectBusinessContact =
    async function () {

      try {

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
              await Contacts.pickContact();

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
              await Contacts.pickContacts({
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

        /* Browser fallback */

        if (
          navigator.contacts &&
          typeof
            navigator.contacts.select ===
            "function"
        ) {

          const contacts =
            await navigator.contacts.select(
              ["name","tel"],
              {
                multiple:false
              }
            );

          if (contacts?.[0]) {

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

  /* =======================================================
     DYNAMIC CONTACT BUTTON
     ======================================================= */

  function connectContactButton() {

    const btn =
      $("selectBusinessContact");

    if (!btn) return;

    btn.onclick =
      window.selectBusinessContact;

  }

  const observer =
    new MutationObserver(
      function () {
        connectContactButton();
        addVisibleBackButton();
      }
    );

  function startObserver() {

    if (!document.body) {

      setTimeout(
        startObserver,
        300
      );

      return;

    }

    try {

      observer.observe(
        document.body,
        {
          childList:true,
          subtree:true
        }
      );

    } catch (e) {}

    connectContactButton();

    addVisibleBackButton();

  }

  /* =======================================================
     BILL DATA
     ======================================================= */

  function ensureBillData() {

    const d = data();

    if (!d) return;

    if (
      !Array.isArray(d.bills)
    ) {
      d.bills = [];
    }

    let changed = false;

    d.bills.forEach(x => {

      if (!x.id) {
        x.id = uid();
        changed = true;
      }

      if (!x.status) {
        x.status = "pending";
        changed = true;
      }

      if (!x.date) {
        x.date =
          x.due || today();
        changed = true;
      }

      if (x.paid === undefined) {
        x.paid =
          x.status === "settled";
        changed = true;
      }

    });

    if (changed) {
      saveSafe();
    }

  }

  /* =======================================================
     ADD BILL
     ======================================================= */

  const originalAddBill =
    window.addBill;

  window.addBill =
    function (kind = "Bill") {

      if (
        typeof originalAddBill ===
        "function"
      ) {
        originalAddBill(kind);
      }

      setTimeout(
        function () {

          ensureBillData();

          try {
            renderEnhancedPayments();
          } catch (e) {}

        },
        30
      );

    };

  /* =======================================================
     BILL PAID / PENDING
     ======================================================= */

  window.markBillPaid =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.bills.find(
          a => a.id === id
        );

      if (!x) return;

      x.status = "settled";
      x.paid = true;
      x.paidDate = today();

      saveSafe();

      renderEnhancedPayments();

    };

  window.markBillPending =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.bills.find(
          a => a.id === id
        );

      if (!x) return;

      x.status = "pending";
      x.paid = false;

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     LOAN / EMI DATA
     ======================================================= */

  function ensureLoanData() {

    const d = data();

    if (!d) return;

    if (
      !Array.isArray(d.loans)
    ) {
      d.loans = [];
    }

    if (
      !Array.isArray(d.emis)
    ) {
      d.emis = [];
    }

    let changed = false;

    d.loans.forEach(x => {

      if (!x.id) {
        x.id = uid();
        changed = true;
      }

      if (!x.date) {
        x.date = today();
        changed = true;
      }

      if (!x.status) {
        x.status = "active";
        changed = true;
      }

      if (x.paid === undefined) {
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
            Number(x.amount || 0) -
            Number(x.paid || 0)
          );

        changed = true;

      }

      if (
        !Array.isArray(x.history)
      ) {
        x.history = [];
        changed = true;
      }

    });

    d.emis.forEach(x => {

      if (!x.id) {
        x.id = uid();
        changed = true;
      }

      if (!x.date) {
        x.date = today();
        changed = true;
      }

      if (!x.status) {
        x.status = "pending";
        changed = true;
      }

      if (
        !Array.isArray(x.history)
      ) {
        x.history = [];
        changed = true;
      }

    });

    if (changed) {
      saveSafe();
    }

  }

  /* =======================================================
     LOAN SAVE
     ======================================================= */

  const originalSaveLoan =
    window.saveLoan;

  window.saveLoan =
    function () {

      if (
        typeof originalSaveLoan ===
        "function"
      ) {
        originalSaveLoan();
      }

      setTimeout(
        function () {

          ensureLoanData();

          try {
            renderEnhancedPayments();
          } catch (e) {}

        },
        30
      );

    };

  /* =======================================================
     EMI CALCULATOR
     ======================================================= */

  const originalCalcEMI =
    window.calcEMI;

  window.calcEMI =
    function () {

      if (
        typeof originalCalcEMI ===
        "function"
      ) {
        originalCalcEMI();
      }

      setTimeout(
        function () {

          ensureLoanData();

          try {
            renderEnhancedPayments();
          } catch (e) {}

        },
        30
      );

    };

  /* =======================================================
     EMI PAID / PENDING
     ======================================================= */

  window.markEMIPaid =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.emis.find(
          a => a.id === id
        );

      if (!x) return;

      x.status = "paid";
      x.paidDate = today();

      saveSafe();

      renderEnhancedPayments();

    };

  window.markEMIPending =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.emis.find(
          a => a.id === id
        );

      if (!x) return;

      x.status = "pending";

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     LOAN PAYMENT
     ======================================================= */

  window.addLoanPayment =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.loans.find(
          a => a.id === id
        );

      if (!x) return;

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

      if (
        !Array.isArray(x.history)
      ) {
        x.history = [];
      }

      const payment = {
        id:uid(),
        amount,
        date:today()
      };

      x.history.push(payment);

      x.paid =
        Number(x.paid || 0) +
        amount;

      x.remaining =
        Math.max(
          0,
          Number(x.amount || 0) -
          x.paid
        );

      x.lastPaymentDate =
        today();

      if (
        x.remaining <= 0
      ) {
        x.status =
          "completed";
      }

      saveSafe();

      renderEnhancedPayments();

    };

  /* =======================================================
     LOAN PAYMENT HISTORY
     ======================================================= */

  window.viewLoanHistory =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.loans.find(
          a => a.id === id
        );

      if (!x) return;

      const history =
        Array.isArray(x.history)
          ? x.history
          : [];

      if (!history.length) {

        alert(
          "No payment history yet."
        );

        return;

      }

      let text =
        "LOAN PAYMENT HISTORY\n\n";

      text +=
        "Loan: " +
        (x.name || "") +
        "\n\n";

      history.forEach(
        (p,i) => {

          text +=
            (i + 1) +
            ". " +
            (p.date || "-") +
            "  " +
            moneySafe(
              p.amount
            ) +
            "\n";

        }
      );

      text +=
        "\nTotal Paid: " +
        moneySafe(
          x.paid || 0
        );

      shareTextSafe(
        text,
        "HISAB Loan History"
      );

    };

  /* =======================================================
     EMI HISTORY
     ======================================================= */

  window.viewEMIHistory =
    function (id) {

      const d = data();

      if (!d) return;

      const x =
        d.emis.find(
          a => a.id === id
        );

      if (!x) return;

      const history =
        Array.isArray(x.history)
          ? x.history
          : [];

      let text =
        "EMI PAYMENT HISTORY\n\n";

      text +=
        "EMI: " +
        moneySafe(x.emi) +
        "\n\n";

      if (!history.length) {

        text +=
          "No payment history yet.";

      } else {

        history.forEach(
          (p,i) => {

            text +=
              (i + 1) +
              ". " +
              (p.date || "-") +
              "  " +
              moneySafe(
                p.amount ||
                x.emi ||
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
     ENHANCED PAYMENTS DISPLAY
     ======================================================= */

  window.renderEnhancedPayments =
    function () {

      ensureBillData();
      ensureLoanData();

      const list =
        $("billList");

      if (!list) return;

      const d = data();

      if (!d) return;

      const bills =
        d.bills.filter(
          x => x.kind === "bill"
        );

      const cards =
        d.bills.filter(
          x => x.kind === "card"
        );

      const loans =
        d.loans || [];

      const emis =
        d.emis || [];

      list.innerHTML = `

        <div class="list-card">

          <h3>🧾 Bills</h3>

          ${
            bills.length
            ? bills.map(x => `

              <div class="list-card">

                <b>
                  ${escSafe(x.name)}
                </b>

                <div class="amount">
                  ${moneySafe(x.amount)}
                </div>

                <div class="meta">
                  Date:
                  ${escSafe(
                    x.date || "-"
                  )}
                </div>

                <div class="meta">
                  Due:
                  ${escSafe(
                    x.due || "-"
                  )}
                </div>

                <div
                  style="margin-top:7px"
                >

                  <span class="${
                    x.status === "settled"
                    ? "status-settled"
                    : "status-pending"
                  }">

                    ${
                      x.status ===
                      "settled"
                      ? "Paid"
                      : "Pending"
                    }

                  </span>

                </div>

                <div
                  class="action-row"
                  style="margin-top:9px"
                >

                  ${
                    x.status !==
                    "settled"
                    ? `
                      <button
                        type="button"
                        onclick="markBillPaid('${x.id}')">
                        ✓ Mark Paid
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        onclick="markBillPending('${x.id}')">
                        ↩ Pending
                      </button>
                    `
                  }

                  <button
                    type="button"
                    onclick="deleteBill('${x.id}')">
                    Delete
                  </button>

                </div>

              </div>

            `).join("")
            : `
              <div class="meta">
                No bills yet.
              </div>
            `
          }

        </div>


        <div class="list-card">

          <h3>💳 Credit Cards</h3>

          ${
            cards.length
            ? cards.map(x => `

              <div class="list-card">

                <b>
                  ${escSafe(x.name)}
                </b>

                <div class="amount">
                  ${moneySafe(x.amount)}
                </div>

                <div class="meta">
                  Due:
                  ${escSafe(
                    x.due || "-"
                  )}
                </div>

                <div
                  style="margin-top:7px"
                >

                  <span class="${
                    x.status === "settled"
                    ? "status-settled"
                    : "status-pending"
                  }">

                    ${
                      x.status ===
                      "settled"
                      ? "Paid"
                      : "Pending"
                    }

                  </span>

                </div>

                <div
                  class="action-row"
                  style="margin-top:9px"
                >

                  ${
                    x.status !==
                    "settled"
                    ? `
                      <button
                        type="button"
                        onclick="markBillPaid('${x.id}')">
                        ✓ Mark Paid
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        onclick="markBillPending('${x.id}')">
                        ↩ Pending
                      </button>
                    `
                  }

                  <button
                    type="button"
                    onclick="deleteBill('${x.id}')">
                    Delete
                  </button>

                </div>

              </div>

            `).join("")
            : `
              <div class="meta">
                No credit card bills.
              </div>
            `
          }

        </div>


        <div class="list-card">

          <h3>🏦 Loans</h3>

          ${
            loans.length
            ? loans.map(x => {

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

              return `

                <div class="list-card">

                  <b>
                    ${escSafe(x.name)}
                  </b>

                  <div class="amount">
                    ${moneySafe(amount)}
                  </div>

                  <div class="meta">
                    Interest:
                    ${escSafe(
                      x.rate || 0
                    )}%
                    •
                    ${escSafe(
                      x.months || 0
                    )}
                    months
                  </div>

                  <div class="meta">
                    Loan Date:
                    ${escSafe(
                      x.date || "-"
                    )}
                  </div>

                  <div class="meta">
                    Paid:
                    ${moneySafe(paid)}
                  </div>

                  <div class="meta">
                    Remaining:
                    ${moneySafe(
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
                    class="action-row"
                    style="margin-top:9px"
                  >

                    ${
                      remaining > 0
                      ? `
                        <button
                          type="button"
                          onclick="addLoanPayment('${x.id}')">
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
                          onclick="viewLoanHistory('${x.id}')">
                          History
                        </button>
                      `
                      : ""
                    }

                    <button
                      type="button"
                      onclick="deleteLoan('${x.id}')">
                      Delete
                    </button>

                  </div>

                </div>

              `;

            }).join("")
            : `
              <div class="meta">
                No loans yet.
              </div>
            `
          }

        </div>


        <div class="list-card">

          <h3>📅 EMI</h3>

          ${
            emis.length
            ? emis.map(x => `

              <div class="list-card">

                <b>
                  EMI
                  ${moneySafe(x.emi)}
                </b>

                <div class="meta">
                  Principal:
                  ${moneySafe(
                    x.principal
                  )}
                </div>

                <div class="meta">
                  Tenure:
                  ${escSafe(
                    x.months || 0
                  )}
                  months
                </div>

                <div class="meta">
                  Date:
                  ${escSafe(
                    x.date || "-"
                  )}
                </div>

                <div
                  style="margin-top:7px"
                >

                  <span class="${
                    x.status === "paid"
                    ? "status-settled"
                    : "status-pending"
                  }">

                    ${
                      x.status === "paid"
                      ? "Paid"
                      : "Pending"
                    }

                  </span>

                </div>

                <div
                  class="action-row"
                  style="margin-top:9px"
                >

                  ${
                    x.status !== "paid"
                    ? `
                      <button
                        type="button"
                        onclick="markEMIPaid('${x.id}')">
                        ✓ EMI Paid
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        onclick="markEMIPending('${x.id}')">
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
                        onclick="viewEMIHistory('${x.id}')">
                        History
                      </button>
                    `
                    : ""
                  }

                  <button
                    type="button"
                    onclick="deleteEMI('${x.id}')">
                    Delete
                  </button>

                </div>

              </div>

            `).join("")
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
     SAFE TEXT HELPERS
     ======================================================= */

  function escSafe(v) {

    try {

      if (
        typeof esc ===
        "function"
      ) {
        return esc(v);
      }

    } catch (e) {}

    return String(v ?? "")
      .replace(
        /[&<>"']/g,
        function (m) {

          return {
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            '"':"&quot;",
            "'":"&#039;"
          }[m];

        }
      );

  }

  function moneySafe(v) {

    try {

      if (
        typeof money ===
        "function"
      ) {
        return money(v);
      }

    } catch (e) {}

    const d = data();

    return (
      (d?.currency || "₹") +
      Number(v || 0)
        .toLocaleString(
          "en-IN",
          {
            maximumFractionDigits:2
          }
        )
    );

  }

  function shareTextSafe(
    text,
    title
  ) {

    try {

      if (
        typeof shareText ===
        "function"
      ) {
        shareText(
          text,
          title
        );
        return;
      }

    } catch (e) {}

    try {

      if (
        navigator.clipboard
      ) {

        navigator.clipboard
          .writeText(text)
          .then(
            () =>
              alert("Copied")
          );

        return;

      }

    } catch (e) {}

    alert(text);

  }

  /* =======================================================
     BUDGET
     ======================================================= */

  window.viewBudget =
    function () {

      const d = data();

      if (!d) return;

      const spent =
        typeof totalExpense ===
        "function"
          ? totalExpense()
          : 0;

      const remaining =
        Number(d.budget || 0) -
        spent;

      alert(
        "Monthly Budget\n\n" +
        "Budget: " +
        moneySafe(
          d.budget || 0
        ) +
        "\nSpent: " +
        moneySafe(spent) +
        "\nRemaining: " +
        moneySafe(remaining)
      );

    };

  window.changeBudget =
    function () {

      const d = data();

      if (!d) return;

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

      d.budget = amount;

      saveSafe();

      if (
        typeof renderPlanning ===
        "function"
      ) {
        renderPlanning();
      }

    };

  /* =======================================================
     SAVINGS / GOAL UPDATE
     ======================================================= */

  window.updateSavings =
    function (id) {

      const d = data();

      if (!d) return;

      const g =
        d.goals.find(
          x => x.id === id
        );

      if (!g) return;

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

      g.saved =
        Number(g.saved || 0) +
        amount;

      saveSafe();

      if (
        typeof renderPlanning ===
        "function"
      ) {
        renderPlanning();
      }

    };

  window.deleteGoal =
    function (id) {

      const d = data();

      if (!d) return;

      if (
        !confirm(
          "Delete this savings goal?"
        )
      ) {
        return;
      }

      d.goals =
        d.goals.filter(
          x => x.id !== id
        );

      saveSafe();

      if (
        typeof renderPlanning ===
        "function"
      ) {
        renderPlanning();
      }

    };

  /* =======================================================
     FAMILY DELETE FIX
     ======================================================= */

  if (
    typeof window.deleteFamily !==
    "function"
  ) {

    window.deleteFamily =
      function (id) {

        const d = data();

        if (!d) return;

        d.family =
          (d.family || [])
            .filter(
              x => x.id !== id
            );

        saveSafe();

        if (
          typeof renderFamily ===
          "function"
        ) {
          renderFamily();
        }

      };

  }

  /* =======================================================
     PLANNING DISPLAY
     ======================================================= */

  const originalRenderPlanning =
    window.renderPlanning;

  window.renderPlanning =
    function () {

      if (
        typeof originalRenderPlanning ===
        "function"
      ) {
        originalRenderPlanning();
      }

      setTimeout(
        function () {

          const list =
            $("goalList");

          const d = data();

          if (!list || !d) {
            return;
          }

          const goals =
            Array.isArray(d.goals)
              ? d.goals
              : [];

          if (!goals.length) {
            return;
          }

          const existing =
            list.querySelectorAll(
              ".hisab-goal-actions"
            );

          if (existing.length) {
            return;
          }

          const cards =
            list.querySelectorAll(
              ".list-card"
            );

          goals.forEach(
            function (g,i) {

              const card =
                cards[i + 1];

              if (!card) return;

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
                  onclick="updateSavings('${g.id}')">
                  + Save
                </button>

                <button
                  type="button"
                  onclick="deleteGoal('${g.id}')">
                  Delete
                </button>

              `;

              card.appendChild(
                actions
              );

            }
          );

        },
        20
      );

    };

  /* =======================================================
     PDF / SHARE CONNECTION
     ======================================================= */

  window.shareCurrentKhata =
    function () {

      if (
        typeof shareKhata ===
        "function"
      ) {

        shareKhata();
        return;

      }

      alert(
        "Share function unavailable"
      );

    };

  window.pdfCurrentKhata =
    function () {

      if (
        typeof exportKhataPDF ===
        "function"
      ) {

        exportKhataPDF();
        return;

      }

      alert(
        "PDF function unavailable"
      );

    };

  /* =======================================================
     STARTUP
     ======================================================= */

  function startupRepair() {

    try {
      ensureBillData();
    } catch (e) {}

    try {
      ensureLoanData();
    } catch (e) {}

    connectContactButton();

    setTimeout(
      function () {

        try {
          renderEnhancedPayments();
        } catch (e) {}

        try {
          if (
            typeof ensureModeSwitch ===
            "function"
          ) {
            ensureModeSwitch();
          }
        } catch (e) {}

        addVisibleBackButton();

      },
      150
    );

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
      startupRepair
    );

  } else {

    startupRepair();

  }

})();
