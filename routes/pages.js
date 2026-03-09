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
  let gpus = store.getAll();
  // Seřadit podle paměti a výrobce abecedně
  gpus = gpus.sort((a, b) => {
    // Nejprve paměť (vzestupně)
    if (a.memory !== b.memory) return a.memory - b.memory;
    // Poté výrobce abecedně (case-insensitive)
    return (a.vendor || "").localeCompare(b.vendor || "", undefined, { sensitivity: 'base' });
  });

  const rows = gpus.map(g => {
    const brand = (g.brand || "").toLowerCase();
    const normBrand = (g.brand || "").toLowerCase().replace(/\s+/g, "");
    const cls = normBrand === "nvidia" ? "nvidia" : normBrand === "amd" ? "amd" : normBrand === "intel" ? "intel" : "";
    let brandHtml = g.brand || "";
    switch (normBrand) {
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
      <td style="text-align:center;">${g.id}</td>
      <td style="text-align:center;">${g.vendor}</td>
      <td style="text-align:center;">${brandHtml}</td>
      <td style="text-align:center;"><a href="/gpu/${g.id}">${g.model}</a></td>
      <td style="text-align:center;">${g.memory} GB</td>
      <td style="text-align:center;">${g.price !== undefined ? g.price + ' Kč' : ''}</td>
      <td style="text-align:center;width:270px;">
        <a href="/gpu/${g.id}" class="btn-reset">Detail</a>
        <a href="/edit/${g.id}" class="btn-reset">Upravit</a>
        <button data-delete-id="${g.id}" class="btn-reset">Smazat</button>
      </td>
    </tr>
  `;
  }).join("");


  // Najít kartu s nejnižší cenou a nejvyšší pamětí
  let bestCard = null;
  if (gpus.length) {
    // Filtruj jen ty, které mají cenu i paměť
    const valid = gpus.filter(g => typeof g.price === 'number' && typeof g.memory === 'number');
    if (valid.length) {
      // Najdi nejvyšší paměť
      const maxMemory = Math.max(...valid.map(g => g.memory));
      // Z těch s max pamětí najdi nejnižší cenu
      const best = valid.filter(g => g.memory === maxMemory);
      bestCard = best.reduce((min, g) => (g.price < min.price ? g : min), best[0]);
    }
  }

  let bestCardTable = '';
  if (bestCard) {
      bestCardTable = `
        <table>
          <thead>
            <tr>
              <th style="text-align:center;">ID</th>
              <th style="text-align:center;">Výrobce čipu</th>
              <th style="text-align:center;">Značka</th>
              <th style="text-align:center;">Model</th>
              <th style="text-align:center;">Paměť</th>
              <th style="text-align:center;">Cena (Kč)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align:center;">${bestCard.id}</td>
              <td style="text-align:center;">${bestCard.vendor}</td>
              <td style="text-align:center;">${bestCard.brand}</td>
              <td style="text-align:center;">${bestCard.model}</td>
              <td style="text-align:center;">${bestCard.memory} GB</td>
              <td style="text-align:center;">${bestCard.price} Kč</td>
            </tr>
          </tbody>
        </table>
      `;
  } else {
    bestCardTable = '<p class="muted">Nebyly nalezeny žádné karty s cenou a pamětí.</p>';
  }

  const indexTpl = loadView("index.html");
  const content = render(indexTpl, {
    rows: rows || `<tr><td colspan="6">Žádná data.</td></tr>`,
    bestCardTable
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
