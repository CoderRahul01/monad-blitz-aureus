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
  evm_address text, -- Monad Address
  evm_private_key text, -- Private Key (in production, use encryption or KMS)
  updated_at timestamptz default now()
);

-- 3. Escrows Table
create table escrows (
  id uuid primary key default gen_random_uuid(),
  payer_agent uuid references agents(id) not null,
  provider_agent uuid references agents(id) not null,
  amount numeric not null,
  status text default 'locked', -- 'locked' | 'released'
  tx_hash text, -- Monad Transaction Hash for escrow creation
  release_tx_hash text, -- Monad Transaction Hash for escrow release
  created_at timestamptz default now()
);

-- Seed Data
-- IMPORTANT: Replace the private keys below with real generated ones using the wallet utility
-- The private keys below are EXAMPLES and should NOT be used in production

-- Insert Agent A
WITH new_agent_a AS (
  INSERT INTO agents (name) VALUES ('Agent A') RETURNING id
)
INSERT INTO wallets (agent_id, balance, evm_address, evm_private_key) 
SELECT id, 1000, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000001' FROM new_agent_a;

-- Insert Agent B
WITH new_agent_b AS (
  INSERT INTO agents (name) VALUES ('Agent B') RETURNING id
)
INSERT INTO wallets (agent_id, balance, evm_address, evm_private_key) 
SELECT id, 100, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000002' FROM new_agent_b;

-- NOTE: After running this schema, you should:
-- 1. Generate real wallets using the wallet utility
-- 2. Update the evm_address and evm_private_key fields
-- 3. Fund the wallets with MON testnet tokens for gas fees
