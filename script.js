document.addEventListener("DOMContentLoaded", () => {

  const nameInput     = document.getElementById("name");
  const amountInput   = document.getElementById("amount");
  const categoryInput = document.getElementById("category");
  const listEl        = document.getElementById("list");
  const totalEl       = document.getElementById("total");
  const addBtn        = document.getElementById("btn-add");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let chart;

  function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

  function addTransaction() {
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (!name || !amount) return;

    transactions.push({ name, amount, category });
    saveData();
    render();

    nameInput.value = "";
    amountInput.value = "";
  }

  function deleteTransaction(index) {
    transactions.splice(index, 1);
    saveData();
    render();
  }

  function render() {
    listEl.innerHTML = "";

    let total = 0;

    transactions.forEach((t, i) => {
      total += t.amount;

      const li = document.createElement("li");
      li.innerHTML = `
        ${t.name} - Rp ${t.amount.toLocaleString("id-ID")}
        <button onclick="deleteTransaction(${i})">X</button>
      `;

      listEl.appendChild(li);
    });

    totalEl.textContent = total.toLocaleString("id-ID");

    renderChart();
  }

  function renderChart() {
    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    const food = transactions.filter(t => t.category === "Food").reduce((a,b)=>a+b.amount,0);
    const transport = transactions.filter(t => t.category === "Transport").reduce((a,b)=>a+b.amount,0);
    const fun = transactions.filter(t => t.category === "Fun").reduce((a,b)=>a+b.amount,0);

    chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Food", "Transport", "Fun"],
        datasets: [{
          data: [food, transport, fun]
        }]
      }
    });
  }

  addBtn.addEventListener("click", addTransaction);

  window.deleteTransaction = deleteTransaction;

  render();

});
