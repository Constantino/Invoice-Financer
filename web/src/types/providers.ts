export interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export interface PrivyWallet {
    getEthereumProvider: () => Promise<EthereumProvider>;
}
