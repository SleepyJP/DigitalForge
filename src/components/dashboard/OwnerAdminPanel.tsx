'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

const TOKEN_ADMIN_ABI = [
  {
    inputs: [{ name: '_buy', type: 'uint256' }, { name: '_sell', type: 'uint256' }],
    name: 'setTaxes',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 't', type: 'uint256' }, { name: 'b', type: 'uint256' },
      { name: 'r', type: 'uint256' }, { name: 'l', type: 'uint256' },
      { name: 'y', type: 'uint256' }, { name: 's', type: 'uint256' },
    ],
    name: 'setShares',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }],
    name: 'setTreasuryWallets',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }],
    name: 'setYieldTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'addrs', type: 'address[]' }, { name: 'shares', type: 'uint256[]' }],
    name: 'setSupportTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_maxTx', type: 'uint256' }, { name: '_maxWallet', type: 'uint256' }],
    name: 'setLimits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'a', type: 'address' }, { name: 'e', type: 'bool' }],
    name: 'setExcluded',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 't', type: 'uint256' }, { name: 'e', type: 'bool' }],
    name: 'setSwapSettings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'manualSwap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess,
}: OwnerAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'taxes' | 'shares' | 'tokens' | 'limits'>('taxes');

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

  // Yield tokens form
  const [yieldTokenAddress, setYieldTokenAddress] = useState('');

  // Limits form
  const [maxTxPercent, setMaxTxPercent] = useState('');
  const [maxWalletPercent, setMaxWalletPercent] = useState('');

  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isOwner) return null;

  const handleSetTaxes = () => {
    const buyBps = Math.round(parseFloat(buyTax) * 100);
    const sellBps = Math.round(parseFloat(sellTax) * 100);
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ADMIN_ABI,
      functionName: 'setTaxes',
      args: [BigInt(buyBps), BigInt(sellBps)],
    });
  };

  const handleSetShares = () => {
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ADMIN_ABI,
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

  const handleSetYieldTokens = () => {
    if (!yieldTokenAddress) return;
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ADMIN_ABI,
      functionName: 'setYieldTokens',
      args: [[yieldTokenAddress as Address], [10000n]],
    });
  };

  const handleManualSwap = () => {
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ADMIN_ABI,
      functionName: 'manualSwap',
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
      <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white">Owner Admin</h3>
            <p className="text-xs text-gray-400 font-rajdhani">Adjust token settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['taxes', 'shares', 'tokens', 'limits'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); reset(); }}
            className={`flex-1 py-2 text-xs font-rajdhani font-semibold uppercase transition-colors ${
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
      <div className="p-6">
        {/* Taxes Tab */}
        {activeTab === 'taxes' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">Set buy and sell tax rates (in %)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Buy Tax %</label>
                <input
                  type="number"
                  step="0.1"
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
              className="w-full py-3 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Updating...' : <><Save size={16} /> Update Taxes</>}
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
              Total: {sharesTotal} / 10000 {sharesTotal === 10000 ? '✓' : '(must equal 10000)'}
            </div>
            <button
              onClick={handleSetShares}
              disabled={isPending || isConfirming || sharesTotal !== 10000}
              className="w-full py-3 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Updating...' : <><Save size={16} /> Update Shares</>}
            </button>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">Set yield/support token addresses</p>
            <div>
              <label className="text-xs text-gray-500 font-rajdhani">Yield Token Address</label>
              <input
                type="text"
                value={yieldTokenAddress}
                onChange={(e) => setYieldTokenAddress(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                placeholder="0x..."
              />
            </div>
            <button
              onClick={handleSetYieldTokens}
              disabled={isPending || isConfirming || !yieldTokenAddress}
              className="w-full py-3 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Updating...' : <><Save size={16} /> Set Yield Token</>}
            </button>

            <div className="border-t border-gray-800 pt-4">
              <button
                onClick={handleManualSwap}
                disabled={isPending || isConfirming}
                className="w-full py-3 rounded-lg font-rajdhani font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirm...' : isConfirming ? 'Processing...' : 'Trigger Manual Swap'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">Forces distribution of pending taxes</p>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-rajdhani">Set transaction limits (0 = no limit)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Max TX %</label>
                <input
                  type="number"
                  value={maxTxPercent}
                  onChange={(e) => setMaxTxPercent(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-rajdhani">Max Wallet %</label>
                <input
                  type="number"
                  value={maxWalletPercent}
                  onChange={(e) => setMaxWalletPercent(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-orange-500/50"
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Note: Requires total supply to calculate actual amounts</p>
          </div>
        )}

        {/* Status Messages */}
        {isSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-rajdhani text-sm">Updated successfully!</span>
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
