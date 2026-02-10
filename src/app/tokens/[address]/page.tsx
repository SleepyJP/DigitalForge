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
import { BuybackTokensPanel } from '@/components/dashboard/BuybackTokensPanel';
import { OwnerAdminPanel } from '@/components/dashboard/OwnerAdminPanel';
import { useTaxTokenData, isHiddenToken } from '@/hooks/useForgeTokens';
import { getTokenMetadata, saveTokenMetadata, type StoredTokenMetadata } from '@/lib/tokenMetadataStore';
import { resolveTokenImage, uploadToIPFS } from '@/lib/ipfs';
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
  Camera,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

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

  // Platform token description overrides (for tokens without on-chain metadata)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const PLATFORM_TOKEN_OVERRIDES: Record<string, { description: string }> = {
    '0x57cd040d5d3bbe3a6533e4724006073e613a6742': {
      description: 'Paisley Protocol Platform Rewarder Token — THE DIGITAL FORGE flagship fee-on-transfer token. 6.25% buy/sell tax automatically buys back DAI, WBTC, PCOCK, ZERO, and TREASURY BILL, distributing rewards to holders and routing PLS to the treasury. Hold to earn.',
    },
  };

  useEffect(() => {
    const stored = getTokenMetadata(tokenAddress);
    if (stored) setMetadata(stored);

    // Apply platform override if no stored description
    const override = PLATFORM_TOKEN_OVERRIDES[tokenAddress.toLowerCase()];
    if (override && (!stored || !stored.description)) {
      setMetadata((prev) => ({
        ...prev,
        imageUri: prev?.imageUri || '',
        createdAt: prev?.createdAt || Date.now(),
        description: override.description,
      }));
    }

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

  // Image replacement for token owner
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageReplace = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
    setIsUploadingImage(true);
    try {
      const uri = await uploadToIPFS(file);
      saveTokenMetadata(tokenAddress, {
        imageUri: uri,
        description: metadata?.description,
        website: metadata?.website,
        twitter: metadata?.twitter,
        telegram: metadata?.telegram,
      });
      const resolved = resolveTokenImage(tokenAddress, uri);
      if (resolved) setImageUrl(resolved.url);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploadingImage(false);
    }
  }, [tokenAddress, metadata]);

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
                    {/* BIG Token Image — Owner can click to replace */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageReplace(e.target.files[0]);
                      }}
                    />
                    <div
                      className={`relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 flex-shrink-0 group ${
                        imageUrl ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]' : 'border-cyan-500/20'
                      } ${isOwner ? 'cursor-pointer' : ''}`}
                      onClick={() => { if (isOwner) imageInputRef.current?.click(); }}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={tokenData?.name} className="w-full h-full object-cover" onError={() => setImageUrl(null)} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center">
                          <span className="font-orbitron font-bold text-4xl text-cyan-400">
                            {tokenData?.symbol?.slice(0, 2) || '??'}
                          </span>
                        </div>
                      )}
                      {/* Owner edit overlay */}
                      {isOwner && !isUploadingImage && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <Camera className="w-6 h-6 text-cyan-400" />
                          <span className="text-[10px] text-cyan-400 font-rajdhani font-semibold">Change Image</span>
                        </div>
                      )}
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                      )}
                    </div>

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
                  <DexScreenerChart tokenAddress={tokenAddress} height={600} />
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

                {/* Owner Controls — Enable Trading + Full Admin Panel */}
                {isOwner && !tokenData?.tradingEnabled && (
                  <div className="glass-card rounded-xl p-5 border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Power className="w-4 h-4 text-orange-400" />
                      </div>
                      <h3 className="font-orbitron font-bold text-white text-sm">Enable Trading</h3>
                    </div>
                    <button
                      onClick={handleEnableTrading}
                      disabled={isEnablingTrading || isWaitingForTrading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white"
                    >
                      {isEnablingTrading ? (
                        <><span className="animate-spin">&#x27F3;</span> Confirm in Wallet...</>
                      ) : isWaitingForTrading ? (
                        <><span className="animate-spin">&#x27F3;</span> Enabling...</>
                      ) : (
                        <><Power className="w-3.5 h-3.5" /> Enable Trading</>
                      )}
                    </button>
                    {tradingEnabled && (
                      <div className="mt-2 p-2 rounded-lg bg-green-500/20 border border-green-500/30">
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

                {/* Full Owner Admin Panel */}
                {isTaxToken && (
                  <OwnerAdminPanel
                    tokenAddress={tokenAddress}
                    isOwner={!!isOwner}
                    currentBuyTax={tokenData?.buyTax}
                    currentSellTax={tokenData?.sellTax}
                    onSuccess={() => refetch()}
                  />
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
                      pendingRewards={tokenData?.totalReflections}
                      rewardTokenSymbol="PLS"
                      rewardTokenDecimals={tokenData?.decimals}
                      onClaimSuccess={() => refetch()}
                    />
                  </ErrorBoundary>
                )}

                {/* Buyback & Reward Tokens Panel */}
                {isTaxToken && (
                  <ErrorBoundary fallbackLabel="Tax Tokenomics">
                    <BuybackTokensPanel
                      tokenAddress={tokenAddress}
                      tokenSymbol={tokenData?.symbol}
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
