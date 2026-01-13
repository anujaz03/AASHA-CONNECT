const onlineContainer = document.querySelector("#onlineFamilies .family-list");
const offlineContainer = document.querySelector("#offlineFamilies .family-list");
const searchBox = document.getElementById("searchBox");
const syncBtn = document.getElementById("syncBtn");

let onlineData = [];
let offlineData = [];

/* --------------------------
   WAIT FOR INDEXED DB READY
--------------------------- */
function waitForDB() {
  return new Promise(resolve => {
    const check = setInterval(() => {
      if (window.db) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

/* --------------------------
   LOAD ONLINE (MongoDB)
--------------------------- */
async function loadOnlineFamilies() {
  try {
    const res = await fetch("http://localhost:5000/api/family");
    onlineData = await res.json();
    renderOnline(onlineData);
  } catch (err) {
    console.error("Failed to load online data", err);
    renderOnline([]);
  }
}

/* --------------------------
   LOAD OFFLINE (IndexedDB)
--------------------------- */
function loadOfflineFamilies() {
  const tx = db.transaction("families", "readonly");
  const store = tx.objectStore("families");

  store.getAll().onsuccess = (e) => {
    offlineData = e.target.result || [];
    renderOffline(offlineData);
  };
}

/* --------------------------
   RENDER FUNCTIONS
--------------------------- */
function renderOnline(data) {
  onlineContainer.innerHTML = "";

  if (!data.length) {
    onlineContainer.innerHTML = "<p>No synced families found</p>";
    return;
  }

  data.forEach(f => {
    onlineContainer.innerHTML += `
      <div class="family-card synced">
        <strong>${f.headName}</strong>
        <p>${f.address}</p>
        <p>${f.contact}</p>
        <span class="badge green">🟢 Synced</span>
      </div>
    `;
  });
}

function renderOffline(data) {
  offlineContainer.innerHTML = "";

  if (!data.length) {
    offlineContainer.innerHTML = "<p>No pending offline data</p>";
    return;
  }

  data.forEach(f => {
    offlineContainer.innerHTML += `
      <div class="family-card pending">
        <strong>${f.headName}</strong>
        <p>${f.address}</p>
        <p>${f.contact}</p>
        <span class="badge yellow">🟡 Pending Sync</span>
      </div>
    `;
  });
}

/* --------------------------
   SEARCH
--------------------------- */
searchBox.addEventListener("input", () => {
  const q = searchBox.value.toLowerCase();

  renderOnline(
    onlineData.filter(f =>
      f.headName.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q)
    )
  );

  renderOffline(
    offlineData.filter(f =>
      f.headName.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q)
    )
  );
});

/* --------------------------
   MANUAL SYNC BUTTON
--------------------------- */
syncBtn.addEventListener("click", async () => {
  if (!navigator.onLine) {
    alert("⚠ Internet not available");
    return;
  }

  const tx = db.transaction("families", "readwrite");
  const store = tx.objectStore("families");

  store.getAll().onsuccess = async (e) => {
    const records = e.target.result;

    if (!records.length) {
      alert("No offline data to sync");
      return;
    }

    for (const family of records) {
      try {
        await fetch("http://localhost:5000/api/family/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(family)
        });
        store.delete(family.id);
      } catch (err) {
        console.error("Sync failed", err);
      }
    }

    alert("✅ Offline data synced");
    loadOnlineFamilies();
    loadOfflineFamilies();
  };
});

/* --------------------------
   INITIAL LOAD
--------------------------- */
window.onload = async () => {
  await waitForDB();
  loadOfflineFamilies();
  loadOnlineFamilies();
};
