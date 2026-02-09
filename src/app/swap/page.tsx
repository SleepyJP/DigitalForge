'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther, Address, parseUnits, formatUnits } from 'viem';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import {
  WPLS_ADDRESS,
  PULSEX_V2_ROUTER,
  THE_DIGITAL_FORGE_ADDRESS,
  THE_DIGITAL_FORGE_ABI,
  ERC20_ABI,
  FORGED_TOKEN_ABI,
} from '@/lib/contracts';

const PULSEX_ROUTER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
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
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const SLIPPAGE_PRESETS = [
  { label: '12%', value: 12 },
  { label: '25%', value: 25 },
  { label: '35%', value: 35 },
  { label: '49%', value: 49 },
];

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const [tokenAddress, setTokenAddress] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(25);
  const [customSlippage, setCustomSlippage] = useState('');
  const [useCustomSlippage, setUseCustomSlippage] = useState(false);

  const validToken = /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  const tokenAddr = validToken ? (tokenAddress as Address) : undefined;

  // Read token info
  const { data: tokenName } = useReadContract({
    address: tokenAddr,
    abi: ERC20_ABI,
    functionName: 'name',
    query: { enabled: !!tokenAddr },
  });

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddr,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!tokenAddr },
  });

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddr,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddr },
  });

  // Read tax info (for forged tokens)
  const { data: buyTaxBps } = useReadContract({
    address: tokenAddr,
    abi: FORGED_TOKEN_ABI,
    functionName: 'buyTax',
    query: { enabled: !!tokenAddr },
  });

  const { data: sellTaxBps } = useReadContract({
    address: tokenAddr,
    abi: FORGED_TOKEN_ABI,
    functionName: 'sellTax',
    query: { enabled: !!tokenAddr },
  });

  // Check if forged token
  const { data: isForged } = useReadContract({
    address: THE_DIGITAL_FORGE_ADDRESS,
    abi: THE_DIGITAL_FORGE_ABI,
    functionName: 'isForgedToken',
    args: tokenAddr ? [tokenAddr] : undefined,
    query: { enabled: !!tokenAddr },
  });

  // User balances
  const { data: tokenBalance } = useReadContract({
    address: tokenAddr,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAddr && !!address },
  });

  // Allowance check (for selling)
  const { data: allowance } = useReadContract({
    address: tokenAddr,
    abi: ERC20_APPROVE_ABI,
    functionName: 'allowance',
    args: address ? [address, PULSEX_V2_ROUTER] : undefined,
    query: { enabled: !!tokenAddr && !!address && !isBuying },
  });

  // Quote
  const amountParsed = amount && Number(amount) > 0
    ? (isBuying ? parseEther(amount) : parseUnits(amount, Number(tokenDecimals || 18)))
    : undefined;

  const { data: quoteAmounts } = useReadContract({
    address: PULSEX_V2_ROUTER,
    abi: PULSEX_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: amountParsed && tokenAddr
      ? [
          amountParsed,
          isBuying ? [WPLS_ADDRESS, tokenAddr] : [tokenAddr, WPLS_ADDRESS],
        ]
      : undefined,
    query: { enabled: !!amountParsed && !!tokenAddr },
  });

  const estimatedOut = quoteAmounts ? (quoteAmounts as bigint[])[1] : undefined;

  // Auto-suggest slippage from tax
  const activeTax = isBuying ? buyTaxBps : sellTaxBps;
  const taxPercent = activeTax ? Number(activeTax) / 100 : 0;

  const suggestedSlippage = useCallback(() => {
    if (taxPercent <= 0) return 12;
    // Add 3% buffer on top of tax
    const suggested = Math.ceil(taxPercent + 3);
    // Round up to nearest 5
    return Math.min(Math.ceil(suggested / 5) * 5, 49);
  }, [taxPercent]);

  useEffect(() => {
    if (taxPercent > 0 && !useCustomSlippage) {
      setSlippage(suggestedSlippage());
    }
  }, [taxPercent, suggestedSlippage, useCustomSlippage]);

  const effectiveSlippage = useCustomSlippage ? (Number(customSlippage) || 12) : slippage;

  // Approve
  const { writeContract: writeApprove, data: approveHash, isPending: approvePending } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Swap
  const { writeContract: writeSwap, data: swapHash, isPending: swapPending, error: swapError } = useWriteContract();
  const { isLoading: swapConfirming, isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

  const needsApproval = !isBuying && !!amountParsed && allowance !== undefined && (allowance as bigint) < amountParsed;

  const handleApprove = () => {
    if (!tokenAddr) return;
    writeApprove({
      address: tokenAddr,
      abi: ERC20_APPROVE_ABI,
      functionName: 'approve',
      args: [PULSEX_V2_ROUTER, amountParsed || parseUnits('999999999999', Number(tokenDecimals || 18))],
    });
  };

  const handleSwap = () => {
    if (!tokenAddr || !amountParsed || !address) return;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min
    const slippageMultiplier = BigInt(10000 - effectiveSlippage * 100);
    const minOut = estimatedOut ? (estimatedOut * slippageMultiplier) / 10000n : 0n;

    if (isBuying) {
      writeSwap({
        address: PULSEX_V2_ROUTER,
        abi: PULSEX_ROUTER_ABI,
        functionName: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
        args: [minOut, [WPLS_ADDRESS, tokenAddr], address, deadline],
        value: amountParsed,
      });
    } else {
      writeSwap({
        address: PULSEX_V2_ROUTER,
        abi: PULSEX_ROUTER_ABI,
        functionName: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
        args: [amountParsed, minOut, [tokenAddr, WPLS_ADDRESS], address, deadline],
      });
    }
  };

  const isLoading = approvePending || approveConfirming || swapPending || swapConfirming;

  return (
    <div className="min-h-screen bg-void-black relative overflow-x-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                HIGH SLIPPAGE SWAP
              </span>
            </h1>
            <p className="text-gray-400 font-rajdhani text-sm max-w-md mx-auto">
              Swap tax tokens with auto-adjusted slippage. Uses fee-on-transfer compatible routing via PulseX V2.
            </p>
          </div>

          {/* Swap Card */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            {/* Token Address Input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-rajdhani font-semibold">Token Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x... (paste token contract address)"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-cyan-500/50 transition-colors"
              />
              {tokenAddr && tokenSymbol && (
                <div className="flex items-center gap-2 text-xs font-rajdhani">
                  <span className="text-cyan-400 font-bold">{tokenSymbol as string}</span>
                  <span className="text-gray-500">({tokenName as string})</span>
                  {isForged && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 text-[10px] font-bold">
                      FORGED
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tax Detection */}
            {tokenAddr && (buyTaxBps !== undefined || sellTaxBps !== undefined) && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-xs font-rajdhani font-bold text-yellow-400 mb-1">TAX DETECTED</div>
                <div className="flex gap-4 text-sm font-rajdhani">
                  <span className="text-green-400">Buy: {buyTaxBps ? Number(buyTaxBps) / 100 : 0}%</span>
                  <span className="text-red-400">Sell: {sellTaxBps ? Number(sellTaxBps) / 100 : 0}%</span>
                </div>
                <div className="text-[10px] text-yellow-400/60 mt-1">
                  Slippage auto-adjusted to {suggestedSlippage()}% (tax + buffer)
                </div>
              </div>
            )}

            {/* Buy / Sell Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-700">
              <button
                onClick={() => setIsBuying(true)}
                className={`flex-1 py-3 font-rajdhani font-bold text-sm transition-all ${
                  isBuying
                    ? 'bg-green-500 text-black'
                    : 'bg-black/50 text-gray-400 hover:text-white'
                }`}
              >
                BUY (PLS → Token)
              </button>
              <button
                onClick={() => setIsBuying(false)}
                className={`flex-1 py-3 font-rajdhani font-bold text-sm transition-all ${
                  !isBuying
                    ? 'bg-red-500 text-black'
                    : 'bg-black/50 text-gray-400 hover:text-white'
                }`}
              >
                SELL (Token → PLS)
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                  {isBuying ? 'PLS Amount' : 'Token Amount'}
                </label>
                {!isBuying && tokenBalance && (
                  <button
                    onClick={() => setAmount(formatUnits(tokenBalance as bigint, Number(tokenDecimals || 18)))}
                    className="text-[10px] font-rajdhani text-cyan-400 hover:text-cyan-300"
                  >
                    MAX: {Number(formatUnits(tokenBalance as bigint, Number(tokenDecimals || 18))).toLocaleString()}
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isBuying ? 'Amount in PLS' : 'Amount of tokens'}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani text-lg focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {/* Estimated Output */}
            {estimatedOut && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-xs text-gray-400 font-rajdhani">Estimated Output (before tax)</div>
                <div className="text-lg font-rajdhani font-bold text-white">
                  {isBuying
                    ? `${Number(formatUnits(estimatedOut, Number(tokenDecimals || 18))).toLocaleString()} ${tokenSymbol || 'tokens'}`
                    : `${Number(formatEther(estimatedOut)).toLocaleString()} PLS`
                  }
                </div>
                <div className="text-[10px] text-gray-500 font-rajdhani mt-1">
                  Min received (after {effectiveSlippage}% slippage):{' '}
                  {isBuying
                    ? `${Number(formatUnits(estimatedOut * BigInt(10000 - effectiveSlippage * 100) / 10000n, Number(tokenDecimals || 18))).toLocaleString()}`
                    : `${Number(formatEther(estimatedOut * BigInt(10000 - effectiveSlippage * 100) / 10000n)).toLocaleString()} PLS`
                  }
                </div>
              </div>
            )}

            {/* Slippage Settings */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-rajdhani font-semibold">Slippage Tolerance</label>
              <div className="flex gap-2">
                {SLIPPAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => { setSlippage(preset.value); setUseCustomSlippage(false); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-rajdhani font-bold transition-all ${
                      !useCustomSlippage && slippage === preset.value
                        ? 'bg-cyan-500 text-black'
                        : 'bg-black/50 border border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setUseCustomSlippage(true)}
                  className={`px-3 py-2 rounded-lg text-sm font-rajdhani font-bold transition-all ${
                    useCustomSlippage
                      ? 'bg-purple-500 text-black'
                      : 'bg-black/50 border border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Custom
                </button>
              </div>
              {useCustomSlippage && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="49"
                    value={customSlippage}
                    onChange={(e) => setCustomSlippage(e.target.value)}
                    placeholder="Enter %"
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white font-rajdhani text-sm focus:border-purple-500/60 transition-colors"
                  />
                  <span className="text-purple-400 font-bold">%</span>
                </div>
              )}
              {effectiveSlippage >= 35 && (
                <div className="text-[10px] text-yellow-400 font-rajdhani">
                  High slippage — recommended for high-tax tokens to avoid failed transactions
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isConnected ? (
              <div className="space-y-2">
                {/* Success */}
                {swapSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <span className="text-green-400 font-rajdhani font-bold text-sm">Swap Successful!</span>
                    {swapHash && (
                      <a
                        href={`https://scan.pulsechain.com/tx/${swapHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-cyan-400 hover:underline font-rajdhani text-xs mt-1"
                      >
                        View on PulseScan
                      </a>
                    )}
                  </div>
                )}

                {/* Error */}
                {swapError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <span className="text-red-400 font-rajdhani text-xs">
                      {(swapError as Error & { shortMessage?: string })?.shortMessage || swapError.message}
                    </span>
                  </div>
                )}

                {/* Approve button (for sells) */}
                {needsApproval && !approveSuccess && (
                  <button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-rajdhani font-bold bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {approvePending ? 'CONFIRM APPROVAL...' : approveConfirming ? 'APPROVING...' : `APPROVE ${tokenSymbol || 'TOKEN'}`}
                  </button>
                )}

                {/* Swap button */}
                <button
                  onClick={handleSwap}
                  disabled={isLoading || !amount || Number(amount) <= 0 || !tokenAddr || (needsApproval && !approveSuccess)}
                  className={`w-full py-3 rounded-xl font-rajdhani font-bold text-lg transition-all ${
                    isBuying
                      ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-black hover:from-green-400 hover:to-cyan-400'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {swapPending
                    ? 'CONFIRM IN WALLET'
                    : swapConfirming
                    ? 'SWAPPING...'
                    : isBuying
                    ? 'BUY TOKEN'
                    : 'SELL TOKEN'
                  }
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 font-rajdhani mb-3 text-sm">Connect wallet to swap</p>
                <ConnectButton />
              </div>
            )}

            {/* Info Footer */}
            <div className="text-[10px] font-rajdhani text-gray-600 text-center space-y-1">
              <p>Routes through PulseX V2 using fee-on-transfer compatible functions</p>
              <p>Designed for high-tax tokens that fail on standard DEX interfaces</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
