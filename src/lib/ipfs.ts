'use client';

// IPFS upload via NFT.storage or Pinata
// Using public gateway for reads, authenticated upload for writes

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image: string; // IPFS URI (ipfs://...)
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadToIPFS(file: File): Promise<string> {
  if (!PINATA_JWT) {
    // Fallback: use local storage simulation for dev
    console.warn('PINATA_JWT not set, using localStorage fallback');
    return uploadToLocalStorage(file);
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadMetadataToIPFS(metadata: TokenMetadata): Promise<string> {
  if (!PINATA_JWT) {
    console.warn('PINATA_JWT not set, using localStorage fallback');
    return uploadMetadataToLocalStorage(metadata);
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.symbol}_metadata.json`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Metadata upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return '';
  if (ipfsUri.startsWith('ipfs://')) {
    return PINATA_GATEWAY + ipfsUri.slice(7);
  }
  if (ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }
  return PINATA_GATEWAY + ipfsUri;
}

/**
 * Local storage fallback for development (no IPFS key)
 */
async function uploadToLocalStorage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const hash = generateHash(base64);
      localStorage.setItem(`ipfs_${hash}`, base64);
      resolve(`local://${hash}`);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadMetadataToLocalStorage(metadata: TokenMetadata): Promise<string> {
  const json = JSON.stringify(metadata);
  const hash = generateHash(json);
  localStorage.setItem(`ipfs_${hash}`, json);
  return `local://${hash}`;
}

function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get content from local storage fallback
 */
export function getFromLocalStorage(localUri: string): string | null {
  if (!localUri.startsWith('local://')) return null;
  const hash = localUri.slice(8);
  return localStorage.getItem(`ipfs_${hash}`);
}
