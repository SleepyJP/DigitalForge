'use client';

import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import { TREASURY_ADDRESS } from '@/lib/contracts';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-void-black relative overflow-x-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                THE GRIMOIRE
              </span>
            </h1>
            <p className="text-gray-400 font-rajdhani text-lg max-w-2xl mx-auto">
              Documentation for THE DIGITAL FORGE token factory
            </p>
          </div>

          {/* Documentation Sections */}
          <div className="space-y-8">
            {/* Overview */}
            <DocSection
              title="Overview"
              icon="info"
              color="cyan"
            >
              <p className="text-gray-300 font-rajdhani leading-relaxed">
                THE DIGITAL FORGE is an advanced fee-on-transfer token factory deployed on PulseChain.
                It allows you to create tokens with up to 6 different tax mechanisms, giving you
                complete control over tokenomics.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-cyan-400 font-rajdhani">
                  <strong>Creation Fee:</strong> 100,000 PLS (10x cheaper than competitors)
                </p>
              </div>
            </DocSection>

            {/* Tax Mechanisms */}
            <DocSection
              title="Tax Mechanisms"
              icon="tune"
              color="purple"
            >
              <div className="space-y-6">
                <TaxMechanism
                  name="Treasury"
                  icon="account_balance"
                  color="cyan"
                  description="Collects tax and sends to your configured treasury wallet. Tokens are automatically sold for PLS and transferred."
                />
                <TaxMechanism
                  name="Burn"
                  icon="local_fire_department"
                  color="orange"
                  description="Permanently destroys tokens on each transaction, creating deflationary pressure and increasing scarcity."
                />
                <TaxMechanism
                  name="Reflection"
                  icon="currency_exchange"
                  color="purple"
                  description="Distributes tax proportionally to all token holders. Passive income for HODLers."
                />
                <TaxMechanism
                  name="Liquidity"
                  icon="water_drop"
                  color="blue"
                  description="Automatically adds liquidity to PulseX. LP tokens are sent to treasury (not burned)."
                />
                <TaxMechanism
                  name="Yield"
                  icon="trending_up"
                  color="green"
                  description="Auto-buys any external token and distributes it as rewards to holders. Great for rewarding holders with stablecoins or other tokens."
                />
                <TaxMechanism
                  name="Support"
                  icon="support_agent"
                  color="pink"
                  description="Auto-buys and burns any external token. Use this to support other projects in the ecosystem."
                />
              </div>
            </DocSection>

            {/* How It Works */}
            <DocSection
              title="How It Works"
              icon="school"
              color="green"
            >
              <ol className="space-y-4 text-gray-300 font-rajdhani">
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-orbitron font-bold">1</span>
                  <div>
                    <strong className="text-white">Configure Token</strong>
                    <p className="text-gray-400">Set name, symbol, supply, and tax configuration</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-orbitron font-bold">2</span>
                  <div>
                    <strong className="text-white">Set Tax Distribution</strong>
                    <p className="text-gray-400">Allocate percentages to each mechanism (must total 100%)</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-orbitron font-bold">3</span>
                  <div>
                    <strong className="text-white">Pay Creation Fee</strong>
                    <p className="text-gray-400">100,000 PLS sent to protocol treasury</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-orbitron font-bold">4</span>
                  <div>
                    <strong className="text-white">Token Deployed</strong>
                    <p className="text-gray-400">Your token is live with automatic LP pair on PulseX</p>
                  </div>
                </li>
              </ol>
            </DocSection>

            {/* Configuration */}
            <DocSection
              title="Configuration"
              icon="settings"
              color="orange"
            >
              <div className="space-y-4 text-gray-300 font-rajdhani">
                <div className="p-4 rounded-lg bg-black/50 border border-gray-700">
                  <h4 className="text-orange-400 font-orbitron font-bold mb-2">Tax Limits</h4>
                  <ul className="space-y-1 text-sm">
                    <li>Maximum buy tax: 25%</li>
                    <li>Maximum sell tax: 25%</li>
                    <li>Distribution must total exactly 100%</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-black/50 border border-gray-700">
                  <h4 className="text-orange-400 font-orbitron font-bold mb-2">Optional Features</h4>
                  <ul className="space-y-1 text-sm">
                    <li>Max transaction limit (% of supply)</li>
                    <li>Max wallet limit (% of supply)</li>
                    <li>Anti-bot protection</li>
                    <li>Trading toggle (enable/disable on launch)</li>
                  </ul>
                </div>
              </div>
            </DocSection>

            {/* Treasury */}
            <DocSection
              title="Protocol Treasury"
              icon="account_balance"
              color="pink"
            >
              <p className="text-gray-300 font-rajdhani mb-4">
                All creation fees are sent to the Paisley Protocol treasury:
              </p>
              <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20 font-mono text-sm break-all">
                <span className="text-pink-400">{TREASURY_ADDRESS}</span>
              </div>
              <p className="text-gray-500 font-rajdhani text-sm mt-2">
                Treasury funds are used for protocol development, security audits, and ecosystem growth.
              </p>
            </DocSection>

            {/* x402 AI Payments */}
            <DocSection
              title="AI Agent Payments (x402)"
              icon="smart_toy"
              color="cyan"
            >
              <p className="text-gray-300 font-rajdhani leading-relaxed">
                THE DIGITAL FORGE supports the x402 protocol for AI agent payments.
                AI agents can programmatically create tokens by paying with USDC through
                the x402 payment gateway.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-cyan-400 font-rajdhani text-sm">
                  Contact the pHuD FARM team for API access and integration details.
                </p>
              </div>
            </DocSection>
          </div>
        </div>
      </main>
    </div>
  );
}

