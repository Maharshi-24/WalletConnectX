"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { ethers } from "ethers"
import { CHAINS_CONFIG, ethereum, sepolia, polygon, amoy, dojima } from "./interfaces/Chain"
import {
    FaWallet,
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
    FaExternalLinkAlt,
} from "react-icons/fa"
import * as Tabs from "@radix-ui/react-tabs"
import * as Dialog from "@radix-ui/react-dialog"
import * as Toast from "@radix-ui/react-toast"
import { styled, keyframes } from "@stitches/react"

// Styled components with Stitches
const StyledContainer = styled("div", {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: "#000000",
    color: "#ffffff",
    height: "100%",
    minHeight: "100vh"
})

const StyledHeader = styled("header", {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255, 128, 0, 0.2)",
    backgroundColor: "#0D0D0D",
    color: "#ffffff"
})

const StyledContent = styled("div", {
    padding: "16px",
    backgroundColor: "#000000",
    color: "#ffffff",
    '&::-webkit-scrollbar': {
        width: '6px',
        height: '6px'
    },
    '&::-webkit-scrollbar-track': {
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '10px'
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255, 128, 0, 0.5)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 128, 0, 0.2)',
        backgroundClip: 'padding-box'
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(255, 128, 0, 0.7)',
        border: '1px solid rgba(255, 128, 0, 0.3)'
    },
    '&::-webkit-scrollbar-corner': {
        background: 'transparent'
    }
})

const StyledCard = styled("div", {
    background: "#000000",
    borderRadius: "16px",
    boxShadow: "0 4px 12px#000000",
    overflow: "hidden",
    marginBottom: "16px",
    width: "100%",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
    },
    variants: {
        hoverable: {
            true: {
                "&:hover": {
                    transform: "translateY(-4px)",
                },
            },
        },
    },
})

const StyledCardHeader = styled("div", {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0D0D0D",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#ffffff"
})

const StyledCardTitle = styled("h2", {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
})

const StyledCardBody = styled("div", {
    padding: "16px",
})

const StyledButton = styled("button", {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s, opacity 0.2s",
    "&:disabled": {
        opacity: 0.6,
        cursor: "not-allowed",
    },
    "&:focus": {
        outline: "none",
        boxShadow: "0 0 0 2px rgba(255, 128, 0, 0.4)",
    },
    variants: {
        variant: {
            primary: {
                background: "#FF8000",
                color: "white",
                "&:hover": {
                    background: "#E67300",
                },
            },
            secondary: {
                background: "#f1f1f1",
                color: "#222",
                "&:hover": {
                    background: "#e5e5e5",
                },
            },
            danger: {
                background: "#ff4d4f",
                color: "white",
                "&:hover": {
                    background: "#ff1f1f",
                },
            },
            icon: {
                padding: "8px",
                borderRadius: "8px",
            },
        },
        size: {
            small: {
                padding: "6px 12px",
                fontSize: "12px",
            },
            full: {
                width: "100%",
            },
        },
    },
    defaultVariants: {
        variant: "primary",
    },
})

const StyledTabs = styled(Tabs.Root, {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "400px"
})

const StyledTabsList = styled(Tabs.List, {
    flexShrink: 0,
    display: "flex",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "16px",
    overflowX: "auto",
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#0D0D0D"
})

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const StyledTabsTrigger = styled(Tabs.Trigger, {
    all: "unset",
    fontFamily: "inherit",
    padding: "12px 16px",
    height: 45,
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    gap: "6px",
    color: "rgba(255, 255, 255, 0.6)",
    userSelect: "none",
    "&:hover": { color: "#FF8000" },
    '&[data-state="active"]': {
        color: "#FF8000",
        fontWeight: 500,
        boxShadow: "inset 0 -2px 0 0 #FF8000",
    },
})

const StyledTabsContent = styled(Tabs.Content, {
    flexGrow: 1,
    outline: "none",
    animation: `${fadeIn} 200ms ease`,
    width: "100%",
    maxWidth: "100%"
})

