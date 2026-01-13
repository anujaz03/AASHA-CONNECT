// sync.js

window.addEventListener("load", () => {
  const btn = document.getElementById("saveFamilyBtn");
  if (!btn) return;

  btn.onclick = async () => {
    const familyData = {
      headName: document.querySelector("input[placeholder='Family Head Name *']").value.trim(),
      address: document.querySelector("input[placeholder='Address *']").value.trim(),
      contact: document.querySelector("input[placeholder='Contact Number *']").value.trim(),
      notes: document.querySelector("textarea").value.trim()
    };

    if (!familyData.headName || !familyData.address || !familyData.contact) {
      alert("Please fill all required fields");
      return;
    }

    if (navigator.onLine) {
      await sendToServer(familyData);
    } else {
      saveOfflineFamily(familyData);
    }
  };
});

// 🔁 AUTO SYNC WHEN INTERNET COMES BACK
window.addEventListener("online", () => {
  console.log("🌐 Internet restored, syncing offline data...");
  syncOfflineData();
});

// SEND TO SERVER
async function sendToServer(familyData) {
  const res = await fetch("http://localhost:5000/api/family/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(familyData)
  });

  if (!res.ok) throw new Error("Server error");

  alert("🟢 Family saved online");
}

// 🔄 SYNC OFFLINE DATA
function syncOfflineData() {
  const tx = db.transaction("families", "readwrite");
  const store = tx.objectStore("families");

  store.getAll().onsuccess = async (e) => {
    const offlineFamilies = e.target.result;

    for (let family of offlineFamilies) {
      try {
        await sendToServer(family);
        store.delete(family.id); // ❗ remove after successful sync
        console.log("✅ Synced & removed from IndexedDB");
      } catch (err) {
        console.error("❌ Sync failed", err);
      }
    }
  };
}
