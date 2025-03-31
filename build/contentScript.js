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
            window.postMessage({ type: 'WALLETX_PROVIDER_READY', origin: window.location.origin }, '*');
            console.log('WalletX: Provider injected successfully');
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
        }
    }
}, false);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.type) return;

    console.log('WalletX: Content script received message from background:', message);

    // Handle events from the background script
    if (message.type === 'WALLETX_CONNECTION_APPROVED' || message.type === 'CROSS_NET_WALLET_CONNECTION_APPROVED') {
        // Update local state
        siteConnected = true;
        siteAccounts = message.accounts || [];

        // Notify the page
        window.postMessage({
            type: 'WALLETX_ACCOUNTS_CHANGED',
            accounts: siteAccounts
        }, '*');

        console.log('WalletX: Site connection approved, accounts:', siteAccounts);
    }
    else if (message.type === 'WALLETX_DISCONNECTED' || message.type === 'CROSS_NET_WALLET_DISCONNECTED') {
        // Update local state
        siteConnected = false;
        siteAccounts = [];

        // Notify the page
        window.postMessage({
            type: 'WALLETX_ACCOUNTS_CHANGED',
            accounts: []
        }, '*');

        console.log('WalletX: Site disconnected');
    }
    else if (message.type === 'WALLETX_CHAIN_CHANGED' || message.type === 'CROSS_NET_WALLET_CHAIN_CHANGED') {
        // Notify the page
        window.postMessage({
            type: 'WALLETX_CHAIN_CHANGED',
            chainId: message.chainId
        }, '*');

        console.log('WalletX: Chain changed to:', message.chainId);
    }
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