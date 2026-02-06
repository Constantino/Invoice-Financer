"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useUserStore } from "@/stores/userStore";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, login, logout } = useUserStore();
    const { ready, authenticated, user } = usePrivy();

    // Sync Privy authentication state with userStore
    useEffect(() => {
        if (!ready) return;

        if (authenticated && !isLoggedIn && user) {
            // User is authenticated in Privy but not in our store
            login({
                id: user.id,
                email: user.email?.address,
            });
        } else if (!authenticated && isLoggedIn) {
            // User is logged out in Privy but still logged in our store
            logout();
        }
    }, [ready, authenticated, isLoggedIn, user, login, logout]);

    // Show sidebar only when user is logged in
    if (!isLoggedIn) {
        return (
            <div className="pt-16">
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="pt-16">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
