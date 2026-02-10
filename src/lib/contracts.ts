import { Address, parseEther } from 'viem';

// Treasury Address - Hardcoded
export const TREASURY_ADDRESS: Address = '0x49bBEFa1d94702C0e9a5EAdDEc7c3C5D3eb9086B';

// Contract Addresses - DEPLOYED ON PULSECHAIN MAINNET
// V2 Factory with multi-address support (deployed 2026-02-05)
export const THE_DIGITAL_FORGE_ADDRESS: Address = '0x0F9eeD13C8820f7Ee6e46f3C383f40Ce4e540c84';
export const X402_FORGE_PAYMENT_ADDRESS: Address = '0x18E58358DE79048e6A2F2B21C0A950282CE6126c';
export const X402_FORGE_PROXY_ADDRESS: Address = '0x9D49446271B952d5158aBEceeFBF0Af733e97a5A';

// PulseChain Constants
export const WPLS_ADDRESS: Address = '0xA1077a294dDE1B09bB078844df40758a5D0f9a27';
export const PULSEX_V2_ROUTER: Address = '0x165C3410fC91EF562C50559f7d2289fEbed552d9';
export const PULSEX_V2_FACTORY: Address = '0x29eA7545DEf87022BAdc76323F373EA1e707C523';

// Fee Constants
export const CREATION_FEE = parseEther('100000'); // 100,000 PLS
export const SIMPLE_TOKEN_FEE = parseEther('50000'); // 50,000 PLS
export const MAX_TAX = 2500n; // 25% max per direction
export const BASIS_POINTS = 10000n;

// AddressShare struct for multi-address support
export interface AddressShare {
  addr: Address;
  share: bigint; // Share in basis points (must sum to 10000 within each mechanism)
}

// ForgeTokenConfig struct interface (V2 with multi-address support)
export interface ForgeTokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
  decimals: number;
  buyTax: bigint;
  sellTax: bigint;
  treasuryShare: bigint;
  burnShare: bigint;
  reflectionShare: bigint;
  liquidityShare: bigint;
  yieldShare: bigint;
  supportShare: bigint;
  treasuryWallets: AddressShare[]; // V2: Array of treasury wallets with shares
  yieldTokens: AddressShare[]; // V2: Array of yield tokens with shares
  supportTokens: AddressShare[]; // V2: Array of support tokens with shares
  router: Address;
  maxTxAmount: bigint;
  maxWalletAmount: bigint;
  antiBotEnabled: boolean;
  tradingEnabledOnLaunch: boolean;
}

// Default token config (V2)
export const DEFAULT_TOKEN_CONFIG: Partial<ForgeTokenConfig> = {
  decimals: 18,
  buyTax: 0n,
  sellTax: 0n,
  treasuryShare: 10000n, // 100% to treasury by default
  burnShare: 0n,
  reflectionShare: 0n,
  liquidityShare: 0n,
  yieldShare: 0n,
  supportShare: 0n,
  treasuryWallets: [{ addr: TREASURY_ADDRESS, share: 10000n }], // V2: Array with default treasury
  yieldTokens: [], // V2: Empty array by default
  supportTokens: [], // V2: Empty array by default
  router: '0x0000000000000000000000000000000000000000', // Use default router
  maxTxAmount: 0n, // No limit
  maxWalletAmount: 0n, // No limit
  antiBotEnabled: false,
  tradingEnabledOnLaunch: true,
};

// THE DIGITAL FORGE ABI
export const THE_DIGITAL_FORGE_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InsufficientFee',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidName',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSupply',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSymbol',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SharesMustEqual100',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TaxTooHigh',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAddress',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldFee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newFee', type: 'uint256' },
    ],
    name: 'CreationFeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'oldRouter', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newRouter', type: 'address' },
    ],
    name: 'DefaultRouterUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'FeesWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'string', name: 'symbol', type: 'string' },
      { indexed: false, internalType: 'string', name: 'tokenType', type: 'string' },
    ],
    name: 'TokenForged',
    type: 'event',
  },
  {
    inputs: [],
    name: 'BASIS_POINTS',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_TAX',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PULSEX_V2_FACTORY',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PULSEX_V2_ROUTER',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'TREASURY',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WPLS',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creationFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'creatorTokens',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'defaultRouter',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
          { internalType: 'uint8', name: 'decimals', type: 'uint8' },
          { internalType: 'uint256', name: 'buyTax', type: 'uint256' },
          { internalType: 'uint256', name: 'sellTax', type: 'uint256' },
          { internalType: 'uint256', name: 'treasuryShare', type: 'uint256' },
          { internalType: 'uint256', name: 'burnShare', type: 'uint256' },
          { internalType: 'uint256', name: 'reflectionShare', type: 'uint256' },
          { internalType: 'uint256', name: 'liquidityShare', type: 'uint256' },
          { internalType: 'uint256', name: 'yieldShare', type: 'uint256' },
          { internalType: 'uint256', name: 'supportShare', type: 'uint256' },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'uint256', name: 'share', type: 'uint256' },
            ],
            internalType: 'struct AddressShare[]',
            name: 'treasuryWallets',
            type: 'tuple[]',
          },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'uint256', name: 'share', type: 'uint256' },
            ],
            internalType: 'struct AddressShare[]',
            name: 'yieldTokens',
            type: 'tuple[]',
          },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'uint256', name: 'share', type: 'uint256' },
            ],
            internalType: 'struct AddressShare[]',
            name: 'supportTokens',
            type: 'tuple[]',
          },
          { internalType: 'address', name: 'router', type: 'address' },
          { internalType: 'uint256', name: 'maxTxAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'maxWalletAmount', type: 'uint256' },
          { internalType: 'bool', name: 'antiBotEnabled', type: 'bool' },
          { internalType: 'bool', name: 'tradingEnabledOnLaunch', type: 'bool' },
        ],
        internalType: 'struct TokenConfigV2',
        name: 'config',
        type: 'tuple',
      },
    ],
    name: 'forgeToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getAllTokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'creator', type: 'address' }],
    name: 'getCreatorTokens',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isForgedToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'rescueTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_fee', type: 'uint256' }],
    name: 'setCreationFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_router', type: 'address' }],
    name: 'setDefaultRouter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isWhitelisted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_treasury', type: 'address' }],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bool', name: 'status', type: 'bool' },
    ],
    name: 'setWhitelisted',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'tokens',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const;

