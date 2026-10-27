/** Código de sala: PIN(4) + último octeto de la IP del anfitrión (2) + índice de puerto (1) = 7 caracteres. */
export const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PORT_BASE = 47800;
export const PORT_COUNT = 10;
const B = ROOM_ALPHABET.length; // 31

export interface ParsedCode {
  code: string;
  pin: string;
  hostOctet: number;
  portIndex: number;
  port: number;
}

export function makeCode(ip: string, portIndex: number, rnd: () => number = Math.random): ParsedCode {
  const octet = Number(ip.split('.')[3]);
  if (!Number.isInteger(octet) || octet < 0 || octet > 255 || portIndex < 0 || portIndex >= PORT_COUNT) {
    throw new Error('BAD_ADDRESS');
  }
  let pin = '';
  for (let i = 0; i < 4; i++) {
    pin += ROOM_ALPHABET[Math.floor(rnd() * B)];
  }
  const code =
    pin + ROOM_ALPHABET[Math.floor(octet / B)] + ROOM_ALPHABET[octet % B] + ROOM_ALPHABET[portIndex];
  return {code, pin, hostOctet: octet, portIndex, port: PORT_BASE + portIndex};
}

export function parseCode(input: string): ParsedCode | null {
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== 7 || [...code].some(c => !ROOM_ALPHABET.includes(c))) {
    return null;
  }
  const v = (c: string) => ROOM_ALPHABET.indexOf(c);
  const hostOctet = v(code[4]) * B + v(code[5]);
  const portIndex = v(code[6]);
  if (hostOctet > 255 || portIndex >= PORT_COUNT) {
    return null;
  }
  return {code, pin: code.slice(0, 4), hostOctet, portIndex, port: PORT_BASE + portIndex};
}

export const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;
