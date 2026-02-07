import express, { Router } from 'express';
import * as nftController from '../controllers/nftController';

const router: Router = express.Router();

router.post('/invoice-metadata', nftController.generateInvoiceMetadata);
router.post('/upload-metadata', nftController.uploadMetadataToPinata);
router.post('/mint', nftController.mintInvoiceNFT);
router.post('/tokenize/:loanRequestId', nftController.tokenizeInvoice);

export default router;
