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
  pendingQueue.forEach(item => {
    saveOfflineFamily(item.data)
      .then(item.resolve)
      .catch(item.reject);
  });
  pendingQueue.length = 0;
};

request.onerror = () => {
  console.error("❌ IndexedDB failed");
};

function saveOfflineFamily(data) {
  return new Promise((resolve, reject) => {
    if (!dbReady) {
      console.log("⏳ DB not ready, queueing");
      pendingQueue.push({ data, resolve, reject });
      return;
    }

    try {
      const tx = db.transaction("families", "readwrite");
      const store = tx.objectStore("families");
      
      // Prevent saving fields with "undefined" string
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          cleanData[key] = "";
        }
      });

      const req = store.add({
        ...cleanData,
        synced: false,
        createdAt: new Date()
      });

      req.onsuccess = (e) => {
        const id = e.target.result;
        console.log(`[IndexedDB] Saved family locally with ID: ${id}`);
        resolve(id);
      };

      req.onerror = (e) => {
        console.error("[IndexedDB] Error saving family:", e.target.error);
        reject(e.target.error);
      };
    } catch (err) {
      console.error("[IndexedDB] Exception in saveOfflineFamily:", err);
      reject(err);
    }
  });
}

// READ all families (for families.html)
function getAllFamilies(callback) {
  if (!dbReady) {
    setTimeout(() => getAllFamilies(callback), 300);
    return;
  }

  const tx = db.transaction("families", "readonly");
  const store = tx.objectStore("families");
  const req = store.getAll();

  req.onsuccess = () => callback(req.result);
}

// DELETE a family from IndexedDB
function deleteOfflineFamily(id) {
  return new Promise((resolve, reject) => {
    if (!dbReady) {
      setTimeout(() => deleteOfflineFamily(id).then(resolve).catch(reject), 300);
      return;
    }

    try {
      const tx = db.transaction("families", "readwrite");
      const store = tx.objectStore("families");
      const numericId = typeof id === "string" && !isNaN(id) ? Number(id) : id;
      const req = store.delete(numericId);

      req.onsuccess = () => {
        console.log(`[IndexedDB] Deleted local family with ID: ${id}`);
        resolve();
      };

      req.onerror = (e) => {
        console.error(`[IndexedDB] Failed to delete family with ID: ${id}`, e.target.error);
        reject(e.target.error);
      };
    } catch (err) {
      console.error(`[IndexedDB] Exception in deleteOfflineFamily:`, err);
      reject(err);
    }
  });
}

// UPDATE family as synced (Legacy helper - keeping for backward compatibility)
function markFamilySynced(id) {
  if (!dbReady) {
    setTimeout(() => markFamilySynced(id), 300);
    return;
  }

  const tx = db.transaction("families", "readwrite");
  const store = tx.objectStore("families");
  const numericId = typeof id === "string" && !isNaN(id) ? Number(id) : id;

  const req = store.get(numericId);
  req.onsuccess = () => {
    const data = req.result;
    if (data) {
      data.synced = true;
      store.put(data);
    }
  };
}
