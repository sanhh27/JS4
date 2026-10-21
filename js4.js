
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budget = Number(localStorage.getItem("budget")) || 0;
let usdRate = null;

const $ = (id) => document.getElementById(id);
const rupees = (n) => "₹" + n.toLocaleString("en-IN");
const today = () => new Date().toLocaleDateString("en-CA"); 

function save() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function showDashboard() {

  const monthList = expenses.filter((e) => e.date.startsWith(today().slice(0, 7)));
  const spent = monthList.reduce((sum, e) => sum + e.amount, 0);

  $("spent").textContent = rupees(spent);
  $("count").textContent = monthList.length;
  $("left").textContent = rupees(budget - spent);
  $("usd").textContent = usdRate ? "$" + (spent * usdRate).toFixed(2) : "--";
  $("warning").textContent = "Budget exceeded by " + rupees(spent - budget) + "!";
  $("warning").classList.toggle("hidden", !(budget > 0 && spent > budget));
}

function showTable() {
  const text = $("search").value.toLowerCase();
  const category = $("filter").value;

  const list = expenses.filter((e) =>
    e.name.toLowerCase().includes(text) && (category === "All" || e.category === category)
  );

  list.sort((a, b) => a.date.localeCompare(b.date));
  if ($("sort").value !== "oldest") list.reverse();

  $("body").innerHTML = "";
  list.forEach((e, i) => {
    const row = document.createElement("tr");
    row.innerHTML = "<td></td><td></td><td></td><td><span class='tag'></span></td><td></td><td><button class='delete'>Delete</button></td>";
    const cells = row.children;
    cells[0].textContent = i + 1;
    cells[1].textContent = e.name;           
    cells[2].textContent = rupees(e.amount);
    cells[3].firstChild.textContent = e.category;
    cells[3].firstChild.classList.add(e.category);
    cells[4].textContent = e.date;
    row.querySelector("button").onclick = () => {
      expenses = expenses.filter((x) => x.id !== e.id);
      update();
    };
    $("body").appendChild(row);
  });

  $("empty").classList.toggle("hidden", list.length > 0);
}

function update() {
  save();
  showDashboard();
  showTable();
}

$("expenseForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("name").value.trim();
  const amount = Number($("amount").value);

  const errors = [];
  if (name.length < 2 || name.length > 30) errors.push("Name must be 2-30 characters.");
  if (!(amount > 0)) errors.push("Amount must be greater than 0.");
  if (!$("date").value) errors.push("Please choose a date.");

  $("errors").innerHTML = errors.map((msg) => "<li>" + msg + "</li>").join("");
  if (errors.length > 0) return;

  expenses.push({ id: Date.now(), name, amount, category: $("category").value, date: $("date").value });
  $("expenseForm").reset();
  $("date").value = today();
  update();
});

$("budgetForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = Number($("budget").value);
  if ($("budget").value === "" || value < 0) {
    alert("Enter a budget of 0 or more.");
    return;
  }
  budget = value;
  localStorage.setItem("budget", budget);
  showDashboard();
});

["search", "filter", "sort"].forEach((id) => $(id).addEventListener("input", showTable));

$("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "expensely-expenses.json";
  link.click();
};

$("importBtn").onclick = () => $("file").click();

$("file").addEventListener("change", async () => {
  const file = $("file").files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error("Not a list");
    if (confirm("Replace your current expenses with " + data.length + " from this file?")) {
      expenses = data;
      update();
    }
  } catch (error) {
    alert("Import failed: not a valid expenses file.");
  }
  $("file").value = "";
});

$("clearBtn").onclick = () => {
  if (confirm("Delete ALL expenses? Your budget will be kept.")) {
    expenses = [];
    update();
  }
};

async function getRate() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/INR");
    const data = await response.json();
    usdRate = data.rates.USD;
    $("rate").textContent = "1 INR = " + usdRate + " USD";
  } catch (error) {
    $("rate").textContent = "Rate unavailable";
  }
  showDashboard();
}

$("month").textContent = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
$("date").value = today();
if (budget > 0) $("budget").value = budget;
update();
getRate();
