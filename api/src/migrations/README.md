# Database Migrations

This directory contains SQL migration files for the Invoice Financer database schema.

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. `001_create_borrower_kybs_table.sql` - Creates the borrower KYC/KYB table
2. `002_create_vaults_table.sql` - Creates the vaults table
3. `003_create_loan_requests_table.sql` - Creates the loan requests table
4. `004_add_status_to_loan_requests.sql` - Adds status column to loan requests
5. `005_create_vault_lenders_table.sql` - Creates the vault lenders relationship table
6. `006_add_loan_request_id_to_vaults.sql` - Links vaults to loan requests
7. `007_add_status_to_vaults.sql` - Adds status column to vaults
8. `008_add_fund_release_at_to_vaults.sql` - Adds fund release timestamp to vaults
9. `009_create_vault_repayments_table.sql` - Creates the vault repayments table
10. `010_change_status_default_to_requested.sql` - Sets default status to REQUESTED
11. `011_add_invoice_file_url_to_loan_requests.sql` - Adds invoice file URL column
12. `012_add_redemption_tracking_to_vault_lenders.sql` - Adds redemption tracking fields
13. `013_fix_shares_precision.sql` - Fixes shares column precision
14. `014_add_token_id_and_token_uri_to_loan_requests.sql` - Adds NFT token ID and URI
15. `015_add_token_address_to_loan_requests.sql` - Adds NFT token address

## Running Migrations

### Using the migration runner

```bash
npm run migrate
```

Or directly with ts-node:

```bash
npx ts-node src/migrations/run-migrations.ts
```

### Manual execution

You can also run migrations manually using psql:

```bash
psql -U postgres -d invoice_financer -f src/migrations/001_create_borrower_kybs_table.sql
```

## Migration Tracking

The migration runner automatically tracks which migrations have been applied using a `schema_migrations` table. This ensures:

- Migrations are only run once
- Migrations can be run safely multiple times
- You can see which migrations have been applied

## Adding New Migrations

1. Create a new SQL file with the format: `XXX_description.sql`
2. Use the next sequential number
3. Write idempotent SQL (use `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.)
4. Test the migration on a development database first

## Database Schema Overview

- **borrower_kybs**: Stores KYC/KYB information for borrowers
- **loan_requests**: Stores loan requests with invoice details
- **vaults**: Represents funding vaults for loans
- **vault_lenders**: Tracks which lenders have shares in which vaults
- **vault_repayments**: Tracks repayment transactions for vaults
