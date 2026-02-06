'use client';

import { Address } from 'viem';

// Token metadata storage
// Stores mapping of token address -> metadata URI
// Uses localStorage for now, can be upgraded to a backend API

const STORAGE_KEY = 'digital_forge_token_metadata';

export interface StoredTokenMetadata {
  imageUri: string;
  metadataUri?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  createdAt: number;
}

type MetadataStore = Record<string, StoredTokenMetadata>;

function getStore(): MetadataStore {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveStore(store: MetadataStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Save token metadata after creation
 */
export function saveTokenMetadata(
  tokenAddress: Address,
  metadata: Omit<StoredTokenMetadata, 'createdAt'>
): void {
  const store = getStore();
  store[tokenAddress.toLowerCase()] = {
    ...metadata,
    createdAt: Date.now(),
  };
  saveStore(store);
}

/**
 * Get token metadata
 */
export function getTokenMetadata(tokenAddress: Address): StoredTokenMetadata | null {
  const store = getStore();
  return store[tokenAddress.toLowerCase()] || null;
}

/**
 * Get all stored token metadata
 */
export function getAllTokenMetadata(): Record<Address, StoredTokenMetadata> {
  return getStore() as Record<Address, StoredTokenMetadata>;
}

/**
 * Check if token has stored metadata
 */
export function hasTokenMetadata(tokenAddress: Address): boolean {
  const store = getStore();
  return !!store[tokenAddress.toLowerCase()];
}
