/**
 * WalletX Content Script
 * 
 * Acts as a bridge between the webpage and the extension's background script.
 * This script:
 * 1. Injects the wallet provider into web pages
 * 2. Relays messages between the injected script and background script
 * 3. Handles requests and responses for transactions and connections
 * 4. Maintains connection state for the current site
 */

console.log('WalletX: Content script loaded');

// Site information
const origin = window.location.origin;
let connected = false;
let accounts = [];
let chainId = null;

// Track the provider's readiness
let providerReadyMessage = {
    type: 'WALLETX_PROVIDER_READY',
    origin: origin
};

// Inject the provider script into the web page
function injectScript() {
    try {
        console.log('WalletX: Injecting provider script');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injectScript.js');
        script.onload = function () {
            this.remove();
            // Notify the page that the provider is ready
            window.postMessage({ 
                type: 'WALLETX_PROVIDER_READY', 
                origin: window.location.origin,
                extensionId: chrome.runtime.id 
            }, '*');
            console.log('WalletX: Provider injected successfully, extension ID:', chrome.runtime.id);
            
            // Dispatch a custom event for applications that listen for wallet providers
            const initScript = document.createElement('script');
            initScript.textContent = `
                try {
                    window.dispatchEvent(new CustomEvent('wallet_extension_initialized', { 
                        detail: { 
                            name: 'WalletX',
                            id: '${chrome.runtime.id}'
                        } 
                    }));
                    console.log('WalletX: Provider initialization event dispatched');
                } catch(e) {
                    console.error('WalletX: Error dispatching initialization event', e);
                }
            `;
            (document.head || document.documentElement).appendChild(initScript);
            initScript.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.error('WalletX: Error injecting provider script:', error);
    }
}

// Inject the script as early as possible
injectScript();

// Track connection state for this site
let siteConnected = false;
let siteAccounts = [];

// Listen for messages from the injected script in the page
window.addEventListener('message', function (event) {
    // Only accept messages from the current window
    if (event.source !== window) return;
    if (!event.data.type) return;

    // Handle messages from the page's injected script
    const messageType = event.data.type;
    if (messageType.startsWith('WALLETX_') || messageType.startsWith('CROSS_NET_WALLET_')) {
        console.log('WalletX: Content script received message:', event.data);

        // Handle different message types
        if (messageType === 'WALLETX_CONNECT' || messageType === 'CROSS_NET_WALLET_CONNECT') {
            handleConnectRequest(event.data);
        } else if (messageType === 'WALLETX_REQUEST' || messageType === 'CROSS_NET_WALLET_REQUEST') {
            handleWeb3Request(event.data);
        } else if (messageType === 'WALLETX_GET_STATE' || messageType === 'CROSS_NET_WALLET_GET_STATE') {
            getWalletState();
        } else if (messageType === 'WALLETX_GET_CONNECTED_WALLET') {
            getConnectedWallet(event.data);
        }
    }
}, false);

// Listen for messages from the extension's background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('ContentScript: Received message from background:', message);
    
    // Handle successful connection
    if (message.type === 'WALLETX_CONNECTION_APPROVED') {
        console.log('ContentScript: Connection approved for', message.origin, 'with accounts:', message.accounts);
        
        // Forward to page
        window.postMessage({
            type: 'WALLETX_CONNECT_RESPONSE',
            success: true,
            result: message.accounts
        }, '*');
        
        // Update wallet state
        sendWalletState();
    }
    
    // Handle connection rejection
    if (message.type === 'WALLETX_CONNECTION_REJECTED') {
        console.log('ContentScript: Connection rejected for', message.origin);
        
        // Forward to page
        window.postMessage({
            type: 'WALLETX_CONNECT_RESPONSE',
            success: false,
            error: { code: 4001, message: 'User rejected the request' }
        }, '*');
    }
    
    // Handle state updates
    if (message.type === 'STATE_UPDATE') {
        console.log('ContentScript: Received state update, syncing with page');
        sendWalletState();
    }
    
    return true;
});

