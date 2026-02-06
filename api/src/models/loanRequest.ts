import { LoanStatus } from "../types/loanStatus";

export interface LoanRequestBody {
    invoice_number: string;
    invoice_amount: number;
    invoice_due_date: string; // ISO date string (YYYY-MM-DD)
    term: number;
    customer_name: string;
    delivery_completed: boolean;
    advance_rate: number;
    monthly_interest_rate: number;
    max_loan: number;
    not_pledged: boolean;
    assignment_signed: boolean;
    borrower_address: string;
}

export interface LoanRequest {
    id: number;
    created_at: Date;
    modified_at: Date;
    invoice_number: string;
    invoice_amount: number;
    invoice_due_date: Date;
    term: number;
    customer_name: string;
    delivery_completed: boolean;
    advance_rate: number;
    monthly_interest_rate: number;
    max_loan: number;
    not_pledged: boolean;
    assignment_signed: boolean;
    borrower_address: string;
    status: LoanStatus;
    invoice_file_url?: string | null;
    legal_business_name?: string | null;
}
