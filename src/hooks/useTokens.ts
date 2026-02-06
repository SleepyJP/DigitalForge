'use client';

import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { Address, formatUnits } from 'viem';
import {
  THE_DIGITAL_FORGE_ADDRESS,
  THE_DIGITAL_FORGE_ABI,
  ERC20_ABI,
  FORGED_TOKEN_ABI,
} from '@/lib/contracts';

export interface ForgedTokenInfo {
  address: Address;
  tokenId: number;
  creator: Address;
  createdAt: number;
  tokenType: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
}

export interface TokenDetails {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner: Address;
  buyTax: number;
  sellTax: number;
  treasuryShare: number;
  burnShare: number;
  reflectionShare: number;
  liquidityShare: number;
  yieldShare: number;
  supportShare: number;
  treasuryWallet: Address;
  yieldToken: Address;
  supportToken: Address;
  tradingEnabled: boolean;
  antiBotEnabled: boolean;
  maxTxAmount: bigint;
  maxWalletAmount: bigint;
  totalBurned: bigint;
  totalReflections: bigint;
  totalYieldDistributed: bigint;
  lpPair: Address;
  tokenId: number;
  creator: Address;
  createdAt: number;
  tokenType: string;
}

export interface UserHoldings {
  balance: bigint;
  formattedBalance: string;
  percentOfSupply: number;
  pendingReflections: bigint;
  pendingYield: bigint;
}

// Get all forged token addresses
export function useAllForgedTokens() {
  const { data: tokenCount } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'tokenCount',
  });

  const count = tokenCount ? Number(tokenCount) : 0;

  const { data: tokens, isLoading } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'getAllTokens',
    args: [0n, BigInt(count)],
    query: {
      enabled: count > 0,
    },
  });

  return {
    tokens: (tokens as Address[]) || [],
    tokenCount: count,
    isLoading,
  };
}

// Get token info from forge (V2 - uses isForgedToken)
export function useTokenForgeInfo(tokenAddress: Address | undefined) {
  const { data: isForged, isLoading, error } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'isForgedToken',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });

  if (!isForged) {
    return { tokenInfo: null, isLoading, error };
  }

  // V2 doesn't store detailed token info in factory - all are TAX_TOKEN type
  const tokenInfo: ForgedTokenInfo = {
    address: tokenAddress!,
    tokenId: 0, // V2 doesn't track per-token IDs
    creator: '0x0000000000000000000000000000000000000000' as Address, // Get from token contract
    createdAt: 0, // V2 doesn't track creation time
    tokenType: 'TAX_TOKEN',
  };

  return { tokenInfo, isLoading, error };
}

// Get basic token data (name, symbol, etc)
export function useTokenBasicInfo(tokenAddress: Address | undefined) {
  const { data, isLoading } = useReadContracts({
    contracts: tokenAddress
      ? [
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'name',
          },
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
          },
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
          },
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
          },
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'owner',
          },
        ]
      : [],
    query: {
      enabled: !!tokenAddress,
    },
  });

  if (!data) {
    return { basicInfo: null, isLoading };
  }

  return {
    basicInfo: {
      name: data[0]?.result as string | undefined,
      symbol: data[1]?.result as string | undefined,
      decimals: data[2]?.result as number | undefined,
      totalSupply: data[3]?.result as bigint | undefined,
      owner: data[4]?.result as Address | undefined,
    },
    isLoading,
  };
}

