"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LenderPortfolio } from "@/types/vault";
import { formatCurrency, formatDate, truncateAddress } from "@/lib/format";

const EXPLORER_TX_URL = "https://sepolia.etherscan.io/tx";

interface PortfolioTableProps {
    portfolio: LenderPortfolio[];
    isLoading: boolean;
    error: string | null;
    onRedeem?: (
        vaultAddress: string,
        investedAmount: number,
        lenderId: number,
        sharesAmount?: string
    ) => void;
}

function statusBadgeClass(status: string) {
    switch (status) {
        case "REDEEMED":
            return "bg-purple-500/10 text-purple-600 border border-purple-500/20";
        case "REPAID":
            return "bg-green-500/10 text-green-600 border border-green-500/20";
        case "RELEASED":
            return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
        case "FUNDED":
            return "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20";
        default:
            return "bg-gray-500/10 text-gray-600 border border-gray-500/20";
    }
}

export function PortfolioTable({
    portfolio,
    isLoading,
    error,
    onRedeem,
}: PortfolioTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Name
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Address
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Borrower
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Amount Invested
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Date
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Transaction
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-8 px-4 text-center text-xs text-muted-foreground"
                                    >
                                        Loading portfolio...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-8 px-4 text-center text-xs text-destructive"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            ) : portfolio.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 px-4 text-center">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            You don&apos;t have any loan participations yet
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Explore the{" "}
                                            <Link
                                                href="/vaults"
                                                className="text-primary hover:underline font-medium"
                                            >
                                                existing vaults
                                            </Link>{" "}
                                            to start investing
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                portfolio.map((item) => (
                                    <tr
                                        key={item.lender_id}
                                        className="border-b border-border hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            <Link
                                                href={`/borrowers/loans/${item.loan_request_id}`}
                                                className="text-blue-500 hover:text-blue-700 hover:underline"
                                            >
                                                {item.vault_name}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {truncateAddress(item.vault_address)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {truncateAddress(item.borrower_address)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-semibold">
                                            {formatCurrency(parseFloat(item.amount))}
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(item.status)}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            <a
                                                href={`${EXPLORER_TX_URL}/${item.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 underline"
                                            >
                                                {truncateAddress(item.tx_hash)}
                                            </a>
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            {item.status === "REPAID" &&
                                            item.lender_status === "FUNDED" &&
                                            onRedeem ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        onRedeem(
                                                            item.vault_address,
                                                            parseFloat(item.amount),
                                                            item.lender_id,
                                                            item.shares_amount
                                                        )
                                                    }
                                                    className="h-7 px-3 text-xs"
                                                >
                                                    Redeem
                                                </Button>
                                            ) : item.lender_status === "REDEEMED" ? (
                                                <span className="text-xs text-muted-foreground">
                                                    Completed
                                                </span>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
