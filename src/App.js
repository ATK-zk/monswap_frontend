import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Swap from "./components/Swap";
import Liquidity from "./components/Liquidity";
import ConnectWallet from "./components/ConnectWallet";

function App() {
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState("swap");

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId = ethers.toQuantity(10143);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId,
                chainName: "Monad Testnet",
                rpcUrls: ["https://testnet-rpc.monad.xyz"],
                nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                blockExplorerUrls: ["https://testnet.monadexplorer.com"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      setSigner(signer);
      setAccount(address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet!");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("accountsChanged", () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("chainChanged");
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <header className="w-full max-w-5xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl shadow-2xl flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-md">
          Monswap
        </h1>
        <ConnectWallet connectWallet={connectWallet} account={account} />
      </header>
      <main className="flex-1 w-full max-w-5xl">
        {account ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => setActiveTab("swap")}
                  className={`py-3 px-6 rounded-lg text-lg font-semibold transition-all duration-300 ${
                    activeTab === "swap"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-white/20 text-gray-200 hover:bg-white/30"
                  }`}
                >
                  Swap
                </button>
                <button
                  onClick={() => setActiveTab("liquidity")}
                  className={`py-3 px-6 rounded-lg text-lg font-semibold transition-all duration-300 ${
                    activeTab === "liquidity"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-white/20 text-gray-200 hover:bg-white/30"
                  }`}
                >
                  Liquidity
                </button>
              </div>
            </div>
            <div className="md:col-span-2 animate-fade-in">
              {activeTab === "swap" ? <Swap signer={signer} /> : <Liquidity signer={signer} />}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl text-center animate-bounce-in">
            <p className="text-2xl text-white font-semibold">Please connect your wallet to start</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;