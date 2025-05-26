"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  expiresAt: string;
}

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const token = searchParams?.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invitations/token/${token}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Invalid invitation link");
        }

        const invitationData = await response.json();
        setInvitation(invitationData);
      } catch (err: any) {
        setError(err.message || "Failed to validate invitation");
        console.error("Error validating invitation:", err);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!invitation || !session?.user?.id) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: invitation.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to accept invitation");
      }

      const data = await response.json();
      toast.success("You've successfully joined the project!");

      // Redirect to the project
      router.push(`/projects/${data.projectId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
      console.error("Error accepting invitation:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !session?.user?.id) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/invitations/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: invitation.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to decline invitation");
      }

      toast.success("Invitation declined");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline invitation");
      console.error("Error declining invitation:", err);
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            Admin
          </Badge>
        );
      case "EDITOR":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Editor
          </Badge>
        );
      case "MEMBER":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Member
          </Badge>
        );
      default:
        return null;
    }
  };

  // Unauthenticated users need to sign in first
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Project Invitation</CardTitle>
            <CardDescription>
              Please sign in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <Shield className="h-12 w-12 text-violet-600 mb-4" />
              <p className="text-center mb-6">
                You need to sign in to your account to accept this project
                invitation.
              </p>
              <Button
                asChild
                className="w-full bg-violet-700 hover:bg-violet-800 text-white"
              >
                <Link
                  href={`/auth/signin?callbackUrl=${encodeURIComponent(
                    window.location.href
                  )}`}
                >
                  Sign in to continue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-violet-700 mb-4" />
            <p className="text-lg">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              <AlertTriangle className="inline-block mr-2 h-6 w-6" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">{error}</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">Could not load invitation details.</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email mismatch check
  if (session?.user?.email && session.user.email !== invitation.email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              <AlertTriangle className="inline-block mr-2 h-6 w-6" />
              Email Mismatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              This invitation was sent to <strong>{invitation.email}</strong>{" "}
              but you are signed in as <strong>{session.user.email}</strong>.
            </p>
            <p className="mb-6">
              Please sign in with the correct account or contact the project
              administrator.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
              <Button asChild className="flex-1">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Project Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                {invitation.projectName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {invitation.inviterName} has invited you to join this project as
                a {getRoleBadge(invitation.role)}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">About Your Role</h4>
              {invitation.role === "ADMIN" && (
                <p className="text-sm">
                  As an <strong>Admin</strong>, you'll have full control over
                  the project, including managing members, tasks, and project
                  settings.
                </p>
              )}
              {invitation.role === "EDITOR" && (
                <p className="text-sm">
                  As an <strong>Editor</strong>, you can create and edit tasks,
                  make changes to project details, and collaborate with other
                  members.
                </p>
              )}
              {invitation.role === "MEMBER" && (
                <p className="text-sm">
                  As a <strong>Member</strong>, you can view project details,
                  comment on tasks, and participate in team discussions.
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDecline}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </>
            )}
          </Button>
          <Button
            className="w-full sm:w-auto bg-violet-700 hover:bg-violet-800 text-white"
            onClick={handleAccept}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Invitation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-violet-700 mb-4" />
          <p className="text-lg">Loading invitation...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Suspense boundary
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InvitationContent />
    </Suspense>
  );
}
