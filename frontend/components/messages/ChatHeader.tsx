import React from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { getProfileUrl } from "@/lib/profileUtils";
import { getInitials } from "@/lib/utils";

interface ChatHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  onBackClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, onBackClick }) => {
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  if (!user) return null;

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
        onClick={() => {
          if (user.email) {
            window.location.href = getProfileUrl(
              user.email,
              session?.user?.email
            );
          }
        }}
        className="cursor-pointer"
      >
        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => {
          if (user.email) {
            window.location.href = getProfileUrl(
              user.email,
              session?.user?.email
            );
          }
        }}
      >
        <h3 className="font-medium truncate">{user.name || "Unnamed User"}</h3>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );
};

export default ChatHeader;
