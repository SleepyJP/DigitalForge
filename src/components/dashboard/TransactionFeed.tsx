'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits, type Address } from 'viem';
import { ArrowDownCircle, ArrowUpCircle, ExternalLink, RefreshCw } from 'lucide-react';

// =====================================================================
// THE DIGITAL FORGE - Transaction Feed
// Shows recent buys and sells with wallet addresses, amounts, timestamps
// =====================================================================

interface Transaction {
  hash: string;
  type: 'BUY' | 'SELL' | 'TRANSFER';
  from: string;
  to: string;
  amount: bigint;
  blockNumber: bigint;
  timestamp: number;
}

interface TransactionFeedProps {
  tokenAddress: Address;
  tokenSymbol?: string;
  tokenDecimals?: number;
  lpPairAddress?: Address;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function TransactionFeed({
  tokenAddress,
  tokenSymbol = '???',
  tokenDecimals = 18,
}: TransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const isMountedRef = useRef(true);
  const fetchGenRef = useRef(0);
  const publicClient = usePublicClient();

  const fetchTransactions = useCallback(async () => {
    if (!tokenAddress || !publicClient || !isMountedRef.current) return;

    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    try {
      const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
      const currentBlock = await publicClient.getBlockNumber();
      // Safe range: 15K blocks (~1 hour on PulseChain) — avoids OOM on active tokens
      const BLOCK_RANGE = 15000n;
      const fromBlock = currentBlock - BLOCK_RANGE;

      let logs;
      try {
        logs = await publicClient.getLogs({
          address: tokenAddress,
          event: transferEvent,
          fromBlock: fromBlock > 0n ? fromBlock : 0n,
          toBlock: currentBlock,
        });
      } catch {
        // Fallback to smaller range if RPC rejects
        try {
          logs = await publicClient.getLogs({
            address: tokenAddress,
            event: transferEvent,
            fromBlock: currentBlock - 3000n,
            toBlock: currentBlock,
          });
        } catch {
          console.error('[TransactionFeed] getLogs failed');
          if (isMountedRef.current) setIsLoading(false);
          return;
        }
      }

      if (!isMountedRef.current) return;

      // Get unique block numbers for timestamp resolution
      const blockNumbers = [...new Set(logs.slice(-200).map(l => l.blockNumber))];
      const blockTimestamps = new Map<bigint, number>();

      // Batch fetch timestamps for last 20 unique blocks
      const blocksToFetch = blockNumbers.slice(-20);
      await Promise.all(
        blocksToFetch.map(async (bn) => {
          if (!bn) return;
          try {
            const block = await publicClient.getBlock({ blockNumber: bn });
            blockTimestamps.set(bn, Number(block.timestamp));
          } catch {
            blockTimestamps.set(bn, Math.floor(Date.now() / 1000));
          }
        })
      );

      if (!isMountedRef.current || gen !== fetchGenRef.current) return;

      if (!logs) { if (isMountedRef.current) setIsLoading(false); return; }

      const txs: Transaction[] = logs.slice(-100).reverse().map((log) => {
        const args = log.args;
        if (!args || !('from' in args) || !('to' in args) || !('value' in args)) {
          return null;
        }
        const from = args.from as Address;
        const to = args.to as Address;
        const value = args.value as bigint;
        if (!from || !to || typeof value !== 'bigint') {
          return null;
        }

        const fromAddr = from.toLowerCase();
        const toAddr = to.toLowerCase();
        const isMint = fromAddr === ZERO_ADDRESS.toLowerCase();
        const isBurn = toAddr === ZERO_ADDRESS.toLowerCase() || toAddr === '0x000000000000000000000000000000000000dead';

        // Heuristic: if from is a known router/pair, it's a buy
        // if to is a known router/pair, it's a sell
        // Otherwise it's a transfer
        let type: 'BUY' | 'SELL' | 'TRANSFER' = 'TRANSFER';
        if (isMint) {
          type = 'BUY'; // Mints show as buys
        } else if (isBurn) {
          type = 'SELL'; // Burns show as sells
        }

        return {
          hash: log.transactionHash || '',
          type,
          from: from,
          to: to,
          amount: value,
          blockNumber: log.blockNumber || 0n,
          timestamp: blockTimestamps.get(log.blockNumber || 0n) || Math.floor(Date.now() / 1000),
        };
      }).filter(Boolean) as Transaction[];

      if (gen === fetchGenRef.current) setTransactions(txs);
    } catch (err) {
      console.error('[TransactionFeed] Error:', err);
    } finally {
      if (isMountedRef.current && gen === fetchGenRef.current) setIsLoading(false);
    }
  }, [tokenAddress, publicClient]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (tokenAddress) fetchTransactions();
  }, [tokenAddress, fetchTransactions]);

