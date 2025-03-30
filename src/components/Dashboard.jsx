import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SendTransaction from './SendTransaction';
import Settings from './Settings';
import { CHAINS_CONFIG, ethereum, sepolia, polygon, amoy, dojima } from './interfaces/Chain';
import { 
    FaWallet, 
    FaCopy, 
    FaExchangeAlt, 
    FaLock, 
    FaNetworkWired,
    FaEthereum,
    FaTimes,
    FaCheck,
    FaCog,
    FaQrcode,
    FaSignOutAlt
} from 'react-icons/fa';

function Dashboard({ wallet, onLogout }) {
    const [balance, setBalance] = useState(wallet.balance || '0');
    const [isLoading, setIsLoading] = useState(true);
    const [network, setNetwork] = useState('Ethereum Mainnet');
    const [showSendModal, setShowSendModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [selectedChain, setSelectedChain] = useState(ethereum);
    const [availableChains, setAvailableChains] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // Set available chains
        const chains = Object.values(CHAINS_CONFIG);
        setAvailableChains(chains);
        
        const fetchWalletDetails = async () => {
            try {
                // If we have a selected chain, use its RPC URL
                const provider = new ethers.providers.JsonRpcProvider(selectedChain.rpcUrl);
                
                // Get current balance
                const balanceWei = await provider.getBalance(wallet.address);
                const balanceEth = ethers.utils.formatEther(balanceWei);
                setBalance(balanceEth);

                // Get network info and set the network name
                const networkInfo = await provider.getNetwork();
                
                if (networkInfo.name === 'homestead') {
                    setNetwork('Ethereum Mainnet');
                } else if (networkInfo.chainId === parseInt(selectedChain.chainId, 16)) {
                    setNetwork(selectedChain.chainName);
                } else {
                    setNetwork(networkInfo.name);
                }
            } catch (error) {
                console.error('Error fetching wallet details:', error);
                setNetwork(selectedChain.chainName); // Fallback to the selected chain name
            } finally {
                setIsLoading(false);
            }
        };

        fetchWalletDetails();

        // Set up interval to refresh balance
        const intervalId = setInterval(fetchWalletDetails, 30000); // every 30 seconds

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, [wallet.address, selectedChain]);

    const copyToClipboard = (text, message = 'Copied!') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(message);
            setTimeout(() => setCopySuccess(''), 3000);
        });
    };

    // Format the address to show only first and last few characters
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 9)}...${address.substring(address.length - 6)}`;
    };

    // Handle network change
    const handleNetworkChange = (chain) => {
        setSelectedChain(chain);
        setShowNetworkModal(false);
        setIsLoading(true); // Trigger loading state to fetch new balance
    };

    // Network selection modal
    const NetworkModal = () => (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Select Network</h3>
                    <button 
                        onClick={() => setShowNetworkModal(false)}
                        className="btn btn-sm btn-icon btn-secondary"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="network-list">
                        {availableChains.map(chain => (
                            <div 
                                key={chain.chainId}
                                className={`network-item ${selectedChain.chainId === chain.chainId ? 'active' : ''}`}
                                onClick={() => handleNetworkChange(chain)}
                            >
                                <div className="flex items-center">
                                    <div className="network-icon">
                                        <FaEthereum />
                                    </div>
                                    <div className="network-info">
                                        <div className="network-name">{chain.chainName}</div>
                                        <div className="network-type text-xs text-secondary">{chain.chainType}</div>
                                    </div>
                                </div>
                                {selectedChain.chainId === chain.chainId && (
                                    <div className="selected-indicator">
                                        <FaCheck />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // If settings page is shown
    if (showSettings) {
        return (
            <Settings 
                wallet={wallet}
                onBack={() => setShowSettings(false)}
                selectedChain={selectedChain}
                onNetworkChange={handleNetworkChange}
                onLogout={onLogout}
            />
        );
    }

    return (
        <div className="app-container">
            <div className="app-header">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <FaWallet size={22} className="text-primary mr-2" />
                        <h1 className="text-lg font-semibold m-0">Wallet Dashboard</h1>
                    </div>
                    <div className="flex">
                        <button 
                            onClick={() => setShowSettings(true)} 
                            className="btn btn-sm btn-secondary hover-opacity mr-2"
                            title="Settings"
                        >
                            <FaCog size={14} />
                        </button>
                        <button 
                            onClick={onLogout} 
                            className="btn btn-sm btn-secondary hover-scale"
                            title="Logout"
                        >
                            <FaSignOutAlt size={14} />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="app-content">
                <div className="wallet-card shadow hover-scale">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                            <FaEthereum className="mr-2" />
                            <div className="font-medium">{selectedChain.currencySymbol}</div>
                        </div>
                        <div className="network-badge" onClick={() => setShowNetworkModal(true)}>
                            <FaNetworkWired size={12} />
                            <span>{network}</span>
                        </div>
                    </div>

                    <div className="wallet-balance">
                        {isLoading ? (
                            <div className="flex items-center">
                                <div className="spinner mr-2"></div>
                                <span>Loading...</span>
                            </div>
                        ) : (
                            `${parseFloat(balance).toFixed(4)} ${selectedChain.currencySymbol}`
                        )}
                    </div>

                    <div className="wallet-address">
                        <span className="truncate">{formatAddress(wallet.address)}</span>
                        <button
                            onClick={() => copyToClipboard(wallet.address, 'Address copied!')}
                            className="btn btn-sm btn-secondary p-1 hover-opacity"
                            title="Copy address"
                        >
                            <FaCopy size={14} />
                        </button>
                    </div>
                    
                    {copySuccess === 'Address copied!' && (
                        <div className="text-success text-xs mt-1">Address copied to clipboard!</div>
                    )}
                </div>

                <div className="flex gap-2 mt-4 mb-4">
                    <button
                        onClick={() => setShowSendModal(true)}
                        className="btn btn-accent btn-full hover-scale shadow"
                    >
                        <FaExchangeAlt className="mr-1" />
                        <span>Send</span>
                    </button>
                    
                    <button
                        onClick={() => setShowSettings(true)}
                        className="btn btn-primary btn-full hover-scale shadow"
                    >
                        <FaQrcode className="mr-1" />
                        <span>Receive</span>
                    </button>
                </div>

                <div className="card shadow mt-4 hover-scale">
                    <div className="card-header">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FaNetworkWired className="text-primary mr-2" />
                                <h2 className="card-title">Network</h2>
                            </div>
                            <button
                                onClick={() => setShowNetworkModal(true)}
                                className="btn btn-sm btn-secondary hover-opacity"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="network-icon mr-2" style={{width: '24px', height: '24px'}}>
                                    <FaEthereum />
                                </div>
                                <div>
                                    <div className="font-medium">{selectedChain.chainName}</div>
                                    <div className="text-xs text-secondary">{selectedChain.chainType}</div>
                                </div>
                            </div>
                            <div className="badge badge-primary">
                                {selectedChain.currencySymbol}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showSendModal && (
                <SendTransaction
                    wallet={wallet}
                    onBack={() => setShowSendModal(false)}
                    initialChain={selectedChain}
                />
            )}

            {showNetworkModal && <NetworkModal />}
        </div>
    );
}

export default Dashboard;