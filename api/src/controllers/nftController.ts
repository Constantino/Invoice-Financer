import { Request, Response } from 'express';
import { GenerateInvoiceMetadataBody, InvoiceMetadata, MintInvoiceNFTBody } from '../types/nft';
import { validateRequest, validateInvoiceMetadata, validateMintInvoiceNFTRequest } from '../validators/nftValidator';
import { sanitizeGenerateInvoiceMetadataRequest, sanitizeMintInvoiceNFTRequest } from '../utils/sanitize';
import { invoiceNftService } from '../services/invoiceNftService';
import { pool } from '../config/database';
import { LoanRequest } from '../models/loanRequest';
import { validateLoanId } from '../validators/loanRequestValidators';

export const generateInvoiceMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
        const sanitizedData = sanitizeGenerateInvoiceMetadataRequest(req.body as GenerateInvoiceMetadataBody);
        const validationError = validateRequest(sanitizedData);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }
        const metadata = invoiceNftService.generateInvoiceMetadata(sanitizedData);
        res.status(200).json({ message: 'Invoice metadata generated successfully', data: metadata });
    } catch (error) {
        console.error('Error generating invoice metadata:', error);
        res.status(500).json({
            error: 'Failed to generate invoice metadata',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const uploadMetadataToPinata = async (req: Request, res: Response): Promise<void> => {
    try {
        const metadata = req.body as InvoiceMetadata;
        const validationError = validateInvoiceMetadata(metadata);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }
        const result = await invoiceNftService.uploadMetadataToPinata(metadata);
        res.status(200).json({ message: 'Metadata uploaded to Pinata successfully', data: result });
    } catch (error) {
        console.error('Error uploading metadata to Pinata:', error);
        if (error instanceof Error && error.message.includes('PINATA_JWT')) {
            res.status(500).json({ error: 'Pinata configuration error', details: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('Pinata upload failed')) {
            res.status(500).json({ error: 'Failed to upload metadata to Pinata', details: error.message });
            return;
        }
        res.status(500).json({
            error: 'Failed to upload metadata to Pinata',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const mintInvoiceNFT = async (req: Request, res: Response): Promise<void> => {
    try {
        const sanitizedData = sanitizeMintInvoiceNFTRequest(req.body as MintInvoiceNFTBody);
        const validationError = validateMintInvoiceNFTRequest(sanitizedData);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }
        const { toAddress: _to, ...metadataParams } = sanitizedData;
        const result = await invoiceNftService.mintInvoiceNFT(metadataParams);
        res.status(200).json({ message: 'Invoice NFT minted successfully', data: result });
    } catch (error) {
        console.error('Error minting invoice NFT:', error);
        if (error instanceof Error && error.message.includes('INVOICE_NFT_ADDRESS')) {
            res.status(500).json({ error: 'Invoice NFT configuration error', details: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('Wallet address')) {
            res.status(400).json({ error: 'Invalid recipient address', details: error.message });
            return;
        }
        res.status(500).json({
            error: 'Failed to mint invoice NFT',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const tokenizeInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { loanRequestId } = req.params;
        const validationError = validateLoanId(loanRequestId);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }
        const id = parseInt(loanRequestId as string, 10);

        const query = `
            SELECT lr.id, lr.invoice_number, lr.invoice_amount, lr.invoice_due_date, lr.customer_name,
                   lr.borrower_address, lr.max_loan, lr.status, bkyb.legal_business_name
            FROM "LoanRequests" lr
            LEFT JOIN "BorrowerKYBs" bkyb ON lr.borrower_address = bkyb.wallet_address
            WHERE lr.id = $1
        `;
        const result = await pool.query<LoanRequest>(query, [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Loan request not found' });
            return;
        }

        const loanRequest = result.rows[0];
        const borrowerName = loanRequest.legal_business_name || loanRequest.customer_name;
        const nftMetadata: GenerateInvoiceMetadataBody = {
            name: `Invoice - ${borrowerName} - ${loanRequest.invoice_number}`,
            description: `Invoice NFT for invoice ${loanRequest.invoice_number} from ${borrowerName}`,
            borrowerName,
            loanRequestId: loanRequest.id,
            invoiceNumber: loanRequest.invoice_number,
        };

        const mintResult = await invoiceNftService.mintInvoiceNFT(nftMetadata);
        res.status(200).json({
            message: 'Invoice tokenized successfully',
            data: { loanRequestId: loanRequest.id, nft: mintResult },
        });
    } catch (error) {
        console.error('Error tokenizing invoice:', error);
        if (error instanceof Error && error.message.includes('INVOICE_NFT_ADDRESS')) {
            res.status(500).json({ error: 'Invoice NFT configuration error', details: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('TREASURY_ADDRESS')) {
            res.status(500).json({ error: 'Treasury address configuration error', details: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('Wallet address')) {
            res.status(400).json({ error: 'Invalid wallet address', details: error.message });
            return;
        }
        res.status(500).json({
            error: 'Failed to tokenize invoice',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