// Handle connection requests
function handleConnectRequest(message) {
    const origin = window.location.origin;
    const favicon = getLinkIconUrl();
    const title = document.title;

    // Add site info to the message
    const requestMessage = {
        ...message,
        origin,
        favicon,
        title
    };

    console.log('WalletX: Sending connection request to background:', requestMessage);

    // Send to background script
    chrome.runtime.sendMessage(requestMessage, (response) => {
        if (chrome.runtime.lastError) {
            console.error('WalletX: Error sending connection request:', chrome.runtime.lastError);
            // Tell the page there was an error
            window.postMessage({
                type: 'WALLETX_CONNECT_RESPONSE',
                success: false,
                error: {
                    code: -32603,
                    message: 'Internal error: ' + chrome.runtime.lastError.message
                },
                id: message.id
            }, '*');
            return;
        }

        // If no response (possible if the background script is handling async), 
        // don't send a response yet
        if (!response) {
            console.log('WalletX: No immediate response from background, waiting for user approval...');
            return;
        }

        console.log('WalletX: Connection request response:', response);

        // Forward the response to the page
        window.postMessage({
            type: 'WALLETX_CONNECT_RESPONSE',
            success: response.success,
            result: response.result,
            error: response.error,
            id: message.id
        }, '*');

        // Update local state if successful
        if (response.success && response.result) {
            siteConnected = true;
            siteAccounts = response.result;
        }
    });
}

// Handle web3 requests
function handleWeb3Request(message) {
    const origin = window.location.origin;
    const favicon = getLinkIconUrl();
    const title = document.title;

    // Add site info to the message
    const requestMessage = {
        ...message,
        origin,
        favicon,
        title
    };

    console.log('WalletX: Sending web3 request to background:', requestMessage);

    // Send to background script
    chrome.runtime.sendMessage(requestMessage, (response) => {
        if (chrome.runtime.lastError) {
            console.error('WalletX: Error sending web3 request:', chrome.runtime.lastError);
            // Tell the page there was an error
            window.postMessage({
                type: 'WALLETX_REQUEST_RESPONSE',
                success: false,
                error: {
                    code: -32603,
                    message: 'Internal error: ' + chrome.runtime.lastError.message
                },
                id: message.id
            }, '*');
            return;
        }

        // If no response (possible if the background script is handling async), 
        // don't send a response yet
        if (!response) {
            console.log('WalletX: No immediate response from background, waiting...');
            return;
        }

        console.log('WalletX: Web3 request response:', response);

        // Forward the response to the page
        window.postMessage({
            type: 'WALLETX_REQUEST_RESPONSE',
            success: response.success,
            result: response.result,
            error: response.error,
            id: message.id,
            method: message.method
        }, '*');

        // Update local state if successful accounts request
        if (response.success && message.method === 'eth_requestAccounts' && response.result) {
            siteConnected = true;
            siteAccounts = response.result;
        }
    });
}

// Get current wallet state
function getWalletState() {
    chrome.runtime.sendMessage({ type: 'WALLETX_GET_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('WalletX: Error getting wallet state:', chrome.runtime.lastError);
            return;
        }

        // Check if this site is connected
        const origin = window.location.origin;
        const isConnected = response.state && response.state.connectedSites && response.state.connectedSites[origin];

        // Update local state
        siteConnected = !!isConnected;
        siteAccounts = isConnected ? response.state.accounts : [];

        // Send state to the page
        window.postMessage({
            type: 'WALLETX_STATE_UPDATE',
            connected: siteConnected,
            accounts: siteAccounts,
            chainId: response.state.selectedChainId
        }, '*');
    });
}

// Helper function to get the favicon URL
function getLinkIconUrl() {
    const linkEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    return linkEl ? linkEl.href : '';
}

