import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

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

        // 2. Deduct from payer wallet
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: payerWallet.balance - amount })
            .eq('id', payerWallet.id);

        if (updateError) {
            throw updateError;
        }

        // 3. Simulate Monad Transaction
        // In a real app, we would sign and send a transaction here using viem
        // const account = privateKeyToAccount(payerWallet.evm_private_key as `0x${string}`);
        // const hash = await walletClient.sendTransaction(...)

        // For demo, we generate a random hash that looks like a Monad TX
        const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        // 4. Create escrow
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
