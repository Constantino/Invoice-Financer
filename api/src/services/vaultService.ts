import { ethers } from "ethers";
import { pool } from "../config/database";
import { RPC_URL, PRIVATE_KEY, VAULT_FACTORY_ADDRESS, EXPLORER_URL_BASE } from "../config/constants";
import { CreateVaultBody, DeployVaultResult, Vault } from "../models/vault";
import { CreateVaultLenderBody, VaultLender } from "../models/vaultLender";
import { VAULTFACTORY_ABI } from "../abi/VaultFactory";
import { VAULT_ABI } from "../abi/Vault";
import { validateVaultStatusForDeposit, validateVaultCapacity, validateVaultStatusForRelease, validateVaultCapacityForRelease, validateVaultStatusForRepayment, validateVaultStatusForRedemption, validateSharesAmount } from "../validators/vaultValidator";
import { PoolClient } from "pg";
import { VaultStatus } from "../types/vaultStatus";
import { LoanStatus } from "../types/loanStatus";
import { loanService } from "./loanService";

export class VaultService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private vaultFactory: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.vaultFactory = new ethers.Contract(VAULT_FACTORY_ADDRESS, VAULTFACTORY_ABI, this.wallet);
    }

    async createVault(vaultData: CreateVaultBody): Promise<DeployVaultResult> {
        try {
            // Convert invoice amount to wei (assuming USDC with 6 decimals)
            const maxCapacity = ethers.parseUnits(vaultData.invoiceAmount.toString(), 6);

            // Get the latest nonce to avoid nonce conflicts
            const nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');

            // Deploy vault with explicit nonce
            const tx = await this.vaultFactory.deployVault(
                vaultData.invoiceName,
                vaultData.invoiceNumber,
                vaultData.borrowerAddress,
                maxCapacity,
                vaultData.maturityDate,
                { nonce }
            );

            const receipt = await tx.wait();

            // Extract vault address from VaultCreated event
            const vaultCreatedEvent = receipt.logs
                .map((log: any) => {
                    try {
                        return this.vaultFactory.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((parsedLog: any) => parsedLog && parsedLog.name === 'VaultCreated');

            if (!vaultCreatedEvent) {
                throw new Error('Failed to extract vault address from transaction');
            }

            const vaultAddress = vaultCreatedEvent.args.vault;
            const vaultName = `${vaultData.invoiceName}_${vaultData.invoiceNumber}_Vault`;
            const vaultSymbol = `${vaultData.invoiceName}_${vaultData.invoiceNumber}`;
            const explorerUrl = `${EXPLORER_URL_BASE}/tx/${receipt.hash}`;
            const vaultExplorerUrl = `${EXPLORER_URL_BASE}/address/${vaultAddress}`;
            const factoryExplorerUrl = `${EXPLORER_URL_BASE}/address/${VAULT_FACTORY_ADDRESS}`;

            // Insert vault record into database
            await this.saveVault({
                vaultAddress,
                borrowerAddress: vaultData.borrowerAddress,
                vaultName,
                maxCapacity: vaultData.invoiceAmount,
                currentCapacity: 0,
                loanRequestId: vaultData.loanRequestId
            });

            return {
                vaultAddress,
                vaultExplorerUrl,
                vaultName,
                vaultSymbol,
                factoryAddress: VAULT_FACTORY_ADDRESS,
                factoryExplorerUrl,
                invoiceNumber: vaultData.invoiceNumber,
                borrowerAddress: vaultData.borrowerAddress,
                maxCapacity: vaultData.invoiceAmount,
                maturityDate: vaultData.maturityDate,
                transactionHash: receipt.hash,
                explorerUrl,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error deploying vault:', error);
            throw error;
        }
    }
    private async saveVault(vaultData: {
        vaultAddress: string;
        borrowerAddress: string;
        vaultName: string;
        maxCapacity: number;
        currentCapacity: number;
        loanRequestId?: number;
    }): Promise<void> {
        const query = `
            INSERT INTO "Vaults" (
                vault_address,
                borrower_address,
                vault_name,
                max_capacity,
                current_capacity,
                loan_request_id,
                status,
                created_at,
                modified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `;

        await pool.query(query, [
            vaultData.vaultAddress,
            vaultData.borrowerAddress,
            vaultData.vaultName,
            vaultData.maxCapacity,
            vaultData.currentCapacity,
            vaultData.loanRequestId || null,
            VaultStatus.PENDING
        ]);
    }

    async getAllVaults(): Promise<Vault[]> {
        const query = `
            SELECT 
                vault_id,
                vault_address,
                borrower_address,
                vault_name,
                max_capacity,
                current_capacity,
                loan_request_id,
                status,
                funded_at,
                fund_release_tx_hash,
                created_at,
                modified_at
            FROM "Vaults"
            ORDER BY created_at DESC
        `;

        const result = await pool.query<Vault>(query);
        return result.rows;
    }

    // Step 1: Get vault for update with lock
    private async getVaultForUpdate(
        client: PoolClient,
        vaultAddress: string
    ): Promise<any> {
        const query = `
            SELECT vault_id, max_capacity, current_capacity, status, borrower_address, loan_request_id
            FROM "Vaults"
            WHERE vault_address = $1
            FOR UPDATE
        `;
        const result = await client.query(query, [vaultAddress]);

        if (result.rows.length === 0) {
            throw new Error(`Vault not found: ${vaultAddress}`);
        }

        return result.rows[0];
    }

    // Step 2: Validate vault can accept deposit
    private validateVaultForDeposit(vault: any, depositAmount: number): void {
        // Validate vault status
        const statusError = validateVaultStatusForDeposit(vault.status);
        if (statusError) {
            throw new Error(statusError);
        }

        // Validate capacity
        const currentCapacity = parseFloat(vault.current_capacity);
        const maxCapacity = parseFloat(vault.max_capacity);
        const capacityError = validateVaultCapacity(currentCapacity, maxCapacity, depositAmount);
        if (capacityError) {
            throw new Error(capacityError);
        }
    }

    // Step 3: Insert lender record
    private async insertLenderRecord(
        client: PoolClient,
        vaultId: number,
        depositData: CreateVaultLenderBody
    ): Promise<VaultLender> {
        const query = `
            INSERT INTO "VaultLenders" (
                vault_id,
                lender_address,
                amount,
                tx_hash,
                status,
                shares_amount,
                created_at
            )
            VALUES ($1, $2, $3, $4, 'FUNDED', $5, NOW())
            RETURNING *
        `;

        const result = await client.query<VaultLender>(query, [
            vaultId,
            depositData.lenderAddress,
            depositData.amount,
            depositData.txHash,
            depositData.sharesAmount || null
        ]);

        return result.rows[0];
    }

    // Step 4: Calculate new status based on capacity
    private calculateNewStatus(currentStatus: VaultStatus, currentCapacity: number, newCapacity: number, maxCapacity: number): VaultStatus {
        // Use epsilon for floating point comparison
        const EPSILON = 0.000001; // 1e-6

        // Update status based on capacity
        if (currentStatus === VaultStatus.PENDING && newCapacity > 0) {
            return VaultStatus.FUNDING;
        }
        if ((newCapacity + EPSILON) >= maxCapacity) {
            return VaultStatus.FUNDED;
        }
        return currentStatus;
    }

    // Step 5: Update vault capacity and status
    private async updateVaultCapacityAndStatus(
        client: PoolClient,
        vaultId: number,
        newCapacity: number,
        newStatus: VaultStatus
    ): Promise<Vault> {
        // Set funded_at when transitioning to FUNDED status
        const shouldSetFundedAt = newStatus === VaultStatus.FUNDED;

        const query = `
            UPDATE "Vaults"
            SET current_capacity = $1,
                status = $2,
                funded_at = CASE WHEN $3 = true AND funded_at IS NULL THEN NOW() ELSE funded_at END,
                modified_at = NOW()
            WHERE vault_id = $4
            RETURNING *
        `;

        const result = await client.query<Vault>(query, [
            newCapacity,
            newStatus,
            shouldSetFundedAt,
            vaultId
        ]);

        return result.rows[0];
    }

    // Step 6: Release funds via smart contract
    private async releaseFundsToContract(vaultAddress: string): Promise<string> {
        console.log(`🚀 Vault ${vaultAddress} reached capacity. Releasing funds to borrower...`);

        const vaultContract = new ethers.Contract(
            vaultAddress,
            VAULT_ABI,
            this.wallet
        );

        const releaseTx = await vaultContract.releaseFunds();
        const releaseReceipt = await releaseTx.wait();

        const txHash = releaseReceipt.hash;
        console.log(`✅ Funds released successfully. TX: ${txHash}`);

        return txHash;
    }

    // Step 7: Update vault with release transaction hash
    private async updateVaultReleaseStatus(vaultId: number, txHash: string): Promise<void> {
        const query = `
            UPDATE "Vaults"
            SET fund_release_tx_hash = $1,
                status = $2,
                modified_at = NOW(),
                fund_release_at = NOW()
            WHERE vault_id = $3
        `;

        await pool.query(query, [txHash, VaultStatus.RELEASED, vaultId]);
    }

    // Main deposit tracking function - now clean and readable
    async trackDeposit(
        vaultAddress: string,
        depositData: CreateVaultLenderBody
    ): Promise<{ vault: Vault; lender: VaultLender; fundReleased?: boolean; releaseTxHash?: string }> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Step 1: Get vault data with lock
            const vault = await this.getVaultForUpdate(client, vaultAddress);

            // Step 2: Validate vault can accept deposit
            this.validateVaultForDeposit(vault, depositData.amount);

            // Step 3: Calculate new capacity
            const currentCapacity = parseFloat(vault.current_capacity);
            const maxCapacity = parseFloat(vault.max_capacity);
            const newCapacity = currentCapacity + depositData.amount;

            // Use epsilon for floating point comparison (handles 0.8 == 0.8 precision issues)
            const EPSILON = 0.000001; // 1e-6
            const isFullyFunded = (newCapacity + EPSILON) >= maxCapacity;

            // Step 4: Insert lender record
            const lender = await this.insertLenderRecord(client, vault.vault_id, depositData);

            // Step 5: Calculate new status
            const newStatus = this.calculateNewStatus(vault.status, currentCapacity, newCapacity, maxCapacity);

            // Step 6: Update vault capacity and status
            const updatedVault = await this.updateVaultCapacityAndStatus(
                client,
                vault.vault_id,
                newCapacity,
                newStatus
            );

            // Step 7: Commit transaction before blockchain interaction
            await client.query('COMMIT');

            // Step 7.5: Ensure shares_amount is set correctly
            // If frontend didn't send sharesAmount, calculate it from blockchain
            if (validateSharesAmount(depositData.sharesAmount)) {
                try {
                    console.log('⚠️ No shares_amount provided by frontend, calculating from blockchain...');
                    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);

                    // CRITICAL: Use previewDeposit to get shares for THIS SPECIFIC deposit amount
                    // NOT total balance (which would be wrong for split deposits)
                    const depositInWei = ethers.parseUnits(depositData.amount.toString(), 6);
                    const expectedShares = await vaultContract.previewDeposit(depositInWei);
                    const shareBalanceStr = ethers.formatUnits(expectedShares, 18);

                    console.log(`Calculated shares for deposit ${depositData.amount} USDC: ${shareBalanceStr}`);

                    // Update VaultLenders record with calculated shares as string
                    const updateSharesQuery = `
                        UPDATE "VaultLenders"
                        SET shares_amount = $1
                        WHERE lender_id = $2
                    `;
                    await pool.query(updateSharesQuery, [shareBalanceStr, lender.lender_id]);
                    console.log(`✅ Updated VaultLenders record ${lender.lender_id} with shares_amount: ${shareBalanceStr}`);
                } catch (sharesError) {
                    console.error('❌ Error calculating/updating shares:', sharesError);
                    // Don't fail the entire deposit if shares update fails
                }
            } else {
                console.log(`✅ Using shares_amount from frontend: ${depositData.sharesAmount}`);
            }

            // Step 8: If vault appears to be fully funded, verify with smart contract before releasing
            let fundReleased = false;
            let releaseTxHash: string | undefined;

            if (isFullyFunded) {
                try {
                    // CRITICAL: Read actual balance from smart contract to verify it's really funded
                    console.log('📊 Verifying vault funding status from smart contract...');
                    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);
                    const totalAssets = await vaultContract.totalAssets();
                    const totalAssetsUsdc = parseFloat(ethers.formatUnits(totalAssets, 6));

                    console.log(`Smart contract state: totalAssets=${totalAssetsUsdc} USDC, maxCapacity=${maxCapacity} USDC`);

                    // Use epsilon for floating point comparison (handles precision issues)
                    const EPSILON = 0.000001; // 1e-6
                    const isContractFullyFunded = (totalAssetsUsdc + EPSILON) >= maxCapacity;

                    // Only release if smart contract confirms it's fully funded
                    if (isContractFullyFunded) {
                        releaseTxHash = await this.releaseFundsToContract(vaultAddress);
                        await this.updateVaultReleaseStatus(vault.vault_id, releaseTxHash);

                        fundReleased = true;
                        updatedVault.fund_release_tx_hash = releaseTxHash;
                        updatedVault.status = VaultStatus.RELEASED;

                        await loanService.changeLoanStatus(vault.loan_request_id, LoanStatus.ACTIVE);
                    } else {
                        console.log(`⏳ Vault not yet fully funded in smart contract. totalAssets: ${totalAssetsUsdc}, required: ${maxCapacity}`);
                    }
                } catch (releaseError) {
                    console.error('❌ Error releasing funds to borrower:', releaseError);
                    console.log('Vault marked as FUNDED. Manual fund release may be required.');
                }
            }

            return {
                vault: updatedVault,
                lender,
                fundReleased,
                releaseTxHash
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error tracking deposit:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getVaultLenders(vaultAddress: string): Promise<VaultLender[]> {
        const query = `
            SELECT vl.*
            FROM "VaultLenders" vl
            JOIN "Vaults" v ON vl.vault_id = v.vault_id
            WHERE v.vault_address = $1
            ORDER BY vl.created_at DESC
        `;

        const result = await pool.query<VaultLender>(query, [vaultAddress]);
        return result.rows;
    }

    async getPortfolioByLender(lenderAddress: string): Promise<any[]> {
        const query = `
            SELECT
                vl.lender_id,
                vl.lender_address,
                vl.amount,
                vl.tx_hash,
                vl.created_at,
                vl.status as lender_status,
                vl.shares_amount,
                vl.redeemed_amount,
                vl.redemption_tx_hash,
                vl.redeemed_at,
                v.vault_id,
                v.vault_address,
                v.vault_name,
                v.borrower_address,
                v.max_capacity,
                v.current_capacity,
                v.status,
                v.funded_at,
                v.fund_release_tx_hash,
                v.fund_release_at,
                v.loan_request_id,
                lr.invoice_due_date as maturity_date,
                lr.monthly_interest_rate
            FROM "VaultLenders" vl
            JOIN "Vaults" v ON vl.vault_id = v.vault_id
            LEFT JOIN "LoanRequests" lr ON v.loan_request_id = lr.id
            WHERE vl.lender_address = $1
            ORDER BY vl.created_at DESC
        `;

        const result = await pool.query(query, [lenderAddress]);
        return result.rows;
    }

    // Helper: Get vault for manual release
    private async getVaultForRelease(vaultAddress: string): Promise<any> {
        const query = `
            SELECT vault_id, vault_address, borrower_address, status, max_capacity, current_capacity
            FROM "Vaults"
            WHERE vault_address = $1
        `;
        const result = await pool.query(query, [vaultAddress]);

        if (result.rows.length === 0) {
            throw new Error(`Vault not found: ${vaultAddress}`);
        }

        return result.rows[0];
    }

    // Helper: Validate vault can be manually released
    private validateVaultForRelease(vault: any): { canRelease: boolean; message: string } {
        // Validate status
        const statusValidation = validateVaultStatusForRelease(vault.status);
        if (!statusValidation.canRelease) {
            return statusValidation;
        }

        // Validate capacity
        const currentCapacity = parseFloat(vault.current_capacity);
        const maxCapacity = parseFloat(vault.max_capacity);
        const capacityError = validateVaultCapacityForRelease(currentCapacity, maxCapacity);

        if (capacityError) {
            return {
                canRelease: false,
                message: capacityError
            };
        }

        return {
            canRelease: true,
            message: 'Vault is ready for fund release'
        };
    }

    async manualReleaseFunds(vaultAddress: string): Promise<{
        success: boolean;
        txHash?: string;
        vault: Vault;
        message: string;
    }> {
        try {
            // Step 1: Get vault data
            const vault = await this.getVaultForRelease(vaultAddress);

            // Step 2: Validate vault can be released
            const validation = this.validateVaultForRelease(vault);

            if (!validation.canRelease) {
                return {
                    success: false,
                    vault,
                    message: validation.message
                };
            }

            // Step 3: Release funds via smart contract (reuse existing function)
            const txHash = await this.releaseFundsToContract(vaultAddress);

            // Step 4: Update vault status (reuse existing function)
            await this.updateVaultReleaseStatus(vault.vault_id, txHash);

            // Step 5: Get updated vault
            const updatedVault = await this.getVaultForRelease(vaultAddress);

            return {
                success: true,
                txHash,
                vault: updatedVault,
                message: 'Funds released successfully to borrower'
            };

        } catch (error) {
            console.error('Error in manual fund release:', error);
            throw error;
        }
    }

    async trackRepayment(
        vaultAddress: string,
        repaymentData: { amount: number; txHash: string }
    ): Promise<{ vault: Vault; message: string }> {
        try {
            // Step 1: Get vault data
            const query = `
                SELECT vault_id, vault_address, borrower_address, status, max_capacity, current_capacity
                FROM "Vaults"
                WHERE vault_address = $1
            `;
            const result = await pool.query(query, [vaultAddress]);

            if (result.rows.length === 0) {
                throw new Error(`Vault not found: ${vaultAddress}`);
            }

            const vault = result.rows[0];

            // Step 2: Validate vault status (must be RELEASED)
            const statusError = validateVaultStatusForRepayment(vault.status);
            if (statusError) {
                throw new Error(statusError);
            }

            // Step 3: Read total assets from smart contract
            console.log(`📖 Reading vault state from smart contract: ${vaultAddress}`);
            const vaultContract = new ethers.Contract(
                vaultAddress,
                VAULT_ABI,
                this.provider
            );

            const [totalAssets, vaultState] = await Promise.all([
                vaultContract.totalAssets(),
                vaultContract.state()
            ]);

            // Convert totalAssets from wei to USDC (6 decimals)
            const totalAssetsInUsdc = parseFloat(ethers.formatUnits(totalAssets, 6));
            const maxCapacity = parseFloat(vault.max_capacity);

            console.log(`📊 Vault repayment status:`, {
                vaultAddress,
                totalAssets: totalAssetsInUsdc,
                maxCapacity,
                vaultState: vaultState.toString(),
                repaymentAmount: repaymentData.amount
            });

            // Step 4: Check if vault is fully repaid (state == 2 means REPAID in smart contract)
            const isFullyRepaid = vaultState === BigInt(2);

            // Step 4.5: Record repayment in VaultRepayments table
            console.log(`💾 Recording repayment in database...`);
            const repaymentInsertQuery = `
                INSERT INTO "VaultRepayments" (
                    vault_id,
                    amount,
                    tx_hash,
                    created_at
                )
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (tx_hash) DO NOTHING
            `;
            await pool.query(repaymentInsertQuery, [
                vault.vault_id,
                repaymentData.amount,
                repaymentData.txHash
            ]);
            console.log(`✅ Repayment recorded in database`);

            // Step 5: Update vault status if fully repaid
            let updatedVault: Vault;

            if (isFullyRepaid) {
                console.log(`✅ Vault fully repaid. Updating status to REPAID...`);
                const updateQuery = `
                    UPDATE "Vaults"
                    SET status = $1,
                        current_capacity = $2,
                        modified_at = NOW()
                    WHERE vault_id = $3
                    RETURNING *
                `;
                const updateResult = await pool.query<Vault>(updateQuery, [
                    VaultStatus.REPAID,
                    totalAssetsInUsdc,
                    vault.vault_id
                ]);
                updatedVault = updateResult.rows[0];

                return {
                    vault: updatedVault,
                    message: 'Repayment tracked successfully. Vault is now fully repaid and ready for redemption.'
                };
            } else {
                // Partial repayment - just update current capacity
                console.log(`📝 Partial repayment tracked. Vault still active...`);
                const updateQuery = `
                    UPDATE "Vaults"
                    SET current_capacity = $1,
                        modified_at = NOW()
                    WHERE vault_id = $2
                    RETURNING *
                `;
                const updateResult = await pool.query<Vault>(updateQuery, [
                    totalAssetsInUsdc,
                    vault.vault_id
                ]);
                updatedVault = updateResult.rows[0];

                return {
                    vault: updatedVault,
                    message: `Partial repayment tracked successfully. Remaining debt: ${(maxCapacity - totalAssetsInUsdc).toFixed(2)} USDC`
                };
            }
        } catch (error) {
            console.error('Error tracking repayment:', error);
            throw error;
        }
    }

    async trackRedemption(
        vaultAddress: string,
        redemptionData: { lenderAddress: string; lenderId?: number; sharesRedeemed?: number; amount: number; txHash: string }
    ): Promise<{ vault: Vault; message: string }> {
        try {
            // Step 1: Get vault data
            const query = `
                SELECT vault_id, vault_address, borrower_address, status, max_capacity, current_capacity
                FROM "Vaults"
                WHERE vault_address = $1
            `;
            const result = await pool.query(query, [vaultAddress]);

            if (result.rows.length === 0) {
                throw new Error(`Vault not found: ${vaultAddress}`);
            }

            const vault = result.rows[0];

            // Step 2: Validate vault status (must be REPAID)
            const statusError = validateVaultStatusForRedemption(vault.status);
            if (statusError) {
                throw new Error(statusError);
            }

            // Step 3: If lenderId is provided, update specific VaultLenders record
            if (redemptionData.lenderId) {
                console.log(`📝 Updating VaultLenders record ${redemptionData.lenderId} to REDEEMED status...`);

                const updateLenderQuery = `
                    UPDATE "VaultLenders"
                    SET status = 'REDEEMED',
                        redeemed_amount = $1,
                        shares_amount = $2,
                        redemption_tx_hash = $3,
                        redeemed_at = NOW()
                    WHERE lender_id = $4 AND vault_id = $5
                `;

                await pool.query(updateLenderQuery, [
                    redemptionData.amount,
                    redemptionData.sharesRedeemed || null,
                    redemptionData.txHash,
                    redemptionData.lenderId,
                    vault.vault_id
                ]);

                console.log(`✅ VaultLenders record ${redemptionData.lenderId} updated successfully`);
            }

            // Step 4: Read share balance from smart contract to verify redemption
            console.log(`📖 Verifying redemption from smart contract: ${vaultAddress}`);
            const vaultContract = new ethers.Contract(
                vaultAddress,
                VAULT_ABI,
                this.provider
            );

            const shareBalance = await vaultContract.balanceOf(redemptionData.lenderAddress);
            console.log(`📊 Lender ${redemptionData.lenderAddress} share balance after redemption: ${shareBalance.toString()}`);

            // Step 5: Check if all lenders have redeemed their shares
            // Get all unique lenders for this vault
            const lendersQuery = `
                SELECT DISTINCT lender_address
                FROM "VaultLenders"
                WHERE vault_id = $1
            `;
            const lendersResult = await pool.query(lendersQuery, [vault.vault_id]);
            const lenderAddresses = lendersResult.rows.map(row => row.lender_address);

            // Check each lender's share balance
            let allRedeemed = true;
            for (const lenderAddr of lenderAddresses) {
                const balance = await vaultContract.balanceOf(lenderAddr);
                if (balance > BigInt(0)) {
                    allRedeemed = false;
                    console.log(`📊 Lender ${lenderAddr} still has ${balance.toString()} shares`);
                    break;
                }
            }

            console.log(`📊 All lenders redeemed: ${allRedeemed}`);

            // Step 6: Update vault status if all shares have been redeemed
            let updatedVault: Vault;

            if (allRedeemed) {
                console.log(`✅ All shares redeemed. Updating vault status to REDEEMED...`);
                const updateQuery = `
                    UPDATE "Vaults"
                    SET status = $1,
                        modified_at = NOW()
                    WHERE vault_id = $2
                    RETURNING *
                `;
                const updateResult = await pool.query<Vault>(updateQuery, [
                    VaultStatus.REDEEMED,
                    vault.vault_id
                ]);
                updatedVault = updateResult.rows[0];

                return {
                    vault: updatedVault,
                    message: 'Redemption tracked successfully. All shares have been redeemed and vault is now closed.'
                };
            } else {
                console.log(`📝 Partial redemption tracked. Some lenders still have shares...`);
                // Just return the vault as is - no status change needed
                return {
                    vault,
                    message: 'Redemption tracked successfully. Some lenders still need to redeem their shares.'
                };
            }
        } catch (error) {
            console.error('Error tracking redemption:', error);
            throw error;
        }
    }
}

export const vaultService = new VaultService();
