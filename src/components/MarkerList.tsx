import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { MarkerData } from '@/types';

interface MarkerListProps {
  markers: MarkerData[];
  onSelect: (markerId: string) => void;
}

export function MarkerList({ markers, onSelect }: MarkerListProps) {
  if (markers.length === 0) return null;

  return (
    <FlatList
      data={markers}
      keyExtractor={(m) => m.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item.id)}>
          <ThemedView type="backgroundElement" style={styles.chip}>
            <ThemedText type="smallBold">{item.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Фото: {item.images.length}
            </ThemedText>
          </ThemedView>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
});