// Get full token details including tax config
export function useTokenDetails(tokenAddress: Address | undefined) {
  const { tokenInfo, isLoading: infoLoading } = useTokenForgeInfo(tokenAddress);

  const { data, isLoading: detailsLoading } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'name' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'symbol' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'decimals' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalSupply' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'owner' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'buyTax' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'sellTax' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'treasuryShare' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'burnShare' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'reflectionShare' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'liquidityShare' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'yieldShare' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'supportShare' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'treasuryWallet' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'yieldToken' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'supportToken' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'tradingEnabled' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'antiBotEnabled' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'maxTxAmount' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'maxWalletAmount' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalBurned' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalReflections' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalYieldDistributed' },
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'lpPair' },
        ]
      : [],
    query: {
      enabled: !!tokenAddress,
    },
  });

  const isLoading = infoLoading || detailsLoading;

  if (!data || !tokenInfo) {
    return { tokenDetails: null, isLoading };
  }

  const tokenDetails: TokenDetails = {
    address: tokenAddress!,
    name: (data[0]?.result as string) || 'Unknown',
    symbol: (data[1]?.result as string) || '???',
    decimals: (data[2]?.result as number) || 18,
    totalSupply: (data[3]?.result as bigint) || 0n,
    owner: (data[4]?.result as Address) || '0x0000000000000000000000000000000000000000',
    buyTax: Number((data[5]?.result as bigint) || 0n) / 100,
    sellTax: Number((data[6]?.result as bigint) || 0n) / 100,
    treasuryShare: Number((data[7]?.result as bigint) || 0n) / 100,
    burnShare: Number((data[8]?.result as bigint) || 0n) / 100,
    reflectionShare: Number((data[9]?.result as bigint) || 0n) / 100,
    liquidityShare: Number((data[10]?.result as bigint) || 0n) / 100,
    yieldShare: Number((data[11]?.result as bigint) || 0n) / 100,
    supportShare: Number((data[12]?.result as bigint) || 0n) / 100,
    treasuryWallet: (data[13]?.result as Address) || '0x0000000000000000000000000000000000000000',
    yieldToken: (data[14]?.result as Address) || '0x0000000000000000000000000000000000000000',
    supportToken: (data[15]?.result as Address) || '0x0000000000000000000000000000000000000000',
    tradingEnabled: (data[16]?.result as boolean) || false,
    antiBotEnabled: (data[17]?.result as boolean) || false,
    maxTxAmount: (data[18]?.result as bigint) || 0n,
    maxWalletAmount: (data[19]?.result as bigint) || 0n,
    totalBurned: (data[20]?.result as bigint) || 0n,
    totalReflections: (data[21]?.result as bigint) || 0n,
    totalYieldDistributed: (data[22]?.result as bigint) || 0n,
    lpPair: (data[23]?.result as Address) || '0x0000000000000000000000000000000000000000',
    tokenId: tokenInfo.tokenId,
    creator: tokenInfo.creator,
    createdAt: tokenInfo.createdAt,
    tokenType: tokenInfo.tokenType,
  };

  return { tokenDetails, isLoading };
}

// Get user holdings for a specific token
export function useUserHoldings(tokenAddress: Address | undefined) {
  const { address: userAddress } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts:
      tokenAddress && userAddress
        ? [
            {
              address: tokenAddress,
              abi: FORGED_TOKEN_ABI,
              functionName: 'balanceOf',
              args: [userAddress],
            },
            {
              address: tokenAddress,
              abi: FORGED_TOKEN_ABI,
              functionName: 'totalSupply',
            },
            {
              address: tokenAddress,
              abi: FORGED_TOKEN_ABI,
              functionName: 'decimals',
            },
            {
              address: tokenAddress,
              abi: FORGED_TOKEN_ABI,
              functionName: 'pendingReflections',
              args: [userAddress],
            },
            {
              address: tokenAddress,
              abi: FORGED_TOKEN_ABI,
              functionName: 'pendingYield',
              args: [userAddress],
            },
          ]
        : [],
    query: {
      enabled: !!tokenAddress && !!userAddress,
    },
  });

  if (!data || !userAddress) {
    return { holdings: null, isLoading, isConnected: !!userAddress };
  }

  const balance = (data[0]?.result as bigint) || 0n;
  const totalSupply = (data[1]?.result as bigint) || 1n;
  const decimals = (data[2]?.result as number) || 18;
  const pendingReflections = (data[3]?.result as bigint) || 0n;
  const pendingYield = (data[4]?.result as bigint) || 0n;

  const percentOfSupply = totalSupply > 0n ? (Number(balance) / Number(totalSupply)) * 100 : 0;

  const holdings: UserHoldings = {
    balance,
    formattedBalance: formatUnits(balance, decimals),
    percentOfSupply,
    pendingReflections,
    pendingYield,
  };

  return { holdings, isLoading, isConnected: true };
}

// Get multiple tokens' basic info at once
export function useMultipleTokensBasicInfo(tokenAddresses: Address[]) {
  const contracts = tokenAddresses.flatMap((address) => [
    { address, abi: ERC20_ABI, functionName: 'name' as const },
    { address, abi: ERC20_ABI, functionName: 'symbol' as const },
    { address, abi: ERC20_ABI, functionName: 'decimals' as const },
    { address, abi: ERC20_ABI, functionName: 'totalSupply' as const },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: tokenAddresses.length > 0,
    },
  });

  if (!data) {
    return { tokensInfo: [], isLoading };
  }

  const tokensInfo = tokenAddresses.map((address, index) => {
    const baseIndex = index * 4;
    return {
      address,
      name: (data[baseIndex]?.result as string) || 'Unknown',
      symbol: (data[baseIndex + 1]?.result as string) || '???',
      decimals: (data[baseIndex + 2]?.result as number) || 18,
      totalSupply: (data[baseIndex + 3]?.result as bigint) || 0n,
    };
  });

  return { tokensInfo, isLoading };
}
