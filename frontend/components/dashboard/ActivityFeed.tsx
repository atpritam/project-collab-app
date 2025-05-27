import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ActivityIcon,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getProfileUrl } from "@/lib/profileUtils";
import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";

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
  userEmail: string;
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
  const { data: session } = useSession();
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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
          <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-violet-500 dark:text-violet-400" />
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
          <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-violet-500 dark:text-violet-400" />
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
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
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
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
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
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
            >
              {activity.entityTitle}
            </Link>{" "}
            in project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
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
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
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
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
            >
              {activity.entityTitle}
            </Link>{" "}
            in project{" "}
            <Link
              href={`/projects/${activity.projectId}`}
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
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
              className="text-violet-700 hover:underline font-medium dark:text-violet-400"
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
          <div className="text-center p-8">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <ActivityIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex">
                <Link
                  href={getProfileUrl(activity.userEmail, session?.user?.email)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={activity.userImage || ""}
                      alt={activity.userName || "Unknown user"}
                    />
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                      {getInitials(activity.userName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center">
                    <Link
                      href={getProfileUrl(
                        activity.userEmail,
                        session?.user?.email
                      )}
                      className="text-sm font-medium hover:underline"
                    >
                      {activity.userName}
                    </Link>
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
