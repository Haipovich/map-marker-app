import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationControls } from '@/components/LocationControls';
import { MarkersMap } from '@/components/Map';
import { MarkerList } from '@/components/MarkerList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useLocation } from '@/contexts/LocationContext';
import { getUserMessage } from '@/database/errors';
import { useMarkers } from '@/hooks/use-markers';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import type { Coordinates, MarkersMapHandle } from '@/types';

const CONTROLS_BOTTOM_OFFSET = 96;

export default function MapScreen() {
  const { addMarker } = useDatabase();
  const { status, position, getCurrentPosition } = useLocation();
  const { markers, error, refresh } = useMarkers();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MarkersMapHandle>(null);
  const [locating, setLocating] = useState(false);

  useNotificationObserver();

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

  const openSettings = useCallback(() => {
    try {
      router.push('/settings');
    } catch (e) {
      console.error('Navigation error', e);
      Alert.alert('Ошибка навигации', 'Не удалось открыть настройки.');
    }
  }, []);

  const handleCenter = useCallback(async () => {
    setLocating(true);
    try {
      const coordinate = await getCurrentPosition();
      mapRef.current?.centerOn(coordinate);
    } catch (e) {
      console.error('Location error', e);
      Alert.alert('Не удалось определить местоположение', 'Проверьте, что геолокация включена, и попробуйте ещё раз.');
    } finally {
      setLocating(false);
    }
  }, [getCurrentPosition]);

  const handleAddHere = useCallback(async () => {
    setLocating(true);
    try {
      const coordinate = await getCurrentPosition();
      await addMarker(coordinate.latitude, coordinate.longitude);
      await refresh();
      mapRef.current?.centerOn(coordinate);
    } catch (e) {
      console.error('Add here error', e);
      Alert.alert('Не удалось добавить маркер', 'Не получилось определить местоположение или сохранить маркер.');
    } finally {
      setLocating(false);
    }
  }, [getCurrentPosition, addMarker, refresh]);

  return (
    <View style={styles.container}>
      <MarkersMap
        ref={mapRef}
        markers={markers}
        onAddMarker={handleAddMarker}
        onMarkerPress={openMarker}
        showsUserLocation={status === 'granted'}
      />

      <Pressable
        onPress={openSettings}
        style={[styles.settingsButton, { top: insets.top + Spacing.three, right: Spacing.three }]}>
        <ThemedText type="smallBold" style={styles.settingsText}>
          Настройки
        </ThemedText>
      </Pressable>

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

      <View
        style={[
          styles.controls,
          { bottom: insets.bottom + CONTROLS_BOTTOM_OFFSET, right: Spacing.three },
        ]}>
        <LocationControls onCenter={handleCenter} onAddHere={handleAddHere} busy={locating} />
      </View>

      <View style={[styles.list, { bottom: insets.bottom + Spacing.three }]}>
        <MarkerList markers={markers} userPosition={position} onSelect={openMarker} />
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
  settingsButton: {
    position: 'absolute',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  settingsText: { color: '#ffffff' },
  controls: { position: 'absolute' },
  list: { position: 'absolute', left: 0, right: 0 },
});