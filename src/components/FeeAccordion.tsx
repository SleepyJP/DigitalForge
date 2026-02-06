'use client';

import { useState } from 'react';
import { TokenFormData, AddressEntry } from '@/hooks/useForge';

interface FeeSection {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  hasAddresses: boolean;
  addressField?: 'treasuryWallets' | 'yieldTokens' | 'supportTokens' | 'liquidityRecipients' | 'burnAddresses';
  legacyField?: 'treasuryWallet' | 'yieldToken' | 'supportToken' | 'liquidityRecipient' | 'burnAddress';
  legacyShareField?: 'treasuryShare' | 'burnShare' | 'liquidityShare' | 'yieldShare' | 'supportShare' | 'reflectionShare';
  addressType: 'wallet' | 'token' | 'burn' | 'none';
  addressLabel: string;
  addressPlaceholder: string;
  defaultAddress?: string;
}

const feeSections: FeeSection[] = [
  {
    id: 'treasury',
    name: 'Treasury',
    icon: 'account_balance',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Send tax to wallet(s)',
    hasAddresses: true,
    addressField: 'treasuryWallets',
    legacyField: 'treasuryWallet',
    legacyShareField: 'treasuryShare',
    addressType: 'wallet',
    addressLabel: 'Wallet',
    addressPlaceholder: '0x...',
    defaultAddress: '0x49bBEFa1d94702C0e9a5EAdDEc7c3C5D3eb9086B',
  },
  {
    id: 'burn',
    name: 'Burn',
    icon: 'local_fire_department',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Burn tokens permanently',
    hasAddresses: true,
    addressField: 'burnAddresses',
    legacyField: 'burnAddress',
    legacyShareField: 'burnShare',
    addressType: 'burn',
    addressLabel: 'Burn To',
    addressPlaceholder: '0x...dEaD',
    defaultAddress: '0x000000000000000000000000000000000000dEaD',
  },
  {
    id: 'reflection',
    name: 'Reflection',
    icon: 'currency_exchange',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Distribute to ALL holders',
    hasAddresses: false,
    legacyShareField: 'reflectionShare',
    addressType: 'none',
    addressLabel: '',
    addressPlaceholder: '',
  },
  {
    id: 'liquidity',
    name: 'Liquidity',
    icon: 'water_drop',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Auto-add LP to DEX',
    hasAddresses: true,
    addressField: 'liquidityRecipients',
    legacyField: 'liquidityRecipient',
    legacyShareField: 'liquidityShare',
    addressType: 'wallet',
    addressLabel: 'LP To',
    addressPlaceholder: '0x...',
    defaultAddress: '0x49bBEFa1d94702C0e9a5EAdDEc7c3C5D3eb9086B',
  },
  {
    id: 'yield',
    name: 'Yield',
    icon: 'trending_up',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Buy & distribute tokens',
    hasAddresses: true,
    addressField: 'yieldTokens',
    legacyField: 'yieldToken',
    legacyShareField: 'yieldShare',
    addressType: 'token',
    addressLabel: 'Token',
    addressPlaceholder: 'Token address...',
  },
  {
    id: 'support',
    name: 'Support',
    icon: 'favorite',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    description: 'Buy & burn other tokens',
    hasAddresses: true,
    addressField: 'supportTokens',
    legacyField: 'supportToken',
    legacyShareField: 'supportShare',
    addressType: 'token',
    addressLabel: 'Token',
    addressPlaceholder: 'Token address...',
  },
];

interface FeeAccordionProps {
  formData: TokenFormData;
  onChange: (updates: Partial<TokenFormData>) => void;
  showReceiveInPLS?: boolean;
}

// Helper to calculate buy/sell from an entry
const getEntryBuyTax = (entry: AddressEntry) =>
  entry.split ? entry.share : entry.share / 2;

const getEntrySellTax = (entry: AddressEntry) =>
  entry.split ? entry.sellShare : entry.share / 2;

