import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          In Progress
        </Badge>
      );
    case "AT_RISK":
      return <Badge variant="destructive">At Risk</Badge>;
    case "COMPLETED":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Completed
        </Badge>
      );
    case "DONE":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Done
        </Badge>
      );
    case "TODO":
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          To Do
        </Badge>
      );
    default:
      return null;
  }
};

export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return (
        <Badge
          variant="destructive"
          className="text-xs font-medium flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm"
        >
          <AlertTriangle className="h-3 w-3" />
          High
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge className="text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-sm px-2 py-1">
          Medium
        </Badge>
      );
    case "LOW":
      return (
        <Badge className="text-xs font-medium bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-sm px-2 py-1">
          Low
        </Badge>
      );
    default:
      return null;
  }
};

export const getRoleBadge = (role: string) => {
  switch (role) {
    case "ADMIN":
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1.5">
          <ShieldAlert className="h-3 w-3" />
          Admin
        </Badge>
      );
    case "EDITOR":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
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

export const getPriorityIcon = (priority: string, size: "sm" | "md" = "sm") => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
  };

  switch (priority) {
    case "HIGH":
      return <AlertTriangle className={`${sizeClasses[size]} text-red-600`} />;
    case "MEDIUM":
      return (
        <AlertTriangle className={`${sizeClasses[size]} text-yellow-600`} />
      );
    case "LOW":
      return <AlertTriangle className={`${sizeClasses[size]} text-blue-600`} />;
    default:
      return null;
  }
};
