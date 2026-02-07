"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import type { LoanRequestDetail } from "@/types/loans";
import { LoanRequestStatus } from "@/types/loans/loanRequestStatus";
import { getLoanRequestDetail, changeLoanRequestStatus } from "@/services/loanService";
import { useRoleStore } from "@/stores/roleStore";
import { ApproveModal } from "@/components/approve-modal";
import { getApiUrl } from "@/lib/api";
import { CountBadge } from "@/components/count-badge";

const EXPLORER_URL = "https://sepolia.etherscan.io";

interface NFTMetadata {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
}

export default function LoanRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const loanId = params.id as string;
    const { currentRole } = useRoleStore();

    const [loanDetail, setLoanDetail] = useState<LoanRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

    useEffect(() => {
        if (loanId) fetchLoanDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when loanId changes
    }, [loanId]);

    useEffect(() => {
        if (!loanDetail?.token_uri) return;
        let cancelled = false;
        setIsLoadingMetadata(true);
        axios
            .get(loanDetail.token_uri)
            .then((res) => {
                if (!cancelled) setNftMetadata(res.data);
            })
            .catch(() => {
                if (!cancelled) setNftMetadata(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingMetadata(false);
            });
        return () => {
            cancelled = true;
        };
    }, [loanDetail?.token_uri]);

    const fetchLoanDetail = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getLoanRequestDetail(parseInt(loanId, 10));
            setLoanDetail(data);
        } catch (err) {
            console.error("Error fetching loan details:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to fetch loan details"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const shortenAddress = (address: string) =>
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            LISTED: "bg-blue-100 text-blue-800",
            ACTIVE: "bg-green-100 text-green-800",
            PAID: "bg-gray-100 text-gray-800",
            CANCELED: "bg-red-100 text-red-800",
            DEFAULTED: "bg-red-100 text-red-800",
        };
        return colors[status] ?? "bg-gray-100 text-gray-800";
    };

    const handleApprove = () => {
        if (loanDetail) setIsApproveModalOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!loanDetail) return;
        try {
            setIsChangingStatus(true);
            setError(null);
            const apiUrl = getApiUrl();
            try {
                await axios.post(`${apiUrl}/nft/tokenize/${loanDetail.id}`);
            } catch (tokenizeError) {
                if (axios.isAxiosError(tokenizeError)) {
                    throw new Error(
                        tokenizeError.response?.data?.error ||
                            tokenizeError.response?.data?.message ||
                            "Failed to tokenize invoice. Cannot proceed with approval."
                    );
                }
                throw new Error("Failed to tokenize invoice. Cannot proceed with approval.");
            }
            await axios.post(`${apiUrl}/loan-requests/${loanDetail.id}/approve`);
            setIsApproveModalOpen(false);
            await fetchLoanDetail();
        } catch (err) {
            console.error("Error approving loan:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to approve loan request"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsChangingStatus(false);
        }
    };

    const handleReject = async () => {
        if (!loanDetail) return;
        try {
            setIsChangingStatus(true);
            await changeLoanRequestStatus(loanDetail.id, LoanRequestStatus.REJECTED);
            await fetchLoanDetail();
        } catch (err) {
            console.error("Error rejecting loan:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to reject loan"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsChangingStatus(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">Loading loan details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-6">
                <div className="max-w-5xl mx-auto">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div className="text-center py-12">
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                        <Button size="sm" onClick={fetchLoanDetail}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!loanDetail) return null;

    const linkClass =
        "text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1";

    return (
        <div className="w-full p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold absolute left-1/2 transform -translate-x-1/2">
                        Loan Request Details
                    </h1>
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loanDetail.status)}`}
                    >
                        {loanDetail.status}
                    </div>
                </div>

                <div className="bg-card rounded-lg border p-6 space-y-6">
                    {currentRole === "Admin" &&
                        loanDetail.status === LoanRequestStatus.REQUESTED && (
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="default"
                                    onClick={handleApprove}
                                    disabled={isChangingStatus}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    APPROVE
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={isChangingStatus}
                                >
                                    REJECT
                                </Button>
                            </div>
                        )}

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold">Loan Overview</h2>
                            {loanDetail.invoice_file_url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        window.open(loanDetail.invoice_file_url!, "_blank")
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    View Invoice PDF
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-x-8 gap-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                                <p className="text-sm font-medium">{loanDetail.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Customer Name</p>
                                <p className="text-sm font-medium">{loanDetail.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Invoice Amount</p>
                                <p className="text-sm font-medium">
                                    {formatCurrency(loanDetail.invoice_amount)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Max Loan</p>
                                <p className="text-sm font-medium">
                                    {formatCurrency(loanDetail.max_loan)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Invoice Due Date</p>
                                <p className="text-sm font-medium">
                                    {formatDate(loanDetail.invoice_due_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Term (Days)</p>
                                <p className="text-sm font-medium">{loanDetail.term}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                    Monthly Interest Rate
                                </p>
                                <p className="text-sm font-medium">
                                    {(loanDetail.monthly_interest_rate * 100).toFixed(2)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Advance Rate</p>
                                <p className="text-sm font-medium">
                                    {(loanDetail.advance_rate * 100).toFixed(2)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Created At</p>
                                <p className="text-sm font-medium">
                                    {formatDate(loanDetail.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-base font-semibold mb-3 text-center">
                            Financial Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Total Funded</p>
                                <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(loanDetail.total_funded)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Total Repaid</p>
                                <p className="text-lg font-bold text-blue-600">
                                    {formatCurrency(loanDetail.total_repaid)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Outstanding Balance
                                </p>
                                <p className="text-lg font-bold text-orange-600">
                                    {formatCurrency(loanDetail.outstanding_balance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-t border-border" />

                    {loanDetail.vaults && loanDetail.vaults.length > 0 && (
                        <>
                            {loanDetail.vaults.map((vault) => (
                                <div key={vault.vault_id}>
                                    <div className="flex gap-6 items-center mb-6">
                                        <div className="flex-[7]">
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50">
                                                            <th
                                                                colSpan={2}
                                                                className="py-2 px-4 text-center font-semibold text-foreground text-sm"
                                                            >
                                                                Vault
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b hover:bg-muted/30">
                                                            <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                Vault Address
                                                            </td>
                                                            <td className="py-2 px-4 text-left">
                                                                <a
                                                                    href={`${EXPLORER_URL}/address/${vault.vault_address}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={linkClass}
                                                                >
                                                                    {vault.vault_address}
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            </td>
                                                        </tr>
                                                        <tr className="border-b hover:bg-muted/30">
                                                            <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                Vault Name
                                                            </td>
                                                            <td className="py-2 px-4 text-left font-medium">
                                                                {vault.vault_name}
                                                            </td>
                                                        </tr>
                                                        <tr className="border-b hover:bg-muted/30">
                                                            <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                Status
                                                            </td>
                                                            <td className="py-2 px-4 text-left font-medium">
                                                                {vault.status}
                                                            </td>
                                                        </tr>
                                                        <tr className="border-b hover:bg-muted/30">
                                                            <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                Max Capacity
                                                            </td>
                                                            <td className="py-2 px-4 text-left font-medium">
                                                                {formatCurrency(vault.max_capacity)}
                                                            </td>
                                                        </tr>
                                                        <tr className="border-b hover:bg-muted/30">
                                                            <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                Current Capacity
                                                            </td>
                                                            <td className="py-2 px-4 text-left font-medium">
                                                                {formatCurrency(vault.current_capacity)}
                                                            </td>
                                                        </tr>
                                                        {vault.funded_at && (
                                                            <tr className="border-b hover:bg-muted/30">
                                                                <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                    Funded At
                                                                </td>
                                                                <td className="py-2 px-4 text-left font-medium">
                                                                    {formatDate(vault.funded_at)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {vault.fund_release_tx_hash && (
                                                            <tr className="hover:bg-muted/30">
                                                                <td className="py-2 px-4 text-left font-medium text-muted-foreground bg-muted/50 w-48">
                                                                    Fund Release Transaction
                                                                </td>
                                                                <td className="py-2 px-4 text-left">
                                                                    <a
                                                                        href={`${EXPLORER_URL}/tx/${vault.fund_release_tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={linkClass}
                                                                    >
                                                                        {vault.fund_release_tx_hash}
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {loanDetail.token_uri && (
                                            <div className="flex-[3]">
                                                {isLoadingMetadata ? (
                                                    <div className="text-xs text-muted-foreground text-center">
                                                        Loading NFT metadata...
                                                    </div>
                                                ) : nftMetadata?.image ? (
                                                    <div className="flex flex-col gap-2">
                                                        {nftMetadata.name && (
                                                            <p className="text-xs font-medium text-foreground text-center">
                                                                {nftMetadata.name}
                                                            </p>
                                                        )}
                                                        {nftMetadata.description && (
                                                            <p className="text-xs text-muted-foreground text-center">
                                                                {nftMetadata.description}
                                                            </p>
                                                        )}
                                                        <img
                                                            src={nftMetadata.image}
                                                            alt={nftMetadata.name ?? "NFT Image"}
                                                            className="w-[50%] h-auto mx-auto rounded-lg"
                                                        />
                                                        <div className="flex flex-col mt-1 leading-tight">
                                                            {loanDetail.token_address && (
                                                                <div className="text-center">
                                                                    <a
                                                                        href={`${EXPLORER_URL}/address/${loanDetail.token_address}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[10px] leading-none text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
                                                                    >
                                                                        Token Address
                                                                        <ExternalLink className="h-2 w-2" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {loanDetail.token_uri && (
                                                                <div className="text-center">
                                                                    <a
                                                                        href={loanDetail.token_uri}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[10px] leading-none text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
                                                                    >
                                                                        Token URI
                                                                        <ExternalLink className="h-2 w-2" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-muted-foreground text-center">
                                                        No image available
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {vault.lenders && vault.lenders.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
                                                <CountBadge count={vault.lenders.length} variant="blue" />
                                                <span>Lenders</span>
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Lender Address
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Amount
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Transaction
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Date
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vault.lenders.map((lender) => (
                                                            <tr
                                                                key={lender.lender_id}
                                                                className="border-b last:border-0 hover:bg-muted/30"
                                                            >
                                                                <td className="py-2 px-3 text-center">
                                                                    <a
                                                                        href={`${EXPLORER_URL}/address/${lender.lender_address}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={linkClass}
                                                                    >
                                                                        {shortenAddress(
                                                                            lender.lender_address
                                                                        )}
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-medium">
                                                                    {formatCurrency(lender.amount)}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <a
                                                                        href={`${EXPLORER_URL}/tx/${lender.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={linkClass}
                                                                    >
                                                                        {shortenAddress(
                                                                            lender.tx_hash
                                                                        )}
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                </td>
                                                                <td className="py-2 px-3 text-center text-muted-foreground">
                                                                    {formatDate(lender.created_at)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {vault.repayments && vault.repayments.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
                                                <CountBadge
                                                    count={vault.repayments.length}
                                                    variant="gray"
                                                />
                                                <span>Repayment History</span>
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                ID
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Amount
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Transaction
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Date
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vault.repayments.map((repayment) => (
                                                            <tr
                                                                key={repayment.repayment_id}
                                                                className="border-b last:border-0 hover:bg-muted/30"
                                                            >
                                                                <td className="py-2 px-3 text-center font-mono">
                                                                    #{repayment.repayment_id}
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-medium">
                                                                    {formatCurrency(
                                                                        repayment.amount
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <a
                                                                        href={`${EXPLORER_URL}/tx/${repayment.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={linkClass}
                                                                    >
                                                                        {shortenAddress(
                                                                            repayment.tx_hash
                                                                        )}
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                </td>
                                                                <td className="py-2 px-3 text-center text-muted-foreground">
                                                                    {formatDate(
                                                                        repayment.created_at
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {vault.lenders?.filter((l) => l.status === "REDEEMED")
                                        .length ? (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
                                                <CountBadge
                                                    count={vault.lenders.filter((l) => l.status === "REDEEMED").length}
                                                    variant="green"
                                                />
                                                <span>Redemption History</span>
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Lender Address
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Invested Amount
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Redeemed Amount
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Gain
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Transaction
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium">
                                                                Date
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vault.lenders
                                                            .filter((l) => l.status === "REDEEMED")
                                                            .map((lender) => {
                                                                const investedAmount =
                                                                    parseFloat(lender.amount);
                                                                const redeemedAmount = parseFloat(
                                                                    lender.redeemed_amount ?? "0"
                                                                );
                                                                const gain =
                                                                    redeemedAmount - investedAmount;
                                                                return (
                                                                    <tr
                                                                        key={lender.lender_id}
                                                                        className="border-b last:border-0 hover:bg-muted/30"
                                                                    >
                                                                        <td className="py-2 px-3 text-center">
                                                                            <a
                                                                                href={`${EXPLORER_URL}/address/${lender.lender_address}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={linkClass}
                                                                            >
                                                                                {shortenAddress(
                                                                                    lender.lender_address
                                                                                )}
                                                                                <ExternalLink className="h-2.5 w-2.5" />
                                                                            </a>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center font-medium">
                                                                            {formatCurrency(
                                                                                investedAmount
                                                                            )}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center font-medium">
                                                                            {formatCurrency(
                                                                                redeemedAmount
                                                                            )}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center font-medium">
                                                                            <span
                                                                                className={
                                                                                    gain >= 0
                                                                                        ? "text-green-600"
                                                                                        : "text-red-600"
                                                                                }
                                                                            >
                                                                                {formatCurrency(
                                                                                    gain
                                                                                )}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center">
                                                                            {lender.redemption_tx_hash && (
                                                                                <a
                                                                                    href={`${EXPLORER_URL}/tx/${lender.redemption_tx_hash}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className={linkClass}
                                                                                >
                                                                                    {shortenAddress(
                                                                                        lender.redemption_tx_hash
                                                                                    )}
                                                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                                                </a>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center text-muted-foreground">
                                                                            {lender.redeemed_at
                                                                                ? formatDate(
                                                                                      lender.redeemed_at
                                                                                  )
                                                                                : "-"}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <ApproveModal
                    isOpen={isApproveModalOpen}
                    onClose={() => setIsApproveModalOpen(false)}
                    onConfirm={handleApproveConfirm}
                    isChangingStatus={isChangingStatus}
                />
            </div>
        </div>
    );
}
