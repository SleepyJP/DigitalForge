'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, parseEther } from 'viem';
import { Settings, Save, AlertCircle, CheckCircle, Zap, Shield } from 'lucide-react';

// ForgedTaxTokenV2 ABI — matches the deployed bytecode on PulseChain
const TOKEN_V2_ABI = [
  { inputs: [{ name: '_buy', type: 'uint256' }, { name: '_sell', type: 'uint256' }], name: 'setTaxes', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_treasury', type: 'uint256' }, { name: '_burn', type: 'uint256' }, { name: '_reflection', type: 'uint256' }, { name: '_liquidity', type: 'uint256' }, { name: '_yield', type: 'uint256' }, { name: '_support', type: 'uint256' }], name: 'setShares', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }], name: 'setTreasuryWallets', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }], name: 'setYieldTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }], name: 'setSupportTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_maxTx', type: 'uint256' }, { name: '_maxWallet', type: 'uint256' }], name: 'setLimits', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }, { name: 'excluded', type: 'bool' }], name: 'setExcluded', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'addr', type: 'address' }, { name: 'isPair', type: 'bool' }], name: 'setPair', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_router', type: 'address' }], name: 'setRouter', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_threshold', type: 'uint256' }, { name: '_enabled', type: 'bool' }], name: 'setSwapSettings', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'manualSwap', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'enableTrading', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'rescueETH', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'rescueTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;

interface OwnerAdminPanelProps {
  tokenAddress: Address;
  isOwner: boolean;
  currentBuyTax?: bigint;
  currentSellTax?: bigint;
  onSuccess?: () => void;
}

