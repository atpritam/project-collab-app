"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface UserSettings {
  id: string;
  // Collaboration Preferences
  autoAcceptTaskAssignments: boolean;
  taskReminderNotifications: boolean;
  showDueDatesInLocalTimezone: boolean;

  // Email Notifications
  emailProjectInvitations: boolean;
  emailTaskAssignments: boolean;
  emailTaskDueDateReminders: boolean;
  emailComments: boolean;

  // In-App Notifications
  inAppProjectUpdates: boolean;
  inAppRoleChanges: boolean;

  createdAt: string;
  updatedAt: string;
}

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSetting: (key: keyof UserSettings, value: any) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  id: "",
  autoAcceptTaskAssignments: true,
  taskReminderNotifications: true,
  showDueDatesInLocalTimezone: true,
  emailProjectInvitations: true,
  emailTaskAssignments: true,
  emailTaskDueDateReminders: true,
  emailComments: true,
  inAppProjectUpdates: true,
  inAppRoleChanges: true,
  createdAt: "",
  updatedAt: "",
};

const UserSettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
  updateSetting: async () => {},
  updateSettings: async () => {},
});

export const useUserSettings = () => useContext(UserSettingsContext);

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user settings when authenticated
    if (status === "authenticated" && session?.user?.id) {
      fetchUserSettings();
    } else if (status === "unauthenticated") {
      setSettings(null);
      setIsLoading(false);
    }
  }, [status, session?.user?.id]);

  const fetchUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings");

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error("Failed to fetch user settings");
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!settings || !session?.user?.id) return;

    try {
      setSettings({ ...settings, [key]: value });

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        const currentSettings = { ...settings };
        setSettings(currentSettings);
        toast.error("Failed to update setting");
        console.error("Failed to update setting:", key);
      }
    } catch (error) {
      const currentSettings = { ...settings };
      setSettings(currentSettings);
      toast.error("Failed to update setting");
      console.error("Error updating setting:", error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings || !session?.user?.id) return;

    try {
      setSettings({ ...settings, ...updates });

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const currentSettings = { ...settings };
        setSettings(currentSettings);
        toast.error("Failed to update settings");
        console.error("Failed to update settings");
      } else {
        toast.success("Settings updated successfully");
      }
    } catch (error) {
      const currentSettings = { ...settings };
      setSettings(currentSettings);
      toast.error("Failed to update settings");
      console.error("Error updating settings:", error);
    }
  };

  return (
    <UserSettingsContext.Provider
      value={{ settings, isLoading, updateSetting, updateSettings }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};
