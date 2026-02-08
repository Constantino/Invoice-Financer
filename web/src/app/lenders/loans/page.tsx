"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioTable } from "@/components/portfolio-table";
import { RedeemModal } from "@/components/redeem-modal";
import type { LenderPortfolio } from "@/types/vault";
import {
    fetchLenderPortfolio,
    redeemShares,
    previewRedemption,
    calculateAllocatedCapital,
    calculateRealizedGains,
    calculateUnrealizedGains,
} from "@/services/vault";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function LenderLoansPage() {
    const { walletAddress } = useWalletAddress();
    const { wallets } = useWallets();
    const [portfolio, setPortfolio] = useState<LenderPortfolio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [selectedVault, setSelectedVault] = useState<{
        address: string;
        amount: number;
        lenderId: number;
        sharesAmount?: string;
    } | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemStep, setRedeemStep] = useState<string>("Processing...");
    const [redeemTxHash, setRedeemTxHash] = useState<string | null>(null);
    const [redeemableAmount, setRedeemableAmount] = useState<number | undefined>(
        undefined
    );
    const [sharesToRedeem, setSharesToRedeem] = useState<bigint | undefined>(
        undefined
    );
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    useEffect(() => {
        if (walletAddress) {
            fetchPortfolioData();
        } else {
            setPortfolio([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when walletAddress changes
    }, [walletAddress]);

    const fetchPortfolioData = async () => {
        if (!walletAddress) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchLenderPortfolio(walletAddress);
            setPortfolio(data);
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to fetch portfolio"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async (
        vaultAddress: string,
        investedAmount: number,
        lenderId: number,
        sharesAmount?: string
    ) => {
        setSelectedVault({
            address: vaultAddress,
            amount: investedAmount,
            lenderId,
            sharesAmount,
        });
        setRedeemableAmount(undefined);
        setSharesToRedeem(undefined);
        setIsRedeemModalOpen(true);
        setRedeemTxHash(null);

        if (!wallets || wallets.length === 0) return;
        const wallet = wallets[0];
        if (!wallet) return;

        try {
            setIsLoadingPreview(true);
            const preview = await previewRedemption(
                vaultAddress,
                investedAmount,
                sharesAmount,
                wallet
            );
            setRedeemableAmount(preview.redeemableAmount);
            setSharesToRedeem(preview.sharesToRedeem);
        } catch {
            // don't block modal
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleRedeemConfirm = async () => {
        if (!selectedVault || !wallets || wallets.length === 0) {
            throw new Error("No wallet connected");
        }
        if (!sharesToRedeem) {
            throw new Error("Shares amount not calculated. Please try again.");
        }
        const wallet = wallets[0];
        if (!wallet) throw new Error("Wallet not available");

        setIsRedeeming(true);
        setRedeemTxHash(null);

        try {
            const result = await redeemShares(
                selectedVault.address,
                sharesToRedeem,
                selectedVault.lenderId,
                wallet,
                (step: string) => setRedeemStep(step)
            );

            setRedeemTxHash(result.txHash);
            setRedeemableAmount(result.redeemedAmount);

            await new Promise((resolve) => setTimeout(resolve, 2000));
            await fetchPortfolioData();

            setTimeout(() => {
                setIsRedeemModalOpen(false);
                setSelectedVault(null);
            }, 3000);
        } catch (err) {
            throw err;
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleRedeemClose = () => {
        if (!isRedeeming) {
            setIsRedeemModalOpen(false);
            setSelectedVault(null);
            setRedeemTxHash(null);
            setRedeemableAmount(undefined);
            setSharesToRedeem(undefined);
        }
    };

    const allocatedCapital = calculateAllocatedCapital(portfolio);
    const realizedGains = calculateRealizedGains(portfolio);
    const unrealizedGains = calculateUnrealizedGains(portfolio);

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-4xl font-bold mb-4 text-foreground">
                    Portfolio
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Allocated Capital
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(allocatedCapital)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total invested across all vaults
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Gains (Realized)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(realizedGains)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Interest earned from redeemed vaults
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Unrealized Gains
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(unrealizedGains)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Accrued interest not yet redeemed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <PortfolioTable
                    portfolio={portfolio}
                    isLoading={isLoading}
                    error={error}
                    onRedeem={handleRedeem}
                />

                {selectedVault && (
                    <RedeemModal
                        isOpen={isRedeemModalOpen}
                        onClose={handleRedeemClose}
                        onConfirm={handleRedeemConfirm}
                        investedAmount={selectedVault.amount}
                        redeemableAmount={redeemableAmount}
                        isProcessing={isRedeeming}
                        processingStep={redeemStep}
                        txHash={redeemTxHash}
                        isLoadingPreview={isLoadingPreview}
                    />
                )}
            </div>
        </div>
    );
}
