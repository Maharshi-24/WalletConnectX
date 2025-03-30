import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CHAINS_CONFIG, amoy, sepolia, polygon, ethereum, dojima } from './interfaces/Chain';
import { sendToken, getBalance, estimateGasFee } from '../wallet-utils/TransactionUtils';
import { 
    FaExchangeAlt, 
    FaArrowLeft, 
    FaPaperPlane, 
    FaNetworkWired, 
    FaWallet, 
    FaUser, 
    FaEthereum, 
    FaExclamationTriangle, 
    FaCheckCircle,
    FaCopy,
    FaInfoCircle 
} from 'react-icons/fa';

function SendTransaction({ wallet, onBack, initialChain }) {
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [balance, setBalance] = useState('0');
    const [selectedChain, setSelectedChain] = useState(initialChain || sepolia); // Use initialChain if provided
    const [availableChains, setAvailableChains] = useState([]);
    const [transactionHash, setTransactionHash] = useState('');
    const [gasEstimate, setGasEstimate] = useState('0.0001');
    const [networkStatus, setNetworkStatus] = useState('connected');
    const [copySuccess, setCopySuccess] = useState('');

    // Load available chains and user balance on component mount
    useEffect(() => {
        // Load available chains from config - include ALL chains without filtering
        const chains = Object.values(CHAINS_CONFIG);
        setAvailableChains(chains);

        // Fetch balance for the initial selected chain
        if (wallet && wallet.address) {
            fetchBalance(selectedChain);
        }
    }, [wallet]);

    // Update balance when chain selection changes
    useEffect(() => {
        if (wallet && wallet.address) {
            fetchBalance(selectedChain);
            updateGasEstimate(selectedChain);
        }
    }, [selectedChain]);

    // Fetch balance for the selected chain with error handling
    const fetchBalance = async (chain) => {
        try {
            if (wallet && wallet.address) {
                setIsLoading(true);
                setError(''); // Clear previous errors
                setNetworkStatus('connecting');

                // Log for debugging
                console.log(`Fetching balance for address ${wallet.address} on ${chain.chainName}`);

                const balanceValue = await getBalance(wallet.address, chain);
                console.log(`Received balance: ${balanceValue} ${chain.currencySymbol}`);

                setBalance(balanceValue);
                setNetworkStatus('connected');
            }
        } catch (error) {
            console.error("Error fetching balance:", error);
            setError(`Could not fetch balance: ${error.message || 'Network error'}. Try another network.`);
            setBalance('0'); // Reset balance on error
            setNetworkStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Update gas estimate when chain changes
    const updateGasEstimate = async (chain) => {
        try {
            const estimate = await estimateGasFee(chain);
            setGasEstimate(estimate);
        } catch (error) {
            console.error("Error estimating gas fee:", error);
            setGasEstimate('0.0001'); // Fallback to default estimate
        }
    };

    // Handle chain selection change
    const handleChainChange = (e) => {
        const chainId = e.target.value;
        const chain = CHAINS_CONFIG[chainId];
        if (chain) {
            setSelectedChain(chain);
            // Reset error state when changing networks
            setError('');
            setNetworkStatus('connecting');
        }
    };

    // Retry balance fetch
    const retryFetchBalance = () => {
        setError('');
        setNetworkStatus('connecting');
        fetchBalance(selectedChain);
    };

    // Format address for display (truncate)
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
    };

    // Copy to clipboard
    const copyToClipboard = (text, message = 'Copied!') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(message);
            setTimeout(() => setCopySuccess(''), 3000);
        });
    };

    // Validate transaction inputs
    const validateInputs = () => {
        setError('');

        // Check if amount is provided and valid
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return false;
        }

        // Check if recipient address is provided and valid
        if (!recipient) {
            setError('Please enter a recipient address');
            return false;
        }

        if (!ethers.utils.isAddress(recipient)) {
            setError('Invalid recipient address');
            return false;
        }

        // Check if amount is less than or equal to balance
        if (parseFloat(amount) > parseFloat(balance)) {
            setError(`Insufficient balance. You have ${balance} ${selectedChain.currencySymbol}`);
            return false;
        }

        return true;
    };

    // Handle transaction submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous states
        setError('');
        setSuccess('');
        setTransactionHash('');

        // Validate inputs
        if (!validateInputs()) {
            return;
        }

        // Start transaction
        setIsLoading(true);

        try {
            const result = await sendToken(
                wallet.privateKey,
                recipient,
                amount,
                selectedChain
            );

            setTransactionHash(result.hash);
            setSuccess(`Transaction successful! ${amount} ${selectedChain.currencySymbol} sent.`);

            // Refresh balance after successful transaction
            setTimeout(() => fetchBalance(selectedChain), 2000);

            // Clear form
            setAmount('');
            setRecipient('');
        } catch (error) {
            console.error("Transaction error:", error);
            setError(error.message || 'Transaction failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="flex items-center">
                        <button
                            onClick={onBack}
                            className="btn btn-sm btn-icon btn-secondary mr-2"
                        >
                            <FaArrowLeft />
                        </button>
                        <h1 className="modal-title">Send {selectedChain.currencySymbol}</h1>
                    </div>
                </div>
                
                <div className="modal-body">
                    {error && (
                        <div className="alert alert-danger mb-4">
                            <FaExclamationTriangle />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert-success mb-4">
                            <FaCheckCircle />
                            <div>
                                <p className="m-0 font-medium">{success}</p>
                                {transactionHash && (
                                    <a 
                                        href={`${selectedChain.blockExplorerUrl}/tx/${transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm block mt-1 text-primary"
                                    >
                                        View transaction
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="wallet-card mb-4 shadow hover-scale">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <FaEthereum className="mr-2" />
                                    <span className="font-medium">{selectedChain.currencySymbol} Balance</span>
                                </div>
                                <div className="network-badge status-indicator status-connected">
                                    {selectedChain.chainName}
                                </div>
                            </div>
                            <div className="wallet-balance">
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="spinner mr-2"></div>
                                        <span>Loading...</span>
                                    </div>
                                ) : (
                                    `${parseFloat(balance).toFixed(6)}`
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group mb-4">
                            <label className="form-label flex items-center mb-2">
                                <FaNetworkWired className="text-primary mr-2" />
                                <span>Network</span>
                            </label>
                            <select
                                className="form-control"
                                value={selectedChain.chainId}
                                onChange={handleChainChange}
                                disabled={isLoading}
                            >
                                {availableChains.map(chain => (
                                    <option key={chain.chainId} value={chain.chainId}>
                                        {chain.chainName}
                                    </option>
                                ))}
                            </select>
                            
                            <div className={`form-helper flex items-center mt-1 ${networkStatus === 'error' ? 'text-danger' : ''}`}>
                                <FaInfoCircle className="mr-1" size={12} />
                                {networkStatus === 'connected' ? 'Connected to network' : 
                                 networkStatus === 'connecting' ? 'Connecting to network...' : 
                                 'Error connecting - try another network'}
                            </div>
                        </div>
                        
                        <div className="form-group mb-4">
                            <label className="form-label flex items-center mb-2">
                                <FaUser className="text-primary mr-2" />
                                <span>Recipient</span>
                            </label>
                            
                            <div className="relative">
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="0x..."
                                    className="form-control pr-10"
                                    disabled={isLoading}
                                    required
                                />
                                {recipient && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(recipient, 'Address copied!')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary p-1"
                                        title="Copy address"
                                    >
                                        <FaCopy size={14} />
                                    </button>
                                )}
                            </div>
                            
                            {recipient && ethers.utils.isAddress(recipient) && (
                                <div className="form-helper mt-1 flex items-center">
                                    <FaCheckCircle className="text-success mr-1" size={12} />
                                    <span>Valid address: {formatAddress(recipient)}</span>
                                </div>
                            )}
                            
                            {copySuccess === 'Address copied!' && (
                                <div className="text-success text-xs mt-1">Address copied!</div>
                            )}
                        </div>
                        
                        <div className="form-group mb-4">
                            <label className="form-label flex items-center mb-2">
                                <FaEthereum className="text-primary mr-2" />
                                <span>Amount ({selectedChain.currencySymbol})</span>
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`0.0`}
                                step="0.000001"
                                min="0"
                                className="form-control"
                                disabled={isLoading}
                                required
                            />
                            
                            <div className="flex justify-between flex-wrap gap-2 mt-2">
                                <div className="form-helper flex items-center">
                                    <FaInfoCircle className="mr-1" size={12} />
                                    <span>Gas: ~{gasEstimate} {selectedChain.currencySymbol}</span>
                                </div>
                                
                                <div className="quick-amounts">
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setAmount((parseFloat(balance) * 0.25).toFixed(6))}
                                        disabled={isLoading || parseFloat(balance) === 0}
                                    >
                                        25%
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setAmount((parseFloat(balance) * 0.5).toFixed(6))}
                                        disabled={isLoading || parseFloat(balance) === 0}
                                    >
                                        50%
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setAmount(balance)}
                                        disabled={isLoading || parseFloat(balance) === 0}
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            className="btn btn-accent btn-full hover-scale shadow"
                            disabled={isLoading || networkStatus === 'error'}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner mr-2"></div>
                                    <span>Sending Transaction...</span>
                                </>
                            ) : (
                                <>
                                    <FaPaperPlane className="mr-1" />
                                    <span>Send {selectedChain.currencySymbol}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SendTransaction;