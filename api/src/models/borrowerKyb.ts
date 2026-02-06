export interface BorrowerKYBRequestBody {
    legal_business_name: string;
    country_of_incorporation: string;
    business_registration_number: string;
    business_description: string;
    UBO_full_name: string;
    average_invoice_amount: number;
    wallet_address: string;
}

export interface BorrowerKYB {
    id: number;
    created_at: Date;
    modified_at: Date;
    legal_business_name: string;
    country_of_incorporation: string;
    business_registration_number: string;
    business_description: string;
    UBO_full_name: string;
    average_invoice_amount: number;
    wallet_address: string;
}
