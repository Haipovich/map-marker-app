import * as SQLite from 'expo-sqlite';

import { DatabaseError, toDatabaseError } from './errors';
import { logDb, logDbError } from './logger';
import { LATEST_VERSION, migrations } from './migrations';

export const DATABASE_NAME = 'markers.db';

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const current = await getUserVersion(db);
  logDb('версия базы', { current, latest: LATEST_VERSION });

  if (current > LATEST_VERSION) {
    throw new DatabaseError(
      'MIGRATION_FAILED',
      `Версия базы (${current}) новее версии приложения (${LATEST_VERSION})`,
    );
  }

  const pending = migrations.filter((m) => m.version > current);

  for (const migration of pending) {
    try {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
      logDb('миграция применена', { version: migration.version, name: migration.name });
    } catch (error) {
      logDbError(`миграция ${migration.version}`, error);
      throw new DatabaseError(
        'MIGRATION_FAILED',
        `Миграция ${migration.version} (${migration.name}) не выполнена`,
        error,
      );
    }
  }
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  let db: SQLite.SQLiteDatabase | null = null;

  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await runMigrations(db);

    const fk = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    if (fk?.foreign_keys !== 1) {
      throw new DatabaseError('INIT_FAILED', 'Не удалось включить внешние ключи');
    }

    logDb('база инициализирована', DATABASE_NAME);
    return db;
  } catch (error) {
    logDbError('инициализация', error);
    if (db) {
      try {
        await db.closeAsync();
      } catch (closeError) {
        logDbError('закрытие после ошибки', closeError);
      }
    }
    throw toDatabaseError(error, 'INIT_FAILED');
  }
}

export async function closeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.closeAsync();
    logDb('соединение закрыто');
  } catch (error) {
    logDbError('закрытие соединения', error);
  }
}

export async function resetDatabase(db: SQLite.SQLiteDatabase | null): Promise<SQLite.SQLiteDatabase> {
  try {
    if (db) await closeDatabase(db);
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    logDb('база удалена', DATABASE_NAME);
  } catch (error) {
    logDbError('сброс базы', error);
    throw toDatabaseError(error, 'INIT_FAILED');
  }
  return initDatabase();
}