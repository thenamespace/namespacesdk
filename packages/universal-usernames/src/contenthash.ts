import { encode } from '@ensdomains/content-hash';
import type { HexString } from './types';

export const SUPPORTED_CONTENTHASH_PROTOCOLS = ['ipfs', 'ipns', 'bzz', 'ar'] as const;

type ContenthashProtocol = (typeof SUPPORTED_CONTENTHASH_PROTOCOLS)[number];

const CODEC_BY_PROTOCOL = {
  ipfs: 'ipfs',
  ipns: 'ipns',
  bzz: 'swarm',
  ar: 'arweave',
} as const satisfies Record<ContenthashProtocol, string>;

// content-hash encodes swarm and arweave input without checking it ("zzzz"
// becomes bytes), so their formats are checked here first.
const SWARM_REFERENCE = /^[0-9a-fA-F]{64}$/;
const ARWEAVE_TRANSACTION_ID = /^[A-Za-z0-9_-]{43}$/;

export type ContenthashEncoding =
  | { ok: true; hex: HexString }
  | { ok: false; reason: 'unsupported' | 'invalid'; message: string };

function isSupportedProtocol(protocol: string): protocol is ContenthashProtocol {
  return (SUPPORTED_CONTENTHASH_PROTOCOLS as readonly string[]).includes(protocol);
}

/**
 * Encodes `ipfs://`, `ipns://`, `bzz://` or `ar://` URIs to ENSIP-7 bytes.
 * Any other scheme is unsupported; a bare CID is never treated as IPFS.
 */
export function encodeContenthash(uri: string): ContenthashEncoding {
  const separator = uri.indexOf('://');
  const protocol = separator === -1 ? '' : uri.slice(0, separator);
  if (!isSupportedProtocol(protocol)) {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'Contenthash must start with ipfs://, ipns://, bzz:// or ar://',
    };
  }

  const value = uri.slice(separator + 3);
  if (protocol === 'bzz' && !SWARM_REFERENCE.test(value)) {
    return { ok: false, reason: 'invalid', message: 'bzz:// needs a 64-character hex Swarm reference' };
  }
  if (protocol === 'ar' && !ARWEAVE_TRANSACTION_ID.test(value)) {
    return { ok: false, reason: 'invalid', message: 'ar:// needs a 43-character Arweave transaction ID' };
  }

  try {
    return { ok: true, hex: `0x${encode(CODEC_BY_PROTOCOL[protocol], value)}` };
  } catch {
    return { ok: false, reason: 'invalid', message: `Not a valid ${protocol}:// contenthash` };
  }
}
