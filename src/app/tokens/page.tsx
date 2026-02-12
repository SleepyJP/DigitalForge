'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import { useForgeTokens, formatTokenAmount, formatTaxRate } from '@/hooks/useForgeTokens';
import { useCreatorTokens } from '@/hooks/useForge';
import { getTokenMetadata } from '@/lib/tokenMetadataStore';
import { resolveTokenImage } from '@/lib/ipfs';
import {
  Coins,
  Search,
  Filter,
  ExternalLink,
  Flame,
  Shield,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
} from 'lucide-react';

// =====================================================================
// THE DIGITAL FORGE - Token Dashboard
// Displays all forged tokens with filtering and search
// =====================================================================

type FilterType = 'all' | 'forge' | 'simple' | 'my-tokens';

export default function TokensPage() {
  const { isConnected, address } = useAccount();
  const { tokens, isLoading } = useForgeTokens(0, 100);
  const { tokenIds } = useCreatorTokens(address);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Get user's token addresses
  const userTokenAddresses = useMemo(() => {
    if (!tokens || !tokenIds) return new Set<string>();
    return new Set(
      tokenIds.map((id) => {
        const token = tokens.find((t) => t.tokenId === id);
        return token?.address?.toLowerCase() || '';
      }).filter(Boolean)
    );
  }, [tokens, tokenIds]);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    let result = tokens;

    // Apply type filter
    if (filter === 'forge') {
      result = result.filter((t) => t.tokenType === 'FORGE' || t.tokenType === 'PAISLEY');
    } else if (filter === 'simple') {
      result = result.filter((t) => t.tokenType === 'SIMPLE');
    } else if (filter === 'my-tokens') {
      result = result.filter((t) => userTokenAddresses.has(t.address.toLowerCase()));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.symbol.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tokens, filter, searchQuery, userTokenAddresses]);

  return (
    <div className="min-h-screen bg-void-black relative overflow-x-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 pt-4 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                TOKEN GALLERY
              </span>
            </h1>
            <p className="text-gray-400 font-rajdhani text-lg max-w-2xl mx-auto">
              Explore all tokens forged in THE DIGITAL FORGE
            </p>

          </div>

          {/* Search and Filter Bar */}
          <div className="glass-card rounded-xl p-4 mb-8 border border-cyan-500/20">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, symbol, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 font-rajdhani focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <FilterButton
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                  label="All"
                />
                <FilterButton
                  active={filter === 'forge'}
                  onClick={() => setFilter('forge')}
                  label="Tax Tokens"
                  icon={<Flame className="w-4 h-4" />}
                  color="purple"
                />
                <FilterButton
                  active={filter === 'simple'}
                  onClick={() => setFilter('simple')}
                  label="Simple"
                  icon={<Shield className="w-4 h-4" />}
                  color="gray"
                />
                {isConnected && (
                  <FilterButton
                    active={filter === 'my-tokens'}
                    onClick={() => setFilter('my-tokens')}
                    label="My Tokens"
                    icon={<Sparkles className="w-4 h-4" />}
                    color="cyan"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Token Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-800 rounded w-24 mb-2" />
                      <div className="h-4 bg-gray-800/50 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-800/50 rounded" />
                    <div className="h-4 bg-gray-800/50 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Coins className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-orbitron font-bold text-xl text-gray-400 mb-2">
                {searchQuery || filter !== 'all' ? 'No Tokens Found' : 'No Tokens Yet'}
              </h3>
              <p className="text-gray-500 font-rajdhani mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : filter === 'my-tokens'
                  ? "You haven't forged any tokens yet"
                  : 'Be the first to forge a token!'}
              </p>
              <Link
                href="/forge"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl font-rajdhani font-semibold text-black hover:shadow-glow-cyan transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Forge Your First Token
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.address}
                  token={token}
                  isOwned={userTokenAddresses.has(token.address.toLowerCase())}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  color?: 'cyan' | 'purple' | 'pink' | 'gray';
}

