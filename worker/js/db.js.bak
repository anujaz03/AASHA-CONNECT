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
  store.add({
  ...data,
  synced: false,
  createdAt: new Date()
});
;

  alert("🟡 Offline: Data saved locally");
}
// READ all families (for families.html)
function getAllFamilies(callback) {
  if (!dbReady) {
    setTimeout(() => getAllFamilies(callback), 300);
    return;
  }

  const tx = db.transaction("families", "readonly");
  const store = tx.objectStore("families");
  const families = [];

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      families.push(cursor.value);
      cursor.continue();
    } else {
      callback(families);
    }
  };
}

// UPDATE family as synced
function markFamilySynced(id) {
  const tx = db.transaction("families", "readwrite");
  const store = tx.objectStore("families");

  const req = store.get(id);
  req.onsuccess = () => {
    const data = req.result;
    data.synced = true;
    store.put(data);
  };
}
function getAllFamilies(callback) {
  const tx = db.transaction("families", "readonly");
  const store = tx.objectStore("families");
  const req = store.getAll();

  req.onsuccess = () => callback(req.result);
}

function markFamilySynced(id) {
  const tx = db.transaction("families", "readwrite");
  const store = tx.objectStore("families");

  const req = store.get(id);
  req.onsuccess = () => {
    const data = req.result;
    if (data) {
      data.synced = true;
      store.put(data);
    }
  };
}

