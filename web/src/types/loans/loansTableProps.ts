import type { LoanRequestWithVault } from "./loanRequestWithVault";

export interface LoansTableProps {
    loanRequests: LoanRequestWithVault[];
    isLoading: boolean;
    error: string | null;
    onView: (requestId: number) => void;
    onPay: (
        requestId: number,
        amount: number,
        originalDebt: number,
        onProgress?: (step: string) => void
    ) => Promise<string>;
    title?: string;
}
