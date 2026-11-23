import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useColorScheme() {
  const hasHydrated = useHasHydrated();
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}