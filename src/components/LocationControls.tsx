import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLocation } from '@/contexts/LocationContext';

interface LocationControlsProps {
  onCenter: () => void;
  onAddHere: () => void;
  busy: boolean;
}

export function LocationControls({ onCenter, onAddHere, busy }: LocationControlsProps) {
  const { status, canAskAgain, requestPermission, openSettings } = useLocation();

  if (status === 'loading') return null;

  if (status !== 'granted') {
    const needsSettings = status === 'services-disabled' || (status === 'denied' && !canAskAgain);
    const label =
      status === 'services-disabled'
        ? 'Включить геолокацию'
        : needsSettings
          ? 'Разрешить в настройках'
          : 'Разрешить геолокацию';

    return (
      <View style={styles.container}>
        <Pressable
          onPress={() => (needsSettings ? openSettings() : void requestPermission())}
          style={styles.button}>
          <ThemedText type="smallBold" style={styles.text}>
            {label}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onCenter} disabled={busy} style={[styles.button, busy && styles.disabled]}>
        {busy ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ThemedText type="smallBold" style={styles.text}>
            Я здесь
          </ThemedText>
        )}
      </Pressable>
      <Pressable onPress={onAddHere} disabled={busy} style={[styles.button, busy && styles.disabled]}>
        <ThemedText type="smallBold" style={styles.text}>
          Маркер здесь
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end', gap: Spacing.two },
  button: {
    minWidth: 120,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  disabled: { opacity: 0.6 },
  text: { color: '#ffffff' },
});