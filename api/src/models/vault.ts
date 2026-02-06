import { VaultStatus } from "../types/vaultStatus";

export interface CreateVaultBody {
    invoiceName: string;
    invoiceNumber: string;
    borrowerAddress: string;
    invoiceAmount: number;
    maturityDate: number;
    loanRequestId?: number;
}

export interface DeployVaultResult {
    vaultAddress: string;
    vaultExplorerUrl: string;
    vaultName: string;
    vaultSymbol: string;
    factoryAddress: string;
    factoryExplorerUrl: string;
    invoiceNumber: string;
    borrowerAddress: string;
    maxCapacity: number;
    maturityDate: number;
    transactionHash: string;
    explorerUrl: string;
    blockNumber: number;
}

export interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    loan_request_id: number | null;
    status: VaultStatus;
    funded_at: Date | null;
    fund_release_tx_hash: string | null;
    created_at: Date;
    modified_at: Date;
    fund_release_at?: Date | null;
}

// Repayment tracking validation
export interface TrackRepaymentBody {
    amount: number;
    txHash: string;
}
