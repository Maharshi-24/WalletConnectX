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

    // UUID for unique identification - use a distinct ID for better detection
    uuid: '5099a4b6-4375-45dd-a505-1f8d095a1098',

    // Add standard wallet provider detection properties
    _isMetaMask: true, // Legacy compatibility
    _isWalletX: true,  // Custom identifier
    _isWallet: true,   // Standard web3 wallet identifier

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
                // First check if we already have the accounts from state
                if (this.accounts && this.accounts.length) {
                    console.log('WalletX: Using existing accounts:', this.accounts);
                    this.connected = true;
                    this.selectedAddress = this.accounts[0] || null;
                    return this.accounts;
                }
                
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
    },

    // Add a method to get the connected wallet for this site
    getConnectedWallet: async function() {
        return new Promise((resolve, reject) => {
            // Create a unique ID for this request
            const requestId = Date.now().toString() + Math.floor(Math.random() * 1000000);
            
            // Create message handler for the response
            const handleResponse = (event) => {
                if (
                    event.source !== window ||
                    !event.data ||
                    event.data.type !== 'WALLETX_CONNECTED_WALLET_RESPONSE' ||
                    event.data.id !== requestId
                ) {
                    return;
                }
                
                // Remove event listener
                window.removeEventListener('message', handleResponse);
                
                if (event.data.success) {
                    resolve({
                        address: event.data.address,
                        chainId: event.data.chainId
                    });
                } else {
                    reject(new Error(event.data.error?.message || 'Failed to get connected wallet'));
                }
            };
            
            // Add listener for the response
            window.addEventListener('message', handleResponse);
            
            // Send the request
            window.postMessage({
                type: 'WALLETX_GET_CONNECTED_WALLET',
                id: requestId
            }, '*');
            
            // Set timeout to reject if no response
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                reject(new Error('Request timed out'));
            }, 10000); // 10 second timeout
        });
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

// Add the getter to the window object so it's easily accessible
window.walletx = {
    ethereum: walletXProvider,
    getConnectedWallet: () => walletXProvider.getConnectedWallet()
};

// Make the provider available as window.ethereum (the standard way)
// Save any existing provider
const existingProvider = window.ethereum;

// Set up our provider as the main ethereum provider
window.ethereum = walletXProvider;

// If there was an existing provider, maintain compatibility
if (existingProvider) {
    console.log('WalletX: Another provider was detected, maintaining compatibility');
    // Copy any useful properties from the existing provider
    Object.keys(existingProvider).forEach(key => {
        if (!window.ethereum[key] && key !== 'request' && key !== 'send' && key !== 'sendAsync') {
            window.ethereum[key] = existingProvider[key];
        }
    });
    
    // Store the original provider
    window.ethereum._originalProvider = existingProvider;
}

// Dispatch EIP-1193 events for provider detected
try {
    window.dispatchEvent(new Event('ethereum#initialized'));
    
    // Also dispatch legacy MetaMask-style events for compatibility
    setTimeout(() => {
        window.dispatchEvent(new Event('WalletX#initialized'));
        window.dispatchEvent(new Event('web3#initialized'));
    }, 0);
} catch (error) {
    console.error('WalletX: Error dispatching provider initialization event:', error);
}

console.log('WalletX: Provider injection completed');

// Listen for state updates from content script
window.addEventListener('message', (event) => {
    // Only accept messages from our content script
    if (event.source !== window || !event.data || event.data.type !== 'WALLETX_STATE_UPDATE') {
        return;
    }

    const { payload } = event.data;
    console.log('WalletX: Received state update from content script:', payload);

    if (window.ethereum && window.ethereum.isWalletX) {
        // Update ethereum provider state
        window.ethereum.connected = payload.isConnected;
        
        if (payload.address) {
            // Always use the real address from storage, not a random one
            window.ethereum.accounts = [payload.address];
            window.ethereum.selectedAddress = payload.address;
            
            // Always emit accountsChanged event to ensure site gets updated address
            console.log('WalletX: Emitting accountsChanged with address:', payload.address);
            window.ethereum._emit('accountsChanged', [payload.address]);
            
            // Store last emitted accounts
            window.ethereum._lastEmittedAccounts = [payload.address];
            
            // Also update walletx.ethereum directly
            if (window.walletx && window.walletx.ethereum) {
                window.walletx.ethereum.accounts = [payload.address];
                window.walletx.ethereum.selectedAddress = payload.address;
                window.walletx.ethereum.connected = true;
            }
        } else if (window.ethereum.accounts.length > 0) {
            // Only clear if we actually had accounts before
            window.ethereum.accounts = [];
            window.ethereum.selectedAddress = null;
            window.ethereum._emit('accountsChanged', []);
            window.ethereum._lastEmittedAccounts = [];
            
            if (window.walletx && window.walletx.ethereum) {
                window.walletx.ethereum.accounts = [];
                window.walletx.ethereum.selectedAddress = null;
                window.walletx.ethereum.connected = false;
            }
        }
        
        // Update chain ID if changed
        if (payload.chainId && window.ethereum.chainId !== payload.chainId) {
            window.ethereum.chainId = payload.chainId;
            window.ethereum.networkVersion = parseInt(payload.chainId, 16).toString();
            window.ethereum._emit('chainChanged', payload.chainId);
            
            if (window.walletx && window.walletx.ethereum) {
                window.walletx.ethereum.chainId = payload.chainId;
                window.walletx.ethereum.networkVersion = parseInt(payload.chainId, 16).toString();
            }
        }
    }
}); 
