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
     UDHAR — PERSON WISE GIVE / RECEIVE
     ========================================================= */

  function getUdharPersons() {

    const map = {};

    if (!Array.isArray(data.lendDen)) {
      data.lendDen = [];
    }

    data.lendDen.forEach(item => {

      const name =
        String(
          item.person ||
          ""
        ).trim();

      if (!name) return;

      const key =
        name.toLowerCase();

      if (!map[key]) {
        map[key] = {
          person: name,
          given: 0,
          received: 0,
          entries: []
        };
      }

      const amount =
        Number(item.amount || 0);

      if (item.type === "given") {
        map[key].given += amount;
      }

      if (item.type === "received") {
        map[key].received += amount;
      }

      map[key].entries.push(item);
    });

    return Object.values(map).map(person => {

      /*
        Diya - Liya

        Positive:
        Person se paisa lena hai

        Negative:
        Person ko paisa dena hai

        Zero:
        Hisab clear
      */

      person.balance =
        person.given -
        person.received;

      return person;
    });
  }


  /* =========================================================
     ADD UDHAR ENTRY
     ========================================================= */

  function showLendDen(personName = "") {

    createModal(
      "Paisa Len-Den / Udhaar",

      input(
        "Person Name",
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
            "Paisa Diya"
          ],
          [
            "received",
            "Paisa Liya"
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
      ),

      "Save Entry",

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
          String(
            fd.get("type") || ""
          );

        if (!person) {
          notify(
            "Person name required"
          );
          return;
        }

        if (
          !amount ||
          amount <= 0
        ) {
          notify(
            "Enter a valid amount"
          );
          return;
        }

        if (
          type !== "given" &&
          type !== "received"
        ) {
          notify(
            "Select valid type"
          );
          return;
        }

        if (
          !Array.isArray(
            data.lendDen
          )
        ) {
          data.lendDen = [];
        }

        data.lendDen.push({

          id:
            uid("udhar"),

          person:
            person,

          type:
            type,

          amount:
            amount,

          note:
            String(
              fd.get("note") || ""
            ).trim(),

          date:
            fd.get("date") ||
            today(),

          time:
            nowTime(),

          createdAt:
            Date.now()

        });

        saveData();

        closeModal();

        notify(
          type === "given"
            ? "Paisa diya record ho gaya"
            : "Paisa liya record ho gaya"
        );

        /*
          Open Udhaar again so the
          updated person-wise balance
          is immediately visible.
        */

        setTimeout(() => {
          showLendDen();
        }, 150);
      }
    );

    /*
      Pre-fill person name when
      entry is opened from a person card.
    */

    if (personName) {

      setTimeout(() => {

        const personInput =
          document.querySelector(
            ".hisab-modal input[name='person']"
          );

        if (personInput) {
          personInput.value =
            personName;
        }

      }, 50);
    }
  }


  /* =========================================================
     UDHAR SUMMARY
     ========================================================= */

  function getUdharSummary() {

    let given = 0;
    let received = 0;

    if (!Array.isArray(data.lendDen)) {
      data.lendDen = [];
    }

    data.lendDen.forEach(item => {

      const amount =
        Number(
          item.amount || 0
        );

      if (item.type === "given") {
        given += amount;
      }

      if (item.type === "received") {
        received += amount;
      }
    });

    return {
      given,
      received,
      net:
        given - received
    };
  }


  /* =========================================================
     UDHAR MAIN SCREEN
     ========================================================= */

  function openUdharScreen(
    filter = "all",
    searchText = ""
  ) {

    const persons =
      getUdharPersons();

    const summary =
      getUdharSummary();

    const search =
      String(
        searchText || ""
      )
        .trim()
        .toLowerCase();

    let filtered =
      persons.filter(person => {

        const matchesSearch =
          !search ||
          person.person
            .toLowerCase()
            .includes(search);

        if (!matchesSearch) {
          return false;
        }

        if (filter === "given") {
          return person.given > 0;
        }

        if (filter === "received") {
          return person.received > 0;
        }

        if (filter === "due") {
          return person.balance !== 0;
        }

        return true;
      });


    filtered.sort((a, b) =>
      a.person.localeCompare(
        b.person
      )
    );


    const personHTML =
      filtered.length

        ? filtered.map(person => {

            const balance =
              Number(
                person.balance || 0
              );

            let status =
              "HISAB CLEAR";

            let statusBg =
              "#edf9f1";

            let statusColor =
              "#168a45";

            if (balance > 0) {

              status =
                "LENA HAI";

              statusBg =
                "#fff0f0";

              statusColor =
                "#d32f2f";

            } else if (balance < 0) {

              status =
                "DENA HAI";

              statusBg =
                "#fff7e8";

              statusColor =
                "#c77700";
            }


            return `

              <div
                style="
                  padding:15px;
                  margin-bottom:10px;
                  border:1px solid #e1e7ec;
                  border-radius:18px;
                  background:#fff;
                "
              >

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                  "
                >

                  <strong
                    style="
                      font-size:17px;
                      color:#172b3a;
                    "
                  >
                    ${escapeHTML(
                      person.person
                    )}
                  </strong>

                  <span
                    style="
                      padding:5px 8px;
                      border-radius:8px;
                      background:${statusBg};
                      color:${statusColor};
                      font-size:10px;
                      font-weight:900;
                    "
                  >
                    ${status}
                  </span>

                </div>


                <div
                  style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:8px;
                    margin-top:12px;
                  "
                >

                  <div
                    style="
                      padding:10px;
                      border-radius:12px;
                      background:#fff1f1;
                    "
                  >

                    <small
                      style="
                        color:#d32f2f;
                        font-weight:800;
                      "
                    >
                      DIYA
                    </small>

                    <div
                      style="
                        margin-top:3px;
                        color:#d32f2f;
                        font-weight:900;
                      "
                    >
                      ${money(
                        person.given
                      )}
                    </div>

                  </div>


                  <div
                    style="
                      padding:10px;
                      border-radius:12px;
                      background:#effbf3;
                    "
                  >

                    <small
                      style="
                        color:#168a45;
                        font-weight:800;
                      "
                    >
                      LIYA
                    </small>

                    <div
                      style="
                        margin-top:3px;
                        color:#168a45;
                        font-weight:900;
                      "
                    >
                      ${money(
                        person.received
                      )}
                    </div>

                  </div>

                </div>


                <div
                  style="
                    margin-top:9px;
                    padding:11px;
                    border-radius:12px;
                    background:#f5f7fa;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                  "
                >

                  <span
                    style="
                      font-size:12px;
                      font-weight:800;
                      color:#555;
                    "
                  >
                    ${
                      balance > 0
                        ? "Is person se lena hai"
                        : balance < 0
                        ? "Is person ko dena hai"
                        : "Hisab clear"
                    }
                  </span>

                  <strong
                    style="
                      color:${statusColor};
                    "
                  >
                    ${money(
                      Math.abs(balance)
                    )}
                  </strong>

                </div>


                <div
                  style="
                    display:flex;
                    gap:7px;
                    margin-top:10px;
                  "
                >

                  <button
                    type="button"
                    data-udhar-entry="${escapeHTML(
                      person.person
                    )}"
                    style="
                      flex:1;
                      padding:10px;
                      border:0;
                      border-radius:10px;
                      background:#0b1f33;
                      color:#fff;
                      font-weight:800;
                    "
                  >
                    + Entry
                  </button>

                  <button
                    type="button"
                    data-udhar-history="${escapeHTML(
                      person.person
                    )}"
                    style="
                      flex:1;
                      padding:10px;
                      border:1px solid #d9e0e6;
                      border-radius:10px;
                      background:#fff;
                      color:#172b3a;
                      font-weight:800;
                    "
                  >
                    History
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
                font-size:35px;
                margin-bottom:8px;
              "
            >
              🤝
            </div>

            <strong>
              No Udhaar found
            </strong>

            <p
              style="
                margin:6px 0 0;
                font-size:13px;
              "
            >
              Add your first Paisa Diya
              or Paisa Liya entry.
            </p>

          </div>

        `;


    const modal =
      createModal(
        "Udhaar Hisaab",

        `
          <!-- SUMMARY -->

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:8px;
            "
          >

            <div
              style="
                padding:12px;
                border-radius:14px;
                background:#fff0f0;
              "
            >

              <small
                style="
                  color:#d32f2f;
                  font-weight:900;
                "
              >
                TOTAL DIYA
              </small>

              <div
                style="
                  margin-top:4px;
                  color:#d32f2f;
                  font-size:18px;
                  font-weight:900;
                "
              >
                ${money(
                  summary.given
                )}
              </div>

            </div>


            <div
              style="
                padding:12px;
                border-radius:14px;
                background:#effbf3;
              "
            >

              <small
                style="
                  color:#168a45;
                  font-weight:900;
                "
              >
                TOTAL LIYA
              </small>

              <div
                style="
                  margin-top:4px;
                  color:#168a45;
                  font-size:18px;
                  font-weight:900;
                "
              >
                ${money(
                  summary.received
                )}
              </div>

            </div>

          </div>


          <div
            style="
              margin-top:9px;
              padding:12px;
              border-radius:14px;
              background:#f5f7fa;
              text-align:center;
            "
          >

            <small
              style="
                color:#666;
                font-weight:800;
              "
            >
              OVERALL NET
            </small>

            <div
              style="
                margin-top:4px;
                font-size:19px;
                font-weight:900;
              "
            >
              ${
                summary.net > 0
                  ? "Lena Hai " +
                    money(summary.net)
                  : summary.net < 0
                  ? "Dena Hai " +
                    money(
                      Math.abs(
                        summary.net
                      )
                    )
                  : "Hisab Clear ₹0"
              }
            </div>

          </div>


          <!-- SEARCH -->

          <input
            id="udharSearch"
            type="search"
            placeholder="Search person..."
            value="${escapeHTML(
              searchText
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              margin-top:12px;
              padding:12px;
              border:1px solid #ddd;
              border-radius:12px;
              font-size:15px;
            "
          >


          <!-- FILTERS -->

          <div
            style="
              display:grid;
              grid-template-columns:repeat(4,1fr);
              gap:5px;
              margin-top:10px;
            "
          >

            <button
              type="button"
              data-udhar-filter="all"
              style="
                padding:9px 4px;
                border:0;
                border-radius:9px;
                background:#eef3f7;
                font-weight:800;
                font-size:11px;
              "
            >
              All
            </button>

            <button
              type="button"
              data-udhar-filter="given"
              style="
                padding:9px 4px;
                border:0;
                border-radius:9px;
                background:#eef3f7;
                font-weight:800;
                font-size:11px;
              "
            >
              Diya
            </button>

            <button
              type="button"
              data-udhar-filter="received"
              style="
                padding:9px 4px;
                border:0;
                border-radius:9px;
                background:#eef3f7;
                font-weight:800;
                font-size:11px;
              "
            >
              Liya
            </button>

            <button
              type="button"
              data-udhar-filter="due"
              style="
                padding:9px 4px;
                border:0;
                border-radius:9px;
                background:#eef3f7;
                font-weight:800;
                font-size:11px;
              "
            >
              Due
            </button>

          </div>


          <!-- ADD -->

          <button
            type="button"
            id="addUdharEntry"
            style="
              width:100%;
              margin-top:11px;
              padding:13px;
              border:0;
              border-radius:13px;
              background:#0b1f33;
              color:#fff;
              font-weight:900;
            "
          >
            + Add Udhaar Entry
          </button>


          <!-- PEOPLE -->

          <div
            style="
              margin-top:15px;
            "
          >

            <h3
              style="
                margin:0 0 10px;
                color:#172b3a;
              "
           

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
