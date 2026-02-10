'use client';

import { useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { useMemo } from 'react';
import { TrendingUp, ExternalLink, Flame, Droplets, Gift, Building2, Shield, Zap } from 'lucide-react';
import { FORGED_TOKEN_ABI } from '@/lib/contracts';

// =====================================================================
// THE DIGITAL FORGE - Buyback & Reward Tokens Panel
// Displays the full tax distribution breakdown + buyback token emblems
// Ported from PUMP.FUD TaxTokenStats pattern
// =====================================================================

// Known PulseChain token logos via Piteas
const getTokenLogoUrl = (address: string) =>
  `https://raw.githubusercontent.com/piteasio/app-tokens/main/token-logo/${address}.png`;

// Well-known PulseChain tokens for display
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
};

const DISTRIBUTION_COLORS: Record<string, string> = {
  treasury: '#FFD700',
  burn: '#FF6B35',
  reflection: '#00FF88',
  liquidity: '#00D4FF',
  yield: '#AA00FF',
  support: '#FF00FF',
};

interface BuybackTokensPanelProps {
  tokenAddress?: Address;
  tokenSymbol?: string;
}

export function BuybackTokensPanel({ tokenAddress }: BuybackTokensPanelProps) {
  // Read all tax distribution shares + token addresses from the contract
  const contracts = useMemo(() => {
    if (!tokenAddress) return [];
    return [
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'buyTax' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'sellTax' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'treasuryShare' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'burnShare' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'reflectionShare' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'liquidityShare' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'yieldShare' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'supportShare' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'treasuryWallet' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'yieldToken' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'supportToken' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalBurned' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalReflections' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'totalYieldDistributed' as const },
      { address: tokenAddress, abi: FORGED_TOKEN_ABI, functionName: 'lpPair' as const },
    ];
  }, [tokenAddress]);

  const { data: results } = useReadContracts({
    contracts: contracts as readonly unknown[],
    query: { enabled: contracts.length > 0 },
  });

  const data = useMemo(() => {
    if (!results) return null;

    const buyTax = (results[0]?.result as bigint) || 0n;
    const sellTax = (results[1]?.result as bigint) || 0n;
    const treasuryShare = Number((results[2]?.result as bigint) || 0n);
    const burnShare = Number((results[3]?.result as bigint) || 0n);
    const reflectionShare = Number((results[4]?.result as bigint) || 0n);
    const liquidityShare = Number((results[5]?.result as bigint) || 0n);
    const yieldShare = Number((results[6]?.result as bigint) || 0n);
    const supportShare = Number((results[7]?.result as bigint) || 0n);
    const treasuryWallet = (results[8]?.result as Address) || null;
    const yieldToken = (results[9]?.result as Address) || null;
    const supportToken = (results[10]?.result as Address) || null;
    const totalBurned = (results[11]?.result as bigint) || 0n;
    const totalReflections = (results[12]?.result as bigint) || 0n;
    const totalYieldDistributed = (results[13]?.result as bigint) || 0n;
    const lpPair = (results[14]?.result as Address) || null;

    // Build distribution breakdown (divide by 100 to convert from basis points to percent)
    const distributions = [
      { key: 'treasury', label: 'Treasury', share: treasuryShare / 100, color: DISTRIBUTION_COLORS.treasury, icon: <Building2 size={12} /> },
      { key: 'burn', label: 'Burn', share: burnShare / 100, color: DISTRIBUTION_COLORS.burn, icon: <Flame size={12} /> },
      { key: 'reflection', label: 'Reflections', share: reflectionShare / 100, color: DISTRIBUTION_COLORS.reflection, icon: <Gift size={12} /> },
      { key: 'liquidity', label: 'Auto-LP', share: liquidityShare / 100, color: DISTRIBUTION_COLORS.liquidity, icon: <Droplets size={12} /> },
      { key: 'yield', label: 'Yield Buyback', share: yieldShare / 100, color: DISTRIBUTION_COLORS.yield, icon: <TrendingUp size={12} /> },
      { key: 'support', label: 'Support Buyback', share: supportShare / 100, color: DISTRIBUTION_COLORS.support, icon: <Zap size={12} /> },
    ].filter((d) => d.share > 0);

    // Collect reward/buyback token addresses
    const rewardTokens: { address: Address; type: string }[] = [];
    if (yieldToken && yieldToken !== '0x0000000000000000000000000000000000000000') {
      rewardTokens.push({ address: yieldToken, type: 'Yield' });
    }
    if (supportToken && supportToken !== '0x0000000000000000000000000000000000000000') {
      rewardTokens.push({ address: supportToken, type: 'Support' });
    }

    return {
      buyTax: Number(buyTax) / 100,
      sellTax: Number(sellTax) / 100,
      distributions,
      treasuryWallet,
      rewardTokens,
      totalBurned,
      totalReflections,
      totalYieldDistributed,
      lpPair,
    };
  }, [results]);

  if (!data || (data.buyTax === 0 && data.sellTax === 0)) return null;

  const formatAmount = (amount: bigint): string => {
    const num = Number(formatUnits(amount, 18));
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    if (num < 0.01) return '< 0.01';
    return num.toFixed(2);
  };

  const getTokenInfo = (addr: string) => {
    const known = KNOWN_TOKENS[addr.toLowerCase()];
    if (known) return known;
    return { name: 'Unknown Token', symbol: addr.slice(0, 6) + '...' + addr.slice(-4), color: '#888888' };
  };

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

        {/* Distribution Bar */}
        {data.distributions.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Tax Distribution</div>
            <div className="h-4 bg-gray-900 rounded-full overflow-hidden flex">
              {data.distributions.map((d) => (
                <div
                  key={d.key}
                  className="h-full transition-all duration-500"
                  style={{ width: `${d.share}%`, backgroundColor: d.color }}
                  title={`${d.label}: ${d.share}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {data.distributions.map((d) => (
                <div key={d.key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-gray-400 font-mono">
                    {d.icon} {d.label}: {d.share}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward / Buyback Tokens */}
        {data.rewardTokens.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">
              Buyback & Reward Tokens
            </div>
            <div className="space-y-2">
              {data.rewardTokens.map((rt) => {
                const info = getTokenInfo(rt.address);
                return (
                  <a
                    key={rt.address + rt.type}
                    href={`https://scan.pulsechain.com/token/${rt.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-purple-500/40 transition-all group"
                  >
                    {/* Token Logo */}
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0"
                      style={{ borderColor: info.color + '60' }}
                    >
                      <img
                        src={getTokenLogoUrl(rt.address)}
                        alt={info.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML =
                            `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-xs font-bold" style="color:${info.color}">${info.symbol.slice(0, 2)}</div>`;
                        }}
                      />
                    </div>

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{info.symbol}</span>
                        <span className="text-[10px] text-gray-500 font-rajdhani px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">
                          {rt.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {rt.address.slice(0, 10)}...{rt.address.slice(-6)}
                      </span>
                    </div>

                    <ExternalLink size={12} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Treasury */}
        {data.treasuryWallet && data.treasuryWallet !== '0x0000000000000000000000000000000000000000' && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Treasury Wallet</div>
            <a
              href={`https://scan.pulsechain.com/address/${data.treasuryWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
            >
              <Building2 size={14} className="text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400 font-mono text-xs truncate">{data.treasuryWallet}</span>
              <ExternalLink size={10} className="text-yellow-400/50 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Lifetime Stats */}
        {(data.totalBurned > 0n || data.totalReflections > 0n || data.totalYieldDistributed > 0n) && (
          <div>
            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Lifetime Stats</div>
            <div className="grid grid-cols-3 gap-2">
              {data.totalBurned > 0n && (
                <div className="p-2 bg-black/30 rounded border border-gray-800 text-center">
                  <Flame size={12} className="text-orange-400 mx-auto mb-1" />
                  <div className="font-mono text-orange-400 text-sm font-bold">{formatAmount(data.totalBurned)}</div>
                  <div className="text-[9px] text-gray-500">Burned</div>
                </div>
              )}
              {data.totalReflections > 0n && (
                <div className="p-2 bg-black/30 rounded border border-gray-800 text-center">
                  <Gift size={12} className="text-green-400 mx-auto mb-1" />
                  <div className="font-mono text-green-400 text-sm font-bold">{formatAmount(data.totalReflections)}</div>
                  <div className="text-[9px] text-gray-500">Reflected</div>
                </div>
              )}
              {data.totalYieldDistributed > 0n && (
                <div className="p-2 bg-black/30 rounded border border-gray-800 text-center">
                  <TrendingUp size={12} className="text-purple-400 mx-auto mb-1" />
                  <div className="font-mono text-purple-400 text-sm font-bold">{formatAmount(data.totalYieldDistributed)}</div>
                  <div className="text-[9px] text-gray-500">Yield Dist.</div>
                </div>
              )}
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
