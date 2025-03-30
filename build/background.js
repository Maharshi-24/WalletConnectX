// Background script for the wallet extension
console.log('Crypto Wallet background script initialized.');

// Listen for messages from the extension popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getWalletStatus') {
    // Example function to check wallet status
    chrome.storage.local.get(['walletData'], (result) => {
      sendResponse({
        isLocked: !result.walletData || result.walletData.isLocked,
        hasWallet: !!result.walletData
      });
    });
    return true; // Required for async response
  }
});

// Initialize extension
function initialize() {
  // Set badge
  chrome.action.setBadgeBackgroundColor({ color: '#037dd6' });
  
  // Check if wallet exists
  chrome.storage.local.get(['walletData'], (result) => {
    if (result.walletData) {
      chrome.action.setBadgeText({ text: 'E' }); // Has Ethereum wallet
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

// Run initialization
initialize(); 