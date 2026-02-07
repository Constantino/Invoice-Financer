"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { getApiUrl } from "@/lib/api";

export default function LoanRequestPage() {
    const router = useRouter();
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [isCheckingKYB, setIsCheckingKYB] = useState(false);
    const [kybCheckComplete, setKybCheckComplete] = useState(false);

    useEffect(() => {
        const checkKYB = async () => {
            if (!walletAddress || !walletsReady || !privyReady) return;

            setIsCheckingKYB(true);
            try {
                const apiUrl = getApiUrl();
                const response = await axios.get(`${apiUrl}/borrowers/kybs/check/${walletAddress}`);

                if (!response.data.hasKYB) {
                    router.push("/borrower-kyb");
                } else {
                    setKybCheckComplete(true);
                }
            } catch (error) {
                console.error("Error checking KYB:", error);
                setKybCheckComplete(false);
            } finally {
                setIsCheckingKYB(false);
            }
        };

        checkKYB();
    }, [walletAddress, walletsReady, privyReady, router]);

    const [formData, setFormData] = useState({
        term: "",
        invoiceNumber: "",
        invoiceAmount: "",
        invoiceDueDate: "",
        customerName: "",
        deliveryCompleted: false,
        file: null as File | null,
    });

    const [confirmations, setConfirmations] = useState({
        notPledged: false,
        authorizeAssignment: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (type === "checkbox") {
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setConfirmations((prev) => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type === "application/pdf") {
                setFormData((prev) => ({ ...prev, file }));
            } else {
                setSubmitError("Please upload a PDF file");
                e.target.value = "";
            }
        }
    };

    const formatCurrency = (value: string): string => {
        const numericValue = value.replace(/[^\d.]/g, "");
        if (!numericValue || numericValue === ".") return "";
        const parts = numericValue.split(".");
        let integerPart = parts[0] || "";
        const decimalPart = parts[1] || "";
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const formatted = decimalPart ? `${integerPart}.${decimalPart.slice(0, 2)}` : integerPart;
        return formatted ? `$${formatted}` : "";
    };

    const handleInvoiceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^\d.]/g, "");
        setFormData((prev) => ({ ...prev, invoiceAmount: value }));
    };

    const invoiceAmountNum = parseFloat(formData.invoiceAmount) || 0;
    const advanceRate = 0.8;
    const calculatedMaxLoan = Math.min(invoiceAmountNum * advanceRate);
    const maxLoan = formData.invoiceAmount
        ? `$${calculatedMaxLoan.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        if (!walletAddress) {
            setSubmitError("Please connect a wallet before submitting");
            setIsSubmitting(false);
            return;
        }

        if (!confirmations.notPledged || !confirmations.authorizeAssignment) {
            setSubmitError("Please confirm both statements before submitting");
            setIsSubmitting(false);
            return;
        }

        if (!formData.file) {
            setSubmitError("Please upload an invoice PDF file");
            setIsSubmitting(false);
            return;
        }

        try {
            const apiUrl = getApiUrl();
            const amount = parseFloat(formData.invoiceAmount) || 0;
            const maxLoanVal = Math.min(amount * advanceRate);
            const monthlyInterestRate = 0.015;

            const formDataToSend = new FormData();
            formDataToSend.append("invoice_number", formData.invoiceNumber);
            formDataToSend.append("invoice_amount", amount.toString());
            formDataToSend.append("invoice_due_date", formData.invoiceDueDate);
            formDataToSend.append("term", parseInt(formData.term, 10).toString());
            formDataToSend.append("customer_name", formData.customerName);
            formDataToSend.append("delivery_completed", formData.deliveryCompleted.toString());
            formDataToSend.append("advance_rate", advanceRate.toString());
            formDataToSend.append("monthly_interest_rate", monthlyInterestRate.toString());
            formDataToSend.append("max_loan", maxLoanVal.toString());
            formDataToSend.append("not_pledged", confirmations.notPledged.toString());
            formDataToSend.append("assignment_signed", confirmations.authorizeAssignment.toString());
            formDataToSend.append("borrower_address", walletAddress);
            formDataToSend.append("file", formData.file);

            await axios.post(`${apiUrl}/loan-requests`, formDataToSend);
            setSubmitSuccess(true);

            setFormData({
                term: "",
                invoiceNumber: "",
                invoiceAmount: "",
                invoiceDueDate: "",
                customerName: "",
                deliveryCompleted: false,
                file: null,
            });
            setConfirmations({ notPledged: false, authorizeAssignment: false });
        } catch (error) {
            console.error("Error submitting loan request:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403 && error.response?.data?.requiresKYB) {
                    setSubmitError(
                        error.response.data.message ||
                            "You must complete KYB verification before creating a loan request"
                    );
                    setTimeout(() => router.push("/borrower-kyb"), 2000);
                } else {
                    setSubmitError(
                        error.response?.data?.error ||
                            error.response?.data?.message ||
                            error.message ||
                            "Failed to submit loan request"
                    );
                }
            } else {
                setSubmitError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingKYB) {
        return (
            <div className="w-full p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Verifying KYB status...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-foreground">Loan Request</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Submit a new loan request for invoice factoring
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="invoiceNumber" className="text-sm font-medium text-foreground">
                            Invoice Number
                        </label>
                        <Input
                            id="invoiceNumber"
                            name="invoiceNumber"
                            type="text"
                            value={formData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="Enter invoice number"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="invoiceAmount" className="text-sm font-medium text-foreground">
                            Invoice Amount
                        </label>
                        <Input
                            id="invoiceAmount"
                            name="invoiceAmount"
                            type="text"
                            value={formatCurrency(formData.invoiceAmount)}
                            onChange={handleInvoiceAmountChange}
                            placeholder="$0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="invoiceDueDate" className="text-sm font-medium text-foreground">
                            Invoice Due Date
                        </label>
                        <DatePicker
                            id="invoiceDueDate"
                            selected={formData.invoiceDueDate ? new Date(formData.invoiceDueDate) : null}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    setFormData((prev) => ({
                                        ...prev,
                                        invoiceDueDate: date.toISOString().split("T")[0],
                                    }));
                                }
                            }}
                            minDate={new Date()}
                            dateFormat="MM/dd/yyyy"
                            placeholderText="Select due date"
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="term" className="text-sm font-medium text-foreground">
                            Term
                        </label>
                        <select
                            id="term"
                            name="term"
                            value={formData.term}
                            onChange={handleChange}
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        >
                            <option value="">Select term</option>
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="customerName" className="text-sm font-medium text-foreground">
                            Customer Name
                        </label>
                        <Input
                            id="customerName"
                            name="customerName"
                            type="text"
                            value={formData.customerName}
                            onChange={handleChange}
                            placeholder="Enter customer name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                id="deliveryCompleted"
                                name="deliveryCompleted"
                                type="checkbox"
                                checked={formData.deliveryCompleted}
                                onChange={handleChange}
                                className={cn(
                                    "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                )}
                            />
                            <label
                                htmlFor="deliveryCompleted"
                                className="text-sm font-medium text-foreground cursor-pointer"
                            >
                                Delivery completed? (Yes)
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Invoice PDF <span className="text-destructive">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="invoicePdf"
                                name="invoicePdf"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById("invoicePdf")?.click()}
                            >
                                Upload Invoice PDF
                            </Button>
                            {formData.file && (
                                <span className="text-sm text-foreground">{formData.file.name}</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Loan Details</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Invoice Amount</label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                {formData.invoiceAmount
                                    ? `$${parseFloat(formData.invoiceAmount).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      })}`
                                    : "$0.00"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Advance Rate</label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">80%</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Monthly Interest Rate
                            </label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                1.5%
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Max Loan</label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                {maxLoan}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Confirmations</h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <input
                                    id="notPledged"
                                    name="notPledged"
                                    type="checkbox"
                                    checked={confirmations.notPledged}
                                    onChange={handleConfirmationChange}
                                    className={cn(
                                        "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-0.5"
                                    )}
                                    required
                                />
                                <label htmlFor="notPledged" className="text-sm text-foreground cursor-pointer">
                                    I confirm this invoice has not been disputed, pledged, factored, or used as
                                    collateral elsewhere.
                                </label>
                            </div>
                            <div className="flex items-start gap-2">
                                <input
                                    id="authorizeAssignment"
                                    name="authorizeAssignment"
                                    type="checkbox"
                                    checked={confirmations.authorizeAssignment}
                                    onChange={handleConfirmationChange}
                                    className={cn(
                                        "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-0.5"
                                    )}
                                    required
                                />
                                <label
                                    htmlFor="authorizeAssignment"
                                    className="text-sm text-foreground cursor-pointer"
                                >
                                    I authorize the assignment of this receivable for financing purposes.
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-2">
                        <label className="text-sm font-medium text-foreground">Borrower Address</label>
                        {walletAddress ? (
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground font-mono break-all">
                                {walletAddress}
                            </div>
                        ) : (
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground italic">
                                {walletsReady && privyReady
                                    ? "No wallet found. Please connect a wallet."
                                    : "Loading wallet information..."}
                            </div>
                        )}
                    </div>

                    {submitError && (
                        <div className="pt-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">{submitError}</p>
                        </div>
                    )}

                    {submitSuccess && (
                        <div className="pt-2 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Loan request submitted successfully!
                            </p>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                isSubmitting ||
                                !walletAddress ||
                                !confirmations.notPledged ||
                                !confirmations.authorizeAssignment ||
                                !formData.deliveryCompleted ||
                                !formData.file
                            }
                        >
                            {isSubmitting ? "Submitting..." : "Submit Loan Request"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
