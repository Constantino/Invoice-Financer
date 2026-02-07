import axios from "axios";
import { ethers } from "ethers";
import { getApiUrl } from "@/lib/api";
import type {
    LoanRequest,
    LoanRequestWithVault,
    LoanRequestDetail,
    LoanStats,
} from "@/types/loans";
import { LoanRequestStatus } from "@/types/loans/loanRequestStatus";
import { VAULT_ABI } from "@/app/abi/Vault";
import { ERC20_ABI } from "@/app/abi/ERC20";
import { TREASURY_ABI } from "@/app/abi/Treasury";
import type { PrivyWallet } from "@/types/providers";
import type { NetworkSwitchError } from "@/types/errors";

const SEPOLIA_CHAIN_ID = process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID || "11155111";
const EXPLORER_TX_URL = "https://sepolia.etherscan.io/tx";

export async function countRequestedLoanRequests(): Promise<number> {
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: unknown[]; count: number }>(
        `${apiUrl}/loan-requests?status=${LoanRequestStatus.REQUESTED}`
    );
    return response.data.count ?? 0;
}

/**
 * Fetches all loan requests filtered by status
 */
export async function getAllLoanRequestsByStatus(
    status: LoanRequestStatus | string
): Promise<LoanRequest[]> {
    if (!status) throw new Error("Status is required");
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LoanRequest[]; count: number }>(
        `${apiUrl}/loan-requests?status=${status}`
    );
    return response.data.data ?? [];
}

export async function getLoanRequestsByBorrowerWithVaults(
    borrowerAddress: string
): Promise<LoanRequestWithVault[]> {
    if (!borrowerAddress) throw new Error("Borrower address is required");
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LoanRequestWithVault[] }>(
        `${apiUrl}/loan-requests/borrower/${borrowerAddress}?include=vaults`
    );
    return response.data.data ?? [];
}

export async function getLoanRequestDetail(loanRequestId: number): Promise<LoanRequestDetail> {
    if (!loanRequestId || loanRequestId <= 0) throw new Error("Valid loan request ID is required");
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LoanRequestDetail }>(
        `${apiUrl}/loan-requests/${loanRequestId}/details`
    );
    return response.data.data;
}

export async function changeLoanRequestStatus(
    loanRequestId: number,
    status: LoanRequestStatus | string
): Promise<void> {
    if (!loanRequestId || loanRequestId <= 0) throw new Error("Valid loan request ID is required");
    if (!status) throw new Error("Status is required");
    const apiUrl = getApiUrl();
    await axios.patch(`${apiUrl}/loan-requests/${loanRequestId}/status`, { status });
}

export async function getBorrowerStats(borrowerAddress: string): Promise<LoanStats> {
    if (!borrowerAddress) throw new Error("Borrower address is required");
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LoanStats }>(
        `${apiUrl}/loan-requests/borrower/${borrowerAddress}/stats`
    );
    return response.data.data;
}

export function calculateDaysBetweenDates(
    startDate: string | Date,
    endDate: string | Date
): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return numberOfDays <= 0 || isNaN(numberOfDays) ? 0 : numberOfDays;
}

export function calculateDaysSinceFundRelease(fundReleaseAt: string | null): number {
    if (!fundReleaseAt) return 0;
    return calculateDaysBetweenDates(fundReleaseAt, new Date());
}

export function calculateInterest(request: LoanRequestWithVault): number {
    if (!request.vault_fund_release_at || !request.invoice_due_date) return 0;
    const numberOfDays = calculateDaysBetweenDates(
        request.vault_fund_release_at,
        request.invoice_due_date
    );
    if (numberOfDays === 0) return 0;
    const dailyInterestRate = request.monthly_interest_rate / 30;
    const interest = numberOfDays * dailyInterestRate * request.max_loan;
    if (isNaN(interest) || !isFinite(interest)) return 0;
    return Math.round(interest * 1e6) / 1e6;
}

function calculateTotalFromActiveLoans(
    loanRequests: LoanRequestWithVault[],
    mapper: (loan: LoanRequestWithVault) => number
): number {
    const activeLoans = loanRequests.filter((loan) => loan.status === "ACTIVE");
    const total = activeLoans.reduce((sum, loan) => sum + mapper(loan), 0);
    return Math.round(total * 1e6) / 1e6;
}

export function calculateTotalDebt(loanRequests: LoanRequestWithVault[]): number {
    return calculateTotalFromActiveLoans(loanRequests, getTotalDebt);
}

export function calculateTotalInterest(loanRequests: LoanRequestWithVault[]): number {
    return calculateTotalFromActiveLoans(loanRequests, calculateInterest);
}

