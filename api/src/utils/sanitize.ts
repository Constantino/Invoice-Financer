import { BorrowerKYBRequestBody } from '../models/borrowerKyb';

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
