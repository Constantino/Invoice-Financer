export const validateLegalBusinessName = (legal_business_name: unknown): string | null => {
    if (!legal_business_name || typeof legal_business_name !== 'string' || legal_business_name.trim().length === 0) {
        return 'legal_business_name is required and must be a non-empty string';
    }
    return null;
};

export const validateCountryOfIncorporation = (country_of_incorporation: unknown): string | null => {
    if (!country_of_incorporation || typeof country_of_incorporation !== 'string' || country_of_incorporation.trim().length === 0) {
        return 'country_of_incorporation is required and must be a non-empty string';
    }
    return null;
};

export const validateBusinessRegistrationNumber = (business_registration_number: unknown): string | null => {
    if (!business_registration_number || typeof business_registration_number !== 'string' || business_registration_number.trim().length === 0) {
        return 'business_registration_number is required and must be a non-empty string';
    }
    return null;
};

export const validateBusinessDescription = (business_description: unknown): string | null => {
    if (!business_description || typeof business_description !== 'string' || business_description.trim().length === 0) {
        return 'business_description is required and must be a non-empty string';
    }
    return null;
};

export const validateUBOFullName = (UBO_full_name: unknown): string | null => {
    if (!UBO_full_name || typeof UBO_full_name !== 'string' || UBO_full_name.trim().length === 0) {
        return 'UBO_full_name is required and must be a non-empty string';
    }
    return null;
};

export const validateAverageInvoiceAmount = (average_invoice_amount: unknown): string | null => {
    if (average_invoice_amount === undefined || average_invoice_amount === null || typeof average_invoice_amount !== 'number' || average_invoice_amount < 0) {
        return 'average_invoice_amount is required and must be a non-negative number';
    }
    return null;
};

export const validateWalletAddress = (wallet_address: unknown): string | null => {
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length === 0) {
        return 'wallet_address is required and must be a non-empty string';
    }
    return null;
};
