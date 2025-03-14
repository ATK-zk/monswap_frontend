import React from "react";
import PropTypes from "prop-types";

const ConnectWallet = ({ connectWallet, account }) => {
  return (
    <button
      onClick={connectWallet}
      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition duration-300 shadow-md font-semibold"
    >
      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
    </button>
  );
};

ConnectWallet.propTypes = {
  connectWallet: PropTypes.func.isRequired,
  account: PropTypes.string,
};

export default ConnectWallet;