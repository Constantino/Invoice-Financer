"use client";

import * as React from "react";
import { X } from "lucide-react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = {
        success: "bg-green-500/10 border-green-500/20 text-green-600",
        error: "bg-red-500/10 border-red-500/20 text-red-600",
        info: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    }[type];

    return (
        <div
            className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-md border shadow-lg animate-in slide-in-from-top-5 ${bgColor}`}
            style={{ minWidth: "300px", maxWidth: "500px" }}
        >
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Close notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
