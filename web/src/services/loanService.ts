import axios from "axios";
import { getApiUrl } from "@/lib/api";
import { LoanRequestStatus } from "@/types/loans";

/**
 * Counts how many loan requests are in REQUESTED status.
 * @returns Promise resolving to the count of loan requests with REQUESTED status
 */
export async function countRequestedLoanRequests(): Promise<number> {
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: unknown[]; count: number }>(
        `${apiUrl}/loan-requests?status=${LoanRequestStatus.REQUESTED}`
    );
    return response.data.count ?? 0;
}
