import express, { Router } from "express";
import * as vc from "../controllers/vaultController";

const router: Router = express.Router();

// Vault routes
router.get('/', vc.getAllVaults);
router.post('/', vc.createVault);

// Lender portfolio routes
router.get('/lender/:lenderAddress', vc.getPortfolioByLender);

// Deposit routes
router.post('/:vaultAddress/deposit', vc.trackDeposit);
router.get('/:vaultAddress/lenders', vc.getVaultLenders);

// Manual fund release route (admin/recovery)
router.post('/:vaultAddress/release-funds', vc.manualReleaseFunds);

// Repayment routes
router.post('/:vaultAddress/repayments', vc.trackRepayment);

// Redemption routes
router.post('/:vaultAddress/redemptions', vc.trackRedemption);

export default router;
