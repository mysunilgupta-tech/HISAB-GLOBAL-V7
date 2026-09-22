(() => {
  "use strict";

  /* =========================================================
     HISAB GLOBAL V7 — FINAL APP.JS
     Local-first • No Login • Offline Ready
     Personal + Business • Goals • Reports • AdMob Ready
     ========================================================= */

  const STORAGE_KEY = "hisab_v7_data";

  /* =========================================================
     ADMOB CONFIG
     ========================================================= */

  const ADMOB_CONFIG = {
    enabled: true,

    bannerId:
      "ca-app-pub-7508826045358834/9556512077",

    interstitialId:
      "ca-app-pub-7508826045358834/3969143474",

    appOpenId:
      "ca-app-pub-7508826045358834/3729470322"
  };

  let AdMob = null;
  let admobReady = false;
  let appOpenLoaded = false;
  let interstitialReady = false;
  let adSaveCounter = 0;
  let appOpenShownThisSession = false;

  /* =========================================================
     DATA
     ========================================================= */

  const DEFAULT_DATA = {
    mode: "personal",
    currency: "₹",
    language: "en",

    transactions: [],
    lendDen: [],
    savings: [],
    goals: [],
    bills: [],
    loans: [],

    budget: 0
  };

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }

      const data = JSON.parse(saved);

      return {
        ...DEFAULT_DATA,
        ...data,
        transactions: Array.isArray(data.transactions)
          ? data.transactions
          : [],
        lendDen: Array.isArray(data.lendDen)
          ? data.lendDen
          : [],
        savings: Array.isArray(data.savings)
          ? data.savings
          : [],
        goals: Array.isArray(data.goals)
          ? data.goals
          : [],
        bills: Array.isArray(data.bills)
          ? data.bills
          : [],
        loans: Array.isArray(data.loans)
          ? data.loans
          : []
      };
    } catch (e) {
      console.error("HISAB data load error:", e);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  let data = loadData();

  function saveData() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (e) {
      console.error("HISAB save error:", e);
      notify("Unable to save data");
    }

    updateDashboard();

    /*
      Prepare/show interstitial only after a natural amount
      of successful actions. This avoids showing ads after
      every transaction.
    */
    adSaveCounter++;

    if (
      adSaveCounter >= 5 &&
      admobReady
    ) {
      adSaveCounter = 0;
      showInterstitialAd();
    }
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function money(value) {
    const n = Number(value) || 0;

    try {
      return data.currency + n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    } catch {
      return data.currency + n;
    }
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function uid(prefix = "id") {
    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function notify(message) {
    const old = document.querySelector(".hisab-toast");

    if (old) old.remove();

    const toast = document.createElement("div");

    toast.className = "hisab-toast";
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      bottom: "85px",
      transform: "translateX(-50%)",
      zIndex: "99999",
      padding: "12px 18px",
      borderRadius: "14px",
      background: "#0b1f33",
      color: "#fff",
      fontSize: "14px",
      boxShadow: "0 8px 30px rgba(0,0,0,.25)"
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 2200);
  }

  /* =========================================================
     ADMOB
     ========================================================= */

  function getAdMobPlugin() {
    try {
      const Capacitor =
        window.Capacitor || null;

      if (!Capacitor) {
        return null;
      }

      if (
        Capacitor.Plugins &&
        Capacitor.Plugins.AdMob
      ) {
        return Capacitor.Plugins.AdMob;
      }

      if (
        typeof Capacitor.registerPlugin === "function"
      ) {
        return Capacitor.registerPlugin("AdMob");
      }

      return null;
    } catch (e) {
      console.warn(
        "HISAB AdMob plugin unavailable:",
        e
      );

      return null;
    }
  }

  async function initAdMob() {
    if (!ADMOB_CONFIG.enabled) {
      return;
    }

    try {
      AdMob = getAdMobPlugin();

      if (!AdMob) {
        console.log(
          "HISAB: AdMob native plugin not available. Web mode continues."
        );
        return;
      }

      if (
        typeof AdMob.initialize !== "function"
      ) {
        console.log(
          "HISAB: AdMob API not available."
        );
        return;
      }

      await AdMob.initialize();

      /*
        Privacy consent is requested before ads are loaded.
        If consent is not ready, HISAB continues normally
        without displaying an ad.
      */
      let consentInfo = null;

      if (
        typeof AdMob.requestConsentInfo ===
        "function"
      ) {
        try {
          consentInfo =
            await AdMob.requestConsentInfo();

          if (
            consentInfo &&
            consentInfo.isConsentFormAvailable &&
            consentInfo.status === "REQUIRED" &&
            typeof AdMob.showConsentForm ===
              "function"
          ) {
            consentInfo =
              await AdMob.showConsentForm();
          }
        } catch (consentError) {
          console.warn(
            "HISAB AdMob consent:",
            consentError
          );
        }
      }

      /*
        If consent information says ads cannot be requested,
        simply continue using HISAB without ads.
      */
      if (
        consentInfo &&
        consentInfo.canRequestAds === false
      ) {
        console.log(
          "HISAB: Ads not available because consent is not ready."
        );
        return;
      }

      admobReady = true;

      await showBannerAd();

      /*
        Prepare interstitial in background.
      */
      await prepareInterstitialAd();

      /*
        Prepare App Open ad.
        App Open is not allowed to block startup.
      */
      await prepareAppOpenAd();

      console.log(
        "HISAB AdMob initialized successfully"
      );
    } catch (e) {
      console.warn(
        "HISAB AdMob initialization failed:",
        e
      );

      admobReady = false;
    }
  }

  /* =========================================================
     BANNER
     ========================================================= */

  async function showBannerAd() {
    if (!AdMob || !admobReady) {
      return;
    }

    if (
      typeof AdMob.showBanner !== "function"
    ) {
      return;
    }

    try {
      await AdMob.showBanner({
        adId: ADMOB_CONFIG.bannerId,
        adSize: "ADAPTIVE_BANNER",
        position: "BOTTOM_CENTER",
        margin: 0
      });

      console.log(
        "HISAB Banner Ad requested"
      );
    } catch (e) {
      console.warn(
        "HISAB Banner Ad failed:",
        e
      );
    }
  }

  async function hideBannerAd() {
    if (!AdMob) return;

    try {
      if (
        typeof AdMob.hideBanner ===
        "function"
      ) {
        await AdMob.hideBanner();
      }
    } catch (e) {
      console.warn(e);
    }
  }

  async function removeBannerAd() {
    if (!AdMob) return;

    try {
      if (
        typeof AdMob.removeBanner ===
        "function"
      ) {
        await AdMob.removeBanner();
      }
    } catch (e) {
      console.warn(e);
    }
  }

  /* =========================================================
     INTERSTITIAL
     ========================================================= */

  async function prepareInterstitialAd() {
    if (!AdMob || !admobReady) {
      return;
    }

    if (
      typeof AdMob.prepareInterstitial !==
      "function"
    ) {
      return;
    }

    try {
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.interstitialId
      });

      interstitialReady = true;

      console.log(
        "HISAB Interstitial prepared"
      );
    } catch (e) {
      interstitialReady = false;

      console.warn(
        "HISAB Interstitial prepare failed:",
        e
      );
    }
  }

  async function showInterstitialAd() {
    if (!AdMob || !admobReady) {
      return;
    }

    if (
      typeof AdMob.showInterstitial !==
      "function"
    ) {
      return;
    }

    /*
      Never interrupt an important form.
      Only show after completed actions.
    */
    if (!interstitialReady) {
      await prepareInterstitialAd();
    }

    if (!interstitialReady) {
      return;
    }

    try {
      await AdMob.showInterstitial();

      interstitialReady = false;

      /*
        Prepare the next interstitial after the current
        one is finished.
      */
      setTimeout(() => {
        prepareInterstitialAd();
      }, 1000);
    } catch (e) {
      interstitialReady = false;

      console.warn(
        "HISAB Interstitial show failed:",
        e
      );

      setTimeout(() => {
        prepareInterstitialAd();
      }, 1000);
    }
  }

  /* =========================================================
     APP OPEN
     ========================================================= */

  async function prepareAppOpenAd() {
    if (!AdMob || !admobReady) {
      return;
    }

    if (
      typeof AdMob.loadAppOpen !==
      "function"
    ) {
      return;
    }

    try {
      await AdMob.loadAppOpen({
        adId: ADMOB_CONFIG.appOpenId
      });

      appOpenLoaded = true;

      console.log(
        "HISAB App Open Ad loaded"
      );
    } catch (e) {
      appOpenLoaded = false;

      console.warn(
        "HISAB App Open load failed:",
        e
      );
    }
  }

  async function showAppOpenAd() {
    if (
      !AdMob ||
      !admobReady ||
      appOpenShownThisSession ||
      !appOpenLoaded
    ) {
      return;
    }

    if (
      typeof AdMob.isAppOpenLoaded !==
      "function" ||
      typeof AdMob.showAppOpen !==
      "function"
    ) {
      return;
    }

    try {
      const loaded =
        await AdMob.isAppOpenLoaded({
          adId: ADMOB_CONFIG.appOpenId
        });

      if (!loaded || loaded.value !== true) {
        return;
      }

      appOpenShownThisSession = true;
      appOpenLoaded = false;

      await AdMob.showAppOpen({
        adId: ADMOB_CONFIG.appOpenId
      });

      setTimeout(() => {
        prepareAppOpenAd();
      }, 1000);
    } catch (e) {
      console.warn(
        "HISAB App Open show failed:",
        e
      );

      appOpenLoaded = false;
    }
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function showHome() {
    hideAllScreens();

    const home =
      $("homeScreen") ||
      $("home") ||
      $("mainScreen") ||
      document.querySelector(
        "[data-screen='home']"
      );

    if (home) {
      home.style.display = "";
      home.classList.add("active");
    }

    updateDashboard();
  }

  function hideAllScreens() {
    const selectors = [
      ".screen",
      ".page",
      ".app-screen",
      "[data-screen]"
    ];

    document
      .querySelectorAll(selectors.join(","))
      .forEach(el => {
        if (
          el.id !== "homeScreen" &&
          el.id !== "home" &&
          el.id !== "mainScreen" &&
          el.dataset.screen !== "home"
        ) {
          el.style.display = "none";
          el.classList.remove("active");
        }
      });
  }

  function openFeature(name) {
    const map = {
      income: "showIncome",
      expense: "showExpense",
      lendden: "showLendDen",
      khata: "showLendDen",
      savings: "showSavings",
      goals: "showGoals",
      budget: "showBudget",
      bills: "showBills",
      loans: "showLoans",
      emi: "showLoans",
      reports: "showReports",
      analytics: "showReports",
      transactions: "showTransactions",
      settings: "showSettings",
      security: "showSecurity",
      backup: "showBackup"
    };

    const fn =
      map[String(name).toLowerCase()];

    if (
      fn &&
      typeof window[fn] === "function"
    ) {
      window[fn]();
    } else {
      notify("Feature opening...");
    }
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function getIncome() {
    return data.transactions
      .filter(t => t.type === "income")
      .reduce(
        (s, t) =>
          s + Number(t.amount || 0),
        0
      );
  }

  function getExpense() {
    return data.transactions
      .filter(t => t.type === "expense")
      .reduce(
        (s, t) =>
          s + Number(t.amount || 0),
        0
      );
  }

  function getBalance() {
    return getIncome() - getExpense();
  }

  function updateDashboard() {
    const income = getIncome();
    const expense = getExpense();
    const balance = income - expense;

    const values = {
      income,
      totalIncome: income,
      expense,
      totalExpense: expense,
      balance,
      totalBalance: balance,
      savings: data.savings.reduce(
        (s, x) =>
          s + Number(x.amount || 0),
        0
      ),
      budget: Number(data.budget || 0)
    };

    Object.entries(values).forEach(
      ([key, value]) => {
        const ids = [
          key,
          `${key}Amount`,
          `total${key
            .charAt(0)
            .toUpperCase()}${key.slice(1)}`
        ];

        ids.forEach(id => {
          const el = $(id);

          if (el) {
            el.textContent = money(value);
          }
        });
      }
    );

    const modeEls =
      document.querySelectorAll(
        "[data-current-mode], .current-mode"
      );

    modeEls.forEach(el => {
      el.textContent =
        data.mode === "business"
          ? "Business"
          : "Personal";
    });

    renderRecentTransactions();
  }

  /* =========================================================
     GENERIC MODAL
     ========================================================= */

  function closeModal() {
    document
      .querySelectorAll(
        ".hisab-modal, .modal, [data-hisab-modal]"
      )
      .forEach(m => {
        if (
          m.dataset.hisabGenerated ===
          "true"
        ) {
          m.remove();
        } else {
          m.style.display = "none";
        }
      });
  }

  function createModal(
    title,
    body,
    submitText = "Save",
    onSubmit
  ) {
    closeModal();

    const modal =
      document.createElement("div");

    modal.className = "hisab-modal";
    modal.dataset.hisabGenerated = "true";

    Object.assign(modal.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,.45)",
      zIndex: "99998",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    });

    modal.innerHTML = `
      <div style="
        width:100%;
        max-width:430px;
        max-height:90vh;
        overflow:auto;
        background:#fff;
        border-radius:22px;
        padding:20px;
        box-sizing:border-box;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-bottom:18px;
        ">
          <h2 style="margin:0">
            ${escapeHTML(title)}
          </h2>

          <button
            type="button"
            data-close-modal
            style="
              border:0;
              background:#eee;
              width:36px;
              height:36px;
              border-radius:50%;
              font-size:20px;
            "
          >×</button>
        </div>

        <form data-hisab-form>
          ${body}

          <button
            type="submit"
            style="
              width:100%;
              margin-top:16px;
              padding:14px;
              border:0;
              border-radius:14px;
              background:#0b1f33;
              color:white;
              font-size:16px;
              font-weight:700;
            "
          >
            ${escapeHTML(submitText)}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector("[data-close-modal]")
      .addEventListener(
        "click",
        closeModal
      );

    modal.addEventListener(
      "click",
      e => {
        if (e.target === modal) {
          closeModal();
        }
      }
    );

    modal
      .querySelector("form")
      .addEventListener(
        "submit",
        e => {
          e.preventDefault();

          try {
            onSubmit(
              new FormData(e.target)
            );
          } catch (err) {
            console.error(err);
            notify(
              "Please check the details"
            );
          }
        }
      );

    return modal;
  }

  function input(
    label,
    name,
    type = "text",
    required = false
  ) {
    return `
      <label
        style="
          display:block;
          margin-top:12px;
          font-weight:600
        "
      >
        ${escapeHTML(label)}

        <input
          name="${escapeHTML(name)}"
          type="${escapeHTML(type)}"
          ${required ? "required" : ""}
          style="
            width:100%;
            box-sizing:border-box;
            margin-top:6px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:12px;
            font-size:16px;
          "
        >
      </label>
    `;
  }

  function select(
    label,
    name,
    options
  ) {
    return `
      <label
        style="
          display:block;
          margin-top:12px;
          font-weight:600
        "
      >
        ${escapeHTML(label)}

        <select
          name="${escapeHTML(name)}"
          style="
            width:100%;
            box-sizing:border-box;
            margin-top:6px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:12px;
            font-size:16px;
          "
        >
          ${options
            .map(
              o =>
                `<option value="${escapeHTML(
                  o[0]
                )}">
                  ${escapeHTML(o[1])}
                </option>`
            )
            .join("")}
        </select>
      </label>
    `;
  }

  /* =========================================================
     INCOME
     ========================================================= */

  function showIncome() {
    createModal(
      "Add Income",

      input(
        "Amount",
        "amount",
        "number",
        true
      ) +
      input(
        "Source",
        "source",
        "text",
        true
      ) +
      input(
        "Date",
        "date",
        "date",
        true
      ) +
      input("Note", "note"),

      "Add Income",

      fd => {
        const amount =
          Number(fd.get("amount"));

        if (amount <= 0) {
          notify(
            "Enter a valid amount"
          );
          return;
        }

        data.transactions.push({
          id: uid("income"),
          type: "income",
          amount,
          category: "Income",
          source:
            fd.get("source") ||
            "Income",
          note:
            fd.get("note") || "",
          date:
            fd.get("date") ||
            today(),
          time: nowTime(),
          createdAt: Date.now()
        });

        saveData();
        closeModal();

        notify(
          "Income added successfully"
        );
      }
    );
  }

  /* =========================================================
     EXPENSE
     ========================================================= */

  function showExpense() {
    createModal(
      "Add Expense",

      input(
        "Amount",
        "amount",
        "number",
        true
      ) +
      input(
        "Category",
        "category",
        "text",
        true
      ) +
      input(
        "Date",
        "date",
        "date",
        true
      ) +
      input("Note", "note"),

      "Add Expense",

      fd => {
        const amount =
          Number(fd.get("amount"));

        if (amount <= 0) {
          notify(
            "Enter a valid amount"
          );
          return;
        }

        data.transactions.push({
          id: uid("expense"),
          type: "expense",
          amount,
          category:
            fd.get("category") ||
            "Expense",
          note:
            fd.get("note") || "",
          date:
            fd.get("date") ||
            today(),
          time: nowTime(),
          createdAt: Date.now()
        });

        saveData();
        closeModal();

        notify(
          "Expense added successfully"
        );
      }
    );
  }
/* =========================================================
     UDHAR — GIVE / RECEIVE
     ========================================================= */

  function renderUdharList(filter = "all", searchText = "") {
    const allEntries = [...data.lendDen].sort(
      (a, b) =>
        Number(b.createdAt || 0) -
        Number(a.createdAt || 0)
    );

    const search = String(searchText || "")
      .trim()
      .toLowerCase();

    const totalGive = allEntries
      .filter(x => x.type === "given")
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    const totalReceive = allEntries
      .filter(x => x.type === "received")
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    const net = totalGive - totalReceive;

    const entries = allEntries.filter(item => {
      const typeMatch =
        filter === "all" ||
        item.type === filter;

      const text =
        `${item.person || ""} ${item.note || ""}`
          .toLowerCase();

      const searchMatch =
        !search || text.includes(search);

      return typeMatch && searchMatch;
    });

    const rows = entries.length
      ? entries.map(item => {
          const isGive =
            item.type === "given";

          const color = isGive
            ? "#d32f2f"
            : "#168a45";

          const bg = isGive
            ? "#fff5f5"
            : "#f1fff6";

          const label = isGive
            ? "GIVE"
            : "RECEIVE";

          return `
            <div
              data-udhar-person="${escapeHTML(
                item.person || ""
              )}"
              style="
                background:${bg};
                border:1px solid ${
                  isGive
                    ? "#ffd5d5"
                    : "#ccefd9"
                };
                border-radius:18px;
                padding:14px;
                margin-bottom:10px;
              "
            >

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  justify-content:space-between;
                  gap:12px;
                "
              >

                <div style="flex:1;min-width:0;">

                  <div
                    style="
                      font-size:17px;
                      font-weight:900;
                      color:#172b3a;
                      word-break:break-word;
                    "
                  >
                    ${escapeHTML(
                      item.person || "Unknown"
                    )}
                  </div>

                  <div
                    style="
                      margin-top:5px;
                      font-size:12px;
                      color:#777;
                    "
                  >
                    ${escapeHTML(
                      item.date || ""
                    )}
                    ${
                      item.time
                        ? " • " +
                          escapeHTML(item.time)
                        : ""
                    }
                  </div>

                  ${
                    item.note
                      ? `
                        <div
                          style="
                            margin-top:7px;
                            font-size:13px;
                            color:#666;
                            line-height:1.4;
                          "
                        >
                          ${escapeHTML(
                            item.note
                          )}
                        </div>
                      `
                      : ""
                  }

                </div>

                <div
                  style="
                    text-align:right;
                    min-width:92px;
                  "
                >

                  <div
                    style="
                      font-size:11px;
                      font-weight:900;
                      color:${color};
                      letter-spacing:.6px;
                    "
                  >
                    ${label}
                  </div>

                  <div
                    style="
                      margin-top:3px;
                      font-size:18px;
                      font-weight:900;
                      color:${color};
                    "
                  >
                    ${money(item.amount)}
                  </div>

                </div>

              </div>

              <div
                style="
                  display:flex;
                  justify-content:flex-end;
                  gap:8px;
                  margin-top:12px;
                  padding-top:10px;
                  border-top:1px solid rgba(0,0,0,.06);
                "
              >

                <button
                  type="button"
                  data-edit-udhar="${item.id}"
                  style="
                    border:0;
                    border-radius:10px;
                    padding:7px 12px;
                    background:#eef3f7;
                    color:#172b3a;
                    font-weight:800;
                  "
                >
                  Edit
                </button>

                <button
                  type="button"
                  data-delete-udhar="${item.id}"
                  style="
                    border:0;
                    border-radius:10px;
                    padding:7px 12px;
                    background:#fff0f0;
                    color:#d32f2f;
                    font-weight:800;
                  "
                >
                  Delete
                </button>

              </div>

            </div>
          `;
        }).join("")
      : `
        <div
          style="
            text-align:center;
            padding:35px 15px;
            color:#777;
          "
        >
          <div
            style="
              width:60px;
              height:60px;
              margin:0 auto 12px;
              border-radius:50%;
              background:#f2f5f8;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:25px;
              font-weight:900;
              color:#0b1f33;
            "
          >
            ₹
          </div>

          <strong>
            No Udhar entries
          </strong>

          <div
            style="
              margin-top:5px;
              font-size:13px;
            "
          >
            Add your first Give or Receive entry.
          </div>
        </div>
      `;

    return `
      <div>

        <!-- SUMMARY -->

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
            margin-bottom:10px;
          "
        >

          <div
            style="
              padding:15px;
              border-radius:18px;
              background:#fff0f0;
              border:1px solid #ffd4d4;
            "
          >
            <div
              style="
                font-size:11px;
                font-weight:900;
                color:#d32f2f;
                letter-spacing:.7px;
              "
            >
              GIVE
            </div>

            <div
              style="
                margin-top:5px;
                font-size:20px;
                font-weight:900;
                color:#d32f2f;
              "
            >
              ${money(totalGive)}
            </div>

            <div
              style="
                margin-top:3px;
                font-size:11px;
                color:#777;
              "
            >
              Paisa diya
            </div>
          </div>

          <div
            style="
              padding:15px;
              border-radius:18px;
              background:#edfff4;
              border:1px solid #c9f1d8;
            "
          >
            <div
              style="
                font-size:11px;
                font-weight:900;
                color:#168a45;
                letter-spacing:.7px;
              "
            >
              RECEIVE
            </div>

            <div
              style="
                margin-top:5px;
                font-size:20px;
                font-weight:900;
                color:#168a45;
              "
            >
              ${money(totalReceive)}
            </div>

            <div
              style="
                margin-top:3px;
                font-size:11px;
                color:#777;
              "
            >
              Paisa mila
            </div>
          </div>

        </div>

        <!-- NET -->

        <div
          style="
            padding:13px 15px;
            border-radius:16px;
            background:#f5f7fa;
            margin-bottom:13px;
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >

          <span
            style="
              font-size:13px;
              font-weight:800;
              color:#555;
            "
          >
            Net Udhar
          </span>

          <strong
            style="
              font-size:17px;
              color:${
                net >= 0
                  ? "#d32f2f"
                  : "#168a45"
              };
            "
          >
            ${money(Math.abs(net))}
          </strong>

        </div>

        <!-- ADD -->

        <button
          type="button"
          id="addUdharButton"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:15px;
            background:#0b1f33;
            color:#fff;
            font-size:15px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          + Add Udhar
        </button>

        <!-- SEARCH -->

        <input
          id="udharSearch"
          type="search"
          placeholder="Search name or note..."
          value="${escapeHTML(searchText || "")}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px 14px;
            border:1px solid #dfe5ea;
            border-radius:14px;
            font-size:14px;
            outline:none;
            margin-bottom:10px;
            background:#fff;
          "
        />

        <!-- FILTERS -->

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr 1fr;
            gap:7px;
            margin-bottom:17px;
          "
        >

          <button
            type="button"
            data-udhar-filter="all"
            style="
              padding:10px 5px;
              border-radius:11px;
              border:1px solid #dfe5ea;
              background:${
                filter === "all"
                  ? "#0b1f33"
                  : "#fff"
              };
              color:${
                filter === "all"
                  ? "#fff"
                  : "#172b3a"
              };
              font-weight:800;
            "
          >
            All
          </button>

          <button
            type="button"
            data-udhar-filter="given"
            style="
              padding:10px 5px;
              border-radius:11px;
              border:1px solid #ffd5d5;
              background:${
                filter === "given"
                  ? "#d32f2f"
                  : "#fff5f5"
              };
              color:${
                filter === "given"
                  ? "#fff"
                  : "#d32f2f"
              };
              font-weight:800;
            "
          >
            Give
          </button>

          <button
            type="button"
            data-udhar-filter="received"
            style="
              padding:10px 5px;
              border-radius:11px;
              border:1px solid #ccefd9;
              background:${
                filter === "received"
                  ? "#168a45"
                  : "#f1fff6"
              };
              color:${
                filter === "received"
                  ? "#fff"
                  : "#168a45"
              };
              font-weight:800;
            "
          >
            Receive
          </button>

        </div>

        <!-- HISTORY -->

        <div
          style="
            font-size:15px;
            font-weight:900;
            color:#172b3a;
            margin-bottom:10px;
          "
        >
          Udhar History
        </div>

        ${rows}

      </div>
    `;
  }


  function showLendDen(
    filter = "all",
    searchText = ""
  ) {
    closeModal();

    const modal = createModal(
      "Udhar",
      renderUdharList(
        filter,
        searchText
      ),
      "Close",
      () => closeModal()
    );

    const addButton =
      modal.querySelector(
        "#addUdharButton"
      );

    if (addButton) {
      addButton.addEventListener(
        "click",
        () => {
          showAddUdharForm();
        }
      );
    }

    const search =
      modal.querySelector(
        "#udharSearch"
      );

    if (search) {
      search.addEventListener(
        "input",
        () => {
          const value =
            search.value;

          const currentFilter =
            modal
              .querySelector(
                "[data-udhar-filter][style*='background:#0b1f33'], [data-udhar-filter][style*='background:#d32f2f'], [data-udhar-filter][style*='background:#168a45']"
              );

          let selected =
            filter;

          if (currentFilter) {
            selected =
              currentFilter.getAttribute(
                "data-udhar-filter"
              ) || filter;
          }

          const content =
            modal.querySelector(
              ".modal-body"
            );

          if (content) {
            content.innerHTML =
              renderUdharList(
                selected,
                value
              );

            bindUdharEvents(
              modal,
              selected,
              value
            );
          }
        }
      );
    }

    bindUdharEvents(
      modal,
      filter,
      searchText
    );
  }


  function bindUdharEvents(
    modal,
    currentFilter,
    currentSearch
  ) {
    modal
      .querySelectorAll(
        "[data-udhar-filter]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const newFilter =
              button.getAttribute(
                "data-udhar-filter"
              ) || "all";

            const search =
              modal.querySelector(
                "#udharSearch"
              );

            showLendDen(
              newFilter,
              search
                ? search.value
                : currentSearch
            );
          }
        );
      });

    modal
      .querySelectorAll(
        "[data-delete-udhar]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.getAttribute(
                "data-delete-udhar"
              );

            const ok =
              confirm(
                "Delete this Udhar entry?"
              );

            if (!ok) return;

            data.lendDen =
              data.lendDen.filter(
                x => x.id !== id
              );

            saveData();

            showLendDen(
              currentFilter,
              currentSearch
            );

            notify(
              "Udhar deleted"
            );
          }
        );
      });

    modal
      .querySelectorAll(
        "[data-edit-udhar]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.getAttribute(
                "data-edit-udhar"
              );

            showEditUdharForm(id);
          }
        );
      });

    modal
      .querySelectorAll(
        "[data-udhar-person]"
      )
      .forEach(card => {
        card.addEventListener(
          "click",
          event => {
            if (
              event.target.closest(
                "button"
              )
            ) {
              return;
            }

            const person =
              card.getAttribute(
                "data-udhar-person"
              );

            if (person) {
              showPersonUdharHistory(
                person
              );
            }
          }
        );
      });
  }


  function showAddUdharForm() {
    const body =
      input(
        "Name",
        "person",
        "text",
        true
      ) +

      input(
        "Amount",
        "amount",
        "number",
        true
      ) +

      select(
        "Type",
        "type",
        [
          [
            "given",
            "Give — Paisa Diya"
          ],
          [
            "received",
            "Receive — Paisa Mila"
          ]
        ]
      ) +

      input(
        "Date",
        "date",
        "date",
        true
      ) +

      input(
        "Note",
        "note"
      );

    createModal(
      "Add Udhar",
      body,
      "Save Udhar",

      fd => {
        const person =
          String(
            fd.get("person") || ""
          ).trim();

        const amount =
          Number(
            fd.get("amount")
          );

        const type =
          fd.get("type") ||
          "given";

        if (!person) {
          notify(
            "Please enter name"
          );
          return;
        }

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          notify(
            "Enter a valid amount"
          );
          return;
        }

        data.lendDen.push({
          id: uid("udhar"),
          person,
          amount,
          type,
          date:
            fd.get("date") ||
            today(),
          time: nowTime(),
          note:
            String(
              fd.get("note") || ""
            ).trim(),
          createdAt: Date.now()
        });

        saveData();

        showLendDen();

        notify(
          type === "given"
            ? "Give saved"
            : "Receive saved"
        );
      }
    );
  }


  function showEditUdharForm(id) {
    const item =
      data.lendDen.find(
        x => x.id === id
      );

    if (!item) {
      notify(
        "Udhar entry not found"
      );
      return;
    }

    const body =
      input(
        "Name",
        "person",
        "text",
        true
      ) +

      input(
        "Amount",
        "amount",
        "number",
        true
      ) +

      select(
        "Type",
        "type",
        [
          [
            "given",
            "Give — Paisa Diya"
          ],
          [
            "received",
            "Receive — Paisa Mila"
          ]
        ]
      ) +

      input(
        "Date",
        "date",
        "date",
        true
      ) +

      input(
        "Note",
        "note"
      );

    createModal(
      "Edit Udhar",
      body,
      "Update Udhar",

      fd => {
        const person =
          String(
            fd.get("person") || ""
          ).trim();

        const amount =
          Number(
            fd.get("amount")
          );

        if (!person) {
          notify(
            "Please enter name"
          );
          return;
        }

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          notify(
            "Enter a valid amount"
          );
          return;
        }

        item.person = person;
        item.amount = amount;
        item.type =
          fd.get("type") ||
          "given";
        item.date =
          fd.get("date") ||
          today();
        item.note =
          String(
            fd.get("note") || ""
          ).trim();

        saveData();

        showLendDen();

        notify(
          "Udhar updated"
        );
      }
    );

    const modal =
      document.querySelector(
        ".modal"
      );

    if (!modal) return;

    const personInput =
      modal.querySelector(
        '[name="person"]'
      );

    const amountInput =
      modal.querySelector(
        '[name="amount"]'
      );

    const typeInput =
      modal.querySelector(
        '[name="type"]'
      );

    const dateInput =
      modal.querySelector(
        '[name="date"]'
      );

    const noteInput =
      modal.querySelector(
        '[name="note"]'
      );

    if (personInput)
      personInput.value =
        item.person || "";

    if (amountInput)
      amountInput.value =
        item.amount || "";

    if (typeInput)
      typeInput.value =
        item.type || "given";

    if (dateInput)
      dateInput.value =
        item.date || today();

    if (noteInput)
      noteInput.value =
        item.note || "";
  }


  function showPersonUdharHistory(person) {
    const history =
      data.lendDen
        .filter(
          x =>
            String(x.person || "")
              .toLowerCase() ===
            String(person || "")
              .toLowerCase()
        )
        .sort(
          (a, b) =>
            Number(b.createdAt || 0) -
            Number(a.createdAt || 0)
        );

    const give =
      history
        .filter(
          x => x.type === "given"
        )
        .reduce(
          (sum, x) =>
            sum +
            Number(x.amount || 0),
          0
        );

    const receive =
      history
        .filter(
          x => x.type === "received"
        )
        .reduce(
          (sum, x) =>
            sum +
            Number(x.amount || 0),
          0
        );

    const rows =
      history
        .map(item => {
          const isGive =
            item.type === "given";

          const color =
            isGive
              ? "#d32f2f"
              : "#168a45";

          return `
            <div
              style="
                padding:12px 0;
                border-bottom:1px solid #edf0f2;
              "
            >

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  gap:10px;
                "
              >

                <div>
                  <div
                    style="
                      font-size:12px;
                      color:#777;
                    "
                  >
                    ${escapeHTML(
                      item.date || ""
                    )}
                    ${
                      item.time
                        ? " • " +
                          escapeHTML(
                            item.time
                          )
                        : ""
                    }
                  </div>

                  ${
                    item.note
                      ? `
                        <div
                          style="
                            margin-top:4px;
                            font-size:13px;
                            color:#555;
                          "
                        >
                          ${escapeHTML(
                            item.note
                          )}
                        </div>
                      `
                      : ""
                  }
                </div>

                <div
                  style="
                    text-align:right;
                    color:${color};
                    font-weight:900;
                  "
                >
                  ${isGive
                    ? "GIVE"
                    : "RECEIVE"}
                  <br>
                  ${money(item.amount)}
                </div>

              </div>

            </div>
          `;
        })
        .join("");

    createModal(
      escapeHTML(person),
      `
        <div>

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:10px;
              margin-bottom:14px;
            "
          >

            <div
              style="
                padding:13px;
                border-radius:14px;
                background:#fff0f0;
              "
            >
              <div
                style="
                  font-size:11px;
                  font-weight:900;
                  color:#d32f2f;
                "
              >
                GIVE
              </div>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  color:#d32f2f;
                  font-size:18px;
                "
              >
                ${money(give)}
              </strong>
            </div>

            <div
              style="
                padding:13px;
                border-radius:14px;
                background:#edfff4;
              "
            >
              <div
                style="
                  font-size:11px;
                  font-weight:900;
                  color:#168a45;
                "
              >
                RECEIVE
              </div>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  color:#168a45;
                  font-size:18px;
                "
              >
                ${money(receive)}
              </strong>
            </div>

          </div>

          <div
            style="
              font-size:15px;
              font-weight:900;
              color:#172b3a;
              margin-bottom:5px;
            "
          >
            Transaction History
          </div>

          ${
            rows ||
            `
              <div
                style="
                  padding:20px;
                  text-align:center;
                  color:#777;
                "
              >
                No history
              </div>
            `
          }

        </div>
      `,
      "Close",
      () => closeModal()
    );
  }
  
  /* =========================================================
     SAVINGS
     ========================================================= */

  function showSavings() {
    createModal(
      "Add Savings",

      input(
        "Amount",
        "amount",
        "number",
        true
      ) +
      input(
        "Purpose",
        "purpose",
        "text",
        true
      ) +
      input(
        "Date",
        "date",
        "date",
        true
      ) +
      input("Note", "note"),

      "Save",

      fd => {
        const amount =
          Number(fd.get("amount"));

        if (amount <= 0) {
          notify(
            "Enter a valid amount"
          );
          return;
        }

        data.savings.push({
          id: uid("saving"),
          amount,
          purpose:
            fd.get("purpose"),
          date:
            fd.get("date") ||
            today(),
          note:
            fd.get("note") || "",
          createdAt: Date.now()
        });

        saveData();
        closeModal();

        notify(
          "Savings added"
        );
      }
    );
  }

  /* =========================================================
     GOALS
     ========================================================= */

  function showGoals() {
    createModal(
      "Create Goal",

      input(
        "Goal Name",
        "name",
        "text",
        true
      ) +
      input(
        "Target Amount",
        "target",
        "number",
        true
      ) +
      input(
        "Saved Amount",
        "saved",
        "number"
      ) +
      input(
        "Target Date",
        "date",
        "date"
      ),

      "Create Goal",

      fd => {
        const target =
          Number(fd.get("target"));

        if (target <= 0) {
          notify(
            "Enter a valid target"
          );
          return;
        }

        data.goals.push({
          id: uid("goal"),
          name:
            fd.get("name"),
          target,
          saved:
            Number(
              fd.get("saved")
            ) || 0,
          date:
            fd.get("date") || "",
          createdAt: Date.now()
        });

        saveData();
        closeModal();

        notify(
          "Goal created"
        );
      }
    );
  }

  /* =========================================================
     BUDGET
     ========================================================= */

  function showBudget() {
    createModal(
      "Monthly Budget",

      input(
        "Budget Amount",
        "amount",
        "number",
        true
      ),

      "Save Budget",

      fd => {
        const amount =
          Number(fd.get("amount"));

        if (amount < 0) {
          notify(
            "Enter a valid budget"
          );
          return;
        }

        data.budget = amount;

        saveData();
        closeModal();

        notify(
          "Budget saved"
        );
      }
    );
  }

  /* =========================================================
     BILLS
     ========================================================= */

  function showBills() {
    createModal(
      "Add Bill / Reminder",

      input(
        "Bill Name",
        "name",
        "text",
        true
      ) +
      input(
        "Amount",
        "amount",
        "number",
        true
      ) +
      input(
        "Due Date",
        "dueDate",
        "date",
        true
      ) +
      select(
        "Status",
        "status",
        [
          ["pending", "Pending"],
          ["paid", "Paid"]
        ]
      ) +
      input("Note", "note"),

      "Save Bill",

      fd => {
        data.bills.push({
          id: uid("bill"),
          name:
            fd.get("name"),
          amount:
            Number(
              fd.get("amount")
            ) || 0,
          dueDate:
            fd.get("dueDate") ||
            today(),
          status:
            fd.get("status") ||
            "pending",
          note:
            fd.get("note") || "",
          createdAt: Date.now()
        });

        saveData();
        closeModal();

        notify(
          "Bill saved"
        );
      }
    );
  }

  /* =========================================================
     LOANS / EMI
     ========================================================= */

  function showLoans() {
    createModal(
      "Add Loan / EMI",

      input(
        "Loan / Company Name",
        "name",
        "text",
        true
      ) +
      input(
        "Loan Amount",
        "amount",
        "number",
        true
      ) +
      input(
        "EMI Amount",
        "emi",
        "number",
        true
      ) +
      input(
        "Due Date",
        "dueDate",
        "date",
        true
      ) +
      input(
        "Tenure (Months)",
        "tenure",
        "number"
      ) +
      select(
        "Status",
        "status",
        [
          ["pending", "Pending"],
          ["paid", "Paid"]
        ]
      ),

      "Save Loan",

      fd => {
        data.loans.push({
          id: uid("loan"),
          name:
            fd.get("name"),
          amount:
            Number(
              fd.get("amount")
            ) || 0,
          emi:
            Number(
              fd.get("emi")
            ) || 0,
          dueDate:
            fd.get("dueDate") ||
            today(),
          tenure:
            Number(
              fd.get("tenure")
            ) || 0,
          status:
            fd.get("status") ||
            "pending",
          createdAt: Date.now()
        });

        saveData();
        closeModal();

        notify(
          "Loan / EMI saved"
        );
      }
    );
  }

  /* =========================================================
     TRANSACTIONS
     ========================================================= */

  function showTransactions() {
    closeModal();

    const rows =
      [...data.transactions]
        .sort(
          (a, b) =>
            Number(
              b.createdAt || 0
            ) -
            Number(
              a.createdAt || 0
            )
        )
        .map(
          t => `
          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            padding:13px 0;
            border-bottom:1px solid #eee;
          ">
            <div>
              <strong>
                ${escapeHTML(
                  t.source ||
                  t.category ||
                  t.type
                )}
              </strong>

              <div style="
                font-size:12px;
                color:#777
              ">
                ${escapeHTML(
                  t.date || ""
                )}
                ${escapeHTML(
                  t.time || ""
                )}
              </div>

              ${
                t.note
                  ? `
                <div style="
                  font-size:12px;
                  color:#777
                ">
                  ${escapeHTML(
                    t.note
                  )}
                </div>
              `
                  : ""
              }
            </div>

            <div style="
              font-weight:800;
              color:${
                t.type === "income"
                  ? "green"
                  : "#c62828"
              };
            ">
              ${
                t.type === "income"
                  ? "+"
                  : "-"
              }${money(t.amount)}
            </div>
          </div>
        `
        )
        .join("");

    createModal(
      "Transactions",

      `
        <div>
          ${
            rows ||
            `
              <p style="
                text-align:center;
                color:#777
              ">
                No transactions yet.
              </p>
            `
          }
        </div>
      `,

      "Close",

      () => closeModal()
    );
  }

  function renderRecentTransactions() {
    const container =
      $("recentTransactions") ||
      document.querySelector(
        "[data-recent-transactions]"
      );

    if (!container) return;

    const recent =
      [...data.transactions]
        .sort(
          (a, b) =>
            Number(
              b.createdAt || 0
            ) -
            Number(
              a.createdAt || 0
            )
        )
        .slice(0, 5);

    if (!recent.length) {
      container.innerHTML =
        `
        <div style="
          padding:15px;
          color:#777
        ">
          No transactions yet
        </div>
        `;

      return;
    }

    container.innerHTML =
      recent
        .map(
          t => `
        <div style="
          display:flex;
          justify-content:space-between;
          padding:10px 0;
          border-bottom:1px solid #eee;
        ">
          <span>
            ${escapeHTML(
              t.source ||
              t.category ||
              t.type
            )}
          </span>

          <strong>
            ${
              t.type === "income"
                ? "+"
                : "-"
            }${money(t.amount)}
          </strong>
        </div>
      `
        )
        .join("");
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function showReports() {
    const income = getIncome();
    const expense = getExpense();
    const balance =
      income - expense;

    const given =
      data.lendDen
        .filter(
          x => x.type === "given"
        )
        .reduce(
          (s, x) =>
            s + Number(
              x.amount || 0
            ),
          0
        );

    const received =
      data.lendDen
        .filter(
          x => x.type === "received"
        )
        .reduce(
          (s, x) =>
            s + Number(
              x.amount || 0
            ),
          0
        );

    const pendingBills =
      data.bills.filter(
        x => x.status !== "paid"
      ).length;

    const pendingLoans =
      data.loans.filter(
        x => x.status !== "paid"
      ).length;

    createModal(
      "Reports & Analytics",

      `
        <div style="
          display:grid;
          gap:10px
        ">

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Total Income</small>
            <h3>
              ${money(income)}
            </h3>
          </div>

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Total Expense</small>
            <h3>
              ${money(expense)}
            </h3>
          </div>

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Balance</small>
            <h3>
              ${money(balance)}
            </h3>
          </div>

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Paisa Diya</small>
            <h3>
              ${money(given)}
            </h3>
          </div>

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Paisa Liya</small>
            <h3>
              ${money(received)}
            </h3>
          </div>

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Pending Bills</small>
            <h3>
              ${pendingBills}
            </h3>
          </div>

          <div style="
            padding:15px;
            border-radius:15px;
            background:#f5f7fa
          ">
            <small>Pending Loans / EMI</small>
            <h3>
              ${pendingLoans}
            </h3>
          </div>

        </div>
      `,

      "Close",

      () => closeModal()
    );
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function showSettings() {
    createModal(
      "Settings",

      `
        ${select(
          "Mode",
          "mode",
          [
            [
              "personal",
              "Personal"
            ],
            [
              "business",
              "Business"
            ]
          ]
        )}

        ${select(
          "Currency",
          "currency",
          [
            [
              "₹",
              "Indian Rupee (₹)"
            ],
            [
              "$",
              "US Dollar ($)"
            ],
            [
              "€",
              "Euro (€)"
            ],
            [
              "£",
              "British Pound (£)"
            ],
            [
              "¥",
              "Japanese Yen (¥)"
            ],
            [
              "AED ",
              "UAE Dirham"
            ]
          ]
        )}

        ${select(
          "Language",
          "language",
          [
            [
              "en",
              "English"
            ],
            [
              "hi",
              "Hindi"
            ]
          ]
        )}
      `,

      "Save Settings",

      fd => {
        data.mode =
          fd.get("mode") ||
          "personal";

        data.currency =
          fd.get("currency") ||
          "₹";

        data.language =
          fd.get("language") ||
          "en";

        saveData();
        closeModal();

        notify(
          "Settings saved"
        );
      }
    );
  }

  /* =========================================================
     SECURITY
     ========================================================= */

  function showSecurity() {
    createModal(
      "Security",

      `
        <div style="
          line-height:1.6
        ">
          <p>
            <strong>
              HISAB Security
            </strong>
          </p>

          <p>
            Your financial data is stored
            locally on this device.
          </p>

          <p>
            Biometric/app-lock integration
            can be added through native
            Android security APIs.
          </p>
        </div>
      `,

      "Close",

      () => closeModal()
    );
  }

  /* =========================================================
     BACKUP / RESTORE
     ========================================================= */

  function showBackup() {
    createModal(
      "Backup & Restore",

      `
        <button
          type="button"
          id="exportHisab"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:14px;
            background:#0b1f33;
            color:white;
            font-weight:700;
          "
        >
          Export Backup
        </button>

        <label style="
          display:block;
          margin-top:14px;
          padding:14px;
          border:1px dashed #aaa;
          border-radius:14px;
          text-align:center;
          cursor:pointer;
        ">
          Import Backup

          <input
            id="importHisab"
            type="file"
            accept=".json,application/json"
            style="display:none"
          >
        </label>
      `,

      "Close",

      () => closeModal()
    );

    const exportButton =
      $("exportHisab");

    const importInput =
      $("importHisab");

    if (exportButton) {
      exportButton.addEventListener(
        "click",
        exportBackup
      );
    }

    if (importInput) {
      importInput.addEventListener(
        "change",
        importBackup
      );
    }
  }

  function exportBackup() {
    try {
      const blob =
        new Blob(
          [
            JSON.stringify(
              data,
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
        "HISAB_Backup_" +
        new Date()
          .toISOString()
          .slice(0, 10) +
        ".json";

      document.body.appendChild(a);

      a.click();

      a.remove();

      URL.revokeObjectURL(url);

      notify(
        "Backup exported"
      );
    } catch (e) {
      console.error(e);

      notify(
        "Backup export failed"
      );
    }
  }

  function importBackup(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const imported =
          JSON.parse(
            reader.result
          );

        if (
          !imported ||
          typeof imported !==
            "object"
        ) {
          throw new Error(
            "Invalid backup"
          );
        }

        data = {
          ...DEFAULT_DATA,
          ...imported,

          transactions:
            Array.isArray(
              imported.transactions
            )
              ? imported.transactions
              : [],

          lendDen:
            Array.isArray(
              imported.lendDen
            )
              ? imported.lendDen
              : [],

          savings:
            Array.isArray(
              imported.savings
            )
              ? imported.savings
              : [],

          goals:
            Array.isArray(
              imported.goals
            )
              ? imported.goals
              : [],

          bills:
            Array.isArray(
              imported.bills
            )
              ? imported.bills
              : [],

          loans:
            Array.isArray(
              imported.loans
            )
              ? imported.loans
              : []
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data)
        );

        /*
          Keep public HISAB API synchronized
          after restoring backup.
        */
        if (window.HISAB) {
          window.HISAB.data =
            data;
        }

        updateDashboard();

        closeModal();

        notify(
          "Backup restored successfully"
        );
      } catch (e) {
        console.error(e);

        notify(
          "Invalid backup file"
        );
      }
    };

    reader.readAsText(file);
  }

  /* =========================================================
     CLEAR DATA
     ========================================================= */

  function clearAllData() {
    const ok =
      confirm(
        "Delete all HISAB data from this device?"
      );

    if (!ok) return;

    data =
      JSON.parse(
        JSON.stringify(
          DEFAULT_DATA
        )
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    if (window.HISAB) {
      window.HISAB.data =
        data;
    }

    updateDashboard();

    notify(
      "All data cleared"
    );
  }

  /* =========================================================
     QUICK BUTTON AUTO CONNECTION
     ========================================================= */

  function bindButtons() {
  if (
    document.documentElement.dataset.hisabDelegated ===
    "true"
  ) {
    return;
  }

  document.documentElement.dataset.hisabDelegated =
    "true";

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(
      "button, [role='button'], [data-action], [data-feature], [data-screen-button]"
    );

    if (!btn) return;

/* Never let the global click handler hijack modal buttons. */
if (btn.closest(".hisab-modal")) {
  return;
}

const action =
      btn.dataset.action ||
      btn.dataset.feature ||
      btn.dataset.screenButton;

    if (action) {
      e.preventDefault();
      e.stopPropagation();

      const normalized = String(action)
        .trim()
        .toLowerCase();

      if (normalized === "home") {
        showHome();
        return;
      }

      if (normalized === "clear") {
        clearAllData();
        return;
      }

      openFeature(normalized);
      return;
    }

    const text = (btn.textContent || "")
      .trim()
      .toLowerCase();

    let fallback = null;

    if (
      text.includes("income") ||
      text.includes("aamdani")
    ) {
      fallback = "income";
    } else if (
      text.includes("expense") ||
      text.includes("kharcha")
    ) {
      fallback = "expense";
    } else if (
      text.includes("len-den") ||
      text.includes("lend") ||
      text.includes("udhaar") ||
      text.includes("khata")
    ) {
      fallback = "lendden";
    } else if (
      text.includes("saving")
    ) {
      fallback = "savings";
    } else if (
      text.includes("goal")
    ) {
      fallback = "goals";
    } else if (
      text.includes("budget")
    ) {
      fallback = "budget";
    } else if (
      text.includes("bill")
    ) {
      fallback = "bills";
    } else if (
      text.includes("loan") ||
      text.includes("emi")
    ) {
      fallback = "loans";
    } else if (
      text.includes("report") ||
      text.includes("analytics")
    ) {
      fallback = "reports";
    } else if (
      text.includes("transaction")
    ) {
      fallback = "transactions";
    } else if (
      text.includes("setting")
    ) {
      fallback = "settings";
    } else if (
      text.includes("security")
    ) {
      fallback = "security";
    } else if (
      text.includes("backup") ||
      text.includes("restore")
    ) {
      fallback = "backup";
    }

    if (fallback) {
      e.preventDefault();
      e.stopPropagation();
      openFeature(fallback);
    }
  });
}

  /* =========================================================
     APP RESUME
     ========================================================= */

  function setupAppResume() {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          /*
            App Open is only attempted when
            an ad was already loaded.
          */
          if (
            admobReady &&
            appOpenLoaded &&
            !appOpenShownThisSession
          ) {
            setTimeout(() => {
              showAppOpenAd();
            }, 700);
          }
        }
      }
    );
  }

  /* =========================================================
     GLOBAL API
     ========================================================= */

  window.HISAB = {
    data,

    saveData,

    showHome,
    showIncome,
    showExpense,
    showLendDen,
    showSavings,
    showGoals,
    showBudget,
    showBills,
    showLoans,
    showTransactions,
    showReports,
    showSettings,
    showSecurity,
    showBackup,

    exportBackup,
    importBackup,
    clearAllData,

    updateDashboard,
    openFeature,

    /*
      AdMob controls
    */
    initAdMob,
    showBannerAd,
    hideBannerAd,
    removeBannerAd,
    prepareInterstitialAd,
    showInterstitialAd,
    prepareAppOpenAd,
    showAppOpenAd
  };

  /* =========================================================
     DIRECT GLOBAL FUNCTIONS
     ========================================================= */

  window.showHome =
    showHome;

  window.showIncome =
    showIncome;

  window.showExpense =
    showExpense;

  window.showLendDen =
    showLendDen;

  window.showSavings =
    showSavings;

  window.showGoals =
    showGoals;

  window.showBudget =
    showBudget;

  window.showBills =
    showBills;

  window.showLoans =
    showLoans;

  window.showTransactions =
    showTransactions;

  window.showReports =
    showReports;

  window.showSettings =
    showSettings;

  window.showSecurity =
    showSecurity;

  window.showBackup =
    showBackup;

  window.exportBackup =
    exportBackup;

  window.clearAllData =
    clearAllData;

  window.updateDashboard =
    updateDashboard;

  /* =========================================================
     STARTUP
     ========================================================= */

  function initHISAB() {
    bindButtons();

    updateDashboard();

    setupAppResume();

    /*
      Continue Without Login / Start buttons
    */
    document
      .querySelectorAll(
        "button, a"
      )
      .forEach(el => {
        const text =
          el.textContent
            .trim()
            .toLowerCase();

        if (
          text.includes(
            "continue without login"
          ) ||
          text === "continue" ||
          text.includes(
            "get started"
          ) ||
          text.includes(
            "start using hisab"
          )
        ) {
          el.addEventListener(
            "click",
            e => {
              e.preventDefault();

              const welcome =
                $("welcomeScreen") ||
                $("loginScreen") ||
                $("landingScreen") ||
                document.querySelector(
                  ".welcome-screen"
                );

              if (welcome) {
                welcome.style.display =
                  "none";
              }

              showHome();

              /*
                Start AdMob only after UI
                is ready. This prevents ads
                from blocking app startup.
              */
              setTimeout(() => {
                initAdMob();
              }, 500);
            }
          );
        }
      });

    /*
      If the app has no welcome/login screen,
      initialize AdMob after UI is ready.
    */
    const welcomeExists =
      $("welcomeScreen") ||
      $("loginScreen") ||
      $("landingScreen") ||
      document.querySelector(
        ".welcome-screen"
      );

    if (!welcomeExists) {
      setTimeout(() => {
        initAdMob();
      }, 700);
    }

    console.log(
      "HISAB V7 initialized successfully"
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initHISAB
    );
  } else {
    initHISAB();
  }

})();
