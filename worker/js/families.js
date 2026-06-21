const onlineList = document.querySelector("#onlineFamilies .family-list");
const offlineList = document.querySelector("#offlineFamilies .family-list");
const searchBox = document.getElementById("searchBox");
const syncBtn = document.getElementById("syncBtn");

/* --------------------------
   FETCH FROM MONGODB (ONLINE)
--------------------------- */
async function fetchMongoFamilies(filter = "") {
  try {
    const res = await fetch("http://localhost:5000/api/family");
    const families = await res.json();

    onlineList.innerHTML = "";
    let count = 0;

    families.forEach(f => {
      if (
        filter &&
        !(
          f.headName?.toLowerCase().includes(filter) ||
          f.address?.toLowerCase().includes(filter)
        )
      ) return;

      count++;
      const card = document.createElement("div");
      card.className = "family-card";
      card.innerHTML = `
        <strong>${f.headName}</strong><br>
        📍 Area: ${f.address}<br>
        ${f.abhaId ? `🛡️ ABHA: ${f.abhaId}<br>` : ""}
        👨‍👩‍👧 Members: ${f.members ? f.members.length : 0}
      `;

      onlineList.appendChild(card);
    });

    document.getElementById("onlineCount").innerText = `🟢 Online: ${count}`;
  } catch (err) {
    console.error("Mongo fetch failed", err);
    document.getElementById("onlineCount").innerText = `🟢 Online: Error`;
  }
}

/* --------------------------
   OFFLINE (IndexedDB ONLY)
--------------------------- */
function renderOfflineFamilies() {
  offlineList.innerHTML = "";

  getAllFamilies((families) => {
    const pending = families.filter(f => !f.synced);
    document.getElementById("offlineCount").innerText = `🟡 Offline: ${pending.length}`;

    pending.forEach(f => {
      const card = document.createElement("div");
      card.className = "family-card pending";
      card.innerHTML = `
        <strong>${f.headName}</strong><br>
        📍 Area: ${f.address}<br>
        ${f.abhaId ? `🛡️ ABHA: ${f.abhaId}<br>` : ""}
        ⏳ Pending Sync
      `;
      offlineList.appendChild(card);
    });
  });
}

/* --------------------------
   INITIAL LOAD & POLLING
--------------------------- */
setTimeout(() => {
  fetchMongoFamilies();
  renderOfflineFamilies();

  // Auto-sync on page load if online and pending records exist
  if (navigator.onLine) {
    getAllFamilies((families) => {
      const pending = families.filter(f => !f.synced);
      if (pending.length > 0) {
        console.log(`[Auto-Sync on Load] Found ${pending.length} pending records, triggering sync...`);
        syncOfflineData();
      }
    });
  }
}, 500);

// Periodically check server and refresh
setInterval(() => {
  if (navigator.onLine) {
    fetchMongoFamilies(searchBox.value.toLowerCase());
  }
  renderOfflineFamilies();
  updateDebugInfo();
}, 8000);

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
    const pending = families.filter(f => !f.synced);

    if (pending.length === 0) {
      showToast("✅ No pending data to sync");
      return;
    }

    const progressContainer = document.getElementById("syncProgressContainer");
    const progressText = document.getElementById("syncProgressText");
    const progressPercent = document.getElementById("syncProgressPercent");
    const progressBar = document.getElementById("syncProgressBar");

    progressContainer.style.display = "block";
    syncBtn.disabled = true;
    progressBar.style.width = "0%";
    progressPercent.innerText = "0%";
    progressBar.style.background = "#ff2d75";

    const total = pending.length;
    showToast(`🔄 Starting sync for ${total} record(s)...`);

    // Listen to progress updates
    const onProgress = (e) => {
      const { current, total, family } = e.detail;
      const percent = Math.round((current / total) * 100);
      progressBar.style.width = `${percent}%`;
      progressPercent.innerText = `${percent}%`;
      progressText.innerText = `Syncing: ${family}...`;
    };

    // Listen to completion
    const onComplete = (e) => {
      const { success, errors } = e.detail;
      progressText.innerText = "✅ Sync completed!";
      progressBar.style.width = "100%";
      progressPercent.innerText = "100%";
      progressBar.style.background = "#4caf50";
      
      showToast(`🟢 Sync Complete! Success: ${success}, Errors: ${errors}`);
      
      setTimeout(() => {
        progressContainer.style.display = "none";
        syncBtn.disabled = false;
      }, 2000);

      fetchMongoFamilies();
      renderOfflineFamilies();
      updateDebugInfo();

      window.removeEventListener("sync-progress", onProgress);
      window.removeEventListener("sync-complete", onComplete);
    };

    window.addEventListener("sync-progress", onProgress);
    window.addEventListener("sync-complete", onComplete);

    // Run sync
    syncOfflineData();
  });
});

