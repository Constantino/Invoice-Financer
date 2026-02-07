ALTER TABLE loan_requests 
ADD COLUMN IF NOT EXISTS invoice_file_url VARCHAR(500);

CREATE INDEX idx_loan_requests_invoice_file_url ON loan_requests(invoice_file_url) WHERE invoice_file_url IS NOT NULL;
