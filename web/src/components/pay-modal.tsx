"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/error-panel";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { PayModalProps } from "@/types/payModalProps";
import { calculateDaysSinceFundRelease } from "@/services/loanService";

const EXPLORER_TX_URL = "https://sepolia.etherscan.io/tx";

export function PayModal({
    isOpen,
    onClose,
    onConfirm,
    totalDebt,
    maxLoan,
    monthlyInterestRate,
    vaultFundReleaseAt,
    isProcessing = false,
    processingStep = "Processing...",
    txHash = null,
}: PayModalProps) {
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleConfirm = async () => {
        if (totalDebt !== undefined && totalDebt > 0 && maxLoan !== undefined && maxLoan > 0) {
            setError(null);
            try {
                await onConfirm(totalDebt, maxLoan);
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message.includes("user rejected") ||
                          err.message.includes("User denied")
                            ? "Transaction cancelled by user"
                            : err.message
                        : "Failed to pay loan";
                setError(errorMessage);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[500px]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Pay Loan</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {totalDebt !== undefined && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Debt</p>
                                <p className="text-lg font-semibold">{formatCurrency(totalDebt)}</p>
                            </div>
                            <div className="border-t border-border pt-3 space-y-2">
                                {vaultFundReleaseAt && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            Days since funds released:
                                        </span>
                                        <span className="text-foreground font-medium">
                                            {calculateDaysSinceFundRelease(vaultFundReleaseAt)}
                                        </span>
                                    </div>
                                )}
                                {maxLoan !== undefined && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Original loan:</span>
                                        <span className="text-foreground font-medium">
                                            {formatCurrency(maxLoan)}
                                        </span>
                                    </div>
                                )}
                                {monthlyInterestRate !== undefined && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            Monthly interest rate:
                                        </span>
                                        <span className="text-foreground font-medium">
                                            {formatPercentage(monthlyInterestRate)}
                                        </span>
                                    </div>
                                )}
                                {totalDebt !== undefined &&
                                    maxLoan !== undefined &&
                                    totalDebt > maxLoan && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">
                                                Interest accrued:
                                            </span>
                                            <span className="text-foreground font-medium">
                                                {formatCurrency(totalDebt - maxLoan)}
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>

                {!txHash && (
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={
                                totalDebt === undefined ||
                                totalDebt <= 0 ||
                                maxLoan === undefined ||
                                maxLoan <= 0 ||
                                isProcessing
                            }
                        >
                            {isProcessing ? processingStep : "Confirm Payment"}
                        </Button>
                    </DialogFooter>
                )}

                {txHash && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md mt-4">
                        <p className="text-sm text-green-600 font-medium mb-2">
                            ✓ Payment successful!
                        </p>
                        <a
                            href={`${EXPLORER_TX_URL}/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-700 underline break-all"
                        >
                            View transaction: {txHash}
                        </a>
                    </div>
                )}

                <ErrorPanel
                    error={error}
                    textSize="xs"
                    maxHeight="max-h-32"
                    collapsible
                    collapseThreshold={100}
                    className="mt-4"
                />
            </DialogContent>
        </Dialog>
    );
}
