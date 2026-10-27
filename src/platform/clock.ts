/** Reloj monotónico (no cambia si el usuario ajusta la hora del sistema). */
export const performanceNow = (): number => performance.now();
