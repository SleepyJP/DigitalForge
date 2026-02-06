'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { Gift, Wallet, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { TAX_TOKEN_ABI } from '@/hooks/useForgeTokens';

// =====================================================================
// THE DIGITAL FORGE - Rewards Claim Panel
// Allows users to claim their pending rewards from tax tokens
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
  tokenAddress,
  tokenSymbol,
  pendingRewards,
  totalClaimed,
  rewardTokenSymbol = 'PLS',
  rewardTokenDecimals = 18,
  onClaimSuccess,
}: RewardsClaimPanelProps) {
  const { isConnected, address } = useAccount();
  const [claimError, setClaimError] = useState<string | null>(null);

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleClaim = async () => {
    if (!tokenAddress || !address) return;
    setClaimError(null);
    reset();

    try {
      writeContract({
        address: tokenAddress,
        abi: TAX_TOKEN_ABI,
        functionName: 'claimRewards',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim rewards';
      setClaimError(errorMessage);
    }
  };

  // Call success callback when transaction confirms
  if (isSuccess && onClaimSuccess) {
    onClaimSuccess();
  }

  const formatReward = (amount: bigint | undefined, decimals: number = 18): string => {
    if (!amount || amount === 0n) return '0';
    const num = Number(formatUnits(amount, decimals));
    if (num < 0.0001) return '< 0.0001';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(4) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(4) + 'K';
    return num.toFixed(6);
  };

  const hasPendingRewards = pendingRewards && pendingRewards > 0n;
  const isClaimable = hasPendingRewards && !isPending && !isConfirming;

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
              {/* Pending Rewards */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Clock size={14} />
                  <span className="text-xs font-rajdhani uppercase">Pending</span>
                </div>
                <p className="text-2xl font-mono font-bold text-green-400">
                  {formatReward(pendingRewards, rewardTokenDecimals)}
                </p>
                <p className="text-xs text-gray-500 font-rajdhani">{rewardTokenSymbol}</p>
              </div>

              {/* Total Claimed */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <TrendingUp size={14} />
                  <span className="text-xs font-rajdhani uppercase">Claimed</span>
                </div>
                <p className="text-2xl font-mono font-bold text-purple-400">
                  {formatReward(totalClaimed, rewardTokenDecimals)}
                </p>
                <p className="text-xs text-gray-500 font-rajdhani">{rewardTokenSymbol}</p>
              </div>
            </div>

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={!isClaimable}
              className={`w-full py-4 rounded-xl font-rajdhani font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                isClaimable
                  ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-black hover:shadow-glow-green'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPending || isConfirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {isPending ? 'Confirm in Wallet...' : 'Claiming...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Rewards Claimed!
                </>
              ) : hasPendingRewards ? (
                <>
                  <Gift className="w-5 h-5" />
                  Claim {formatReward(pendingRewards, rewardTokenDecimals)} {rewardTokenSymbol}
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  No Rewards Available
                </>
              )}
            </button>

            {/* Transaction Hash */}
            {hash && (
              <div className="text-center">
                <a
                  href={`https://scan.pulsechain.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 text-sm font-mono hover:underline"
                >
                  View Transaction
                </a>
              </div>
            )}

            {/* Error Messages */}
            {(writeError || claimError) && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm font-rajdhani">
                  {claimError || writeError?.message || 'Transaction failed'}
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
              <p className="text-xs text-gray-400 font-rajdhani leading-relaxed">
                <span className="text-cyan-400 font-semibold">How it works:</span> A portion of
                every buy/sell tax is distributed to token holders proportionally based on their
                holdings. Rewards accumulate automatically - claim anytime!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RewardsClaimPanel;
