import { useState, useEffect } from 'react';
import Head from 'next/head';

// Types (mirroring backend)
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

export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Ready');

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
    } catch (error) {
      console.error('Failed to fetch state', error);
      setStatusMsg('Error fetching state');
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleRequestCompute = async () => {
    setLoading(true);
    setStatusMsg('Locking funds in escrow...');
    try {
      const res = await fetch('/api/state?action=create', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setState(data); // API returns updated state
        setStatusMsg(`Funds locked! Tx: ${data.txHash}`);
      } else {
        setStatusMsg(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatusMsg('Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    setLoading(true);
    setStatusMsg('Releasing funds to provider...');
    try {
      const res = await fetch('/api/state?action=release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setState(data);
        setStatusMsg(`Funds released! Tx: ${data.releaseTxHash}`);
      } else {
        setStatusMsg(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatusMsg('Release failed');
    } finally {
      setLoading(false);
    }
  };

  if (!state) return <div style={{ padding: 20 }}>Loading Aureus System...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <Head>
        <title>AUREUS: Autonomous Agent Payment Layer</title>
      </Head>

      <header style={{ marginBottom: 40, borderBottom: '1px solid #ddd', paddingBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: '-0.5px' }}>⚡ AUREUS</h1>
        <p style={{ margin: '5px 0 0', color: '#666', fontSize: 18 }}>The payment layer for autonomous agents.</p>
      </header>

      {/* Brand Story */}
      <section style={{ marginBottom: 40, background: '#f8f9fa', padding: 20, borderRadius: 8, borderLeft: '4px solid #333' }}>
        <h3 style={{ marginTop: 0 }}>Why Aureus?</h3>
        <p style={{ lineHeight: 1.6, color: '#444' }}>
          AI agents today can think, plan, and act — but they can’t transact.
          They’re like brilliant minds stuck in an economy where they can’t hold money, buy services, or pay each other for work.
          <strong> Aureus gives them economic autonomy.</strong>
        </p>
      </section>

      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#555' }}>Agent A (Payer)</h2>
          <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>
            {state.balances.AgentA} <span style={{ fontSize: 16, color: '#888' }}>dUSD</span>
          </div>
        </div>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#555' }}>Agent B (Provider)</h2>
          <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>
            {state.balances.AgentB} <span style={{ fontSize: 16, color: '#888' }}>dUSD</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: 40, padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>Request Compute Job</h3>
            <p style={{ margin: '5px 0 0', color: '#666', fontSize: 14 }}>Locks 10 dUSD in escrow until completion</p>
          </div>
          <button
            onClick={handleRequestCompute}
            disabled={loading || state.balances.AgentA < 10}
            style={buttonStyle}
          >
            {loading ? 'Processing...' : 'Request Compute (Lock 10 dUSD)'}
          </button>
        </div>
        <div style={{ marginTop: 20, padding: 10, background: '#f8f9fa', borderRadius: 4, fontFamily: 'monospace', fontSize: 13 }}>
          Status: {statusMsg}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{escrow.id}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: escrow.status === 'locked' ? '#fff3cd' : '#d4edda',
                    color: escrow.status === 'locked' ? '#856404' : '#155724'
                  }}>
                    {escrow.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14, color: '#555' }}>
                  <div>Amount: <strong>{escrow.amount} dUSD</strong></div>
                  <div>Time: {new Date(escrow.createdAt).toLocaleTimeString()}</div>
                  <div style={{ gridColumn: '1 / -1', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                    Lock Tx: {escrow.txHash}
                  </div>
                  {escrow.releaseTxHash && (
                    <div style={{ gridColumn: '1 / -1', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', color: '#28a745' }}>
                      Release Tx: {escrow.releaseTxHash}
                    </div>
                  )}
                </div>

                {escrow.status === 'locked' && (
                  <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10, textAlign: 'right' }}>
                    <button
                      onClick={() => handleRelease(escrow.id)}
                      disabled={loading}
                      style={{ ...buttonStyle, background: '#28a745', fontSize: 13, padding: '8px 16px' }}
                    >
                      Provider Complete (Release Funds)
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
          <li><strong>Intro:</strong> "Agents can think, but they can't transact. Aureus is the payment layer for the autonomous economy."</li>
          <li><strong>Action:</strong> Click <em>Request Compute</em>. "Agent A locks 10 dUSD in trustless escrow."</li>
          <li><strong>Result:</strong> "Funds are secure. Provider starts work."</li>
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
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  transition: 'opacity 0.2s',
};
