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
