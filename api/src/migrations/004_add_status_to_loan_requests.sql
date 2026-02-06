ALTER TABLE loan_requests 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED';

CREATE INDEX idx_loan_requests_status ON loan_requests(status);
