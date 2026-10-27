/* eslint-disable no-void -- promesas deliberadamente no esperadas */
import type {Submission} from '../domain';
import {guessHost, scanTargets, type NetEnv} from './discovery';
import {NetError, type NetErrorCode} from './errors';
import {Liveness} from './liveness';
import {bestOffset, toLocalTime, type PingSample} from './clock';
import {Observable} from './observable';
import {
  HostMsgZ,
  RULES_VERSION,
  proofOf,
  type BoardRow,
  type CaseDto,
  type ClientMsg,
  type HostMsg,
  type NetMode,
  type PlayerInfo,
  type RejectCode,
} from './protocol';
import {parseCode, type ParsedCode} from './roomCode';
import type {Transport} from './transport';
import {Wire} from './wire';

export type ClientLink =
  | 'idle'
  | 'searching'
  | 'connecting'
  | 'ok'
  | 'degraded'
  | 'reconnecting'
  | 'failed'
  | 'closed';
export interface ClientResult {
  winnerId: string | null;
  board: BoardRow[];
  truth: Submission;
}
export interface ClientSnapshot {
  link: ClientLink;
  scanned: number;
  scanTotal: number;
  roster: PlayerInfo[];
  caseDto: CaseDto | null;
  youId: string | null;
  phase: 'lobby' | 'started' | 'finished';
  /** Instante de salida en el reloj MONOTÓNICO local (ya corregido con el desfase del anfitrión). */
  startAtLocalMs: number | null;
  result: ClientResult | null;
  error: NetErrorCode | null;
  rttMs: number | null;
}

export interface ClientOptions {
  transport: Transport;
  env: NetEnv;
  code: string;
  name: string;
  mode: NetMode;
  clientId: string;
  now?: () => number;
  probeTimeoutMs?: number;
  scanConcurrency?: number;
}

type CWire = Wire<HostMsg, ClientMsg>;
interface Handshake {
  wire: CWire;
  welcome: Extract<HostMsg, {t: 'WELCOME'}>;
  host: string;
}

const REJECT_TO_ERROR: Record<RejectCode, NetErrorCode> = {
  BAD_PROOF: 'BAD_CODE',
  BAD_RULES: 'BAD_RULES',
  MODE_MISMATCH: 'MODE_MISMATCH',
  ROOM_FULL: 'ROOM_FULL',
  ALREADY_STARTED: 'ALREADY_STARTED',
  EXPIRED: 'EXPIRED',
  BLOCKED: 'BLOCKED',
};
const DEFINITIVE: NetErrorCode[] = [
  'MODE_MISMATCH',
  'BAD_RULES',
  'ROOM_FULL',
  'ALREADY_STARTED',
  'BLOCKED',
  'EXPIRED',
];

export class ClientSession {
  readonly state = new Observable<ClientSnapshot>({
    link: 'idle',
    scanned: 0,
    scanTotal: 0,
    roster: [],
    caseDto: null,
    youId: null,
    phase: 'lobby',
    startAtLocalMs: null,
    result: null,
    error: null,
    rttMs: null,
  });
  private abort: AbortController | null = null;
  private wire: CWire | null = null;
  private parsed: ParsedCode | null = null;
  private hostIp: string | null = null;
  private resumeToken = '';
  private startAtHost: number | null = null;
  private samples: PingSample[] = [];
  private offsetMs = 0;
  private live: Liveness | null = null;
  private closed = false;
  private reconnecting = false;
  private now: () => number;
  private probeMs: number;

  constructor(private readonly o: ClientOptions) {
    this.now = o.now ?? (() => performance.now());
    this.probeMs = o.probeTimeoutMs ?? 800;
  }

