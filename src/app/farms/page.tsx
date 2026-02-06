'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import {
  FARM_FACTORY_ADDRESS,
  FARM_FACTORY_ABI,
  FARM_POOL_ABI,
  ERC20_ABI,
  formatTokenAmount,
  formatDuration,
  calculateAPR,
  type FarmPoolData,
} from '@/lib/farmContracts';

type FilterType = 'live' | 'finished' | 'my';

export default function FarmsPage() {
  const { address: userAddress } = useAccount();
  const [filter, setFilter] = useState<FilterType>('live');
  const [farms, setFarms] = useState<FarmPoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Tick timer for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(interval);
  }, []);

  // Get farm count
  const { data: farmCount } = useReadContract({
    address: FARM_FACTORY_ADDRESS,
    abi: FARM_FACTORY_ABI,
    functionName: 'farmCount',
    query: { enabled: FARM_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  });

  // Get all farm addresses
  const { data: farmAddresses } = useReadContract({
    address: FARM_FACTORY_ADDRESS,
    abi: FARM_FACTORY_ABI,
    functionName: 'getAllFarms',
    args: [0n, farmCount ?? 100n],
    query: { enabled: !!farmCount && farmCount > 0n },
  });

  // Build multicall for farm info from factory
  const farmInfoContracts = useMemo(() => {
    if (!farmCount) return [];
    return Array.from({ length: Number(farmCount) }, (_, i) => ({
      address: FARM_FACTORY_ADDRESS,
      abi: FARM_FACTORY_ABI,
      functionName: 'farmInfo' as const,
      args: [BigInt(i)],
    }));
  }, [farmCount]);

  const { data: farmInfoData } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: farmInfoContracts as any,
    query: { enabled: farmInfoContracts.length > 0 },
  });

  // Build multicall for pool data from each farm pool
  const poolDataContracts = useMemo(() => {
    if (!farmAddresses || farmAddresses.length === 0) return [];
    return farmAddresses.flatMap((addr) => [
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'stakeToken' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'rewardToken' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'depositFeeBps' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'withdrawalFeeBps' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'startTime' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'endTime' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'totalStaked' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'totalRewardAmount' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'rewardPerSecond' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'stakerCount' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'active' },
      { address: addr as `0x${string}`, abi: FARM_POOL_ABI, functionName: 'creator' },
    ]);
  }, [farmAddresses]);

  const { data: poolData } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: poolDataContracts as any,
    query: { enabled: poolDataContracts.length > 0 },
  });

  // Get ERC20 names for stake/reward tokens
  const tokenAddresses = useMemo(() => {
    if (!poolData || !farmAddresses) return [];
    const addrs = new Set<string>();
    const fieldsPerFarm = 12;
    for (let i = 0; i < farmAddresses.length; i++) {
      const stakeToken = poolData[i * fieldsPerFarm]?.result as string;
      const rewardToken = poolData[i * fieldsPerFarm + 1]?.result as string;
      if (stakeToken) addrs.add(stakeToken);
      if (rewardToken) addrs.add(rewardToken);
    }
    return [...addrs];
  }, [poolData, farmAddresses]);

  const tokenMetaContracts = useMemo(() => {
    return tokenAddresses.flatMap((addr) => [
      { address: addr as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' },
      { address: addr as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' },
    ]);
  }, [tokenAddresses]);

  const { data: tokenMeta } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: tokenMetaContracts as any,
    query: { enabled: tokenMetaContracts.length > 0 },
  });

  // Process all data into FarmPoolData[]
  useEffect(() => {
    if (!farmAddresses || !poolData || !farmInfoData) {
      if (FARM_FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
        setIsLoading(false);
      }
      return;
    }

    // Build token metadata map
    const tokenMap: Record<string, { symbol: string; decimals: number }> = {};
    if (tokenMeta) {
      for (let i = 0; i < tokenAddresses.length; i++) {
        const symbol = (tokenMeta[i * 2]?.result as string) || '???';
        const decimals = (tokenMeta[i * 2 + 1]?.result as number) || 18;
        tokenMap[tokenAddresses[i].toLowerCase()] = { symbol, decimals };
      }
    }

    const fieldsPerFarm = 12;
    const processed: FarmPoolData[] = [];

    for (let i = 0; i < farmAddresses.length; i++) {
      const addr = farmAddresses[i] as `0x${string}`;
      const base = i * fieldsPerFarm;

      const stakeToken = (poolData[base]?.result as `0x${string}`) || '0x0000000000000000000000000000000000000000';
      const rewardToken = (poolData[base + 1]?.result as `0x${string}`) || '0x0000000000000000000000000000000000000000';
      const depositFeeBps = Number(poolData[base + 2]?.result ?? 0n);
      const withdrawalFeeBps = Number(poolData[base + 3]?.result ?? 0n);
      const startTime = Number(poolData[base + 4]?.result ?? 0n);
      const endTime = Number(poolData[base + 5]?.result ?? 0n);
      const totalStaked = (poolData[base + 6]?.result as bigint) ?? 0n;
      const totalRewardAmount = (poolData[base + 7]?.result as bigint) ?? 0n;
      const rewardPerSecond = (poolData[base + 8]?.result as bigint) ?? 0n;
      const stakerCount = Number(poolData[base + 9]?.result ?? 0n);
      const active = (poolData[base + 10]?.result as boolean) ?? false;
      const creator = (poolData[base + 11]?.result as `0x${string}`) || '0x0000000000000000000000000000000000000000';

      const stakeInfo = tokenMap[stakeToken.toLowerCase()] || { symbol: '???', decimals: 18 };
      const rewardInfo = tokenMap[rewardToken.toLowerCase()] || { symbol: '???', decimals: 18 };

      // Get createdAt from farmInfo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const infoResult = farmInfoData[i]?.result as any;
      const createdAt = infoResult ? Number(infoResult[5] ?? 0n) : 0;

      processed.push({
        farmId: i,
        address: addr,
        creator,
        stakeToken,
        rewardToken,
        stakeTokenSymbol: stakeInfo.symbol,
        stakeTokenDecimals: stakeInfo.decimals,
        rewardTokenSymbol: rewardInfo.symbol,
        rewardTokenDecimals: rewardInfo.decimals,
        depositFeeBps,
        withdrawalFeeBps,
        startTime,
        endTime,
        totalStaked,
        totalRewardAmount,
        rewardPerSecond,
        stakerCount,
        active: active && now < endTime,
        createdAt,
      });
    }

    setFarms(processed);
    setIsLoading(false);
  }, [farmAddresses, poolData, farmInfoData, tokenMeta, tokenAddresses, now]);

  // Filter farms
  const filteredFarms = useMemo(() => {
    switch (filter) {
      case 'live':
        return farms.filter((f) => f.active);
      case 'finished':
        return farms.filter((f) => !f.active);
      case 'my':
        if (!userAddress) return [];
        return farms.filter((f) => f.creator.toLowerCase() === userAddress.toLowerCase());
      default:
        return farms;
    }
  }, [farms, filter, userAddress]);

  // Stats
  const liveFarms = farms.filter((f) => f.active).length;
  const finishedFarms = farms.filter((f) => !f.active).length;

  return (
    <>
      <BackgroundEffects />
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-orbitron text-4xl sm:text-5xl font-bold mb-3">
            <span className="text-green-400">PAISLEY</span>{' '}
            <span className="text-white">FARMS</span>
          </h1>
          <p className="text-gray-400 font-rajdhani text-lg max-w-xl mx-auto">
            Stake tokens. Earn rewards. Create your own farm and earn 75% of all fees.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          <div className="glass-card rounded-xl p-4 text-center border border-green-500/20">
            <p className="text-green-400 font-orbitron text-2xl font-bold">{farms.length}</p>
            <p className="text-gray-500 font-rajdhani text-sm">Total Farms</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center border border-cyan-500/20">
            <p className="text-cyan-400 font-orbitron text-2xl font-bold">{liveFarms}</p>
            <p className="text-gray-500 font-rajdhani text-sm">Live</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center border border-gray-500/20">
            <p className="text-gray-400 font-orbitron text-2xl font-bold">{finishedFarms}</p>
            <p className="text-gray-500 font-rajdhani text-sm">Finished</p>
          </div>
        </div>

        {/* Filter Tabs + Create CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {(['live', 'finished', 'my'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-lg font-rajdhani font-semibold text-sm transition-all ${
                  filter === f
                    ? f === 'live'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : f === 'finished'
                      ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-white/5 text-gray-500 border border-white/10 hover:border-cyan-500/30'
                }`}
              >
                {f === 'live' && `Live (${liveFarms})`}
                {f === 'finished' && `Finished (${finishedFarms})`}
                {f === 'my' && 'My Farms'}
              </button>
            ))}
          </div>
          <Link href="/farms/create">
            <button className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg font-rajdhani font-bold text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all">
              + Create Farm
            </button>
          </Link>
        </div>

        {/* Farm not deployed notice */}
        {FARM_FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000' && (
          <div className="glass-card border border-yellow-500/30 rounded-xl p-8 text-center mb-8">
            <span className="material-icons text-yellow-400 text-4xl mb-3 block">construction</span>
            <h3 className="font-orbitron text-xl text-yellow-400 mb-2">Farm Factory Not Deployed Yet</h3>
            <p className="text-gray-400 font-rajdhani">
              The PaisleyFarmFactory contract has been compiled and is ready for deployment to PulseChain mainnet.
              Once deployed, update the FARM_FACTORY_ADDRESS in <code className="text-cyan-400">farmContracts.ts</code>.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && FARM_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 font-rajdhani">Loading farms...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredFarms.length === 0 && FARM_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000' && (
          <div className="text-center py-20">
            <span className="material-icons text-gray-600 text-5xl mb-4 block">eco</span>
            <h3 className="font-orbitron text-xl text-gray-400 mb-2">
              {filter === 'my' ? 'You haven\'t created any farms yet' : `No ${filter} farms`}
            </h3>
            <p className="text-gray-500 font-rajdhani mb-6">
              {filter === 'my'
                ? 'Create a farm and earn 75% of all deposit & withdrawal fees.'
                : 'Check back later or create the first farm!'}
            </p>
            <Link href="/farms/create">
              <button className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg font-rajdhani font-bold text-black">
                Create Farm
              </button>
            </Link>
          </div>
        )}

        {/* Farm Grid */}
        {filteredFarms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredFarms.map((farm) => {
              const timeLeft = farm.endTime > now ? farm.endTime - now : 0;
              const apr = calculateAPR(
                farm.rewardPerSecond,
                farm.totalStaked,
                farm.rewardTokenDecimals,
                farm.stakeTokenDecimals
              );

              return (
                <div
                  key={farm.farmId}
                  className={`glass-card rounded-xl border transition-all hover:shadow-lg ${
                    farm.active
                      ? 'border-green-500/30 hover:border-green-500/60 hover:shadow-green-500/10'
                      : 'border-gray-600/30 hover:border-gray-500/50 opacity-80'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-orbitron text-lg font-bold text-white">
                          {farm.stakeTokenSymbol}
                        </h3>
                        <p className="text-gray-400 font-rajdhani text-sm">
                          Earn <span className="text-green-400 font-semibold">{farm.rewardTokenSymbol}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {farm.active ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-rajdhani font-bold rounded-full border border-green-500/30">
                            LIVE
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-rajdhani font-bold rounded-full border border-gray-500/30">
                            FINISHED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* APR */}
                    {apr > 0 && (
                      <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-gray-400 font-rajdhani text-xs mb-0.5">APR</p>
                        <p className="font-orbitron text-2xl font-bold text-green-400">
                          {apr > 10000 ? `${(apr / 1000).toFixed(1)}K` : apr.toFixed(1)}%
                        </p>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-gray-500 font-rajdhani text-xs">Total Staked</p>
                        <p className="text-white font-rajdhani font-semibold">
                          {formatTokenAmount(farm.totalStaked, farm.stakeTokenDecimals)} {farm.stakeTokenSymbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-rajdhani text-xs">Stakers</p>
                        <p className="text-white font-rajdhani font-semibold">{farm.stakerCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-rajdhani text-xs">Deposit Fee</p>
                        <p className="text-cyan-400 font-rajdhani font-semibold">{farm.depositFeeBps / 100}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-rajdhani text-xs">Withdraw Fee</p>
                        <p className="text-cyan-400 font-rajdhani font-semibold">{farm.withdrawalFeeBps / 100}%</p>
                      </div>
                    </div>

                    {/* Time Left */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 font-rajdhani text-sm">Time Remaining</span>
                      <span className={`font-rajdhani font-semibold ${timeLeft > 0 ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {formatDuration(timeLeft)}
                      </span>
                    </div>

                    {/* Creator */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-gray-600 font-rajdhani text-xs">
                        by {farm.creator.slice(0, 6)}...{farm.creator.slice(-4)}
                      </span>
                      <a
                        href={`https://scan.pulsechain.com/address/${farm.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400/60 hover:text-cyan-400 text-xs font-rajdhani transition-colors"
                      >
                        View Contract &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
