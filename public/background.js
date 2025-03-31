/**
 * Cross-Net Wallet Background Script
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
    pendingRequests: [],
    connectedSites: {}, // {origin: {origin, accounts, chainId, connected, permissions}}
    walletConnectSessions: [] // Store active WalletConnect sessions
};

// Initialize state from storage
chrome.storage.local.get(['state', 'connectedSites', 'walletConnectSessions'], (result) => {
    if (result.state) {
        state = { ...state, ...result.state };
    }

    if (result.connectedSites) {
        state.connectedSites = result.connectedSites;
    }

    if (result.walletConnectSessions) {
        state.walletConnectSessions = result.walletConnectSessions;
    }

    console.log('Wallet state initialized:', state);
});

// Message handler from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    // Handle different message types
    switch (message.type) {
        case 'GET_STATE':
            sendResponse({ state });
            break;

        case 'CONNECT_REQUEST':
            handleConnectRequest(message, sender, sendResponse);
            break;

        case 'APPROVE_CONNECTION':
            handleConnectionApproval(message, sendResponse);
            break;

        case 'REJECT_CONNECTION':
            handleConnectionRejection(message, sendResponse);
            break;

        case 'TRANSACTION_REQUEST':
        case 'SEND_TRANSACTION_REQUEST':
        case 'SIGN_TRANSACTION_REQUEST':
            handleTransactionRequest(message, sender, sendResponse);
            break;

        case 'APPROVE_TRANSACTION':
            handleTransactionApproval(message, sendResponse);
            break;

        case 'REJECT_TRANSACTION':
            handleTransactionRejection(message, sendResponse);
            break;

        case 'CHAIN_CHANGED':
            handleChainChanged(message, sendResponse);
            break;

        case 'SITE_DISCONNECTED':
            handleSiteDisconnected(message, sendResponse);
            break;

        // WalletConnect specific message handlers
        case 'WALLETCONNECT_INIT':
            handleWalletConnectInit(message, sendResponse);
            break;

        case 'WALLETCONNECT_SESSION_REQUEST':
            handleWalletConnectSessionRequest(message, sendResponse);
            break;

        case 'WALLETCONNECT_APPROVE_SESSION':
            handleWalletConnectApproveSession(message, sendResponse);
            break;

        case 'WALLETCONNECT_REJECT_SESSION':
            handleWalletConnectRejectSession(message, sendResponse);
            break;

        case 'WALLETCONNECT_CALL_REQUEST':
            handleWalletConnectCallRequest(message, sendResponse);
            break;

        case 'WALLETCONNECT_APPROVE_CALL_REQUEST':
            handleWalletConnectApproveCallRequest(message, sendResponse);
            break;

        case 'WALLETCONNECT_REJECT_CALL_REQUEST':
            handleWalletConnectRejectCallRequest(message, sendResponse);
            break;

        case 'WALLETCONNECT_DISCONNECT':
            handleWalletConnectDisconnect(message, sendResponse);
            break;

        default:
            console.log('Unknown message type received:', message.type);
            sendResponse({ error: 'Unknown message type' });
            return false;
    }

    // Return true to indicate async response
    return true;
});

// Handle connection request from a website
function handleConnectRequest(message, sender, sendResponse) {
    const { origin } = message;

    // Check if site is already connected
    if (
        state.connectedSites[origin] &&
        state.connectedSites[origin].connected &&
        state.accounts.length > 0
    ) {
        sendResponse({
            connected: true,
            accounts: state.connectedSites[origin].accounts,
            chainId: state.selectedChainId
        });

        // Notify all tabs on this origin about connection status
        notifyConnectedTabs(origin, {
            type: 'WALLET_EVENT',
            event: 'accountsChanged',
            data: state.connectedSites[origin].accounts
        });

        return;
    }

    // Create a pending request
    const requestId = Date.now().toString();
    const request = {
        id: requestId,
        type: 'connect',
        origin,
        tabId: sender.tab ? sender.tab.id : null,
        timestamp: Date.now()
    };

    // Add to pending requests
    state.pendingRequests.push(request);
    saveState();

    // Create popup to handle approval if extension is not open
    chrome.windows.create({
        url: chrome.runtime.getURL('index.html?request=' + requestId),
        type: 'popup',
        width: 360,
        height: 600
    });

    // Response will be sent by the approval handler
    sendResponse({
        pending: true,
        requestId
    });
}

// Handle connection approval
function handleConnectionApproval(message, sendResponse) {
    const { requestId, accounts } = message;

    // Find the request
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        sendResponse({ error: 'Request not found' });
        return;
    }

    const request = state.pendingRequests[requestIndex];
    state.pendingRequests.splice(requestIndex, 1);

    // Update connected sites
    state.connectedSites[request.origin] = {
        origin: request.origin,
        connected: true,
        accounts: accounts || state.accounts,
        chainId: state.selectedChainId,
        permissions: ['eth_accounts'],
        timestamp: Date.now()
    };

    saveState();
    saveConnectedSites();

    // Notify website about approval
    if (request.tabId) {
        chrome.tabs.sendMessage(request.tabId, {
            type: 'RESPONSE',
            requestId: request.id,
            result: {
                connected: true,
                accounts: state.connectedSites[request.origin].accounts,
                chainId: state.selectedChainId
            }
        });
    }

    sendResponse({ success: true });

    // Notify all tabs on this origin about connection
    notifyConnectedTabs(request.origin, {
        type: 'WALLET_EVENT',
        event: 'accountsChanged',
        data: state.connectedSites[request.origin].accounts
    });

    notifyConnectedTabs(request.origin, {
        type: 'WALLET_EVENT',
        event: 'chainChanged',
        data: state.selectedChainId
    });
}

// Handle connection rejection
function handleConnectionRejection(message, sendResponse) {
    const { requestId } = message;

    // Find the request
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        sendResponse({ error: 'Request not found' });
        return;
    }

    const request = state.pendingRequests[requestIndex];
    state.pendingRequests.splice(requestIndex, 1);
    saveState();

    // Notify website about rejection
    if (request.tabId) {
        chrome.tabs.sendMessage(request.tabId, {
            type: 'RESPONSE',
            requestId: request.id,
            error: {
                code: 4001,
                message: 'User rejected connection request'
            }
        });
    }

    sendResponse({ success: true });
}

// Handle transaction request
function handleTransactionRequest(message, sender, sendResponse) {
    const { origin, transaction } = message;
    const tabId = sender.tab ? sender.tab.id : null; // Get tabId here

    // Check if site is connected
    if (!state.connectedSites[origin] || !state.connectedSites[origin].connected) {
        sendResponse({
            error: {
                code: 4100,
                message: 'Unauthorized: Please connect first'
            }
        });
        return;
    }

    // Create a unique request ID (using timestamp + random for better uniqueness)
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Prepare the request object to store
    const pendingTxData = {
        id: requestId,
        type: message.type === 'SIGN_TRANSACTION_REQUEST' ? 'sign' : 'send', // Distinguish sign vs send
        origin,
        tabId,
        transaction, // The raw transaction object from the dApp
        chainId: state.connectedSites[origin].chainId, // Get chainId from connection state
        timestamp: Date.now()
    };

    // Store the pending transaction details for the popup to access
    chrome.storage.local.set({ pendingTransaction: pendingTxData }, () => {
        console.log('Pending transaction stored:', pendingTxData);
        // Open the extension popup to approve the transaction
        // Pass the request ID so the popup knows which request to handle
        chrome.windows.create({
            url: chrome.runtime.getURL(`index.html?requestType=transaction&requestId=${requestId}`),
            type: "popup",
            width: 360,
            height: 650 // Adjust height as needed
        });

        // Send a pending status back to the content script
        sendResponse({
            pending: true,
            requestId // Send requestId back if needed by content script
        });
    });

    // Return true because the response is asynchronous
    return true;
}

// Handle transaction approval from the popup
async function handleTransactionApproval(message, sendResponse) {
    const { requestId } = message; // Popup sends the requestId

    // Retrieve the pending transaction details
    chrome.storage.local.get(['pendingTransaction', 'state'], async (result) => {
        const pendingTx = result.pendingTransaction;
        const currentState = result.state;

        if (!pendingTx || pendingTx.id !== requestId) {
            console.error('Transaction approval error: Request ID mismatch or not found');
            sendResponse({ success: false, error: 'Request not found or expired' });
            return;
        }

        // --- Security Placeholder: Decrypt Private Key ---
        // In a real wallet, retrieve the encrypted private key for the
        // relevant account (e.g., state.accounts[0].privateKey) and
        // decrypt it using the user's password.
        // const decryptedPrivateKey = await decryptKey(currentState.accounts[0].encryptedKey, userPassword);
        const decryptedPrivateKey = "0xYOUR_SECURELY_RETRIEVED_PRIVATE_KEY"; // Replace with secure retrieval
        if (!decryptedPrivateKey) {
            console.error('Transaction approval error: Could not get private key');
            sendResponse({ success: false, error: 'Failed to retrieve private key' });
            chrome.storage.local.remove('pendingTransaction'); // Clean up
            return;
        }
        // --- End Security Placeholder ---

        try {
            // --- Ethers.js Integration Placeholder ---
            // Ensure ethers.js is loaded or imported
            // const ethers = require('ethers'); // Or import if using modules

            // Get the correct provider RPC URL based on chainId
            // You'll need a mapping from chainId to RPC URL
            const rpcUrl = getRpcUrlForChain(pendingTx.chainId); // Implement getRpcUrlForChain
            if (!rpcUrl) throw new Error(`Unsupported chainId: ${pendingTx.chainId}`);

            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

            let txResponse;
            if (pendingTx.type === 'sign') {
                // TODO: Implement signing logic if needed separately
                // For now, assume approval means sending for simplicity
                console.warn('Signing-only not fully implemented, proceeding with send.');
                txResponse = await wallet.sendTransaction(pendingTx.transaction);
            } else {
                // Populate necessary fields if missing (optional, dApp should provide)
                const populatedTx = await wallet.populateTransaction(pendingTx.transaction);
                txResponse = await wallet.sendTransaction(populatedTx);
            }

            console.log('Transaction sent:', txResponse);

            // Send success response back to the content script
            if (pendingTx.tabId) {
                chrome.tabs.sendMessage(pendingTx.tabId, {
                    type: 'TRANSACTION_RESPONSE', // Use a generic response type
                    requestId: pendingTx.id,
                    approved: true,
                    result: txResponse.hash // Send back the transaction hash
                });
            }
            sendResponse({ success: true, txHash: txResponse.hash });
            // --- End Ethers.js Integration Placeholder ---

        } catch (error) {
            console.error('Transaction failed:', error);
            // Send error response back to the content script
            if (pendingTx.tabId) {
                chrome.tabs.sendMessage(pendingTx.tabId, {
                    type: 'TRANSACTION_RESPONSE',
                    requestId: pendingTx.id,
                    approved: false,
                    error: { code: -32000, message: error.message || 'Transaction failed' }
                });
            }
            sendResponse({ success: false, error: error.message || 'Transaction failed' });
        } finally {
            // Clean up the pending transaction from storage
            chrome.storage.local.remove('pendingTransaction');
        }
    });

    return true; // Indicate async response
}

// Handle transaction rejection from the popup
function handleTransactionRejection(message, sendResponse) {
    const { requestId } = message;

    chrome.storage.local.get('pendingTransaction', (result) => {
        const pendingTx = result.pendingTransaction;

        if (!pendingTx || pendingTx.id !== requestId) {
            console.error('Transaction rejection error: Request ID mismatch or not found');
            sendResponse({ success: false, error: 'Request not found or expired' });
            return;
        }

        console.log('Transaction rejected by user:', requestId);

        // Notify the content script of the rejection
        if (pendingTx.tabId) {
            chrome.tabs.sendMessage(pendingTx.tabId, {
                type: 'TRANSACTION_RESPONSE',
                requestId: pendingTx.id,
                approved: false,
                error: { code: 4001, message: 'User rejected the transaction' }
            });
        }

        // Clean up the pending transaction
        chrome.storage.local.remove('pendingTransaction', () => {
            sendResponse({ success: true });
        });
    });

    return true; // Indicate async response
}

// Handle chain changed event
function handleChainChanged(message, sendResponse) {
    const { chainId } = message;

    // Update the state
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

// Placeholder for RPC URL mapping
function getRpcUrlForChain(chainId) {
    // Add mappings for your supported chains
    const rpcUrls = {
        '0x1': 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // ETH Mainnet
        '0x89': 'https://polygon-rpc.com', // POL Mainnet
        '0x137': 'https://polygon.llamarpc.com', // POL Mainnet
        '0x80002': 'https://rpc-amoy.polygon.technology', // POL Testnet
        // Add other chains...
    };
    return rpcUrls[chainId];
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

// Save WalletConnect sessions to storage
function saveWalletConnectSessions() {
    chrome.storage.local.set({ walletConnectSessions: state.walletConnectSessions });
}

// Notify all tabs with the same origin
function notifyConnectedTabs(origin, message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.url && tab.url.includes(origin)) {
                chrome.tabs.sendMessage(tab.id, message);
            }
        });
    });
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
    state.pendingRequests.push(request);
    saveState();

    // Open a popup to display the WalletConnect approval
    chrome.windows.create({
        url: chrome.runtime.getURL(`index.html?requestType=walletconnect&requestId=${request.id}`),
        type: 'popup',
        width: 360,
        height: 600
    });

    sendResponse({ success: true, requestId: request.id });
}

// Handle WalletConnect session approval
function handleWalletConnectApproveSession(message, sendResponse) {
    const { requestId, accounts, chainId } = message;

    // Find the request
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        sendResponse({ error: 'WalletConnect request not found' });
        return;
    }

    const request = state.pendingRequests[requestIndex];
    state.pendingRequests.splice(requestIndex, 1);

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
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        sendResponse({ error: 'WalletConnect request not found' });
        return;
    }

    const request = state.pendingRequests[requestIndex];
    state.pendingRequests.splice(requestIndex, 1);
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

    state.pendingRequests.push(pendingRequest);
    saveState();

    // Open a popup to handle the request
    chrome.windows.create({
        url: chrome.runtime.getURL(`index.html?requestType=walletconnect_call&requestId=${pendingRequest.id}`),
        type: 'popup',
        width: 360,
        height: 600
    });

    sendResponse({ success: true, requestId: pendingRequest.id });
}

// Handle WalletConnect call approval
function handleWalletConnectApproveCallRequest(message, sendResponse) {
    const { requestId, result } = message;

    // Find the request
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        sendResponse({ error: 'WalletConnect call request not found' });
        return;
    }

    const request = state.pendingRequests[requestIndex];
    state.pendingRequests.splice(requestIndex, 1);
    saveState();

    // Send result back to the content script
    // This would normally involve sending a message to the content script
    // which would then relay it to the WalletConnect client

    sendResponse({ success: true, result });
}

// Handle WalletConnect call rejection
function handleWalletConnectRejectCallRequest(message, sendResponse) {
    const { requestId, error } = message;

    // Find the request
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        sendResponse({ error: 'WalletConnect call request not found' });
        return;
    }

    const request = state.pendingRequests[requestIndex];
    state.pendingRequests.splice(requestIndex, 1);
    saveState();

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