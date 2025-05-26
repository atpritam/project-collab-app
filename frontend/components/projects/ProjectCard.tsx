import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getProfileUrl } from "@/lib/profileUtils";

interface ProjectMember {
  user: {
    Id: string;
    name: string | null;
    image: string | null;
    email: string;
  };
}

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  status: "IN_PROGRESS" | "AT_RISK" | "COMPLETED";
  dueDate: string | null;
  memberCount: number;
  completionPercentage: number;
  members: ProjectMember[];
}

export default function ProjectCard({
  id,
  name,
  description,
  status,
  dueDate,
  memberCount,
  completionPercentage,
  members,
}: ProjectCardProps) {
  const { data: session } = useSession();

  const truncateDescription = (desc: string | null, maxLength = 100) => {
    if (!desc) return "No description provided";
    return desc.length > maxLength
      ? `${desc.substring(0, maxLength)}...`
      : desc;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </Badge>
        );
      case "AT_RISK":
        return <Badge variant={"destructive"}>At Risk</Badge>;
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Link href={`/projects/${id}`} className="block group">
      <Card className="h-full transition-all hover:shadow-md hover:bg-muted/30 dark:hover:bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="">{name}</CardTitle>
            {getStatusBadge(status)}
          </div>
          <CardDescription>{truncateDescription(description)}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center text-xs text-muted-foreground mb-3">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>
              {memberCount} member
              {memberCount !== 1 ? "s" : ""}
            </span>
            <span className="mx-2">•</span>
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{formatDate(dueDate)}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member) => (
                <Avatar
                  key={member.user.Id + member.user.name}
                  className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-105"
                  onClick={() => {
                    window.location.href = getProfileUrl(
                      member.user.email,
                      session?.user?.email
                    );
                  }}
                >
                  <AvatarImage
                    src={member?.user?.image!}
                    alt={member?.user?.name!}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-violet-800 text-white">
                    {getInitials(member.user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{members.length - 3}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 mt-auto">
          <div className="space-y-1 w-full">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-1.5" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
