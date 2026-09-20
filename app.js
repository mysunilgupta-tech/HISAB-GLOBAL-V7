      (() => {
  "use strict";

  /* =========================================================
     HISAB V7 - FINAL CONSOLIDATED APP.JS
     Local-first / No-login / Mobile friendly
     ========================================================= */

  const STORAGE_KEY = "hisab_v7_data";

  const DEFAULT_DATA = {
    mode: "personal",
    currency: "₹",

    transactions: [],
    lendDen: [],
    savings: [],
    goals: [],
    bills: [],
    loans: [],

    budgets: {
      personal: 0,
      business: 0
    }
  };

  let state = load();

  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function uid(prefix = "id") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function money(value) {
    const amount = num(value);

    try {
      return (
        state.currency +
        amount.toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })
      );
    } catch {
      return state.currency + amount.toFixed(2);
    }
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function currentMode() {
    return state.mode === "business" ? "business" : "personal";
  }

  function modeLabel() {
    return currentMode() === "business" ? "Business" : "Personal";
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return structuredClone(DEFAULT_DATA);
      }

      const saved = JSON.parse(raw);

      const data = {
        ...structuredClone(DEFAULT_DATA),
        ...saved
      };

      data.transactions = Array.isArray(saved.transactions)
        ? saved.transactions
        : [];

      data.lendDen = Array.isArray(saved.lendDen)
        ? saved.lendDen
        : [];

      data.savings = Array.isArray(saved.savings)
        ? saved.savings
        : [];

      data.goals = Array.isArray(saved.goals)
        ? saved.goals
        : [];

      data.bills = Array.isArray(saved.bills)
        ? saved.bills
        : [];

      data.loans = Array.isArray(saved.loans)
        ? saved.loans
        : [];

      if (typeof saved.budgets === "object" && saved.budgets) {
        data.budgets = {
          ...DEFAULT_DATA.budgets,
          ...saved.budgets
        };
      } else {
        data.budgets = {
          personal: num(saved.budget),
          business: 0
        };
      }

      if (!["personal", "business"].includes(data.mode)) {
        data.mode = "personal";
      }

      return data;
    } catch (error) {
      console.error("HISAB load error:", error);
      return structuredClone(DEFAULT_DATA);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("HISAB save error:", error);
      return false;
    }
  }

  /* =========================================================
     MODE HELPERS
     ========================================================= */

  function itemMode(item) {
    return item && item.mode
      ? item.mode
      : "personal";
  }

  function modeItems(list) {
    return list.filter(item => itemMode(item) === currentMode());
  }

  /* =========================================================
     SCREEN / MODAL
     ========================================================= */

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });

    const target = $(id);

    if (target) {
      target.classList.add("active");
    }
  }

  function showHome() {
    showScreen("homeScreen");
    updateMode();
    updateDashboard();
  }

  function openModal(html) {
    const modal = $("modal");
    const content = $("modalContent");

    if (!modal || !content) return;

    content.innerHTML = html;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = $("modal");

    if (modal) {
      modal.classList.add("hidden");
    }
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function currentTransactions() {
    return modeItems(state.transactions);
  }

  function calculateTotals() {
    const transactions = currentTransactions();

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === "income") {
        income += num(t.amount);
      }

      if (t.type === "expense") {
        expense += num(t.amount);
      }
    });

    return {
      income,
      expense,
      balance: income - expense
    };
  }

  function updateMode() {
    const personalBtn = $("personalBtn");
    const businessBtn = $("businessBtn");

    if (personalBtn) {
      personalBtn.classList.toggle(
        "active",
        currentMode() === "personal"
      );
    }

    if (businessBtn) {
      businessBtn.classList.toggle(
        "active",
        currentMode() === "business"
      );
    }

    const labels = document.querySelectorAll("[data-mode-label]");

    labels.forEach(el => {
      el.textContent = modeLabel();
    });
  }

  function updateDashboard() {
    const totals = calculateTotals();

    if ($("totalBalance")) {
      $("totalBalance").textContent = money(totals.balance);
    }

    if ($("totalIncome")) {
      $("totalIncome").textContent = money(totals.income);
    }

    if ($("totalExpense")) {
      $("totalExpense").textContent = money(totals.expense);
    }

    if ($("currencyLabel")) {
      $("currencyLabel").textContent = state.currency;
    }

    updateRecent();
    updateMode();
  }

  function updateRecent() {
    const container = $("recentActivity");

    if (!container) return;

    const list = currentTransactions()
      .slice()
      .sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
      .slice(0, 5);

    if (!list.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div>No transactions yet</div>
          <small>Add your first income or expense.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = list
      .map(t => {
        const positive = t.type === "income";

        return `
          <div class="activity-item">
            <div>
              <strong>${safe(t.title || titleCase(t.type))}</strong>
              <small>${safe(t.date || "")}</small>
            </div>

            <strong>
              ${positive ? "+" : "-"}${money(t.amount)}
            </strong>

            <button
              type="button"
              class="small-delete-btn"
              data-delete-transaction="${safe(t.id)}"
            >
              ×
            </button>
          </div>
        `;
      })
      .join("");

    container
      .querySelectorAll("[data-delete-transaction]")
      .forEach(button => {
        button.onclick = () => {
          deleteTransaction(button.dataset.deleteTransaction);
        };
      });
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function transactionForm(type) {
    const isIncome = type === "income";

    openModal(`
      <div class="modal-inner">
        <h2>${isIncome ? "Add Income" : "Add Expense"}</h2>

        <form id="transactionForm">
          <label>
            Title
            <input
              id="transactionTitle"
              type="text"
              placeholder="${isIncome ? "Salary, Sales..." : "Food, Shopping..."}"
              required
            >
          </label>

          <label>
            Amount
            <input
              id="transactionAmount"
              type="number"
              min="0.01"
              step="0.01"
              inputmode="decimal"
              placeholder="0"
              required
            >
          </label>

          <label>
            Date
            <input
              id="transactionDate"
              type="date"
              value="${today()}"
              required
            >
          </label>

          <label>
            Note
            <textarea
              id="transactionNote"
              placeholder="Optional note"
            ></textarea>
          </label>

          <button class="primary-btn" type="submit">
            Save ${isIncome ? "Income" : "Expense"}
          </button>
        </form>
      </div>
    `);

    const form = $("transactionForm");

    if (!form) return;

    form.onsubmit = event => {
      event.preventDefault();

      const title = $("transactionTitle").value.trim();
      const amount = num($("transactionAmount").value);
      const date = $("transactionDate").value || today();
      const note = $("transactionNote").value.trim();

      if (!title || amount <= 0) {
        alert("Please enter a valid title and amount.");
        return;
      }

      state.transactions.push({
        id: uid("txn"),
        mode: currentMode(),
        type,
        title,
        amount,
        date,
        note,
        createdAt: nowISO()
      });

      save();
      closeModal();
      updateDashboard();
    };
  }

  function deleteTransaction(id) {
    const index = state.transactions.findIndex(
      item => item.id === id
    );

    if (index === -1) return;

    if (!confirm("Delete this transaction?")) return;

    state.transactions.splice(index, 1);
    save();
    updateDashboard();
  }

  /* =========================================================
     PAISA LEN-DEN
     ========================================================= */

  function lendDen() {
    const items = modeItems(state.lendDen);

    const given = items
      .filter(x => x.type === "given" && x.status !== "paid")
      .reduce((sum, x) => sum + num(x.amount), 0);

    const received = items
      .filter(x => x.type === "received" && x.status !== "paid")
      .reduce((sum, x) => sum + num(x.amount), 0);

    openModal(`
      <div class="modal-inner">
        <h2>Paisa Len-Den</h2>

        <div class="summary-grid">
          <div>
            <small>Given</small>
            <strong>${money(given)}</strong>
          </div>

          <div>
            <small>Received</small>
            <strong>${money(received)}</strong>
          </div>
        </div>

        <form id="lendForm">
          <label>
            Person Name
            <input id="lendName" type="text" required>
          </label>

          <label>
            Type
            <select id="lendType">
              <option value="given">Paisa Diya</option>
              <option value="received">Paisa Liya</option>
            </select>
          </label>

          <label>
            Amount
            <input
              id="lendAmount"
              type="number"
              min="0.01"
              step="0.01"
              inputmode="decimal"
              required
            >
          </label>

          <label>
            Date
            <input id="lendDate" type="date" value="${today()}">
          </label>

          <label>
            Note
            <textarea id="lendNote"></textarea>
          </label>

          <button class="primary-btn" type="submit">
            Save Entry
          </button>
        </form>

        <hr>

        <div id="lendList">
          ${items.length
            ? items
                .slice()
                .reverse()
                .map(item => `
                  <div class="activity-item">
                    <div>
                      <strong>${safe(item.name)}</strong>
                      <small>
                        ${item.type === "given" ? "Given" : "Received"}
                        • ${safe(item.date)}
                      </small>
                    </div>

                    <strong>${money(item.amount)}</strong>

                    <button
                      type="button"
                      data-delete-lend="${safe(item.id)}"
                    >
                      ×
                    </button>
                  </div>
                `)
                .join("")
            : `<div class="empty-state">No entries yet.</div>`
          }
        </div>
      </div>
    `);

    const form = $("lendForm");

    if (form) {
      form.onsubmit = event => {
        event.preventDefault();

        const name = $("lendName").value.trim();
        const amount = num($("lendAmount").value);

        if (!name || amount <= 0) {
          alert("Please enter name and valid amount.");
          return;
        }

        state.lendDen.push({
          id: uid("lend"),
          mode: currentMode(),
          name,
          type: $("lendType").value,
          amount,
          date: $("lendDate").value || today(),
          note: $("lendNote").value.trim(),
          status: "pending",
          createdAt: nowISO()
        });

        save();
        lendDen();
      };
    }

    document
      .querySelectorAll("[data-delete-lend]")
      .forEach(button => {
        button.onclick = () => {
          const id = button.dataset.deleteLend;

          if (!confirm("Delete this entry?")) return;

          state.lendDen = state.lendDen.filter(
            item => item.id !== id
          );

          save();
          lendDen();
        };
      });
  }

  /* =========================================================
     SAVINGS
     ========================================================= */

  function savings() {
    const items = modeItems(state.savings);

    const total = items.reduce(
      (sum, item) => sum + num(item.amount),
      0
    );

    openModal(`
      <div class="modal-inner">
        <h2>Savings</h2>

        <div class="summary-card">
          <small>Total Savings</small>
          <h2>${money(total)}</h2>
        </div>

        <form id="savingForm">
          <label>
            Purpose
            <input id="savingPurpose" type="text"
              placeholder="Emergency, Car, Home..." required>
          </label>

          <label>
            Amount
            <input id="savingAmount" type="number"
              min="0.01" step="0.01"
              inputmode="decimal" required>
          </label>

          <label>
            Date
            <input id="savingDate" type="date" value="${today()}">
          </label>

          <button class="primary-btn" type="submit">
            Add Saving
          </button>
        </form>

        <hr>

        ${
          items.length
            ? items
                .slice()
                .reverse()
                .map(item => `
                  <div class="activity-item">
                    <div>
                      <strong>${safe(item.purpose)}</strong>
                      <small>${safe(item.date)}</small>
                    </div>

                    <strong>${money(item.amount)}</strong>

                    <button
                      type="button"
                      data-delete-saving="${safe(item.id)}"
                    >
                      ×
                    </button>
                  </div>
                `)
                .join("")
            : `<div class="empty-state">No savings added yet.</div>`
        }
      </div>
    `);

    const form = $("savingForm");

    if (form) {
      form.onsubmit = event => {
        event.preventDefault();

        const purpose = $("savingPurpose").value.trim();
        const amount = num($("savingAmount").value);

        if (!purpose || amount <= 0) {
          alert("Please enter valid saving details.");
          return;
        }

        state.savings.push({
          id: uid("save"),
          mode: currentMode(),
          purpose,
          amount,
          date: $("savingDate").value || today(),
          createdAt: nowISO()
        });

        save();
        savings();
      };
    }

    document
      .querySelectorAll("[data-delete-saving]")
      .forEach(button => {
        button.onclick = () => {
          if (!confirm("Delete this saving?")) return;

          state.savings = state.savings.filter(
            item => item.id !== button.dataset.deleteSaving
          );

          save();
          savings();
        };
      });
  }

  /* =========================================================
     BUDGET
     ========================================================= */

  function budget() {
    const key = currentMode();
    const currentBudget = num(state.budgets[key]);

    const totals = calculateTotals();

    const remaining =
      currentBudget - totals.expense;

    openModal(`
      <div class="modal-inner">
        <h2>${modeLabel()} Budget</h2>

        <div class="summary-grid">
          <div>
            <small>Budget</small>
            <strong>${money(currentBudget)}</strong>
          </div>

          <div>
            <small>Spent</small>
            <strong>${money(totals.expense)}</strong>
          </div>

          <div>
            <small>Remaining</small>
            <strong>${money(remaining)}</strong>
          </div>
        </div>

        <form id="budgetForm">
          <label>
            Monthly Budget
            <input
              id="budgetAmount"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              value="${currentBudget || ""}"
              required
            >
          </label>

          <button class="primary-btn" type="submit">
            Save Budget
          </button>
        </form>
      </div>
    `);

    const form = $("budgetForm");

    if (form) {
      form.onsubmit = event => {
        event.preventDefault();

        state.budgets[key] = num(
          $("budgetAmount").value
        );

        save();
        closeModal();
        updateDashboard();
        alert("Budget saved.");
      };
    }
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function bills() {
    const items = modeItems(state.bills);

    openModal(`
      <div class="modal-inner">
        <h2>Bills</h2>

        <form id="billForm">
          <label>
            Bill Name
            <input id="billName" type="text"
              placeholder="Electricity, Internet..." required>
          </label>

          <label>
            Amount
            <input id="billAmount" type="number"
              min="0.01" step="0.01"
              inputmode="decimal" required>
          </label>

          <label>
            Due Date
            <input id="billDueDate" type="date" required>
          </label>

          <label>
            Status
            <select id="billStatus">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </label>

          <button class="primary-btn" type="submit">
            Save Bill
          </button>
        </form>

        <hr>

        ${
          items.length
            ? items
                .slice()
                .reverse()
                .map(item => `
                  <div class="activity-item">
                    <div>
                      <strong>${safe(item.name)}</strong>
                      <small>
                        Due: ${safe(item.dueDate)}
                        • ${item.status === "paid" ? "Paid" : "Pending"}
                      </small>
                    </div>

                    <strong>${money(item.amount)}</strong>

                    <button
                      type="button"
                      data-toggle-bill="${safe(item.id)}"
                    >
                      ${item.status === "paid" ? "↩" : "✓"}
                    </button>

                    <button
                      type="button"
                      data-delete-bill="${safe(item.id)}"
                    >
                      ×
                    </button>
                  </div>
                `)
                .join("")
            : `<div class="empty-state">No bills added yet.</div>`
        }
      </div>
    `);

    const form = $("billForm");

    if (form) {
      form.onsubmit = event => {
        event.preventDefault();

        const name = $("billName").value.trim();
        const amount = num($("billAmount").value);
        const dueDate = $("billDueDate").value;

        if (!name || amount <= 0 || !dueDate) {
          alert("Please enter valid bill details.");
          return;
        }

        state.bills.push({
          id: uid("bill"),
          mode: currentMode(),
          name,
          amount,
          dueDate,
          status: $("billStatus").value,
          createdAt: nowISO()
        });

        save();
        bills();
      };
    }

    document
      .querySelectorAll("[data-toggle-bill]")
      .forEach(button => {
        button.onclick = () => {
          const item = state.bills.find(
            x => x.id === button.dataset.toggleBill
          );

          if (!item) return;

          item.status =
            item.status === "paid"
              ? "pending"
              : "paid";

          save();
          bills();
        };
      });

    document
      .querySelectorAll("[data-delete-bill]")
      .forEach(button => {
        button.onclick = () => {
          if (!confirm("Delete this bill?")) return;

          state.bills = state.bills.filter(
            x => x.id !== button.dataset.deleteBill
          );

          save();
          bills();
        };
      });
  }

  /* =========================================================
     LOANS / EMI
     ========================================================= */

  function loans() {
    const items = modeItems(state.loans);

    openModal(`
      <div class="modal-inner">
        <h2>Loans & EMI</h2>

        <form id="loanForm">
          <label>
            Loan / EMI Name
            <input id="loanName" type="text"
              placeholder="Bike EMI, Personal Loan..." required>
          </label>

          <label>
            Total Amount
            <input id="loanAmount" type="number"
              min="0.01" step="0.01"
              inputmode="decimal" required>
          </label>

          <label>
            EMI Amount
            <input id="loanEmi" type="number"
              min="0.01" step="0.01"
              inputmode="decimal" required>
          </label>

          <label>
            Due Date
            <input id="loanDueDate" type="date" required>
          </label>

          <label>
            Status
            <select id="loanStatus">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </label>

          <button class="primary-btn" type="submit">
            Save EMI
          </button>
        </form>

        <hr>

        ${
          items.length
            ? items
                .slice()
                .reverse()
                .map(item => `
                  <div class="activity-item">
                    <div>
                      <strong>${safe(item.name)}</strong>
                      <small>
                        EMI ${money(item.emi)}
                        • Due ${safe(item.dueDate)}
                        • ${item.status}
                      </small>
                    </div>

                    <strong>${money(item.amount)}</strong>

                    <button
                      type="button"
                      data-toggle-loan="${safe(item.id)}"
                    >
                      ${item.status === "paid" ? "↩" : "✓"}
                    </button>

                    <button
                      type="button"
                      data-delete-loan="${safe(item.id)}"
                    >
                      ×
                    </button>
                  </div>
                `)
                .join("")
            : `<div class="empty-state">No EMI added yet.</div>`
        }
      </div>
    `);

    const form = $("loanForm");

    if (form) {
      form.onsubmit = event => {
        event.preventDefault();

        const name = $("loanName").value.trim();
        const amount = num($("loanAmount").value);
        const emi = num($("loanEmi").value);
        const dueDate = $("loanDueDate").value;

        if (!name || amount <= 0 || emi <= 0 || !dueDate) {
          alert("Please enter valid EMI details.");
          return;
        }

        state.loans.push({
          id: uid("loan"),
          mode: currentMode(),
          name,
          amount,
          emi,
          dueDate,
          status: $("loanStatus").value,
          createdAt: nowISO()
        });

        save();
        loans();
      };
    }

    document
      .querySelectorAll("[data-toggle-loan]")
      .forEach(button => {
        button.onclick = () => {
          const item = state.loans.find(
            x => x.id === button.dataset.toggleLoan
          );

          if (!item) return;

          item.status =
            item.status === "paid"
              ? "pending"
              : "paid";

          save();
          loans();
        };
      });

    document
      .querySelectorAll("[data-delete-loan]")
      .forEach(button => {
        button.onclick = () => {
          if (!confirm("Delete this EMI?")) return;

          state.loans = state.loans.filter(
            x => x.id !== button.dataset.deleteLoan
          );

          save();
          loans();
        };
      });
  }

  /* =========================================================
     GOALS
     ========================================================= */

  function goals() {
    const items = modeItems(state.goals);

    openModal(`
      <div class="modal-inner">
        <h2>Goals</h2>

        <form id="goalForm">
          <label>
            Goal Name
            <input id="goalName" type="text"
              placeholder="New Bike, Emergency Fund..." required>
          </label>

          <label>
            Target Amount
            <input id="goalTarget" type="number"
              min="0.01" step="0.01"
              inputmode="decimal" required>
          </label>

          <label>
            Saved Amount
            <input id="goalSaved" type="number"
              min="0" step="0.01"
              inputmode="decimal"
              value="0">
          </label>

          <label>
            Target Date
            <input id="goalDate" type="date">
          </label>

          <button class="primary-btn" type="submit">
            Save Goal
          </button>
        </form>

        <hr>

        ${
          items.length
            ? items
                .slice()
                .reverse()
                .map(item => {
                  const target = num(item.target);
                  const saved = num(item.saved);

                  const percent =
                    target > 0
                      ? Math.min(
                          100,
                          Math.round((saved / target) * 100)
                        )
                      : 0;

                  return `
                    <div class="goal-item">
                      <strong>${safe(item.name)}</strong>

                      <small>
                        ${money(saved)} / ${money(target)}
                        • ${percent}%
                      </small>

                      <div class="goal-progress">
                        <div
                          style="width:${percent}%"
                        ></div>
                      </div>

                      <button
                        type="button"
                        data-delete-goal="${safe(item.id)}"
                      >
                        Delete
                      </button>
                    </div>
                  `;
                })
                .join("")
            : `<div class="empty-state">No goals added yet.</div>`
        }
      </div>
    `);

    const form = $("goalForm");

    if (form) {
      form.onsubmit = event => {
        event.preventDefault();

        const name = $("goalName").value.trim();
        const target = num($("goalTarget").value);
        const saved = num($("goalSaved").value);

        if (!name || target <= 0) {
          alert("Please enter a valid goal.");
          return;
        }

        state.goals.push({
          id: uid("goal"),
          mode: currentMode(),
          name,
          target,
          saved: Math.min(saved, target),
          targetDate: $("goalDate").value || "",
          createdAt: nowISO()
        });

        save();
        goals();
      };
    }

    document
      .querySelectorAll("[data-delete-goal]")
      .forEach(button => {
        button.onclick = () => {
          if (!confirm("Delete this goal?")) return;

          state.goals = state.goals.filter(
            x => x.id !== button.dataset.deleteGoal
          );

          save();
          goals();
        };
      });
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function reports() {
    const totals = calculateTotals();

    const lendItems = modeItems(state.lendDen);

    const given = lendItems
      .filter(x => x.type === "given")
      .reduce((sum, x) => sum + num(x.amount), 0);

    const received = lendItems
      .filter(x => x.type === "received")
      .reduce((sum, x) => sum + num(x.amount), 0);

    const savingsTotal = modeItems(state.savings)
      .reduce((sum, x) => sum + num(x.amount), 0);

    const pendingBills = modeItems(state.bills)
      .filter(x => x.status !== "paid")
      .reduce((sum, x) => sum + num(x.amount), 0);

    const pendingEMI = modeItems(state.loans)
      .filter(x => x.status !== "paid")
      .reduce((sum, x) => sum + num(x.emi), 0);

    openModal(`
      <div class="modal-inner">
        <h2>${modeLabel()} Reports</h2>

        <div class="summary-grid">
          <div>
            <small>Income</small>
            <strong>${money(totals.income)}</strong>
          </div>

          <div>
            <small>Expense</small>
            <strong>${money(totals.expense)}</strong>
          </div>

          <div>
            <small>Balance</small>
            <strong>${money(totals.balance)}</strong>
          </div>

          <div>
            <small>Savings</small>
            <strong>${money(savingsTotal)}</strong>
          </div>

          <div>
            <small>Paisa Given</small>
            <strong>${money(given)}</strong>
          </div>

          <div>
            <small>Paisa Received</small>
            <strong>${money(received)}</strong>
          </div>

          <div>
            <small>Pending Bills</small>
            <strong>${money(pendingBills)}</strong>
          </div>

          <div>
            <small>Pending EMI</small>
            <strong>${money(pendingEMI)}</strong>
          </div>
        </div>

        <button
          type="button"
          class="primary-btn"
          id="closeReportBtn"
        >
          Done
        </button>
      </div>
    `);

    const close = $("closeReportBtn");

    if (close) {
      close.onclick = closeModal;
    }
  }

  /* =========================================================
     VIEW ALL
     ========================================================= */

  function viewAll() {
    const items = currentTransactions()
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

    openModal(`
      <div class="modal-inner">
        <h2>All Transactions</h2>

        ${
          items.length
            ? items
                .map(item => `
                  <div class="activity-item">
                    <div>
                      <strong>${safe(item.title)}</strong>
                      <small>
                        ${safe(item.date)}
                        • ${titleCase(item.type)}
                      </small>
                    </div>

                    <strong>
                      ${item.type === "income" ? "+" : "-"}
                      ${money(item.amount)}
                    </strong>

                    <button
                      type="button"
                      data-delete-all-transaction="${safe(item.id)}"
                    >
                      ×
                    </button>
                  </div>
                `)
                .join("")
            : `<div class="empty-state">No transactions yet.</div>`
        }
      </div>
    `);

    document
      .querySelectorAll("[data-delete-all-transaction]")
      .forEach(button => {
        button.onclick = () => {
          deleteTransaction(
            button.dataset.deleteAllTransaction
          );
          viewAll();
        };
      });
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function settings() {
    openModal(`
      <div class="modal-inner">
        <h2>Settings</h2>

        <div class="settings-row">
          <strong>Current Mode</strong>
          <span>${modeLabel()}</span>
        </div>

        <div class="settings-row">
          <strong>Currency</strong>
          <button
            type="button"
            id="currencyBtn"
          >
            ${safe(state.currency)}
          </button>
        </div>

        <button
          type="button"
          class="primary-btn"
          id="exportBtn"
        >
          Export Data
        </button>

        <button
          type="button"
          id="clearDataBtn"
        >
          Clear All Data
        </button>
      </div>
    `);

    const currencyBtn = $("currencyBtn");

    if (currencyBtn) {
      currencyBtn.onclick = currency;
    }

    const exportBtn = $("exportBtn");

    if (exportBtn) {
      exportBtn.onclick = exportData;
    }

    const clearBtn = $("clearDataBtn");

    if (clearBtn) {
      clearBtn.onclick = clearData;
    }
  }

  function currency() {
    openModal(`
      <div class="modal-inner">
        <h2>Select Currency</h2>

        <button type="button" data-currency="₹">₹ Indian Rupee</button>
        <button type="button" data-currency="$">$ US Dollar</button>
        <button type="button" data-currency="€">€ Euro</button>
        <button type="button" data-currency="£">£ Pound</button>
        <button type="button" data-currency="¥">¥ Yen</button>
      </div>
    `);

    document
      .querySelectorAll("[data-currency]")
      .forEach(button => {
        button.onclick = () => {
          state.currency = button.dataset.currency;
          save();
          closeModal();
          updateDashboard();
        };
      });
  }

  /* =========================================================
     EXPORT
     ========================================================= */

  function exportData() {
    try {
      const json = JSON.stringify(state, null, 2);
      const blob = new Blob([json], {
        type: "application/json"
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `HISAB-${today()}.json`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      alert("HISAB data exported.");
    } catch (error) {
      console.error(error);
      alert("Export failed.");
    }
  }

  /* =========================================================
     CLEAR DATA
     ========================================================= */

  function clearData() {
    const ok = confirm(
      "This will delete all HISAB data from this device. Continue?"
    );

    if (!ok) return;

    state = structuredClone(DEFAULT_DATA);
    save();

    closeModal();
    updateDashboard();

    alert("All HISAB data has been cleared.");
  }

  /* =========================================================
     ACTION ROUTER
     ========================================================= */

  function action(name) {
    switch (name) {
      case "income":
        transactionForm("income");
        break;

      case "expense":
        transactionForm("expense");
        break;

      case "lend":
      case "lendDen":
      case "paisa":
        lendDen();
        break;

      case "savings":
        savings();
        break;

      case "budget":
        budget();
        break;

      case "bills":
        bills();
        break;

      case "emi":
      case "loans":
        loans();
        break;

      case "goals":
        goals();
        break;

      case "reports":
        reports();
        break;

      default:
        console.warn("Unknown HISAB action:", name);
    }
  }

  /* =========================================================
     EVENT BINDING
     ========================================================= */

  function bind(id, handler) {
    const element = $(id);

    if (!element) return;

    element.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    };
  }

  function init() {
    /* Continue Without Login */
    bind("continueBtn", () => {
      showHome();
    });

    /* Personal */
    bind("personalBtn", () => {
      state.mode = "personal";
      save();
      updateDashboard();
    });

    /* Business */
    bind("businessBtn", () => {
      state.mode = "business";
      save();
      updateDashboard();
    });

    /* Settings */
    bind("settingsBtn", settings);

    /* Modal close */
    bind("closeModal", closeModal);

    bind("modalOverlay", closeModal);

    /* Quick + feature actions */
    document
      .querySelectorAll("[data-action]")
      .forEach(button => {
        button.onclick = event => {
          event.preventDefault();
          event.stopPropagation();

          const actionName =
            button.getAttribute("data-action");

          action(actionName);
        };
      });

    /* View all */
    bind("viewAllBtn", viewAll);

    /* Prevent modal card click from closing modal */
    const modalContent = $("modalContent");

    if (modalContent) {
      modalContent.onclick = event => {
        event.stopPropagation();
      };
    }

    /* Escape key */
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeModal();
      }
    });

    /* Initial dashboard */
    updateDashboard();

    /* Splash */
    setTimeout(() => {
      const splash = $("splashScreen");
      const welcome = $("welcomeScreen");

      if (splash && welcome) {
        splash.classList.remove("active");
        welcome.classList.add("active");
      }
    }, 1400);
  }

  /* =========================================================
     START
     ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* =========================================================
     OPTIONAL GLOBAL ACCESS
     Useful for debugging without breaking app.
     ========================================================= */

  window.HISAB = {
    getState: () => state,
    save,
    refresh: updateDashboard,
    open: openModal,
    close: closeModal
  };

})();
