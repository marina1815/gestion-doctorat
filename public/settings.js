document.addEventListener("DOMContentLoaded", () => {
  // ====== EXISTANT: navigation paramètres / gestion des comptes ======
  const settingsPage = document.getElementById("settingsPage");
  const accountsPage = document.getElementById("accountsPage");
  const cardManageAccounts = document.getElementById("openAccountsPage");
  const backToSettings = document.getElementById("backToSettings");

  if (settingsPage && accountsPage && cardManageAccounts && backToSettings) {
    cardManageAccounts.addEventListener("click", () => {
      settingsPage.style.display = "none";
      accountsPage.style.display = "block";
    });

    backToSettings.addEventListener("click", () => {
      accountsPage.style.display = "none";
      settingsPage.style.display = "block";
    });
  }

  // ====== NOUVEAU: switch thème clair / sombre ======
  const pillLight = document.getElementById("themeLight");
  const pillDark = document.getElementById("themeDark");
  const root = document.documentElement; // <html>

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      pillDark?.classList.add("setting-pill-active");
      pillLight?.classList.remove("setting-pill-active");
    } else {
      root.removeAttribute("data-theme"); // revient au clair
      pillLight?.classList.add("setting-pill-active");
      pillDark?.classList.remove("setting-pill-active");
    }
    localStorage.setItem("dg-theme", theme);
  }

  // clic sur "Clair"
  pillLight?.addEventListener("click", () => {
    applyTheme("light");
  });

  // clic sur "Sombre"
  pillDark?.addEventListener("click", () => {
    applyTheme("dark");
  });

  // au chargement: appliquer le dernier choix sauvegardé
  const savedTheme = localStorage.getItem("dg-theme");
  if (savedTheme === "dark") {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }
});
const btn = document.getElementById("userMenuBtn");
const dropdown = document.getElementById("userMenuDropdown");

btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
    dropdown.classList.remove("open");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    // Effacer éventuellement les infos du front
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirection vers login
    window.location.href = "login.html";
});