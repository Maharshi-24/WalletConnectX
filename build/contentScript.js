/**
 * Cross-Net Wallet Content Script
 * 
 * Acts as a bridge between the webpage and the extension's background script.
 * This script:
 * 1. Injects the wallet provider into web pages
 * 2. Relays messages between the injected script and background script
 * 3. Handles requests and responses for transactions and connections
 * 4. Maintains connection state for the current site
 */

console.log('Cross-Net Wallet content script loaded');

// Site information
const origin = window.location.origin;
let connected = false;
let accounts = [];
let chainId = null;

// Inject the provider script into the web page
function injectScript() {
    try {
        // Create a script element to inject our code
        const script = document.createElement('script');

        // Get the URL of the inject script from the extension
        script.src = chrome.runtime.getURL('injectScript.js');

        // Setting this to ensure the script is loaded and executed before the page continues loading
        script.onload = function () {
            // Once loaded, we can remove the script element
            this.remove();
            console.log('Cross-Net Wallet provider injected successfully');
        };

        // Inject into the document
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.error('Failed to inject provider script:', error);
    }
}

// Inject as early as possible
injectScript();

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

    console.log('Content script received message from page:', message);

    // Process different types of messages
    switch (message.type) {
        case 'CROSS_NET_WALLET_CONNECT':
            handleConnectRequest(message);
            break;

        case 'CROSS_NET_WALLET_REQUEST':
            handleWeb3Request(message);
            break;

        case 'CROSS_NET_WALLET_WALLETCONNECT':
            handleWalletConnectRequest(message);
            break;

        default:
            console.warn('Unknown message type received:', message.type);
    }
});

// Handle connection requests from the page
async function handleConnectRequest(message) {
    try {
        // Add origin information to the message
        const requestWithOrigin = {
            ...message,
            type: 'CONNECT_REQUEST',
            origin: origin
        };

        // Send to the background script
        const response = await chrome.runtime.sendMessage(requestWithOrigin);
        console.log('Connection response from background:', response);

        // If already connected, update local state
        if (response && response.connected) {
            connected = true;
            accounts = response.accounts || [];
            chainId = response.chainId;
        }

        // Send response back to the page
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId: message.requestId,
            response: response
        }, '*');
    } catch (error) {
        console.error('Connection request error:', error);

        // Send error back to the page
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId: message.requestId,
            response: {
                error: {
                    message: error.message || 'Failed to connect to wallet',
                    code: -32603
                }
            }
        }, '*');
    }
}

// Handle Web3 method calls (transactions, signing, etc.)
async function handleWeb3Request(message) {
    try {
        // Get the method and params from the message
        const { method, params, requestId } = message;

        // Determine the message type to send to background script
        let requestType;
        if (method === 'eth_sendTransaction') {
            requestType = 'TRANSACTION_REQUEST';
        } else if (method === 'eth_sign' || method === 'personal_sign' || method.startsWith('eth_signTypedData')) {
            requestType = 'SIGN_TRANSACTION_REQUEST';
        } else {
            // For other method types like eth_call, eth_estimateGas, etc.
            requestType = 'WEB3_REQUEST';
        }

        // Create message for background script
        const requestForBackground = {
            type: requestType,
            method,
            params,
            origin,
            requestId
        };

        // For transactions, need to extract and format correctly
        if (requestType === 'TRANSACTION_REQUEST') {
            // If params is an array with the transaction object as first element
            const transaction = Array.isArray(params) ? params[0] : params;
            requestForBackground.transaction = transaction;
        }

        console.log('Sending request to background:', requestForBackground);

        // Send to background script
        const response = await chrome.runtime.sendMessage(requestForBackground);
        console.log('Response from background:', response);

        // For pending transactions, don't send immediate response to page
        // The background script will open a popup and send the response later
        if (response && response.pending) {
            console.log('Transaction is pending user approval');
            return;
        }

        // For immediate responses, forward to page
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId,
            response: response || { error: { message: 'No response from wallet', code: -32603 } }
        }, '*');
    } catch (error) {
        console.error('Error handling Web3 request:', error);

        // Send error to the page
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId: message.requestId,
            response: {
                error: {
                    message: error.message || 'Failed to process request',
                    code: -32603
                }
            }
        }, '*');
    }
}

// Handle WalletConnect requests
async function handleWalletConnectRequest(message) {
    try {
        // Add origin for security
        const requestWithOrigin = {
            ...message,
            type: 'WALLETCONNECT_SESSION_REQUEST',
            origin
        };

        // Send to background script
        const response = await chrome.runtime.sendMessage(requestWithOrigin);
        console.log('WalletConnect response from background:', response);

        // Send response back to the page
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId: message.requestId,
            response
        }, '*');
    } catch (error) {
        console.error('WalletConnect request error:', error);

        // Send error back to the page
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId: message.requestId,
            response: {
                error: {
                    message: error.message || 'Failed to process WalletConnect request',
                    code: -32603
                }
            }
        }, '*');
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log('Content script received message from background:', message);

    // Forward events and responses to the page
    if (message.type === 'WALLET_EVENT') {
        // Handle events like accountsChanged, chainChanged, disconnect
        if (message.event === 'accountsChanged') {
            accounts = message.data;
        } else if (message.event === 'chainChanged') {
            chainId = message.data;
        } else if (message.event === 'disconnect') {
            connected = false;
            accounts = [];
        }

        // Forward event to the page
        window.postMessage({
            type: 'CROSS_NET_WALLET_EVENT',
            event: message.event,
            data: message.data
        }, '*');
    } else if (message.type === 'RESPONSE') {
        // Handle regular responses like connection approvals
        window.postMessage({
            type: 'CROSS_NET_WALLET_RESPONSE',
            requestId: message.requestId,
            response: message.result || { error: message.error }
        }, '*');
    } else if (message.type === 'TRANSACTION_RESPONSE') {
        // Handle transaction approvals or rejections
        window.postMessage({
            type: 'CROSS_NET_WALLET_TRANSACTION_RESPONSE',
            requestId: message.requestId,
            approved: message.approved,
            result: message.result,
            error: message.error
        }, '*');
    }

    // Send response back to the background script if needed
    sendResponse({ received: true });
    return true; // Keep the message channel open for async responses
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