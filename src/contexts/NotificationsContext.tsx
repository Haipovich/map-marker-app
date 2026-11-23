import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { useDatabase } from '@/contexts/DatabaseContext';
import { useLocation } from '@/contexts/LocationContext';
import {
  configureNotificationHandler,
  ensureNotificationChannel,
  readNotificationPermission,
  requestNotificationPermission,
  sendNearbyNotification,
  sendTestNotification,
  type NotificationPermission,
} from '@/utils/notifications';
import { createTracker, evaluateProximity, type ProximityTracker } from '@/utils/proximity';

export const RADIUS_OPTIONS = [50, 100, 250, 500, 1000];

const DEFAULT_RADIUS = 100;
const KEY_ENABLED = 'notifications_enabled';
const KEY_RADIUS = 'notification_radius';

interface NotificationsContextType {
  enabled: boolean;
  radius: number;
  permission: NotificationPermission;
  setEnabled: (value: boolean) => Promise<boolean>;
  setRadius: (meters: number) => Promise<void>;
  sendTest: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { getMarkers, getSetting, setSetting } = useDatabase();
  const { position } = useLocation();

  const [enabled, setEnabledState] = useState(false);
  const [radius, setRadiusState] = useState(DEFAULT_RADIUS);
  const [permission, setPermission] = useState<NotificationPermission>({
    status: 'loading',
    canAskAgain: true,
  });

  const trackerRef = useRef<ProximityTracker>(createTracker());

  useEffect(() => {
    configureNotificationHandler();
    ensureNotificationChannel().catch((e) => console.warn('Notification channel error', e));
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getSetting(KEY_ENABLED), getSetting(KEY_RADIUS), readNotificationPermission()])
      .then(([enabledValue, radiusValue, state]) => {
        if (cancelled) return;
        setEnabledState(enabledValue === 'true');
        const parsed = Number(radiusValue);
        if (RADIUS_OPTIONS.includes(parsed)) setRadiusState(parsed);
        setPermission(state);
      })
      .catch((e) => {
        console.warn('Notification settings load error', e);
        if (!cancelled) setPermission({ status: 'denied', canAskAgain: false });
      });

    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active') return;
      readNotificationPermission()
        .then((state) => {
          if (!cancelled) setPermission(state);
        })
        .catch((e) => console.warn('Notification permission read error', e));
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [getSetting]);

  const active = enabled && permission.status === 'granted';

  useEffect(() => {
    if (!active) {
      trackerRef.current = createTracker();
      return;
    }
    if (!position) return;

    let cancelled = false;

    getMarkers()
      .then((markers) => {
        if (cancelled) return;
        const hits = evaluateProximity(trackerRef.current, markers, position, radius);
        hits.forEach(({ marker, distance }) => {
          sendNearbyNotification(marker, distance).catch((e) =>
            console.warn('Send notification error', e),
          );
        });
      })
      .catch((e) => console.warn('Proximity check error', e));

    return () => {
      cancelled = true;
    };
  }, [active, position, radius, getMarkers]);

  const setEnabled = useCallback(
    async (value: boolean): Promise<boolean> => {
      if (value) {
        let state = await readNotificationPermission();
        if (state.status !== 'granted') {
          state = await requestNotificationPermission();
        }
        setPermission(state);
        if (state.status !== 'granted') return false;
      }
      await setSetting(KEY_ENABLED, String(value));
      setEnabledState(value);
      return true;
    },
    [setSetting],
  );

  const setRadius = useCallback(
    async (meters: number): Promise<void> => {
      await setSetting(KEY_RADIUS, String(meters));
      setRadiusState(meters);
    },
    [setSetting],
  );

  const sendTest = useCallback(async () => {
    if (permission.status !== 'granted') {
      throw new Error('Нет разрешения на уведомления');
    }
    await sendTestNotification();
  }, [permission.status]);

  const value = useMemo<NotificationsContextType>(
    () => ({ enabled, radius, permission, setEnabled, setRadius, sendTest }),
    [enabled, radius, permission, setEnabled, setRadius, sendTest],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextType {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications нужно вызывать внутри <NotificationsProvider>');
  }
  return ctx;
}