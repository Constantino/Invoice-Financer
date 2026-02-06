/**
 * Validates a wallet address to ensure it's a valid Ethereum address
 * @param wallet_address - The wallet address to validate
 * @returns Error message string if validation fails, null if valid
 */
export const validateWalletAddress = (wallet_address: unknown): string | null => {
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length === 0) {
        return 'Wallet address is required and must be a non-empty string';
    }

    const trimmedAddress = wallet_address.trim().toLowerCase();

    // Check if it starts with 0x
    if (!trimmedAddress.startsWith('0x')) {
        return 'Wallet address must start with 0x';
    }

    // Check the length after 0x
    const hexPart = trimmedAddress.substring(2);
    if (hexPart.length !== 40) {
        return `Wallet address must have exactly 40 hexadecimal characters after 0x (found ${hexPart.length})`;
    }

    // Validate Ethereum address format (0x followed by 40 hex characters)
    const walletAddressRegex = /^0x[a-f0-9]{40}$/;
    if (!walletAddressRegex.test(trimmedAddress)) {
        return 'Wallet address contains invalid characters. Only hexadecimal characters (0-9, a-f) are allowed';
    }

    return null;
};
