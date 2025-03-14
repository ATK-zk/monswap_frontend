import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import PropTypes from "prop-types";
import Popup from "./Popup";

const TOKEN_A_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701"; // WMON
const TOKEN_B_ADDRESS = "0x414C48Ce59EC0B3083537aA885934c6b23541F17"; // MONs
const PAIR_ADDRESS = "0x3585E8fa506E723405E016FE0172fCBfbDe2Bfd6";

const tokenABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
const pairABI = [
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)",
];

const Swap = ({ signer }) => {
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [direction, setDirection] = useState("AtoB");
  const [showPopup, setShowPopup] = useState(false);
  const [txHash, setTxHash] = useState("");

  const tokenA = new ethers.Contract(TOKEN_A_ADDRESS, tokenABI, signer);
  const tokenB = new ethers.Contract(TOKEN_B_ADDRESS, tokenABI, signer);
  const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, signer);

  useEffect(() => {
    const fetchBalancesAndAllowance = async () => {
      try {
        const address = await signer.getAddress();
        const balA = await tokenA.balanceOf(address);
        const balB = await tokenB.balanceOf(address);
        const allowanceA = await tokenA.allowance(address, PAIR_ADDRESS);
        const allowanceB = await tokenB.allowance(address, PAIR_ADDRESS);
        setBalanceA(ethers.formatEther(balA));
        setBalanceB(ethers.formatEther(balB));
        setIsApproved(
          direction === "AtoB"
            ? allowanceA >= ethers.parseEther("1000000")
            : allowanceB >= ethers.parseEther("1000000")
        );
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      }
    };
    fetchBalancesAndAllowance();
  }, [signer, direction]);

  const calculateAmountOut = async (inputAmount) => {
    if (!inputAmount || inputAmount === "0") {
      setAmountOut("");
      return;
    }
    try {
      const reserves = await pair.getReserves();
      const reserve0 = reserves[1];
      const reserve1 = reserves[0];
      const amountInWei = ethers.parseEther(inputAmount);
      const amountInWithFee = (amountInWei * BigInt(997)) / BigInt(1000);
      if (direction === "AtoB") {
        const amountOutWei = (reserve1 * amountInWithFee) / (reserve0 + amountInWithFee);
        setAmountOut(ethers.formatEther(amountOutWei));
      } else {
        const amountOutWei = (reserve0 * amountInWithFee) / (reserve1 + amountInWithFee);
        setAmountOut(ethers.formatEther(amountOutWei));
      }
    } catch (error) {
      console.error("Failed to calculate amount out:", error);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const tokenToApprove = direction === "AtoB" ? tokenA : tokenB;
      const tx = await tokenToApprove.approve(PAIR_ADDRESS, ethers.MaxUint256);
      await tx.wait();
      setIsApproved(true);
      setTxHash(tx.hash);
      setShowPopup(true);
    } catch (error) {
      console.error("Approve failed:", error);
      alert("Approve failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    setLoading(true);
    try {
      const amountInWei = ethers.parseEther(amountIn);
      const amountOutWei = ethers.parseEther(amountOut);
      const address = await signer.getAddress();
      if (!isApproved) {
        alert(`Please approve ${direction === "AtoB" ? "WMON" : "MONs"} first!`);
        setLoading(false);
        return;
      }
      let swapTx;
      if (direction === "AtoB") {
        await tokenA.transfer(PAIR_ADDRESS, amountInWei).then(tx => tx.wait());
        swapTx = await pair.swap(0, amountOutWei, address, "0x");
      } else {
        await tokenB.transfer(PAIR_ADDRESS, amountInWei).then(tx => tx.wait());
        swapTx = await pair.swap(amountOutWei, 0, address, "0x");
      }
      await swapTx.wait();
      setTxHash(swapTx.hash);
      setShowPopup(true);
      const balA = await tokenA.balanceOf(address);
      const balB = await tokenB.balanceOf(address);
      setBalanceA(ethers.formatEther(balA));
      setBalanceB(ethers.formatEther(balB));
      setAmountIn("");
      setAmountOut("");
    } catch (error) {
      console.error("Swap failed:", error);
      alert(`Swap failed! Reason: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirection = () => {
    setDirection(direction === "AtoB" ? "BtoA" : "AtoB");
    setAmountIn("");
    setAmountOut("");
  };

  return (
    <>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md">Swap</h2>
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-200 mb-2">
               {direction === "AtoB" ? "WMON" : "MONs"}
            </label>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => {
                setAmountIn(e.target.value);
                calculateAmountOut(e.target.value);
              }}
              placeholder="0.0"
              className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
            />
            <p className="text-xs text-gray-300 mt-1">
              Balance: {parseFloat(direction === "AtoB" ? balanceA : balanceB).toFixed(4)}{" "}
              {direction === "AtoB" ? "WMON" : "MONs"}
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={toggleDirection}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition duration-300 transform hover:rotate-180"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"
                ></path>
              </svg>
            </button>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              {direction === "AtoB" ? "MONs" : "WMON"}
            </label>
            <input
              type="number"
              value={amountOut}
              disabled
              placeholder="0.0"
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-gray-300"
            />
            <p className="text-xs text-gray-300 mt-1">
              Balance: {parseFloat(direction === "AtoB" ? balanceB : balanceA).toFixed(4)}{" "}
              {direction === "AtoB" ? "MONs" : "WMON"}
            </p>
          </div>
          {!isApproved ? (
            <button
              onClick={handleApprove}
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition duration-300 shadow-lg transform hover:scale-105 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Approving...
                </span>
              ) : (
                `Approve ${direction === "AtoB" ? "WMON" : "MONs"}`
              )}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!amountIn || !amountOut || loading}
              className={`w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition duration-300 shadow-lg transform hover:scale-105 ${
                loading || !amountIn || !amountOut ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Swapping...
                </span>
              ) : (
                "Swap"
              )}
            </button>
          )}
        </div>
      </div>
      {showPopup && (
        <Popup
          message={`Successfully ${isApproved && !amountIn ? "approved" : "swapped"}!`}
          txHash={txHash}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

Swap.propTypes = {
  signer: PropTypes.shape({
    getAddress: PropTypes.func.isRequired,
  }).isRequired,
};

export default Swap;