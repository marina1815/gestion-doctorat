
-- =========================================================
--  Initialisation (PostgreSQL)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
--  TABLE : users
-- =========================================================
CREATE TABLE users (
    id_user         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_user        VARCHAR(100)      NOT NULL,
    prenom_user     VARCHAR(100)      NOT NULL,
    nom_ar          VARCHAR(100),
    prenom_ar       VARCHAR(100),
    username        VARCHAR(50)       NOT NULL UNIQUE,
    email           VARCHAR(150)      NOT NULL UNIQUE,
    password_hash   TEXT              NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
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
    grade           VARCHAR(100),
    sexe            VARCHAR(10) NOT NULL CHECK(
        sexe IN (
            'FEMME',
            'HOMME'
        )
    ),
    token_version   INTEGER           NOT NULL DEFAULT 0,
    is_active       BOOLEAN           NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);


-- =========================================================
--  TABLE : refresh_tokens (authentification)
-- =========================================================
CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    token_hash   TEXT        NOT NULL,          -- hash du refresh token
    user_agent   TEXT,                          -- info navigateur / appareil
    ip_address   TEXT,                          -- ou INET si tu veux typer l'IP
    revoked      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_refresh_token_per_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- =========================================================
--  TABLES : universite / faculte / departement
-- =========================================================
CREATE TABLE universite (
    id_universite   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_universite  VARCHAR(150) NOT NULL
);

CREATE TABLE faculte (
    id_faculte      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_faculte     VARCHAR(150) NOT NULL,
    id_universite   UUID NOT NULL REFERENCES universite(id_universite)
);

CREATE TABLE departement (
    id_departement  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_departement VARCHAR(150) NOT NULL,
    id_faculte      UUID NOT NULL REFERENCES faculte(id_faculte)
);

-- =========================================================
--  TABLE : concours
-- =========================================================
CREATE TABLE concours (
    id_concours     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annee           INTEGER         NOT NULL,  
    date_concours   DATE,
    etat            VARCHAR(30)     NOT NULL CHECK (
        etat IN (
            'BROUILLON',
            'OUVERT',
            'CLOS',
            'ARCHIVE'
        )
    ),  
    id_departement  UUID            NOT NULL REFERENCES departement(id_departement),
    id_responsable  UUID            REFERENCES users(id_user)
);

-- =========================================================
--  TABLE : specialite
-- =========================================================
CREATE TABLE specialite (
    id_specialite   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filiere         VARCHAR(150) NOT NULL,
    nom_specialite  VARCHAR(150) NOT NULL,
    nombre_places   INTEGER      NOT NULL,
    id_concours     UUID         NOT NULL REFERENCES concours(id_concours)
);

-- =========================================================
--  TABLE : salle
-- =========================================================
CREATE TABLE salle (
    id_salle        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_salle       VARCHAR(100) NOT NULL,
    capacite_salle  INTEGER      NOT NULL
);

-- =========================================================
--  TABLE : sujet
-- =========================================================
CREATE TABLE sujet (
    id_sujet        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours     UUID         NOT NULL REFERENCES concours(id_concours),
    matiere         VARCHAR(150) NOT NULL,
    type_epreuve    VARCHAR(50)  NOT NULL CHECK(
        type_epreuve IN (
            'COMMUNE',
            'SPECIALITE'
        )
    ),  
    coefficient     NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    status          VARCHAR(30)  NOT NULL CHECK (
        status IN (
            'ACTIF',
            'ANNULE'
        )
    ),  
    fichier_sujet   TEXT
);

-- =========================================================
--  TABLE : epreuve
-- =========================================================
CREATE TABLE epreuve (
    id_epreuve      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sujet        UUID         NOT NULL REFERENCES sujet(id_sujet),
    id_salle        UUID         NOT NULL REFERENCES salle(id_salle),
    date_heure_debut TIMESTAMPTZ NOT NULL,
    date_heure_fin   TIMESTAMPTZ
);

