// ── DOM references ────────────────────────────────────────────
const nameInput     = document.getElementById("name");
const amountInput   = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const formError     = document.getElementById("form-error");
const listEl        = document.getElementById("list");
const totalEl       = document.getElementById("total");
const addBtn        = document.getElementById("btn-add");

// Inject sort button next to the "Transactions" card title
const transactionCardTitle = listEl.closest(".card").querySelector(".card-title");
transactionCardTitle.style.cssText = "display:flex; justify-content:space-between; align-items:center;";
const sortBtn = document.createElement("button");
sortBtn.id        = "btn-sort";
sortBtn.className = "btn-sort";
sortBtn.textContent = "Sort: Default";
transactionCardTitle.appendChild(sortBtn);

// Inject dark mode toggle button (fixed, top-right)
const themeBtn = document.createElement("button");
themeBtn.id        = "btn-theme";
themeBtn.className = "btn-theme";
themeBtn.setAttribute("aria-label", "Toggle dark mode");
document.body.appendChild(themeBtn);

// Inject summary card between the balance card and the form card
const summaryCard = document.createElement("div");
summaryCard.id        = "summary-card";
summaryCard.className = "card";
summaryCard.innerHTML = `<p class="card-title">Summary by Category</p>
  <ul id="summary-list"></ul>`;
document.querySelector(".balance-card").insertAdjacentElement("afterend", summaryCard);
const summaryListEl = document.getElementById("summary-list");

// Inject "Add category" row below the category select
const categoryRow = document.createElement("div");
categoryRow.className = "category-row";
categoryRow.innerHTML = `
  <input type="text" id="new-category" placeholder="New category name" autocomplete="off">
  <button id="btn-add-category" class="btn-add-category" aria-label="Add category">+ Add</button>
`;
categoryInput.insertAdjacentElement("afterend", categoryRow);
const newCategoryInput = document.getElementById("new-category");
const addCategoryBtn   = document.getElementById("btn-add-category");

// ── State ─────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart;
let sortByAmount = false; // when true, list renders highest amount first

/** Transactions exceeding this amount are highlighted in the list. */
const HIGHLIGHT_LIMIT = 50_000;

/**
 * Built-in categories are always present. Custom ones are loaded from
 * localStorage and appended after them. Stored as plain name strings.
 */
const DEFAULT_CATEGORIES = [
  { name: "Food",      emoji: "🍔" },
  { name: "Transport", emoji: "🚌" },
  { name: "Fun",       emoji: "🎉" },
];

// Palette for dynamically assigned chart colors (custom categories cycle through this)
const CATEGORY_COLORS = [
  "#22c55e", "#3b82f6", "#f97316", // reserved for the three defaults
  "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#64748b", "#ef4444", "#06b6d4",
];

let customCategories = JSON.parse(localStorage.getItem("customCategories")) || [];

/** Returns the full ordered list of categories (defaults + custom). */
function allCategories() {
  return [...DEFAULT_CATEGORIES, ...customCategories.map(name => ({ name, emoji: "🏷" }))];
}

// ── Theme ─────────────────────────────────────────────────────

/**
 * Returns true if dark mode is currently active,
 * checking the saved preference first, then the OS setting.
 */