function FilterButton({ active, onClick, label, icon, color = 'cyan' }: FilterButtonProps) {
  const colorClasses = {
    cyan: active ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'text-gray-400 border-gray-700',
    purple: active ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-gray-400 border-gray-700',
    pink: active ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'text-gray-400 border-gray-700',
    gray: active ? 'bg-gray-700 text-gray-200 border-gray-600' : 'text-gray-400 border-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-rajdhani font-semibold text-sm transition-all hover:border-${color}-500/50 ${
        colorClasses[color]
      } ${active ? '' : 'bg-gray-900/50 hover:bg-gray-800/50'}`}
    >
      {icon}
      {label}
    </button>
  );
}

interface TokenCardProps {
  token: {
    address: `0x${string}`;
    tokenId: bigint;
    creator: `0x${string}`;
    createdAt: bigint;
    tokenType: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    buyTax?: bigint;
    sellTax?: bigint;
    tradingEnabled?: boolean;
  };
  isOwned: boolean;
}

function TokenCard({ token, isOwned }: TokenCardProps) {
  const isTaxToken = token.tokenType === 'FORGE' || token.tokenType === 'PAISLEY';
  const hasTaxes = (token.buyTax && token.buyTax > 0n) || (token.sellTax && token.sellTax > 0n);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load token image — stored metadata first, Piteas fallback
  useEffect(() => {
    const metadata = getTokenMetadata(token.address);
    const resolved = resolveTokenImage(token.address, metadata?.imageUri);
    if (resolved) setImageUrl(resolved.url);
  }, [token.address]);

  return (
    <Link href={`/tokens/${token.address}`}>
      <div className="glass-card rounded-xl p-6 hover:border-cyan-500/40 transition-all group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-700">
                <img src={imageUrl} alt={token.name} className="w-full h-full object-cover" onError={() => setImageUrl(null)} />
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isTaxToken
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                    : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20'
                }`}
              >
                {isTaxToken ? (
                  <Flame className="w-6 h-6 text-purple-400" />
                ) : (
                  <Coins className="w-6 h-6 text-cyan-400" />
                )}
              </div>
            )}
            <div>
              <h3 className="font-orbitron font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                {token.name}
              </h3>
              <p className="text-cyan-400 font-mono text-sm">${token.symbol}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-rajdhani font-semibold ${
                isTaxToken
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {token.tokenType}
            </span>
            {isOwned && (
              <span className="px-2 py-0.5 rounded text-[10px] font-rajdhani font-semibold bg-cyan-500/20 text-cyan-400">
                OWNED
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs font-rajdhani uppercase mb-1">Supply</p>
            <p className="text-white font-mono text-sm">
              {formatTokenAmount(token.totalSupply, token.decimals)}
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs font-rajdhani uppercase mb-1">Token ID</p>
            <p className="text-white font-mono text-sm">#{token.tokenId.toString()}</p>
          </div>
        </div>

        {/* Tax Info for FORGE tokens */}
        {isTaxToken && hasTaxes && (
          <div className="flex items-center gap-4 mb-4 py-3 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs font-rajdhani text-gray-400">Buy:</span>
              <span className="text-green-400 font-mono text-sm">{formatTaxRate(token.buyTax)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-rajdhani text-gray-400">Sell:</span>
              <span className="text-red-400 font-mono text-sm">{formatTaxRate(token.sellTax)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <a
            href={`https://scan.pulsechain.com/token/${token.address}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-cyan-400 text-xs font-mono hover:text-cyan-300 flex items-center gap-1"
          >
            {token.address.slice(0, 6)}...{token.address.slice(-4)}
            <ExternalLink size={10} />
          </a>
          <div className="flex items-center gap-1 text-gray-500">
            <TrendingUp size={12} />
            <span className="text-xs font-rajdhani">View Details</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
