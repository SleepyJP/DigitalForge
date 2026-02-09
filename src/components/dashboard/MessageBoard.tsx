'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import {
  SUPERCHAT_ADDRESS,
  SUPERCHAT_ABI,
  SUPERCHAT_TIERS,
  TIER_LABELS,
  TOKEN_BALANCE_ABI,
  formatAddress,
  formatTimeAgo,
  getTierColor,
  formatPLS,
  type SuperChatMessage,
} from '@/lib/chatContracts';

interface BoardMessage {
  id: string;
  sender: `0x${string}`;
  message: string;
  timestamp: number;
  isPaid: boolean;
  tier?: number;
  amount?: bigint;
  pinned?: boolean;
}

interface MessageBoardProps {
  tokenAddress: `0x${string}`;
}

export function MessageBoard({ tokenAddress }: MessageBoardProps) {
  const [message, setMessage] = useState('');
  const [localPosts, setLocalPosts] = useState<BoardMessage[]>([]);
  const [isPaidMode, setIsPaidMode] = useState(false);
  const [selectedTier, setSelectedTier] = useState(3);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { address, isConnected } = useAccount();

  const { data: tokenBalance } = useReadContract({
    address: tokenAddress,
    abi: TOKEN_BALANCE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi: TOKEN_BALANCE_ABI,
    functionName: 'totalSupply',
  });

  const { data: paidMessages } = useReadContract({
    address: SUPERCHAT_ADDRESS,
    abi: SUPERCHAT_ABI,
    functionName: 'getTokenSuperChats',
    args: [tokenAddress, 0n, 50n],
  });

  const { writeContract, isPending } = useWriteContract();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localPosts, paidMessages]);

  const allPosts = useMemo(() => {
    const paid: BoardMessage[] = ((paidMessages as SuperChatMessage[] | undefined) || [])
      .filter((m) => m.isMessageBoard)
      .map((m) => ({
        id: `paid-${Number(m.timestamp)}-${m.sender.slice(2, 8)}`,
        sender: m.sender,
        message: m.message.length > 2000 ? m.message.slice(0, 2000) + '...' : m.message,
        timestamp: Number(m.timestamp) || 0,
        isPaid: true,
        tier: Number(m.tier) || 0,
        amount: m.amount,
        pinned: (Number(m.tier) || 0) >= 5,
      }));

    const combined = [...localPosts, ...paid];
    const pinned = combined.filter((p) => p.pinned).sort((a, b) => b.timestamp - a.timestamp);
    const unpinned = combined.filter((p) => !p.pinned).sort((a, b) => b.timestamp - a.timestamp);
    return [...pinned, ...unpinned];
  }, [localPosts, paidMessages]);

  const sendFreePost = () => {
    if (!message.trim() || !address) return;
    setLocalPosts((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        sender: address,
        message: message.trim(),
        timestamp: Math.floor(Date.now() / 1000),
        isPaid: false,
      },
    ]);
    setMessage('');
  };

  const sendPaidPost = () => {
    if (!message.trim()) return;
    const amount = useCustom
      ? customAmount
      : (SUPERCHAT_TIERS[selectedTier] ?? 0).toString();
    if (!amount || Number(amount) <= 0) return;

    const parsedValue = parseEther(amount);
    writeContract({
      address: SUPERCHAT_ADDRESS,
      abi: SUPERCHAT_ABI,
      functionName: 'sendSuperChat',
      args: [tokenAddress, message, true],
      value: parsedValue,
    }, {
      onSuccess: () => {
        setMessage('');
        setIsPaidMode(false);
      },
    });
  };

  const handlePost = () => {
    if (isPaidMode) sendPaidPost();
    else sendFreePost();
  };

  const supply = totalSupply && (totalSupply as bigint) > 0n ? (totalSupply as bigint) : 0n;
  const onePercentThreshold = supply > 0n ? supply / 100n : 0n;
  const hasEnoughTokens = tokenBalance && supply > 0n && (tokenBalance as bigint) >= onePercentThreshold;
  const holdingPercent = tokenBalance && supply > 0n
    ? Number((tokenBalance as bigint) * 10000n / supply) / 100
    : 0;
  const posts = allPosts;

  const currentCost = useCustom ? customAmount : (SUPERCHAT_TIERS[selectedTier] ?? 0).toLocaleString();

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 flex flex-col overflow-hidden" style={{ maxHeight: 300 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10">
        <span className="font-orbitron text-xs font-bold text-cyan-400">MESSAGE BOARD</span>
        <span className="text-[10px] font-rajdhani text-gray-500">{posts.length} posts</span>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent min-h-[120px]">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <p className="text-gray-600 text-xs font-rajdhani">No posts yet. Be the first!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`rounded-xl p-4 transition-all ${
                post.pinned
                  ? 'border-l-4 bg-gradient-to-r'
                  : post.isPaid
                  ? 'border-l-4 bg-gradient-to-r from-black/70 to-black/40'
                  : 'bg-black/50 border border-gray-800'
              }`}
              style={
                post.isPaid
                  ? {
                      borderColor: getTierColor(post.tier || 3),
                      background: `linear-gradient(135deg, ${getTierColor(post.tier || 3)}15, rgba(0,0,0,0.6))`,
                    }
                  : undefined
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {post.pinned && <span className="text-yellow-400 text-xs">PINNED</span>}
                  {post.isPaid && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: getTierColor(post.tier || 3), color: '#000' }}
                    >
                      {post.tier}
                    </div>
                  )}
                  <span
                    className="text-sm font-rajdhani font-bold"
                    style={{ color: post.isPaid ? getTierColor(post.tier || 3) : '#e5e7eb' }}
                  >
                    {formatAddress(post.sender)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-rajdhani text-gray-400 block">{formatTimeAgo(post.timestamp)}</span>
                  {post.isPaid && post.amount && (
                    <span className="text-xs font-rajdhani font-semibold" style={{ color: getTierColor(post.tier || 3) }}>
                      {formatPLS(post.amount)} PLS
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-base leading-relaxed font-rajdhani ${post.isPaid ? 'text-white font-medium' : 'text-gray-200'}`}>
                {post.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isConnected && (
        <div className="p-3 border-t border-cyan-500/10 space-y-2">
          {/* Holding Status */}
          <div
            className={`text-[10px] font-rajdhani text-center py-1 rounded ${
              hasEnoughTokens ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'
            }`}
          >
            {hasEnoughTokens
              ? `Holding ${holdingPercent.toFixed(2)}% — Board unlocked`
              : `Hold 1% to post free (you have ${holdingPercent.toFixed(2)}%)`}
          </div>

          {/* Promoted Post Toggle */}
          <button
            onClick={() => setIsPaidMode(!isPaidMode)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-rajdhani transition-all ${
              isPaidMode
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-purple-400'
                : 'bg-black/40 border border-gray-700 text-gray-500 hover:border-gray-600'
            }`}
          >
            <span>{isPaidMode ? 'PROMOTED POST ON' : 'Enable Promoted Post'}</span>
            <span>{isPaidMode ? '▲' : '▼'}</span>
          </button>

          {/* Tier Selector */}
          {isPaidMode && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1">
                {[3, 4, 5, 6, 7, 8].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => { setSelectedTier(tier); setUseCustom(false); }}
                    className={`py-2 text-[10px] font-rajdhani font-bold rounded transition-all ${
                      !useCustom && selectedTier === tier ? 'text-black scale-105' : 'text-gray-500'
                    }`}
                    style={{
                      backgroundColor: !useCustom && selectedTier === tier ? getTierColor(tier) : 'transparent',
                      borderColor: getTierColor(tier),
                      borderWidth: 1,
                    }}
                  >
                    <div>{TIER_LABELS[tier]}</div>
                    {tier >= 5 && <div className="text-[8px] mt-0.5">PINNED</div>}
                  </button>
                ))}
              </div>
              {/* Custom Amount */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseCustom(!useCustom)}
                  className={`px-3 py-1.5 text-[10px] font-rajdhani font-bold rounded border transition-all ${
                    useCustom
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  CUSTOM
                </button>
                {useCustom && (
                  <input
                    type="number"
                    min="1000"
                    placeholder="PLS amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-black/60 border border-purple-500/30 rounded text-sm font-rajdhani text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60"
                  />
                )}
              </div>
            </div>
          )}

          {/* Text Input */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              !hasEnoughTokens && !isPaidMode
                ? 'Hold 1% to post or use Promoted Post...'
                : isPaidMode
                ? 'Write your promoted announcement...'
                : 'Post to the board...'
            }
            maxLength={500}
            rows={2}
            disabled={!hasEnoughTokens && !isPaidMode}
            className="w-full px-3 py-2 bg-black/60 border border-cyan-500/20 rounded-lg font-rajdhani text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Post Button */}
          <button
            onClick={handlePost}
            disabled={isPending || !message.trim() || (!hasEnoughTokens && !isPaidMode)}
            className={`w-full py-2.5 rounded-lg font-rajdhani text-sm font-bold transition-all ${
              isPaidMode
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400'
                : 'bg-cyan-500 text-black hover:bg-cyan-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPaidMode ? `Post (${currentCost} PLS)` : 'Post Free'}
          </button>

          <p className="text-[10px] font-rajdhani text-gray-600 text-center">
            {isPaidMode
              ? `Promoted Post: ${currentCost} PLS — highlighted & ${selectedTier >= 5 ? 'PINNED' : 'visible'}`
              : hasEnoughTokens
              ? 'Free post — no payment required'
              : 'Promoted Post available without holding requirement'}
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="p-3 border-t border-cyan-500/10">
          <p className="text-xs font-rajdhani text-gray-500 text-center">Connect wallet to post</p>
        </div>
      )}
    </div>
  );
}
