"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
    textToCopy: string;
    displayText?: string;
    iconSize?: number;
    textSize?: "xs" | "sm" | "base" | "lg";
    showText?: boolean;
    className?: string;
}

export function CopyButton({
    textToCopy,
    displayText,
    iconSize = 12,
    textSize = "sm",
    showText = true,
    className = "",
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        if (!textToCopy) return;
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const sizeClasses = {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={copyToClipboard}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy to clipboard"
            >
                {copied ? (
                    <Check style={{ width: iconSize, height: iconSize }} />
                ) : (
                    <Copy style={{ width: iconSize, height: iconSize }} />
                )}
            </button>
            {showText && displayText && (
                <span className={`font-mono text-muted-foreground ${sizeClasses[textSize]}`}>
                    {displayText}
                </span>
            )}
        </div>
    );
}