/* --------------------------
   AUTO SYNC ON RECONNECT
--------------------------- */
window.addEventListener("sync-complete", (e) => {
  if (e.detail && e.detail.success > 0) {
    showToast(`🔄 Auto-Synced ${e.detail.success} records!`);
    fetchMongoFamilies();
    renderOfflineFamilies();
    updateDebugInfo();
  }
});

/* --------------------------
   SYNC CONFLICT RESOLVER
--------------------------- */
function handleConflict(localFam, serverFam) {
  return new Promise((resolve) => {
    const modal = document.getElementById("conflictModal");
    const localCard = document.getElementById("conflictLocalCard");
    const serverCard = document.getElementById("conflictServerCard");

    // Populate data
    document.getElementById("localHead").innerText = localFam.headName;
    document.getElementById("localAddress").innerText = `📍 Address: ${localFam.address}`;
    document.getElementById("localNotes").innerText = `📝 Notes: ${localFam.notes || "None"}`;

    document.getElementById("serverHead").innerText = serverFam.headName;
    document.getElementById("serverAddress").innerText = `📍 Address: ${serverFam.address}`;
    document.getElementById("serverNotes").innerText = `📝 Notes: ${serverFam.notes || "None"}`;

    let selectedVersion = 'local'; // default choice

    localCard.onclick = () => {
      selectedVersion = 'local';
      localCard.style.borderColor = "#ff1675";
      localCard.style.background = "#fffcfd";
      serverCard.style.borderColor = "#ddd";
      serverCard.style.background = "#fafafa";
    };

    serverCard.onclick = () => {
      selectedVersion = 'server';
      serverCard.style.borderColor = "#ff1675";
      serverCard.style.background = "#fffcfd";
      localCard.style.borderColor = "#ddd";
      localCard.style.background = "#fafafa";
    };

    // Reset layout states
    localCard.onclick();

    modal.style.display = "flex";

    const resolveBtn = document.getElementById("resolveBtn");
    const cancelResolveBtn = document.getElementById("cancelResolveBtn");

    resolveBtn.onclick = async () => {
      modal.style.display = "none";
      if (selectedVersion === 'local') {
        // Overwrite Server record
        try {
          const res = await fetch(`http://localhost:5000/api/family/${localFam.contact}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localFam)
          });
          if (res.ok) {
            await deleteOfflineFamily(localFam.id);
            console.log("✅ Overwrote server version with local data");
            showToast("Overwrote server version with local data");
          } else {
            throw new Error(`Failed: ${res.status}`);
          }
        } catch (e) {
          console.error("Conflict update failed", e);
          showToast("❌ Conflict update failed", true);
        }
      } else {
        // Keep Server record: overwrite local IndexedDB record
        try {
          await deleteOfflineFamily(localFam.id);
          console.log("✅ Discarded local changes, keeping server data");
          showToast("Kept server version");
        } catch (e) {
          console.error("IndexedDB delete failed", e);
        }
      }
      resolve();
    };

    cancelResolveBtn.onclick = () => {
      modal.style.display = "none";
      resolve(); // skip this item
    };
  });
}

/* --------------------------
   TOAST NOTIFICATION
--------------------------- */
function showToast(msg, isError = false) {
  const container = document.getElementById("syncToast");
  if (!container) return;

  const toast = document.createElement("div");
  toast.style.background = isError 
    ? "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)" 
    : "linear-gradient(135deg, #2e1e3f 0%, #1e122b 100%)";
  toast.style.color = "white";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "bold";
  toast.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
  toast.style.border = isError ? "1px solid rgba(244,67,54,0.3)" : "1px solid rgba(255,45,117,0.3)";
  toast.style.minWidth = "250px";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)";
  toast.style.pointerEvents = "auto";
  toast.style.marginBottom = "8px";
  toast.innerHTML = msg;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

/* --------------------------
   DEVELOPER DEBUG PANEL
--------------------------- */
const logo = document.querySelector(".navbar .logo");
const debugPanel = document.getElementById("debugPanel");
const closeDebugBtn = document.getElementById("closeDebugBtn");

function toggleDebugPanel() {
  if (debugPanel.style.display === "none" || !debugPanel.style.display) {
    debugPanel.style.display = "flex";
    setTimeout(() => {
      debugPanel.style.transform = "translateX(0)";
    }, 10);
    updateDebugInfo();
  } else {
    debugPanel.style.transform = "translateX(100%)";
    setTimeout(() => {
      debugPanel.style.display = "none";
    }, 300);
  }
}

if (logo) {
  logo.style.cursor = "pointer";
  logo.addEventListener("dblclick", toggleDebugPanel);
  logo.title = "Double click to open Dev Console";
}
if (closeDebugBtn) closeDebugBtn.addEventListener("click", toggleDebugPanel);

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
    e.preventDefault();
    toggleDebugPanel();
  }
});

async function updateDebugInfo() {
  if (!debugPanel || debugPanel.style.display === "none") return;

  // 1. Check Backend and Mongo Status
  const apiStatusEl = document.getElementById("debugApiStatus");
  const mongoStatusEl = document.getElementById("debugMongoStatus");
  try {
    const res = await fetch("http://localhost:5000/api/family/health");
    if (res.ok) {
      const data = await res.json();
      apiStatusEl.innerText = "🟢 Online";
      apiStatusEl.style.color = "#4caf50";
      mongoStatusEl.innerText = data.mongo === "Connected" ? "🟢 Connected" : `🔴 ${data.mongo}`;
      mongoStatusEl.style.color = data.mongo === "Connected" ? "#4caf50" : "#f44336";
    } else {
      throw new Error();
    }
  } catch (e) {
    apiStatusEl.innerText = "🔴 Offline";
    apiStatusEl.style.color = "#f44336";
    mongoStatusEl.innerText = "🔴 Disconnected";
    mongoStatusEl.style.color = "#f44336";
  }

  // 2. Pending Queue Size
  getAllFamilies((families) => {
    const pending = families.filter(f => !f.synced);
    document.getElementById("debugQueueCount").innerText = pending.length;
    document.getElementById("offlineCount").innerText = `🟡 Offline: ${pending.length}`;
  });

  // 3. Stats
  const stats = window.syncStats || { lastSyncTime: "Never", successCount: 0, errorCount: 0 };
  document.getElementById("debugLastSync").innerText = stats.lastSyncTime || "Never";
  document.getElementById("debugSyncSuccess").innerText = stats.successCount;
  document.getElementById("debugSyncErrors").innerText = stats.errorCount;
}

// Update stats on stats update event
window.addEventListener("sync-stats-updated", updateDebugInfo);

/* --------------------------
   DEBUG CONSOLE LOG REDIRECT
--------------------------- */
const debugLogConsole = document.getElementById("debugLogConsole");
function addDebugLog(msg, type = "info") {
  if (!debugLogConsole) return;
  const line = document.createElement("div");
  line.style.borderBottom = "1px solid rgba(255,255,255,0.03)";
  line.style.padding = "2px 0";
  if (type === "error") {
    line.style.color = "#ff8a80";
  } else if (type === "success") {
    line.style.color = "#b9f6ca";
  } else if (type === "warn") {
    line.style.color = "#ffe082";
  }
  line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
  debugLogConsole.appendChild(line);
  debugLogConsole.scrollTop = debugLogConsole.scrollHeight;
}

// Redirect console logs to developer console panel
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
  originalLog.apply(console, args);
  const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" ");
  if (msg.includes("[SYNC STARTED]") || msg.includes("[SYNC COMPLETED]") || msg.includes("SUCCESS")) {
    addDebugLog(msg, "success");
  } else if (msg.includes("[SENDING RECORD]") || msg.includes("[FOUND")) {
    addDebugLog(msg, "info");
  } else {
    addDebugLog(msg, "info");
  }
};
console.warn = function(...args) {
  originalWarn.apply(console, args);
  addDebugLog(args.join(" "), "warn");
};
console.error = function(...args) {
  originalError.apply(console, args);
  addDebugLog(args.join(" "), "error");
};

/* --------------------------
   DEVELOPER BUTTONS BINDINGS
--------------------------- */
document.getElementById("debugForceSyncBtn").onclick = async () => {
  showToast("🔄 Starting Force Sync...");
  await syncOfflineData();
  updateDebugInfo();
};

let simulateOffline = false;
document.getElementById("debugToggleOnlineBtn").onclick = () => {
  simulateOffline = !simulateOffline;
  const btn = document.getElementById("debugToggleOnlineBtn");
  if (simulateOffline) {
    btn.innerText = "Disable Offline Simulation";
    btn.style.background = "rgba(244,67,54,0.15)";
    btn.style.borderColor = "rgba(244,67,54,0.4)";
    showToast("⚠️ Network Simulation: OFFLINE", true);
    
    window.originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (url.toString().includes("/api/family")) {
        return Promise.reject(new TypeError("Failed to fetch"));
      }
      return window.originalFetch(url, options);
    };
    
    Object.defineProperty(navigator, 'onLine', {
      get: () => false,
      configurable: true
    });
    window.dispatchEvent(new Event("offline"));
  } else {
    btn.innerText = "Toggle Online Simulation";
    btn.style.background = "rgba(255,255,255,0.05)";
    btn.style.borderColor = "rgba(255,255,255,0.15)";
    showToast("🟢 Network Simulation: ONLINE");
    
    if (window.originalFetch) {
      window.fetch = window.originalFetch;
    }
    
    Object.defineProperty(navigator, 'onLine', {
      get: () => true,
      configurable: true
    });
    window.dispatchEvent(new Event("online"));
  }
  updateDebugInfo();
};

document.getElementById("debugClearDbBtn").onclick = () => {
  if (confirm("Are you sure you want to clear all local families from IndexedDB?")) {
    const tx = db.transaction("families", "readwrite");
    const store = tx.objectStore("families");
    const req = store.clear();
    req.onsuccess = () => {
      showToast("🗑️ IndexedDB cleared successfully");
      renderOfflineFamilies();
      updateDebugInfo();
    };
  }
};
