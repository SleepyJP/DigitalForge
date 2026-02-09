'use client';

import { useState } from 'react';
import { type Address } from 'viem';
import { TrendingUp, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// =====================================================================
// THE DIGITAL FORGE - DEX Screener Embed Chart
// Displays price chart for tokens via DEX Screener iframe
// Starts collapsed — user clicks to expand. No more black void.
// =====================================================================

interface DexScreenerChartProps {
  tokenAddress?: Address;
  chainId?: string;
  height?: number;
}

export function DexScreenerChart({
  tokenAddress,
  chainId = 'pulsechain',
  height = 400,
}: DexScreenerChartProps) {
  const [expanded, setExpanded] = useState(true);

  if (!tokenAddress) {
    return null;
  }

  const dexScreenerUrl = `https://dexscreener.com/${chainId}/${tokenAddress}?embed=1&theme=dark&trades=1&info=0&chartType=candles`;

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
      {/* Header — always visible, clickable to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 hover:bg-gray-900/70 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="font-rajdhani font-semibold text-white">Price Chart</span>
          <span className="text-[10px] font-rajdhani text-gray-500 uppercase">
            {expanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://dexscreener.com/${chainId}/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 text-sm font-rajdhani hover:text-cyan-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Full Chart</span>
            <ExternalLink size={12} />
          </a>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Chart Embed — only renders when expanded */}
      {expanded && (
        <div style={{ height }} className="bg-black relative">
          <iframe
            src={dexScreenerUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="clipboard-write"
            title="DEX Screener Chart"
            className="bg-black"
            loading="lazy"
            tabIndex={-1}
          />
        </div>
      )}
    </div>
  );
}

export default DexScreenerChart;