// Standard ERC20 ABI for reading token data
export const ERC20_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
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
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Forged Tax Token ABI (V2/V3 compatible — array-based getters)
export const FORGED_TOKEN_ABI = [
  ...ERC20_ABI,
  // ═══ Tax Rates ═══
  { inputs: [], name: 'buyTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'sellTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'transferTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ Distribution Shares ═══
  { inputs: [], name: 'treasuryShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'burnShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'reflectionShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidityShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'yieldShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'supportShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ Array-Based Getters (V2/V3) — returns (address addr, uint256 share) ═══
  { inputs: [{ type: 'uint256' }], name: 'treasuryWallets', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'yieldTokens', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'supportTokens', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ Count Functions (V3) ═══
  { inputs: [], name: 'getTreasuryWalletsCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getYieldTokensCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getSupportTokensCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ DEX ═══
  { inputs: [], name: 'pair', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'router', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'wpls', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  // ═══ State Flags ═══
  { inputs: [], name: 'tradingEnabled', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'antiBotEnabled', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'swapEnabled', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'paused', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  // ═══ Limits ═══
  { inputs: [], name: 'maxTxAmount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'maxWalletAmount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'swapThreshold', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'swapThresholdMax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ Pending Accumulators ═══
  { inputs: [], name: 'pendingTreasury', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingBurn', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingReflection', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingLiquidity', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingYield', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingSupport', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getAllPending', outputs: [{ name: 'treasury_', type: 'uint256' }, { name: 'burn_', type: 'uint256' }, { name: 'reflection_', type: 'uint256' }, { name: 'liquidity_', type: 'uint256' }, { name: 'yield_', type: 'uint256' }, { name: 'support_', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ Stats ═══
  { inputs: [], name: 'totalReflected', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }], name: 'totalYieldDistributed', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getHolderCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ User Yield ═══
  { inputs: [{ name: 'account', type: 'address' }, { name: 'token', type: 'address' }], name: 'getPendingYield', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }, { type: 'address' }], name: 'pendingYieldReward', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ═══ Exclusions ═══
  { inputs: [{ type: 'address' }], name: 'isExcludedFromFee', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }], name: 'isExcludedFromLimit', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }], name: 'isExcludedFromReflection', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }], name: 'isBlacklisted', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }], name: 'isPair', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidityRecipient', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'factory', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  // ═══ Owner Write Functions ═══
  { inputs: [], name: 'enableTrading', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'disableTrading', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_buy', type: 'uint256' }, { name: '_sell', type: 'uint256' }], name: 'setTaxes', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_tax', type: 'uint256' }], name: 'setTransferTax', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_treasury', type: 'uint256' }, { name: '_burn', type: 'uint256' }, { name: '_reflection', type: 'uint256' }, { name: '_liquidity', type: 'uint256' }, { name: '_yield', type: 'uint256' }, { name: '_support', type: 'uint256' }], name: 'setShares', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_max', type: 'uint256' }], name: 'setMaxTxAmount', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_max', type: 'uint256' }], name: 'setMaxWalletAmount', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_maxTx', type: 'uint256' }, { name: '_maxWallet', type: 'uint256' }], name: 'setLimits', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'removeLimits', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_enabled', type: 'bool' }], name: 'setSwapEnabled', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_threshold', type: 'uint256' }], name: 'setSwapThreshold', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_max', type: 'uint256' }], name: 'setSwapThresholdMax', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_threshold', type: 'uint256' }, { name: '_max', type: 'uint256' }, { name: '_enabled', type: 'bool' }], name: 'setSwapSettings', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_router', type: 'address' }], name: 'setRouter', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_pair', type: 'address' }, { name: '_isPair', type: 'bool' }], name: 'setPair', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_recipient', type: 'address' }], name: 'setLiquidityRecipient', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }], name: 'setTreasuryWallets', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }], name: 'setYieldTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }], name: 'setSupportTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }, { name: 'excluded', type: 'bool' }], name: 'setExcludedFromFee', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }, { name: 'excluded', type: 'bool' }], name: 'setExcludedFromLimit', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }, { name: 'excluded', type: 'bool' }], name: 'setExcludedFromReflection', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }, { name: 'blacklisted_', type: 'bool' }], name: 'setBlacklist', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'enabled', type: 'bool' }], name: 'setAntiBot', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'excluded', type: 'bool' }], name: 'setExcludedFromFeeBatch', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'blacklisted_', type: 'bool' }], name: 'setBlacklistBatch', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  // ═══ Manual Triggers ═══
  { inputs: [], name: 'manualSwapback', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualBurn', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualReflection', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualSwapAndSendTreasury', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualSwapAndBuyYield', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualSwapAndBuySupport', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualSwapAndAddLiquidity', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  // ═══ Yield Claiming ═══
  { inputs: [{ name: 'token', type: 'address' }], name: 'claimYield', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'claimAllYield', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  // ═══ Rescue ═══
  { inputs: [], name: 'rescueETH', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'rescueTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'rescueSelfTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'resetAccumulators', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;
