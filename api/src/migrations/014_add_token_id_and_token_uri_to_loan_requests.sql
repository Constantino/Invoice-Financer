ALTER TABLE loan_requests 
ADD COLUMN IF NOT EXISTS token_id INTEGER,
ADD COLUMN IF NOT EXISTS token_uri VARCHAR(500);

CREATE INDEX idx_loan_requests_token_id ON loan_requests(token_id) WHERE token_id IS NOT NULL;
