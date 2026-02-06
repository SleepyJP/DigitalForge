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

// Forged Tax Token ABI (extended ERC20 with tax features)
export const FORGED_TOKEN_ABI = [
  ...ERC20_ABI,
  {
    inputs: [],
    name: 'buyTax',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'sellTax',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasuryShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'burnShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reflectionShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'liquidityShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'supportShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasuryWallet',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'supportToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tradingEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'antiBotEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxTxAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxWalletAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalBurned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalReflections',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalYieldDistributed',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'pendingReflections',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'pendingYield',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpPair',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Owner functions
  {
    inputs: [],
    name: 'enableTrading',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creator',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
