'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Header from '@/components/Header';
import BackgroundEffects from '@/components/BackgroundEffects';
import FeeAccordion from '@/components/FeeAccordion';
import ForgeButton from '@/components/ForgeButton';
import ImageUpload from '@/components/ImageUpload';
import { Globe, Twitter, MessageCircle } from 'lucide-react';
import {
  TokenFormData,
  DEFAULT_FORM_DATA,
  useForgeToken,
  validateFormData,
} from '@/hooks/useForge';
import { TREASURY_ADDRESS } from '@/lib/contracts';
import { saveTokenMetadata } from '@/lib/tokenMetadataStore';

export default function ForgePage() {
  const { isConnected } = useAccount();
  const [formData, setFormData] = useState<TokenFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const savedMetadataRef = useRef(false);

  const {
    forgeToken, isPending, isConfirming, isSuccess, hash, error, createdTokenAddress,
    renounceHash, renounceError, renouncePending, renounceConfirming, renounceSuccess, shouldRenounce,
  } = useForgeToken();

  // Save metadata when token is created
  useEffect(() => {
    if (isSuccess && createdTokenAddress && !savedMetadataRef.current) {
      savedMetadataRef.current = true;
      saveTokenMetadata(createdTokenAddress, {
        imageUri: formData.imageUri,
        description: formData.description,
        website: formData.website,
        twitter: formData.twitter,
        telegram: formData.telegram,
      });
    }
  }, [isSuccess, createdTokenAddress, formData]);

  const handleChange = (updates: Partial<TokenFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors when user makes changes
    if (errors.length > 0) setErrors([]);
  };

  const handleForge = () => {
    const validation = validateFormData(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);
    forgeToken(formData);
  };

  return (
    <div className="min-h-screen bg-void-black relative overflow-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                FORGE YOUR TOKEN
              </span>
            </h1>
            <p className="text-gray-400 font-rajdhani text-lg max-w-2xl mx-auto">
              Create a fee-on-transfer token with up to 6 tax mechanisms.
              Configure treasury, burn, reflection, liquidity, yield, and support fees.
            </p>
          </div>

          {/* Success State */}
          {isSuccess && hash && (
            <div className="mb-8 p-6 glass-card rounded-xl border-green-500/50 border-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="material-icons text-2xl text-green-400">check_circle</span>
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-green-400 text-lg">
                    Token Forged Successfully!
                  </h3>
                  <a
                    href={`https://scan.pulsechain.com/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline font-rajdhani text-sm"
                  >
                    View Transaction on PulseScan
                  </a>
                  {createdTokenAddress && (
                    <a
                      href={`/tokens/${createdTokenAddress}`}
                      className="block text-pink-400 hover:underline font-rajdhani text-sm mt-1"
                    >
                      Go to Token Dashboard →
                    </a>
                  )}
                </div>
              </div>
              {/* Renounce Status */}
              {shouldRenounce && (
                <div className="mt-4 pt-4 border-t border-green-500/20">
                  {renounceSuccess ? (
                    <div className="flex items-center gap-2 text-green-400 font-rajdhani text-sm">
                      <span className="material-icons text-sm">verified</span>
                      Ownership Renounced — Token is fully decentralized
                      {renounceHash && (
                        <a
                          href={`https://scan.pulsechain.com/tx/${renounceHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline ml-2"
                        >
                          View TX
                        </a>
                      )}
                    </div>
                  ) : renouncePending || renounceConfirming ? (
                    <div className="flex items-center gap-2 text-yellow-400 font-rajdhani text-sm">
                      <span className="material-icons text-sm animate-spin">sync</span>
                      {renouncePending ? 'Confirm renounce in wallet...' : 'Renouncing ownership...'}
                    </div>
                  ) : renounceError ? (
                    <div className="text-red-400 font-rajdhani text-sm">
                      Renounce failed: {(renounceError as Error & { shortMessage?: string })?.shortMessage || renounceError.message}
                    </div>
                  ) : (
                    <div className="text-gray-400 font-rajdhani text-sm">
                      Preparing to renounce ownership...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {(errors.length > 0 || error) && (
            <div className="mb-8 p-6 glass-card rounded-xl border-red-500/50 border-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-2xl text-red-400">error</span>
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-red-400 text-lg mb-2">
                    {error ? 'Transaction Failed' : 'Validation Error'}
                  </h3>
                  <ul className="space-y-1">
                    {errors.map((err, i) => (
                      <li key={i} className="text-red-300 font-rajdhani text-sm">
                        {err}
                      </li>
                    ))}
                    {error && (
                      <li className="text-red-300 font-rajdhani text-sm">
                        {error.message}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="space-y-6">
            {/* Basic Info Section */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-orbitron font-bold text-xl text-cyan-400 mb-6 flex items-center gap-3">
                <span className="material-icons">info</span>
                Token Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                    Token Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange({ name: e.target.value })}
                    placeholder="My Awesome Token"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani text-lg focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Symbol */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => handleChange({ symbol: e.target.value })}
                    placeholder="TOKEN"
                    maxLength={11}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-orbitron text-lg focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Total Supply */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                    Total Supply *
                  </label>
                  <input
                    type="text"
                    value={formData.totalSupply}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleChange({ totalSupply: value });
                    }}
                    placeholder="1000000000"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani text-lg focus:border-cyan-500/50 transition-colors"
                  />
                  <p className="text-xs text-gray-500">
                    {Number(formData.totalSupply || 0).toLocaleString()} tokens
                  </p>
                </div>

                {/* Decimals */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                    Decimals
                  </label>
                  <select
                    value={formData.decimals}
                    onChange={(e) => handleChange({ decimals: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani text-lg focus:border-cyan-500/50 transition-colors"
                  >
                    <option value={18}>18 (Standard)</option>
                    <option value={9}>9</option>
                    <option value={6}>6</option>
                    <option value={0}>0</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Token Branding Section */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-orbitron font-bold text-xl text-cyan-400 mb-6 flex items-center gap-3">
                <span className="material-icons">brush</span>
                Token Branding
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div>
                  <ImageUpload
                    value={formData.imageUri}
                    onChange={(uri) => handleChange({ imageUri: uri })}
                    disabled={isPending || isConfirming}
                  />
                </div>

                {/* Description & Social Links */}
                <div className="space-y-4">
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange({ description: e.target.value })}
                      placeholder="Describe your token..."
                      rows={3}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani focus:border-cyan-500/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-rajdhani font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange({ website: e.target.value })}
                      placeholder="https://yourtoken.com"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani focus:border-cyan-500/50 transition-colors"
                    />
                  </div>

                  {/* Twitter */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-rajdhani font-semibold flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter/X
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => handleChange({ twitter: e.target.value })}
                      placeholder="@yourtoken"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani focus:border-cyan-500/50 transition-colors"
                    />
                  </div>

                  {/* Telegram */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-rajdhani font-semibold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Telegram
                    </label>
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => handleChange({ telegram: e.target.value })}
                      placeholder="https://t.me/yourtoken"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Tax Configuration Section */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-orbitron font-bold text-xl text-cyan-400 mb-2 flex items-center gap-3">
                <span className="material-icons">tune</span>
                Tax Configuration
              </h2>
              <p className="text-gray-500 font-rajdhani text-sm mb-6">
                Add tax allocations below. Use UNIFIED for 50/50 buy/sell, or SPLIT for different rates.
              </p>

              {/* Fee Distribution Accordion - always shown, calculates total tax */}
              <FeeAccordion formData={formData} onChange={handleChange} />
            </section>

            {/* Advanced Options */}
            <section className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h2 className="font-orbitron font-bold text-xl text-cyan-400 flex items-center gap-3">
                  <span className="material-icons">settings</span>
                  Advanced Options
                </h2>
                <span className={`material-icons text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              <div className={`accordion-content ${showAdvanced ? 'expanded' : ''}`}>
                <div className="px-6 pb-6 space-y-6">
                  {/* Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                        Max TX (% of supply, 0 = no limit)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.maxTxPercent}
                        onChange={(e) => handleChange({ maxTxPercent: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani focus:border-cyan-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-rajdhani font-semibold">
                        Max Wallet (% of supply, 0 = no limit)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.maxWalletPercent}
                        onChange={(e) => handleChange({ maxWalletPercent: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-rajdhani focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.antiBotEnabled}
                        onChange={(e) => handleChange({ antiBotEnabled: e.target.checked })}
                      />
                      <span className="text-white font-rajdhani group-hover:text-cyan-400 transition-colors">
                        Enable Anti-Bot Protection
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.tradingEnabledOnLaunch}
                        onChange={(e) => handleChange({ tradingEnabledOnLaunch: e.target.checked })}
                      />
                      <span className="text-white font-rajdhani group-hover:text-cyan-400 transition-colors">
                        Enable Trading on Launch
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.treasuryReceiveInPLS}
                        onChange={(e) => handleChange({ treasuryReceiveInPLS: e.target.checked })}
                      />
                      <div>
                        <span className="text-white font-rajdhani group-hover:text-cyan-400 transition-colors block">
                          Receive Treasury Tax in PLS
                        </span>
                        <span className="text-xs text-gray-500 font-rajdhani">
                          Auto-swaps treasury tax to PLS before sending to wallet
                        </span>
                      </div>
                    </label>

                    <div className="border-t border-gray-800 pt-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.renounceOwnership}
                          onChange={(e) => handleChange({ renounceOwnership: e.target.checked })}
                        />
                        <div>
                          <span className="text-white font-rajdhani group-hover:text-red-400 transition-colors block">
                            Renounce Ownership at Creation
                          </span>
                          <span className="text-xs text-gray-500 font-rajdhani">
                            Permanently removes owner control. Tax rates and settings become immutable.
                          </span>
                        </div>
                      </label>
                      {formData.renounceOwnership && (
                        <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <p className="text-xs text-red-400 font-rajdhani font-bold">
                            WARNING: This is irreversible. After renouncing, you cannot change taxes,
                            wallet addresses, limits, or any other token settings. A second transaction
                            will be sent after creation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Creation Fee Notice */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-cyan-400">payments</span>
                  <span className="font-rajdhani text-gray-300">Creation Fee</span>
                </div>
                <span className="font-orbitron font-bold text-xl text-cyan-400">
                  100,000 PLS
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-rajdhani">
                Fee is sent to treasury: {TREASURY_ADDRESS.slice(0, 6)}...{TREASURY_ADDRESS.slice(-4)}
              </p>
            </div>

            {/* Platform Fee Model */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-purple-400 text-lg">shield</span>
                <span className="font-rajdhani font-bold text-purple-400">Platform Fee Model</span>
              </div>
              <p className="text-xs text-gray-400 font-rajdhani leading-relaxed">
                The platform takes a small percentage <strong className="text-purple-300">from your configured tax</strong>, not
                added on top. This means if you set 5% buy tax, the buyer still pays exactly 5% — a portion of
                that 5% goes to support the platform. Your users never pay more than what you set.
              </p>
            </div>

            {/* Submit Button */}
            {isConnected ? (
              <ForgeButton
                onClick={handleForge}
                disabled={isPending || isConfirming}
                isLoading={isPending || isConfirming}
              >
                {isPending ? 'CONFIRM IN WALLET' : isConfirming ? 'FORGING...' : 'FORGE TOKEN'}
              </ForgeButton>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 font-rajdhani mb-4">
                  Connect your wallet to forge a token
                </p>
                <ConnectButton />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
