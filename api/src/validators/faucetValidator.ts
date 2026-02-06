import { ethers } from "ethers";

export interface MintRequest {
    address: string;
    amount?: number;
}

/**
 * Validates the address field for faucet mint request
 * @param address - The Ethereum address to validate
 * @returns Error message string if validation fails, null if valid
 */
const validateAddress = (address: unknown): string | null => {
    if (!address) {
        return 'Address is required';
    }

    if (typeof address !== 'string') {
        return 'Address must be a string';
    }

    if (!ethers.isAddress(address)) {
        return 'Invalid Ethereum address format';
    }

    return null;
};

/**
 * Validates the amount field for faucet mint request
 * @param amount - The amount to validate
 * @returns Error message string if validation fails, null if valid
 */
const validateAmount = (amount: unknown): string | null => {
    if (amount === undefined || amount === null) {
        return 'Amount is required';
    }

    if (typeof amount !== 'number') {
        return 'Amount must be a number';
    }

    if (!Number.isInteger(amount)) {
        return 'Amount must be an integer';
    }

    if (amount <= 0) {
        return 'Amount must be greater than 0';
    }

    if (amount > 100000000) {
        return 'Amount must be 100000000 USDC or less';
    }

    return null;
};

/**
 * Validates the complete mint request
 * @param body - The request body to validate
 * @returns Error message string if validation fails, null if valid
 */
export const validateMintRequest = (body: MintRequest): string | null => {
    const addressError = validateAddress(body.address);
    if (addressError) return addressError;

    const amountError = validateAmount(body.amount);
    if (amountError) return amountError;

    return null;
};