-- =========================================================
--  TABLE : candidat
-- =========================================================
CREATE TABLE candidat (
    id_candidat     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_candidat    VARCHAR(100) NOT NULL,
    prenom_candidat VARCHAR(100) NOT NULL,
    matricule       VARCHAR(50)  NOT NULL UNIQUE,
    date_naissance  DATE,
    statut_admin    VARCHAR(30)  NOT NULL, -- dossier_complet / en_attente / rejeté…
    id_specialite   UUID         NOT NULL REFERENCES specialite(id_specialite)
);

-- =========================================================
--  TABLE : copie
-- =========================================================
CREATE TABLE copie (
    id_copie        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidat_id     UUID         NOT NULL REFERENCES candidat(id_candidat),
    id_epreuve      UUID         NOT NULL REFERENCES epreuve(id_epreuve),
    code_anonyme    VARCHAR(50)  NOT NULL UNIQUE,
    statut_copie    VARCHAR(30)  CHECK (
        statut_copie IN (
            'CODEE',
            'CORRIGEE',
            'VALIDEE'
        )
    )
);

-- =========================================================
--  TABLE : codage (anonymat)
-- =========================================================
CREATE TABLE codage (
    codage_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_copie            UUID         NOT NULL REFERENCES copie(id_copie),
    id_cellule_anonymat UUID         NOT NULL REFERENCES users(id_user),
    date_codage         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_codage_copie UNIQUE (id_copie) 
);

-- =========================================================
--  TABLE : correction
-- =========================================================
CREATE TABLE correction (
    id_correction   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_anonyme    VARCHAR(50)  NOT NULL REFERENCES copie(code_anonyme),
    id_correcteur   UUID         NOT NULL REFERENCES users(id_user),
    note            NUMERIC(5,2) NOT NULL,
    CONSTRAINT uniq_correction_code_correcteur UNIQUE (code_anonyme, id_correcteur)
);

-- =========================================================
--  TABLE : note_finale
-- =========================================================
CREATE TABLE note_finale (
    id_note_finale  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_anonyme    VARCHAR(50)  NOT NULL REFERENCES copie(code_anonyme),
    note1           NUMERIC(5,2),
    note2           NUMERIC(5,2),
    note3           NUMERIC(5,2),
    moyenne_finale  NUMERIC(5,2),
    CONSTRAINT uniq_note_finale_code UNIQUE (code_anonyme)
);

-- =========================================================
--  TABLE : levee_anonymat
-- =========================================================
CREATE TABLE levee_anonymat (
    id_levee            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_levee          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_concours         UUID        NOT NULL REFERENCES concours(id_concours),
    code_anonyme        VARCHAR(50) NOT NULL REFERENCES copie(code_anonyme),
    id_user_responsable UUID        NOT NULL REFERENCES users(id_user),
    CONSTRAINT uniq_levee_concours_code UNIQUE (id_concours, code_anonyme)
);

-- =========================================================
--  TABLE : classement
-- =========================================================
CREATE TABLE classement (
    id_classement   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours     UUID        NOT NULL REFERENCES concours(id_concours),
    id_candidat     UUID        NOT NULL REFERENCES candidat(id_candidat),
    rang            INTEGER,
    decision        VARCHAR(30) CHECK (
        decision IN (
            'ADMIS',
            'REFUSE'
        )
    ), 
    CONSTRAINT uniq_classement_concours_candidat UNIQUE (id_concours, id_candidat)
);

-- =========================================================
--  TABLE : pv_generique
-- =========================================================
CREATE TABLE pv_generique (
    id_pv           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours     UUID        NOT NULL REFERENCES concours(id_concours),
    type_pv         VARCHAR(50) NOT NULL CHECK (
        type_pv IN (
            'PRESELECTION',
            'NOTATION',
            'DELIBERATION'
        )
    ),
    date_pv         DATE        NOT NULL,
    fichier_pv      TEXT        NOT NULL,
    id_redacteur    UUID        NOT NULL REFERENCES users(id_user)
);

