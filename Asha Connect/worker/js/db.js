let db;
let dbReady = false;
const pendingQueue = [];

const request = indexedDB.open("AashaDB", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;

  if (!db.objectStoreNames.contains("families")) {
    db.createObjectStore("families", {
      keyPath: "id",
      autoIncrement: true
    });
  }
};

request.onsuccess = (e) => {
  db = e.target.result;
  dbReady = true;
  console.log("✅ IndexedDB ready");

  // flush queued saves
  pendingQueue.forEach(data => saveOfflineFamily(data));
  pendingQueue.length = 0;
};

request.onerror = () => {
  console.error("❌ IndexedDB failed");
};

function saveOfflineFamily(data) {
  if (!dbReady) {
    console.log("⏳ DB not ready, queueing");
    pendingQueue.push(data);
    return;
  }

  const tx = db.transaction("families", "readwrite");
  const store = tx.objectStore("families");
  store.add(data);

  alert("🟡 Offline: Data saved locally");
}
