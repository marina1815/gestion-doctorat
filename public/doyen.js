
document.addEventListener("DOMContentLoaded", () => {


    const API_BASE = "http://localhost:4000";

    // Helper générique avec cookies + gestion d’erreur
    async function fetchJson(url, options = {}) {
        const finalOptions = {
            credentials: "include",             // 🔐 important pour les cookies de session
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        };

        const res = await fetch(url, finalOptions);

        if (!res.ok) {
            let message = "Erreur serveur";
            try {
                const data = await res.json();
                message = data.error || data.message || message;
            } catch (_) { }
            throw new Error(message);
        }

        return res.json();
    }


    const calDays = document.getElementById("calDays");
    const calMonthLabel = document.getElementById("calMonthLabel");
    const calTodayLabel = document.getElementById("calTodayLabel");
    const btnPrev = document.getElementById("calPrev");
    const btnNext = document.getElementById("calNext");

    let current = new Date();   // mois affiché

    // formatte "Aujourd'hui : mercredi 5 mars 2025"
    function updateTodayLabel() {
        const now = new Date();
        const label = now.toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        calTodayLabel.textContent = "Aujourd'hui : " + label;
    }

    function renderCalendar() {
        const year = current.getFullYear();
        const month = current.getMonth(); // 0-11

        // Titre mois + année
        calMonthLabel.textContent = current.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        calDays.innerHTML = "";

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();

        // JS: 0 = dimanche, 1 = lundi, ... | on veut LUNDI en premier
        let startIndex = firstDay.getDay(); // 0-6
        // adapter pour que lundi = 0, mardi = 1, ..., dimanche = 6
        startIndex = (startIndex + 6) % 7;

        // Cases vides avant le 1er
        for (let i = 0; i < startIndex; i++) {
            const empty = document.createElement("div");
            empty.className = "cal-day cal-day-empty";
            calDays.appendChild(empty);
        }

        const today = new Date();

        for (let d = 1; d <= totalDays; d++) {
            const cell = document.createElement("div");
            cell.className = "cal-day";
            cell.textContent = d;

            // est-ce aujourd'hui ?
            if (
                d === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
            ) {
                cell.classList.add("cal-day-today");
            }

            calDays.appendChild(cell);
        }
    }

    btnPrev.addEventListener("click", () => {
        current.setMonth(current.getMonth() - 1);
        renderCalendar();
    });

    btnNext.addEventListener("click", () => {
        current.setMonth(current.getMonth() + 1);
        renderCalendar();
    });

    // initialisation
    renderCalendar();
    updateTodayLabel();

    /* =========================
       TOASTS
       ========================= */
    const toastArea = document.getElementById("toastArea");

    function showToast(message, type = "info", duration = 3000) {
        if (!toastArea) {
            // fallback si la zone n'existe pas
            alert(message);
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toastArea.appendChild(toast);

        // apparition
        requestAnimationFrame(() => {
            toast.classList.add("toast-visible");
        });

        // disparition auto
        setTimeout(() => {
            toast.classList.remove("toast-visible");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ===== SEXE : toggle Femme / Homme pour CFD =====
    const sexeHidden = document.getElementById("sexeMembre");
    const sexeToggle = document.getElementById("sexeToggle");

    if (sexeHidden && sexeToggle) {
        const sexButtons = sexeToggle.querySelectorAll(".sex-option");

        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";

                // 1) mettre à jour le hidden
                sexeHidden.value = value;

                // 2) switch visuel active
                sexButtons.forEach((b) =>
                    b.classList.toggle(
                        "sex-option-active",
                        b === btn
                    )
                );
            });
        });
    }

    /* ===== NAVIGATION SIDEBAR + PIPELINE ===== */
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const views = document.querySelectorAll(".view");

    // Ordre logique des étapes du concours
    const stepOrder = ["cfd", "sujet", "correcteurs", "anonymat", "surveillants", "pv"];
    const pipelineSteps = document.querySelectorAll(".pipeline-step[data-step]");

    function updatePipeline(viewName) {
        if (!pipelineSteps.length) return;

        // Si la vue n'est pas une étape, on enlève les états
        if (!stepOrder.includes(viewName)) {
            pipelineSteps.forEach(step => {
                step.classList.remove("pipeline-step-active", "pipeline-step-done");
            });
            return;
        }

        const activeIndex = stepOrder.indexOf(viewName);

        pipelineSteps.forEach(step => {
            const stepName = step.dataset.step;
            const index = stepOrder.indexOf(stepName);

            step.classList.remove("pipeline-step-active", "pipeline-step-done");
            if (index === -1) return;

            if (index < activeIndex) {
                step.classList.add("pipeline-step-done");
            } else if (index === activeIndex) {
                step.classList.add("pipeline-step-active");
            }
        });
    }

    function showView(viewName) {
        // afficher/masquer les vues
        views.forEach(v =>
            v.classList.toggle("view-active", v.dataset.view === viewName)
        );

        // activer l'item de la sidebar
        navItems.forEach(i =>
            i.classList.toggle("nav-item-active", i.dataset.view === viewName)
        );

        // mettre à jour le pipeline
        updatePipeline(viewName);
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.dataset.view;
            showView(target);
        });
    });

    // Tous les boutons / steps avec data-go-view (pipeline)
    document.querySelectorAll("[data-go-view]").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-go-view");
            showView(target);
        });
    });

    /* ===== MODALS ===== */
    const modalCfd = document.getElementById("modalCfdMembre");
    const btnOpenModalCfdMembre = document.getElementById("btnOpenModalCfdMembre");

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add("modal-open");
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove("modal-open");
    }

    // Bouton + pour ouvrir la modale CFD
    if (btnOpenModalCfdMembre) {
        btnOpenModalCfdMembre.addEventListener("click", () => {
            formCfdMembre.reset();

            // reset sexe par défaut : FEMME
            if (sexeHidden && sexeToggle) {
                sexeHidden.value = "FEMME";
                sexeToggle.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle(
                        "sex-option-active",
                        btn.dataset.sexValue === "FEMME"
                    );
                });
            }

            openModal(modalCfd);
        });
    }

    // Tout élément avec data-close-modal ferme la modale parente
    document.querySelectorAll("[data-close-modal]").forEach(el => {
        el.addEventListener("click", () => {
            const m = el.closest(".modal");
            closeModal(m);
        });
    });

    /* ===== ÉTAT FRONT CFD ===== */
    // Représente les lignes de la table "membres" côté front
    let cfdMembers = [];

    const cfdMembersBody = document.getElementById("cfdMembersBody");
    const cfdResponsableSelect = document.getElementById("cfdResponsableSelect");
    const cfdCount = document.getElementById("cfdCount");
    const cfdSearchInput = document.getElementById("cfdSearchInput");
    const formCfdMembre = document.getElementById("formCfdMembre");

    // Ouverture modale membre CFD (sécurité)
    if (btnOpenModalCfdMembre && formCfdMembre) {
        btnOpenModalCfdMembre.addEventListener("click", () => {
            formCfdMembre.reset();

            // reset sexe : FEMME
            if (sexeHidden && sexeToggle) {
                sexeHidden.value = "FEMME";
                sexeToggle.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle(
                        "sex-option-active",
                        btn.dataset.sexValue === "FEMME"
                    );
                });
            }

            openModal(modalCfd);
        });
    }

    // Soumission création membre CFD (table membres)
    if (formCfdMembre) {
        formCfdMembre.addEventListener("submit", (e) => {
            e.preventDefault();

            const nomFr = document.getElementById("nomMembreFr").value.trim();
            const prenomFr = document.getElementById("prenomMembreFr").value.trim();
            const nomAr = document.getElementById("nomMembreAr").value.trim();
            const prenomAr = document.getElementById("prenomMembreAr").value.trim();
            const grade = document.getElementById("gradeMembre").value.trim();
            const sexe = document.getElementById("sexeMembre").value;

            if (!nomFr || !prenomFr) {
                showToast("Nom et prénom (FR) sont obligatoires.", "warning");
                return;
            }

            // côté backend ce sera gen_random_uuid(), ici on simule
            const idMembre = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-m";

            cfdMembers.push({
                idMembre,
                nomFr,
                prenomFr,
                nomAr,
                prenomAr,
                role: ""
            });

            renderCfdMembers();
           
            closeModal(modalCfd);
            showToast("Membre CFD ajouté.", "success");
        });
    }

    // Rendu de la table + combo responsable
    function renderCfdMembers() {
        if (!cfdMembersBody || !cfdResponsableSelect) return;

        // filtre recherche
        const search = (cfdSearchInput?.value || "").toLowerCase();

        cfdMembersBody.innerHTML = "";
        cfdResponsableSelect.innerHTML = '<option value="">-- Sélectionner un membre CFD --</option>';

        let displayIndex = 0;

        cfdMembers.forEach((m) => {
            const fullNameFr = `${m.nomFr} ${m.prenomFr}`.toLowerCase();
            const fullNameAr = `${m.prenomAr || ""} ${m.nomAr || ""}`.toLowerCase();

            if (search && !fullNameFr.includes(search) && !fullNameAr.includes(search)) {
                return;
            }

            displayIndex += 1;

            const tr = document.createElement("tr");
            tr.innerHTML = `
      <td>${displayIndex}</td>
      <td>${m.nomFr} ${m.prenomFr}</td>
      <td dir="rtl">${(m.prenomAr || "")} ${(m.nomAr || "")}</td>
      <td>
        <select class="cfd-role-select" data-id="${m.idMembre}">
          <option value="">-- Rôle --</option>
          <option value="PRESIDENT" ${m.role === "PRESIDENT" ? "selected" : ""}>رئيس / Président</option>
          <option value="MEMBRE" ${m.role === "MEMBRE" ? "selected" : ""}>عضو / Membre</option>
          <option value="RAPPORTEUR" ${m.role === "RAPPORTEUR" ? "selected" : ""}>مقرر / Rapporteur</option>
        </select>
      </td>
      <td class="table-actions">
        <button class="btn-icon btn-icon-danger" data-remove="${m.idMembre}">
          <i class="uil uil-trash"></i>
        </button>
      </td>
    `;
            cfdMembersBody.appendChild(tr);

            // option dans la liste des responsables possibles
            const opt = document.createElement("option");
            opt.value = m.idMembre;
            opt.textContent = `${m.nomFr} ${m.prenomFr}`;
            cfdResponsableSelect.appendChild(opt);
        });

        if (cfdCount) cfdCount.textContent = String(cfdMembers.length);

        // suppression
        cfdMembersBody.querySelectorAll("[data-remove]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idMembre = btn.getAttribute("data-remove");
                cfdMembers = cfdMembers.filter((m) => m.idMembre !== idMembre);
                renderCfdMembers();
                showToast("Membre CFD supprimé.", "danger");
            });
        });

        // 🆕 gestion du changement de rôle
        cfdMembersBody.querySelectorAll(".cfd-role-select").forEach((select) => {
            select.addEventListener("change", () => {
                const id = select.dataset.id;
                const roleValue = select.value;
                const member = cfdMembers.find((m) => m.idMembre === id);
                if (member) {
                    member.role = roleValue;
                    // plus tard : envoyer au backend
                }
            });
        });
    }
    if (cfdSearchInput) {
        cfdSearchInput.addEventListener("input", renderCfdMembers);
    }

    renderCfdMembers(); // initial (liste vide)

    /* ===== CORRECTEURS : membres + users (role CORRECTEUR) ===== */
    let correcteurs = [];

    const correcteursBody = document.getElementById("correcteursBody");
    const modalCorrecteur = document.getElementById("modalCorrecteur");
    const btnOpenModalCorrecteur = document.getElementById("btnOpenModalCorrecteur");
    const formCorrecteur = document.getElementById("formCorrecteur");
    const sexeCorrHidden = document.getElementById("sexeCorrecteur");
    const sexeToggleCorr = document.getElementById("sexeToggleCorrecteur");

    // Toggle sexe correcteur
    if (sexeCorrHidden && sexeToggleCorr) {
        const sexButtons = sexeToggleCorr.querySelectorAll(".sex-option");
        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeCorrHidden.value = value;
                sexButtons.forEach((b) =>
                    b.classList.toggle("sex-option-active", b === btn)
                );
            });
        });
    }

    // Ouvrir la modale correcteur
    if (btnOpenModalCorrecteur && formCorrecteur) {
        btnOpenModalCorrecteur.addEventListener("click", () => {
            formCorrecteur.reset();

            // reset sexe = FEMME
            if (sexeCorrHidden && sexeToggleCorr) {
                sexeCorrHidden.value = "FEMME";
                sexeToggleCorr.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle(
                        "sex-option-active",
                        btn.dataset.sexValue === "FEMME"
                    );
                });
            }

            openModal(modalCorrecteur);
        });
    }

    // Soumission création correcteur : membre + user (role = CORRECTEUR)
    if (formCorrecteur) {
        formCorrecteur.addEventListener("submit", (e) => {
            e.preventDefault();

            const nomFr = document.getElementById("corrNomFr").value.trim();
            const prenomFr = document.getElementById("corrPrenomFr").value.trim();
            const nomAr = document.getElementById("corrNomAr").value.trim();
            const prenomAr = document.getElementById("corrPrenomAr").value.trim();
            const grade = document.getElementById("corrGrade").value.trim();
            const sexe = document.getElementById("sexeCorrecteur").value;
            const email = document.getElementById("corrEmail").value.trim();


            if (!nomFr || !prenomFr) {
                showToast("Nom, prénom  et mot de passe sont obligatoires.", "warning");
                return;
            }

            const idMembre = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-m";
            const idUser = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-u";

            correcteurs.push({
                idMembre,
                idUser,
                nomFr,
                prenomFr,
                nomAr,
                prenomAr,
                grade,
                sexe,
                email,
                role: "CORRECTEUR"
            });

            // TODO backend : POST /correcteurs

            renderCorrecteurs();
            closeModal(modalCorrecteur);
            showToast("Correcteur ajouté.", "success");
        });
    }

    function renderCorrecteurs() {
        if (!correcteursBody) return;
        correcteursBody.innerHTML = "";

        correcteurs.forEach((c, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${c.nomFr} ${c.prenomFr}</td>
            <td>${c.grade || ""}</td>
            <td>${c.email || ""}</td>
            <td class="table-actions">
              <button class="btn-icon btn-icon-danger" data-remove-corr="${c.idUser}">
                <i class="uil uil-trash"></i>
              </button>
            </td>
          `;
            correcteursBody.appendChild(tr);
        });

        correcteursBody.querySelectorAll("[data-remove-corr]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idUser = btn.getAttribute("data-remove-corr");
                correcteurs = correcteurs.filter((c) => c.idUser !== idUser);
                renderCorrecteurs();
                showToast("Correcteur supprimé.", "danger");
            });
        });
    }

    renderCorrecteurs();

    /* ===== CELLULE D'ANONYMAT : user + lien cellule_anonymat ===== */
  // ===== CELLULE D'ANONYMAT : user + lien cellule_anonymat =====
let anonymatMembers = [];

const anonymatBody         = document.getElementById("anonymatBody");
const modalAnonymat        = document.getElementById("modalAnonymat");
const btnOpenModalAnonymat = document.getElementById("btnOpenModalAnonymat");
const formAnonymat         = document.getElementById("formAnonymat");
const sexeAnonyHidden      = document.getElementById("sexeAnonymat");
const sexeToggleAnony      = document.getElementById("sexeToggleAnonymat");
const cfdConcoursSelect  = document.getElementById("cfdConcoursSelect");
const btn                  = document.getElementById("logoutBtn");

async function loadAnonymatConcoursOptions() {
  console.log(">>> loadAnonymatConcoursOptions() appelée");

  if (!cfdConcoursSelect) {
    console.warn("anonyConcoursSelect est null, vérifie l'id dans le HTML");
    return;
  }

  try {
    // 1) Récupération user dans localStorage
    const userJson = localStorage.getItem("dg-user");
    let idUser = null;

    if (userJson) {
      const user = JSON.parse(userJson);
      idUser = user.idUser; // ton objet a bien { idUser: "..." }
    }

    if (!idUser) {
      console.warn("Aucun idUser dans localStorage");
      showToast("Utilisateur non identifié.", "warning");
      return;
    }

    console.log("ID USER DOYEN =", idUser);

    // 2) Appel API
    const response = await fetchJson(`${API_BASE}/concours/doyen/${idUser}`);
    console.log("Réponse brute concours doyen =", response);

    // Réponse = soit un tableau, soit { data: [...], total: ... }
    const concoursList = Array.isArray(response) ? response : (response.data || []);
    console.log("concoursList utilisée pour remplir le select =", concoursList);

    // 3) Reset du select
    cfdConcoursSelect.innerHTML =
      '<option value="">-- Sélectionne ncours --</option>';

    if (!concoursList.length) {
      console.warn("Aucun concours à afficher dans le select");
      return;
    }

    // 4) Boucle sur les concours
    concoursList.forEach((c, idx) => {
      console.log(`Concours[${idx}] =`, c);

      // On gère plusieurs noms de champs possibles
      const idConcours  = c.id_concours  ?? c.idConcours;
      const nomConcours = c.nom_councours ?? c.nomConcours ?? c.nom_concours;

      console.log("idConcours =", idConcours);
      console.log("nomConcours =", nomConcours);

      const opt = document.createElement("option");
      opt.value = idConcours || "";
      opt.textContent = nomConcours || "Concours";

      // 🟢 IMPORTANT : on ajoute l'option au select
      cfdConcoursSelect.appendChild(opt);
    });

    console.log(
      "Nombre final d'options dans #anonyConcoursSelect =",
      cfdConcoursSelect.options.length
    );
  } catch (err) {
    console.error("Erreur chargement concours anonymat:", err);
    showToast("Impossible de charger les concours pour l’anonymat.", "error");
  }
}

// appel après la définition
loadAnonymatConcoursOptions();




    if (sexeAnonyHidden && sexeToggleAnony) {
        const sexButtons = sexeToggleAnony.querySelectorAll(".sex-option");
        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeAnonyHidden.value = value;
                sexButtons.forEach((b) =>
                    b.classList.toggle("sex-option-active", b === btn)
                );
            });
        });
    }

    // Ouvrir modale anonymat
    if (btnOpenModalAnonymat && formAnonymat) {
        btnOpenModalAnonymat.addEventListener("click", () => {
            formAnonymat.reset();
            if (sexeAnonyHidden && sexeToggleAnony) {
                sexeAnonyHidden.value = "FEMME";
                sexeToggleAnony.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle(
                        "sex-option-active",
                        btn.dataset.sexValue === "FEMME"
                    );
                });
            }
            openModal(modalAnonymat);
        });
    }

    // Soumission création membre anonymat
    if (formAnonymat) {
        formAnonymat.addEventListener("submit", (e) => {
            e.preventDefault();

            const concoursId = anonyConcoursSelect.value;
            const concoursLabel =
                anonyConcoursSelect.options[anonyConcoursSelect.selectedIndex]?.text || "";

            const nomFr = document.getElementById("anonyNomFr").value.trim();
            const prenomFr = document.getElementById("anonyPrenomFr").value.trim();
            const grade = document.getElementById("anonyGrade").value.trim();
            const sexe = document.getElementById("sexeAnonymat").value;
            const email = document.getElementById("anonyEmail").value.trim();

            if (!concoursId) {
                showToast("Veuillez sélectionner un concours.", "warning");
                return;
            }
            if (!nomFr || !prenomFr) {
                showToast("Nom, prénom sont obligatoires.", "warning");
                return;
            }

            // Respect de la contrainte UNIQUE(id_concours)
            if (anonymatMembers.some((m) => m.concoursId === concoursId)) {
                showToast("Une cellule d’anonymat est déjà définie pour ce concours.", "danger");
                return;
            }

            const idMembre = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-m";
            const idUser = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-u";
            const idCellule = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-ca";

            anonymatMembers.push({
                idCellule,
                concoursId,
                concoursLabel,
                idMembre,
                idUser,
                nomFr,
                prenomFr,
                grade,
                sexe,
                email,

                role: "CELLULE_ANONYMAT"
            });

            renderAnonymat();
            closeModal(modalAnonymat);
            showToast("Membre anonymat ajouté.", "success");
        });
    }

    function renderAnonymat() {
        if (!anonymatBody) return;
        anonymatBody.innerHTML = "";

        anonymatMembers.forEach((m, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${m.concoursLabel}</td>
            <td>${m.nomFr} ${m.prenomFr}</td>
           
            <td>${m.email || ""}</td>
            <td class="table-actions">
              <button class="btn-icon btn-icon-danger" data-remove-anony="${m.idCellule}">
                <i class="uil uil-trash"></i>
              </button>
            </td>
          `;
            anonymatBody.appendChild(tr);
        });

        anonymatBody.querySelectorAll("[data-remove-anony]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idCellule = btn.getAttribute("data-remove-anony");
                anonymatMembers = anonymatMembers.filter((m) => m.idCellule !== idCellule);
                renderAnonymat();
                showToast("Membre anonymat supprimé.", "danger");
            });
        });
    }

    renderAnonymat();

    /* ===== RESPONSABLE CFD : création user (table users) ===== */
    const formCfdResponsable = document.getElementById("formCfdResponsable");

    if (formCfdResponsable) {
        formCfdResponsable.addEventListener("submit", (e) => {
            e.preventDefault();

            const concoursId = document.getElementById("cfdConcoursSelect").value;
            const membreId = document.getElementById("cfdResponsableSelect").value;
            const email = document.getElementById("cfdRespEmail").value.trim();

            if (!concoursId) {
                showToast("Veuillez sélectionner un concours.", "warning");
                return;
            }
            if (!membreId) {
                showToast("Veuillez sélectionner le membre CFD responsable.", "warning");
                return;
            }


            console.log("Créer responsable CFD :", {
                concoursId,
                membreId,
                email,
                role: "CFD"
            });

            showToast("Responsable CFD enregistré (simulation front).", "success");
            formCfdResponsable.reset();
        });
    }

    /* ===== PV : génération simple + impression ===== */
    const pvTexteAr = document.getElementById("pvTexteAr");
    const btnRegenererPv = document.getElementById("btnRegenererPv");
    const btnImprimerPv = document.getElementById("btnImprimerPv");
    const btnValiderPv = document.getElementById("btnValiderPv");


    if (btnRegenererPv && pvTexteAr) {
        btnRegenererPv.addEventListener("click", () => {
            const concoursLabel = "مسابقة الدكتوراه";
            const dateDecision = document.getElementById("pvDateDecision").value || "....";
            const numDecision = document.getElementById("pvNumDecision").value || "…/…/…";

            pvTexteAr.value =
                `بمقتضى القوانين والتنظيمات السارية، 
وبناء على محاضر لجان التكوين في الدكتوراه (CFD) ولجان التصحيح والترتيب،
يقرر ما يلي:

المادة 1: يعلن عن نتائج مسابقة الالتحاق بالتكوين في الطور الثالث (دكتوراه) بعنوان السنة الجامعية ${concoursLabel}.
المادة 2: تضبط قائمة المترشحين الناجحين نهائيا كما هو مبين في الملحق المرفق بهذا المقرر.
المادة 3: يكلف السيد/السيدة عميد الكلية بتنفيذ هذا المقرر الذي يسري ابتداء من تاريخ ${dateDecision} 
تحت رقم ${numDecision}.

يمكنك تعديل هذا النص قبل الطباعة.`;
            showToast("نص المقرر أُعيد توليده.", "info");
        });
    }

    if (btnImprimerPv) {
        btnImprimerPv.addEventListener("click", () => {
            window.print();
            showToast("Ouverture de la boîte de dialogue d’impression.", "info");
        });
    }

    if (btnValiderPv) {
        btnValiderPv.addEventListener("click", () => {
            showToast("PV validé (plus tard : sauvegarde + génération PDF).", "success");
        });
    }


    showView("home");

    // ====== GRAPHIQUE : Répartition des candidats par faculté ======
    function initFaculteChart() {
        const canvas = document.getElementById("chartFaculte");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        const labels = [
            "Sciences Exactes",
            "Sciences & Technologie",
            "Génie Civil",
            "Chimie",
            "Lettres & Langues"
        ];

        const dataValues = [450, 340, 235, 155, 120];

        const colors = [
            "#4f46e5", // bleu
            "#a855f7", // violet
            "#f97316", // orange
            "#ec4899", // rose
            "#22c55e"  // vert
        ];

        // Optionnel : un léger gradient vertical pour chaque barre
        const backgroundColors = colors.map((c) => {
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, c);
            grad.addColorStop(1, c + "33"); // couleur + transparence
            return grad;
        });

        new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Nombre de candidats",
                        data: dataValues,
                        backgroundColor: backgroundColors,
                        borderRadius: 10,
                        borderSkipped: false,
                        maxBarThickness: 40
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 10, right: 10, left: 0, bottom: 0 }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: "#111827",
                        titleFont: { size: 12, weight: "600" },
                        bodyFont: { size: 11 },
                        padding: 10,
                        cornerRadius: 10
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 40,
                            minRotation: 40,
                            font: { size: 11 }
                        },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 50,
                            font: { size: 11 }
                        },
                        grid: {
                            color: "#e5e7eb"
                        }
                    }
                },
                animation: {
                    duration: 900,
                    easing: "easeOutQuart",
                    delay: (ctx) => {
                        // petite animation échelonnée barre par barre
                        let delay = 0;
                        if (ctx.type === "data" && ctx.mode === "default") {
                            delay = ctx.dataIndex * 120;
                        }
                        return delay;
                    }
                }
            }
        });
    }

    // Appel après tout le reste
    initFaculteChart();
});
