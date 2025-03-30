import React, { useState } from 'react';
import { FaWallet, FaInfoCircle, FaShieldAlt, FaCheckCircle, FaTimes, FaExclamationTriangle, FaEthereum } from 'react-icons/fa';

function WalletVerification({ wallet, onContinue, onCancel }) {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = () => {
        setIsConfirming(true);
        // Add a slight delay to show the confirming state
        setTimeout(() => {
            onContinue();
        }, 500);
    };

    // Format the address to show only first and last few characters
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
    };

    return (
        <div className="wallet-verification">
            <div className="flex items-center justify-center gap-2 mb-20">
                <FaCheckCircle size={20} color="#4e44ce" />
                <h2 className="mb-0">Verify Your Wallet</h2>
            </div>

            <div className="card mb-20">
                <div className="flex items-center gap-2 mb-4">
                    <FaWallet className="text-primary" />
                    <h3 className="mb-0">Wallet Details</h3>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-secondary">
                            <FaEthereum />
                            <span>Address:</span>
                        </div>
                        <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-secondary">
                            <FaEthereum />
                            <span>Network:</span>
                        </div>
                        <span>Ethereum Mainnet</span>
                    </div>
                </div>
            </div>

            <div className="info-box mb-20">
                <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-warning" />
                    <h3 className="mb-0">Security Notice</h3>
                </div>
                <ul className="mt-2 pl-6">
                    <li className="mb-1">Never share your private key or seed phrase with anyone</li>
                    <li className="mb-1">Verify that you're on the correct website</li>
                    <li>Keep your recovery phrase in a safe place</li>
                </ul>
            </div>

            <div className="card mb-20">
                <div className="flex items-center gap-2">
                    <FaInfoCircle className="text-primary" />
                    <p className="mb-0">
                        By continuing, you confirm that you understand the risks of
                        managing a cryptocurrency wallet and take full responsibility
                        for your funds.
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="button flex-1"
                    disabled={isConfirming}
                >
                    <FaTimes />
                    <span>Cancel</span>
                </button>
                <button
                    onClick={handleConfirm}
                    className="connect-button flex-1"
                    disabled={isConfirming}
                >
                    {isConfirming ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Confirming...</span>
                        </>
                    ) : (
                        <>
                            <FaShieldAlt />
                            <span>Continue to Wallet</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default WalletVerification;