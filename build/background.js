/**
 * WalletX Background Script
 * 
 * This script runs in the background and is responsible for:
 * 1. Managing wallet state and storage
 * 2. Processing connection requests from websites
 * 3. Handling transaction signing and approval
 * 4. Communication between content scripts and the extension UI
 * 5. Supporting WalletConnect protocol for external connections
 */

// Extension state
let state = {
    isUnlocked: false,
    accounts: [],
    selectedChainId: null,
    pendingRequests: {},
    connectedSites: {}, // {origin: {origin, accounts, chainId, connected, permissions}}
    walletConnectSessions: [] // Store active WalletConnect sessions
};

// Extension branding and metadata
const EXTENSION_NAME = "WalletX";
const EXTENSION_VERSION = "1.0.0";

// Initialize state from storage
chrome.storage.local.get(['state', 'connectedSites', 'walletConnectSessions'], (result) => {
    if (result.state) {
        state = { ...state, ...result.state };
    } else {
        // Set initial accounts - generate a random test account if none exists
        if (!state.accounts || state.accounts.length === 0) {
            // This is just a placeholder account
            const testAccount = '0x' + Math.random().toString(16).substring(2, 42).padStart(40, '0');
            state.accounts = [testAccount];
        }
        state.selectedChainId = '0x1'; // Default to ETH mainnet
        state.isUnlocked = false;
    }

    if (result.connectedSites) {
        state.connectedSites = result.connectedSites;
    }

    if (result.walletConnectSessions) {
        state.walletConnectSessions = result.walletConnectSessions;
    }

    console.log(`${EXTENSION_NAME} state initialized:`, state);

    // Save the initial state to ensure it's properly preserved
    saveState();
});

// Setup listener for when action button is clicked
chrome.action.onClicked.addListener((tab) => {
    // If no popup, open the extension page
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`${EXTENSION_NAME}: Background received message:`, message, "from:", sender);

    // Check if the message type starts with our prefix
    const isWalletXMessage = message.type && (
        message.type.startsWith('WALLETX_') ||
        message.type.startsWith('CROSS_NET_WALLET_')
    );

    if (!isWalletXMessage) {
        console.log(`${EXTENSION_NAME}: Ignoring non-WalletX message`);
        return false;
    }

    // Handle different message types
    switch (message.type) {
        case 'WALLETX_CONNECT':
        case 'CROSS_NET_WALLET_CONNECT':
            handleConnectRequest(message, sender, sendResponse);
            return true; // Keep the message channel open for async response

        case 'WALLETX_REQUEST':
        case 'CROSS_NET_WALLET_REQUEST':
            handleWeb3Request(message, sender, sendResponse);
            return true; // Keep the message channel open for async response

        case 'WALLETX_GET_ACCOUNTS':
        case 'CROSS_NET_WALLET_GET_ACCOUNTS':
            // Return accounts based on connection status
            const origin = sender.origin || (sender.url ? new URL(sender.url).origin : null);
            const isConnected = state.connectedSites[origin];

            if (isConnected) {
                console.log(`${EXTENSION_NAME}: Returning accounts for connected site:`, origin);
                sendResponse({ success: true, accounts: state.accounts });
            } else {
                console.log(`${EXTENSION_NAME}: Site not connected, returning empty accounts for:`, origin);
                sendResponse({ success: true, accounts: [] });
            }
            return false;

        case 'WALLETX_GET_STATE':
        case 'CROSS_NET_WALLET_GET_STATE':
            sendResponse({
                success: true,
                state: {
                    isUnlocked: state.isUnlocked,
                    selectedChainId: state.selectedChainId,
                    accounts: state.accounts,
                    connectedSites: state.connectedSites
                }
            });
            return false;

        case 'WALLETX_UPDATE_CHAIN':
        case 'CROSS_NET_WALLET_UPDATE_CHAIN':
            // Update the selected chain
            state.selectedChainId = message.chainId;
            saveState();

            // Notify all connected sites about the chain change
            broadcastToContentScripts({
                type: 'WALLETX_CHAIN_CHANGED',
                chainId: message.chainId
            });

            sendResponse({ success: true });
            return false;

        case 'WALLETX_APPROVE_CONNECTION':
        case 'CROSS_NET_WALLET_APPROVE_CONNECTION':
            handleConnectionApproval(message, sender, sendResponse);
            return false;

        case 'WALLETX_REJECT_CONNECTION':
        case 'CROSS_NET_WALLET_REJECT_CONNECTION':
            handleConnectionRejection(message, sender, sendResponse);
            return false;

        case 'WALLETX_DISCONNECT_SITE':
        case 'CROSS_NET_WALLET_DISCONNECT_SITE':
            handleDisconnectSite(message, sender, sendResponse);
            return false;

        default:
            console.log(`${EXTENSION_NAME}: Unhandled message type:`, message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
            return false;
    }
});

