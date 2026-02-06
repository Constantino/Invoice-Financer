import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY, USDC_ADDRESS, EXPLORER_URL_BASE } from "../config/constants";
import { MOCKUSDC_ABI } from "../abi/MockUSDC";

export interface MintTokensResult {
    success: boolean;
    transactionHash: string;
    explorerUrl: string;
    amount: number;
    recipient: string;
}

export class FaucetService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private usdcContract: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.usdcContract = new ethers.Contract(USDC_ADDRESS, MOCKUSDC_ABI, this.wallet);
    }

    async mintTokens(address: string, amount: number): Promise<MintTokensResult> {
        try {
            // Validate address
            if (!ethers.isAddress(address)) {
                throw new Error('Invalid Ethereum address');
            }

            // Use mintUsdc for human-readable amounts (automatically converts to 6 decimals)
            const tx = await this.usdcContract.mintUsdc(address, amount);
            const receipt = await tx.wait();

            const explorerUrl = `${EXPLORER_URL_BASE}/tx/${receipt.hash}`;

            return {
                success: true,
                transactionHash: receipt.hash,
                explorerUrl,
                amount,
                recipient: address
            };
        } catch (error) {
            console.error('Error minting tokens:', error);
            throw error;
        }
    }
}

export const faucetService = new FaucetService();
