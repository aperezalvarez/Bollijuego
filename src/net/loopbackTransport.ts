import type {ConnectOptions, Connection, Listener, Transport} from './transport';

export interface LoopbackOptions {
  /** Parte cada envío en trozos de N bytes (simula segmentación TCP). */
  chunkSize?: number;
  /** Retardo de entrega en ms (0 = microtarea). */
  latencyMs?: number;
}

type Handler<T> = Set<(x: T) => void>;

class Endpoint implements Connection {
  peer!: Endpoint;
  closed = false;
  private data: Handler<Uint8Array> = new Set();
  private close_: Handler<boolean> = new Set();
  private backlog: Uint8Array[] = [];
  constructor(readonly remote: string, private readonly opts: LoopbackOptions) {}

  send(bytes: Uint8Array): void {
    if (this.closed) {
      return;
    }
    const size = this.opts.chunkSize ?? bytes.length;
    for (let i = 0; i < bytes.length; i += size) {
      const chunk = bytes.slice(i, i + size);
      const deliver = () => {
        if (this.peer.closed) {
          return;
        }
        if (this.peer.data.size === 0) {
          this.peer.backlog.push(chunk);
        } else {
          this.peer.data.forEach(cb => cb(chunk));
        }
      };
      if (this.opts.latencyMs) {
        setTimeout(deliver, this.opts.latencyMs);
      } else {
        Promise.resolve().then(deliver);
      }
    }
  }
  close(): void {
    this.shutdown(false);
    this.peer.shutdown(false);
  }
  /** Corte brusco (simula caída de Wi-Fi). */
  drop(): void {
    this.shutdown(true);
    this.peer.shutdown(true);
  }
  private shutdown(err: boolean) {
    if (this.closed) {
      return;
    }
    this.closed = true;
    Promise.resolve().then(() => this.close_.forEach(cb => cb(err)));
  }
  onData(cb: (c: Uint8Array) => void) {
    this.data.add(cb);
    const pending = this.backlog.splice(0);
    pending.forEach(c => cb(c));
    return () => this.data.delete(cb);
  }
  onClose(cb: (e: boolean) => void) {
    this.close_.add(cb);
    return () => this.close_.delete(cb);
  }
}

/** Red en memoria: una instancia = una «LAN». Los hosts se registran por `ip:puerto`. */
export class LoopbackNetwork {
  private servers = new Map<string, Set<(c: Connection) => void>>();
  readonly live = new Set<Endpoint>();
  blocked = new Set<string>();
  constructor(private readonly opts: LoopbackOptions = {}) {}

  transportFor(ip: string): Transport {
    return {
      listen: async ({port}) => {
        const key = `${ip}:${port}`;
        if (this.servers.has(key)) {
          throw new Error('EADDRINUSE');
        }
        const subs: Set<(c: Connection) => void> = new Set();
        this.servers.set(key, subs);
        const l: Listener = {
          port,
          onConnection: cb => {
            subs.add(cb);
            return () => subs.delete(cb);
          },
          stop: async () => {
            this.servers.delete(key);
          },
        };
        return l;
      },
      connect: ({host, port, timeoutMs, signal}: ConnectOptions) =>
        new Promise<Connection>((resolve, reject) => {
          if (signal?.aborted) {
            return reject(new Error('ABORTED'));
          }
          const subs = this.servers.get(`${host}:${port}`);
          if (!subs || this.blocked.has(host)) {
            // un host inexistente / aislado nunca contesta: vence por timeout (como en una Wi-Fi real)
            const t = setTimeout(() => reject(new Error('CONNECT_TIMEOUT')), timeoutMs);
            signal?.addEventListener('abort', () => {
              clearTimeout(t);
              reject(new Error('ABORTED'));
            });
            return;
          }
          const a = new Endpoint(`${host}:${port}`, this.opts);
          const b = new Endpoint(`${ip}:0`, this.opts);
          a.peer = b;
          b.peer = a;
          this.live.add(a);
          this.live.add(b);
          Promise.resolve().then(() => {
            if (signal?.aborted) {
              return reject(new Error('ABORTED'));
            }
            subs.forEach(cb => cb(b));
            resolve(a);
          });
        }),
    };
  }

  /** Corta bruscamente todas las conexiones vivas. */
  dropAll(): void {
    this.live.forEach(e => e.drop());
    this.live.clear();
  }
}
