export function logDb(operation: string, details?: unknown): void {
  if (!__DEV__) return;
  if (details === undefined) {
    console.log(`[DB] ${operation}`);
  } else {
    console.log(`[DB] ${operation}`, details);
  }
}

export function logDbError(operation: string, error: unknown): void {
  if (!__DEV__) return;
  console.error(`[DB] ${operation} — ошибка`, error);
}