  // ---------------------------------------------------------------- unirse
  async join(): Promise<void> {
    const parsed = parseCode(this.o.code);
    if (!parsed) {
      throw this.fail('BAD_CODE');
    }
    if (!this.o.env.ip) {
      throw this.fail('NO_WIFI');
    }
    this.parsed = parsed;
    this.abort = new AbortController();
    const {signal} = this.abort;
    this.state.set({link: 'searching', error: null, scanned: 0});
    let sawBadCode = false;

    const attempt = async (host: string, timeout: number): Promise<Handshake | null> => {
      try {
        return await this.probe(host, timeout, signal);
      } catch (e) {
        if (e instanceof NetError) {
          if (e.code === 'BAD_CODE') {
            sawBadCode = true;
          } else if (e.code === 'CANCELLED' || DEFINITIVE.includes(e.code)) {
            throw e;
          }
        }
        return null;
      }
    };

    try {
      const guess = guessHost(this.o.env, parsed.hostOctet);
      let hs: Handshake | null = guess ? await attempt(guess, Math.max(this.probeMs, 1500)) : null;
      if (!hs) {
        const targets = scanTargets(this.o.env, guess ? [guess] : []);
        this.state.set({scanTotal: targets.length});
        let i = 0;
        const worker = async () => {
          while (!hs && !signal.aborted && i < targets.length) {
            const host = targets[i++];
            const r = await attempt(host, this.probeMs);
            this.state.set({scanned: Math.min(i, targets.length)});
            if (r && !hs) {
              hs = r;
            } else if (r) {
              r.wire.dispose();
              r.wire.conn.close();
            }
          }
        };
        await Promise.all(Array.from({length: this.o.scanConcurrency ?? 24}, worker));
      }
      if (signal.aborted) {
        throw new NetError('CANCELLED');
      }
      if (!hs) {
        throw new NetError(sawBadCode ? 'BAD_CODE' : 'NOT_FOUND');
      }
      this.adopt(hs);
    } catch (e) {
      this.abort.abort();
      const code = e instanceof NetError ? e.code : 'NOT_FOUND';
      this.state.set({link: code === 'CANCELLED' ? 'closed' : 'failed', error: code});
      throw e instanceof NetError ? e : new NetError(code);
    }
  }

  /** «Cancelar» de verdad: aborta todos los sockets en vuelo. */
  cancel(): void {
    this.abort?.abort();
  }

