import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Coordinates, MarkersMapProps } from '@/types';

const INITIAL_REGION = {
  latitude: 52,
  longitude: 15,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

const FOCUS_DELTA = 0.01;
const FOCUS_DURATION_MS = 600;
const LOAD_TIMEOUT_MS = 15_000;

type MapStatus = 'loading' | 'ready' | 'error';

export function MarkersMap({
  markers,
  onAddMarker,
  onMarkerPress,
  showsUserLocation = false,
  ref,
}: MarkersMapProps) {
  const [status, setStatus] = useState<MapStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(
    ref,
    () => ({
      centerOn: (coordinate: Coordinates) => {
        mapRef.current?.animateToRegion(
          {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: FOCUS_DELTA,
            longitudeDelta: FOCUS_DELTA,
          },
          FOCUS_DURATION_MS,
        );
      },
    }),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'error' : current));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [attempt]);

  const handleRetry = useCallback(() => {
    setStatus('loading');
    setAttempt((a) => a + 1);
  }, []);

  const handleLongPress = useCallback(
    (e: { nativeEvent: { coordinate: Coordinates } }) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      onAddMarker({ latitude, longitude });
    },
    [onAddMarker],
  );

  return (
    <View style={styles.container}>
      <MapView
        key={attempt}
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        onMapReady={() => setStatus('ready')}
        onLongPress={handleLongPress}>
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => onMarkerPress(marker.id)}
            tracksViewChanges={false}
          />
        ))}
      </MapView>

      {status === 'loading' && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" />
        </View>
      )}

      {status === 'error' && (
        <ThemedView style={styles.overlay}>
          <ThemedText type="smallBold" style={styles.errorTitle}>
            Не удалось загрузить карту
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.errorText}>
            Проверьте подключение к интернету и попробуйте ещё раз.
          </ThemedText>
          <Pressable onPress={handleRetry} style={styles.retryButton}>
            <ThemedText type="smallBold" style={styles.retryText}>
              Повторить
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  errorTitle: { textAlign: 'center' },
  errorText: { textAlign: 'center' },
  retryButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  retryText: { color: '#ffffff' },
});