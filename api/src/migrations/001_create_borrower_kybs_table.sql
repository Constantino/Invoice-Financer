-- Create BorrowerKYBs table
CREATE TABLE IF NOT EXISTS "BorrowerKYBs" (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    legal_business_name VARCHAR(255) NOT NULL,
    country_of_incorporation VARCHAR(100) NOT NULL,
    business_registration_number VARCHAR(255) NOT NULL,
    business_description TEXT NOT NULL,
    UBO_full_name VARCHAR(255) NOT NULL,
    average_invoice_amount DECIMAL(18, 2) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL
);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_borrower_kybs_created_at ON "BorrowerKYBs"(created_at);

-- Create an index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_borrower_kybs_wallet_address ON "BorrowerKYBs"(wallet_address);

-- Create a function to automatically update modified_at timestamp
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update modified_at on row updates
CREATE TRIGGER update_borrower_kybs_modified_at
    BEFORE UPDATE ON "BorrowerKYBs"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();
