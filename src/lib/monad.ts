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
