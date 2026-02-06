'use client';

import { formatUnits, type Address } from 'viem';
import {
  Coins,
  Flame,
  Shield,
  Clock,
  Wallet,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Gift
} from 'lucide-react';

// =====================================================================
// THE DIGITAL FORGE - Token Stats Display
// Shows comprehensive token statistics
// =====================================================================

interface TokenStatsProps {
  tokenData: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    buyTax?: bigint;
    sellTax?: bigint;
    tradingEnabled?: boolean;
    creator?: Address;
    treasuryWallet?: Address;
    tokenType: string;
    createdAt: bigint;
    totalRewardsDistributed?: bigint;
  } | null;
  holdersCount?: number;
  imageUrl?: string | null;
}

export function TokenStats({ tokenData, holdersCount, imageUrl }: TokenStatsProps) {
  if (!tokenData) {
    return (
      <div className="glass-card rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatSupply = (supply: bigint, decimals: number): string => {
    const num = Number(formatUnits(supply, decimals));
    if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + 'T';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatTax = (basisPoints: bigint | undefined): string => {
    if (!basisPoints) return '0%';
    return (Number(basisPoints) / 100).toFixed(1) + '%';
  };

  const formatDate = (timestamp: bigint): string => {
    if (!timestamp || timestamp === 0n) return 'Unknown';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRewards = (amount: bigint | undefined): string => {
    if (!amount || amount === 0n) return '0';
    const num = Number(formatUnits(amount, 18));
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const isTaxToken = tokenData.tokenType === 'FORGE';
  const hasTaxes = tokenData.buyTax && tokenData.buyTax > 0n || tokenData.sellTax && tokenData.sellTax > 0n;

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-cyan-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/30">
                <img src={imageUrl} alt={tokenData.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-cyan-400" />
              </div>
            )}
            <div>
              <h2 className="font-orbitron font-bold text-xl text-white">{tokenData.name}</h2>
              <p className="text-cyan-400 font-mono text-sm">${tokenData.symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-rajdhani font-semibold ${
                tokenData.tokenType === 'FORGE'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {tokenData.tokenType}
            </span>
            {tokenData.tradingEnabled !== undefined && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-rajdhani font-semibold ${
                  tokenData.tradingEnabled
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {tokenData.tradingEnabled ? 'Trading Live' : 'Trading Paused'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Supply */}
          <StatCard
            icon={<Coins className="w-4 h-4" />}
            label="Total Supply"
            value={formatSupply(tokenData.totalSupply, tokenData.decimals)}
            subValue={tokenData.symbol}
            color="cyan"
          />

          {/* Holders */}
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Holders"
            value={holdersCount?.toString() || '-'}
            subValue="addresses"
            color="purple"
          />

          {/* Created */}
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Created"
            value={formatDate(tokenData.createdAt)}
            subValue=""
            color="pink"
          />

          {/* Token Type */}
          <StatCard
            icon={<Shield className="w-4 h-4" />}
            label="Type"
            value={tokenData.tokenType}
            subValue={isTaxToken ? 'Fee-on-Transfer' : 'Standard ERC20'}
            color="green"
          />
        </div>

        {/* Tax Info for FORGE tokens */}
        {isTaxToken && hasTaxes && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-rajdhani font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Tax Configuration
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Buy Tax */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <ArrowDownCircle size={14} />
                  <span className="text-xs font-rajdhani uppercase">Buy Tax</span>
                </div>
                <p className="text-2xl font-mono font-bold text-green-400">
                  {formatTax(tokenData.buyTax)}
                </p>
              </div>

              {/* Sell Tax */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <ArrowUpCircle size={14} />
                  <span className="text-xs font-rajdhani uppercase">Sell Tax</span>
                </div>
                <p className="text-2xl font-mono font-bold text-red-400">
                  {formatTax(tokenData.sellTax)}
                </p>
              </div>

              {/* Total Rewards Distributed */}
              {tokenData.totalRewardsDistributed !== undefined && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 col-span-2">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <Gift size={14} />
                    <span className="text-xs font-rajdhani uppercase">Total Rewards Distributed</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-purple-400">
                    {formatRewards(tokenData.totalRewardsDistributed)} <span className="text-sm text-gray-400">PLS</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Addresses */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-rajdhani font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-cyan-400" />
            Contract Addresses
          </h3>
          <div className="space-y-3">
            {/* Creator */}
            {tokenData.creator && tokenData.creator !== '0x0000000000000000000000000000000000000000' && (
              <AddressRow label="Creator" address={tokenData.creator} />
            )}
            {/* Treasury */}
            {tokenData.treasuryWallet && tokenData.treasuryWallet !== '0x0000000000000000000000000000000000000000' && (
              <AddressRow label="Treasury" address={tokenData.treasuryWallet} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: 'cyan' | 'purple' | 'pink' | 'green' | 'orange';
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className={`flex items-center gap-2 mb-2 ${colorClasses[color].split(' ')[0]}`}>
        {icon}
        <span className="text-xs font-rajdhani uppercase">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${colorClasses[color].split(' ')[0]}`}>
        {value}
      </p>
      {subValue && <p className="text-xs text-gray-500 font-rajdhani">{subValue}</p>}
    </div>
  );
}

interface AddressRowProps {
  label: string;
  address: Address;
}

function AddressRow({ label, address }: AddressRowProps) {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between bg-gray-900/50 rounded-lg px-4 py-3">
      <span className="text-gray-400 text-sm font-rajdhani">{label}</span>
      <a
        href={`https://scan.pulsechain.com/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 font-mono text-sm hover:text-cyan-300 transition-colors flex items-center gap-2"
      >
        {shortAddr}
        <TrendingUp size={12} />
      </a>
    </div>
  );
}

export default TokenStats;
