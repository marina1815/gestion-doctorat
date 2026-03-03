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

    /* =========================
       CALENDRIER
       ========================= */
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

    /* =========================
       SEXE : toggle Femme / Homme pour CFD
       ========================= */
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

    /* =========================
       NAVIGATION SIDEBAR + PIPELINE
       ========================= */
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

        // 🆕 quand on ouvre la vue CFD, on s'assure que le doyen est chargé
        if (viewName === "cfd") {
            loadDoyenForCfd();
        }
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

    /* =========================
       MODALS
       ========================= */
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

    // Tout élément avec data-close-modal ferme la modale parente
    document.querySelectorAll("[data-close-modal]").forEach(el => {
        el.addEventListener("click", () => {
            const m = el.closest(".modal");
            closeModal(m);
        });
    });

    /* =========================
       ÉTAT FRONT CFD
       ========================= */
    // Représente les lignes de la table "membres" côté front
    let cfdMembers = [];

    const cfdResponsableSelect = document.getElementById("cfdResponsableSelect");
    const cfdCount = document.getElementById("cfdCount");
    const cfdSearchInput = document.getElementById("cfdSearchInput");
    const formCfdMembre = document.getElementById("formCfdMembre");
    const cfdMembersBody = document.getElementById("cfdMembersBody");
    const cfdRoleSelect = document.getElementById("cfdRoleSelect");

    // 🆕 Charger automatiquement le doyen comme premier membre CFD
    let doyenLoaded = false;

    function getDepartementsArList() {
        const saved = JSON.parse(localStorage.getItem("dg-concours") || "{}");
        if (Array.isArray(saved.departementsAr) && saved.departementsAr.length > 0) {
            return saved.departementsAr;
        }
        return [""];
    }

    // Libellé AR pour un rôle CFD (pour l'affichage)
    function getRoleLabelArForMember(member) {
        if (member.isDoyen) {
            return "عميد الكلية";
        }
        if (!member.role) return "";

        const [type, dept] = member.role.split("::");
        const d = dept || "......";

        switch (type) {
            case "CHEF_DEPT":
                return `رئيس قسم ${d}`;
            case "VICE_CHEF_DEPT_PG":
                return `مساعد رئيس قسم ${d} المكلف بما بعد التدرج والبحث العلمي`;
            case "RESP_CFD":
                return `مسؤول لجنة التكوين في الدكتوراه لقسم ${d}`;
            case "MEMBRE_CFD":
                return `عضو في لجنة التكوين في الدكتوراه لقسم ${d}`;
            default:
                return "";
        }
    }

    // Options de rôle pour la MODALE (pas dans le tableau)
    function buildCfdRoleOptionsHtml(currentRole = "") {
        const departements = getDepartementsArList();
        let optionsHtml = `<option value="">-- اختر الدور --</option>`;

        departements.forEach((dept) => {
            const combos = [
                {
                    type: "CHEF_DEPT",
                    label: `رئيس قسم ${dept}`
                },
                {
                    type: "VICE_CHEF_DEPT_PG",
                    label: `مساعد رئيس قسم ${dept} المكلف بما بعد التدرج والبحث العلمي`
                },
                {
                    type: "RESP_CFD",
                    label: `مسؤول لجنة التكوين في الدكتوراه لقسم ${dept}`
                },
                {
                    type: "MEMBRE_CFD",
                    label: `عضو في لجنة التكوين في الدكتوراه لقسم ${dept}`
                }
            ];

            combos.forEach((combo) => {
                const value = `${combo.type}::${dept}`;
                const isSelected = (currentRole === value) ? "selected" : "";
                optionsHtml += `
                    <option value="${value}" ${isSelected}>
                        ${combo.label}
                    </option>
                `;
            });
        });

        return optionsHtml;
    }

    async function loadDoyenForCfd() {
        if (doyenLoaded) return; // éviter les doublons si on revient sur la vue CFD

        try {
            const userJson = localStorage.getItem("dg-user");
            if (!userJson) {
                console.warn("dg-user absent du localStorage");
                return;
            }

            const user = JSON.parse(userJson);
            const idMembre = user.idMembre;   // adapte si besoin

            if (!idMembre) {
                console.warn("Aucun idMembre dans dg-user");
                return;
            }

            const membre = await fetchJson(`${API_BASE}/membres/${idMembre}`);

            const nomFr = membre.nomMembre || "";
            const prenomFr = membre.prenomMembre || "";
            const nomAr = membre.nomAr || membre.nom_ar || "";
            const prenomAr = membre.prenomAr || membre.prenom_ar || "";

            cfdMembers.unshift({
                idMembre,
                nomFr,
                prenomFr,
                nomAr,
                prenomAr,
                role: "عميد الكلية",           // pas besoin, isDoyen gère le libellé
                isDoyen: true,
                grade: "رئيس",
            });

            doyenLoaded = true;
            renderCfdMembers();
        } catch (err) {
            console.error("Erreur chargement doyen CFD :", err);
            showToast("Impossible de charger les informations du doyen.", "error");
        }
    }

    // Ouvrir la modale membre CFD
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

            // remplir les rôles à partir des départements
            if (cfdRoleSelect) {
                cfdRoleSelect.innerHTML = buildCfdRoleOptionsHtml("");
            }

            openModal(modalCfd);
        });
    }

    /* ===== Soumission création membre CFD ===== */
    if (formCfdMembre) {
        formCfdMembre.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nomFr = document.getElementById("nomMembreFr").value.trim();
            const prenomFr = document.getElementById("prenomMembreFr").value.trim();
            const nomAr = document.getElementById("nomMembreAr").value.trim();
            const prenomAr = document.getElementById("prenomMembreAr").value.trim();
            const grade = document.getElementById("gradeMembre").value.trim();
            const sexe = document.getElementById("sexeMembre").value;
            const roleValue = cfdRoleSelect ? cfdRoleSelect.value : "";

            if (!nomFr || !prenomFr) {
                showToast("Nom et prénom (FR) sont obligatoires.", "warning");
                return;
            }

            if (!roleValue) {
                showToast("يجب اختيار الدور في لجنة التكوين في الدكتوراه.", "warning");
                return;
            }

            const btnCfd = document.getElementById("btnCfd");
            if (btnCfd) {
                btnCfd.disabled = true;
                btnCfd.textContent = "Enregistrement...";
            }

            const payload = {
                nomMembre: nomFr,
                prenomMembre: prenomFr,
                nomAr: nomAr,
                prenomAr: prenomAr,
                grade: grade,
                sexe: sexe
            };

            let idMembre = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-m";

            try {
                const created = await fetchJson(`${API_BASE}/membres`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                if (created && (created.idMembre || created.id_membre)) {
                    idMembre = created.idMembre || created.id_membre;
                }
            } catch (err) {
                console.error("Erreur POST /membres :", err);
                showToast("Erreur lors de l'enregistrement côté serveur. Le membre est ajouté seulement côté front.", "error");
            }

            const newMember = {
                idMembre,
                nomFr,
                prenomFr,
                nomAr,
                prenomAr,
                role: roleValue,
                isDoyen: false,           // 🔴 ce n’est pas le doyen
                grade: "عضو",
            };

            // état front
            cfdMembers.push(newMember);

            // localStorage dg-concours.membreCfd
            try {
                let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");
                if (!Array.isArray(concours.membreCfd)) {
                    concours.membreCfd = [];
                }
                concours.membreCfd.push(newMember);
                localStorage.setItem("dg-concours", JSON.stringify(concours));
            } catch (err) {
                console.error("Erreur localStorage dg-concours.membreCfd :", err);
            }

            renderCfdMembers();
            closeModal(modalCfd);
            showToast("Membre CFD ajouté.", "success");

            if (btnCfd) {
                btnCfd.disabled = false;
                btnCfd.textContent = "Enregistrer le membre CFD";
            }
        });
    }

    // Rendu de la table + combo responsable
    function renderCfdMembers() {
        if (!cfdMembersBody || !cfdResponsableSelect) return;

        const search = (cfdSearchInput?.value || "").toLowerCase();

        cfdMembersBody.innerHTML = "";
        cfdResponsableSelect.innerHTML =
            '<option value="">-- Sélectionner un membre CFD --</option>';

        let displayIndex = 0;

        cfdMembers.forEach((m) => {
            const fullNameFr = `${m.nomFr} ${m.prenomFr}`.toLowerCase();
            const fullNameAr = `${m.prenomAr || ""} ${m.nomAr || ""}`.toLowerCase();

            if (search && !fullNameFr.includes(search) && !fullNameAr.includes(search)) {
                return;
            }

            displayIndex += 1;

            const isDoyen = !!m.isDoyen;

            let roleCellHtml;
            if (isDoyen) {
                roleCellHtml = `<span dir="rtl">عميد الكلية (رئيس اللجنة)</span>`;
            } else {
                const roleLabel = getRoleLabelArForMember(m) || "";
                roleCellHtml = `<span dir="rtl">${roleLabel}</span>`;
            }

            const actionsCellHtml = isDoyen
                ? ""
                : `
        <button class="btn-icon btn-icon-danger" data-remove="${m.idMembre}">
          <i class="uil uil-trash"></i>
        </button>
      `;

            const tr = document.createElement("tr");
            tr.innerHTML = `
      <td>${displayIndex}</td>
      <td>${m.nomFr} ${m.prenomFr}</td>
      <td dir="rtl">${(m.prenomAr || "")} ${(m.nomAr || "")}</td>
      <td>${roleCellHtml}</td>
      <td class="table-actions">
        ${actionsCellHtml}
      </td>
    `;
            cfdMembersBody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = m.idMembre;
            opt.textContent = `${m.nomFr} ${m.prenomFr}`;
            cfdResponsableSelect.appendChild(opt);
        });

        if (cfdCount) cfdCount.textContent = String(cfdMembers.length);

        // suppression (le doyen n’a pas de bouton, donc pas concerné)
        cfdMembersBody.querySelectorAll("[data-remove]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idMembre = btn.getAttribute("data-remove");
                cfdMembers = cfdMembers.filter((m) => m.idMembre !== idMembre);
                renderCfdMembers();
                showToast("Membre CFD supprimé.", "danger");
            });
        });

        // 🔸 plus de .cfd-role-select ici (rôle choisi seulement dans la modale)
    }

    /* =========================
       RESPONSABLE CFD : sélection dans le select
       ========================= */
    const selectResponsable = document.getElementById("cfdResponsableSelect");
    const inputEmailResp = document.getElementById("cfdRespEmail");
    const inputUsernameResp = document.getElementById("cfdRespUsername");
    const inputPasswordResp = document.getElementById("cfdRespPassword");

    if (selectResponsable) {
        selectResponsable.addEventListener("change", () => {
            const idMembre = selectResponsable.value;

            if (!idMembre) {
                if (inputUsernameResp) inputUsernameResp.value = "";
                if (inputPasswordResp) inputPasswordResp.value = "";
                if (inputEmailResp) inputEmailResp.value = "";
                return;
            }

            const membre = cfdMembers.find(m => m.idMembre === idMembre);
            if (!membre) return;

            const nom = membre.nomFr || "";
            const prenom = membre.prenomFr || "";

            const username = `${nom}.${prenom}`.replace(/\s+/g, "").toLowerCase();
            const password = `${nom}_${prenom}_CFD`;

            if (inputUsernameResp) inputUsernameResp.value = username;
            if (inputPasswordResp) inputPasswordResp.value = password;

            if (inputEmailResp && !inputEmailResp.value.trim()) {
                inputEmailResp.value = `${username}@univ.dz`;
            }
        });
    }

    if (cfdSearchInput) {
        cfdSearchInput.addEventListener("input", renderCfdMembers);
    }

    renderCfdMembers(); // initial (liste vide, puis doyen au premier accès à CFD)

    /* =========================
       IMPRESSION TABLEAU MEMBRES CFD
       ========================= */
    const btnPrintCfdMembers = document.getElementById("btnPrintCfdMembers");
    const pvPrintArea = document.getElementById("pvPrintArea");

    /* =========================
       CORRECTEURS : membres + users (role CORRECTEUR)
       ========================= */
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
                showToast("Nom, prénom et email sont obligatoires.", "warning");
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

    /* =========================
       CELLULE D'ANONYMAT : user + lien cellule_anonymat
       ========================= */
    let anonymatMembers = [];

    const anonymatBody = document.getElementById("anonymatBody");
    const modalAnonymat = document.getElementById("modalAnonymat");
    const btnOpenModalAnonymat = document.getElementById("btnOpenModalAnonymat");
    const formAnonymat = document.getElementById("formAnonymat");
    const sexeAnonyHidden = document.getElementById("sexeAnonymat");
    const sexeToggleAnony = document.getElementById("sexeToggleAnonymat");
    const cfdConcoursSelect = document.getElementById("cfdConcoursSelect");

    async function loadAnonymatConcoursOptions() {
        console.log(">>> loadAnonymatConcoursOptions() appelée");

        if (!cfdConcoursSelect) {
            console.warn("cfdConcoursSelect est null, vérifie l'id dans le HTML");
            return;
        }

        try {
            const userJson = localStorage.getItem("dg-user");
            let idUser = null;

            if (userJson) {
                const user = JSON.parse(userJson);
                idUser = user.idUser;
            }

            if (!idUser) {
                console.warn("Aucun idUser dans localStorage");
                showToast("Utilisateur non identifié.", "warning");
                return;
            }

            console.log("ID USER DOYEN =", idUser);

            const response = await fetchJson(`${API_BASE}/concours/doyen/${idUser}`);
            console.log("Réponse brute concours doyen =", response);

            const concoursList = Array.isArray(response) ? response : (response.data || []);
            console.log("concoursList utilisée pour remplir le select =", concoursList);

            cfdConcoursSelect.innerHTML =
                '<option value="">-- Sélectionne concours --</option>';

            if (!concoursList.length) {
                console.warn("Aucun concours à afficher dans le select");
                return;
            }

            concoursList.forEach((c, idx) => {
                console.log(`Concours[${idx}] =`, c);

                const idConcours = c.id_concours ?? c.idConcours;
                const nomConcours = c.nom_councours ?? c.nomConcours ?? c.nom_concours;

                const opt = document.createElement("option");
                opt.value = idConcours || "";
                opt.textContent = nomConcours || "Concours";

                cfdConcoursSelect.appendChild(opt);
            });

            console.log(
                "Nombre final d'options dans #cfdConcoursSelect =",
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

            const concoursId = cfdConcoursSelect.value;
            const concoursLabel =
                cfdConcoursSelect.options[cfdConcoursSelect.selectedIndex]?.text || "";

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

            if (anonymatMembers.some((m) => m.concoursId === concoursId)) {
                showToast("Une cellule d’anonymat est déjà définie pour ce concours.", "danger");
                return;
            }

            const idMembre = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-م";
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
            showToast("مembre anonymat ajouté.", "success");
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

    /* =========================
       RESPONSABLE CFD : création user (/users) + CFD (/cfds)
       ========================= */
    const formCfdResponsable = document.getElementById("formCfdResponsable");

    if (formCfdResponsable) {
        formCfdResponsable.addEventListener("submit", async (e) => {
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
            if (!email) {
                showToast("Veuillez saisir l'email du responsable CFD.", "warning");
                return;
            }

            // 🔹 on récupère le membre choisi
            const membre = cfdMembers.find((m) => m.idMembre === membreId);
            const nomFr = membre?.nomFr || "";
            const prenomFr = membre?.prenomFr || "";
            const idMembre = membreId;

            let username = inputUsernameResp?.value.trim();
            let password = inputPasswordResp?.value.trim();

            if (!username) {
                username = (nomFr && prenomFr)
                    ? `${nomFr}.${prenomFr}`.replace(/\s+/g, "").toLowerCase()
                    : email.split("@")[0];
            }
            if (!password) {
                password = (nomFr && prenomFr)
                    ? `${nomFr}_${prenomFr}_CFD`
                    : `CFD_${Date.now()}`;
            }

            const submitBtn = formCfdResponsable.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Enregistrement...";
            }

            let idUser = null;

            try {
                // 1) Création user
                const userPayload = {
                    username,
                    email,
                    password,
                    role: "CFD",
                    idMembre,
                };

                const createdUser = await fetchJson(`${API_BASE}/users`, {
                    method: "POST",
                    body: JSON.stringify(userPayload)
                });

                idUser = createdUser.user.idUser;
                if (!idUser) {
                    throw new Error("idUser manquant dans la réponse de /users");
                }

                // 2) Lien CFD
                const cfdPayload = {
                    idUser,
                    idMembre: membreId,
                    idConcours: concoursId,
                    role: "CFD"
                };

                await fetchJson(`${API_BASE}/cfds`, {
                    method: "POST",
                    body: JSON.stringify(cfdPayload)
                });

                // 3) Sauvegarde localStorage
                try {
                    let concoursStore = JSON.parse(localStorage.getItem("dg-concours") || "{}");

                    concoursStore.cfdResponsable = {
                        idConcours: concoursId,
                        idMembre: membreId,
                        idUser,
                        email,
                        username
                    };

                    localStorage.setItem("dg-concours", JSON.stringify(concoursStore));
                } catch (errLs) {
                    console.error("Erreur localStorage cfdResponsable :", errLs);
                }

                showToast("Responsable CFD enregistré et compte utilisateur créé.", "success");
                formCfdResponsable.reset();
            } catch (err) {
                console.error("Erreur création responsable CFD :", err);
                showToast("Erreur lors de la création du responsable CFD.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Enregistrer responsable CFD";
                }
            }
        });
    }


    btnSaveFaculte.addEventListener("click", () => {
        const faculte = {
            nomFaculte: document.getElementById("infoNomFaculteAr").value,

        };

        localStorage.setItem("dg-faculte", JSON.stringify({
            faculte
        }));
        showToast("Enregistrée avec succès.", "success");

    });










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

        const backgroundColors = colors.map((c) => {
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, c);
            grad.addColorStop(1, c + "33");
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
                    legend: { display: false },
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

    initFaculteChart();

    /* =========================
       DÉPARTEMENTS AR (localStorage.dg-concours.departementsAr)
       ========================= */
    const inputDeptAr = document.getElementById("newDepartementAr");
    const btnAddDeptAr = document.getElementById("btnAddDepartementAr");
    const p = document.getElementById("paragraph");
    const list = document.getElementById("departementList");

    // Ajouter un département
    if (btnAddDeptAr) {
        btnAddDeptAr.addEventListener("click", () => {
            const value = inputDeptAr.value.trim();
            if (!value) return;

            let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");

            if (!Array.isArray(concours.departementsAr)) {
                concours.departementsAr = [];
            }

            if (!concours.departementsAr.includes(value)) {
                concours.departementsAr.push(value);
            }

            localStorage.setItem("dg-concours", JSON.stringify(concours));

            renderDepartementsAr(concours.departementsAr);
            if (p) p.style.display = "block";
            inputDeptAr.value = "";
        });
    }

    function renderDepartementsAr(listArray) {
        if (!list) return;

        list.innerHTML = "";

        listArray.forEach((dpt, idx) => {
            const li = document.createElement("li");

            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "6px 10px";
            li.style.marginBottom = "6px";
            li.style.border = "1px solid #e5e7eb";
            li.style.borderRadius = "8px";
            li.style.background = "#fafafa";
            li.style.fontFamily = "'Cairo','Tajawal'";
            li.style.fontSize = "15px";

            li.innerHTML = `
            <span>${dpt}</span>
            <button class="deleteDeptBtn"
                data-index="${idx}"
                style="
                    background:none;
                    border:none;
                    cursor:pointer;
                    color:#dc2626;
                    font-size:20px;
                ">
                <i class="uil uil-trash-alt"></i>
            </button>
        `;

            list.appendChild(li);
        });

        document.querySelectorAll(".deleteDeptBtn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = btn.getAttribute("data-index");

                let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");
                if (!Array.isArray(concours.departementsAr)) return;

                concours.departementsAr.splice(idx, 1);

                localStorage.setItem("dg-concours", JSON.stringify(concours));

                renderDepartementsAr(concours.departementsAr);

                if (concours.departementsAr.length === 0 && p) {
                    p.style.display = "none";
                }
            });
        });
    }

    // Charger départements au démarrage
    const saved = JSON.parse(localStorage.getItem("dg-concours") || "{}");
    if (Array.isArray(saved.departementsAr) && saved.departementsAr.length > 0) {
        renderDepartementsAr(saved.departementsAr);
        if (p) p.style.display = "block";
    }

    /* =========================
       IMPRESSION : TABLEAU MEMBRES CFD
       ========================= */
    // ⚠️ Partie impression conservée telle quelle
    if (btnPrintCfdMembers && pvPrintArea) {
        btnPrintCfdMembers.addEventListener("click", () => {
            console.log("🖨️ Click sur btnPrintCfdMembers");

            if (!cfdMembers || cfdMembers.length === 0) {
                showToast("لا يوجد أعضاء في لجنة الإشراف CFD للطباعة.", "warning");
                console.warn("cfdMembers est vide");
                return;
            }

            // 🔹 Récupérer le grand texte arabe (infosTexteAr)
            const ARtextArea = document.getElementById("infosTexteAr");
            const ARtext = ARtextArea ? ARtextArea.value.trim() : "";

            // Nettoyer la zone d’impression
            pvPrintArea.innerHTML = "";

            // ====== Feuille A4 ======
            const sheet = document.createElement("div");
            sheet.className = "pv-sheet"; // style dans le CSS (voir en bas)
            sheet.style.direction = "rtl";
            sheet.style.fontFamily = "'Cairo','Tajawal','Times New Roman',serif";
            sheet.style.fontSize = "11pt";
            sheet.style.lineHeight = "1.9";
            const title = document.createElement("h3");
            const faculteAR = JSON.parse(localStorage.getItem("dg-faculte"));
            let faculteARar = faculteAR.faculte.nomFaculte;

            title.textContent = `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n`;
            title.style.textAlign = "center";
            title.style.margin = "10px 0 14px";
            title.style.fontSize = "11px";
            title.style.fontWeight = "700";
            sheet.appendChild(title);

            const title2 = document.createElement("h3");
            title2.textContent = "إنشاء لجنة الإشراف على مسابقة الدكتوراه";
            title2.style.textAlign = "center";
            title2.style.margin = "10px 0 14px";
            title2.style.fontSize = "16px";
            title2.style.fontStyle = "bold";
            title2.style.fontWeight = "700";
            sheet.appendChild(title2);

            // ====== Texte arabe du PV (corps du décret) ======
            if (ARtext) {
                const p = document.createElement("p");
                p.style.whiteSpace = "pre-wrap";
                p.style.marginBottom = "20px";
                p.style.textAlign = "justify";
                p.textContent = ARtext;
                sheet.appendChild(p);
            }

            // ====== Titre de la partie "membres" ======
            const p1 = document.createElement("p");
            p1.style.whiteSpace = "pre-wrap";
            p1.style.marginBottom = "20px";
            p1.style.textAlign = "justify";
            p1.style.direction = "rtl";   // important pour l'arabe
            p1.style.fontFamily = "Cairo, 'Tajawal', sans-serif"; // propre et lisible
            p1.textContent = `المادة الأولى: تنشأ لجنة الإشراف على مسابقة الدكتوراه للسنة الجامعية 2022-2023.
المادة الثانية: تشكل هذه اللجنة من السادة الأساتذة التالية أسماؤهم:`;


            // ====== Tableau des membres ======
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.marginTop = "4px";
            table.style.border = "1px solid #000";

            function makeTh(text) {
                const th = document.createElement("th");
                th.textContent = text;
                th.style.border = "1px solid #000";
                th.style.padding = "6px 8px";
                th.style.textAlign = "center";
                th.style.fontWeight = "600";
                th.style.backgroundColor = "#f3f4f6";
                return th;
            }

            function makeTd(text) {
                const td = document.createElement("td");
                td.textContent = text;
                td.style.border = "1px solid #000";
                td.style.padding = "6px 6px";
                td.style.textAlign = "right";
                return td;
            }





            const tbody = document.createElement("tbody");

            const president = cfdMembers.find(m => m.isDoyen);
            const others = cfdMembers.filter(m => !m.isDoyen);

            function addMemberRow(member, isPresident) {
                const tr = document.createElement("tr");

                const nomAr =
                    `${member.nomAr || ""} ${member.prenomAr || ""}`.trim() ||
                    `${member.nomFr || ""} ${member.prenomFr || ""}`.trim();

                const grade = member.role || "";
                const fonction = isPresident ? "رئيسا" : "عضو";

                tr.appendChild(makeTd(nomAr));
                tr.appendChild(makeTd(grade));
                tr.appendChild(makeTd(fonction));



                tbody.appendChild(tr);
            }

            if (president) addMemberRow(president, true);
            others.forEach(m => addMemberRow(m, false));

            table.appendChild(tbody);
            sheet.appendChild(table);

            // ====== Footer (signature doyen) ======
            const footer = document.createElement("p");
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');

            const dateFormatted = `${yyyy}/${mm}/${dd}`;

            footer.textContent = `حرّر في: ${dateFormatted}`;
            footer.style.marginTop = "32px";
            footer.style.textAlign = "left";
            sheet.appendChild(footer);

            const footer2 = document.createElement("p");
            footer2.textContent = "عميد الكلية";
            footer2.style.marginTop = "50px";
            footer2.style.textAlign = "left";
            sheet.appendChild(footer2);


            pvPrintArea.appendChild(sheet);

            // Lancer l’impression
            window.print();
            showToast("Impression terminée.", "success");
            pvPrintArea.innerHTML = "";
        });
    } else {
        console.warn("btnPrintCfdMembers ou pvPrintArea introuvable");
    }

    if (btnPrintCorrecteursMembers && pvPrintArea) {
        btnPrintCorrecteursMembers.addEventListener("click", () => {
            console.log("🖨️ Click sur btnPrintCorrecteursMembers");

            if (!correcteurs || correcteurs.length === 0) {
                showToast("لا يوجد أعضاء في لجنة الإشراف CFD للطباعة.", "warning");
                console.warn("cfdMembers est vide");
                return;
            }

            // 🔹 Récupérer le grand texte arabe (infosTexteAr)
            const ARtextArea = document.getElementById("infosTexteAr");
            const ARtext = ARtextArea ? ARtextArea.value.trim() : "";

            // Nettoyer la zone d’impression
            pvPrintArea.innerHTML = "";

            // ====== Feuille A4 ======
            const sheet = document.createElement("div");
            sheet.className = "pv-sheet"; // style dans le CSS (voir en bas)
            sheet.style.direction = "rtl";
            sheet.style.fontFamily = "'Cairo','Tajawal','Times New Roman',serif";
            sheet.style.fontSize = "11pt";
            sheet.style.lineHeight = "1.9";
            const title = document.createElement("h3");
            const faculteAR = JSON.parse(localStorage.getItem("dg-faculte"));
            let faculteARar = faculteAR.faculte.nomFaculte;

            title.textContent = `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n`;
            title.style.textAlign = "center";
            title.style.margin = "10px 0 14px";
            title.style.fontSize = "11px";
            title.style.fontWeight = "700";
            sheet.appendChild(title);

            const title2 = document.createElement("h3");
            title2.textContent = "إنشاء لجنة المصححين على مسابقة الدكتوراه";
            title2.style.textAlign = "center";
            title2.style.margin = "10px 0 14px";
            title2.style.fontSize = "16px";
            title2.style.fontStyle = "bold";
            title2.style.fontWeight = "700";
            sheet.appendChild(title2);

            // ====== Texte arabe du PV (corps du décret) ======
            // ====== Texte arabe du PV (corps du décret) ======
            if (ARtext) {
                const p = document.createElement("p");
                p.style.whiteSpace = "pre-wrap";
                p.style.marginBottom = "20px";
                p.style.textAlign = "justify";
                p.textContent = ARtext;
                sheet.appendChild(p);
            }

            // ====== Titre de la partie "المصححين" ======
            const p1 = document.createElement("p");
            p1.style.whiteSpace = "pre-wrap";
            p1.style.marginBottom = "20px";
            p1.style.textAlign = "justify";
            p1.style.direction = "rtl";
            p1.style.fontFamily = "Cairo, 'Tajawal', sans-serif";
            const currentYear = new Date().getFullYear();
            const previousYear = currentYear - 1;
            const anneeUniversitaire = `${previousYear}-${currentYear}`;

            p1.textContent =
                `المادة الأولى: تُنشأ لجنة المصححين على مسابقة الدكتوراه للسنة الجامعية ${anneeUniversitaire}.
المادة الثانية: تُشكل هذه اللجنة من السادة الأساتذة التالية أسماؤهم:`;
            sheet.appendChild(p1);

            // ====== Tableau des المصححين ======
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.marginTop = "4px";
            table.style.border = "1px solid #000";



            function makeTd(text) {
                const td = document.createElement("td");
                td.textContent = text;
                td.style.border = "1px solid #000";
                td.style.padding = "6px 6px";
                td.style.textAlign = "right";
                return td;
            }



            // corps
            const tbody = document.createElement("tbody");

            // si tu veux exclure le doyen (au cas où il est dans la liste)
            const others = correcteurs.filter(m => !m.isDoyen);

            let rowIndex = 1;
            function addMemberRow(member) {
                const tr = document.createElement("tr");

                const nomAr =
                    `${member.nomAr || ""} ${member.prenomAr || ""}`.trim() ||
                    `${member.nomFr || ""} ${member.prenomFr || ""}`.trim();

                const sexe = (member.sexe || "").toUpperCase();
                const fonction = sexe === "FEMME" ? "مصححة" : "مصحح";
                const institution = "جامعة العلوم و التكنولوجيا محمد بوضياف";

                // colonne numéro
                const tdNum = makeTd(rowIndex.toString());
                tdNum.style.textAlign = "center";
                tr.appendChild(tdNum);

                tr.appendChild(makeTd(nomAr));
                tr.appendChild(makeTd(institution));
                tr.appendChild(makeTd(fonction));

                tbody.appendChild(tr);
                rowIndex++;
            }

            others.forEach(addMemberRow);

            table.appendChild(tbody);
            sheet.appendChild(table);

            // ====== Footer (signature doyen) ======
            const footer = document.createElement("p");
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');

            const dateFormatted = `${yyyy}/${mm}/${dd}`;

            footer.textContent = `حرّر في: ${dateFormatted}`;
            footer.style.marginTop = "32px";
            footer.style.textAlign = "left";
            sheet.appendChild(footer);

            const footer2 = document.createElement("p");
            footer2.textContent = "عميد الكلية";
            footer2.style.marginTop = "50px";
            footer2.style.textAlign = "left";
            sheet.appendChild(footer2);


            pvPrintArea.appendChild(sheet);

            // Lancer l’impression
            window.print();
            showToast("Impression terminée.", "success");
            pvPrintArea.innerHTML = "";
        });
    } else {
        console.warn("btnPrintCorrecteursMembers ou pvPrintArea introuvable");
    }



});