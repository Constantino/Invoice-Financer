-- Ensure shares column has proper precision for financial calculations
ALTER TABLE vault_lenders 
ALTER COLUMN shares TYPE DECIMAL(36, 18);
