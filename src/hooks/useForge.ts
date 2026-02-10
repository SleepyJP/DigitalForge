'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { useState, useEffect, useRef } from 'react';
import {
  THE_DIGITAL_FORGE_ADDRESS,
  THE_DIGITAL_FORGE_ABI,
  CREATION_FEE,
  ForgeTokenConfig,
  AddressShare,
  TREASURY_ADDRESS
} from '@/lib/contracts';

const OWNABLE_ABI = [
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Address entry with percentage share for multi-address support
export interface AddressEntry {
  address: string;
  share: number; // Tax % (unified = total split 50/50, split = buy %)
  sellShare: number; // Sell % (only used when split=true)
  split: boolean; // true = separate buy/sell, false = unified (50/50)
}

export interface TokenFormData {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  // Metadata
  imageUri: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  // Tax rates (percentage) - calculated from mechanism allocations
  buyTax: number;
  sellTax: number;
  // Per-mechanism split toggles (true = different buy/sell, false = unified)
  treasurySplit: boolean;
  burnSplit: boolean;
  reflectionSplit: boolean;
  liquiditySplit: boolean;
  yieldSplit: boolean;
  supportSplit: boolean;
  // Distribution shares - BUY (or unified if split=false)
  treasuryShare: number;
  burnShare: number;
  reflectionShare: number;
  liquidityShare: number;
  yieldShare: number;
  supportShare: number;
  // Distribution shares - SELL (only used if mechanism's split=true)
  treasuryShareSell: number;
  burnShareSell: number;
  reflectionShareSell: number;
  liquidityShareSell: number;
  yieldShareSell: number;
  supportShareSell: number;
  // Single addresses (legacy - used for contract V1)
  treasuryWallet: string;
  yieldToken: string;
  supportToken: string;
  liquidityRecipient: string;
  burnAddress: string;
  // Multi-address support (for contract V2)
  treasuryWallets?: AddressEntry[];
  yieldTokens?: AddressEntry[];
  supportTokens?: AddressEntry[];
  liquidityRecipients?: AddressEntry[];
  burnAddresses?: AddressEntry[];
  // Limits
  maxTxPercent: number;
  maxWalletPercent: number;
  // Features
  antiBotEnabled: boolean;
  tradingEnabledOnLaunch: boolean;
  renounceOwnership: boolean;
  treasuryReceiveInPLS: boolean;
}

export const DEFAULT_FORM_DATA: TokenFormData = {
  name: '',
  symbol: '',
  totalSupply: '1000000000',
  decimals: 18,
  imageUri: '',
  description: '',
  website: '',
  twitter: '',
  telegram: '',
  buyTax: 0,
  sellTax: 0,
  // Per-mechanism split toggles
  treasurySplit: false,
  burnSplit: false,
  reflectionSplit: false,
  liquiditySplit: false,
  yieldSplit: false,
  supportSplit: false,
  // Buy/Unified shares
  treasuryShare: 0,
  burnShare: 0,
  reflectionShare: 0,
  liquidityShare: 0,
  yieldShare: 0,
  supportShare: 0,
  // Sell shares (for split mode)
  treasuryShareSell: 0,
  burnShareSell: 0,
  reflectionShareSell: 0,
  liquidityShareSell: 0,
  yieldShareSell: 0,
  supportShareSell: 0,
  treasuryWallet: TREASURY_ADDRESS,
  yieldToken: '',
  supportToken: '',
  liquidityRecipient: TREASURY_ADDRESS,
  burnAddress: '0x000000000000000000000000000000000000dEaD',
  maxTxPercent: 0,
  maxWalletPercent: 0,
  antiBotEnabled: false,
  tradingEnabledOnLaunch: true,
  renounceOwnership: false,
  treasuryReceiveInPLS: false,
};

export function useForgeStats() {
  const { data: tokenCount } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'tokenCount',
  });

  const { data: creationFee } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'creationFee',
  });

  return {
    tokenCount: tokenCount ? Number(tokenCount) : 0,
    creationFee: creationFee ? formatEther(creationFee) : '100000',
  };
}

