-- Update existing NULL statuses to 'REQUESTED' if any exist
UPDATE loan_requests SET status = 'REQUESTED' WHERE status IS NULL;

-- Ensure the default is set correctly
ALTER TABLE loan_requests 
ALTER COLUMN status SET DEFAULT 'REQUESTED';
