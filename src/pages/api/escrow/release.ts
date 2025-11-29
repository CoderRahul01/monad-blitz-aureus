import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { escrowId } = req.body;

    if (!escrowId) {
        return res.status(400).json({ error: 'Missing escrowId' });
    }

    try {
        // 1. Get escrow
        const { data: escrow, error: fetchError } = await supabase
            .from('escrows')
            .select('*')
            .eq('id', escrowId)
            .single();

        if (fetchError || !escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

        if (escrow.status === 'released') {
            return res.status(400).json({ error: 'Escrow already released' });
        }

        // 2. Update escrow status
        const { error: updateEscrowError } = await supabase
            .from('escrows')
            .update({ status: 'released' })
            .eq('id', escrowId);

        if (updateEscrowError) {
            throw updateEscrowError;
        }

        // 3. Credit provider wallet
        // First get provider wallet
        const { data: providerWallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('agent_id', escrow.provider_agent)
            .single();

        if (walletError || !providerWallet) {
            throw new Error('Provider wallet not found');
        }

        // Update balance
        const { error: updateWalletError } = await supabase
            .from('wallets')
            .update({ balance: providerWallet.balance + escrow.amount })
            .eq('id', providerWallet.id);

        if (updateWalletError) {
            throw updateWalletError;
        }

        return res.status(200).json({ success: true, escrowId });
    } catch (error: any) {
        console.error('Error releasing escrow:', error);
        return res.status(500).json({ error: error.message });
    }
}