// Set up a listener for messages from the webpage
window.addEventListener('message', async function (event) {
    // Only accept messages from the current window
    if (event.source !== window) {
        return;
    }

    const message = event.data;

    // Ignore messages that aren't for our extension
    if (
        !message ||
        typeof message !== 'object' ||
        !message.type ||
        !message.type.startsWith('CROSS_NET_WALLET_')
    ) {
        return;
    }

    console.log('WalletX content script received message from page:', message);

    // Process different types of messages
    switch (message.type) {
        case 'CROSS_NET_WALLET_RESPONSE':
            // Handle response messages from the page
            console.log('WalletX: Received response from page:', message);
            // No need to do anything special here, just log it
            break;

        default:
            console.log('WalletX: Handling unknown message type:', message.type);
            // For unknown type messages, we'll just log them
            break;
    }
});

// Initialize connection state from background script
async function initializeState() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_STATE',
            origin
        });

        if (response && response.state) {
            const state = response.state;
            const connectedSites = state.connectedSites || {};
            const siteInfo = connectedSites[origin];

            // If this site is connected, update local state
            if (siteInfo && siteInfo.connected) {
                connected = true;
                accounts = siteInfo.accounts || [];
                chainId = siteInfo.chainId;
                console.log('Site is connected with accounts:', accounts);
            }
        }
    } catch (error) {
        console.error('Failed to initialize state:', error);
    }
}

// Initialize state when the content script loads
initializeState();

// Function to get the connected wallet for this site
function getConnectedWallet(message) {
    const origin = window.location.origin;
    
    // Add origin to message
    const requestMessage = {
        ...message,
        origin
    };
    
    console.log('WalletX: Getting connected wallet for site:', origin);
    
    // Send to background script
    chrome.runtime.sendMessage(requestMessage, (response) => {
        if (chrome.runtime.lastError) {
            console.error('WalletX: Error getting connected wallet:', chrome.runtime.lastError);
            window.postMessage({
                type: 'WALLETX_CONNECTED_WALLET_RESPONSE',
                success: false,
                error: {
                    code: -32603,
                    message: 'Internal error: ' + chrome.runtime.lastError.message
                },
                id: message.id
            }, '*');
            return;
        }
        
        console.log('WalletX: Connected wallet response:', response);
        
        // Forward the response to the page
        window.postMessage({
            type: 'WALLETX_CONNECTED_WALLET_RESPONSE',
            success: response.success,
            address: response.address,
            chainId: response.chainId,
            error: response.error,
            id: message.id
        }, '*');
    });
}

// Send wallet state to page
function sendWalletState() {
  chrome.storage.local.get(['state', 'accounts'], (result) => {
    const state = result.state || {};
    const storedAccounts = result.accounts || [];
    
    console.log('ContentScript: Current state:', state);
    console.log('ContentScript: Stored accounts:', storedAccounts);
    
    // Always use the stored accounts first, then fall back to state accounts
    const accounts = storedAccounts.length ? storedAccounts : (state.accounts || []);
    
    // Check if this origin is in connected sites
    const isConnected = state.connectedSites && 
      state.connectedSites[window.location.origin];
    
    // Get the real wallet address (not a random one)
    const walletAddress = accounts.length ? accounts[0] : null;
    
    const walletState = {
      isUnlocked: state.isUnlocked || false,
      isConnected: !!isConnected,
      address: isConnected ? walletAddress : null,
      chainId: state.selectedChainId || '0x1'
    };
    
    console.log('ContentScript: Sending wallet state to page:', walletState);
    
    window.postMessage({
      type: 'WALLETX_STATE_UPDATE',
      payload: walletState
    }, '*');
  });
}

// Check wallet state periodically and on navigation
sendWalletState();
setInterval(sendWalletState, 3000);

// Listen for state changes from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STATE_UPDATE') {
    console.log('ContentScript: Received state update, syncing with page');
    sendWalletState();
  }
  return true;
}); 