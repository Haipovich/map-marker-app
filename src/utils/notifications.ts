import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Marker } from '@/types';

import { markerTitle } from './format';
import { formatDistance } from './geo';

export const NEARBY_CHANNEL_ID = 'nearby-markers';

export type NotificationPermissionStatus = 'loading' | 'undetermined' | 'granted' | 'denied';

export interface NotificationPermission {
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NEARBY_CHANNEL_ID, {
    name: 'Маркеры рядом',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function readNotificationPermission(): Promise<NotificationPermission> {
  const permission = await Notifications.getPermissionsAsync();

  if (permission.granted) {
    return { status: 'granted', canAskAgain: true };
  }
  if (permission.status === Notifications.PermissionStatus.UNDETERMINED) {
    return { status: 'undetermined', canAskAgain: true };
  }
  return { status: 'denied', canAskAgain: permission.canAskAgain };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  await ensureNotificationChannel();
  await Notifications.requestPermissionsAsync();
  return readNotificationPermission();
}

export async function sendNearbyNotification(marker: Marker, distance: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Вы рядом с маркером',
      body: `${markerTitle(marker.id)} — до него ${formatDistance(distance)}`,
      data: { markerId: marker.id },
    },
    trigger: Platform.OS === 'android' ? { channelId: NEARBY_CHANNEL_ID } : null,
  });
}

export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Тестовое уведомление',
      body: 'Уведомления работают.',
    },
    trigger: Platform.OS === 'android' ? { channelId: NEARBY_CHANNEL_ID } : null,
  });
}