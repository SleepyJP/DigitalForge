'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, maxUint256, type Address } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import {
  FARM_FACTORY_ADDRESS,
  FARM_FACTORY_ABI,
  FARM_CREATION_FEE,
  ERC20_ABI,
} from '@/lib/farmContracts';

interface FormData {
  stakeToken: string;
  rewardToken: string;
  depositFeeBps: string;
  withdrawalFeeBps: string;
  durationDays: string;
  rewardAmount: string;
}

const DEFAULT_FORM: FormData = {
  stakeToken: '',
  rewardToken: '',
  depositFeeBps: '0',
  withdrawalFeeBps: '0',
  durationDays: '30',
  rewardAmount: '',
};

export default function CreateFarmPage() {
  const { address: userAddress, isConnected } = useAccount();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'configure' | 'approve' | 'create' | 'success'>('configure');

  // Token validation — read symbol/decimals for both tokens
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const tokenInfoContracts = useMemo(() => {
    const contracts: { address: Address; abi: typeof ERC20_ABI; functionName: string }[] = [];
    if (isValidAddress(form.stakeToken)) {
      contracts.push(
        { address: form.stakeToken as Address, abi: ERC20_ABI, functionName: 'symbol' },
        { address: form.stakeToken as Address, abi: ERC20_ABI, functionName: 'decimals' },
        { address: form.stakeToken as Address, abi: ERC20_ABI, functionName: 'name' }
      );
    }
    if (isValidAddress(form.rewardToken)) {
      contracts.push(
        { address: form.rewardToken as Address, abi: ERC20_ABI, functionName: 'symbol' },
        { address: form.rewardToken as Address, abi: ERC20_ABI, functionName: 'decimals' },
        { address: form.rewardToken as Address, abi: ERC20_ABI, functionName: 'name' }
      );
    }
    return contracts;
  }, [form.stakeToken, form.rewardToken]);

  const { data: tokenInfoData } = useReadContracts({
    contracts: tokenInfoContracts,
    query: { enabled: tokenInfoContracts.length > 0 },
  });

  // Parse token info
  const stakeTokenInfo = useMemo(() => {
    if (!tokenInfoData || !isValidAddress(form.stakeToken)) return null;
    return {
      symbol: (tokenInfoData[0]?.result as string) || '???',
      decimals: Number(tokenInfoData[1]?.result ?? 18),
      name: (tokenInfoData[2]?.result as string) || 'Unknown',
    };
  }, [tokenInfoData, form.stakeToken]);

  const rewardTokenInfo = useMemo(() => {
    if (!tokenInfoData || !isValidAddress(form.rewardToken)) return null;
    const offset = isValidAddress(form.stakeToken) ? 3 : 0;
    return {
      symbol: (tokenInfoData[offset]?.result as string) || '???',
      decimals: Number(tokenInfoData[offset + 1]?.result ?? 18),
      name: (tokenInfoData[offset + 2]?.result as string) || 'Unknown',
    };
  }, [tokenInfoData, form.stakeToken, form.rewardToken]);

  // Check allowance for reward token
  const { data: rewardAllowance, refetch: refetchAllowance } = useReadContract({
    address: form.rewardToken as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress!, FARM_FACTORY_ADDRESS],
    query: {
      enabled: isValidAddress(form.rewardToken) && !!userAddress,
    },
  });

  // Check reward token balance
  const { data: rewardBalance } = useReadContract({
    address: form.rewardToken as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: {
      enabled: isValidAddress(form.rewardToken) && !!userAddress,
    },
  });

  // Check if user is whitelisted (free creation)
  const { data: isWhitelisted } = useReadContract({
    address: FARM_FACTORY_ADDRESS,
    abi: FARM_FACTORY_ABI,
    functionName: 'isWhitelisted',
    args: [userAddress!],
    query: {
      enabled: !!userAddress && FARM_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Approve reward token
  const {
    writeContract: approveToken,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Create farm
  const {
    writeContract: createFarm,
    data: createHash,
    isPending: isCreating,
    error: createError,
  } = useWriteContract();

  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } =
    useWaitForTransactionReceipt({ hash: createHash });

  // Handle approve success — move to create step
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setStep('create');
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle create success
  useEffect(() => {
    if (isCreateSuccess && createHash) {
      setStep('success');
    }
  }, [isCreateSuccess, createHash]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const rewardAmountParsed = useMemo(() => {
    if (!form.rewardAmount || !rewardTokenInfo) return 0n;
    try {
      return parseUnits(form.rewardAmount, rewardTokenInfo.decimals);
    } catch {
      return 0n;
    }
  }, [form.rewardAmount, rewardTokenInfo]);

  const needsApproval = useMemo(() => {
    if (!rewardAllowance || rewardAmountParsed === 0n) return true;
    return (rewardAllowance as bigint) < rewardAmountParsed;
  }, [rewardAllowance, rewardAmountParsed]);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!isValidAddress(form.stakeToken)) errs.push('Enter a valid stake token address');
    if (!isValidAddress(form.rewardToken)) errs.push('Enter a valid reward token address');
    const depFee = Number(form.depositFeeBps);
    const wdFee = Number(form.withdrawalFeeBps);
    if (isNaN(depFee) || depFee < 0 || depFee > 2000) errs.push('Deposit fee must be 0-2000 bps (0-20%)');
    if (isNaN(wdFee) || wdFee < 0 || wdFee > 2000) errs.push('Withdrawal fee must be 0-2000 bps (0-20%)');
    const days = Number(form.durationDays);
    if (isNaN(days) || days < 1 || days > 3650) errs.push('Duration must be 1-3650 days');
    if (!form.rewardAmount || rewardAmountParsed === 0n) errs.push('Enter reward amount');
    if (rewardBalance && rewardAmountParsed > (rewardBalance as bigint)) {
      errs.push('Insufficient reward token balance');
    }
    return errs;
  };

  const handleProceed = () => {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    if (needsApproval) {
      setStep('approve');
    } else {
      setStep('create');
    }
  };

  const handleApprove = () => {
    approveToken({
      address: form.rewardToken as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [FARM_FACTORY_ADDRESS, maxUint256],
    });
  };

  const handleCreateFarm = () => {
    createFarm({
      address: FARM_FACTORY_ADDRESS,
      abi: FARM_FACTORY_ABI,
      functionName: 'createFarm',
      args: [
        form.stakeToken as Address,
        form.rewardToken as Address,
        BigInt(form.depositFeeBps),
        BigInt(form.withdrawalFeeBps),
        BigInt(form.durationDays),
        rewardAmountParsed,
      ],
      value: isWhitelisted ? 0n : FARM_CREATION_FEE,
    });
  };

  const creationFeeDisplay = isWhitelisted ? 'FREE (Whitelisted)' : '500,000 PLS';

  return (
    <div className="min-h-screen bg-void-black relative overflow-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link
            href="/farms"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-rajdhani mb-6 transition-colors"
          >
            &larr; Back to Farms
          </Link>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                CREATE A FARM
              </span>
            </h1>
            <p className="text-gray-400 font-rajdhani text-lg max-w-lg mx-auto">
              Deploy a staking farm. You earn 75% of all deposit &amp; withdrawal fees.
              Treasury gets 25%.
            </p>
          </div>

          {/* Factory Not Deployed */}
          {FARM_FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000' && (
            <div className="glass-card border border-yellow-500/30 rounded-xl p-8 text-center">
              <span className="text-yellow-400 text-4xl mb-3 block">&#9888;</span>
              <h3 className="font-orbitron text-xl text-yellow-400 mb-2">Factory Not Deployed</h3>
              <p className="text-gray-400 font-rajdhani">
                The PaisleyFarmFactory is ready but not yet deployed to PulseChain mainnet.
              </p>
            </div>
          )}

          {/* Not Connected */}
          {FARM_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000' && !isConnected && (
            <div className="glass-card border border-cyan-500/20 rounded-xl p-10 text-center">
              <h3 className="font-orbitron text-xl text-white mb-4">Connect Wallet to Create</h3>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="glass-card border border-green-500/30 rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-3xl">&#10003;</span>
              </div>
              <h3 className="font-orbitron text-2xl text-green-400 mb-3">Farm Created!</h3>
              <p className="text-gray-400 font-rajdhani mb-4">
                Your staking farm is live. Users can now stake {stakeTokenInfo?.symbol || 'tokens'} to earn{' '}
                {rewardTokenInfo?.symbol || 'rewards'}.
              </p>
              {createHash && (
                <a
                  href={`https://scan.pulsechain.com/tx/${createHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-rajdhani text-sm underline"
                >
                  View Transaction &rarr;
                </a>
              )}
              <div className="mt-6 flex justify-center gap-4">
                <Link href="/farms">
                  <button className="px-6 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg font-rajdhani font-bold hover:border-green-500/60 transition-all">
                    View All Farms
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setForm(DEFAULT_FORM);
                    setStep('configure');
                  }}
                  className="px-6 py-2.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg font-rajdhani font-bold hover:border-cyan-500/60 transition-all"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          {FARM_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
            isConnected &&
            step !== 'success' && (
              <div className="space-y-6">
                {/* Stake Token */}
                <div className="glass-card border border-white/10 rounded-xl p-5">
                  <label className="font-rajdhani font-semibold text-gray-300 text-sm block mb-2">
                    Stake Token Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x... (token users will stake)"
                    value={form.stakeToken}
                    onChange={(e) => handleChange('stakeToken', e.target.value)}
                    disabled={step !== 'configure'}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none transition-colors"
                  />
                  {stakeTokenInfo && (
                    <p className="text-green-400 font-rajdhani text-sm mt-2">
                      {stakeTokenInfo.name} ({stakeTokenInfo.symbol}) — {stakeTokenInfo.decimals} decimals
                    </p>
                  )}
                </div>

                {/* Reward Token */}
                <div className="glass-card border border-white/10 rounded-xl p-5">
                  <label className="font-rajdhani font-semibold text-gray-300 text-sm block mb-2">
                    Reward Token Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x... (token stakers will earn)"
                    value={form.rewardToken}
                    onChange={(e) => handleChange('rewardToken', e.target.value)}
                    disabled={step !== 'configure'}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none transition-colors"
                  />
                  {rewardTokenInfo && (
                    <p className="text-green-400 font-rajdhani text-sm mt-2">
                      {rewardTokenInfo.name} ({rewardTokenInfo.symbol}) — {rewardTokenInfo.decimals} decimals
                    </p>
                  )}
                </div>

                {/* Fee Configuration */}
                <div className="glass-card border border-white/10 rounded-xl p-5">
                  <h3 className="font-orbitron text-sm font-bold text-white mb-4">FEE CONFIGURATION</h3>
                  <p className="text-gray-500 font-rajdhani text-xs mb-4">
                    You receive 75% of fees. Treasury receives 25%. Max 20% each (2000 bps).
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-rajdhani font-semibold text-gray-400 text-xs block mb-1">
                        Deposit Fee (bps)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="2000"
                          step="50"
                          value={form.depositFeeBps}
                          onChange={(e) => handleChange('depositFeeBps', e.target.value)}
                          disabled={step !== 'configure'}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white font-rajdhani focus:border-cyan-500/50 focus:outline-none transition-colors"
                        />
                        <span className="text-gray-500 font-rajdhani text-sm whitespace-nowrap">
                          = {(Number(form.depositFeeBps) / 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="font-rajdhani font-semibold text-gray-400 text-xs block mb-1">
                        Withdrawal Fee (bps)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="2000"
                          step="50"
                          value={form.withdrawalFeeBps}
                          onChange={(e) => handleChange('withdrawalFeeBps', e.target.value)}
                          disabled={step !== 'configure'}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white font-rajdhani focus:border-cyan-500/50 focus:outline-none transition-colors"
                        />
                        <span className="text-gray-500 font-rajdhani text-sm whitespace-nowrap">
                          = {(Number(form.withdrawalFeeBps) / 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration & Rewards */}
                <div className="glass-card border border-white/10 rounded-xl p-5">
                  <h3 className="font-orbitron text-sm font-bold text-white mb-4">DURATION & REWARDS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-rajdhani font-semibold text-gray-400 text-xs block mb-1">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={form.durationDays}
                        onChange={(e) => handleChange('durationDays', e.target.value)}
                        disabled={step !== 'configure'}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white font-rajdhani focus:border-cyan-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="font-rajdhani font-semibold text-gray-400 text-xs block mb-1">
                        Total Reward Amount {rewardTokenInfo ? `(${rewardTokenInfo.symbol})` : ''}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1000000"
                        value={form.rewardAmount}
                        onChange={(e) => handleChange('rewardAmount', e.target.value)}
                        disabled={step !== 'configure'}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white font-rajdhani placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  {rewardTokenInfo && form.rewardAmount && form.durationDays && (
                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-gray-400 font-rajdhani text-xs">Reward Rate</p>
                      <p className="text-green-400 font-rajdhani font-semibold">
                        ~{(Number(form.rewardAmount) / Number(form.durationDays)).toFixed(2)}{' '}
                        {rewardTokenInfo.symbol} / day
                      </p>
                    </div>
                  )}
                  {rewardBalance && rewardTokenInfo && (
                    <p className="text-gray-500 font-rajdhani text-xs mt-2">
                      Your balance:{' '}
                      {(Number(rewardBalance) / 10 ** rewardTokenInfo.decimals).toLocaleString()}{' '}
                      {rewardTokenInfo.symbol}
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="glass-card border border-green-500/20 rounded-xl p-5">
                  <h3 className="font-orbitron text-sm font-bold text-green-400 mb-3">SUMMARY</h3>
                  <div className="space-y-2 font-rajdhani text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stake Token</span>
                      <span className="text-white">{stakeTokenInfo?.symbol || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reward Token</span>
                      <span className="text-white">{rewardTokenInfo?.symbol || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deposit Fee</span>
                      <span className="text-cyan-400">{(Number(form.depositFeeBps) / 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Withdrawal Fee</span>
                      <span className="text-cyan-400">
                        {(Number(form.withdrawalFeeBps) / 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="text-white">{form.durationDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Rewards</span>
                      <span className="text-white">
                        {form.rewardAmount || '0'} {rewardTokenInfo?.symbol || ''}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-gray-400">Creation Fee</span>
                      <span className={isWhitelisted ? 'text-green-400' : 'text-yellow-400'}>
                        {creationFeeDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    {errors.map((err, i) => (
                      <p key={i} className="text-red-400 font-rajdhani text-sm">
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {createError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 font-rajdhani text-sm">
                      {(createError as Error & { shortMessage?: string })?.shortMessage || createError.message}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {step === 'configure' && (
                    <button
                      onClick={handleProceed}
                      className="w-full py-3.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl font-rajdhani font-bold text-lg text-black hover:shadow-[0_0_25px_rgba(0,255,136,0.3)] transition-all"
                    >
                      Review &amp; Proceed
                    </button>
                  )}

                  {step === 'approve' && (
                    <>
                      <p className="text-center text-gray-400 font-rajdhani text-sm">
                        Step 1/2: Approve {rewardTokenInfo?.symbol || 'reward token'} for the factory
                      </p>
                      <button
                        onClick={handleApprove}
                        disabled={isApproving || isApproveConfirming}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-rajdhani font-bold text-lg text-black hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApproving
                          ? 'Confirm in Wallet...'
                          : isApproveConfirming
                          ? 'Approving...'
                          : `Approve ${rewardTokenInfo?.symbol || 'Token'}`}
                      </button>
                      <button
                        onClick={() => setStep('configure')}
                        className="w-full py-2.5 text-gray-400 font-rajdhani hover:text-white transition-colors"
                      >
                        &larr; Back to Edit
                      </button>
                    </>
                  )}

                  {step === 'create' && (
                    <>
                      <p className="text-center text-gray-400 font-rajdhani text-sm">
                        {needsApproval ? 'Step 2/2' : 'Final Step'}: Create the farm
                        {!isWhitelisted && ' (500,000 PLS fee)'}
                      </p>
                      <button
                        onClick={handleCreateFarm}
                        disabled={isCreating || isCreateConfirming}
                        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl font-rajdhani font-bold text-lg text-black hover:shadow-[0_0_25px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating
                          ? 'Confirm in Wallet...'
                          : isCreateConfirming
                          ? 'Creating Farm...'
                          : 'Create Farm'}
                      </button>
                      <button
                        onClick={() => setStep('configure')}
                        className="w-full py-2.5 text-gray-400 font-rajdhani hover:text-white transition-colors"
                      >
                        &larr; Back to Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
