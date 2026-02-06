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
// THE DIGITAL FORGE - Individual Token Page
// Full token details with chart, stats, holders, and rewards
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

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button & Token Address */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/tokens"
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors font-rajdhani"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Gallery
              </Link>
            </div>

            {/* Token Address with Copy */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg">
                <span className="text-gray-400 font-mono text-sm">
                  {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <a
                href={`https://scan.pulsechain.com/token/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
              >
                <ExternalLink size={16} />
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
                className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-all"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {isLoading ? (
            /* Loading State */
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
              <div className="h-[400px] bg-gray-900/50 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Chart & Stats */}
              <div className="lg:col-span-2 space-y-6">
                {/* DEX Screener Chart */}
                <DexScreenerChart tokenAddress={tokenAddress} height={450} />

                {/* Token Stats */}
                <TokenStats tokenData={tokenData} imageUrl={imageUrl} />

                {/* Quick Actions */}
                <div className="glass-card rounded-xl p-6 border border-cyan-500/20">
                  <h3 className="font-orbitron font-bold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Trade on PulseX */}
                    <a
                      href={`https://pulsex.mypinata.cloud/ipfs/bafybeib7qk2ukr5zqz5rkwrh3m4iswz6l52m6qdqxnpkrlhjkuo7wmebfe/#/?outputCurrency=${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-white font-rajdhani font-semibold text-sm">
                        Trade on PulseX
                      </span>
                    </a>

                    {/* View on DexScreener */}
                    <a
                      href={`https://dexscreener.com/pulsechain/${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl hover:border-green-500/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-white font-rajdhani font-semibold text-sm">
                        DEX Screener
                      </span>
                    </a>

                    {/* GeckoTerminal */}
                    <a
                      href={`https://www.geckoterminal.com/pulsechain/pools/${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl hover:border-purple-500/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-white font-rajdhani font-semibold text-sm">
                        GeckoTerminal
                      </span>
                    </a>

                    {/* Defined.fi */}
                    <a
                      href={`https://www.defined.fi/pulsechain/${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-xl hover:border-pink-500/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-pink-400" />
                      </div>
                      <span className="text-white font-rajdhani font-semibold text-sm">
                        Defined.fi
                      </span>
                    </a>
                  </div>
                </div>

                {/* Social Links */}
                <div className="glass-card rounded-xl p-6 border border-gray-800">
                  <h3 className="font-orbitron font-bold text-white mb-4">Community Links</h3>
                  <div className="flex items-center gap-4">
                    <SocialButton
                      icon={<Twitter className="w-5 h-5" />}
                      label="Twitter"
                      href={metadata?.twitter ? (metadata.twitter.startsWith('http') ? metadata.twitter : `https://twitter.com/${metadata.twitter.replace('@', '')}`) : '#'}
                      disabled={!metadata?.twitter}
                    />
                    <SocialButton
                      icon={<MessageCircle className="w-5 h-5" />}
                      label="Telegram"
                      href={metadata?.telegram || '#'}
                      disabled={!metadata?.telegram}
                    />
                    <SocialButton
                      icon={<Globe className="w-5 h-5" />}
                      label="Website"
                      href={metadata?.website || '#'}
                      disabled={!metadata?.website}
                    />
                  </div>
                  {!metadata?.twitter && !metadata?.telegram && !metadata?.website && (
                    <p className="text-gray-500 text-xs font-rajdhani mt-4">
                      Social links are set by the token creator and will appear here when available.
                    </p>
                  )}
                  {metadata?.description && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-gray-400 text-sm font-rajdhani">{metadata.description}</p>
                    </div>
                  )}
                </div>

                {/* Live Chat */}
                <LiveChat tokenAddress={tokenAddress} />

                {/* Message Board */}
                <MessageBoard tokenAddress={tokenAddress} />
              </div>

              {/* Right Column - Holders & Rewards */}
              <div className="space-y-6">
                {/* Owner Controls Panel */}
                {isOwner && (
                  <div className="glass-card rounded-xl p-6 border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="font-orbitron font-bold text-white">Owner Controls</h3>
                    </div>

                    {/* Trading Status */}
                    <div className="mb-4 p-3 rounded-lg bg-black/30 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-rajdhani text-sm">Trading Status</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-rajdhani font-semibold ${
                            tokenData?.tradingEnabled
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tokenData?.tradingEnabled ? 'LIVE' : 'PAUSED'}
                        </span>
                      </div>
                    </div>

                    {/* Enable Trading Button */}
                    {!tokenData?.tradingEnabled && (
                      <button
                        onClick={handleEnableTrading}
                        disabled={isEnablingTrading || isWaitingForTrading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-orbitron font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white"
                      >
                        {isEnablingTrading ? (
                          <>
                            <span className="animate-spin">⟳</span>
                            Confirm in Wallet...
                          </>
                        ) : isWaitingForTrading ? (
                          <>
                            <span className="animate-spin">⟳</span>
                            Enabling...
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Enable Trading
                          </>
                        )}
                      </button>
                    )}

                    {/* Success Message */}
                    {tradingEnabled && (
                      <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-rajdhani text-sm">Trading enabled successfully!</span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {enableTradingError && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                        <p className="text-red-400 font-rajdhani text-sm">
                          Error: {enableTradingError.message.slice(0, 100)}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-gray-500 font-rajdhani">
                      Once trading is enabled, buys and sells will be processed with the configured tax mechanisms.
                    </p>
                  </div>
                )}

                {/* Your Holdings Panel */}
                <YourHoldingsPanel
                  tokenAddress={tokenAddress}
                  tokenSymbol={tokenData?.symbol}
                  tokenDecimals={tokenData?.decimals}
                />

                {/* Rewards Panel (for tax tokens) */}
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

                {/* Token Info Card */}
                <div className="glass-card rounded-xl p-6 border border-gray-800">
                  <h3 className="font-orbitron font-bold text-white mb-4">About This Token</h3>
                  <div className="space-y-3 text-sm font-rajdhani">
                    <p className="text-gray-400">
                      This token was created using{' '}
                      <span className="text-cyan-400">THE DIGITAL FORGE</span> by Paisley Protocol.
                    </p>
                    {isTaxToken ? (
                      <p className="text-gray-400">
                        As a <span className="text-purple-400">FORGE token</span>, it includes
                        automated tax collection and holder rewards distribution.
                      </p>
                    ) : (
                      <p className="text-gray-400">
                        This is a <span className="text-gray-300">SIMPLE token</span> with standard
                        ERC20 functionality and no special features.
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

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  disabled?: boolean;
}

function SocialButton({ icon, label, href, disabled }: SocialButtonProps) {
  if (disabled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-600 cursor-not-allowed">
        {icon}
        <span className="font-rajdhani text-sm">{label}</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
    >
      {icon}
      <span className="font-rajdhani text-sm">{label}</span>
    </a>
  );
}