-- =========================================================
--  TABLE : pv_signature
-- =========================================================
CREATE TABLE pv_signature (
    id_pv_signature UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pv           UUID        NOT NULL REFERENCES pv_generique(id_pv),
    id_signataire   UUID        NOT NULL REFERENCES users(id_user),
    type_signature  VARCHAR(50) NOT NULL CHECK (
        type_signature IN (
            'MANUSCRITE',
            'NUMERIQUE'
        )
    ),  
    date_signature  TIMESTAMPTZ,
    statut          VARCHAR(30) NOT NULL CHECK (
        statut IN (
            'ENATTENTE',
            'SIGNEE',
            'REFUSEE'
        )
    ),  
    CONSTRAINT uniq_pv_signataire UNIQUE (id_pv, id_signataire)
);

-- =========================================================
--  TABLE : historique_action
-- =========================================================
CREATE TABLE historique_action (
    id_action   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user     UUID        NOT NULL REFERENCES users(id_user),
    action      VARCHAR(255) NOT NULL CHECK (
        action IN (
            'creation',
            'modification',
            'suppression',
            'connexion',
            'deconnexion',
            'changement_statut',
            'telechargement_pv',
            'generation_pv',
            'codage',
            'correction',
            'levee_anonymat'
        )
    ),
    cible_type  VARCHAR(50)  NOT NULL CHECK (
        cible_type IN (
            'candidat',
            'copie',
            'pv',
            'concours',
            'sujet',
            'note_finale',
            'classement',
            'user'
        )
    ), 
    cible_id    UUID,
    date_action TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =========================================================
--  TABLE : etape_concours
-- =========================================================
CREATE TABLE etape_concours (
    code_etape   VARCHAR(50) PRIMARY KEY CHECK (
        code_etape IN (
            'ORGANISATION',
            'ANONYMAT',
            'EPREUVE',
            'CORRECTION',
            'NOTE_FINALE',
            'CLASSEMENT',
            'PV_PRESELECTION',
            'PV_ADMISSION',
            'PV_FINAL'
        )
    ),
    libelle_etape VARCHAR(150) NOT NULL,
    ordre         INTEGER      NOT NULL
);

-- =========================================================
--  TABLE : suivi_concours
-- =========================================================
CREATE TABLE suivi_concours (
    id_suivi       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_concours    UUID        NOT NULL REFERENCES concours(id_concours),
    code_etape     VARCHAR(50) NOT NULL REFERENCES etape_concours(code_etape),
    statut_etape   VARCHAR(30) NOT NULL CHECK (
        statut_etape IN (
            'NONCOMMENCE',
            'ENCOURS',
            'TERMINEE',
            'BLOQUEE'
        )
    ), 
    date_debut     TIMESTAMPTZ,
    date_fin       TIMESTAMPTZ,
    id_responsable UUID        REFERENCES users(id_user),
    commentaire    TEXT,
    CONSTRAINT uniq_suivi_concours_etape UNIQUE (id_concours, code_etape)
);

-- =========================================================
--  Index supplémentaires pour performance
-- =========================================================

-- Users
CREATE INDEX idx_users_role ON users(role);

-- Concours
CREATE INDEX idx_concours_departement ON concours(id_departement);
CREATE INDEX idx_concours_etat ON concours(etat);

-- Candidat
CREATE INDEX idx_candidat_specialite ON candidat(id_specialite);

-- Copie
CREATE INDEX idx_copie_candidat ON copie(candidat_id);
CREATE INDEX idx_copie_epreuve ON copie(id_epreuve);

-- Correction
CREATE INDEX idx_correction_correcteur ON correction(id_correcteur);

-- Classement
CREATE INDEX idx_classement_concours ON classement(id_concours);
CREATE INDEX idx_classement_decision ON classement(decision);

-- Suivi concours
CREATE INDEX idx_suivi_concours ON suivi_concours(id_concours);
CREATE INDEX idx_suivi_statut ON suivi_concours(statut_etape);

-- Historique
CREATE INDEX idx_hist_user ON historique_action(id_user);
CREATE INDEX idx_hist_cible ON historique_action(cible_type, cible_id);
