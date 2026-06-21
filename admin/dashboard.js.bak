document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("http://localhost:5000/api/family/all");
    const families = await res.json();

    const totalFamilies = families.length;

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    let todayCount = 0;
    let monthCount = 0;

    families.forEach(f => {
      const created = new Date(f.createdAt);
      const createdDate = created.toISOString().split("T")[0];

      if (createdDate === todayDate) {
        todayCount++;
      }

      if (
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      ) {
        monthCount++;
      }
    });

    document.getElementById("totalFamilies").innerText = totalFamilies;
    document.getElementById("todayFamilies").innerText = todayCount;
    document.getElementById("monthFamilies").innerText = monthCount;

  } catch (err) {
    console.error("Dashboard stats error:", err);
  }
});
