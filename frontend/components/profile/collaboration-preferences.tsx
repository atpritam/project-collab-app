"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Bell, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUserSettings } from "@/components/context/UserSettingsContext";
import { CustomToggle } from "@/components/ui/CustomToggle";

export function CollaborationPreferences() {
  const { settings, updateSetting, isLoading } = useUserSettings();

  // Local state for toggles
  const [autoAccept, setAutoAccept] = useState(
    settings?.autoAcceptTaskAssignments ?? true
  );
  const [taskReminders, setTaskReminders] = useState(
    settings?.taskReminderNotifications ?? true
  );
  const [localTimezone, setLocalTimezone] = useState(
    settings?.showDueDatesInLocalTimezone ?? true
  );

  const [debugInfo, setDebugInfo] = useState({
    renderCount: 0,
    lastAction: "initial",
  });

  // Sync with context settings when they change
  useEffect(() => {
    if (settings) {
      setDebugInfo((prev) => ({
        renderCount: prev.renderCount + 1,
        lastAction: "settings-changed",
      }));

      setAutoAccept(settings.autoAcceptTaskAssignments);
      setTaskReminders(settings.taskReminderNotifications);
      setLocalTimezone(settings.showDueDatesInLocalTimezone);
    }
  }, [
    settings?.autoAcceptTaskAssignments,
    settings?.taskReminderNotifications,
    settings?.showDueDatesInLocalTimezone,
  ]);

  const handleAutoAcceptChange = useCallback(
    async (checked: boolean) => {
      setDebugInfo((prev) => ({
        renderCount: prev.renderCount + 1,
        lastAction: `autoAccept-changed-to-${checked}`,
      }));

      setAutoAccept(checked);

      // backend update
      try {
        await updateSetting("autoAcceptTaskAssignments", checked);
      } catch (error) {
        setAutoAccept(!checked);
        toast.error("Failed to update setting. Please try again.");
        console.error("Error updating setting:", error);
      }
    },
    [updateSetting]
  );

  const handleTaskRemindersChange = useCallback(
    async (checked: boolean) => {
      setDebugInfo((prev) => ({
        renderCount: prev.renderCount + 1,
        lastAction: `taskReminders-changed-to-${checked}`,
      }));

      // local state update
      setTaskReminders(checked);

      // backend update
      try {
        await updateSetting("taskReminderNotifications", checked);
      } catch (error) {
        setTaskReminders(!checked);
        toast.error("Failed to update setting. Please try again.");
        console.error("Error updating setting:", error);
      }
    },
    [updateSetting]
  );

  const handleLocalTimezoneChange = useCallback(
    async (checked: boolean) => {
      setDebugInfo((prev) => ({
        renderCount: prev.renderCount + 1,
        lastAction: `localTimezone-changed-to-${checked}`,
      }));

      // local state update
      setLocalTimezone(checked);

      // backend update
      try {
        await updateSetting("showDueDatesInLocalTimezone", checked);
      } catch (error) {
        setLocalTimezone(!checked);
        toast.error("Failed to update setting. Please try again.");
        console.error("Error updating setting:", error);
      }
    },
    [updateSetting]
  );

  // Update debug info on each render
  useEffect(() => {
    setDebugInfo((prev) => ({ ...prev, renderCount: prev.renderCount + 1 }));
  }, []);

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Collaboration Preferences</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Collaboration Preferences</CardTitle>
        <CardDescription>
          Set your preferences for project collaboration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Default Project Role</h3>
            <p className="text-xs text-muted-foreground">
              When you create a new project, you'll automatically be assigned
              the Admin role. When invited to projects, you'll be assigned the
              role set by the project admin.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Task Assignment Preferences</h3>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="auto-accept" className="text-sm">
                  Auto-accept task assignments
                </Label>
              </div>
              <CustomToggle
                id="auto-accept"
                checked={autoAccept}
                onChange={handleAutoAcceptChange}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="task-reminders" className="text-sm">
                  Receive task reminder notifications
                </Label>
              </div>
              <CustomToggle
                id="task-reminders"
                checked={taskReminders}
                onChange={handleTaskRemindersChange}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="local-timezone" className="text-sm">
                  Show due dates in my local timezone
                </Label>
              </div>
              <CustomToggle
                id="local-timezone"
                checked={localTimezone}
                onChange={handleLocalTimezoneChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
