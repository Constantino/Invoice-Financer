"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { useRoleStore, type UserRole } from "@/stores/roleStore";
import { usePrivy } from "@privy-io/react-auth";
import { useUSDCBalance } from "@/hooks/use-usdc-balance";
import { useETHBalance } from "@/hooks/use-eth-balance";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import { truncateAddress, formatCurrency } from "@/lib/format";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RouteConfig {
    path: string;
    roles: UserRole[];
}

const routes: RouteConfig[] = [
    { path: "/admin", roles: ["Admin"] },
    { path: "/borrowers/loans", roles: ["Admin", "Borrower"] },
    { path: "/loan-request", roles: ["Admin", "Borrower"] },
    { path: "/borrower-kyb", roles: ["Admin", "Borrower"] },
    { path: "/vaults", roles: ["Admin", "Lender"] },
    { path: "/lenders/loans", roles: ["Admin", "Lender"] },
    { path: "/faucet", roles: ["Admin", "Lender", "Borrower"] },
];

const roles: UserRole[] = ["Admin", "Lender", "Borrower"];

function getFirstRouteForRole(role: UserRole): string {
    const firstRoute = routes.find((r) => r.roles.includes(role));
    return firstRoute?.path ?? "/";
}

function isRouteAllowedForRole(path: string, role: UserRole): boolean {
    const route = routes.find((r) => path.startsWith(r.path));
    return route ? route.roles.includes(role) : true;
}

export default function Navbar() {
    const { isLoggedIn, user, logout } = useUserStore();
    const { currentRole, setRole } = useRoleStore();
    const { balance: usdcBalance, isLoading: isLoadingUsdc } = useUSDCBalance();
    const { balance: ethBalance, isLoading: isLoadingEth } = useETHBalance();
    const { walletAddress } = useWalletAddress();
    const { logout: privyLogout } = usePrivy();
    const router = useRouter();
    const pathname = usePathname();
    const dropdownTriggerRef = useRef<HTMLButtonElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole);
        if (!isRouteAllowedForRole(pathname, newRole)) {
            router.push(getFirstRouteForRole(newRole));
        }
    };

    const getUserName = () => {
        if (!user?.email) return "";
        return user.email.split("@")[0];
    };

    const blurTrigger = () => {
        const trigger =
            dropdownTriggerRef.current ??
            (document.querySelector(
                '[data-slot="dropdown-menu-trigger"]'
            ) as HTMLButtonElement);
        if (trigger) {
            trigger.blur();
            trigger.classList.remove("focus-visible");
            if (document.activeElement === trigger) {
                (document.body as HTMLElement).focus();
                document.body.blur();
            }
        }
    };

    const handleLogout = () => {
        logout();
        privyLogout();
        router.push("/");
    };

    useEffect(() => {
        const handleDocumentClick = () => {
            if (!isDropdownOpen) {
                const trigger = document.querySelector(
                    '[data-slot="dropdown-menu-trigger"]'
                ) as HTMLButtonElement;
                if (trigger && document.activeElement === trigger) {
                    blurTrigger();
                }
            }
        };

        if (!isDropdownOpen) {
            blurTrigger();
            document.addEventListener("mousedown", handleDocumentClick, true);
            document.addEventListener("click", handleDocumentClick, true);
            return () => {
                document.removeEventListener("mousedown", handleDocumentClick, true);
                document.removeEventListener("click", handleDocumentClick, true);
            };
        }
    }, [isDropdownOpen]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="text-xl font-bold text-foreground font-mono flex items-center gap-2"
                        >
                            Invoice Financer
                        </Link>
                        {isLoggedIn && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Role:
                                </span>
                                <select
                                    value={currentRole}
                                    onChange={(e) =>
                                        handleRoleChange(e.target.value as UserRole)
                                    }
                                    className="text-sm px-3 py-1.5 border border-border rounded-md bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                                >
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {isLoggedIn && user?.email && (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingEth ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">
                                            {ethBalance} ETH
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingUsdc ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">
                                            {formatCurrency(Number(usdcBalance))}{" "}
                                            USDC
                                        </span>
                                    )}
                                </div>
                                <div className="inline-block">
                                    <DropdownMenu
                                        onOpenChange={(open) => {
                                            setIsDropdownOpen(open);
                                            if (!open) blurTrigger();
                                        }}
                                        modal={false}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                ref={dropdownTriggerRef}
                                                variant="ghost"
                                                size="sm"
                                                className="text-sm text-foreground font-medium"
                                                style={
                                                    !isDropdownOpen
                                                        ? {
                                                              outline: "none",
                                                              boxShadow: "none",
                                                              borderColor:
                                                                  "transparent",
                                                          }
                                                        : undefined
                                                }
                                                onMouseDown={(e) => {
                                                    if (
                                                        !isDropdownOpen &&
                                                        document.activeElement ===
                                                            e.currentTarget
                                                    ) {
                                                        blurTrigger();
                                                    }
                                                }}
                                            >
                                                {getUserName()}
                                                <ChevronDown className="ml-2 size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="w-35"
                                            align="end"
                                            onInteractOutside={() =>
                                                setTimeout(blurTrigger, 0)
                                            }
                                            onEscapeKeyDown={blurTrigger}
                                        >
                                            <DropdownMenuLabel>
                                                My Account
                                            </DropdownMenuLabel>
                                            {walletAddress && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <div className="px-2 py-1.5">
                                                        <TooltipProvider>
                                                            <CopyButton
                                                                textToCopy={
                                                                    walletAddress
                                                                }
                                                                displayText={truncateAddress(
                                                                    walletAddress
                                                                )}
                                                                iconSize={12}
                                                                textSize="xs"
                                                                showText={true}
                                                            />
                                                        </TooltipProvider>
                                                    </div>
                                                </>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="mr-2 size-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
