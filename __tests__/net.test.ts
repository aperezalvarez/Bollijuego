/** @jest-environment node */
import {generateCase, PRESETS, type GameCase} from '../src/domain';
import {ClientSession} from '../src/net/client';
import {FrameTooLarge, LineDecoder, encodeLine, parseLine} from '../src/net/codec';
import {scanTargets} from '../src/net/discovery';
import {HostSession} from '../src/net/host';
import {LoopbackNetwork} from '../src/net/loopbackTransport';
import {ClientMsgZ, HostMsgZ, proofOf} from '../src/net/protocol';
import {formatCode, makeCode, parseCode} from '../src/net/roomCode';
import {decideWinner} from '../src/net/room';
import {decodeUtf8} from '../src/net/utf8';
import type {NetMode} from '../src/net/protocol';

const game = (): GameCase => {
  const r = generateCase(PRESETS.normal, 5);
  if (!r.ok) {
    throw new Error('gen');
  }
  return r.value;
};
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function waitFor(cond: () => boolean, ms = 4000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) {
      throw new Error('timeout esperando condición');
    }
    await sleep(10);
  }
}

const open: Array<{close: () => unknown}> = [];
afterEach(async () => {
  for (const x of open.splice(0)) {
    await x.close();
  }
});

function setup(mode: NetMode, net = new LoopbackNetwork(), maxPlayers = 4) {
  const g = game();
  const host = new HostSession({
    transport: net.transportFor('192.168.1.20'),
    localIp: '192.168.1.20',
    name: 'Ana',
    mode,
    game: g,
    maxPlayers,
    countdownMs: 50,
  });
  open.push(host);
  const mk = (name: string, id: string, code: string, m: NetMode = mode, ip = '192.168.1.30') => {
    const c = new ClientSession({
      transport: net.transportFor(ip),
      env: {ip, subnet: '255.255.255.0'},
      code,
      name,
      mode: m,
      clientId: id,
      probeTimeoutMs: 40,
    });
    open.push({close: () => c.leave()});
    return c;
  };
  return {g, host, mk, net};
}

describe('codec y protocolo', () => {
  it('reensambla mensajes con ñ/ó/¿ troceados en puntos arbitrarios sin corromper UTF-8', () => {
    const msgs = Array.from({length: 100}, (_, i) => ({
      v: 1,
      seq: i,
      t: 'ROSTER',
      players: [
        {id: 'p', name: `Cariñoso ¿Qué? ${i}`, isHost: false, link: 'ok', ready: true, submitted: false},
      ],
    }));
    const bytes = Buffer.concat(msgs.map(m => Buffer.from(encodeLine(m))));
    for (let trial = 0; trial < 50; trial++) {
      const d = new LineDecoder();
      const out: string[] = [];
      for (let i = 0; i < bytes.length; ) {
        const n = 1 + Math.floor(Math.random() * 29);
        out.push(...d.push(new Uint8Array(bytes.subarray(i, i + n))));
        i += n;
      }
      expect(out).toHaveLength(100);
      out.forEach((l, k) => expect(l).toBe(JSON.stringify(msgs[k])));
    }
  });
  it('rechaza tramas gigantes y entradas hostiles', () => {
    expect(() => new LineDecoder(decodeUtf8, 1024).push(new Uint8Array(2000).fill(65))).toThrow(
      FrameTooLarge,
    );
    const bad = [
      'no json',
      '{"t":"WELCOME"}',
      '{"v":2,"seq":0,"t":"BYE"}',
      '{"v":1,"seq":0,"t":"START","atHostMs":"x"}',
    ];
    for (const l of bad) {
      expect(parseLine(l, HostMsgZ).ok || parseLine(l, ClientMsgZ).ok).toBe(false);
    }
    expect(parseLine('{"v":1,"seq":0,"t":"START","atHostMs":5}', HostMsgZ).ok).toBe(true);
  });
  it('la prueba de código no contiene el código y depende de él', () => {
    const p = proofOf('K7M2QXP', 's', 'c');
    expect(p).not.toContain('K7M2');
    expect(p).not.toBe(proofOf('K7M2QXQ', 's', 'c'));
  });
  it('el código de sala codifica octeto y puerto y se normaliza', () => {
    const c = makeCode('192.168.1.77', 3);
    const p = parseCode(formatCode(c.code).toLowerCase());
    expect(p).toMatchObject({hostOctet: 77, portIndex: 3, port: 47803});
    expect(parseCode('OOOOOOO')).toBeNull();
  });
  it('el barrido usa la máscara real y está acotado', () => {
    expect(scanTargets({ip: '192.168.1.20', subnet: '255.255.255.0'})).toHaveLength(253);
    expect(scanTargets({ip: '10.0.0.5', subnet: '255.255.0.0'}).length).toBeLessThanOrEqual(1022);
    expect(scanTargets({ip: null, subnet: null})).toEqual([]);
  });
  it('decideWinner: gana el acierto más rápido; el fallo no gana', () => {
    expect(
      decideWinner([
        {playerId: 'A', correct: false, elapsedMs: 1, receivedAtHostMs: 1},
        {playerId: 'B', correct: true, elapsedMs: 9, receivedAtHostMs: 2},
      ]),
    ).toBe('B');
    expect(decideWinner([{playerId: 'A', correct: false, elapsedMs: 1, receivedAtHostMs: 1}])).toBeNull();
  });
});

