/* eslint-disable no-bitwise -- PRNG, hash FNV y aritmética de IPv4 */
export interface NetEnv {
  ip: string | null;
  subnet: string | null;
}

const toInt = (ip: string): number => ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
const toIp = (n: number): string => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join('.');
const validIp = (ip: string | null): ip is string =>
  !!ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && !ip.startsWith('0.') && !ip.startsWith('127.');

/** Dirección «más probable»: mismo prefijo /24 que el invitado + último octeto del código. */
export function guessHost(env: NetEnv, hostOctet: number): string | null {
  if (!validIp(env.ip)) {
    return null;
  }
  const p = env.ip.split('.');
  return `${p[0]}.${p[1]}.${p[2]}.${hostOctet}`;
}

/** Hosts a sondear con la máscara REAL (no «/24»), acotado a `max` (por defecto un /22). */
export function scanTargets(env: NetEnv, exclude: string[] = [], max = 1022): string[] {
  if (!validIp(env.ip)) {
    return [];
  }
  const ip = toInt(env.ip);
  const okMask = !!env.subnet && /^\d{1,3}(\.\d{1,3}){3}$/.test(env.subnet);
  let mask = okMask ? toInt(env.subnet as string) : toInt('255.255.255.0');
  const minMask = toInt('255.255.252.0'); // nunca más de 1022 hosts
  if (mask < minMask) {
    mask = minMask;
  }
  const net = (ip & mask) >>> 0;
  const bcast = (net | (~mask >>> 0)) >>> 0;
  const out: string[] = [];
  const skip = new Set([...exclude, env.ip]);
  // ordenados por cercanía a la IP propia: los dispositivos de una casa suelen estar contiguos
  const all: number[] = [];
  for (let n = net + 1; n < bcast; n++) {
    all.push(n);
  }
  all.sort((a, b) => Math.abs(a - ip) - Math.abs(b - ip));
  for (const n of all) {
    const s = toIp(n);
    if (!skip.has(s)) {
      out.push(s);
    }
    if (out.length >= max) {
      break;
    }
  }
  return out;
}
