'use client';

import { type Address } from 'viem';
import { TrendingUp, ExternalLink } from 'lucide-react';

// =====================================================================
// THE DIGITAL FORGE - DEX Screener Embed Chart
// Displays price chart for tokens via DEX Screener iframe
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
  if (!tokenAddress) {
    return (
      <div
        className="glass-card rounded-xl border border-gray-800 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-rajdhani">Select a token to view chart</p>
        </div>
      </div>
    );
  }

  const dexScreenerUrl = `https://dexscreener.com/${chainId}/${tokenAddress}?embed=1&theme=dark&trades=1&info=0&chartType=candles`;

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="font-rajdhani font-semibold text-white">Price Chart</span>
        </div>
        <a
          href={`https://dexscreener.com/${chainId}/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-cyan-400 text-sm font-rajdhani hover:text-cyan-300 transition-colors"
        >
          <span>Full Chart</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Chart Embed — wrapper prevents iframe from stealing page scroll focus */}
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
          onLoad={() => {
            // Prevent iframe from scrolling the parent page on load
            window.scrollTo(0, 0);
          }}
        />
      </div>
    </div>
  );
}

export default DexScreenerChart;
