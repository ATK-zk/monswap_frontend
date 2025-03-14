# Monswap (Frontend)

The frontend for Monswap, a decentralized exchange (DEX) built on Monad Testnet. This React app provides a user interface to interact with the Monswap smart contracts.

## Overview
- **Purpose:** A sleek UI for swapping tokens on Monswap, inspired by BeanSwap.
- **Backend:** Smart contracts are maintained at [monswap](https://github.com/ATK-zk/monswap).
- **Live Demo:** [https://monswap.vercel.app/](https://monswap.vercel.app/)

## Features
- Connect wallets (MetaMask, Rabby, Phantom, Backpack, etc.) via RainbowKit
- Swap WMON ↔ MONs on Monad Testnet
- Responsive design with Tailwind CSS

## Tech Stack
- React
- Tailwind CSS (Styling)
- Vercel (Deployment)

## Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/ATK-zk/monswap_frontend.git
   cd monswap_frontend

2. **Install dependencies:**
    ```bash
    npm install

3. **Run locally:**
    ```bash
    npm start

Open http://localhost:3000 in your browser.

## Deployment

1. **Deployed on Vercel:**
    ```bash
    npm run build
    vercel --prod

## Network
    Monad Testnet

    Chain ID: 10143
    
    RPC: https://testnet-rpc.monad.xyz

## Usage
    Connect your wallet (e.g., MetaMask) and switch to Monad Testnet.

    Enter the amount of WMON to swap for MONs.

    Approve and confirm the transaction.

## Contributing
    Open issues or pull requests to suggest improvements or fixes!

## License
    MIT 




