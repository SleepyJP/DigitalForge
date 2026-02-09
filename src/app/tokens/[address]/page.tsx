'use client';

import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Link from 'next/link';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DexScreenerChart } from '@/components/dashboard/DexScreenerChart';
import { TokenStats } from '@/components/dashboard/TokenStats';
import { HoldersPanel } from '@/components/dashboard/HoldersPanel';
import { RewardsClaimPanel } from '@/components/dashboard/RewardsClaimPanel';
import { YourHoldingsPanel } from '@/components/dashboard/YourHoldingsPanel';
import { SwapWidget } from '@/components/dashboard/SwapWidget';
import { TransactionFeed } from '@/components/dashboard/TransactionFeed';
import { LiveChat } from '@/components/dashboard/LiveChat';
import { MessageBoard } from '@/components/dashboard/MessageBoard';
import { useTaxTokenData, isHiddenToken } from '@/hooks/useForgeTokens';
import { getTokenMetadata, type StoredTokenMetadata } from '@/lib/tokenMetadataStore';
import { resolveTokenImage } from '@/lib/ipfs';
import { FORGED_TOKEN_ABI } from '@/lib/contracts';
import { type Address } from 'viem';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  CheckCircle,
  Share2,
  Twitter,
  MessageCircle,
  Globe,
  Power,
  Settings,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// =====================================================================
// THE DIGITAL FORGE - Token Dashboard
// FULL WIDTH layout
// LEFT: Token Image/Info -> DexScreener Chart -> Transactions -> Chat
// RIGHT: Swap -> Holdings -> Rewards -> Holders
// =====================================================================

