// =====================================
//  CONFIG API
// =====================================
const API_BASE = "http://localhost:4000"; // adapte à ton backend si besoin

// Petit helper pour les toasts
function showToast(message, type = "info", duration = 3000) {
  const area = document.getElementById("toastArea");
  if (!area) {
    alert(message);
    return;
  }
  const div = document.createElement("div");
  div.className = `toast toast-${type}`;
  div.textContent = message;
  area.appendChild(div);

  requestAnimationFrame(() => div.classList.add("visible"));
  setTimeout(() => {
    div.classList.remove("visible");
    setTimeout(() => div.remove(), 200);
  }, duration);
}



  async function refreshSession() {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error("Refresh token invalide");
        }
    }


 function handleSessionExpired() {
        localStorage.removeItem("dg-user");
        showToast(
            "Votre session a expiré, veuillez vous reconnecter.",
            "warning",
            4000
        );
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    }



async function fetchJson(path, options = {}) {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

    const finalOptions = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    };

    const doFetch = () => fetch(url, finalOptions);

    let res = await doFetch();
    let data = null;

    try {
        data = await res.json();
    } catch (e) {
        // si pas de JSON, ce n'est pas grave
    }

    // Si la requête a échoué
    if (!res.ok) {
        // 1️⃣ Access token expiré : 401 / 419 -> on essaie de refresh
        if (res.status === 401 || res.status === 419) {
            try {
                await refreshSession();  // tente de renouveler la session

                // On rejoue la requête avec les mêmes options
                res = await doFetch();
                data = null;
                try {
                    data = await res.json();
                } catch (e) {}

            } catch (e) {
                // Le refresh a échoué : session vraiment expirée
                handleSessionExpired();
                throw new Error("Session expirée");
            }

            // Après refresh, si c’est encore 401/419 : session expirée
            if (res.status === 401 || res.status === 419) {
                handleSessionExpired();
                throw new Error("Session expirée");
            }
        }

        // 2️⃣ Autres erreurs (400, 403, 500, ...)
        if (!res.ok) {
            const message = data?.error || data?.message || "Erreur serveur";
            throw new Error(message);
        }
    }

    // Succès
    return data;
}



