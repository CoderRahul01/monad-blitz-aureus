-- 1. Agents Table
create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Wallets Table
create table wallets (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) not null,
  balance numeric default 0,
  currency text default 'dUSD',
  evm_address text, -- New: Monad Address
  evm_private_key text, -- New: Encrypted/Simulated Private Key
  updated_at timestamptz default now()
);

-- 3. Escrows Table
create table escrows (
  id uuid primary key default gen_random_uuid(),
  payer_agent uuid references agents(id) not null,
  provider_agent uuid references agents(id) not null,
  amount numeric not null,
  status text default 'locked', -- 'locked' | 'released'
  tx_hash text, -- New: Monad Transaction Hash
  created_at timestamptz default now()
);

-- Seed Data (Optional - Run this to initialize Agent A and Agent B)
-- Insert Agent A
WITH new_agent_a AS (
  INSERT INTO agents (name) VALUES ('Agent A') RETURNING id
)
INSERT INTO wallets (agent_id, balance, evm_address, evm_private_key) 
SELECT id, 1000, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '0x...' FROM new_agent_a;

-- Insert Agent B
WITH new_agent_b AS (
  INSERT INTO agents (name) VALUES ('Agent B') RETURNING id
)
INSERT INTO wallets (agent_id, balance, evm_address, evm_private_key) 
SELECT id, 100, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', '0x...' FROM new_agent_b;
