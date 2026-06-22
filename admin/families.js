document.addEventListener("DOMContentLoaded", async () => {
  const table = document.getElementById("familyTable");

  try {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    const res = await fetch(`${base}/api/family/all`);
    const families = await res.json();

    table.innerHTML = "";

    if (families.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="5">No family data found</td>
        </tr>
      `;
      return;
    }

    families.forEach(f => {
      table.innerHTML += `
        <tr>
          <td>${f.headName}</td>
          <td>${f.contact}</td>
          <td>${f.address}</td>
          <td>${f.notes || "-"}</td>
          <td>${new Date(f.createdAt).toLocaleDateString()}</td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Error loading families:", err);
  }
});
