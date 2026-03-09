// Řazení tabulky podle ceny
const sortPriceBtn = document.getElementById("sortPriceBtn");
if (sortPriceBtn) {
  let priceAsc = true;
  sortPriceBtn.addEventListener("click", () => {
    const table = sortPriceBtn.closest("table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      // Cena je v šestém sloupci (index 5), odstraníme " Kč"
      const priceA = parseInt((a.children[5].textContent || '').replace(/\D/g, '')) || 0;
      const priceB = parseInt((b.children[5].textContent || '').replace(/\D/g, '')) || 0;
      return priceAsc ? priceA - priceB : priceB - priceA;
    });
    priceAsc = !priceAsc;
    const tbody = table.querySelector("tbody");
    rows.forEach(r => tbody.appendChild(r));
  });
}
// Řazení tabulky podle modelu (od největšího čísla k nejmenšímu)
const sortModelBtn = document.getElementById("sortModelBtn");
if (sortModelBtn) {
  let modelDesc = true;
  sortModelBtn.addEventListener("click", () => {
    const table = sortModelBtn.closest("table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      // Model je ve čtvrtém sloupci (index 3), může obsahovat text i číslo
      const modelA = a.children[3].textContent.match(/\d+/);
      const modelB = b.children[3].textContent.match(/\d+/);
      const numA = modelA ? parseInt(modelA[0]) : 0;
      const numB = modelB ? parseInt(modelB[0]) : 0;
      return modelDesc ? numB - numA : numA - numB;
    });
    modelDesc = !modelDesc;
    const tbody = table.querySelector("tbody");
    rows.forEach(r => tbody.appendChild(r));
  });
}
// Řazení tabulky podle ID
const sortIdBtn = document.getElementById("sortIdBtn");
if (sortIdBtn) {
  let idAsc = true;
  sortIdBtn.addEventListener("click", () => {
    const table = sortIdBtn.closest("table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      // ID je v prvním sloupci (index 0)
      const idA = parseInt(a.children[0].textContent);
      const idB = parseInt(b.children[0].textContent);
      return idAsc ? idA - idB : idB - idA;
    });
    idAsc = !idAsc;
    const tbody = table.querySelector("tbody");
    rows.forEach(r => tbody.appendChild(r));
  });
}
// Řazení tabulky podle výrobce čipu
const sortVendorBtn = document.getElementById("sortVendorBtn");
if (sortVendorBtn) {
  let vendorAsc = true;
  sortVendorBtn.addEventListener("click", () => {
    const table = sortVendorBtn.closest("table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      // Výrobce čipu je ve druhém sloupci (index 1)
      const vendorA = a.children[1].textContent.trim().toLowerCase();
      const vendorB = b.children[1].textContent.trim().toLowerCase();
      return vendorAsc ? vendorA.localeCompare(vendorB) : vendorB.localeCompare(vendorA);
    });
    vendorAsc = !vendorAsc;
    const tbody = table.querySelector("tbody");
    rows.forEach(r => tbody.appendChild(r));
  });
}
// Řazení tabulky podle značky karty
const sortBrandBtn = document.getElementById("sortBrandBtn");
if (sortBrandBtn) {
  let brandAsc = true;
  sortBrandBtn.addEventListener("click", () => {
    const table = sortBrandBtn.closest("table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      // Značka je ve třetím sloupci (index 2), odstraníme HTML tagy
      const brandA = a.children[2].textContent.trim().toLowerCase();
      const brandB = b.children[2].textContent.trim().toLowerCase();
      return brandAsc ? brandA.localeCompare(brandB) : brandB.localeCompare(brandA);
    });
    brandAsc = !brandAsc;
    const tbody = table.querySelector("tbody");
    rows.forEach(r => tbody.appendChild(r));
  });
}
// Řazení tabulky podle paměti
const sortMemoryBtn = document.getElementById("sortMemoryBtn");
if (sortMemoryBtn) {
  let memoryAsc = true;
  sortMemoryBtn.addEventListener("click", () => {
    const table = sortMemoryBtn.closest("table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      const memA = parseInt(a.children[4].textContent);
      const memB = parseInt(b.children[4].textContent);
      return memoryAsc ? memA - memB : memB - memA;
    });
    memoryAsc = !memoryAsc;
    const tbody = table.querySelector("tbody");
    rows.forEach(r => tbody.appendChild(r));
  });
}
async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

// CREATE (POST /api/gpus)
const gpuCreateForm = document.getElementById("gpuCreateForm");
if (gpuCreateForm) {
  gpuCreateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(gpuCreateForm);
    const payload = {
      model: fd.get("model"),
      vendor: fd.get("vendor"),
      brand: fd.get("brand"),
      memory: Number(fd.get("memory")),
      price: fd.get("price") ? Number(fd.get("price")) : undefined
    };

    const msg = document.getElementById("gpuCreateMsg");
    try {
      await api("/api/gpus", { method: "POST", body: JSON.stringify(payload) });
      window.location.reload();
    } catch (err) {
      msg.textContent = "Chyba: " + JSON.stringify(err.data);
    }
  });
}

// EDIT (PUT /api/gpus/:id)
const editForm = document.getElementById("editForm");
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = editForm.dataset.id;
    const fd = new FormData(editForm);
    const payload = {
      model: fd.get("model"),
      vendor: fd.get("vendor"),
      brand: fd.get("brand"),
      memory: Number(fd.get("memory")),
      price: fd.get("price") ? Number(fd.get("price")) : undefined
    };

    const msg = document.getElementById("editMsg");
    try {
      await api(`/api/gpus/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      window.location.href = `/gpu/${id}`;
    } catch (err) {
      msg.textContent = "Chyba: " + JSON.stringify(err.data);
    }
  });
}

// DELETE tlačítka (DELETE /api/gpus/:id)
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-delete-id]");
  if (!btn) return;

  const id = btn.dataset.deleteId;
  if (!confirm("Opravdu smazat GPU #" + id + "?")) return;

  try {
    await api(`/api/gpus/${id}`, { method: "DELETE" });
    window.location.href = "/";
  } catch (err) {
    alert("Chyba: " + JSON.stringify(err.data));
  }
});

// RESET tlačítko – obnoví aktuální stránku, případně vymaže i data
const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    if (confirm("Opravdu resetovat stránku a smazat všechna data?")) {
      try {
        // zavoláme back‑end, aby smazal všechno
        await api("/api/gpus/reset", { method: "POST" });
      } catch (err) {
        console.error("Reset selhal", err);
      }
      window.location.reload();
    }
  });
}
