import axios from "axios";
import { ethers } from "ethers";
import { getApiUrl } from "@/lib/api";
import { VAULT_ABI } from "@/app/abi/Vault";
import { ERC20_ABI } from "@/app/abi/ERC20";
import { NetworkSwitchError } from "@/types/errors";
import { PrivyWallet } from "@/types/providers";
import type { Vault } from "@/types/vault";

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
