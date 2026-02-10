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
  createdAt: number;
  tokenType: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
}

export interface AddressShareEntry {
  addr: Address;
  share: bigint;
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
  treasuryWallets: AddressShareEntry[];
  yieldTokens: AddressShareEntry[];
  supportTokens: AddressShareEntry[];
  tradingEnabled: boolean;
  antiBotEnabled: boolean;
  swapEnabled: boolean;
  maxTxAmount: bigint;
  maxWalletAmount: bigint;
  swapThreshold: bigint;
  totalReflected: bigint;
  pair: Address;
  pendingTreasury: bigint;
  pendingBurn: bigint;
  pendingReflection: bigint;
  pendingLiquidity: bigint;
  pendingYield: bigint;
  pendingSupport: bigint;
  tokenId: number;
  createdAt: number;
  tokenType: string;
}

export interface UserHoldings {
  balance: bigint;
  formattedBalance: string;
  percentOfSupply: number;
}

const MAX_ARRAY_READ = 20;

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

// Get token info from forge (V2 — uses isForgedToken)
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

  const tokenInfo: ForgedTokenInfo = {
    address: tokenAddress!,
    tokenId: 0,
    createdAt: 0,
    tokenType: 'TAX_TOKEN',
  };

  return { tokenInfo, isLoading, error };
}

// Get basic token data (name, symbol, etc)
export function useTokenBasicInfo(tokenAddress: Address | undefined) {
  const { data, isLoading } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: ERC20_ABI, functionName: 'name' },
          { address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' },
          { address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' },
          { address: tokenAddress, abi: ERC20_ABI, functionName: 'totalSupply' },
          { address: tokenAddress, abi: ERC20_ABI, functionName: 'owner' },
        ]
      : [],
    query: { enabled: !!tokenAddress },
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

// Get full token details including tax config (V2/V3 compatible)
export function useTokenDetails(tokenAddress: Address | undefined) {
  const { tokenInfo, isLoading: infoLoading } = useTokenForgeInfo(tokenAddress);

  // Phase 1: Scalar values
  const { data: scalarData, isLoading: scalarLoading } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'name' },                  // 0
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'symbol' },                 // 1
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'decimals' },               // 2
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalSupply' },            // 3
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'owner' },                  // 4
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'buyTax' },                 // 5
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'sellTax' },                // 6
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'treasuryShare' },          // 7
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'burnShare' },              // 8
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'reflectionShare' },        // 9
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'liquidityShare' },         // 10
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'yieldShare' },             // 11
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'supportShare' },           // 12
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'tradingEnabled' },         // 13
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'antiBotEnabled' },         // 14
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'swapEnabled' },            // 15
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'maxTxAmount' },            // 16
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'maxWalletAmount' },        // 17
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'swapThreshold' },          // 18
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalReflected' },         // 19
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pair' },                   // 20
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pendingTreasury' },        // 21
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pendingBurn' },            // 22
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pendingReflection' },      // 23
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pendingLiquidity' },       // 24
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pendingYield' },           // 25
          { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'pendingSupport' },         // 26
        ]
      : [],
    query: { enabled: !!tokenAddress },
  });

  // Phase 2: Array entries (read up to MAX_ARRAY_READ per array)
  const { data: arrayData } = useReadContracts({
    contracts: tokenAddress
      ? [
          ...Array.from({ length: MAX_ARRAY_READ }, (_, i) => ({
            address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'treasuryWallets' as const, args: [BigInt(i)],
          })),
          ...Array.from({ length: MAX_ARRAY_READ }, (_, i) => ({
            address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'yieldTokens' as const, args: [BigInt(i)],
          })),
          ...Array.from({ length: MAX_ARRAY_READ }, (_, i) => ({
            address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'supportTokens' as const, args: [BigInt(i)],
          })),
        ]
      : [],
    query: { enabled: !!tokenAddress },
  });

  const isLoading = infoLoading || scalarLoading;

  if (!scalarData || !tokenInfo) {
    return { tokenDetails: null, isLoading };
  }

  const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as Address;

  // Parse arrays
  const parseArray = (offset: number): AddressShareEntry[] => {
    const entries: AddressShareEntry[] = [];
    if (!arrayData) return entries;
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      const entry = arrayData[offset + i];
      if (entry?.status === 'success' && entry.result) {
        const [addr, share] = entry.result as [Address, bigint];
        if (addr && addr !== ZERO_ADDR) entries.push({ addr, share });
      } else break;
    }
    return entries;
  };

  const tokenDetails: TokenDetails = {
    address: tokenAddress!,
    name: (scalarData[0]?.result as string) || 'Unknown',
    symbol: (scalarData[1]?.result as string) || '???',
    decimals: (scalarData[2]?.result as number) || 18,
    totalSupply: (scalarData[3]?.result as bigint) || 0n,
    owner: (scalarData[4]?.result as Address) || ZERO_ADDR,
    buyTax: Number((scalarData[5]?.result as bigint) || 0n) / 100,
    sellTax: Number((scalarData[6]?.result as bigint) || 0n) / 100,
    treasuryShare: Number((scalarData[7]?.result as bigint) || 0n) / 100,
    burnShare: Number((scalarData[8]?.result as bigint) || 0n) / 100,
    reflectionShare: Number((scalarData[9]?.result as bigint) || 0n) / 100,
    liquidityShare: Number((scalarData[10]?.result as bigint) || 0n) / 100,
    yieldShare: Number((scalarData[11]?.result as bigint) || 0n) / 100,
    supportShare: Number((scalarData[12]?.result as bigint) || 0n) / 100,
    treasuryWallets: parseArray(0),
    yieldTokens: parseArray(MAX_ARRAY_READ),
    supportTokens: parseArray(MAX_ARRAY_READ * 2),
    tradingEnabled: (scalarData[13]?.result as boolean) || false,
    antiBotEnabled: (scalarData[14]?.result as boolean) || false,
    swapEnabled: (scalarData[15]?.result as boolean) ?? true,
    maxTxAmount: (scalarData[16]?.result as bigint) || 0n,
    maxWalletAmount: (scalarData[17]?.result as bigint) || 0n,
    swapThreshold: (scalarData[18]?.result as bigint) || 0n,
    totalReflected: (scalarData[19]?.result as bigint) || 0n,
    pair: (scalarData[20]?.result as Address) || ZERO_ADDR,
    pendingTreasury: (scalarData[21]?.result as bigint) || 0n,
    pendingBurn: (scalarData[22]?.result as bigint) || 0n,
    pendingReflection: (scalarData[23]?.result as bigint) || 0n,
    pendingLiquidity: (scalarData[24]?.result as bigint) || 0n,
    pendingYield: (scalarData[25]?.result as bigint) || 0n,
    pendingSupport: (scalarData[26]?.result as bigint) || 0n,
    tokenId: tokenInfo.tokenId,
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
            { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'balanceOf', args: [userAddress] },
            { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalSupply' },
            { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'decimals' },
          ]
        : [],
    query: { enabled: !!tokenAddress && !!userAddress },
  });

  if (!data || !userAddress) {
    return { holdings: null, isLoading, isConnected: !!userAddress };
  }

  const balance = (data[0]?.result as bigint) || 0n;
  const totalSupply = (data[1]?.result as bigint) || 1n;
  const decimals = (data[2]?.result as number) || 18;

  const percentOfSupply = totalSupply > 0n ? (Number(balance) / Number(totalSupply)) * 100 : 0;

  const holdings: UserHoldings = {
    balance,
    formattedBalance: formatUnits(balance, decimals),
    percentOfSupply,
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
    query: { enabled: tokenAddresses.length > 0 },
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