export function OwnerAdminPanel({
  tokenAddress,
  isOwner,
  currentBuyTax,
  currentSellTax,
}: OwnerAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'taxes' | 'shares' | 'tokens' | 'limits' | 'manual'>('taxes');

  // Tax form
  const [buyTax, setBuyTax] = useState(currentBuyTax ? (Number(currentBuyTax) / 100).toString() : '');
  const [sellTax, setSellTax] = useState(currentSellTax ? (Number(currentSellTax) / 100).toString() : '');

  // Shares form (basis points, must sum to 10000)
  const [treasuryShare, setTreasuryShare] = useState('');
  const [burnShare, setBurnShare] = useState('');
  const [reflectionShare, setReflectionShare] = useState('');
  const [liquidityShare, setLiquidityShare] = useState('');
  const [yieldShare, setYieldShare] = useState('');
  const [supportShare, setSupportShare] = useState('');

  // Token address forms
  const [yieldTokenAddresses, setYieldTokenAddresses] = useState('');
  const [supportTokenAddresses, setSupportTokenAddresses] = useState('');
  const [treasuryWalletAddresses, setTreasuryWalletAddresses] = useState('');

  // Limits form
  const [maxTxAmount, setMaxTxAmount] = useState('');
  const [maxWalletAmount, setMaxWalletAmount] = useState('');

  // Exclusion form
  const [excludeAddress, setExcludeAddress] = useState('');
  const [excludeValue, setExcludeValue] = useState(true);

  // Rescue form
  const [rescueTokenAddr, setRescueTokenAddr] = useState('');

  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isOwner) return null;

  const handleSetTaxes = () => {
    const buyBps = Math.round(parseFloat(buyTax) * 100);
    const sellBps = Math.round(parseFloat(sellTax) * 100);
    writeContract({
      address: tokenAddress,
      abi: TOKEN_V2_ABI,
      functionName: 'setTaxes',
      args: [BigInt(buyBps), BigInt(sellBps)],
    });
  };

  const handleSetShares = () => {
    writeContract({
      address: tokenAddress,
      abi: TOKEN_V2_ABI,
      functionName: 'setShares',
      args: [
        BigInt(treasuryShare || 0),
        BigInt(burnShare || 0),
        BigInt(reflectionShare || 0),
        BigInt(liquidityShare || 0),
        BigInt(yieldShare || 0),
        BigInt(supportShare || 0),
      ],
    });
  };

  const parseAddressShares = (input: string): { addrs: Address[]; shares: bigint[] } => {
    const addrs = input.split(',').map((a) => a.trim()).filter(Boolean) as Address[];
    const sharePer = Math.floor(10000 / addrs.length);
    const shares = addrs.map((_, i) => BigInt(i === 0 ? 10000 - sharePer * (addrs.length - 1) : sharePer));
    return { addrs, shares };
  };

  const handleSetYieldTokens = () => {
    if (!yieldTokenAddresses) return;
    const { addrs, shares } = parseAddressShares(yieldTokenAddresses);
    writeContract({ address: tokenAddress, abi: TOKEN_V2_ABI, functionName: 'setYieldTokens', args: [addrs, shares] });
  };

  const handleSetSupportTokens = () => {
    if (!supportTokenAddresses) return;
    const { addrs, shares } = parseAddressShares(supportTokenAddresses);
    writeContract({ address: tokenAddress, abi: TOKEN_V2_ABI, functionName: 'setSupportTokens', args: [addrs, shares] });
  };

  const handleSetTreasuryWallets = () => {
    if (!treasuryWalletAddresses) return;
    const { addrs, shares } = parseAddressShares(treasuryWalletAddresses);
    writeContract({ address: tokenAddress, abi: TOKEN_V2_ABI, functionName: 'setTreasuryWallets', args: [addrs, shares] });
  };

  const handleSetLimits = () => {
    const maxTx = maxTxAmount ? parseEther(maxTxAmount) : 0n;
    const maxWallet = maxWalletAmount ? parseEther(maxWalletAmount) : 0n;
    writeContract({ address: tokenAddress, abi: TOKEN_V2_ABI, functionName: 'setLimits', args: [maxTx, maxWallet] });
  };

  const handleSetExcluded = () => {
    if (!excludeAddress) return;
    writeContract({
      address: tokenAddress,
      abi: TOKEN_V2_ABI,
      functionName: 'setExcluded',
      args: [excludeAddress as Address, excludeValue],
    });
  };

  const handleManualSwap = () => {
    writeContract({ address: tokenAddress, abi: TOKEN_V2_ABI, functionName: 'manualSwap' });
  };

  const handleRescueETH = () => {
    writeContract({ address: tokenAddress, abi: TOKEN_V2_ABI, functionName: 'rescueETH' });
  };

  const handleRescueTokens = () => {
    if (!rescueTokenAddr) return;
    writeContract({
      address: tokenAddress,
      abi: TOKEN_V2_ABI,
      functionName: 'rescueTokens',
      args: [rescueTokenAddr as Address, 0n],
    });
  };

  const sharesTotal =
    (parseInt(treasuryShare) || 0) +
    (parseInt(burnShare) || 0) +
    (parseInt(reflectionShare) || 0) +
    (parseInt(liquidityShare) || 0) +
    (parseInt(yieldShare) || 0) +
    (parseInt(supportShare) || 0);

  return (
    <div className="glass-card rounded-xl border border-orange-500/30 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-sm">Owner Admin</h3>
            <p className="text-[10px] text-gray-400 font-rajdhani">ForgedTaxTokenV2 controls</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {(['taxes', 'shares', 'tokens', 'limits', 'manual'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); reset(); }}
            className={`flex-1 py-2 text-xs font-rajdhani font-semibold uppercase transition-colors whitespace-nowrap px-2 ${
              activeTab === tab
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Taxes Tab */}
        {activeTab === 'taxes' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">Set buy and sell tax rates (in %). Max 25% each.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Buy Tax %</label>
                <input
                  type="number"
                  step="0.1"
                  max="25"
                  value={buyTax}
                  onChange={(e) => setBuyTax(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                  placeholder="6.0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Sell Tax %</label>
                <input
                  type="number"
                  step="0.1"
                  max="25"
                  value={sellTax}
                  onChange={(e) => setSellTax(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                  placeholder="6.0"
                />
              </div>
            </div>
            <button
              onClick={handleSetTaxes}
              disabled={isPending || isConfirming || !buyTax || !sellTax}
              className="w-full py-2.5 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Updating...' : <><Save size={14} /> Update Taxes</>}
            </button>
          </div>
        )}

        {/* Shares Tab */}
        {activeTab === 'shares' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">
              Set mechanism shares (basis points, must sum to 10000)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Treasury', value: treasuryShare, set: setTreasuryShare },
                { label: 'Burn', value: burnShare, set: setBurnShare },
                { label: 'Reflection', value: reflectionShare, set: setReflectionShare },
                { label: 'Liquidity', value: liquidityShare, set: setLiquidityShare },
                { label: 'Yield', value: yieldShare, set: setYieldShare },
                { label: 'Support', value: supportShare, set: setSupportShare },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="text-xs text-gray-500 font-rajdhani">{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className={`text-xs font-mono text-center ${sharesTotal === 10000 ? 'text-green-400' : 'text-red-400'}`}>
              Total: {sharesTotal} / 10000 {sharesTotal === 10000 ? '' : '(must equal 10000)'}
            </div>
            <button
              onClick={handleSetShares}
              disabled={isPending || isConfirming || sharesTotal !== 10000}
              className="w-full py-2.5 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Updating...' : <><Save size={14} /> Update Shares</>}
            </button>
          </div>
        )}

        {/* Tokens Tab — Treasury Wallets, Yield Tokens, Support Tokens */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">
              Set destination addresses. Comma-separate multiple. Shares auto-split evenly (sum to 10000 bps).
            </p>

            {/* Treasury Wallets */}
            <div>
              <label className="text-xs text-gray-500 font-rajdhani">Treasury Wallet(s)</label>
              <input
                type="text"
                value={treasuryWalletAddresses}
                onChange={(e) => setTreasuryWalletAddresses(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-xs focus:border-orange-500/50"
                placeholder="0x..."
              />
              <button
                onClick={handleSetTreasuryWallets}
                disabled={isPending || isConfirming || !treasuryWalletAddresses}
                className="w-full mt-2 py-2 rounded-lg font-rajdhani font-bold text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirm...' : 'Set Treasury Wallets'}
              </button>
            </div>

            {/* Yield Tokens */}
            <div>
              <label className="text-xs text-gray-500 font-rajdhani">Yield Token(s)</label>
              <input
                type="text"
                value={yieldTokenAddresses}
                onChange={(e) => setYieldTokenAddresses(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-xs focus:border-orange-500/50"
                placeholder="0x...,0x..."
              />
              <button
                onClick={handleSetYieldTokens}
                disabled={isPending || isConfirming || !yieldTokenAddresses}
                className="w-full mt-2 py-2 rounded-lg font-rajdhani font-bold text-xs bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirm...' : 'Set Yield Tokens'}
              </button>
            </div>

            {/* Support Tokens */}
            <div>
              <label className="text-xs text-gray-500 font-rajdhani">Support Token(s)</label>
              <input
                type="text"
                value={supportTokenAddresses}
                onChange={(e) => setSupportTokenAddresses(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-xs focus:border-orange-500/50"
                placeholder="0x..."
              />
              <button
                onClick={handleSetSupportTokens}
                disabled={isPending || isConfirming || !supportTokenAddresses}
                className="w-full mt-2 py-2 rounded-lg font-rajdhani font-bold text-xs bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirm...' : 'Set Support Tokens'}
              </button>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">Set transaction limits (token amounts, 0 = no limit)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Max TX (tokens)</label>
                <input
                  type="text"
                  value={maxTxAmount}
                  onChange={(e) => setMaxTxAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Max Wallet (tokens)</label>
                <input
                  type="text"
                  value={maxWalletAmount}
                  onChange={(e) => setMaxWalletAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                  placeholder="0"
                />
              </div>
            </div>
            <button
              onClick={handleSetLimits}
              disabled={isPending || isConfirming}
              className="w-full py-2.5 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? 'Confirm...' : isConfirming ? 'Updating...' : <><Save size={14} /> Set Limits</>}
            </button>

            {/* Fee Exclusion */}
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-400 font-rajdhani mb-2">Exclude/include address from fees</p>
              <input
                type="text"
                value={excludeAddress}
                onChange={(e) => setExcludeAddress(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-xs focus:border-orange-500/50"
                placeholder="0x..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setExcludeValue(true); handleSetExcluded(); }}
                  disabled={isPending || isConfirming || !excludeAddress}
                  className="flex-1 py-2 rounded-lg font-rajdhani font-bold text-xs bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Shield size={12} /> Exclude
                </button>
                <button
                  onClick={() => { setExcludeValue(false); handleSetExcluded(); }}
                  disabled={isPending || isConfirming || !excludeAddress}
                  className="flex-1 py-2 rounded-lg font-rajdhani font-bold text-xs bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  Include
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Triggers Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-rajdhani">Manually trigger swapback and rescue functions</p>
            <button
              onClick={handleManualSwap}
              disabled={isPending || isConfirming}
              className="w-full py-3 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              {isPending ? 'Confirm...' : isConfirming ? 'Processing...' : 'Manual Swap (Full Swapback)'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRescueETH}
                disabled={isPending || isConfirming}
                className="py-2 rounded-lg font-rajdhani font-bold text-xs bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
              >
                Rescue PLS
              </button>
              <button
                onClick={handleRescueTokens}
                disabled={isPending || isConfirming || !rescueTokenAddr}
                className="py-2 rounded-lg font-rajdhani font-bold text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50"
              >
                Rescue Token
              </button>
            </div>
            <input
              type="text"
              value={rescueTokenAddr}
              onChange={(e) => setRescueTokenAddr(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-xs focus:border-orange-500/50"
              placeholder="Token address to rescue (for Rescue Token)"
            />
          </div>
        )}

        {/* Status Messages */}
        {isSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-rajdhani text-sm">Transaction confirmed!</span>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-rajdhani text-sm">{error.message.slice(0, 100)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerAdminPanel;
