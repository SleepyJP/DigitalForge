'use client';

import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Link from 'next/link';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import { DexScreenerChart } from '@/components/dashboard/DexScreenerChart';
import { TokenStats } from '@/components/dashboard/TokenStats';
import { HoldersPanel } from '@/components/dashboard/HoldersPanel';
import { RewardsClaimPanel } from '@/components/dashboard/RewardsClaimPanel';
import { YourHoldingsPanel } from '@/components/dashboard/YourHoldingsPanel';
import { SwapWidget } from '@/components/dashboard/SwapWidget';
import { LiveChat } from '@/components/dashboard/LiveChat';
import { MessageBoard } from '@/components/dashboard/MessageBoard';
import { useTaxTokenData, isHiddenToken } from '@/hooks/useForgeTokens';
import { getTokenMetadata, type StoredTokenMetadata } from '@/lib/tokenMetadataStore';
import { ipfsToHttp, getFromLocalStorage } from '@/lib/ipfs';
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
// Layout: Left = Token Info + Chart + Chat | Right = Swap + Holdings + Rewards + Holders
// =====================================================================

export default function TokenPage() {
  const params = useParams();
  const { address: userAddress } = useAccount();
  const [copied, setCopied] = useState(false);
  const [metadata, setMetadata] = useState<StoredTokenMetadata | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const tokenAddress = params.address as Address;
  const hidden = isHiddenToken(tokenAddress);
  const { tokenData, isLoading, refetch } = useTaxTokenData(hidden ? undefined : tokenAddress, userAddress);

  // Enable trading contract write
  const {
    data: enableTradingHash,
    error: enableTradingError,
    isPending: isEnablingTrading,
    writeContract: writeEnableTrading,
  } = useWriteContract();

  const { isLoading: isWaitingForTrading, isSuccess: tradingEnabled } = useWaitForTransactionReceipt({
    hash: enableTradingHash,
  });

  // Refetch token data after trading is enabled
  useEffect(() => {
    if (tradingEnabled) {
      refetch();
    }
  }, [tradingEnabled, refetch]);

  // Check if current user is the token owner
  const isOwner = userAddress && tokenData?.creator &&
    userAddress.toLowerCase() === tokenData.creator.toLowerCase();

  const handleEnableTrading = useCallback(() => {
    writeEnableTrading({
      address: tokenAddress,
      abi: FORGED_TOKEN_ABI,
      functionName: 'enableTrading',
    });
  }, [tokenAddress, writeEnableTrading]);

  // Load stored metadata
  useEffect(() => {
    const stored = getTokenMetadata(tokenAddress);
    if (stored) {
      setMetadata(stored);
      if (stored.imageUri) {
        if (stored.imageUri.startsWith('local://')) {
          const data = getFromLocalStorage(stored.imageUri);
          if (data) setImageUrl(data);
        } else if (stored.imageUri.startsWith('ipfs://')) {
          setImageUrl(ipfsToHttp(stored.imageUri));
        } else {
          setImageUrl(stored.imageUri);
        }
      }
    }
  }, [tokenAddress]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTaxToken = tokenData?.tokenType === 'FORGE';

  if (hidden) {
    return (
      <div className="min-h-screen bg-void-black relative overflow-hidden">
        <BackgroundEffects />
        <Header />
        <main className="relative z-10 pt-24 pb-20 px-4">
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
    <div className="min-h-screen bg-void-black relative overflow-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 pt-20 pb-20 px-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/tokens"
              className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors font-rajdhani text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Gallery
            </Link>

            {/* Token Address + Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-lg">
                <span className="text-gray-400 font-mono text-xs">
                  {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
                </span>
                <button onClick={handleCopy} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <a
                href={`https://scan.pulsechain.com/token/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: tokenData?.name, url });
                  } else {
                    navigator.clipboard.writeText(url);
                  }
                }}
                className="p-1.5 bg-gray-900/50 border border-gray-800 rounded-lg text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-all"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-xl" />
                  <div>
                    <div className="h-6 bg-gray-800 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-800/50 rounded w-20" />
                  </div>
                </div>
              </div>
              <div className="h-[500px] bg-gray-900/50 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* ═══════════════════════════════════════════════════════ */}
              {/* LEFT COLUMN - Token Info + Chart + Chat (8 cols)       */}
              {/* ═══════════════════════════════════════════════════════ */}
              <div className="lg:col-span-8 space-y-4">

                {/* Token Header - Name, Symbol, Image, Description */}
                <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Token Image */}
                      {imageUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-cyan-500/30 flex-shrink-0">
                          <img src={imageUrl} alt={tokenData?.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                          <span className="font-orbitron font-bold text-2xl text-cyan-400">
                            {tokenData?.symbol?.slice(0, 2) || '??'}
                          </span>
                        </div>
                      )}

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h1 className="font-orbitron font-bold text-2xl text-white truncate">
                            {tokenData?.name || 'Loading...'}
                          </h1>
                          <span className="text-cyan-400 font-mono text-lg">${tokenData?.symbol}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-rajdhani font-semibold ${
                              tokenData?.tokenType === 'FORGE'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            {tokenData?.tokenType}
                          </span>
                          {tokenData?.tradingEnabled !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-rajdhani font-semibold ${
                                tokenData.tradingEnabled
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {tokenData.tradingEnabled ? 'LIVE' : 'PAUSED'}
                            </span>
                          )}
                        </div>

                        {metadata?.description && (
                          <p className="text-gray-400 text-sm font-rajdhani line-clamp-2">
                            {metadata.description}
                          </p>
                        )}
                      </div>

                      {/* Social Links */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {metadata?.twitter && (
                          <a
                            href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://twitter.com/${metadata.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                          >
                            <Twitter size={14} />
                          </a>
                        )}
                        {metadata?.telegram && (
                          <a
                            href={metadata.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                        {metadata?.website && (
                          <a
                            href={metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                          >
                            <Globe size={14} />
                          </a>
                        )}
                        <a
                          href={`https://dexscreener.com/pulsechain/${tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg text-green-400 hover:text-green-300 hover:border-green-500/50 transition-all"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DexScreener Chart - BIG */}
                <DexScreenerChart tokenAddress={tokenAddress} height={600} />

                {/* Token Stats */}
                <TokenStats tokenData={tokenData} imageUrl={imageUrl} />

                {/* Quick Trade Links */}
                <div className="flex items-center gap-3">
                  <a
                    href={`https://pulsex.mypinata.cloud/ipfs/bafybeib7qk2ukr5zqz5rkwrh3m4iswz6l52m6qdqxnpkrlhjkuo7wmebfe/#/?outputCurrency=${tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-lg hover:border-cyan-500/50 transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-rajdhani font-semibold text-sm">Trade on PulseX</span>
                  </a>
                  <a
                    href={`https://dexscreener.com/pulsechain/${tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-lg hover:border-green-500/50 transition-all"
                  >
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-white font-rajdhani font-semibold text-sm">DEX Screener</span>
                  </a>
                </div>

                {/* Live Chat */}
                <LiveChat tokenAddress={tokenAddress} />

                {/* Message Board */}
                <MessageBoard tokenAddress={tokenAddress} />
              </div>

              {/* ═══════════════════════════════════════════════════════ */}
              {/* RIGHT COLUMN - Swap + Holdings + Rewards + Holders     */}
              {/* ═══════════════════════════════════════════════════════ */}
              <div className="lg:col-span-4 space-y-4">

                {/* Owner Controls Panel */}
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
                          Error: {enableTradingError.message.slice(0, 80)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* SWAP WIDGET - THE MAIN ACTION */}
                <SwapWidget
                  tokenAddress={tokenAddress}
                  tokenSymbol={tokenData?.symbol}
                  tokenDecimals={tokenData?.decimals}
                  onSwapSuccess={() => refetch()}
                />

                {/* Your Holdings */}
                <YourHoldingsPanel
                  tokenAddress={tokenAddress}
                  tokenSymbol={tokenData?.symbol}
                  tokenDecimals={tokenData?.decimals}
                />

                {/* Rewards Panel */}
                {isTaxToken && (
                  <RewardsClaimPanel
                    tokenAddress={tokenAddress}
                    tokenSymbol={tokenData?.symbol}
                    pendingRewards={tokenData?.userPendingRewards}
                    totalClaimed={tokenData?.userTotalClaimed}
                    rewardTokenSymbol="PLS"
                    rewardTokenDecimals={18}
                    onClaimSuccess={() => refetch()}
                  />
                )}

                {/* Holders Panel */}
                <HoldersPanel
                  tokenAddress={tokenAddress}
                  tokenSymbol={tokenData?.symbol}
                  totalSupply={tokenData?.totalSupply}
                  creator={tokenData?.creator}
                  isTaxToken={isTaxToken}
                  rewardTokenSymbol="PLS"
                  rewardTokenDecimals={18}
                />

                {/* About This Token */}
                <div className="glass-card rounded-xl p-5 border border-gray-800">
                  <h3 className="font-orbitron font-bold text-white text-sm mb-3">About</h3>
                  <div className="space-y-2 text-xs font-rajdhani">
                    <p className="text-gray-400">
                      Created with <span className="text-cyan-400">THE DIGITAL FORGE</span> by Paisley Protocol.
                    </p>
                    {isTaxToken ? (
                      <p className="text-gray-400">
                        <span className="text-purple-400">FORGE token</span> — automated tax collection, holder rewards, and multi-mechanism distribution.
                      </p>
                    ) : (
                      <p className="text-gray-400">
                        <span className="text-gray-300">SIMPLE token</span> — standard ERC20 with no tax features.
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
