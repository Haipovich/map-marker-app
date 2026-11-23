import type { SQLiteDatabase } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  insertImage,
  insertImages,
  insertMarker,
  removeImage,
  removeMarker,
  selectMarker,
  selectMarkerImages,
  selectMarkers,
  selectSetting,
  upsertSetting,
} from '@/database/operations';
import { DatabaseError, toDatabaseError } from '@/database/errors';
import { logDb } from '@/database/logger';
import { closeDatabase, initDatabase, resetDatabase } from '@/database/schema';
import type { Marker, MarkerImage } from '@/types';

interface DatabaseContextType {
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  getMarker: (id: number) => Promise<Marker | null>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  addImages: (markerId: number, uris: string[]) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
  retry: () => void;
  reset: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

type DatabaseApi = Omit<DatabaseContextType, 'retry' | 'reset' | 'isLoading' | 'error'>;

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const dbRef = useRef<SQLiteDatabase | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    initDatabase()
      .then((database) => {
        if (cancelled) {
          void closeDatabase(database);
          return;
        }
        dbRef.current = database;
        setIsReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(toDatabaseError(e, 'INIT_FAILED'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      const current = dbRef.current;
      dbRef.current = null;
      if (current) void closeDatabase(current);
    };
  }, [attempt]);

  const retry = useCallback(() => {
    logDb('повторная попытка подключения');
    setError(null);
    setIsReady(false);
    setIsLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  const reset = useCallback(async () => {
    logDb('сброс базы данных');
    setError(null);
    setIsReady(false);
    setIsLoading(true);
    try {
      const database = await resetDatabase(dbRef.current);
      dbRef.current = database;
      setIsReady(true);
    } catch (e) {
      dbRef.current = null;
      setError(toDatabaseError(e, 'INIT_FAILED'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const run = useCallback(
    <T,>(task: (database: SQLiteDatabase) => Promise<T>): Promise<T> => {
      const next = queueRef.current.then(async () => {
        const database = dbRef.current;
        if (!database) {
          throw new DatabaseError('CONNECTION_LOST', 'База данных не подключена');
        }
        try {
          return await task(database);
        } catch (e) {
          const dbError = toDatabaseError(e, 'QUERY_FAILED');
          if (dbError.code === 'CONNECTION_LOST') {
            setIsReady(false);
            setError(dbError);
          }
          throw dbError;
        }
      });
      queueRef.current = next.catch(() => undefined);
      return next;
    },
    [],
  );

  const api = useMemo<DatabaseApi>(
    () => ({
      addMarker: (latitude, longitude) => run((db) => insertMarker(db, latitude, longitude)),
      deleteMarker: (id) => run((db) => removeMarker(db, id)),
      getMarkers: () => run((db) => selectMarkers(db)),
      getMarker: (id) => run((db) => selectMarker(db, id)),
      addImage: (markerId, uri) => run((db) => insertImage(db, markerId, uri)),
      addImages: (markerId, uris) => run((db) => insertImages(db, markerId, uris)),
      deleteImage: (id) => run((db) => removeImage(db, id)),
      getMarkerImages: (markerId) => run((db) => selectMarkerImages(db, markerId)),
      getSetting: (key) => run((db) => selectSetting(db, key)),
      setSetting: (key, value) => run((db) => upsertSetting(db, key, value)),
    }),
    [run],
  );

  const value = useMemo<DatabaseContextType>(
    () => ({
      ...api,
      retry,
      reset,
      isLoading: isLoading || (!isReady && error === null),
      error,
    }),
    [api, retry, reset, isLoading, isReady, error],
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase нужно вызывать внутри <DatabaseProvider>');
  }
  return ctx;
}