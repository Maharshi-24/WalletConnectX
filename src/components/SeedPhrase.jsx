import React, { useState } from 'react';
import { FaKey, FaClipboard, FaExclamationTriangle, FaArrowLeft, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';

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
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="app-container">
            <div className="app-header">
                <div className="flex items-center justify-center">
                    <FaKey size={22} color="#037dd6" className="mr-2" />
                    <h1 className="text-lg font-semibold m-0">Recovery Seed Phrase</h1>
                </div>
            </div>
            
            <div className="app-content">
                <div className="alert alert-warning mb-4">
                    <FaExclamationTriangle />
                    <div>
                        <p className="font-medium mb-1">IMPORTANT</p>
                        <p className="text-sm m-0">
                            Never share your seed phrase. Anyone with this phrase can take your assets forever.
                            Write these words down on paper and store in a secure location.
                        </p>
                    </div>
                </div>

                {!confirmSeed ? (
                    <>
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center">
                                    <FaShieldAlt className="text-primary mr-2" />
                                    <h2 className="card-title">Your Recovery Seed Phrase</h2>
                                </div>
                            </div>
                            
                            <div className="seed-phrase-grid">
                                {seedWords.map((word, index) => (
                                    <div key={index} className="seed-word">
                                        <span className="seed-word-number">{index + 1}</span>
                                        {word}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="card-footer flex justify-center">
                                <button 
                                    onClick={handleCopy}
                                    className="btn btn-secondary"
                                >
                                    <FaClipboard className="mr-1" />
                                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button 
                                onClick={() => setConfirmSeed(true)}
                                className="btn btn-primary btn-full"
                            >
                                <FaCheckCircle className="mr-1" />
                                <span>I've Backed Up My Seed Phrase</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Verify Your Backup</h2>
                            </div>
                            
                            <p className="text-secondary text-sm mb-3">
                                Please enter your seed phrase to confirm you've backed it up:
                            </p>

                            {error && (
                                <div className="alert alert-danger mb-3">
                                    <FaExclamationTriangle />
                                    <span>{error}</span>
                                </div>
                            )}

                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Enter your seed phrase with spaces between each word"
                                rows={4}
                                className="form-control mb-3"
                            />
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => setConfirmSeed(false)}
                                className="btn btn-secondary flex-1"
                            >
                                <FaArrowLeft className="mr-1" />
                                <span>Back</span>
                            </button>
                            <button 
                                onClick={handleConfirm}
                                className="btn btn-primary flex-1"
                            >
                                <FaCheckCircle className="mr-1" />
                                <span>Confirm</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default SeedPhrase;