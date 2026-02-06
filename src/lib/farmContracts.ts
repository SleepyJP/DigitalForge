import { Address, parseEther } from 'viem';

// ═══════════════════════════════════════════════════════════════
// PAISLEY FARMS — Contract Config
// Update FACTORY_ADDRESS after deployment to PulseChain mainnet
// ═══════════════════════════════════════════════════════════════

// TODO: Replace after deployment
export const FARM_FACTORY_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

export const FARM_CREATION_FEE = parseEther('500000'); // 500,000 PLS

// ═══════════════════════════════════════════════════════════════
// FARM FACTORY ABI
// ═══════════════════════════════════════════════════════════════

export const FARM_FACTORY_ABI = [
  // Read
  {
    name: 'farmCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'farms',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'isFarm',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isFarmRemoved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isWhitelisted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'creationFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'treasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getAllFarms',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    name: 'getCreatorFarms',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'farmInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'farmId', type: 'uint256' },
      { name: 'farmAddress', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'stakeToken', type: 'address' },
      { name: 'rewardToken', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  // Write
  {
    name: 'createFarm',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_stakeToken', type: 'address' },
      { name: '_rewardToken', type: 'address' },
      { name: '_depositFeeBps', type: 'uint256' },
      { name: '_withdrawalFeeBps', type: 'uint256' },
      { name: '_durationDays', type: 'uint256' },
      { name: '_rewardAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

// ═══════════════════════════════════════════════════════════════
// FARM POOL ABI (individual pool contract)
// ═══════════════════════════════════════════════════════════════

export const FARM_POOL_ABI = [
  // Read
  {
    name: 'stakeToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'rewardToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'depositFeeBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'withdrawalFeeBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'startTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'endTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalStaked',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalRewardAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'rewardPerSecond',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'stakerCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'active',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'creator',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalFeesCollected',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalRewardsPaid',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pendingReward',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'timeLeft',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getFarmInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '_stakeToken', type: 'address' },
      { name: '_rewardToken', type: 'address' },
      { name: '_depositFeeBps', type: 'uint256' },
      { name: '_withdrawalFeeBps', type: 'uint256' },
      { name: '_startTime', type: 'uint256' },
      { name: '_endTime', type: 'uint256' },
      { name: '_totalStaked', type: 'uint256' },
      { name: '_totalRewardAmount', type: 'uint256' },
      { name: '_rewardPerSecond', type: 'uint256' },
      { name: '_stakerCount', type: 'uint256' },
      { name: '_active', type: 'bool' },
      { name: '_creator', type: 'address' },
    ],
  },
  {
    name: 'getUserInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      { name: '_staked', type: 'uint256' },
      { name: '_pending', type: 'uint256' },
      { name: '_totalClaimed', type: 'uint256' },
    ],
  },
  // Write
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'emergencyWithdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'recharge',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'extend',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_additionalDays', type: 'uint256' },
      { name: '_additionalRewards', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// ═══════════════════════════════════════════════════════════════
// ERC20 ABI (for approve + balance checks)
// ═══════════════════════════════════════════════════════════════

export const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface FarmPoolData {
  farmId: number;
  address: Address;
  creator: Address;
  stakeToken: Address;
  rewardToken: Address;
  stakeTokenSymbol: string;
  stakeTokenDecimals: number;
  rewardTokenSymbol: string;
  rewardTokenDecimals: number;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  startTime: number;
  endTime: number;
  totalStaked: bigint;
  totalRewardAmount: bigint;
  rewardPerSecond: bigint;
  stakerCount: number;
  active: boolean;
  createdAt: number;
}

export interface UserFarmPosition {
  staked: bigint;
  pending: bigint;
  totalClaimed: bigint;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function formatTokenAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');
  return fractionStr ? `${whole.toLocaleString()}.${fractionStr}` : whole.toLocaleString();
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Ended';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function calculateAPR(
  rewardPerSecond: bigint,
  totalStaked: bigint,
  rewardDecimals: number,
  stakeDecimals: number
): number {
  if (totalStaked === 0n) return 0;
  const yearlyRewards = rewardPerSecond * BigInt(365 * 24 * 3600);
  // Normalize to same decimal basis
  const normalizedRewards = Number(yearlyRewards) / 10 ** rewardDecimals;
  const normalizedStaked = Number(totalStaked) / 10 ** stakeDecimals;
  if (normalizedStaked === 0) return 0;
  return (normalizedRewards / normalizedStaked) * 100;
}