export function calculateTotalCapital(loanRequests: LoanRequestWithVault[]): number {
    return calculateTotalFromActiveLoans(loanRequests, (loan) => {
        const maxLoan =
            typeof loan.max_loan === "number"
                ? loan.max_loan
                : parseFloat(String(loan.max_loan));
        return !isNaN(maxLoan) && isFinite(maxLoan) ? maxLoan : 0;
    });
}

export function getTotalDebt(request: LoanRequestWithVault): number {
    const maxLoan =
        typeof request.max_loan === "number"
            ? request.max_loan
            : parseFloat(String(request.max_loan));
    if (maxLoan <= 0 || isNaN(maxLoan) || !isFinite(maxLoan)) return 0;
    const interest = calculateInterest(request);
    const total = maxLoan + interest;
    if (isNaN(total) || !isFinite(total) || total <= 0) return maxLoan;
    return Math.round(total * 1e6) / 1e6;
}

export async function repayLoan(
    vaultAddress: string,
    amount: number,
    originalDebt: number,
    wallet: PrivyWallet,
    loanRequestId: number,
    onProgress?: (step: string) => void
): Promise<string> {
    onProgress?.("Connecting to wallet...");
    const provider = await wallet.getEthereumProvider();

    onProgress?.("Checking network...");
    const network = (await provider.request({ method: "eth_chainId" })) as string;
    const targetChainId = `0x${parseInt(SEPOLIA_CHAIN_ID, 10).toString(16)}`;

    if (network !== targetChainId) {
        onProgress?.("Switching to Ethereum Sepolia...");
        try {
            await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetChainId }],
            });
        } catch (switchError) {
            const error = switchError as NetworkSwitchError;
            if (error.code === 4902) {
                await provider.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: targetChainId,
                            chainName: "Sepolia",
                            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                            rpcUrls: ["https://rpc.sepolia.org"],
                            blockExplorerUrls: ["https://sepolia.etherscan.io"],
                        },
                    ],
                });
            } else {
                throw switchError;
            }
        }
    }

    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const userAddress = await signer.getAddress();

    const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
    if (!treasuryAddress) throw new Error("Treasury address not configured");

    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    if (!usdcAddress) throw new Error("USDC address not configured");

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    const originalDebtInWei = ethers.parseUnits(originalDebt.toString(), 6);

    const tokenContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);

    onProgress?.("Checking allowance...");
    const currentAllowance = await tokenContract.allowance(userAddress, treasuryAddress);

    if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
        onProgress?.("Step 1/2: Approving token spending...");
        const approveTx = await tokenContract.approve(treasuryAddress, amountInWei);
        onProgress?.("Step 1/2: Confirming approval...");
        await approveTx.wait();
        await new Promise((r) => setTimeout(r, 2000));
        const newAllowance = await tokenContract.allowance(userAddress, treasuryAddress);
        if (BigInt(newAllowance.toString()) < BigInt(amountInWei.toString())) {
            throw new Error("Approval failed: insufficient allowance after transaction");
        }
        onProgress?.("Step 1/2: Approval complete! Preparing repayment...");
        await new Promise((r) => setTimeout(r, 1500));
    }

    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
    onProgress?.("Validating vault state...");
    const [vaultState, borrowerAddress] = await Promise.all([
        vaultContract.state(),
        vaultContract.BORROWER(),
    ]);

    if (vaultState !== BigInt(1)) {
        const stateNames = ["FUNDING", "ACTIVE", "REPAID"];
        throw new Error(
            `Vault is not in ACTIVE state. Current state: ${stateNames[Number(vaultState)]}. The vault must be fully funded and funds must be released before repayment.`
        );
    }

    if (borrowerAddress.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error(
            `Only the borrower can repay the loan. Expected borrower: ${borrowerAddress}, but connected wallet: ${userAddress}`
        );
    }

    const treasuryContract = new ethers.Contract(treasuryAddress, TREASURY_ABI, signer);
    onProgress?.("Step 2/2: Depositing to Treasury...");
    const depositTx = await treasuryContract.deposit(
        originalDebtInWei,
        amountInWei,
        vaultAddress,
        usdcAddress
    );
    onProgress?.("Step 2/2: Confirming deposit...");
    await depositTx.wait();
    onProgress?.("✅ Repayment successful!");

    const apiUrl = getApiUrl();
    try {
        onProgress?.("Tracking repayment in vault...");
        await axios.post(`${apiUrl}/vaults/${vaultAddress}/repayments`, {
            amount,
            txHash: depositTx.hash,
        });
    } catch {
        // repayment succeeded on-chain
    }
    try {
        onProgress?.("Updating loan status...");
        await axios.patch(`${apiUrl}/loan-requests/${loanRequestId}/status`, { status: "PAID" });
    } catch {
        // repayment succeeded on-chain
    }

    return depositTx.hash;
}
