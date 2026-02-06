import express, { Router } from 'express';
import * as faucetController from '../controllers/faucetController';

const router: Router = express.Router();

// POST /faucet - Mint tokens to an address
router.post('/', faucetController.mintTokens);

export default router;
