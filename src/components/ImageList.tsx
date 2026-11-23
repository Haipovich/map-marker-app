import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { MarkerImage } from '@/types';

const COLUMNS = 3;
const GAP = Spacing.two;
const PADDING = Spacing.three;

interface ImageListProps {
  images: MarkerImage[];
  onDelete: (imageId: number) => void;
  onPreview: (image: MarkerImage) => void;
  header?: ReactElement;
}

export function ImageList({ images, onDelete, onPreview, header }: ImageListProps) {
  const { width } = useWindowDimensions();
  const size = (width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <FlatList
      data={images}
      keyExtractor={(img) => String(img.id)}
      numColumns={COLUMNS}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          Изображений пока нет. Нажмите «Добавить изображение».
        </ThemedText>
      }
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={{ width: size, height: size }}>
          <Pressable onPress={() => onPreview(item)} style={styles.fill}>
            <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
          </Pressable>
          <Pressable
            onPress={() => onDelete(item.id)}
            hitSlop={8}
            accessibilityLabel="Удалить изображение"
            style={styles.deleteButton}>
            <ThemedText type="smallBold" style={styles.deleteText}>
              ✕
            </ThemedText>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: PADDING, gap: GAP },
  row: { gap: GAP },
  fill: { flex: 1 },
  image: { flex: 1, borderRadius: Spacing.two },
  empty: { textAlign: 'center', paddingVertical: Spacing.four },
  deleteButton: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  deleteText: { color: '#ffffff', lineHeight: 18 },
});