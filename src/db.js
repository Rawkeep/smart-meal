const DB_NAME = "wei-foods-db";
const DB_VERSION = 1;
const STORE_NAME = "foods";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("histamin", "histamin", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function initDB(foods) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  // Check if already populated
  const count = await new Promise((res) => {
    const r = store.count();
    r.onsuccess = () => res(r.result);
  });

  if (count >= foods.length) {
    db.close();
    return;
  }

  for (const food of foods) {
    store.put(food);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getFoodsByCategory(category) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const idx = tx.objectStore(STORE_NAME).index("category");
    const req = idx.getAll(category);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function getAllFoods() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function searchFoods(query) {
  const all = await getAllFoods();
  const q = query.toLowerCase();
  return all.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.tags?.some(t => t.toLowerCase().includes(q))
  );
}

export async function getFoodsFiltered(profile) {
  const all = await getAllFoods();
  return all.filter(food => {
    // Filter by allergies
    if (profile.allergies?.length > 0) {
      if (food.allergies?.some(a => profile.allergies.includes(a))) return false;
    }
    // Filter by histamine
    if (profile.histamin && food.histamin === "high") return false;
    // Filter by diet
    if (profile.diet?.includes("vegan") && !food.tags?.includes("vegan")) return false;
    if (profile.diet?.includes("vegetarisch") && food.tags?.includes("fleisch")) return false;
    return true;
  });
}
