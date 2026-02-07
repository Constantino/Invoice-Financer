import { ethers } from 'ethers';
import { GenerateInvoiceMetadataBody, InvoiceMetadata, PinataUploadResult, PinataApiResponse, MintResult } from '../types/nft';
import {
    INVOICE_NFT_INVOICE_IMAGE,
    PINATA_JWT,
    RPC_URL,
    PRIVATE_KEY,
    INVOICE_NFT_ADDRESS,
    EXPLORER_URL_BASE,
} from '../config/constants';
import { sanitizeForFilename } from '../utils/sanitize';
import { INVOICENFT_ABI } from '../abi/InvoiceNFT';
import { validateInvoiceNftAddress } from '../validators/nftValidator';
import { pool } from '../config/database';

export class InvoiceNftService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private invoiceNftContract: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.invoiceNftContract = new ethers.Contract(INVOICE_NFT_ADDRESS, INVOICENFT_ABI as ethers.InterfaceAbi, this.wallet);
    }

    public generateInvoiceMetadata(data: GenerateInvoiceMetadataBody): InvoiceMetadata {
        const { name, description, borrowerName, loanRequestId, invoiceNumber } = data;
        return {
            name,
            description,
            image: INVOICE_NFT_INVOICE_IMAGE || 'https://ipfs.io/ipfs/QmPlaceholder',
            attributes: [
                { trait_type: 'Borrower Name', value: borrowerName },
                { trait_type: 'Loan Request ID', value: loanRequestId.toString() },
                { trait_type: 'Invoice Number', value: invoiceNumber },
            ],
        };
    }

    public async uploadMetadataToPinata(metadata: InvoiceMetadata): Promise<PinataUploadResult> {
        if (!PINATA_JWT) {
            throw new Error('PINATA_JWT is not configured. Please set it in your environment variables.');
        }
        const jsonString = JSON.stringify(metadata, null, 2);
        const jsonBuffer = Buffer.from(jsonString, 'utf-8');
        const formData = new FormData();
        const borrowerName = metadata.attributes.find((attr) => attr.trait_type === 'Borrower Name')?.value || 'unknown';
        const invoiceNumber = metadata.attributes.find((attr) => attr.trait_type === 'Invoice Number')?.value || 'unknown';
        const fileName = `invoice-metadata-${sanitizeForFilename(borrowerName)}-${sanitizeForFilename(invoiceNumber)}.json`;
        formData.append('file', new Blob([jsonBuffer], { type: 'application/json' }), fileName);
        const pinataMetadata = JSON.stringify({
            name: `Invoice NFT Metadata - ${metadata.name}`,
            keyvalues: { borrowerName, invoiceNumber },
        });
        formData.append('pinataMetadata', pinataMetadata);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: { Authorization: `Bearer ${PINATA_JWT}` },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = (await response.json()) as PinataApiResponse;
        const ipfsHash = result.IpfsHash;
        const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        const pinataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        return { IpfsHash: ipfsHash, PinSize: result.PinSize, Timestamp: result.Timestamp, ipfsUrl, pinataUrl };
    }

    public async mintInvoiceNFT(data: GenerateInvoiceMetadataBody): Promise<MintResult> {
        const addressConfigError = validateInvoiceNftAddress();
        if (addressConfigError) throw new Error(addressConfigError);

        const recipientAddress = this.wallet.address;

        const contractOwner = await this.invoiceNftContract.owner();
        const walletAddress = this.wallet.address;
        if (contractOwner.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error(
                `Wallet address ${walletAddress} is not the owner of the InvoiceNFT contract. ` +
                    `Contract owner is ${contractOwner}. Please ensure PRIVATE_KEY corresponds to the contract owner.`
            );
        }

        const metadata = this.generateInvoiceMetadata(data);
        const pinataResult = await this.uploadMetadataToPinata(metadata);
        const uri = pinataResult.pinataUrl;

        const finalOwnerCheck = await this.invoiceNftContract.owner();
        if (finalOwnerCheck.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new Error(`Ownership changed! Wallet ${this.wallet.address} is no longer the owner. Current owner is ${finalOwnerCheck}.`);
        }

        const tx = await this.invoiceNftContract.mint(recipientAddress, uri);
        const receipt = await tx.wait();

        const invoiceMintedEvent = receipt.logs
            .map((log: ethers.Log) => {
                try {
                    return this.invoiceNftContract.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find((parsedLog: { name?: string } | null) => parsedLog && parsedLog.name === 'InvoiceMinted');

        let tokenId: string;
        if (invoiceMintedEvent && invoiceMintedEvent.args) {
            tokenId = invoiceMintedEvent.args.tokenId.toString();
        } else {
            const nextTokenId = await this.invoiceNftContract.nextTokenId();
            tokenId = (nextTokenId - 1n).toString();
        }

        if (data.loanRequestId > 0) {
            await pool.query(
                `UPDATE "LoanRequests" SET token_id = $1, token_uri = $2, token_address = $3 WHERE id = $4`,
                [parseInt(tokenId, 10), uri, INVOICE_NFT_ADDRESS, data.loanRequestId]
            );
        }

        const explorerUrl = `${EXPLORER_URL_BASE}/tx/${receipt.hash}`;
        return { tokenId, txHash: receipt.hash, toAddress: recipientAddress, uri, explorerUrl };
    }
}

export const invoiceNftService = new InvoiceNftService();
