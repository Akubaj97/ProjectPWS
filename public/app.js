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
      memory: Number(fd.get("memory"))
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
      memory: Number(fd.get("memory"))
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
