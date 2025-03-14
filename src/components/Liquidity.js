import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import PropTypes from "prop-types";
import Popup from "./Popup";

const TOKEN_A_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const TOKEN_B_ADDRESS = "0x414C48Ce59EC0B3083537aA885934c6b23541F17";
const PAIR_ADDRESS = "0x3585E8fa506E723405E016FE0172fCBfbDe2Bfd6";

const tokenABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
const pairABI = [
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function mint(address to) returns (uint256)",
  "function burn(address to) returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const Liquidity = ({ signer }) => {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [lpBalance, setLpBalance] = useState("0");
  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [isApprovedA, setIsApprovedA] = useState(false);
  const [isApprovedB, setIsApprovedB] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const tokenA = new ethers.Contract(TOKEN_A_ADDRESS, tokenABI, signer);
  const tokenB = new ethers.Contract(TOKEN_B_ADDRESS, tokenABI, signer);
  const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, signer);

  useEffect(() => {
    const fetchBalancesAndAllowance = async () => {
      try {
        const address = await signer.getAddress();
        const balA = await tokenA.balanceOf(address);
        const balB = await tokenB.balanceOf(address);
        const lpBal = await pair.balanceOf(address);
        const allowanceA = await tokenA.allowance(address, PAIR_ADDRESS);
        const allowanceB = await tokenB.allowance(address, PAIR_ADDRESS);
        setBalanceA(ethers.formatEther(balA));
        setBalanceB(ethers.formatEther(balB));
        setLpBalance(ethers.formatEther(lpBal));
        setIsApprovedA(allowanceA >= ethers.parseEther("1000000"));
        setIsApprovedB(allowanceB >= ethers.parseEther("1000000"));
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      }
    };
    fetchBalancesAndAllowance();
  }, [signer]);

  const handleApproveA = async () => {
    setAddLoading(true);
    try {
      const tx = await tokenA.approve(PAIR_ADDRESS, ethers.MaxUint256);
      await tx.wait();
      setIsApprovedA(true);
      setTxHash(tx.hash);
      setPopupMessage("WMON approved successfully!");
      setShowPopup(true);
    } catch (error) {
      console.error("Approve WMON failed:", error);
      alert("Approve WMON failed!");
    } finally {
      setAddLoading(false);
    }
  };

  const handleApproveB = async () => {
    setAddLoading(true);
    try {
      const tx = await tokenB.approve(PAIR_ADDRESS, ethers.MaxUint256);
      await tx.wait();
      setIsApprovedB(true);
      setTxHash(tx.hash);
      setPopupMessage("MONs approved successfully!");
      setShowPopup(true);
    } catch (error) {
      console.error("Approve MONs failed:", error);
      alert("Approve MONs failed!");
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    setAddLoading(true);
    try {
      const amountAWei = ethers.parseEther(amountA);
      const amountBWei = ethers.parseEther(amountB);
      const address = await signer.getAddress();
      if (!isApprovedA || !isApprovedB) {
        alert("Please approve both tokens first!");
        setAddLoading(false);
        return;
      }
      await tokenA.transfer(PAIR_ADDRESS, amountAWei).then(tx => tx.wait());
      await tokenB.transfer(PAIR_ADDRESS, amountBWei).then(tx => tx.wait());
      const mintTx = await pair.mint(address);
      await mintTx.wait();
      setTxHash(mintTx.hash);
      setPopupMessage("Liquidity added successfully!");
      setShowPopup(true);
      const balA = await tokenA.balanceOf(address);
      const balB = await tokenB.balanceOf(address);
      const lpBal = await pair.balanceOf(address);
      setBalanceA(ethers.formatEther(balA));
      setBalanceB(ethers.formatEther(balB));
      setLpBalance(ethers.formatEther(lpBal));
      setAmountA("");
      setAmountB("");
    } catch (error) {
      console.error("Add liquidity failed:", error);
      alert(`Add liquidity failed! Reason: ${error.reason || error.message}`);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    setRemoveLoading(true);
    try {
      const address = await signer.getAddress();
      const lpBalWei = ethers.parseEther(lpBalance);
      await pair.approve(PAIR_ADDRESS, lpBalWei).then(tx => tx.wait());
      await pair.transfer(PAIR_ADDRESS, lpBalWei).then(tx => tx.wait());
      const burnTx = await pair.burn(address);
      await burnTx.wait();
      setTxHash(burnTx.hash);
      setPopupMessage("Liquidity removed successfully!");
      setShowPopup(true);
      const balA = await tokenA.balanceOf(address);
      const balB = await tokenB.balanceOf(address);
      const lpBal = await pair.balanceOf(address);
      setBalanceA(ethers.formatEther(balA));
      setBalanceB(ethers.formatEther(balB));
      setLpBalance(ethers.formatEther(lpBal));
    } catch (error) {
      console.error("Remove liquidity failed:", error);
      alert(`Remove liquidity failed! Reason: ${error.reason || error.message}`);
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md">Liquidity</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">WMON</label>
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
            />
            <p className="text-xs text-gray-300 mt-1">Balance: {parseFloat(balanceA).toFixed(4)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">MONs</label>
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
            />
            <p className="text-xs text-gray-300 mt-1">Balance: {parseFloat(balanceB).toFixed(4)}</p>
          </div>
          {!isApprovedA && (
            <button
              onClick={handleApproveA}
              disabled={addLoading}
              className={`w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition duration-300 shadow-lg transform hover:scale-105 ${
                addLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {addLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Approving...
                </span>
              ) : (
                "Approve WMON"
              )}
            </button>
          )}
          {!isApprovedB && (
            <button
              onClick={handleApproveB}
              disabled={addLoading}
              className={`w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition duration-300 shadow-lg transform hover:scale-105 ${
                addLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {addLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Approving...
                </span>
              ) : (
                "Approve MONs"
              )}
            </button>
          )}
          {isApprovedA && isApprovedB && (
            <button
              onClick={handleAddLiquidity}
              disabled={!amountA || !amountB || addLoading}
              className={`w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition duration-300 shadow-lg transform hover:scale-105 ${
                addLoading || !amountA || !amountB ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {addLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Adding...
                </span>
              ) : (
                "Add Liquidity"
              )}
            </button>
          )}
          <div className="text-center">
            <p className="text-sm text-gray-200">Your LP Tokens: {parseFloat(lpBalance).toFixed(4)}</p>
            <button
              onClick={handleRemoveLiquidity}
              disabled={lpBalance === "0" || removeLoading}
              className={`mt-2 w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition duration-300 shadow-lg transform hover:scale-105 ${
                removeLoading || lpBalance === "0" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {removeLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Removing...
                </span>
              ) : (
                "Remove Liquidity"
              )}
            </button>
          </div>
        </div>
      </div>
      {showPopup && (
        <Popup
          message={popupMessage}
          txHash={txHash}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

Liquidity.propTypes = {
  signer: PropTypes.shape({
    getAddress: PropTypes.func.isRequired,
  }).isRequired,
};

export default Liquidity;