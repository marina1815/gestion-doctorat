
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


    const inputNumero = document.getElementById("numeroConcours");
    const btnSave = document.getElementById("btnSaveFaculte");

    if (btnSave && inputNumero) {
        btnSave.addEventListener("click", () => {

            const numero = inputNumero.value.trim();

            if (!numero) {
                alert("Veuillez saisir le numéro du concours");
                return;
            }

            // sauvegarder dans localStorage
            localStorage.setItem("dg-numeroConcours", numero);

            console.log("Numéro sauvegardé :", numero);
        });
    }


    function getConcoursIdSafe() {
        return localStorage.getItem("dg-id") || "";
    }

    function genSalleId() {
        return `salle_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    // Crée une ligne <tr> comme ton exemple
    function createSalleRow({ idSalle = "", nom = "", nomAr = "", capacite = 25 } = {}) {
    const tr = document.createElement("tr");

    // même nom partout
    tr.dataset.idSalle = idSalle || "";

    tr.innerHTML = `
        <td>
            <input
                type="text"
                class="input-inline input-salle-nom"
                placeholder="Ex : AMPHI03"
                value="${escapeHtml(nom)}"
            >
        </td>

        <td>
            <input
                type="text"
                dir="rtl"
                class="input-inline input-salle-nom-ar"
                placeholder="مثال : المدرج 03"
                value="${escapeHtml(nomAr)}"
            >
        </td>

        <td>
            <div class="places-control">
                <button type="button" class="places-btn places-minus">−</button>
                <input
                    type="number"
                    min="0"
                    class="input-salle-cap"
                    value="${Number(capacite) || 0}"
                >
                <button type="button" class="places-btn places-plus">+</button>
            </div>
        </td>

        <td>
            <div class="action-row">
                <button type="button" class="icon-btn btn-icon-danger btn-delete-row" title="Supprimer">
                    <i class="uil uil-trash-alt"></i>
                </button>

                <button type="button" class="icon-btn icon-green btn-save-row" title="Enregistrer">
                    <i class="uil uil-check-circle"></i>
                </button>
            </div>
        </td>
    `;

    return tr;
}




    // Petit helper pour éviter injection dans value=""
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function readSallesFromDOM(tbody) {
    const rows = Array.from(tbody.querySelectorAll("tr"));

    return rows.map((tr) => {
        const nom = tr.querySelector(".input-salle-nom")?.value.trim() || "";
        const nomAr = tr.querySelector(".input-salle-nom-ar")?.value.trim() || "";
        const capRaw = tr.querySelector(".input-salle-cap")?.value;
        const capacite = Math.max(0, Number(capRaw || 0) || 0);
        const idSalle = tr.dataset.idSalle || "";

        return { idSalle, nom, nomAr, capacite };
    });
}

    function saveSallesToLS(salles) {
        const concoursId = getConcoursIdSafe();
        if (!concoursId) {
            showToast?.("Veuillez sélectionner un concours (dans view CFD).", "warning");
            return false;
        }

        try {
            const raw = localStorage.getItem("dg-salles") || "{}";
            const store = JSON.parse(raw);
            store[concoursId] = salles;
            localStorage.setItem("dg-salles", JSON.stringify(store));
            return true;
        } catch (e) {
            console.error("saveSallesToLS error:", e);
            showToast?.("Erreur sauvegarde salles (localStorage).", "danger");
            return false;
        }
    }

    function loadSallesFromLS() {
        const concoursId = getConcoursIdSafe();
        if (!concoursId) return [];

        try {
            const raw = localStorage.getItem("dg-salles") || "{}";
            const store = JSON.parse(raw);
            const list = store[concoursId];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            console.error("loadSallesFromLS error:", e);
            return [];
        }
    }

   function bindSalleTableEvents(tableEl) {
    if (!tableEl) return;
    const tbody = tableEl.querySelector("tbody");
    if (!tbody) return;

    // éviter double bind si la fonction est rappelée
    if (tbody.dataset.boundSalleEvents === "true") return;
    tbody.dataset.boundSalleEvents = "true";

    tbody.addEventListener("click", async (e) => {
        const btnMinus = e.target.closest(".places-minus");
        const btnPlus = e.target.closest(".places-plus");
        const btnDel = e.target.closest(".btn-delete-row");
        const btnSave = e.target.closest(".btn-save-row");

        /* ---------------------------
           - capacité
        --------------------------- */
        if (btnMinus) {
            const tr = btnMinus.closest("tr");
            const input = tr?.querySelector(".input-salle-cap");
            if (!input) return;

            const v = Math.max(0, (Number(input.value) || 0) - 1);
            input.value = String(v);
            return;
        }

        /* ---------------------------
           + capacité
        --------------------------- */
        if (btnPlus) {
            const tr = btnPlus.closest("tr");
            const input = tr?.querySelector(".input-salle-cap");
            if (!input) return;

            const v = Math.max(0, (Number(input.value) || 0) + 1);
            input.value = String(v);
            return;
        }

        /* ---------------------------
           DELETE salle
        --------------------------- */
        if (btnDel) {
            const tr = btnDel.closest("tr");
            if (!tr) return;

            const idSalle = tr.dataset.idSalle || "";

            try {
                btnDel.disabled = true;

                // si la salle n'est pas encore sauvegardée côté serveur
                if (!idSalle) {
                    tr.remove();
                    showToast("Ligne supprimée.", "danger");
                    return;
                }

                await fetchJson(`${API_BASE}/salles/${encodeURIComponent(idSalle)}`, {
                    method: "DELETE",
                });

                tr.remove();
                showToast("Salle supprimée avec succès.", "success");
            } catch (err) {
                console.error("Erreur suppression salle:", err);
                showToast("Erreur lors de la suppression de la salle.", "error");
            } finally {
                btnDel.disabled = false;
            }

            return;
        }

        /* ---------------------------
           SAVE salle
        --------------------------- */
        if (btnSave) {
            const tr = btnSave.closest("tr");
            if (!tr) return;

            const inputNom = tr.querySelector(".input-salle-nom");
            const inputCap = tr.querySelector(".input-salle-cap");
            console.log("inputNom");
            console.log(inputNom);

            if (!inputNom || !inputCap) {
                showToast("Champs salle introuvables.", "error");
                return;
            }

            const nomSalle = inputNom.value.trim();
            const capaciteSalle = Number(inputCap.value || 0);
            const idSalle = tr.dataset.idSalle || "";

            if (!nomSalle) {
                showToast("Le nom de la salle est obligatoire.", "warning");
                inputNom.focus();
                return;
            }

            if (Number.isNaN(capaciteSalle) || capaciteSalle < 0) {
                showToast("La capacité doit être un nombre positif.", "warning");
                inputCap.focus();
                return;
            }

            try {
                btnSave.disabled = true;
                btnSave.innerHTML = `<i class="uil uil-spinner-alt"></i>`;

                const payload = {
                    nomSalle,
                    capaciteSalle,
                };

                let saved;

                // UPDATE si la ligne a déjà un id
                if (idSalle) {
                    saved = await fetchJson(`${API_BASE}/salles/${encodeURIComponent(idSalle)}`, {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    });
                } else {
                    // CREATE sinon
                    saved = await fetchJson(`${API_BASE}/salles`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                }

                const salle =
                    saved?.salle ||
                    saved?.data ||
                    saved;

                const savedId =
                    salle?.idSalle ||
                    salle?.id_salle ||
                    idSalle;

                const savedNom =
                    salle?.nomSalle ||
                    salle?.nom_salle ||
                    nomSalle;

                const savedCap =
                    salle?.capaciteSalle ??
                    salle?.capacite_salle ??
                    capaciteSalle;

                if (savedId) {
                    tr.dataset.idSalle = String(savedId);
                }

                inputNom.value = savedNom;
                inputCap.value = String(savedCap);

                showToast(
                    idSalle
                        ? "Salle mise à jour avec succès."
                        : "Salle enregistrée avec succès.",
                    "success"
                );
            } catch (err) {
                console.error("Erreur sauvegarde salle:", err);
                showToast("Erreur lors de l'enregistrement de la salle.", "error");
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = `<i class="uil uil-check-circle"></i>`;
            }

            return;
        }
    });

    /* ---------------------------
       empêcher capacité négative
    --------------------------- */
    tbody.addEventListener("input", (e) => {
        const capInput = e.target.closest(".input-salle-cap");
        if (!capInput) return;

        const v = Number(capInput.value);
        if (Number.isNaN(v) || v < 0) {
            capInput.value = "0";
        }
    });
}

    function initSallesTable() {
        // Ta table "Salles et capacités"
        const sallesTable = document.querySelector(".specialties-table");
        if (!sallesTable) return;

        const tbody = sallesTable.querySelector("tbody");
        if (!tbody) return;

        // 1) binder events
        bindSalleTableEvents(sallesTable);

        // 2) bouton Ajouter une salle
        const addSalleBtn = document.getElementById("addSalleBtn");
        if (addSalleBtn && !addSalleBtn.dataset.bound) {
            addSalleBtn.dataset.bound = "1";
            addSalleBtn.addEventListener("click", () => {
                tbody.appendChild(createSalleRow({ nom: "", capacite: 0 }));
            });
        }

        const saveBtn =
            document.querySelector('#view-surveillants .card-subsection .primary-btn') ||
            document.querySelector('#view-surveillants .form-actions .primary-btn');

        if (saveBtn && !saveBtn.dataset.bound) {
            saveBtn.dataset.bound = "1";

            saveBtn.addEventListener("click", (e) => {
                e.preventDefault(); // car ton bouton est type="submit" mais pas dans un <form>

                const salles = readSallesFromDOM(tbody);

                // Validation simple
                const invalid = salles.some((s) => !s.nom);
                if (invalid) {
                    showToast?.("Veuillez remplir tous les noms de salles.", "warning");
                    return;
                }

                const ok = saveSallesToLS(salles);
                if (ok) showToast?.("✅ Salles enregistrées.", "success");
            });
        }

        // 4) charger depuis localStorage (par concours)
        function renderFromLS() {
            const salles = loadSallesFromLS();
            tbody.innerHTML = "";
            if (!salles.length) {
                // Si tu veux une ligne vide par défaut :
                tbody.appendChild(createSalleRow({ nom: "", capacite: 0 }));
                return;
            }
            salles.forEach((s) => {
                const tr = createSalleRow({ nom: s.nom, capacite: s.capacite });
                tr.dataset.salleId = s.id || tr.dataset.salleId;
                tbody.appendChild(tr);
            });
        }

        renderFromLS();

        // 5) Si l'utilisateur change de concours (dans view CFD), recharger
        const cfdConcoursSelect = document.getElementById("cfdConcoursSelect");
        if (cfdConcoursSelect && !cfdConcoursSelect.dataset.sallesBound) {
            cfdConcoursSelect.dataset.sallesBound = "1";
            cfdConcoursSelect.addEventListener("change", () => {
                renderFromLS();
            });
        }
    }

    // ✅ IMPORTANT: tu as déjà initSpecialitesTable(); => remplace par initSallesTable(); pour cette view
    initSallesTable();

    let __lastView = null;

    window.addEventListener("hashchange", () => {
        const v = (location.hash || "").replace("#", "").trim();
        if (!v) return;

        if (v === __lastView) return;

        const exists = Array.from(views).some(x => x.dataset.view === v);
        if (exists) showView(v);
    });

    function updateTopbarHeight() {
        const topbar = document.querySelector(".topbar");
        const h = topbar ? topbar.offsetHeight : 0;
        document.documentElement.style.setProperty("--topbar-height", h + "px");
    }

    updateTopbarHeight();
    window.addEventListener("resize", updateTopbarHeight);



    let correcteurs = [];

    const correcteursBody = document.getElementById("correcteursBody");
    const modalCorrecteur = document.getElementById("modalCorrecteur");
    const btnOpenModalCorrecteur = document.getElementById("btnOpenModalCorrecteur");
    const formCorrecteur = document.getElementById("formCorrecteur");
    const sexeCorrHidden = document.getElementById("sexeCorrecteur");
    const sexeToggleCorr = document.getElementById("sexeToggleCorrecteur");
    const selectSpecialite = document.getElementById("selectSpecialite");
    const inputSpecialiteAr = document.getElementById("inputSpecialiteAr");




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

    const stepOrder = ["pv", "cfd", "sujet", "correcteurs", "anonymat", "surveillants"];
    const pipelineSteps = document.querySelectorAll(".pipeline-step[data-step]");



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

    const formCfdMembre = document.getElementById("formCfdMembre");
    const cfdMembersBody = document.getElementById("cfdMembersBody");
    const cfdRoleSelect = document.getElementById("cfdRoleSelect");
    const nomMembreFrInput = document.getElementById("nomMembreFr");
    const prenomMembreFrInput = document.getElementById("prenomMembreFr");
    const nomMembreArInput = document.getElementById("nomMembreAr");
    const prenomMembreArInput = document.getElementById("prenomMembreAr");
    const gradeMembreSelect = document.getElementById("gradeMembre");
    let doyenLoaded = false;
    let doyenLoading = false;


    let membresExistants = [];

    const searchMembreExistantInput = document.getElementById("searchMembreExistant");
    const selectedMembreExistantInput = document.getElementById("selectedMembreExistant");
    const membreSuggestions = document.getElementById("membreSuggestions");

    const modalCfd = document.getElementById("modalCfdMembre");
    const btnOpenModalCfdMembre = document.getElementById("btnOpenModalCfdMembre");



    /* optionnel : champ de recherche tableau */
    const cfdSearchInput = document.getElementById("cfdSearchInput");

    async function loadMembresForCfdModal() {
        try {
            const data = await fetchJson(`${API_BASE}/membres`, {
                method: "GET",
            });

            membresExistants = Array.isArray(data)
                ? data
                : (data?.data || data?.membres || []);

            hideMembreSuggestions();
        } catch (err) {
            console.error("Erreur chargement membres pour modal CFD :", err);
            showToast("Impossible de charger la liste des membres.", "error");
        }
    }

    function resetCfdFields() {
        if (nomMembreFrInput) nomMembreFrInput.value = "";
        if (prenomMembreFrInput) prenomMembreFrInput.value = "";
        if (nomMembreArInput) nomMembreArInput.value = "";
        if (prenomMembreArInput) prenomMembreArInput.value = "";
        if (gradeMembreSelect) gradeMembreSelect.value = "";

        if (sexeHidden) sexeHidden.value = "FEMME";
        if (sexeToggle) {
            sexeToggle.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
            });
        }
    }

    function fillCfdFieldsFromMember(member) {
        if (!member) return;

        const nomFr = member.nomMembre || member.nomFr || "";
        const prenomFr = member.prenomMembre || member.prenomFr || "";
        const nomAr = member.nomAr || member.nom_ar || "";
        const prenomAr = member.prenomAr || member.prenom_ar || "";
        const grade = member.grade || "";
        const sexe = member.sexe || "FEMME";

        if (nomMembreFrInput) nomMembreFrInput.value = nomFr;
        if (prenomMembreFrInput) prenomMembreFrInput.value = prenomFr;
        if (nomMembreArInput) nomMembreArInput.value = nomAr;
        if (prenomMembreArInput) prenomMembreArInput.value = prenomAr;
        if (gradeMembreSelect) gradeMembreSelect.value = grade;

        if (sexeHidden) sexeHidden.value = sexe;
        if (sexeToggle) {
            sexeToggle.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === sexe);
            });
        }
    }

    function hideMembreSuggestions() {
        if (!membreSuggestions) return;
        membreSuggestions.innerHTML = "";
        membreSuggestions.style.display = "none";
    }

    function renderMembreSuggestions(keyword = "") {
        if (!membreSuggestions) return;

        const usedIds = cfdMembers.map((m) => String(m.idMembre));
        const term = (keyword || "").trim().toLowerCase();

        const filtered = membresExistants.filter((m) => {
            const id = String(m.idMembre || m.id_membre || m.id || "");
            if (!id) return false;
            if (usedIds.includes(id)) return false;

            const nomFr = (m.nomMembre || m.nomFr || "").toLowerCase();
            const prenomFr = (m.prenomMembre || m.prenomFr || "").toLowerCase();
            const nomAr = (m.nomAr || m.nom_ar || "").toLowerCase();
            const prenomAr = (m.prenomAr || m.prenom_ar || "").toLowerCase();
            const grade = (m.grade || "").toLowerCase();

            const fullFr1 = `${nomFr} ${prenomFr}`.trim();
            const fullFr2 = `${prenomFr} ${nomFr}`.trim();
            const fullAr1 = `${nomAr} ${prenomAr}`.trim();
            const fullAr2 = `${prenomAr} ${nomAr}`.trim();

            return (
                !term ||
                nomFr.includes(term) ||
                prenomFr.includes(term) ||
                nomAr.includes(term) ||
                prenomAr.includes(term) ||
                grade.includes(term) ||
                fullFr1.includes(term) ||
                fullFr2.includes(term) ||
                fullAr1.includes(term) ||
                fullAr2.includes(term)
            );
        });

        membreSuggestions.innerHTML = "";

        if (!filtered.length) {
            membreSuggestions.innerHTML = `<div class="combo-empty">Aucun membre trouvé</div>`;
            membreSuggestions.style.display = "block";
            return;
        }

        filtered.forEach((m) => {
            const id = m.idMembre || m.id_membre || m.id || "";
            const nomFr = m.nomMembre || m.nomFr || "";
            const prenomFr = m.prenomMembre || m.prenomFr || "";
            const grade = m.grade || "";

            const item = document.createElement("div");
            item.className = "combo-suggestion-item";
            item.textContent = `${nomFr} ${prenomFr}${grade ? " — " + grade : ""}`;

            item.addEventListener("click", () => {
                if (selectedMembreExistantInput) {
                    selectedMembreExistantInput.value = id;
                }

                if (searchMembreExistantInput) {
                    searchMembreExistantInput.value = `${nomFr} ${prenomFr}`.trim();
                }

                fillCfdFieldsFromMember(m);
                hideMembreSuggestions();
            });

            membreSuggestions.appendChild(item);
        });

        membreSuggestions.style.display = "block";
    }

    if (searchMembreExistantInput) {
        searchMembreExistantInput.addEventListener("input", () => {
            const term = searchMembreExistantInput.value.trim();

            if (selectedMembreExistantInput) {
                selectedMembreExistantInput.value = "";
            }

            if (!term) {
                hideMembreSuggestions();
                return;
            }

            renderMembreSuggestions(term);
        });
    }

    document.addEventListener("click", (e) => {
        const clickedInsideSearch = searchMembreExistantInput?.contains(e.target);
        const clickedInsideSuggestions = membreSuggestions?.contains(e.target);

        if (!clickedInsideSearch && !clickedInsideSuggestions) {
            hideMembreSuggestions();
        }
    });



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
        if (doyenLoaded || doyenLoading) return;
        doyenLoading = true;

        try {
            const userJson = localStorage.getItem("dg-user");
            if (!userJson) return;

            const user = JSON.parse(userJson);
            const idMembre = user.idMembre;

            if (!idMembre) return;

            if (cfdMembers.some((m) => String(m.idMembre) === String(idMembre))) {
                doyenLoaded = true;
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
                role: "عميد الكلية",
                isDoyen: true,
                grade: "رئيس",
            });

            doyenLoaded = true;
            renderCfdMembers();
        } catch (err) {
            console.error("Erreur chargement doyen CFD :", err);
            showToast("Impossible de charger les informations du doyen.", "error");
        } finally {
            doyenLoading = false;
        }
    }

    function updateSelectMembreExistant() {
        const term = searchMembreExistantInput?.value.trim() || "";

        if (!term) {
            hideMembreSuggestions();
            return;
        }

        renderMembreSuggestions(term);
    }

    if (btnOpenModalCfdMembre && formCfdMembre) {
        btnOpenModalCfdMembre.addEventListener("click", async () => {
            formCfdMembre.reset();
            resetCfdFields();

            if (cfdRoleSelect) {
                cfdRoleSelect.innerHTML = buildCfdRoleOptionsHtml("");
            }

            if (searchMembreExistantInput) {
                searchMembreExistantInput.value = "";
            }

            if (selectedMembreExistantInput) {
                selectedMembreExistantInput.value = "";
            }

            hideMembreSuggestions();
            await loadMembresForCfdModal();

            openModal(modalCfd);
        });
    }

    if (formCfdMembre) {
        formCfdMembre.addEventListener("submit", async (e) => {
            e.preventDefault();

            const selectedExistingId = selectedMembreExistantInput?.value || "";

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

            let idMembre = selectedExistingId;

            try {
                if (!idMembre) {
                    const payload = {
                        nomMembre: nomFr,
                        prenomMembre: prenomFr,
                        nomAr,
                        prenomAr,
                        grade,
                        sexe,
                    };

                    const created = await fetchJson(`${API_BASE}/membres`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });

                    idMembre = created?.idMembre || created?.id_membre;

                    if (!idMembre) {
                        throw new Error("idMembre manquant après création du membre");
                    }
                }

                const alreadyExists = cfdMembers.some(
                    (m) => String(m.idMembre) === String(idMembre)
                );

                if (alreadyExists) {
                    showToast("Ce membre existe déjà dans la liste CFD.", "warning");
                    return;
                }

                const newMember = {
                    idMembre,
                    nomFr,
                    prenomFr,
                    nomAr,
                    prenomAr,
                    role: roleValue,
                    isDoyen: false,
                    grade: grade || "عضو",
                    sexe,
                };

                cfdMembers.push(newMember);
                updateSelectMembreExistant();

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
            } catch (err) {
                console.error("Erreur ajout membre CFD :", err);
                showToast("Erreur lors de l'ajout du membre CFD.", "error");
            } finally {
                if (btnCfd) {
                    btnCfd.disabled = false;
                    btnCfd.textContent = "Enregistrer le membre CFD";
                }
            }
        });
    }

    function renderCfdMembers() {
        if (!cfdMembersBody || !cfdResponsableSelect) return;

        const search = (cfdSearchInput?.value || "").trim().toLowerCase();

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
                : `<button type="button" class="btn-icon btn-icon-danger" data-remove="${m.idMembre}">
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

                try {
                    let concours = JSON.parse(localStorage.getItem("dg-concours") || "{}");
                    concours.membreCfd = cfdMembers;
                    localStorage.setItem("dg-concours", JSON.stringify(concours));
                } catch (err) {
                    console.error("Erreur mise à jour localStorage après suppression :", err);
                }

                renderCfdMembers();
                updateSelectMembreExistant();
                showToast("Membre CFD supprimé.", "danger");
            });
        });
    }

    if (cfdSearchInput) {
        cfdSearchInput.addEventListener("input", renderCfdMembers);
    }

    renderCfdMembers();

    /* =========================
       RESPONSABLE CFD (select)
       ========================= */
    const selectResponsable = document.getElementById("cfdResponsableSelect");
    const inputEmailResp = document.getElementById("cfdRespEmail");


    if (selectResponsable) {
        selectResponsable.addEventListener("change", () => {
            const idMembre = selectResponsable.value;

            if (!idMembre) {
                if (inputEmailResp) inputEmailResp.value = "";
                return;
            }

            const membre = cfdMembers.find((m) => String(m.idMembre) === String(idMembre));
            if (!membre) return;

            const nom = membre.nomFr || "";
            const prenom = membre.prenomFr || "";

            const username = `${nom}.${prenom}`.replace(/\s+/g, "").toLowerCase();
            const password = `${nom}_${prenom}_CFD`;


            if (inputEmailResp && !inputEmailResp.value.trim()) {
                inputEmailResp.value = `${username}@univ.dz`;
            }
        });
    }

    /* =========================
       CORRECTEURS
       ========================= */

    /* =========================================================
    CORRECTEURS - VERSION ADAPTÉE AVEC RECHERCHE MEMBRE EXISTANT
    HTML requis :
    - #searchCorrecteurExistant
    - #selectedCorrecteurExistant
    - #correcteurSuggestions
    ========================================================= */


    /* ========= DOM recherche membre existant ========= */
    const searchCorrecteurExistantInput = document.getElementById("searchCorrecteurExistant");
    const selectedCorrecteurExistantInput = document.getElementById("selectedCorrecteurExistant");
    const correcteurSuggestions = document.getElementById("correcteurSuggestions");

    /* ========= DOM champs correcteur ========= */
    const corrNomFrInput = document.getElementById("corrNomFr");
    const corrPrenomFrInput = document.getElementById("corrPrenomFr");
    const corrNomArInput = document.getElementById("corrNomAr");
    const corrPrenomArInput = document.getElementById("corrPrenomAr");
    const corrGradeSelect = document.getElementById("corrGrade");

    /* =========================================================
       SPÉCIALITÉS
       ========================================================= */
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

    async function loadSpecialitesForCorrecteurs() {
        if (!selectSpecialite) return;

        selectSpecialite.innerHTML = `<option value="" selected disabled>Chargement...</option>`;
        selectSpecialite.disabled = true;

        const idConcours = localStorage.getItem("dg-id");
        if (!idConcours) {
            selectSpecialite.innerHTML = `<option value="" selected>Choisir une spécialité</option>`;
            selectSpecialite.disabled = true;
            setArInputState(false);
            showToast("⚠️ Veuillez sélectionner un concours d'abord.", "warning");
            return;
        }

        try {
            const url = `${API_BASE}/specialites/concours/${encodeURIComponent(idConcours)}`;
            const data = await fetchJson(url, { method: "GET" });

            const list = Array.isArray(data) ? data : (data?.data || data?.specialites || []);

            selectSpecialite.innerHTML = `<option value="" selected>Choisir une spécialité</option>`;

            if (!list.length) {
                selectSpecialite.innerHTML = `<option value="" selected>Aucune spécialité</option>`;
                selectSpecialite.disabled = true;
                setArInputState(false);
                return;
            }

            list.forEach((sp) => {
                const opt = document.createElement("option");
                opt.value = sp.idSpecialite || sp.id || sp.id_specialite || "";
                opt.textContent = sp.nomSpecialite || sp.nom || sp.libelle || "Spécialité";
                selectSpecialite.appendChild(opt);
            });

            const saved = localStorage.getItem("dg-selected-spec") || "";
            const exists =
                saved && Array.from(selectSpecialite.options).some((o) => o.value === saved);

            if (exists) {
                selectSpecialite.value = saved;
            } else {
                selectSpecialite.value = "";
                localStorage.removeItem("dg-selected-spec");
            }

            selectSpecialite.disabled = false;

            const hasSelection = !!getSelectedSpecialiteId();
            setArInputState(hasSelection);
        } catch (err) {
            console.error("loadSpecialitesForCorrecteurs error:", err);
            selectSpecialite.innerHTML = `<option value="" selected>Choisir une spécialité</option>`;
            selectSpecialite.disabled = true;
            setArInputState(false);
            showToast(" Impossible de charger les spécialités", "error");
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

            localStorage.setItem("dg-selected-spec", specId);
            setArInputState(true);
        });
    }

    /* =========================================================
       HELPERS CHAMPS CORRECTEUR
       ========================================================= */
    function resetCorrecteurFields() {
        if (corrNomFrInput) corrNomFrInput.value = "";
        if (corrPrenomFrInput) corrPrenomFrInput.value = "";
        if (corrNomArInput) corrNomArInput.value = "";
        if (corrPrenomArInput) corrPrenomArInput.value = "";
        if (corrGradeSelect) corrGradeSelect.value = "";

        if (sexeCorrHidden) sexeCorrHidden.value = "FEMME";
        if (sexeToggleCorr) {
            sexeToggleCorr.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
            });
        }
    }

    function fillCorrecteurFieldsFromMember(member) {
        if (!member) return;

        const nomFr = member.nomMembre || member.nomFr || "";
        const prenomFr = member.prenomMembre || member.prenomFr || "";
        const nomAr = member.nomAr || member.nom_ar || "";
        const prenomAr = member.prenomAr || member.prenom_ar || "";
        const grade = member.grade || "";
        const sexe = member.sexe || "FEMME";

        if (corrNomFrInput) corrNomFrInput.value = nomFr;
        if (corrPrenomFrInput) corrPrenomFrInput.value = prenomFr;
        if (corrNomArInput) corrNomArInput.value = nomAr;
        if (corrPrenomArInput) corrPrenomArInput.value = prenomAr;
        if (corrGradeSelect) corrGradeSelect.value = grade;

        if (sexeCorrHidden) sexeCorrHidden.value = sexe;
        if (sexeToggleCorr) {
            sexeToggleCorr.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === sexe);
            });
        }
    }

    /* =========================================================
       CHARGER MEMBRES EXISTANTS POUR CORRECTEUR
       ========================================================= */
    async function loadMembresForCorrecteurModal() {
        try {
            const data = await fetchJson(`${API_BASE}/membres`, {
                method: "GET",
            });

            membresExistants = Array.isArray(data)
                ? data
                : (data?.data || data?.membres || []);

            hideCorrecteurSuggestions();
        } catch (err) {
            console.error("Erreur chargement membres pour modal Correcteur :", err);
            showToast("Impossible de charger la liste des membres.", "error");
        }
    }

    /* =========================================================
       SUGGESTIONS RECHERCHE CORRECTEUR
       ========================================================= */
    function hideCorrecteurSuggestions() {
        if (!correcteurSuggestions) return;
        correcteurSuggestions.innerHTML = "";
        correcteurSuggestions.style.display = "none";
    }

    function renderCorrecteurSuggestions(keyword = "") {
        if (!correcteurSuggestions) return;

        const usedIds = correcteurs.map((c) => String(c.idMembre));
        const term = (keyword || "").trim().toLowerCase();

        const filtered = membresExistants.filter((m) => {
            const id = String(m.idMembre || m.id_membre || m.id || "");
            if (!id) return false;
            if (usedIds.includes(id)) return false;

            const nomFr = (m.nomMembre || m.nomFr || "").toLowerCase();
            const prenomFr = (m.prenomMembre || m.prenomFr || "").toLowerCase();
            const nomAr = (m.nomAr || m.nom_ar || "").toLowerCase();
            const prenomAr = (m.prenomAr || m.prenom_ar || "").toLowerCase();
            const grade = (m.grade || "").toLowerCase();

            const fullFr1 = `${nomFr} ${prenomFr}`.trim();
            const fullFr2 = `${prenomFr} ${nomFr}`.trim();
            const fullAr1 = `${nomAr} ${prenomAr}`.trim();
            const fullAr2 = `${prenomAr} ${nomAr}`.trim();

            return (
                !!term &&
                (
                    nomFr.includes(term) ||
                    prenomFr.includes(term) ||
                    nomAr.includes(term) ||
                    prenomAr.includes(term) ||
                    grade.includes(term) ||
                    fullFr1.includes(term) ||
                    fullFr2.includes(term) ||
                    fullAr1.includes(term) ||
                    fullAr2.includes(term)
                )
            );
        });

        correcteurSuggestions.innerHTML = "";

        if (!term) {
            hideCorrecteurSuggestions();
            return;
        }

        if (!filtered.length) {
            correcteurSuggestions.innerHTML = `<div class="combo-empty">Aucun membre trouvé</div>`;
            correcteurSuggestions.style.display = "block";
            return;
        }

        filtered.forEach((m) => {
            const id = m.idMembre || m.id_membre || m.id || "";
            const nomFr = m.nomMembre || m.nomFr || "";
            const prenomFr = m.prenomMembre || m.prenomFr || "";
            const grade = m.grade || "";

            const item = document.createElement("div");
            item.className = "combo-suggestion-item";
            item.innerHTML = `
            <span>${nomFr} ${prenomFr}</span>
            ${grade ? `<span class="combo-suggestion-grade">— ${grade}</span>` : ""}
        `;

            item.addEventListener("click", () => {
                if (selectedCorrecteurExistantInput) {
                    selectedCorrecteurExistantInput.value = id;
                }

                if (searchCorrecteurExistantInput) {
                    searchCorrecteurExistantInput.value = `${nomFr} ${prenomFr}`.trim();
                }

                fillCorrecteurFieldsFromMember(m);
                hideCorrecteurSuggestions();
            });

            correcteurSuggestions.appendChild(item);
        });

        correcteurSuggestions.style.display = "block";
    }

    function updateCorrecteurExistantSuggestions() {
        const term = searchCorrecteurExistantInput?.value.trim() || "";
        if (!term) {
            hideCorrecteurSuggestions();
            return;
        }
        renderCorrecteurSuggestions(term);
    }

    if (searchCorrecteurExistantInput) {
        searchCorrecteurExistantInput.addEventListener("input", () => {
            const term = searchCorrecteurExistantInput.value.trim();

            if (selectedCorrecteurExistantInput) {
                selectedCorrecteurExistantInput.value = "";
            }

            if (!term) {
                hideCorrecteurSuggestions();
                return;
            }

            renderCorrecteurSuggestions(term);
        });
    }

    document.addEventListener("click", (e) => {
        const insideSearch = searchCorrecteurExistantInput?.contains(e.target);
        const insideSuggestions = correcteurSuggestions?.contains(e.target);

        if (!insideSearch && !insideSuggestions) {
            hideCorrecteurSuggestions();
        }
    });

    /* =========================================================
       TOGGLE SEXE CORRECTEUR
       ========================================================= */
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

    /* =========================================================
       OUVRIR MODALE CORRECTEUR
       ========================================================= */
    if (btnOpenModalCorrecteur && formCorrecteur) {
        btnOpenModalCorrecteur.addEventListener("click", async () => {
            formCorrecteur.reset();
            resetCorrecteurFields();

            if (searchCorrecteurExistantInput) {
                searchCorrecteurExistantInput.value = "";
            }

            if (selectedCorrecteurExistantInput) {
                selectedCorrecteurExistantInput.value = "";
            }

            hideCorrecteurSuggestions();
            await loadMembresForCorrecteurModal();

            openModal(modalCorrecteur);
        });
    }

    /* =========================================================
       SUBMIT CORRECTEUR
       ========================================================= */
    if (formCorrecteur) {
        formCorrecteur.addEventListener("submit", async (e) => {
            e.preventDefault();

            const selectedExistingId = selectedCorrecteurExistantInput?.value || "";

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

            if (!idConcours) {
                showToast("Veuillez choisir un concours dans view CFD.", "warning");
                return;
            }

            const submitBtn = formCorrecteur.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Enregistrement...";
            }

            let idMembre = selectedExistingId;

            try {
                /* 1) créer membre uniquement si aucun membre existant n'a été choisi */
                if (!idMembre) {
                    const payload = {
                        nomMembre: nomFr,
                        prenomMembre: prenomFr,
                        nomAr,
                        prenomAr,
                        grade,
                        sexe,
                    };

                    const created = await fetchJson(`${API_BASE}/membres`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });

                    idMembre = created?.idMembre || created?.id_membre;

                    if (!idMembre) {
                        throw new Error("idMembre manquant dans la réponse /membres");
                    }
                }

                /* 2) éviter doublon local */
                const alreadyExists = correcteurs.some(
                    (c) => String(c.idMembre) === String(idMembre)
                );

                if (alreadyExists) {
                    showToast("Ce membre existe déjà dans la liste des correcteurs.", "warning");
                    return;
                }

                /* 3) générer username/password */
                const username = `${nomFr}.${prenomFr}`.replace(/\s+/g, "").toLowerCase();
                const password = `${nomFr}_${prenomFr}_CORRECTEUR`;

                /* 4) créer user */
                const userPayload = { username, password, role: "CORRECTEUR", idMembre };

                const createdUser = await fetchJson(`${API_BASE}/users`, {
                    method: "POST",
                    body: JSON.stringify(userPayload),
                });

                let idUser = createdUser?.user?.idUser || createdUser?.user?.id_user;
                if (!idUser) throw new Error("idUser manquant dans la réponse /users");

                /* 5) créer correcteur */
                const correcteurPayload = {
                    idMembre,
                    idConcours,
                    idSpecialite: specId,
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
                updateCorrecteurExistantSuggestions();
                closeModal(modalCorrecteur);
                showToast("Correcteur ajouté.", "success");
            } catch (err) {
                console.error("Erreur ajout correcteur:", err);
                showToast("Erreur lors de l'enregistrement côté serveur.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Enregistrer le correcteur";
                }
            }
        });
    }

    /* =========================================================
       RENDER CORRECTEURS
       ========================================================= */
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
                <button type="button" class="btn-icon btn-icon-danger" data-remove-corr="${c.idUser}">
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
                updateCorrecteurExistantSuggestions();

                showToast("Correcteur supprimé.", "danger");
            });
        });
    }

    renderCorrecteurs();

    /* =========================
       ANONYMAT (inchangé sauf protections)
       ========================= */

    /* =========================================================
       ANONYMAT - VERSION ADAPTÉE AVEC RECHERCHE MEMBRE EXISTANT
       Utilise la même liste globale : membresExistants
       HTML requis :
       - #searchAnonymatExistant
       - #selectedAnonymatExistant
       - #anonymatSuggestions
       ========================================================= */

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
    const anonymatRoleSelect = document.getElementById("anonymatRoleSelect");

    /* === recherche membre existant === */
    const searchAnonymatExistantInput = document.getElementById("searchAnonymatExistant");
    const selectedAnonymatExistantInput = document.getElementById("selectedAnonymatExistant");
    const anonymatSuggestions = document.getElementById("anonymatSuggestions");

    /* === champs anonymat === */
    const anonyNomFrInput = document.getElementById("anonyNomFr");
    const anonyPrenomFrInput = document.getElementById("anonyPrenomFr");
    const anonyNomArInput = document.getElementById("anonyNomAr");
    const anonyPrenomArInput = document.getElementById("anonyPrenomAr");
    const anonyGradeSelect = document.getElementById("anonyGrade");

    /* =========================================================
       HELPERS MEMBRES PARTAGÉS
       ========================================================= */
    async function loadMembresForAnonymatModal() {
        try {
            const data = await fetchJson(`${API_BASE}/membres`, {
                method: "GET",
            });

            membresExistants = Array.isArray(data)
                ? data
                : (data?.data || data?.membres || []);

            hideAnonymatSuggestions();
        } catch (err) {
            console.error("Erreur chargement membres pour modal Anonymat :", err);
            showToast("Impossible de charger la liste des membres.", "error");
        }
    }

    function resetAnonymatFields() {
        if (anonyNomFrInput) anonyNomFrInput.value = "";
        if (anonyPrenomFrInput) anonyPrenomFrInput.value = "";
        if (anonyNomArInput) anonyNomArInput.value = "";
        if (anonyPrenomArInput) anonyPrenomArInput.value = "";
        if (anonyGradeSelect) anonyGradeSelect.value = "";

        if (sexeAnonyHidden) sexeAnonyHidden.value = "FEMME";
        if (sexeToggleAnony) {
            sexeToggleAnony.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
            });
        }
    }

    function fillAnonymatFieldsFromMember(member) {
        if (!member) return;

        const nomFr = member.nomMembre || member.nomFr || "";
        const prenomFr = member.prenomMembre || member.prenomFr || "";
        const nomAr = member.nomAr || member.nom_ar || "";
        const prenomAr = member.prenomAr || member.prenom_ar || "";
        const grade = member.grade || "";
        const sexe = member.sexe || "FEMME";

        if (anonyNomFrInput) anonyNomFrInput.value = nomFr;
        if (anonyPrenomFrInput) anonyPrenomFrInput.value = prenomFr;
        if (anonyNomArInput) anonyNomArInput.value = nomAr;
        if (anonyPrenomArInput) anonyPrenomArInput.value = prenomAr;
        if (anonyGradeSelect) anonyGradeSelect.value = grade;

        if (sexeAnonyHidden) sexeAnonyHidden.value = sexe;
        if (sexeToggleAnony) {
            sexeToggleAnony.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === sexe);
            });
        }
    }

    /* =========================================================
       SUGGESTIONS ANONYMAT
       ========================================================= */
    function hideAnonymatSuggestions() {
        if (!anonymatSuggestions) return;
        anonymatSuggestions.innerHTML = "";
        anonymatSuggestions.style.display = "none";
    }

    function renderAnonymatSuggestions(keyword = "") {
        if (!anonymatSuggestions) return;

        const usedIds = anonymatMembers.map((m) => String(m.idMembre)).filter(Boolean);
        const term = (keyword || "").trim().toLowerCase();

        if (!term) {
            hideAnonymatSuggestions();
            return;
        }

        const filtered = membresExistants.filter((m) => {
            const id = String(m.idMembre || m.id_membre || m.id || "");
            if (!id) return false;
            if (usedIds.includes(id)) return false;

            const nomFr = (m.nomMembre || m.nomFr || "").toLowerCase();
            const prenomFr = (m.prenomMembre || m.prenomFr || "").toLowerCase();
            const nomAr = (m.nomAr || m.nom_ar || "").toLowerCase();
            const prenomAr = (m.prenomAr || m.prenom_ar || "").toLowerCase();
            const grade = (m.grade || "").toLowerCase();

            const fullFr1 = `${nomFr} ${prenomFr}`.trim();
            const fullFr2 = `${prenomFr} ${nomFr}`.trim();
            const fullAr1 = `${nomAr} ${prenomAr}`.trim();
            const fullAr2 = `${prenomAr} ${nomAr}`.trim();

            return (
                nomFr.includes(term) ||
                prenomFr.includes(term) ||
                nomAr.includes(term) ||
                prenomAr.includes(term) ||
                grade.includes(term) ||
                fullFr1.includes(term) ||
                fullFr2.includes(term) ||
                fullAr1.includes(term) ||
                fullAr2.includes(term)
            );
        });

        anonymatSuggestions.innerHTML = "";

        if (!filtered.length) {
            anonymatSuggestions.innerHTML = `<div class="combo-empty">Aucun membre trouvé</div>`;
            anonymatSuggestions.style.display = "block";
            return;
        }

        filtered.forEach((m) => {
            const id = m.idMembre || m.id_membre || m.id || "";
            const nomFr = m.nomMembre || m.nomFr || "";
            const prenomFr = m.prenomMembre || m.prenomFr || "";
            const grade = m.grade || "";

            const item = document.createElement("div");
            item.className = "combo-suggestion-item";
            item.innerHTML = `
            <span>${nomFr} ${prenomFr}</span>
            ${grade ? `<span class="combo-suggestion-grade">— ${grade}</span>` : ""}
        `;

            item.addEventListener("click", () => {
                if (selectedAnonymatExistantInput) {
                    selectedAnonymatExistantInput.value = id;
                }

                if (searchAnonymatExistantInput) {
                    searchAnonymatExistantInput.value = `${nomFr} ${prenomFr}`.trim();
                }

                fillAnonymatFieldsFromMember(m);
                hideAnonymatSuggestions();
            });

            anonymatSuggestions.appendChild(item);
        });

        anonymatSuggestions.style.display = "block";
    }

    function updateAnonymatExistantSuggestions() {
        const term = searchAnonymatExistantInput?.value.trim() || "";
        if (!term) {
            hideAnonymatSuggestions();
            return;
        }
        renderAnonymatSuggestions(term);
    }

    if (searchAnonymatExistantInput) {
        searchAnonymatExistantInput.addEventListener("input", () => {
            const term = searchAnonymatExistantInput.value.trim();

            if (selectedAnonymatExistantInput) {
                selectedAnonymatExistantInput.value = "";
            }

            if (!term) {
                hideAnonymatSuggestions();
                return;
            }

            renderAnonymatSuggestions(term);
        });
    }

    document.addEventListener("click", (e) => {
        const insideSearch = searchAnonymatExistantInput?.contains(e.target);
        const insideSuggestions = anonymatSuggestions?.contains(e.target);

        if (!insideSearch && !insideSuggestions) {
            hideAnonymatSuggestions();
        }
    });

    /* =========================================================
       TOGGLE SEXE
       ========================================================= */
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

    /* =========================================================
       OUVRIR MODALE
       ========================================================= */
    if (btnOpenModalAnonymat && formAnonymat) {
        btnOpenModalAnonymat.addEventListener("click", async () => {
            formAnonymat.reset();
            resetAnonymatFields();

            if (anonymatRoleSelect) {
                anonymatRoleSelect.innerHTML = buildAnonymatRoleOptionsHtml("");
            }

            if (searchAnonymatExistantInput) {
                searchAnonymatExistantInput.value = "";
            }

            if (selectedAnonymatExistantInput) {
                selectedAnonymatExistantInput.value = "";
            }

            hideAnonymatSuggestions();
            await loadMembresForAnonymatModal();

            openModal(modalAnonymat);
        });
    }

    /* =========================================================
       SUBMIT ANONYMAT
       ========================================================= */
    if (formAnonymat) {
        formAnonymat.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!cfdConcoursSelect) return;

            const selectedExistingId = selectedAnonymatExistantInput?.value || "";
            const concoursId = cfdConcoursSelect.value;
            const concoursLabel = cfdConcoursSelect.options[cfdConcoursSelect.selectedIndex]?.text || "";

            const nomFr = document.getElementById("anonyNomFr")?.value.trim() || "";
            const prenomFr = document.getElementById("anonyPrenomFr")?.value.trim() || "";
            const nomAr = document.getElementById("anonyNomAr")?.value.trim() || "";
            const prenomAr = document.getElementById("anonyPrenomAr")?.value.trim() || "";
            const grade = document.getElementById("anonyGrade")?.value.trim() || "";
            const sexe = document.getElementById("sexeAnonymat")?.value || "FEMME";
            const role = document.getElementById("anonymatRoleSelect")?.value || "";

            if (!concoursId) {
                showToast("Veuillez sélectionner un concours.", "warning");
                return;
            }

            if (!nomFr || !prenomFr) {
                showToast("Nom, prénom sont obligatoires.", "warning");
                return;
            }

            if (!role) {
                showToast("Veuillez choisir un rôle.", "warning");
                return;
            }

            let idMembre = selectedExistingId;

            try {
                /* créer membre seulement si aucun existant n'a été choisi */
                if (!idMembre) {
                    const payload = {
                        nomMembre: nomFr,
                        prenomMembre: prenomFr,
                        nomAr,
                        prenomAr,
                        grade,
                        sexe,
                    };

                    const created = await fetchJson(`${API_BASE}/membres`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });

                    idMembre = created?.idMembre || created?.id_membre || created?.membre?.idMembre;

                    if (!idMembre) {
                        throw new Error("idMembre manquant après création du membre");
                    }
                }

                /* créer user pour ce membre */
                const username = `${nomFr}.${prenomFr}`.replace(/\s+/g, "").toLowerCase();
                const password = `${nomFr}_${prenomFr}_ANONYMAT`;

                const userPayload = {
                    username,
                    password,
                    role: "CELLULE_ANONYMAT",
                    idMembre,
                };

                const createdUserAnonymat = await fetchJson(`${API_BASE}/users`, {
                    method: "POST",
                    body: JSON.stringify(userPayload),
                });

                const idUser =
                    createdUserAnonymat?.user?.idUser ||
                    createdUserAnonymat?.user?.id_user ||
                    createdUserAnonymat?.idUser ||
                    createdUserAnonymat?.id_user;

                if (!idUser) {
                    throw new Error("idUser manquant après création du user");
                }

                /* créer cellule anonymat */
                const cellulePayload = {
                    idMembre,
                    idConcours: concoursId,
                };

                const createdCelluleAnonymat = await fetchJson(`${API_BASE}/cellules-anonymat`, {
                    method: "POST",
                    body: JSON.stringify(cellulePayload),
                });

                const idCellule =
                    createdCelluleAnonymat?.idCellule ||
                    createdCelluleAnonymat?.id_cellule ||
                    createdCelluleAnonymat?.cellule?.idCellule ||
                    null;

                const alreadyExists = anonymatMembers.some(
                    (m) => String(m.idMembre) === String(idMembre)
                );

                if (alreadyExists) {
                    showToast("Ce membre existe déjà dans la cellule d’anonymat.", "warning");
                    return;
                }

                anonymatMembers.push({
                    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    idCellule,
                    idUser,
                    idMembre,
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
                updateAnonymatExistantSuggestions();
                closeModal(modalAnonymat);
                showToast("Membre anonymat ajouté.", "success");
            } catch (err) {
                console.error("Erreur ajout membre anonymat :", err);
                showToast("Erreur lors de l'ajout du membre.", "error");
            }
        });
    }

    /* =========================================================
       RENDER ANONYMAT
       ========================================================= */
    function renderAnonymat() {
        if (!anonymatBody) return;
        anonymatBody.innerHTML = "";

        anonymatMembers.forEach((m, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${m.nomFr} ${m.prenomFr}</td>
            <td>${m.role || ""}</td>
            <td class="table-actions">
                <button type="button" class="btn-icon btn-icon-danger" data-remove-anony="${m.localId}">
                    <i class="uil uil-trash"></i>
                </button>
            </td>
        `;
            anonymatBody.appendChild(tr);
        });

        anonymatBody.querySelectorAll("[data-remove-anony]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const localId = btn.getAttribute("data-remove-anony");
                anonymatMembers = anonymatMembers.filter((m) => String(m.localId) !== String(localId));
                renderAnonymat();
                updateAnonymatExistantSuggestions();
                showToast("Membre anonymat supprimé.", "danger");
            });
        });
    }

    renderAnonymat();

    /* =========================
       RESPONSABLE CFD (form)
       ========================= */

    const cfdConcoursSelect = document.getElementById("cfdConcoursSelect");

    async function loadAnonymatConcoursOptions() {
        if (!cfdConcoursSelect) {
            return;
        }

        try {
            const userJson = localStorage.getItem("dg-user");
            let idMembre = null;
            if (userJson) idMembre = JSON.parse(userJson)?.idMembre;

            if (!idMembre) {
                showToast("Utilisateur non identifié.", "warning");
                return;
            }

            const response = await fetchJson(`${API_BASE}/concours/doyen/${idMembre}`);
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

            let username;
            let password;

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
            const num = localStorage.getItem("dg-numeroConcours");
            title.textContent = `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n${num}\n`;
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


    /* =========================================================
       SURVEILLANCE - VERSION FINALE
       Utilise la même liste globale : membresExistants
       ========================================================= */

    let surveillanceMembers = [];

    /* ========= DOM ========= */

    const surveillanceBody = document.getElementById("surveillanceBody");

    const searchSurveillanceExistantInput = document.getElementById("searchSurveillanceExistant");
    const selectedSurveillanceExistantInput = document.getElementById("selectedSurveillanceExistant");
    const surveillanceSuggestions = document.getElementById("surveillanceSuggestions");

    const survNomFrInput = document.getElementById("survNomFr");
    const survPrenomFrInput = document.getElementById("survPrenomFr");
    const survNomArInput = document.getElementById("survNomAr");
    const survPrenomArInput = document.getElementById("survPrenomAr");
    const survGradeSelect = document.getElementById("survGrade");

    const survSalleSelect = document.getElementById("survSalleSelect");
    const survRoleSelect = document.getElementById("survRoleSelect");

    /* =========================================================
       HELPERS
       ========================================================= */
    function hideSurveillanceSuggestions() {
        if (!surveillanceSuggestions) return;
        surveillanceSuggestions.innerHTML = "";
        surveillanceSuggestions.style.display = "none";
    }

    function resetSurveillanceFields() {
        if (survNomFrInput) survNomFrInput.value = "";
        if (survPrenomFrInput) survPrenomFrInput.value = "";
        if (survNomArInput) survNomArInput.value = "";
        if (survPrenomArInput) survPrenomArInput.value = "";
        if (survGradeSelect) survGradeSelect.value = "";

        if (sexeSurveillanceHidden) sexeSurveillanceHidden.value = "FEMME";

        if (sexeToggleSurveillance) {
            sexeToggleSurveillance.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
            });
        }

        if (survSalleSelect) survSalleSelect.value = "";
        if (survRoleSelect) survRoleSelect.value = "";
    }

    function fillSurveillanceFieldsFromMember(member) {
        if (!member) return;

        const nomFr = member.nomMembre || member.nomFr || "";
        const prenomFr = member.prenomMembre || member.prenomFr || "";
        const nomAr = member.nomAr || member.nom_ar || "";
        const prenomAr = member.prenomAr || member.prenom_ar || "";
        const grade = member.grade || "";
        const sexe = member.sexe || "FEMME";

        if (survNomFrInput) survNomFrInput.value = nomFr;
        if (survPrenomFrInput) survPrenomFrInput.value = prenomFr;
        if (survNomArInput) survNomArInput.value = nomAr;
        if (survPrenomArInput) survPrenomArInput.value = prenomAr;
        if (survGradeSelect) survGradeSelect.value = grade;

        if (sexeSurveillanceHidden) sexeSurveillanceHidden.value = sexe;

        if (sexeToggleSurveillance) {
            sexeToggleSurveillance.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === sexe);
            });
        }
    }

    /* =========================================================
       CHARGER LA MÊME LISTE GLOBALE DES MEMBRES
       ========================================================= */
    async function loadMembresForSurveillanceModal() {
        try {
            const data = await fetchJson(`${API_BASE}/membres`, {
                method: "GET",
            });

            membresExistants = Array.isArray(data)
                ? data
                : (data?.data || data?.membres || []);

            hideSurveillanceSuggestions();
        } catch (err) {
            console.error("Erreur chargement membres pour Surveillance :", err);
            showToast("Impossible de charger la liste des membres.", "error");
        }
    }

    /* =========================================================
       CHARGER LES SALLES
       ========================================================= */
    async function loadSallesForSurveillanceModal() {
        if (!survSalleSelect) return;

        survSalleSelect.innerHTML = `<option value="">Chargement...</option>`;
        survSalleSelect.disabled = true;

        try {
            const data = await fetchJson(`${API_BASE}/salles`, {
                method: "GET",
            });

            const salles = Array.isArray(data)
                ? data
                : (data?.data || data?.salles || []);

            survSalleSelect.innerHTML = `<option value="">-- Choisir une salle --</option>`;

            if (!salles.length) {
                survSalleSelect.innerHTML = `<option value="">Aucune salle disponible</option>`;
                survSalleSelect.disabled = true;
                return;
            }

            salles.forEach((salle) => {
                const idSalle = salle.idSalle || salle.id_salle || salle.id || "";
                const nomSalle = salle.nomSalle || salle.nom || salle.libelle || "Salle";

                const opt = document.createElement("option");
                opt.value = idSalle || nomSalle;
                opt.textContent = nomSalle;
                opt.dataset.label = nomSalle;
                survSalleSelect.appendChild(opt);
            });

            survSalleSelect.disabled = false;
        } catch (err) {
            console.error("Erreur chargement salles surveillance :", err);
            survSalleSelect.innerHTML = `<option value="">-- Choisir une salle --</option>`;
            survSalleSelect.disabled = true;
            showToast("Impossible de charger les salles.", "error");
        }
    }

    /* =========================================================
       SUGGESTIONS DE MEMBRES
       ========================================================= */
    function renderSurveillanceSuggestions(keyword = "") {
        if (!surveillanceSuggestions) return;

        const usedIds = surveillanceMembers.map((m) => String(m.idMembre)).filter(Boolean);
        const term = (keyword || "").trim().toLowerCase();

        if (!term) {
            hideSurveillanceSuggestions();
            return;
        }

        const filtered = membresExistants.filter((m) => {
            const id = String(m.idMembre || m.id_membre || m.id || "");
            if (!id) return false;
            if (usedIds.includes(id)) return false;

            const nomFr = (m.nomMembre || m.nomFr || "").toLowerCase();
            const prenomFr = (m.prenomMembre || m.prenomFr || "").toLowerCase();
            const nomAr = (m.nomAr || m.nom_ar || "").toLowerCase();
            const prenomAr = (m.prenomAr || m.prenom_ar || "").toLowerCase();
            const grade = (m.grade || "").toLowerCase();

            const fullFr1 = `${nomFr} ${prenomFr}`.trim();
            const fullFr2 = `${prenomFr} ${nomFr}`.trim();
            const fullAr1 = `${nomAr} ${prenomAr}`.trim();
            const fullAr2 = `${prenomAr} ${nomAr}`.trim();

            return (
                nomFr.includes(term) ||
                prenomFr.includes(term) ||
                nomAr.includes(term) ||
                prenomAr.includes(term) ||
                grade.includes(term) ||
                fullFr1.includes(term) ||
                fullFr2.includes(term) ||
                fullAr1.includes(term) ||
                fullAr2.includes(term)
            );
        });

        surveillanceSuggestions.innerHTML = "";

        if (!filtered.length) {
            surveillanceSuggestions.innerHTML = `<div class="combo-empty">Aucun membre trouvé</div>`;
            surveillanceSuggestions.style.display = "block";
            return;
        }

        filtered.forEach((m) => {
            const id = m.idMembre || m.id_membre || m.id || "";
            const nomFr = m.nomMembre || m.nomFr || "";
            const prenomFr = m.prenomMembre || m.prenomFr || "";
            const grade = m.grade || "";

            const item = document.createElement("div");
            item.className = "combo-suggestion-item";
            item.innerHTML = `
            <span>${nomFr} ${prenomFr}</span>
            ${grade ? `<span class="combo-suggestion-grade">— ${grade}</span>` : ""}
        `;

            item.addEventListener("click", () => {
                if (selectedSurveillanceExistantInput) {
                    selectedSurveillanceExistantInput.value = id;
                }

                if (searchSurveillanceExistantInput) {
                    searchSurveillanceExistantInput.value = `${nomFr} ${prenomFr}`.trim();
                }

                fillSurveillanceFieldsFromMember(m);
                hideSurveillanceSuggestions();
            });

            surveillanceSuggestions.appendChild(item);
        });

        surveillanceSuggestions.style.display = "block";
    }

    function updateSurveillanceSuggestions() {
        const term = searchSurveillanceExistantInput?.value.trim() || "";
        if (!term) {
            hideSurveillanceSuggestions();
            return;
        }
        renderSurveillanceSuggestions(term);
    }

    if (searchSurveillanceExistantInput) {
        searchSurveillanceExistantInput.addEventListener("input", () => {
            const term = searchSurveillanceExistantInput.value.trim();

            if (selectedSurveillanceExistantInput) {
                selectedSurveillanceExistantInput.value = "";
            }

            if (!term) {
                hideSurveillanceSuggestions();
                return;
            }

            renderSurveillanceSuggestions(term);
        });
    }

    document.addEventListener("click", (e) => {
        const insideSearch = searchSurveillanceExistantInput?.contains(e.target);
        const insideSuggestions = surveillanceSuggestions?.contains(e.target);

        if (!insideSearch && !insideSuggestions) {
            hideSurveillanceSuggestions();
        }
    });

    /* =========================================================
       TOGGLE SEXE
       ========================================================= */
    if (sexeSurveillanceHidden && sexeToggleSurveillance) {
        const sexButtons = sexeToggleSurveillance.querySelectorAll(".sex-option");

        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeSurveillanceHidden.value = value;

                sexButtons.forEach((b) => {
                    b.classList.toggle("sex-option-active", b === btn);
                });
            });
        });
    }

    /* =========================================================
       OUVERTURE MODALE
       ========================================================= */
    if (btnOpenModalSalle && formSurveillance) {
        btnOpenModalSalle.addEventListener("click", async () => {
            formSurveillance.reset();
            resetSurveillanceFields();

            if (searchSurveillanceExistantInput) {
                searchSurveillanceExistantInput.value = "";
            }

            if (selectedSurveillanceExistantInput) {
                selectedSurveillanceExistantInput.value = "";
            }

            hideSurveillanceSuggestions();

            await loadMembresForSurveillanceModal();
            await loadSallesForSurveillanceModal();

            openModal(modalSurveillance);
        });
    }

    /* =========================================================
       SUBMIT
       ========================================================= */
    if (formSurveillance) {
        formSurveillance.addEventListener("submit", async (e) => {
            e.preventDefault();

            const selectedExistingId = selectedSurveillanceExistantInput?.value || "";

            const nomFr = survNomFrInput?.value.trim() || "";
            const prenomFr = survPrenomFrInput?.value.trim() || "";
            const nomAr = survNomArInput?.value.trim() || "";
            const prenomAr = survPrenomArInput?.value.trim() || "";
            const grade = survGradeSelect?.value.trim() || "";
            const sexe = sexeSurveillanceHidden?.value || "FEMME";
            const idConcours = localStorage.getItem("dg-id");

            const idSalle = survSalleSelect?.value || "";
            const salleLabel =
                survSalleSelect?.options?.[survSalleSelect.selectedIndex]?.dataset?.label ||
                survSalleSelect?.options?.[survSalleSelect.selectedIndex]?.text ||
                "";

            const role = survRoleSelect?.value || "";

            if (!nomFr || !prenomFr) {
                showToast("Nom et prénom sont obligatoires.", "warning");
                return;
            }

            if (!idConcours) {
                showToast("Veuillez choisir un concours d'abord.", "warning");
                return;
            }

            if (!idSalle) {
                showToast("Veuillez choisir une salle.", "warning");
                return;
            }

            if (!role) {
                showToast("Veuillez choisir un rôle.", "warning");
                return;
            }

            const submitBtn = document.getElementById("btnSaveSurveillance");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="uil uil-spinner-alt"></i> Enregistrement...`;
            }

            let idMembre = selectedExistingId;

            try {
                if (!idMembre) {
                    const payload = {
                        nomMembre: nomFr,
                        prenomMembre: prenomFr,
                        nomAr,
                        prenomAr,
                        grade,
                        sexe,
                    };

                    const created = await fetchJson(`${API_BASE}/membres`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });

                    idMembre = created?.idMembre || created?.id_membre || created?.membre?.idMembre;

                    if (!idMembre) {
                        throw new Error("idMembre manquant après création du membre");
                    }
                }

                const alreadyExists = surveillanceMembers.some(
                    (m) => String(m.idMembre) === String(idMembre)
                );

                if (alreadyExists) {
                    showToast("Ce membre existe déjà dans l’organisation de surveillance.", "warning");
                    return;
                }
if (role === "RESPONSABLE") {
const username = `${nomFr}.${prenomFr}`.replace(/\s+/g, "").toLowerCase();
                const password = `${nomFr}_${prenomFr}_RESPONSABLE_SALLE`;

                const userPayload = {
                    username,
                    password,
                    role: "RESPONSABLE_SALLE",
                    idMembre,
                };

                const createdUser = await fetchJson(`${API_BASE}/users`, {
                    method: "POST",
                    body: JSON.stringify(userPayload),
                });

                const idUser =
                    createdUser?.user?.idUser ||
                    createdUser?.user?.id_user ||
                    createdUser?.idUser ||
                    createdUser?.id_user;

                if (!idUser) {
                    throw new Error("idUser manquant après création du user");
                }

                }

                

            /*    const surveillancePayload = {
                    idMembre,
                    idConcours,
                    idSalle,
                };

                const createdSurveillance = await fetchJson(`${API_BASE}/responsable-salles`, {
                    method: "POST",
                    body: JSON.stringify(surveillancePayload),
                });
                 const idSurveillance =
                    createdSurveillance?.idSurveillance ||
                    createdSurveillance?.id_surveillance ||
                    createdSurveillance?.surveillance?.idSurveillance ||
                    null;
                */

               

                surveillanceMembers.push({
                    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    idMembre,
                    nomFr,
                    prenomFr,
                    nomAr,
                    prenomAr,
                    grade,
                    sexe,
                    idSalle,
                    salle: salleLabel,
                    role,
                });

                renderSurveillanceMembers();
                updateSurveillanceSuggestions();
                closeModal(modalSurveillance);
                showToast("Membre de surveillance ajouté.", "success");
            } catch (err) {
                console.error("Erreur ajout surveillance :", err);
                showToast("Erreur lors de l'enregistrement.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="uil uil-check"></i> Enregistrer le membre`;
                }
            }
        });
    }

    /* =========================================================
       RENDER
       ========================================================= */
    function renderSurveillanceMembers() {
        if (!surveillanceBody) return;
        surveillanceBody.innerHTML = "";

        surveillanceMembers.forEach((m, index) => {
            const roleLabel =
                m.role === "RESPONSABLE" ? "Responsable" :
                    m.role === "SURVEILLANT" ? "Surveillant" :
                        (m.role || "");

            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${m.nomFr} ${m.prenomFr}</td>
            <td>${m.grade || ""}</td>
            <td>${m.salle || ""}</td>
            <td>${roleLabel}</td>
            <td class="table-actions">
                <button type="button" class="btn-icon btn-icon-danger" data-remove-surv="${m.localId}">
                    <i class="uil uil-trash"></i>
                </button>
            </td>
        `;
            surveillanceBody.appendChild(tr);
        });

        surveillanceBody.querySelectorAll("[data-remove-surv]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const localId = btn.getAttribute("data-remove-surv");
                surveillanceMembers = surveillanceMembers.filter(
                    (m) => String(m.localId) !== String(localId)
                );
                renderSurveillanceMembers();
                updateSurveillanceSuggestions();
                showToast("Membre supprimé.", "danger");
            });
        });
    }

    renderSurveillanceMembers();

    /* =========================================================
   COMMISSION D'ÉLABORATION DES SUJETS
   Utilise la même liste globale : membresExistants
   HTML requis :
   - #modalCommissionSujets
   - #formCommissionSujets
   - #searchCommissionSujetsExistant
   - #selectedCommissionSujetsExistant
   - #commissionSujetsSuggestions
   - #csNomFr, #csPrenomFr, #csNomAr, #csPrenomAr, #csGrade
   - #sexeToggleCommissionSujets, #sexeCommissionSujets
   - #universiteCommission
   - #btnOpenModalCommissionSujets
   - #commissionSujetsBody
   ========================================================= */

    let commissionSujetsMembers = [];

    /* ========= DOM ========= */
    const modalCommissionSujets = document.getElementById("modalCommissionSujets");
    const formCommissionSujets = document.getElementById("formCommissionSujets");
    const btnOpenModalCommissionSujets = document.getElementById("btnOpenModalCommissionSujets");
    const commissionSujetsBody = document.getElementById("commissionSujetsBody");

    const searchCommissionSujetsExistantInput = document.getElementById("searchCommissionSujetsExistant");
    const selectedCommissionSujetsExistantInput = document.getElementById("selectedCommissionSujetsExistant");
    const commissionSujetsSuggestions = document.getElementById("commissionSujetsSuggestions");

    const csNomFrInput = document.getElementById("csNomFr");
    const csPrenomFrInput = document.getElementById("csPrenomFr");
    const csNomArInput = document.getElementById("csNomAr");
    const csPrenomArInput = document.getElementById("csPrenomAr");
    const csGradeSelect = document.getElementById("csGrade");

    const sexeCommissionHidden = document.getElementById("sexeCommissionSujets");
    const sexeToggleCommission = document.getElementById("sexeToggleCommissionSujets");

    const universiteCommissionInput = document.getElementById("universiteCommission");

    /* =========================================================
       HELPERS MEMBRES PARTAGÉS
       ========================================================= */
    async function loadMembresForCommissionSujetsModal() {
        try {
            const data = await fetchJson(`${API_BASE}/membres`, {
                method: "GET",
            });

            membresExistants = Array.isArray(data)
                ? data
                : (data?.data || data?.membres || []);

            hideCommissionSujetsSuggestions();
        } catch (err) {
            console.error("Erreur chargement membres pour Commission sujets :", err);
            showToast("Impossible de charger la liste des membres.", "error");
        }
    }

    function resetCommissionSujetsFields() {
        if (csNomFrInput) csNomFrInput.value = "";
        if (csPrenomFrInput) csPrenomFrInput.value = "";
        if (csNomArInput) csNomArInput.value = "";
        if (csPrenomArInput) csPrenomArInput.value = "";
        if (csGradeSelect) csGradeSelect.value = "";

        if (sexeCommissionHidden) sexeCommissionHidden.value = "FEMME";
        if (sexeToggleCommission) {
            sexeToggleCommission.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === "FEMME");
            });
        }

        if (universiteCommissionInput && !universiteCommissionInput.value.trim()) {
            universiteCommissionInput.value = "جامعة العلوم والتكنولوجيا محمد بوضياف";
        }
    }

    function fillCommissionSujetsFieldsFromMember(member) {
        if (!member) return;

        const nomFr = member.nomMembre || member.nomFr || "";
        const prenomFr = member.prenomMembre || member.prenomFr || "";
        const nomAr = member.nomAr || member.nom_ar || "";
        const prenomAr = member.prenomAr || member.prenom_ar || "";
        const grade = member.grade || "";
        const sexe = member.sexe || "FEMME";

        if (csNomFrInput) csNomFrInput.value = nomFr;
        if (csPrenomFrInput) csPrenomFrInput.value = prenomFr;
        if (csNomArInput) csNomArInput.value = nomAr;
        if (csPrenomArInput) csPrenomArInput.value = prenomAr;
        if (csGradeSelect) csGradeSelect.value = grade;

        if (sexeCommissionHidden) sexeCommissionHidden.value = sexe;
        if (sexeToggleCommission) {
            sexeToggleCommission.querySelectorAll(".sex-option").forEach((btn) => {
                btn.classList.toggle("sex-option-active", btn.dataset.sexValue === sexe);
            });
        }
    }

    /* =========================================================
       SUGGESTIONS
       ========================================================= */
    function hideCommissionSujetsSuggestions() {
        if (!commissionSujetsSuggestions) return;
        commissionSujetsSuggestions.innerHTML = "";
        commissionSujetsSuggestions.style.display = "none";
    }

    function renderCommissionSujetsSuggestions(keyword = "") {
        if (!commissionSujetsSuggestions) return;

        const usedIds = commissionSujetsMembers.map((m) => String(m.idMembre)).filter(Boolean);
        const term = (keyword || "").trim().toLowerCase();

        if (!term) {
            hideCommissionSujetsSuggestions();
            return;
        }

        const filtered = membresExistants.filter((m) => {
            const id = String(m.idMembre || m.id_membre || m.id || "");
            if (!id) return false;
            if (usedIds.includes(id)) return false;

            const nomFr = (m.nomMembre || m.nomFr || "").toLowerCase();
            const prenomFr = (m.prenomMembre || m.prenomFr || "").toLowerCase();
            const nomAr = (m.nomAr || m.nom_ar || "").toLowerCase();
            const prenomAr = (m.prenomAr || m.prenom_ar || "").toLowerCase();
            const grade = (m.grade || "").toLowerCase();

            const fullFr1 = `${nomFr} ${prenomFr}`.trim();
            const fullFr2 = `${prenomFr} ${nomFr}`.trim();
            const fullAr1 = `${nomAr} ${prenomAr}`.trim();
            const fullAr2 = `${prenomAr} ${nomAr}`.trim();

            return (
                nomFr.includes(term) ||
                prenomFr.includes(term) ||
                nomAr.includes(term) ||
                prenomAr.includes(term) ||
                grade.includes(term) ||
                fullFr1.includes(term) ||
                fullFr2.includes(term) ||
                fullAr1.includes(term) ||
                fullAr2.includes(term)
            );
        });

        commissionSujetsSuggestions.innerHTML = "";

        if (!filtered.length) {
            commissionSujetsSuggestions.innerHTML = `<div class="combo-empty">Aucun membre trouvé</div>`;
            commissionSujetsSuggestions.style.display = "block";
            return;
        }

        filtered.forEach((m) => {
            const id = m.idMembre || m.id_membre || m.id || "";
            const nomFr = m.nomMembre || m.nomFr || "";
            const prenomFr = m.prenomMembre || m.prenomFr || "";
            const grade = m.grade || "";

            const item = document.createElement("div");
            item.className = "combo-suggestion-item";
            item.innerHTML = `
            <span>${nomFr} ${prenomFr}</span>
            ${grade ? `<span class="combo-suggestion-grade">— ${grade}</span>` : ""}
        `;

            item.addEventListener("click", () => {
                if (selectedCommissionSujetsExistantInput) {
                    selectedCommissionSujetsExistantInput.value = id;
                }

                if (searchCommissionSujetsExistantInput) {
                    searchCommissionSujetsExistantInput.value = `${nomFr} ${prenomFr}`.trim();
                }

                fillCommissionSujetsFieldsFromMember(m);
                hideCommissionSujetsSuggestions();
            });

            commissionSujetsSuggestions.appendChild(item);
        });

        commissionSujetsSuggestions.style.display = "block";
    }

    function updateCommissionSujetsSuggestions() {
        const term = searchCommissionSujetsExistantInput?.value.trim() || "";
        if (!term) {
            hideCommissionSujetsSuggestions();
            return;
        }
        renderCommissionSujetsSuggestions(term);
    }

    if (searchCommissionSujetsExistantInput) {
        searchCommissionSujetsExistantInput.addEventListener("input", () => {
            const term = searchCommissionSujetsExistantInput.value.trim();

            if (selectedCommissionSujetsExistantInput) {
                selectedCommissionSujetsExistantInput.value = "";
            }

            if (!term) {
                hideCommissionSujetsSuggestions();
                return;
            }

            renderCommissionSujetsSuggestions(term);
        });
    }

    document.addEventListener("click", (e) => {
        const insideSearch = searchCommissionSujetsExistantInput?.contains(e.target);
        const insideSuggestions = commissionSujetsSuggestions?.contains(e.target);

        if (!insideSearch && !insideSuggestions) {
            hideCommissionSujetsSuggestions();
        }
    });

    /* =========================================================
       TOGGLE SEXE
       ========================================================= */
    if (sexeCommissionHidden && sexeToggleCommission) {
        const sexButtons = sexeToggleCommission.querySelectorAll(".sex-option");
        sexButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = btn.dataset.sexValue || "FEMME";
                sexeCommissionHidden.value = value;
                sexButtons.forEach((b) => b.classList.toggle("sex-option-active", b === btn));
            });
        });
    }

    /* =========================================================
       OUVRIR MODALE
       ========================================================= */
    if (btnOpenModalCommissionSujets && formCommissionSujets) {
        btnOpenModalCommissionSujets.addEventListener("click", async () => {
            formCommissionSujets.reset();
            resetCommissionSujetsFields();

            if (searchCommissionSujetsExistantInput) {
                searchCommissionSujetsExistantInput.value = "";
            }

            if (selectedCommissionSujetsExistantInput) {
                selectedCommissionSujetsExistantInput.value = "";
            }

            hideCommissionSujetsSuggestions();
            await loadMembresForCommissionSujetsModal();

            openModal(modalCommissionSujets);
        });
    }

    /* =========================================================
       SUBMIT
       ========================================================= */
    if (formCommissionSujets) {
        formCommissionSujets.addEventListener("submit", async (e) => {
            e.preventDefault();

            const selectedExistingId = selectedCommissionSujetsExistantInput?.value || "";

            const nomFr = csNomFrInput?.value.trim() || "";
            const prenomFr = csPrenomFrInput?.value.trim() || "";
            const nomAr = csNomArInput?.value.trim() || "";
            const prenomAr = csPrenomArInput?.value.trim() || "";
            const grade = csGradeSelect?.value.trim() || "";
            const sexe = sexeCommissionHidden?.value || "FEMME";
            const universite = universiteCommissionInput?.value.trim() || "جامعة العلوم والتكنولوجيا محمد بوضياف";
            const idConcours = localStorage.getItem("dg-id");

            if (!nomFr || !prenomFr) {
                showToast("Nom et prénom sont obligatoires.", "warning");
                return;
            }

            if (!idConcours) {
                showToast("Veuillez choisir un concours d'abord.", "warning");
                return;
            }

            const submitBtn = document.getElementById("btnSaveCommissionSujets");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Enregistrement...";
            }

            let idMembre = selectedExistingId;

            try {
                /* 1) créer membre seulement si aucun existant n'a été choisi */
                if (!idMembre) {
                    const payload = {
                        nomMembre: nomFr,
                        prenomMembre: prenomFr,
                        nomAr,
                        prenomAr,
                        grade,
                        sexe,
                    };

                    const created = await fetchJson(`${API_BASE}/membres`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });

                    idMembre = created?.idMembre || created?.id_membre || created?.membre?.idMembre;

                    if (!idMembre) {
                        throw new Error("idMembre manquant après création du membre");
                    }
                }

                /* 2) éviter doublon local */
                const alreadyExists = commissionSujetsMembers.some(
                    (m) => String(m.idMembre) === String(idMembre)
                );

                if (alreadyExists) {
                    showToast("Ce membre existe déjà dans la commission.", "warning");
                    return;
                }

                let idSpecialite = localStorage.getItem("dg-selected-spec");
                if (!idSpecialite) {
                    showToast("Veuillez choisir une spécialité d'abord dans onglet correcteur.", "warning");
                    return;
                }
                const commissionPayload = {
                    idMembre,
                    idConcours,
                    idSpecialite,
                };

                const createdCommission = await fetchJson(`${API_BASE}/commission-elaboration-sujets`, {
                    method: "POST",
                    body: JSON.stringify(commissionPayload),
                });

                const idCommission =
                    createdCommission?.idCommission ||
                    createdCommission?.id_commission ||
                    createdCommission?.commission?.idCommission ||
                    null;

                commissionSujetsMembers.push({
                    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    idCommission,
                    idMembre,
                    nomFr,
                    prenomFr,
                    nomAr,
                    prenomAr,
                    grade,
                    sexe,
                    universite,
                });

                renderCommissionSujets();
                updateCommissionSujetsSuggestions();
                closeModal(modalCommissionSujets);
                showToast("Membre de la commission ajouté.", "success");
            } catch (err) {
                console.error("Erreur ajout commission sujets :", err);
                showToast("Erreur lors de l'enregistrement.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="uil uil-check"></i> Enregistrer le membre`;
                }
            }
        });
    }

    /* =========================================================
       RENDER
       ========================================================= */
    function renderCommissionSujets() {
        if (!commissionSujetsBody) return;
        commissionSujetsBody.innerHTML = "";

        commissionSujetsMembers.forEach((m, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${m.nomFr} ${m.prenomFr}</td>
            <td>${m.grade || ""}</td>
            <td dir="rtl">${m.universite || ""}</td>
            <td class="table-actions">
                <button type="button" class="btn-icon btn-icon-danger" data-remove-commission="${m.localId}">
                    <i class="uil uil-trash"></i>
                </button>
            </td>
        `;
            commissionSujetsBody.appendChild(tr);
        });

        commissionSujetsBody.querySelectorAll("[data-remove-commission]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const localId = btn.getAttribute("data-remove-commission");
                commissionSujetsMembers = commissionSujetsMembers.filter(
                    (m) => String(m.localId) !== String(localId)
                );
                renderCommissionSujets();
                updateCommissionSujetsSuggestions();
                showToast("Membre supprimé.", "danger");
            });
        });
    }

    renderCommissionSujets();


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


    function updateSidebar(viewName) {
        navItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.view === viewName);
        });
    }



    function persistActiveView(viewName) {
        try {
            localStorage.setItem("dg-active-view", viewName);
        } catch (_) { }

        const newHash = "#" + viewName;

        // éviter de déclencher hashchange inutile
        if (viewName && location.hash !== newHash) {
            location.hash = viewName;
        }
    }

    function getInitialView() {
        // 1) hash d’abord (si tu veux partager lien direct)
        const hash = (location.hash || "").replace("#", "").trim();
        if (hash) return hash;

        // 2) sinon localStorage
        try {
            const saved = localStorage.getItem("dg-active-view");
            if (saved) return saved;
        } catch (_) { }

        // 3) sinon première view du menu
        const first = document.querySelector(".sidebar-nav .nav-item[data-view]");
        return first?.dataset.view || "home";
    }


    function showView(viewName) {

        // éviter double exécution
        if (__lastView === viewName) return;
        __lastView = viewName;

        views.forEach((v) =>
            v.classList.toggle("view-active", v.dataset.view === viewName)
        );

        navItems.forEach((i) =>
            i.classList.toggle("nav-item-active", i.dataset.view === viewName)
        );

        updatePipeline(viewName);
        updateSidebar(viewName);

        if (viewName === "cfd") {
            loadAnonymatConcoursOptions();
            loadDoyenForCfd();
        }

        if (viewName === "correcteurs") {
            loadSpecialitesForCorrecteurs();
        }

        function setActivePipelineIcon(viewName) {
            document.querySelectorAll(".pipeline-node[data-step]").forEach(node => {
                node.classList.toggle("pipeline-active", node.dataset.step === viewName);
            });
        }

        setActivePipelineIcon(viewName);

        persistActiveView(viewName);
    }

    navItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            showView(item.dataset.view);
        });
    });

    // ✅ Au chargement : restaure la view + active le menu
    const initialView = getInitialView();

    // si la view n’existe pas (hash invalide), fallback sur 1ère
    const viewExists = Array.from(views).some(v => v.dataset.view === initialView);
    showView(viewExists ? initialView : (navItems[0]?.dataset.view || "home"));


    document.querySelectorAll("[data-go-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-go-view");
            showView(target);
        });
    });


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
            const num = localStorage.getItem("dg-numeroConcours");
            title.textContent =
                `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n${num}\n`;
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
            const num = localStorage.getItem("dg-numeroConcours");
            title.textContent =
                `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n${num}`;
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

                const fonction = member.role || "";
                const institution = "";




                tr.appendChild(makeTd(nomAr));
                tr.appendChild(makeTd(institution));
                tr.appendChild(makeTd(fonction));

                tbody.appendChild(tr);
                rowIndex++;
            }

            anonymatMembers.forEach(addMemberRow);

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

    const btnPrintSujetMembers = document.getElementById("btnPrintSujetMembers");

    if (btnPrintSujetMembers && pvPrintArea) {
        btnPrintSujetMembers.addEventListener("click", async () => {
            // ✅ spécialité: texte option sélectionnée + value input AR
            const specFR = getSelectedSpecialiteLabelFR();
            const specId = getSelectedSpecialiteId();
            const specAR = inputSpecialiteAr ? inputSpecialiteAr.value.trim() : "";

            if (!specFR || !specAR) {
                showToast("Veuillez sélectionner la spécialité en FR et saisir sa traduction en AR.", "warning");
                return;
            }

            if (!commissionSujetsMembers || commissionSujetsMembers.length === 0) {
                showToast("لا يوجد اعضاء لهذا التخصص للطباعة.", "warning");
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
            const num = localStorage.getItem("dg-numeroConcours");
            title.textContent =
                `الجزائرية الديمقراطية الشعبية\nوزارة التعليم العالي والبحث العلمي\nجامعة العلوم والتكنولوجيا محمد بوضياف\n${faculteARar}\n${num}\n`;
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
                `المادة الأولى: تُنشأ لجنة إعداد المواضيع  على مسابقة الدكتوراه تخصص ${specAR || "........"} (${specFR}) للسنة الجامعية ${anneeUniversitaire}.\n` +
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


                const institution = member.universite;

                const tdNum = makeTd(String(rowIndex));
                tdNum.style.textAlign = "center";


                tr.appendChild(makeTd(nomAr));
                tr.appendChild(makeTd(institution));


                tbody.appendChild(tr);
                rowIndex++;
            }

            commissionSujetsMembers.forEach(addMemberRow);

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