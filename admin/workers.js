console.log("workers.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("workerTable");
  const form = document.getElementById("addWorkerForm");

  async function loadWorkers() {
    try {
      const res = await fetch("http://localhost:5000/api/worker/all");
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

    const name = document.getElementById("workerName").value;
    const phone = document.getElementById("workerPhone").value;
    const area = document.getElementById("workerArea").value;
try {
  const res = await fetch("http://localhost:5000/api/worker/add", {
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
    await fetch(`http://localhost:5000/api/worker/toggle/${id}`, {
      method: "PATCH"
    });
    loadWorkers();
  };

  loadWorkers();
});
