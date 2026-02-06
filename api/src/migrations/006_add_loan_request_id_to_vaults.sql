ALTER TABLE vaults 
ADD COLUMN IF NOT EXISTS loan_request_id INTEGER REFERENCES loan_requests(id) ON DELETE SET NULL;

CREATE INDEX idx_vaults_loan_request_id ON vaults(loan_request_id);
