"use client";

import  TokenAnalysis  from "~~/components/memecoin/TokenAnalysis";
import { useAccount } from "~~/hooks/useAccount";

export default function AnalyzePage() {
  const { account } = useAccount();

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Please Connect Your Wallet</h1>
        <p>You need to connect your wallet to analyze memecoins.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Memecoin Security Analysis</h1>
        <TokenAnalysis />
      </div>
    </div>
  );
}