import React, { useState, useEffect } from 'react';
import WalletConnect from './WalletConnect.jsx';
import WalletCreate from './WalletCreate.jsx';
import WalletVerification from './WalletVerification.jsx';
import Dashboard from './Dashboard.jsx';
import { walletExists, getWalletData, clearWalletData } from '../services/storage.jsx';
import { FaWallet, FaPlus, FaUnlock, FaShieldAlt } from 'react-icons/fa';

function App() {
    const [activeTab, setActiveTab] = useState('connect');
    const [wallet, setWallet] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [tempWallet, setTempWallet] = useState(null);

    // Check if user has a wallet stored
    useEffect(() => {
        const hasWallet = walletExists();
        if (hasWallet) {
            // If wallet exists, user is returning, so show connect tab
            setActiveTab('connect');
        } else {
            setActiveTab('create');
        }
    }, []);

    // Handle wallet connection success
    const handleWalletConnected = (walletData) => {
        // Store the wallet data temporarily and show verification
        setTempWallet(walletData);
        setShowVerification(true);
    };

    // Handle verification confirmation
    const handleVerificationConfirmed = () => {
        setWallet(tempWallet);
        setIsAuthenticated(true);
        setShowVerification(false);
        setTempWallet(null);
    };

    // Handle verification cancellation
    const handleVerificationCancelled = () => {
        setShowVerification(false);
        setTempWallet(null);
        // Optionally clear the saved wallet data if it was just saved
        // clearWalletData();
    };

    // Handle logout
    const handleLogout = () => {
        setWallet(null);
        setIsAuthenticated(false);
        // Clear wallet data when logging out
        clearWalletData();
    };

    // If verified and authenticated, show dashboard
    if (isAuthenticated && wallet) {
        return <Dashboard wallet={wallet} onLogout={handleLogout} />;
    }

    // If in verification step, show verification component
    if (showVerification && tempWallet) {
        return (
            <WalletVerification
                wallet={tempWallet}
                onContinue={handleVerificationConfirmed}
                onCancel={handleVerificationCancelled}
            />
        );
    }

    // Otherwise show connect/create wallet UI
    return (
        <div className="app-container">
            <div className="app-header">
                <div className="flex items-center justify-center">
                    <FaWallet size={28} color="#037dd6" className="mr-2" />
                    <h1 className="text-xl font-semibold m-0">Crypto Wallet</h1>
                </div>
                <p className="text-secondary text-sm mt-1">
                    Secure, easy-to-use wallet for Ethereum and ERC-20 tokens
                </p>
            </div>
            
            <div className="app-content">
                <div className="tabs">
                    <div 
                        className={`tab ${activeTab === 'connect' ? 'active' : ''}`}
                        onClick={() => setActiveTab('connect')}
                    >
                        <FaUnlock className="mr-1" />
                        <span>Connect</span>
                    </div>
                    <div 
                        className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <FaPlus className="mr-1" />
                        <span>Create</span>
                    </div>
                </div>

                <div className="tab-content">
                    {activeTab === 'connect' && (
                        <WalletConnect onWalletReady={handleWalletConnected} />
                    )}

                    {activeTab === 'create' && (
                        <WalletCreate onWalletReady={handleWalletConnected} />
                    )}
                </div>
                
                <div className="alert alert-primary mt-4">
                    <FaShieldAlt size={16} />
                    <div>
                        <p className="m-0 font-medium">Secure Storage</p>
                        <p className="text-sm m-0">All wallet data is encrypted and stored locally. Your keys never leave your device.</p>
                    </div>
                </div>
            </div>

            <div className="app-footer">
                <p className="text-xs text-secondary text-center m-0">
                    © 2023 Crypto Wallet | v1.0.0
                </p>
            </div>
        </div>
    );
}

export default App;