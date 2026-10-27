import type {ZodType} from 'zod';
import {LineDecoder, encodeLine, parseLine} from './codec';
import {PROTOCOL_VERSION} from './protocol';
import type {Connection} from './transport';

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Una conexión + su decodificador + su esquema + su contador `seq`. Nada sin validar llega a la app. */
export class Wire<In extends {t: string}, Out extends {t: string; v: number; seq: number}> {
  private seq = 0;
  private dec = new LineDecoder();
  private lastIn = -1;
  onMessage: (m: In) => void = () => {};
  onViolation: (reason: string) => void = () => {};
  private off: () => void = () => {};

  constructor(readonly conn: Connection, private readonly schema: ZodType<In>) {}

  /** Empieza a leer. Se llama DESPUÉS de asignar `onMessage`, para no perder la primera trama. */
  start(): this {
    const {conn, schema} = this;
    this.off = conn.onData(chunk => {
      try {
        for (const line of this.dec.push(chunk)) {
          const p = parseLine(line, schema);
          if (!p.ok) {
            this.onViolation(p.reason);
            conn.close();
            return;
          }
          const seq = (p.value as {seq?: number}).seq ?? 0;
          if (seq <= this.lastIn) {
            continue;
          } // duplicado: idempotencia
          this.lastIn = seq;
          this.onMessage(p.value);
        }
      } catch {
        this.onViolation('FRAME');
        conn.close();
      }
    });
    return this;
  }

  send(msg: DistOmit<Out, 'v' | 'seq'>): void {
    this.conn.send(encodeLine({v: PROTOCOL_VERSION, seq: ++this.seq, ...msg}));
  }

  dispose(): void {
    this.off();
  }
}
