import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SendTransaction from './SendTransaction';
import Settings from './Settings';
import { CHAINS_CONFIG, ethereum, sepolia, polygon, amoy, dojima } from './interfaces/Chain';
import {
    Wallet,
    Copy,
    ArrowRightLeft,
    Lock,
    Share2,
    Globe,
    X,
    Check,
    Settings as SettingsIcon,
    QrCode,
    LogOut
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
    DialogPortal,
    DialogOverlay
} from '@radix-ui/react-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@radix-ui/react-tooltip';
import { Avatar } from '@radix-ui/react-avatar';
import { Separator } from '@radix-ui/react-separator';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { createStitches } from '@stitches/react';

// Create Stitches instance with theme configuration
const { styled, css, globalCss, keyframes, getCssText, theme } = createStitches({
    theme: {
        colors: {
            primary: '#FF6B00',
            primaryHover: '#FF8B33',
            secondary: '#121212',
            background: '#1A1A1A',
            surface: '#242424',
            surfaceHover: '#2A2A2A',
            text: '#FFFFFF',
            textSecondary: '#B3B3B3',
            success: '#00C853',
            accent: '#FF9D45',
            border: '#333333',
        },
        space: {
            1: '4px',
            2: '8px',
            3: '12px',
            4: '16px',
            5: '20px',
            6: '24px',
        },
        radii: {
            small: '4px',
            default: '8px',
            pill: '9999px',
        },
    },
});

// Global styles
const globalStyles = globalCss({
    '*': {
        boxSizing: 'border-box',
        margin: 0,
    },
    'body': {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        backgroundColor: '$background',
        color: '$text',
    },
    '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
    },
});

