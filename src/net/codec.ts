import type {ZodType} from 'zod';
import {decodeUtf8, encodeUtf8} from './utf8';

export class FrameTooLarge extends Error {
  constructor() {
    super('FRAME_TOO_LARGE');
  }
}

/** Reensambla un stream TCP en líneas NDJSON trabajando con bytes: ningún carácter multibyte se corrompe. */
export class LineDecoder {
  private pending: Uint8Array = new Uint8Array(0);
  constructor(
    private readonly decode: (bytes: Uint8Array) => string = decodeUtf8,
    private readonly maxFrameBytes = 64 * 1024,
  ) {}

  push(chunk: Uint8Array): string[] {
    const merged = new Uint8Array(this.pending.length + chunk.length);
    merged.set(this.pending, 0);
    merged.set(chunk, this.pending.length);
    const lines: string[] = [];
    let start = 0;
    for (let i = 0; i < merged.length; i++) {
      if (merged[i] === 0x0a) {
        lines.push(this.decode(merged.subarray(start, i)));
        start = i + 1;
      }
    }
    this.pending = merged.slice(start);
    if (this.pending.length > this.maxFrameBytes) {
      throw new FrameTooLarge();
    }
    return lines;
  }
}

export type Parsed<T> = {ok: true; value: T} | {ok: false; reason: 'BAD_JSON' | 'BAD_SCHEMA'};

export function parseLine<T>(line: string, schema: ZodType<T>): Parsed<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return {ok: false, reason: 'BAD_JSON'};
  }
  const r = schema.safeParse(raw);
  return r.success ? {ok: true, value: r.data} : {ok: false, reason: 'BAD_SCHEMA'};
}

export const encodeLine = (msg: unknown): Uint8Array => encodeUtf8(JSON.stringify(msg) + '\n');
