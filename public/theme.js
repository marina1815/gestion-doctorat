// theme.js
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement; // <html>
  const savedTheme = localStorage.getItem("dg-theme");

  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme"); // clair par défaut
  }
});