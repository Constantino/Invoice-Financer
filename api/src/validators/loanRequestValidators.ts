import { LoanRequestBody } from '../models/loanRequest';
import { LoanStatus } from '../types/loanStatus';

export const validateInvoiceNumber = (invoice_number: unknown): string | null => {
    if (!invoice_number || typeof invoice_number !== 'string' || invoice_number.trim().length === 0) {
        return 'invoice_number is required and must be a non-empty string';
    }
    return null;
};

export const validateInvoiceAmount = (invoice_amount: unknown): string | null => {
    if (invoice_amount === undefined || invoice_amount === null || typeof invoice_amount !== 'number' || invoice_amount <= 0) {
        return 'invoice_amount is required and must be a positive number';
    }
    return null;
};

export const validateInvoiceDueDate = (invoice_due_date: unknown): string | null => {
    if (!invoice_due_date || typeof invoice_due_date !== 'string') {
        return 'invoice_due_date is required and must be a valid date string (YYYY-MM-DD)';
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(invoice_due_date)) {
        return 'invoice_due_date must be in YYYY-MM-DD format';
    }

    // Validate that the date is valid
    const date = new Date(invoice_due_date);
    if (isNaN(date.getTime())) {
        return 'invoice_due_date must be a valid date';
    }

    return null;
};

export const validateTerm = (term: unknown): string | null => {
    if (term === undefined || term === null || typeof term !== 'number' || term <= 0 || !Number.isInteger(term)) {
        return 'term is required and must be a positive integer';
    }
    return null;
};

export const validateCustomerName = (customer_name: unknown): string | null => {
    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length === 0) {
        return 'customer_name is required and must be a non-empty string';
    }
    return null;
};

export const validateDeliveryCompleted = (delivery_completed: unknown): string | null => {
    if (typeof delivery_completed !== 'boolean') {
        return 'delivery_completed is required and must be a boolean';
    }
    return null;
};

export const validateAdvanceRate = (advance_rate: unknown): string | null => {
    if (advance_rate === undefined || advance_rate === null || typeof advance_rate !== 'number' || advance_rate < 0 || advance_rate > 1) {
        return 'advance_rate is required and must be a number between 0 and 1';
    }
    return null;
};

export const validateMonthlyInterestRate = (monthly_interest_rate: unknown): string | null => {
    if (monthly_interest_rate === undefined || monthly_interest_rate === null || typeof monthly_interest_rate !== 'number' || monthly_interest_rate < 0 || monthly_interest_rate > 1) {
        return 'monthly_interest_rate is required and must be a number between 0 and 1';
    }
    return null;
};

export const validateMaxLoan = (max_loan: unknown): string | null => {
    if (max_loan === undefined || max_loan === null || typeof max_loan !== 'number' || max_loan <= 0) {
        return 'max_loan is required and must be a positive number';
    }
    return null;
};

export const validateNotPledged = (not_pledged: unknown): string | null => {
    if (typeof not_pledged !== 'boolean') {
        return 'not_pledged is required and must be a boolean';
    }
    return null;
};

export const validateAssignmentSigned = (assignment_signed: unknown): string | null => {
    if (typeof assignment_signed !== 'boolean') {
        return 'assignment_signed is required and must be a boolean';
    }
    return null;
};

export const validateBorrowerAddress = (borrower_address: unknown): string | null => {
    if (!borrower_address || typeof borrower_address !== 'string' || borrower_address.trim().length === 0) {
        return 'borrower_address is required and must be a non-empty string';
    }
    return null;
};

// Type for validation where all fields are unknown (before validation)
type LoanRequestBodyForValidation = {
    [K in keyof LoanRequestBody]: unknown;
};

export const validateRequest = (data: LoanRequestBodyForValidation): string | null => {
    const invoiceNumberError = validateInvoiceNumber(data.invoice_number);
    if (invoiceNumberError) {
        return invoiceNumberError;
    }

    const invoiceAmountError = validateInvoiceAmount(data.invoice_amount);
    if (invoiceAmountError) {
        return invoiceAmountError;
    }

    const invoiceDueDateError = validateInvoiceDueDate(data.invoice_due_date);
    if (invoiceDueDateError) {
        return invoiceDueDateError;
    }

    const termError = validateTerm(data.term);
    if (termError) {
        return termError;
    }

    const customerNameError = validateCustomerName(data.customer_name);
    if (customerNameError) {
        return customerNameError;
    }

    const deliveryCompletedError = validateDeliveryCompleted(data.delivery_completed);
    if (deliveryCompletedError) {
        return deliveryCompletedError;
    }

    const advanceRateError = validateAdvanceRate(data.advance_rate);
    if (advanceRateError) {
        return advanceRateError;
    }

    const monthlyInterestRateError = validateMonthlyInterestRate(data.monthly_interest_rate);
    if (monthlyInterestRateError) {
        return monthlyInterestRateError;
    }

    const maxLoanError = validateMaxLoan(data.max_loan);
    if (maxLoanError) {
        return maxLoanError;
    }

    const notPledgedError = validateNotPledged(data.not_pledged);
    if (notPledgedError) {
        return notPledgedError;
    }

    const assignmentSignedError = validateAssignmentSigned(data.assignment_signed);
    if (assignmentSignedError) {
        return assignmentSignedError;
    }

    const borrowerAddressError = validateBorrowerAddress(data.borrower_address);
    if (borrowerAddressError) {
        return borrowerAddressError;
    }

    return null;
};

export const validateLoanId = (id: unknown): string | null => {
    if (id === undefined || id === null) {
        return 'Loan ID is required';
    }

    const loanId = typeof id === 'string' ? parseInt(id, 10) : typeof id === 'number' ? id : NaN;

    if (isNaN(loanId) || loanId <= 0 || !Number.isInteger(loanId)) {
        return 'Loan ID must be a positive integer';
    }

    return null;
};

export const validateLoanStatus = (status: unknown): string | null => {
    if (!status || typeof status !== 'string') {
        return 'Status is required and must be a string';
    }

    const validStatuses = Object.values(LoanStatus);
    if (!validStatuses.includes(status as LoanStatus)) {
        return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
    }

    return null;
};

export const validateChangeLoanStatusRequest = (id: unknown, status: unknown): string | null => {
    const loanIdError = validateLoanId(id);
    if (loanIdError) {
        return loanIdError;
    }

    const statusError = validateLoanStatus(status);
    if (statusError) {
        return statusError;
    }

    return null;
};

export const validateLoanStatusQueryParam = (status: unknown): { error: string } | { status: LoanStatus } => {
    const validationError = validateLoanStatus(status);
    if (validationError) {
        return { error: validationError };
    }
    return { status: status as LoanStatus };
};
