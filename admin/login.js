async function loginAdmin(e) {
  e.preventDefault();

  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("msg");

  errorBox.innerText = "";

  try {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    const res = await fetch(`${base}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, password })
    });

    const data = await res.json();

    // ❗ IMPORTANT FIX
    if (!res.ok) {
      errorBox.innerText = data.message || "Login failed";
      return;
    }

    // ✅ SUCCESS
    localStorage.setItem("adminLoggedIn", "yes");
    localStorage.setItem("adminName", data.admin.name);

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    errorBox.innerText = "Server not reachable";
  }
}