export default function TokenPage() {
  const params = useParams();
  const { address: userAddress } = useAccount();
  const [copied, setCopied] = useState(false);
  const [metadata, setMetadata] = useState<StoredTokenMetadata | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const rawAddress = typeof params.address === 'string' ? params.address : '';
  const tokenAddress = (rawAddress.startsWith('0x') ? rawAddress : `0x${rawAddress}`) as Address;
  const hidden = !rawAddress || isHiddenToken(tokenAddress);
  const { tokenData, isLoading, refetch } = useTaxTokenData(hidden ? undefined : tokenAddress, userAddress);

  const {
    data: enableTradingHash,
    error: enableTradingError,
    isPending: isEnablingTrading,
    writeContract: writeEnableTrading,
  } = useWriteContract();

  const { isLoading: isWaitingForTrading, isSuccess: tradingEnabled } = useWaitForTransactionReceipt({
    hash: enableTradingHash,
  });

  useEffect(() => {
    if (tradingEnabled) refetch();
  }, [tradingEnabled, refetch]);

  const isOwner = userAddress && tokenData?.creator &&
    userAddress.toLowerCase() === tokenData.creator.toLowerCase();

  const handleEnableTrading = useCallback(() => {
    writeEnableTrading({
      address: tokenAddress,
      abi: FORGED_TOKEN_ABI,
      functionName: 'enableTrading',
    });
  }, [tokenAddress, writeEnableTrading]);

  useEffect(() => {
    const stored = getTokenMetadata(tokenAddress);
    if (stored) setMetadata(stored);
    const resolved = resolveTokenImage(tokenAddress, stored?.imageUri);
    if (resolved) setImageUrl(resolved.url);
  }, [tokenAddress]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = tokenAddress;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isTaxToken = tokenData?.tokenType === 'FORGE';

  if (hidden) {
    return (
      <div className="min-h-screen bg-void-black relative overflow-x-hidden">
        <BackgroundEffects />
        <Header />
        <main className="relative z-10 py-4 px-4">
          <div className="max-w-2xl mx-auto text-center mt-20">
            <h1 className="font-orbitron font-bold text-4xl text-white mb-4">Token Not Found</h1>
            <p className="text-gray-400 font-rajdhani text-lg mb-8">
              This token has been delisted from THE DIGITAL FORGE.
            </p>
            <Link
              href="/tokens"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-orbitron font-bold rounded hover:bg-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Gallery
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black relative overflow-x-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 py-4 px-3 lg:px-6">
        {/* FULL WIDTH - no max-width constraint */}
        <div className="w-full">
          {/* Top Bar: Back + Actions */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/tokens"
              className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors font-rajdhani text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Gallery
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={`https://scan.pulsechain.com/token/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={async () => {
                  try {
                    const url = window.location.href;
                    if (navigator.share) {
                      await navigator.share({ title: tokenData?.name || '', url });
                    } else {
                      await navigator.clipboard.writeText(url);
                    }
                  } catch {
                    // User cancelled share or clipboard failed — ignore
                  }
                }}
                className="p-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-all"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* Contract Address — Full width, always visible and copyable */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 mb-4 bg-gray-900/80 border border-cyan-500/30 rounded-lg hover:border-cyan-500/60 transition-all group cursor-pointer"
            title="Click to copy contract address"
          >
            <span className="text-gray-500 text-xs font-rajdhani uppercase tracking-wider">CA:</span>
            <span className="text-cyan-400 font-mono text-sm md:text-base select-all truncate">
              {tokenAddress}
            </span>
            {copied ? (
              <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
            ) : (
              <Copy size={18} className="text-cyan-400 group-hover:text-cyan-300 flex-shrink-0" />
            )}
            {copied && <span className="text-green-400 text-sm font-rajdhani font-semibold">Copied!</span>}
          </button>

          {isLoading ? (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-800 rounded-xl" />
                  <div>
                    <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
                    <div className="h-5 bg-gray-800/50 rounded w-24" />
                  </div>
                </div>
              </div>
              <div className="h-[400px] bg-gray-900/50 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* ════════════════════════════════════════════════════════════ */}
              {/* LEFT COLUMN — 8/12 on desktop                              */}
              {/* Token Image + Info -> Chart -> Transactions -> Chat         */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="lg:col-span-8 space-y-4">

                {/* Token Header — Big Image + Info */}
                <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden p-5">
                  <div className="flex items-start gap-5">
                    {/* BIG Token Image */}
                    {imageUrl ? (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 border-cyan-500/30 flex-shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                        <img src={imageUrl} alt={tokenData?.name} className="w-full h-full object-cover" onError={() => setImageUrl(null)} />
                      </div>
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border-2 border-cyan-500/20">
                        <span className="font-orbitron font-bold text-4xl text-cyan-400">
                          {tokenData?.symbol?.slice(0, 2) || '??'}
                        </span>
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="font-orbitron font-bold text-2xl md:text-3xl text-white truncate">
                          {tokenData?.name || 'Loading...'}
                        </h1>
                        <span className="text-cyan-400 font-mono text-xl">${tokenData?.symbol || '???'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-rajdhani font-semibold ${
                            tokenData?.tokenType === 'FORGE'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-gray-800 text-gray-400 border border-gray-700'
                          }`}
                        >
                          {tokenData?.tokenType}
                        </span>
                        {tokenData?.tradingEnabled !== undefined && (
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-rajdhani font-semibold ${
                              tokenData.tradingEnabled
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {tokenData.tradingEnabled ? 'TRADING LIVE' : 'TRADING PAUSED'}
                          </span>
                        )}
                      </div>

                      {metadata?.description && (
                        <p className="text-gray-400 text-sm font-rajdhani mb-3 line-clamp-3">
                          {metadata.description}
                        </p>
                      )}

                      {/* Social + Trade Links — inline */}
                      <div className="flex flex-wrap items-center gap-2">
                        {metadata?.twitter && (
                          <a
                            href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://twitter.com/${metadata.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all text-xs font-rajdhani"
                          >
                            <Twitter size={12} /> Twitter
                          </a>
                        )}
                        {metadata?.telegram && (
                          <a
                            href={metadata.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all text-xs font-rajdhani"
                          >
                            <MessageCircle size={12} /> Telegram
                          </a>
                        )}
                        {metadata?.website && (
                          <a
                            href={metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all text-xs font-rajdhani"
                          >
                            <Globe size={12} /> Website
                          </a>
                        )}
                        <a
                          href={`https://pulsex.mypinata.cloud/ipfs/bafybeib7qk2ukr5zqz5rkwrh3m4iswz6l52m6qdqxnpkrlhjkuo7wmebfe/#/?outputCurrency=${tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 hover:border-cyan-500/50 transition-all text-xs font-rajdhani"
                        >
                          <ExternalLink size={12} /> PulseX
                        </a>
                        <a
                          href={`https://dexscreener.com/pulsechain/${tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:border-green-500/50 transition-all text-xs font-rajdhani"
                        >
                          <Globe size={12} /> DexScreener
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DexScreener Chart — starts collapsed, user clicks to expand */}
                <ErrorBoundary fallbackLabel="Chart">
                  <DexScreenerChart tokenAddress={tokenAddress} height={400} />
                </ErrorBoundary>

                {/* Transaction Feed — Buys/Sells */}
                <ErrorBoundary fallbackLabel="Transactions">
                  <TransactionFeed
                    tokenAddress={tokenAddress}
                    tokenSymbol={tokenData?.symbol}
                    tokenDecimals={tokenData?.decimals}
                  />
                </ErrorBoundary>

                {/* Token Stats */}
                <ErrorBoundary fallbackLabel="Token Stats">
                  <TokenStats tokenData={tokenData} imageUrl={imageUrl} />
                </ErrorBoundary>

                {/* Live Chat */}
                <ErrorBoundary fallbackLabel="Live Chat">
                  <LiveChat tokenAddress={tokenAddress} />
                </ErrorBoundary>

                {/* Message Board */}
                <ErrorBoundary fallbackLabel="Message Board">
                  <MessageBoard tokenAddress={tokenAddress} />
                </ErrorBoundary>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* RIGHT COLUMN — 4/12 on desktop                             */}
              {/* Swap -> Holdings -> Rewards -> Holders                      */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="lg:col-span-4 space-y-4">

                {/* Owner Controls */}
                {isOwner && (
                  <div className="glass-card rounded-xl p-5 border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-orange-400" />
                      </div>
                      <h3 className="font-orbitron font-bold text-white text-sm">Owner Controls</h3>
                    </div>

                    <div className="mb-3 p-2.5 rounded-lg bg-black/30 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-rajdhani text-xs">Trading</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-rajdhani font-semibold ${
                            tokenData?.tradingEnabled
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tokenData?.tradingEnabled ? 'LIVE' : 'PAUSED'}
                        </span>
                      </div>
                    </div>

                    {!tokenData?.tradingEnabled && (
                      <button
                        onClick={handleEnableTrading}
                        disabled={isEnablingTrading || isWaitingForTrading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white"
                      >
                        {isEnablingTrading ? (
                          <><span className="animate-spin">⟳</span> Confirm in Wallet...</>
                        ) : isWaitingForTrading ? (
                          <><span className="animate-spin">⟳</span> Enabling...</>
                        ) : (
                          <><Power className="w-3.5 h-3.5" /> Enable Trading</>
                        )}
                      </button>
                    )}

                    {tradingEnabled && (
                      <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="font-rajdhani text-xs">Trading enabled!</span>
                        </div>
                      </div>
                    )}

                    {enableTradingError && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                        <p className="text-red-400 font-rajdhani text-xs">
                          Error: {enableTradingError.message?.slice(0, 80) || 'Transaction failed'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* SWAP WIDGET */}
                <ErrorBoundary fallbackLabel="Swap">
                  <SwapWidget
                    tokenAddress={tokenAddress}
                    tokenSymbol={tokenData?.symbol}
                    tokenDecimals={tokenData?.decimals}
                    onSwapSuccess={() => refetch()}
                  />
                </ErrorBoundary>

                {/* Your Holdings */}
                <ErrorBoundary fallbackLabel="Holdings">
                  <YourHoldingsPanel
                    tokenAddress={tokenAddress}
                    tokenSymbol={tokenData?.symbol}
                    tokenDecimals={tokenData?.decimals}
                  />
                </ErrorBoundary>

                {/* Rewards Panel */}
                {isTaxToken && (
                  <ErrorBoundary fallbackLabel="Rewards">
                    <RewardsClaimPanel
                      tokenAddress={tokenAddress}
                      tokenSymbol={tokenData?.symbol}
                      pendingRewards={tokenData?.userPendingReflections}
                      totalClaimed={tokenData?.userPendingYield}
                      rewardTokenSymbol="PLS"
                      rewardTokenDecimals={18}
                      onClaimSuccess={() => refetch()}
                    />
                  </ErrorBoundary>
                )}

                {/* Holders Panel */}
                <ErrorBoundary fallbackLabel="Holders">
                  <HoldersPanel
                    tokenAddress={tokenAddress}
                    tokenSymbol={tokenData?.symbol}
                    totalSupply={tokenData?.totalSupply}
                    creator={tokenData?.creator}
                    isTaxToken={isTaxToken}
                    rewardTokenSymbol="PLS"
                    rewardTokenDecimals={18}
                  />
                </ErrorBoundary>

                {/* About */}
                <div className="glass-card rounded-xl p-5 border border-gray-800">
                  <h3 className="font-orbitron font-bold text-white text-sm mb-3">About</h3>
                  <div className="space-y-2 text-xs font-rajdhani">
                    <p className="text-gray-400">
                      Created with <span className="text-cyan-400">THE DIGITAL FORGE</span> by Paisley Protocol.
                    </p>
                    {isTaxToken ? (
                      <p className="text-gray-400">
                        <span className="text-purple-400">FORGE token</span> — automated tax collection, holder rewards, multi-mechanism distribution.
                      </p>
                    ) : (
                      <p className="text-gray-400">
                        <span className="text-gray-300">SIMPLE token</span> — standard ERC20.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
