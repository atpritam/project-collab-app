import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { debugError } from "../utils/debug";

const prisma = new PrismaClient();
const settingsRouter: Router = express.Router();

// GET /api/settings/:userId
settingsRouter.get("/:userId", function (req: Request, res: Response) {
  const { userId } = req.params;

  (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
        },
        select: {
          id: true,
          // Collaboration Preferences
          autoAcceptTaskAssignments: true,
          taskReminderNotifications: true,
          showDueDatesInLocalTimezone: true,

          // Email Notifications
          emailProjectInvitations: true,
          emailTaskAssignments: true,
          emailTaskDueDateReminders: true,
          emailComments: true,

          // In-App Notifications
          inAppProjectUpdates: true,
          inAppRoleChanges: true,

          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json(settings);
    } catch (error) {
      debugError("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  })();
});

// PUT /api/settings/:userId
settingsRouter.put("/:userId", function (req: Request, res: Response) {
  const { userId } = req.params;
  const settingsData = req.body;

  (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          // Collaboration Preferences
          autoAcceptTaskAssignments:
            settingsData.autoAcceptTaskAssignments !== undefined
              ? settingsData.autoAcceptTaskAssignments
              : undefined,
          taskReminderNotifications:
            settingsData.taskReminderNotifications !== undefined
              ? settingsData.taskReminderNotifications
              : undefined,
          showDueDatesInLocalTimezone:
            settingsData.showDueDatesInLocalTimezone !== undefined
              ? settingsData.showDueDatesInLocalTimezone
              : undefined,

          // Email Notifications
          emailProjectInvitations:
            settingsData.emailProjectInvitations !== undefined
              ? settingsData.emailProjectInvitations
              : undefined,
          emailTaskAssignments:
            settingsData.emailTaskAssignments !== undefined
              ? settingsData.emailTaskAssignments
              : undefined,
          emailTaskDueDateReminders:
            settingsData.emailTaskDueDateReminders !== undefined
              ? settingsData.emailTaskDueDateReminders
              : undefined,
          emailComments:
            settingsData.emailComments !== undefined
              ? settingsData.emailComments
              : undefined,

          // In-App Notifications
          inAppProjectUpdates:
            settingsData.inAppProjectUpdates !== undefined
              ? settingsData.inAppProjectUpdates
              : undefined,
          inAppRoleChanges:
            settingsData.inAppRoleChanges !== undefined
              ? settingsData.inAppRoleChanges
              : undefined,
        },
        create: {
          userId,
          // Collaboration Preferences
          autoAcceptTaskAssignments:
            settingsData.autoAcceptTaskAssignments !== undefined
              ? settingsData.autoAcceptTaskAssignments
              : true,
          taskReminderNotifications:
            settingsData.taskReminderNotifications !== undefined
              ? settingsData.taskReminderNotifications
              : true,
          showDueDatesInLocalTimezone:
            settingsData.showDueDatesInLocalTimezone !== undefined
              ? settingsData.showDueDatesInLocalTimezone
              : true,

          // Email Notifications
          emailProjectInvitations:
            settingsData.emailProjectInvitations !== undefined
              ? settingsData.emailProjectInvitations
              : true,
          emailTaskAssignments:
            settingsData.emailTaskAssignments !== undefined
              ? settingsData.emailTaskAssignments
              : true,
          emailTaskDueDateReminders:
            settingsData.emailTaskDueDateReminders !== undefined
              ? settingsData.emailTaskDueDateReminders
              : true,
          emailComments:
            settingsData.emailComments !== undefined
              ? settingsData.emailComments
              : true,

          // In-App Notifications
          inAppProjectUpdates:
            settingsData.inAppProjectUpdates !== undefined
              ? settingsData.inAppProjectUpdates
              : true,
          inAppRoleChanges:
            settingsData.inAppRoleChanges !== undefined
              ? settingsData.inAppRoleChanges
              : true,
        },
      });

      res.status(200).json(settings);
    } catch (error) {
      debugError("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  })();
});

export default settingsRouter;
