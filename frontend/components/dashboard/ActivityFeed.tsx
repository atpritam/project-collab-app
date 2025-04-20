// frontend/components/dashboard/ActivityFeed.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, FileText } from "lucide-react";
import Link from "next/link";

interface Activity {
  type: "CHAT_MESSAGE" | "TASK_COMMENT";
  id: string;
  content: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  createdAt: string;
  entityId: string | null;
  entityTitle: string | null;
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

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
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
                  <div className="text-sm mt-1">
                    <span>
                      {activity.type === "CHAT_MESSAGE" ? (
                        <>Posted in </>
                      ) : (
                        <>Commented on </>
                      )}
                      <Link
                        href={`/projects/${activity.projectId}`}
                        className="text-violet-700 hover:underline"
                      >
                        {activity.projectName}
                      </Link>
                      {activity.type === "TASK_COMMENT" &&
                        activity.entityId && (
                          <>
                            {" "}
                            task{" "}
                            <Link
                              href={`/projects/${activity.projectId}/tasks/${activity.entityId}`}
                              className="text-violet-700 hover:underline"
                            >
                              {activity.entityTitle}
                            </Link>
                          </>
                        )}
                    </span>
                  </div>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm text-foreground/90 flex">
                    {activity.type === "CHAT_MESSAGE" ? (
                      <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-violet-500" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-violet-500" />
                    )}
                    <p>{truncateText(activity.content)}</p>
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
