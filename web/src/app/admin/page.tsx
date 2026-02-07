"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoansTable } from "@/components/loans-table";
import { LoanStatsPieChart } from "@/components/loan-stats-pie-chart";
import { PlatformPerformanceAreaChart } from "@/components/platform-performance-area-chart";
import type { LoanRequest, LoanRequestWithVault, LoanStats } from "@/types/loans";
import { LoanRequestStatus } from "@/types/loans/loanRequestStatus";
import { getAllLoanRequestsByStatus } from "@/services/loanService";
import { useRequestedCountStore } from "@/stores/requestedCountStore";

const loanStats: LoanStats = {
    active: 12,
    paid: 8,
    defaulted: 2,
    listed: 5,
};

function generateMonthlyData() {
    const months = [];
    const baseDate = new Date(2024, 0, 1);
    const startingCollateral = 2500000;
    const monthlyGrowthRate = 0.06;
    const realizedYieldRate = 0.015;
    const unrealizedYieldRate = 0.014;
    const delinquentRate = 0.012;
    const monthlyVariations = [
        0.95, 1.02, 1.05, 1.03, 1.08, 1.06, 0.98, 1.01, 1.07, 1.09, 1.12, 1.1,
    ];
    const delinquentVariations = [
        1.1, 0.9, 0.85, 0.95, 0.9, 1.0, 1.15, 1.2, 0.95, 0.9, 0.85, 1.05,
    ];

    for (let i = 0; i < 12; i++) {
        const date = new Date(baseDate);
        date.setMonth(baseDate.getMonth() + i);
        const baseGrowthFactor = Math.pow(1 + monthlyGrowthRate, i);
        const monthlyVariation = monthlyVariations[i];
        const growthFactor = baseGrowthFactor * monthlyVariation;
        const collateral = Math.round(startingCollateral * growthFactor);
        const capitalLoanedVariation = 0.78 + (i % 3) * 0.01;
        const capitalLoaned = Math.round(collateral * capitalLoanedVariation);
        const yieldVariation = 0.87 + (monthlyVariation - 0.95) * 0.5;
        const realizedYield = Math.round(
            capitalLoaned * realizedYieldRate * yieldVariation
        );
        const unrealizedYield = Math.round(
            capitalLoaned * unrealizedYieldRate * yieldVariation * 0.93
        );
        const delinquentRecovery = Math.round(
            capitalLoaned * delinquentRate * delinquentVariations[i]
        );
        const managementFeeIncome = Math.round(realizedYield * 0.1);

        months.push({
            month: date.toISOString(),
            collateralUnderManagement: collateral,
            totalCapitalLoaned: capitalLoaned,
            realizedYield,
            unrealizedYield,
            delinquentRecovery,
            managementFeeIncome,
        });
    }
    return months;
}

const monthlyData = generateMonthlyData();

export default function AdminPage() {
    const router = useRouter();
    const { setRequestedCount } = useRequestedCountStore();
    const [loanRequests, setLoanRequests] = useState<LoanRequestWithVault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLoanRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
    }, []);

    const fetchLoanRequests = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getAllLoanRequestsByStatus(
                LoanRequestStatus.REQUESTED
            );
            setRequestedCount(data.length);

            const mappedData: LoanRequestWithVault[] = data.map(
                (loan: LoanRequest) => ({
                    ...loan,
                    vault_id: 0,
                    vault_address: "",
                    vault_name: "",
                    max_capacity: "0",
                    current_capacity: "0",
                    loan_request_id: loan.id,
                    vault_created_at: "",
                    vault_modified_at: "",
                    vault_fund_release_at: null,
                })
            );
            setLoanRequests(mappedData);
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
                setError(
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred"
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = (requestId: number) => {
        router.push(`/borrowers/loans/${requestId}`);
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-4xl font-bold mb-4 text-foreground">
                    Admin panel
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Loans</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Total loans:{" "}
                                {loanStats.active +
                                    loanStats.paid +
                                    loanStats.defaulted +
                                    loanStats.listed}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <LoanStatsPieChart stats={loanStats} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">
                                Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <PlatformPerformanceAreaChart data={monthlyData} />
                        </CardContent>
                    </Card>
                </div>

                <LoansTable
                    title="Requested Loans"
                    loanRequests={loanRequests}
                    isLoading={isLoading}
                    error={error}
                    onView={handleView}
                    onPay={async (_requestId, _amount, _originalDebt) => ""}
                />
            </div>
        </div>
    );
}
