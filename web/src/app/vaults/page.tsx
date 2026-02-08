"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ParticipateModal } from "@/components/participate-modal";
import { getApiErrorMessage } from "@/lib/api";
import { fetchVaults, participateInVault } from "@/services/vault";
import type { Vault } from "@/types/vault";

const EXPLORER_TX_URL = "https://sepolia.etherscan.io/tx";

export default function VaultsPage() {
    const router = useRouter();
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState("Processing...");
    const [txHash, setTxHash] = useState<string | null>(null);
    const { wallets } = useWallets();

    useEffect(() => {
        loadVaults();
    }, []);

    const loadVaults = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchVaults();
            setVaults(data);
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to fetch vaults"));
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const truncateAddress = (address: string) =>
        !address ? "" : `${address.slice(0, 6)}...${address.slice(-4)}`;

    const handleLend = (vault: Vault) => {
        setSelectedVault(vault);
        setIsModalOpen(true);
    };

    const handleView = (loanRequestId: number) => {
        router.push(`/borrowers/loans/${loanRequestId}`);
    };

    const handleConfirmParticipation = async (amount: number) => {
        if (!selectedVault) return;
        if (!wallets || wallets.length === 0) {
            throw new Error("No wallet connected. Please connect your wallet.");
        }

        setIsProcessing(true);
        setTxHash(null);

        try {
            const wallet = wallets[0];
            setProcessingStep("Checking allowance...");

            const hash = await participateInVault(selectedVault.vault_address, amount, wallet, (step) => {
                setProcessingStep(step);
            });

            setTxHash(hash);
            await loadVaults();
        } catch (err) {
            throw err;
        } finally {
            setIsProcessing(false);
            setProcessingStep("Processing...");
        }
    };

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case "RELEASED":
                return "bg-green-100 text-green-800";
            case "FUNDED":
                return "bg-blue-100 text-blue-800";
            case "FUNDING":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-2 text-foreground">Vaults</h1>
                    <p className="text-lg text-muted-foreground">View all deployed vaults</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </Card>
                        ))}
                    </div>
                )}

                {!isLoading && !error && vaults.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">No vaults found</p>
                        <p className="text-muted-foreground text-sm mt-2">
                            Create your first vault to get started
                        </p>
                    </div>
                )}

                {!isLoading && !error && vaults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vaults.map((vault) => (
                            <Card key={vault.vault_id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <span className="truncate">{vault.vault_name}</span>
                                    </CardTitle>
                                    <CardDescription className="font-mono text-xs">
                                        {truncateAddress(vault.vault_address)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Borrower</p>
                                        <p className="font-mono text-sm">
                                            {truncateAddress(vault.borrower_address)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Max Capacity</p>
                                            <p className="font-semibold text-sm">
                                                ${parseFloat(vault.max_capacity).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Current</p>
                                            <p className="font-semibold text-sm">
                                                ${parseFloat(vault.current_capacity).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                                        <p className="text-sm font-medium">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusBadgeClass(vault.status)}`}
                                            >
                                                {vault.status}
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Created</p>
                                        <p className="text-sm">{formatDate(vault.created_at)}</p>
                                    </div>

                                    {vault.funded_at && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Funded At</p>
                                            <p className="text-sm">{formatDate(vault.funded_at)}</p>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                            <span>Capacity Used</span>
                                            <span>
                                                {(
                                                    (parseFloat(vault.current_capacity) /
                                                        parseFloat(vault.max_capacity)) *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (parseFloat(vault.current_capacity) /
                                                            parseFloat(vault.max_capacity)) *
                                                            100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {vault.fund_release_tx_hash && (
                                        <div className="pt-2">
                                            <a
                                                href={`${EXPLORER_TX_URL}/${vault.fund_release_tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                            >
                                                <span>View Release Transaction</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    />
                                                </svg>
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleView(vault.loan_request_id)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={() => handleLend(vault)}
                                            disabled={
                                                vault.status === "FUNDED" || vault.status === "RELEASED"
                                            }
                                        >
                                            {vault.status === "FUNDED" || vault.status === "RELEASED"
                                                ? "Fully Funded"
                                                : "Lend"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ParticipateModal
                vault={selectedVault}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTxHash(null);
                }}
                onConfirm={handleConfirmParticipation}
                isProcessing={isProcessing}
                processingStep={processingStep}
                txHash={txHash}
            />
        </div>
    );
}
