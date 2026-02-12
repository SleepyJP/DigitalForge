'use client';

import { useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { useMemo } from 'react';
import { TrendingUp, ExternalLink, Flame, Droplets, Gift, Building2, Shield, Zap } from 'lucide-react';
import { FORGED_TOKEN_ABI } from '@/lib/contracts';

// =====================================================================
// THE DIGITAL FORGE - Buyback & Reward Tokens Panel
// Supports BOTH V2/V3 ForgedTaxToken AND getTaxes() tokens
// =====================================================================

const getTokenLogoUrl = (address: string) =>
  `https://raw.githubusercontent.com/piteasio/app-tokens/main/token-logo/${address}.png`;

const KNOWN_TOKENS: Record<string, { name: string; symbol: string; color: string }> = {
  '0xa1077a294dde1b09bb078844df40758a5d0f9a27': { name: 'Wrapped PLS', symbol: 'WPLS', color: '#00ff88' },
  '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': { name: 'HEX', symbol: 'HEX', color: '#ff6600' },
  '0x95b303987a60c71504d99aa1b13b4da07b0790ab': { name: 'PulseX', symbol: 'PLSX', color: '#00aaff' },
  '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d': { name: 'Incentive', symbol: 'INC', color: '#aa00ff' },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'Dai Stablecoin', symbol: 'DAI', color: '#f5ac37' },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { name: 'Wrapped BTC', symbol: 'WBTC', color: '#f7931a' },
  '0xc10a4ed9b4042222d69ff0b374eddd47ed90fc1f': { name: 'PulseChain Peacock', symbol: 'PCOCK', color: '#00ddcc' },
  '0xf6703dbff070f231eed966d33b1b6d7ef5207d26': { name: 'ZeroTrust', symbol: 'ZERO', color: '#ff0066' },
  '0x463413c579d29c26d59a65312657dfce30d545a1': { name: 'Treasury Bill', symbol: 'TBILL', color: '#ffd700' },
  '0xa59a460b9bd6db7b167e7082df3c9d87eebc9825': { name: 'Wrapped FUD', symbol: 'WFUD', color: '#ff4444' },
};

const DISTRIBUTION_COLORS: Record<string, string> = {
  treasury: '#FFD700',
  burn: '#FF6B35',
  reflection: '#00FF88',
  liquidity: '#00D4FF',
  yield: '#AA00FF',
  support: '#FF00FF',
};

// TaxType enum from the deployed contract
const TAX_TYPE_MAP: Record<number, string> = {
  0: 'burn',       // Burn
  1: 'support',    // ExternalBurn (buy & burn external token)
  2: 'treasury',   // Dev
  3: 'reflection', // Reflection
  4: 'yield',      // Yield
  5: 'liquidity',  // Liquify
};

const TAX_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  treasury:   { label: 'Treasury',        icon: <Building2 size={12} /> },
  burn:       { label: 'Burn',            icon: <Flame size={12} /> },
  reflection: { label: 'Reflections',     icon: <Gift size={12} /> },
  liquidity:  { label: 'Auto-LP',         icon: <Droplets size={12} /> },
  yield:      { label: 'Yield Buyback',   icon: <TrendingUp size={12} /> },
  support:    { label: 'Support Buyback', icon: <Zap size={12} /> },
};

const MAX_ARRAY_READ = 20;

