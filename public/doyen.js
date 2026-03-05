
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:4000";

    /* =========================
       FETCH JSON helper
       ========================= */
    async function fetchJson(url, options = {}) {
        const finalOptions = {
            credentials: "include",
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
       TOASTS
       ========================= */
    const toastArea = document.getElementById("toastArea");

    function showToast(message, type = "info", duration = 3000) {
        if (!toastArea) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toastArea.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("toast-visible"));

        setTimeout(() => {
            toast.classList.remove("toast-visible");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /* =========================
       CALENDRIER
       ========================= */
    const calDays = document.getElementById("calDays");
    const calMonthLabel = document.getElementById("calMonthLabel");
    const calTodayLabel = document.getElementById("calTodayLabel");
    const btnPrev = document.getElementById("calPrev");
    const btnNext = document.getElementById("calNext");

    let current = new Date();

    function updateTodayLabel() {
        if (!calTodayLabel) return;
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
        if (!calDays || !calMonthLabel) return;

        const year = current.getFullYear();
        const month = current.getMonth();

        calMonthLabel.textContent = current.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        calDays.innerHTML = "";

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();

        let startIndex = firstDay.getDay();
        startIndex = (startIndex + 6) % 7; // lundi=0

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

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            current.setMonth(current.getMonth() - 1);
            renderCalendar();
        });
    }
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            current.setMonth(current.getMonth() + 1);
            renderCalendar();
        });
    }

    renderCalendar();
    updateTodayLabel();

    /* =========================
       SEXE CFD TOGGLE
       ========================= */
    const sexeHidden = document.getElementById("sexeMembre");
    const sexeToggle = document.getElementById("sexeToggle");

    if (sexeHidden && sexeToggle) {
        const sexButtons = sexeToggle.querySelectorAll(".sex-option");
        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeHidden.value = value;
                sexButtons.forEach((b) =>
                    b.classList.toggle("sex-option-active", b === btn)
                );
            });
        });
    }

    /* =========================
       NAVIGATION + PIPELINE
       ========================= */
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const views = document.querySelectorAll(".view");

    const stepOrder = ["cfd", "sujet", "correcteurs", "anonymat", "surveillants", "pv"];
    const pipelineSteps = document.querySelectorAll(".pipeline-step[data-step]");

    function updatePipeline(viewName) {
        if (!pipelineSteps.length) return;

        if (!stepOrder.includes(viewName)) {
            pipelineSteps.forEach((step) => {
                step.classList.remove("pipeline-step-active", "pipeline-step-done");
            });
            return;
        }

        const activeIndex = stepOrder.indexOf(viewName);

        pipelineSteps.forEach((step) => {
            const stepName = step.dataset.step;
            const index = stepOrder.indexOf(stepName);

            step.classList.remove("pipeline-step-active", "pipeline-step-done");
            if (index === -1) return;

            if (index < activeIndex) step.classList.add("pipeline-step-done");
            else if (index === activeIndex) step.classList.add("pipeline-step-active");
        });
    }

    function showView(viewName) {
        views.forEach((v) =>
            v.classList.toggle("view-active", v.dataset.view === viewName)
        );

        navItems.forEach((i) =>
            i.classList.toggle("nav-item-active", i.dataset.view === viewName)
        );

        updatePipeline(viewName);

        if (viewName === "cfd"){
            loadAnonymatConcoursOptions();
            loadDoyenForCfd();} 
        if (viewName === "correcteurs") loadSpecialitesForCorrecteurs();
    }

    navItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            showView(item.dataset.view);
        });
    });

    document.querySelectorAll("[data-go-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-go-view");
            showView(target);
        });
    });

    /* =========================
       MODALS
       ========================= */
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add("modal-open");
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove("modal-open");
    }

    document.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", () => {
            const m = el.closest(".modal");
            closeModal(m);
        });
    });

    /* =========================
       CFD MEMBERS
       ========================= */
    let cfdMembers = [];

    const cfdResponsableSelect = document.getElementById("cfdResponsableSelect");
    const cfdCount = document.getElementById("cfdCount");
    const cfdSearchInput = document.getElementById("cfdSearchInput");
    const formCfdMembre = document.getElementById("formCfdMembre");
    const cfdMembersBody = document.getElementById("cfdMembersBody");
    const cfdRoleSelect = document.getElementById("cfdRoleSelect");

    let doyenLoaded = false;

    function getDepartementsArList() {
        const saved = JSON.parse(localStorage.getItem("dg-concours") || "{}");
        if (Array.isArray(saved.departementsAr) && saved.departementsAr.length > 0) {
            return saved.departementsAr;
        }
        return [""];
    }

    function getRoleLabelArForMember(member) {
        if (member.isDoyen) return "عميد الكلية";
        if (!member.role) return "";

        // si ton role est déjà une phrase AR (comme tu fais dans buildCfdRoleOptionsHtml),
        // on peut la renvoyer directement.
        return member.role;
    }

    function buildCfdRoleOptionsHtml(currentRole = "") {
        const departements = getDepartementsArList();
        let optionsHtml = `<option value="">-- اختر الدور --</option>`;

        departements.forEach((dept) => {
            const combos = [
                { label: `رئيس قسم ${dept}` },
                { label: `مساعد رئيس قسم ${dept} المكلف بما بعد التدرج والبحث العلمي` },
                { label: `مسؤول لجنة التكوين في الدكتوراه لقسم ${dept}` },
                { label: `عضو في لجنة التكوين في الدكتوراه لقسم ${dept}` },
            ];

            combos.forEach((combo) => {
                const value = combo.label;
                const isSelected = currentRole === value ? "selected" : "";
                optionsHtml += `<option value="${value}" ${isSelected}>${combo.label}</option>`;
            });
        });

        return optionsHtml;
    }

    async function loadDoyenForCfd() {
        if (doyenLoaded) return;

        try {
            const userJson = localStorage.getItem("dg-user");
            if (!userJson) return;

            const user = JSON.parse(userJson);
            const idMembre = user.idMembre;
            if (!idMembre) return;

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
                role: "عميد الكلية",
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

    const modalCfd = document.getElementById("modalCfdMembre");
    const btnOpenModalCfdMembre = document.getElementById("btnOpenModalCfdMembre");

    if (btnOpenModalCfdMembre && formCfdMembre) {
        btnOpenModalCfdMembre.addEventListener("click", () => {
            formCfdMembre.reset();

            if (sexeHidden && sexeToggle) {
                sexeHidden.value = "FEMME";
                sexeToggle.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
                });
            }

            if (cfdRoleSelect) cfdRoleSelect.innerHTML = buildCfdRoleOptionsHtml("");

            openModal(modalCfd);
        });
    }

    if (formCfdMembre) {
        formCfdMembre.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nomFr = document.getElementById("nomMembreFr")?.value.trim() || "";
            const prenomFr = document.getElementById("prenomMembreFr")?.value.trim() || "";
            const nomAr = document.getElementById("nomMembreAr")?.value.trim() || "";
            const prenomAr = document.getElementById("prenomMembreAr")?.value.trim() || "";
            const grade = document.getElementById("gradeMembre")?.value.trim() || "";
            const sexe = document.getElementById("sexeMembre")?.value || "FEMME";
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

            const payload = { nomMembre: nomFr, prenomMembre: prenomFr, nomAr, prenomAr, grade, sexe };

            let idMembre;

            try {
                const created = await fetchJson(`${API_BASE}/membres`, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                idMembre = created?.idMembre || created?.id_membre;
            } catch (err) {
                console.error("Erreur POST /membres :", err);
                showToast("Erreur serveur. Ajout seulement côté front.", "error");
            }

            const newMember = {
                idMembre,
                nomFr,
                prenomFr,
                nomAr,
                prenomAr,
                role: roleValue,
                isDoyen: false,
                grade: "عضو",
                sexe,
            };

            cfdMembers.push(newMember);

            try {
                let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");
                if (!Array.isArray(concours.membreCfd)) concours.membreCfd = [];
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

    function renderCfdMembers() {
        if (!cfdMembersBody || !cfdResponsableSelect) return;

        const search = (cfdSearchInput?.value || "").toLowerCase();
        cfdMembersBody.innerHTML = "";
        cfdResponsableSelect.innerHTML = '<option value="">-- Sélectionner un membre CFD --</option>';

        let displayIndex = 0;

        cfdMembers.forEach((m) => {
            const fullNameFr = `${m.nomFr} ${m.prenomFr}`.toLowerCase();
            const fullNameAr = `${m.prenomAr || ""} ${m.nomAr || ""}`.toLowerCase();
            if (search && !fullNameFr.includes(search) && !fullNameAr.includes(search)) return;

            displayIndex += 1;
            const isDoyen = !!m.isDoyen;

            const roleLabel = isDoyen ? "عميد الكلية (رئيس اللجنة)" : (getRoleLabelArForMember(m) || "");
            const actionsCellHtml = isDoyen
                ? ""
                : `<button class="btn-icon btn-icon-danger" data-remove="${m.idMembre}">
             <i class="uil uil-trash"></i>
           </button>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${displayIndex}</td>
        <td>${m.nomFr} ${m.prenomFr}</td>
        <td dir="rtl">${(m.prenomAr || "")} ${(m.nomAr || "")}</td>
        <td><span dir="rtl">${roleLabel}</span></td>
        <td class="table-actions">${actionsCellHtml}</td>
      `;
            cfdMembersBody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = m.idMembre;
            opt.textContent = `${m.nomFr} ${m.prenomFr}`;
            cfdResponsableSelect.appendChild(opt);
        });

        if (cfdCount) cfdCount.textContent = String(cfdMembers.length);

        cfdMembersBody.querySelectorAll("[data-remove]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idMembre = btn.getAttribute("data-remove");
                cfdMembers = cfdMembers.filter((m) => String(m.idMembre) !== String(idMembre));
                renderCfdMembers();
                showToast("Membre CFD supprimé.", "danger");
            });
        });
    }

    if (cfdSearchInput) cfdSearchInput.addEventListener("input", renderCfdMembers);
    renderCfdMembers();

    /* =========================
       RESPONSABLE CFD (select)
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

            const membre = cfdMembers.find((m) => String(m.idMembre) === String(idMembre));
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

    /* =========================
       CORRECTEURS
       ========================= */
    let correcteurs = [];

    const correcteursBody = document.getElementById("correcteursBody");
    const modalCorrecteur = document.getElementById("modalCorrecteur");
    const btnOpenModalCorrecteur = document.getElementById("btnOpenModalCorrecteur");
    const formCorrecteur = document.getElementById("formCorrecteur");
    const sexeCorrHidden = document.getElementById("sexeCorrecteur");
    const sexeToggleCorr = document.getElementById("sexeToggleCorrecteur");
    const selectSpecialite = document.getElementById("selectSpecialite");
    const inputSpecialiteAr = document.getElementById("inputSpecialiteAr");

    function getSelectedSpecialiteLabelFR() {
        if (!selectSpecialite) return "";
        return (selectSpecialite.options[selectSpecialite.selectedIndex]?.text || "").trim();
    }

    function getSelectedSpecialiteId() {
        if (!selectSpecialite) return "";
        return (selectSpecialite.value || "").trim();
    }

    function setArInputState(enabled) {
        if (!inputSpecialiteAr) return;
        inputSpecialiteAr.disabled = !enabled;
        if (!enabled) inputSpecialiteAr.value = "";
    }

    function getIdConcoursFromLS() {
        const raw = localStorage.getItem("dg-concours");
        if (!raw) return null;

        try {
            const obj = JSON.parse(raw);
            if (obj?.idConcours) return obj.idConcours;
            if (obj?.cfdResponsable?.idConcours) return obj.cfdResponsable.idConcours;
            return null;
        } catch (e) {
            console.error("dg-concours JSON invalide:", e);
            return null;
        }
    }

    async function loadSpecialitesForCorrecteurs() {
        if (!selectSpecialite) return;

        selectSpecialite.innerHTML = `<option value="">Chargement...</option>`;
        selectSpecialite.disabled = true;

        const idConcours = getIdConcoursFromLS();
        if (!idConcours) {
            selectSpecialite.innerHTML = `<option value="">Aucun concours trouvé</option>`;
            showToast("⚠️ dg-concours.idConcours introuvable", "warning");
            return;
        }

        try {
            const url = `${API_BASE}/specialites/concours/${encodeURIComponent(idConcours)}`;
            const data = await fetchJson(url, { method: "GET" });

            const list = Array.isArray(data) ? data : (data?.data || data?.specialites || []);

            selectSpecialite.innerHTML = `<option value="">Choisir une spécialité</option>`;

            if (!list.length) {
                selectSpecialite.innerHTML = `<option value="">Aucune spécialité</option>`;
                selectSpecialite.disabled = true;
                setArInputState(false);
                return;
            }

            list.forEach((sp) => {
                const opt = document.createElement("option");
                opt.value =
                    sp.idSpecialite || sp.id || sp.id_specialite || (sp.nomSpecialite || sp.nom || "");
                opt.textContent = sp.nomSpecialite || sp.nom || sp.libelle || "Spécialité";
                selectSpecialite.appendChild(opt);
            });

            const saved = localStorage.getItem("dg-selected-spec") || "";
            if (saved) selectSpecialite.value = saved;

            selectSpecialite.disabled = false;

            // update état input AR selon sélection
            const hasSelection = !!getSelectedSpecialiteId();
            setArInputState(hasSelection);
        } catch (err) {
            console.error("loadSpecialitesForCorrecteurs error:", err);
            selectSpecialite.innerHTML = `<option value="">Erreur chargement</option>`;
            selectSpecialite.disabled = true;
            setArInputState(false);
            showToast("❌ Impossible de charger les spécialités", "error");
        }
    }

    if (selectSpecialite && inputSpecialiteAr) {
        setArInputState(false);

        selectSpecialite.addEventListener("change", () => {
            const specId = getSelectedSpecialiteId();
            const specLabel = getSelectedSpecialiteLabelFR();
            if (!specId || !specLabel) {
                setArInputState(false);
                return;
            }
            localStorage.setItem("dg-selected-spec", specId); // ✅ on stocke l'ID (plus stable)
            setArInputState(true);
        });
    }

    // Toggle sexe correcteur
    if (sexeCorrHidden && sexeToggleCorr) {
        const sexButtons = sexeToggleCorr.querySelectorAll(".sex-option");
        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeCorrHidden.value = value;
                sexButtons.forEach((b) => b.classList.toggle("sex-option-active", b === btn));
            });
        });
    }

    // Ouvrir modale correcteur
    if (btnOpenModalCorrecteur && formCorrecteur) {
        btnOpenModalCorrecteur.addEventListener("click", () => {
            formCorrecteur.reset();

            if (sexeCorrHidden && sexeToggleCorr) {
                sexeCorrHidden.value = "FEMME";
                sexeToggleCorr.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
                });
            }

            openModal(modalCorrecteur);
        });
    }

    // Submit correcteur
    if (formCorrecteur) {
        formCorrecteur.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nomFr = document.getElementById("corrNomFr")?.value.trim() || "";
            const prenomFr = document.getElementById("corrPrenomFr")?.value.trim() || "";
            const nomAr = document.getElementById("corrNomAr")?.value.trim() || "";
            const prenomAr = document.getElementById("corrPrenomAr")?.value.trim() || "";
            const grade = document.getElementById("corrGrade")?.value.trim() || "";
            const sexe = document.getElementById("sexeCorrecteur")?.value || "FEMME";
            const idConcours = localStorage.getItem("dg-id");
            const specId = getSelectedSpecialiteId();
            const specLabelFR = getSelectedSpecialiteLabelFR();
            const specLabelAR = inputSpecialiteAr ? inputSpecialiteAr.value.trim() : "";

            if (!nomFr || !prenomFr) {
                showToast("Nom et prénom sont obligatoires.", "warning");
                return;
            }
            if (!specId) {
                showToast("Veuillez choisir une spécialité.", "warning");
                return;
            }
            console.log(idConcours);
            if(!idConcours){
                console.log(idConcours);
                showToast("Veuillez choisir un concours dans view CFD .", "warning");
                return;
            }

            const payload = { nomMembre: nomFr, prenomMembre: prenomFr, nomAr, prenomAr, grade, sexe };

            const submitBtn = formCorrecteur.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Enregistrement...";
            }

            let idMembre;

            try {
                // 1) create membre
                const created = await fetchJson(`${API_BASE}/membres`, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                idMembre = created?.idMembre || created?.id_membre;
                if (!idMembre) throw new Error("idMembre manquant dans la réponse /membres");

                // 2) generate username/password
                const username = `${nomFr}.${prenomFr}`.replace(/\s+/g, "").toLowerCase();
                const password = `${nomFr}_${prenomFr}_CORRECTEUR`;

                // 3) create user
                const userPayload = { username, password, role: "CORRECTEUR", idMembre };

                const createdUser = await fetchJson(`${API_BASE}/users`, {
                    method: "POST",
                    body: JSON.stringify(userPayload),
                });

                const idUser = createdUser?.user?.idUser || createdUser?.user?.id_user;
                if (!idUser) throw new Error("idUser manquant dans la réponse /users");

                const idSpec = localStorage.getItem("dg-selected-spec");
                

                const correcteurPayload = {
                    idUser,
                    idMembre,
                    idConcours,
                    idSpec
                };

                await fetchJson(`${API_BASE}/correcteurs`, {
                    method: "POST",
                    body: JSON.stringify(correcteurPayload),
                });

                correcteurs.push({
                    idMembre,
                    idUser,
                    nomFr,
                    prenomFr,
                    nomAr,
                    prenomAr,
                    grade,
                    sexe,
                    role: "CORRECTEUR",
                    specialiteId: specId,
                    specialiteFr: specLabelFR,
                    specialiteAr: specLabelAR,
                });

                renderCorrecteurs();
                closeModal(modalCorrecteur);
                showToast("Correcteur ajouté.", "success");
            } catch (err) {
                console.error("Erreur ajout correcteur:", err);
                showToast("Erreur lors de l'enregistrement côté serveur.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Enregistrer";
                }
            }
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
        <td>${c.specialiteFr || ""}</td>
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
                correcteurs = correcteurs.filter((c) => String(c.idUser) !== String(idUser));
                renderCorrecteurs();
                showToast("Correcteur supprimé.", "danger");
            });
        });
    }

    renderCorrecteurs();

    /* =========================
       ANONYMAT (inchangé sauf protections)
       ========================= */

    function buildAnonymatRoleOptionsHtml(currentRole = "") {
  const departements = getDepartementsArList();
  let optionsHtml = `<option value="">-- اختر الدور --</option>`;

  departements.forEach((dept) => {
    const roles = [
      { label: `مسؤول ${dept}` },
      { label: `عضو` }
    ];

    roles.forEach((role) => {
      const value = role.label;
      const isSelected = currentRole === value ? "selected" : "";
      optionsHtml += `<option value="${value}" ${isSelected}>${role.label}</option>`;
    });
  });

  return optionsHtml;
}
    let anonymatMembers = [];

    const anonymatBody = document.getElementById("anonymatBody");
    const modalAnonymat = document.getElementById("modalAnonymat");
    const btnOpenModalAnonymat = document.getElementById("btnOpenModalAnonymat");
    const formAnonymat = document.getElementById("formAnonymat");
    const sexeAnonyHidden = document.getElementById("sexeAnonymat");
    const sexeToggleAnony = document.getElementById("sexeToggleAnonymat");
    const cfdConcoursSelect = document.getElementById("cfdConcoursSelect");

   async function loadAnonymatConcoursOptions() {
  if (!cfdConcoursSelect) {
    return;
  }

  try {
    const userJson = localStorage.getItem("dg-user");
    let idUser = null;
    if (userJson) idUser = JSON.parse(userJson)?.idUser;

    if (!idUser) {
      showToast("Utilisateur non identifié.", "warning");
      return;
    }

    const response = await fetchJson(`${API_BASE}/concours/doyen/${idUser}`);
    const concoursList = Array.isArray(response) ? response : (response.data || []);

    cfdConcoursSelect.innerHTML = '<option value="">-- Sélectionne concours --</option>';

    concoursList.forEach((c) => {
      const idConcours = c.id_concours ?? c.idConcours;
      const nomConcours = c.nom_councours ?? c.nomConcours ?? c.nom_concours;

      const opt = document.createElement("option");
      opt.value = idConcours || "";
      opt.textContent = nomConcours || "Concours";
      cfdConcoursSelect.appendChild(opt);
    });

    // ✅ RESTORE après refresh
    const savedConcours = localStorage.getItem("dg-id");
    if (savedConcours) {
      cfdConcoursSelect.value = savedConcours;
    }

    // ✅ SAVE quand l'utilisateur change (évite doublons)
    if (!cfdConcoursSelect.dataset.bound) {
      cfdConcoursSelect.dataset.bound = "1";
      cfdConcoursSelect.addEventListener("change", () => {
        const concoursId = cfdConcoursSelect.value;
        if (!concoursId) {
          localStorage.removeItem("dg-id");
          return;
        }
        localStorage.setItem("dg-id", concoursId);
      });
    }

  } catch (err) {
    console.error("Erreur chargement concours anonymat:", err);
    showToast("Impossible de charger les concours pour l’anonymat.", "error");
  }
}

    loadAnonymatConcoursOptions();



