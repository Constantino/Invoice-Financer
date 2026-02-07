CREATE TABLE IF NOT EXISTS vault_repayments (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    repayment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vault_repayments_vault_id ON vault_repayments(vault_id);
CREATE INDEX idx_vault_repayments_repayment_date ON vault_repayments(repayment_date);
