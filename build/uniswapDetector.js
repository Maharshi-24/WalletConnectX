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

    // Function to monitor for Uniswap detection attempts
    function monitorForUniswapDetection() {
        const originalGetItem = localStorage.getItem;

        // Override localStorage.getItem to detect when Uniswap is checking for wallets
        localStorage.getItem = function (key) {
            if (key && typeof key === 'string' && key.includes('WALLETS_REGISTERED')) {
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
                            id: 'WalletX',
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
    }

    // Initialize
    try {
        monitorForUniswapDetection();

        // Trigger a check for existing wallet registry
        const existingWallets = localStorage.getItem('WALLETS_REGISTERED');

        // Register WalletX as available in window
        if (window.ethereum) {
            window.ethereum.isWalletX = true;
            window.ethereum._walletInfo = walletInfo;
            console.log('WalletX: Successfully added wallet metadata to ethereum provider');
        }
    } catch (error) {
        console.error('WalletX: Error initializing Uniswap detector', error);
    }
})(); 