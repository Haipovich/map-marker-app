import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { getUserMessage } from '@/database/errors';

export function DatabaseGate({ children }: { children: ReactNode }) {
  const { isLoading, error, retry, reset } = useDatabase();

  const confirmReset = () => {
    Alert.alert('Сбросить базу данных?', 'Все маркеры и изображения будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: () => void reset() },
    ]);
  };

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="smallBold" style={styles.text}>
          {getUserMessage(error)}
        </ThemedText>
        {__DEV__ && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
            {error.message}
          </ThemedText>
        )}
        <Pressable onPress={retry} style={styles.primaryButton}>
          <ThemedText type="smallBold" style={styles.primaryText}>
            Повторить
          </ThemedText>
        </Pressable>
        <Pressable onPress={confirmReset} style={styles.secondaryButton}>
          <ThemedText type="smallBold" style={styles.dangerText}>
            Сбросить базу данных
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Подготовка базы данных…</ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  text: { textAlign: 'center' },
  primaryButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  primaryText: { color: '#ffffff' },
  secondaryButton: { paddingVertical: Spacing.two },
  dangerText: { color: '#e5484d' },
});