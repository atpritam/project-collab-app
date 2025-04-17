"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface PasswordFormProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handlePasswordUpdate: (e: React.FormEvent) => Promise<void>;
  isUpdatingPassword: boolean;
}

export function PasswordForm({
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  handlePasswordUpdate,
  isUpdatingPassword,
}: PasswordFormProps) {
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    // Password strength checker
    if (newPassword.length === 0) {
      setPasswordStrength(0);
    } else if (newPassword.length < 8) {
      setPasswordStrength(1); // Weak
    } else if (
      newPassword.match(/[A-Z]/) &&
      newPassword.match(/[0-9]/) &&
      newPassword.match(/[^A-Za-z0-9]/)
    ) {
      setPasswordStrength(3); // Strong
    } else if (
      newPassword.match(/[A-Z]/) ||
      newPassword.match(/[0-9]/) ||
      newPassword.match(/[^A-Za-z0-9]/)
    ) {
      setPasswordStrength(2); // Medium
    } else {
      setPasswordStrength(1); // Weak
    }
  }, [newPassword]);

  return (
    <form
      onSubmit={handlePasswordUpdate}
      className="grid grid-cols-1 gap-4 pt-4"
    >
      <div className="space-y-2">
        <Label htmlFor="current-password" className="text-foreground">
          Current Password
        </Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter your current password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-foreground">
          New Password
        </Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter your new password"
        />

        {newPassword && (
          <div className="mt-1.5 space-y-1">
            <div className="flex gap-1 h-1.5">
              <div
                className={`h-full w-1/3 rounded-l-full ${
                  passwordStrength >= 1
                    ? passwordStrength === 1
                      ? "bg-red-500"
                      : passwordStrength === 2
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
              <div
                className={`h-full w-1/3 ${
                  passwordStrength >= 2
                    ? passwordStrength === 2
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
              <div
                className={`h-full w-1/3 rounded-r-full ${
                  passwordStrength >= 3
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {passwordStrength === 0 && "Enter a password"}
              {passwordStrength === 1 && "Weak password"}
              {passwordStrength === 2 && "Medium password"}
              {passwordStrength === 3 && "Strong password"}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-foreground">
          Confirm New Password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
        />
      </div>

      <Button
        type="submit"
        className="w-fit mt-2 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white"
        disabled={isUpdatingPassword}
      >
        {isUpdatingPassword ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
