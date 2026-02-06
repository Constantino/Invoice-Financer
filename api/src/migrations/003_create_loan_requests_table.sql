CREATE TABLE IF NOT EXISTS loan_requests (
    id SERIAL PRIMARY KEY,
    borrower_wallet_address VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    interest_rate DECIMAL(10, 4) NOT NULL,
    duration_days INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loan_requests_borrower_wallet ON loan_requests(borrower_wallet_address);
CREATE INDEX idx_loan_requests_created_at ON loan_requests(created_at);
