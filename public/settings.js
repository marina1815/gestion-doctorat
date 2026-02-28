// settings.js

document.addEventListener("DOMContentLoaded", () => {
    /* =========================
       CONFIG API
       ========================= */
    const API_URL = window.API_URL || "http://localhost:4000";
    const ENDPOINTS = {
        users: "/users",
        membres: "/membres"
    };

     async function refreshSession() {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
          
            throw new Error("Refresh token invalide");
        }

       
    }


    function showConfirm(message, title = "Confirmation", type = "default") {
        return new Promise((resolve) => {
            const modal = document.getElementById("confirmModal");
            const dialog = document.getElementById("confirmDialog");
            const msg = document.getElementById("confirmMessage");
            const ttl = document.getElementById("confirmTitle");
            const icon = document.getElementById("confirmIcon");
            const btnOk = document.getElementById("confirmOk");
            const btnCancel = document.getElementById("confirmCancel");

            msg.textContent = message;
            ttl.textContent = title;

            dialog.classList.remove("default", "warning", "danger");
            dialog.classList.add(type || "default");

            if (type === "danger") {
                icon.textContent = "!";
            } else if (type === "warning") {
                icon.textContent = "!";
            } else {
                icon.textContent = "i";
            }

            modal.classList.add("show");

            const close = () => modal.classList.remove("show");

            btnCancel.onclick = () => {
                close();
                resolve(false);
            };

            btnOk.onclick = () => {
                close();
                resolve(true);
            };
        });
    }

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

    function removeToast(t) {
        if (!t) return;
        t.classList.remove("visible");
        setTimeout(() => t.remove(), 200);
    }

    function showLoadingToast(msg = "Chargement…") {
        return showToast(msg, "loading");
    }

    /* =========================
       APPEL API GÉNÉRIQUE
       ========================= */
        async function apiRequest(path, method = "GET", body = null) {
        const url = API_URL + path;

        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);

        if (res.status === 401 || res.status === 419) {
            handleSessionExpired();
            throw new Error("Session expirée");
        }

        if (res.status === 404) {
            showToast("Route API introuvable (404). Vérifie le backend.", "error", 5000);
            throw new Error("Route introuvable : " + url);
        }

        if (!res.ok) {
            let detail = "";
            try {
                const errJson = await res.json();
                detail = errJson?.message || JSON.stringify(errJson);
            } catch (_) { }
            throw new Error(`Erreur API ${res.status} : ${detail}`);
        }

        if (res.status === 204) return null;
        return res.json();
    }

    function handleSessionExpired() {
        localStorage.removeItem("user");
        showToast("Votre session a expiré, veuillez vous reconnecter.", "warning", 4000);
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    }

    const settingsPage = document.getElementById("settingsPage");
    const accountsPage = document.getElementById("accountsPage");
    const cardManageAccounts = document.getElementById("openAccountsPage");
    const backToSettings = document.getElementById("backToSettings");

    const pillLight = document.getElementById("themeLight");
    const pillDark = document.getElementById("themeDark");
    const root = document.documentElement;

    const btnUserMenu = document.getElementById("userMenuBtn");
    const dropdownUserMenu = document.getElementById("userMenuDropdown");

    const btnNewAccount = document.getElementById("btnNewAccount");
    const accountModal = document.getElementById("accountCreateModal");
    const closeAccountModal = document.getElementById("closeAccountModal");
    const accountForm = document.getElementById("accountForm");

    const accountsTableBody = document.querySelector("#accountsTable tbody");
    const accountsCount = document.getElementById("accountsCount");
    const roleFilter = document.getElementById("roleFilter");
    const statusFilter = document.getElementById("statusFilter");

    const inputEmail = document.getElementById("newEmail");
    const inputUsername = document.getElementById("newUsername");
    const inputPassword = document.getElementById("newPassword");
    const selectRole = document.getElementById("newRole");
    const modalTitle = accountModal?.querySelector(".account-modal-header h2");
    const modalSubmitBtn = accountForm?.querySelector('button[type="submit"]');

    let currentEditUserId = null;
    let allUsers = [];

    /* =========================
       THEME CLAIR / SOMBRE
       ========================= */
    function applyTheme(theme) {
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
            pillDark?.classList.add("setting-pill-active");
            pillLight?.classList.remove("setting-pill-active");
        } else {
            root.removeAttribute("data-theme");
            pillLight?.classList.add("setting-pill-active");
            pillDark?.classList.remove("setting-pill-active");
        }
        localStorage.setItem("dg-theme", theme);
    }

    pillLight?.addEventListener("click", () => applyTheme("light"));
    pillDark?.addEventListener("click", () => applyTheme("dark"));

    const savedTheme = localStorage.getItem("dg-theme");
    applyTheme(savedTheme === "dark" ? "dark" : "light");

    /* =========================
       NAV PARAMÈTRES <-> COMPTES
       ========================= */
    if (settingsPage && accountsPage) {
        cardManageAccounts?.addEventListener("click", () => {
            settingsPage.style.display = "none";
            accountsPage.style.display = "block";
        });

        backToSettings?.addEventListener("click", () => {
            accountsPage.style.display = "none";
            settingsPage.style.display = "block";
        });
    }

    /* =========================
       MODAL CRÉATION / ÉDITION COMPTE
       ========================= */
    function openCreateModal() {
        if (!accountModal) return;
        currentEditUserId = null;
        if (modalTitle) modalTitle.textContent = "Créer un nouveau compte";
        if (modalSubmitBtn) modalSubmitBtn.textContent = "Créer";

        accountForm?.reset();
        accountModal.classList.add("is-visible");
    }

    function openEditModalWithUser(user) {
        if (!accountModal || !accountForm) return;
        currentEditUserId = user.idUser;

        if (modalTitle) modalTitle.textContent = "Modifier le compte";
        if (modalSubmitBtn) modalSubmitBtn.textContent = "Mettre à jour";

        inputEmail.value = user.email || "";
        inputUsername.value = user.username || "";
        inputPassword.value = "";
        selectRole.value = user.role || "";

        accountModal.classList.add("is-visible");
    }

    function closeAccountModalFn() {
        accountModal?.classList.remove("is-visible");
        accountForm?.reset();
        currentEditUserId = null;
    }

    btnNewAccount?.addEventListener("click", openCreateModal);
    closeAccountModal?.addEventListener("click", closeAccountModalFn);

    accountModal?.addEventListener("click", (e) => {
        if (e.target === accountModal) closeAccountModalFn();
    });

    /* =========================
       SUBMIT DU FORM (CREATE / UPDATE)
       ========================= */
    accountForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1️⃣ Construire payload membre
        const membrePayload = {
            nomMembre: lastName.value.trim(),
            prenomMembre: firstName.value.trim(),
            nomAr: lastNameAr.value.trim(),
            prenomAr: firstNameAr.value.trim(),
            sexe: gender.value,
            grade: grade.value
        };

        const userPayload = {
            email: inputEmail.value.trim(),
            username: inputUsername.value.trim(),
            password: inputPassword.value,
            role: selectRole.value
        };

        const loading = showLoadingToast(
            currentEditUserId ? "Mise à jour du compte…" : "Création du compte…"
        );

        try {
            if (!userPayload.username || !userPayload.role || !userPayload.password) {
                throw new Error("Veuillez remplir les champs obligatoires.");
            }

            let idMembreCree;

            // 3️⃣ Créer membre SEULEMENT en mode création
            if (!currentEditUserId) {
                const membreResponse = await apiRequest(ENDPOINTS.membres, "POST", membrePayload);


                idMembreCree = membreResponse.idMembre;

                if (!idMembreCree) throw new Error("Impossible de récupérer l’id du membre.");
            }

            // 4️⃣ Ajouter id_membre au payload user
            if (!currentEditUserId) {
                userPayload.idMembre = idMembreCree;
            }

            // 5️⃣ Créer ou mettre à jour le user
            if (currentEditUserId) {
                await apiRequest(`${ENDPOINTS.users}/${currentEditUserId}`, "PUT", userPayload);
                showToast("Compte mis à jour avec succès.", "success");
            } else {
                await apiRequest(ENDPOINTS.users, "POST", userPayload);
                showToast("Compte créé avec succès.", "success");
            }

            closeAccountModalFn();
            await refreshUsersTable();

        } catch (err) {
            console.error(err);
            showToast(err.message || "Erreur lors de l’enregistrement du compte.", "error", 5000);
        } finally {
            removeToast(loading);
        }
    });

    /* =========================
       RENDER TABLE USERS
       ========================= */
    const roleMeta = {
        ADMIN: { label: "Admin", badge: "badge-admin" },
        RESPONSABLE_SALLE: { label: "Responsable Salle", badge: "badge-doyen" },
        CHEFDEPARTEMENT: { label: "Chef de Département", badge: "badge-chefdep" },
        CFD: { label: "CFD", badge: "badge-cfd" },
        CELLULE_ANONYMAT: { label: "Cellule Anonymat", badge: "badge-anonymat" },
        CORRECTEUR: { label: "Correcteur", badge: "badge-correcteur" },
        DOYEN: { label: "Doyen", badge: "badge-role" },
        VICEDOYEN: { label: "Vice-Doyen", badge: "badge-role" },
        RECTEUR: { label: "Recteur", badge: "badge-role" },
    };

    function renderUsersTable(users) {
        if (!accountsTableBody) return;

        const roleFilterValue = roleFilter?.value || "all";
        const statusFilterValue = statusFilter?.value || "all";

        const filtered = users.filter((u) => {
            const matchesRole =
                roleFilterValue === "all" || u.role === roleFilterValue;

            const isActive = u.isActive ?? u.is_active ?? u.active ?? u.enabled ?? false;

            const matchesStatus =
                statusFilterValue === "all" ||
                (statusFilterValue === "active" && isActive) ||
                (statusFilterValue === "disabled" && !isActive);

            return matchesRole && matchesStatus;
        });

        accountsTableBody.innerHTML = "";

        if (!filtered.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 6;
            td.textContent = "Aucun compte trouvé.";
            td.style.textAlign = "center";
            td.style.padding = "20px 0";
            tr.appendChild(td);
            accountsTableBody.appendChild(tr);
        } else {
            filtered.forEach((user, index) => {
                const isActive = user.isActive ?? false;
                const meta = roleMeta[user.role] || {
                    label: user.role,
                    badge: "badge-role",
                };

                const tr = document.createElement("tr");
                tr.dataset.role = user.role;
                tr.dataset.status = isActive ? "active" : "disabled";

                tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${user.email ?? ""}</td>
          <td>${user.username}</td>
          <td><span class="badge-role ${meta.badge}">${meta.label}</span></td>
          <td>
            <span class="chip-status ${isActive ? "chip-active" : "chip-disabled"}">
              ${isActive ? "Actif" : "Désactivé"}
            </span>
          </td>
          <td class="accounts-actions-cell">
            <button class="icon-action action-btn action-toggle" 
                    data-id="${user.idUser}" 
                    data-action="toggle" 
                    title="${isActive ? "Désactiver" : "Activer"}">
              <i class="uil uil-power"></i>
            </button>
            <button class="icon-action action-btn action-edit" 
                    data-id="${user.idUser}" 
                    data-action="edit" 
                    title="Modifier">
              <i class="uil uil-pen"></i>
            </button>
            <button class="icon-action action-btn action-delete" 
                    data-id="${user.idUser}" 
                    data-action="delete" 
                    title="Supprimer">
              <i class="uil uil-trash-alt"></i>
            </button>
          </td>
        `;

                accountsTableBody.appendChild(tr);
            });
        }

        if (accountsCount) {
            accountsCount.textContent = String(filtered.length);
        }
    }

    /* =========================
       REFRESH USERS TABLE
       ========================= */
    async function refreshUsersTable() {
        const loading = showLoadingToast("Chargement des comptes…");
        try {
            const users = await apiRequest(ENDPOINTS.users, "GET");
            allUsers = Array.isArray(users) ? users : users?.data || [];
            renderUsersTable(allUsers);
        } catch (err) {
            console.error(err);
            showToast("Erreur lors du chargement des comptes.", "error");
        } finally {
            removeToast(loading);
        }
    }

    roleFilter?.addEventListener("change", () => renderUsersTable(allUsers));
    statusFilter?.addEventListener("change", () => renderUsersTable(allUsers));

    /* =========================
       ACTIONS EDIT / DELETE / TOGGLE
       ========================= */
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (!id || !action) return;

        if (action === "edit") {
            const user = allUsers.find((u) => String(u.idUser) === String(id));

            if (!user) {
                showToast("Utilisateur introuvable dans la liste.", "error");
                return;
            }

            openEditModalWithUser(user);
            return;
        }

        if (action === "toggle") {
            const loading = showLoadingToast("Mise à jour du statut…");
            try {
                // TODO: appeler une vraie route PATCH /users/:id/toggle
                showToast("Statut mis à jour.", "success");
                await refreshUsersTable();
            } catch (err) {
                console.error(err);
                showToast(err.message, "error", 5000);
            } finally {
                removeToast(loading);
            }
            return;
        }

        if (action === "delete") {
            const confirmed = await showConfirm(
                "Voulez-vous vraiment supprimer ce compte ?",
                "Suppression du compte",
                "danger"
            );
            if (!confirmed) return;

            const loading = showLoadingToast("Suppression du compte…");
            try {
                await apiRequest(`${ENDPOINTS.users}/${id}`, "DELETE");
                showToast("Compte supprimé.", "success");
                await refreshUsersTable();
            } catch (err) {
                console.error(err);
                showToast(err.message, "error", 5000);
            } finally {
                removeToast(loading);
            }
        }
    });

    /* =========================
       INIT
       ========================= */
    refreshUsersTable();
});