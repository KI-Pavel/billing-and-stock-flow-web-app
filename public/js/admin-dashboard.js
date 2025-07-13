// ✅ Updated seller-dashboard.js with due adjustment

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token || role !== "admin") {
  window.location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

let currentPhone = null;

async function fetchProducts() {
  const res = await fetch("/api/products");
  return res.json();
}

async function fetchTopProducts() {
  const res = await fetch("/api/products/top5");
  return res.json();
}

async function fetchSalesToday() {
  const res = await fetch("/api/sales/today");
  return res.json();
}

async function fetchInvoiceHistory(phone) {
  const res = await fetch(`/api/customers/${phone}`);
  if (res.status !== 200) return null;
  return res.json();
}

async function adjustCustomerDues(phone, amount) {
  const res = await fetch(`/api/customers/adjust-due`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phone, amount }),
  });
  return res.json();
}

async function createInvoice(invoice) {
  invoice.sellerId = parseJwt(token).id;
  const res = await fetch("/api/invoices/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(invoice),
  });
  return res.json();
}

function parseJwt(token) {
  return JSON.parse(atob(token.split(".")[1]));
}

async function populateProductsDropdown() {
  const products = await fetchProducts();
  const select = document.getElementById("invoiceProduct");
  select.innerHTML = "";
  products.forEach((p) => {
    const option = document.createElement("option");
    option.value = p._id;
    option.textContent = `${p.name} (৳${p.price}) - Stock: ${p.quantity}`;
    select.appendChild(option);
  });
}

async function showTopStock() {
  const products = await fetchTopProducts();
  const stockList = document.getElementById("stockList");
  stockList.innerHTML =
    "<table><thead><tr><th>Name</th><th>Price</th><th>Quantity</th></tr></thead><tbody>" +
    products
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td>৳${p.price}</td><td>${p.quantity}</td></tr>`
      )
      .join("") +
    "</tbody></table>";
}

async function showSalesChart() {
  const salesData = await fetchSalesToday();
  const ctx = document.getElementById("salesChart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: salesData.map((s) => s.productName),
      datasets: [
        {
          label: "Quantity Sold Today",
          data: salesData.map((s) => s.totalQuantity),
          backgroundColor: "#2c7a7b",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const productId = document.getElementById("invoiceProduct").value;
  const quantity = parseInt(document.getElementById("invoiceQuantity").value);
  const amountPaid = parseFloat(
    document.getElementById("invoiceAmountPaid").value
  );
  const phone = document.getElementById("invoicePhone").value.trim();

  if (!productId || isNaN(quantity) || isNaN(amountPaid) || !phone)
    return alert("Fill all invoice fields.");

  const result = await createInvoice({
    productId,
    quantity,
    amountPaid,
    phone,
  });

  if (result.invoice) {
    alert("Invoice created successfully!");
    document.getElementById("invoiceForm").reset();
    await populateProductsDropdown();
    await showTopStock();
    await showSalesChart();
  } else {
    alert(result.message || "Error creating invoice.");
  }
});

document.getElementById("historyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("historyPhone").value.trim();
  const resultDiv = document.getElementById("historyResult");
  resultDiv.innerHTML = "Loading...";

  const data = await fetchInvoiceHistory(phone);
  if (!data) {
    resultDiv.innerHTML = "Customer not found.";
    document.getElementById("dueAdjustSection").style.display = "none";
    return;
  }

  const { customer, invoices } = data;

  let html = `<h3>Customer: ${customer.phone} | Dues: ৳${customer.dues.toFixed(
    2
  )}</h3>`;
  html +=
    "<table><thead><tr><th>Product</th><th>Qty</th><th>Paid</th><th>Dues</th><th>Date</th></tr></thead><tbody>";
  invoices.forEach((inv) => {
    html += `<tr>
      <td>${inv.product.name}</td>
      <td>${inv.quantity}</td>
      <td>৳${inv.amountPaid}</td>
      <td>৳${inv.dues}</td>
      <td>${new Date(inv.date).toLocaleDateString()}</td>
    </tr>`;
  });
  html += "</tbody></table>";

  resultDiv.innerHTML = html;
  currentPhone = phone;
  document.getElementById("dueAdjustSection").style.display = "block";
});

document
  .getElementById("adjustDueForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("adjustAmount").value);
    if (!currentPhone || isNaN(amount) || amount <= 0) {
      return alert("Enter valid amount");
    }

    const res = await adjustCustomerDues(currentPhone, amount);
    if (res.success) {
      alert("Due adjusted successfully!");
      document.getElementById("adjustDueForm").reset();
      await document
        .getElementById("historyForm")
        .dispatchEvent(new Event("submit"));
    } else {
      alert(res.message || "Failed to adjust due");
    }
  });

window.onload = async () => {
  await populateProductsDropdown();
  await showTopStock();
  await showSalesChart();
};
