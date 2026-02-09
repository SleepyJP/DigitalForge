'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { formatUnits, parseUnits, parseEther, type Address, maxUint256 } from 'viem';
import { ArrowDownUp, Zap, AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { PULSEX_V2_ROUTER, WPLS_ADDRESS } from '@/lib/contracts';

// PulseX V2 Router ABI (only what we need)
const ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const TOKEN_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
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
] as const;

interface SwapWidgetProps {
  tokenAddress: Address;
  tokenSymbol?: string;
  tokenDecimals?: number;
  onSwapSuccess?: () => void;
}

export function SwapWidget({
  tokenAddress,
  tokenSymbol = '???',
  tokenDecimals = 18,
  onSwapSuccess,
}: SwapWidgetProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [isBuying, setIsBuying] = useState(true);
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(15); // 15% default for tax tokens
  const [showSlippage, setShowSlippage] = useState(false);

  // PLS balance
  const { data: plsBalance } = useBalance({
    address: userAddress,
  });

  // Token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress,
    abi: TOKEN_BALANCE_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  // Token allowance for selling
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_APPROVE_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, PULSEX_V2_ROUTER] : undefined,
    query: { enabled: !!userAddress && !isBuying },
  });

  // Get price quote
  const parsedInput = useMemo(() => {
    if (!inputAmount || Number(inputAmount) <= 0) return 0n;
    try {
      return isBuying
        ? parseEther(inputAmount)
        : parseUnits(inputAmount, tokenDecimals);
    } catch {
      return 0n;
    }
  }, [inputAmount, isBuying, tokenDecimals]);

  const swapPath = useMemo(() => {
    return isBuying
      ? [WPLS_ADDRESS, tokenAddress]
      : [tokenAddress, WPLS_ADDRESS];
  }, [isBuying, tokenAddress]);

  const { data: amountsOut } = useReadContract({
    address: PULSEX_V2_ROUTER,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: parsedInput > 0n ? [parsedInput, swapPath] : undefined,
    query: { enabled: parsedInput > 0n },
  });

  const estimatedOutput = amountsOut && Array.isArray(amountsOut) && amountsOut.length > 1
    ? (amountsOut as bigint[])[1]
    : 0n;
  const clampedSlippage = Math.min(Math.max(slippage, 1), 49);
  const minOutput = estimatedOutput > 0n
    ? (estimatedOutput * BigInt(10000 - clampedSlippage * 100)) / 10000n
    : 0n;

  // Approve tx
  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Swap tx
  const {
    data: swapHash,
    writeContract: writeSwap,
    isPending: isSwapping,
    error: swapError,
    reset: resetSwap,
  } = useWriteContract();

  const { isLoading: isSwapConfirming, isSuccess: swapSuccess } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Call success callback
  useEffect(() => {
    if (swapSuccess) {
      setInputAmount('');
      onSwapSuccess?.();
    }
  }, [swapSuccess, onSwapSuccess]);

  const needsApproval = !isBuying && parsedInput > 0n && typeof allowance === 'bigint' && allowance < parsedInput;

  const handleApprove = useCallback(() => {
    writeApprove({
      address: tokenAddress,
      abi: ERC20_APPROVE_ABI,
      functionName: 'approve',
      args: [PULSEX_V2_ROUTER, maxUint256],
    });
  }, [tokenAddress, writeApprove]);

  const handleSwap = useCallback(() => {
    if (!userAddress || parsedInput === 0n || estimatedOutput === 0n) return;
    resetSwap();

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min

    if (isBuying) {
      writeSwap({
        address: PULSEX_V2_ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
        args: [minOutput, swapPath, userAddress, deadline],
        value: parsedInput,
      });
    } else {
      writeSwap({
        address: PULSEX_V2_ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
        args: [parsedInput, minOutput, swapPath, userAddress, deadline],
      });
    }
  }, [userAddress, parsedInput, estimatedOutput, minOutput, swapPath, isBuying, writeSwap, resetSwap]);

  const formatBalance = (bal: bigint | undefined, dec: number = 18): string => {
    if (!bal) return '0';
    const num = Number(formatUnits(bal, dec));
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(4);
  };

  const setMaxInput = () => {
    if (isBuying && plsBalance) {
      // Leave 50K PLS for gas
      const max = plsBalance.value > parseEther('50000')
        ? plsBalance.value - parseEther('50000')
        : 0n;
      setInputAmount(formatUnits(max, 18));
    } else if (!isBuying && tokenBalance) {
      setInputAmount(formatUnits(tokenBalance as bigint, tokenDecimals));
    }
  };

  const isProcessing = isApproving || isApproveConfirming || isSwapping || isSwapConfirming;

  if (!isConnected) {
    return (
      <div className="glass-card rounded-xl border border-cyan-500/20 p-6">
        <div className="text-center py-6">
          <Zap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-rajdhani">Connect wallet to swap</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 bg-gradient-to-r from-cyan-500/10 to-green-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-orbitron font-bold text-white text-sm">SWAP</span>
        </div>
        <button
          onClick={() => setShowSlippage(!showSlippage)}
          className="text-[10px] font-rajdhani text-gray-400 hover:text-cyan-400 transition-colors"
        >
          Slippage: {slippage}%
        </button>
      </div>

      {/* Slippage Settings */}
      {showSlippage && (
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2">
            {[5, 10, 15, 20, 25].map((s) => (
              <button
                key={s}
                onClick={() => { setSlippage(s); setShowSlippage(false); }}
                className={`px-3 py-1 rounded text-xs font-rajdhani font-bold transition-all ${
                  slippage === s
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Direction Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsBuying(true); setInputAmount(''); resetSwap(); }}
            className={`flex-1 py-2 rounded-lg font-rajdhani font-bold text-sm transition-all ${
              isBuying
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-gray-800/50 text-gray-500 border border-gray-700 hover:border-gray-600'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => { setIsBuying(!isBuying); setInputAmount(''); resetSwap(); }}
            className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
          >
            <ArrowDownUp size={16} />
          </button>
          <button
            onClick={() => { setIsBuying(false); setInputAmount(''); resetSwap(); }}
            className={`flex-1 py-2 rounded-lg font-rajdhani font-bold text-sm transition-all ${
              !isBuying
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-gray-800/50 text-gray-500 border border-gray-700 hover:border-gray-600'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Input */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-rajdhani">
              {isBuying ? 'You Pay' : 'You Sell'}
            </span>
            <button
              onClick={setMaxInput}
              className="text-[10px] text-cyan-400 font-rajdhani hover:text-cyan-300 transition-colors"
            >
              MAX
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-mono font-bold text-white placeholder:text-gray-700 focus:outline-none"
            />
            <span className="text-sm font-rajdhani font-bold text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
              {isBuying ? 'PLS' : tokenSymbol}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-rajdhani mt-2">
            Balance: {isBuying
              ? formatBalance(plsBalance?.value, 18) + ' PLS'
              : formatBalance(tokenBalance as bigint | undefined, tokenDecimals) + ' ' + tokenSymbol
            }
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-1">
          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
            <span className="text-cyan-400 text-sm">↓</span>
          </div>
        </div>

        {/* Output */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-rajdhani">
              {isBuying ? 'You Receive' : 'You Get'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-mono font-bold text-gray-300">
              {estimatedOutput > 0n
                ? isBuying
                  ? formatBalance(estimatedOutput, tokenDecimals)
                  : formatBalance(estimatedOutput, 18)
                : '0.0'
              }
            </span>
            <span className="text-sm font-rajdhani font-bold text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
              {isBuying ? tokenSymbol : 'PLS'}
            </span>
          </div>
          {estimatedOutput > 0n && (
            <p className="text-[10px] text-gray-500 font-rajdhani mt-2">
              Min received (after {slippage}% slippage):{' '}
              {isBuying
                ? formatBalance(minOutput, tokenDecimals) + ' ' + tokenSymbol
                : formatBalance(minOutput, 18) + ' PLS'
              }
            </p>
          )}
        </div>

        {/* Approve Button (for sells) */}
        {needsApproval && !approveSuccess && (
          <button
            onClick={handleApprove}
            disabled={isApproving || isApproveConfirming}
            className="w-full py-3 rounded-xl font-rajdhani font-bold text-sm bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isApproving || isApproveConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isApproving ? 'Confirm in Wallet...' : 'Approving...'}
              </>
            ) : (
              <>Approve {tokenSymbol} for Trading</>
            )}
          </button>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isProcessing || parsedInput === 0n || estimatedOutput === 0n || (needsApproval && !approveSuccess)}
          className={`w-full py-3 rounded-xl font-rajdhani font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isBuying
              ? 'bg-gradient-to-r from-green-600 to-cyan-600 text-white hover:from-green-500 hover:to-cyan-500'
              : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSwapping || isSwapConfirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isSwapping ? 'Confirm in Wallet...' : 'Swapping...'}
            </>
          ) : swapSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Swap Complete!
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {isBuying ? 'BUY' : 'SELL'} {tokenSymbol}
            </>
          )}
        </button>

        {/* TX Hash */}
        {swapHash && (
          <div className="text-center">
            <a
              href={`https://scan.pulsechain.com/tx/${swapHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 text-xs font-mono hover:underline inline-flex items-center gap-1"
            >
              View Transaction <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* Error */}
        {swapError && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-xs font-rajdhani">
              {(swapError.message || 'Transaction failed').slice(0, 120)}
            </p>
          </div>
        )}

        {/* Info */}
        <p className="text-[10px] text-gray-600 font-rajdhani text-center">
          Swaps via PulseX V2 Router — Tax token compatible
        </p>
      </div>
    </div>
  );
}
