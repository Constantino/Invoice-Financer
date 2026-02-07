export interface LoanRequest {
    id: number;
    invoice_number: string;
    invoice_amount: number;
    invoice_due_date: string;
    term: number;
    customer_name: string;
    monthly_interest_rate: number;
    advance_rate: number;
    max_loan: number;
    delivery_completed: boolean;
    assignment_signed: boolean;
    not_pledged: boolean;
    borrower_address: string;
    invoice_file_url?: string;
    token_id?: number;
    token_uri?: string;
    token_address?: string;
    created_at: string;
    modified_at: string;
    status: string;
}
