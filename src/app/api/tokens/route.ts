import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { pulsechain } from 'viem/chains';

// Factory contract
const FORGE_ADDRESS = '0x0F9eeD13C8820f7Ee6e46f3C383f40Ce4e540c84' as const;

const FORGE_ABI = [
  {
    inputs: [],
    name: 'tokenCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
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
] as const;

const ERC20_ABI = [
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
] as const;

const TAX_ABI = [
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
    name: 'tradingEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const client = createPublicClient({
  chain: pulsechain,
  transport: http('https://rpc.pulsechain.com'),
});

const PITEAS_LOGO_CDN = 'https://raw.githubusercontent.com/piteasio/app-tokens/main/token-logo';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const tokenCount = await client.readContract({
      address: FORGE_ADDRESS,
      abi: FORGE_ABI,
      functionName: 'tokenCount',
    });

    const count = Number(tokenCount);
    if (count === 0) {
      return NextResponse.json({ tokens: [], count: 0 });
    }

    // Fetch all token addresses
    const addresses = await client.readContract({
      address: FORGE_ADDRESS,
      abi: FORGE_ABI,
      functionName: 'getAllTokens',
      args: [0n, BigInt(count)],
    });

    // Batch read ERC20 data + tax data for all tokens
    const calls = addresses.flatMap((addr) => [
      { address: addr, abi: ERC20_ABI, functionName: 'name' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'symbol' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'decimals' as const },
      { address: addr, abi: ERC20_ABI, functionName: 'totalSupply' as const },
      { address: addr, abi: TAX_ABI, functionName: 'buyTax' as const },
      { address: addr, abi: TAX_ABI, functionName: 'sellTax' as const },
      { address: addr, abi: TAX_ABI, functionName: 'tradingEnabled' as const },
    ]);

    const results = await client.multicall({ contracts: calls });

    const tokens = addresses.map((addr, i) => {
      const base = i * 7;
      const name = results[base]?.status === 'success' ? (results[base].result as string) : 'Unknown';
      const symbol = results[base + 1]?.status === 'success' ? (results[base + 1].result as string) : '???';
      const decimals = results[base + 2]?.status === 'success' ? Number(results[base + 2].result) : 18;
      const totalSupply = results[base + 3]?.status === 'success' ? (results[base + 3].result as bigint) : 0n;
      const buyTax = results[base + 4]?.status === 'success' ? Number(results[base + 4].result) : 0;
      const sellTax = results[base + 5]?.status === 'success' ? Number(results[base + 5].result) : 0;
      const tradingEnabled = results[base + 6]?.status === 'success' ? (results[base + 6].result as boolean) : false;

      return {
        address: addr,
        name,
        symbol,
        decimals,
        totalSupply: formatUnits(totalSupply, decimals),
        buyTax: buyTax / 100, // basis points to %
        sellTax: sellTax / 100,
        tradingEnabled,
        logo: `${PITEAS_LOGO_CDN}/${addr}.png`,
        dashboardUrl: `https://digital-forge-gamma.vercel.app/tokens/${addr}`,
        source: 'digital-forge',
      };
    });

    return NextResponse.json(
      { tokens, count },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Token list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token list', tokens: [], count: 0 },
      { status: 500 }
    );
  }
}