describe('sesión anfitrión/cliente sobre LoopbackTransport', () => {
  it('Cooperativo: unirse, roster en vivo y la solución viaja (D1)', async () => {
    const {host, mk, g} = setup('cooperativo');
    const code = await host.open();
    const c = mk('Luis', 'c1', code);
    await c.join();
    await waitFor(() => host.state.get().roster.length === 2 && c.state.get().roster.length === 2);
    expect(c.state.get().caseDto?.solution).toEqual(g.solution);
    expect(c.state.get().link).toBe('ok');
  });

  it('Versus: la solución NO viaja al invitado (D1)', async () => {
    const {host, mk} = setup('versus');
    const code = await host.open();
    const c = mk('Luis', 'c1', code);
    await c.join();
    expect(c.state.get().caseDto?.solution).toBeUndefined();
  });

  it('NET-3: un modo distinto es rechazado y el anfitrión NO cuenta al invitado', async () => {
    const {host, mk} = setup('versus');
    const code = await host.open();
    const c = mk('Luis', 'c1', code, 'cooperativo');
    await expect(c.join()).rejects.toMatchObject({code: 'MODE_MISMATCH'});
    expect(host.state.get().roster).toHaveLength(1);
  });

  it('código incorrecto → BAD_CODE y nadie entra', async () => {
    const {host, mk} = setup('cooperativo');
    const code = await host.open();
    const wrong = code.slice(0, 4).replace(/./g, 'A') + code.slice(4);
    const c = mk('Luis', 'c1', wrong);
    await expect(c.join()).rejects.toMatchObject({code: 'BAD_CODE'});
    expect(host.state.get().roster).toHaveLength(1);
  });

  it('sala llena y partida empezada', async () => {
    const {host, mk} = setup('cooperativo', new LoopbackNetwork(), 2);
    const code = await host.open();
    const a = mk('A', 'a', code);
    await a.join();
    await expect(mk('B', 'b', code, 'cooperativo', '192.168.1.31').join()).rejects.toMatchObject({
      code: 'ROOM_FULL',
    });
    expect(host.startGame()).toBe(true);
    await expect(mk('C', 'c', code, 'cooperativo', '192.168.1.32').join()).rejects.toMatchObject({
      code: 'ALREADY_STARTED',
    });
  });

  it('hasta 4 jugadores', async () => {
    const {host, mk} = setup('cooperativo');
    const code = await host.open();
    for (let i = 0; i < 3; i++) {
      await mk(`J${i}`, `id${i}`, code, 'cooperativo', `192.168.1.${30 + i}`).join();
    }
    await waitFor(() => host.state.get().roster.length === 4);
    await expect(mk('X', 'x', code, 'cooperativo', '192.168.1.99').join()).rejects.toMatchObject({
      code: 'ROOM_FULL',
    });
  });

  it('NET-4: el puerto ocupado pasa al siguiente y el código lo refleja', async () => {
    const net = new LoopbackNetwork();
    const a = new HostSession({
      transport: net.transportFor('192.168.1.20'),
      localIp: '192.168.1.20',
      name: 'A',
      mode: 'cooperativo',
      game: game(),
      maxPlayers: 2,
    });
    const b = new HostSession({
      transport: net.transportFor('192.168.1.20'),
      localIp: '192.168.1.20',
      name: 'B',
      mode: 'cooperativo',
      game: game(),
      maxPlayers: 2,
    });
    open.push(a, b);
    const ca = parseCode(await a.open());
    const cb = parseCode(await b.open());
    expect(ca?.portIndex).toBe(0);
    expect(cb?.portIndex).toBe(1);
  });

  it('Versus completo: arranque simultáneo, aviso del rival, veredicto con ganador', async () => {
    const {host, mk, g} = setup('versus', new LoopbackNetwork({chunkSize: 7}));
    const code = await host.open();
    const c = mk('Luis', 'c1', code);
    await c.join();
    c.setReady(true);
    await waitFor(() => host.state.get().roster.every(p => p.ready));
    expect(host.startGame()).toBe(true);
    await waitFor(() => c.state.get().startAtLocalMs !== null && c.state.get().phase === 'started');
    host.submitHost({killers: g.solution.killers, liars: g.solution.liars}, 5000);
    await waitFor(() => c.state.get().roster.some(p => p.isHost && p.submitted));
    c.submit({killers: [], liars: []}, 3000); // más rápido pero FALLA
    await waitFor(() => host.state.get().phase === 'finished' && c.state.get().phase === 'finished');
    expect(host.state.get().result?.winnerId).toBe('host');
    expect(c.state.get().result?.winnerId).toBe('host');
    expect(c.state.get().result?.board.map(r => r.correct)).toEqual([true, false]);
    expect(c.state.get().result?.truth).toEqual(g.solution);
  });

  it('reconexión automática con resumeToken tras un corte de red', async () => {
    const {host, mk, net} = setup('cooperativo');
    const code = await host.open();
    const c = mk('Luis', 'c1', code);
    await c.join();
    const you = c.state.get().youId;
    net.dropAll();
    await waitFor(() => c.state.get().link === 'reconnecting');
    await waitFor(() => c.state.get().link === 'ok', 6000);
    expect(c.state.get().youId).toBe(you);
    await waitFor(
      () => host.state.get().roster.length === 2 && host.state.get().roster.every(p => p.link === 'ok'),
    );
  });

  it('NET-8: cancelar aborta de verdad la búsqueda', async () => {
    const net = new LoopbackNetwork();
    const c = new ClientSession({
      transport: net.transportFor('192.168.1.30'),
      env: {ip: '192.168.1.30', subnet: '255.255.255.0'},
      code: makeCode('192.168.1.20', 0).code,
      name: 'L',
      mode: 'versus',
      clientId: 'x',
      probeTimeoutMs: 5000,
    });
    open.push({close: () => c.leave()});
    const p = c.join();
    p.catch(() => undefined);
    await sleep(30);
    c.cancel();
    await expect(p).rejects.toMatchObject({code: 'CANCELLED'});
    expect(c.state.get().link).toBe('closed');
  });

  it('sin Wi-Fi → NO_WIFI y sala inexistente → NOT_FOUND', async () => {
    const net = new LoopbackNetwork();
    const code = makeCode('192.168.1.20', 0).code;
    const noWifi = new ClientSession({
      transport: net.transportFor('x'),
      env: {ip: null, subnet: null},
      code,
      name: 'L',
      mode: 'versus',
      clientId: 'x',
    });
    await expect(noWifi.join()).rejects.toMatchObject({code: 'NO_WIFI'});
    const nf = new ClientSession({
      transport: net.transportFor('192.168.1.30'),
      env: {ip: '192.168.1.30', subnet: '255.255.255.252'},
      code,
      name: 'L',
      mode: 'versus',
      clientId: 'x',
      probeTimeoutMs: 20,
    });
    open.push({close: () => nf.leave()});
    await expect(nf.join()).rejects.toMatchObject({code: 'NOT_FOUND'});
  });
});
