import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/lib/notifications';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
    } else {
      setPermission('denied');
    }
    return granted;
  };

  return {
    permission,
    isSupported,
    requestPermission,
    isEnabled: permission === 'granted',
  };
};
