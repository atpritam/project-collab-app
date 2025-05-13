"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Loader2,
  PlusCircle,
  ChevronRight,
  Calendar,
  Users,
  Search,
  Filter,
  ChevronDown,
  X,
  ArrowUp,
  ArrowDown,
  FolderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  // Fetch all projects when authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetchProjects();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, statusFilter, sortBy, sortOrder]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...projects];

    // search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (project: any) =>
          project.name.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query))
      );
    }

    // status filter
    if (statusFilter.length > 0) {
      result = result.filter((project: any) =>
        statusFilter.includes(project.status)
      );
    }

    // Apply sorting
    result.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else
            comparison =
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "memberCount":
          comparison = a.memberCount - b.memberCount;
          break;
        case "progress":
          comparison = a.completionPercentage - b.completionPercentage;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredProjects(result);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setSortBy("name");
    setSortOrder("asc");
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  // Helper functions for project cards
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

  // get initials for avatars
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading && isInitialRender) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderIcon className="h-7 w-7" />
            My Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your projects
          </p>
        </div>

        <Button
          asChild
          className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
          disabled={isLoading}
        >
          <Link href="/projects/create">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search and Filter Section */}
      {isMobile ? (
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {isLoading ? (
              <Skeleton className="h-10 flex-1 rounded-md" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter By Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("IN_PROGRESS")}
                    onCheckedChange={() => toggleStatusFilter("IN_PROGRESS")}
                  >
                    In Progress
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("AT_RISK")}
                    onCheckedChange={() => toggleStatusFilter("AT_RISK")}
                  >
                    At Risk
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("COMPLETED")}
                    onCheckedChange={() => toggleStatusFilter("COMPLETED")}
                  >
                    Completed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isLoading ? (
              <Skeleton className="h-10 flex-1 rounded-md" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="flex-1">
                  <Button variant="outline" className="w-full">
                    <div className="flex items-center">
                      Sort by
                      {sortBy === "name" && (
                        <span className="ml-1 flex items-center">
                          Name
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                      {sortBy === "dueDate" && (
                        <span className="ml-1 flex items-center">
                          Due Date
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                      {sortBy === "memberCount" && (
                        <span className="ml-1 flex items-center">
                          Members
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                      {sortBy === "progress" && (
                        <span className="ml-1 flex items-center">
                          Progress
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleSort("name")}>
                    Name
                    {sortBy === "name" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("dueDate")}>
                    Due Date
                    {sortBy === "dueDate" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("memberCount")}>
                    Members
                    {sortBy === "memberCount" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("progress")}>
                    Progress
                    {sortBy === "progress" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isLoading ? (
              <Skeleton className="h-10 w-36 rounded-md" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter By Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("IN_PROGRESS")}
                    onCheckedChange={() => toggleStatusFilter("IN_PROGRESS")}
                  >
                    In Progress
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("AT_RISK")}
                    onCheckedChange={() => toggleStatusFilter("AT_RISK")}
                  >
                    At Risk
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("COMPLETED")}
                    onCheckedChange={() => toggleStatusFilter("COMPLETED")}
                  >
                    Completed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isLoading ? (
              <Skeleton className="h-10 w-36 rounded-md" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <div className="flex items-center">
                      Sort by
                      {sortBy === "name" && (
                        <span className="ml-1 flex items-center">
                          Name
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                      {sortBy === "dueDate" && (
                        <span className="ml-1 flex items-center">
                          Due Date
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                      {sortBy === "memberCount" && (
                        <span className="ml-1 flex items-center">
                          Members
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                      {sortBy === "progress" && (
                        <span className="ml-1 flex items-center">
                          Progress
                          {sortOrder === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleSort("name")}>
                    Name
                    {sortBy === "name" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("dueDate")}>
                    Due Date
                    {sortBy === "dueDate" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("memberCount")}>
                    Members
                    {sortBy === "memberCount" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("progress")}>
                    Progress
                    {sortBy === "progress" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {(statusFilter.length > 0 || searchQuery) && !isLoading && (
        <div className="flex flex-wrap gap-2 items-center mt-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Search className="h-3 w-3 mr-1" />"{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {statusFilter.map((status) => (
            <Badge
              key={status}
              variant="outline"
              className="flex items-center gap-1"
            >
              <span>
                {status === "IN_PROGRESS"
                  ? "In Progress"
                  : status === "AT_RISK"
                  ? "At Risk"
                  : "Completed"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => toggleStatusFilter(status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Project Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-1/2 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mt-2 rounded-md" />
                <Skeleton className="h-4 w-2/3 mt-2 rounded-md" />
              </CardHeader>

              <CardContent>
                <div className="flex items-center mb-3">
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                  <Skeleton className="h-4 w-1/3 ml-auto rounded-md" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>

                <div className="space-y-1 mt-4 w-full">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">
              You don't have any projects yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first project to start collaborating with your team
            </p>
            <Button
              asChild
              className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
            >
              <Link href="/projects/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">
              No projects match your filters
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block group"
            >
              <Card className="h-full transition-all hover:shadow-md hover:bg-muted/30 dark:hover:bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="">{project.name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {truncateDescription(project.description)}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {project.memberCount} member
                      {project.memberCount !== 1 ? "s" : ""}
                    </span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDate(project.dueDate)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {project.members &&
                        project.members.slice(0, 3).map((member: any) => (
                          <Avatar
                            key={member.userId}
                            className="h-8 w-8 border-2 border-background"
                          >
                            <AvatarImage
                              src={member.user?.image || ""}
                              alt={member.user?.name || ""}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-violet-800 text-white">
                              {getInitials(member.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      {project.members && project.members.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" className="gap-1">
                      <span>View</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1 mt-4 w-full">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{project.completionPercentage}%</span>
                    </div>
                    <Progress
                      value={project.completionPercentage}
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {isLoading && !isInitialRender && (
        <div className="fixed bottom-4 right-4 bg-background shadow-lg rounded-full p-2 z-50 border">
          <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
        </div>
      )}
    </div>
  );
}
