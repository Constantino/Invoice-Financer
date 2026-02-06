import { Router } from 'express';
import borrowerKybRoutes from './borrowerKybRoutes';
import faucetRoutes from './faucetRoutes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Root route
router.get('/', (req, res) => {
    res.json({ message: 'Invoice Financer API' });
});

// Borrower KYB routes
router.use('/borrower-kyb', borrowerKybRoutes);

// Faucet routes
router.use('/faucet', faucetRoutes);

export default router;
