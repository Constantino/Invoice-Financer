import express, { Router } from 'express';
import * as borrowerKybController from '../controllers/borrowerKybController';

const router: Router = express.Router();

// Borrower KYB routes
router.post('/', borrowerKybController.createBorrowerKYB);
router.get('/check/:walletAddress', borrowerKybController.checkBorrowerKYB);

export default router;
