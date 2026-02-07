ALTER TABLE vault_lenders 
ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS redemption_transaction_hash VARCHAR(255);

CREATE INDEX idx_vault_lenders_redeemed_at ON vault_lenders(redeemed_at) WHERE redeemed_at IS NOT NULL;
