// ═══════════════════════════════════════════════════════════════
// DIGITAL FORGE — Chat System Config
// Uses the same SuperChat contract deployed on PulseChain
// ═══════════════════════════════════════════════════════════════

// SuperChat contract — shared with PUMP.FUD platform
export const SUPERCHAT_ADDRESS = '0x1139aD1e7088Ef50FC657EBF83E6A444DDee6b5F' as const;

// Super Chat tiers in PLS — premium pricing for Digital Forge
// Index 0 = free, then 8 paid tiers
export const SUPERCHAT_TIERS = [
  0,        // 0: free (requires 1% holding)
  10000,    // 1: 10K PLS
  25000,    // 2: 25K PLS
  50000,    // 3: 50K PLS
  75000,    // 4: 75K PLS
  100000,   // 5: 100K PLS
  250000,   // 6: 250K PLS
  500000,   // 7: 500K PLS
  1000000,  // 8: 1M PLS — LEGENDARY
] as const;

// Tier labels
export const TIER_LABELS: Record<number, string> = {
  1: '10K',
  2: '25K',
  3: '50K',
  4: '75K',
  5: '100K',
  6: '250K',
  7: '500K',
  8: '1M',
};

// 1% of total supply required for free chat
export const CHAT_THRESHOLD_BPS = 100;

export const SUPERCHAT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'string', name: 'message', type: 'string' },
      { internalType: 'bool', name: 'isMessageBoard', type: 'bool' },
    ],
    name: 'sendSuperChat',
    outputs: [{ internalType: 'uint256', name: 'messageId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getTokenSuperChats',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'string', name: 'message', type: 'string' },
          { internalType: 'uint256', name: 'tier', type: 'uint256' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'isMessageBoard', type: 'bool' },
        ],
        internalType: 'struct ISuperChat.SuperChatMessage[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Token ABI for balance checks
export const TOKEN_BALANCE_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Types
export interface SuperChatMessage {
  sender: `0x${string}`;
  token: `0x${string}`;
  message: string;
  tier: bigint;
  amount: bigint;
  timestamp: bigint;
  isMessageBoard: boolean;
}

// Helpers
export function formatAddress(address: string | undefined | null): string {
  if (!address) return '0x...';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimeAgo(timestamp: number | bigint): string {
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getTierColor(tier: number): string {
  const colors: Record<number, string> = {
    1: '#00F0FF', // 10K — cyan
    2: '#00FF88', // 25K — green
    3: '#9945FF', // 50K — purple
    4: '#FF00FF', // 75K — magenta
    5: '#FFD700', // 100K — gold
    6: '#FF6B00', // 250K — orange
    7: '#FF0055', // 500K — pink-red
    8: '#FF0000', // 1M — red (LEGENDARY)
  };
  return colors[tier] || '#ffffff';
}

export function getTierName(tier: number): string {
  const names: Record<number, string> = {
    1: '10K PLS',
    2: '25K PLS',
    3: '50K PLS',
    4: '75K PLS',
    5: '100K PLS',
    6: '250K PLS',
    7: '500K PLS',
    8: '1M PLS',
  };
  return names[tier] || 'Unknown';
}

export function formatPLS(value: bigint | undefined | null, decimals = 2): string {
  if (!value) return '0';
  const formatted = Number(value) / 1e18;
  if (formatted >= 1_000_000) return `${(formatted / 1_000_000).toFixed(decimals)}M`;
  if (formatted >= 1_000) return `${(formatted / 1_000).toFixed(decimals)}K`;
  return formatted.toFixed(decimals);
}
