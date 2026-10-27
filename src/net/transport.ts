/** Contrato mínimo del transporte. Cambiar de librería = una clase nueva. */
export interface Connection {
  readonly remote: string;
  send(bytes: Uint8Array): void;
  close(): void;
  onData(cb: (chunk: Uint8Array) => void): () => void;
  onClose(cb: (hadError: boolean) => void): () => void;
}

export interface Listener {
  readonly port: number;
  onConnection(cb: (c: Connection) => void): () => void;
  stop(): Promise<void>;
}

export interface ConnectOptions {
  host: string;
  port: number;
  timeoutMs: number;
  /** Abortar destruye de verdad el socket en vuelo (NET-8). */
  signal?: AbortSignal;
}

export interface Transport {
  /** Resuelve SOLO cuando el socket está escuchando; rechaza si el puerto está ocupado (NET-4). */
  listen(opts: {port: number}): Promise<Listener>;
  connect(opts: ConnectOptions): Promise<Connection>;
}
