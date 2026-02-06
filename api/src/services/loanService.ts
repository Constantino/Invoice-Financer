import { pool } from "../config/database";
import { LoanStatus } from "../types/loanStatus";
import { LoanStats } from "../types/loanStats";

export class LoanService {
    public async changeLoanStatus(loanId: number, status: LoanStatus): Promise<void> {
        const query = `
            UPDATE "LoanRequests"
            SET status = $1,
                modified_at = NOW()
            WHERE id = $2
        `;

        const result = await pool.query(query, [status, loanId]);

        if (result.rowCount === 0) {
            throw new Error(`Loan request with id ${loanId} not found`);
        }
    }

    public async getLoanStatsByBorrower(borrowerAddress: string): Promise<LoanStats> {
        const query = `
            SELECT 
                COUNT(CASE WHEN status = $1 THEN 1 END) as active,
                COUNT(CASE WHEN status = $2 THEN 1 END) as paid,
                COUNT(CASE WHEN status = $3 THEN 1 END) as defaulted,
                COUNT(CASE WHEN status = $4 THEN 1 END) as listed
            FROM "LoanRequests"
            WHERE borrower_address = $5
        `;

        const result = await pool.query(query, [
            LoanStatus.ACTIVE,
            LoanStatus.PAID,
            LoanStatus.DEFAULTED,
            LoanStatus.LISTED,
            borrowerAddress
        ]);

        const row = result.rows[0];
        return {
            active: parseInt(row.active, 10),
            paid: parseInt(row.paid, 10),
            defaulted: parseInt(row.defaulted, 10),
            listed: parseInt(row.listed, 10)
        };
    }

    public async getLoanRequestDetails(loanId: number): Promise<any> {
        const query = `
            SELECT
                -- Loan Request fields
                lr.id,
                lr.created_at,
                lr.modified_at,
                lr.invoice_number,
                lr.invoice_amount,
                lr.invoice_due_date,
                lr.term,
                lr.customer_name,
                lr.delivery_completed,
                lr.advance_rate,
                lr.monthly_interest_rate,
                lr.max_loan,
                lr.not_pledged,
                lr.assignment_signed,
                lr.borrower_address,
                lr.status,
                lr.invoice_file_url,
                lr.token_id,
                lr.token_uri,
                lr.token_address,
                
                -- Aggregated vault data with nested lenders and repayments
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'vault_id', v.vault_id,
                            'vault_address', v.vault_address,
                            'vault_name', v.vault_name,
                            'max_capacity', v.max_capacity,
                            'current_capacity', v.current_capacity,
                            'status', v.status,
                            'funded_at', v.funded_at,
                            'fund_release_tx_hash', v.fund_release_tx_hash,
                            'created_at', v.created_at,
                            'modified_at', v.modified_at,
                            'lenders', (
                                SELECT COALESCE(json_agg(
                                    jsonb_build_object(
                                        'lender_id', vl.lender_id,
                                        'lender_address', vl.lender_address,
                                        'amount', vl.amount,
                                        'tx_hash', vl.tx_hash,
                                        'created_at', vl.created_at,
                                        'status', vl.status,
                                        'shares_amount', vl.shares_amount,
                                        'redeemed_amount', vl.redeemed_amount,
                                        'redemption_tx_hash', vl.redemption_tx_hash,
                                        'redeemed_at', vl.redeemed_at
                                    )
                                ), '[]'::json)
                                FROM "VaultLenders" vl
                                WHERE vl.vault_id = v.vault_id
                            ),
                            'repayments', (
                                SELECT COALESCE(json_agg(
                                    jsonb_build_object(
                                        'repayment_id', vr.repayment_id,
                                        'amount', vr.amount,
                                        'tx_hash', vr.tx_hash,
                                        'created_at', vr.created_at
                                    )
                                ), '[]'::json)
                                FROM "VaultRepayments" vr
                                WHERE vr.vault_id = v.vault_id
                            )
                        )
                    ) FILTER (WHERE v.vault_id IS NOT NULL),
                    '[]'::json
                ) as vaults,
                
                -- Calculated metrics
                COALESCE(SUM(v.max_capacity::numeric), 0) as total_funded,
                COALESCE(
                    (
                        SELECT SUM(vr.amount::numeric)
                        FROM "VaultRepayments" vr
                        INNER JOIN "Vaults" v2 ON v2.vault_id = vr.vault_id
                        WHERE v2.loan_request_id = lr.id
                    ),
                    0
                ) as total_repaid
                
            FROM "LoanRequests" lr
            LEFT JOIN "Vaults" v ON v.loan_request_id = lr.id
            WHERE lr.id = $1
            GROUP BY lr.id
        `;

        const result = await pool.query(query, [loanId]);

        if (result.rows.length === 0) {
            throw new Error(`Loan request with id ${loanId} not found`);
        }

        const loanData = result.rows[0];

        // Calculate outstanding balance
        const totalFunded = parseFloat(loanData.total_funded) || 0;
        const totalRepaid = parseFloat(loanData.total_repaid) || 0;
        const outstandingBalance = Math.max(0, totalFunded - totalRepaid);

        return {
            ...loanData,
            total_funded: totalFunded,
            total_repaid: totalRepaid,
            outstanding_balance: outstandingBalance
        };
    }
}

export const loanService = new LoanService();
