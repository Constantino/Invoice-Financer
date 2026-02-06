import { Router } from 'express';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Root route
router.get('/', (req, res) => {
    res.json({ message: 'Invoice Financer API' });
});

export default router;
