const fs = require("fs");
const path = require("path");

const GPUS_FILE = path.join(__dirname, "..", "data", "gpus.json");

function loadGpus() {
  try {
    const raw = fs.readFileSync(GPUS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // ensure every record has the new field
    return data.map(g => ({ brand: "", ...g }));
  } catch (e) {
    console.log("❌ Chyba při čtení/parsu gpus.json:", e.message);
    return [];
  }
}

function saveGpus(gpus) {
  fs.writeFileSync(GPUS_FILE, JSON.stringify(gpus, null, 2), "utf-8");
}

function getAll() {
  return loadGpus();
}

function getById(id) {
  const gpus = loadGpus();
  return gpus.find((g) => g.id === id) || null;
}

function create({ model, vendor, memory, brand }) {
  const gpus = loadGpus();
  const newId = gpus.length ? Math.max(...gpus.map((g) => g.id)) + 1 : 1;
  const gpu = { id: newId, model, vendor, memory, brand };
  gpus.push(gpu);
  saveGpus(gpus);
  return gpu;
}

function update(id, patch) {
  const gpus = loadGpus();
  const idx = gpus.findIndex((g) => g.id === id);
  if (idx === -1) return null;

  if (patch.model !== undefined) gpus[idx].model = patch.model;
  if (patch.vendor !== undefined) gpus[idx].vendor = patch.vendor;
  if (patch.memory !== undefined) gpus[idx].memory = patch.memory;
  if (patch.brand !== undefined) gpus[idx].brand = patch.brand;

  saveGpus(gpus);
  return gpus[idx];
}

function remove(id) {
  const gpus = loadGpus();
  const idx = gpus.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  const removed = gpus.splice(idx, 1)[0];
  saveGpus(gpus);
  return removed;
}

// -> vymaže všechna data a vrátí prázdné pole (nebo můžete načíst výchozí zdroj)
function reset() {
  saveGpus([]);
  return [];
}

module.exports = { getAll, getById, create, update, remove, reset };