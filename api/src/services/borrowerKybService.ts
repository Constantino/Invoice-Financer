import { pool } from '../config/database';

/**
 * Check if a borrower has completed KYB verification
 * @param walletAddress - The wallet address to check (case-insensitive)
 * @returns Promise<boolean> - True if KYB exists, false otherwise
 */
export const checkBorrowerHasKYB = async (walletAddress: string): Promise<boolean> => {
    const query = `
        SELECT COUNT(*) as count
        FROM "BorrowerKYBs"
        WHERE LOWER(wallet_address) = LOWER($1)
    `;

    const result = await pool.query(query, [walletAddress]);
    const count = parseInt(result.rows[0].count, 10);

    return count > 0;
};
