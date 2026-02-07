"use client";

import { useState } from "react";

interface ErrorPanelProps {
    error: string | null;
    textSize?: "xs" | "sm" | "base";
    maxHeight?: string;
    collapsible?: boolean;
    collapseThreshold?: number;
    className?: string;
}

export function ErrorPanel({
    error,
    textSize = "xs",
    maxHeight = "max-h-32",
    collapsible = true,
    collapseThreshold = 100,
    className = "",
}: ErrorPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!error) return null;

    const sizeClasses = {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
    };

    const shouldShowToggle = collapsible && error.length > collapseThreshold;

    return (
        <div
            className={`p-3 bg-destructive/10 border border-destructive/20 rounded-md ${collapsible ? "cursor-pointer" : ""} ${className}`}
            onClick={() => collapsible && setIsExpanded(!isExpanded)}
        >
            <div className={isExpanded ? `${maxHeight} overflow-y-auto` : ""}>
                <p
                    className={`text-destructive break-all ${sizeClasses[textSize]} ${isExpanded ? "" : "line-clamp-2"}`}
                >
                    {error}
                </p>
            </div>
            {shouldShowToggle && (
                <button
                    type="button"
                    className="text-xs text-destructive/70 hover:text-destructive mt-1 underline"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
}
