'use client';

import { useForgeStats } from '@/hooks/useForge';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
}

function StatCard({ label, value, icon, iconColor = 'text-cyan-400' }: StatCardProps) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-pink-500/30 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
      <div className="relative glass-card rounded-xl p-5 hover:border-cyan-500/40 transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <span className={`material-icons text-3xl ${iconColor}`}>{icon}</span>
          <span className="text-cyan-300/50 text-xs font-rajdhani uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="text-2xl md:text-3xl font-orbitron font-bold text-white truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function StatsGrid() {
  const { tokenCount, creationFee } = useForgeStats();

  const stats = [
    {
      label: 'Tokens Forged',
      value: tokenCount.toLocaleString(),
      icon: 'local_fire_department',
      iconColor: 'text-orange-burn',
    },
    {
      label: 'Tax Tokens',
      value: tokenCount.toLocaleString(),
      icon: 'diamond',
      iconColor: 'text-cyan-400',
    },
    {
      label: 'Creation Fee',
      value: `${Number(creationFee).toLocaleString()} PLS`,
      icon: 'payments',
      iconColor: 'text-green-yield',
    },
    {
      label: 'Chain',
      value: 'PulseChain',
      icon: 'bolt',
      iconColor: 'text-purple-reflection',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
