import { createBrianAgent } from "@brian-ai/langchain";
import { ChatOpenAI } from "@langchain/openai";
import { Contract, Provider, Account, constants } from "starknet";
import {
  createMemecoin,
  launchOnEkubo,
  launchOnStandardAMM,
  collectEkuboFees,
} from 'unruggable-sdk';

export interface SafetyAnalysisResult {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  safetyScore: number;
  risks: string[];
  recommendations: string[];
  tokenMetrics: TokenMetrics;
}

interface TokenMetrics {
  totalSupply: string;
  circulatingSupply: string;
  holdersCount: number;
  liquidityMetrics: {
    totalLiquidity: string;
    liquidityLocked: string;
    lockPeriod: number;
  };
  ownershipMetrics: {
    ownerAddress: string;
    ownershipPercentage: number;
    renounced: boolean;
  };
}

export class UnruggableMemeService {
  private brianAgent;
  private provider: Provider;
  private config;

  constructor(
    private apiKey: string,
    private account: Account,
    rpcUrl: string = process.env.NEXT_PUBLIC_STARKNET_RPC || "https://free-rpc.nethermind.io/mainnet-juno"
  ) {
    if (typeof window === 'undefined') return; // Skip initialization on server
    
    this.provider = new Provider({ rpc: { nodeUrl: rpcUrl } });
    this.config = {
      starknetProvider: this.provider,
      starknetChainId: constants.StarknetChainId.SN_MAIN,
    };
  }

  private async initializeBrianAgent() {
    if (this.brianAgent) return this.brianAgent;

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error("OpenAI API key not found in environment variables");
    }

    console.log("Initializing Brian Agent...");
    try {
      const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      });

      this.brianAgent = await createBrianAgent({
        apiKey: this.apiKey,
        privateKeyOrAccount: process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`,
        llm,
        instructions: `Analyze memecoin contracts for security risks and compliance with Unruggable standards.
                    Focus on: liquidity locks, ownership structure, supply distribution, and potential backdoors.`,
      });

      console.log("Brian Agent initialized successfully");
      return this.brianAgent;
    } catch (error) {
      console.error("Failed to initialize Brian Agent:", error);
      throw error;
    }
  }

  async createMemecoin(params: {
    name: string;
    symbol: string;
    initialSupply: string;
    owner: string;
  }) {
    return await createMemecoin(this.config, {
      ...params,
      starknetAccount: this.account,
    });
  }

  async launchOnEkubo(params: {
    memecoinAddress: string;
    currencyAddress: string;
    startingMarketCap: string;
    fees: string;
    holdLimit: string;
    antiBotPeriodInSecs: number;
  }) {
    return await launchOnEkubo(this.config, {
      ...params,
      starknetAccount: this.account,
    });
  }

  async analyzeMemeToken(contractAddress: string): Promise<SafetyAnalysisResult> {
    await this.initializeBrianAgent();

    console.log("Analyzing token:", contractAddress);
    const contract = new Contract([], contractAddress, this.provider);
    const tokenMetrics = await this.getTokenMetrics(contract);
    
    const analysis = await this.brianAgent.invoke({
      input: `Analyze the following memecoin contract for security risks:
        Contract Address: ${contractAddress}
        Token Metrics: ${JSON.stringify(tokenMetrics, null, 2)}
        
        Evaluate:
        1. Liquidity configuration and locks
        2. Ownership structure and privileges
        3. Supply distribution
        4. Anti-bot measures
        5. Potential backdoors or malicious code
        6. Historical pattern matching with known rug pulls`
    });

    const risks = this.extractRisks(analysis.output);
    const recommendations = this.extractRecommendations(analysis.output);
    const safetyScore = this.calculateSafetyScore(analysis.output, tokenMetrics);

    return {
      contractAddress,
      tokenName: tokenMetrics.name,
      tokenSymbol: tokenMetrics.symbol,
      safetyScore,
      risks,
      recommendations,
      tokenMetrics,
    };
  }

  private async getTokenMetrics(contract: Contract): Promise<TokenMetrics> {
    // Implement token metrics collection using contract calls
    // This is a placeholder implementation
    return {
      totalSupply: await contract.totalSupply(),
      circulatingSupply: await contract.circulatingSupply(),
      holdersCount: 0, // Implement holders counting logic
      liquidityMetrics: {
        totalLiquidity: "0",
        liquidityLocked: "0",
        lockPeriod: 0
      },
      ownershipMetrics: {
        ownerAddress: await contract.owner(),
        ownershipPercentage: 0,
        renounced: false
      }
    };
  }

  private calculateSafetyScore(analysis: string, metrics: TokenMetrics): number {
    let score = 100;
    
    // Deduct points based on risk factors
    if (metrics.ownershipMetrics.ownershipPercentage > 50) score -= 30;
    if (!metrics.liquidityMetrics.liquidityLocked) score -= 20;
    if (metrics.holdersCount < 100) score -= 10;
    
    // Add more scoring logic based on analysis results
    return Math.max(0, Math.min(100, score));
  }

  private extractRisks(analysis: string): string[] {
    // Implement risk extraction logic from AI analysis
    return analysis.match(/Risk:(.*?)(?=Risk:|$)/g)?.map(risk => risk.trim()) || [];
  }

  private extractRecommendations(analysis: string): string[] {
    // Implement recommendation extraction logic from AI analysis
    return analysis.match(/Recommendation:(.*?)(?=Recommendation:|$)/g)?.map(rec => rec.trim()) || [];
  }
}