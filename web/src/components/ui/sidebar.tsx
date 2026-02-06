"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SIDEBAR_WIDTH = "10.24rem"
const SIDEBAR_WIDTH_ICON = "3.5rem"

type SidebarContext = {
    state: "expanded" | "collapsed"
    open: boolean
    setOpen: (open: boolean) => void
    openMobile: boolean
    setOpenMobile: (open: boolean) => void
    isMobile: boolean
    toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
    const context = React.useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.")
    }

    return context
}

const SidebarProvider = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
        defaultOpen?: boolean
        open?: boolean
        onOpenChange?: (open: boolean) => void
    }
>(
    (
        {
            defaultOpen = true,
            open: openProp,
            onOpenChange: setOpenProp,
            className,
            style,
            children,
            ...props
        },
        ref
    ) => {
        const [_open, _setOpen] = React.useState(defaultOpen)
        const open = openProp ?? _open
        const setOpen = React.useCallback(
            (value: boolean | ((value: boolean) => boolean)) => {
                const openState = typeof value === "function" ? value(open) : value
                if (setOpenProp) {
                    setOpenProp(openState)
                } else {
                    _setOpen(openState)
                }
            },
            [setOpenProp, open]
        )

        const [openMobile, setOpenMobile] = React.useState(false)

        const isMobile = false // You can implement mobile detection here if needed

        const toggleSidebar = React.useCallback(() => {
            return isMobile
                ? setOpenMobile((open) => !open)
                : setOpen((open) => !open)
        }, [isMobile, setOpen, setOpenMobile])

        const state = open ? "expanded" : "collapsed"

        const contextValue = React.useMemo<SidebarContext>(
            () => ({
                state,
                open,
                setOpen,
                isMobile,
                openMobile,
                setOpenMobile,
                toggleSidebar,
            }),
            [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
        )

        return (
            <SidebarContext.Provider value={contextValue}>
                <TooltipProvider delayDuration={0}>
                    <div
                        style={
                            {
                                "--sidebar-width": SIDEBAR_WIDTH,
                                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                                ...style,
                            } as React.CSSProperties
                        }
                        className={cn(
                            "group/sidebar-wrapper flex min-h-svh w-full",
                            className
                        )}
                        ref={ref}
                        {...props}
                    >
                        {children}
                    </div>
                </TooltipProvider>
            </SidebarContext.Provider>
        )
    }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
        side?: "left" | "right"
        variant?: "sidebar" | "floating" | "inset"
        collapsible?: "offcanvas" | "icon" | "none"
    }
>(
    (
        {
            side = "left",
            collapsible = "offcanvas",
            className,
            children,
            ...props
        },
        ref
    ) => {
        const { state, openMobile, setOpenMobile } = useSidebar()

        if (collapsible === "none") {
            return (
                <div
                    className={cn(
                        "flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </div>
            )
        }

        return (
            <>
                <div
                    className={cn(
                        "group peer hidden md:block overflow-visible",
                        state === "collapsed" ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]",
                        "transition-all duration-300 ease-in-out",
                        className
                    )}
                >
                    <div
                        ref={ref}
                        className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground overflow-visible"
                        {...props}
                    >
                        {children}
                    </div>
                </div>
                {openMobile && (
                    <div
                        className="fixed inset-0 z-50 bg-black/50 md:hidden"
                        onClick={() => setOpenMobile(false)}
                    />
                )}
                <div
                    className={cn(
                        "fixed inset-y-0 z-50 w-[--sidebar-width-mobile] bg-sidebar text-sidebar-foreground transition-transform duration-300 md:hidden",
                        side === "left" ? "left-0" : "right-0",
                        openMobile
                            ? "translate-x-0"
                            : side === "left"
                                ? "-translate-x-full"
                                : "translate-x-full"
                    )}
                >
                    <div className="flex h-full w-full flex-col">{children}</div>
                </div>
            </>
        )
    }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<"button">
>(({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
        <button
            ref={ref}
            onClick={(event) => {
                onClick?.(event)
                toggleSidebar()
            }}
            className={cn("inline-flex items-center justify-center", className)}
            {...props}
        />
    )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("flex flex-col gap-2 p-2", className)}
            {...props}
        />
    )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("flex flex-col gap-2 p-2", className)}
            {...props}
        />
    )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("flex flex-1 flex-col gap-2 overflow-auto p-2", className)}
            {...props}
        />
    )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("relative flex w-full flex-col gap-1", className)}
            {...props}
        />
    )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex h-8 items-center px-2 text-xs font-medium text-sidebar-foreground/70",
                className
            )}
            {...props}
        />
    )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("w-full", className)} {...props} />
})
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
    HTMLUListElement,
    React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
    return (
        <ul
            ref={ref}
            className={cn("flex w-full flex-col gap-1", className)}
            {...props}
        />
    )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentProps<"li">
>(({ className, ...props }, ref) => {
    return <li ref={ref} className={cn("list-none", className)} {...props} />
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                outline:
                    "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
            },
            size: {
                default: "h-8 text-sm",
                sm: "h-7 text-xs",
                lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const SidebarMenuButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<"button"> & {
        asChild?: boolean
        isActive?: boolean
        tooltip?: string | React.ComponentProps<typeof TooltipContent>
    } & VariantProps<typeof sidebarMenuButtonVariants>
>(
    (
        {
            asChild = false,
            isActive = false,
            variant = "default",
            size = "default",
            tooltip,
            className,
            ...props
        },
        ref
    ) => {
        const Comp = asChild ? Slot : "button"
        const { state } = useSidebar()

        const button = (
            <Comp
                ref={ref}
                data-sidebar="menu-button"
                data-size={size}
                data-active={isActive}
                className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
                {...props}
            />
        )

        if (!tooltip) {
            return button
        }

        if (typeof tooltip === "string") {
            tooltip = {
                children: tooltip,
            }
        }

        return (
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent
                    side="right"
                    align="center"
                    hidden={state !== "collapsed"}
                    {...tooltip}
                />
            </Tooltip>
        )
    }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarInset = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    return (
        <main
            ref={ref}
            className={cn(
                "relative flex min-h-svh flex-1 flex-col bg-background",
                "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
                className
            )}
            {...props}
        />
    )
})
SidebarInset.displayName = "SidebarInset"

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
}