function DocSection({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: string;
  color: 'cyan' | 'purple' | 'green' | 'orange' | 'pink';
  children: React.ReactNode;
}) {
  const colors = {
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
    purple: 'text-purple-reflection border-purple-reflection/30 bg-purple-reflection/5',
    green: 'text-green-yield border-green-yield/30 bg-green-yield/5',
    orange: 'text-orange-burn border-orange-burn/30 bg-orange-burn/5',
    pink: 'text-pink-accent border-pink-accent/30 bg-pink-accent/5',
  };

  return (
    <section className={`glass-card rounded-2xl p-6 border ${colors[color].split(' ')[1]} ${colors[color].split(' ')[2]}`}>
      <h2 className={`font-orbitron font-bold text-2xl ${colors[color].split(' ')[0]} mb-6 flex items-center gap-3`}>
        <span className="material-icons">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TaxMechanism({
  name,
  icon,
  color,
  description,
}: {
  name: string;
  icon: string;
  color: 'cyan' | 'orange' | 'purple' | 'blue' | 'green' | 'pink';
  description: string;
}) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    orange: 'text-orange-burn bg-orange-burn/10 border-orange-burn/30',
    purple: 'text-purple-reflection bg-purple-reflection/10 border-purple-reflection/30',
    blue: 'text-blue-liquidity bg-blue-liquidity/10 border-blue-liquidity/30',
    green: 'text-green-yield bg-green-yield/10 border-green-yield/30',
    pink: 'text-pink-accent bg-pink-accent/10 border-pink-accent/30',
  };

  const textColor = colors[color].split(' ')[0];
  const bgColor = colors[color].split(' ')[1];
  const borderColor = colors[color].split(' ')[2];

  return (
    <div className={`p-4 rounded-xl ${bgColor} border ${borderColor}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={`material-icons text-xl ${textColor}`}>{icon}</span>
        <h4 className={`font-orbitron font-bold ${textColor}`}>{name}</h4>
      </div>
      <p className="text-gray-400 font-rajdhani text-sm">{description}</p>
    </div>
  );
}