const StyledInput = styled("input", {
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    width: "100%",
    background: "#f8f9fa",
    "&:focus": {
        outline: "none",
        borderColor: "#FF8000",
        boxShadow: "0 0 0 2px rgba(255, 128, 0, 0.2)",
    },
})

const StyledAlert = styled("div", {
    padding: "12px 16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginTop: "12px",
    variants: {
        variant: {
            warning: {
                background: "rgba(255, 170, 0, 0.1)",
                color: "#9a6700",
                border: "1px solid rgba(255, 170, 0, 0.2)",
            },
            danger: {
                background: "rgba(255, 77, 79, 0.1)",
                color: "#cf1322",
                border: "1px solid rgba(255, 77, 79, 0.2)",
            },
            success: {
                background: "rgba(82, 196, 26, 0.1)",
                color: "#389e0d",
                border: "1px solid rgba(82, 196, 26, 0.2)",
            },
            info: {
                background: "rgba(24, 144, 255, 0.1)",
                color: "#096dd9",
                border: "1px solid rgba(24, 144, 255, 0.2)",
            },
        },
    },
})

const StyledDialogOverlay = styled(Dialog.Overlay, {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "fixed",
    inset: 0,
    animation: `${fadeIn} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
})

const slideUp = keyframes({
    from: { transform: "translate(-50%, 20%)", opacity: 0 },
    to: { transform: "translate(-50%, 0)", opacity: 1 },
})

const StyledDialogContent = styled(Dialog.Content, {
    backgroundColor: "#0D0D0D",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, 0)",
    width: "90vw",
    maxWidth: "500px",
    maxHeight: "85vh",
    padding: "24px",
    animation: `${slideUp} 250ms cubic-bezier(0.16, 1, 0.3, 1)`,
    "&:focus": { outline: "none" },
    color: "#ffffff"
})

const StyledDialogTitle = styled(Dialog.Title, {
    margin: 0,
    fontWeight: 600,
    fontSize: "18px",
    marginBottom: "16px",
})

// Add animation keyframes
const slideInUpAnimation = keyframes({
    "0%": { transform: "translateY(100%)", opacity: 0 },
    "100%": { transform: "translateY(0)", opacity: 1 }
});

const slideOutDownAnimation = keyframes({
    "0%": { transform: "translateY(0)", opacity: 1 },
    "100%": { transform: "translateY(100%)", opacity: 0 }
});

const progressAnimation = keyframes({
    "0%": { width: "100%" },
    "100%": { width: "0%" }
});

// Style the toast properly
const StyledToastRoot = styled(Toast.Root, {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: "10px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#FFFFFF",
    zIndex: 999,
    minWidth: "250px",
    border: "1px solid rgba(255, 128, 0, 0.2)",
    
    "&[data-state='open']": {
        animation: `${slideInUpAnimation} 300ms ease forwards`
    },
    
    "&[data-state='closed']": {
        animation: `${slideOutDownAnimation} 300ms ease forwards`
    }
});

const StyledToastProgressBar = styled("div", {
    position: "absolute",
    bottom: "0",
    left: "0",
    height: "3px",
    backgroundColor: "#FF8000",
    borderBottomLeftRadius: "10px",
    animation: `${progressAnimation} 3s linear forwards`
});

const StyledToastIcon = styled("div", {
    marginRight: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FF8000"
});

const StyledToastContent = styled("div", {
    flex: 1,
    fontSize: "14px"
});

const StyledNetworkItem = styled("div", {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background 0.2s ease",
    "&:hover": {
        background: "#1A1A1A",
    },
    variants: {
        active: {
            true: {
                background: "rgba(255, 128, 0, 0.1)",
                "&:hover": {
                    background: "rgba(255, 128, 0, 0.15)",
                },
            },
        },
    },
})

const StyledTransactionItem = styled("div", {
    padding: "12px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #eaecef",
    "&:last-child": {
        borderBottom: "none",
    },
})

const StyledTransactionIcon = styled("div", {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    variants: {
        type: {
            incoming: {
                background: "rgba(82, 196, 26, 0.1)",
                color: "#389e0d",
            },
            outgoing: {
                background: "rgba(255, 77, 79, 0.1)",
                color: "#cf1322",
            },
        },
    },
})

const StyledInfoBox = styled("div", {
    background: "#0D0D0D",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    margin: "8px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#ffffff",
    variants: {
        monospace: {
            true: {
                fontFamily: "monospace",
            },
        },
        clickable: {
            true: {
                cursor: "pointer",
                "&:hover": {
                    background: "#1A1A1A",
                },
            },
        },
    },
    "& span.private-key": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "calc(100% - 30px)",
    }
})

const StyledQrContainer = styled("div", {
    display: "flex",
    justifyContent: "center",
    padding: "24px 0",
})

const TrustedSitesContainer = styled('div', {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
});

const TrustedSitesList = styled('ul', {
    listStyle: 'none',
    padding: '0',
    margin: '12px 0 0 0',
});

const TrustedSiteItem = styled('li', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #333',
    fontSize: '14px',
    
    '&:last-child': {
        borderBottom: 'none',
    }
});

const RemoveButton = styled('button', {
    background: '#E74C3C',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    
    '&:hover': {
        background: '#C0392B',
    }
});

function Settings({ wallet, onBack, selectedChain, onNetworkChange, onLogout }) {
    const [showPrivateKey, setShowPrivateKey] = useState(false)
    const [copySuccess, setCopySuccess] = useState("")
    const [availableChains, setAvailableChains] = useState([])
    const [currentNetwork, setCurrentNetwork] = useState(selectedChain || ethereum)
    const [activeTab, setActiveTab] = useState("wallet")
    const [isToastOpen, setIsToastOpen] = useState(false)
    const [toastMessage, setToastMessage] = useState("")
    const [trustedSites, setTrustedSites] = useState([]);
    
    // Define isExtension properly
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

    useEffect(() => {
        // Load available chains
        const chains = Object.values(CHAINS_CONFIG)
        setAvailableChains(chains)
    }, [])

    // Fetch trusted sites on component mount - add safety check
    useEffect(() => {
        if (isExtension) {
            getTrustedSites();
        }
    }, [isExtension]);

    // Function to get trusted sites from background - add safety checks
    const getTrustedSites = async () => {
        if (!isExtension) return;
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'WALLETX_GET_TRUSTED_SITES'
            });
            
            if (response && response.success) {
                setTrustedSites(response.trustedSites || []);
            }
        } catch (error) {
            console.error('Error fetching trusted sites:', error);
        }
    };

    // Function to remove a site from trusted sites - add safety checks
    const removeTrustedSite = async (domain) => {
        if (!isExtension) return;
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'WALLETX_REMOVE_TRUSTED_SITE',
                domain
            });
            
            if (response && response.success) {
                setTrustedSites(trustedSites.filter(site => site !== domain));
                showNotification('Site removed from trusted list');
            }
        } catch (error) {
            console.error('Error removing trusted site:', error);
        }
    };
    
    // Add missing showNotification function
    const showNotification = (message) => {
        setToastMessage(message);
        setIsToastOpen(true);
        
        // Auto close after 3 seconds
        setTimeout(() => {
            setIsToastOpen(false);
        }, 3000);
    };

    const togglePrivateKey = () => {
        setShowPrivateKey(!showPrivateKey)
    }

    const copyToClipboard = (text, message = "Copied!") => {
        navigator.clipboard.writeText(text).then(() => {
            setToastMessage(message)
            setIsToastOpen(true)
            
            // Close toast after 3 seconds
            setTimeout(() => {
                setIsToastOpen(false)
            }, 3000)
        })
    }

    const handleNetworkChange = (chain) => {
        setCurrentNetwork(chain)
        if (onNetworkChange) {
            onNetworkChange(chain)
        }
    }

    const downloadQrCode = () => {
        const canvas = document.querySelector(".qr-code-container canvas")
        if (canvas) {
            const dataUrl = canvas.toDataURL("image/png")
            const link = document.createElement("a")
            link.download = `${wallet.address.substring(0, 8)}_qrcode.png`
            link.href = dataUrl
            link.click()
        }
    }

    // Wallet Information Section
    const renderWalletInfo = () => (
        <StyledCard>
            <StyledCardHeader>
                <StyledCardTitle style={{ color: "#FF8000" }}>
                    <FaWallet style={{ color: "#FF8000" }} />
                    Wallet Information
                </StyledCardTitle>
            </StyledCardHeader>

            <StyledCardBody style={{ width: "100%" }}>
                <div style={{ marginBottom: "16px", width: "100%" }}>
                    <div style={{ fontSize: "14px", color: "#999999", marginBottom: "8px" }}>Wallet Address</div>
                    <StyledInfoBox style={{ width: "100%" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{wallet.address}</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <StyledButton
                                variant="icon"
                                size="small"
                                onClick={() => copyToClipboard(wallet.address, "Address copied!")}
                                aria-label="Copy address"
                            >
                                <FaCopy size={14} />
                            </StyledButton>
                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <StyledButton variant="icon" size="small" aria-label="Show QR Code">
                                        <FaQrcode size={14} />
                                    </StyledButton>
                                </Dialog.Trigger>
                                <Dialog.Portal>
                                    <StyledDialogOverlay />
                                    <StyledDialogContent>
                                        <StyledDialogTitle>Receive {currentNetwork.currencySymbol}</StyledDialogTitle>
                                        <Dialog.Description style={{ display: "none" }}>
                                            Scan this QR code to receive cryptocurrency
                                        </Dialog.Description>
                                        <div className="qr-code-container" style={{ textAlign: "center", marginBottom: "16px" }}>
                                            <QRCodeSVG
                                                value={`ethereum:${wallet.address}`}
                                                size={250}
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"H"}
                                                includeMargin={true}
                                                style={{
                                                    borderRadius: "8px",
                                                    padding: "8px",
                                                    backgroundColor: "#ffffff"
                                                }}
                                            />
                                        </div>

                                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                                            <div
                                                style={{
                                                    fontFamily: "monospace",
                                                    wordBreak: "break-all",
                                                    fontSize: "14px",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                {wallet.address}
                                            </div>
                                            <div style={{ fontSize: "14px", color: "#999999" }}>
                                                Scan this QR code to receive {currentNetwork.currencySymbol}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                                            <StyledButton
                                                variant="secondary"
                                                size="full"
                                                onClick={() => copyToClipboard(wallet.address, "Address copied!")}
                                            >
                                                <FaCopy style={{ marginRight: "8px" }} />
                                                Copy Address
                                            </StyledButton>
                                            <StyledButton variant="primary" size="full" onClick={downloadQrCode}>
                                                <FaDownload style={{ marginRight: "8px" }} />
                                                Download
                                            </StyledButton>
                                        </div>

                                        <Dialog.Close asChild>
                                            <StyledButton
                                                variant="secondary"
                                                size="small"
                                                style={{ position: "absolute", top: "16px", right: "16px" }}
                                                aria-label="Close"
                                            >
                                                <FaTimes />
                                            </StyledButton>
                                        </Dialog.Close>
                                    </StyledDialogContent>
                                </Dialog.Portal>
                            </Dialog.Root>
                        </div>
                    </StyledInfoBox>
                </div>

                <div style={{ width: "100%" }}>
                    <div style={{ fontSize: "14px", color: "#999999", marginBottom: "8px" }}>Private Key</div>
                    <StyledInfoBox monospace>
                        <span className="private-key" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {showPrivateKey ? wallet.privateKey : "•".repeat(40)}
                        </span>
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                            {showPrivateKey && (
                                <StyledButton
                                    variant="icon"
                                    size="small"
                                    onClick={() => copyToClipboard(wallet.privateKey, "Private key copied!")}
                                    aria-label="Copy private key"
                                >
                                    <FaCopy size={14} />
                                </StyledButton>
                            )}
                            <StyledButton
                                variant="icon"
                                size="small"
                                onClick={togglePrivateKey}
                                aria-label={showPrivateKey ? "Hide private key" : "Show private key"}
                            >
                                {showPrivateKey ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                            </StyledButton>
                        </div>
                    </StyledInfoBox>
                </div>

                <StyledAlert variant="warning" style={{ marginTop: "16px", width: "100%" }}>
                    <FaExclamationTriangle style={{ flexShrink: 0, marginTop: "3px" }} />
                    <div style={{ fontSize: "14px" }}>
                        Never share your private key with anyone! Anyone with your private key can access and transfer your funds.
                    </div>
                </StyledAlert>
            </StyledCardBody>
        </StyledCard>
    )

    // Network Settings Section
    const renderNetworkSettings = () => (
        <StyledCard>
            <StyledCardHeader>
                <StyledCardTitle style={{ color: "#FF8000" }}>
                    <FaNetworkWired style={{ color: "#FF8000" }} />
                    Network Settings
                </StyledCardTitle>
            </StyledCardHeader>

            <StyledCardBody style={{ width: "100%" }}>
                <div style={{ fontSize: "14px", color: "#999999", marginBottom: "12px" }}>Select Default Network</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    {availableChains.map((chain) => (
                        <StyledNetworkItem
                            key={chain.chainId}
                            active={currentNetwork.chainId === chain.chainId}
                            onClick={() => handleNetworkChange(chain)}
                            style={{ width: "100%" }}
                        >
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        background: "rgba(255, 128, 0, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: "12px",
                                        color: "#FF8000",
                                    }}
                                >
                                    <FaEthereum />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{chain.chainName}</div>
                                    <div style={{ fontSize: "12px", color: "#999999" }}>
                                        {chain.chainType} - {chain.currencySymbol}
                                    </div>
                                </div>
                            </div>
                            {currentNetwork.chainId === chain.chainId && (
                                <div style={{ color: "#FF8000" }}>
                                    <FaCheck />
                                </div>
                            )}
                        </StyledNetworkItem>
                    ))}
                </div>
            </StyledCardBody>
        </StyledCard>
    )

    // Security Settings
    const renderSecuritySettings = () => (
        <StyledCard>
            <StyledCardHeader>
                <StyledCardTitle style={{ color: "#FF8000" }}>
                    <FaShieldAlt style={{ color: "#FF8000" }} />
                    Security
                </StyledCardTitle>
            </StyledCardHeader>

            <StyledCardBody style={{ width: "100%" }}>
                <StyledButton
                    variant="secondary"
                    size="full"
                    style={{ marginBottom: "12px", width: "100%" }}
                    onClick={() => {
                        /* This would open a change password modal */
                    }}
                >
                    <FaLock style={{ marginRight: "8px" }} />
                    Change Password
                </StyledButton>

                <StyledButton variant="danger" size="full" style={{ width: "100%" }} onClick={onLogout}>
                    <FaSignOutAlt style={{ marginRight: "8px" }} />
                    Logout
                </StyledButton>

                <StyledAlert variant="info" style={{ marginTop: "16px", width: "100%" }}>
                    <FaShieldAlt style={{ flexShrink: 0, marginTop: "3px" }} />
                    <div style={{ fontSize: "14px" }}>
                        Remember to keep your recovery phrase and private key in a safe place. They're the only way to recover your
                        wallet if you lose access.
                    </div>
                </StyledAlert>
            </StyledCardBody>
        </StyledCard>
    )

    return (
        <StyledContainer>
            <StyledHeader>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <StyledButton
                        variant="icon"
                        size="small"
                        onClick={onBack}
                        style={{ 
                            marginRight: "12px",
                            backgroundColor: "#1A1A1A",
                            color: "#FF8000",
                            padding: "10px",
                            borderRadius: "50%"
                        }}
                        aria-label="Go back"
                    >
                        <FaArrowLeft size={14} />
                    </StyledButton>
                    <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#FF8000" }}>Settings</h1>
                </div>
            </StyledHeader>

            <StyledContent>
                <StyledTabs defaultValue={activeTab} onValueChange={setActiveTab}>
                    <StyledTabsList aria-label="Settings options">
                        <StyledTabsTrigger value="wallet">
                            <FaWallet style={{ marginRight: "6px" }} />
                            Wallet
                        </StyledTabsTrigger>
                        
                        <StyledTabsTrigger value="network">
                            <FaNetworkWired style={{ marginRight: "6px" }} />
                            Networks
                        </StyledTabsTrigger>
                        
                        <StyledTabsTrigger value="security">
                            <FaShieldAlt style={{ marginRight: "6px" }} />
                            Security
                        </StyledTabsTrigger>
                    </StyledTabsList>

                    <StyledTabsContent value="wallet">{renderWalletInfo()}</StyledTabsContent>

                    <StyledTabsContent value="network">{renderNetworkSettings()}</StyledTabsContent>

                    <StyledTabsContent value="security">{renderSecuritySettings()}</StyledTabsContent>
                </StyledTabs>

                {/* App Version */}
                <div style={{ textAlign: "center", color: "#999999", fontSize: "12px", marginTop: "24px" }}>
                    Ethereum Wallet v1.0.0
                </div>

                {isExtension && (
                    <TrustedSitesContainer>
                        <StyledCardHeader>
                            <StyledCardTitle style={{ color: "#FF8000" }}>
                                <FaNetworkWired style={{ color: "#FF8000" }} />
                                Trusted Sites
                            </StyledCardTitle>
                        </StyledCardHeader>
                        
                        <StyledCardBody style={{ width: "100%" }}>
                            <div style={{ fontSize: "14px", color: "#999999", marginBottom: "12px" }}>
                                These sites will be automatically approved for connection without confirmation prompts.
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                                {trustedSites.length > 0 ? (
                                    trustedSites.map((site, index) => (
                                        <TrustedSiteItem key={index}>
                                            {site}
                                            <RemoveButton onClick={() => removeTrustedSite(site)}>
                                                Remove
                                            </RemoveButton>
                                        </TrustedSiteItem>
                                    ))
                                ) : (
                                    <div style={{ fontStyle: 'italic', color: '#777' }}>
                                        No trusted sites added yet
                                    </div>
                                )}
                            </div>
                        </StyledCardBody>
                    </TrustedSitesContainer>
                )}
            </StyledContent>

            {/* Improved Toast Notification */}
            <Toast.Provider swipeDirection="down">
                <StyledToastRoot open={isToastOpen} onOpenChange={setIsToastOpen}>
                    <StyledToastIcon>
                        <FaCheck size={16} />
                    </StyledToastIcon>
                    <StyledToastContent>{toastMessage}</StyledToastContent>
                    <StyledToastProgressBar />
                </StyledToastRoot>
                <Toast.Viewport />
            </Toast.Provider>

            {/* Global styles */}
            <style jsx global>{`
                @keyframes spinner {
                    to {transform: rotate(360deg);}
                }
                
                .loading-spinner {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid rgba(255, 128, 0, 0.1);
                    border-top-color: #FF8000;
                    animation: spinner 0.8s linear infinite;
                    margin: 0 auto;
                }
                
                body {
                    background-color: #000000;
                    color: #FFFFFF;
                }
                
                .ToastRoot {
                    background-color: #1A1A1A;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    border: 1px solid rgba(255, 128, 0, 0.2);
                }
            `}</style>
        </StyledContainer>
    )
}

export default Settings

