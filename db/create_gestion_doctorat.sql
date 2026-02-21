-- ===============================================================
-- 1) CREATION UTILISATEUR + BASE
-- ===============================================================

CREATE USER gestion_user WITH ENCRYPTED PASSWORD 'ChangeMe123!';
CREATE DATABASE gestion_doctorat OWNER gestion_user;

\c gestion_doctorat

-- Donne les droits
GRANT ALL PRIVILEGES ON DATABASE gestion_doctorat TO gestion_user;

-- Required for sequences permissions later
ALTER SCHEMA public OWNER TO gestion_user;


-- ===============================================================
-- 2) TABLE ROLES
-- ===============================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES 
('ADMIN'),
('DOYEN'),
('CHEF_DEPARTEMENT'),
('CFD'),
('RESPONSABLE_SALLE'),
('CELLULE_ANONYMAT'),
('CORRECTEUR'),
('ASSISTANT');


-- ===============================================================
-- 3) TABLE UTILISATEURS
-- ===============================================================

CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    role_id INT REFERENCES roles(id),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 4) TABLE DÉPARTEMENTS
-- ===============================================================

CREATE TABLE departements (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL
);


-- ===============================================================
-- 5) TABLE CANDIDATS
-- ===============================================================

CREATE TABLE candidats (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(120) NOT NULL,
    prenom VARCHAR(120) NOT NULL,
    email VARCHAR(150),
    specialite VARCHAR(100),
    departement_id INT REFERENCES departements(id),
    created_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 6) TABLE SALLES (pour les examens)
-- ===============================================================

CREATE TABLE salles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    capacite INT NOT NULL CHECK (capacite > 0),
    responsable_id INT REFERENCES utilisateurs(id) ON DELETE SET NULL
);


-- ===============================================================
-- 7) TABLE EXAMENS
-- ===============================================================

CREATE TABLE examens (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,             -- Examen 1, Examen 2, etc.
    date_examen DATE NOT NULL,
    sujet_pdf TEXT,                        -- chemin ou URL du fichier
    created_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 8) TABLE AFFECTATION CANDIDATS → SALLES
-- ===============================================================

CREATE TABLE affectations (
    id SERIAL PRIMARY KEY,
    candidat_id INT REFERENCES candidats(id) ON DELETE CASCADE,
    salle_id INT REFERENCES salles(id) ON DELETE SET NULL,
    examen_id INT REFERENCES examens(id) ON DELETE CASCADE,
    present BOOLEAN DEFAULT FALSE,         -- présence après validation QR
    validated_by INT REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 9) TABLE ANONYMAT (Codes anonymes + QR)
-- ===============================================================

CREATE TABLE anonymat (
    id SERIAL PRIMARY KEY,
    candidat_id INT REFERENCES candidats(id) UNIQUE ON DELETE CASCADE,
    code_anonyme VARCHAR(20) UNIQUE NOT NULL,
    qr_code TEXT, -- chemin image
    double_anonymat BOOLEAN DEFAULT FALSE,
    generated_by INT REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 10) TABLE COPIES (une copie par examen)
-- ===============================================================

CREATE TABLE copies (
    id SERIAL PRIMARY KEY,
    examen_id INT REFERENCES examens(id),
    code_anonyme VARCHAR(20) REFERENCES anonymat(code_anonyme),
    fichier_pdf TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 11) TABLE CORRECTEURS ASSIGNÉS
-- ===============================================================

CREATE TABLE correcteurs_assignes (
    id SERIAL PRIMARY KEY,
    correcteur_id INT REFERENCES utilisateurs(id),
    copie_id INT REFERENCES copies(id) ON DELETE CASCADE,
    UNIQUE(correcteur_id, copie_id)
);


-- ===============================================================
-- 12) TABLE NOTES
-- ===============================================================

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    copie_id INT REFERENCES copies(id) ON DELETE CASCADE,
    correcteur_id INT REFERENCES utilisateurs(id),
    note FLOAT CHECK (note >= 0 AND note <= 20),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(copie_id, correcteur_id)
);


-- ===============================================================
-- 13) TABLE CLASSEMENT FINAL
-- ===============================================================

CREATE TABLE classement_final (
    id SERIAL PRIMARY KEY,
    candidat_id INT REFERENCES candidats(id),
    moyenne FLOAT CHECK (moyenne >= 0 AND moyenne <= 20),
    rang INT,
    generated_at TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 14) TABLE AUDIT (journalisation)
-- ===============================================================

CREATE TABLE audit (
    id SERIAL PRIMARY KEY,
    utilisateur_id INT REFERENCES utilisateurs(id),
    action VARCHAR(100),
    details TEXT,
    ts TIMESTAMP DEFAULT NOW()
);


-- ===============================================================
-- 15) AUTORISATIONS COMPLEMENTAIRES
-- ===============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gestion_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gestion_user;

