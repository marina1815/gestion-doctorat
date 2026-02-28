document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const logo = document.getElementById("mainLogo");
    const toggleBtn = document.getElementById("themeToggle");
    const toggleIcon = document.getElementById("themeIcon");

    /* =========================
       CONFIG API
       ========================= */
    const API_URL = window.API_URL || "http://localhost:4000";
    const LOGOUT_ENDPOINT = "/auth/logout";

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

    function removeToast(t) {
        if (!t) return;
        t.classList.remove("visible");
        setTimeout(() => t.remove(), 200);
    }

    function showLoadingToast(msg = "Chargement…") {
        return showToast(msg, "loading");
    }

    /* =========================
       MENU UTILISATEUR
       ========================= */
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userMenuDropdown = document.getElementById("userMenuDropdown");

    if (userMenuBtn && userMenuDropdown) {
        userMenuBtn.addEventListener("click", () => {
            userMenuDropdown.classList.toggle("open");
        });

        // Fermer le menu si on clique en dehors
        document.addEventListener("click", (e) => {
            if (
                !userMenuBtn.contains(e.target) &&
                !userMenuDropdown.contains(e.target)
            ) {
                userMenuDropdown.classList.remove("open");
            }
        });
    }

    /* =========================
       LOGOUT
       ========================= */
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn?.addEventListener("click", async () => {
        const loading = showLoadingToast("Déconnexion…");

        try {
            // Appel à ton backend pour révoquer les tokens + is_active = FALSE
            await fetch(API_URL + LOGOUT_ENDPOINT, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // Nettoyage côté front
            localStorage.removeItem("user");

            showToast("Déconnexion réussie", "success", 1500);

            setTimeout(() => {
                window.location.href = "login.html";
            }, 800);
        } catch (err) {
            console.error("Erreur de déconnexion:", err);
            showToast("Erreur lors de la déconnexion.", "error", 4000);
        } finally {
            removeToast(loading);
        }
    });

    /* =========================
       THÈME + LOGO
       ========================= */
    function applyLogo(theme) {
        if (!logo) return;

        if (theme === "dark") {
            logo.src = "img/icondark.png";   // logo dark
        } else {
            logo.src = "img/iconlight.png";  // logo clair
        }
    }

    function applyTheme(theme) {
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
            if (toggleIcon) {
                toggleIcon.className = "uil uil-sun";
            }
        } else {
            root.removeAttribute("data-theme");
            if (toggleIcon) {
                toggleIcon.className = "uil uil-moon";
            }
        }

        localStorage.setItem("dg-theme", theme);
        applyLogo(theme);
    }

    const savedTheme = localStorage.getItem("dg-theme") || "light";
    applyTheme(savedTheme);

    toggleBtn?.addEventListener("click", () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        applyTheme(isDark ? "light" : "dark");
    });
});