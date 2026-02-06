import express, { Router } from 'express';
import * as loanRequestController from '../controllers/loanRequestController';
import { upload } from '../config/multer';

const router: Router = express.Router();

// Loan request routes
router.get('/borrower/:borrowerAddress/stats', loanRequestController.getLoanStatsByBorrowerAddress);
router.get('/borrower/:borrowerAddress', loanRequestController.getLoanRequestByBorrowerAddress);
router.get('/', loanRequestController.getAllLoanRequests);
router.get('/:id/details', loanRequestController.getLoanRequestByIdWithDetails);
router.get('/:id', loanRequestController.getLoanRequestById);
router.post('/', upload.single('file'), loanRequestController.createLoanRequest);
router.post('/:id/approve', loanRequestController.approveLoanRequest);
router.patch('/:id/status', loanRequestController.changeLoanStatus);
router.post('/upload', upload.single('file'), loanRequestController.uploadFile);

export default router;
