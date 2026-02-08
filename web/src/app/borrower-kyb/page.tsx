"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { getApiUrl, getApiErrorMessage } from "@/lib/api";

export default function BorrowerKYBPage() {
    const router = useRouter();
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [formData, setFormData] = useState({
        legalBusinessName: "",
        countryOfIncorporation: "",
        businessRegistrationNumber: "",
        businessDescription: "",
        uboFullName: "",
        averageInvoiceAmount: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isCheckingKYB, setIsCheckingKYB] = useState(false);

    useEffect(() => {
        const checkExistingKYB = async () => {
            if (!walletAddress || !walletsReady || !privyReady) return;

            setIsCheckingKYB(true);
            try {
                const apiUrl = getApiUrl();
                const response = await axios.get(`${apiUrl}/borrowers/kybs/check/${walletAddress}`);

                if (response.data.hasKYB) {
                    router.push("/loan-request");
                }
            } catch {
                // Network or API error — stay on page so user can submit or retry
            } finally {
                setIsCheckingKYB(false);
            }
        };

        checkExistingKYB();
    }, [walletAddress, walletsReady, privyReady, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

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

        try {
            const apiUrl = getApiUrl();
            const submissionData = {
                legal_business_name: formData.legalBusinessName,
                country_of_incorporation: formData.countryOfIncorporation,
                business_registration_number: formData.businessRegistrationNumber,
                business_description: formData.businessDescription,
                UBO_full_name: formData.uboFullName,
                average_invoice_amount: parseFloat(formData.averageInvoiceAmount),
                wallet_address: walletAddress,
            };

            await axios.post(`${apiUrl}/borrowers/kybs`, submissionData);
            setSubmitSuccess(true);

            setTimeout(() => {
                router.push("/loan-request");
            }, 1500);
        } catch (error) {
            setSubmitError(getApiErrorMessage(error, "Failed to submit KYB information"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingKYB) {
        return (
            <div className="w-full p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Checking KYB status...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-foreground">Borrower KYB</h1>
                <p className="text-lg text-muted-foreground mb-8">Know Your Business verification page</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="legalBusinessName" className="text-sm font-medium text-foreground">
                            Legal Business Name
                        </label>
                        <Input
                            id="legalBusinessName"
                            name="legalBusinessName"
                            type="text"
                            value={formData.legalBusinessName}
                            onChange={handleChange}
                            placeholder="Enter legal business name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="countryOfIncorporation" className="text-sm font-medium text-foreground">
                            Country of Incorporation
                        </label>
                        <select
                            id="countryOfIncorporation"
                            name="countryOfIncorporation"
                            value={formData.countryOfIncorporation}
                            onChange={handleChange}
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        >
                            <option value="">Select a country</option>
                            <option value="USA">USA</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Brazil">Brazil</option>
                            <option value="Chile">Chile</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="businessRegistrationNumber" className="text-sm font-medium text-foreground">
                            Business Registration Number
                        </label>
                        <Input
                            id="businessRegistrationNumber"
                            name="businessRegistrationNumber"
                            type="text"
                            value={formData.businessRegistrationNumber}
                            onChange={handleChange}
                            placeholder="Enter business registration number"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="businessDescription" className="text-sm font-medium text-foreground">
                            Business Description
                        </label>
                        <textarea
                            id="businessDescription"
                            name="businessDescription"
                            value={formData.businessDescription}
                            onChange={handleChange}
                            placeholder="Describe your business"
                            rows={4}
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="uboFullName" className="text-sm font-medium text-foreground">
                            UBO Full Name
                        </label>
                        <Input
                            id="uboFullName"
                            name="uboFullName"
                            type="text"
                            value={formData.uboFullName}
                            onChange={handleChange}
                            placeholder="Enter Ultimate Beneficial Owner full name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="averageInvoiceAmount" className="text-sm font-medium text-foreground">
                            Average Invoice Amount
                        </label>
                        <Input
                            id="averageInvoiceAmount"
                            name="averageInvoiceAmount"
                            type="number"
                            value={formData.averageInvoiceAmount}
                            onChange={handleChange}
                            placeholder="Enter average invoice amount"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="pt-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Connected Wallet Address
                        </label>
                        {walletAddress ? (
                            <p className="text-sm text-muted-foreground font-mono break-all">{walletAddress}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                {walletsReady && privyReady
                                    ? "No wallet found. Please connect a wallet."
                                    : "Loading wallet information..."}
                            </p>
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
                                KYB information submitted successfully!
                            </p>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit KYB Information"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
