import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, parseEther } from 'viem';
import { monadTestnet } from './monad';

/**
 * Generate a new EVM wallet
 * Returns both the address and private key
 */
export function generateWallet() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    return {
        address: account.address,
        privateKey: privateKey,
    };
}

/**
 * Create a wallet client from a private key
 */
export function createWalletFromPrivateKey(privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http(),
    });

    return { walletClient, account };
}

/**
 * Send native MON tokens from one wallet to another
 */
export async function sendTransaction(
    privateKey: `0x${string}`,
    to: `0x${string}`,
    amount: string // in MON, e.g., "0.01"
) {
    const { walletClient } = createWalletFromPrivateKey(privateKey);

    const hash = await walletClient.sendTransaction({
        to,
        value: parseEther(amount),
    });

    return hash;
}
