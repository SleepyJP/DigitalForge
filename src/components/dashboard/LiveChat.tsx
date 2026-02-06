'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  getTierName,
  type SuperChatMessage,
} from '@/lib/chatContracts';

interface ChatMessage {
  id: string;
  sender: `0x${string}`;
  message: string;
  timestamp: number;
  isSuperChat: boolean;
  tier?: number;
  amount?: bigint;
}

function getAvatarColors(address: string): { bg: string; fg: string } {
  const hash = address.slice(2, 10);
  const hue = parseInt(hash.slice(0, 2), 16) * 1.4;
  const sat = 60 + (parseInt(hash.slice(2, 4), 16) % 30);
  const light = 45 + (parseInt(hash.slice(4, 6), 16) % 15);
  return {
    bg: `hsl(${hue}, ${sat}%, ${light}%)`,
    fg: light > 55 ? '#000' : '#fff',
  };
}

function WalletAvatar({ address, size = 28 }: { address: string; size?: number }) {
  const colors = getAvatarColors(address);
  const initials = address.slice(2, 4).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-mono font-bold"
      style={{ width: size, height: size, backgroundColor: colors.bg, color: colors.fg, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

interface LiveChatProps {
  tokenAddress: `0x${string}`;
}

export function LiveChat({ tokenAddress }: LiveChatProps) {
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isSuperChatMode, setIsSuperChatMode] = useState(false);
  const [selectedTier, setSelectedTier] = useState(1);
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

  const { data: superChatMessages } = useReadContract({
    address: SUPERCHAT_ADDRESS,
    abi: SUPERCHAT_ABI,
    functionName: 'getTokenSuperChats',
    args: [tokenAddress, 0n, 100n],
  });

  const { writeContract, isPending } = useWriteContract();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, superChatMessages]);

  const allMessages = useCallback(() => {
    const supChats: ChatMessage[] = ((superChatMessages as SuperChatMessage[] | undefined) || [])
      .filter((m) => !m.isMessageBoard)
      .map((m, i) => ({
        id: `sc-${i}`,
        sender: m.sender,
        message: m.message,
        timestamp: Number(m.timestamp),
        isSuperChat: true,
        tier: Number(m.tier),
        amount: m.amount,
      }));
    return [...localMessages, ...supChats].sort((a, b) => a.timestamp - b.timestamp);
  }, [localMessages, superChatMessages]);

  const sendFreeMessage = () => {
    if (!message.trim() || !address) return;
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        sender: address,
        message: message.trim(),
        timestamp: Math.floor(Date.now() / 1000),
        isSuperChat: false,
      },
    ]);
    setMessage('');
  };

  const sendSuperChat = () => {
    if (!message.trim()) return;
    const amount = useCustom
      ? customAmount
      : (SUPERCHAT_TIERS[selectedTier] ?? 0).toString();
    if (!amount || Number(amount) <= 0) return;

    writeContract({
      address: SUPERCHAT_ADDRESS,
      abi: SUPERCHAT_ABI,
      functionName: 'sendSuperChat',
      args: [tokenAddress, message, false],
      value: parseEther(amount),
    });
    setMessage('');
    setIsSuperChatMode(false);
  };

  const handleSend = () => {
    if (isSuperChatMode) sendSuperChat();
    else sendFreeMessage();
  };

  const onePercentThreshold = totalSupply ? (totalSupply as bigint) / 100n : 0n;
  const hasEnoughTokens = tokenBalance && totalSupply && (tokenBalance as bigint) >= onePercentThreshold;
  const holdingPercent = tokenBalance && totalSupply
    ? Number((tokenBalance as bigint) * 10000n / (totalSupply as bigint)) / 100
    : 0;
  const messages = allMessages();

  const currentCost = useCustom ? customAmount : (SUPERCHAT_TIERS[selectedTier] ?? 0).toLocaleString();

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 flex flex-col overflow-hidden" style={{ maxHeight: 500 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-orbitron text-xs font-bold text-cyan-400">LIVE CHAT</span>
        </div>
        <span className="text-[10px] font-rajdhani text-gray-500">{messages.length} msgs</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent min-h-[120px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-xs font-rajdhani">No messages yet. Be the first!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-2.5 transition-all ${
                msg.isSuperChat ? 'border-l-2 bg-gradient-to-r from-black/60 to-transparent' : 'bg-black/30'
              }`}
              style={msg.isSuperChat ? { borderColor: getTierColor(msg.tier || 1) } : undefined}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <WalletAvatar address={msg.sender} size={20} />
                  {msg.isSuperChat && (
                    <span
                      className="text-[9px] font-rajdhani font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${getTierColor(msg.tier || 1)}20`,
                        color: getTierColor(msg.tier || 1),
                      }}
                    >
                      {getTierName(msg.tier || 1)}
                    </span>
                  )}
                  <span
                    className="text-xs font-rajdhani font-semibold"
                    style={{ color: msg.isSuperChat ? getTierColor(msg.tier || 1) : '#9ca3af' }}
                  >
                    {formatAddress(msg.sender)}
                  </span>
                </div>
                <span className="text-[10px] font-rajdhani text-gray-600">{formatTimeAgo(BigInt(msg.timestamp))}</span>
              </div>
              <p className={`text-sm font-rajdhani ${msg.isSuperChat ? 'text-white' : 'text-gray-300'}`}>
                {msg.message}
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
              ? `Holding ${holdingPercent.toFixed(2)}% — Chat unlocked`
              : `Hold 1% to chat free (you have ${holdingPercent.toFixed(2)}%)`}
          </div>

          {/* Super Chat Toggle */}
          <button
            onClick={() => setIsSuperChatMode(!isSuperChatMode)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-rajdhani transition-all ${
              isSuperChatMode
                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-400'
                : 'bg-black/40 border border-gray-700 text-gray-500 hover:border-gray-600'
            }`}
          >
            <span>{isSuperChatMode ? 'SUPER CHAT ON' : 'Super Chat (paid highlight)'}</span>
            <span>{isSuperChatMode ? '▲' : '▼'}</span>
          </button>

          {/* Tier Selection */}
          {isSuperChatMode && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => { setSelectedTier(tier); setUseCustom(false); }}
                    className={`py-1.5 text-[10px] font-rajdhani font-bold rounded transition-all ${
                      !useCustom && selectedTier === tier ? 'text-black scale-105' : 'text-gray-500'
                    }`}
                    style={{
                      backgroundColor: !useCustom && selectedTier === tier ? getTierColor(tier) : 'transparent',
                      borderColor: getTierColor(tier),
                      borderWidth: 1,
                    }}
                  >
                    {TIER_LABELS[tier]}
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

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (hasEnoughTokens || isSuperChatMode) && handleSend()}
              placeholder={
                !hasEnoughTokens && !isSuperChatMode
                  ? 'Hold 1% to chat or use Super Chat...'
                  : isSuperChatMode
                  ? 'Super chat message...'
                  : 'Type a message...'
              }
              maxLength={500}
              disabled={!hasEnoughTokens && !isSuperChatMode}
              className="flex-1 px-3 py-2 bg-black/60 border border-cyan-500/20 rounded-lg font-rajdhani text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={isPending || !message.trim() || (!hasEnoughTokens && !isSuperChatMode)}
              className={`px-4 py-2 rounded-lg font-rajdhani text-sm font-bold transition-all ${
                isSuperChatMode
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400'
                  : 'bg-cyan-500 text-black hover:bg-cyan-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              SEND
            </button>
          </div>

          {/* Cost indicator */}
          <p className="text-[10px] font-rajdhani text-gray-600 text-center">
            {isSuperChatMode
              ? `Super Chat: ${currentCost} PLS`
              : hasEnoughTokens
              ? 'Free chat — no payment required'
              : 'Super Chat available without holding requirement'}
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="p-3 border-t border-cyan-500/10">
          <p className="text-xs font-rajdhani text-gray-500 text-center">Connect wallet to chat</p>
        </div>
      )}
    </div>
  );
}
