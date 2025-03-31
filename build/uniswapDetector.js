(function () {
    // WalletX Uniswap Detection Helper
    console.log('WalletX: Uniswap detection helper loaded');

    // This script injects metadata to help Uniswap recognize WalletX

    // Define wallet details
    const walletInfo = {
        name: 'WalletX',
        icon: chrome.runtime.getURL('icon.svg'),
        description: 'A secure multi-chain crypto wallet for Ethereum and other EVM networks',
        uuid: '5099a4b6-4375-45dd-a505-1f8d095a1098' // Unique ID for the wallet
    };

    // Make sure window.ethereum is exposed before we start
    function ensureEthereumExists() {
        if (!window.ethereum) {
            console.error('WalletX: window.ethereum is not available yet');
            // Wait and try again
            setTimeout(ensureEthereumExists, 100);
            return;
        }

        // Set essential MetaMask compatibility properties
        window.ethereum.isWalletX = true;
        window.ethereum.isMetaMask = true; // This is critical for dApp detection
        window.ethereum._walletInfo = walletInfo;

        // Add to window.ethereum.providers if it exists (for multi-wallet environments)
        if (window.ethereum.providers) {
            const exists = window.ethereum.providers.some(p => p.isWalletX);
            if (!exists) {
                window.ethereum.providers.push(window.ethereum);
            }
        } else {
            window.ethereum.providers = [window.ethereum];
        }

        console.log('WalletX: Successfully configured ethereum provider for dApp detection');
        monitorForUniswapDetection();
    }

    // Function to monitor for Uniswap detection attempts
    function monitorForUniswapDetection() {
        const originalGetItem = localStorage.getItem;

        // Override localStorage.getItem to detect when Uniswap is checking for wallets
        localStorage.getItem = function (key) {
            if (key && typeof key === 'string' &&
                (key.includes('WALLETS_REGISTERED') || key.includes('WALLET_CONNECTORS'))) {

                console.log('WalletX: Uniswap checking for wallets, injecting WalletX');

                // Get existing wallets or create empty array
                const currentWallets = originalGetItem.call(localStorage, key);
                let wallets = [];

                if (currentWallets) {
                    try {
                        wallets = JSON.parse(currentWallets);
                    } catch (e) {
                        console.error('WalletX: Error parsing existing wallets', e);
                    }
                }

                // Check if WalletX is already in the list
                const walletExists = wallets.some(wallet =>
                    wallet.name === walletInfo.name || wallet.uuid === walletInfo.uuid);

                if (!walletExists) {
                    // Add WalletX to the list
                    wallets.push({
                        ...walletInfo,
                        installed: true,
                        installLink: null,
                        injectedConnector: {
                            id: 'MetaMask', // Use MetaMask ID for compatibility
                            supportedChainIds: [1, 3, 4, 5, 42, 56, 137, 43114, 10, 42161]
                        }
                    });

                    // Store updated list
                    localStorage.setItem(key, JSON.stringify(wallets));

                    console.log('WalletX: Added to Uniswap wallet list');
                    return JSON.stringify(wallets);
                }
            }

            return originalGetItem.call(localStorage, key);
        };

        // Also add direct detection for Uniswap's DETECTED_WALLETS key
        if ('DETECTED_WALLETS' in localStorage || 'WALLETS_REGISTERED' in localStorage) {
            try {
                const detectedWalletsKey = 'DETECTED_WALLETS' in localStorage
                    ? 'DETECTED_WALLETS'
                    : 'WALLETS_REGISTERED';

                const walletsData = localStorage.getItem(detectedWalletsKey);

                if (walletsData) {
                    const wallets = JSON.parse(walletsData);

                    // Check if our wallet is already in the list
                    const walletExists = wallets.some(wallet =>
                        wallet.name === walletInfo.name || wallet.uuid === walletInfo.uuid);

                    if (!walletExists) {
                        wallets.push({
                            ...walletInfo,
                            installed: true,
                            installLink: null,
                            injectedConnector: {
                                id: 'MetaMask', // Use MetaMask ID for compatibility
                                supportedChainIds: [1, 3, 4, 5, 42, 56, 137, 43114, 10, 42161]
                            }
                        });

                        localStorage.setItem(detectedWalletsKey, JSON.stringify(wallets));
                        console.log(`WalletX: Added to ${detectedWalletsKey}`);
                    }
                }
            } catch (error) {
                console.error('WalletX: Error adding to detected wallets:', error);
            }
        }
    }

    // Start the process
    ensureEthereumExists();
})(); 