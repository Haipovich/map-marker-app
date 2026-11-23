import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImageList } from '@/components/ImageList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { DatabaseError, getUserMessage } from '@/database/errors';
import type { Marker, MarkerImage, MarkerRouteParams } from '@/types';
import { formatDbDate, markerTitle } from '@/utils/format';
import { deleteStoredImage, persistImage } from '@/utils/image-storage';

type Status = 'loading' | 'ready' | 'missing' | 'error';

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
  const markerId = Number(id);
  const validId = Number.isInteger(markerId) && markerId > 0;

  const { getMarker, getMarkerImages, addImages, deleteImage, deleteMarker } = useDatabase();
  const [marker, setMarker] = useState<Marker | null>(null);
  const [images, setImages] = useState<MarkerImage[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [preview, setPreview] = useState<MarkerImage | null>(null);

  const load = useCallback(async () => {
    try {
      const [loadedMarker, loadedImages] = await Promise.all([
        getMarker(markerId),
        getMarkerImages(markerId),
      ]);
      if (!loadedMarker) {
        setMarker(null);
        setStatus('missing');
        return;
      }
      setMarker(loadedMarker);
      setImages(loadedImages);
      setStatus('ready');
    } catch (error) {
      console.error('Load marker error', error);
      setStatus('error');
    }
  }, [getMarker, getMarkerImages, markerId]);

  useFocusEffect(
    useCallback(() => {
      if (validId) void load();
    }, [validId, load]),
  );

  const handleRetry = () => {
    setStatus('loading');
    void load();
  };

  if (!validId || status === 'missing') {
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

  if (status === 'error') {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="smallBold">Не удалось загрузить маркер</ThemedText>
        <Pressable onPress={handleRetry} style={styles.primaryButton}>
          <ThemedText type="smallBold" style={styles.primaryText}>
            Повторить
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!marker) {
    return <ThemedView style={styles.center} />;
  }

  const handleAddImage = async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });
    } catch (error) {
      console.error('Image picker error', error);
      Alert.alert('Ошибка выбора изображения', 'Не удалось открыть галерею или загрузить фото.');
      return;
    }

    if (result.canceled) return;

    const saved: string[] = [];
    try {
      for (const asset of result.assets) {
        saved.push(await persistImage(asset.uri));
      }
      await addImages(marker.id, saved);
      await load();
    } catch (error) {
      saved.forEach(deleteStoredImage);
      Alert.alert(
        'Не удалось сохранить изображения',
        error instanceof DatabaseError ? getUserMessage(error) : 'Не удалось скопировать файлы изображений.',
      );
    }
  };

  const handleDeleteImage = (imageId: number) => {
    Alert.alert('Удалить изображение?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const target = images.find((img) => img.id === imageId);
          try {
            await deleteImage(imageId);
            if (target) deleteStoredImage(target.uri);
            await load();
          } catch (error) {
            Alert.alert('Не удалось удалить изображение', getUserMessage(error));
            await load();
          }
        },
      },
    ]);
  };

  const handleDeleteMarker = () => {
    Alert.alert('Удалить маркер?', 'Вместе с ним удалятся все его изображения.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const uris = images.map((img) => img.uri);
          try {
            await deleteMarker(marker.id);
            uris.forEach(deleteStoredImage);
            goToMap();
          } catch (error) {
            Alert.alert('Не удалось удалить маркер', getUserMessage(error));
          }
        },
      },
    ]);
  };

  const title = markerTitle(marker.id);

  const header = (
    <ThemedView style={styles.header}>
      <ThemedView type="backgroundElement" style={styles.infoCard}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Широта: {marker.latitude.toFixed(5)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Долгота: {marker.longitude.toFixed(5)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Создан: {formatDbDate(marker.createdAt)}
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
      <Stack.Screen options={{ title }} />

      <ImageList images={images} onDelete={handleDeleteImage} onPreview={setPreview} header={header} />

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