// Handle connection requests from websites
function handleConnectRequest(message, sender, sendResponse) {
    console.log(`${EXTENSION_NAME}: Handling connection request:`, message);
    const origin = message.origin || (sender.origin || (sender.url ? new URL(sender.url).origin : null));

    if (!origin) {
        console.error(`${EXTENSION_NAME}: No origin in connection request`);
        sendResponse({ success: false, error: 'No origin in request' });
        return;
    }

    // Check if already connected
    if (state.connectedSites[origin]) {
        console.log(`${EXTENSION_NAME}: Site ${origin} already connected, returning accounts`);
        sendResponse({
            success: true,
            method: 'eth_requestAccounts',
            result: state.accounts
        });
        return;
    }

    // Create a connection request
    const request = {
        id: message.id || `conn_${Date.now()}`,
        type: 'connect',
        origin: origin,
        favicon: message.favicon || (sender.tab ? sender.tab.favIconUrl : null),
        title: message.title || (sender.tab ? sender.tab.title : origin),
        timestamp: Date.now()
    };

    // Store the request
    state.pendingRequests[request.id] = request;
    saveState();

    // Open extension popup for user to approve/reject
    openExtensionPopup(request);

    // Response will be sent when user approves or rejects
    // We set up a listener to wait for the response
    const responseTimeout = setTimeout(() => {
        // If no response after 5 minutes, send timeout error
        console.log(`${EXTENSION_NAME}: Connection request timed out for ${origin}`);
        sendResponse({
            success: false,
            error: 'Request timed out. Please try again.'
        });

        // Remove the request
        delete state.pendingRequests[request.id];
        saveState();
    }, 5 * 60 * 1000); // 5 minutes

    // Store the response callback and timeout in global object to be called when user responds
    pendingCallbacks[request.id] = {
        sendResponse,
        timeout: responseTimeout,
        origin
    };
}

// Handle connection approval from popup
function handleConnectionApproval(message, sender, sendResponse) {
    const requestId = message.requestId;
    console.log(`${EXTENSION_NAME}: Handling connection approval for request ${requestId}`);

    if (!requestId || !state.pendingRequests[requestId]) {
        console.error(`${EXTENSION_NAME}: No pending request found with ID ${requestId}`);
        sendResponse({ success: false, error: 'No pending request found' });
        return;
    }

    const request = state.pendingRequests[requestId];
    const origin = request.origin;

    // Mark site as connected
    state.connectedSites[origin] = {
        active: true,
        connectedAt: Date.now(),
        permissions: message.permissions || ['eth_accounts', 'eth_requestAccounts']
    };

    // Remove from pending requests
    delete state.pendingRequests[requestId];
    saveState();

    // Send response to the original requester if callback exists
    if (pendingCallbacks[requestId]) {
        clearTimeout(pendingCallbacks[requestId].timeout);
        pendingCallbacks[requestId].sendResponse({
            success: true,
            method: 'eth_requestAccounts',
            result: state.accounts
        });
        delete pendingCallbacks[requestId];
    }

    // Notify all content scripts that a site has been connected
    broadcastToContentScripts({
        type: 'WALLETX_CONNECTION_APPROVED',
        origin: origin,
        accounts: state.accounts
    });

    // Send response to popup
    sendResponse({ success: true });
}

