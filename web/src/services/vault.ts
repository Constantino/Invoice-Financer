import axios from "axios";
import { ethers } from "ethers";
import { getApiUrl } from "@/lib/api";
import { VAULT_ABI } from "@/app/abi/Vault";
import { ERC20_ABI } from "@/app/abi/ERC20";
import { NetworkSwitchError } from "@/types/errors";
import type { PrivyWallet } from "@/types/providers";
import type { Vault, LenderPortfolio } from "@/types/vault";

/**
 * Fetch all available vaults from the API
 */
export async function fetchVaults(): Promise<Vault[]> {
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: Vault[] }>(`${apiUrl}/vaults`);
    return response.data.data ?? [];
}

/**
 * Participate in a vault by depositing funds
 */
export async function participateInVault(
    vaultAddress: string,
    amount: number,
    wallet: PrivyWallet,
    onProgress?: (step: string) => void
): Promise<string> {
    onProgress?.("Connecting to wallet...");

    const provider = await wallet.getEthereumProvider();

    onProgress?.("Checking network...");
    const network = (await provider.request({ method: "eth_chainId" })) as string;
    const targetChainId = `0x${parseInt(process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID || "11155111", 10).toString(16)}`;

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

    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    if (!usdcAddress) throw new Error("USDC address not configured");

    const amountInWei = ethers.parseUnits(amount.toString(), 6);

    const tokenContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);

    onProgress?.("Checking allowance...");
    const currentAllowance = await tokenContract.allowance(userAddress, vaultAddress);

    if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
        onProgress?.("Step 1/2: Approving token spending...");
        const approveTx = await tokenContract.approve(vaultAddress, amountInWei);
        onProgress?.("Step 1/2: Confirming approval...");
        await approveTx.wait();
        await new Promise((r) => setTimeout(r, 2000));

        const newAllowance = await tokenContract.allowance(userAddress, vaultAddress);
        if (BigInt(newAllowance.toString()) < BigInt(amountInWei.toString())) {
            throw new Error("Approval failed: insufficient allowance after transaction");
        }
        onProgress?.("Step 1/2: Approval complete! Preparing deposit...");
        await new Promise((r) => setTimeout(r, 1500));
    }

    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

    onProgress?.("Calculating shares...");
    const expectedShares = await vaultContract.previewDeposit(amountInWei);
    const expectedSharesStr = ethers.formatUnits(expectedShares, 18);

    onProgress?.("Step 2/2: Depositing into vault...");
    const depositTx = await vaultContract.deposit(amountInWei, userAddress);
    onProgress?.("Step 2/2: Confirming deposit...");
    await depositTx.wait();

    onProgress?.("✅ Deposit successful!");

    try {
        onProgress?.("Recording deposit...");
        const apiUrl = getApiUrl();
        await axios.post(`${apiUrl}/vaults/${vaultAddress}/deposit`, {
            lenderAddress: userAddress,
            amount,
            sharesAmount: expectedSharesStr,
            txHash: depositTx.hash,
        });
    } catch (dbError) {
        console.error("Failed to record deposit in database:", dbError);
    }

    return depositTx.hash;
}

const SEPOLIA_CHAIN_ID = process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID || "11155111";

/**
 * Fetch lender portfolio from the API
 */
export async function fetchLenderPortfolio(
    lenderAddress: string
): Promise<LenderPortfolio[]> {
    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LenderPortfolio[] }>(
        `${apiUrl}/vaults/lender/${lenderAddress}`
    );
    let portfolioData: LenderPortfolio[] = response.data.data ?? [];

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (rpcUrl) {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            portfolioData = await Promise.all(
                portfolioData.map(async (item) => {
                    if (item.status === "REPAID") {
                        try {
                            const vaultContract = new ethers.Contract(
                                item.vault_address,
                                VAULT_ABI,
                                provider
                            );
                            const shareBalance = await vaultContract.balanceOf(
                                lenderAddress
                            );
                            if (shareBalance === BigInt(0)) {
                                return { ...item, lender_status: "REDEEMED" as const };
                            }
                        } catch {
                            // keep original
                        }
                    }
                    return item;
                })
            );
        } catch {
            // return original data
        }
    }

    return portfolioData;
}

/**
 * Redeem shares from a vault
 */
