CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'ADMIN',
            'CHEFDEPARTEMENT',
            'CFD',
            'CELLULE_ANONYMAT',
            'CORRECTEUR',
            'RESPONSABLE_SALLE'
        )
    ),
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE users
ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

-- Extension pour gen_random_uuid (si pas déjà activée)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,          -- hash du refresh token
  user_agent TEXT,
  ip_address TEXT,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);