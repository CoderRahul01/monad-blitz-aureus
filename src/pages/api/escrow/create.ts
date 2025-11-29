import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createWalletFromPrivateKey } from '@/lib/wallet-utils';
import { waitForTransaction } from '@/lib/monad';
import { parseEther } from 'viem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { payerAgentId, providerAgentId, amount } = req.body;

    if (!payerAgentId || !providerAgentId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Get payer wallet
        const { data: payerWallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('agent_id', payerAgentId)
            .single();

        if (walletError || !payerWallet) {
            return res.status(404).json({ error: 'Payer wallet not found' });
        }

        if (payerWallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // 2. Get provider wallet for address
        const { data: providerWallet, error: providerError } = await supabase
            .from('wallets')
            .select('evm_address')
            .eq('agent_id', providerAgentId)
            .single();

        if (providerError || !providerWallet) {
            return res.status(404).json({ error: 'Provider wallet not found' });
        }

        // 3. Send real blockchain transaction (transfer MON from payer to provider as escrow demo)
        // In a real escrow contract, this would call a smart contract instead
        let txHash: `0x${string}`;

        if (payerWallet.evm_private_key && payerWallet.evm_address !== '0x0000000000000000000000000000000000000000') {
            try {
                const { walletClient } = createWalletFromPrivateKey(payerWallet.evm_private_key as `0x${string}`);

                // Send transaction to lock funds
                // For demo: we're sending MON directly. In production, this would interact with an escrow smart contract
                const amountInMON = (amount * 0.0001).toString(); // Convert dUSD to MON (simulated rate)

                txHash = await walletClient.sendTransaction({
                    to: providerWallet.evm_address as `0x${string}`,
                    value: parseEther(amountInMON),
                    gas: BigInt(21000), // Standard gas limit for a simple native currency transfer
                });

                // Wait for confirmation
                await waitForTransaction(txHash);

            } catch (error: any) {
                console.error('Blockchain transaction failed:', error);
                return res.status(500).json({
                    error: 'Transaction failed',
                    details: error.message,
                    hint: 'Make sure the wallet has sufficient MON for gas fees'
                });
            }
        } else {
            // Fallback to simulation if no real wallet configured
            txHash = ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) as `0x${string}`;
        }

        // 4. Deduct from payer balance (dUSD tracking)
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: payerWallet.balance - amount })
            .eq('id', payerWallet.id);

        if (updateError) {
            throw updateError;
        }

        // 5. Create escrow record
        const { data: escrow, error: escrowError } = await supabase
            .from('escrows')
            .insert({
                payer_agent: payerAgentId,
                provider_agent: providerAgentId,
                amount: amount,
                status: 'locked',
                tx_hash: txHash
            })
            .select()
            .single();

        if (escrowError) {
            throw escrowError;
        }

        return res.status(200).json(escrow);
    } catch (error: any) {
        console.error('Error creating escrow:', error);
        return res.status(500).json({ error: error.message });
    }
}
