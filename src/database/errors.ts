export type DatabaseErrorCode =
  | 'INIT_FAILED'
  | 'MIGRATION_FAILED'
  | 'CONNECTION_LOST'
  | 'CONSTRAINT_VIOLATION'
  | 'TRANSACTION_FAILED'
  | 'QUERY_FAILED'
  | 'NOT_FOUND';

export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode;
  readonly originalError: unknown;

  constructor(code: DatabaseErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.originalError = originalError;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function toDatabaseError(error: unknown, fallback: DatabaseErrorCode): DatabaseError {
  if (error instanceof DatabaseError) return error;

  const message = messageOf(error);

  if (/constraint|foreign key|unique/i.test(message)) {
    return new DatabaseError('CONSTRAINT_VIOLATION', message, error);
  }
  if (/closed|not open|database is locked|disk i\/o|unable to open|NullPointerException/i.test(message)) {
    return new DatabaseError('CONNECTION_LOST', message, error);
  }
  return new DatabaseError(fallback, message, error);
}

const USER_MESSAGES: Record<DatabaseErrorCode, string> = {
  INIT_FAILED: 'Не удалось открыть базу данных.',
  MIGRATION_FAILED: 'Не удалось обновить структуру базы данных.',
  CONNECTION_LOST: 'Соединение с базой данных потеряно.',
  CONSTRAINT_VIOLATION: 'Операция нарушает целостность данных.',
  TRANSACTION_FAILED: 'Не удалось выполнить операцию, изменения отменены.',
  QUERY_FAILED: 'Не удалось выполнить запрос к базе данных.',
  NOT_FOUND: 'Запись не найдена.',
};

export function getUserMessage(error: unknown): string {
  if (error instanceof DatabaseError) return USER_MESSAGES[error.code];
  return 'Произошла неизвестная ошибка. Попробуйте ещё раз.';
}