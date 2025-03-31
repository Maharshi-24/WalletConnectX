import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SendTransaction from './SendTransaction';
import Settings from './Settings';
import RequestApproval from './RequestApproval';
import useExtensionRequests from '../hooks/useExtensionRequests';
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
    LogOut,
    Download,
    Send,
    MoreVertical,
    ShieldAlert,
    SendHorizonal,
    User,
    ExternalLink,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Clock
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
import { QRCodeSVG } from 'qrcode.react';
import { FaCheck } from 'react-icons/fa';

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
    '.custom-scrollbar': {
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--colors-surface) transparent',
        '&::-webkit-scrollbar': {
            width: '6px',
        },
        '&::-webkit-scrollbar-track': {
            background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
            background: 'var(--colors-surface)',
            borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--colors-primary)',
        }
    }
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
        compact: {
            true: {
                padding: '12px', 
                marginBottom: '12px'
            }
        }
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
    width: '400px',
    maxWidth: '400px',
    padding: '$4',
});

// Add a global notification function that can be used by any component
const showCopyNotification = (message) => {
    // Create temporary notification element
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5.8 10.6L3.4 8.2L2 9.6L5.8 13.4L14 5.2L12.6 3.8L5.8 10.6Z" fill="#4CAF50"/>
        </svg>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: fadeInOut 3s forwards;
    `;
    
    // Add animation keyframes if they don't exist
    if (!document.getElementById('copy-animation-style')) {
        const style = document.createElement('style');
        style.id = 'copy-animation-style';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                10% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove the notification after animation completes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
};

// Format an address to short form
const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Add these animations for the drawer and feedback messages
const slideInUp = keyframes({
    '0%': { transform: 'translateY(100%)' },
    '100%': { transform: 'translateY(0)' }
});

const fadeIn = keyframes({
    '0%': { opacity: 0 },
    '100%': { opacity: 1 }
});

// Function to add feedback for copy/download actions
const addCopyFeedback = (message) => {
    setCopySuccess(message);
    setTimeout(() => setCopySuccess(""), 3000);
};

// Copy to clipboard with notification
const copyToClipboard = async (text, message = "Copied to clipboard!") => {
    try {
        await navigator.clipboard.writeText(text);
        
        // Set toast message for QR section
        setCopySuccess(message);
        
        // Show notification
        showCopyNotification(message);
        
        // Clear success message
        setTimeout(() => setCopySuccess(''), 3000);
        
        return 'Success';
    } catch (error) {
        console.error('Failed to copy:', error);
        return 'Failed to copy';
    }
};

// Handle copying wallet address
const handleCopyAddress = async () => {
    try {
        await navigator.clipboard.writeText(wallet.address);
        
        // Set copy status for UI updates
        setCopyStatus('Address copied!');
        
        // Show notification
        showCopyNotification('Address copied to clipboard!');

        // Clear the status after 3 seconds
        setTimeout(() => {
            setCopyStatus('');
        }, 3000);
    } catch (error) {
        console.error('Failed to copy:', error);
        setCopyStatus('Failed to copy');
        setTimeout(() => setCopyStatus(''), 3000);
    }
};

// Copy transaction hash with notification
const copyTxHash = (hash) => {
    navigator.clipboard.writeText(hash).then(() => {
        setCopyStatus(hash.substring(0, 10));
        showCopyNotification('Transaction hash copied!');
        setTimeout(() => setCopyStatus(""), 2000);
    });
};

// Download QR code with notification
const downloadQrCode = () => {
    // Target the QR code in the receive drawer
    const qrCodeElement = document.querySelector(".qr-code-container svg");
    if (!qrCodeElement) {
        console.error("QR code element not found");
        showCopyNotification("Error: Could not find QR code");
        return;
    }

    try {
        // Serialize the SVG to a string
        const svgData = new XMLSerializer().serializeToString(qrCodeElement);
        
        // Create a canvas element to draw the SVG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Make the canvas large enough for good quality
        const scale = 2; // Scale up for better quality
        canvas.width = qrCodeElement.clientWidth * scale;
        canvas.height = qrCodeElement.clientHeight * scale;
        
        // Create a new image to draw onto the canvas
        const img = new Image();
        
        // When the image loads, draw it to the canvas and create download link
        img.onload = () => {
            // Fill with white background first
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            try {
                // Convert to PNG
                const pngFile = canvas.toDataURL("image/png");
                
                // Create and trigger download
                const downloadLink = document.createElement("a");
                downloadLink.download = `wallet-${wallet?.address ? wallet.address.substring(0, 6) : 'address'}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
                
                // Show success notification
                showCopyNotification("QR code downloaded!");
            } catch (error) {
                console.error("Error creating PNG:", error);
                showCopyNotification("Error downloading QR code");
            }
        };
        
        // Handle error loading the image
        img.onerror = (error) => {
            console.error("Error loading image:", error);
            showCopyNotification("Error creating QR code image");
        };
        
        // Set the source of the image to the SVG data
        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    } catch (error) {
        console.error("Error downloading QR code:", error);
        showCopyNotification("Error downloading QR code");
    }
};

