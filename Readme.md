🌐 Overview

Tech Stack

React + Vite (frontend framework)

TailwindCSS (UI styling)

Polkadot.js API (@polkadot/api and @polkadot/extension-dapp)

Apollo Client (for GraphQL queries from backend)

Recharts (for data visualization)

IPFS Gateway (for viewing telemetry proofs)

Framer Motion (animations)

shadcn/ui (clean UI components)

Ethers.js (optional) if bridging EVM chains

🧠 App Structure
src/
├── components/
│   ├── Navbar.tsx
│   ├── WalletConnect.tsx
│   ├── DashboardCard.tsx
│   ├── SensorChart.tsx
│   └── Loader.tsx
├── pages/
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── DeviceDetail.tsx
│   ├── Governance.tsx
│   └── Marketplace.tsx
├── hooks/
│   ├── usePolkadot.ts
│   └── useGraphQL.ts
├── utils/
│   ├── format.ts
│   └── constants.ts
├── App.tsx
├── index.css
└── main.tsx

🧩 Key Features

Polkadot Wallet Connect

Connect using Polkadot.js browser extension.

Show wallet address, chain, balance.

Sign transactions for minting / DAO votes.

Live Carbon Dashboard

Graphs for CO₂ ppm, energy conversion (kWh), and total CET earned.

Pulls from backend GraphQL API.

Device Management

List registered IoT sensors (from chain).

View individual device stats and telemetry.

Display IPFS links for proof-of-data.

Token Dashboard (CET)

Show CET balance from on-chain query.

Transfer CET or stake in DAO pools.

DAO Governance Panel

View proposals and vote using wallet.

Submit governance proposals (e.g. energy policy updates).

Marketplace (Future)

Exchange CET with other sustainability tokens.

List verified carbon credits
