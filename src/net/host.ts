import {isCorrect, type GameCase, type SuspectId, type Submission} from '../domain';
import {NetError, type NetErrorCode} from './errors';
import {Observable} from './observable';
import {
  ClientMsgZ,
  RULES_VERSION,
  proofOf,
  type BoardRow,
  type CaseDto,
  type ClientMsg,
  type HostMsg,
  type LinkState,
  type NetMode,
  type PlayerInfo,
} from './protocol';
import {PORT_BASE, PORT_COUNT, makeCode} from './roomCode';
import {decideWinner, type Submission as TimedSubmission} from './room';
import type {Connection, Listener, Transport} from './transport';
import {Wire} from './wire';

export type RoomPhase = 'lobby' | 'started' | 'finished';
export interface ResultInfo {
  winnerId: string | null;
  board: BoardRow[];
  truth: Submission;
}
export interface HostSnapshot {
  phase: RoomPhase;
  code: string | null;
  roster: PlayerInfo[];
  startAtHostMs: number | null;
  result: ResultInfo | null;
  error: NetErrorCode | null;
}

export interface HostOptions {
  transport: Transport;
  localIp: string;
  name: string;
  mode: NetMode;
  game: GameCase;
  maxPlayers: number; // 2..4
  now?: () => number;
  random?: () => number;
  countdownMs?: number;
}

interface Player {
  id: string;
  clientId: string;
  name: string;
  token: string;
  wire: Wire<ClientMsg, HostMsg> | null;
  link: LinkState;
  lastHeard: number;
  rttMs?: number;
  ready: boolean;
  sub: (TimedSubmission & {correct: boolean}) | null;
}

const DEGRADED_MS = 5000;
const LOST_MS = 12000;
const GRACE_MS = 60000;

const randId = (rnd: () => number, n = 16) =>
  Array.from({length: n}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(rnd() * 36)]).join('');

/** Anfitrión AUTORITATIVO: posee el reloj, el caso secreto (Versus) y el veredicto. */
export class HostSession {
  readonly state = new Observable<HostSnapshot>({
    phase: 'lobby',
    code: null,
    roster: [],
    startAtHostMs: null,
    result: null,
    error: null,
  });
  private players = new Map<string, Player>();
  private listener: Listener | null = null;
  private offConn: (() => void) | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private code = '';
  private fails = new Map<string, {n: number; until: number}>();
  private now: () => number;
  private rnd: () => number;
  private closed = false;

  constructor(private readonly o: HostOptions) {
    this.now = o.now ?? (() => performance.now());
    this.rnd = o.random ?? Math.random;
    this.players.set('host', {
      id: 'host',
      clientId: 'host',
      name: o.name,
      token: '',
      wire: null,
      link: 'ok',
      lastHeard: 0,
      ready: true,
      sub: null,
    });
  }

  /** Abre la sala. Sólo resuelve cuando el servidor ESCUCHA de verdad (NET-4). */
  async open(): Promise<string> {
    for (let i = 0; i < PORT_COUNT; i++) {
      try {
        this.listener = await this.o.transport.listen({port: PORT_BASE + i});
        const parsed = makeCode(this.o.localIp, i, this.rnd);
        this.code = parsed.code;
        this.offConn = this.listener.onConnection(c => this.onConnection(c));
        this.timer = setInterval(() => this.tick(), 2000);
        this.publish({code: this.code});
        return this.code;
      } catch {
        // puerto ocupado: probar el siguiente del rango
      }
    }
    this.publish({error: 'PORT_BUSY'});
    throw new NetError('PORT_BUSY');
  }

  // ---------------------------------------------------------------- conexiones
  private onConnection(conn: Connection): void {
    const ip = conn.remote.split(':')[0];
    const f = this.fails.get(ip);
    const wire = new Wire<ClientMsg, HostMsg>(conn, ClientMsgZ);
    if (f && f.until > this.now()) {
      wire.send({t: 'REJECT', code: 'BLOCKED'});
      setTimeout(() => conn.close(), 50);
      return;
    }
    const salt = randId(this.rnd, 12);
    let player: Player | null = null;
    const helloTimer = setTimeout(() => {
      if (!player) {
        conn.close();
      }
    }, 5000);
    wire.onViolation = () => clearTimeout(helloTimer);
    wire.onMessage = m => {
      if (!player) {
        if (m.t !== 'HELLO') {
          return conn.close();
        }
        clearTimeout(helloTimer);
        player = this.handshake(wire, m, salt, ip);
        return;
      }
      this.onPlayerMessage(player, m);
    };
    wire.start();
    conn.onClose(() => {
      clearTimeout(helloTimer);
      if (player && player.wire === wire) {
        this.dropLink(player);
      }
    });
    wire.send({t: 'CHALLENGE', salt});
  }