export default function FeeAccordion({ formData, onChange, showReceiveInPLS = true }: FeeAccordionProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('treasury');

  // Calculate totals from all address entries across all mechanisms
  let totalBuyTax = 0;
  let totalSellTax = 0;

  // Sum from address-based mechanisms
  feeSections.forEach(section => {
    if (section.hasAddresses && section.addressField) {
      const entries = formData[section.addressField] as AddressEntry[] | undefined;
      if (entries) {
        entries.forEach(entry => {
          totalBuyTax += getEntryBuyTax(entry);
          totalSellTax += getEntrySellTax(entry);
        });
      }
    } else if (section.id === 'reflection') {
      // Reflection has no addresses - use legacy field with split support
      const share = formData.reflectionShare || 0;
      const sellShare = formData.reflectionShareSell || 0;
      const isSplit = formData.reflectionSplit || false;
      totalBuyTax += isSplit ? share : share / 2;
      totalSellTax += isSplit ? sellShare : share / 2;
    }
  });

  const taxesMatch = Math.abs(totalBuyTax - totalSellTax) < 0.001;

  return (
    <div className="space-y-2">
      {/* Total Tax Display */}
      <div className="p-4 rounded-lg bg-gray-900 border border-cyan-500/30">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-2">TOTAL TAX</div>
          {taxesMatch ? (
            <>
              <div className="text-4xl font-bold text-cyan-400">{totalBuyTax}%</div>
              <div className="text-xs text-gray-500 mt-1">Buy & Sell</div>
            </>
          ) : (
            <div className="flex justify-center gap-8">
              <div>
                <div className="text-3xl font-bold text-green-400">{totalBuyTax}%</div>
                <div className="text-xs text-gray-500">BUY</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">{totalSellTax}%</div>
                <div className="text-xs text-gray-500">SELL</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center py-1">
        Each address has its own tax % and split/unified option.
      </div>

      {/* Fee Sections */}
      {feeSections.map((section) => (
        <FeeSectionComponent
          key={section.id}
          section={section}
          formData={formData}
          onChange={onChange}
          isExpanded={expandedSection === section.id}
          onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
          showReceiveInPLS={showReceiveInPLS && section.id === 'treasury'}
        />
      ))}
    </div>
  );
}

interface FeeSectionProps {
  section: FeeSection;
  formData: TokenFormData;
  onChange: (updates: Partial<TokenFormData>) => void;
  isExpanded: boolean;
  onToggle: () => void;
  showReceiveInPLS?: boolean;
}

function FeeSectionComponent({ section, formData, onChange, isExpanded, onToggle, showReceiveInPLS }: FeeSectionProps) {
  // Get address entries with proper defaults
  const getEntries = (): AddressEntry[] => {
    if (!section.hasAddresses || !section.addressField) return [];
    const entries = formData[section.addressField as keyof TokenFormData] as AddressEntry[] | undefined;
    if (entries && entries.length > 0) return entries;
    return [{ address: section.defaultAddress || '', share: 0, sellShare: 0, split: false }];
  };

  const entries = getEntries();

  // Calculate section totals from entries
  let sectionBuyTax = 0;
  let sectionSellTax = 0;

  if (section.hasAddresses) {
    entries.forEach(entry => {
      sectionBuyTax += getEntryBuyTax(entry);
      sectionSellTax += getEntrySellTax(entry);
    });
  } else if (section.id === 'reflection') {
    const share = formData.reflectionShare || 0;
    const sellShare = formData.reflectionShareSell || 0;
    const isSplit = formData.reflectionSplit || false;
    sectionBuyTax = isSplit ? share : share / 2;
    sectionSellTax = isSplit ? sellShare : share / 2;
  }

  const hasAnyTax = sectionBuyTax > 0 || sectionSellTax > 0;
  const sectionTaxesMatch = Math.abs(sectionBuyTax - sectionSellTax) < 0.001;

  // Update entries and sync legacy fields
  const updateEntries = (newEntries: AddressEntry[]) => {
    if (!section.addressField) return;

    // Calculate total for legacy share field
    let totalBuy = 0;
    let totalSell = 0;
    newEntries.forEach(e => {
      totalBuy += getEntryBuyTax(e);
      totalSell += getEntrySellTax(e);
    });

    const updates: Partial<TokenFormData> = {
      [section.addressField]: newEntries,
    };

    // Update legacy fields
    if (section.legacyField) {
      updates[section.legacyField] = newEntries[0]?.address || '';
    }
    if (section.legacyShareField) {
      updates[section.legacyShareField] = totalBuy + totalSell; // Total for backwards compat
    }

    onChange(updates);
  };

  const addEntry = () => {
    const newEntries = [...entries, { address: '', share: 0, sellShare: 0, split: false }];
    updateEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) {
      const newEntries = [{
        address: entries[0]?.address || section.defaultAddress || '',
        share: 0,
        sellShare: 0,
        split: false
      }];
      updateEntries(newEntries);
      return;
    }
    const newEntries = entries.filter((_, i) => i !== index);
    updateEntries(newEntries);
  };

  const updateEntry = (index: number, updates: Partial<AddressEntry>) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], ...updates };
    // When enabling split, copy share to sellShare as starting point
    if (updates.split === true && !newEntries[index].sellShare) {
      newEntries[index].sellShare = newEntries[index].share;
    }
    updateEntries(newEntries);
  };

  // For reflection (no addresses)
  const reflectionShare = formData.reflectionShare || 0;
  const reflectionSellShare = formData.reflectionShareSell || 0;
  const reflectionSplit = formData.reflectionSplit || false;

  return (
    <div className={`rounded-lg border ${hasAnyTax ? section.borderColor : 'border-gray-800'} bg-gray-900/50 overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${section.bgColor} flex items-center justify-center`}>
            <span className={`material-icons ${section.color}`}>{section.icon}</span>
          </div>
          <div className="text-left">
            <div className={`font-bold ${section.color}`}>{section.name}</div>
            <div className="text-xs text-gray-500">{section.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Show section total in header */}
          {sectionTaxesMatch ? (
            <div className={`px-3 py-1 rounded text-lg font-mono font-bold ${hasAnyTax ? section.color : 'text-gray-600'}`}>
              {sectionBuyTax > 0 ? `${sectionBuyTax}%` : '0%'}
            </div>
          ) : (
            <div className="flex gap-2 text-sm font-mono">
              <span className={sectionBuyTax > 0 ? 'text-green-400' : 'text-gray-600'}>{sectionBuyTax}%B</span>
              <span className="text-gray-600">/</span>
              <span className={sectionSellTax > 0 ? 'text-red-400' : 'text-gray-600'}>{sectionSellTax}%S</span>
            </div>
          )}
          <span className={`material-icons text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-800 space-y-3">
          {section.hasAddresses ? (
            <>
              {/* Address entries with individual tax controls */}
              {entries.map((entry, index) => (
                <div key={index} className="p-3 rounded bg-black/30 border border-gray-800 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">{section.addressLabel} #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      {/* Split/Unified toggle for this entry */}
                      <div className="flex rounded overflow-hidden border border-gray-600 text-xs">
                        <button
                          onClick={() => updateEntry(index, { split: false })}
                          className={`px-2 py-1 font-bold transition-colors ${
                            !entry.split ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          Unified
                        </button>
                        <button
                          onClick={() => updateEntry(index, { split: true })}
                          className={`px-2 py-1 font-bold transition-colors ${
                            entry.split ? 'bg-pink-500 text-black' : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          Split
                        </button>
                      </div>
                      {entries.length > 1 && (
                        <button
                          onClick={() => removeEntry(index)}
                          className="text-red-400 hover:text-red-300 text-xs px-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Address input */}
                  <input
                    type="text"
                    value={entry.address}
                    onChange={(e) => updateEntry(index, { address: e.target.value })}
                    placeholder={section.addressPlaceholder}
                    className={`w-full px-3 py-2 bg-black border ${section.borderColor} rounded text-white font-mono text-sm`}
                  />

                  {/* Tax inputs */}
                  {entry.split ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-green-400 font-bold mb-1">BUY TAX</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="25"
                            step="0.01"
                            value={entry.share || ''}
                            onChange={(e) => updateEntry(index, { share: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-right font-mono text-green-400"
                          />
                          <span className="text-green-400 font-bold">%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-red-400 font-bold mb-1">SELL TAX</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="25"
                            step="0.01"
                            value={entry.sellShare || ''}
                            onChange={(e) => updateEntry(index, { sellShare: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-black border border-red-500/30 rounded text-right font-mono text-red-400"
                          />
                          <span className="text-red-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total Tax:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="25"
                            step="0.01"
                            value={entry.share || ''}
                            onChange={(e) => updateEntry(index, { share: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className={`w-24 px-3 py-2 bg-black border ${section.borderColor} rounded text-right font-mono ${section.color}`}
                          />
                          <span className={`${section.color} font-bold`}>%</span>
                        </div>
                      </div>
                      {entry.share > 0 && (
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          = {entry.share / 2}% buy + {entry.share / 2}% sell
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Receive in PLS toggle (treasury only) */}
              {showReceiveInPLS && (
                <div className="p-3 rounded bg-cyan-500/5 border border-cyan-500/20">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.treasuryReceiveInPLS}
                        onChange={(e) => onChange({ treasuryReceiveInPLS: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors ${
                        formData.treasuryReceiveInPLS ? 'bg-cyan-500' : 'bg-gray-700'
                      }`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.treasuryReceiveInPLS ? 'translate-x-5' : ''
                      }`} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-cyan-400 font-rajdhani group-hover:text-cyan-300 block">
                        Receive in PLS
                      </span>
                      <span className="text-[10px] text-gray-500 font-rajdhani">
                        Treasury wallets receive PLS instead of tokens
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Add button */}
              <button
                onClick={addEntry}
                className={`w-full py-2 rounded border-2 border-dashed ${section.borderColor} ${section.color} hover:bg-white/5 flex items-center justify-center gap-2 font-bold`}
              >
                <span className="material-icons">add</span>
                Add {section.addressLabel}
              </button>
            </>
          ) : (
            /* Reflection - no addresses, just tax input */
            <div className="p-3 rounded bg-black/30 border border-gray-800 space-y-3">
              {/* Split/Unified toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Buy/Sell Mode:</span>
                <div className="flex rounded overflow-hidden border border-gray-600 text-xs">
                  <button
                    onClick={() => onChange({ reflectionSplit: false })}
                    className={`px-2 py-1 font-bold transition-colors ${
                      !reflectionSplit ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Unified
                  </button>
                  <button
                    onClick={() => onChange({
                      reflectionSplit: true,
                      reflectionShareSell: reflectionShare
                    })}
                    className={`px-2 py-1 font-bold transition-colors ${
                      reflectionSplit ? 'bg-pink-500 text-black' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Split
                  </button>
                </div>
              </div>

              {/* Tax inputs */}
              {reflectionSplit ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-green-400 font-bold mb-1">BUY TAX</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.01"
                        value={reflectionShare || ''}
                        onChange={(e) => onChange({ reflectionShare: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-right font-mono text-green-400"
                      />
                      <span className="text-green-400 font-bold">%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-red-400 font-bold mb-1">SELL TAX</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.01"
                        value={reflectionSellShare || ''}
                        onChange={(e) => onChange({ reflectionShareSell: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-black border border-red-500/30 rounded text-right font-mono text-red-400"
                      />
                      <span className="text-red-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Tax:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.01"
                        value={reflectionShare || ''}
                        onChange={(e) => onChange({ reflectionShare: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className={`w-24 px-3 py-2 bg-black border ${section.borderColor} rounded text-right font-mono ${section.color}`}
                      />
                      <span className={`${section.color} font-bold`}>%</span>
                    </div>
                  </div>
                  {reflectionShare > 0 && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      = {reflectionShare / 2}% buy + {reflectionShare / 2}% sell
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500">Distributed to all token holders automatically</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
