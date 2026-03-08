const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (e) {
    console.log("❌ Chyba při čtení/parsu users.json:", e.message);
    return [];
  }
}



function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function getAll() {
  return loadUsers();
}

function getById(id) {
  const users = loadUsers();
  return users.find((u) => u.id === id) || null;
}

function create({ name, age }) {
  const users = loadUsers();
  const newId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const user = { id: newId, name, age };
  users.push(user);
  saveUsers(users);
  return user;
}

function update(id, patch) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  if (patch.name !== undefined) users[idx].name = patch.name;
  if (patch.age !== undefined) users[idx].age = patch.age;

  saveUsers(users);
  return users[idx];
}

function remove(id) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const removed = users.splice(idx, 1)[0];
  saveUsers(users);
  return removed;
}


module.exports = { getAll, getById, create, update, remove };
