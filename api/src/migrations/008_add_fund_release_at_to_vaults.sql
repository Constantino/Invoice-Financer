ALTER TABLE vaults 
ADD COLUMN IF NOT EXISTS fund_release_at TIMESTAMP;

CREATE INDEX idx_vaults_fund_release_at ON vaults(fund_release_at);
