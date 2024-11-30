"use client";

import { useState } from 'react';
import { useUnruggableMeme } from '../../hooks/useUnruggableMeme';

export default function TokenAnalysis() {
  return (
    <div className="container mx-auto">
      <AnalysisContent />
    </div>
  );
}

function AnalysisContent() {
  const [contractAddress, setContractAddress] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { analyzeToken, isReady, isInitializing } = useUnruggableMeme();

  const handleAnalyze = async () => {
    if (!contractAddress) {
      setError('Please enter a contract address');
      return;
    }

    if (!isReady) {
      setError('Service is not ready yet');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Analyzing contract:', contractAddress);
      const result = await analyzeToken(contractAddress);
      console.log('Analysis result:', result);
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Memecoin Safety Analysis</h2>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {isInitializing ? 'Initializing service...' : isReady ? 'Ready' : 'Service not ready'}
        </div>
        
        <input 
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Enter contract address"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          disabled={loading || !isReady}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading || !isReady || !contractAddress}
          className={`w-full p-2 rounded ${
            loading || !isReady || !contractAddress
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze Token'}
        </button>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {analysis && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Analysis Results</h3>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}