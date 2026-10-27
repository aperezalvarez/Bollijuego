import {Buffer} from 'buffer';

export const encodeUtf8 = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, 'utf8'));
export const decodeUtf8 = (b: Uint8Array): string => Buffer.from(b).toString('utf8');
