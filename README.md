<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expense &amp; Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <h1 class="page-header">
    Expense &amp; Budget
    <span class="app-subtitle">Visualizer</span>
  </h1>

  <!-- Balance -->
  <div class="balance-card">
    <p class="label">Total Expenses</p>
    <p class="amount">Rp <span id="total">0</span></p>
  </div>

  <!-- Form -->
  <div class="card">
    <p class="card-title">Add Transaction</p>
    <div class="form-group">
      <input type="text" id="name" placeholder="Item name">
      <input type="number" id="amount" placeholder="Amount (Rp)" min="0">
      <select id="category">
        <option value="Food">🍔 Food</option>
        <option value="Transport">🚌 Transport</option>
        <option value="Fun">🎉 Fun</option>
      </select>
      <p id="form-error" class="form-error" aria-live="polite"></p>
      <button id="btn-add" class="btn-primary">Add Transaction</button>
    </div>
  </div>

  <!-- List -->
  <div class="card">
    <p class="card-title">Transactions</p>
    <ul id="list"></ul>
  </div>

  <!-- Chart -->
  <div class="card">
    <p class="card-title">Spending by Category</p>
    <div class="chart-wrapper">
      <canvas id="chart"></canvas>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="js/script.js"></script>
</body>
</html>
