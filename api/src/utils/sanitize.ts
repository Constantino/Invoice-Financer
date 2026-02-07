import { BorrowerKYBRequestBody } from '../models/borrowerKyb';
import { LoanRequestBody } from '../models/loanRequest';
import { GenerateInvoiceMetadataBody, MintInvoiceNFTBody } from '../types/nft';

/**
 * Sanitizes a string by trimming, normalizing whitespace, and removing control characters
 */
export const sanitizeString = (value: string, maxLength?: number): string => {
    if (typeof value !== 'string') {
        return '';
    }

    // Trim and normalize whitespace (replace multiple spaces/tabs/newlines with single space)
    let sanitized = value.trim().replace(/\s+/g, ' ');

    // Remove control characters (except newlines and tabs for text areas)
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Apply max length if specified
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
};

/**
 * Sanitizes a number to ensure it's a valid number
 */
export const sanitizeNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

/**
 * Sanitizes wallet address format (basic validation)
 */
export const sanitizeWalletAddress = (value: string): string => {
    if (typeof value !== 'string') {
        return '';
    }

    // Trim and convert to lowercase for consistency
    const sanitized = value.trim().toLowerCase();

    // Basic Ethereum address format validation (0x followed by 40 hex characters)
    if (/^0x[a-f0-9]{40}$/.test(sanitized)) {
        return sanitized;
    }

    // Return trimmed value even if format doesn't match (validation will catch it)
    return sanitized;
};

/**
 * Sanitizes a date string (YYYY-MM-DD format)
 */
export const sanitizeDate = (value: unknown): string => {
    if (typeof value !== 'string') {
        return '';
    }
    // Trim and validate basic format
    const sanitized = value.trim();
    // Basic format check - full validation happens in validators
    if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
        return sanitized;
    }
    return sanitized;
};

/**
 * Sanitizes an integer number
 */
export const sanitizeInteger = (value: unknown): number => {
    if (typeof value === 'number') {
        return Math.floor(value);
    }
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

/**
 * Sanitizes a boolean value
 */
export const sanitizeBoolean = (value: unknown): boolean => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    return false;
};

/**
 * Sanitizes the entire BorrowerKYB request body
 */
export const sanitizeBorrowerKYBRequest = (data: BorrowerKYBRequestBody): BorrowerKYBRequestBody => {
    return {
        legal_business_name: sanitizeString(data.legal_business_name, 255),
        country_of_incorporation: sanitizeString(data.country_of_incorporation, 100),
        business_registration_number: sanitizeString(data.business_registration_number, 100),
        business_description: sanitizeString(data.business_description, 2000),
        UBO_full_name: sanitizeString(data.UBO_full_name, 255),
        average_invoice_amount: sanitizeNumber(data.average_invoice_amount),
        wallet_address: sanitizeWalletAddress(data.wallet_address),
    };
};

/**
 * Sanitizes a string for use in filenames (removes special characters, spaces, etc.)
 */
export const sanitizeForFilename = (value: string): string => {
    if (typeof value !== 'string') {
        return 'unknown';
    }
    return value.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
};

/**
 * Sanitizes the entire GenerateInvoiceMetadata request body
 */
export const sanitizeGenerateInvoiceMetadataRequest = (data: GenerateInvoiceMetadataBody): GenerateInvoiceMetadataBody => {
    return {
        name: sanitizeString(data.name, 255),
        description: sanitizeString(data.description, 2000),
        borrowerName: sanitizeString(data.borrowerName, 255),
        loanRequestId: sanitizeInteger(data.loanRequestId),
        invoiceNumber: sanitizeString(data.invoiceNumber, 255),
    };
};

/**
 * Sanitizes the entire MintInvoiceNFT request body
 */
export const sanitizeMintInvoiceNFTRequest = (data: MintInvoiceNFTBody): MintInvoiceNFTBody => {
    return {
        ...sanitizeGenerateInvoiceMetadataRequest(data),
        toAddress: sanitizeWalletAddress(data.toAddress),
    };
};

/**
 * Sanitizes the entire LoanRequest request body
 */
export const sanitizeLoanRequestRequest = (data: LoanRequestBody): LoanRequestBody => {
    return {
        invoice_number: sanitizeString(data.invoice_number, 255),
        invoice_amount: sanitizeNumber(data.invoice_amount),
        invoice_due_date: sanitizeDate(data.invoice_due_date),
        term: sanitizeInteger(data.term),
        customer_name: sanitizeString(data.customer_name, 255),
        delivery_completed: sanitizeBoolean(data.delivery_completed),
        advance_rate: sanitizeNumber(data.advance_rate),
        monthly_interest_rate: sanitizeNumber(data.monthly_interest_rate),
        max_loan: sanitizeNumber(data.max_loan),
        not_pledged: sanitizeBoolean(data.not_pledged),
        assignment_signed: sanitizeBoolean(data.assignment_signed),
        borrower_address: sanitizeWalletAddress(data.borrower_address),
    };
};
