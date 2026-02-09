'use client';

import { useAccount } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { Gift, Wallet, TrendingUp, Clock } from 'lucide-react';

// =====================================================================
// THE DIGITAL FORGE - Rewards Panel (Read-Only)
// Reflections distribute automatically on every transfer (SafeMoon-style).
// There is NO claimRewards function on-chain — this panel is informational.
// =====================================================================

interface RewardsClaimPanelProps {
  tokenAddress?: Address;
  tokenSymbol?: string;
  pendingRewards?: bigint;
  totalClaimed?: bigint;
  rewardTokenSymbol?: string;
  rewardTokenDecimals?: number;
  onClaimSuccess?: () => void;
}

export function RewardsClaimPanel({
  tokenSymbol,
  pendingRewards,
  totalClaimed,
  rewardTokenSymbol = 'PLS',
  rewardTokenDecimals = 18,
}: RewardsClaimPanelProps) {
  const { isConnected } = useAccount();

  const formatReward = (amount: bigint | undefined, decimals: number = 18): string => {
    if (!amount || amount === 0n) return '0';
    const num = Number(formatUnits(amount, decimals));
    if (num < 0.0001) return '< 0.0001';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(4) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(4) + 'K';
    return num.toFixed(6);
  };

  const hasPendingRewards = pendingRewards && pendingRewards > 0n;

  return (
    <div className="glass-card rounded-xl border border-green-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-green-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white">Holder Rewards</h3>
            <p className="text-xs text-gray-400 font-rajdhani">
              Earn {rewardTokenSymbol} by holding {tokenSymbol}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!isConnected ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-rajdhani">Connect wallet to view rewards</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rewards Stats */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pending Reflections */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Clock size={14} />
                  <span className="text-xs font-rajdhani uppercase">Reflections</span>
                </div>
                <p className="text-2xl font-mono font-bold text-green-400">
                  {formatReward(pendingRewards, rewardTokenDecimals)}
                </p>
                <p className="text-xs text-gray-500 font-rajdhani">{rewardTokenSymbol}</p>
              </div>

              {/* Pending Yield */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <TrendingUp size={14} />
                  <span className="text-xs font-rajdhani uppercase">Yield</span>
                </div>
                <p className="text-2xl font-mono font-bold text-purple-400">
                  {formatReward(totalClaimed, rewardTokenDecimals)}
                </p>
                <p className="text-xs text-gray-500 font-rajdhani">{rewardTokenSymbol}</p>
              </div>
            </div>

            {/* Status Indicator */}
            {hasPendingRewards ? (
              <div className="w-full py-3 rounded-xl font-rajdhani font-bold text-sm bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 text-green-400 flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                Rewards Accruing
              </div>
            ) : (
              <div className="w-full py-3 rounded-xl font-rajdhani font-bold text-sm bg-gray-800/50 border border-gray-700 text-gray-500 flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                No Rewards Yet
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
              <p className="text-xs text-gray-400 font-rajdhani leading-relaxed">
                <span className="text-cyan-400 font-semibold">How it works:</span> A portion of
                every buy/sell tax is distributed to token holders proportionally based on their
                holdings. Rewards are applied automatically on each transfer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RewardsClaimPanel;
