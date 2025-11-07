# 🌍 CarbonChain Web3 DApp

CarbonChain is a decentralized platform built on **Polkadot** to monitor carbon sensors and convert captured CO₂ into energy for crypto mining.

## Features
- Real-time IoT sensor dashboard
- Wallet connection via Polkadot.js
- On-chain data verification
- Energy and reward tracking

## Tech Stack
React, Polkadot.js API, Web3

## Run locally
```bash
npm install
npm start
```

## Installation
### necessary to install 
npm 11.6.2
node v20.19.5

### create with vite
```bash
npm create vite@latest carbonchain -- --template react
```

```bash
cd carbonchain
#install tailwindcss
npm install tailwindcss @tailwindcss/vite
```

#Configure the Vite plugin
#Add the @tailwindcss/vite plugin to your Vite configuration.

- vite.config.ts

```bash
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

Import Tailwind CSS
Add an @import to your CSS file that imports Tailwind CSS.

CSS
```bash
@import "tailwindcss";
```
Start your build process
Run your build process with npm run dev or whatever command is configured in your package.json file.

Terminal
```bash
npm run build
npm run dev -- --host 0.0.0.0
```

Install Polkadot

```cmd
npm install @polkadot/api @polkadot/extension-dapp
```
