# WalletConnectX - Cross Blockchain Wallet Browser Extension

A modern, secure, and user-friendly browser extension for managing Crypto wallets. Built with React and styled with Radix UI components.

## Features

- 🔐 Secure wallet creation and management
- 🔑 Wallet connection with QR code support
- 📱 Modern, responsive UI with dark mode
- 🛡️ Built-in security verification
- 💼 Dashboard for wallet management
- 🔄 Real-time transaction monitoring

## Tech Stack

- React 18
- Radix UI Components
- Stitches (CSS-in-JS)
- Ethers.js
- TailwindCSS
- React Icons

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, or Safari)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/WalletConnectX.git
cd WalletConnectX
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

## Development

The project uses a standard React application structure:

- `src/components/` - React components
- `src/services/` - Utility services and API calls
- `src/styles/` - Global styles and theme configuration
- `public/` - Static assets

### Key Components

- `App.jsx` - Main application component
- `WalletConnect.jsx` - Wallet connection interface
- `WalletCreate.jsx` - New wallet creation
- `WalletVerification.jsx` - Security verification
- `Dashboard.jsx` - Main wallet dashboard

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The build output will be in the `build/` directory.

## Browser Extension Setup

1. Open your browser's extension management page
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build` directory from this project

## Security Considerations

- All sensitive data is encrypted before storage
- Wallet verification is required for new wallets
- Secure key management practices are implemented
- Regular security audits are recommended

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [Ethers.js](https://docs.ethers.org/) for Ethereum interaction
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [React](https://reactjs.org/) for the UI framework