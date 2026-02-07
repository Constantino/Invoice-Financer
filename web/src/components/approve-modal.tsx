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
import { cn } from "@/lib/utils";

interface ApproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isChangingStatus?: boolean;
}

export function ApproveModal({
    isOpen,
    onClose,
    onConfirm,
    isChangingStatus = false,
}: ApproveModalProps) {
    const [confirmations, setConfirmations] = useState({
        invoiceAuthenticity: false,
        deliveryCompleted: false,
        invoiceValidated: false,
        borrowerKYB: false,
        debtorRisk: false,
    });

    const handleCheckboxChange = (name: keyof typeof confirmations) => {
        setConfirmations((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const allChecked = Object.values(confirmations).every(Boolean);

    const handleClose = () => {
        setConfirmations({
            invoiceAuthenticity: false,
            deliveryCompleted: false,
            invoiceValidated: false,
            borrowerKYB: false,
            debtorRisk: false,
        });
        onClose();
    };

    const checkboxClass = cn(
        "mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Approve Loan Request</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to approve this loan request? This will change the
                        status to LISTED and will deploy its own Vault.
                    </p>
                    <div className="space-y-3 border-t pt-4">
                        <p className="text-sm font-medium text-foreground">
                            Please confirm all checks are completed:
                        </p>
                        <div className="space-y-2.5">
                            {[
                                {
                                    id: "invoiceAuthenticity",
                                    label:
                                        "Invoice authenticity validated (Control Desk reviewed, no duplicates, correct amounts)",
                                },
                                {
                                    id: "deliveryCompleted",
                                    label:
                                        "Delivery completed and confirmed (evidence of delivery or service completion)",
                                },
                                {
                                    id: "invoiceValidated",
                                    label:
                                        "Invoice validated with the debtor (customer confirms invoice, no disputes)",
                                },
                                {
                                    id: "borrowerKYB",
                                    label:
                                        "Borrower KYB/AML checks passed (business verified, no sanctions/PLD red flags)",
                                },
                                {
                                    id: "debtorRisk",
                                    label:
                                        "Debtor risk acceptable (debtor is solvent, good payment history, no credit red flags)",
                                },
                            ].map(({ id, label }) => (
                                <div key={id} className="flex items-start gap-2">
                                    <input
                                        id={id}
                                        type="checkbox"
                                        checked={confirmations[id as keyof typeof confirmations]}
                                        onChange={() =>
                                            handleCheckboxChange(id as keyof typeof confirmations)
                                        }
                                        className={checkboxClass}
                                    />
                                    <label
                                        htmlFor={id}
                                        className="text-sm text-foreground cursor-pointer"
                                    >
                                        {label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isChangingStatus}>
                        Close
                    </Button>
                    <Button
                        variant="default"
                        onClick={onConfirm}
                        disabled={isChangingStatus || !allChecked}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        {isChangingStatus ? "Approving..." : "Approve"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