  private probe(host: string, timeoutMs: number, signal: AbortSignal, resume?: string): Promise<Handshake> {
    const p = this.parsed as ParsedCode;
    return new Promise<Handshake>((resolve, reject) => {
      this.o.transport.connect({host, port: p.port, timeoutMs, signal}).then(conn => {
        const wire: CWire = new Wire<HostMsg, ClientMsg>(conn, HostMsgZ);
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          signal.removeEventListener('abort', onAbort);
          fn();
        };
        const kill = (e: Error) =>
          finish(() => {
            wire.dispose();
            conn.close();
            reject(e);
          });
        const onAbort = () => kill(new NetError('CANCELLED'));
        const timer = setTimeout(() => kill(new Error('HANDSHAKE_TIMEOUT')), Math.max(timeoutMs, 3000));
        signal.addEventListener('abort', onAbort);
        conn.onClose(() => kill(new Error('CLOSED')));
        wire.onViolation = () => kill(new Error('VIOLATION'));
        wire.onMessage = m => {
          if (m.t === 'CHALLENGE') {
            wire.send({
              t: 'HELLO',
              clientId: this.o.clientId,
              name: this.o.name,
              mode: this.o.mode,
              rulesVersion: RULES_VERSION,
              proof: proofOf(p.code, m.salt, this.o.clientId),
              resumeToken: resume,
            });
          } else if (m.t === 'WELCOME') {
            finish(() => resolve({wire, welcome: m, host}));
          } else if (m.t === 'REJECT') {
            kill(new NetError(REJECT_TO_ERROR[m.code]));
          }
        };
        wire.start();
      }, reject);
    });
  }

  // ---------------------------------------------------------------- sesión viva
  private adopt(hs: Handshake): void {
    this.wire?.dispose();
    this.wire = hs.wire;
    this.hostIp = hs.host;
    this.resumeToken = hs.welcome.resumeToken;
    this.samples = [];
    this.offsetMs = hs.welcome.hostNowMs - this.now();
    this.startAtHost = hs.welcome.startAtHostMs ?? null;
    const w = hs.welcome;
    this.state.set({
      link: 'ok',
      error: null,
      roster: w.roster,
      caseDto: w.caseDto,
      youId: w.you,
      phase: w.started ? 'started' : 'lobby',
      rttMs: null,
    });
    this.refreshStart();
    hs.wire.onViolation = () => this.onLinkLost();
    hs.wire.onMessage = m => this.onMessage(m);
    hs.wire.conn.onClose(() => {
      if (this.wire === hs.wire) {
        this.onLinkLost();
      }
    });
    this.live?.stop();
    this.live = new Liveness(
      this.now,
      () => this.wire?.send({t: 'PING', t0: this.now()}),
      s => {
        if (s === 'lost') {
          this.onLinkLost();
        } else {
          this.state.set({link: s === 'degraded' ? 'degraded' : 'ok'});
        }
      },
    );
    this.live.start();
    for (let i = 0; i < 4; i++) {
      hs.wire.send({t: 'PING', t0: this.now()});
    } // calibración inicial del reloj
  }

  private onMessage(m: HostMsg): void {
    this.live?.heard();
    switch (m.t) {
      case 'ROSTER':
        this.state.set({roster: m.players});
        break;
      case 'PONG': {
        const t3 = this.now();
        this.samples = [...this.samples.slice(-7), {t0: m.t0, t1: m.t1, t2: m.t2, t3}];
        const est = bestOffset(this.samples);
        if (est) {
          this.offsetMs = est.offsetMs;
          this.state.set({rttMs: Math.round(est.rttMs)});
          this.refreshStart();
        }
        break;
      }
      case 'START':
        this.startAtHost = m.atHostMs;
        this.state.set({phase: 'started', result: null});
        this.refreshStart();
        break;
      case 'RESULT':
        this.state.set({phase: 'finished', result: {winnerId: m.winnerId, board: m.board, truth: m.truth}});
        break;
      default:
        break;
    }
  }

  private refreshStart(): void {
    if (this.startAtHost !== null) {
      this.state.set({startAtLocalMs: toLocalTime(this.startAtHost, this.offsetMs)});
    }
  }

  // ---------------------------------------------------------------- reconexión
  private onLinkLost(): void {
    if (this.closed || this.reconnecting) {
      return;
    }
    this.reconnecting = true;
    this.live?.stop();
    this.wire?.dispose();
    this.wire = null;
    this.state.set({link: 'reconnecting'});
    void this.reconnectLoop();
  }

  private async reconnectLoop(): Promise<void> {
    const deadline = this.now() + 60000;
    this.abort = new AbortController();
    for (let n = 0; !this.closed && this.now() < deadline; n++) {
      await new Promise(r => setTimeout(r, Math.min(8000, 500 * 2 ** n)));
      if (this.closed) {
        return;
      }
      try {
        const hs = await this.probe(this.hostIp as string, 1500, this.abort.signal, this.resumeToken);
        this.reconnecting = false;
        this.adopt(hs);
        return;
      } catch (e) {
        if (e instanceof NetError && (DEFINITIVE.includes(e.code) || e.code === 'BAD_CODE')) {
          this.reconnecting = false;
          this.state.set({link: 'failed', error: e.code === 'BAD_CODE' ? 'EXPIRED' : e.code});
          return;
        }
      }
    }
    if (!this.closed) {
      this.reconnecting = false;
      this.state.set({link: 'failed', error: 'LINK_LOST'});
    }
  }

  // ---------------------------------------------------------------- acciones
  setReady(ready: boolean): void {
    this.wire?.send({t: 'READY', ready});
  }

  /** Versus: envía la acusación al anfitrión con el tiempo medido localmente (reloj monotónico). */
  submit(sub: Submission, elapsedMs: number): void {
    this.wire?.send({t: 'SUBMIT', killers: sub.killers, liars: sub.liars, elapsedMs});
  }

  /** Milisegundos desde la salida común (puede ser negativo durante la cuenta atrás). */
  elapsedMs(): number | null {
    const s = this.state.get().startAtLocalMs;
    return s === null ? null : this.now() - s;
  }

  leave(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.abort?.abort();
    this.live?.stop();
    this.wire?.send({t: 'BYE'});
    const w = this.wire;
    this.wire = null;
    setTimeout(() => {
      w?.dispose();
      w?.conn.close();
    }, 50);
    this.state.set({link: 'closed'});
  }

  private fail(code: NetErrorCode): NetError {
    this.state.set({link: 'failed', error: code});
    return new NetError(code);
  }
}
