import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocation } from '@/contexts/LocationContext';
import { RADIUS_OPTIONS, useNotifications } from '@/contexts/NotificationsContext';
import { getUserMessage } from '@/database/errors';
import { formatDistance } from '@/utils/geo';

const PERMISSION_TEXT = {
  loading: 'Проверяем разрешение…',
  undetermined: 'Разрешение будет запрошено при включении.',
  granted: 'Разрешение на уведомления выдано.',
  denied: 'Уведомления запрещены в настройках телефона.',
} as const;

export default function SettingsScreen() {
  const { enabled, radius, permission, setEnabled, setRadius, sendTest } = useNotifications();
  const { status: locationStatus, canAskAgain, requestPermission } = useLocation();

  const locationNeedsSettings =
    locationStatus === 'services-disabled' || (locationStatus === 'denied' && !canAskAgain);

  const handleToggle = async (value: boolean) => {
    try {
      const ok = await setEnabled(value);
      if (!ok) {
        Alert.alert(
          'Нет разрешения на уведомления',
          'Разрешите уведомления для приложения в настройках телефона.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Открыть настройки', onPress: () => void Linking.openSettings() },
          ],
        );
      }
    } catch (error) {
      Alert.alert('Не удалось сохранить настройку', getUserMessage(error));
    }
  };

  const handleRadius = async (meters: number) => {
    try {
      await setRadius(meters);
    } catch (error) {
      Alert.alert('Не удалось сохранить настройку', getUserMessage(error));
    }
  };

  const handleTest = async () => {
    try {
      await sendTest();
    } catch (error) {
      console.error('Test notification error', error);
      Alert.alert('Не удалось отправить уведомление', 'Проверьте разрешение на уведомления.');
    }
  };

  const handleLocation = () => {
    if (locationNeedsSettings) void Linking.openSettings();
    else void requestPermission();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedView type="backgroundElement" style={styles.rowText}>
              <ThemedText type="smallBold">Уведомления о маркерах рядом</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {PERMISSION_TEXT[permission.status]}
              </ThemedText>
            </ThemedView>
            <Switch value={enabled} onValueChange={(value) => void handleToggle(value)} />
          </ThemedView>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Радиус срабатывания</ThemedText>
          <ThemedView type="backgroundElement" style={styles.chips}>
            {RADIUS_OPTIONS.map((option) => {
              const selected = option === radius;
              return (
                <Pressable
                  key={option}
                  onPress={() => void handleRadius(option)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <ThemedText type="smallBold" style={selected ? styles.chipTextSelected : undefined}>
                    {formatDistance(option)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </ThemedView>

        {locationStatus !== 'granted' && locationStatus !== 'loading' && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Нужна геолокация</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Без доступа к местоположению приложение не узнает, что вы рядом с маркером.
            </ThemedText>
            <Pressable onPress={handleLocation} style={styles.primaryButton}>
              <ThemedText type="smallBold" style={styles.primaryText}>
                {locationNeedsSettings ? 'Открыть настройки' : 'Разрешить геолокацию'}
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <Pressable
          onPress={() => void handleTest()}
          disabled={permission.status !== 'granted'}
          style={[styles.primaryButton, permission.status !== 'granted' && styles.disabled]}>
          <ThemedText type="smallBold" style={styles.primaryText}>
            Отправить тестовое уведомление
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Уведомления приходят, пока приложение открыто. Для фонового слежения нужна отдельная сборка
          приложения: в Expo Go оно недоступно.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowText: { flex: 1, gap: Spacing.half },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3c87f7',
  },
  chipSelected: { backgroundColor: '#3c87f7' },
  chipTextSelected: { color: '#ffffff' },
  primaryButton: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  primaryText: { color: '#ffffff' },
  disabled: { opacity: 0.5 },
  note: { textAlign: 'center' },
});