export type LinkState = 'ok' | 'degraded' | 'lost';

export interface LivenessConfig {
  pingEveryMs: number;
  degradedAfterMs: number;
  lostAfterMs: number;
}
export const DEFAULT_LIVENESS: LivenessConfig = {
  pingEveryMs: 2_000,
  degradedAfterMs: 5_000,
  lostAfterMs: 12_000,
};

/** Monitor de latido con reloj inyectable (se testea con fake timers y sin red). */
export class Liveness {
  private lastHeard: number;
  private state: LinkState = 'ok';
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly now: () => number,
    private readonly sendPing: () => void,
    private readonly onChange: (s: LinkState) => void,
    private readonly cfg: LivenessConfig = DEFAULT_LIVENESS,
  ) {
    this.lastHeard = now();
  }

  start(): void {
    this.stop();
    this.timer = setInterval(() => this.tick(), this.cfg.pingEveryMs);
  }
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = undefined;
  }

  /** Llamar con CUALQUIER mensaje recibido (no solo PONG): el tráfico también demuestra vida. */
  heard(): void {
    this.lastHeard = this.now();
    this.set('ok');
  }

  tick(): void {
    const silence = this.now() - this.lastHeard;
    this.set(
      silence >= this.cfg.lostAfterMs ? 'lost' : silence >= this.cfg.degradedAfterMs ? 'degraded' : 'ok',
    );
    if (this.state !== 'lost') {
      this.sendPing();
    }
  }

  private set(s: LinkState): void {
    if (s !== this.state) {
      this.state = s;
      this.onChange(s);
    }
  }
}
