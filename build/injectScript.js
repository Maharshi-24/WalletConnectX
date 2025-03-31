/**
 * WalletX Provider Injection Script
 * 
 * This script is injected into web pages to provide a wallet interface
 * that web3 applications can detect and interact with.
 */

console.log('WalletX: Provider injection script starting');

// Connect to the content script
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        try {
            // Add a unique ID for this message
            const id = `${message.type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            message.id = id;

            console.log('WalletX: Sending message to content script:', message);

            // Send the message to the content script
            window.postMessage(message, '*');

            // Set up listener for the response
            const responseHandler = function (event) {
                // Only accept messages from this window
                if (event.source !== window) return;

                // Skip messages without data or type
                if (!event.data || !event.data.type) return;

                // Check if this is a response to our message
                const isResponse = (
                    (event.data.type === 'WALLETX_CONNECT_RESPONSE' && message.type === 'WALLETX_CONNECT') ||
                    (event.data.type === 'WALLETX_REQUEST_RESPONSE' && message.type === 'WALLETX_REQUEST')
                ) && event.data.id === id;

                if (isResponse) {
                    console.log('WalletX: Received response from content script:', event.data);

                    // Remove the listener to avoid memory leaks
                    window.removeEventListener('message', responseHandler);
                    clearTimeout(timeoutId);

                    if (event.data.error) {
                        console.error('WalletX: Error in response:', event.data.error);
                        reject(event.data.error);
                    } else {
                        resolve(event.data.result || event.data);
                    }
                }
            };

            // Add the listener
            window.addEventListener('message', responseHandler);

            // Set a timeout to avoid hanging forever
            const timeoutId = setTimeout(() => {
                window.removeEventListener('message', responseHandler);
                console.error('WalletX: Request timed out after 30 seconds:', message);
                reject(new Error('Request timed out'));
            }, 30000); // 30 seconds timeout
        } catch (error) {
            console.error('WalletX: Error in sendMessage:', error);
            reject(error);
        }
    });
}

// Initialize WalletX Provider
const walletXProvider = {
    // Identify as WalletX but maintain MetaMask compatibility for DApps
    isWalletX: true,
    isMetaMask: true, // Set to true for better Uniswap compatibility
    isWalletConnect: false,
    isCoinbaseWallet: false,

    // Wallet metadata
    _walletName: 'WalletX',
    _walletVersion: '1.0.0',

    // Standard provider properties
    chainId: null,
    selectedAddress: null,
    connected: false,
    accounts: [],

    // UUID for unique identification
    uuid: '5099a4b6-4375-45dd-a505-1f8d095a1098',

    // Enhanced provider info for better dApp detection
    providerInfo: {
        uuid: '5099a4b6-4375-45dd-a505-1f8d095a1098',
        name: 'WalletX',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY4QTAwIiByeD0iMjQiLz48cGF0aCBkPSJNMzIgNDhMNjQgMjRMOTYgNDhMNjQgNzJMMzIgNDhaIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzIgODBMNjQgNTZMOTYgODBMNjQgMTA0TDMyIDgwWiIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
        description: 'A secure multi-chain crypto wallet for Ethereum and other EVM networks',
        website: 'https://walletx.example.com',
    },

    // Required standard methods
    async request(args) {
        console.log(`WalletX: Request method called: ${args.method}`, args);

        if (!args || typeof args !== 'object' || !args.method) {
            throw new Error('Invalid request parameters');
        }

        const { method, params = [] } = args;

        try {
            // Handle eth_requestAccounts - connect to wallet
            if (method === 'eth_requestAccounts') {
                // Request connection if not already connected
                if (!this.connected || !this.accounts.length) {
                    console.log('WalletX: Requesting account connection');
                    const result = await sendMessage({
                        type: 'WALLETX_CONNECT',
                        origin: window.location.origin
                    });

                    this.accounts = result || [];
                    this.selectedAddress = this.accounts[0] || null;
                    this.connected = !!this.accounts.length;

                    return this.accounts;
                }

                // Already connected, return existing accounts
                return this.accounts;
            }

            // Handle eth_accounts - return current accounts
            if (method === 'eth_accounts') {
                // No accounts if not connected
                if (!this.connected) {
                    return [];
                }
                return this.accounts;
            }

            // Handle all other web3 methods
            return await sendMessage({
                type: 'WALLETX_REQUEST',
                method,
                params,
                origin: window.location.origin
            });

        } catch (error) {
            console.error('WalletX: Error in request method:', error);
            throw error;
        }
    },

    // Legacy send method for compatibility
    send(method, params) {
        if (typeof method === 'string') {
            // Old-style signature: send(methodName, params)
            return this.request({
                method,
                params: params || []
            });
        } else {
            // EIP-1193 style: send({ method, params })
            return this.request(method);
        }
    },

    // Legacy sendAsync method for compatibility
    sendAsync(payload, callback) {
        if (!callback || typeof callback !== 'function') {
            return Promise.reject(new Error('Callback is required'));
        }

        try {
            // Handle batch requests
            if (Array.isArray(payload)) {
                Promise.all(payload.map(p => this.request(p)))
                    .then(results => callback(null, results.map((result, i) => ({
                        id: payload[i].id,
                        jsonrpc: '2.0',
                        result
                    }))))
                    .catch(error => callback(error, null));
                return;
            }

            // Single request
            this.request(payload)
                .then(result => callback(null, {
                    id: payload.id,
                    jsonrpc: '2.0',
                    result
                }))
                .catch(error => callback(error, null));
        } catch (error) {
            callback(error, null);
        }
    },

    // Standard event emitter methods
    _events: {},
    on(eventName, listener) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        this._events[eventName].push(listener);
        return this;
    },

    removeListener(eventName, listener) {
        if (this._events[eventName]) {
            this._events[eventName] = this._events[eventName].filter(l => l !== listener);
        }
        return this;
    },

    _emit(eventName, ...args) {
        if (this._events[eventName]) {
            for (const listener of this._events[eventName]) {
                listener(...args);
            }
        }
    }
};

// Listen for events from content script
window.addEventListener('message', function (event) {
    // Only accept messages from this window
    if (event.source !== window) return;
    if (!event.data.type) return;

    // Handle events
    if (event.data.type === 'WALLETX_ACCOUNTS_CHANGED') {
        console.log('WalletX: Accounts changed event received', event.data.accounts);

        walletXProvider.accounts = event.data.accounts || [];
        walletXProvider.selectedAddress = walletXProvider.accounts[0] || null;
        walletXProvider.connected = !!walletXProvider.accounts.length;

        // Emit event to listeners
        walletXProvider._emit('accountsChanged', walletXProvider.accounts);
    }
    else if (event.data.type === 'WALLETX_CHAIN_CHANGED') {
        console.log('WalletX: Chain changed event received', event.data.chainId);

        walletXProvider.chainId = event.data.chainId;

        // Emit event to listeners
        walletXProvider._emit('chainChanged', walletXProvider.chainId);
    }
    else if (event.data.type === 'WALLETX_DISCONNECTED') {
        console.log('WalletX: Disconnect event received');

        walletXProvider.connected = false;
        walletXProvider.accounts = [];
        walletXProvider.selectedAddress = null;

        // Emit event to listeners
        walletXProvider._emit('disconnect', { message: 'Disconnected from WalletX' });
    }
    else if (event.data.type === 'WALLETX_STATE_UPDATE') {
        console.log('WalletX: State update received', event.data);

        walletXProvider.connected = event.data.connected;
        walletXProvider.accounts = event.data.accounts || [];
        walletXProvider.selectedAddress = walletXProvider.accounts[0] || null;
        walletXProvider.chainId = event.data.chainId;
    }
});

// Set up the window.ethereum object
if (!window.ethereum) {
    window.ethereum = walletXProvider;
    console.log('WalletX: Provider injected into window.ethereum');
} else {
    console.log('WalletX: window.ethereum already exists, wrapping it');
    // Save the original provider
    window.originalEthereum = window.ethereum;

    // Wrap the existing provider with our provider
    Object.keys(walletXProvider).forEach(key => {
        if (typeof walletXProvider[key] === 'function') {
            const originalFn = window.ethereum[key];
            window.ethereum[key] = function (...args) {
                return walletXProvider[key].apply(walletXProvider, args);
            };
        } else {
            window.ethereum[key] = walletXProvider[key];
        }
    });

    console.log('WalletX: Provider wrapped around existing window.ethereum');
}

// Maintain older web3 compatibility
if (!window.web3) {
    window.web3 = {
        currentProvider: window.ethereum
    };
    console.log('WalletX: Added window.web3 for legacy compatibility');
}

console.log('WalletX: Provider injection completed'); 
