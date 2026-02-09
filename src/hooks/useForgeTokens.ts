'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { THE_DIGITAL_FORGE_ADDRESS, THE_DIGITAL_FORGE_ABI } from '@/lib/contracts';
import { useMemo } from 'react';

// =====================================================================
// THE DIGITAL FORGE - Token Data Hooks
// Fetch all forged tokens and their metadata
// =====================================================================

// Standard ERC20 ABI for token metadata
const ERC20_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Tax token specific ABI
const TAX_TOKEN_ABI = [
  ...ERC20_ABI,
  {
    inputs: [],
    name: 'buyTax',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'sellTax',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasuryWallet',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tradingEnabled',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creator',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRewardsDistributed',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'holder', type: 'address' }],
    name: 'getPendingRewards',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'holder', type: 'address' }],
    name: 'getTotalClaimed',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export { TAX_TOKEN_ABI, ERC20_ABI };

// Tokens from previous contract versions that are dead/delisted — hide from gallery
const HIDDEN_TOKENS: Set<string> = new Set([
  '0x08b04ad71b005d0c544f661c6775922638ac0a66', // Old Paisley Protocol test token (liquidity removed)
]);

export const HIDDEN_TOKEN_COUNT = HIDDEN_TOKENS.size;
export function isHiddenToken(address: string): boolean {
  return HIDDEN_TOKENS.has(address.toLowerCase());
}

export interface ForgedTokenData {
  address: Address;
  tokenId: bigint;
  creator: Address;
  createdAt: bigint;
  tokenType: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  buyTax?: bigint;
  sellTax?: bigint;
  tradingEnabled?: boolean;
}

/**
 * Fetch all tokens from THE DIGITAL FORGE
 */
export function useForgeTokens(offset: number = 0, limit: number = 50) {
  // Get token count
  const { data: tokenCount } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'tokenCount',
  });

  // Get all token addresses
  const { data: tokenAddresses, isLoading: addressesLoading } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'getAllTokens',
    args: [BigInt(offset), BigInt(limit)],
    query: {
      enabled: tokenCount !== undefined && tokenCount > 0n,
    },
  });

  // Build multicall for ERC20 metadata
  const metadataContracts = useMemo(() => {
    if (!tokenAddresses || tokenAddresses.length === 0) return [];

    return tokenAddresses.flatMap((addr) => [
      { address: addr, abi: ERC20_ABI, functionName: 'name' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'symbol' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'decimals' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'totalSupply' as const },
    ]);
  }, [tokenAddresses]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metadataResults } = useReadContracts({
    contracts: metadataContracts as readonly unknown[],
    query: { enabled: metadataContracts.length > 0 },
  });

  // Build multicall for tax token data (V2: all tokens are tax tokens)
  const taxContracts = useMemo(() => {
    if (!tokenAddresses) return [];

    return tokenAddresses.flatMap((addr) => [
      { address: addr, abi: TAX_TOKEN_ABI, functionName: 'buyTax' as const },
      { address: addr, abi: TAX_TOKEN_ABI, functionName: 'sellTax' as const },
      { address: addr, abi: TAX_TOKEN_ABI, functionName: 'tradingEnabled' as const },
      { address: addr, abi: TAX_TOKEN_ABI, functionName: 'creator' as const },
    ]);
  }, [tokenAddresses]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: taxResults } = useReadContracts({
    contracts: taxContracts as readonly unknown[],
    query: { enabled: taxContracts.length > 0 },
  });

  // Combine all data
  const tokens: ForgedTokenData[] = useMemo(() => {
    if (!tokenAddresses || !metadataResults) return [];

    return tokenAddresses
      .map((addr, i) => {
        const baseIdx = i * 4;
        const taxIdx = i * 4;

        const name = (metadataResults[baseIdx]?.result as string) || 'Unknown';
        const symbol = (metadataResults[baseIdx + 1]?.result as string) || '???';
        const decimals = (metadataResults[baseIdx + 2]?.result as number) || 18;
        const totalSupply = (metadataResults[baseIdx + 3]?.result as bigint) || 0n;

        const buyTax = taxResults ? (taxResults[taxIdx]?.result as bigint) : undefined;
        const sellTax = taxResults ? (taxResults[taxIdx + 1]?.result as bigint) : undefined;
        const tradingEnabled = taxResults ? (taxResults[taxIdx + 2]?.result as boolean) : undefined;
        const creator = taxResults ? (taxResults[taxIdx + 3]?.result as Address) : '0x0000000000000000000000000000000000000000' as Address;

        return {
          address: addr,
          tokenId: BigInt(i),
          creator,
          createdAt: 0n,
          tokenType: 'FORGE',
          name,
          symbol,
          decimals,
          totalSupply,
          buyTax,
          sellTax,
          tradingEnabled,
        };
      })
      .filter((t) => !HIDDEN_TOKENS.has(t.address.toLowerCase()));
  }, [tokenAddresses, metadataResults, taxResults]);

  return {
    tokens,
    totalCount: tokens.length,
    isLoading: addressesLoading,
  };
}

