import React, { useState } from 'react';
import { styled } from '@stitches/react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { keyframes } from '@stitches/react';
import { FaKey, FaClipboard, FaExclamationTriangle, FaArrowLeft, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';

const fadeIn = keyframes({
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
});

const StyledAppContainer = styled('div', {
    maxWidth: '550px',
    margin: '0 auto',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#000000',
    color: '#ffffff',
});

const StyledAppHeader = styled('div', {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #FF8C00',
});

const StyledFlexCenter = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
});

const StyledHeading = styled('h1', {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0,
    color: '#FF8C00',
});

const StyledAppContent = styled('div', {
    animation: `${fadeIn} 300ms ease`,
});

const StyledAlert = styled('div', {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #FF8C00',
    borderRadius: '8px',
    color: '#FF8C00',
});

const StyledAlertTitle = styled('p', {
    fontWeight: '500',
    marginBottom: '4px',
    marginTop: 0,
    color: '#FF8C00',
});

const StyledAlertText = styled('p', {
    fontSize: '0.875rem',
    margin: 0,
    color: '#ffffff',
});

const StyledCard = styled('div', {
    border: '1px solid #333333',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#121212',
});

const StyledCardHeader = styled('div', {
    padding: '16px',
    borderBottom: '1px solid #333333',
    backgroundColor: '#1a1a1a',
});

const StyledCardTitle = styled('h2', {
    fontSize: '1rem',
    fontWeight: '500',
    margin: 0,
    color: '#FF8C00',
});

const StyledSeedPhraseGrid = styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '12px',
    marginBottom: '16px',
});

const StyledSeedWord = styled('div', {
    display: 'flex',
    alignItems: 'center',
    padding: '6px',
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    border: '1px solid #333333',
    color: '#ffffff',
    minHeight: '30px',
    wordBreak: 'break-word',
    overflow: 'hidden'
});

const StyledSeedWordNumber = styled('span', {
    marginRight: '4px',
    color: '#FF8C00',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    minWidth: '16px'
});

const StyledCardFooter = styled('div', {
    padding: '16px',
    borderTop: '1px solid #333333',
    display: 'flex',
    justifyContent: 'center',
});

const StyledErrorAlert = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    marginBottom: '12px',
    backgroundColor: '#2a0d0d',
    border: '1px solid #f87171',
    borderRadius: '8px',
    color: '#f87171',
});

const StyledTextarea = styled('textarea', {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '6px',
    border: '1px solid #333333',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    '&:focus': {
        outline: 'none',
        borderColor: '#FF8C00',
        boxShadow: '0 0 0 2px rgba(255, 140, 0, 0.3)',
    },
    '&::placeholder': {
        color: '#666666',
    },
});

const StyledButtonGroup = styled('div', {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
});

const StyledButton = styled('button', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    '&:focus': {
        outline: 'none',
    },
    variants: {
        variant: {
            primary: {
                backgroundColor: '#FF8C00',
                color: 'black',
                '&:hover': {
                    backgroundColor: '#FF7000',
                },
            },
            secondary: {
                backgroundColor: '#2a2a2a',
                color: '#d4d4d4',
                '&:hover': {
                    backgroundColor: '#333333',
                },
            },
        },
        fullWidth: {
            true: {
                width: '100%',
            },
        },
        flex: {
            1: {
                flex: 1,
            },
        },
    },
});

// Add a clipboard copy notification style
const CopyNotification = styled('div', {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: 999,
    animation: 'fadeIn 0.3s ease-out',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    '&.visible': {
        opacity: 1
    }
});

