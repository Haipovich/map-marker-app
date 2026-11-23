import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

function openMarkerFrom(notification: Notifications.Notification): void {
  const markerId = notification.request.content.data?.markerId;
  if (typeof markerId !== 'number') return;
  try {
    router.push({ pathname: '/marker/[id]', params: { id: String(markerId) } });
  } catch (error) {
    console.error('Notification navigation error', error);
  }
}

export function useNotificationObserver(): void {
  useEffect(() => {
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      openMarkerFrom(last.notification);
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openMarkerFrom(response.notification);
      Notifications.clearLastNotificationResponse();
    });

    return () => subscription.remove();
  }, []);
}