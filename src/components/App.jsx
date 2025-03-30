import React, { useState, useEffect } from 'react';
import WalletConnect from './WalletConnect.jsx';
import WalletCreate from './WalletCreate.jsx';
import WalletVerification from './WalletVerification.jsx';
import Dashboard from './Dashboard.jsx';
import { walletExists, getWalletData, clearWalletData } from '../services/storage.jsx';
import { FaWallet, FaPlus, FaUnlock, FaShieldAlt } from 'react-icons/fa';
import { styled } from '@stitches/react';

// Apply a global style to ensure dark background extends throughout
const globalStyles = {
    'body, html': {
        backgroundColor: '#121212',
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        color: '#f0f0f0',
    }
};

// Styled components using Stitches
const AppContainer = styled('div', {
    backgroundColor: '#121212',
    color: '#f0f0f0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, sans-serif',
    width: '680px',
    position: 'relative', // Add position relative
    overflow: 'auto', // Ensure overflow is handled properly
});

const AppHeader = styled('header', {
    padding: '24px 20px',
    borderBottom: '1px solid #2a2a2a',
    textAlign: 'center',
    backgroundColor: '#121212', // Ensure header has background
});

const AppContent = styled('main', {
    flex: 1,
    padding: '24px 20px',
    maxWidth: '680px',
    margin: '0 auto',
    width: '100%',
    backgroundColor: '#121212', // Ensure content has background
});

const AppFooter = styled('footer', {
    padding: '16px',
    borderTop: '1px solid #2a2a2a',
    textAlign: 'center',
    backgroundColor: '#121212', // Ensure footer has background
    width: '100%',
});

const FlexCenter = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
});

const Heading = styled('h1', {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    background: 'linear-gradient(90deg, #FF8A00 0%, #FF5C00 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
});

const Subtitle = styled('p', {
    color: '#a0a0a0',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: 0,
});

const TabContainer = styled('div', {
    display: 'flex',
    marginBottom: '24px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    overflow: 'hidden',
});

const Tab = styled('div', {
    flex: 1,
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    color: '#a0a0a0',

    '&:hover': {
        backgroundColor: '#1e1e1e',
    },

    variants: {
        active: {
            true: {
                backgroundColor: '#1e1e1e',
                color: '#FF8A00',
                borderBottom: '2px solid #FF8A00',
            }
        }
    }
});

const TabContent = styled('div', {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    border: '1px solid #2a2a2a',
});

const Alert = styled('div', {
    backgroundColor: 'rgba(255, 138, 0, 0.1)',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '24px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    border: '1px solid rgba(255, 138, 0, 0.2)',

    '& svg': {
        color: '#FF8A00',
        flexShrink: 0,
        marginTop: '2px',
    }
});

const AlertTitle = styled('p', {
    margin: 0,
    fontWeight: '600',
    color: '#FF8A00',
});

const AlertText = styled('p', {
    fontSize: '14px',
    margin: '4px 0 0 0',
    color: '#d0d0d0',
});

const FooterText = styled('p', {
    fontSize: '12px',
    color: '#707070',
    margin: 0,
});

function App() {
    const [activeTab, setActiveTab] = useState('connect');
    const [wallet, setWallet] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [tempWallet, setTempWallet] = useState(null);

    // Apply global styles
    useEffect(() => {
        const styleElement = document.createElement('style');
        let styleString = '';
        for (const selector in globalStyles) {
            styleString += `${selector} {`;
            for (const prop in globalStyles[selector]) {
                styleString += `${prop}: ${globalStyles[selector][prop]};`;
            }
            styleString += '}';
        }
        styleElement.innerHTML = styleString;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

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
        return (
            <AppContainer>
                <Dashboard wallet={wallet} onLogout={handleLogout} />
            </AppContainer>
        );
    }

    // If in verification step, show verification component
    if (showVerification && tempWallet) {
        return (
            <AppContainer>
                <WalletVerification
                    wallet={tempWallet}
                    onContinue={handleVerificationConfirmed}
                    onCancel={handleVerificationCancelled}
                />
            </AppContainer>
        );
    }

    // Otherwise show connect/create wallet UI
    return (
        <AppContainer>
            <AppHeader>
                <FlexCenter css={{ justifyContent: 'center' }}>
                    <FaWallet size={28} color="#FF8A00" />
                    <Heading>Crypto Wallet</Heading>
                </FlexCenter>
                <Subtitle>
                    Secure, easy-to-use wallet for Ethereum and ERC-20 tokens
                </Subtitle>
            </AppHeader>

            <AppContent>
                <TabContainer>
                    <Tab
                        active={activeTab === 'connect'}
                        onClick={() => setActiveTab('connect')}
                    >
                        <FaUnlock />
                        <span>Connect</span>
                    </Tab>
                    <Tab
                        active={activeTab === 'create'}
                        onClick={() => setActiveTab('create')}
                    >
                        <FaPlus />
                        <span>Create</span>
                    </Tab>
                </TabContainer>

                <TabContent>
                    {activeTab === 'connect' && (
                        <WalletConnect onWalletReady={handleWalletConnected} />
                    )}

                    {activeTab === 'create' && (
                        <WalletCreate onWalletReady={handleWalletConnected} />
                    )}
                </TabContent>

                <Alert>
                    <FaShieldAlt size={18} />
                    <div>
                        <AlertTitle>Secure Storage</AlertTitle>
                        <AlertText>All wallet data is encrypted and stored locally. Your keys never leave your device.</AlertText>
                    </div>
                </Alert>
            </AppContent>

            <AppFooter>
                <FooterText>
                    © 2025 Crypto Wallet | v1.0.0
                </FooterText>
            </AppFooter>
        </AppContainer>
    );
}

export default App;