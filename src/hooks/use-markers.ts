import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import { toDatabaseError } from '@/database/errors';
import type { Marker } from '@/types';

export function useMarkers() {
  const { getMarkers } = useDatabase();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await getMarkers();
      setMarkers(list);
      setError(null);
    } catch (e) {
      setError(toDatabaseError(e, 'QUERY_FAILED'));
    }
  }, [getMarkers]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { markers, error, refresh };
}