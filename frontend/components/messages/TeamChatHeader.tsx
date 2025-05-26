import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface TeamChatHeaderProps {
  project: {
    id: string;
    name: string;
    description?: string;
    creator?: string;
    memberCount: number;
  } | null;
  onBackClick?: () => void;
}

const TeamChatHeader: React.FC<TeamChatHeaderProps> = ({
  project,
  onBackClick,
}) => {
  const isMobile = useIsMobile();

  if (!project) return null;

  const getProjectInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center gap-3 p-3 border-b">
      {isMobile && onBackClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackClick}
          className="mr-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <Avatar
        className="h-10 w-10 bg-violet-100 dark:bg-violet-900/30 cursor-pointer"
        onClick={() => {
          if (project.id) {
            window.location.href = `/projects/${project.id}`;
          }
        }}
      >
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white">
          {getProjectInitials(project.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <h3
            className="font-medium truncate cursor-pointer"
            onClick={() => {
              if (project.id) {
                window.location.href = `/projects/${project.id}`;
              }
            }}
          >
            {project.name}
          </h3>
          <div className="flex items-center ml-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3 mr-1" />
            {project.memberCount}
          </div>
        </div>
        {project.creator && (
          <p className="text-sm text-muted-foreground truncate">
            Created by {project.creator}
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamChatHeader;
