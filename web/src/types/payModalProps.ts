export interface PayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, originalDebt: number) => Promise<void>;
    totalDebt?: number;
    maxLoan?: number;
    monthlyInterestRate?: number;
    vaultFundReleaseAt?: string | null;
    invoiceDueDate?: string;
    isProcessing?: boolean;
    processingStep?: string;
    txHash?: string | null;
}
