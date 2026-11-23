import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { DatabaseGate } from '@/components/DatabaseGate';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <DatabaseGate>
          <LocationProvider>
            <NotificationsProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="marker/[id]" options={{ title: 'Маркер', headerBackTitle: 'Карта' }} />
                <Stack.Screen name="settings" options={{ title: 'Настройки', headerBackTitle: 'Карта' }} />
              </Stack>
            </NotificationsProvider>
          </LocationProvider>
        </DatabaseGate>
      </DatabaseProvider>
    </ThemeProvider>
  );
}