  private reject(wire: Wire<ClientMsg, HostMsg>, code: Extract<HostMsg, {t: 'REJECT'}>['code']): null {
    wire.send({t: 'REJECT', code});
    setTimeout(() => wire.conn.close(), 100);
    return null;
  }

  private handshake(
    wire: Wire<ClientMsg, HostMsg>,
    m: Extract<ClientMsg, {t: 'HELLO'}>,
    salt: string,
    ip: string,
  ): Player | null {
    if (m.proof !== proofOf(this.code, salt, m.clientId)) {
      const f = this.fails.get(ip) ?? {n: 0, until: 0};
      f.n += 1;
      if (f.n >= 5) {
        f.until = this.now() + 30000;
        f.n = 0;
      }
      this.fails.set(ip, f);
      return this.reject(wire, 'BAD_PROOF');
    }
    if (m.rulesVersion !== RULES_VERSION) {
      return this.reject(wire, 'BAD_RULES');
    }
    if (m.mode !== this.o.mode) {
      return this.reject(wire, 'MODE_MISMATCH');
    }
    const snap = this.state.get();

    let p: Player | undefined;
    if (m.resumeToken) {
      p = [...this.players.values()].find(x => x.token === m.resumeToken && x.clientId === m.clientId);
      if (!p || p.link === 'left') {
        return this.reject(wire, 'EXPIRED');
      }
      if (p.wire) {
        p.wire.dispose();
        p.wire.conn.close();
      }
    } else {
      p = [...this.players.values()].find(x => x.clientId === m.clientId && x.link !== 'left');
      if (!p) {
        if (snap.phase !== 'lobby') {
          return this.reject(wire, 'ALREADY_STARTED');
        }
        const active = [...this.players.values()].filter(x => x.link !== 'left').length;
        if (active >= this.o.maxPlayers) {
          return this.reject(wire, 'ROOM_FULL');
        }
        p = {
          id: `p${this.players.size}`,
          clientId: m.clientId,
          name: m.name.trim().slice(0, 24) || 'Jugador',
          token: randId(this.rnd, 24),
          wire: null,
          link: 'connecting',
          lastHeard: 0,
          ready: false,
          sub: null,
        };
        this.players.set(p.id, p);
      } else if (p.wire) {
        p.wire.dispose();
        p.wire.conn.close();
      }
    }
    p.wire = wire;
    p.link = 'ok';
    p.lastHeard = this.now();
    const player = p;
    wire.send({
      t: 'WELCOME',
      you: player.id,
      resumeToken: player.token,
      roster: this.roster(),
      caseDto: this.caseDto(),
      started: snap.phase !== 'lobby',
      startAtHostMs: snap.startAtHostMs ?? undefined,
      hostNowMs: this.now(),
    });
    if (snap.result) {
      this.sendResult(player);
    }
    this.publishRoster();
    return player;
  }

  private onPlayerMessage(p: Player, m: ClientMsg): void {
    p.lastHeard = this.now();
    if (p.link !== 'ok') {
      p.link = 'ok';
      this.publishRoster();
    }
    switch (m.t) {
      case 'PING': {
        const t1 = this.now();
        p.wire?.send({t: 'PONG', t0: m.t0, t1, t2: this.now()});
        break;
      }
      case 'READY':
        p.ready = m.ready;
        this.publishRoster();
        break;
      case 'SUBMIT':
        this.handleSubmit(p, m.killers, m.liars, m.elapsedMs);
        break;
      case 'BYE':
        p.link = 'left';
        p.wire?.dispose();
        p.wire?.conn.close();
        p.wire = null;
        this.publishRoster();
        this.checkFinish();
        break;
      default:
        break;
    }
  }

  private dropLink(p: Player): void {
    p.wire = null;
    if (p.link !== 'left') {
      p.link = 'reconnecting';
    }
    this.publishRoster();
  }

  // ---------------------------------------------------------------- latido
  private tick(): void {
    const t = this.now();
    let changed = false;
    for (const p of this.players.values()) {
      if (p.id === 'host' || p.link === 'left') {
        continue;
      }
      const silence = t - p.lastHeard;
      let next: LinkState = p.link;
      if (silence >= GRACE_MS) {
        next = 'left';
      } else if (silence >= LOST_MS) {
        next = 'reconnecting';
      } else if (silence >= DEGRADED_MS) {
        next = p.wire ? 'degraded' : 'reconnecting';
      }
      if (next === 'reconnecting' && p.wire) {
        p.wire.dispose();
        p.wire.conn.close();
        p.wire = null;
      }
      if (next !== p.link) {
        p.link = next;
        changed = true;
      }
    }
    if (changed) {
      this.publishRoster();
      this.checkFinish();
    }
  }