export async function redeemShares(
    vaultAddress: string,
    sharesToRedeem: bigint,
    lenderId: number,
    wallet: PrivyWallet,
    onProgress?: (step: string) => void
): Promise<{ txHash: string; redeemedAmount: number }> {
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
                            nativeCurrency: {
                                name: "ETH",
                                symbol: "ETH",
                                decimals: 18,
                            },
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

    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

    onProgress?.("Validating vault state...");
    const vaultState = await vaultContract.state();
    if (vaultState !== BigInt(2)) {
        const stateNames = ["FUNDING", "ACTIVE", "REPAID"];
        throw new Error(
            `Vault is not in REPAID state. Current state: ${stateNames[Number(vaultState)]}. The vault must be fully repaid before redemption.`
        );
    }

    onProgress?.("Checking your shares...");
    const shareBalance = await vaultContract.balanceOf(userAddress);
    if (shareBalance === BigInt(0)) {
        throw new Error("You have no shares to redeem in this vault");
    }
    if (shareBalance < sharesToRedeem) {
        throw new Error(
            `Insufficient shares. Have ${shareBalance.toString()}, need ${sharesToRedeem.toString()}`
        );
    }

    onProgress?.("Calculating redemption amount...");
    const previewAssets = await vaultContract.previewRedeem(sharesToRedeem);
    const redeemedAmountUsdc = parseFloat(
        ethers.formatUnits(previewAssets, 6)
    );

    onProgress?.("Redeeming shares...");
    const redeemTx = await vaultContract.redeem(
        sharesToRedeem,
        userAddress,
        userAddress
    );
    onProgress?.("Confirming redemption...");
    await redeemTx.wait();
    onProgress?.("✅ Redemption successful!");

    try {
        onProgress?.("Recording redemption...");
        const apiUrl = getApiUrl();
        await axios.post(`${apiUrl}/vaults/${vaultAddress}/redemptions`, {
            lenderAddress: userAddress,
            lenderId,
            sharesRedeemed: ethers.formatUnits(sharesToRedeem, 18),
            amount: redeemedAmountUsdc,
            txHash: redeemTx.hash,
        });
    } catch (dbError) {
        console.error("Failed to record redemption in database:", dbError);
    }

    return {
        txHash: redeemTx.hash,
        redeemedAmount: redeemedAmountUsdc,
    };
}

/**
 * Preview redemption amount for a deposit
 */
export async function previewRedemption(
    vaultAddress: string,
    depositAmount: number,
    storedShares: string | number | undefined,
    wallet: PrivyWallet
): Promise<{ redeemableAmount: number; sharesToRedeem: bigint }> {
    const provider = await wallet.getEthereumProvider();
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const userAddress = await signer.getAddress();

    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

    let sharesToRedeem: bigint;
    if (
        storedShares &&
        (typeof storedShares === "string" ? storedShares !== "0" : storedShares > 0)
    ) {
        sharesToRedeem = ethers.parseUnits(storedShares.toString(), 18);
    } else {
        const depositInWei = ethers.parseUnits(depositAmount.toString(), 6);
        sharesToRedeem = await vaultContract.convertToShares(depositInWei);
    }

    if (sharesToRedeem === BigInt(0)) {
        return { redeemableAmount: 0, sharesToRedeem: BigInt(0) };
    }

    const userShares = await vaultContract.balanceOf(userAddress);
    if (userShares < sharesToRedeem) {
        throw new Error(
            `Insufficient shares. Have ${userShares.toString()}, need ${sharesToRedeem.toString()}`
        );
    }

    const previewAssets = await vaultContract.previewRedeem(sharesToRedeem);
    const redeemedAmountUsdc = parseFloat(
        ethers.formatUnits(previewAssets, 6)
    );
    return { redeemableAmount: redeemedAmountUsdc, sharesToRedeem };
}

export function calculateAllocatedCapital(
    portfolio: LenderPortfolio[]
): number {
    const total = portfolio.reduce((sum, item) => {
        const amount =
            typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    return Math.round(total * 1e6) / 1e6;
}

export function calculateRealizedGains(
    portfolio: LenderPortfolio[]
): number {
    const redeemedVaults = portfolio.filter(
        (item) => item.lender_status === "REDEEMED"
    );
    const totalGains = redeemedVaults.reduce((sum, item) => {
        const investedAmount =
            typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
        const redeemedAmount =
            typeof item.redeemed_amount === "string"
                ? parseFloat(item.redeemed_amount)
                : item.redeemed_amount ?? 0;
        const gain = redeemedAmount - investedAmount;
        return sum + (isNaN(gain) ? 0 : gain);
    }, 0);
    return Math.round(totalGains * 1e6) / 1e6;
}

export function calculateUnrealizedGains(
    portfolio: LenderPortfolio[]
): number {
    const repaidVaults = portfolio.filter(
        (item) => item.status === "REPAID" && item.lender_status === "FUNDED"
    );
    const totalUnrealizedGains = repaidVaults.reduce((sum, item) => {
        if (!item.fund_release_at || !item.maturity_date) return sum;
        const investedAmount =
            typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
        const monthlyInterestRate = item.monthly_interest_rate ?? 0;
        const fundReleaseDate = new Date(item.fund_release_at);
        const maturityDate = new Date(item.maturity_date);
        const numberOfDays = Math.floor(
            (maturityDate.getTime() - fundReleaseDate.getTime()) /
                (1000 * 60 * 60 * 24)
        );
        if (numberOfDays <= 0) return sum;
        const dailyInterestRate = monthlyInterestRate / 30;
        const interest = numberOfDays * dailyInterestRate * investedAmount;
        if (isNaN(interest) || !isFinite(interest)) return sum;
        return sum + interest;
    }, 0);
    return Math.round(totalUnrealizedGains * 1e6) / 1e6;
}