function SeedPhrase({ mnemonic, onConfirmed }) {
    const [confirmSeed, setConfirmSeed] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Split the mnemonic into an array of words
    const seedWords = mnemonic.split(' ');

    const handleConfirm = () => {
        // Check if the user correctly entered the seed phrase
        if (userInput.trim() === mnemonic.trim()) {
            onConfirmed();
        } else {
            setError('The seed phrase you entered does not match. Please try again.');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(mnemonic);
        setCopied(true);
        
        // Create a temporary element to show the notification
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5.8 10.6L3.4 8.2L2 9.6L5.8 13.4L14 5.2L12.6 3.8L5.8 10.6Z" fill="#4CAF50"/>
            </svg>
            <span>Seed phrase copied!</span>
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
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                10% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Remove the notification after animation completes
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 3000);
        
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <StyledAppContainer>
            <StyledAppHeader>
                <StyledFlexCenter>
                    <FaKey size={22} color="#FF8C00" />
                    <StyledHeading>Recovery Seed Phrase</StyledHeading>
                </StyledFlexCenter>
            </StyledAppHeader>

            <StyledAppContent>
                <StyledAlert>
                    <FaExclamationTriangle size={20} color="#FF8C00" />
                    <div>
                        <StyledAlertTitle>IMPORTANT</StyledAlertTitle>
                        <StyledAlertText>
                            Never share your seed phrase. Anyone with this phrase can take your assets forever.
                            Write these words down on paper and store in a secure location.
                        </StyledAlertText>
                    </div>
                </StyledAlert>

                {!confirmSeed ? (
                    <>
                        <StyledCard>
                            <StyledCardHeader>
                                <StyledFlexCenter css={{ justifyContent: 'flex-start' }}>
                                    <FaShieldAlt color="#FF8C00" />
                                    <StyledCardTitle>Your Recovery Seed Phrase</StyledCardTitle>
                                </StyledFlexCenter>
                            </StyledCardHeader>

                            <StyledSeedPhraseGrid>
                                {seedWords.map((word, index) => (
                                    <StyledSeedWord key={index}>
                                        <StyledSeedWordNumber>{index + 1}</StyledSeedWordNumber>
                                        {word}
                                    </StyledSeedWord>
                                ))}
                            </StyledSeedPhraseGrid>

                            <StyledCardFooter>
                                <StyledButton variant="secondary" onClick={handleCopy}>
                                    <FaClipboard size={14} color="#FF8C00" />
                                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                                </StyledButton>
                            </StyledCardFooter>
                        </StyledCard>

                        <StyledButtonGroup>
                            <StyledButton
                                variant="primary"
                                fullWidth
                                onClick={() => setConfirmSeed(true)}
                            >
                                <FaCheckCircle size={14} />
                                <span>I've Backed Up My Seed Phrase</span>
                            </StyledButton>
                        </StyledButtonGroup>
                    </>
                ) : (
                    <>
                        <StyledCard>
                            <StyledCardHeader>
                                <StyledCardTitle>Verify Your Backup</StyledCardTitle>
                            </StyledCardHeader>

                            <div style={{ padding: '16px' }}>
                                <StyledAlertText css={{ color: '#cccccc', marginBottom: '12px' }}>
                                    Please enter your seed phrase to confirm you've backed it up:
                                </StyledAlertText>

                                {error && (
                                    <StyledErrorAlert>
                                        <FaExclamationTriangle size={14} />
                                        <span>{error}</span>
                                    </StyledErrorAlert>
                                )}

                                <StyledTextarea
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="Enter your seed phrase with spaces between each word"
                                    rows={4}
                                />
                            </div>
                        </StyledCard>

                        <StyledButtonGroup>
                            <StyledButton
                                variant="secondary"
                                flex="1"
                                onClick={() => setConfirmSeed(false)}
                            >
                                <FaArrowLeft size={14} />
                                <span>Back</span>
                            </StyledButton>
                            <StyledButton
                                variant="primary"
                                flex="1"
                                onClick={handleConfirm}
                            >
                                <FaCheckCircle size={14} />
                                <span>Confirm</span>
                            </StyledButton>
                        </StyledButtonGroup>
                    </>
                )}
            </StyledAppContent>
        </StyledAppContainer>
    );
}

export default SeedPhrase;