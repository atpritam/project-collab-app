import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  Clock,
  FileText,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Activity {
  id: string;
  type:
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_COMPLETED"
    | "MEMBER_ADDED";
  projectId: string;
  projectName: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  createdAt: string;
  entityId?: string | null;
  entityTitle?: string | null;
  targetUser?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  details?: {
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    role?: string;
  } | null;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "PROJECT_CREATED":
        return (
          <Plus className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-emerald-500" />
        );
      case "MEMBER_ADDED":
        return (
          <UserPlus className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
        );
      case "TASK_CREATED":
        return (
          <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-violet-500" />
        );
      case "TASK_UPDATED":
        return (
          <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
        );
      case "TASK_COMPLETED":
        return (
          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
        );
      case "PROJECT_UPDATED":
        return (
          <Users className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-indigo-500" />
        );
      default:
        return (
          <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-violet-500" />
        );
    }
  };

  const renderActivityContent = (activity: Activity) => {
    switch (activity.type) {
      case "PROJECT_CREATED":
        return (
          <span>
            Created project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.projectName}
            </Link>
          </span>
        );
      case "MEMBER_ADDED":
        return (
          <span>
            Added{" "}
            <span className="font-medium">
              {activity.targetUser?.name || "a new user"}
            </span>{" "}
            to project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.projectName}
            </Link>
            {activity.details?.role && (
              <span className="text-muted-foreground">
                {" "}
                as {activity.details.role.toLowerCase()}
              </span>
            )}
          </span>
        );
      case "TASK_CREATED":
        return (
          <span>
            Created task{" "}
            <Link
              href={`/tasks/${activity.entityId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.entityTitle}
            </Link>{" "}
            in project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.projectName}
            </Link>
          </span>
        );
      case "TASK_UPDATED":
        return (
          <span>
            Updated task{" "}
            <Link
              href={`/tasks/${activity.entityId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.entityTitle}
            </Link>
            {activity.details?.oldStatus && activity.details?.newStatus && (
              <span>
                {" "}
                from{" "}
                <span className="font-medium">
                  {activity.details.oldStatus.toLowerCase()}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {activity.details.newStatus.toLowerCase()}
                </span>
              </span>
            )}
          </span>
        );
      case "TASK_COMPLETED":
        return (
          <span>
            Completed task{" "}
            <Link
              href={`/tasks/${activity.entityId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.entityTitle}
            </Link>{" "}
            in project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.projectName}
            </Link>
          </span>
        );
      case "PROJECT_UPDATED":
        return (
          <span>
            Updated project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium"
            >
              {activity.projectName}
            </Link>
            {activity.details?.status && (
              <span>
                {" "}
                to{" "}
                <span className="font-medium">
                  {activity.details.status.toLowerCase()}
                </span>
              </span>
            )}
          </span>
        );
      default:
        return <span>Activity in project {activity.projectName}</span>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage
                    src={activity.userImage || ""}
                    alt={activity.userName || ""}
                  />
                  <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                    {getInitials(activity.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-sm">
                      {activity.userName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm text-foreground/90 flex">
                    {renderActivityIcon(activity.type)}
                    <p>{renderActivityContent(activity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
