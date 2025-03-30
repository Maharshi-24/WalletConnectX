import React, { useState, useEffect } from 'react';
import { createWallet } from '../services/wallet.jsx';
import { saveWalletData } from '../services/storage.jsx';
import SeedPhrase from './SeedPhrase.jsx';
import { 
    FaPlus, 
    FaLock, 
    FaExclamationTriangle, 
    FaShieldAlt, 
    FaCheck, 
    FaInfoCircle 
} from 'react-icons/fa';

function WalletCreate({ onWalletReady }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newWallet, setNewWallet] = useState(null);
    const [showSeedPhrase, setShowSeedPhrase] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Check password strength
    useEffect(() => {
        if (!password) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        // Length check
        if (password.length >= 8) strength += 1;
        // Contains number
        if (/\d/.test(password)) strength += 1;
        // Contains lowercase
        if (/[a-z]/.test(password)) strength += 1;
        // Contains uppercase
        if (/[A-Z]/.test(password)) strength += 1;
        // Contains special char
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

        setPasswordStrength(strength);
    }, [password]);

    const getPasswordStrengthLabel = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength < 3) return 'Weak';
        if (passwordStrength < 5) return 'Good';
        return 'Strong';
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength < 3) return 'text-danger';
        if (passwordStrength < 5) return 'text-warning';
        return 'text-success';
    };

    const handleCreateWallet = async (e) => {
        e.preventDefault();

        // Basic validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Create a new wallet
            const result = await createWallet();

            if (result.success) {
                setNewWallet(result.wallet);
                setShowSeedPhrase(true);
            } else {
                setError(result.error || 'Failed to create wallet');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedPhraseConfirmed = () => {
        // Save wallet data securely after seed phrase is confirmed
        saveWalletData(newWallet, password);

        // Notify parent component
        onWalletReady(newWallet);
    };

    if (showSeedPhrase && newWallet) {
        return (
            <SeedPhrase
                mnemonic={newWallet.mnemonic}
                onConfirmed={handleSeedPhraseConfirmed}
            />
        );
    }

    return (
        <div>
            <div className="card shadow">
                <div className="card-header">
                    <div className="flex items-center">
                        <FaPlus className="text-primary mr-2" />
                        <h2 className="card-title">Create New Wallet</h2>
                    </div>
                </div>
                
                {error && (
                    <div className="alert alert-danger mb-3">
                        <FaExclamationTriangle />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleCreateWallet}>
                    <div className="form-group">
                        <label className="form-label flex items-center">
                            <FaLock size={14} className="mr-1" />
                            <span>Password to Encrypt Wallet</span>
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                id="createPassword"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password (min. 8 characters)"
                                className="form-control"
                                required
                                autoComplete="new-password"
                            />
                            {password && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                                        {getPasswordStrengthLabel()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="form-helper mt-1">
                            <div className="flex items-center">
                                <FaInfoCircle size={12} className="mr-1 text-secondary" />
                                This password will be used to encrypt your wallet data
                            </div>
                            {password && (
                                <div className="password-strength-bar mt-1 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                        className={`h-full rounded-full ${
                                            passwordStrength < 3 ? 'bg-danger' : 
                                            passwordStrength < 5 ? 'bg-warning' : 'bg-success'
                                        }`}
                                        style={{ width: `${passwordStrength * 20}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label flex items-center">
                            <FaLock size={14} className="mr-1" />
                            <span>Confirm Password</span>
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                id="confirmCreatePassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="form-control"
                                required
                                autoComplete="new-password"
                            />
                            {confirmPassword && password === confirmPassword && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-success">
                                    <FaCheck size={14} />
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full hover-scale"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner mr-2"></div>
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <FaPlus className="mr-1" />
                                <span>Create New Wallet</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            <div className="alert alert-warning mt-3">
                <FaShieldAlt />
                <div>
                    <h3 className="text-sm font-semibold mb-1">Important</h3>
                    <p className="text-sm m-0">
                        You'll be shown a recovery seed phrase after creating your wallet. Make sure to back it up securely - it's the only way to recover your wallet if you lose access.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default WalletCreate;