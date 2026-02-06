'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useForgeStats } from '@/hooks/useForge';
import { HIDDEN_TOKEN_COUNT } from '@/hooks/useForgeTokens';

export default function Home() {
  const { tokenCount, creationFee } = useForgeStats();
  const visibleTokenCount = Math.max(0, tokenCount - HIDDEN_TOKEN_COUNT);

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

          {/* Title */}
          <div className="mt-8">
            <h1 className="font-orbitron font-black text-6xl md:text-8xl tracking-tight">
              <span className="block text-gray-400 text-2xl md:text-3xl mb-4 tracking-widest">
                THE SANCTUM
              </span>
              <span className="block text-cyan-400">
                DIGITAL
              </span>
              <span className="block text-white">
                FORGE
              </span>
            </h1>
          </div>

          <p className="mt-8 max-w-3xl text-xl md:text-2xl text-gray-300 leading-relaxed">
            <span className="text-cyan-400 font-bold">CHARGED BY AETHER.</span> IMMUTABLE. ETERNAL.
            <br className="hidden md:inline"/> Create fee-on-transfer tokens with 6 powerful tax mechanisms.
            <span className="block mt-2 text-sm md:text-base text-gray-500 tracking-widest uppercase">
              {Number(creationFee).toLocaleString()} PLS · 10x cheaper than competitors
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-6">
            <Link
              href="/forge"
              className="px-10 py-4 bg-cyan-500 text-black font-orbitron font-bold text-lg rounded hover:bg-cyan-400 transition-colors"
            >
              STRIKE THE ANVIL
            </Link>
            <Link
              href="/docs"
              className="px-10 py-4 border border-cyan-500/50 text-white font-orbitron font-bold text-lg rounded hover:bg-cyan-500/10 transition-colors"
            >
              READ THE GRIMOIRE
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="mt-20 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-0 border border-gray-800 bg-gray-900/50 rounded overflow-hidden">
            <div className="p-6 border-r border-b md:border-b-0 border-gray-800 flex flex-col items-center">
              <span className="text-4xl font-orbitron font-bold text-cyan-400">{visibleTokenCount}</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 mt-2">Tokens Forged</span>
            </div>
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col items-center">
              <span className="text-4xl font-orbitron font-bold text-white">6</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 mt-2">Tax Mechanisms</span>
            </div>
            <div className="p-6 border-r border-gray-800 flex flex-col items-center">
              <span className="text-4xl font-orbitron font-bold text-white">Low</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 mt-2">Gas Fees</span>
            </div>
            <div className="p-6 flex flex-col items-center">
              <span className="text-4xl font-orbitron font-bold text-pink-500">LIVE</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 mt-2">PulseChain</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-orbitron font-black text-white mb-6">
              ELECTRIFIED <span className="text-cyan-400">FEATURES</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The Digital Forge introduces <span className="text-cyan-400 font-bold">6 powerful tax mechanisms</span> for your tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Instant Creation"
              description="No code required. Deploy fee-on-transfer tokens onto PulseChain in seconds."
            />
            <FeatureCard
              title="6 Tax Mechanisms"
              description="Treasury, Burn, Reflection, Liquidity, Yield rewards, and Support token burns."
            />
            <FeatureCard
              title="Auto Liquidity"
              description="LP pair created automatically on PulseX. Tax-generated liquidity sent to your treasury."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="font-orbitron font-bold text-xl text-white">DIGITAL FORGE</span>
          <p className="text-gray-600 text-sm mt-2">Built on PulseChain · Paisley Protocol</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg hover:border-cyan-500/50 transition-colors">
      <h3 className="text-xl font-orbitron font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
