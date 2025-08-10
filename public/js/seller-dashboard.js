const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token || role !== "seller") {
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

async function fetchWeeklySales() {
  const res = await fetch("/api/sales/week");
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

let dailyChartInstance = null;
async function showDailySalesChart() {
  const salesData = await fetchSalesToday();
  const ctx = document.getElementById("dailySalesChart").getContext("2d");

  if (dailyChartInstance) dailyChartInstance.destroy();

  dailyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: salesData.map((s) => s.productName),
      datasets: [
        {
          label: "Quantity Sold Today",
          data: salesData.map((s) => s.totalQuantity),
          backgroundColor: "#4c51bf",
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
    },
  });
}

let weeklyChartInstance = null;
async function showWeeklySalesChart() {
  const salesData = await fetchWeeklySales();

  if (!salesData || salesData.length === 0) {
    console.warn("No weekly sales data found");
    return;
  }

  const ctx = document.getElementById("weeklySalesChart").getContext("2d");

  const labels = salesData.map((item) => item.date);
  const data = salesData.map((item) => item.totalSales);

  if (weeklyChartInstance) weeklyChartInstance.destroy();

  weeklyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total Sales (৳)",
          data,
          backgroundColor: "#4c51bf",
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

// ========== NEW: Show History in new tab with Download PDF button ==========

document.getElementById("historyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("historyPhone").value.trim();

  if (!phone) {
    alert("Please enter a phone number");
    return;
  }

  const data = await fetchInvoiceHistory(phone);
  if (!data) {
    alert("Customer not found.");
    return;
  }

  const { customer, invoices } = data;

  // Open a new tab
  const historyWindow = window.open("", "_blank");
  if (!historyWindow) {
    alert("Popup blocked! Please allow popups for this site.");
    return;
  }

  // Build HTML content for new tab
  const html = `
    <html>
      <head>
        <title>Invoice History for ${phone}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #eee; }
          button {
            margin: 20px 0;
            padding: 10px 15px;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h2>Customer: ${phone} | Total Dues: ৳${customer.dues.toFixed(2)}</h2>
        <button id="downloadPdfBtn">Download History PDF</button>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Amount Paid</th>
              <th>Dues</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${invoices
              .map(
                (inv) => `
              <tr>
                <td>${inv.product ? inv.product.name : "—"}</td>
                <td>${inv.quantity || "-"}</td>
                <td>৳${inv.amountPaid || 0}</td>
                <td>৳${inv.dues || 0}</td>
                <td>${new Date(inv.date).toLocaleDateString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script>
          const { jsPDF } = window.jspdf;
          document.getElementById("downloadPdfBtn").addEventListener("click", () => {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Invoice History for ${phone}", 10, 20);
            doc.setFontSize(12);

            let startY = 30;
            const lineHeight = 10;
            doc.text("Total Dues: ৳${customer.dues.toFixed(2)}", 10, startY);
            startY += lineHeight;

            const headers = ["Product", "Quantity", "Amount Paid", "Dues", "Date"];
            const colX = [10, 60, 90, 130, 160];
            headers.forEach((header, i) => {
              doc.text(header, colX[i], startY);
            });
            startY += lineHeight;

            const invoices = ${JSON.stringify(invoices)};
            invoices.forEach((inv) => {
              doc.text(inv.product ? inv.product.name : "—", colX[0], startY);
              doc.text(String(inv.quantity || "-"), colX[1], startY);
              doc.text("৳" + String(inv.amountPaid || 0), colX[2], startY);
              doc.text("৳" + String(inv.dues || 0), colX[3], startY);
              const dateStr = new Date(inv.date).toLocaleDateString();
              doc.text(dateStr, colX[4], startY);
              startY += lineHeight;
            });

            doc.save("invoice_history_${phone}.pdf");
          });
        </script>
      </body>
    </html>
  `;

  historyWindow.document.write(html);
  historyWindow.document.close();
});

// ======= ADD/REMOVE PRODUCT FORM HANDLER =======
// document.getElementById("productForm").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const name = document.getElementById("productName").value.trim();
//   const price = parseFloat(document.getElementById("productPrice").value);
//   const quantity = parseInt(document.getElementById("productQuantity").value);

//   if (!name || isNaN(price) || isNaN(quantity)) {
//     return alert("Please fill all product fields with valid values.");
//   }

//   try {
//     const res = await fetch("/api/products/update", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ name, price, quantity }),
//     });

//     if (!res.ok) {
//       const errorData = await res.json();
//       return alert(errorData.message || "Failed to update product.");
//     }

//     const updatedProduct = await res.json();

//     alert(
//       `Product "${updatedProduct.name}" updated successfully! Current quantity: ${updatedProduct.quantity}`
//     );

//     e.target.reset();

//     await populateProductsDropdown();
//     await showTopStock();
//   } catch (error) {
//     alert("Error updating product: " + error.message);
//   }
// });

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

    // Get product name BEFORE resetting form
    const productSelect = document.getElementById("invoiceProduct");
    const productName =
      productSelect.options[productSelect.selectedIndex].text.split(" (")[0];

    document.getElementById("invoiceForm").reset();

    await populateProductsDropdown();
    await showTopStock();
    await showDailySalesChart();
    await showWeeklySalesChart();

    if (confirm("Do you want to print the invoice now?")) {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Popup blocked! Please allow popups for this site.");
        return;
      }

      printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
            th { background-color: #eee; }
            .center { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Invoice</h2>
          <p><strong>Customer Phone:</strong> ${phone}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Amount Paid</th>
                <th>Dues</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${productName}</td>
                <td class="center">${quantity}</td>
                <td>৳${amountPaid.toFixed(2)}</td>
                <td>৳${(result.invoice.dues ?? 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    }
  } else {
    alert(result.message || "Error creating invoice.");
  }
});

window.onload = async () => {
  await populateProductsDropdown();
  await showTopStock();
  await showDailySalesChart();
  await showWeeklySalesChart();
};
