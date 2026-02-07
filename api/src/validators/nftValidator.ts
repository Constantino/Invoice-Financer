import { GenerateInvoiceMetadataBody, InvoiceMetadata, MintInvoiceNFTBody } from '../types/nft';
import { INVOICE_NFT_ADDRESS, TREASURY_ADDRESS } from '../config/constants';
import { validateWalletAddress } from './walletAddressValidator';

export const validateName = (name: unknown): string | null => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return 'Name is required and must be a non-empty string';
    }
    return null;
};

export const validateDescription = (description: unknown): string | null => {
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return 'Description is required and must be a non-empty string';
    }
    return null;
};

export const validateBorrowerName = (borrowerName: unknown): string | null => {
    if (!borrowerName || typeof borrowerName !== 'string' || borrowerName.trim().length === 0) {
        return 'Borrower name is required and must be a non-empty string';
    }
    return null;
};

export const validateLoanRequestId = (loanRequestId: unknown): string | null => {
    if (loanRequestId === undefined || loanRequestId === null || typeof loanRequestId !== 'number' || loanRequestId <= 0) {
        return 'Loan request ID is required and must be a positive number';
    }
    return null;
};

export const validateInvoiceNumber = (invoiceNumber: unknown): string | null => {
    if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim().length === 0) {
        return 'Invoice number is required and must be a non-empty string';
    }
    return null;
};

type GenerateInvoiceMetadataBodyForValidation = {
    [K in keyof GenerateInvoiceMetadataBody]: unknown;
};

export const validateRequest = (data: GenerateInvoiceMetadataBodyForValidation): string | null => {
    const nameError = validateName(data.name);
    if (nameError) return nameError;
    const descriptionError = validateDescription(data.description);
    if (descriptionError) return descriptionError;
    const borrowerNameError = validateBorrowerName(data.borrowerName);
    if (borrowerNameError) return borrowerNameError;
    const loanRequestIdError = validateLoanRequestId(data.loanRequestId);
    if (loanRequestIdError) return loanRequestIdError;
    const invoiceNumberError = validateInvoiceNumber(data.invoiceNumber);
    if (invoiceNumberError) return invoiceNumberError;
    return null;
};

export const validateImage = (image: unknown): string | null => {
    if (!image || typeof image !== 'string' || image.trim().length === 0) {
        return 'Image is required and must be a non-empty string';
    }
    try {
        new URL(image);
    } catch {
        return 'Image must be a valid URL';
    }
    return null;
};

export const validateAttributes = (attributes: unknown): string | null => {
    if (!attributes) return 'Attributes are required';
    if (!Array.isArray(attributes)) return 'Attributes must be an array';
    if (attributes.length === 0) return 'Metadata must have at least one attribute';
    for (const attr of attributes) {
        if (typeof attr !== 'object' || attr === null) return 'Each attribute must be an object';
        if (!('trait_type' in attr) || typeof attr.trait_type !== 'string' || attr.trait_type.trim().length === 0) {
            return 'Each attribute must have a non-empty trait_type string';
        }
        if (!('value' in attr) || typeof attr.value !== 'string' || attr.value.trim().length === 0) {
            return 'Each attribute must have a non-empty value string';
        }
    }
    return null;
};

type InvoiceMetadataForValidation = {
    [K in keyof InvoiceMetadata]: unknown;
};

export const validateInvoiceMetadata = (data: InvoiceMetadataForValidation): string | null => {
    const nameError = validateName(data.name);
    if (nameError) return nameError;
    const descriptionError = validateDescription(data.description);
    if (descriptionError) return descriptionError;
    const imageError = validateImage(data.image);
    if (imageError) return imageError;
    const attributesError = validateAttributes(data.attributes);
    if (attributesError) return attributesError;
    return null;
};

export const validateInvoiceNftAddress = (): string | null => {
    if (!INVOICE_NFT_ADDRESS || INVOICE_NFT_ADDRESS.trim().length === 0) {
        return 'INVOICE_NFT_ADDRESS is not configured. Please set it in your environment variables.';
    }
    return validateWalletAddress(INVOICE_NFT_ADDRESS);
};

export const validateRecipientAddress = (recipientAddress: unknown): string | null => {
    return validateWalletAddress(recipientAddress);
};

export const validateTreasuryAddress = (): string | null => {
    if (!TREASURY_ADDRESS || TREASURY_ADDRESS.trim().length === 0) {
        return 'TREASURY_ADDRESS is not configured. Please set it in your environment variables.';
    }
    return validateWalletAddress(TREASURY_ADDRESS);
};

type MintInvoiceNFTBodyForValidation = {
    [K in keyof MintInvoiceNFTBody]: unknown;
};

export const validateMintInvoiceNFTRequest = (data: MintInvoiceNFTBodyForValidation): string | null => {
    const metadataError = validateRequest(data);
    if (metadataError) return metadataError;
    const recipientAddressError = validateRecipientAddress(data.toAddress);
    if (recipientAddressError) return recipientAddressError;
    return null;
};
