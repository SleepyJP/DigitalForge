'use client';

import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { Wallet, Coins, Flame, TrendingUp, ExternalLink, Zap, Gift } from 'lucide-react';
import { useMemo } from 'react';

// =====================================================================
// THE DIGITAL FORGE - Your Holdings Panel
// Shows connected user's balance, rewards, and tax mechanism breakdown
// V3-compatible: array-based getters for treasury/yield/support tokens
// =====================================================================

const TOKEN_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  // Mechanism shares
  { inputs: [], name: 'treasuryShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'burnShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'reflectionShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidityShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'yieldShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'supportShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // Array-based getters (V2/V3)
  { inputs: [{ type: 'uint256' }], name: 'treasuryWallets', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'yieldTokens', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'supportTokens', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // DEX
  { inputs: [], name: 'pair', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  // Pending amounts
  { inputs: [], name: 'pendingTreasury', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingBurn', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingYield', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // Tax rates
  { inputs: [], name: 'buyTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'sellTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

const ERC20_META_ABI = [
  { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
] as const;

const MAX_ARRAY_READ = 6;

interface YourHoldingsPanelProps {
  tokenAddress?: Address;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

export function YourHoldingsPanel({
  tokenAddress,
  tokenSymbol = '???',
  tokenDecimals = 18,
}: YourHoldingsPanelProps) {
  const { isConnected, address: userAddress } = useAccount();

  // Phase 1: Core token data
  const contracts = useMemo(() => {
    if (!tokenAddress || !userAddress) return [];
    return [
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'balanceOf' as const, args: [userAddress] }, // 0
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'totalSupply' as const },                    // 1
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'treasuryShare' as const },                   // 2
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'burnShare' as const },                       // 3
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'reflectionShare' as const },                 // 4
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'liquidityShare' as const },                  // 5
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'yieldShare' as const },                      // 6
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'supportShare' as const },                    // 7
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pair' as const },                            // 8
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pendingTreasury' as const },                 // 9
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pendingBurn' as const },                     // 10
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pendingYield' as const },                    // 11
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'owner' as const },                           // 12
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'buyTax' as const },                          // 13
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'sellTax' as const },                         // 14
    ];
  }, [tokenAddress, userAddress]);

  // Phase 2: Array entries (try reading first 6 of each)
  const arrayContracts = useMemo(() => {
    if (!tokenAddress) return [];
    const calls: unknown[] = [];
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      calls.push({ address: tokenAddress, abi: TOKEN_ABI, functionName: 'treasuryWallets' as const, args: [BigInt(i)] });
    }
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      calls.push({ address: tokenAddress, abi: TOKEN_ABI, functionName: 'yieldTokens' as const, args: [BigInt(i)] });
    }
    for (let i = 0; i < MAX_ARRAY_READ; i++) {
      calls.push({ address: tokenAddress, abi: TOKEN_ABI, functionName: 'supportTokens' as const, args: [BigInt(i)] });
    }
    return calls;
  }, [tokenAddress]);

  const { data: results, isLoading } = useReadContracts({
    contracts: contracts as readonly unknown[],
    query: { enabled: contracts.length > 0 },
  });

  const { data: arrayResults } = useReadContracts({
    contracts: arrayContracts as readonly unknown[],
    query: { enabled: arrayContracts.length > 0 },
  });

  const data = useMemo(() => {
    if (!results) return null;

    const balance = (results[0]?.result as bigint) || 0n;
    const totalSupply = (results[1]?.result as bigint) || 1n;
    const treasuryShare = (results[2]?.result as bigint) || 0n;
    const burnShare = (results[3]?.result as bigint) || 0n;
    const reflectionShare = (results[4]?.result as bigint) || 0n;
    const liquidityShare = (results[5]?.result as bigint) || 0n;
    const yieldShare = (results[6]?.result as bigint) || 0n;
    const supportShare = (results[7]?.result as bigint) || 0n;
    const lpPair = (results[8]?.result as Address) || null;
    const pendingTreasury = (results[9]?.result as bigint) || 0n;
    const pendingBurn = (results[10]?.result as bigint) || 0n;
    const contractPendingYield = (results[11]?.result as bigint) || 0n;
    const tokenOwner = (results[12]?.result as Address) || null;
    const buyTax = (results[13]?.result as bigint) || 0n;
    const sellTax = (results[14]?.result as bigint) || 0n;

    // Parse arrays
    const ZERO = '0x0000000000000000000000000000000000000000';
    const treasuryWallets: { addr: Address; share: bigint }[] = [];
    const yieldTokenAddrs: { addr: Address; share: bigint }[] = [];
    const supportTokenAddrs: { addr: Address; share: bigint }[] = [];

    if (arrayResults) {
      for (let i = 0; i < MAX_ARRAY_READ; i++) {
        const entry = arrayResults[i];
        if (entry?.status === 'success' && entry.result) {
          const [addr, share] = entry.result as [Address, bigint];
          if (addr && addr !== ZERO) treasuryWallets.push({ addr, share });
        } else break;
      }
      for (let i = 0; i < MAX_ARRAY_READ; i++) {
        const entry = arrayResults[MAX_ARRAY_READ + i];
        if (entry?.status === 'success' && entry.result) {
          const [addr, share] = entry.result as [Address, bigint];
          if (addr && addr !== ZERO) yieldTokenAddrs.push({ addr, share });
        } else break;
      }
      for (let i = 0; i < MAX_ARRAY_READ; i++) {
        const entry = arrayResults[MAX_ARRAY_READ * 2 + i];
        if (entry?.status === 'success' && entry.result) {
          const [addr, share] = entry.result as [Address, bigint];
          if (addr && addr !== ZERO) supportTokenAddrs.push({ addr, share });
        } else break;
      }
    }

    const ownershipPercent = totalSupply > 0n
      ? Number((balance * 10000n) / totalSupply) / 100
      : 0;

    return {
      balance,
      totalSupply,
      ownershipPercent,
      treasuryShare,
      burnShare,
      reflectionShare,
      liquidityShare,
      yieldShare,
      supportShare,
      treasuryWallets,
      yieldTokenAddrs,
      supportTokenAddrs,
      lpPair,
      pendingTreasury,
      pendingBurn,
      contractPendingYield,
      tokenOwner,
      buyTax,
      sellTax,
    };
  }, [results, arrayResults]);

  // Resolve yield/support token names from first entries
  const rewardTokenContracts = useMemo(() => {
    const calls: unknown[] = [];
    const ZERO = '0x0000000000000000000000000000000000000000';
    if (data?.yieldTokenAddrs?.[0]?.addr && data.yieldTokenAddrs[0].addr !== ZERO) {
      calls.push(
        { address: data.yieldTokenAddrs[0].addr, abi: ERC20_META_ABI, functionName: 'name' as const },
        { address: data.yieldTokenAddrs[0].addr, abi: ERC20_META_ABI, functionName: 'symbol' as const },
      );
    }
    if (data?.supportTokenAddrs?.[0]?.addr && data.supportTokenAddrs[0].addr !== ZERO) {
      calls.push(
        { address: data.supportTokenAddrs[0].addr, abi: ERC20_META_ABI, functionName: 'name' as const },
        { address: data.supportTokenAddrs[0].addr, abi: ERC20_META_ABI, functionName: 'symbol' as const },
      );
    }
    return calls;
  }, [data?.yieldTokenAddrs, data?.supportTokenAddrs]);

  const { data: rewardTokenResults } = useReadContracts({
    contracts: rewardTokenContracts as readonly unknown[],
    query: { enabled: rewardTokenContracts.length > 0 },
  });

  const rewardTokenMeta = useMemo(() => {
    if (!rewardTokenResults) return { yieldName: null, yieldSymbol: null, supportName: null, supportSymbol: null };

    const ZERO = '0x0000000000000000000000000000000000000000';
    const hasYield = data?.yieldTokenAddrs?.[0]?.addr && data.yieldTokenAddrs[0].addr !== ZERO;
    const hasSupport = data?.supportTokenAddrs?.[0]?.addr && data.supportTokenAddrs[0].addr !== ZERO;

    let idx = 0;
    let yieldName: string | null = null;
    let yieldSymbol: string | null = null;
    let supportName: string | null = null;
    let supportSymbol: string | null = null;

    if (hasYield) {
      yieldName = (rewardTokenResults[idx]?.result as string) || null;
      yieldSymbol = (rewardTokenResults[idx + 1]?.result as string) || null;
      idx += 2;
    }
    if (hasSupport) {
      supportName = (rewardTokenResults[idx]?.result as string) || null;
      supportSymbol = (rewardTokenResults[idx + 1]?.result as string) || null;
    }

    return { yieldName, yieldSymbol, supportName, supportSymbol };
  }, [rewardTokenResults, data?.yieldTokenAddrs, data?.supportTokenAddrs]);

  const formatAmount = (amount: bigint | undefined, decimals: number = 18): string => {
    if (!amount || amount === 0n) return '0';
    const num = Number(formatUnits(amount, decimals));
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    if (num < 0.0001 && num > 0) return '< 0.0001';
    return num.toFixed(4);
  };

  const formatShare = (share: bigint | undefined): string => {
    if (!share || share === 0n) return '0%';
    return (Number(share) / 100).toFixed(1) + '%';
  };

  const isZeroAddr = (addr: Address | null): boolean => {
    return !addr || addr === '0x0000000000000000000000000000000000000000';
  };

  const shortAddr = (addr: Address | null): string => {
    if (!addr || isZeroAddr(addr)) return '-';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const hasMechanisms = data && (
    data.treasuryShare > 0n || data.burnShare > 0n || data.reflectionShare > 0n ||
    data.liquidityShare > 0n || data.yieldShare > 0n || data.supportShare > 0n
  );

  if (!isConnected) {
    return (
      <div className="glass-card rounded-xl border border-cyan-500/20 p-6">
        <div className="text-center py-4">
          <Wallet className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-rajdhani">Connect wallet to view your holdings</p>
        </div>
      </div>
    );
  }

  if (!tokenAddress) {
    return (
      <div className="glass-card rounded-xl border border-cyan-500/20 p-6">
        <div className="text-center py-4">
          <Coins className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-rajdhani">Select a token to view holdings</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="glass-card rounded-xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-sm">Your Holdings</h3>
            <p className="text-[10px] text-gray-400 font-rajdhani">
              {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {/* Balance & Ownership */}
      <div className="p-4 border-b border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/20">
            <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
              <Coins size={12} />
              <span className="text-[10px] font-rajdhani uppercase">Balance</span>
            </div>
            <p className="text-lg font-mono font-bold text-cyan-400">
              {formatAmount(data.balance, tokenDecimals)}
            </p>
            <p className="text-[10px] text-gray-500 font-rajdhani">{tokenSymbol}</p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center gap-1.5 text-purple-400 mb-1">
              <TrendingUp size={12} />
              <span className="text-[10px] font-rajdhani uppercase">Ownership</span>
            </div>
            <p className="text-lg font-mono font-bold text-purple-400">
              {data.ownershipPercent.toFixed(2)}%
            </p>
            <p className="text-[10px] text-gray-500 font-rajdhani">of supply</p>
          </div>
        </div>
      </div>

      {/* Tax Rates */}
      {(data.buyTax > 0n || data.sellTax > 0n) && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-green-400 font-rajdhani uppercase">Buy</span>
              <span className="text-sm font-mono font-bold text-green-400">
                {(Number(data.buyTax) / 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-red-400 font-rajdhani uppercase">Sell</span>
              <span className="text-sm font-mono font-bold text-red-400">
                {(Number(data.sellTax) / 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tax Distribution Mechanisms */}
      {hasMechanisms && (
        <div className="p-4 border-b border-gray-800">
          <h4 className="text-[10px] text-gray-400 font-rajdhani uppercase mb-3 flex items-center gap-1.5">
            <Flame size={11} className="text-orange-400" />
            Tax Distribution Shares
          </h4>
          <div className="space-y-2">
            {data.treasuryShare > 0n && (
              <MechanismRow
                label="Treasury"
                share={formatShare(data.treasuryShare)}
                addresses={data.treasuryWallets}
                color="cyan"
              />
            )}
            {data.burnShare > 0n && (
              <MechanismRow
                label="Burn"
                share={formatShare(data.burnShare)}
                addresses={[]}
                color="red"
                description="Tokens burned permanently"
              />
            )}
            {data.reflectionShare > 0n && (
              <MechanismRow
                label="Reflection"
                share={formatShare(data.reflectionShare)}
                addresses={[]}
                color="green"
                description="Distributed to all holders"
              />
            )}
            {data.liquidityShare > 0n && (
              <MechanismRow
                label="Liquidity"
                share={formatShare(data.liquidityShare)}
                addresses={data.lpPair ? [{ addr: data.lpPair, share: 10000n }] : []}
                color="blue"
                description="Added to LP automatically"
              />
            )}
            {data.yieldShare > 0n && (
              <RewardTokenRow
                label="Yield Rewards"
                share={formatShare(data.yieldShare)}
                tokens={data.yieldTokenAddrs}
                firstName={rewardTokenMeta.yieldName}
                firstSymbol={rewardTokenMeta.yieldSymbol}
                color="yellow"
              />
            )}
            {data.supportShare > 0n && (
              <RewardTokenRow
                label="Support Burns"
                share={formatShare(data.supportShare)}
                tokens={data.supportTokenAddrs}
                firstName={rewardTokenMeta.supportName}
                firstSymbol={rewardTokenMeta.supportSymbol}
                color="purple"
              />
            )}
          </div>
        </div>
      )}

      {/* Pending Distribution */}
      {(data.pendingTreasury > 0n || data.pendingBurn > 0n || data.contractPendingYield > 0n) && (
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Pending Distribution</p>
          <div className="grid grid-cols-3 gap-2">
            {data.pendingTreasury > 0n && (
              <div className="text-center">
                <p className="text-[10px] text-cyan-400 font-mono">{formatAmount(data.pendingTreasury, tokenDecimals)}</p>
                <p className="text-[8px] text-gray-500">Treasury</p>
              </div>
            )}
            {data.pendingBurn > 0n && (
              <div className="text-center">
                <p className="text-[10px] text-red-400 font-mono">{formatAmount(data.pendingBurn, tokenDecimals)}</p>
                <p className="text-[8px] text-gray-500">Burn</p>
              </div>
            )}
            {data.contractPendingYield > 0n && (
              <div className="text-center">
                <p className="text-[10px] text-yellow-400 font-mono">{formatAmount(data.contractPendingYield, tokenDecimals)}</p>
                <p className="text-[8px] text-gray-500">Yield</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token Owner */}
      {data.tokenOwner && !isZeroAddr(data.tokenOwner) && (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-rajdhani uppercase">Owner</span>
            <a
              href={`https://scan.pulsechain.com/address/${data.tokenOwner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-mono transition-colors"
            >
              {shortAddr(data.tokenOwner)}
              <ExternalLink size={9} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Mechanism row — supports multiple addresses
interface MechanismRowProps {
  label: string;
  share: string;
  addresses: { addr: Address; share: bigint }[];
  color: 'cyan' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
  description?: string;
}

function MechanismRow({ label, share, addresses, color, description }: MechanismRowProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    red: 'text-red-400 border-red-500/20 bg-red-500/5',
    green: 'text-green-400 border-green-500/20 bg-green-500/5',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    yellow: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
  };

  return (
    <div className={`rounded-lg border p-2 px-3 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-rajdhani font-semibold ${colorClasses[color].split(' ')[0]}`}>{label}</span>
            <span className="text-sm font-mono font-bold text-white">{share}</span>
          </div>
          {description && (
            <p className="text-[9px] text-gray-500 font-rajdhani mt-0.5">{description}</p>
          )}
        </div>
        {addresses.length === 1 && (
          <a
            href={`https://scan.pulsechain.com/address/${addresses[0].addr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors font-mono"
          >
            {addresses[0].addr.slice(0, 6)}...{addresses[0].addr.slice(-4)}
            <ExternalLink size={9} />
          </a>
        )}
      </div>
      {addresses.length > 1 && (
        <div className="mt-1 space-y-1">
          {addresses.map((a) => (
            <a
              key={a.addr}
              href={`https://scan.pulsechain.com/address/${a.addr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[10px] text-gray-500 hover:text-cyan-400 transition-colors font-mono"
            >
              <span>{a.addr.slice(0, 6)}...{a.addr.slice(-4)}</span>
              <span>{(Number(a.share) / 100).toFixed(1)}%</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Reward Token Row — shows token info for yield/support arrays
interface RewardTokenRowProps {
  label: string;
  share: string;
  tokens: { addr: Address; share: bigint }[];
  firstName: string | null;
  firstSymbol: string | null;
  color: 'yellow' | 'purple';
}

function RewardTokenRow({ label, share, tokens, firstName, firstSymbol, color }: RewardTokenRowProps) {
  const colorClasses = {
    yellow: { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', iconBg: 'bg-yellow-500/20' },
    purple: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10', iconBg: 'bg-purple-500/20' },
  };

  const c = colorClasses[color];

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full ${c.iconBg} flex items-center justify-center`}>
            {color === 'yellow' ? <Zap size={13} className={c.text} /> : <Gift size={13} className={c.text} />}
          </div>
          <div>
            <span className={`text-sm font-rajdhani font-semibold ${c.text}`}>{label}</span>
            <span className="text-sm font-mono font-bold text-white ml-2">{share}</span>
            {tokens.length > 1 && (
              <span className="text-[10px] text-gray-500 ml-2">({tokens.length} tokens)</span>
            )}
          </div>
        </div>
      </div>

      {tokens.length > 0 && (
        <div className="space-y-1 mt-1 pt-2 border-t border-gray-800/50">
          {tokens.map((t, idx) => (
            <div key={t.addr} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full ${c.iconBg} flex items-center justify-center`}>
                  <span className={`text-[8px] font-bold ${c.text}`}>
                    {idx === 0 && firstSymbol ? firstSymbol.slice(0, 2) : '??'}
                  </span>
                </div>
                <div>
                  {idx === 0 && firstSymbol && (
                    <span className={`text-xs font-mono font-bold ${c.text}`}>${firstSymbol}</span>
                  )}
                  {idx === 0 && firstName && (
                    <span className="text-[10px] text-gray-500 font-rajdhani ml-1.5">{firstName}</span>
                  )}
                </div>
              </div>
              <a
                href={`https://scan.pulsechain.com/token/${t.addr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors font-mono"
              >
                {t.addr.slice(0, 6)}...{t.addr.slice(-4)}
                <span className="text-gray-600">{(Number(t.share) / 100).toFixed(1)}%</span>
                <ExternalLink size={9} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YourHoldingsPanel;
