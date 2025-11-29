import { createPublicClient, http, defineChain } from 'viem';

export const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz'] },
        public: { http: ['https://testnet-rpc.monad.xyz'] },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
    },
});

export const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
});

export const MONAD_EXPLORER_URL = 'https://testnet.monadexplorer.com';

/**
 * Wait for a transaction to be confirmed
 * @param hash - Transaction hash
 * @returns Transaction receipt
 */
export async function waitForTransaction(hash: `0x${string}`) {
    const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
    });
    return receipt;
}

/**
 * Get the current gas price on Monad Testnet
 * Note: Monad requires a minimum of 50 gwei base fee
 */
export async function getGasPrice() {
    const gasPrice = await publicClient.getGasPrice();
    const minGasPrice = BigInt(50_000_000_000); // 50 gwei minimum
    return gasPrice > minGasPrice ? gasPrice : minGasPrice;
}
