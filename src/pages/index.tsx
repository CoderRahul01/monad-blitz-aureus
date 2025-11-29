import { useState, useEffect } from 'react';
import Head from 'next/head';
import { MONAD_EXPLORER_URL } from '@/lib/monad';

// Types
interface Wallet {
  id: string;
  balance: number;
  currency: string;
  evm_address?: string;
}

interface Agent {
  id: string;
  name: string;
  wallets: Wallet[];
}

interface Escrow {
  id: string;
  payer_agent: string;
  provider_agent: string;
  amount: number;
  status: 'locked' | 'released';
  tx_hash?: string;
  release_tx_hash?: string;
  created_at: string;
}

interface State {
  agents: Agent[];
  escrows: Escrow[];
}

export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Ready');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'warning'>('info');

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
    } catch (error) {
      console.error('Failed to fetch state', error);
      setStatus('Error fetching state', 'error');
    }
  };

  const setStatus = (msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setStatusMsg(msg);
    setStatusType(type);
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Helper to find agents
  const agentA = state?.agents.find(a => a.name === 'Agent A') || state?.agents[0];
  const agentB = state?.agents.find(a => a.name === 'Agent B') || state?.agents[1];

  const handleRequestCompute = async () => {
    if (!agentA || !agentB) return;

    setLoading(true);
    setStatus('🔄 Submitting transaction to Monad network...', 'info');

    try {
      const res = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerAgentId: agentA.id,
          providerAgentId: agentB.id,
          amount: 10
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`✅ Transaction confirmed! ${data.tx_hash?.slice(0, 10)}...`, 'success');
        await fetchState();
      } else {
        setStatus(`❌ Error: ${data.error || 'Transaction failed'}`, 'error');
        if (data.hint) {
          setTimeout(() => setStatus(`💡 Hint: ${data.hint}`, 'warning'), 2000);
        }
      }
    } catch (error: any) {
      setStatus(`❌ Network error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (escrowId: string) => {
    setLoading(true);
    setStatus('🔄 Releasing funds on Monad...', 'info');

    try {
      const res = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`✅ Funds released successfully!`, 'success');
        await fetchState();
      } else {
        setStatus(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error: any) {
      setStatus(`❌ Network error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!state) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 18, marginBottom: 10 }}>⚡ Loading Aureus System...</div>
      <div style={{ fontSize: 14, color: '#888' }}>Connecting to Monad Testnet</div>
    </div>
  );

  const statusBgColor = {
    info: '#e3f2fd',
    success: '#d4edda',
    error: '#f8d7da',
    warning: '#fff3cd'
  }[statusType];

  const statusTextColor = {
    info: '#1976d2',
    success: '#155724',
    error: '#721c24',
    warning: '#856404'
  }[statusType];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <Head>
        <title>AUREUS: Autonomous Agent Payment Layer</title>
      </Head>

      <header style={{ marginBottom: 40, borderBottom: '1px solid #ddd', paddingBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: '-0.5px' }}>⚡ AUREUS</h1>
        <p style={{ margin: '5px 0 0', color: '#666', fontSize: 18 }}>The payment layer for autonomous agents.</p>
        <div style={{ marginTop: 10 }}>
          <span style={{ background: '#836EF9', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>
            MONAD TESTNET
          </span>
        </div>
      </header>

      {/* Brand Story */}
      <section style={{ marginBottom: 40, background: '#f8f9fa', padding: 20, borderRadius: 8, borderLeft: '4px solid #333' }}>
        <h3 style={{ marginTop: 0 }}>Why Aureus?</h3>
        <p style={{ lineHeight: 1.6, color: '#444' }}>
          AI agents today can think, plan, and act — but they can't transact.
          They're like brilliant minds stuck in an economy where they can't hold money, buy services, or pay each other for work.
          <strong> Aureus gives them economic autonomy on Monad.</strong>
        </p>
      </section>

      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#555' }}>{agentA?.name || 'Agent A'} (Payer)</h2>
          <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>
            {agentA?.wallets[0]?.balance ?? 0} <span style={{ fontSize: 16, color: '#888' }}>dUSD</span>
          </div>
          {agentA?.wallets[0]?.evm_address && (
            <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'monospace', color: '#888', wordBreak: 'break-all' }}>
              <a href={`${MONAD_EXPLORER_URL}/address/${agentA.wallets[0].evm_address}`} target="_blank" rel="noreferrer" style={{ color: '#836EF9', textDecoration: 'none' }}>
                {agentA.wallets[0].evm_address.slice(0, 6)}...{agentA.wallets[0].evm_address.slice(-4)}
              </a>
            </div>
          )}
        </div>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#555' }}>{agentB?.name || 'Agent B'} (Provider)</h2>
          <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>
            {agentB?.wallets[0]?.balance ?? 0} <span style={{ fontSize: 16, color: '#888' }}>dUSD</span>
          </div>
          {agentB?.wallets[0]?.evm_address && (
            <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'monospace', color: '#888', wordBreak: 'break-all' }}>
              <a href={`${MONAD_EXPLORER_URL}/address/${agentB.wallets[0].evm_address}`} target="_blank" rel="noreferrer" style={{ color: '#836EF9', textDecoration: 'none' }}>
                {agentB.wallets[0].evm_address.slice(0, 6)}...{agentB.wallets[0].evm_address.slice(-4)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: 40, padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: 0 }}>Request Compute Job</h3>
            <p style={{ margin: '5px 0 0', color: '#666', fontSize: 14 }}>Locks 10 dUSD in escrow until completion</p>
          </div>
          <button
            onClick={handleRequestCompute}
            disabled={loading || (agentA?.wallets[0]?.balance ?? 0) < 10}
            style={{
              ...buttonStyle,
              opacity: loading || (agentA?.wallets[0]?.balance ?? 0) < 10 ? 0.5 : 1,
              cursor: loading || (agentA?.wallets[0]?.balance ?? 0) < 10 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Processing...' : 'Request Compute (Lock 10 dUSD)'}
          </button>
        </div>
        <div style={{
          marginTop: 20,
          padding: 12,
          background: statusBgColor,
          color: statusTextColor,
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 500
        }}>
          {statusMsg}
        </div>
      </div>

      {/* Escrow List */}
      <div style={{ marginBottom: 60 }}>
        <h3 style={{ borderBottom: '2px solid #333', paddingBottom: 10, marginBottom: 20 }}>Escrow Ledger</h3>
        {state.escrows.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No transactions yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {state.escrows.map((escrow) => (
              <div key={escrow.id} style={{ background: '#fff', padding: 15, borderRadius: 8, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: 13 }}>{escrow.id.slice(0, 8)}...</span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 'bold',
                    background: escrow.status === 'locked' ? '#fff3cd' : '#d4edda',
                    color: escrow.status === 'locked' ? '#856404' : '#155724'
                  }}>
                    {escrow.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14, color: '#555' }}>
                  <div>Amount: <strong>{escrow.amount} dUSD</strong></div>
                  <div>Time: {new Date(escrow.created_at).toLocaleTimeString()}</div>
                  {escrow.tx_hash && (
                    <div style={{ gridColumn: '1 / -1', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                      Lock Tx: <a href={`${MONAD_EXPLORER_URL}/tx/${escrow.tx_hash}`} target="_blank" rel="noreferrer" style={{ color: '#836EF9', textDecoration: 'underline' }}>
                        {escrow.tx_hash.slice(0, 10)}...{escrow.tx_hash.slice(-8)}
                      </a>
                    </div>
                  )}
                  {escrow.release_tx_hash && (
                    <div style={{ gridColumn: '1 / -1', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: '#28a745' }}>
                      Release Tx: <a href={`${MONAD_EXPLORER_URL}/tx/${escrow.release_tx_hash}`} target="_blank" rel="noreferrer" style={{ color: '#28a745', textDecoration: 'underline' }}>
                        {escrow.release_tx_hash.slice(0, 10)}...{escrow.release_tx_hash.slice(-8)}
                      </a>
                    </div>
                  )}
                </div>

                {escrow.status === 'locked' && (
                  <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10, textAlign: 'right' }}>
                    <button
                      onClick={() => handleRelease(escrow.id)}
                      disabled={loading}
                      style={{
                        ...buttonStyle,
                        background: '#28a745',
                        fontSize: 13,
                        padding: '8px 16px',
                        opacity: loading ? 0.5 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? '⏳ Processing...' : 'Provider Complete (Release Funds)'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo Script Footer */}
      <footer style={{ borderTop: '1px solid #eee', paddingTop: 20, color: '#888', fontSize: 14 }}>
        <h4>Demo Script (For Judges)</h4>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li><strong>Intro:</strong> "Agents can think, but they can't transact. Aureus is the payment layer for the autonomous economy on Monad."</li>
          <li><strong>Action:</strong> Click <em>Request Compute</em>. "Agent A locks 10 dUSD in trustless escrow."</li>
          <li><strong>Result:</strong> "Funds are secure. Provider starts work. Transaction confirmed on Monad Testnet."</li>
          <li><strong>Completion:</strong> Click <em>Provider Complete</em>. "Job done. Funds release instantly to Agent B. Zero friction."</li>
        </ol>
      </footer>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  textAlign: 'center' as const,
};

const buttonStyle = {
  background: '#000',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 5,
  fontSize: 14,
  fontWeight: 600,
  transition: 'opacity 0.2s',
};
