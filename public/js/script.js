// Admin login
document.getElementById("adminBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const username = document.getElementById("adminUserName").value;
  const password = document.getElementById("adminPass").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.role === "admin") {
      localStorage.setItem("token", data.token);
      window.location.href = "admin.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Something went wrong");
  }
});

// Seller login
document.getElementById("sellerBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const username = document.getElementById("sellerUserName").value;
  const password = document.getElementById("sellerPass").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.role === "seller") {
      localStorage.setItem("token", data.token);
      window.location.href = "seller.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Something went wrong");
  }
});
