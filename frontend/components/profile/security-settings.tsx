"use client";

import type React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PasswordForm } from "./password-form";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SecuritySettingsProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handlePasswordUpdate: (e: React.FormEvent) => Promise<void>;
  isUpdatingPassword: boolean;
  passwordError: string;
  passwordSuccess: string;
}

export function SecuritySettings({
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  handlePasswordUpdate,
  isUpdatingPassword,
  passwordError,
  passwordSuccess,
}: SecuritySettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your password and security preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              Change Password
            </h3>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure. Password must be
              at least 8 characters long.
            </p>

            {passwordError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm mt-2">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-600 dark:text-green-400 text-sm mt-2">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                {passwordSuccess}
              </div>
            )}

            <PasswordForm
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              setCurrentPassword={setCurrentPassword}
              setNewPassword={setNewPassword}
              setConfirmPassword={setConfirmPassword}
              handlePasswordUpdate={handlePasswordUpdate}
              isUpdatingPassword={isUpdatingPassword}
            />
          </div>
          <Separator className="my-6 bg-border" />

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by enabling
              two-factor authentication.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-border hover:bg-muted text-foreground"
              onClick={() => {
                toast.success("Two-Factor Authentication coming soon!");
              }}
            >
              Enable Two-Factor Authentication
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
