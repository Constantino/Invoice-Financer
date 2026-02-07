export const INVOICENFT_ABI = [
    { "type": "constructor", "inputs": [{ "name": "name", "type": "string", "internalType": "string" }, { "name": "symbol", "type": "string", "internalType": "string" }, { "name": "initialOwner", "type": "address", "internalType": "address" }], "stateMutability": "nonpayable" },
    { "type": "function", "name": "mint", "inputs": [{ "name": "to", "type": "address", "internalType": "address" }, { "name": "uri", "type": "string", "internalType": "string" }], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "nonpayable" },
    { "type": "function", "name": "owner", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" },
    { "type": "function", "name": "nextTokenId", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" },
    { "type": "event", "name": "InvoiceMinted", "inputs": [{ "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" }, { "name": "to", "type": "address", "indexed": true, "internalType": "address" }, { "name": "uri", "type": "string", "indexed": false, "internalType": "string" }], "anonymous": false }
] as const;
