-- =========================================================
--  Initialisation (PostgreSQL)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
--  TABLE : membres (doit être créée AVANT users)
-- =========================================================
CREATE TABLE membres (
    id_membre      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_membre     VARCHAR(100) NOT NULL,
    prenom_membre  VARCHAR(100) NOT NULL,
    nom_ar         VARCHAR(100),
    prenom_ar      VARCHAR(100),
    grade          VARCHAR(100),
    sexe           VARCHAR(10) NOT NULL CHECK (sexe IN ('FEMME', 'HOMME'))
);

-- =========================================================
--  TABLE : users
-- =========================================================
CREATE TABLE users (
    id_user         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(150) UNIQUE,
    password_hash   TEXT         NOT NULL,
    role            VARCHAR(50)  NOT NULL CHECK (
        role IN (
            'ADMIN',
            'CHEFDEPARTEMENT',
            'CFD',
            'CELLULE_ANONYMAT',
            'CORRECTEUR',
            'RESPONSABLE_SALLE',
            'DOYEN',
            'VICEDOYEN',
            'RECTEUR'
        )
    ),
    token_version   INTEGER      NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMPTZ,

    id_membre       UUID NOT NULL,
    CONSTRAINT fk_users_membres
        FOREIGN KEY (id_membre)
        REFERENCES membres(id_membre)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : refresh_tokens (authentification)
-- =========================================================
CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    token_hash   TEXT        NOT NULL,
    user_agent   TEXT,
    ip_address   TEXT,
    revoked      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_refresh_token_per_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- =========================================================
--  TABLES : universite / faculte / departement
-- =========================================================
CREATE TABLE universite (
    id_universite   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_universite  VARCHAR(150) NOT NULL
);

CREATE TABLE faculte (
    id_faculte     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_faculte    VARCHAR(150) NOT NULL,
    id_universite  UUID NOT NULL,
    CONSTRAINT fk_faculte_universite
        FOREIGN KEY (id_universite)
        REFERENCES universite(id_universite)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE departement (
    id_departement  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_departement VARCHAR(150) NOT NULL,
    id_faculte      UUID NOT NULL,
    CONSTRAINT fk_departement_faculte
        FOREIGN KEY (id_faculte)
        REFERENCES faculte(id_faculte)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : concours
-- =========================================================
CREATE TABLE concours (
    id_concours     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annee           INTEGER NOT NULL,
    date_concours   DATE,

    id_departement  UUID NOT NULL,
    id_responsable  UUID,

    CONSTRAINT fk_concours_departement
        FOREIGN KEY (id_departement)
        REFERENCES departement(id_departement)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_concours_responsable
        FOREIGN KEY (id_responsable)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : specialite
-- =========================================================
CREATE TABLE specialite (
    id_specialite   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filiere         VARCHAR(150) NOT NULL,
    nom_specialite  VARCHAR(150) NOT NULL,
    nombre_places   INTEGER      NOT NULL,

    id_concours     UUID NOT NULL,
    CONSTRAINT fk_specialite_concours
        FOREIGN KEY (id_concours)
        REFERENCES concours(id_concours)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : salle + responsable_salle + surveillant
-- =========================================================
CREATE TABLE salle (
    id_salle       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_salle      VARCHAR(100) NOT NULL,
    capacite_salle INTEGER      NOT NULL
);

-- 1 salle = 1 responsable (si tu veux)
CREATE TABLE responsable_salle (
    id_responsable_salle UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_salle             UUID NOT NULL,
    id_user              UUID NOT NULL,

    CONSTRAINT fk_resp_salle_salle
        FOREIGN KEY (id_salle)
        REFERENCES salle(id_salle)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_resp_salle_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_resp_salle UNIQUE (id_salle)
);

-- Plusieurs surveillants par salle
CREATE TABLE surveillant (
    id_surveillant UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_salle       UUID NOT NULL,
    id_user        UUID NOT NULL,

    CONSTRAINT fk_surveillant_salle
        FOREIGN KEY (id_salle)
        REFERENCES salle(id_salle)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_surveillant_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_surveillant UNIQUE (id_salle, id_user)
);

-- =========================================================
--  TABLE : sujet
-- =========================================================
CREATE TABLE sujet (
    id_sujet      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours   UUID NOT NULL,
    matiere       VARCHAR(150) NOT NULL,
    type_epreuve  VARCHAR(50)  NOT NULL CHECK (type_epreuve IN ('COMMUNE','SPECIALITE')),
    coefficient   NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    status        VARCHAR(30)  NOT NULL CHECK (status IN ('ACTIF','ANNULE')),
    fichier_sujet TEXT,

    CONSTRAINT fk_sujet_concours
        FOREIGN KEY (id_concours)
        REFERENCES concours(id_concours)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : epreuve
-- =========================================================
CREATE TABLE epreuve (
    id_epreuve       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sujet         UUID NOT NULL,
    id_salle         UUID NOT NULL,
    date_heure_debut TIMESTAMPTZ NOT NULL,
    date_heure_fin   TIMESTAMPTZ,

    CONSTRAINT fk_epreuve_sujet
        FOREIGN KEY (id_sujet)
        REFERENCES sujet(id_sujet)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_epreuve_salle
        FOREIGN KEY (id_salle)
        REFERENCES salle(id_salle)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : candidat
-- =========================================================
CREATE TABLE candidat (
    id_candidat        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_candidat       VARCHAR(100) NOT NULL,
    prenom_candidat    VARCHAR(100) NOT NULL,
    matricule          VARCHAR(50)  NOT NULL UNIQUE,
    date_naissance     DATE,

    statut_commun      VARCHAR(30) NOT NULL CHECK (statut_commun IN ('PRESENT','ABSENT')),
    statut_specialite  VARCHAR(30) NOT NULL CHECK (statut_specialite IN ('PRESENT','ABSENT')),

    id_specialite      UUID NOT NULL,
    CONSTRAINT fk_candidat_specialite
        FOREIGN KEY (id_specialite)
        REFERENCES specialite(id_specialite)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : copie
-- =========================================================
CREATE TABLE copie (
    id_copie      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidat_id   UUID NOT NULL,
    id_epreuve    UUID NOT NULL,
    code_anonyme  VARCHAR(50) NOT NULL UNIQUE,
    statut_copie  VARCHAR(30) CHECK (statut_copie IN ('CODEE','CORRIGEE','VALIDEE')),

    CONSTRAINT fk_copie_candidat
        FOREIGN KEY (candidat_id)
        REFERENCES candidat(id_candidat)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_copie_epreuve
        FOREIGN KEY (id_epreuve)
        REFERENCES epreuve(id_epreuve)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : codage (anonymat)
-- =========================================================
CREATE TABLE codage (
    codage_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_copie            UUID NOT NULL,
    id_cellule_anonymat UUID NOT NULL,
    date_codage         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_codage_copie UNIQUE (id_copie),

    CONSTRAINT fk_codage_copie
        FOREIGN KEY (id_copie)
        REFERENCES copie(id_copie)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_codage_user
        FOREIGN KEY (id_cellule_anonymat)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : correction
-- =========================================================
CREATE TABLE correction (
    id_correction UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_anonyme  VARCHAR(50) NOT NULL,
    id_correcteur UUID NOT NULL,
    note          NUMERIC(5,2) NOT NULL,

    CONSTRAINT uq_correction UNIQUE (code_anonyme, id_correcteur),

    CONSTRAINT fk_correction_copie
        FOREIGN KEY (code_anonyme)
        REFERENCES copie(code_anonyme)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_correction_user
        FOREIGN KEY (id_correcteur)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : note_finale
-- =========================================================
CREATE TABLE note_finale (
    id_note_finale UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_anonyme   VARCHAR(50) NOT NULL,
    note1          NUMERIC(5,2),
    note2          NUMERIC(5,2),
    note3          NUMERIC(5,2),
    moyenne_finale NUMERIC(5,2),

    CONSTRAINT uq_note_finale_code UNIQUE (code_anonyme),

    CONSTRAINT fk_note_finale_copie
        FOREIGN KEY (code_anonyme)
        REFERENCES copie(code_anonyme)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : levee_anonymat
-- =========================================================
CREATE TABLE levee_anonymat (
    id_levee     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_levee   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_concours  UUID NOT NULL,
    code_anonyme VARCHAR(50) NOT NULL,

    CONSTRAINT uq_levee UNIQUE (id_concours, code_anonyme),

    CONSTRAINT fk_levee_concours
        FOREIGN KEY (id_concours)
        REFERENCES concours(id_concours)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_levee_copie
        FOREIGN KEY (code_anonyme)
        REFERENCES copie(code_anonyme)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : classement
-- =========================================================
CREATE TABLE classement (
    id_classement UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours   UUID NOT NULL,
    id_candidat   UUID NOT NULL,
    rang          INTEGER,
    decision      VARCHAR(30) CHECK (decision IN ('ADMIS','REFUSE')),

    CONSTRAINT uq_classement UNIQUE (id_concours, id_candidat),

    CONSTRAINT fk_classement_concours
        FOREIGN KEY (id_concours)
        REFERENCES concours(id_concours)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_classement_candidat
        FOREIGN KEY (id_candidat)
        REFERENCES candidat(id_candidat)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : pv_generique
-- =========================================================
CREATE TABLE pv_generique (
    id_pv       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours UUID NOT NULL,
    type_pv     VARCHAR(50) NOT NULL CHECK (type_pv IN ('PRESELECTION','NOTATION','DELIBERATION')),
    date_pv     DATE NOT NULL,
    fichier_pv  TEXT NOT NULL,
    id_redacteur UUID NOT NULL,

    CONSTRAINT fk_pv_concours
        FOREIGN KEY (id_concours)
        REFERENCES concours(id_concours)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_pv_redacteur
        FOREIGN KEY (id_redacteur)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : pv_signature
-- =========================================================
CREATE TABLE pv_signature (
    id_pv_signature UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pv           UUID NOT NULL,
    id_signataire   UUID NOT NULL,
    type_signature  VARCHAR(50) NOT NULL CHECK (type_signature IN ('MANUSCRITE','NUMERIQUE')),
    date_signature  TIMESTAMPTZ,
    statut          VARCHAR(30) NOT NULL CHECK (statut IN ('ENATTENTE','SIGNEE','REFUSEE')),

    CONSTRAINT uq_pv_signataire UNIQUE (id_pv, id_signataire),

    CONSTRAINT fk_pv_signature_pv
        FOREIGN KEY (id_pv)
        REFERENCES pv_generique(id_pv)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_pv_signature_user
        FOREIGN KEY (id_signataire)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : historique_action
-- =========================================================
CREATE TABLE historique_action (
    id_action   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user     UUID NOT NULL,
    action      VARCHAR(255) NOT NULL CHECK (
        action IN (
            'creation','modification','suppression','connexion','deconnexion',
            'changement_statut','telechargement_pv','generation_pv','codage',
            'correction','levee_anonymat'
        )
    ),
    cible_type  VARCHAR(50) NOT NULL CHECK (
        cible_type IN ('candidat','copie','pv','concours','sujet','note_finale','classement','user')
    ),
    cible_id    UUID,
    date_action TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hist_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  TABLE : etape_concours
-- =========================================================
CREATE TABLE etape_concours (
    code_etape    VARCHAR(50) PRIMARY KEY CHECK (
        code_etape IN (
            'ORGANISATION','ANONYMAT','EPREUVE','CORRECTION','NOTE_FINALE','CLASSEMENT',
            'PV_PRESELECTION','PV_ADMISSION','PV_FINAL'
        )
    ),
    libelle_etape VARCHAR(150) NOT NULL,
    ordre         INTEGER NOT NULL
);

-- =========================================================
--  TABLE : suivi_concours
-- =========================================================
CREATE TABLE suivi_concours (
    id_suivi       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours    UUID NOT NULL,
    code_etape     VARCHAR(50) NOT NULL,
    statut_etape   VARCHAR(30) NOT NULL CHECK (statut_etape IN ('NONCOMMENCE','ENCOURS','TERMINEE','BLOQUEE')),
    date_debut     TIMESTAMPTZ,
    date_fin       TIMESTAMPTZ,
    id_responsable UUID,
    commentaire    TEXT,

    CONSTRAINT uq_suivi UNIQUE (id_concours, code_etape),

    CONSTRAINT fk_suivi_concours
        FOREIGN KEY (id_concours)
        REFERENCES concours(id_concours)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_suivi_etape
        FOREIGN KEY (code_etape)
        REFERENCES etape_concours(code_etape)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_suivi_responsable
        FOREIGN KEY (id_responsable)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
--  Index utiles
-- =========================================================
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_concours_departement ON concours(id_departement);

CREATE INDEX idx_candidat_specialite ON candidat(id_specialite);

CREATE INDEX idx_copie_candidat ON copie(candidat_id);
CREATE INDEX idx_copie_epreuve  ON copie(id_epreuve);

CREATE INDEX idx_correction_correcteur ON correction(id_correcteur);

CREATE INDEX idx_classement_concours ON classement(id_concours);

CREATE INDEX idx_suivi_concours ON suivi_concours(id_concours);

CREATE INDEX idx_hist_user ON historique_action(id_user);
CREATE INDEX idx_hist_cible ON historique_action(cible_type, cible_id);
