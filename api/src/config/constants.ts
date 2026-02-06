export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Blockchain Configuration
export const RPC_URL: string = process.env.RPC_URL || '';
export const PRIVATE_KEY: string = process.env.PRIVATE_KEY || '';
export const VAULT_FACTORY_ADDRESS: string = process.env.VAULT_FACTORY_ADDRESS || '';
export const TREASURY_ADDRESS: string = process.env.TREASURY_ADDRESS || '';
export const EXPLORER_URL_BASE: string = process.env.EXPLORER_URL_BASE || 'https://sepolia.etherscan.io';
export const USDC_ADDRESS: string = process.env.USDC_ADDRESS || '';
