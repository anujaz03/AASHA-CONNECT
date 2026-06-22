console.log("workers.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("workerTable");
  const form = document.getElementById("addWorkerForm");

  async function loadWorkers() {
    try {
      const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
      const res = await fetch(`${base}/api/worker/all`);
      const data = await res.json();

      table.innerHTML = "";

      data.forEach(w => {
        table.innerHTML += `
          <tr>
            <td>${w.name}</td>
            <td>${w.phone}</td>
            <td>${w.area}</td>
            <td>${w.status || "Active"}</td>
            <td>
              <button onclick="toggleStatus('${w._id}')">Toggle</button>
            </td>
          </tr>
        `;
      });
    } catch (err) {
      console.error("Load workers failed:", err);
    }
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("workerName").value.trim();
    const phone = document.getElementById("workerPhone").value.trim();
    const area = document.getElementById("workerArea").value.trim();

    // 📋 Frontend Validation
    const namePattern = /^[a-zA-Z\s]{3,50}$/;
    if (!namePattern.test(name)) {
      alert("Worker name must contain only alphabets and spaces, and be 3 to 50 characters long.");
      return;
    }

    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phone)) {
      alert("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }

    if (!area) {
      alert("Please specify the assigned area.");
      return;
    }

try {
  const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
  const res = await fetch(`${base}/api/worker/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, phone, area })
  });

  const result = await res.json();

  if (result.credentials) {
    alert(
      `ASHA Worker Added Successfully!\n\n` +
      `Username: ${result.credentials.username}\n` +
      `Password: ${result.credentials.password}\n\n` +
      `⚠️ Please note these credentials and share with the worker.`
    );
  } else {
    alert(result.message);
  }

  form.reset();
  loadWorkers();

} catch (err) {
  alert("Server error while adding worker");
  console.error(err);
}

  });

  window.toggleStatus = async id => {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    await fetch(`${base}/api/worker/toggle/${id}`, {
      method: "PATCH"
    });
    loadWorkers();
  };

  loadWorkers();
});