// ABI for getTaxes() — returns Tax[] struct array
const GET_TAXES_ABI = [
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

interface TaxStruct {
  id: bigint;
  taxType: number;
  taxMoment: number;
  percentage: bigint;
  receiver: `0x${string}`;
  tokenAddress: `0x${string}`;
  burnAddress: `0x${string}`;
  rewardInPls: boolean;
  amountAccumulated: bigint;
  total: bigint;
}

interface BuybackTokensPanelProps {
  tokenAddress?: Address;
  tokenSymbol?: string;
}

export function BuybackTokensPanel({ tokenAddress }: BuybackTokensPanelProps) {
  // === TRY BOTH ABIS ===

  // V2/V3 Phase 1: shares, rates, pending
  const v2Contracts = useMemo(() => {
    if (!tokenAddress) return [];
    const abi = FORGED_TOKEN_ABI;
    const addr = tokenAddress;
    return [
      { address: addr, abi, functionName: 'buyTax' as const },
      { address: addr, abi, functionName: 'sellTax' as const },
      { address: addr, abi, functionName: 'treasuryShare' as const },
      { address: addr, abi, functionName: 'burnShare' as const },
      { address: addr, abi, functionName: 'reflectionShare' as const },
      { address: addr, abi, functionName: 'liquidityShare' as const },
      { address: addr, abi, functionName: 'yieldShare' as const },
      { address: addr, abi, functionName: 'supportShare' as const },
      { address: addr, abi, functionName: 'pair' as const },
      { address: addr, abi, functionName: 'totalReflected' as const },
      { address: addr, abi, functionName: 'swapThreshold' as const },
      { address: addr, abi, functionName: 'swapEnabled' as const },
      { address: addr, abi, functionName: 'pendingTreasury' as const },
      { address: addr, abi, functionName: 'pendingBurn' as const },
      { address: addr, abi, functionName: 'pendingReflection' as const },
      { address: addr, abi, functionName: 'pendingLiquidity' as const },
      { address: addr, abi, functionName: 'pendingYield' as const },
      { address: addr, abi, functionName: 'pendingSupport' as const },
      { address: addr, abi, functionName: 'getHolderCount' as const },
    ];
  }, [tokenAddress]);

  const { data: v2Phase1 } = useReadContracts({
    contracts: v2Contracts as readonly unknown[],
    query: { enabled: v2Contracts.length > 0 },
  });

  // V2 Phase 2: array entries
  const v2ArrayContracts = useMemo(() => {
    if (!tokenAddress) return [];
    const abi = FORGED_TOKEN_ABI;
    const addr = tokenAddress;
    const calls: unknown[] = [];
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      calls.push({ address: addr, abi, functionName: 'treasuryWallets' as const, args: [BigInt(i)] });
    }
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      calls.push({ address: addr, abi, functionName: 'yieldTokens' as const, args: [BigInt(i)] });
    }
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      calls.push({ address: addr, abi, functionName: 'supportTokens' as const, args: [BigInt(i)] });
    }
    return calls;
  }, [tokenAddress]);

  const { data: v2Phase2 } = useReadContracts({
    contracts: v2ArrayContracts as readonly unknown[],
    query: { enabled: v2ArrayContracts.length > 0 },
  });

  // getTaxes() call — works on tokens with the Tax[] struct
  const getTaxesContracts = useMemo(() => {
    if (!tokenAddress) return [];
    return [{ address: tokenAddress, abi: GET_TAXES_ABI, functionName: 'getTaxes' as const }];
  }, [tokenAddress]);

  const { data: getTaxesResult } = useReadContracts({
    contracts: getTaxesContracts as readonly unknown[],
    query: { enabled: getTaxesContracts.length > 0 },
  });

  const data = useMemo(() => {
    // Check if V2 worked (buyTax returned successfully)
    const v2Works = v2Phase1?.[0]?.status === 'success';

    // Check if getTaxes() worked
    const getTaxesWorks = getTaxesResult?.[0]?.status === 'success';

    if (v2Works && v2Phase1) {
      // === V2 PATH ===
      const buyTax = (v2Phase1[0]?.result as bigint) || 0n;
      const sellTax = (v2Phase1[1]?.result as bigint) || 0n;
      const treasuryShare = Number((v2Phase1[2]?.result as bigint) || 0n);
      const burnShare = Number((v2Phase1[3]?.result as bigint) || 0n);
      const reflectionShare = Number((v2Phase1[4]?.result as bigint) || 0n);
      const liquidityShare = Number((v2Phase1[5]?.result as bigint) || 0n);
      const yieldShare = Number((v2Phase1[6]?.result as bigint) || 0n);
      const supportShare = Number((v2Phase1[7]?.result as bigint) || 0n);
      const lpPair = (v2Phase1[8]?.result as Address) || null;
      const totalReflected = (v2Phase1[9]?.result as bigint) || 0n;
      const swapThreshold = (v2Phase1[10]?.result as bigint) || 0n;
      const swapEnabled = (v2Phase1[11]?.result as boolean) ?? true;
      const pendingTreasury = (v2Phase1[12]?.result as bigint) || 0n;
      const pendingBurn = (v2Phase1[13]?.result as bigint) || 0n;
      const pendingReflection = (v2Phase1[14]?.result as bigint) || 0n;
      const pendingLiquidity = (v2Phase1[15]?.result as bigint) || 0n;
      const pendingYield = (v2Phase1[16]?.result as bigint) || 0n;
      const pendingSupport = (v2Phase1[17]?.result as bigint) || 0n;
      const holderCount = Number((v2Phase1[18]?.result as bigint) || 0n);

      // Parse V2 arrays
      const treasuryWallets: { addr: Address; share: bigint }[] = [];
      const yieldTokenAddrs: { addr: Address; share: bigint }[] = [];
      const supportTokenAddrs: { addr: Address; share: bigint }[] = [];
      const ZERO = '0x0000000000000000000000000000000000000000';

      if (v2Phase2) {
        for (let i = 0; i < MAX_ARRAY_READ; i++) {
          const entry = v2Phase2[i];
          if (entry?.status === 'success' && entry.result) {
            const [addr, share] = entry.result as [Address, bigint];
            if (addr && addr !== ZERO) treasuryWallets.push({ addr, share });
          } else break;
        }
        for (let i = 0; i < MAX_ARRAY_READ; i++) {
          const entry = v2Phase2[MAX_ARRAY_READ + i];
          if (entry?.status === 'success' && entry.result) {
            const [addr, share] = entry.result as [Address, bigint];
            if (addr && addr !== ZERO) yieldTokenAddrs.push({ addr, share });
          } else break;
        }
        for (let i = 0; i < MAX_ARRAY_READ; i++) {
          const entry = v2Phase2[MAX_ARRAY_READ * 2 + i];
          if (entry?.status === 'success' && entry.result) {
            const [addr, share] = entry.result as [Address, bigint];
            if (addr && addr !== ZERO) supportTokenAddrs.push({ addr, share });
          } else break;
        }
      }

      const distributions = [
        { key: 'treasury', label: 'Treasury', share: treasuryShare / 100, color: DISTRIBUTION_COLORS.treasury, icon: <Building2 size={12} /> },
        { key: 'burn', label: 'Burn', share: burnShare / 100, color: DISTRIBUTION_COLORS.burn, icon: <Flame size={12} /> },
        { key: 'reflection', label: 'Reflections', share: reflectionShare / 100, color: DISTRIBUTION_COLORS.reflection, icon: <Gift size={12} /> },
        { key: 'liquidity', label: 'Auto-LP', share: liquidityShare / 100, color: DISTRIBUTION_COLORS.liquidity, icon: <Droplets size={12} /> },
        { key: 'yield', label: 'Yield Buyback', share: yieldShare / 100, color: DISTRIBUTION_COLORS.yield, icon: <TrendingUp size={12} /> },
        { key: 'support', label: 'Support Buyback', share: supportShare / 100, color: DISTRIBUTION_COLORS.support, icon: <Zap size={12} /> },
      ].filter((d) => d.share > 0);

      const totalPending = pendingTreasury + pendingBurn + pendingReflection + pendingLiquidity + pendingYield + pendingSupport;

      return {
        buyTax: Number(buyTax) / 100,
        sellTax: Number(sellTax) / 100,
        distributions,
        treasuryWallets,
        yieldTokenAddrs,
        supportTokenAddrs,
        totalReflected,
        lpPair,
        swapThreshold,
        swapEnabled,
        pendingTreasury, pendingBurn, pendingReflection, pendingLiquidity, pendingYield, pendingSupport,
        totalPending,
        holderCount,
      };
    }

    if (getTaxesWorks && getTaxesResult) {
      // === getTaxes() PATH ===
      const taxes = getTaxesResult[0].result as TaxStruct[];
      if (!taxes || taxes.length === 0) return null;

      // Aggregate by type and direction
      let buyTotal = 0n;
      let sellTotal = 0n;
      const shareByType: Record<string, number> = {};
      const treasuryWallets: { addr: Address; share: bigint }[] = [];
      const yieldTokenAddrs: { addr: Address; share: bigint }[] = [];
      const supportTokenAddrs: { addr: Address; share: bigint }[] = [];
      const ZERO = '0x0000000000000000000000000000000000000000';
      let totalAccumulated = 0n;
      let totalDistributed = 0n;
      const seenTreasury = new Set<string>();
      const seenYield = new Set<string>();
      const seenSupport = new Set<string>();

      for (const tax of taxes) {
        const typeKey = TAX_TYPE_MAP[tax.taxType] || 'treasury';
        const isBuy = tax.taxMoment === 0 || tax.taxMoment === 1;
        const isSell = tax.taxMoment === 0 || tax.taxMoment === 2;

        if (isBuy) buyTotal += tax.percentage;
        if (isSell) sellTotal += tax.percentage;

        // Accumulate share percentages (use buy direction for distribution display)
        if (isBuy) {
          shareByType[typeKey] = (shareByType[typeKey] || 0) + Number(tax.percentage);
        }

        totalAccumulated += tax.amountAccumulated;
        totalDistributed += tax.total;

        // Extract receiver addresses
        if (typeKey === 'treasury' && tax.receiver !== ZERO && !seenTreasury.has(tax.receiver.toLowerCase())) {
          seenTreasury.add(tax.receiver.toLowerCase());
          treasuryWallets.push({ addr: tax.receiver, share: tax.percentage });
        }
        if (typeKey === 'yield' && tax.tokenAddress !== ZERO && !seenYield.has(tax.tokenAddress.toLowerCase())) {
          seenYield.add(tax.tokenAddress.toLowerCase());
          yieldTokenAddrs.push({ addr: tax.tokenAddress, share: tax.percentage });
        }
        if (typeKey === 'support' && tax.tokenAddress !== ZERO && !seenSupport.has(tax.tokenAddress.toLowerCase())) {
          seenSupport.add(tax.tokenAddress.toLowerCase());
          supportTokenAddrs.push({ addr: tax.tokenAddress, share: tax.percentage });
        }
      }

      // Calculate total buy tax for distribution percentages
      const buyTotalNum = Number(buyTotal);
      const distributions = Object.entries(shareByType)
        .map(([key, rawPct]) => {
          const info = TAX_TYPE_LABELS[key] || { label: key, icon: <Shield size={12} /> };
          return {
            key,
            label: info.label,
            share: buyTotalNum > 0 ? Math.round((rawPct / buyTotalNum) * 100) : 0,
            rawPct: Number(rawPct) / 100,
            color: DISTRIBUTION_COLORS[key] || '#888888',
            icon: info.icon,
          };
        })
        .filter((d) => d.rawPct > 0);

      return {
        buyTax: Number(buyTotal) / 100,
        sellTax: Number(sellTotal) / 100,
        distributions,
        treasuryWallets,
        yieldTokenAddrs,
        supportTokenAddrs,
        totalReflected: totalDistributed,
        lpPair: null,
        swapThreshold: 0n,
        swapEnabled: true,
        pendingTreasury: 0n, pendingBurn: 0n, pendingReflection: 0n,
        pendingLiquidity: 0n, pendingYield: 0n, pendingSupport: 0n,
        totalPending: totalAccumulated,
        holderCount: 0,
      };
    }

    return null;
  }, [v2Phase1, v2Phase2, getTaxesResult]);

  if (!data || (data.buyTax === 0 && data.sellTax === 0)) return null;

  const formatAmount = (amount: bigint): string => {
    const num = Number(formatUnits(amount, 18));
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    if (num < 0.01 && num > 0) return '< 0.01';
    return num.toFixed(2);
  };

  const getTokenInfo = (addr: string) => {
    const known = KNOWN_TOKENS[addr.toLowerCase()];
    if (known) return known;
    return { name: 'Unknown Token', symbol: addr.slice(0, 6) + '...' + addr.slice(-4), color: '#888888' };
  };

  const allRewardTokens = [
    ...data.yieldTokenAddrs.map((t) => ({ ...t, type: 'Yield' })),
    ...data.supportTokenAddrs.map((t) => ({ ...t, type: 'Support' })),
  ];

  return (
    <div className="glass-card rounded-xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-sm">TAX TOKENOMICS</h3>
            <p className="text-[10px] text-gray-500 font-rajdhani">Fee-on-Transfer Distribution</p>
          </div>
          {data.holderCount > 0 && (
            <div className="ml-auto text-right">
              <p className="text-xs font-mono text-cyan-400">{data.holderCount.toLocaleString()}</p>
              <p className="text-[9px] text-gray-500 font-rajdhani">Holders</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Tax Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-1">Buy Tax</div>
            <div className="text-2xl font-mono font-bold text-green-400">
              {data.buyTax.toFixed(1)}%
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-1">Sell Tax</div>
            <div className="text-2xl font-mono font-bold text-red-400">
              {data.sellTax.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Distribution Breakdown — individual mechanism rates */}
        {data.distributions.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Tax Distribution</div>
            <div className="h-4 bg-gray-900 rounded-full overflow-hidden flex">
              {data.distributions.map((d) => (
                <div
                  key={d.key}
                  className="h-full transition-all duration-500"
                  style={{ width: `${d.share}%`, backgroundColor: d.color }}
                  title={`${d.label}: ${'rawPct' in d ? d.rawPct + '%' : d.share + '%'}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {data.distributions.map((d) => (
                <div key={d.key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-gray-400 font-mono">
                    {d.icon} {d.label}: {'rawPct' in d ? `${(d as { rawPct: number }).rawPct}%` : `${d.share}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Distribution Status */}
        {data.totalPending > 0n && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
            <div className="text-[10px] text-yellow-400 font-rajdhani uppercase mb-2">
              {data.swapThreshold > 0n ? 'Pending Distribution' : 'Accumulated Taxes'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {data.pendingTreasury > 0n && (
                <div className="text-center">
                  <p className="text-xs font-mono text-yellow-400">{formatAmount(data.pendingTreasury)}</p>
                  <p className="text-[8px] text-gray-500">Treasury</p>
                </div>
              )}
              {data.pendingBurn > 0n && (
                <div className="text-center">
                  <p className="text-xs font-mono text-orange-400">{formatAmount(data.pendingBurn)}</p>
                  <p className="text-[8px] text-gray-500">Burn</p>
                </div>
              )}
              {data.pendingReflection > 0n && (
                <div className="text-center">
                  <p className="text-xs font-mono text-green-400">{formatAmount(data.pendingReflection)}</p>
                  <p className="text-[8px] text-gray-500">Reflection</p>
                </div>
              )}
              {data.pendingLiquidity > 0n && (
                <div className="text-center">
                  <p className="text-xs font-mono text-cyan-400">{formatAmount(data.pendingLiquidity)}</p>
                  <p className="text-[8px] text-gray-500">Liquidity</p>
                </div>
              )}
              {data.pendingYield > 0n && (
                <div className="text-center">
                  <p className="text-xs font-mono text-purple-400">{formatAmount(data.pendingYield)}</p>
                  <p className="text-[8px] text-gray-500">Yield</p>
                </div>
              )}
              {data.pendingSupport > 0n && (
                <div className="text-center">
                  <p className="text-xs font-mono text-pink-400">{formatAmount(data.pendingSupport)}</p>
                  <p className="text-[8px] text-gray-500">Support</p>
                </div>
              )}
              {/* Show total accumulated for getTaxes tokens */}
              {data.swapThreshold === 0n && data.totalPending > 0n && (
                <div className="text-center col-span-3">
                  <p className="text-xs font-mono text-yellow-400">{formatAmount(data.totalPending)}</p>
                  <p className="text-[8px] text-gray-500">Total Accumulated</p>
                </div>
              )}
            </div>
            {data.swapThreshold > 0n && (
              <div className="mt-2 pt-2 border-t border-yellow-500/10 flex items-center justify-between">
                <span className="text-[9px] text-gray-500">Swap threshold: {formatAmount(data.swapThreshold)}</span>
                <span className={`text-[9px] font-mono ${data.swapEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {data.swapEnabled ? 'AUTO-SWAP ON' : 'AUTO-SWAP OFF'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reward / Buyback Tokens */}
        {allRewardTokens.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">
              Buyback & Reward Tokens ({allRewardTokens.length})
            </div>
            <div className="space-y-2">
              {allRewardTokens.map((rt) => {
                const info = getTokenInfo(rt.addr);
                const sharePct = (Number(rt.share) / 100).toFixed(1);
                return (
                  <a
                    key={rt.addr + rt.type}
                    href={`https://scan.pulsechain.com/token/${rt.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-purple-500/40 transition-all group"
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0"
                      style={{ borderColor: info.color + '60' }}
                    >
                      <img
                        src={getTokenLogoUrl(rt.addr)}
                        alt={info.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML =
                            `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-xs font-bold" style="color:${info.color}">${info.symbol.slice(0, 2)}</div>`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{info.symbol}</span>
                        <span className="text-[10px] text-gray-500 font-rajdhani px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">
                          {rt.type}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{sharePct}%</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {rt.addr.slice(0, 10)}...{rt.addr.slice(-6)}
                      </span>
                    </div>
                    <ExternalLink size={12} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Treasury Wallets */}
        {data.treasuryWallets.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">
              Treasury Wallet{data.treasuryWallets.length > 1 ? 's' : ''} ({data.treasuryWallets.length})
            </div>
            <div className="space-y-2">
              {data.treasuryWallets.map((tw) => {
                const sharePct = (Number(tw.share) / 100).toFixed(1);
                return (
                  <a
                    key={tw.addr}
                    href={`https://scan.pulsechain.com/address/${tw.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                  >
                    <Building2 size={14} className="text-yellow-400 flex-shrink-0" />
                    <span className="text-yellow-400 font-mono text-xs truncate">{tw.addr}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-auto flex-shrink-0">{sharePct}%</span>
                    <ExternalLink size={10} className="text-yellow-400/50 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Lifetime Stats */}
        {data.totalReflected > 0n && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Lifetime Stats</div>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-2 bg-black/30 rounded border border-gray-800 text-center">
                <Gift size={12} className="text-green-400 mx-auto mb-1" />
                <div className="font-mono text-green-400 text-sm font-bold">{formatAmount(data.totalReflected)}</div>
                <div className="text-[9px] text-gray-500">Total Distributed</div>
              </div>
            </div>
          </div>
        )}

        {/* LP Pair */}
        {data.lpPair && data.lpPair !== '0x0000000000000000000000000000000000000000' && (
          <a
            href={`https://scan.pulsechain.com/address/${data.lpPair}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all text-xs"
          >
            <Droplets size={12} className="text-cyan-400 flex-shrink-0" />
            <span className="text-gray-500 font-rajdhani">LP Pair:</span>
            <span className="text-cyan-400 font-mono truncate">{data.lpPair.slice(0, 10)}...{data.lpPair.slice(-6)}</span>
            <ExternalLink size={10} className="text-cyan-400/50 flex-shrink-0 ml-auto" />
          </a>
        )}
      </div>
    </div>
  );
}

export default BuybackTokensPanel;
