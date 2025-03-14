import React from "react";
import PropTypes from "prop-types";

const Popup = ({ message, txHash, onClose }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(txHash);
    alert("Transaction hash copied!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4 text-center">Transaction Successful!</h3>
        <p className="text-gray-200 mb-4 text-center">{message}</p>
        {txHash && (
          <div className="mb-4">
            <p className="text-sm text-gray-300 truncate">Tx Hash: {txHash}</p>
            <button
              onClick={copyToClipboard}
              className="mt-2 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition duration-300"
            >
              Copy Hash
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

Popup.propTypes = {
  message: PropTypes.string.isRequired,
  txHash: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default Popup;