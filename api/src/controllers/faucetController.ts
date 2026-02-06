import { Request, Response } from "express";
import { faucetService } from "../services/faucetService";
import { validateMintRequest, MintRequest } from "../validators/faucetValidator";

export const mintTokens = async (req: Request, res: Response): Promise<void> => {
    try {
        const { address, amount = 1000 }: MintRequest = req.body;

        // Validate request
        const validationError = validateMintRequest({ address, amount });
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        // Mint tokens
        const result = await faucetService.mintTokens(address, amount);

        res.status(200).json({
            message: 'Tokens minted successfully',
            data: result
        });
    } catch (error) {
        console.error('Error minting tokens:', error);
        res.status(500).json({
            error: 'Failed to mint tokens',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
