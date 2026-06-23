document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const workerIdInput = document.getElementById("workerId");
  const passwordInput = document.getElementById("password");
  const msgBox = document.getElementById("msg");

  if (!loginBtn) return;

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const username = workerIdInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      msgBox.innerText = "Please fill in all fields.";
      return;
    }

    msgBox.innerText = "Logging in...";
    msgBox.style.color = "#ffcc00";

    try {
      const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
      const res = await fetch(`${base}/api/worker/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        msgBox.innerText = data.message || "Invalid credentials.";
        msgBox.style.color = "#ff2d75";
        return;
      }

      // Success
      localStorage.setItem("workerLoggedIn", "yes");
      localStorage.setItem("workerUser", JSON.stringify(data.worker));
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error(err);
      
      // Offline fallback
      if (!navigator.onLine) {
        msgBox.innerText = "Offline. Accessing offline portal...";
        msgBox.style.color = "#ffcc00";
        
        setTimeout(() => {
          localStorage.setItem("workerLoggedIn", "yes");
          localStorage.setItem("workerUser", JSON.stringify({
            id: "694a8f11b1f3f309ff6ce034",
            name: "Sunita Patil (Offline)",
            area: "Offline Zone"
          }));
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        msgBox.innerText = "Server not reachable.";
        msgBox.style.color = "#ff2d75";
      }
    }
  });
});
