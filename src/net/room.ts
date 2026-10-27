export interface Submission {
  playerId: string;
  correct: boolean;
  elapsedMs: number;
  receivedAtHostMs: number;
}

/**
 * Regla (sin cambios): gana quien ENTREGA CORRECTO en menos tiempo.
 * Empates: el primero que llegó al host. Si nadie acierta, no hay ganador.
 */
export function decideWinner(subs: readonly Submission[]): string | null {
  const correct = subs.filter(s => s.correct);
  if (correct.length === 0) {
    return null;
  }
  return [...correct].sort((a, b) => a.elapsedMs - b.elapsedMs || a.receivedAtHostMs - b.receivedAtHostMs)[0]
    .playerId;
}