export function useForgeToken() {
  const { address } = useAccount();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { data: renounceHash, error: renounceError, isPending: renouncePending, writeContract: writeRenounce } = useWriteContract();
  const { isLoading: renounceConfirming, isSuccess: renounceSuccess } = useWaitForTransactionReceipt({ hash: renounceHash });

  const [shouldRenounce, setShouldRenounce] = useState(false);
  const renounceTriggered = useRef(false);

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Extract token address from TokenForged event (emitted by factory, NOT the first log)
  // logs[0] is typically the Transfer event from _mint(), not TokenForged.
  // Filter by factory address to find the correct event.
  const createdTokenAddress = (() => {
    if (!receipt?.logs) return undefined;
    const forgedLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === THE_DIGITAL_FORGE_ADDRESS.toLowerCase()
    );
    if (forgedLog?.topics?.[2]) {
      return ('0x' + forgedLog.topics[2].slice(26)) as Address;
    }
    return undefined;
  })();

  // Auto-renounce ownership after successful creation if requested
  useEffect(() => {
    if (isSuccess && createdTokenAddress && shouldRenounce && !renounceTriggered.current) {
      renounceTriggered.current = true;
      writeRenounce({
        address: createdTokenAddress,
        abi: OWNABLE_ABI,
        functionName: 'renounceOwnership',
      });
    }
  }, [isSuccess, createdTokenAddress, shouldRenounce, writeRenounce]);

  const forgeToken = (formData: TokenFormData) => {
    if (!address) return;

    const totalSupplyWei = parseEther(formData.totalSupply);

    // Calculate limits based on percentage
    const maxTxAmount = formData.maxTxPercent > 0
      ? (totalSupplyWei * BigInt(formData.maxTxPercent)) / 100n
      : 0n;
    const maxWalletAmount = formData.maxWalletPercent > 0
      ? (totalSupplyWei * BigInt(formData.maxWalletPercent)) / 100n
      : 0n;

    // Build treasury wallets array (V2)
    const treasuryWallets: AddressShare[] = formData.treasuryWallets?.length
      ? formData.treasuryWallets.map(e => ({
          addr: e.address as Address,
          share: BigInt(Math.round(e.share * 100)), // Convert % to basis points
        }))
      : [{ addr: (formData.treasuryWallet || TREASURY_ADDRESS) as Address, share: 10000n }];

    // Build yield tokens array (V2)
    const yieldTokens: AddressShare[] = formData.yieldTokens?.length
      ? formData.yieldTokens.map(e => ({
          addr: e.address as Address,
          share: BigInt(Math.round(e.share * 100)),
        }))
      : formData.yieldToken
        ? [{ addr: formData.yieldToken as Address, share: 10000n }]
        : [];

    // Build support tokens array (V2)
    const supportTokens: AddressShare[] = formData.supportTokens?.length
      ? formData.supportTokens.map(e => ({
          addr: e.address as Address,
          share: BigInt(Math.round(e.share * 100)),
        }))
      : formData.supportToken
        ? [{ addr: formData.supportToken as Address, share: 10000n }]
        : [];

    // Each address entry has its own tax % and split toggle
    // Calculate totals from all address entries

    const getEntryBuyTax = (e: AddressEntry) => e.split ? e.share : e.share;
    const getEntrySellTax = (e: AddressEntry) => e.split ? e.sellShare : e.share;

    // Sum from all address entries
    const sumEntries = (entries: AddressEntry[] | undefined) => {
      if (!entries || entries.length === 0) return { buy: 0, sell: 0 };
      return entries.reduce((acc, e) => ({
        buy: acc.buy + getEntryBuyTax(e),
        sell: acc.sell + getEntrySellTax(e)
      }), { buy: 0, sell: 0 });
    };

    const treasuryTotals = sumEntries(formData.treasuryWallets);
    const burnTotals = sumEntries(formData.burnAddresses);
    const liquidityTotals = sumEntries(formData.liquidityRecipients);
    const yieldTotals = sumEntries(formData.yieldTokens);
    const supportTotals = sumEntries(formData.supportTokens);

    // Reflection uses legacy fields (no addresses)
    const reflectionBuy = formData.reflectionSplit ? formData.reflectionShare : (formData.reflectionShare || 0);
    const reflectionSell = formData.reflectionSplit ? formData.reflectionShareSell : (formData.reflectionShare || 0);

    // Calculate total BUY and SELL taxes
    const totalBuyAllocated = treasuryTotals.buy + burnTotals.buy + reflectionBuy +
                              liquidityTotals.buy + yieldTotals.buy + supportTotals.buy;
    const totalSellAllocated = treasuryTotals.sell + burnTotals.sell + reflectionSell +
                               liquidityTotals.sell + yieldTotals.sell + supportTotals.sell;

    // Calculate shares as portion of total (must sum to exactly 10000)
    // Use largest-remainder method to prevent rounding drift
    const calcShares = () => {
      if (totalBuyAllocated <= 0) {
        return { treasury: 0n, burn: 0n, reflection: 0n, liquidity: 0n, yield: 0n, support: 0n };
      }

      const mechanisms = [
        { key: 'treasury', tax: treasuryTotals.buy },
        { key: 'burn', tax: burnTotals.buy },
        { key: 'reflection', tax: reflectionBuy },
        { key: 'liquidity', tax: liquidityTotals.buy },
        { key: 'yield', tax: yieldTotals.buy },
        { key: 'support', tax: supportTotals.buy },
      ];

      // Floor each share, track remainders
      const entries = mechanisms.map(m => {
        const exact = (m.tax / totalBuyAllocated) * 10000;
        const floored = Math.floor(exact);
        return { key: m.key, floored, remainder: exact - floored };
      });

      let sum = entries.reduce((s, e) => s + e.floored, 0);
      // Distribute leftover points to entries with largest remainders
      const sorted = [...entries].sort((a, b) => b.remainder - a.remainder);
      let i = 0;
      while (sum < 10000 && i < sorted.length) {
        if (sorted[i].remainder > 0) {
          sorted[i].floored++;
          sum++;
        }
        i++;
      }

      const result: Record<string, bigint> = {};
      for (const e of entries) {
        result[e.key] = BigInt(e.floored);
      }
      return result;
    };

    const shares = calcShares();

    const config: ForgeTokenConfig = {
      name: formData.name,
      symbol: formData.symbol,
      totalSupply: totalSupplyWei,
      decimals: formData.decimals,
      buyTax: BigInt(Math.round(totalBuyAllocated * 100)),
      sellTax: BigInt(Math.round(totalSellAllocated * 100)),
      treasuryShare: shares.treasury,
      burnShare: shares.burn,
      reflectionShare: shares.reflection,
      liquidityShare: shares.liquidity,
      yieldShare: shares.yield,
      supportShare: shares.support,
      treasuryWallets,
      yieldTokens,
      supportTokens,
      router: '0x0000000000000000000000000000000000000000' as Address,
      maxTxAmount,
      maxWalletAmount,
      antiBotEnabled: formData.antiBotEnabled,
      tradingEnabledOnLaunch: formData.tradingEnabledOnLaunch,
    };

    // Track if user wants to renounce after creation
    setShouldRenounce(formData.renounceOwnership);
    renounceTriggered.current = false;

    writeContract({
      address: THE_DIGITAL_FORGE_ADDRESS,
      abi: THE_DIGITAL_FORGE_ABI,
      functionName: 'forgeToken',
      args: [config],
      value: CREATION_FEE,
    });
  };

  return {
    forgeToken,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
    createdTokenAddress,
    // Renounce state
    renounceHash,
    renounceError,
    renouncePending,
    renounceConfirming,
    renounceSuccess,
    shouldRenounce,
  };
}

