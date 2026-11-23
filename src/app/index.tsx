import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MarkersMap } from '@/components/Map';
import { MarkerList } from '@/components/MarkerList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { getUserMessage } from '@/database/errors';
import { useMarkers } from '@/hooks/use-markers';
import type { Coordinates } from '@/types';

export default function MapScreen() {
  const { addMarker } = useDatabase();
  const { markers, error, refresh } = useMarkers();
  const insets = useSafeAreaInsets();

  const openMarker = useCallback((markerId: number) => {
    try {
      router.push({ pathname: '/marker/[id]', params: { id: String(markerId) } });
    } catch (e) {
      console.error('Navigation error', e);
      Alert.alert('Ошибка навигации', 'Не удалось открыть экран маркера. Попробуйте ещё раз.');
    }
  }, []);

  const handleAddMarker = useCallback(
    async (coordinate: Coordinates) => {
      try {
        await addMarker(coordinate.latitude, coordinate.longitude);
        await refresh();
      } catch (e) {
        Alert.alert('Не удалось добавить маркер', getUserMessage(e));
      }
    },
    [addMarker, refresh],
  );

  return (
    <View style={styles.container}>
      <MarkersMap markers={markers} onAddMarker={handleAddMarker} onMarkerPress={openMarker} />

      {error ? (
        <Pressable onPress={() => void refresh()} style={[styles.hint, { top: insets.top + Spacing.three }]}>
          <ThemedView type="backgroundElement" style={styles.hintInner}>
            <ThemedText type="small">{getUserMessage(error)} Нажмите, чтобы повторить.</ThemedText>
          </ThemedView>
        </Pressable>
      ) : (
        markers.length === 0 && (
          <ThemedView
            type="backgroundElement"
            style={[styles.hint, styles.hintInner, { top: insets.top + Spacing.three }]}
            pointerEvents="none">
            <ThemedText type="small">Удерживайте палец на карте, чтобы добавить маркер</ThemedText>
          </ThemedView>
        )
      )}

      <View style={[styles.list, { bottom: insets.bottom + Spacing.three }]}>
        <MarkerList markers={markers} onSelect={openMarker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: { position: 'absolute', alignSelf: 'center' },
  hintInner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  list: { position: 'absolute', left: 0, right: 0 },
});