// recteur.js
document.addEventListener("DOMContentLoaded", () => {
  initConcoursListPage();
  initConcoursConfigPage();
});

const API_BASE = "http://localhost:4000";

/* =========================
   SESSION / REFRESH
   ========================= */

async function refreshSession() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Refresh token invalide");
  }
}

// ✅ fallback si tu ne l'as pas ailleurs
function handleSessionExpired() {
  try {
    showToast("Session expirée. Merci de vous reconnecter.", "error");
  } catch (_) {}
  // optionnel : rediriger vers login
  // window.location.href = "/login.html";
}

/* =========================
   TOASTS
   ========================= */
const toastArea = document.getElementById("toastArea");

function showToast(message, type = "info", duration = 3000) {
  if (!toastArea) {
    console.warn("toastArea introuvable, fallback alert");
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastArea.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visible"));

  if (type !== "loading") {
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
  return toast;
}

async function fetchJson(url, options = {}, _retry = true) {
  const finalOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  let res = await fetch(url, finalOptions);

  if ((res.status === 401 || res.status === 419) && _retry) {
    try {
      await refreshSession();
      res = await fetch(url, finalOptions);
    } catch (e) {
      handleSessionExpired();
      throw new Error("Session expirée");
    }
  }

  if (res.status === 401 || res.status === 419) {
    handleSessionExpired();
    throw new Error("Session expirée");
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {}

  if (!res.ok) {
    const message = data?.error || data?.message || "Erreur serveur";
    throw new Error(message);
  }

  return data;
}

/* ============================================================
   1) PAGE : Liste des concours (recteur.html)
   ============================================================ */
function initConcoursListPage() {
  const listSection = document.getElementById("concoursListSection");
  const detailSection = document.getElementById("concoursDetailSection");
  const backBtn = document.getElementById("backToListBtn");

  if (!listSection || !detailSection || !backBtn) return;

  const detailTitle = document.getElementById("detailConcoursTitle");
  const detailSubtitle = document.getElementById("detailConcoursSubtitle");
  const faculteEl = document.getElementById("detailFaculte");
  const departementEl = document.getElementById("detailDepartement");
  const anneeEl = document.getElementById("detailAnnee");
  const filiereEl = document.getElementById("detailFiliere");
  const placesEl = document.getElementById("detailPlaces");
  const candidatsBody = document.getElementById("detailCandidatsBody");

  const tbody = document.getElementById("concoursTableBody");
  const filterAnnee = document.getElementById("filterAnnee");

  if (!tbody) return;

  let concoursCache = [];

  async function renderConcoursTable(list) {
    tbody.innerHTML = "";

    for (let index = 0; index < list.length; index++) {
      const c = list[index];
      const tr = document.createElement("tr");

      let dateLabel = "—";
      if (c.dateConcours) {
        const d = new Date(c.dateConcours);
        if (!isNaN(d.getTime())) {
          dateLabel = d.toLocaleDateString("fr-FR");
        }
      }

      tr.dataset.id = c.idConcours;
      tr.dataset.concours = c.nomConcours;
      tr.dataset.annee = String(c.annee);
      tr.dataset.dateConcours = dateLabel;

      const concoursInfo = await fetchJson(
        `${API_BASE}/departements/concours/${c.idConcours}`
      );
      const { nom_faculte, nom_departement } = concoursInfo.row;

      const filierename = await fetchJson(
        `${API_BASE}/specialites/filiere/${c.idConcours}`
      );
      const filiere = filierename?.row?.filiere ?? "";

      const placesResponse = await fetchJson(
        `${API_BASE}/specialites/concours/nombrePlaces/${c.idConcours}`
      );
      const rawSum = placesResponse?.row?.sum;
      const nbPlaces = rawSum != null ? Number(rawSum) || 0 : 0;

      tr.dataset.faculte = nom_faculte;
      tr.dataset.departement = nom_departement;
      tr.dataset.filiere = filiere;
      tr.dataset.places = String(nbPlaces);

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${c.nomConcours}</td>
        <td>${nom_faculte}</td>
        <td>${nom_departement}</td>
        <td>${c.annee}</td>
        <td>${filiere}</td>
        <td>${nbPlaces}</td>
        <td>
          <button type="button" class="icon-btn view-concours">
            <i class="uil uil-eye"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    }
  }

  function populateFilterAnnees(list) {
    if (!filterAnnee) return;

    filterAnnee.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Toutes les années";
    filterAnnee.appendChild(optAll);

    const anneesUniques = [...new Set(list.map((c) => c.annee))].sort();
    anneesUniques.forEach((annee) => {
      const option = document.createElement("option");
      option.value = String(annee);
      option.textContent = String(annee);
      filterAnnee.appendChild(option);
    });
  }

  async function loadConcoursList() {
    try {
      concoursCache = await fetchJson(`${API_BASE}/concours`);
      populateFilterAnnees(concoursCache);
      await renderConcoursTable(concoursCache);
    } catch (err) {
      console.error(err);
      showToast("Impossible de charger les concours", "error");
    }
  }

  if (filterAnnee) {
    filterAnnee.addEventListener("change", async (e) => {
      const selectedYear = e.target.value;

      let filtered;
      if (selectedYear === "all") filtered = concoursCache;
      else filtered = concoursCache.filter((c) => String(c.annee) === selectedYear);

      await renderConcoursTable(filtered);
    });
  }

  loadConcoursList();

  tbody.addEventListener("click", (event) => {
    const btn = event.target.closest(".view-concours");
    if (!btn) return;

    const row = btn.closest("tr");
    if (!row) return;

    const concours = row.dataset.concours || "Concours";
    const annee = row.dataset.annee || "–";
    const dateConcours = row.dataset.dateConcours || "";
    const faculte = row.dataset.faculte || "–";
    const depart = row.dataset.departement || "–";
    const filiere = row.dataset.filiere || "–";
    const places = row.dataset.places || "–";

    if (detailTitle) detailTitle.textContent = concours;
    if (detailSubtitle) {
      detailSubtitle.textContent = dateConcours
        ? `Concours de doctorat – ${annee} – ${dateConcours}`
        : `Concours de doctorat – ${annee}`;
    }

    if (faculteEl) faculteEl.textContent = faculte;
    if (departementEl) departementEl.textContent = depart;
    if (anneeEl) anneeEl.textContent = annee;
    if (filiereEl) filiereEl.textContent = filiere;
    if (placesEl) placesEl.textContent = places;

    if (candidatsBody) candidatsBody.innerHTML = "";

    listSection.classList.add("hidden");
    detailSection.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  backBtn.addEventListener("click", () => {
    detailSection.classList.add("hidden");
    listSection.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ============================================================
   2) PAGE : Configuration d’un concours (recteur-config.html)
   ============================================================ */
function initConcoursConfigPage() {
  const form = document.querySelector(".concours-form");
  if (!form) return;

  const faculteSelect = document.getElementById("faculte");
  const faculteCustom = document.getElementById("faculteCustom");
  const departementSelect = document.getElementById("departement");
  const departementCustom = document.getElementById("departementCustom");
  const filiereInput = document.getElementById("filiereCustom");
  const anneeInput = document.getElementById("anneeFormation");
  const concoursNomInput = document.getElementById("concoursNom");
  const dateConcoursInput = document.getElementById("dateConcours");

  const tbody = document.querySelector(".specialties-table tbody");
  const addBtn = document.getElementById("addSpecialtyBtn");
  const cancelBtn = form.querySelector(".secondary-btn");
  const submitBtn = form.querySelector('button[type="submit"]');

  setupAutreSelects();
  setupSpecialtiesTable();
  loadFacultesEtDepartements();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");

    try {
      // 1) Faculté
      const faculte = await resolveFaculte(faculteSelect, faculteCustom);

      // 2) Département
      const departement = await resolveDepartement(
        departementSelect,
        departementCustom,
        faculte.idFaculte
      );

      // 3) Concours
      const anneeRaw = (anneeInput?.value || "").trim();
      const concoursNom = (concoursNomInput?.value || "").trim();
      const filiereGlobal = (filiereInput?.value || "").trim();
      const dateConcoursRaw = (dateConcoursInput?.value || "").trim();

      if (!concoursNom) throw new Error("Le nom du concours est obligatoire.");

      const yearMatch = anneeRaw.match(/\d{4}/);
      if (!yearMatch) {
        throw new Error("L'année de formation est obligatoire (ex: 2025 ou 2025/2026).");
      }
      const annee = parseInt(yearMatch[0], 10);

      let dateConcours = undefined;
      if (dateConcoursRaw) dateConcours = dateConcoursRaw;

      const concoursPayload = {
        nomConcours: concoursNom,
        annee,
        dateConcours,
        idDepartement: departement.idDepartement,
      };

      const concoursResponse = await fetchJson(`${API_BASE}/concours`, {
        method: "POST",
        body: JSON.stringify(concoursPayload),
      });

      // ✅ unwrap concours
      const concoursObj = concoursResponse.concours ?? concoursResponse.row ?? concoursResponse;

      const concoursId = concoursObj?.idConcours ?? concoursObj?.id_concours ?? null;
      if (!concoursId) {
        console.error("Réponse POST /concours =", concoursResponse);
        throw new Error("Réponse concours invalide (idConcours manquant).");
      }

      showToast("Concours créé avec succès 🎓", "success");

      // 4) Spécialités
      const specialites = collectSpecialitesFromTable(tbody);
      if (specialites.length === 0) {
        showToast("Concours créé, mais aucune spécialité n'a été définie.", "warning");
      } else {
        const promises = specialites.map((sp) => {
          const payload = {
            filiere: filiereGlobal || sp.specialite,
            nomSpecialite: sp.specialite,
            nombrePlaces: sp.places,
            idConcours: concoursId,
          };

          return fetchJson(`${API_BASE}/specialites`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        });

        await Promise.all(promises);
        showToast("Spécialités enregistrées avec succès ✅", "success");
      }

      form.reset();
      if (tbody) {
        tbody.innerHTML = "";
        tbody.appendChild(createSpecialtyRow());
      }

      // ✅ recharge listes (pour que la nouvelle faculté/département apparaissent)
      await loadFacultesEtDepartements();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Erreur lors de la création du concours", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      form.reset();
      if (tbody) {
        tbody.innerHTML = "";
        tbody.appendChild(createSpecialtyRow());
      }
    });
  }

  /* ---------- helpers page ---------- */

  function setupAutreSelects() {
    const customSelects = document.querySelectorAll("select[data-custom-target]");

    customSelects.forEach((select) => {
      const targetId = select.dataset.customTarget;
      const customInput = document.getElementById(targetId);
      if (!customInput) return;

      // ✅ On ne cache PLUS le select (moins de bugs)
      const toggleCustomField = () => {
        const isAutre = select.value === "autre";
        customInput.style.display = isAutre ? "block" : "none";
        if (!isAutre) customInput.value = "";
        if (isAutre) customInput.focus();
      };

      select.addEventListener("change", toggleCustomField);
      toggleCustomField();
    });
  }

  function setupSpecialtiesTable() {
    if (!tbody || !addBtn) return;

    function onClickTable(event) {
      const btn = event.target.closest("button");
      if (!btn) return;

      if (btn.classList.contains("places-btn")) {
        const container = btn.closest(".places-control");
        const input = container.querySelector('input[type="number"]');
        let value = parseInt(input.value || "0", 10);

        if (btn.classList.contains("places-minus")) value = Math.max(0, value - 1);
        else if (btn.classList.contains("places-plus")) value = value + 1;

        input.value = value;
      }

      if (btn.classList.contains("btn-delete-row")) {
        const row = btn.closest("tr");
        if (row && tbody.rows.length > 1) row.remove();
      }
    }

    addBtn.addEventListener("click", () => {
      tbody.appendChild(createSpecialtyRow());
    });

    tbody.addEventListener("click", onClickTable);

    if (tbody.rows.length === 0) {
      tbody.appendChild(createSpecialtyRow());
    }
  }

  async function loadFacultesEtDepartements() {
    try {
      const facultesResponse = await fetchJson(`${API_BASE}/facultes`);
      const facultes = Array.isArray(facultesResponse)
        ? facultesResponse
        : (facultesResponse.facultes ?? facultesResponse.row ?? []);

      if (faculteSelect) {
        faculteSelect.innerHTML = "";

        const optDefault = document.createElement("option");
        optDefault.value = "";
        optDefault.textContent = "Sélectionner une faculté";
        faculteSelect.appendChild(optDefault);

        if (Array.isArray(facultes)) {
          facultes.forEach((f) => {
            const opt = document.createElement("option");
            opt.value = f.idFaculte;
            opt.textContent = f.nomFaculte;
            faculteSelect.appendChild(opt);
          });
        }

        const optAutre = document.createElement("option");
        optAutre.value = "autre";
        optAutre.textContent = "Autre";
        faculteSelect.appendChild(optAutre);
      }

      if (faculteSelect && departementSelect) {
        const loadDeps = async () => {
          const faculteId = faculteSelect.value;

          departementSelect.innerHTML = "";

          const optDefault = document.createElement("option");
          optDefault.value = "";
          optDefault.textContent = "Sélectionner un département";
          departementSelect.appendChild(optDefault);

          if (!faculteId || faculteId === "autre") {
            const optAutre = document.createElement("option");
            optAutre.value = "autre";
            optAutre.textContent = "Autre";
            departementSelect.appendChild(optAutre);
            return;
          }

          try {
            const depsResponse = await fetchJson(
              `${API_BASE}/departements/faculte/${encodeURIComponent(faculteId)}`
            );

            const deps = Array.isArray(depsResponse)
              ? depsResponse
              : (depsResponse.departements ?? depsResponse.row ?? []);

            if (Array.isArray(deps)) {
              deps.forEach((d) => {
                const opt = document.createElement("option");
                opt.value = d.idDepartement;
                opt.textContent = d.nomDepartement;
                departementSelect.appendChild(opt);
              });
            }

            const optAutre = document.createElement("option");
            optAutre.value = "autre";
            optAutre.textContent = "Autre";
            departementSelect.appendChild(optAutre);
          } catch (e) {
            console.error(e);
            showToast("Impossible de charger les départements", "error");
          }
        };

        faculteSelect.addEventListener("change", loadDeps);
        await loadDeps();
      }
    } catch (err) {
      console.error(err);
      showToast("Impossible de charger les facultés", "error");
    }
  }
}

/* =========================
   TABLE SPECIALITES
   ========================= */
function createSpecialtyRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <input type="text" class="input-inline" placeholder="Ex : Systèmes Informatiques">
    </td>
    <td>
      <div class="places-control">
        <button type="button" class="places-btn places-minus">−</button>
        <input type="number" min="0" value="0">
        <button type="button" class="places-btn places-plus">+</button>
      </div>
    </td>
    <td>
      <button type="button" class="icon-btn ghost btn-delete-row">
        <i class="uil uil-trash-alt"></i>
      </button>
    </td>
  `;
  return tr;
}

function collectSpecialitesFromTable(tbody) {
  if (!tbody) return [];
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const result = [];

  rows.forEach((row) => {
    const nameInput = row.querySelector("td:first-child input");
    const placesInput = row.querySelector('input[type="number"]');
    const name = (nameInput?.value || "").trim();
    const places = parseInt(placesInput?.value || "0", 10);

    if (name && places > 0) result.push({ specialite: name, places });
  });

  return result;
}

/* =========================
   RESOLVE FACULTE / DEPARTEMENT
   ========================= */

async function resolveFaculte(selectEl, customInputEl) {
  if (!selectEl) throw new Error("Champ faculté introuvable.");

  const value = selectEl.value;
  const label = selectEl.options[selectEl.selectedIndex]?.text || "";

  // existante
  if (value && value !== "autre") {
    showToast(`Faculté sélectionnée : ${label}`, "success");
    return { idFaculte: value, nomFaculte: label };
  }

  // nouvelle
  const customName = (customInputEl?.value || "").trim();
  if (!customName) throw new Error("Merci de saisir le nom de la faculté.");

  const response = await fetchJson(`${API_BASE}/facultes`, {
    method: "POST",
    body: JSON.stringify({ nomFaculte: customName }),
  });

  // ✅ unwrap: {message, faculte:{...}}
  const faculte = response.faculte ?? response.row ?? response;

  if (!faculte?.idFaculte) {
    console.error("Réponse POST /facultes =", response);
    throw new Error("Réponse faculté invalide (idFaculte manquant).");
  }

  // ✅ injecter dans select + sélectionner
  upsertSelectOption(selectEl, faculte.idFaculte, faculte.nomFaculte || customName);
  selectEl.value = faculte.idFaculte;

  showToast(`Nouvelle faculté créée : ${faculte.nomFaculte || customName}`, "success");

  return { idFaculte: faculte.idFaculte, nomFaculte: faculte.nomFaculte || customName };
}

async function resolveDepartement(selectEl, customInputEl, idFaculte) {
  if (!selectEl) throw new Error("Champ département introuvable.");
  if (!idFaculte) throw new Error("idFaculte manquant pour créer le département.");

  const value = selectEl.value;
  const label = selectEl.options[selectEl.selectedIndex]?.text || "";

  // existant
  if (value && value !== "autre") {
    showToast(`Département sélectionné : ${label}`, "success");
    return { idDepartement: value, nomDepartement: label, idFaculte };
  }

  // nouveau
  const customName = (customInputEl?.value || "").trim();
  if (!customName) throw new Error("Merci de saisir le nom du département.");

  const response = await fetchJson(`${API_BASE}/departements`, {
    method: "POST",
    body: JSON.stringify({ nomDepartement: customName, idFaculte }),
  });

  // ✅ unwrap: {message, departement:{...}}
  const dep = response.departement ?? response.row ?? response;

  if (!dep?.idDepartement) {
    console.error("Réponse POST /departements =", response);
    throw new Error("Réponse département invalide (idDepartement manquant).");
  }

  // ✅ injecter dans select + sélectionner
  upsertSelectOption(selectEl, dep.idDepartement, dep.nomDepartement || customName);
  selectEl.value = dep.idDepartement;

  showToast(`Nouveau département créé : ${dep.nomDepartement || customName}`, "success");

  return {
    idDepartement: dep.idDepartement,
    nomDepartement: dep.nomDepartement || customName,
    idFaculte: dep.idFaculte || idFaculte,
  };
}

/* =========================
   UTIL: upsert option in select
   ========================= */
function upsertSelectOption(selectEl, value, label) {
  if (!selectEl) return;

  const existing = Array.from(selectEl.options).find((o) => o.value === value);
  if (!existing) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;

    // insérer avant "autre" si existe
    const autreOpt = Array.from(selectEl.options).find((o) => o.value === "autre");
    if (autreOpt) selectEl.insertBefore(opt, autreOpt);
    else selectEl.appendChild(opt);
  } else {
    existing.textContent = label;
  }
}