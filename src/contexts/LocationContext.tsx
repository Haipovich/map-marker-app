import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Linking } from 'react-native';

import type { Coordinates } from '@/types';

export type LocationStatus = 'loading' | 'undetermined' | 'granted' | 'denied' | 'services-disabled';

interface PermissionState {
  status: LocationStatus;
  canAskAgain: boolean;
}

interface LocationContextType {
  status: LocationStatus;
  canAskAgain: boolean;
  position: Coordinates | null;
  error: Error | null;
  requestPermission: () => Promise<boolean>;
  getCurrentPosition: () => Promise<Coordinates>;
  openSettings: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

async function readPermissionState(): Promise<PermissionState> {
  const permission = await Location.getForegroundPermissionsAsync();

  if (permission.granted) {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    return { status: servicesEnabled ? 'granted' : 'services-disabled', canAskAgain: true };
  }

  if (permission.status === Location.PermissionStatus.UNDETERMINED) {
    return { status: 'undetermined', canAskAgain: true };
  }

  return { status: 'denied', canAskAgain: permission.canAskAgain };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<PermissionState>({
    status: 'loading',
    canAskAgain: true,
  });
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    readPermissionState()
      .then((state) => {
        if (!cancelled) setPermission(state);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(toError(e));
          setPermission({ status: 'denied', canAskAgain: false });
        }
      });

    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active') return;
      readPermissionState()
        .then((state) => {
          if (!cancelled) setPermission(state);
        })
        .catch((e) => {
          if (!cancelled) setError(toError(e));
        });
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const isGranted = permission.status === 'granted';

  useEffect(() => {
    if (!isGranted) return;

    let cancelled = false;
    let watcher: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
      (location) => {
        setPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setError(null);
      },
    )
      .then((subscription) => {
        if (cancelled) subscription.remove();
        else watcher = subscription;
      })
      .catch((e) => {
        if (!cancelled) setError(toError(e));
      });

    return () => {
      cancelled = true;
      watcher?.remove();
    };
  }, [isGranted]);

  const requestPermission = useCallback(async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      const state = await readPermissionState();
      setPermission(state);
      return state.status === 'granted';
    } catch (e) {
      setError(toError(e));
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<Coordinates> => {
    if (!isGranted) {
      throw new Error('Нет доступа к геолокации');
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setPosition(coordinates);
    return coordinates;
  }, [isGranted]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const value = useMemo<LocationContextType>(
    () => ({
      status: permission.status,
      canAskAgain: permission.canAskAgain,
      position,
      error,
      requestPermission,
      getCurrentPosition,
      openSettings,
    }),
    [permission, position, error, requestPermission, getCurrentPosition, openSettings],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextType {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation нужно вызывать внутри <LocationProvider>');
  }
  return ctx;
}