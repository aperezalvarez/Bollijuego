import TcpSocket from 'react-native-tcp-socket';
import type {ConnectOptions, Connection, Listener, Transport} from './transport';

/** Sin `setEncoding` la librería entrega bytes; la decodificación UTF-8 es cosa del LineDecoder. */
const toBytes = (d: unknown): Uint8Array => new Uint8Array(d as ArrayLike<number>);

function wrap(socket: InstanceType<typeof TcpSocket.Socket>, remote: string): Connection {
  socket.setNoDelay(true);
  return {
    remote,
    send: bytes => {
      socket.write(bytes);
    },
    close: () => socket.destroy(),
    onData: cb => {
      const h = (d: unknown) => cb(toBytes(d));
      socket.on('data', h);
      return () => socket.off('data', h);
    },
    onClose: cb => {
      const h = (err: boolean) => cb(err);
      socket.on('close', h);
      return () => socket.off('close', h);
    },
  };
}

export const tcpTransport: Transport = {
  listen: ({port}) =>
    new Promise<Listener>((resolve, reject) => {
      const subs = new Set<(c: Connection) => void>();
      const server = TcpSocket.createServer(socket => {
        const c = wrap(socket, `${socket.remoteAddress ?? '?'}:${socket.remotePort ?? 0}`);
        subs.forEach(cb => cb(c));
      });
      server.once('error', err => reject(err));
      server.listen({port, host: '0.0.0.0', reuseAddress: true}, () =>
        resolve({
          port,
          onConnection: cb => {
            subs.add(cb);
            return () => subs.delete(cb);
          },
          stop: () => new Promise<void>(res => server.close(() => res())),
        }),
      );
    }),

  connect: ({host, port, timeoutMs, signal}: ConnectOptions) =>
    new Promise<Connection>((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new Error('ABORTED'));
      }
      let done = false;
      const finish = (fn: () => void) => {
        if (done) {
          return;
        }
        done = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        fn();
      };
      const onAbort = () =>
        finish(() => {
          socket.destroy();
          reject(new Error('ABORTED'));
        });
      const timer = setTimeout(
        () =>
          finish(() => {
            socket.destroy();
            reject(new Error('CONNECT_TIMEOUT'));
          }),
        timeoutMs,
      );
      const socket = TcpSocket.createConnection({host, port}, () =>
        finish(() => resolve(wrap(socket, `${host}:${port}`))),
      );
      socket.once('error', err => finish(() => reject(err)));
      signal?.addEventListener('abort', onAbort);
    }),
};