/**
 * Fetch detailed data for a single tax token
 */
export function useTaxTokenData(tokenAddress?: Address, userAddress?: Address) {
  // Check if token is from factory (V2)
  const { data: isForged } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'isForgedToken',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: { enabled: !!tokenAddress },
  });

  // Build contracts for token data
  const contracts = useMemo(() => {
    if (!tokenAddress) return [];

    const baseContracts = [
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'name' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'symbol' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'decimals' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'totalSupply' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'buyTax' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'sellTax' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'tradingEnabled' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'creator' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'treasuryWallet' as const },
      { address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'totalRewardsDistributed' as const },
    ];

    // Add user-specific calls if address provided
    if (userAddress) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseContracts as unknown[]).push(
        {
          address: tokenAddress,
          abi: TAX_TOKEN_ABI,
          functionName: 'getPendingRewards' as const,
          args: [userAddress],
        },
        {
          address: tokenAddress,
          abi: TAX_TOKEN_ABI,
          functionName: 'getTotalClaimed' as const,
          args: [userAddress],
        }
      );
    }

    return baseContracts;
  }, [tokenAddress, userAddress]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: results, isLoading, refetch } = useReadContracts({
    contracts: contracts as readonly unknown[],
    query: { enabled: contracts.length > 0 },
  });

  const tokenData = useMemo(() => {
    if (!results || !tokenAddress) return null;

    return {
      address: tokenAddress,
      tokenId: 0n, // V2 doesn't track token IDs per-token
      tokenType: isForged ? 'FORGE' : 'UNKNOWN',
      createdAt: 0n, // V2 doesn't track creation time
      name: (results[0]?.result as string) || 'Unknown',
      symbol: (results[1]?.result as string) || '???',
      decimals: (results[2]?.result as number) || 18,
      totalSupply: (results[3]?.result as bigint) || 0n,
      buyTax: (results[4]?.result as bigint) || 0n,
      sellTax: (results[5]?.result as bigint) || 0n,
      tradingEnabled: (results[6]?.result as boolean) ?? true,
      creator: (results[7]?.result as Address) || '0x0000000000000000000000000000000000000000',
      treasuryWallet: (results[8]?.result as Address) || '0x0000000000000000000000000000000000000000',
      totalRewardsDistributed: (results[9]?.result as bigint) || 0n,
      userPendingRewards: userAddress ? ((results[10]?.result as bigint) || 0n) : undefined,
      userTotalClaimed: userAddress ? ((results[11]?.result as bigint) || 0n) : undefined,
    };
  }, [results, isForged, tokenAddress, userAddress]);

  return {
    tokenData,
    isLoading,
    refetch,
  };
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint | undefined, decimals: number = 18): string {
  if (!amount) return '0';
  const num = Number(formatUnits(amount, decimals));
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toFixed(2);
}

/**
 * Format tax rate from basis points
 */
export function formatTaxRate(basisPoints: bigint | undefined): string {
  if (!basisPoints) return '0%';
  return (Number(basisPoints) / 100).toFixed(1) + '%';
}
