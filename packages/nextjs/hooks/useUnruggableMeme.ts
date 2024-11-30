import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAccount } from './useAccount';
import { UnruggableMemeService } from '../services/UnruggableMemeService';
import { useTargetNetwork } from './scaffold-stark/useTargetNetwork';

export function useUnruggableMeme() {
  const { account } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceInstance, setServiceInstance] = useState<UnruggableMemeService | null>(null);

  useEffect(() => {
    if (!account || typeof window === 'undefined') return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_BRIAN_API_KEY;
      if (!apiKey) {
        throw new Error("Brian API key not found");
      }

      console.log('Creating service with:', {
        apiKey,
        account,
        rpcUrl: targetNetwork.rpcUrls.public.http[0]
      });

      const service = new UnruggableMemeService(
        apiKey,
        account,
        targetNetwork.rpcUrls.public.http[0]
      );

      setServiceInstance(service);
    } catch (err) {
      console.error("Failed to initialize UnruggableMemeService:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize service");
    }
  }, [account, targetNetwork]);

  const analyzeToken = useCallback(async (contractAddress: string) => {
    console.log('analyzeToken called with:', contractAddress);
    console.log('serviceInstance:', serviceInstance);

    setError(null);
    if (!serviceInstance) {
      const error = new Error("Service not initialized");
      console.error(error);
      throw error;
    }
    
    setIsInitializing(true);
    try {
      console.log("Starting token analysis for:", contractAddress);
      const result = await serviceInstance.analyzeMemeToken(contractAddress);
      console.log("Analysis complete:", result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze token";
      console.error("Error analyzing token:", errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [serviceInstance]);

  const createToken = useCallback(async (params: {
    name: string;
    symbol: string;
    initialSupply: string;
    owner: string;
  }) => {
    setError(null);
    if (!serviceInstance) throw new Error("Service not initialized");
    
    try {
      return await serviceInstance.createMemecoin(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create token";
      setError(errorMessage);
      throw err;
    }
  }, [serviceInstance]);

  const launchToken = useCallback(async (params: {
    memecoinAddress: string;
    currencyAddress: string;
    startingMarketCap: string;
    fees: string;
    holdLimit: string;
    antiBotPeriodInSecs: number;
  }) => {
    setError(null);
    if (!serviceInstance) throw new Error("Service not initialized");
    
    try {
      return await serviceInstance.launchOnEkubo(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to launch token";
      setError(errorMessage);
      throw err;
    }
  }, [serviceInstance]);

  return {
    analyzeToken,
    createToken,
    launchToken,
    isReady: !!serviceInstance && !isInitializing,
    error,
    isInitializing
  };
}