// Add a new TransactionsSection component for the Dashboard
const TransactionsSection = ({ wallet, selectedChain }) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [copyStatus, setCopyStatus] = useState("");

    useEffect(() => {
        if (wallet && wallet.address) {
            // Reset state when chain or wallet changes
            setTransactions([]);
            setPage(1);
            setHasMore(true);
            fetchRecentTransactions(1, true);
        }
    }, [selectedChain, wallet?.address]);

    // Function to fetch recent transactions
    const fetchRecentTransactions = async (pageNum = 1, resetData = false) => {
        if (!wallet || !wallet.address) {
            console.error("Wallet not defined");
            setTransactions([]);
            setIsLoading(false);
            return;
        }

        if (pageNum === 1) {
            setIsLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        setError("");

        try {
            // Check if we're in web mode (not extension context)
            const isWebMode = typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id;

            // SIMPLE APPROACH: Use direct, documented API endpoints
            const address = wallet.address;
            let apiUrl = '';
            // Use a fresh API key for Polygonscan
            let apiKey = 'UEIAV8C4QHYRDBNXCK4JUP1R3VB88EPMRR'; // Updated API key for Polygonscan
            const offset = 20; // Number of transactions per page

            console.log(`Fetching transactions for ${address} on ${selectedChain.chainName}`);

            // Determine correct API URL based on network
            if (selectedChain.chainId === ethereum.chainId) {
                apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=${pageNum}&offset=${offset}&sort=desc&apikey=1DN7I4P7KD3BRDP6ASZ37KRMHYQ6WVXD6Q`;
            } else if (selectedChain.chainId === sepolia.chainId) {
                apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&page=${pageNum}&offset=${offset}&sort=desc&apikey=1DN7I4P7KD3BRDP6ASZ37KRMHYQ6WVXD6Q`;
            } else if (selectedChain.chainId === polygon.chainId) {
                // Special handling for Polygon - fetch both normal transactions and internal transactions
                const normalTxApiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&page=${pageNum}&offset=${offset}&sort=desc&apikey=${apiKey}`;
                const internalTxApiUrl = `https://api.polygonscan.com/api?module=account&action=txlistinternal&address=${address}&page=${pageNum}&offset=${offset}&sort=desc&apikey=${apiKey}`;
                
                console.log("Fetching normal transactions from:", normalTxApiUrl);
                console.log("Fetching internal transactions from:", internalTxApiUrl);
                
                try {
                    // Fetch both transaction types in parallel
                    const [normalResponse, internalResponse] = await Promise.all([
                        fetch(normalTxApiUrl),
                        fetch(internalTxApiUrl)
                    ]);
                    
                    const normalData = await normalResponse.json();
                    const internalData = await internalResponse.json();
                    
                    console.log("Normal TX API Response:", normalData ? JSON.stringify(normalData).substring(0, 200) + "..." : "No data");
                    console.log("Internal TX API Response:", internalData ? JSON.stringify(internalData).substring(0, 200) + "..." : "No data");
                    
                    // Process and combine both transaction types
                    let allTransactions = [];
                    
                    // Process normal transactions
                    if (normalData && normalData.status === '1' && Array.isArray(normalData.result)) {
                        const normalTxs = normalData.result.map(tx => {
                            try {
                                return {
                                    hash: tx.hash || "",
                                    from: tx.from || "",
                                    to: tx.to || "",
                                    value: ethers.BigNumber.from(tx.value || '0'),
                                    timestamp: parseInt(tx.timeStamp || '0') * 1000,
                                    gasUsed: ethers.BigNumber.from(tx.gasUsed || '0'),
                                    status: tx.isError === "0" ? 1 : 0,
                                    type: (tx.from || "").toLowerCase() === address.toLowerCase() ? "outgoing" : "incoming"
                                };
                            } catch (err) {
                                console.error("Error parsing normal transaction:", err, tx);
                                return null;
                            }
                        }).filter(tx => tx !== null);
                        
                        allTransactions = [...normalTxs];
                    }
                    
                    // Process internal transactions
                    if (internalData && internalData.status === '1' && Array.isArray(internalData.result)) {
                        const internalTxs = internalData.result.map(tx => {
                            try {
                                return {
                                    hash: tx.hash || "",
                                    from: tx.from || "",
                                    to: tx.to || "",
                                    value: ethers.BigNumber.from(tx.value || '0'),
                                    timestamp: parseInt(tx.timeStamp || '0') * 1000,
                                    gasUsed: ethers.BigNumber.from('0'), // Internal txs don't have gas
                                    status: 1, // Internal txs are usually successful
                                    type: (tx.from || "").toLowerCase() === address.toLowerCase() ? "outgoing" : "incoming"
                                };
                            } catch (err) {
                                console.error("Error parsing internal transaction:", err, tx);
                                return null;
                            }
                        }).filter(tx => tx !== null);
                        
                        // Combine and remove duplicates based on hash
                        const seen = new Set(allTransactions.map(tx => tx.hash));
                        for (const tx of internalTxs) {
                            if (!seen.has(tx.hash)) {
                                allTransactions.push(tx);
                                seen.add(tx.hash);
                            }
                        }
                    }
                    
                    // Sort by timestamp (newer first)
                    allTransactions.sort((a, b) => b.timestamp - a.timestamp);
                    
                    // Check if we have more data
                    const totalTxs = allTransactions.length;
                    console.log(`Found ${totalTxs} total transactions (normal + internal)`);
                    
                    if (totalTxs < offset) {
                        setHasMore(false);
                    } else {
                        setHasMore(true);
                    }
                    
                    // Update state based on whether this is a fresh load or paginated load
                    if (resetData) {
                        setTransactions(allTransactions);
                    } else {
                        setTransactions(prev => [...prev, ...allTransactions]);
                    }
                    
                    // Early return since we've handled the Polygon case specially
                    setIsLoading(false);
                    setLoadingMore(false);
                    return;
                    
                } catch (error) {
                    console.error("Error fetching Polygon transactions:", error);
                    setError("Failed to fetch Polygon transactions. " + error.message);
                    setTransactions([]);
                    setIsLoading(false);
                    setLoadingMore(false);
                    return;
                }
            } else if (selectedChain.chainId === amoy.chainId) {
                apiUrl = `https://api-amoy.etherscan.io/api?module=account&action=txlist&address=${address}&page=${pageNum}&offset=${offset}&sort=desc&apikey=1DN7I4P7KD3BRDP6ASZ37KRMHYQ6WVXD6Q`;
            } else {
                // For unsupported networks, return empty array
                setTransactions([]);
                setIsLoading(false);
                setLoadingMore(false);
                return;
            }

            // Make a fetch request to the API for non-Polygon networks
            console.log("Fetching transactions from:", apiUrl);
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Log API response
            console.log("API Response:", data ? JSON.stringify(data).substring(0, 200) + "..." : "No data");

            if (data && data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
                // Process transactions
                const newTransactions = data.result.map(tx => {
                    try {
                        return {
                            hash: tx.hash || "",
                            from: tx.from || "",
                            to: tx.to || "",
                            value: ethers.BigNumber.from(tx.value || '0'),
                            timestamp: parseInt(tx.timeStamp || '0') * 1000,
                            gasUsed: ethers.BigNumber.from(tx.gasUsed || '0'),
                            status: tx.isError === "0" ? 1 : 0,
                            type: (tx.from || "").toLowerCase() === address.toLowerCase() ? "outgoing" : "incoming"
                        };
                    } catch (err) {
                        console.error("Error parsing transaction:", err, tx);
                        return null;
                    }
                }).filter(tx => tx !== null);

                // Check if we have more data
                if (newTransactions.length < offset) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                // Update state based on whether this is a fresh load or paginated load
                if (resetData) {
                    setTransactions(newTransactions);
                } else {
                    setTransactions(prev => [...prev, ...newTransactions]);
                }
            } else {
                console.log("No transactions found or API error:", data);
                setHasMore(false);
                
                // If this is the first page, show empty state
                if (pageNum === 1) {
                    setTransactions([]);
                }
                
                // Show error if API returned an error message
                if (data && data.message && data.message !== "No transactions found") {
                    setError(data.message || "Failed to fetch transactions");
                }
            }
        } catch (error) {
            console.error("Transaction fetch error:", error.message || "Unknown error");
            setError(error.message || "Failed to fetch transactions. Please try again later.");
            setTransactions([]);
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    };

    // Helper function to format addresses
    const formatAddress = (address) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    // Helper function to format date
    const formatDate = (timestamp) => {
        const txDate = new Date(timestamp);
        const now = new Date();
        
        // If today, show time
        if (txDate.toDateString() === now.toDateString()) {
            return `Today at ${txDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
        
        // If yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (txDate.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${txDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
        
        // If this week, show day name
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        if (txDate > weekAgo) {
            return txDate.toLocaleDateString([], {weekday: 'short'}) + ' ' + 
                txDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        
        // Otherwise show date
        return txDate.toLocaleDateString();
    };

    // Helper to format value with currency symbol
    const formatValue = (value) => {
        try {
            const valueInEth = ethers.utils.formatEther(value);
            return `${parseFloat(valueInEth).toFixed(5)} ${selectedChain.currencySymbol}`;
        } catch (error) {
            console.error("Error formatting value:", error);
            return `0 ${selectedChain.currencySymbol}`;
        }
    };

    // Function to handle loading more transactions
    const loadMoreTransactions = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchRecentTransactions(nextPage, false);
        }
    };

    return (
        <Card css={{ marginTop: "16px" }}>
            <CardHeader>
                <Flex justify="between">
                    <Flex gap="2">
                        <ArrowRightLeft size={16} color="var(--colors-primary)" />
                        <Heading size="sm">Transaction History</Heading>
                    </Flex>
                    {transactions.length > 0 && (
                        <Button 
                            variant="text" 
                            css={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => fetchRecentTransactions(1, true)}
                        >
                            <ArrowRightLeft size={12} style={{ marginRight: '4px' }} />
                            Refresh
                        </Button>
                    )}
                </Flex>
            </CardHeader>

            <CardContent css={{ padding: "0" }}>
                {isLoading ? (
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "center", 
                        alignItems: "center", 
                        padding: "32px" 
                    }}>
                        <LoadingIndicator />
                        <Text css={{ marginLeft: "8px" }}>Loading transactions...</Text>
                    </div>
                ) : error ? (
                    <div style={{ 
                        padding: "16px", 
                        color: "var(--colors-textSecondary)",
                        textAlign: "center" 
                    }}>
                        <AlertCircle size={18} style={{ marginBottom: "8px" }} />
                        <Text size="sm">{error}</Text>
                    </div>
                ) : transactions.length === 0 ? (
                    <div style={{ 
                        padding: "24px 16px",
                        color: "var(--colors-textSecondary)",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <ArrowRightLeft size={24} style={{ opacity: 0.5 }} />
                        <div>
                            <Text size="sm" css={{ marginBottom: '8px', display: 'block' }}>No transactions found</Text>
                            <Text size="xs" color="muted">
                                Transactions will appear here when you send or receive {selectedChain.currencySymbol}
                            </Text>
                        </div>
                    </div>
                ) : (
                    <div>
                        {transactions.map((tx, index) => (
                            <div 
                                key={tx.hash} 
                                style={{ 
                                    padding: "12px 16px",
                                    borderBottom: index < transactions.length - 1 ? "1px solid var(--colors-background)" : "none",
                                    transition: "background-color 0.2s ease",
                                    cursor: "pointer",
                                    position: "relative"
                                }}
                                onClick={() => copyTxHash(tx.hash)}
                            >
                                <Flex justify="between" align="center">
                                    <Flex gap="3">
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: tx.type === "incoming" 
                                                ? "rgba(39, 174, 96, 0.1)" 
                                                : "rgba(235, 87, 87, 0.1)",
                                            color: tx.type === "incoming" ? "#27AE60" : "#EB5757"
                                        }}>
                                            {tx.type === "incoming" ? (
                                                <ArrowDown size={16} />
                                            ) : (
                                                <ArrowUp size={16} />
                                            )}
                                        </div>
                                        <div>
                                            <Text weight="medium">
                                                {tx.type === "incoming" ? "Received" : "Sent"}
                                                {tx.status === 0 && <span style={{ 
                                                    color: "#EB5757", 
                                                    fontSize: "11px", 
                                                    marginLeft: "6px",
                                                    padding: "1px 6px",
                                                    borderRadius: "4px",
                                                    background: "rgba(235, 87, 87, 0.1)"
                                                }}>Failed</span>}
                                            </Text>
                                            <Text size="xs" color="muted">
                                                {tx.type === "incoming" 
                                                    ? `From: ${formatAddress(tx.from)}`
                                                    : `To: ${formatAddress(tx.to)}`
                                                }
                                            </Text>
                                        </div>
                                    </Flex>
                                    <div style={{ textAlign: "right" }}>
                                        <Text 
                                            weight="medium" 
                                            color={tx.type === "incoming" ? "success" : "default"}
                                        >
                                            {tx.type === "incoming" ? "+" : "-"}{formatValue(tx.value)}
                                        </Text>
                                        <Text size="xs" color="muted" css={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                                            <Clock size={12} />
                                            {formatDate(tx.timestamp)}
                                        </Text>
                                    </div>
                                </Flex>
                                
                                {/* Copy feedback indicator */}
                                {copyStatus.includes(tx.hash.substring(0, 10)) && (
                                    <div style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        animation: `${fadeIn} 0.2s ease`,
                                        borderRadius: "4px"
                                    }}>
                                        <Text size="sm" weight="medium">
                                            <Check size={14} style={{ marginRight: "6px" }} />
                                            Transaction hash copied
                                        </Text>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {hasMore && (
                            <div style={{ padding: "12px 16px", textAlign: "center" }}>
                                <Button 
                                    variant="outline" 
                                    css={{ 
                                        width: "100%", 
                                        fontWeight: "normal",
                                        backgroundColor: "var(--colors-surface)",
                                        borderColor: "var(--colors-surface)",
                                        '&:hover': { 
                                            backgroundColor: "var(--colors-surfaceHover)" 
                                        }
                                    }}
                                    onClick={loadMoreTransactions}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <LoadingIndicator />
                                    ) : (
                                        "Load More Transactions"
                                    )}
                                </Button>
                            </div>
                        )}
                        
                        <div style={{ padding: "12px 16px", textAlign: "center" }}>
                            <Text size="xs" color="muted">
                                Tip: Click on any transaction to copy its hash
                            </Text>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

function Dashboard({ wallet, onLogout, pendingRequest, onRequestComplete }) {
    const [showAddressQR, setShowAddressQR] = useState(false);
    const [selectedTab, setSelectedTab] = useState('wallet');
    const [selectedChain, setSelectedChain] = useState(ethereum);
    const [showSendTransaction, setShowSendTransaction] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [balance, setBalance] = useState('0');
    const [isUpdatingBalance, setIsUpdatingBalance] = useState(true);
    const [copyStatus, setCopyStatus] = useState('');
    const [network, setNetwork] = useState('Ethereum Mainnet');
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [availableChains, setAvailableChains] = useState([]);
    const [showRequestApproval, setShowRequestApproval] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [requestActionLoading, setRequestActionLoading] = useState(false);
    const [requestActionError, setRequestActionError] = useState(null);
    const [showReceiveDrawer, setShowReceiveDrawer] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    // Check if we're running in a browser extension context
    const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

    // Use our extension requests hook
    const {
        currentRequest: extensionRequest,
        loading: requestLoading,
        error: requestError,
        approveCurrentRequest,
        rejectCurrentRequest,
        isExtensionContext: extensionContext
    } = useExtensionRequests(wallet);

    useEffect(() => {
        // If not in extension context, show a warning in console
        if (!isExtensionContext) {
            console.warn('Running in web mode: Extension features will be limited or unavailable');
        }
    }, [isExtensionContext]);

        // Apply global styles
    useEffect(() => {
        globalStyles();
    }, []);

        // Set available chains
    useEffect(() => {
        const chains = Object.values(CHAINS_CONFIG);
        setAvailableChains(chains);
    }, []);

    // Fetch wallet balance when component mounts and when selected chain changes
    useEffect(() => {
        if (wallet?.address) {
            setIsUpdatingBalance(true);
            fetchWalletDetails();
        }
    }, [selectedChain, wallet?.address]);

    // Fetch wallet balance
        const fetchWalletDetails = async () => {
            try {
            if (!wallet?.address) {
                throw new Error("No wallet address available");
            }

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
            // Show relevant network name even if the RPC call fails
            setNetwork(selectedChain.chainName);

            // Set mock balance for development/testing
            if (!isExtensionContext) {
                // In web mode, provide mock balances for better UX during development
                switch (selectedChain.chainId) {
                    case ethereum.chainId:
                        setBalance('1.5238');
                        break;
                    case polygon.chainId:
                        setBalance('245.75');
                        break;
                    case sepolia.chainId:
                        setBalance('10.0');
                        break;
                    case amoy.chainId:
                        setBalance('50.0');
                        break;
                    default:
                        setBalance('0.0');
                }
            }
            } finally {
            setIsUpdatingBalance(false);
        }
    };

    // Handle network change
    const handleNetworkChange = (chain) => {
        setSelectedChain(chain);
        setShowNetworkModal(false);
        setIsUpdatingBalance(true);
    };

    // Process any pending request
    useEffect(() => {
        if (pendingRequest) {
            console.log('Dashboard received pending request:', pendingRequest);
            setCurrentRequest(pendingRequest);
            setShowRequestApproval(true);
        }
    }, [pendingRequest]);

    // Handle request approval
    const handleApproveRequest = async () => {
        if (!currentRequest || !isExtensionContext) return;

        setRequestActionLoading(true);
        setRequestActionError(null);

        try {
            console.log('Approving request:', currentRequest);

            // Determine if this is a connection or transaction request
            const isConnection = currentRequest.type === 'connect';
            const messageType = isConnection ? 'APPROVE_CONNECTION' : 'APPROVE_TRANSACTION';

            // Log details before sending
            console.log(`Sending ${messageType} message with requestId:`, currentRequest.id);

            // Send approval message to background script with a timeout
            const responsePromise = new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: messageType,
                    requestId: currentRequest.id,
                    accounts: isConnection ? [wallet.address] : undefined
                }, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Chrome runtime error:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(response);
                });

                // Set a timeout in case background doesn't respond
                setTimeout(() => {
                    reject(new Error('Background script response timeout'));
                }, 10000); // 10 second timeout
            });

            const response = await responsePromise;
            console.log('Approval response:', response);

            // Add null check for response
            if (!response) {
                console.error('No response received from background script');
                setRequestActionError('No response received from background script');
                return;
            }

            // Handle error case - with safe property access
            if (response && response.error) {
                setRequestActionError(response.error.message || 'Error approving request');
            } else {
                // Success case
                setShowRequestApproval(false);
                setCurrentRequest(null);
                if (onRequestComplete) onRequestComplete();
            }
        } catch (error) {
            console.error('Error approving request:', error);
            setRequestActionError(error.message || 'Failed to approve request');
        } finally {
            setRequestActionLoading(false);
        }
    };

    // Handle request rejection
    const handleRejectRequest = async () => {
        if (!currentRequest || !isExtensionContext) return;

        setRequestActionLoading(true);
        setRequestActionError(null);

        try {
            console.log('Rejecting request:', currentRequest);

            // Determine if this is a connection or transaction request
            const isConnection = currentRequest.type === 'connect';
            const messageType = isConnection ? 'REJECT_CONNECTION' : 'REJECT_TRANSACTION';

            // Log details before sending
            console.log(`Sending ${messageType} message with requestId:`, currentRequest.id);

            // Send rejection message to background script with a timeout
            const responsePromise = new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: messageType,
                    requestId: currentRequest.id
                }, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Chrome runtime error:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(response);
                });

                // Set a timeout in case background doesn't respond
                setTimeout(() => {
                    reject(new Error('Background script response timeout'));
                }, 10000); // 10 second timeout
            });

            const response = await responsePromise;
            console.log('Rejection response:', response);

            // Add null check for response
            if (!response) {
                console.error('No response received from background script');
                setRequestActionError('No response received from background script');
                return;
            }

            // Handle error case - with safe property access
            if (response && response.error) {
                setRequestActionError(response.error.message || 'Error rejecting request');
            } else {
                // Success case
                setShowRequestApproval(false);
                setCurrentRequest(null);
                if (onRequestComplete) onRequestComplete();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            setRequestActionError(error.message || 'Failed to reject request');
        } finally {
            setRequestActionLoading(false);
        }
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
                        <Heading>Wallet Dashboard{!isExtensionContext && ' (Web Mode)'}</Heading>
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

                {/* Add a tab navigation bar */}
                <Flex 
                    css={{ 
                        borderBottom: "1px solid var(--colors-background)",
                        marginBottom: "16px",
                        paddingBottom: "8px"
                    }}
                >
                    <Button 
                        variant="text" 
                        css={{ 
                            borderBottom: selectedTab === "wallet" ? "2px solid var(--colors-primary)" : "none",
                            borderRadius: "0",
                            padding: "8px 16px",
                            marginRight: "8px"
                        }}
                        onClick={() => setSelectedTab("wallet")}
                    >
                        <Wallet size={14} style={{ marginRight: "4px" }} />
                        Wallet
                    </Button>
                    <Button 
                        variant="text" 
                        css={{ 
                            borderBottom: selectedTab === "transactions" ? "2px solid var(--colors-primary)" : "none",
                            borderRadius: "0",
                            padding: "8px 16px"
                        }}
                        onClick={() => setSelectedTab("transactions")}
                    >
                        <ArrowRightLeft size={14} style={{ marginRight: "4px" }} />
                        Transactions
                    </Button>
                </Flex>

                {selectedTab === "wallet" ? (
                    <>
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
                                    {isUpdatingBalance ? (
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
                                                    onClick={handleCopyAddress}
                                        >
                                            <Copy size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy address</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Flex>

                                {copyStatus === 'Address copied!' && (
                            <Text size="xs" color="success" css={{ marginTop: '$1' }}>
                                Address copied to clipboard!
                            </Text>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                        <Flex justify="between" gap="3" css={{ marginBottom: '$4' }}>
                    <Button
                                variant="outline"
                                onClick={() => setShowSendTransaction(true)}
                        css={{
                            flex: 1,
                            padding: '$3',
                            gap: '$2',
                            transition: 'all 0.2s ease-in-out',
                                    backgroundColor: '$primary',
                                    borderColor: '$primary',
                                    color: 'white',
                                    '&:hover': { 
                                        transform: 'scale(1.02)',
                                        backgroundColor: '$primaryHover'
                                    }
                        }}
                    >
                        <ArrowRightLeft size={16} />
                        <span>Send</span>
                    </Button>

                    <Button
                        variant="outline"
                                onClick={() => setShowReceiveDrawer(true)}
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
                        <Card hoverable css={{ marginBottom: '$5' }}>
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
                                            fontSize: '12px',
                                            padding: '4px 8px'
                                }}
                            >
                                Change
                            </Button>
                        </Flex>
                    </CardHeader>

                            <CardContent css={{ padding: '12px' }}>
                                <Flex justify="between" align="center">
                                    <Flex gap="2">
                                        <AvatarStyled size="sm">
                                            <Globe size={16} />
                                </AvatarStyled>

                                <div>
                                    <Text weight="medium">{selectedChain.chainName}</Text>
                                    <Text size="xs" color="muted">
                                        {selectedChain.chainType}
                                    </Text>
                                </div>
                            </Flex>

                                    <Badge css={{ fontSize: '11px', padding: '2px 8px' }}>{selectedChain.currencySymbol}</Badge>
                        </Flex>
                    </CardContent>
                </Card>
                    </>
                ) : (
                    <TransactionsSection wallet={wallet} selectedChain={selectedChain} />
                )}

                {/* Network Selection Dialog */}
                <Dialog open={showNetworkModal} onOpenChange={setShowNetworkModal}>
                    <DialogPortal>
                        <DialogOverlay style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            position: 'fixed',
                            inset: 0
                        }} />
                        <DialogContent className="custom-scrollbar" style={{
                            backgroundColor: 'var(--colors-secondary)',
                            color: 'var(--colors-text)',
                            borderRadius: '12px',
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
                                <Flex justify="between" align="center" style={{ width: '100%', padding: '12px 16px' }}>
                                    <DialogTitle style={{
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: 'var(--colors-primary)',
                                        margin: 0
                                    }}>
                                        Select Network
                                    </DialogTitle>

                                    <DialogClose asChild>
                                        <Button 
                                            variant="close" 
                                            style={{
                                                backgroundColor: 'var(--colors-surface)',
                                                color: 'var(--colors-primary)',
                                                borderRadius: '50%',
                                                padding: '8px'
                                            }}
                                        >
                                            <X size={16} />
                                        </Button>
                                    </DialogClose>
                                </Flex>
                            </DialogHeader>

                            <div style={{ padding: '0px 12px 12px 12px' }}>
                                <Flex direction="column" gap="1">
                                    {availableChains.map(chain => (
                                        <Button
                                            key={chain.chainId}
                                            onClick={() => handleNetworkChange(chain)}
                                            css={{
                                                backgroundColor: selectedChain.chainId === chain.chainId
                                                    ? 'rgba(255, 107, 0, 0.1)'
                                                    : 'transparent',
                                                padding: '8px 10px',
                                                borderRadius: '10px',
                                                border: selectedChain.chainId === chain.chainId
                                                    ? '1px solid var(--colors-primary)'
                                                    : '1px solid transparent',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor: 'var(--colors-surface)',
                                                    transform: 'translateY(-1px)',
                                                    borderColor: 'rgba(255, 107, 0, 0.2)'
                                                },
                                                justifyContent: 'flex-start',
                                                height: 'auto',
                                                width: '100%',
                                                marginBottom: '4px'
                                            }}
                                        >
                                            <Flex justify="between" full css={{ padding: '0' }}>
                                                <Flex gap="2" align="center">
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: 'var(--colors-surface)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--colors-primary)',
                                                        flexShrink: 0
                                                    }}>
                                                        <Globe size={14} />
                                                    </div>

                                                    <div style={{ 
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '2px'
                                                    }}>
                                                        <Text weight="medium" size="sm">{chain.chainName}</Text>
                                                        <Text 
                                                            size="xs" 
                                                            color="muted" 
                                                            css={{ 
                                                                opacity: 0.7,
                                                                fontSize: '0.65rem'
                                                            }}
                                                        >
                                                            {chain.chainType}
                                                        </Text>
                                                    </div>
                                                </Flex>

                                                {selectedChain.chainId === chain.chainId && (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '18px',
                                                        height: '18px',
                                                        backgroundColor: 'var(--colors-primary)',
                                                        borderRadius: '50%',
                                                        color: 'white',
                                                        flexShrink: 0
                                                    }}>
                                                        <Check size={10} />
                                                    </div>
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
                {showSendTransaction && (
                    <SendTransaction
                        wallet={wallet}
                        onBack={() => setShowSendTransaction(false)}
                        initialChain={selectedChain}
                    />
                )}

                {/* Add RequestApproval modal */}
                {showRequestApproval && currentRequest && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{ maxWidth: '90%', maxHeight: '90%', overflow: 'auto' }}>
                            <RequestApproval
                                request={currentRequest}
                                wallet={wallet}
                                onClose={() => setShowRequestApproval(false)}
                                onApprove={handleApproveRequest}
                                onReject={handleRejectRequest}
                                loading={requestActionLoading}
                                error={requestActionError}
                            />
                        </div>
                    </div>
                )}

                {/* Receive Drawer */}
                {showReceiveDrawer && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999,
                        animation: `${fadeIn} 0.3s ease`,
                    }}>
                        <div style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--colors-secondary)',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            padding: '24px',
                            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            height: '90vh',
                            animation: `${slideInUp} 0.3s ease-out`,
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <h2 style={{ 
                                    margin: 0, 
                                    fontSize: '1.2rem', 
                                    fontWeight: 600,
                                    color: 'var(--colors-primary)'
                                }}>
                                    Receive {selectedChain.currencySymbol}
                                </h2>
                                <Button 
                                    variant="close" 
                                    onClick={() => setShowReceiveDrawer(false)}
                                    css={{ padding: '8px' }}
                                >
                                    <X size={18} />
                                </Button>
                            </div>

                            {/* QR Code */}
                            <div className="qr-code-container" style={{ 
                                textAlign: 'center', 
                                marginBottom: '16px',
                                padding: '8px',
                                backgroundColor: 'var(--colors-secondary)',
                                border: '1px solid rgba(255, 107, 0, 0.1)',
                                borderRadius: '16px'
                            }}>
                                <QRCodeSVG
                                    value={`ethereum:${wallet.address}`}
                                    size={200}
                                    bgColor={'#ffffff'}
                                    fgColor={'#000000'}
                                    level={'H'}
                                    includeMargin={true}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '8px',
                                        backgroundColor: '#ffffff'
                                    }}
                                />
                            </div>

                            {/* Address */}
                            <div style={{ 
                                textAlign: 'center', 
                                marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{ fontSize: '14px', color: 'var(--colors-muted)' }}>
                                    Your {selectedChain.chainName} Address
                                </div>
                                <div style={{ 
                                    padding: '12px 16px',
                                    backgroundColor: 'var(--colors-surface)',
                                    borderRadius: '12px',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                    fontSize: '14px',
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis',
                                        color: 'var(--colors-text)'
                                    }}>
                                        {wallet.address}
                                    </span>
                                    <Button
                                        variant="icon"
                                        onClick={() => copyToClipboard(wallet.address)}
                                        css={{ flexShrink: 0, marginLeft: '8px' }}
                                    >
                                        <Copy size={16} />
                                    </Button>
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--colors-muted)' }}>
                                    Scan this QR code or share your address to receive {selectedChain.currencySymbol}
                                </div>
                            </div>

                            {/* Feedback message */}
                            {copySuccess && (
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                                    color: '#27AE60',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    animation: `${fadeIn} 0.3s ease`,
                                    marginBottom: '8px'
                                }}>
                                    <FaCheck size={14} />
                                    <span>{copySuccess}</span>
                                </div>
                            )}

                            {/* Buttons */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                marginTop: '12px',
                                backgroundColor: 'var(--colors-surface)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 107, 0, 0.2)'
                            }}>
                                <Button
                                    variant="outline"
                                    css={{ 
                                        flex: 1,
                                        height: '42px',
                                        border: '1px solid var(--colors-primary)',
                                        backgroundColor: 'rgba(255, 107, 0, 0.05)',
                                        color: 'var(--colors-primary)',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)',
                                            backgroundColor: 'rgba(255, 107, 0, 0.1)'
                                        }
                                    }}
                                    onClick={() => copyToClipboard(wallet.address)}
                                >
                                    <Copy size={16} style={{ marginRight: '8px' }} />
                                    Copy Address
                                </Button>
                                <Button
                                    variant="primary"
                                    css={{ 
                                        flex: 1,
                                        height: '42px',
                                        backgroundColor: 'var(--colors-primary)',
                                        border: '1px solid var(--colors-primary)',
                                        boxShadow: '0 2px 8px rgba(255, 107, 0, 0.2)',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)',
                                            backgroundColor: 'var(--colors-primaryHover)',
                                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)'
                                        }
                                    }}
                                    onClick={downloadQrCode}
                                >
                                    <Download size={16} style={{ marginRight: '8px' }} />
                                    Download QR
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display web mode notice if not in extension context */}
                {!isExtensionContext && (
                    <Card css={{ marginTop: '$4', padding: '$3', backgroundColor: 'rgba(255, 107, 0, 0.1)', border: '1px solid $primary' }}>
                        <Flex gap="2">
                            <Globe size={16} color="var(--colors-primary)" />
                            <Text size="sm">
                                Running in Web Mode: Extension features like website connections and transaction approvals are not available.
                            </Text>
                        </Flex>
                    </Card>
                )}
            </Container>
        </Theme>
    );
}

export default Dashboard;