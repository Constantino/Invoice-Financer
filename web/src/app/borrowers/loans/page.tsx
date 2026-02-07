"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { LoansTable } from "@/components/loans-table";
import { LoanStatsPieChart } from "@/components/loan-stats-pie-chart";
import type { LoanRequestWithVault, LoanStats } from "@/types/loans";
import {
    getLoanRequestsByBorrowerWithVaults,
    repayLoan,
    getBorrowerStats,
    calculateTotalDebt,
    calculateTotalInterest,
    calculateTotalCapital,
} from "@/services/loanService";
import { formatCurrency } from "@/lib/format";

export default function LoanDashboardPage() {
    const router = useRouter();
    const { walletAddress } = useWalletAddress();
    const { wallets } = useWallets();
    const [loanRequests, setLoanRequests] = useState<LoanRequestWithVault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const creditScore = 725;

    useEffect(() => {
        if (walletAddress) {
            fetchLoanRequests();
            fetchBorrowerStats();
        } else {
            setLoanRequests([]);
            setLoanStats(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when walletAddress changes
    }, [walletAddress]);

    const fetchLoanRequests = async () => {
        if (!walletAddress) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await getLoanRequestsByBorrowerWithVaults(walletAddress);
            setLoanRequests(data);
        } catch (err) {
            console.error("Error fetching loan requests:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to fetch loan requests"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBorrowerStats = async () => {
        if (!walletAddress) return;
        try {
            setIsLoadingStats(true);
            const stats = await getBorrowerStats(walletAddress);
            setLoanStats(stats);
        } catch (err) {
            console.error("Error fetching borrower stats:", err);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleView = (requestId: number) => {
        router.push(`/borrowers/loans/${requestId}`);
    };

    const handlePayLoan = async (
        requestId: number,
        amount: number,
        originalDebt: number,
        onProgress?: (step: string) => void
    ): Promise<string> => {
        if (!wallets || wallets.length === 0) {
            throw new Error("No wallet connected. Please connect a wallet first.");
        }
        const loanRequest = loanRequests.find((req) => req.id === requestId);
        if (!loanRequest) throw new Error(`Loan request with ID ${requestId} not found`);
        if (!loanRequest.vault_address) throw new Error("Vault address not found for this loan request");
        const wallet = wallets[0];
        if (!wallet) throw new Error("Wallet not available");

        onProgress?.("Starting loan repayment...");
        const txHash = await repayLoan(
            loanRequest.vault_address,
            amount,
            originalDebt,
            wallet,
            loanRequest.id,
            onProgress
        );
        await fetchLoanRequests();
        await fetchBorrowerStats();
        return txHash;
    };

    const totalDebt = calculateTotalDebt(loanRequests);
    const totalInterest = calculateTotalInterest(loanRequests);
    const totalCapital = calculateTotalCapital(loanRequests);

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-4xl font-bold mb-4 text-foreground">My Loans</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Stats</CardTitle>
                            {loanStats && (
                                <CardDescription className="text-xs text-muted-foreground">
                                    Total loans:{" "}
                                    {(loanStats.active ?? 0) +
                                        (loanStats.paid ?? 0) +
                                        (loanStats.defaulted ?? 0) +
                                        (loanStats.listed ?? 0)}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            {isLoadingStats ? (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                    Loading...
                                </div>
                            ) : loanStats ? (
                                <LoanStatsPieChart stats={loanStats} />
                            ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                    No stats available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Balances</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Total Debt
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(totalDebt)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Total Capital
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(totalCapital)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Current Interest
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(totalInterest)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">On-chain Credit Score</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <CreditScoreGauge score={creditScore} />
                        </CardContent>
                    </Card>
                </div>

                <LoansTable
                    loanRequests={loanRequests}
                    isLoading={isLoading}
                    error={error}
                    onView={handleView}
                    onPay={handlePayLoan}
                />
            </div>
        </div>
    );
}
