export type NetErrorCode =
  | 'NO_WIFI'
  | 'BAD_CODE'
  | 'NOT_FOUND'
  | 'MODE_MISMATCH'
  | 'BAD_RULES'
  | 'ROOM_FULL'
  | 'ALREADY_STARTED'
  | 'EXPIRED'
  | 'BLOCKED'
  | 'PORT_BUSY'
  | 'LINK_LOST'
  | 'CANCELLED';

export const NET_MESSAGES: Record<NetErrorCode, string> = {
  NO_WIFI: 'Conéctate a la misma Wi-Fi que el anfitrión (o usa su punto de acceso).',
  BAD_CODE: 'Código incorrecto.',
  NOT_FOUND:
    'No encuentro esa sala. Comprueba el código y que estáis en la misma red. Si es una Wi-Fi de invitados u hotel, puede aislar dispositivos: prueba con el punto de acceso del móvil del anfitrión.',
  MODE_MISMATCH: 'Esa sala es de otro modo de juego.',
  BAD_RULES: 'Tu versión del juego es distinta. Actualiza la app.',
  ROOM_FULL: 'La sala está llena.',
  ALREADY_STARTED: 'La partida ya ha empezado.',
  EXPIRED: 'Tu plaza en la sala caducó.',
  BLOCKED: 'Demasiados intentos fallidos. Espera unos segundos.',
  PORT_BUSY: 'No puedo abrir la sala. Reinicia la app o prueba otra red.',
  LINK_LOST: 'Se perdió la conexión con el anfitrión.',
  CANCELLED: 'Búsqueda cancelada.',
};

export class NetError extends Error {
  constructor(readonly code: NetErrorCode) {
    super(NET_MESSAGES[code]);
    this.name = 'NetError';
  }
}
