import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, isAddress, type Address } from 'viem';
import { pulsechain } from 'viem/chains';

const FORGE_ADDRESS = '0x0F9eeD13C8820f7Ee6e46f3C383f40Ce4e540c84' as const;

const FORGE_ABI = [
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isForgedToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const TOKEN_ABI = [
  { inputs: [], name: 'name', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'buyTax', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'sellTax', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'tradingEnabled', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'treasuryWallet', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'treasuryShare', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'burnShare', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'reflectionShare', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidityShare', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'yieldShare', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'supportShare', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'yieldToken', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'supportToken', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'lpPair', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'creator', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

const client = createPublicClient({
  chain: pulsechain,
  transport: http('https://rpc.pulsechain.com'),
});

const PITEAS_LOGO_CDN = 'https://raw.githubusercontent.com/piteasio/app-tokens/main/token-logo';

export const revalidate = 60; // Cache for 1 minute

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

    // Read all token data in one multicall
    const fns = [
      'name', 'symbol', 'decimals', 'totalSupply',
      'buyTax', 'sellTax', 'tradingEnabled',
      'treasuryWallet', 'treasuryShare', 'burnShare',
      'reflectionShare', 'liquidityShare', 'yieldShare', 'supportShare',
      'yieldToken', 'supportToken', 'lpPair', 'creator', 'owner',
    ] as const;

    const calls = fns.map((fn) => ({
      address: address as Address,
      abi: TOKEN_ABI,
      functionName: fn,
    }));

    const results = await client.multicall({ contracts: calls });

    const get = (i: number) => results[i]?.status === 'success' ? results[i].result : null;

    const decimals = get(2) !== null ? Number(get(2)) : 18;
    const totalSupply = get(3) !== null ? (get(3) as bigint) : 0n;

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
      treasuryWallet: get(7) || null,
      distribution: {
        treasury: get(8) !== null ? Number(get(8)) / 100 : 0,
        burn: get(9) !== null ? Number(get(9)) / 100 : 0,
        reflection: get(10) !== null ? Number(get(10)) / 100 : 0,
        liquidity: get(11) !== null ? Number(get(11)) / 100 : 0,
        yield: get(12) !== null ? Number(get(12)) / 100 : 0,
        support: get(13) !== null ? Number(get(13)) / 100 : 0,
      },
      yieldToken: get(14) || null,
      supportToken: get(15) || null,
      lpPair: get(16) || null,
      creator: get(17) || null,
      owner: get(18) || null,
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
