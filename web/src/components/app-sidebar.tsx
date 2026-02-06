"use client"

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
} from "@/components/ui/sidebar"
import { ChevronLeft, ChevronRight, CreditCard, Receipt, Wallet, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export function AppSidebar() {
    const { state } = useSidebar()

    // Basic menu items - you can expand this later with role-based filtering
    const menuItems = [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "My loans",
            url: "/borrowers/loans",
            icon: CreditCard,
        },
        {
            title: "Request Loan",
            url: "/loan-request",
            icon: Receipt,
        },
        {
            title: "Portfolio",
            url: "/lenders/loans",
            icon: Wallet,
        },
    ]

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
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Collapse trigger button */}
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
    )
}
