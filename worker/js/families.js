const onlineList = document.querySelector("#onlineFamilies .family-list");
const offlineList = document.querySelector("#offlineFamilies .family-list");
const searchBox = document.getElementById("searchBox");
const syncBtn = document.getElementById("syncBtn");

/* --------------------------
   FETCH FROM MONGODB (ONLINE)
--------------------------- */
async function fetchMongoFamilies(filter = "") {
  try {
    const res = await fetch("http://localhost:5000/api/family/all");
    const families = await res.json();

    onlineList.innerHTML = "";

    families.forEach(f => {
      if (
        filter &&
        !(
          f.headName?.toLowerCase().includes(filter) ||
          f.address?.toLowerCase().includes(filter)
        )
      ) return;

      const card = document.createElement("div");
      card.className = "family-card";
      card.innerHTML = `
        <strong>${f.headName}</strong><br>
        📍 Area: ${f.address}<br>
        👨‍👩‍👧 Members: 0
      `;

      onlineList.appendChild(card);
    });
  } catch (err) {
    console.error("Mongo fetch failed", err);
  }
}

/* --------------------------
   OFFLINE (IndexedDB ONLY)
--------------------------- */
function renderOfflineFamilies() {
  offlineList.innerHTML = "";

  getAllFamilies((families) => {
    families
      .filter(f => !f.synced)
      .forEach(f => {
        const card = document.createElement("div");
        card.className = "family-card pending";
        card.innerHTML = `
          <strong>${f.headName}</strong><br>
          📍 Area: ${f.address}<br>
          ⏳ Pending Sync
        `;
        offlineList.appendChild(card);
      });
  });
}

/* --------------------------
   INITIAL LOAD
--------------------------- */
setTimeout(() => {
  fetchMongoFamilies();
  renderOfflineFamilies();
}, 500);

/* --------------------------
   SEARCH
--------------------------- */
searchBox.addEventListener("input", (e) => {
  fetchMongoFamilies(e.target.value.toLowerCase());
});

/* --------------------------
   SYNC OFFLINE → MONGODB
--------------------------- */
syncBtn.addEventListener("click", () => {
  getAllFamilies(async (families) => {
    const offline = families.filter(f => !f.synced);

    if (offline.length === 0) {
      alert("✅ No pending data to sync");
      return;
    }

    for (const fam of offline) {
      try {
        const res = await fetch("http://localhost:5000/api/family/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headName: fam.headName,
            address: fam.address,
            contact: fam.contact,
            notes: fam.notes
          })
        });

        if (res.ok) {
          markFamilySynced(fam.id);
        }
      } catch (err) {
        console.error("Sync failed", err);
      }
    }

    alert("✅ Sync completed");
    fetchMongoFamilies();
    renderOfflineFamilies();
  });
});