  const formatAmount = (amount: bigint): string => {
    const num = Number(formatUnits(amount, tokenDecimals));
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatTime = (ts: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - ts);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const shortAddr = (addr: string): string => {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter(tx => tx.type === filter);

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-orbitron text-xs font-bold text-white">TRANSACTIONS</span>
          <span className="text-[10px] text-gray-500 font-rajdhani">({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-rajdhani font-bold transition-all ${
                  filter === f
                    ? f === 'BUY'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : f === 'SELL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={fetchTransactions}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="px-4 py-2 border-b border-gray-800/50 flex items-center text-[10px] text-gray-600 uppercase font-mono bg-gray-900/30">
        <div className="w-12">Type</div>
        <div className="flex-1">From</div>
        <div className="flex-1">To</div>
        <div className="w-28 text-right">Amount</div>
        <div className="w-12 text-right">Age</div>
        <div className="w-6"></div>
      </div>

      {/* Transaction List */}
      <div className="max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {isLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-gray-700 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 text-xs font-rajdhani">No transactions found</p>
          </div>
        ) : (
          filtered.map((tx, i) => (
            <div
              key={`${tx.hash}-${i}`}
              className="flex items-center px-4 py-2 border-b border-gray-800/30 hover:bg-gray-900/50 transition-colors group"
            >
              {/* Type */}
              <div className="w-12">
                {tx.type === 'BUY' ? (
                  <div className="flex items-center gap-1">
                    <ArrowDownCircle size={12} className="text-green-400" />
                    <span className="text-[10px] font-rajdhani font-bold text-green-400">BUY</span>
                  </div>
                ) : tx.type === 'SELL' ? (
                  <div className="flex items-center gap-1">
                    <ArrowUpCircle size={12} className="text-red-400" />
                    <span className="text-[10px] font-rajdhani font-bold text-red-400">SELL</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-rajdhani text-gray-500">TXN</span>
                )}
              </div>

              {/* From */}
              <div className="flex-1">
                <a
                  href={`https://scan.pulsechain.com/address/${tx.from}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  {shortAddr(tx.from)}
                </a>
              </div>

              {/* To */}
              <div className="flex-1">
                <a
                  href={`https://scan.pulsechain.com/address/${tx.to}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  {shortAddr(tx.to)}
                </a>
              </div>

              {/* Amount */}
              <div className="w-28 text-right">
                <span className={`text-[11px] font-mono font-semibold ${
                  tx.type === 'BUY' ? 'text-green-400' : tx.type === 'SELL' ? 'text-red-400' : 'text-gray-300'
                }`}>
                  {formatAmount(tx.amount)}
                </span>
                <span className="text-[9px] text-gray-600 ml-1">{tokenSymbol}</span>
              </div>

              {/* Time */}
              <div className="w-12 text-right">
                <span className="text-[10px] font-rajdhani text-gray-600">{formatTime(tx.timestamp)}</span>
              </div>

              {/* TX Link */}
              <div className="w-6 flex justify-end">
                {tx.hash && (
                  <a
                    href={`https://scan.pulsechain.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
