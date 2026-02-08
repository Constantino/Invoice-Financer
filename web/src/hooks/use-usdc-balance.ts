import { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "./use-wallet-address";
import { ethers } from "ethers";

const ERC20_BALANCE_ABI = [
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

/**
 * Hook to get the USDC balance (Ethereum Sepolia).
 * Uses NEXT_PUBLIC_USDC_ADDRESS for the USDC contract on the connected chain.
 */
export function useUSDCBalance() {
    const { walletAddress, isReady } = useWalletAddress();
    const { wallets } = useWallets();
    const [balance, setBalance] = useState<string>("0.00");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!isReady || !walletAddress || !wallets?.length) {
                setBalance("0.00");
                return;
            }

            const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
            if (!usdcAddress) {
                setError("USDC address not configured");
                setBalance("0.00");
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const wallet = wallets[0];
                const provider = await wallet.getEthereumProvider();
                const ethersProvider = new ethers.BrowserProvider(provider);
                const usdcContract = new ethers.Contract(
                    usdcAddress,
                    ERC20_BALANCE_ABI,
                    ethersProvider
                );
                const balanceWei = await usdcContract.balanceOf(walletAddress);
                const balanceUsdc = Number(balanceWei) / 1e6;
                setBalance(balanceUsdc.toFixed(2));
            } catch (err) {
                // BAD_DATA / "0x" = no contract at address (wrong network or invalid USDC address)
                setBalance("0.00");
                setError(null); // Don't surface to UI; navbar shows 0.00
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
    }, [isReady, walletAddress, wallets]);

    return {
        balance,
        isLoading,
        error,
    };
}
