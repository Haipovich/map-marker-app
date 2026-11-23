import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MarkersMap } from '@/components/Map';
import { MarkerList } from '@/components/MarkerList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useMarkers } from '@/store/markers-context';

export default function MapScreen() {
  const { markers, addMarker } = useMarkers();
  const insets = useSafeAreaInsets();

  const openMarker = useCallback((markerId: string) => {
    try {
      router.push({ pathname: '/marker/[id]', params: { id: markerId } });
    } catch (error) {
      console.error('Navigation error', error);
      Alert.alert('Ошибка навигации', 'Не удалось открыть экран маркера. Попробуйте ещё раз.');
    }
  }, []);

  return (
    <View style={styles.container}>
      <MarkersMap markers={markers} onAddMarker={addMarker} onMarkerPress={openMarker} />

      {markers.length === 0 && (
        <ThemedView
          type="backgroundElement"
          style={[styles.hint, { top: insets.top + Spacing.three }]}
          pointerEvents="none">
          <ThemedText type="small">Удерживайте палец на карте, чтобы добавить маркер</ThemedText>
        </ThemedView>
      )}

      <View style={[styles.list, { bottom: insets.bottom + Spacing.three }]}>
        <MarkerList markers={markers} onSelect={openMarker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  list: { position: 'absolute', left: 0, right: 0 },
});
