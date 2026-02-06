import { LoanRequestStatus } from "@/types/loans";

/**
 * Formats a number as currency in USD
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formats currency with precision for small amounts
 * Shows up to 6 decimal places for amounts under $1, otherwise 2 decimals
 * @param amount - The amount to format
 * @returns Formatted currency string with appropriate precision
 */
export function formatCurrencyPrecise(amount: number): string {
    const absAmount = Math.abs(amount);
    
    // For amounts under $1, show up to 6 decimals (removing trailing zeros)
    if (absAmount < 1 && absAmount > 0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        }).format(amount);
    }
    
    // For larger amounts or zero, use standard 2 decimals
    return formatCurrency(amount);
}

/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Formats a decimal rate as a percentage
 * @param rate - Decimal rate (e.g., 0.015 for 1.5%)
 * @returns Formatted percentage string (e.g., "1.50%")
 */
export function formatPercentage(rate: number): string {
    return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Gets the CSS classes for status badge based on status value
 * @param status - The status string
 * @returns CSS classes for the status badge
 */
export function getStatusBadgeClass(status: string): string {
    switch (status) {
    case LoanRequestStatus.LISTED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case LoanRequestStatus.ACTIVE:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case LoanRequestStatus.PAID:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    case LoanRequestStatus.REJECTED:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case LoanRequestStatus.CANCELED:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    case LoanRequestStatus.DEFAULTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case LoanRequestStatus.REQUESTED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
}

/**
 * Formats status string to Title Case
 * @param status - The status string (e.g., "listed", "pending_assignment")
 * @returns Formatted status string (e.g., "Listed", "Pending Assignment")
 */
export function formatStatus(status: string): string {
    // Convert snake_case or lowercase to Title Case
    return status
        .split(/[_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Truncates an Ethereum address to show first 6 and last 4 characters
 * @param address - The Ethereum address to truncate
 * @returns Truncated address string (e.g., "0x1234...5678")
 */
export function truncateAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Calculates and formats capacity percentage
 * @param current - Current capacity value
 * @param max - Maximum capacity value
 * @returns Formatted percentage string (e.g., "45.7%")
 */
export function formatCapacityPercentage(current: string | number, max: string | number): string {
    const currentNum = typeof current === 'string' ? parseFloat(current) : current;
    const maxNum = typeof max === 'string' ? parseFloat(max) : max;
    return ((currentNum / maxNum) * 100).toFixed(1) + '%';
}

