document.addEventListener("DOMContentLoaded", () => {
  // Helpers pour modales
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("show");
  }

  function closeModal(el) {
    const modal = el.closest(".modal");
    if (modal) modal.classList.remove("show");
  }

  // Boutons d'ouverture
  document.getElementById("btnAddTexte")?.addEventListener("click", () => {
    openModal("modalTexte");
  });

  document.getElementById("btnAddComite")?.addEventListener("click", () => {
    openModal("modalComite");
  });

  document.getElementById("btnAddMembre")?.addEventListener("click", () => {
    openModal("modalEnseignant");
  });

  // Fermeture sur [x], bouton Annuler, et backdrop
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn));
  });

  // Exemple : empêcher le submit réel pour l'instant
  document.getElementById("formOrganisation")?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Infos générales enregistrées (à connecter au backend).");
  });
});



document.addEventListener("DOMContentLoaded", () => {
  // --- ÉTAT LOCAL (front seulement) ---
  let cfd = {
    libelleFr: "Conseil de formation doctorale",
    libelleAr: "مجلس التكوين في الدكتوراه",
  };
  let cfdMembres = []; // {id, nomFr, nomAr, grade, fonction}

  const formCfd = document.getElementById("formCfd");
  const cfdLibelleFrInput = document.getElementById("cfdLibelleFr");
  const cfdLibelleArInput = document.getElementById("cfdLibelleAr");
  const btnAddCfdMembre = document.getElementById("btnAddCfdMembre");
  const cfdMembresBody = document.getElementById("cfdMembresBody");

  const modalCfd = document.getElementById("modalCfdMembre");
  const formCfdMembre = document.getElementById("formCfdMembre");

  const cfdNomFrInput = document.getElementById("cfdNomFr");
  const cfdNomArInput = document.getElementById("cfdNomAr");
  const cfdGradeSelect = document.getElementById("cfdGrade");
  const cfdFonctionSelect = document.getElementById("cfdFonction");

  // ---------- Helpers UI ----------
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("modal-open");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("modal-open");
  }

  // Fermer les modals quand on clique sur data-close-modal
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => {
      const modal = el.closest(".modal");
      closeModal(modal);
    });
  });

  // ---------- CFD : sauvegarde du libellé ----------
  if (formCfd) {
    formCfd.addEventListener("submit", (e) => {
      e.preventDefault();
      cfd.libelleFr = cfdLibelleFrInput.value.trim() || cfd.libelleFr;
      cfd.libelleAr = cfdLibelleArInput.value.trim() || cfd.libelleAr;

      // Ici tu pourras appeler ton API plus tard
      // ex: fetch("/api/comites", { method: "POST", body: JSON.stringify(...)})

      // Petit feedback (si tu as déjà une fonction showToast tu peux l'utiliser)
      console.log("CFD enregistré :", cfd);
      alert("CFD enregistré (front seulement pour l'instant).");
    });
  }

  // ---------- CFD : ouverture du modal d'ajout de membre ----------
  if (btnAddCfdMembre) {
    btnAddCfdMembre.addEventListener("click", () => {
      // reset formulaire
      formCfdMembre.reset();
      openModal(modalCfd);
    });
  }

  // ---------- CFD : ajout d'un membre ----------
  if (formCfdMembre) {
    formCfdMembre.addEventListener("submit", (e) => {
      e.preventDefault();

      const nomFr = cfdNomFrInput.value.trim();
      const nomAr = cfdNomArInput.value.trim();
      const grade = cfdGradeSelect.value;
      const fonction = cfdFonctionSelect.value;

      if (!nomFr) {
        alert("Veuillez saisir le nom & prénom en français.");
        return;
      }

      const newMembre = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        nomFr,
        nomAr,
        grade,
        fonction,
      };

      cfdMembres.push(newMembre);
      renderCfdMembres();
      closeModal(modalCfd);
    });
  }

  // ---------- CFD : rendu du tableau des membres ----------
  function renderCfdMembers() {
  if (!cfdMembersBody || !cfdResponsableSelect) return;

  cfdMembersBody.innerHTML = "";
  cfdResponsableSelect.innerHTML = '<option value="">-- Sélectionner un membre CFD --</option>';

  cfdMembers.forEach((m, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${m.nomFr} ${m.prenomFr}</td>
      <td dir="rtl">${(m.prenomAr || "")} ${(m.nomAr || "")}</td>
      <td>${m.grade || ""}</td>
      <td>${m.sexe}</td>
      <td>${m.username}</td>
      <td>${m.email || ""}</td>
      <td class="table-actions">
        <button class="btn-icon btn-icon-danger" data-remove="${m.idUser}">
          <i class="uil uil-trash"></i>
        </button>
      </td>
    `;
    cfdMembersBody.appendChild(tr);

    const opt = document.createElement("option");
    opt.value = m.idUser;
    opt.textContent = `${m.nomFr} ${m.prenomFr} (${m.username})`;
    cfdResponsableSelect.appendChild(opt);
  });

  // 🔢 compteur en haut
  const cfdCountSpan = document.getElementById("cfdCount");
  if (cfdCountSpan) {
    cfdCountSpan.textContent = cfdMembers.length.toString();
  }

  cfdMembersBody.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idUser = btn.getAttribute("data-remove");
      cfdMembers = cfdMembers.filter(m => m.idUser !== idUser);
      renderCfdMembers();
    });
  });
}