'use client';

import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { Wallet, Coins, Flame, TrendingUp, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

// =====================================================================
// THE DIGITAL FORGE - Your Holdings Panel
// Shows connected user's balance, rewards, and token mechanisms
// =====================================================================

const TOKEN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Mechanism shares
  {
    inputs: [],
    name: 'treasuryShare',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'burnShare',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reflectionShare',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'liquidityShare',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldShare',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'supportShare',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Mechanism addresses
  {
    inputs: [],
    name: 'treasuryWallet',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'supportToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpPair',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Contract-level pending amounts
  {
    inputs: [],
    name: 'pendingTreasury',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingBurn',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingYield',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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

  // Build contracts for reading all token data
  const contracts = useMemo(() => {
    if (!tokenAddress || !userAddress) return [];

    return [
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'balanceOf' as const, args: [userAddress] },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'totalSupply' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'treasuryShare' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'burnShare' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'reflectionShare' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'liquidityShare' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'yieldShare' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'supportShare' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'treasuryWallet' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'yieldToken' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'supportToken' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'lpPair' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pendingTreasury' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pendingBurn' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pendingYield' as const },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'owner' as const },
    ];
  }, [tokenAddress, userAddress]);

  const { data: results, isLoading } = useReadContracts({
    contracts: contracts as readonly unknown[],
    query: { enabled: contracts.length > 0 },
  });

  // Parse results
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
    const treasuryWallet = (results[8]?.result as Address) || null;
    const yieldToken = (results[9]?.result as Address) || null;
    const supportToken = (results[10]?.result as Address) || null;
    const lpPair = (results[11]?.result as Address) || null;
    const pendingTreasury = (results[12]?.result as bigint) || 0n;
    const pendingBurn = (results[13]?.result as bigint) || 0n;
    const contractPendingYield = (results[14]?.result as bigint) || 0n;
    const tokenOwner = (results[15]?.result as Address) || null;

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
      treasuryWallet,
      yieldToken,
      supportToken,
      lpPair,
      pendingTreasury,
      pendingBurn,
      contractPendingYield,
      tokenOwner,
    };
  }, [results]);

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
      <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white">Your Holdings</h3>
            <p className="text-xs text-gray-400 font-rajdhani">
              {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {/* Balance & Ownership */}
      <div className="p-6 border-b border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Coins size={14} />
              <span className="text-xs font-rajdhani uppercase">Balance</span>
            </div>
            <p className="text-xl font-mono font-bold text-cyan-400">
              {formatAmount(data.balance, tokenDecimals)}
            </p>
            <p className="text-xs text-gray-500 font-rajdhani">{tokenSymbol}</p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <TrendingUp size={14} />
              <span className="text-xs font-rajdhani uppercase">Ownership</span>
            </div>
            <p className="text-xl font-mono font-bold text-purple-400">
              {data.ownershipPercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 font-rajdhani">of supply</p>
          </div>
        </div>

        {/* Contract Pending Amounts */}
        {(data.pendingTreasury > 0n || data.pendingBurn > 0n || data.contractPendingYield > 0n) && (
          <div className="mt-4 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
            <p className="text-[10px] text-gray-500 font-rajdhani uppercase mb-2">Pending Distribution</p>
            <div className="grid grid-cols-3 gap-2">
              {data.pendingTreasury > 0n && (
                <div className="text-center">
                  <p className="text-xs text-cyan-400 font-mono">{formatAmount(data.pendingTreasury, tokenDecimals)}</p>
                  <p className="text-[10px] text-gray-500">Treasury</p>
                </div>
              )}
              {data.pendingBurn > 0n && (
                <div className="text-center">
                  <p className="text-xs text-red-400 font-mono">{formatAmount(data.pendingBurn, tokenDecimals)}</p>
                  <p className="text-[10px] text-gray-500">Burn</p>
                </div>
              )}
              {data.contractPendingYield > 0n && (
                <div className="text-center">
                  <p className="text-xs text-yellow-400 font-mono">{formatAmount(data.contractPendingYield, tokenDecimals)}</p>
                  <p className="text-[10px] text-gray-500">Yield</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Token Mechanisms */}
      <div className="p-6 border-b border-gray-800">
        <h4 className="text-xs text-gray-400 font-rajdhani uppercase mb-3 flex items-center gap-2">
          <Flame size={12} className="text-orange-400" />
          Tax Distribution
        </h4>
        <div className="space-y-2">
          {data.treasuryShare > 0n && (
            <MechanismRow
              label="Treasury"
              share={formatShare(data.treasuryShare)}
              address={data.treasuryWallet}
              color="cyan"
            />
          )}
          {data.burnShare > 0n && (
            <MechanismRow
              label="Burn"
              share={formatShare(data.burnShare)}
              address={null}
              color="red"
            />
          )}
          {data.reflectionShare > 0n && (
            <MechanismRow
              label="Reflection"
              share={formatShare(data.reflectionShare)}
              address={null}
              color="green"
            />
          )}
          {data.liquidityShare > 0n && (
            <MechanismRow
              label="Liquidity"
              share={formatShare(data.liquidityShare)}
              address={data.lpPair}
              color="blue"
            />
          )}
          {data.yieldShare > 0n && (
            <MechanismRow
              label="Yield Token"
              share={formatShare(data.yieldShare)}
              address={data.yieldToken}
              color="yellow"
            />
          )}
          {data.supportShare > 0n && (
            <MechanismRow
              label="Support Token"
              share={formatShare(data.supportShare)}
              address={data.supportToken}
              color="purple"
            />
          )}
        </div>
      </div>

      {/* Token Owner */}
      {data.tokenOwner && !isZeroAddr(data.tokenOwner) && (
        <div className="p-6 border-t border-gray-800">
          <h4 className="text-xs text-gray-400 font-rajdhani uppercase mb-3 flex items-center gap-2">
            <Wallet size={12} className="text-purple-400" />
            Token Owner
          </h4>
          <a
            href={`https://scan.pulsechain.com/address/${data.tokenOwner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-mono transition-colors"
          >
            {shortAddr(data.tokenOwner)}
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

interface MechanismRowProps {
  label: string;
  share: string;
  address: Address | null;
  color: 'cyan' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
}

function MechanismRow({ label, share, address, color }: MechanismRowProps) {
  const colorClasses = {
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  };

  const isZero = !address || address === '0x0000000000000000000000000000000000000000';

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-900/30 rounded-lg">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-rajdhani ${colorClasses[color]}`}>{label}</span>
        <span className="text-xs text-gray-500 font-mono">{share}</span>
      </div>
      {!isZero && address && (
        <a
          href={`https://scan.pulsechain.com/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors font-mono"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

export default YourHoldingsPanel;
