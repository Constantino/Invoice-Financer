"use client";

import { useEffect } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Receipt,
    Vault,
    Wallet,
    LayoutDashboard,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRoleStore, type UserRole } from "@/stores/roleStore";
import { useRequestedCountStore } from "@/stores/requestedCountStore";
import { NotificationBadge } from "@/components/notification-badge";
import { countRequestedLoanRequests } from "@/services/loanService";

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    roles: UserRole[];
}

export function AppSidebar() {
    const { currentRole } = useRoleStore();
    const { state } = useSidebar();
    const { requestedCount, setRequestedCount } = useRequestedCountStore();

    useEffect(() => {
        const fetchRequestedCount = async () => {
            try {
                const count = await countRequestedLoanRequests();
                setRequestedCount(count);
            } catch (error) {
                console.error("Error fetching requested loan count:", error);
            }
        }

        if (currentRole === "Admin") {
            fetchRequestedCount();
        }
    }, [currentRole, setRequestedCount]);

    const allMenuItems: MenuItem[] = [
        { title: "Admin panel", url: "/admin", icon: LayoutDashboard, roles: ["Admin"] },
        { title: "My loans", url: "/borrowers/loans", icon: CreditCard, roles: ["Admin", "Borrower"] },
        { title: "Request Loan", url: "/loan-request", icon: Receipt, roles: ["Admin", "Borrower"] },
        { title: "Vaults", url: "/vaults", icon: Vault, roles: ["Admin", "Lender"] },
        { title: "Portfolio", url: "/lenders/loans", icon: Wallet, roles: ["Admin", "Lender"] },
        { title: "Faucet", url: "/faucet", icon: Wallet, roles: ["Admin", "Lender", "Borrower"] },
    ];

    const menuItems = allMenuItems.filter((item) => item.roles.includes(currentRole));

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="pt-16 relative">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild className="relative">
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                            {item.title === "Admin panel" && requestedCount > 0 && (
                                                <NotificationBadge count={requestedCount} />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <div className="absolute top-1/2 -translate-y-1/2 -right-3 z-50">
                <SidebarTrigger className="h-6 w-6 flex items-center justify-center bg-background hover:bg-accent text-foreground rounded-full border border-border shadow-md">
                    {state === "expanded" ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </SidebarTrigger>
            </div>
        </Sidebar>
    );
}
