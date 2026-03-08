const store = require("../storage/gpusStore");

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

function handleApiGpus(req, res) {
  // GET /api/gpus – vrátí všechny karty
  if (req.url === "/api/gpus" && req.method === "GET") {
    const gpus = store.getAll();
    return sendJson(res, 200, gpus);
  }

  // POST /api/gpus
  if (req.url === "/api/gpus" && req.method === "POST") {
    return readBodyJson(req, (err, data) => {
      if (err) return sendJson(res, 400, { error: "Neplatný JSON" });

      const model = String(data.model || "").trim();
      const vendor = String(data.vendor || "").trim();
      const brand = String(data.brand || "").trim();
      const memory = Number(data.memory);

      if (!model || !vendor || !brand || Number.isNaN(memory)) {
        return sendJson(res, 400, { error: "Chybí model, vendor, brand nebo memory" });
      }

      const created = store.create({ model, vendor, brand, memory });
      return sendJson(res, 201, created);
    });
  }

  // PUT /api/gpus/:id
  if (req.url.startsWith("/api/gpus/") && req.method === "PUT") {
    const id = Number(req.url.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });

    return readBodyJson(req, (err, data) => {
      if (err) return sendJson(res, 400, { error: "Neplatný JSON" });

      const patch = {};
      if (data.model !== undefined) patch.model = String(data.model).trim();
      if (data.vendor !== undefined) patch.vendor = String(data.vendor).trim();
      if (data.brand !== undefined) patch.brand = String(data.brand).trim();
      if (data.memory !== undefined) patch.memory = Number(data.memory);

      const updated = store.update(id, patch);
      if (!updated) return sendJson(res, 404, { error: "GPU nenalezena" });

      return sendJson(res, 200, updated);
    });
  }

  // DELETE /api/gpus/:id
  if (req.url.startsWith("/api/gpus/") && req.method === "DELETE") {
    const id = Number(req.url.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });

    const removed = store.remove(id);
    if (!removed) return sendJson(res, 404, { error: "GPU nenalezena" });

    return sendJson(res, 200, { message: "GPU smazána", gpu: removed });
  }

  // POST /api/gpus/reset – vyprázdní seznam
  if (req.url === "/api/gpus/reset" && req.method === "POST") {
    store.reset();
    return sendJson(res, 200, { message: "Databáze resetována" });
  }

  return false;
}

module.exports = { handleApiGpus };