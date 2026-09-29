/* =========================================================
HISAB V7 — COMPLETE STABLE CONTROLLER
Compatible with current HISAB V7 index.html
Single controller
No repair.js required
Defensive startup — white-screen safe
========================================================= */

(function () {
"use strict";

/* =========================================================
BASIC HELPERS
========================================================= */

var KEY = "hisab_v7_data";
var GUEST_KEY = "hisab_v7_guest";

function $(id) {
return document.getElementById(id);
}

function safeNum(v) {
var n = Number(v);
return isFinite(n) ? n : 0;
}

function money(v) {
return (D.currency || "₹") + safeNum(v).toLocaleString("en-IN", {
maximumFractionDigits: 2
});
}

function uid(prefix) {
return (
(prefix || "id") +
"*" +
Date.now() +
"*" +
Math.random().toString(36).slice(2, 8)
);
}

function today() {
return new Date().toISOString().slice(0, 10);
}

/* FIXED */
function esc(v) {
return String(v == null ? "" : v)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

/* FIXED */
function arr(v) {
return Array.isArray(v) ? v : [];
}

function selectedMode() {
return D.mode === "business" ? "business" : "personal";
}

function notify(msg) {
try {
alert(msg);
} catch (e) {}
}

function setHTML(id, html) {
var el = $(id);
if (el) el.innerHTML = html;
}

function setValue(id, value) {
var el = $(id);
if (el) el.value = value == null ? "" : value;
}

function getValue(id) {
var el = $(id);
return el ? String(el.value || "").trim() : "";
}

/* =========================================================
DEFAULT DATA
========================================================= */

var DEFAULT = {
mode: "personal",
currency: "₹",
language: "hi",

transactions: [],
khata: [],

business: [],
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
pin: "",

ui: {
businessFilter: "customer",
khataFilter: "all",
detailFilter: "all",
selectedPerson: "",
selectedMode: "personal",
returnPage: "home",
lastPage: "home"
}
};

/* =========================================================
LOAD / NORMALIZE
========================================================= */

function cloneDefault() {
return JSON.parse(JSON.stringify(DEFAULT));
}

function normalizeData(raw) {
var d = raw && typeof raw === "object" ? raw : {};
var base = cloneDefault();

Object.keys(base).forEach(function (key) {
if (key === "ui") return;

if (d[key] !== undefined) {
base[key] = d[key];
}
});

[
"transactions",
"khata",
"business",
"sales",
"purchases",
"goals",
"savings",
"bills",
"loans",
"reminders",
"family",
"tools"
].forEach(function (key) {
base[key] = arr(base[key]);
});

if (!d.ui || typeof d.ui !== "object") {
base.ui = cloneDefault().ui;
} else {
base.ui = Object.assign(
{},
cloneDefault().ui,
d.ui
);
}

base.mode =
base.mode === "business"
? "business"
: "personal";

base.currency =
base.currency ||
"₹";

base.language =
base.language === "en"
? "en"
: "hi";

base.budget = safeNum(base.budget);

return base;
}

function load() {
try {
var raw = localStorage.getItem(KEY);

if (!raw) {
return cloneDefault();
}

return normalizeData(JSON.parse(raw));
} catch (e) {
console.error("HISAB load error:", e);
return cloneDefault();
}
}

var D = load();

function save() {
try {
var copy = JSON.parse(JSON.stringify(D));
localStorage.setItem(KEY, JSON.stringify(copy));
window.D = D;
} catch (e) {
console.error("HISAB save error:", e);
}
}

window.D = D;

/* =========================================================
GUEST SYSTEM
========================================================= */

function showGuestGate() {
try {
var gate = $("guestGate");
var shell = $("appShell");

if (!gate || !shell) return;

var entered =
localStorage.getItem(GUEST_KEY) === "1";

if (entered) {
gate.style.display = "none";
shell.style.display = "";
} else {
gate.style.display = "";
shell.style.display = "none";
}
} catch (e) {
console.error("Guest gate:", e);

if ($("guestGate")) {
$("guestGate").style.display = "none";
}

if ($("appShell")) {
$("appShell").style.display = "";
}
}
}

function enterGuestMode() {
try {
localStorage.setItem(GUEST_KEY, "1");
} catch (e) {}

if ($("guestGate")) {
$("guestGate").style.display = "none";
}

if ($("appShell")) {
$("appShell").style.display = "";
}

show("home");
}

window.showGuestGate = showGuestGate;
window.enterGuestMode = enterGuestMode;

/* =========================================================
PAGE NAVIGATION
========================================================= */

var pages = [
"home",
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
"ads",
"familytools",
"tools13",
"final"
];

var pageHistory = [];

function getPage(id) {
return $(id);
}

function currentPage() {
return D.ui.lastPage || "home";
}

function show(pageId, remember) {
try {
var target = getPage(pageId);

if (!target) {
console.warn("HISAB: page not found:", pageId);
return false;
}

if (remember !== false) {
var old = currentPage();

if (old !== pageId) {
pageHistory.push(old);
}
}

document
.querySelectorAll(".page")
.forEach(function (p) {
p.style.display = "none";
p.classList.remove("active");
});

target.style.display = "";
target.classList.add("active");

D.ui.lastPage = pageId;
save();

renderAll();

try {
window.scrollTo(0, 0);
} catch (e) {}

addBackButton(target);

return true;
} catch (e) {
console.error("HISAB show error:", e);

try {
var home = $("home");

if (home) {
document
.querySelectorAll(".page")
.forEach(function (p) {
p.style.display = "none";
p.classList.remove("active");
});

home.style.display = "";
home.classList.add("active");
D.ui.lastPage = "home";
}
} catch (x) {}

return false;
}
}

function goBack() {
try {
var previous = pageHistory.pop();

if (previous && getPage(previous)) {
show(previous, false);
} else {
pageHistory = [];
show("home", false);
}
} catch (e) {
pageHistory = [];
show("home", false);
}
}

function addBackButton(page) {
if (!page || page.id === "home") return;

if (page.querySelector(".hisab-auto-back")) {
return;
}

var title = page.querySelector(".page-title");

if (!title) return;

var buttons = page.querySelectorAll("button");

for (var i = 0; i < buttons.length; i++) {
var txt = (
buttons[i].textContent || ""
).trim().toLowerCase();

if (
txt.indexOf("back") !== -1 ||
txt.indexOf("←") === 0 ||
txt.indexOf("✕") === 0
) {
return;
}
}

var btn = document.createElement("button");

btn.type = "button";
btn.className = "hisab-auto-back";
btn.innerHTML = "← Back";

btn.onclick = function (e) {
e.preventDefault();
e.stopPropagation();
goBack();
};

title.insertBefore(btn, title.firstChild);
}

function prepareBackButtons() {
pages.forEach(function (id) {
addBackButton($(id));
});
}

window.show = show;

/* =========================================================
MODE
========================================================= */

function setMode(mode) {
D.mode =
mode === "business"
? "business"
: "personal";

D.ui.selectedMode = D.mode;

save();

var p = $("personalModeBtn");
var b = $("businessModeBtn");

if (p) {
p.classList.toggle(
"active",
D.mode === "personal"
);
}

if (b) {
b.classList.toggle(
"active",
D.mode === "business"
);
}

var label = $("modeLabel");

if (label) {
label.textContent =
D.mode === "business"
? "Business"
: "Personal";
}

renderAll();

show(
D.mode === "business"
? "business"
: "personal"
);
}

window.setMode = setMode;
