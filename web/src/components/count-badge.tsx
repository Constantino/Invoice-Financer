interface CountBadgeProps {
    count: number;
    variant?: "blue" | "gray" | "green";
}

export function CountBadge({ count, variant = "gray" }: CountBadgeProps) {
    const variantStyles = {
        blue: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
        gray: "bg-gray-500/10 text-gray-600 border border-gray-500/20",
        green: "bg-green-500/10 text-green-600 border border-green-500/20",
    };

    return (
        <span
            className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-semibold ${variantStyles[variant]}`}
        >
            {count}
        </span>
    );
}
