import React, { useState } from "react";
import {
  File,
  Folder,
  ChevronRight,
  ArrowLeft,
  Download,
  Home,
  CheckCircle,
  Upload,
  X,
  Trash2,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectFileUpload from "./ProjectFileUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  taskId?: string | null;
  isTaskDeliverable?: boolean;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  files: FileItem[];
}

interface FileExplorerProps {
  projectId: string;
  projectFiles: FileItem[];
  tasks: TaskItem[];
  hasPermissions: boolean;
}

export default function FileExplorer({
  projectId,
  projectFiles: initialProjectFiles,
  tasks: initialTasks,
  hasPermissions,
}: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(["root"]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectFiles, setProjectFiles] =
    useState<FileItem[]>(initialProjectFiles);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const getCurrentLocation = () => {
    if (currentPath.length === 1) return "root";
    if (currentPath.length === 2 && currentPath[1] === "Project")
      return "Project Files";
    if (currentPath.length === 2 && currentPath[1] === "Tasks") return "Tasks";

    if (currentPath.length >= 3 && currentPath[1] === "Tasks") {
      const taskId = currentPath[2];
      const task = tasks.find((t) => t.id === taskId);

      if (currentPath.length === 3) {
        return `Task Folder`;
      }

      if (currentPath.length === 4) {
        return currentPath[3] === "main" ? "Task Files" : "Deliverables";
      }
    }

    return "Unknown";
  };

  const navigateTo = (path: string[]) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const navigateUp = () => {
    if (currentPath.length > 1) {
      setCurrentPath((prev) => prev.slice(0, prev.length - 1));
      setSelectedFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    else return (bytes / 1073741824).toFixed(1) + " GB";
  };

  const getTotalFileCount = (pathType: string) => {
    if (pathType === "Project") {
      return projectFiles.length;
    } else if (pathType === "Tasks") {
      return tasks.reduce((total, task) => {
        return total + task.files.length;
      }, 0);
    }
    return 0;
  };

  const getCurrentItems = () => {
    if (currentPath.length === 1) {
      return [
        {
          id: "project-folder",
          name: "Project",
          type: "folder",
          count: getTotalFileCount("Project"),
          navigateTo: ["root", "Project"],
        },
        {
          id: "tasks-folder",
          name: "Tasks",
          type: "folder",
          count: getTotalFileCount("Tasks"),
          navigateTo: ["root", "Tasks"],
        },
      ];
    }

    // Project folder - Shows all project files
    if (currentPath.length === 2 && currentPath[1] === "Project") {
      return projectFiles.map((file) => ({
        ...file,
        type: "file",
      }));
    }

    // Tasks folder -  Shows all tasks as folders
    if (currentPath.length === 2 && currentPath[1] === "Tasks") {
      return tasks.map((task) => {
        const mainFiles = task.files.filter((f) => !f.isTaskDeliverable).length;
        const deliverables = task.files.filter(
          (f) => f.isTaskDeliverable
        ).length;
        const totalFiles = task.files.length;

        return {
          id: task.id,
          name: task.title,
          type: "folder",
          hasMain: mainFiles > 0,
          hasDeliverables: deliverables > 0,
          mainCount: mainFiles,
          deliverablesCount: deliverables,
          navigateTo: ["root", "Tasks", task.id],
          count: totalFiles,
        };
      });
    }

    // Inside a task folder - 'main' and 'deliverables' folders
    if (currentPath.length === 3 && currentPath[1] === "Tasks") {
      const taskId = currentPath[2];
      const task = tasks.find((t) => t.id === taskId);

      if (!task) return [];

      const mainFiles = task.files.filter((f) => !f.isTaskDeliverable);
      const deliverables = task.files.filter((f) => f.isTaskDeliverable);

      const folders = [];

      if (mainFiles.length > 0) {
        folders.push({
          id: "main-files",
          name: "Task Files",
          type: "folder",
          count: mainFiles.length,
          navigateTo: [...currentPath, "main"],
        });
      }

      if (deliverables.length > 0) {
        folders.push({
          id: "deliverables",
          name: "Deliverables",
          type: "folder",
          count: deliverables.length,
          navigateTo: [...currentPath, "deliverables"],
        });
      }

      return folders;
    }

    // Inside a task's main or deliverables folder - Show files
    if (currentPath.length === 4 && currentPath[1] === "Tasks") {
      const taskId = currentPath[2];
      const folderType = currentPath[3];
      const task = tasks.find((t) => t.id === taskId);

      if (!task) return [];

      if (folderType === "main") {
        return task.files
          .filter((f) => !f.isTaskDeliverable)
          .map((file) => ({
            ...file,
            type: "file",
          }));
      }

      if (folderType === "deliverables") {
        return task.files
          .filter((f) => f.isTaskDeliverable)
          .map((file) => ({
            ...file,
            type: "file",
          }));
      }
    }

    return [];
  };

  const handleDownload = (file: FileItem) => {
    window.open(file.url, "_blank");
  };

  const handleFileUpload = () => {
    setFilesToUpload([]);
    setIsUploadDialogOpen(true);
  };

  const handleDeleteFile = (file: FileItem) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    const startTime = Date.now();

    try {
      const fileKey = fileToDelete.url.split("/").pop() || "";
      // delete from project or task in db
      const isTaskFile = !!fileToDelete.taskId;
      const endpoint = isTaskFile
        ? `/api/tasks/files/${fileToDelete.id}`
        : `/api/projects/${projectId}/files/${fileToDelete.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete file");
      }

      // delete from uploadthing
      await fetch("/api/uploadthing/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: fileKey }),
      });

      if (isTaskFile && fileToDelete.taskId) {
        setTasks((prevTasks) => {
          return prevTasks.map((task) => {
            if (task.id === fileToDelete.taskId) {
              return {
                ...task,
                files: task.files.filter((file) => file.id !== fileToDelete.id),
              };
            }
            return task;
          });
        });
      } else {
        setProjectFiles((prevFiles) =>
          prevFiles.filter((file) => file.id !== fileToDelete.id)
        );
      }

      const elapsedTime = Date.now() - startTime;
      const minimumWaitTime = 600;

      if (elapsedTime < minimumWaitTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumWaitTime - elapsedTime)
        );
      }

      toast.success("File deleted successfully");
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file. Please try again.");
      const elapsedTime = Date.now() - startTime;
      const minimumWaitTime = 600;

      if (elapsedTime < minimumWaitTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumWaitTime - elapsedTime)
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitFiles = async () => {
    if (filesToUpload.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    setIsUploading(true);

    try {
      const fileData = filesToUpload.map((file) => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
        key: file.key,
      }));

      const response = await fetch(`/api/projects/${projectId}/files/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add files to project");
      }

      const responseData = await response.json();

      if (responseData.files && Array.isArray(responseData.files)) {
        setProjectFiles((prevFiles) => [...prevFiles, ...responseData.files]);
      } else {
        const now = new Date().toISOString();
        const newFiles = filesToUpload.map((file) => ({
          ...file,
          id:
            file.key ||
            `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: now,
        }));
        setProjectFiles((prevFiles) => [...prevFiles, ...newFiles]);
      }

      toast.success(`${filesToUpload.length} file(s) added to project`);
      setIsUploadDialogOpen(false);
      setFilesToUpload([]);
    } catch (error) {
      console.error("Error adding files to project:", error);
      toast.error("Failed to add files to project. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadCancel = () => {
    if (filesToUpload.length > 0) {
      filesToUpload.forEach(async (file) => {
        try {
          await fetch("/api/uploadthing/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey: file.key }),
          });
        } catch (err) {
          console.error("Failed to delete excess file:", err);
        }
      });
      setFilesToUpload([]);
    }
    setIsUploadDialogOpen(false);
  };

  const renderBreadcrumb = () => {
    return (
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem className="cursor-pointer">
            <BreadcrumbLink onClick={() => navigateTo(["root"])}>
              <Home className="h-4 w-4 mr-1" />
            </BreadcrumbLink>
          </BreadcrumbItem>

          {currentPath.slice(1).map((segment, index) => {
            const fullPath = ["root", ...currentPath.slice(1, index + 2)];
            const isLast = index === currentPath.slice(1).length - 1;

            let displayName = segment;
            if (
              segment !== "Project" &&
              segment !== "Tasks" &&
              segment !== "main" &&
              segment !== "deliverables"
            ) {
              const task = tasks.find((t) => t.id === segment);
              if (task) {
                displayName = task.title;
              }
            }

            if (segment === "main") displayName = "Task Files";
            if (segment === "deliverables") displayName = "Deliverables";

            return (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="cursor-pointer">
                  {isLast ? (
                    <BreadcrumbPage>{displayName}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink onClick={() => navigateTo(fullPath)}>
                      {displayName}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  const items = getCurrentItems();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-4 h-12 justify-between">
        {/* Desktop View */}
        <div className="hidden sm:flex items-center">
          <Button
            variant="ghost"
            onClick={navigateUp}
            disabled={currentPath.length <= 1}
            className="mr-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <Badge variant="outline" className="font-medium min-w-32 w-auto">
            {getCurrentLocation()}
          </Badge>
          <div className="ml-4 mt-4">{renderBreadcrumb()}</div>
        </div>

        {/* Mobile View */}
        <div className="flex sm:hidden items-center w-full">
          <Button
            variant="ghost"
            onClick={navigateUp}
            disabled={currentPath.length <= 1}
            className="mr-2 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Badge variant="outline" className="font-medium py-1.5">
            {getCurrentLocation()}
          </Badge>
        </div>

        {/* Upload Button */}
        {hasPermissions && (
          <div>
            {(getCurrentLocation() === "root" ||
              getCurrentLocation() === "Project Files") && (
              <Button
                variant="outline"
                className="ml-auto cursor-pointer hidden sm:flex"
                onClick={handleFileUpload}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            )}

            {(getCurrentLocation() === "root" ||
              getCurrentLocation() === "Project Files") && (
              <Button
                variant="outline"
                size="icon"
                className="ml-auto cursor-pointer sm:hidden"
                onClick={handleFileUpload}
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="w-full flex-1 overflow-hidden">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {/* Desktop column headers */}
              {getCurrentLocation() != "root" &&
                getCurrentLocation() != "Tasks" &&
                getCurrentLocation() != "Task Folder" && (
                  <div className="border-b p-4 pt-0 hidden sm:block">
                    <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
                      <div className="col-span-6">Name</div>
                      <div className="col-span-2">Size</div>
                      <div className="col-span-3">Date Added</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                  </div>
                )}
              <ScrollArea className="h-[calc(100vh-350px)]">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <File className="h-12 w-12 mb-4 opacity-20" />
                    <p>No files in this folder</p>
                  </div>
                ) : (
                  <div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`border-b hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${
                          selectedFile?.id === item.id
                            ? "bg-slate-100 dark:bg-slate-800/60"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === "file") {
                            setSelectedFile(item as FileItem);
                          }
                        }}
                      >
                        {/* Desktop View */}
                        <div className="hidden sm:grid grid-cols-12 items-center px-4 py-3 text-sm">
                          <div className="col-span-6 flex items-center truncate">
                            {item.type === "folder" ? (
                              <div
                                className="flex items-center cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if ("navigateTo" in item && item.navigateTo) {
                                    navigateTo(item.navigateTo);
                                  }
                                }}
                              >
                                <Folder className="h-5 w-5 mr-2 text-blue-500" />
                                <span className="mr-2 min-w-16 w-auto">
                                  {item.name}
                                </span>

                                {"count" in item && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs w-16 mr-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                  >
                                    {item.count} file
                                    {item.count !== 1 ? "s" : ""}
                                  </Badge>
                                )}

                                {"hasMain" in item &&
                                  "hasDeliverables" in item && (
                                    <div className="flex">
                                      {item.hasDeliverables && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                        >
                                          {item.deliverablesCount} deliverable
                                          {item.deliverablesCount !== 1
                                            ? "s"
                                            : ""}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="flex items-center cursor-pointer">
                                <File className="h-5 w-5" />
                                <span className="ml-2 truncate">
                                  {item.name}
                                </span>

                                {(item as FileItem).isTaskDeliverable && (
                                  <Badge className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Deliverable
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2">
                            {item.type === "file"
                              ? formatFileSize((item as FileItem).size)
                              : ""}
                          </div>

                          <div className="col-span-3">
                            {item.type === "file"
                              ? formatDate((item as FileItem).createdAt)
                              : ""}
                          </div>

                          <div className="col-span-1 flex justify-start">
                            {item.type === "file" && (
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(item as FileItem);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500/70 hover:text-red-600/70 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(item as FileItem);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mobile View */}
                        <div className="sm:hidden px-4 py-3">
                          {item.type === "folder" ? (
                            <div
                              className="flex items-center cursor-pointer justify-between"
                              onClick={(e) => {
                                e.stopPropagation();
                                if ("navigateTo" in item && item.navigateTo) {
                                  navigateTo(item.navigateTo);
                                }
                              }}
                            >
                              <div className="flex">
                                <Folder className="h-5 w-5 mr-2 text-blue-500" />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {item.name}
                                  </span>

                                  <div className="flex mt-1 gap-2">
                                    {"count" in item && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                      >
                                        {item.count} file
                                        {item.count !== 1 ? "s" : ""}
                                      </Badge>
                                    )}

                                    {"hasMain" in item &&
                                      "hasDeliverables" in item &&
                                      item.hasDeliverables && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                        >
                                          {item.deliverablesCount} deliverable
                                          {item.deliverablesCount !== 1
                                            ? "s"
                                            : ""}
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <File className="h-5 w-5 mr-2" />
                                  <span className="font-medium truncate mr-2">
                                    {item.name}
                                  </span>

                                  {(item as FileItem).isTaskDeliverable && (
                                    <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Deliverable
                                    </Badge>
                                  )}
                                </div>
                                <div className="ml-7 text-xs text-muted-foreground mt-1">
                                  {formatFileSize((item as FileItem).size)}
                                </div>
                              </div>

                              {item.type === "file" && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(item as FileItem);
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-500 focus:text-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFile(item as FileItem);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (!isUploading && !open) {
            handleUploadCancel();
          }
        }}
        modal={true}
      >
        <DialogContent className="sm:max-w-md [&>button]:hidden max-w-[90vw] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Upload Project Files</DialogTitle>
            <DialogDescription>
              {}
              Add files to your project. Files uploaded here will be available
              to all project members.
            </DialogDescription>
          </DialogHeader>
          {projectFiles.length >= 5 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-600 dark:text-red-400 text-sm flex items-start">
              <X className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                You can only upload a maximum of 5 files to this project.
              </span>
            </div>
          )}
          <div className="space-y-4 py-4">
            <ProjectFileUpload
              files={filesToUpload}
              setFiles={setFilesToUpload}
              maxFiles={5 - projectFiles.length}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleUploadCancel}
              disabled={isUploading}
            >
              {projectFiles.length >= 5 ? "Close" : "Cancel"}
            </Button>

            {projectFiles.length <= 4 && (
              <Button
                onClick={handleSubmitFiles}
                disabled={isUploading || filesToUpload.length === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Files...
                  </>
                ) : (
                  "Add Files"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting && !open) {
            setDeleteDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row flex-col gap-2 sm:gap-0">
            <div className="flex gap-2">
              <AlertDialogCancel
                disabled={isDeleting}
                className="cursor-pointer mt-0"
              >
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="bg-red-600/80 hover:bg-red-700 text-white cursor-pointer flex items-center justify-center"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin flex self-center" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
