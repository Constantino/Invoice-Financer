CREATE TABLE IF NOT EXISTS borrower_kybs (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    kyb_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    kyb_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_borrower_kybs_wallet_address ON borrower_kybs(wallet_address);
CREATE INDEX idx_borrower_kybs_kyb_status ON borrower_kybs(kyb_status);
