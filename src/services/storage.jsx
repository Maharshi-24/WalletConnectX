// Storage service for wallet management
import { encrypt, decrypt } from '../utils/encryption.jsx';

// Function to check if wallet exists in storage
export const walletExists = () => {
    const walletData = localStorage.getItem('walletData');
    return !!walletData;
};

// Function to check if password exists (for returning users)

// Check if user has created a password before
export const hasStoredPassword = () => {
    const passwordHash = localStorage.getItem('passwordHash');
    return !!passwordHash;
};

// Verify if the entered password matches the stored one
export const verifyPassword = (password) => {
    try {
        const storedHash = localStorage.getItem('passwordHash');
        if (!storedHash) return false;

        const decryptedHash = decrypt(storedHash, password);
        return decryptedHash === password;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
};
// Function to get wallet data from storage with decryption
export const getWalletData = (password) => {
    try {
        const encryptedData = localStorage.getItem('walletData');
        if (!encryptedData) return null;

        const decryptedData = decrypt(encryptedData, password);
        if (!decryptedData) return null;

        return JSON.parse(decryptedData);
    } catch (error) {
        console.error('Error retrieving wallet data:', error);
        return null;
    }
};

// Function to save wallet data to storage with encryption
export const saveWalletData = (walletData, password) => {
    try {
        const dataToStore = JSON.stringify(walletData);
        const encryptedData = encrypt(dataToStore, password);
        localStorage.setItem('walletData', encryptedData);

        // Store password hash for future verification
        if (!hasStoredPassword()) {
            localStorage.setItem('passwordHash', encrypt(password, password));
        }

        return true;
    } catch (error) {
        console.error('Error saving wallet data:', error);
        return false;
    }
};

// Function to clear wallet data from storage
export const clearWalletData = () => {
    try {
        localStorage.removeItem('walletData');
        localStorage.removeItem('passwordHash');
        return true;
    } catch (error) {
        console.error('Error clearing wallet data:', error);
        return false;
    }
};