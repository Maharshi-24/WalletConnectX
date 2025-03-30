import React, { useState, useEffect } from 'react';
import { connectWalletWithPrivateKey, isValidPrivateKey } from '../services/wallet.jsx';
import {
    saveWalletData,
    walletExists,
    getWalletData,
    hasStoredPassword,
    verifyPassword
} from '../services/storage.jsx';
import { FaEye, FaEyeSlash, FaKey, FaLock, FaShieldAlt, FaExclamationTriangle, FaCheck, FaInfoCircle } from 'react-icons/fa';

function WalletConnect({ onWalletReady }) {
    const [privateKey, setPrivateKey] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [isNewUser, setIsNewUser] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Check if user is new or returning on component mount
    useEffect(() => {
        // If the user has a stored password, they're a returning user
        const hasPassword = hasStoredPassword();
        setIsNewUser(!hasPassword);
    }, []);

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

    const validateForm = () => {
        // Clear previous errors
        setError('');

        // Check if private key is provided
        if (!privateKey.trim()) {
            setError('Please enter your private key');
            return false;
        }

        // Check if private key has valid format
        if (!isValidPrivateKey(privateKey)) {
            setError('Invalid private key format');
            return false;
        }

        // Check if password is provided
        if (!password) {
            setError('Please enter a password');
            return false;
        }

        // For new users, perform additional password validation
        if (isNewUser) {
            // Check password length
            if (password.length < 8) {
                setError('Password must be at least 8 characters long');
                return false;
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        } else {
            // For returning users, verify the password
            if (!verifyPassword(password)) {
                setError('Incorrect password. Please try again.');
                return false;
            }
        }

        return true;
    };

    const handleConnect = async (e) => {
        e.preventDefault();

        // Validate form inputs
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Connect to wallet using private key
            const result = await connectWalletWithPrivateKey(privateKey);

            if (result.success) {
                // Save wallet data securely
                const walletData = {
                    address: result.wallet.address,
                    privateKey: result.wallet.privateKey,
                    balance: result.wallet.balance,
                    mnemonic: null,
                    type: 'imported'
                };

                // Save wallet data with password
                const saved = saveWalletData(walletData, password);

                if (saved) {
                    // Notify parent component
                    onWalletReady(walletData);
                } else {
                    setError('Failed to securely save wallet data');
                }
            } else {
                setError(result.error || 'Failed to connect wallet');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePrivateKeyVisibility = () => {
        setShowPrivateKey(!showPrivateKey);
    };

    return (
        <div>
            <div className="card shadow">
                <div className="card-header">
                    <div className="flex items-center">
                        <FaKey className="text-primary mr-2" />
                        <h2 className="card-title">Connect Your Wallet</h2>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger mb-3">
                        <FaExclamationTriangle />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleConnect}>
                    <div className="form-group">
                        <label className="form-label flex items-center">
                            <FaKey size={14} className="mr-1" />
                            <span>Private Key</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPrivateKey ? "text" : "password"}
                                id="privateKey"
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                placeholder="Enter your private key"
                                className="form-control pr-10"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={togglePrivateKeyVisibility}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary p-1"
                            >
                                {showPrivateKey ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <div className="form-helper flex items-center mt-1">
                            <FaInfoCircle size={12} className="mr-1 text-secondary" />
                            Your private key is used to import your existing wallet
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label flex items-center">
                            <FaLock size={14} className="mr-1" />
                            <span>{isNewUser ? 'Create Password' : 'Enter Password'}</span>
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isNewUser ? 'Create a password (min. 8 characters)' : 'Enter your password'}
                                className="form-control"
                                required
                                autoComplete="new-password"
                            />
                            {isNewUser && password && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                                        {getPasswordStrengthLabel()}
                                    </span>
                                </div>
                            )}
                        </div>
                        {isNewUser && (
                            <div className="form-helper mt-1">
                                <div className="flex items-center">
                                    <FaInfoCircle size={12} className="mr-1 text-secondary" />
                                    This password will encrypt your wallet data
                                </div>
                                {password && isNewUser && (
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
                        )}
                    </div>

                    {isNewUser && (
                        <div className="form-group">
                            <label className="form-label flex items-center">
                                <FaLock size={14} className="mr-1" />
                                <span>Confirm Password</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    id="confirmPassword"
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
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-full hover-scale"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner mr-2"></div>
                                <span>Connecting...</span>
                            </>
                        ) : (
                            <>
                                <FaKey className="mr-1" />
                                <span>Connect Wallet</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="alert alert-primary mt-3">
                <FaShieldAlt />
                <div>
                    <h3 className="text-sm font-semibold mb-1">Security Note</h3>
                    <p className="text-sm m-0">
                        Your private key will be encrypted and stored locally in your browser.
                        Never share your private key with anyone.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default WalletConnect;