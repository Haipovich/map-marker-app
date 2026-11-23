import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { DatabaseGate } from '@/components/DatabaseGate';
import { DatabaseProvider } from '@/contexts/DatabaseContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <DatabaseGate>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="marker/[id]" options={{ title: 'Маркер', headerBackTitle: 'Карта' }} />
          </Stack>
        </DatabaseGate>
      </DatabaseProvider>
    </ThemeProvider>
  );
}