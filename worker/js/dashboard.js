document.addEventListener("DOMContentLoaded", () => {
  // 1. Update Welcome Message
  const workerUserStr = localStorage.getItem("workerUser");
  let workerUser = { name: "ASHA Worker", id: "" };
  if (workerUserStr) {
    try {
      workerUser = JSON.parse(workerUserStr);
      document.getElementById("welcomeWorker").innerText = `Welcome, ${workerUser.name}`;
    } catch (e) {
      console.error("Error parsing workerUser", e);
    }
  }

  // 2. Load Local Stats (IndexedDB)
  function loadLocalStats() {
    if (typeof getAllFamilies !== "function") {
      console.warn("getAllFamilies function not available yet.");
      setTimeout(loadLocalStats, 200);
      return;
    }

    getAllFamilies((families) => {
      const pendingCount = families.filter(f => !f.synced).length;
      document.getElementById("pendingSync").innerText = pendingCount;
      
      updateTotals();
    });
  }

  // 3. Load Remote Stats (MongoDB)
  async function loadRemoteStats() {
    const syncedEl = document.getElementById("syncedRecords");
    try {
      const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
      const res = await fetch(`${base}/api/family`);
      if (!res.ok) throw new Error("API error");
      const families = await res.json();
      
      // Filter families added by this worker if needed, or show total synced in the system
      const syncedCount = families.length;
      syncedEl.innerText = syncedCount;
      syncedEl.style.color = "#2cd5c4";
      
      // Calculate added today across system or locally
      const todayStr = new Date().toDateString();
      let todayCount = families.filter(f => {
        return f.createdAt && new Date(f.createdAt).toDateString() === todayStr;
      }).length;
      
      // Add local ones added today too
      getAllFamilies((localFamilies) => {
        const localToday = localFamilies.filter(f => {
          return !f.synced && f.createdAt && new Date(f.createdAt).toDateString() === todayStr;
        }).length;
        document.getElementById("addedToday").innerText = todayCount + localToday;
      });

      updateTotals();
    } catch (err) {
      console.warn("Failed to fetch synced stats:", err);
      syncedEl.innerText = "Offline";
      syncedEl.style.color = "#ff9800";
      
      // Calculate added today from local IndexedDB if offline
      const todayStr = new Date().toDateString();
      getAllFamilies((localFamilies) => {
        const localToday = localFamilies.filter(f => {
          return f.createdAt && new Date(f.createdAt).toDateString() === todayStr;
        }).length;
        document.getElementById("addedToday").innerText = localToday;
      });
      
      updateTotals();
    }
  }

  function updateTotals() {
    const pendingVal = parseInt(document.getElementById("pendingSync").innerText) || 0;
    const syncedText = document.getElementById("syncedRecords").innerText;
    const syncedVal = syncedText === "Offline" || syncedText === "--" ? 0 : parseInt(syncedText) || 0;
    
    document.getElementById("totalFamilies").innerText = pendingVal + syncedVal;
  }

  // 4. Bind Sync Button
  const syncBtn = document.getElementById("syncBtn");
  if (syncBtn) {
    syncBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!navigator.onLine) {
        alert("⚠️ Cannot sync while offline. Please connect to the internet first.");
        return;
      }
      
      if (typeof syncOfflineData !== "function") {
        alert("Sync library is still loading, please try again in a moment.");
        return;
      }

      syncBtn.innerText = "🔄 Syncing...";
      syncBtn.disabled = true;

      syncOfflineData()
        .then(() => {
          alert("🟢 Sync complete!");
          loadLocalStats();
          loadRemoteStats();
        })
        .catch((err) => {
          console.error("Dashboard sync error:", err);
          alert("❌ Sync failed. Please try again.");
        })
        .finally(() => {
          syncBtn.innerText = "🔄 Sync Pending Data";
          syncBtn.disabled = false;
        });
    });
  }

  // Initial stats load
  loadLocalStats();
  loadRemoteStats();

  // Reload stats periodically
  setInterval(() => {
    loadLocalStats();
    loadRemoteStats();
  }, 10000);
});