document.addEventListener("DOMContentLoaded", () => {
  let selectedConcours = null;

  const step1Section = document.getElementById("step1Section");
  const step2Section = document.getElementById("step2Section");

  const concoursTable = document.getElementById("concoursTable");
  const nextStepBtn = document.getElementById("nextStepBtn");

  const selectedConcoursLabel = document.getElementById("selectedConcoursLabel");
  const selectedFaculteLabel = document.getElementById("selectedFaculteLabel");
  const selectedDepartementLabel = document.getElementById("selectedDepartementLabel");
  const selectedSpecialiteLabel = document.getElementById("selectedSpecialiteLabel");

  const fileDropZone = document.getElementById("fileDropZone");
  const excelInput = document.getElementById("excelInput");
  const fileInfo = document.getElementById("fileInfo");
  const loadCandidatesBtn = document.getElementById("loadCandidatesBtn");
  const candidatsTableBody = document.getElementById("candidatsTableBody");
  const validateSendBtn = document.getElementById("validateSendBtn");
  const statusZone = document.getElementById("statusZone");

  const progressBarInner = document.getElementById("importProgress");


   async function loadConcoursAccueil() {
    tableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="4">
          <i class="uil uil-spinner-alt"></i>
          Chargement des concours...
        </td>
      </tr>
    `;
     if (!user || !user.idUser) {
        console.warn("Aucun utilisateur trouvé dans localStorage → redirection login");
        window.location.href = "/login.html";
        return;
    }

    try {
      const res = await fetch(`${API_BASE}/concours/vicedoyen/${idUser}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {}

      if (!res.ok) {
        const message =
          data?.error || data?.message || "Erreur lors du chargement des concours";
        throw new Error(message);
      }

      const list = data.data || data;

      tableBody.innerHTML = "";

      if (!Array.isArray(list) || list.length === 0) {
        tableBody.innerHTML = `
          <tr class="empty-row">
            <td colspan="4">Aucun concours trouvé pour ce vice-doyen.</td>
          </tr>
        `;
        return;
      }

      list.forEach((c) => {
     
        const libelle =  c.nom_concours || "Concours";
        const faculte = c.nom_faculte  || "-";
        const departement = c.nom_departement  || "-";
        const dateConcours =
          c.date_concours ||
          "—"; 

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${libelle}</td>
          <td>${faculte}</td>
          <td>${departement}</td>
          <td>${dateConcours}</td>
        `;
        tableBody.appendChild(tr);
      });

      showToast("Concours chargés avec succès.", "success");
    } catch (err) {
      console.error("Erreur chargement concours accueil:", err);
      tableBody.innerHTML = `
        <tr class="error-row">
          <td colspan="4">
            Erreur lors du chargement des concours : ${err.message}
          </td>
        </tr>
      `;
      showToast(err.message || "Erreur lors du chargement des concours.", "error");
    }
  }

 
  loadConcoursAccueil();

 async function loadConcours() {
    const tbody = concoursTable.querySelector("tbody");
    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem("dg-user"));

    if (!user || !user.idUser) {
        console.warn("Aucun utilisateur trouvé dans localStorage → redirection login");
        window.location.href = "/login.html";
        return;
    }

    const idUser = user.idUser;  // 👈 le vrai id du vice doyen

    tbody.innerHTML = `
      <tr class="loading-row">
        <td colspan="5">
          <i class="uil uil-spinner-alt"></i>
          Chargement des concours...
        </td>
      </tr>
    `;

    try {

        // ==========================
        // 🔥 APPEL API AVEC L’ID USER
        // ==========================
        const data = await fetchJson(`/concours/vicedoyen/${idUser}`, {
            method: "GET",
        });

        tbody.innerHTML = "";

        // La réponse backend était : { total, data: [...] }
        const list = data.data || data;

        if (!Array.isArray(list) || list.length === 0) {
            tbody.innerHTML = `
              <tr class="empty-row">
                <td colspan="5">Aucun concours disponible.</td>
              </tr>`;
            return;
        }

        list.forEach((c, index) => {
            const id = c.id_concours;
            const libelle = c.nom_councours;
            const faculte = c.nom_faculte;
            const departement = c.nom_departement;
            const specialite = c.nom_specialite;

            const tr = document.createElement("tr");
            tr.setAttribute("data-id", id);

            tr.innerHTML = `
              <td><input type="radio" name="concoursSelect" /></td>
              <td>${libelle}</td>
              <td>${faculte}</td>
              <td>${departement}</td>
              <td>${specialite}</td>
            `;

            tbody.appendChild(tr);
        });

        showToast("Concours chargés avec succès.", "success");

    } catch (err) {
        console.error("Erreur chargement concours :", err);
        if (tbody) {
            tbody.innerHTML = `
              <tr class="error-row">
                <td colspan="5">
                  Erreur lors du chargement des concours : ${err.message}
                </td>
              </tr>
            `;
        }
    }
}

  // appelle au chargement de la page
  loadConcours();

  // ======================================================
  // 2. SÉLECTION D’UN CONCOURS DANS LE TABLEAU
  // ======================================================
  concoursTable.addEventListener("change", (e) => {
    if (e.target && e.target.name === "concoursSelect") {
      const row = e.target.closest("tr");
      const id = row.getAttribute("data-id");
      const cells = row.querySelectorAll("td");

      selectedConcours = {
        id,
        concours: cells[1].textContent.trim(),
        faculte: cells[2].textContent.trim(),
        departement: cells[3].textContent.trim(),
        specialite: cells[4].textContent.trim(),
      };

      // style de la ligne sélectionnée
      [...concoursTable.querySelectorAll("tbody tr")].forEach((tr) =>
        tr.classList.remove("row-selected")
      );
      row.classList.add("row-selected");
    }
  });

  // ======================================================
  // 3. PASSAGE A L’ÉTAPE 2
  // ======================================================
  nextStepBtn.addEventListener("click", () => {
    console.log(selectedConcours);
    if (!selectedConcours) {
      showToast("Veuillez sélectionner un concours.", "error");
      return;
    }

    // cacher l'étape 1, afficher l'étape 2
    step1Section.classList.add("hidden");
    step2Section.classList.remove("hidden");

    // remplir le résumé du concours
    selectedConcoursLabel.textContent = `Concours : ${selectedConcours.concours}`;
    selectedFaculteLabel.textContent = `Faculté : ${selectedConcours.faculte}`;
    selectedDepartementLabel.textContent = `Département : ${selectedConcours.departement}`;
    selectedSpecialiteLabel.textContent = `Spécialité : ${selectedConcours.specialite}`;

    // barre de progression à 100 %
    if (progressBarInner) {
      progressBarInner.style.width = "100%";
    }

    showToast(
      "Concours sélectionné. Vous pouvez maintenant importer la liste des candidats.",
      "success"
    );
  });

  // ======================================================
  // 4. DRAG & DROP FICHIER EXCEL
  // ======================================================
  fileDropZone.addEventListener("click", () => excelInput.click());

  fileDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileDropZone.classList.add("drag-over");
  });

  fileDropZone.addEventListener("dragleave", () => {
    fileDropZone.classList.remove("drag-over");
  });

  fileDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    fileDropZone.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      excelInput.files = e.dataTransfer.files;
      handleFileChange();
    }
  });

  excelInput.addEventListener("change", handleFileChange);

  function handleFileChange() {
    const file = excelInput.files[0];
    if (!file) {
      fileInfo.textContent = "Aucun fichier sélectionné.";
      loadCandidatesBtn.disabled = true;
      return;
    }
    fileInfo.textContent = `${file.name} (${Math.round(
      file.size / 1024
    )} Ko)`;
    loadCandidatesBtn.disabled = false;
  }

  // ======================================================
  // 5. CHARGER LA LISTE DES CANDIDATS (lecture Excel côté front)
  // ======================================================
  loadCandidatesBtn.addEventListener("click", () => {
    const file = excelInput.files[0];

    if (!selectedConcours) {
      showToast("Veuillez d'abord sélectionner un concours.", "warning");
      return;
    }

    if (!file) {
      showToast("Veuillez sélectionner un fichier Excel.", "warning");
      return;
    }

    statusZone.innerHTML = `
      <p class="status-message">
        <i class="uil uil-spinner-alt"></i>
        Chargement de la liste...
      </p>
    `;

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: false,
        });

        const candidats = rows
          .map((row) => {
            let matricule = "";
            let nom = "";
            let prenom = "";
            let dateNaissance = "";

            for (const [key, value] of Object.entries(row)) {
              const k = key.toString().toLowerCase().trim();
              const v = (value ?? "").toString().trim();

              if (k.includes("matricule")) {
                matricule = v;
              } else if (k === "nom") {
                nom = v;
              } else if (k.includes("prenom") || k.includes("prénom")) {
                prenom = v;
              } else if (k.includes("date") && k.includes("naissance")) {
                dateNaissance = v;
              }
            }

            return { matricule, nom, prenom, dateNaissance };
          })
          .filter((c) => c.matricule && c.nom && c.prenom); // ignore lignes vides

        // Remplir le tableau
        candidatsTableBody.innerHTML = "";

        if (candidats.length === 0) {
          candidatsTableBody.innerHTML = `
            <tr class="empty-row">
              <td colspan="5">
                Aucun candidat trouvé dans le fichier. Vérifiez que la ligne d’en-tête contient :
                <strong>N°, Matricule, NOM, PRENOM, DATE DE NAISSANCE</strong>.
              </td>
            </tr>
          `;
          validateSendBtn.disabled = true;
          statusZone.innerHTML = `
            <p class="status-message warning">
              <i class="uil uil-exclamation-triangle"></i>
              Aucun candidat valide importé.
            </p>
          `;
          return;
        }

        candidats.forEach((c, index) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${c.nom}</td>
            <td>${c.prenom}</td>
            <td>${c.matricule}</td>
            <td>${c.dateNaissance || "-"}</td>
          `;
          candidatsTableBody.appendChild(tr);
        });

        validateSendBtn.disabled = false;
        statusZone.innerHTML = `
          <p class="status-message success" style="color: rgb(7, 172, 62);">
            <i class="uil uil-check-circle"></i>
            ${candidats.length} candidat(s) importé(s) depuis le fichier Excel.
          </p>
        `;
        showToast(
          "Liste des candidats chargée depuis le fichier Excel.",
          "success"
        );
      } catch (err) {
        console.error(err);
        statusZone.innerHTML = `
          <p class="status-message warning">
            <i class="uil uil-exclamation-triangle"></i>
            Erreur lors de la lecture du fichier. Vérifiez le format (.xls/.xlsx).
          </p>
        `;
        showToast("Erreur lors de la lecture du fichier Excel.", "danger");
      }
    };

    reader.readAsArrayBuffer(file);
  });

  // ======================================================
  // 6. VALIDATION / ENVOI AUX CHEFS DE DÉPARTEMENT
  // ======================================================
  validateSendBtn.addEventListener("click", async () => {
    if (!selectedConcours) {
      showToast("Aucun concours sélectionné.", "warning");
      return;
    }

    statusZone.innerHTML = `
      <p class="status-message">
        <i class="uil uil-spinner-alt"></i>
        Envoi en cours aux chefs de département...
      </p>
    `;

    // 👉 ICI tu peux faire un vrai POST vers ton backend, par ex :
    //
    // const candidats = [...candidatsTableBody.querySelectorAll("tr")].map(...);
    // await fetchJson("/import-candidats", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     idConcours: selectedConcours.id,
    //     candidats,
    //   }),
    // });
    //
    // pour l’instant je garde juste le setTimeout simulé :

    setTimeout(() => {
      statusZone.innerHTML = `
        <p class="status-message success">
          <i class="uil uil-check-circle"></i>
          Liste envoyée au chef de département.
        </p>
      `;
      showToast("Liste envoyée au chef de département.", "success");
      validateSendBtn.disabled = true;
    }, 1000);
  });
});