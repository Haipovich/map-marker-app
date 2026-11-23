import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { MarkersProvider } from '@/store/markers-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MarkersProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="marker/[id]" options={{ title: 'Маркер', headerBackTitle: 'Карта' }} />
        </Stack>
      </MarkersProvider>
    </ThemeProvider>
  );
}