  // ---------------------------------------------------------------- partida
  /** Sólo el anfitrión: cuenta atrás sincronizada (3 s) para todos. */
  startGame(): boolean {
    const s = this.state.get();
    const connected = [...this.players.values()].filter(p => p.link === 'ok' || p.link === 'degraded');
    if (s.phase !== 'lobby' || connected.length < 2) {
      return false;
    }
    const startAtHostMs = this.now() + (this.o.countdownMs ?? 3000);
    this.state.set({phase: 'started', startAtHostMs});
    this.broadcast({t: 'START', atHostMs: startAtHostMs});
    this.publishRoster();
    return true;
  }

  setHostReady(ready: boolean): void {
    const h = this.players.get('host');
    if (h) {
      h.ready = ready;
    }
    this.publishRoster();
  }

  /** Entrega del propio anfitrión (Versus). */
  submitHost(sub: Submission, elapsedMs: number): void {
    this.handleSubmit(this.players.get('host') as Player, sub.killers, sub.liars, elapsedMs);
  }

  private handleSubmit(p: Player, killers: SuspectId[], liars: SuspectId[], elapsedMs: number): void {
    if (this.o.mode !== 'versus' || this.state.get().phase !== 'started' || p.sub) {
      return;
    }
    const correct = isCorrect(this.o.game, {killers, liars});
    p.sub = {playerId: p.id, correct, elapsedMs, receivedAtHostMs: this.now()};
    for (const q of this.players.values()) {
      if (q.id !== p.id && q.wire) {
        q.wire.send({t: 'OPPONENT_SUBMITTED', playerId: p.id, name: p.name});
      }
    }
    this.publishRoster();
    this.checkFinish();
  }

  private checkFinish(): void {
    if (this.o.mode !== 'versus' || this.state.get().phase !== 'started') {
      return;
    }
    const active = [...this.players.values()].filter(p => p.link !== 'left');
    if (active.length > 0 && active.every(p => p.sub)) {
      this.finish();
    }
  }

  /** Cierra la carrera aunque falte alguien (p. ej. «terminar ya»). */
  finish(): void {
    if (this.state.get().phase !== 'started') {
      return;
    }
    const subs = [...this.players.values()].flatMap(p => (p.sub ? [p.sub] : []));
    const board: BoardRow[] = [...this.players.values()]
      .filter(p => p.sub)
      .map(p => ({
        id: p.id,
        name: p.name,
        correct: (p.sub as {correct: boolean}).correct,
        elapsedMs: (p.sub as TimedSubmission).elapsedMs,
      }))
      .sort((a, b) => Number(b.correct) - Number(a.correct) || a.elapsedMs - b.elapsedMs);
    const result: ResultInfo = {winnerId: decideWinner(subs), board, truth: this.o.game.solution};
    this.state.set({phase: 'finished', result});
    for (const p of this.players.values()) {
      this.sendResult(p);
    }
  }

  private sendResult(p: Player): void {
    const r = this.state.get().result;
    if (r && p.wire) {
      p.wire.send({t: 'RESULT', winnerId: r.winnerId, board: r.board, truth: r.truth});
    }
  }

  // ---------------------------------------------------------------- utilidades
  private caseDto(): CaseDto {
    const g = this.o.game;
    return {
      seed: g.seed,
      rulesVersion: g.rulesVersion,
      witnesses: g.witnesses,
      slots: g.slots,
      killers: g.solution.killers.length,
      liars: g.solution.liars.length,
      ...(this.o.mode === 'cooperativo' ? {solution: g.solution} : {}),
    };
  }

  private roster(): PlayerInfo[] {
    return [...this.players.values()]
      .filter(p => p.link !== 'left' || p.id === 'host')
      .map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.id === 'host',
        link: p.link,
        rttMs: p.rttMs,
        ready: p.ready,
        submitted: !!p.sub,
      }));
  }

  private broadcast(msg: Parameters<Wire<ClientMsg, HostMsg>['send']>[0]): void {
    for (const p of this.players.values()) {
      p.wire?.send(msg);
    }
  }

  private publishRoster(): void {
    const roster = this.roster();
    this.state.set({roster});
    this.broadcast({t: 'ROSTER', players: roster});
  }

  private publish(p: Partial<HostSnapshot>): void {
    this.state.set(p);
    if (p.code !== undefined) {
      this.publishRoster();
    }
  }

  get game(): GameCase {
    return this.o.game;
  }
  get mode(): NetMode {
    return this.o.mode;
  }
  get roomCode(): string {
    return this.code;
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.offConn?.();
    for (const p of this.players.values()) {
      p.wire?.dispose();
      p.wire?.conn.close();
    }
    await this.listener?.stop();
  }
}
