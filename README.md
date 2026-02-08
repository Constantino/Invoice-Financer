# Invoice Financer

**Real-world invoice financing on-chain — bridging TradFi and DeFi.**

Invoice Financer is a full-stack platform that lets businesses use outstanding invoices as collateral to access liquidity. Borrowers get funded by DeFi lenders through ERC-4626 vaults; repayments are on-chain and transparent. Built for **Ethereum Sepolia**.

---

## Problem

- **Borrowers:** SMEs often wait 30–90 days for invoice payment, straining cash flow.
- **Lenders:** Traditional invoice financing is opaque and hard to access for crypto-native capital.
- **Trust:** Off-chain processes make verification and audit trails cumbersome.

## Solution

- **On-chain vaults (ERC-4626):** Each approved invoice gets a dedicated vault. Lenders deposit USDC and receive vault shares; funds are released to the borrower when the vault is fully funded.
- **Invoice NFTs:** Approved invoices are tokenized (ERC-721) for provenance and collateral representation.
- **Single app:** KYB, loan requests, admin approval, vault participation, repayments, and redemptions in one web app with role-based views (Borrower, Lender, Admin).

---

## How It Works

1. **Borrower** completes KYB and submits a loan request (invoice details + PDF).
2. **Admin** reviews and approves; the backend deploys a **Vault** via **VaultFactory** and optionally mints an **Invoice NFT**.
3. **Lenders** see vaults on the Vaults page, deposit USDC, and receive vault shares (ERC-4626).
4. When the vault is fully funded, the **backend** releases funds to the borrower.
5. **Borrower** repays via the app; USDC goes to the vault.
6. **Lenders** redeem shares for principal + yield once the vault is repaid.

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Chain**   | Ethereum Sepolia |
| **Contracts** | Solidity (Foundry), OpenZeppelin (ERC-4626, ERC-721, ERC-20) |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Privy (auth & embedded wallets), ethers.js |
| **Backend** | Node.js, Express, TypeScript |
| **Data**    | PostgreSQL (Supabase or local), Supabase Storage (S3-compatible) for invoice files |
| **Deploy**  | Foundry scripts, Etherscan verification |

---

## Project Structure

```
Invoice-Financer/
├── contracts/          # Foundry (Solidity)
│   ├── src/
│   │   ├── Vault.sol           # ERC-4626 vault per invoice
│   │   ├── VaultFactory.sol    # Deploys vaults (owner-only)
│   │   ├── InvoiceNFT.sol      # ERC-721 invoice tokens
│   │   ├── Treasury.sol       # Receives fees / holds assets
│   │   └── MockUSDC.sol       # Test token (Sepolia)
│   └── script/                # Deploy scripts
├── api/                 # Express API
│   └── src/
│       ├── controllers/       # KYB, loan requests, vaults, NFT, faucet
│       ├── services/           # DB, blockchain, file upload (Supabase)
│       ├── routes/             # REST endpoints
│       └── migrations/         # SQL migrations (Postgres)
└── web/                 # Next.js app
    └── src/
        ├── app/                # Routes: admin, borrower-kyb, loan-request, vaults, borrowers/loans, lenders/loans, faucet
        ├── components/        # UI, modals, charts, tables
        ├── services/           # loanService, vault (API + ethers)
        └── hooks/              # Wallet, ETH/USDC balance, toast
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Foundry** (for contracts): `curl -L https://foundry.paradigm.xyz | bash` then `foundryup`
- **PostgreSQL** or **Supabase** (for API DB and optional storage)

### 1. Clone and install

```bash
git clone <repo-url>
cd Invoice-Financer
```

### 2. Contracts (Ethereum Sepolia)

```bash
cd contracts
cp .env.example .env
# Set RPC_URL (e.g. https://rpc.sepolia.org), PRIVATE_KEY, ETHERSCAN_API_KEY
forge install OpenZeppelin/openzeppelin-contracts
make deploy-all    # Deploy MockUSDC, VaultFactory, InvoiceNFT, Treasury
make generate-all-abis   # Copy ABIs to web and api
```

### 3. API

```bash
cd api
cp .env.example .env
```

Configure:

- **Database:** `DATABASE_CONNECTION_STRING` (Supabase Postgres) or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Supabase (optional):** `SUPABASE_PROJECT_URL`, `SUPABASE_BUCKET_ENDPOINT`, `SUPABASE_BUCKET_ACCESS_KEY_ID`, `SUPABASE_BUCKET_SECRET_ACCESS_KEY` for file storage
- **Chain:** `RPC_URL`, `PRIVATE_KEY`, `VAULT_FACTORY_ADDRESS`, `USDC_ADDRESS`, `INVOICE_NFT_ADDRESS`, `TREASURY_ADDRESS`
- **CORS:** `FRONTEND_URL` (e.g. `http://localhost:3000`)

Run migrations (see `api/src/migrations/README.md`), then:

```bash
npm install
npm run dev
```

API runs at **http://localhost:3001**.

### 4. Web

```bash
cd web
cp .env.example .env
```

Set:

- `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID` (from [Privy](https://dashboard.privy.io))
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_USDC_ADDRESS`, `NEXT_PUBLIC_TREASURY_ADDRESS`, `NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111`

```bash
npm install
npm run dev
```

App runs at **http://localhost:3000**. Log in with Privy, switch role (Admin / Borrower / Lender) in the navbar, and use Faucet (Borrower/Lender) to get test USDC.

---

## Smart Contracts (overview)

| Contract       | Role |
|----------------|------|
| **VaultFactory** | Owner-only; deploys one **Vault** per approved invoice (name, symbol, borrower, max capacity, maturity). |
| **Vault** (ERC-4626) | Lenders deposit USDC and get shares. States: `FUNDING` → `ACTIVE` (funds released to borrower) → `REPAID` (lenders can redeem). |
| **InvoiceNFT** | ERC-721; mints invoice tokens (metadata URI) for approved loans. |
| **Treasury**   | Holds protocol assets / fees. |
| **MockUSDC**   | ERC-20 test token for Sepolia. |

---

## API Overview

| Area        | Examples |
|------------|----------|
| Health     | `GET /health` |
| Borrower   | `GET /borrower-kyb/check/:address`, `POST /borrower-kyb` |
| Loans      | `GET /loan-requests?status=...`, `GET /loan-requests/borrower/:address?include=vaults`, `POST /loan-requests`, `PATCH /loan-requests/:id/status` |
| Vaults     | `GET /vaults`, `POST /vaults/:address/deposit`, `POST /vaults/:address/redemptions`, `GET /vaults/portfolio/:address` |
| NFT        | `POST /nft/tokenize/:loanId`, `POST /loan-requests/:id/approve` |
| Faucet     | `POST /faucet` (body: `address`, `amount`) |

---

## Environment Summary

| App   | Key env vars |
|-------|----------------|
| **contracts** | `RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY` |
| **api**       | `PORT`, `DATABASE_CONNECTION_STRING` or `DB_*`, `FRONTEND_URL`, Supabase vars, chain addresses, `PINATA_*` (optional) |
| **web**       | `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USDC_ADDRESS`, `NEXT_PUBLIC_SEPOLIA_CHAIN_ID` |

---

## License

MIT.

---

**Built for ETHGlobal.**  
Bringing real-world invoice financing on-chain to tap into global DeFi liquidity.
