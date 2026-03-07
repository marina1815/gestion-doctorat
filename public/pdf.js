const API_BASE = "http://localhost:4000";

/* =========================================================
   HELPERS
   ========================================================= */
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
        } catch (_) {}
        throw new Error(message);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return res.json();
    }
    return res.text();
}

function showToast(message, type = "info") {
    console.log(`[${type}] ${message}`);
}

/* =========================================================
   LOGO
   ========================================================= */
const LOGO_URL = "img/image.png";

function loadImageAsDataURL(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = src;
    });
}

/* =========================================================
   CHARGER DONNEES
   ========================================================= */
async function loadAllMembres() {
    const data = await fetchJson(`${API_BASE}/membres`, { method: "GET" });
    return Array.isArray(data) ? data : (data?.data || data?.membres || []);
}

async function reteurnFaculte() {
    const idConcours = localStorage.getItem("dg-id");

    if (!idConcours) {
        throw new Error("dg-id introuvable dans localStorage");
    }

    const data = await fetchJson(`${API_BASE}/departements/concours/${idConcours}`, {
        method: "GET",
    });

    return data;
}

/* =========================================================
   TEXTE UTILITAIRE
   ========================================================= */
function safe(value) {
    return (value || "").toString().trim();
}

function getFullName(member) {
    const nom = safe(member.nomMembre || member.nomFr || member.nom || "");
    const prenom = safe(member.prenomMembre || member.prenomFr || member.prenom || "");
    return { nom, prenom };
}

function getGrade(member) {
    return safe(member.grade || member.qualite || "Enseignant(e) - Chercheur à");
}

let nomFaculte = "";
let nomDepartement = "";

/* =========================================================
   GENERATION PDF
   ========================================================= */
async function generateDeclarationsPdfForAllMembers() {
    try {
        const membres = await loadAllMembres();
        const res = await reteurnFaculte();

        

        console.log("Réponse departement/concours :", res);

        nomFaculte = res?.faculte?.nomFaculte || "";
        nomDepartement = res?.departement?.nomDepartement || "";

        if (!membres.length) {
            showToast("Aucun membre trouvé.", "warning");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        let logoData = null;
        try {
            logoData = await loadImageAsDataURL(LOGO_URL);
        } catch (e) {
            console.warn("Logo non chargé :", e);
        }

        membres.forEach((member, index) => {
            if (index > 0) doc.addPage();
            drawDeclarationPage(doc, member, logoData);
        });

        doc.save("declarations_conflit_interet_tous_les_membres.pdf");
        showToast("PDF généré avec succès.", "success");
    } catch (err) {
        console.error("Erreur génération PDF :", err);
        showToast(err.message || "Erreur lors de la génération du PDF.", "error");
    }
}

/* =========================================================
   DESSIN D'UNE PAGE
   ========================================================= */
function drawDeclarationPage(doc, member, logoData) {
    const pageWidth = doc.internal.pageSize.getWidth();

    const { nom, prenom } = getFullName(member);
    const grade = getGrade(member);

    doc.setFont("times", "bold");
    doc.setFontSize(8);

    doc.text("République Algérienne Démocratique et Populaire", 10, 10);
    doc.text("Ministère de l'Enseignement Supérieur et de la Recherche", 10, 14);
    doc.text("Université des Sciences et de la Technologie d'Oran", 10, 18);
    doc.text(`Faculté ${nomFaculte || "................................"}`, 10, 22);
    doc.text(`Département de ${nomDepartement || "................................"}`, 10, 26);

    if (logoData) {
        doc.addImage(logoData, "PNG", pageWidth / 2 - 12, 6, 24, 24);
    } else {
        doc.circle(pageWidth / 2, 18, 10);
    }

    doc.setDrawColor(120, 160, 200);
    doc.setFillColor(215, 230, 245);
    doc.roundedRect(58, 42, 94, 18, 3, 3, "FD");

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Déclaration de Conflit d’Intérêt", pageWidth / 2, 53, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);

    let y = 95;

    doc.text("Je soussigné(e)", 25, y);
    y += 14;

    doc.text(`Nom : ......................${nom || "................................"}................................`, 25, y);
    y += 12;

    doc.text(`Prénom : ..................${prenom || "................................"}.................................`, 25, y);
    y += 12;

    doc.text(`Enseignant (e) – Chercheur à : .....${grade || "USTO'MB"}.....`, 25, y);
    y += 16;

    const line1 = "Déclare n’avoir aucun lien ou conflit d’intérêt avec aucun candidat retenu pour";
    const line2 = "passer le concours de doctorat 2022-2023 à l’université USTO’MB";

    doc.text(line1, 25, y);
    y += 12;
    doc.text(line2, 25, y);

    doc.text("Signature de l’intéressée", 122, 190);
}

/* =========================================================
   BOUTON
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const btnGenerateDeclarations = document.getElementById("btnGenerateDeclarations");

    if (btnGenerateDeclarations) {
        btnGenerateDeclarations.addEventListener("click", async () => {
            await generateDeclarationsPdfForAllMembers();
        });
    } else {
        console.error("Bouton #btnGenerateDeclarations introuvable");
    }
});