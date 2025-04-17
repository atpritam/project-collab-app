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
import { toast } from "sonner";
import { useUserSettings } from "@/components/context/UserSettingsContext";
import { CustomToggle } from "@/components/ui/CustomToggle";

export function NotificationPreferences() {
  const { settings, updateSetting, isLoading } = useUserSettings();

  // Email notifications
  const [emailInvitations, setEmailInvitations] = useState(
    settings?.emailProjectInvitations ?? true
  );
  const [emailAssignments, setEmailAssignments] = useState(
    settings?.emailTaskAssignments ?? true
  );
  const [emailReminders, setEmailReminders] = useState(
    settings?.emailTaskDueDateReminders ?? true
  );
  const [emailComments, setEmailComments] = useState(
    settings?.emailComments ?? true
  );

  // In-app notifications
  const [projectUpdates, setProjectUpdates] = useState(
    settings?.inAppProjectUpdates ?? true
  );
  const [roleChanges, setRoleChanges] = useState(
    settings?.inAppRoleChanges ?? true
  );

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    renderCount: 0,
    lastAction: "initial",
  });

  // debugInfo is used to track the number of renders and the last action taken
  useEffect(() => {
    if (settings) {
      setDebugInfo((prev) => ({
        renderCount: prev.renderCount + 1,
        lastAction: "settings-changed",
      }));

      setEmailInvitations(settings.emailProjectInvitations);
      setEmailAssignments(settings.emailTaskAssignments);
      setEmailReminders(settings.emailTaskDueDateReminders);
      setEmailComments(settings.emailComments);
      setProjectUpdates(settings.inAppProjectUpdates);
      setRoleChanges(settings.inAppRoleChanges);
    }
  }, [
    settings?.emailProjectInvitations,
    settings?.emailTaskAssignments,
    settings?.emailTaskDueDateReminders,
    settings?.emailComments,
    settings?.inAppProjectUpdates,
    settings?.inAppRoleChanges,
  ]);

  const createToggleHandler = useCallback(
    (stateSetter: (value: boolean) => void, settingKey: any) => {
      return async (checked: boolean) => {
        stateSetter(checked);

        setDebugInfo((prev) => ({
          renderCount: prev.renderCount + 1,
          lastAction: `${settingKey}-changed-to-${checked}`,
        }));

        // backend update
        try {
          await updateSetting(settingKey, checked);
        } catch (error) {
          stateSetter(!checked);
          toast.error("Failed to update setting. Please try again.");
          console.error(`Error updating ${settingKey}:`, error);
        }
      };
    },
    [updateSetting]
  );

  // handlers for each setting
  const handleEmailInvitationsChange = useCallback(
    createToggleHandler(setEmailInvitations, "emailProjectInvitations"),
    [createToggleHandler]
  );

  const handleEmailAssignmentsChange = useCallback(
    createToggleHandler(setEmailAssignments, "emailTaskAssignments"),
    [createToggleHandler]
  );

  const handleEmailRemindersChange = useCallback(
    createToggleHandler(setEmailReminders, "emailTaskDueDateReminders"),
    [createToggleHandler]
  );

  const handleEmailCommentsChange = useCallback(
    createToggleHandler(setEmailComments, "emailComments"),
    [createToggleHandler]
  );

  const handleProjectUpdatesChange = useCallback(
    createToggleHandler(setProjectUpdates, "inAppProjectUpdates"),
    [createToggleHandler]
  );

  const handleRoleChangesChange = useCallback(
    createToggleHandler(setRoleChanges, "inAppRoleChanges"),
    [createToggleHandler]
  );

  useEffect(() => {
    setDebugInfo((prev) => ({ ...prev, renderCount: prev.renderCount + 1 }));
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Choose which email notifications you'd like to receive.
            </p>
            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Project Invitations</h4>
                  <p className="text-xs text-muted-foreground">
                    Receive emails when you're invited to join a project
                  </p>
                </div>
                <CustomToggle
                  id="project-invitations"
                  checked={emailInvitations}
                  onChange={handleEmailInvitationsChange}
                  disabled={isLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Task Assignments</h4>
                  <p className="text-xs text-muted-foreground">
                    Receive emails when you are assigned to a task
                  </p>
                </div>
                <CustomToggle
                  id="task-assignments"
                  checked={emailAssignments}
                  onChange={handleEmailAssignmentsChange}
                  disabled={isLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">
                    Task Due Date Reminders
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Receive emails when a task is approaching its due date
                  </p>
                </div>
                <CustomToggle
                  id="due-date-reminders"
                  checked={emailReminders}
                  onChange={handleEmailRemindersChange}
                  disabled={isLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Comments</h4>
                  <p className="text-xs text-muted-foreground">
                    Receive emails when someone comments on your tasks
                  </p>
                </div>
                <CustomToggle
                  id="comments"
                  checked={emailComments}
                  onChange={handleEmailCommentsChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-lg font-medium">In-App Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Choose which notifications you'd like to see within the app.
            </p>
            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Project Updates</h4>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications about changes to projects you're a
                    member of
                  </p>
                </div>
                <CustomToggle
                  id="project-updates"
                  checked={projectUpdates}
                  onChange={handleProjectUpdatesChange}
                  disabled={isLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Role Changes</h4>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications when your role in a project changes
                  </p>
                </div>
                <CustomToggle
                  id="role-changes"
                  checked={roleChanges}
                  onChange={handleRoleChangesChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