if (cfdConcoursSelect) {

  // 🔹 restaurer la sélection sauvegardée
  const savedConcours = localStorage.getItem("dg-id");
  if (savedConcours) {
    cfdConcoursSelect.value = savedConcours;
  }

  // 🔹 écouter le changement
  cfdConcoursSelect.addEventListener("change", () => {
    const concoursId = cfdConcoursSelect.value;

    if (!concoursId) {
      localStorage.removeItem("dg-id"); // rien sélectionné
      return;
    }

    // sauvegarder l'id du concours
    localStorage.setItem("dg-id", concoursId);
  });

}

    if (sexeAnonyHidden && sexeToggleAnony) {
        const sexButtons = sexeToggleAnony.querySelectorAll(".sex-option");
        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeAnonyHidden.value = value;
                sexButtons.forEach((b) => b.classList.toggle("sex-option-active", b === btn));
            });
        });
    }

    const anonymatRoleSelect = document.getElementById("anonymatRoleSelect");
    if (btnOpenModalAnonymat && formAnonymat) {
        btnOpenModalAnonymat.addEventListener("click", () => {
            formAnonymat.reset();
            if (sexeAnonyHidden && sexeToggleAnony) {
                sexeAnonyHidden.value = "FEMME";
                sexeToggleAnony.querySelectorAll(".sex-option").forEach((btn) => {
                    btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
                });
            }
            if (anonymatRoleSelect) anonymatRoleSelect.innerHTML = buildAnonymatRoleOptionsHtml("");
            openModal(modalAnonymat);
        });
    }

    if (formAnonymat) {
        formAnonymat.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!cfdConcoursSelect) {

                return;
            }

            const concoursId = cfdConcoursSelect.value;
            const concoursLabel = cfdConcoursSelect.options[cfdConcoursSelect.selectedIndex]?.text || "";

            const nomFr = document.getElementById("anonyNomFr")?.value.trim() || "";
            const prenomFr = document.getElementById("anonyPrenomFr")?.value.trim() || "";
            const nomAr = document.getElementById("anonyNomAr")?.value.trim() || "";
            const prenomAr = document.getElementById("anonyPrenomAr")?.value.trim() || "";
            const grade = document.getElementById("anonyGrade")?.value.trim() || "";
            const sexe = document.getElementById("sexeAnonymat")?.value || "FEMME";
            const role = document.getElementById("anonymatRoleSelect")?.value || "";

            if (!concoursId) return showToast("Veuillez sélectionner un concours.", "warning");
            if (!nomFr || !prenomFr) return showToast("Nom, prénom sont obligatoires.", "warning");

            

       
            anonymatMembers.push({
                concoursId,
                concoursLabel,
                nomFr,
                prenomFr,
                nomAr,
                prenomAr,
                grade,
                sexe,
                role,
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
        <td>${m.nomFr} ${m.prenomFr}</td>
        <td>${m.role}</td>
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
       RESPONSABLE CFD (form)
       ========================= */
      
    const formCfdResponsable = document.getElementById("formCfdResponsable");

    if (formCfdResponsable) {
        formCfdResponsable.addEventListener("submit", async (e) => {
            e.preventDefault();

            const concoursId = document.getElementById("cfdConcoursSelect")?.value || "";
            const membreId = document.getElementById("cfdResponsableSelect")?.value || "";
            const email = document.getElementById("cfdRespEmail")?.value.trim() || "";

            if (!concoursId) return showToast("Veuillez sélectionner un concours.", "warning");
            if (!membreId) return showToast("Veuillez sélectionner le membre CFD responsable.", "warning");
            if (!email) return showToast("Veuillez saisir l'email du responsable CFD.", "warning");
            localStorage.setItem("dg-id", concoursId);
            const membre = cfdMembers.find((m) => String(m.idMembre) === String(membreId));
            const nomFr = membre?.nomFr || "";
            const prenomFr = membre?.prenomFr || "";

            let username = inputUsernameResp?.value.trim();
            let password = inputPasswordResp?.value.trim();

            if (!username) {
                username = nomFr && prenomFr
                    ? `${nomFr}.${prenomFr}`.replace(/\s+/g, "").toLowerCase()
                    : email.split("@")[0];
            }
            if (!password) {
                password = nomFr && prenomFr ? `${nomFr}_${prenomFr}_CFD` : `CFD_${Date.now()}`;
            }

            const submitBtn = formCfdResponsable.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Enregistrement...";
            }

            try {
                const userPayload = { username, email, password, role: "CFD", idMembre: membreId };
                const createdUser = await fetchJson(`${API_BASE}/users`, {
                    method: "POST",
                    body: JSON.stringify(userPayload),
                });

                const idUser = createdUser?.user?.idUser;
                if (!idUser) throw new Error("idUser manquant dans la réponse de /users");

                const cfdPayload = { idUser, idMembre: membreId, idConcours: concoursId, role: "CFD" };
                await fetchJson(`${API_BASE}/cfds`, {
                    method: "POST",
                    body: JSON.stringify(cfdPayload),
                });
               

                try {
                    let concoursStore = JSON.parse(localStorage.getItem("dg-concours") || "{}");
                    concoursStore.cfdResponsable = { idConcours: concoursId, idMembre: membreId, idUser, email, username };
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

    /* =========================
       FACULTE SAVE (protection)
       ========================= */
    const btnSaveFaculte = document.getElementById("btnSaveFaculte");
    if (btnSaveFaculte) {
        btnSaveFaculte.addEventListener("click", () => {
            const faculte = {
                nomFaculte: document.getElementById("infoNomFaculteAr")?.value || "",
            };

            localStorage.setItem("dg-faculte", JSON.stringify({ faculte }));
            showToast("Enregistrée avec succès.", "success");
        });
    }

    /* =========================
       CHART (inchangé)
       ========================= */
    function initFaculteChart() {
        const canvas = document.getElementById("chartFaculte");
        if (!canvas || typeof Chart === "undefined") return;

        const ctx = canvas.getContext("2d");

        const labels = ["Sciences Exactes", "Sciences & Technologie", "Génie Civil", "Chimie", "Lettres & Langues"];
        const dataValues = [450, 340, 235, 155, 120];
        const colors = ["#4f46e5", "#a855f7", "#f97316", "#ec4899", "#22c55e"];

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
                        maxBarThickness: 40,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
                animation: { duration: 900 },
            },
        });
    }
    initFaculteChart();

    /* =========================
       DEPARTEMENTS AR (inchangé)
       ========================= */
    const inputDeptAr = document.getElementById("newDepartementAr");
    const btnAddDeptAr = document.getElementById("btnAddDepartementAr");
    const p = document.getElementById("paragraph");
    const list = document.getElementById("departementList");

    if (btnAddDeptAr) {
        btnAddDeptAr.addEventListener("click", () => {
            const value = inputDeptAr?.value.trim() || "";
            if (!value) return;

            let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");
            if (!Array.isArray(concours.departementsAr)) concours.departementsAr = [];

            if (!concours.departementsAr.includes(value)) concours.departementsAr.push(value);

            localStorage.setItem("dg-concours", JSON.stringify(concours));
            renderDepartementsAr(concours.departementsAr);
            if (p) p.style.display = "block";
            if (inputDeptAr) inputDeptAr.value = "";
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
        <button class="deleteDeptBtn" data-index="${idx}" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:20px;">
          <i class="uil uil-trash-alt"></i>
        </button>
      `;

            list.appendChild(li);
        });

        document.querySelectorAll(".deleteDeptBtn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.getAttribute("data-index"));
                let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");
                if (!Array.isArray(concours.departementsAr)) return;

                concours.departementsAr.splice(idx, 1);
                localStorage.setItem("dg-concours", JSON.stringify(concours));

                renderDepartementsAr(concours.departementsAr);
                if (concours.departementsAr.length === 0 && p) p.style.display = "none";
            });
        });
    }

    const saved = JSON.parse(localStorage.getItem("dg-concours") || "{}");
    if (Array.isArray(saved.departementsAr) && saved.departementsAr.length > 0) {
        renderDepartementsAr(saved.departementsAr);
        if (p) p.style.display = "block";
    }

    /* =========================
       SIGNATURE + QR + HASH
       ========================= */
    function addSignatureAndQR(sheet, { signerName, verifyTextOrUrl }) {
        const wrap = document.createElement("div");
        wrap.style.marginTop = "18px";
        wrap.style.display = "flex";
        wrap.style.justifyContent = "space-between";
        wrap.style.alignItems = "flex-end";
        wrap.style.gap = "12px";

        const sig = document.createElement("div");
        sig.style.direction = "ltr";
        sig.style.textAlign = "left";
        sig.style.fontFamily = "Arial, sans-serif";
        sig.style.fontSize = "11px";
        sig.style.whiteSpace = "pre-line";

        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const stamp = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(
            now.getHours()
        )}:${pad(now.getMinutes())}:${pad(now.getSeconds())} +01'00'`;

        sig.textContent = `Digitally signed by ${signerName}\nDate: ${stamp}\n`;

        const qrBox = document.createElement("div");
        qrBox.style.width = "108px";
        qrBox.style.height = "108px";
        qrBox.style.border = "1px solid #000";
        qrBox.style.padding = "6px";
        qrBox.style.background = "#fff";

        const qrInner = document.createElement("div");
        qrBox.appendChild(qrInner);

        // nécessite QRCode lib déjà chargé
        new QRCode(qrInner, { text: verifyTextOrUrl, width: 96, height: 96 });

        wrap.appendChild(sig);
        wrap.appendChild(qrBox);
        sheet.appendChild(wrap);
    }

    async function sha256Base64(text) {
        const enc = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest("SHA-256", enc);
        const bytes = new Uint8Array(buf);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return btoa(binary);
    }

    /* =========================
       PRINT CFD MEMBERS (conservé, juste robustesse)
       ========================= */
    const btnPrintCfdMembers = document.getElementById("btnPrintCfdMembers");
    const pvPrintArea = document.getElementById("pvPrintArea");

    if (btnPrintCfdMembers && pvPrintArea) {
        btnPrintCfdMembers.addEventListener("click", async () => {
            if (!cfdMembers || cfdMembers.length === 0) {
                showToast("لا يوجد أعضاء في لجنة الإشراف CFD للطباعة.", "warning");
                return;
            }

            const ARtextArea = document.getElementById("infosTexteAr");
            const ARtext = ARtextArea ? ARtextArea.value.trim() : "";

            pvPrintArea.innerHTML = "";

            const sheet = document.createElement("div");
            sheet.className = "pv-sheet";
            sheet.style.direction = "rtl";
            sheet.style.fontFamily = "'Cairo','Tajawal','Times New Roman',serif";
            sheet.style.fontSize = "11pt";
            sheet.style.lineHeight = "1.9";

            const title = document.createElement("h3");
            const faculteAR = JSON.parse(localStorage.getItem("dg-faculte") || "null");
            const faculteARar = faculteAR?.faculte?.nomFaculte || "";

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
            title2.style.fontWeight = "700";
            sheet.appendChild(title2);

            if (ARtext) {
                const p = document.createElement("p");
                p.style.whiteSpace = "pre-wrap";
                p.style.marginBottom = "20px";
                p.style.textAlign = "justify";
                p.textContent = ARtext;
                sheet.appendChild(p);
            }

            const now = new Date();
            const currentYear = now.getFullYear();
            const previousYear = currentYear - 1;
            const anneeUniversitaire = `${previousYear}-${currentYear}`;

            const p1 = document.createElement("p");
            p1.style.whiteSpace = "pre-wrap";
            p1.style.marginBottom = "20px";
            p1.style.textAlign = "justify";
            p1.style.direction = "rtl";
            p1.style.fontFamily = "Cairo, 'Tajawal', sans-serif";
            p1.textContent =
                `المادة الأولى: تنشأ لجنة الإشراف على مسابقة الدكتوراه للسنة الجامعية ${anneeUniversitaire}.\n` +
                `المادة الثانية: تشكل هذه اللجنة من السادة الأساتذة التالية أسماؤهم:`;
            sheet.appendChild(p1);

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

            const tbody = document.createElement("tbody");

            const president = cfdMembers.find((m) => m.isDoyen);
            const others = cfdMembers.filter((m) => !m.isDoyen);

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
            others.forEach((m) => addMemberRow(m, false));

            table.appendChild(tbody);
            sheet.appendChild(table);

            const foote = document.createElement("p");
            foote.textContent = `المادة الثالثة: يكلف الأمين العام الكلية بتنفيذ هذا المقرر.`;
            foote.style.marginTop = "11px";
            foote.style.textAlign = "right";
            sheet.appendChild(foote);

            const footer = document.createElement("p");
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            footer.textContent = `حرّر في: ${yyyy}/${mm}/${dd}`;
            footer.style.marginTop = "32px";
            footer.style.textAlign = "left";
            sheet.appendChild(footer);

            const footer2 = document.createElement("p");
            footer2.textContent = "عميد الكلية";
            footer2.style.marginTop = "50px";
            footer2.style.textAlign = "left";
            sheet.appendChild(footer2);

            pvPrintArea.appendChild(sheet);

            try {
                const pvText = sheet.innerText;
                const hash = await sha256Base64(pvText);

                const userJson = localStorage.getItem("dg-user");
                if (!userJson) return;

                const user = JSON.parse(userJson);
                const idMembre = user.idMembre;
                if (!idMembre) return;

                const membre = await fetchJson(`${API_BASE}/membres/${idMembre}`);
                const nomFr = membre.nomMembre || "";
                const prenomFr = membre.prenomMembre || "";

                addSignatureAndQR(sheet, {
                    signerName: `${nomFr} ${prenomFr}`,
                    verifyTextOrUrl: `HashSHA256: ${hash}`,
                });

                await new Promise((r) => setTimeout(r, 250));
                window.print();
            } catch (e) {
                console.error(e);
                showToast("❌ " + e.message, "danger");
            } finally {
                pvPrintArea.innerHTML = "";
            }
        });
    }
// ===== Déclarations =====
const btnOpenModalSalle = document.getElementById("btnOpenModalSalle");
const modalSurveillance = document.getElementById("modalSurveillance");
const formSurveillance = document.getElementById("formSurveillance");

const sexeToggleSurveillance = document.getElementById("sexeToggleSurveillance");
const sexeSurveillanceHidden = document.getElementById("sexeSurveillance");


// ===== Ouvrir la modale =====
if (btnOpenModalSalle && formSurveillance) {

  btnOpenModalSalle.addEventListener("click", () => {

    // reset formulaire
    formSurveillance.reset();

    // reset sexe
    if (sexeSurveillanceHidden && sexeToggleSurveillance) {

      sexeSurveillanceHidden.value = "FEMME";

      sexeToggleSurveillance.querySelectorAll(".sex-option").forEach((btn) => {
        btn.classList.toggle(
          "sex-option-active",
          btn.dataset.sexValue === "FEMME"
        );
      });

    }

    // ouvrir modale
    openModal(modalSurveillance);

  });

}


    /* =========================
       PRINT CORRECTEURS (corrigé)
       ========================= */
    const btnPrintCorrecteursMembers = document.getElementById("btnPrintCorrecteursMembers");

    if (btnPrintCorrecteursMembers && pvPrintArea) {
        btnPrintCorrecteursMembers.addEventListener("click", async () => {
            // ✅ spécialité: texte option sélectionnée + value input AR
            const specFR = getSelectedSpecialiteLabelFR();
            const specId = getSelectedSpecialiteId();
            const specAR = inputSpecialiteAr ? inputSpecialiteAr.value.trim() : "";

            if (!specFR || !specAR) {
                showToast("Veuillez sélectionner la spécialité en FR et saisir sa traduction en AR.", "warning");
                return;
            }

            if (!correcteurs || correcteurs.length === 0) {
                showToast("لا يوجد مصححون لهذا التخصص للطباعة.", "warning");
                return;
            }

            const ARtextArea = document.getElementById("infosTexteAr");
            const ARtext = ARtextArea ? ARtextArea.value.trim() : "";

            pvPrintArea.innerHTML = "";

            const sheet = document.createElement("div");
            sheet.className = "pv-sheet";
            sheet.style.direction = "rtl";
            sheet.style.fontFamily = "'Cairo','Tajawal','Times New Roman',serif";
            sheet.style.fontSize = "11pt";
            sheet.style.lineHeight = "1.9";

            const title = document.createElement("h3");
            const faculteAR = JSON.parse(localStorage.getItem("dg-faculte") || "null");
            const faculteARar = faculteAR?.faculte?.nomFaculte || "";

            title.textContent =
                `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n`;
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
            title2.style.fontWeight = "700";
            sheet.appendChild(title2);

            if (ARtext) {
                const p = document.createElement("p");
                p.style.whiteSpace = "pre-wrap";
                p.style.marginBottom = "20px";
                p.style.textAlign = "justify";
                p.textContent = ARtext;
                sheet.appendChild(p);
            }

            const today = new Date();
            const currentYear = today.getFullYear();
            const previousYear = currentYear - 1;
            const anneeUniversitaire = `${previousYear}-${currentYear}`;

            const p1 = document.createElement("p");
            p1.style.whiteSpace = "pre-wrap";
            p1.style.marginBottom = "20px";
            p1.style.textAlign = "justify";
            p1.style.direction = "rtl";
            p1.style.fontFamily = "Cairo, 'Tajawal', sans-serif";

            p1.textContent =
                `المادة الأولى: تُنشأ لجنة المصححين على مسابقة الدكتوراه تخصص ${specAR || "........"} (${specFR}) للسنة الجامعية ${anneeUniversitaire}.\n` +
                `المادة الثانية: تُشكل هذه اللجنة من السادة الأساتذة التالية أسماؤهم:`;
            sheet.appendChild(p1);

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

            const tbody = document.createElement("tbody");
            let rowIndex = 1;

            function addMemberRow(member) {
                const tr = document.createElement("tr");

                const nomAr =
                    `${member.nomAr || ""} ${member.prenomAr || ""}`.trim() ||
                    `${member.nomFr || ""} ${member.prenomFr || ""}`.trim();

                const sexe = (member.sexe || "").toUpperCase();
                const fonction = sexe === "FEMME" ? "مصححة" : "مصحح";
                const institution = "جامعة العلوم و التكنولوجيا محمد بوضياف";

                const tdNum = makeTd(String(rowIndex));
                tdNum.style.textAlign = "center";

                tr.appendChild(tdNum);
                tr.appendChild(makeTd(nomAr));
                tr.appendChild(makeTd(institution));
                tr.appendChild(makeTd(fonction));

                tbody.appendChild(tr);
                rowIndex++;
            }

            correcteurs.forEach(addMemberRow);

            table.appendChild(tbody);
            sheet.appendChild(table);

            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");

            const footer = document.createElement("p");
            footer.textContent = `حرّر في: ${yyyy}/${mm}/${dd}`;
            footer.style.marginTop = "32px";
            footer.style.textAlign = "left";
            sheet.appendChild(footer);

            const footer2 = document.createElement("p");
            footer2.textContent = "عميد الكلية";
            footer2.style.marginTop = "50px";
            footer2.style.textAlign = "left";
            sheet.appendChild(footer2);

            pvPrintArea.appendChild(sheet);

            try {
                const pvText = sheet.innerText;
                const hash = await sha256Base64(pvText);

                const userJson = localStorage.getItem("dg-user");
                if (!userJson) return;

                const user = JSON.parse(userJson);
                const idMembre = user.idMembre;
                if (!idMembre) return;

                const membre = await fetchJson(`${API_BASE}/membres/${idMembre}`);
                const nomFr = membre.nomMembre || "";
                const prenomFr = membre.prenomMembre || "";

                addSignatureAndQR(sheet, {
                    signerName: `${nomFr} ${prenomFr}`,
                    verifyTextOrUrl: `HashSHA256: ${hash}`,
                });

                await new Promise((r) => setTimeout(r, 300));
                window.print();
                showToast("Impression terminée.", "success");
            } catch (e) {
                console.error(e);
                showToast("❌ " + e.message, "danger");
            } finally {
                localStorage.removeItem("dg-selected-spec");
                if (selectSpecialite) {
                    selectSpecialite.selectedIndex = 0; // revient sur la 1ère option
                    // ou : selectSpecialite.value = "";
                    selectSpecialite.dispatchEvent(new Event("change")); // applique ton onChange (désactive l'input AR)
                }
                pvPrintArea.innerHTML = "";

            }
        });
    }

    const btnPrintAnonymatMembers = document.getElementById("btnPrintAnonymatMembers");

    if (btnPrintAnonymatMembers && pvPrintArea) {
        btnPrintAnonymatMembers.addEventListener("click", async () => {
           
          
            if (!anonymatMembers || anonymatMembers.length === 0) {
                showToast("لا يوجد المشرفين للطباعة.", "warning");
                return;
            }

            const ARtextArea = document.getElementById("infosTexteAr");
            const ARtext = ARtextArea ? ARtextArea.value.trim() : "";

            pvPrintArea.innerHTML = "";

            const sheet = document.createElement("div");
            sheet.className = "pv-sheet";
            sheet.style.direction = "rtl";
            sheet.style.fontFamily = "'Cairo','Tajawal','Times New Roman',serif";
            sheet.style.fontSize = "11pt";
            sheet.style.lineHeight = "1.9";

            const title = document.createElement("h3");
            const faculteAR = JSON.parse(localStorage.getItem("dg-faculte") || "null");
            const faculteARar = faculteAR?.faculte?.nomFaculte || "";

            title.textContent =
                `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n`;
            title.style.textAlign = "center";
            title.style.margin = "10px 0 14px";
            title.style.fontSize = "11px";
            title.style.fontWeight = "700";
            sheet.appendChild(title);

            const title2 = document.createElement("h3");
            title2.textContent = "إنشاء لجنة التشفير على مسابقة الدكتوراه";
            title2.style.textAlign = "center";
            title2.style.margin = "10px 0 14px";
            title2.style.fontSize = "16px";
            title2.style.fontWeight = "700";
            sheet.appendChild(title2);

            if (ARtext) {
                const p = document.createElement("p");
                p.style.whiteSpace = "pre-wrap";
                p.style.marginBottom = "20px";
                p.style.textAlign = "justify";
                p.textContent = ARtext;
                sheet.appendChild(p);
            }

            const today = new Date();
            const currentYear = today.getFullYear();
            const previousYear = currentYear - 1;
            const anneeUniversitaire = `${previousYear}-${currentYear}`;

            const p1 = document.createElement("p");
            p1.style.whiteSpace = "pre-wrap";
            p1.style.marginBottom = "20px";
            p1.style.textAlign = "justify";
            p1.style.direction = "rtl";
            p1.style.fontFamily = "Cairo, 'Tajawal', sans-serif";

            p1.textContent =
                `المادة الأولى: تُنشأ لجنة التشفير على مسابقة الدكتوراه   للسنة الجامعية ${anneeUniversitaire}.\n` +
                `المادة الثانية: تُشكل هذه اللجنة من السادة الأساتذة التالية أسماؤهم:`;
            sheet.appendChild(p1);

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

            const tbody = document.createElement("tbody");
            let rowIndex = 1;

            function addMemberRow(member) {
                const tr = document.createElement("tr");

                const nomAr =
                    `${member.nomAr || ""} ${member.prenomAr || ""}`.trim() ||
                    `${member.nomFr || ""} ${member.prenomFr || ""}`.trim();

                const fonction = member.role|| "";
                const institution = "";

               

            
                tr.appendChild(makeTd(nomAr));
                tr.appendChild(makeTd(institution));
                tr.appendChild(makeTd(fonction));

                tbody.appendChild(tr);
                rowIndex++;
            }

            correcteurs.forEach(addMemberRow);

            table.appendChild(tbody);
            sheet.appendChild(table);

            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");

            const footer = document.createElement("p");
            footer.textContent = `حرّر في: ${yyyy}/${mm}/${dd}`;
            footer.style.marginTop = "32px";
            footer.style.textAlign = "left";
            sheet.appendChild(footer);

            const footer2 = document.createElement("p");
            footer2.textContent = "عميد الكلية";
            footer2.style.marginTop = "50px";
            footer2.style.textAlign = "left";
            sheet.appendChild(footer2);

            pvPrintArea.appendChild(sheet);

            try {
                const pvText = sheet.innerText;
                const hash = await sha256Base64(pvText);

                const userJson = localStorage.getItem("dg-user");
                if (!userJson) return;

                const user = JSON.parse(userJson);
                const idMembre = user.idMembre;
                if (!idMembre) return;

                const membre = await fetchJson(`${API_BASE}/membres/${idMembre}`);
                const nomFr = membre.nomMembre || "";
                const prenomFr = membre.prenomMembre || "";

                addSignatureAndQR(sheet, {
                    signerName: `${nomFr} ${prenomFr}`,
                    verifyTextOrUrl: `HashSHA256: ${hash}`,
                });

                await new Promise((r) => setTimeout(r, 300));
                window.print();
                showToast("Impression terminée.", "success");
            } catch (e) {
                console.error(e);
                showToast("❌ " + e.message, "danger");
            } finally {
                localStorage.removeItem("dg-selected-spec");
                if (selectSpecialite) {
                    selectSpecialite.selectedIndex = 0; // revient sur la 1ère option
                    // ou : selectSpecialite.value = "";
                    selectSpecialite.dispatchEvent(new Event("change")); // applique ton onChange (désactive l'input AR)
                }
                pvPrintArea.innerHTML = "";

            }
        });
    }
});