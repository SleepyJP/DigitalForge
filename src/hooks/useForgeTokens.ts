'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import {
  THE_DIGITAL_FORGE_ADDRESS,
  THE_DIGITAL_FORGE_ABI,
  TaxMoment,
} from '@/lib/contracts';
import { useMemo } from 'react';

// =====================================================================
// THE DIGITAL FORGE - Token Data Hooks
// Supports BOTH ForgedTaxTokenV2/V3 AND PaisleySmartToken contracts
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

// Minimal ABI for gallery listing — only functions that exist on ALL token types
const GALLERY_ABI = [
  ...ERC20_ABI,
  { inputs: [], name: 'tradingEnabled', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

// V2/V3 specific ABI for tokens with buyTax/sellTax functions
const V2_TAX_ABI = [
  { inputs: [], name: 'buyTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'sellTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'treasuryWallets', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalReflected', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pair', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

// PaisleySmartToken ABI for getTaxes()
const PAISLEY_TAX_ABI = [
  { inputs: [], name: 'getTaxes', outputs: [{ type: 'tuple[]', components: [
    { name: 'id', type: 'uint256' },
    { name: 'taxType', type: 'uint8' },
    { name: 'taxMoment', type: 'uint8' },
    { name: 'percentage', type: 'uint256' },
    { name: 'receiver', type: 'address' },
    { name: 'tokenAddress', type: 'address' },
    { name: 'burnAddress', type: 'address' },
    { name: 'rewardInPls', type: 'bool' },
    { name: 'amountAccumulated', type: 'uint256' },
    { name: 'total', type: 'uint256' },
  ]}], stateMutability: 'view', type: 'function' },
] as const;

export { ERC20_ABI, GALLERY_ABI };

// Tokens from previous contract versions that are dead/delisted — hide from gallery
const HIDDEN_TOKENS: Set<string> = new Set([
  '0x08b04ad71b005d0c544f661c6775922638ac0a66', // Old Paisley Protocol test token (liquidity removed)
  '0x57cd040d5d3bbe3a6533e4724006073e613a6742', // Paisley Protocol Platform Rewarder (removed from gallery)
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
  tokenType: string; // 'FORGE' | 'PAISLEY' | 'UNKNOWN'
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  buyTax?: bigint;
  sellTax?: bigint;
  tradingEnabled?: boolean;
  // Paisley-specific: full tax breakdown
  paisleyTaxes?: PaisleyTax[];
}

// Parsed Paisley Tax struct
export interface PaisleyTax {
  id: bigint;
  taxType: number; // 0=Burn, 1=ExternalBurn, 2=Dev, 3=Reflection, 4=Yield, 5=Liquify
  taxMoment: number; // 0=Both, 1=Buy, 2=Sell
  percentage: bigint;
  receiver: Address;
  tokenAddress: Address;
  burnAddress: Address;
  rewardInPls: boolean;
  amountAccumulated: bigint;
  total: bigint;
}

/**
 * Parse Paisley Tax[] array into buy/sell tax totals
 */
function parsePaisleyTaxes(taxes: PaisleyTax[]): { buyTax: bigint; sellTax: bigint } {
  let buyTotal = 0n;
  let sellTotal = 0n;

  for (const tax of taxes) {
    if (tax.taxMoment === TaxMoment.Both || tax.taxMoment === TaxMoment.Buy) {
      buyTotal += tax.percentage;
    }
    if (tax.taxMoment === TaxMoment.Both || tax.taxMoment === TaxMoment.Sell) {
      sellTotal += tax.percentage;
    }
  }

  return { buyTax: buyTotal, sellTax: sellTotal };
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

  // Build multicall for ERC20 metadata + common fields (works on all token types)
  const metadataContracts = useMemo(() => {
    if (!tokenAddresses || tokenAddresses.length === 0) return [];

    return tokenAddresses.flatMap((addr) => [
      { address: addr, abi: ERC20_ABI, functionName: 'name' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'symbol' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'decimals' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'totalSupply' as const },
      { address: addr, abi: GALLERY_ABI, functionName: 'tradingEnabled' as const },
      { address: addr, abi: GALLERY_ABI, functionName: 'owner' as const },
    ]);
  }, [tokenAddresses]);

  const { data: metadataResults } = useReadContracts({
    contracts: metadataContracts as readonly unknown[],
    query: { enabled: metadataContracts.length > 0 },
  });

  // Try V2 tax calls (buyTax/sellTax) — will return failure status for Paisley tokens
  const v2TaxContracts = useMemo(() => {
    if (!tokenAddresses) return [];
    return tokenAddresses.flatMap((addr) => [
      { address: addr, abi: V2_TAX_ABI, functionName: 'buyTax' as const },
      { address: addr, abi: V2_TAX_ABI, functionName: 'sellTax' as const },
    ]);
  }, [tokenAddresses]);

  const { data: v2TaxResults } = useReadContracts({
    contracts: v2TaxContracts as readonly unknown[],
    query: { enabled: v2TaxContracts.length > 0 },
  });

  // Try Paisley getTaxes() — will return failure status for V2 tokens
  const paisleyTaxContracts = useMemo(() => {
    if (!tokenAddresses) return [];
    return tokenAddresses.map((addr) => ({
      address: addr,
      abi: PAISLEY_TAX_ABI,
      functionName: 'getTaxes' as const,
    }));
  }, [tokenAddresses]);

  const { data: paisleyTaxResults } = useReadContracts({
    contracts: paisleyTaxContracts as readonly unknown[],
    query: { enabled: paisleyTaxContracts.length > 0 },
  });

  // Combine all data — handle both token types gracefully
  const tokens: ForgedTokenData[] = useMemo(() => {
    if (!tokenAddresses || !metadataResults) return [];

    return tokenAddresses
      .map((addr, i) => {
        const baseIdx = i * 6; // 6 calls per token now
        const v2Idx = i * 2;

        const name = (metadataResults[baseIdx]?.result as string) || 'Unknown';
        const symbol = (metadataResults[baseIdx + 1]?.result as string) || '???';
        const decimals = (metadataResults[baseIdx + 2]?.result as number) ?? 18;
        const totalSupply = (metadataResults[baseIdx + 3]?.result as bigint) || 0n;
        const tradingEnabled = metadataResults[baseIdx + 4]?.status === 'success'
          ? (metadataResults[baseIdx + 4].result as boolean)
          : undefined;
        const tokenOwner = metadataResults[baseIdx + 5]?.status === 'success'
          ? (metadataResults[baseIdx + 5].result as Address)
          : '0x0000000000000000000000000000000000000000' as Address;

        // Try V2 tax rates first
        const v2BuyTax = v2TaxResults?.[v2Idx]?.status === 'success'
          ? (v2TaxResults[v2Idx].result as bigint)
          : undefined;
        const v2SellTax = v2TaxResults?.[v2Idx + 1]?.status === 'success'
          ? (v2TaxResults[v2Idx + 1].result as bigint)
          : undefined;

        // Try Paisley getTaxes() fallback
        let paisleyTaxes: PaisleyTax[] | undefined;
        let paisleyBuyTax: bigint | undefined;
        let paisleySellTax: bigint | undefined;

        if (paisleyTaxResults?.[i]?.status === 'success') {
          const rawTaxes = paisleyTaxResults[i].result as PaisleyTax[];
          if (rawTaxes && rawTaxes.length > 0) {
            paisleyTaxes = rawTaxes;
            const parsed = parsePaisleyTaxes(rawTaxes);
            paisleyBuyTax = parsed.buyTax;
            paisleySellTax = parsed.sellTax;
          }
        }

        // Use V2 if available, otherwise Paisley
        const buyTax = v2BuyTax ?? paisleyBuyTax;
        const sellTax = v2SellTax ?? paisleySellTax;
        const tokenType = v2BuyTax !== undefined ? 'FORGE' : paisleyTaxes ? 'PAISLEY' : 'FORGE';

        return {
          address: addr,
          tokenId: BigInt(i),
          creator: tokenOwner,
          createdAt: 0n,
          tokenType,
          name,
          symbol,
          decimals,
          totalSupply,
          buyTax,
          sellTax,
          tradingEnabled,
          paisleyTaxes,
        };
      })
      .filter((t) => !HIDDEN_TOKENS.has(t.address.toLowerCase()));
  }, [tokenAddresses, metadataResults, v2TaxResults, paisleyTaxResults]);

  return {
    tokens,
    totalCount: tokens.length,
    isLoading: addressesLoading,
  };
}

/**
 * Fetch detailed data for a single tax token
 * Handles BOTH ForgedTaxTokenV2/V3 and PaisleySmartToken contracts
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useTaxTokenData(tokenAddress?: Address, userAddress?: Address) {
  // Check if token is from factory
  const { data: isForged } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'isForgedToken',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: { enabled: !!tokenAddress },
  });

  // === UNIVERSAL CALLS (work on all token types) ===
  const universalContracts = useMemo(() => {
    if (!tokenAddress) return [];
    return [
      { address: tokenAddress, abi: GALLERY_ABI, functionName: 'name' as const },            // 0
      { address: tokenAddress, abi: GALLERY_ABI, functionName: 'symbol' as const },           // 1
      { address: tokenAddress, abi: GALLERY_ABI, functionName: 'decimals' as const },         // 2
      { address: tokenAddress, abi: GALLERY_ABI, functionName: 'totalSupply' as const },      // 3
      { address: tokenAddress, abi: GALLERY_ABI, functionName: 'tradingEnabled' as const },   // 4
      { address: tokenAddress, abi: GALLERY_ABI, functionName: 'owner' as const },            // 5
    ];
  }, [tokenAddress]);

  const { data: universalResults, isLoading: universalLoading, refetch: refetchUniversal } = useReadContracts({
    contracts: universalContracts as readonly unknown[],
    query: { enabled: universalContracts.length > 0 },
  });

  // === V2/V3 SPECIFIC CALLS (ForgedTaxToken) ===
  const v2Contracts = useMemo(() => {
    if (!tokenAddress) return [];
    return [
      { address: tokenAddress, abi: V2_TAX_ABI, functionName: 'buyTax' as const },           // 0
      { address: tokenAddress, abi: V2_TAX_ABI, functionName: 'sellTax' as const },           // 1
      { address: tokenAddress, abi: V2_TAX_ABI, functionName: 'totalReflected' as const },    // 2
      { address: tokenAddress, abi: V2_TAX_ABI, functionName: 'pair' as const },              // 3
      { address: tokenAddress, abi: V2_TAX_ABI, functionName: 'treasuryWallets' as const, args: [0n] }, // 4
    ];
  }, [tokenAddress]);

  const { data: v2Results, refetch: refetchV2 } = useReadContracts({
    contracts: v2Contracts as readonly unknown[],
    query: { enabled: v2Contracts.length > 0 },
  });

  // === PAISLEY SPECIFIC CALLS (PaisleySmartToken) ===
  const paisleyContracts = useMemo(() => {
    if (!tokenAddress) return [];
    return [
      { address: tokenAddress, abi: PAISLEY_TAX_ABI, functionName: 'getTaxes' as const },    // 0
    ];
  }, [tokenAddress]);

  const { data: paisleyResults, refetch: refetchPaisley } = useReadContracts({
    contracts: paisleyContracts as readonly unknown[],
    query: { enabled: paisleyContracts.length > 0 },
  });

  // Determine contract type and parse results
  const tokenData = useMemo(() => {
    if (!universalResults || !tokenAddress) return null;

    // Parse universal fields
    const name = universalResults[0]?.status === 'success' ? (universalResults[0].result as string) : 'Unknown';
    const symbol = universalResults[1]?.status === 'success' ? (universalResults[1].result as string) : '???';
    const decimals = universalResults[2]?.status === 'success' ? (universalResults[2].result as number) : 18;
    const totalSupply = universalResults[3]?.status === 'success' ? (universalResults[3].result as bigint) : 0n;
    const tradingEnabled = universalResults[4]?.status === 'success' ? (universalResults[4].result as boolean) : true;
    const creator = universalResults[5]?.status === 'success'
      ? (universalResults[5].result as Address)
      : '0x0000000000000000000000000000000000000000' as Address;

    // Try V2 data
    const v2BuyTax = v2Results?.[0]?.status === 'success' ? (v2Results[0].result as bigint) : undefined;
    const v2SellTax = v2Results?.[1]?.status === 'success' ? (v2Results[1].result as bigint) : undefined;
    const v2TotalReflected = v2Results?.[2]?.status === 'success' ? (v2Results[2].result as bigint) : undefined;
    const v2Pair = v2Results?.[3]?.status === 'success' ? (v2Results[3].result as Address) : undefined;
    const v2TreasuryEntry = v2Results?.[4]?.status === 'success' ? (v2Results[4].result as [Address, bigint]) : undefined;

    // Try Paisley data
    let paisleyTaxes: PaisleyTax[] | undefined;
    let paisleyBuyTax: bigint | undefined;
    let paisleySellTax: bigint | undefined;

    if (paisleyResults?.[0]?.status === 'success') {
      const rawTaxes = paisleyResults[0].result as PaisleyTax[];
      if (rawTaxes && rawTaxes.length > 0) {
        paisleyTaxes = rawTaxes;
        const parsed = parsePaisleyTaxes(rawTaxes);
        paisleyBuyTax = parsed.buyTax;
        paisleySellTax = parsed.sellTax;
      }
    }

    // Determine token type
    const isPaisleyToken = paisleyTaxes !== undefined && paisleyTaxes.length > 0;
    const tokenType = isForged ? (isPaisleyToken ? 'PAISLEY' : 'FORGE') : (isPaisleyToken ? 'PAISLEY' : 'UNKNOWN');

    return {
      address: tokenAddress,
      tokenId: 0n,
      tokenType,
      createdAt: 0n,
      name,
      symbol,
      decimals,
      totalSupply,
      buyTax: v2BuyTax ?? paisleyBuyTax ?? 0n,
      sellTax: v2SellTax ?? paisleySellTax ?? 0n,
      tradingEnabled,
      creator,
      treasuryWallet: v2TreasuryEntry?.[0] || '0x0000000000000000000000000000000000000000' as Address,
      totalReflections: v2TotalReflected || 0n,
      pair: v2Pair || '0x0000000000000000000000000000000000000000' as Address,
      // Paisley-specific data
      paisleyTaxes,
      isPaisleyToken,
    };
  }, [universalResults, v2Results, paisleyResults, isForged, tokenAddress]);

  const refetch = () => {
    refetchUniversal();
    refetchV2();
    refetchPaisley();
  };

  return {
    tokenData,
    isLoading: universalLoading,
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
 * Format tax rate from basis points (V2) or raw percentage (Paisley)
 */
export function formatTaxRate(basisPoints: bigint | undefined): string {
  if (!basisPoints) return '0%';
  return (Number(basisPoints) / 100).toFixed(1) + '%';
}
