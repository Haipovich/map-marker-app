import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Coordinates, Marker } from '@/types';
import { markerTitle } from '@/utils/format';
import { distanceMeters, formatDistance } from '@/utils/geo';

interface MarkerListProps {
  markers: Marker[];
  userPosition: Coordinates | null;
  onSelect: (markerId: number) => void;
}

export function MarkerList({ markers, userPosition, onSelect }: MarkerListProps) {
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
            {userPosition && (
              <ThemedText type="small" themeColor="textSecondary">
                {formatDistance(distanceMeters(userPosition, item))}
              </ThemedText>
            )}
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