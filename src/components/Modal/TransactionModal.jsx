import React from 'react';
import { ethers } from 'ethers';

function TransactionConfirmation({
    transaction,
    selectedChain,
    wallet,
    onConfirm,
    onCancel
}) {
    const { amount, recipient } = transaction;

    // Format address for display
    const formatAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
    };

    // Calculate gas cost (simplified estimate)
    const estimatedGasCost = "0.0001"; // Simplified, in production you'd calculate this
    const totalCost = (parseFloat(amount) + parseFloat(estimatedGasCost)).toFixed(6);

    return (
        <div className="transaction-confirmation">
            <div className="confirmation-content">
                <h3>Confirm Transaction</h3>

                <div className="transaction-details">
                    <div className="detail-item">
                        <span className="detail-label">Network:</span>
                        <span className="detail-value network-value">{selectedChain.chainName}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">From:</span>
                        <span className="detail-value address-value">{formatAddress(wallet.address)}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">To:</span>
                        <span className="detail-value address-value">{formatAddress(recipient)}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value amount-value">
                            {amount} {selectedChain.currencySymbol}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Estimated Gas Fee:</span>
                        <span className="detail-value">
                            ~{estimatedGasCost} {selectedChain.currencySymbol}
                        </span>
                    </div>

                    <div className="detail-item total-cost-item">
                        <span className="detail-label">Total:</span>
                        <span className="detail-value total-value">
                            ~{totalCost} {selectedChain.currencySymbol}
                        </span>
                    </div>
                </div>

                <div className="warning-box">
                    <p className="warning-title">⚠️ Verify all details carefully</p>
                    <p className="warning-text">
                        This transaction cannot be reversed once confirmed.
                        Make sure the recipient address is correct.
                    </p>
                </div>

                <div className="confirmation-actions">
                    <button
                        onClick={onCancel}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-primary"
                    >
                        Confirm Transaction
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TransactionConfirmation;