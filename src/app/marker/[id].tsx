import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImageList } from '@/components/ImageList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { createId, useMarkers } from '@/store/markers-context';
import type { MarkerImage, MarkerRouteParams } from '@/types';

function goToMap() {
  try {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  } catch (error) {
    console.error('Navigation error', error);
    Alert.alert('Ошибка навигации', 'Не удалось вернуться к карте.');
  }
}

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<MarkerRouteParams>();
  const { getMarker, addImages, removeImage, removeMarker } = useMarkers();
  const [preview, setPreview] = useState<MarkerImage | null>(null);

  const marker = getMarker(id);

  if (!marker) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Маркер не найден' }} />
        <ThemedText type="smallBold">Маркер не найден</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Возможно, он был удалён.
        </ThemedText>
        <Pressable onPress={goToMap} style={styles.primaryButton}>
          <ThemedText type="smallBold" style={styles.primaryText}>
            К карте
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const handleAddImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });
      if (result.canceled) return;

      addImages(
        marker.id,
        result.assets.map((asset) => ({
          id: createId(),
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          addedAt: Date.now(),
        })),
      );
    } catch (error) {
      console.error('Image picker error', error);
      Alert.alert('Ошибка выбора изображения', 'Не удалось открыть галерею или загрузить фото.');
    }
  };

  const handleDeleteImage = (imageId: string) => {
    Alert.alert('Удалить изображение?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeImage(marker.id, imageId) },
    ]);
  };

  const handleDeleteMarker = () => {
    Alert.alert('Удалить маркер?', 'Вместе с ним удалятся все его изображения.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          goToMap();
          removeMarker(marker.id);
        },
      },
    ]);
  };

  const header = (
    <ThemedView style={styles.header}>
      <ThemedView type="backgroundElement" style={styles.infoCard}>
        <ThemedText type="smallBold">{marker.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Широта: {marker.coordinate.latitude.toFixed(5)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Долгота: {marker.coordinate.longitude.toFixed(5)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Создан: {new Date(marker.createdAt).toLocaleString('ru-RU')}
        </ThemedText>
      </ThemedView>

      <Pressable onPress={handleAddImage} style={styles.primaryButton}>
        <ThemedText type="smallBold" style={styles.primaryText}>
          Добавить изображение
        </ThemedText>
      </Pressable>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: marker.title }} />

      <ImageList
        images={marker.images}
        onDelete={handleDeleteImage}
        onPreview={setPreview}
        header={header}
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable onPress={handleDeleteMarker} style={styles.dangerButton}>
          <ThemedText type="smallBold" style={styles.dangerText}>
            Удалить маркер
          </ThemedText>
        </Pressable>
      </SafeAreaView>

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview && <Image source={{ uri: preview.uri }} style={styles.previewImage} contentFit="contain" />}
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  centerText: { textAlign: 'center' },
  header: { gap: Spacing.three },
  infoCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.half },
  primaryButton: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  primaryText: { color: '#ffffff' },
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  dangerButton: { alignItems: 'center', paddingVertical: Spacing.three },
  dangerText: { color: '#e5484d' },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  previewImage: { width: '100%', height: '80%' },
});
