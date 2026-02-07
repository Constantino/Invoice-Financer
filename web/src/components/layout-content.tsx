"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/navbar";
import { useUserStore } from "@/stores/userStore";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, login, logout } = useUserStore();
    const { ready, authenticated, user } = usePrivy();

    useEffect(() => {
        if (!ready) return;

        if (authenticated && !isLoggedIn && user) {
            login({
                id: user.id,
                email: user.email?.address,
            });
        } else if (!authenticated && isLoggedIn) {
            logout();
        }
    }, [ready, authenticated, isLoggedIn, user, login, logout]);

    if (!isLoggedIn) {
        return (
            <>
                <Navbar />
                <div className="pt-16">{children}</div>
            </>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Navbar />
                <div className="pt-16">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
