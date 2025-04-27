import { FileIcon, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TaskAttachments = ({
  files,
  onRemoveFile,
}: {
  files: { name: string; size: number; url: string; key?: string }[];
  onRemoveFile?: (fileUrl: string, fileKey: string) => void;
}) => {
  if (!files.length) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handlePreview = (url: string) => () => {
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      {files.map((file, idx) => (
        <div key={idx} className="flex">
          <div className="flex items-center p-3 justify-between w-full bg-muted/50 rounded-md">
            <FileIcon className="h-5 w-5 mr-3" />
            <div
              className="flex-1 cursor-pointer"
              onClick={handlePreview(file.url)}
            >
              <span className="text-sm font-medium">{file.name}</span>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            {onRemoveFile ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={() => onRemoveFile(file.url, file.key!)}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-transparent text-muted-foreground"
              >
                <a
                  href={file.url}
                  download={file.name}
                  target="_blank"
                  className="ml-auto self-center"
                >
                  <Download className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskAttachments;
