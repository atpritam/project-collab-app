"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Loader2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { getRoleBadge } from "@/lib/badge-utils";

interface PendingInvitation {
  id: string;
  projectId: string;
  role: string;
  expiresAt: string;
  projectName: string;
  inviterName: string;
}

interface PendingInvitationsSectionProps {
  onInvitationAction?: () => void;
}

export default function PendingInvitationsSection({
  onInvitationAction,
}: PendingInvitationsSectionProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  const fetchPendingInvitations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/invitations/pending");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      } else {
        console.error("Failed to fetch pending invitations");
      }
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setState("Accept");
    setProcessingId(invitationId);
    try {
      const response = await fetch(`/api/invitations/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Invitation accepted successfully");

        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

        if (onInvitationAction) {
          onInvitationAction();
        }
        if (data.projectId) {
          router.push(`/projects/${data.projectId}`);
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
      setState("");
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    setState("Decline");
    try {
      const response = await fetch(`/api/invitations/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        toast.success("Invitation declined");
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        if (onInvitationAction) {
          onInvitationAction();
        }
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to decline invitation");
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
      setState("");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <>
      <span className="flex items-center p-0 m-0 mb-4">
        Pending Invitations
        <Badge className="ml-2 bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
          {invitations.length}
        </Badge>
      </span>
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="border rounded-lg p-4 bg-muted/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">{invitation.projectName}</h3>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="mr-2">
                    Invited by {invitation.inviterName} to join as
                  </span>
                  {getRoleBadge(invitation.role)}
                </div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Expires:{" "}
                  {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={processingId === invitation.id}
                >
                  {processingId === invitation.id && state === "Decline" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-700 hover:bg-violet-800 text-white"
                  onClick={() => handleAccept(invitation.id)}
                  disabled={processingId === invitation.id}
                >
                  {processingId === invitation.id && state === "Accept" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