export function useCreatorTokens(creator?: Address) {
  const { data: tokenIds } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'getCreatorTokens',
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!creator,
    },
  });

  return {
    tokenIds: tokenIds || [],
  };
}

export function validateFormData(formData: TokenFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!formData.name.trim()) {
    errors.push('Token name is required');
  }

  if (!formData.symbol.trim()) {
    errors.push('Token symbol is required');
  }

  if (formData.symbol.length > 11) {
    errors.push('Symbol must be 11 characters or less');
  }

  const totalSupply = parseFloat(formData.totalSupply);
  if (isNaN(totalSupply) || totalSupply <= 0) {
    errors.push('Total supply must be greater than 0');
  }

  // Calculate total taxes
  // - Unified mode: entered % is TOTAL, split 50/50 between buy and sell
  // - Split mode: buy and sell are entered separately

  const getBuyTax = (unifiedShare: number, isSplit: boolean) =>
    isSplit ? unifiedShare : unifiedShare;

  const getSellTax = (unifiedShare: number, sellShare: number, isSplit: boolean) =>
    isSplit ? sellShare : unifiedShare;

  const totalBuyTax =
    getBuyTax(formData.treasuryShare, formData.treasurySplit) +
    getBuyTax(formData.burnShare, formData.burnSplit) +
    getBuyTax(formData.reflectionShare, formData.reflectionSplit) +
    getBuyTax(formData.liquidityShare, formData.liquiditySplit) +
    getBuyTax(formData.yieldShare, formData.yieldSplit) +
    getBuyTax(formData.supportShare, formData.supportSplit);

  const totalSellTax =
    getSellTax(formData.treasuryShare, formData.treasuryShareSell, formData.treasurySplit) +
    getSellTax(formData.burnShare, formData.burnShareSell, formData.burnSplit) +
    getSellTax(formData.reflectionShare, formData.reflectionShareSell, formData.reflectionSplit) +
    getSellTax(formData.liquidityShare, formData.liquidityShareSell, formData.liquiditySplit) +
    getSellTax(formData.yieldShare, formData.yieldShareSell, formData.yieldSplit) +
    getSellTax(formData.supportShare, formData.supportShareSell, formData.supportSplit);

  if (totalBuyTax > 25) {
    errors.push('Total buy tax cannot exceed 25%');
  }

  if (totalSellTax > 25) {
    errors.push('Total sell tax cannot exceed 25%');
  }

  // Validate addresses if provided
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;

  if (formData.treasuryWallet && !addressRegex.test(formData.treasuryWallet)) {
    errors.push('Invalid treasury wallet address');
  }

  if (formData.yieldShare > 0 && formData.yieldToken && !addressRegex.test(formData.yieldToken)) {
    errors.push('Invalid yield token address');
  }

  if (formData.supportShare > 0 && formData.supportToken && !addressRegex.test(formData.supportToken)) {
    errors.push('Invalid support token address');
  }

  // Require yield token if yield share > 0 (buy or sell)
  const hasYieldTax = formData.yieldShare > 0 ||
    (formData.yieldSplit && formData.yieldShareSell > 0);
  if (hasYieldTax && !formData.yieldToken) {
    errors.push('Yield token address required when yield tax > 0');
  }

  // Require support token if support share > 0 (buy or sell)
  const hasSupportTax = formData.supportShare > 0 ||
    (formData.supportSplit && formData.supportShareSell > 0);
  if (hasSupportTax && !formData.supportToken) {
    errors.push('Support token address required when support tax > 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
