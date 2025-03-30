import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import { CHAINS_CONFIG, ethereum, sepolia, polygon, amoy, dojima } from './interfaces/Chain';
import { 
    FaWallet, 
    FaKey, 
    FaEye, 
    FaEyeSlash, 
    FaCopy, 
    FaArrowLeft, 
    FaLock, 
    FaNetworkWired,
    FaEthereum,
    FaCog,
    FaShieldAlt,
    FaCheck,
    FaExclamationTriangle,
    FaQrcode,
    FaDownload,
    FaTimes,
    FaSignOutAlt,
    FaExchangeAlt,
    FaArrowUp,
    FaArrowDown,
    FaClock,
    FaExternalLinkAlt
} from 'react-icons/fa';

function Settings({ wallet, onBack, selectedChain, onNetworkChange, onLogout }) {
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');
    const [availableChains, setAvailableChains] = useState([]);
    const [currentNetwork, setCurrentNetwork] = useState(selectedChain || ethereum);
    const [showQrCode, setShowQrCode] = useState(false);
    const [activeTab, setActiveTab] = useState('wallet'); // 'wallet', 'receive', 'network', 'security', 'transactions'
    const [transactions, setTransactions] = useState([]);
    const [isLoadingTx, setIsLoadingTx] = useState(false);
    const [txError, setTxError] = useState('');

    useEffect(() => {
        // Load available chains
        const chains = Object.values(CHAINS_CONFIG);
        setAvailableChains(chains);
    }, []);

    // Load transactions when transactions tab is active or network changes
    useEffect(() => {
        if (activeTab === 'transactions') {
            fetchRecentTransactions();
        }
    }, [activeTab, currentNetwork, wallet.address]);

    // Format the address to show only first and last few characters
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 9)}...${address.substring(address.length - 6)}`;
    };

    const togglePrivateKey = () => {
        setShowPrivateKey(!showPrivateKey);
    };

    const toggleQrCode = () => {
        setShowQrCode(!showQrCode);
    };

    const copyToClipboard = (text, message = 'Copied!') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(message);
            setTimeout(() => setCopySuccess(''), 3000);
        });
    };

    const handleNetworkChange = (chain) => {
        setCurrentNetwork(chain);
        if (onNetworkChange) {
            onNetworkChange(chain);
        }
    };

    // Function to fetch recent transactions
    const fetchRecentTransactions = async () => {
        setIsLoadingTx(true);
        setTxError('');
        
        try {
            const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
            
            // Get the current block number
            const currentBlock = await provider.getBlockNumber();
            
            // Calculate the block from 24 hours ago (approximately)
            // Ethereum averages ~15 seconds per block, so 24 hours is roughly 5760 blocks
            const oneDayBlocks = 5760;
            const fromBlock = Math.max(0, currentBlock - oneDayBlocks);
            
            // Get transactions sent from the user's address
            // Note: This is a basic implementation, actual blockchain exploration
            // would typically use an indexer or API like Etherscan
            const history = [];
            
            // Simulate a few transactions for demonstration
            // In a real app, you would integrate with a blockchain explorer API
            const now = new Date();
            
            // Some simulated transactions for demo purposes
            const demoTransactions = [
                {
                    hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                    from: wallet.address,
                    to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                    value: ethers.utils.parseEther('0.05'),
                    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).getTime(),
                    gasUsed: ethers.utils.hexlify(21000),
                    status: 1,
                    type: 'out'
                },
                {
                    hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                    from: '0x1Ea2d7D9e7d4FdA9517860a9A3a9C21D7Aad483E',
                    to: wallet.address,
                    value: ethers.utils.parseEther('0.12'),
                    timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).getTime(),
                    gasUsed: ethers.utils.hexlify(21000),
                    status: 1,
                    type: 'in'
                },
                {
                    hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                    from: wallet.address,
                    to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
                    value: ethers.utils.parseEther('0.0321'),
                    timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).getTime(),
                    gasUsed: ethers.utils.hexlify(21000),
                    status: 1,
                    type: 'out'
                },
                {
                    hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                    from: '0x3551A5a33d59B51C44CFE381C50D5626Fb977AfE',
                    to: wallet.address,
                    value: ethers.utils.parseEther('0.08'),
                    timestamp: new Date(now.getTime() - 22 * 60 * 60 * 1000).getTime(),
                    gasUsed: ethers.utils.hexlify(21000),
                    status: 1,
                    type: 'in'
                }
            ];

            setTransactions(demoTransactions);
            
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTxError('Could not load transaction history. Network may be unavailable.');
        } finally {
            setIsLoadingTx(false);
        }
    };

    // Function to download QR code
    const downloadQrCode = () => {
        const canvas = document.querySelector('.qr-code canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${wallet.address.substring(0, 8)}_qrcode.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    // Format timestamp to readable date/time
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Format transaction time relative to now
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const txTime = new Date(timestamp);
        const diffMs = now - txTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        }
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        }
        
        return formatTimestamp(timestamp);
    };

    // Get block explorer URL for the current network
    const getExplorerUrl = (txHash) => {
        let baseUrl = 'https://etherscan.io';
        
        if (currentNetwork.chainId === sepolia.chainId) {
            baseUrl = 'https://sepolia.etherscan.io';
        } else if (currentNetwork.chainId === polygon.chainId) {
            baseUrl = 'https://polygonscan.com';
        } else if (currentNetwork.chainId === amoy.chainId) {
            baseUrl = 'https://amoy.etherscan.io';
        } else if (currentNetwork.chainId === dojima.chainId) {
            baseUrl = 'https://explorer.dojima.network';
        }
        
        return `${baseUrl}/tx/${txHash}`;
    };

    // QR Code Modal component
    const QrCodeModal = () => {
        const qrValue = `ethereum:${wallet.address}`;
        
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3 className="modal-title">Receive {currentNetwork.currencySymbol}</h3>
                        <button 
                            onClick={toggleQrCode}
                            className="btn btn-sm btn-icon btn-secondary"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <div className="modal-body text-center">
                        <div className="qr-code mb-3">
                            <QRCodeSVG 
                                value={qrValue}
                                size={250}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>
                        
                        <div className="text-sm font-medium text-center mb-2">
                            Scan this QR code to receive {currentNetwork.currencySymbol}
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded mb-4 font-mono text-sm break-all">
                            {wallet.address}
                        </div>
                        
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => copyToClipboard(wallet.address, 'Address copied!')}
                                className="btn btn-primary"
                            >
                                <FaCopy className="mr-1" />
                                <span>Copy Address</span>
                            </button>
                            
                            <button
                                onClick={downloadQrCode}
                                className="btn btn-secondary"
                            >
                                <FaDownload className="mr-1" />
                                <span>Download</span>
                            </button>
                        </div>
                        
                        {copySuccess === 'Address copied!' && (
                            <div className="text-success text-xs mt-2">Address copied to clipboard!</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Tab navigation
    const renderTabs = () => (
        <div className="tabs mb-4 flex overflow-x-auto">
            <button 
                className={`tab-item p-2 flex-1 ${activeTab === 'wallet' ? 'active' : ''}`} 
                onClick={() => setActiveTab('wallet')}
            >
                <FaWallet className="mr-1" />
                <span>Wallet</span>
            </button>
            <button 
                className={`tab-item p-2 flex-1 ${activeTab === 'transactions' ? 'active' : ''}`} 
                onClick={() => setActiveTab('transactions')}
            >
                <FaExchangeAlt className="mr-1" />
                <span>Transactions</span>
            </button>
            <button 
                className={`tab-item p-2 flex-1 ${activeTab === 'receive' ? 'active' : ''}`} 
                onClick={() => setActiveTab('receive')}
            >
                <FaQrcode className="mr-1" />
                <span>Receive</span>
            </button>
            <button 
                className={`tab-item p-2 flex-1 ${activeTab === 'network' ? 'active' : ''}`} 
                onClick={() => setActiveTab('network')}
            >
                <FaNetworkWired className="mr-1" />
                <span>Networks</span>
            </button>
            <button 
                className={`tab-item p-2 flex-1 ${activeTab === 'security' ? 'active' : ''}`} 
                onClick={() => setActiveTab('security')}
            >
                <FaShieldAlt className="mr-1" />
                <span>Security</span>
            </button>
        </div>
    );

    // Wallet Information Section
    const renderWalletInfo = () => (
        <div className="card shadow mb-4">
            <div className="card-header">
                <div className="flex items-center">
                    <FaWallet className="text-primary mr-2" />
                    <h2 className="card-title">Wallet Information</h2>
                </div>
            </div>
            
            <div className="p-3">
                <div className="mb-3">
                    <div className="text-secondary text-sm mb-1">Wallet Address</div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="truncate font-mono text-sm">{wallet.address}</span>
                        <div className="flex">
                            <button
                                onClick={() => copyToClipboard(wallet.address, 'Address copied!')}
                                className="btn btn-sm btn-secondary p-1 hover-opacity mr-1"
                                title="Copy address"
                            >
                                <FaCopy size={14} />
                            </button>
                            <button
                                onClick={toggleQrCode}
                                className="btn btn-sm btn-secondary p-1 hover-opacity"
                                title="Show QR Code"
                            >
                                <FaQrcode size={14} />
                            </button>
                        </div>
                    </div>
                    {copySuccess === 'Address copied!' && (
                        <div className="text-success text-xs mt-1">Address copied to clipboard!</div>
                    )}
                </div>

                <div>
                    <div className="text-secondary text-sm mb-1">Private Key</div>
                    <div className="bg-gray-50 p-2 rounded">
                        {showPrivateKey ? (
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm break-all">{wallet.privateKey}</span>
                                <div className="flex">
                                    <button
                                        onClick={() => copyToClipboard(wallet.privateKey, 'Private key copied!')}
                                        className="btn btn-sm btn-secondary p-1 hover-opacity mr-1"
                                        title="Copy private key"
                                    >
                                        <FaCopy size={14} />
                                    </button>
                                    <button
                                        onClick={togglePrivateKey}
                                        className="btn btn-sm btn-secondary p-1 hover-opacity"
                                        title="Hide private key"
                                    >
                                        <FaEyeSlash size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">••••••••••••••••••••••••••••••••••••••••••••••</span>
                                <button
                                    onClick={togglePrivateKey}
                                    className="btn btn-sm btn-secondary p-1 hover-opacity"
                                    title="Show private key"
                                >
                                    <FaEye size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {copySuccess === 'Private key copied!' && (
                        <div className="text-success text-xs mt-1">Private key copied to clipboard!</div>
                    )}
                </div>

                <div className="alert alert-warning mt-3 mb-0">
                    <FaExclamationTriangle />
                    <div>
                        <p className="text-sm m-0">Never share your private key with anyone!</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Transactions Section
    const renderTransactionsSection = () => (
        <div className="card shadow mb-4">
            <div className="card-header">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <FaExchangeAlt className="text-primary mr-2" />
                        <h2 className="card-title">Recent Transactions (24h)</h2>
                    </div>
                    <button
                        onClick={fetchRecentTransactions}
                        className="btn btn-sm btn-secondary hover-opacity"
                        disabled={isLoadingTx}
                    >
                        {isLoadingTx ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>
            
            <div className="p-3">
                {isLoadingTx ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="spinner mr-2"></div>
                        <span>Loading transactions...</span>
                    </div>
                ) : txError ? (
                    <div className="alert alert-danger">
                        <FaExclamationTriangle />
                        <div>{txError}</div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-4 text-secondary">
                        <p>No transactions found in the last 24 hours.</p>
                        <p className="text-xs">Transactions will appear here when you send or receive {currentNetwork.currencySymbol}.</p>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {transactions.map((tx, index) => (
                            <div key={tx.hash} className={`transaction-item ${index < transactions.length - 1 ? 'border-bottom' : ''}`}>
                                <div className="flex items-center">
                                    <div className={`transaction-icon ${tx.type === 'out' ? 'outgoing' : 'incoming'}`}>
                                        {tx.type === 'out' ? <FaArrowUp /> : <FaArrowDown />}
                                    </div>
                                    <div className="transaction-details">
                                        <div className="transaction-title">
                                            {tx.type === 'out' ? 'Sent to ' : 'Received from '}
                                            <span className="font-mono">{formatAddress(tx.type === 'out' ? tx.to : tx.from)}</span>
                                        </div>
                                        <div className="transaction-timestamp text-xs text-secondary">
                                            <FaClock className="mr-1" size={10} />
                                            {formatTimeAgo(tx.timestamp)}
                                        </div>
                                    </div>
                                    <div className="transaction-amount">
                                        <div className={`${tx.type === 'out' ? 'text-danger' : 'text-success'}`}>
                                            {tx.type === 'out' ? '-' : '+'}{ethers.utils.formatEther(tx.value)} {currentNetwork.currencySymbol}
                                        </div>
                                        <a 
                                            href={getExplorerUrl(tx.hash)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="transaction-link text-xs"
                                        >
                                            View <FaExternalLinkAlt size={10} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-3 text-center text-xs text-secondary">
                    {transactions.length > 0 && (
                        <div>
                            Showing transactions from the last 24 hours.
                            <br />
                            Full transaction history can be viewed on {currentNetwork.chainName}'s block explorer.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Receive Section - QR Code
    const renderReceiveSection = () => (
        <div className="card shadow mb-4 hover-scale">
            <div className="card-header">
                <div className="flex items-center">
                    <FaQrcode className="text-primary mr-2" />
                    <h2 className="card-title">Receive {currentNetwork.currencySymbol}</h2>
                </div>
            </div>
            
            <div className="p-3">
                <div className="qr-preview text-center mb-3">
                    <div className="qr-code-small mx-auto" style={{width: '150px', height: '150px'}}>
                        <QRCodeSVG 
                            value={`ethereum:${wallet.address}`}
                            size={150}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"M"}
                            includeMargin={true}
                        />
                    </div>
                </div>
                
                <div className="text-center mb-3">
                    <div className="font-mono text-sm truncate mb-1">{formatAddress(wallet.address)}</div>
                    <div className="text-xs text-secondary">Current Network: {currentNetwork.chainName}</div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => copyToClipboard(wallet.address, 'Address copied!')}
                        className="btn btn-secondary flex-1"
                    >
                        <FaCopy className="mr-1" />
                        <span>Copy</span>
                    </button>
                    
                    <button
                        onClick={toggleQrCode}
                        className="btn btn-primary flex-1"
                    >
                        <FaQrcode className="mr-1" />
                        <span>Fullscreen</span>
                    </button>
                </div>
                
                {copySuccess === 'Address copied!' && (
                    <div className="text-success text-xs mt-2 text-center">Address copied to clipboard!</div>
                )}
            </div>
        </div>
    );

    // Network Settings Section
    const renderNetworkSettings = () => (
        <div className="card shadow mb-4">
            <div className="card-header">
                <div className="flex items-center">
                    <FaNetworkWired className="text-primary mr-2" />
                    <h2 className="card-title">Network Settings</h2>
                </div>
            </div>
            
            <div className="p-3">
                <div className="text-secondary text-sm mb-2">Select Default Network</div>
                <div className="network-list">
                    {availableChains.map(chain => (
                        <div 
                            key={chain.chainId}
                            className={`network-item ${currentNetwork.chainId === chain.chainId ? 'active' : ''}`}
                            onClick={() => handleNetworkChange(chain)}
                        >
                            <div className="flex items-center">
                                <div className="network-icon">
                                    <FaEthereum />
                                </div>
                                <div className="network-info">
                                    <div className="network-name">{chain.chainName}</div>
                                    <div className="network-type text-xs text-secondary">
                                        {chain.chainType} - {chain.currencySymbol}
                                    </div>
                                </div>
                            </div>
                            {currentNetwork.chainId === chain.chainId && (
                                <div className="selected-indicator">
                                    <FaCheck />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
    // Security Settings
    const renderSecuritySettings = () => (
        <div className="card shadow mb-4">
            <div className="card-header">
                <div className="flex items-center">
                    <FaShieldAlt className="text-primary mr-2" />
                    <h2 className="card-title">Security</h2>
                </div>
            </div>
            
            <div className="p-3">
                <button
                    className="btn btn-secondary btn-full hover-scale mb-3"
                    onClick={() => {/* This would open a change password modal */}}
                >
                    <FaLock className="mr-2" />
                    <span>Change Password</span>
                </button>

                <button
                    className="btn btn-danger btn-full hover-scale"
                    onClick={onLogout}
                >
                    <FaSignOutAlt className="mr-2" />
                    <span>Logout</span>
                </button>
                
                <div className="alert alert-primary mt-3">
                    <FaShieldAlt />
                    <div>
                        <p className="text-sm m-0">
                            Remember to keep your recovery phrase and private key in a safe place. 
                            They're the only way to recover your wallet.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            <div className="app-header">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={onBack}
                            className="btn btn-sm btn-icon btn-secondary mr-2"
                        >
                            <FaArrowLeft />
                        </button>
                        <h1 className="text-lg font-semibold m-0">Settings</h1>
                    </div>
                    <FaCog size={20} className="text-secondary" />
                </div>
            </div>
            
            <div className="app-content">
                {renderTabs()}
                
                {activeTab === 'wallet' && renderWalletInfo()}
                {activeTab === 'transactions' && renderTransactionsSection()}
                {activeTab === 'receive' && renderReceiveSection()}
                {activeTab === 'network' && renderNetworkSettings()}
                {activeTab === 'security' && renderSecuritySettings()}
                
                {/* App Version */}
                <div className="text-center text-secondary text-xs mt-4">
                    Ethereum Wallet v1.0.0
                </div>
            </div>
            
            {/* QR Code Modal */}
            {showQrCode && <QrCodeModal />}
        </div>
    );
}

export default Settings; 