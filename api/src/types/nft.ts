export interface GenerateInvoiceMetadataBody {
    name: string;
    description: string;
    borrowerName: string;
    loanRequestId: number;
    invoiceNumber: string;
}

export interface InvoiceMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

export interface PinataApiResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

export interface PinataUploadResult {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
    ipfsUrl: string;
    pinataUrl: string;
}

export interface MintInvoiceNFTBody extends GenerateInvoiceMetadataBody {
    toAddress: string;
}

export interface MintResult {
    tokenId: string;
    txHash: string;
    toAddress: string;
    uri: string;
    explorerUrl: string;
}
