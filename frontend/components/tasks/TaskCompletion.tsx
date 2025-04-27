import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, FileUp, CheckCircle2, Edit, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import TaskFileUpload from "./TaskFileUpload";
import TaskAttachments from "./TaskAttachments";

interface TaskCompletionProps {
  taskId: string;
  isAssignee: boolean;
  existingNote?: string;
  onNoteUpdated: (note: string) => void;
  deliverables?: any[];
}

export default function TaskCompletion({
  taskId,
  isAssignee,
  existingNote,
  onNoteUpdated,
  deliverables = [],
}: TaskCompletionProps) {
  const [completionNote, setCompletionNote] = useState(existingNote || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deliverableFiles, setDeliverableFiles] = useState<any[]>([]);

  useEffect(() => {
    const hasExistingData = !!(
      existingNote ||
      (deliverables && deliverables.length > 0)
    );
    setIsEditing(isAssignee && !hasExistingData);
    setCompletionNote(existingNote || "");

    if (deliverables && deliverables.length > 0) {
      setDeliverableFiles([...deliverables]);
    } else {
      setDeliverableFiles([]);
    }
  }, [isAssignee, existingNote, deliverables]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCompletionNote(e.target.value);
  };

  const handleRemoveFile = async (fileUrl: string) => {
    console.log("file_url:", fileUrl);
    const fileKey = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    console.log("file_key:", fileKey);
    try {
      // delete from uploadthing
      const uploadThingResponse = await fetch("/api/uploadthing/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey }),
      });

      if (!uploadThingResponse.ok) {
        const data = await uploadThingResponse.json();
        throw new Error(data.message || "Failed to delete file from storage");
      }

      const fileToDelete = deliverableFiles.find(
        (file) => file.url === fileUrl
      );

      // delete from database
      if (fileToDelete && fileToDelete.id) {
        const dbDeleteResponse = await fetch(
          `/api/tasks/files/${fileToDelete.id}`,
          {
            method: "DELETE",
          }
        );

        if (!dbDeleteResponse.ok) {
          const data = await dbDeleteResponse.json();
          throw new Error(
            data.message || "Failed to delete file from database"
          );
        }
      }

      setDeliverableFiles(
        deliverableFiles.filter((file) => file.url !== fileUrl)
      );

      toast.success("File removed successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to remove file. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!isAssignee) return;

    setIsSaving(true);

    try {
      const uniqueFilesMap = new Map<string, any>();
      deliverableFiles.forEach((file) => {
        if (!uniqueFilesMap.has(file.url)) {
          uniqueFilesMap.set(file.url, file);
        }
      });

      const uniqueDeliverableFiles = Array.from(uniqueFilesMap.values());
      const fileData = uniqueDeliverableFiles.map((file) => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
        key: file.key,
      }));

      const response = await fetch(`/api/tasks/complete/${taskId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completionNote,
          deliverables: fileData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update completion details");
      }

      toast.success("Task completion details updated successfully");
      onNoteUpdated(completionNote);

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating completion details:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update completion details"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnterEditMode = () => {
    setIsEditing(true);
    setCompletionNote(existingNote || "");
    setDeliverableFiles(deliverables || []);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCompletionNote(existingNote || "");
    setDeliverableFiles(deliverables || []);
  };

  // Shared view-only display for both assignees (not in edit mode) and non-assignees
  const renderViewMode = () => {
    if (!existingNote && (!deliverables || deliverables.length === 0)) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium">Task Completion</h3>
          </div>

          {isAssignee && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEnterEditMode}
              className="flex items-center gap-1 cursor-pointer"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        {existingNote && (
          <div>
            <h4 className="text-sm font-medium mb-2">Note</h4>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{existingNote}</p>
            </div>
          </div>
        )}

        {deliverables && deliverables.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Deliverables</h4>
            <TaskAttachments files={deliverables} />
          </div>
        )}
      </div>
    );
  };

  // Edit mode for assignees
  const renderEditMode = () => {
    const maxAdditionalFiles = Math.max(0, 3 - deliverableFiles.length);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium">Task Completion</h3>
          </div>

          {(existingNote || (deliverables && deliverables.length > 0)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          )}
        </div>

        <div className="space-y-4 bg-muted/30 p-4 rounded-md">
          <div className="space-y-2">
            <Label htmlFor="completion-note">Notes</Label>
            <Textarea
              id="completion-note"
              placeholder="Add details about the work done or upload deliverables"
              value={completionNote}
              onChange={handleNoteChange}
              className="min-h-[120px] resize-y"
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label className="flex items-center" htmlFor="deliverables">
              <FileUp className="h-4 w-4 mr-2 text-violet-600" />
              Deliverables
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload up to 3 files (max 2MB each) to showcase your work
            </p>

            {deliverableFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">
                  Current Deliverables
                </h4>
                <TaskAttachments
                  files={deliverableFiles}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            )}

            {maxAdditionalFiles > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  ({deliverableFiles.length}/3)
                </h4>
                <TaskFileUpload
                  files={[]}
                  setFiles={(newFiles) => {
                    const filesToAdd = newFiles.slice(0, maxAdditionalFiles);
                    if (filesToAdd.length > 0) {
                      setDeliverableFiles([...deliverableFiles, ...filesToAdd]);
                    }
                  }}
                  maxFiles={maxAdditionalFiles}
                />
              </div>
            )}

            {maxAdditionalFiles === 0 && (
              <p className="text-xs text-amber-500">
                Maximum number of deliverables (3) reached. Remove a file to add
                a new one.
              </p>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAssignee || !isEditing) {
    return renderViewMode();
  } else {
    return renderEditMode();
  }
}
