import { useEffect, useMemo } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";

/**
 * Hook to get the first connected Ethereum wallet address.
 * Tries connected wallets first, then falls back to user's linked accounts (embedded wallets).
 */
export function useWalletAddress() {
    const { wallets, ready: walletsReady } = useWallets();
    const { ready: privyReady, user } = usePrivy();

    const isReady = privyReady && walletsReady;

    const walletAddress = useMemo(() => {
        if (!isReady) return null;

        if (wallets && wallets.length > 0) {
            const privyWallet = wallets.find(
                (w) => w.walletClientType === "privy"
            );
            if (privyWallet) return privyWallet.address;
        }

        if (user) {
            const linkedAccounts = user.linkedAccounts || [];
            const walletAccount = linkedAccounts.find(
                (account) => account.type === "wallet"
            ) as { type: string; address?: string; walletClientType?: string } | undefined;
            if (walletAccount && "address" in walletAccount && walletAccount.address) {
                return walletAccount.address;
            }
        }

        if (wallets && wallets.length > 0) return wallets[0].address;
        return null;
    }, [isReady, wallets, user]);

    return {
        walletAddress,
        isReady,
        walletsReady,
        privyReady,
    };
}
