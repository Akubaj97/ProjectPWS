const fs = require("fs");
const path = require("path");
const store = require("../storage/gpusStore");

const VIEWS_DIR = path.join(__dirname, "..", "views");

function loadView(name) {
  return fs.readFileSync(path.join(VIEWS_DIR, name), "utf-8");
}

function render(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

function renderLayout({ title, heading, content }) {
  const layout = loadView("layout.html");
  return render(layout, { title, heading, content });
}

function sendHtml(res, html, status = 200) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function handlePages(req, res) {
  // serve any file under /public
  if (req.url.startsWith("/public/") && req.method === "GET") {
    const rel = req.url.slice(1); // remove leading /
    const file = path.join(__dirname, "..", rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      // simple content-type detection
      let type = "text/plain";
      if (file.endsWith(".js")) type = "application/javascript";
      else if (file.endsWith(".css")) type = "text/css";
      res.writeHead(200, { "Content-Type": type + "; charset=utf-8" });
      return res.end(fs.readFileSync(file, "utf-8"));
    }
    // otherwise let the 404 handler catch it
  }

  // GET /
if (req.url === "/" && req.method === "GET") {
  const gpus = store.getAll();

  const rows = gpus.map(g => {
    const brand = (g.brand || "").toLowerCase();
    const cls = brand === "nvidia" ? "nvidia" : brand === "amd" ? "amd" : brand === "intel" ? "intel" : "";
    let brandHtml = g.brand || "";
    switch (brand.toLowerCase()) {
      case "nvidia":
        brandHtml = `<span style=\"color:#76B900;\">${g.brand}</span>`;
        break;
      case "amd":
        brandHtml = `<span style=\"color:#ED1C24;\">${g.brand}</span>`;
        break;
      case "intel":
        brandHtml = `<span style=\"color:#0071C5;\">${g.brand}</span>`;
        break;
    }
    return `
    <tr class="${cls}">
      <td>${g.id}</td>
      <td>${g.vendor}</td>
      <td>${brandHtml}</td>
      <td><a href="/gpu/${g.id}">${g.model}</a></td>
      <td>${g.memory}</td>
      <td>
        <a href="/gpu/${g.id}">Detail</a>
        <a href="/edit/${g.id}">Upravit</a>
        <button data-delete-id="${g.id}">Smazat</button>
      </td>
    </tr>
  `;
  }).join("");

  const indexTpl = loadView("index.html");
  const content = render(indexTpl, {
    rows: rows || `<tr><td colspan="6">Žádná data.</td></tr>`
  });

  return sendHtml(
    res,
    renderLayout({
      title: "Databáze grafických karet",
      heading: "Databáze grafických karet",
      content
    })
  );
}


  // GET /gpu/:id (detail)
  if (req.url.startsWith("/gpu/") && req.method === "GET") {
    const id = Number(req.url.split("/")[2]);
    const gpu = store.getById(id);
    if (!gpu) {
      const errTpl = loadView("error.html");
      const content = render(errTpl, { message: "GPU nenalezena." });
      return sendHtml(res, renderLayout({ title: "Chyba", heading: "Chyba", content }), 404);
    }

    const tpl = loadView("detail.html");
    const content = render(tpl, gpu);
    return sendHtml(res, renderLayout({ title: "Detail", heading: "Detail GPU", content }));
  }

  // GET /edit/:id (form for editing GPU)
  if (req.url.startsWith("/edit/") && req.method === "GET") {
    const id = Number(req.url.split("/")[2]);
    const gpu = store.getById(id);

    if (!gpu) {
      const errTpl = loadView("error.html");
      const content = render(errTpl, { message: "GPU nenalezena." });
      return sendHtml(res, renderLayout({ title: "Chyba", heading: "Chyba", content }), 404);
    }

    const tpl = loadView("edit.html");
    const content = render(tpl, gpu);
    return sendHtml(res, renderLayout({ title: "Editace", heading: "Editace GPU", content }));
  }

  return false;
}

module.exports = { handlePages };