function isDark() {
  const saved = localStorage.getItem("theme");
  if (saved) return saved === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Applies the given theme ("dark" | "light") to the document,
 * updates the toggle button label, and redraws the chart so its
 * background color matches the new surface color.
 */
function applyTheme(dark) {
  document.body.classList.toggle("dark",  dark);
  document.body.classList.toggle("light", !dark);
  themeBtn.textContent = dark ? "☀ Light" : "☾ Dark";
}

// Apply saved/OS preference immediately on load (before first render)
applyTheme(isDark());

// ── Persistence ───────────────────────────────────────────────
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveCategories() {
  localStorage.setItem("customCategories", JSON.stringify(customCategories));
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Escapes a string for safe insertion into HTML,
 * preventing XSS from user-supplied input.
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns the total amount for a given category
 * from the current transactions array.
 */
function totalByCategory(category) {
  return transactions
    .filter(t => t.category === category)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Rebuilds the <select> options from the current categories list.
 * Preserves the currently selected value if it still exists.
 */
function renderCategorySelect() {
  const current = categoryInput.value;
  categoryInput.innerHTML = allCategories()
    .map(c => `<option value="${escapeHTML(c.name)}">${c.emoji} ${escapeHTML(c.name)}</option>`)
    .join("");
  // Restore selection if the previously selected category still exists
  if ([...categoryInput.options].some(o => o.value === current)) {
    categoryInput.value = current;
  }
}

/**
 * Adds a new custom category, saves it, and refreshes the select.
 */
function addCategory() {
  const name = newCategoryInput.value.trim();

  if (!name) {
    formError.textContent = "Please enter a category name.";
    return;
  }

  const exists = allCategories().some(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    formError.textContent = `"${name}" already exists as a category.`;
    return;
  }

  formError.textContent = "";
  customCategories.push(name);
  saveCategories();
  renderCategorySelect();

  // Auto-select the newly added category for convenience
  categoryInput.value    = name;
  newCategoryInput.value = "";
  newCategoryInput.focus();
}

// ── Core actions ──────────────────────────────────────────────
function addTransaction() {
  const name     = nameInput.value.trim();
  const amount   = amountInput.value.trim();
  const category = categoryInput.value;

  if (!name || !amount) {
    formError.textContent = "Please fill in both the item name and amount.";
    return;
  }

  formError.textContent = "";

  const transaction = {
    name,
    amount: parseFloat(amount),
    category,
  };

  transactions.push(transaction);
  saveData();
  render();

  nameInput.value   = "";
  amountInput.value = "";
  nameInput.focus();
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveData();
  render();
}

// ── Render ────────────────────────────────────────────────────
function render() {
  renderList();
  renderSummary();
  renderChart();
}

function renderSummary() {
  summaryListEl.innerHTML = "";

  const grandTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (grandTotal === 0) {
    summaryCard.hidden = true;
    return;
  }

  summaryCard.hidden = false;

  // Only show categories that have at least one transaction
  const categories = allCategories();
  const active = categories.filter(c => totalByCategory(c.name) > 0);

  active.forEach((c) => {
    const total   = totalByCategory(c.name);
    const pct     = Math.round((total / grandTotal) * 100);
    const color   = CATEGORY_COLORS[categories.indexOf(c) % CATEGORY_COLORS.length];

    const li = document.createElement("li");
    li.className = "summary-row";
    li.innerHTML = `
      <div class="summary-info">
        <span class="summary-name">${c.emoji} ${escapeHTML(c.name)}</span>
        <span class="summary-pct">${pct}%</span>
      </div>
      <div class="summary-bar-track">
        <div class="summary-bar-fill" style="width:${pct}%; background:${color};"></div>
      </div>
      <span class="summary-amount">Rp ${total.toLocaleString("id-ID")}</span>
    `;
    summaryListEl.appendChild(li);
  });
}

function renderList() {
  listEl.innerHTML = "";

  if (transactions.length === 0) {
    listEl.innerHTML = `<p class="empty-state">No transactions yet. Add one above!</p>`;
    totalEl.textContent = "0";
    return;
  }

  // Build a display order: sorted copy (highest first) or original order.
  // We sort by the original index so delete operations always target the
  // correct entry in the transactions array regardless of display order.
  const displayOrder = transactions
    .map((item, index) => ({ item, index }))
    .sort((a, b) => sortByAmount ? b.item.amount - a.item.amount : 0);

  const total = transactions.reduce((sum, item) => sum + item.amount, 0);

  displayOrder.forEach(({ item, index }) => {
    const li = document.createElement("li");
    li.dataset.category = item.category;
    if (item.amount > HIGHLIGHT_LIMIT) {
      li.classList.add("over-limit");
    }
    li.innerHTML = `
      <div class="item-info">
        <span class="item-name">${escapeHTML(item.name)}</span>
        <span class="item-meta">${escapeHTML(item.category)}</span>
      </div>
      <span class="item-amount">Rp ${item.amount.toLocaleString("id-ID")}</span>
      <button class="btn-delete" data-index="${index}" aria-label="Delete ${escapeHTML(item.name)}">✕</button>
    `;
    listEl.appendChild(li);
  });

  totalEl.textContent = total.toLocaleString("id-ID");
}

function renderChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

  const categories = allCategories();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categories.map(c => `${c.emoji} ${c.name}`),
      datasets: [{
        data: categories.map(c => totalByCategory(c.name)),
        backgroundColor: categories.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
      }],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.body)
              .getPropertyValue("--text").trim(),
          },
        },
      },
    },
  });
}

// ── Event listeners ───────────────────────────────────────────
addBtn.addEventListener("click", addTransaction);

// Add custom category
addCategoryBtn.addEventListener("click", addCategory);
newCategoryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addCategory();
});

// Toggle dark/light mode and persist the choice
themeBtn.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  applyTheme(dark);
  renderChart(); // redraw so legend color updates immediately
});

// Toggle sort order
sortBtn.addEventListener("click", () => {
  sortByAmount = !sortByAmount;
  sortBtn.textContent = sortByAmount ? "Sort: Highest First" : "Sort: Default";
  sortBtn.classList.toggle("active", sortByAmount);
  renderList();
});

// Delegate delete clicks from the list container
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-delete");
  if (btn) {
    deleteTransaction(Number(btn.dataset.index));
  }
});

// Allow submitting the form with Enter key
amountInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTransaction();
});

// ── Init ──────────────────────────────────────────────────────
renderCategorySelect();
render();
