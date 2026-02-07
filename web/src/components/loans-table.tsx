"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { PayModal } from "@/components/pay-modal";
import type { LoansTableProps, LoanRequestWithVault } from "@/types/loans";
import { LoanRequestStatus } from "@/types/loans/loanRequestStatus";
import {
    formatCurrency,
    formatDate,
    formatPercentage,
    getStatusBadgeClass,
    formatStatus,
    truncateAddress,
} from "@/lib/format";
import { getTotalDebt } from "@/services/loanService";
import { useRoleStore } from "@/stores/roleStore";

export function LoansTable({
    loanRequests,
    isLoading,
    error,
    onView,
    onPay,
    title = "Loans",
}: LoansTableProps) {
    const { currentRole } = useRoleStore();
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LoanRequestWithVault | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [processingStep, setProcessingStep] = useState<string>("Processing payment...");

    const isAdmin = currentRole === "Admin";

    const openPayModal = (request: LoanRequestWithVault) => {
        setSelectedRequest(request);
        setPayModalOpen(true);
        setTxHash(null);
        setIsProcessing(false);
        setProcessingStep("Processing payment...");
    };

    const closePayModal = () => {
        setPayModalOpen(false);
        setSelectedRequest(null);
        setTxHash(null);
        setIsProcessing(false);
        setProcessingStep("Processing payment...");
    };

    const handlePayConfirm = async (amount: number, originalDebt: number) => {
        if (!selectedRequest) return;
        setIsProcessing(true);
        setTxHash(null);
        setProcessingStep("Processing payment...");
        try {
            const hash = await onPay(selectedRequest.id, amount, originalDebt, (step) => {
                setProcessingStep(step);
            });
            setTxHash(hash);
        } catch {
            throw undefined;
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Invoice Number
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Amount
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Due Date
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Term
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Customer Name
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Monthly Interest Rate
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Max Loan
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Funding
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Address
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Status
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
                                        colSpan={11}
                                        className="py-8 px-4 text-center text-xs text-muted-foreground"
                                    >
                                        Loading loan requests...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan={11}
                                        className="py-8 px-4 text-center text-xs text-destructive"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            ) : loanRequests.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={11}
                                        className="py-8 px-4 text-center text-xs text-muted-foreground"
                                    >
                                        No loan requests found
                                    </td>
                                </tr>
                            ) : (
                                loanRequests.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="border-b border-border hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {request.invoice_number}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCurrency(request.invoice_amount)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatDate(request.invoice_due_date)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.term} days
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.customer_name}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatPercentage(request.monthly_interest_rate)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCurrency(request.max_loan)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.current_capacity
                                                ? formatCurrency(parseFloat(request.current_capacity))
                                                : "$0.00"}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.vault_address ? (
                                                <CopyButton
                                                    textToCopy={request.vault_address}
                                                    displayText={truncateAddress(request.vault_address)}
                                                    iconSize={12}
                                                    textSize="xs"
                                                    showText
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            <span
                                                className={`px-2 py-1 rounded-full ${getStatusBadgeClass(request.status)}`}
                                            >
                                                {formatStatus(request.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => onView(request.id)}
                                                >
                                                    View
                                                </Button>
                                                {!isAdmin && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => openPayModal(request)}
                                                        disabled={
                                                            request.status !== LoanRequestStatus.ACTIVE
                                                        }
                                                    >
                                                        Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            {selectedRequest && (
                <PayModal
                    isOpen={payModalOpen}
                    onClose={closePayModal}
                    onConfirm={handlePayConfirm}
                    totalDebt={getTotalDebt(selectedRequest) || selectedRequest.max_loan || 0}
                    maxLoan={selectedRequest.max_loan}
                    monthlyInterestRate={selectedRequest.monthly_interest_rate}
                    vaultFundReleaseAt={selectedRequest.vault_fund_release_at}
                    isProcessing={isProcessing}
                    processingStep={processingStep}
                    txHash={txHash}
                />
            )}
        </Card>
    );
}
