export interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    loan_request_id: number;
    status: string;
    funded_at: string | null;
    fund_release_tx_hash: string | null;
    created_at: string;
    modified_at: string;
}

export interface LenderPortfolio {
    lender_id: number;
    lender_address: string;
    amount: string;
    tx_hash: string;
    created_at: string;
    vault_id: number;
    vault_address: string;
    vault_name: string;
    borrower_address: string;
    max_capacity: string;
    current_capacity: string;
    status: string;
    funded_at: string | null;
    fund_release_tx_hash: string | null;
    fund_release_at?: string | null;
    loan_request_id: number;
    maturity_date?: string | null;
    monthly_interest_rate?: number | null;
    lender_status: "FUNDED" | "REDEEMED";
    shares_amount?: string;
    redeemed_amount?: string;
    redemption_tx_hash?: string;
    redeemed_at?: string;
}
