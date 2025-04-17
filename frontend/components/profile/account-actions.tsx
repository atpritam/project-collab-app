"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { DeleteAccountDialog } from "./delete-account-dialog";

interface AccountActionsProps {
  hasPasswordAuth: boolean;
}

export function AccountActions({
  hasPasswordAuth = false,
}: AccountActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>Manage your account settings and data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              Export Your Data
            </h3>
            <p className="text-sm text-muted-foreground">
              Download a copy of your personal data, including your profile
              information, projects you've created, and tasks you've been
              assigned.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-border hover:bg-muted text-foreground"
            >
              Export Data
            </Button>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              Delete Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <Button
              variant="outline"
              className="mt-4 text-red-600 dark:text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800/50 transition-all"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>

            <DeleteAccountDialog
              isOpen={isDeleteModalOpen}
              onOpenChange={setIsDeleteModalOpen}
              hasPasswordAuth={hasPasswordAuth}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