// Handle connection rejection from popup
function handleConnectionRejection(message, sender, sendResponse) {
    const requestId = message.requestId;
    console.log(`${EXTENSION_NAME}: Handling connection rejection for request ${requestId}`);

    if (!requestId || !state.pendingRequests[requestId]) {
        console.error(`${EXTENSION_NAME}: No pending request found with ID ${requestId}`);
        sendResponse({ success: false, error: 'No pending request found' });
        return;
    }

    const request = state.pendingRequests[requestId];

    // Remove from pending requests
    delete state.pendingRequests[requestId];
    saveState();

    // Send response to the original requester if callback exists
    if (pendingCallbacks[requestId]) {
        clearTimeout(pendingCallbacks[requestId].timeout);
        pendingCallbacks[requestId].sendResponse({
            success: false,
            error: 'The request was rejected by the user'
        });
        delete pendingCallbacks[requestId];
    }

    // Send response to popup
    sendResponse({ success: true });
}

// Handle disconnect request
function handleDisconnectSite(message, sender, sendResponse) {
    const origin = message.origin;
    console.log(`${EXTENSION_NAME}: Handling disconnect for site ${origin}`);

    if (!origin) {
        console.error(`${EXTENSION_NAME}: No origin in disconnect request`);
        sendResponse({ success: false, error: 'No origin in request' });
        return;
    }

    // Remove site from connected sites
    if (state.connectedSites[origin]) {
        delete state.connectedSites[origin];
        saveState();

        // Notify all content scripts that a site has been disconnected
        broadcastToContentScripts({
            type: 'WALLETX_DISCONNECTED',
            origin: origin
        });
    }

    // Send response
    sendResponse({ success: true });
}

// Broadcast message to all content scripts
function broadcastToContentScripts(message) {
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            try {
                chrome.tabs.sendMessage(tab.id, message);
            } catch (error) {
                console.error(`${EXTENSION_NAME}: Error sending message to tab ${tab.id}:`, error);
            }
        }
    });
}

// Global object to store callbacks for pending requests
const pendingCallbacks = {};

// Handle Web3 JSON-RPC requests
function handleWeb3Request(message, sender, sendResponse) {
    console.log(`${EXTENSION_NAME}: Processing Web3 request:`, message);

    const origin = message.origin || (sender.origin || (sender.url ? new URL(sender.url).origin : null));
    const { method, params, id } = message;

    if (!origin) {
        console.error(`${EXTENSION_NAME}: No origin in Web3 request`);
        sendResponse({
            success: false,
            error: { code: -32602, message: 'Missing origin' }
        });
        return;
    }

    // Handle account-related methods
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        // For eth_requestAccounts, check if site is connected
        if (method === 'eth_requestAccounts') {
            // If site is already connected, return accounts
            if (state.connectedSites[origin]) {
                console.log(`${EXTENSION_NAME}: Site ${origin} already connected, returning accounts for eth_requestAccounts`);
                sendResponse({
                    success: true,
                    result: state.accounts,
                    method
                });
                return;
            }

            // Otherwise, create a connection request
            const request = {
                id: message.id || `conn_${Date.now()}`,
                type: 'connect',
                origin,
                method,
                favicon: message.favicon || (sender.tab ? sender.tab.favIconUrl : null),
                title: message.title || (sender.tab ? sender.tab.title : origin),
                timestamp: Date.now()
            };

            // Store the request
            state.pendingRequests[request.id] = request;
            saveState();

            // Open extension popup for user to approve/reject
            openExtensionPopup(request);

            // Store the response callback to be called when user responds
            pendingCallbacks[request.id] = {
                sendResponse,
                timeout: setTimeout(() => {
                    // If no response after 5 minutes, send timeout error
                    console.log(`${EXTENSION_NAME}: Connection request timed out for ${origin}`);
                    sendResponse({
                        success: false,
                        error: { code: -32603, message: 'Request timed out' }
                    });

                    // Remove the request
                    delete state.pendingRequests[request.id];
                    delete pendingCallbacks[request.id];
                    saveState();
                }, 5 * 60 * 1000), // 5 minutes
                origin
            };

            return;
        }

        // For eth_accounts, return accounts if connected, empty array if not
        const isConnected = state.connectedSites[origin];
        const accounts = isConnected ? state.accounts : [];
        console.log(`${EXTENSION_NAME}: Returning ${accounts.length} accounts for eth_accounts to ${origin}`);
        sendResponse({
            success: true,
            result: accounts,
            method
        });
        return;
    }

    // Handle chainId request
    if (method === 'eth_chainId') {
        console.log(`${EXTENSION_NAME}: Returning chainId ${state.selectedChainId} to ${origin}`);
        sendResponse({
            success: true,
            result: state.selectedChainId,
            method
        });
        return;
    }

    // Handle transaction requests
    if (method === 'eth_sendTransaction' || method === 'eth_signTransaction' ||
        method === 'personal_sign' || method === 'eth_sign' || method === 'eth_signTypedData_v4') {

        // Check if site is connected
        if (!state.connectedSites[origin]) {
            console.log(`${EXTENSION_NAME}: Site ${origin} not connected, rejecting transaction request`);
            sendResponse({
                success: false,
                error: { code: 4100, message: 'The requested method requires wallet connection. Please connect first.' },
                method
            });
            return;
        }

        // Create a transaction request
        const request = {
            id: message.id || `tx_${Date.now()}`,
            type: 'transaction',
            method,
            params,
            origin,
            favicon: message.favicon || (sender.tab ? sender.tab.favIconUrl : null),
            title: message.title || (sender.tab ? sender.tab.title : origin),
            timestamp: Date.now()
        };

        // Store the request
        state.pendingRequests[request.id] = request;
        saveState();

        // Open extension popup for user to approve/reject
        openExtensionPopup(request);

        // Store the response callback to be called when user responds
        pendingCallbacks[request.id] = {
            sendResponse,
            timeout: setTimeout(() => {
                // If no response after 5 minutes, send timeout error
                console.log(`${EXTENSION_NAME}: Transaction request timed out for ${origin}`);
                sendResponse({
                    success: false,
                    error: { code: -32603, message: 'Request timed out' }
                });

                // Remove the request
                delete state.pendingRequests[request.id];
                delete pendingCallbacks[request.id];
                saveState();
            }, 5 * 60 * 1000), // 5 minutes
            origin
        };

        return;
    }

    // Handle other RPC methods - pass through to provider
    console.log(`${EXTENSION_NAME}: Passing through method ${method} to provider`);
    // This would typically go to a Web3 provider that can handle standard RPC methods
    // For this example, we'll send a mock response for common methods

    if (method === 'net_version') {
        // Convert hex chainId to decimal net_version
        const netVersion = parseInt(state.selectedChainId, 16).toString();
        sendResponse({
            success: true,
            result: netVersion,
            method
        });
        return;
    }

    if (method === 'eth_blockNumber') {
        // Mock response
        sendResponse({
            success: true,
            result: '0x' + Math.floor(Math.random() * 10000000).toString(16),
            method
        });
        return;
    }

    // Default response for unsupported methods
    console.log(`${EXTENSION_NAME}: Unsupported method ${method}, returning error`);
    sendResponse({
        success: false,
        error: { code: -32601, message: `Method ${method} not supported` },
        method
    });
}

