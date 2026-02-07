interface NotificationBadgeProps {
    count: number;
    className?: string;
}

export function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
    return (
        <span
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold ${className}`}
        >
            {count}
        </span>
    );
}
