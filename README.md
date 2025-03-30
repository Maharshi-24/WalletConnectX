# Ethereum Wallet Browser Extension

A browser extension for managing Ethereum wallets, allowing users to create new wallets, connect existing ones, and manage their crypto assets.

## Features

- Create new Ethereum wallets
- Connect existing wallets
- View wallet balance and transaction history
- Secure storage of private keys
- Seed phrase backup and recovery
- User-friendly dashboard interface

## Project Structure

```
eth-wallet-extension/
├── public/
│   ├── manifest.json     # Browser extension manifest file
│   ├── icon.png          # Extension icon
│   └── index.html        # Entry HTML
│
├── src/
│   ├── components/       # React components
│   ├── services/         # Wallet and storage services
│   ├── utils/            # Utility functions
│   ├── index.js          # React entry point
│   └── index.css         # Global styles
│
├── package.json
└── README.md
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Build the extension:
   ```bash
   npm run build
   ```

## Security

- Private keys are encrypted before storage
- Seed phrases are securely stored
- No sensitive data is transmitted to external servers

## Technologies

- React.js
- Ethers.js
- Web3.js
- Chrome Extension API