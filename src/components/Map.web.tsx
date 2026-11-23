import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { MarkersMapProps } from '@/types';

export function MarkersMap(_props: MarkersMapProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">Карта недоступна в браузере</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.text}>
        Откройте приложение на телефоне через Expo Go (iOS/Android).
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  text: { textAlign: 'center' },
});