// Show a notification to the user about the connection request
function showConnectionNotification(request) {
    // Create a unique notification ID
    const notificationId = `request_${Date.now()}`;

    try {
        // Show a notification to the user
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: 'icon.svg',
            title: `${EXTENSION_NAME} Connection Request`,
            message: `${request.type === 'connect' ? 'Connection' : 'Transaction'} request from ${request.origin}. Click to view.`,
            priority: 2,
            requireInteraction: true // Keep the notification until user interacts with it
        });

        // Add a listener for the notification click
        chrome.notifications.onClicked.addListener(function notificationClickListener(clickedId) {
            if (clickedId === notificationId) {
                // Remove this specific listener
                chrome.notifications.onClicked.removeListener(notificationClickListener);
                chrome.notifications.clear(notificationId);

                // Open extension popup
                chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
            }
        });
    } catch (error) {
        console.error(`${EXTENSION_NAME}: Error showing notification:`, error);
    }
}

// Function to highlight the extension icon
function highlightExtensionIcon() {
    try {
        // Use a safer icon setting approach with fallbacks
        const icons = {
            "16": "icons/icon16.png",
            "48": "icon.svg",
            "128": "icon.svg"
        };

        // Set a badge instead of changing the icon to avoid SVG issues
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF8A00' });

        // Clear badge after 5 seconds
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
        }, 5000);
    } catch (error) {
        console.error(`${EXTENSION_NAME}: Error highlighting extension icon:`, error);
    }
}

