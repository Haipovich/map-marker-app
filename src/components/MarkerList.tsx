import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { markerTitle } from '@/utils/format';
import type { Marker } from '@/types';

interface MarkerListProps {
  markers: Marker[];
  onSelect: (markerId: number) => void;
}

export function MarkerList({ markers, onSelect }: MarkerListProps) {
  if (markers.length === 0) return null;

  return (
    <FlatList
      data={markers}
      keyExtractor={(m) => String(m.id)}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item.id)}>
          <ThemedView type="backgroundElement" style={styles.chip}>
            <ThemedText type="smallBold">{markerTitle(item.id)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Фото: {item.imageCount}
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