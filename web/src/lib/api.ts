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