// Open the extension popup to show a request
function openExtensionPopup(request) {
    console.log(`${EXTENSION_NAME}: Opening extension popup for request:`, request);

    try {
        // Store the request in the local storage for the popup to access
        chrome.storage.local.set(
            { currentPendingRequest: request },
            () => {
                // Don't automatically open popup for eth_requestAccounts
                // Just highlight the icon to draw attention
                highlightExtensionIcon();

                // Show a notification to inform the user of the pending request
                showConnectionNotification(request);

                console.log(`${EXTENSION_NAME}: Set current pending request and highlighted icon for user to click`);
            }
        );
    } catch (error) {
        console.error(`${EXTENSION_NAME}: Error in openExtensionPopup:`, error);
        // As a fallback, show a notification
        showConnectionNotification(request);
    }
}

// Save state to storage
function saveState() {
    // Don't save pendingRequests to avoid bloating storage
    const stateToSave = {
        isUnlocked: state.isUnlocked,
        accounts: state.accounts,
        selectedChainId: state.selectedChainId
    };

    chrome.storage.local.set({ state: stateToSave });
}

// Save connected sites to storage
function saveConnectedSites() {
    chrome.storage.local.set({ connectedSites: state.connectedSites });
}

// Notify all tabs with the same origin
function notifyConnectedTabs(origin, message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.url && tab.url.includes(origin)) {
                chrome.tabs.sendMessage(tab.id, message, (response) => {
                    if (chrome.runtime.lastError) {
                        // This is normal if content script hasn't loaded yet
                        console.debug(`Could not send to tab ${tab.id}:`, chrome.runtime.lastError);
                    }
                });
            }
        });
    });
}

// Handle get state request
function handleGetState(message, origin, sendResponse) {
    try {
        // Only return minimal state information for security
        const filteredState = {
            isUnlocked: state.isUnlocked,
            selectedChainId: state.selectedChainId,
            hasPendingRequests: Object.keys(state.pendingRequests).length > 0
        };

        // If origin is provided, include connection status
        if (origin) {
            filteredState.connected = !!(state.connectedSites[origin] && state.connectedSites[origin].connected);
            if (filteredState.connected) {
                filteredState.accounts = state.connectedSites[origin].accounts;
            }
        }

        sendResponse({ state: filteredState });
    } catch (error) {
        console.error('Error handling getState:', error);
        sendResponse({ error: error.message });
    }
}

// Get all pending requests
function getPendingRequests(sendResponse) {
    try {
        console.log('Getting pending requests', state.pendingRequests);
        const pendingRequestsArray = Object.values(state.pendingRequests);
        sendResponse({ pendingRequests: pendingRequestsArray });
    } catch (error) {
        console.error('Error getting pending requests:', error);
        sendResponse({ error: error.message, pendingRequests: [] });
    }
}

// Listen for Chrome notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    console.log('Notification clicked:', notificationId);
    // Open the extension popup when notification is clicked
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Listen for tab updates to inject provider when needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        console.log(`Tab ${tabId} updated, injecting provider if needed`);
        // We could inject the provider here programmatically if needed
    }
});

// Handle chain changed event
function handleChainChanged(chainId, sendResponse) {
    state.selectedChainId = chainId;
    saveState();

    // Notify all connected sites about the chain change
    for (const origin in state.connectedSites) {
        if (state.connectedSites[origin].connected) {
            state.connectedSites[origin].chainId = chainId;

            notifyConnectedTabs(origin, {
                type: 'WALLET_EVENT',
                event: 'chainChanged',
                data: chainId
            });
        }
    }

    saveConnectedSites();
    sendResponse({ success: true });
}

// Handle site disconnection
function handleSiteDisconnected(message, sendResponse) {
    const { origin } = message;

    if (state.connectedSites[origin]) {
        state.connectedSites[origin].connected = false;
        saveConnectedSites();

        // Notify the site about disconnection
        notifyConnectedTabs(origin, {
            type: 'WALLET_EVENT',
            event: 'disconnect',
            data: { message: 'Wallet disconnected' }
        });

        sendResponse({ success: true });
    } else {
        sendResponse({ error: 'Site not found in connected sites' });
    }
}

// WalletConnect Handlers

// Handle WalletConnect initialization
function handleWalletConnectInit(message, sendResponse) {
    // Placeholder for WalletConnect initialization
    console.log('WalletConnect initialization request received', message);
    sendResponse({ success: true });
}

