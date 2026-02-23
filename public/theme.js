document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const logo = document.getElementById("mainLogo");
    const toggleBtn = document.getElementById("themeToggle");
    const toggleIcon = document.getElementById("themeIcon");
    // ----------------------
// Menu utilisateur
// ----------------------
const userMenuBtn = document.getElementById("userMenuBtn");
const userMenuDropdown = document.getElementById("userMenuDropdown");

if (userMenuBtn && userMenuDropdown) {
    userMenuBtn.addEventListener("click", () => {
        userMenuDropdown.classList.toggle("open");
    });

    // Fermer le menu si on clique en dehors
    document.addEventListener("click", (e) => {
        if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
            userMenuDropdown.classList.remove("open");
        }
    });
}


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

const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", () => {
      
        //localStorage.removeItem("user");
        showToast("Déconnexion…", "info");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 600);
    });
    function applyLogo(theme) {
        if (!logo) return;

        if (theme === "dark") {
            logo.src = "img/icondark.png";   // ton logo dark
        } else {
            logo.src = "img/iconlight.png";  // ton logo clair
        }
    }

    function applyTheme(theme) {
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
            toggleIcon.className = "uil uil-sun"; // en sombre → soleil
        } else {
            root.removeAttribute("data-theme");
            toggleIcon.className = "uil uil-moon"; // en clair → lune
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