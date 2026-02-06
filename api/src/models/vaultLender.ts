export interface VaultLender {
    lender_id: number;
    vault_id: number;
    lender_address: string;
    amount: string;
    tx_hash: string;
    created_at: Date;
    status: 'FUNDED' | 'REDEEMED';
    shares_amount?: string;
    redeemed_amount?: string;
    redemption_tx_hash?: string;
    redeemed_at?: Date;
}

export interface CreateVaultLenderBody {
    lenderAddress: string;
    amount: number;
    sharesAmount?: string;  // Store as string to preserve precision
    txHash: string;
}