// Handle WalletConnect session request
function handleWalletConnectSessionRequest(message, sendResponse) {
    const { uri, requestId } = message;

    if (!uri) {
        sendResponse({ error: 'WalletConnect URI is missing' });
        return;
    }

    // Create a pending request for the WalletConnect session
    const request = {
        id: requestId || `wc_${Date.now()}`,
        type: 'walletconnect_session',
        uri,
        timestamp: Date.now()
    };

    // Add to pending requests
    state.pendingRequests[requestId] = request;
    saveState();

    // Open a popup to display the WalletConnect approval
    chrome.windows.create({
        url: chrome.runtime.getURL(`index.html?requestType=walletconnect&requestId=${request.id}`),
        type: 'popup',
        width: 400,
        height: 600
    });

    sendResponse({ success: true, requestId: request.id });
}

// Handle WalletConnect session approval
function handleWalletConnectApproveSession(message, sendResponse) {
    const { requestId, accounts, chainId } = message;

    // Find the request
    const request = state.pendingRequests[requestId];

    if (!request) {
        sendResponse({ error: 'WalletConnect request not found' });
        return;
    }

    // Create a new WalletConnect session
    const session = {
        id: Date.now().toString(),
        uri: request.uri,
        accounts: accounts || state.accounts,
        chainId: chainId || state.selectedChainId,
        connected: true,
        timestamp: Date.now()
    };

    // Add to WalletConnect sessions
    state.walletConnectSessions.push(session);
    saveWalletConnectSessions();

    // Send response to the popup
    sendResponse({ success: true, session });

    // Broadcasting to content scripts would be done via additional messages
}

// Handle WalletConnect session rejection
function handleWalletConnectRejectSession(message, sendResponse) {
    const { requestId } = message;

    // Find the request
    const request = state.pendingRequests[requestId];

    if (!request) {
        sendResponse({ error: 'WalletConnect request not found' });
        return;
    }

    // Remove the request
    delete state.pendingRequests[requestId];
    saveState();

    sendResponse({ success: true });
}

// Handle WalletConnect call request
function handleWalletConnectCallRequest(message, sendResponse) {
    const { sessionId, request, requestId } = message;

    // Find the session
    const session = state.walletConnectSessions.find(s => s.id === sessionId);

    if (!session) {
        sendResponse({ error: 'WalletConnect session not found' });
        return;
    }

    // Add to pending requests
    const pendingRequest = {
        id: requestId || `wc_call_${Date.now()}`,
        type: 'walletconnect_call',
        sessionId,
        request,
        timestamp: Date.now()
    };

    state.pendingRequests[requestId] = pendingRequest;
    saveState();

    // Open a popup to handle the request
    chrome.windows.create({
        url: chrome.runtime.getURL(`index.html?requestType=walletconnect_call&requestId=${pendingRequest.id}`),
        type: 'popup',
        width: 400,
        height: 600
    });

    sendResponse({ success: true, requestId: pendingRequest.id });
}

// Handle WalletConnect call approval
function handleWalletConnectApproveCallRequest(message, sendResponse) {
    const { requestId, result } = message;

    // Find the request
    const request = state.pendingRequests[requestId];

    if (!request) {
        sendResponse({ error: 'WalletConnect call request not found' });
        return;
    }

    // Send result back to the content script
    // This would normally involve sending a message to the content script
    // which would then relay it to the WalletConnect client

    sendResponse({ success: true, result });
}

// Handle WalletConnect call rejection
function handleWalletConnectRejectCallRequest(message, sendResponse) {
    const { requestId, error } = message;

    // Find the request
    const request = state.pendingRequests[requestId];

    if (!request) {
        sendResponse({ error: 'WalletConnect call request not found' });
        return;
    }

    // Send error back to the content script

    sendResponse({ success: true });
}

// Handle WalletConnect disconnection
function handleWalletConnectDisconnect(message, sendResponse) {
    const { sessionId } = message;

    // Find the session
    const sessionIndex = state.walletConnectSessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
        sendResponse({ error: 'WalletConnect session not found' });
        return;
    }

    // Remove the session
    state.walletConnectSessions.splice(sessionIndex, 1);
    saveWalletConnectSessions();

    // Send response
    sendResponse({ success: true });
}

// Save WalletConnect sessions to storage
function saveWalletConnectSessions() {
    chrome.storage.local.set({ walletConnectSessions: state.walletConnectSessions });
} 