"use client";

import * as React from "react";
import { Toast } from "@/components/ui/toast";

interface ToastContextValue {
    showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = React.useState<{
        message: string;
        type: "success" | "error" | "info";
    } | null>(null);

    const showToast = React.useCallback(
        (message: string, type: "success" | "error" | "info" = "success") => {
            setToast({ message, type });
        },
        []
    );

    const hideToast = React.useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
