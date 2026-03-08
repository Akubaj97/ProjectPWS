const store = require("../storage/usersStore");

function readBodyJson(req, cb) {
  let body = "";
  req.on("data", (ch) => (body += ch));
  req.on("end", () => {
    try {
      cb(null, JSON.parse(body || "{}"));
    } catch (e) {
      cb(e);
    }
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function handleApiUsers(req, res) {
    // GET /api/users – vrátí všechny uživatele
    if (req.url === "/api/users" && req.method === "GET") {
    const users = store.getAll();
    return sendJson(res, 200, users);
    }


  // POST /api/users
  if (req.url === "/api/users" && req.method === "POST") {
    return readBodyJson(req, (err, data) => {
      if (err) return sendJson(res, 400, { error: "Neplatný JSON" });

      const name = String(data.name || "").trim();
      const age = Number(data.age);

      if (!name || Number.isNaN(age)) {
        return sendJson(res, 400, { error: "Chybí name nebo age" });
      }

      const created = store.create({ name, age });
      return sendJson(res, 201, created);
    });
  }

  // PUT /api/users/:id
  if (req.url.startsWith("/api/users/") && req.method === "PUT") {
    const id = Number(req.url.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });

    return readBodyJson(req, (err, data) => {
      if (err) return sendJson(res, 400, { error: "Neplatný JSON" });

      const patch = {};
      if (data.name !== undefined) patch.name = String(data.name).trim();
      if (data.age !== undefined) patch.age = Number(data.age);

      const updated = store.update(id, patch);
      if (!updated) return sendJson(res, 404, { error: "Uživatel nenalezen" });

      return sendJson(res, 200, updated);
    });
  }

  // DELETE /api/users/:id
  if (req.url.startsWith("/api/users/") && req.method === "DELETE") {
    const id = Number(req.url.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });

    const removed = store.remove(id);
    if (!removed) return sendJson(res, 404, { error: "Uživatel nenalezen" });

    return sendJson(res, 200, { message: "Uživatel smazán", user: removed });
  }

  return false; // neobslouženo
}

module.exports = { handleApiUsers };
