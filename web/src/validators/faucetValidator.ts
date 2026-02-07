export const MAX_AMOUNT = 100000000;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateAddress = (address: string): ValidationResult => {
    if (!address || address.trim() === "") {
        return { isValid: false, error: "Address is required" };
    }

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
        return { isValid: false, error: "Please enter a valid Ethereum wallet address" };
    }

    return { isValid: true };
};

export const validateAmount = (amount: string): ValidationResult => {
    if (!amount || amount.trim() === "") {
        return { isValid: false, error: "Amount is required" };
    }

    const amountNum = parseInt(amount, 10);

    if (isNaN(amountNum)) {
        return { isValid: false, error: "Please enter a valid amount" };
    }

    if (amountNum <= 0) {
        return { isValid: false, error: "Amount must be greater than 0" };
    }

    if (amountNum > MAX_AMOUNT) {
        return {
            isValid: false,
            error: `Maximum amount is ${MAX_AMOUNT.toLocaleString()} USDC`,
        };
    }

    return { isValid: true };
};

export const validateMintRequest = (address: string, amount: string): ValidationResult => {
    const addressValidation = validateAddress(address);
    if (!addressValidation.isValid) return addressValidation;

    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) return amountValidation;

    return { isValid: true };
};

export const isValidIntegerInput = (value: string): boolean => {
    if (value === "") return true;
    return /^\d+$/.test(value);
};

export const isWithinMaxLimit = (value: string): boolean => {
    if (value === "") return true;
    const numValue = parseInt(value, 10);
    return !isNaN(numValue) && numValue <= MAX_AMOUNT;
};
