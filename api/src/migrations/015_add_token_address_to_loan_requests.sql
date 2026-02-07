ALTER TABLE loan_requests 
ADD COLUMN IF NOT EXISTS token_address VARCHAR(255);

CREATE INDEX idx_loan_requests_token_address ON loan_requests(token_address) WHERE token_address IS NOT NULL;
