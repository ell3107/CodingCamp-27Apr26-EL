// ── Event listeners ───────────────────────────────────────────
addBtn.addEventListener("click", addTransaction);

// Add custom category
addCategoryBtn.addEventListener("click", addCategory);
newCategoryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addCategory();
});

// Toggle dark/light mode
themeBtn.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  applyTheme(dark);
  renderChart();
});

// Toggle sort
sortBtn.addEventListener("click", () => {
  sortByAmount = !sortByAmount;
  sortBtn.textContent = sortByAmount ? "Sort: Highest First" : "Sort: Default";
  sortBtn.classList.toggle("active", sortByAmount);
  renderList();
});

// Delete
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-delete");
  if (btn) {
    deleteTransaction(Number(btn.dataset.index));
  }
});

// Enter key
amountInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTransaction();
});
