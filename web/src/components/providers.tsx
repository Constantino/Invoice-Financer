"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ToastProvider } from "@/hooks/use-toast";

const SEPOLIA_CHAIN_ID = 11155111;

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            config={{
                defaultChain: {
                    id: SEPOLIA_CHAIN_ID,
                    name: "Ethereum Sepolia",
                    network: "sepolia",
                    nativeCurrency: {
                        name: "ETH",
                        symbol: "ETH",
                        decimals: 18,
                    },
                    rpcUrls: {
                        default: {
                            http: ["https://rpc.sepolia.org"],
                        },
                        public: {
                            http: ["https://rpc.sepolia.org"],
                        },
                    },
                    blockExplorers: {
                        default: {
                            name: "Etherscan",
                            url: "https://sepolia.etherscan.io",
                        },
                    },
                    testnet: true,
                },
                supportedChains: [
                    {
                        id: SEPOLIA_CHAIN_ID,
                        name: "Ethereum Sepolia",
                        network: "sepolia",
                        nativeCurrency: {
                            name: "ETH",
                            symbol: "ETH",
                            decimals: 18,
                        },
                        rpcUrls: {
                            default: {
                                http: ["https://rpc.sepolia.org"],
                            },
                            public: {
                                http: ["https://rpc.sepolia.org"],
                            },
                        },
                        blockExplorers: {
                            default: {
                                name: "Etherscan",
                                url: "https://sepolia.etherscan.io",
                            },
                        },
                        testnet: true,
                    },
                ],
            }}
        >
            <ToastProvider>{children}</ToastProvider>
        </PrivyProvider>
    );
}
