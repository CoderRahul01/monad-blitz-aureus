import type { NextApiRequest, NextApiResponse } from 'next';

// Types
type EscrowStatus = 'locked' | 'released';

interface Escrow {
  id: string;
  payer: string;
  provider: string;
  amount: number;
  status: EscrowStatus;
  createdAt: number;
  txHash: string;
  releaseTxHash?: string;
}

interface State {
  balances: {
    AgentA: number;
    AgentB: number;
  };
  escrows: Escrow[];
}

// In-memory state (persists while dev server is running)
let globalState: State = {
  balances: {
    AgentA: 1000,
    AgentB: 100,
  },
  escrows: [],
};

// Helper to generate random 12-byte hex hash
const generateTxHash = () => {
  return '0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<State | { error: string } | { txHash: string } | { releaseTxHash: string }>
) {
  if (req.method === 'GET') {
    return res.status(200).json(globalState);
  }

  if (req.method === 'POST') {
    const { action } = req.query;

    if (action === 'create') {
      // Lock funds: Agent A -> Escrow
      const amount = 10;
      if (globalState.balances.AgentA < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      const txHash = generateTxHash();
      const newEscrow: Escrow = {
        id: `escrow_${Date.now()}`,
        payer: 'AgentA',
        provider: 'AgentB',
        amount,
        status: 'locked',
        createdAt: Date.now(),
        txHash,
      };

      globalState.balances.AgentA -= amount;
      globalState.escrows.unshift(newEscrow); // Add to top

      return res.status(200).json({ ...globalState, txHash } as any);
    }

    if (action === 'release') {
      // Release funds: Escrow -> Agent B
      const { id } = req.body;
      const escrow = globalState.escrows.find((e) => e.id === id);

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      if (escrow.status === 'released') {
        return res.status(400).json({ error: 'Escrow already released' });
      }

      const releaseTxHash = generateTxHash();
      escrow.status = 'released';
      escrow.releaseTxHash = releaseTxHash;
      globalState.balances.AgentB += escrow.amount;

      return res.status(200).json({ ...globalState, releaseTxHash } as any);
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
