import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch agents with their wallets
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        wallets (
          id,
          balance,
          currency,
          evm_address
        )
      `)
      .order('name');

    if (agentsError) throw agentsError;

    // Fetch escrows
    const { data: escrows, error: escrowsError } = await supabase
      .from('escrows')
      .select('*')
      .order('created_at', { ascending: false });

    if (escrowsError) throw escrowsError;

    return res.status(200).json({
      agents,
      escrows
    });
  } catch (error: any) {
    console.error('Error fetching state:', error);
    return res.status(500).json({ error: error.message });
  }
}
