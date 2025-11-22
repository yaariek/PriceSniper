import { useState, useEffect } from 'react';

export interface NotificationPreferences {
  newInspections: boolean;
  inspectionUpdates: boolean;
  highPriorityIssues: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newInspections: true,
  inspectionUpdates: true,
  highPriorityIssues: true,
};

const STORAGE_KEY = 'notification-preferences';

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return {
    preferences,
    updatePreference,
  };
};
