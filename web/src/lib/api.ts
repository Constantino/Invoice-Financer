import axios from "axios";

const NETWORK_ERROR_MESSAGE =
    "Cannot reach the server. Make sure the API is running (e.g. npm run dev in the api folder) and NEXT_PUBLIC_API_URL is correct.";

/**
 * Gets the configured API URL with proper formatting
 * @returns The formatted API URL
 * @throws Error if NEXT_PUBLIC_API_URL is not configured
 */
export function getApiUrl(): string {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    // Ensure the URL has a protocol
    if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
        apiUrl = `http://${apiUrl}`;
    }

    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, "");

    return apiUrl;
}

/** True when the error is a network failure (API unreachable, CORS, etc.). */
export function isNetworkError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
        return error.code === "ERR_NETWORK" || error.message === "Network Error";
    }
    return false;
}

/**
 * Returns a user-friendly error message. Use for API errors in the UI.
 * Network errors get a single friendly message so users know to check the API.
 */
export function getApiErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            fallback
        );
    }
    return error instanceof Error ? error.message : fallback;
}

