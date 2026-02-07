import { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "./use-wallet-address";
import { ethers } from "ethers";

/**
 * Hook to get the native ETH balance (Ethereum Sepolia).
 * Uses the wallet's provider so it reflects the connected chain.
 */
export function useETHBalance() {
    const { walletAddress, isReady } = useWalletAddress();
    const { wallets } = useWallets();
    const [balance, setBalance] = useState<string>("0.0000");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!isReady || !walletAddress || !wallets?.length) {
                setBalance("0.0000");
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const wallet = wallets[0];
                const provider = await wallet.getEthereumProvider();
                const ethersProvider = new ethers.BrowserProvider(provider);
                const balanceWei = await ethersProvider.getBalance(walletAddress);
                const balanceEth = Number(balanceWei) / 1e18;
                setBalance(balanceEth.toFixed(4));
            } catch (err) {
                console.error("Error fetching ETH balance:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to fetch ETH balance"
                );
                setBalance("0.0000");
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
