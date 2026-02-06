CREATE TABLE IF NOT EXISTS vaults (
    id SERIAL PRIMARY KEY,
    vault_address VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vaults_vault_address ON vaults(vault_address);
