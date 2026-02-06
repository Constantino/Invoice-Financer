CREATE TABLE IF NOT EXISTS vault_lenders (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    lender_wallet_address VARCHAR(255) NOT NULL,
    shares DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vault_id, lender_wallet_address)
);

CREATE INDEX idx_vault_lenders_vault_id ON vault_lenders(vault_id);
CREATE INDEX idx_vault_lenders_lender_wallet ON vault_lenders(lender_wallet_address);
