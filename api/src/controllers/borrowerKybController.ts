import { Request, Response } from 'express';
import { pool } from '../config/database';
import { BorrowerKYB } from '../models/borrowerKyb';
import {
    validateLegalBusinessName,
    validateCountryOfIncorporation,
    validateBusinessRegistrationNumber,
    validateBusinessDescription,
    validateUBOFullName,
    validateAverageInvoiceAmount,
    validateWalletAddress,
} from '../validators/borrowerKybValidators';
import { sanitizeBorrowerKYBRequest } from '../utils/sanitize';
import { checkBorrowerHasKYB } from '../services/borrowerKybService';

export const createBorrowerKYB = async (req: Request, res: Response): Promise<void> => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeBorrowerKYBRequest(req.body);

        const {
            legal_business_name,
            country_of_incorporation,
            business_registration_number,
            business_description,
            UBO_full_name,
            average_invoice_amount,
            wallet_address,
        } = sanitizedData;

        // Validate required fields
        const legalBusinessNameError = validateLegalBusinessName(legal_business_name);
        if (legalBusinessNameError) {
            res.status(400).json({ error: legalBusinessNameError });
            return;
        }

        const countryOfIncorporationError = validateCountryOfIncorporation(country_of_incorporation);
        if (countryOfIncorporationError) {
            res.status(400).json({ error: countryOfIncorporationError });
            return;
        }

        const businessRegistrationNumberError = validateBusinessRegistrationNumber(business_registration_number);
        if (businessRegistrationNumberError) {
            res.status(400).json({ error: businessRegistrationNumberError });
            return;
        }

        const businessDescriptionError = validateBusinessDescription(business_description);
        if (businessDescriptionError) {
            res.status(400).json({ error: businessDescriptionError });
            return;
        }

        const uboFullNameError = validateUBOFullName(UBO_full_name);
        if (uboFullNameError) {
            res.status(400).json({ error: uboFullNameError });
            return;
        }

        const averageInvoiceAmountError = validateAverageInvoiceAmount(average_invoice_amount);
        if (averageInvoiceAmountError) {
            res.status(400).json({ error: averageInvoiceAmountError });
            return;
        }

        const walletAddressError = validateWalletAddress(wallet_address);
        if (walletAddressError) {
            res.status(400).json({ error: walletAddressError });
            return;
        }

        // Insert into database
        const query = `
            INSERT INTO "BorrowerKYBs" (
                legal_business_name,
                country_of_incorporation,
                business_registration_number,
                business_description,
                UBO_full_name,
                average_invoice_amount,
                wallet_address,
                created_at,
                modified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING 
                id,
                created_at,
                modified_at,
                legal_business_name,
                country_of_incorporation,
                business_registration_number,
                business_description,
                UBO_full_name,
                average_invoice_amount,
                wallet_address
        `;

        const result = await pool.query<BorrowerKYB>(query, [
            legal_business_name,
            country_of_incorporation,
            business_registration_number,
            business_description,
            UBO_full_name,
            average_invoice_amount,
            wallet_address,
        ]);

        const borrowerKYB = result.rows[0];

        res.status(201).json({
            message: 'Borrower KYB created successfully',
            data: borrowerKYB
        });
    } catch (error) {
        console.error('Error creating borrower KYB:', error);
        res.status(500).json({
            error: 'Failed to create borrower KYB',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const checkBorrowerKYB = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletAddress } = req.params;
        const walletAddressStr = Array.isArray(walletAddress) ? walletAddress[0] : walletAddress;

        // Validate wallet address
        const walletAddressError = validateWalletAddress(walletAddressStr);
        if (walletAddressError) {
            res.status(400).json({ error: walletAddressError });
            return;
        }

        // Check if KYB exists for this wallet address
        const hasKYB = await checkBorrowerHasKYB(walletAddressStr);

        res.status(200).json({
            hasKYB,
            walletAddress: walletAddressStr
        });
    } catch (error) {
        console.error('Error checking borrower KYB:', error);
        res.status(500).json({
            error: 'Failed to check borrower KYB',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
