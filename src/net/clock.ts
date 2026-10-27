export interface PingSample {
  t0: number;
  t1: number;
  t2: number;
  t3: number;
} // t0/t3: reloj cliente · t1/t2: reloj host

/** Estimación tipo NTP con cuatro marcas de tiempo. offset = (reloj host) − (reloj cliente). */
export const estimate = ({t0, t1, t2, t3}: PingSample) => ({
  rttMs: t3 - t0 - (t2 - t1),
  offsetMs: (t1 - t0 + (t2 - t3)) / 2,
});

/** Se queda con la muestra de MENOR RTT (la menos contaminada por colas/retardos del Wi-Fi). */
export function bestOffset(samples: readonly PingSample[]): {rttMs: number; offsetMs: number} | null {
  if (samples.length === 0) {
    return null;
  }
  return samples.map(estimate).reduce((a, b) => (b.rttMs < a.rttMs ? b : a));
}

/** Convierte "arranca en T del host" a "arranca en T local" (usar un reloj MONOTÓNICO, no Date.now()). */
export const toLocalTime = (atHostMs: number, offsetMs: number): number => atHostMs - offsetMs;
