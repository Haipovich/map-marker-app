import type { SQLiteDatabase } from 'expo-sqlite';

import type { Marker, MarkerImage, MarkerImageRow, MarkerRow } from '@/types';

import { DatabaseError, toDatabaseError, type DatabaseErrorCode } from './errors';
import { logDb, logDbError } from './logger';

async function execute<T>(
  operation: string,
  fallback: DatabaseErrorCode,
  action: () => Promise<T>,
): Promise<T> {
  try {
    const result = await action();
    logDb(operation);
    return result;
  } catch (error) {
    logDbError(operation, error);
    throw toDatabaseError(error, fallback);
  }
}

function toMarker(row: MarkerRow): Marker {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    imageCount: row.image_count,
  };
}

function toMarkerImage(row: MarkerImageRow): MarkerImage {
  return {
    id: row.id,
    markerId: row.marker_id,
    uri: row.uri,
    createdAt: row.created_at,
  };
}

function assertValidCoordinates(latitude: number, longitude: number): void {
  const valid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!valid) {
    throw new DatabaseError('CONSTRAINT_VIOLATION', 'Некорректные координаты маркера');
  }
}

function assertValidUri(uri: string): void {
  if (typeof uri !== 'string' || uri.trim().length === 0) {
    throw new DatabaseError('CONSTRAINT_VIOLATION', 'Пустой URI изображения');
  }
}

export function insertMarker(db: SQLiteDatabase, latitude: number, longitude: number): Promise<number> {
  return execute('addMarker', 'QUERY_FAILED', async () => {
    assertValidCoordinates(latitude, longitude);
    const result = await db.runAsync(
      'INSERT INTO markers (latitude, longitude) VALUES (?, ?)',
      latitude,
      longitude,
    );
    return result.lastInsertRowId;
  });
}

export function removeMarker(db: SQLiteDatabase, id: number): Promise<void> {
  return execute('deleteMarker', 'TRANSACTION_FAILED', async () => {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM marker_images WHERE marker_id = ?', id);
      const result = await db.runAsync('DELETE FROM markers WHERE id = ?', id);
      if (result.changes === 0) {
        throw new DatabaseError('NOT_FOUND', `Маркер ${id} не найден`);
      }
    });
  });
}

export function selectMarkers(db: SQLiteDatabase): Promise<Marker[]> {
  return execute('getMarkers', 'QUERY_FAILED', async () => {
    const rows = await db.getAllAsync<MarkerRow>(
      `SELECT m.id, m.latitude, m.longitude, m.created_at, COUNT(i.id) AS image_count
       FROM markers m
       LEFT JOIN marker_images i ON i.marker_id = m.id
       GROUP BY m.id
       ORDER BY m.id ASC`,
    );
    return rows.map(toMarker);
  });
}

export function selectMarker(db: SQLiteDatabase, id: number): Promise<Marker | null> {
  return execute('getMarker', 'QUERY_FAILED', async () => {
    const row = await db.getFirstAsync<MarkerRow>(
      `SELECT m.id, m.latitude, m.longitude, m.created_at, COUNT(i.id) AS image_count
       FROM markers m
       LEFT JOIN marker_images i ON i.marker_id = m.id
       WHERE m.id = ?
       GROUP BY m.id`,
      id,
    );
    return row ? toMarker(row) : null;
  });
}

export function insertImage(db: SQLiteDatabase, markerId: number, uri: string): Promise<void> {
  return execute('addImage', 'QUERY_FAILED', async () => {
    assertValidUri(uri);
    await db.runAsync('INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)', markerId, uri);
  });
}

export function insertImages(db: SQLiteDatabase, markerId: number, uris: string[]): Promise<void> {
  return execute('addImages', 'TRANSACTION_FAILED', async () => {
    uris.forEach(assertValidUri);
    await db.withTransactionAsync(async () => {
      for (const uri of uris) {
        await db.runAsync('INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)', markerId, uri);
      }
    });
  });
}

export function removeImage(db: SQLiteDatabase, id: number): Promise<void> {
  return execute('deleteImage', 'QUERY_FAILED', async () => {
    const result = await db.runAsync('DELETE FROM marker_images WHERE id = ?', id);
    if (result.changes === 0) {
      throw new DatabaseError('NOT_FOUND', `Изображение ${id} не найдено`);
    }
  });
}

export function selectMarkerImages(db: SQLiteDatabase, markerId: number): Promise<MarkerImage[]> {
  return execute('getMarkerImages', 'QUERY_FAILED', async () => {
    const rows = await db.getAllAsync<MarkerImageRow>(
      'SELECT id, marker_id, uri, created_at FROM marker_images WHERE marker_id = ? ORDER BY id ASC',
      markerId,
    );
    return rows.map(toMarkerImage);
  });
}

export function selectSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  return execute('getSetting', 'QUERY_FAILED', async () => {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      key,
    );
    return row ? row.value : null;
  });
}

export function upsertSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  return execute('setSetting', 'QUERY_FAILED', async () => {
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  });
}