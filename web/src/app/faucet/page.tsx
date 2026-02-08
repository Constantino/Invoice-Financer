"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getApiUrl, getApiErrorMessage } from "@/lib/api";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import {
    validateMintRequest,
    isValidIntegerInput,
    isWithinMaxLimit,
    MAX_AMOUNT,
} from "@/validators/faucetValidator";

export default function FaucetPage() {
    const { walletAddress: connectedWalletAddress } = useWalletAddress();
    const [walletAddress, setWalletAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<{
        txHash: string;
        explorerUrl?: string;
        amount: number;
    } | null>(null);

    useEffect(() => {
        if (connectedWalletAddress && !walletAddress) {
            setWalletAddress(connectedWalletAddress);
        }
    }, [connectedWalletAddress, walletAddress]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setAmount("");
            return;
        }
        if (isValidIntegerInput(value) && isWithinMaxLimit(value)) {
            setAmount(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        const validation = validateMintRequest(walletAddress, amount);
        if (!validation.isValid) {
            setSubmitError(validation.error || "Validation failed");
            setIsSubmitting(false);
            return;
        }

        const amountNum = parseInt(amount, 10);

        try {
            const apiUrl = getApiUrl();
            const response = await axios.post(`${apiUrl}/faucet`, {
                address: walletAddress,
                amount: amountNum,
            });

            setSubmitSuccess({
                txHash: response.data.data.transactionHash,
                explorerUrl: response.data.data.explorerUrl,
                amount: response.data.data.amount,
            });

            setWalletAddress("");
            setAmount("");
        } catch (error) {
            setSubmitError(getApiErrorMessage(error, "Failed to request tokens"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const explorerLink =
        submitSuccess?.explorerUrl ||
        (submitSuccess?.txHash ? `https://sepolia.etherscan.io/tx/${submitSuccess.txHash}` : null);

    return (
        <div className="w-full p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-foreground">USDC Faucet</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Request test USDC tokens for Ethereum Sepolia. No wallet connection required.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="walletAddress" className="text-sm font-medium text-foreground">
                            Wallet Address
                        </label>
                        <Input
                            id="walletAddress"
                            name="walletAddress"
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the Ethereum address where you want to receive test USDC tokens
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="amount" className="text-sm font-medium text-foreground">
                            Amount (USDC)
                        </label>
                        <Input
                            id="amount"
                            name="amount"
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount (max 100,000,000)"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter an integer amount (no decimals). Maximum: {MAX_AMOUNT.toLocaleString()} USDC
                        </p>
                    </div>

                    {submitError && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">{submitError}</p>
                        </div>
                    )}

                    {submitSuccess && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md space-y-3">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                Successfully minted {submitSuccess.amount} USDC!
                            </p>
                            {explorerLink && submitSuccess.txHash && (
                                <div>
                                    <a
                                        href={explorerLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                    >
                                        {submitSuccess.txHash}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || !walletAddress || !amount}
                        >
                            {isSubmitting ? "Requesting Tokens..." : "Request Tokens"}
                        </Button>
                    </div>
                </form>

                <div className="mt-8 p-4 bg-muted/50 rounded-md border border-border">
                    <h2 className="text-sm font-semibold text-foreground mb-2">Important Notes:</h2>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>These are test tokens for Ethereum Sepolia testnet only</li>
                        <li>No gas fees required - completely gasless</li>
                        <li>Transactions are processed by our backend wallet</li>
                        <li>Use these tokens for testing the factoring platform</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
