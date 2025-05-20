"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  Trash2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasPasswordAuth?: boolean;
}

export function DeleteAccountDialog({
  isOpen,
  onOpenChange,
  hasPasswordAuth = false,
}: DeleteAccountDialogProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [verificationStep, setVerificationStep] = useState("initial");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const stateRef = useRef({
    verificationStep,
    verificationCode,
    codeExpiry,
  });

  useEffect(() => {
    stateRef.current = {
      verificationStep,
      verificationCode,
      codeExpiry,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "deleteAccountState",
        JSON.stringify({
          verificationStep,
          verificationCode,
          codeExpiry: codeExpiry ? codeExpiry.toISOString() : null,
        })
      );
    }
  }, [verificationStep, verificationCode, codeExpiry]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = sessionStorage.getItem("deleteAccountState");
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          setVerificationStep(parsedState.verificationStep || "initial");
          setVerificationCode(parsedState.verificationCode || "");
          setCodeExpiry(
            parsedState.codeExpiry ? new Date(parsedState.codeExpiry) : null
          );
        } catch (e) {
          console.error("Error parsing saved state:", e);
        }
      }
    }
  }, []);

  const clearAllStorage = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("deleteAccountState");
      sessionStorage.removeItem("deleteDialogOpen");
      localStorage.removeItem("deleteDialogOpen");
    }
  };

  useEffect(() => {
    if (!isOpen && typeof window !== "undefined") {
      clearAllStorage();
    }
  }, [isOpen]);

  const requestVerificationCode = async () => {
    setIsRequestingCode(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/user/send-delete-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStep("code_sent");
        setCodeExpiry(new Date(data.expiresAt));
        toast.success("Verification code sent to your email");
      } else {
        setDeleteError(data.message || "Failed to send verification code");
        toast.error(data.message || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error requesting verification code:", error);
      setDeleteError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsRequestingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setDeleteError("Please enter a valid 6-digit verification code");
      return;
    }

    setIsVerifyingCode(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/user/verify-delete-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStep("code_verified");
        setDeleteError("");
        toast.success("Email verified successfully");
      } else {
        setDeleteError(data.message || "Invalid verification code");
        toast.error(data.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setDeleteError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "delete my account") {
      setDeleteError("Please type 'delete my account' to confirm");
      return;
    }

    // Authentication check -
    // If user has password auth, they need to provide password OR have a verified code
    // If user doesn't have password auth, they MUST have a verified code
    const hasValidAuth =
      (hasPasswordAuth && deletePassword) ||
      verificationStep === "code_verified";

    if (!hasValidAuth) {
      if (hasPasswordAuth) {
        setDeleteError("Please enter your password or verify your email");
      } else {
        setDeleteError("Please verify your email before deleting your account");
      }
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const payload = {
        password: deletePassword || undefined,
        verificationCode:
          verificationStep === "code_verified" ? verificationCode : undefined,
      };

      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        clearAllStorage();
        toast.success("Account deleted successfully");
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await response.json();
        setDeleteError(data.message || "Failed to delete account");
        toast.error(data.message || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      setDeleteError(
        "An unexpected error occurred. It might be a timeout or server error. Please try again."
      );
      toast.error(
        "An unexpected error occurred. It might be a timeout or server error. Please try again."
      );
      setIsDeleting(false);
    }
  };

  const resetDialog = () => {
    setDeleteConfirmText("");
    setDeletePassword("");
    setVerificationCode("");
    setVerificationStep("initial");
    setDeleteError("");

    // Clear session storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("deleteAccountState");
    }
  };

  const isActionButtonDisabled = () => {
    const hasValidAuth =
      (hasPasswordAuth && deletePassword) ||
      verificationStep === "code_verified";

    return (
      isDeleting || deleteConfirmText !== "delete my account" || !hasValidAuth
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-500 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This action is permanent and cannot be undone. All your data will be
            removed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 text-amber-800 dark:text-amber-300 text-sm">
            <p className="font-medium mb-1">
              Please type <span className="font-bold">"delete my account"</span>{" "}
              to confirm:
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This helps prevent accidental account deletion
            </p>
          </div>

          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="delete my account"
            className="w-full border-input focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />

          <div className="space-y-2 bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium text-foreground">
              Verify your identity
            </h4>
            <p className="text-xs text-muted-foreground">
              {hasPasswordAuth
                ? "For security, we need to verify your identity. You can enter your password or verify your email."
                : "Since you log in with a social account, we need to verify your email before deleting your account."}
            </p>
          </div>

          {hasPasswordAuth && (
            <div className="space-y-2">
              <Label
                htmlFor="delete-password"
                className="text-sm text-foreground"
              >
                Option 1: Enter your password
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
                className="w-full border-input focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                disabled={isDeleting}
              />
            </div>
          )}

          <div className="space-y-2 pt-2">
            {hasPasswordAuth && (
              <Label
                htmlFor="delete-password"
                className="text-sm text-foreground"
              >
                Option 2: Verify by email
              </Label>
            )}
            {verificationStep === "initial" && (
              <Button
                onClick={requestVerificationCode}
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-muted"
                disabled={isRequestingCode}
              >
                {isRequestingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send verification code to email
                  </>
                )}
              </Button>
            )}
            {verificationStep === "code_sent" && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                  A verification code has been sent to your email.
                  {codeExpiry && (
                    <span className="block mt-1 font-medium">
                      Code expires at: {codeExpiry.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    className="flex-1 border-input focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    maxLength={6}
                  />
                  <Button
                    onClick={verifyCode}
                    type="button"
                    variant="outline"
                    disabled={isVerifyingCode}
                  >
                    {isVerifyingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                <Button
                  onClick={requestVerificationCode}
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-violet-700 dark:hover:text-violet-400"
                  disabled={isRequestingCode}
                >
                  {isRequestingCode ? "Sending..." : "Resend code"}
                </Button>
              </div>
            )}
            {verificationStep === "code_verified" && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex items-center text-green-700 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Email verified successfully
              </div>
            )}
          </div>

          {deleteError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetDialog();
            }}
            className="border-border hover:bg-muted text-foreground"
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition-all"
            onClick={handleDeleteAccount}
            disabled={isActionButtonDisabled()}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
