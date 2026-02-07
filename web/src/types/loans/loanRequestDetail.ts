import type { LoanRequest } from "./loanRequest";

export interface VaultLender {
    lender_id: number;
    vault_id: number;
    lender_address: string;
    amount: string;
    tx_hash: string;
    created_at: string;
    status?: "FUNDED" | "REDEEMED";
    shares_amount?: string;
    redeemed_amount?: string;
    redemption_tx_hash?: string;
    redeemed_at?: string;
}

export interface VaultRepayment {
    repayment_id: number;
    vault_id: number;
    amount: string;
    tx_hash: string;
    created_at: string;
}

export interface VaultWithDetails {
    vault_id: number;
    vault_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    status: string;
    funded_at: string | null;
    fund_release_tx_hash: string | null;
    created_at: string;
    modified_at: string;
    lenders: VaultLender[];
    repayments: VaultRepayment[];
}

export interface LoanRequestDetail extends LoanRequest {
    vaults: VaultWithDetails[];
    total_funded: number;
    total_repaid: number;
    outstanding_balance: number;
}
