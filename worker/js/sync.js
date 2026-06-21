// sync.js

// Initialize or restore sync stats
if (!window.syncStats) {
  window.syncStats = {
    lastSyncTime: localStorage.getItem("syncStats_lastSyncTime") || "Never",
    successCount: parseInt(localStorage.getItem("syncStats_successCount") || "0", 10),
    errorCount: parseInt(localStorage.getItem("syncStats_errorCount") || "0", 10),
    isSyncing: false
  };
}

function updateSyncStats(success, error, isSyncing) {
  const stats = window.syncStats;
  if (success) stats.successCount += success;
  if (error) stats.errorCount += error;
  stats.isSyncing = isSyncing;
  if (!isSyncing && (success > 0 || error > 0)) {
    stats.lastSyncTime = new Date().toLocaleString();
    localStorage.setItem("syncStats_lastSyncTime", stats.lastSyncTime);
  }
  localStorage.setItem("syncStats_successCount", stats.successCount);
  localStorage.setItem("syncStats_errorCount", stats.errorCount);
  window.dispatchEvent(new CustomEvent("sync-stats-updated"));
}

// 🔁 AUTO SYNC WHEN INTERNET COMES BACK
window.addEventListener("online", () => {
  console.log("🌐 Internet restored, syncing offline data...");
  syncOfflineData();
});

// SEND TO SERVER
async function sendToServer(familyData) {
  console.log("[SENDING RECORD]", familyData);
  
  // Clean up metadata fromIndexedDB before sending to backend
  const payload = {
    headName: familyData.headName,
    address: familyData.address,
    contact: familyData.contact,
    notes: familyData.notes,
    abhaId: familyData.abhaId || "",
    abhaAddress: familyData.abhaAddress || "",
    members: familyData.members || []
  };

  const res = await fetch("http://localhost:5000/api/family/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  console.log("[API RESPONSE RECEIVED] Status:", res.status);
  
  if (!res.ok) {
    if (res.status === 409) {
      // Conflict
      const data = await res.json();
      throw { status: 409, data };
    }
    throw new Error(`Server error: ${res.status}`);
  }

  const responseData = await res.json();
  console.log("[MONGODB SAVE SUCCESS] Saved family:", responseData);
  return responseData;
}

// 🔄 SYNC OFFLINE DATA (Decoupled from transaction)
function syncOfflineData() {
  if (window.syncStats.isSyncing) {
    console.log("Sync already in progress, skipping...");
    return Promise.resolve();
  }

  console.log("[SYNC STARTED]");
  updateSyncStats(0, 0, true);

  return new Promise((resolve) => {
    getAllFamilies(async (families) => {
      const offlineFamilies = families.filter(f => !f.synced);
      console.log(`[FOUND ${offlineFamilies.length} PENDING RECORDS]`);

      if (offlineFamilies.length === 0) {
        console.log("[SYNC COMPLETED] No records to sync");
        updateSyncStats(0, 0, false);
        window.dispatchEvent(new CustomEvent("sync-complete", { detail: { count: 0 } }));
        resolve();
        return;
      }

      let success = 0;
      let errors = 0;

      for (let family of offlineFamilies) {
        try {
          await sendToServer(family);
          success++;
          
          // Delete from IndexedDB upon success
          await deleteOfflineFamily(family.id);
          console.log("[RECORD REMOVED FROM INDEXEDDB] ID:", family.id);
        } catch (err) {
          errors++;
          console.error("❌ Sync failed for family:", family.headName, err);
          
          if (err.status === 409) {
            console.log("⚠️ Conflict detected for contact:", family.contact);
            // Let the UI handle conflict resolver if we are on the families page
            if (typeof handleConflict === "function") {
              try {
                await handleConflict(family, err.data.serverFamily);
              } catch (resolveErr) {
                console.error("Conflict resolution failed:", resolveErr);
              }
            }
          }
        }
        
        // Dispatch progress event
        window.dispatchEvent(new CustomEvent("sync-progress", {
          detail: {
            current: success + errors,
            total: offlineFamilies.length,
            family: family.headName
          }
        }));
      }

      console.log(`[SYNC COMPLETED] Success: ${success}, Errors: ${errors}`);
      updateSyncStats(success, errors, false);
      
      // Dispatch completion event
      window.dispatchEvent(new CustomEvent("sync-complete", { 
        detail: { success, errors, total: offlineFamilies.length } 
      }));
      
      resolve();
    });
  });
}