// Create styled components to replace missing Radix components
const Button = styled('button', {
    all: 'unset',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: 1,
    fontWeight: 500,
    variants: {
        variant: {
            default: {
                backgroundColor: '$primary',
                color: '$text',
                padding: '0 15px',
                height: '35px',
                '&:hover': { backgroundColor: '$primaryHover' },
            },
            icon: {
                backgroundColor: '$surface',
                color: '$text',
                padding: '8px',
                '&:hover': { opacity: 0.8 },
            },
            outline: {
                backgroundColor: 'transparent',
                border: '1px solid $primary',
                color: '$text',
                padding: '0 15px',
                height: '35px',
                '&:hover': { backgroundColor: '$surfaceHover' },
            },
            text: {
                backgroundColor: 'transparent',
                color: '$primary',
                padding: '4px 8px',
                '&:hover': { opacity: 0.8 },
            },
            close: {
                backgroundColor: '$surface',
                color: '$text',
                padding: '6px',
                borderRadius: '50%',
                '&:hover': { opacity: 0.8 },
            },
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

const Card = styled('div', {
    borderRadius: '$default',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: '$secondary',
    color: '$text',
    variants: {
        hoverable: {
            true: {
                '&:hover': { transform: 'scale(1.01)' },
            },
        },
    },
});

const CardHeader = styled('div', {
    padding: '$4',
    backgroundColor: '$surface',
    borderBottom: '1px solid $background',
});

const CardContent = styled('div', {
    padding: '$4',
});

const CardFooter = styled('div', {
    padding: '$4',
    borderTop: '1px solid $background',
});

const Flex = styled('div', {
    display: 'flex',
    variants: {
        direction: {
            row: { flexDirection: 'row' },
            column: { flexDirection: 'column' },
        },
        align: {
            start: { alignItems: 'flex-start' },
            center: { alignItems: 'center' },
            end: { alignItems: 'flex-end' },
        },
        justify: {
            start: { justifyContent: 'flex-start' },
            center: { justifyContent: 'center' },
            end: { justifyContent: 'flex-end' },
            between: { justifyContent: 'space-between' },
        },
        gap: {
            1: { gap: '$1' },
            2: { gap: '$2' },
            3: { gap: '$3' },
            4: { gap: '$4' },
        },
        wrap: {
            wrap: { flexWrap: 'wrap' },
            nowrap: { flexWrap: 'nowrap' },
        },
        full: {
            true: { width: '100%' },
        },
    },
    defaultVariants: {
        direction: 'row',
        align: 'center',
        justify: 'start',
        gap: '2',
        wrap: 'nowrap',
    },
});

const Text = styled('span', {
    variants: {
        size: {
            xs: { fontSize: '0.75rem' },
            sm: { fontSize: '0.875rem' },
            md: { fontSize: '1rem' },
            lg: { fontSize: '1.25rem' },
            xl: { fontSize: '1.5rem' },
            xxl: { fontSize: '2rem' },
        },
        weight: {
            normal: { fontWeight: 400 },
            medium: { fontWeight: 500 },
            bold: { fontWeight: 700 },
        },
        color: {
            default: { color: '$text' },
            muted: { color: '$textSecondary' },
            primary: { color: '$primary' },
            success: { color: '$success' },
        },
        ellipsis: {
            true: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
        },
    },
    defaultVariants: {
        size: 'md',
        weight: 'normal',
        color: 'default',
    },
});

const Heading = styled('h2', {
    margin: 0,
    variants: {
        size: {
            sm: { fontSize: '1rem' },
            md: { fontSize: '1.25rem' },
            lg: { fontSize: '1.5rem' },
        },
        color: {
            default: { color: '$text' },
            primary: { color: '$primary' },
        },
    },
    defaultVariants: {
        size: 'md',
        color: 'default',
    },
});

const Badge = styled('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '$pill',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor: '$primary',
    color: '$text',
});

const AvatarStyled = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '$surface',
    color: '$primary',
    variants: {
        size: {
            sm: { width: '32px', height: '32px' },
            md: { width: '36px', height: '36px' },
            lg: { width: '48px', height: '48px' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

const DialogHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '$4',
    borderBottom: '1px solid $background',
});

const LoadingIndicator = styled('div', {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid $primary',
    borderTopColor: 'transparent',
    animation: 'spin 1s linear infinite',
});

const Container = styled('div', {
    background: '$background',
    color: '$text',
    height: '100vh',
    maxWidth: '100%',
    padding: '$4',
});

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
        // Apply global styles
        globalStyles();

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
        <Theme>
            <Container>
                {/* App Header */}
                <Flex justify="between" css={{
                    marginBottom: '$5',
                    padding: '$3',
                    backgroundColor: '$secondary',
                    borderRadius: '$default',
                }}>
                    <Flex gap="2">
                        <Wallet size={22} color="var(--colors-primary)" />
                        <Heading>Wallet Dashboard</Heading>
                    </Flex>

                    <Flex gap="2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="icon" onClick={() => setShowSettings(true)}>
                                        <SettingsIcon size={14} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Settings</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="icon" onClick={onLogout}>
                                        <LogOut size={14} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Logout</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Flex>
                </Flex>

                {/* Wallet Card */}
                <Card hoverable css={{ marginBottom: '$5' }}>
                    <CardContent css={{ padding: '$5' }}>
                        <Flex justify="between" css={{ marginBottom: '$3' }}>
                            <Flex gap="2">
                                <Globe size={18} color="var(--colors-primary)" />
                                <Text weight="medium">{selectedChain.currencySymbol}</Text>
                            </Flex>

                            <Button variant="text" onClick={() => setShowNetworkModal(true)} css={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '$1',
                                borderRadius: '$pill',
                            }}>
                                <Share2 size={12} />
                                <span>{network}</span>
                            </Button>
                        </Flex>

                        <Text size="xxl" weight="bold" color="primary" css={{ marginBottom: '$3' }}>
                            {isLoading ? (
                                <Flex gap="2">
                                    <LoadingIndicator />
                                    <Text size="md">Loading...</Text>
                                </Flex>
                            ) : (
                                `${parseFloat(balance).toFixed(4)} ${selectedChain.currencySymbol}`
                            )}
                        </Text>

                        <Flex justify="between">
                            <Text ellipsis css={{ maxWidth: '80%' }}>
                                {formatAddress(wallet.address)}
                            </Text>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="icon"
                                            onClick={() => copyToClipboard(wallet.address, 'Address copied!')}
                                        >
                                            <Copy size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy address</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Flex>

                        {copySuccess === 'Address copied!' && (
                            <Text size="xs" color="success" css={{ marginTop: '$1' }}>
                                Address copied to clipboard!
                            </Text>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Flex gap="2" css={{ marginBottom: '$4' }}>
                    <Button
                        variant="default"
                        onClick={() => setShowSendModal(true)}
                        css={{
                            flex: 1,
                            padding: '$3',
                            gap: '$2',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                    >
                        <ArrowRightLeft size={16} />
                        <span>Send</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setShowSettings(true)}
                        css={{
                            flex: 1,
                            padding: '$3',
                            gap: '$2',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                    >
                        <QrCode size={16} />
                        <span>Receive</span>
                    </Button>
                </Flex>

                {/* Network Card */}
                <Card hoverable>
                    <CardHeader>
                        <Flex justify="between">
                            <Flex gap="2">
                                <Share2 size={16} color="var(--colors-primary)" />
                                <Heading size="sm">Network</Heading>
                            </Flex>

                            <Button
                                variant="text"
                                onClick={() => setShowNetworkModal(true)}
                                css={{
                                    border: '1px solid $primary',
                                }}
                            >
                                Change
                            </Button>
                        </Flex>
                    </CardHeader>

                    <CardContent>
                        <Flex justify="between">
                            <Flex gap="3">
                                <AvatarStyled>
                                    <Globe size={18} />
                                </AvatarStyled>

                                <div>
                                    <Text weight="medium">{selectedChain.chainName}</Text>
                                    <Text size="xs" color="muted">
                                        {selectedChain.chainType}
                                    </Text>
                                </div>
                            </Flex>

                            <Badge>{selectedChain.currencySymbol}</Badge>
                        </Flex>
                    </CardContent>
                </Card>

                {/* Network Selection Dialog */}
                <Dialog open={showNetworkModal} onOpenChange={setShowNetworkModal}>
                    <DialogPortal>
                        <DialogOverlay style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            position: 'fixed',
                            inset: 0
                        }} />
                        <DialogContent style={{
                            backgroundColor: 'var(--colors-secondary)',
                            color: 'var(--colors-text)',
                            borderRadius: '8px',
                            border: 'none',
                            padding: 0,
                            width: '90%',
                            maxWidth: '340px',
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                            maxHeight: '85vh',
                            overflowY: 'auto'
                        }}>
                            <DialogHeader>
                                <Flex justify="between">
                                    <DialogTitle style={{
                                        fontSize: '1.2rem',
                                        fontWeight: 600,
                                        color: 'var(--colors-primary)',
                                        margin: 0
                                    }}>
                                        Select Network
                                    </DialogTitle>

                                    <DialogClose asChild>
                                        <Button variant="close">
                                            <X size={16} />
                                        </Button>
                                    </DialogClose>
                                </Flex>
                            </DialogHeader>

                            <div style={{ padding: '16px' }}>
                                <Flex direction="column" gap="2">
                                    {availableChains.map(chain => (
                                        <Button
                                            key={chain.chainId}
                                            onClick={() => handleNetworkChange(chain)}
                                            css={{
                                                backgroundColor: selectedChain.chainId === chain.chainId
                                                    ? '$surface'
                                                    : 'transparent',
                                                padding: '$3',
                                                borderRadius: '$default',
                                                border: selectedChain.chainId === chain.chainId
                                                    ? '1px solid $primary'
                                                    : '1px solid $surface',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor: '$surface'
                                                },
                                                justifyContent: 'flex-start'
                                            }}
                                        >
                                            <Flex justify="between" full>
                                                <Flex gap="3">
                                                    <AvatarStyled size="sm">
                                                        <Globe size={16} />
                                                    </AvatarStyled>

                                                    <div style={{ textAlign: 'left' }}>
                                                        <Text weight="medium">{chain.chainName}</Text>
                                                        <Text size="xs" color="muted">
                                                            {chain.chainType}
                                                        </Text>
                                                    </div>
                                                </Flex>

                                                {selectedChain.chainId === chain.chainId && (
                                                    <Check size={16} color="var(--colors-primary)" />
                                                )}
                                            </Flex>
                                        </Button>
                                    ))}
                                </Flex>
                            </div>
                        </DialogContent>
                    </DialogPortal>
                </Dialog>

                {/* Send Transaction Modal */}
                {showSendModal && (
                    <SendTransaction
                        wallet={wallet}
                        onBack={() => setShowSendModal(false)}
                        initialChain={selectedChain}
                    />
                )}
            </Container>
        </Theme>
    );
}

export default Dashboard;