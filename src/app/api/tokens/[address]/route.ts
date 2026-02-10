import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, isAddress, type Address } from 'viem';
import { pulsechain } from 'viem/chains';

const FORGE_ADDRESS = '0x0F9eeD13C8820f7Ee6e46f3C383f40Ce4e540c84' as const;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as Address;
const MAX_ARRAY_READ = 10;

const FORGE_ABI = [
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isForgedToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// V2/V3 compatible ABI — array-based getters, correct function names
const TOKEN_ABI = [
  { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'buyTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'sellTax', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'tradingEnabled', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'treasuryShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'burnShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'reflectionShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidityShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'yieldShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'supportShare', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pair', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalReflected', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'swapEnabled', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'swapThreshold', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingTreasury', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingBurn', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingReflection', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingLiquidity', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingYield', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'pendingSupport', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // Array-based getters
  { inputs: [{ type: 'uint256' }], name: 'treasuryWallets', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'yieldTokens', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'supportTokens', outputs: [{ name: 'addr', type: 'address' }, { name: 'share', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

const client = createPublicClient({
  chain: pulsechain,
  transport: http('https://rpc.pulsechain.com'),
});

const PITEAS_LOGO_CDN = 'https://raw.githubusercontent.com/piteasio/app-tokens/main/token-logo';

export const revalidate = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    // Check if it's a forged token
    const isForged = await client.readContract({
      address: FORGE_ADDRESS,
      abi: FORGE_ABI,
      functionName: 'isForgedToken',
      args: [address as Address],
    });

    if (!isForged) {
      return NextResponse.json(
        { error: 'Not a Digital Forge token', isForged: false },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Phase 1: Scalar values
    const scalarFns = [
      'name', 'symbol', 'decimals', 'totalSupply',         // 0-3
      'buyTax', 'sellTax', 'tradingEnabled',                // 4-6
      'treasuryShare', 'burnShare', 'reflectionShare',      // 7-9
      'liquidityShare', 'yieldShare', 'supportShare',       // 10-12
      'pair', 'owner', 'totalReflected',                    // 13-15
      'swapEnabled', 'swapThreshold',                       // 16-17
      'pendingTreasury', 'pendingBurn', 'pendingReflection', // 18-20
      'pendingLiquidity', 'pendingYield', 'pendingSupport', // 21-23
    ] as const;

    const scalarCalls = scalarFns.map((fn) => ({
      address: address as Address,
      abi: TOKEN_ABI,
      functionName: fn,
    }));

    // Phase 2: Array entries (treasury wallets, yield tokens, support tokens)
    const arrayCalls = [
      ...Array.from({ length: MAX_ARRAY_READ }, (_, i) => ({
        address: address as Address, abi: TOKEN_ABI, functionName: 'treasuryWallets' as const, args: [BigInt(i)],
      })),
      ...Array.from({ length: MAX_ARRAY_READ }, (_, i) => ({
        address: address as Address, abi: TOKEN_ABI, functionName: 'yieldTokens' as const, args: [BigInt(i)],
      })),
      ...Array.from({ length: MAX_ARRAY_READ }, (_, i) => ({
        address: address as Address, abi: TOKEN_ABI, functionName: 'supportTokens' as const, args: [BigInt(i)],
      })),
    ];

    const [scalarResults, arrayResults] = await Promise.all([
      client.multicall({ contracts: scalarCalls }),
      client.multicall({ contracts: arrayCalls }),
    ]);

    const get = (i: number) => scalarResults[i]?.status === 'success' ? scalarResults[i].result : null;

    const decimals = get(2) !== null ? Number(get(2)) : 18;
    const totalSupply = get(3) !== null ? (get(3) as bigint) : 0n;

    // Parse array entries
    const parseArray = (offset: number): { address: string; share: number }[] => {
      const entries: { address: string; share: number }[] = [];
      for (let i = 0; i < MAX_ARRAY_READ; i++) {
        const entry = arrayResults[offset + i];
        if (entry?.status === 'success' && entry.result) {
          const [addr, share] = entry.result as [Address, bigint];
          if (addr && addr !== ZERO_ADDR) {
            entries.push({ address: addr, share: Number(share) / 100 });
          }
        } else break;
      }
      return entries;
    };

    const treasuryWallets = parseArray(0);
    const yieldTokens = parseArray(MAX_ARRAY_READ);
    const supportTokens = parseArray(MAX_ARRAY_READ * 2);

    const token = {
      isForged: true,
      address,
      name: get(0) || 'Unknown',
      symbol: get(1) || '???',
      decimals,
      totalSupply: formatUnits(totalSupply, decimals),
      buyTax: get(4) !== null ? Number(get(4)) / 100 : 0,
      sellTax: get(5) !== null ? Number(get(5)) / 100 : 0,
      tradingEnabled: get(6) ?? false,
      distribution: {
        treasury: get(7) !== null ? Number(get(7)) / 100 : 0,
        burn: get(8) !== null ? Number(get(8)) / 100 : 0,
        reflection: get(9) !== null ? Number(get(9)) / 100 : 0,
        liquidity: get(10) !== null ? Number(get(10)) / 100 : 0,
        yield: get(11) !== null ? Number(get(11)) / 100 : 0,
        support: get(12) !== null ? Number(get(12)) / 100 : 0,
      },
      treasuryWallets,
      yieldTokens,
      supportTokens,
      pair: get(13) || null,
      owner: get(14) || null,
      totalReflected: get(15) !== null ? formatUnits(get(15) as bigint, decimals) : '0',
      swapEnabled: get(16) ?? true,
      swapThreshold: get(17) !== null ? formatUnits(get(17) as bigint, decimals) : '0',
      pending: {
        treasury: get(18) !== null ? formatUnits(get(18) as bigint, decimals) : '0',
        burn: get(19) !== null ? formatUnits(get(19) as bigint, decimals) : '0',
        reflection: get(20) !== null ? formatUnits(get(20) as bigint, decimals) : '0',
        liquidity: get(21) !== null ? formatUnits(get(21) as bigint, decimals) : '0',
        yield: get(22) !== null ? formatUnits(get(22) as bigint, decimals) : '0',
        support: get(23) !== null ? formatUnits(get(23) as bigint, decimals) : '0',
      },
      logo: `${PITEAS_LOGO_CDN}/${address}.png`,
      dashboardUrl: `https://digital-forge-gamma.vercel.app/tokens/${address}`,
      source: 'digital-forge',
    };

    return NextResponse.json(token, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Token API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
