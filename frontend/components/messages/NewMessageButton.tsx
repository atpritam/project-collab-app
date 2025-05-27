import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface NewMessageButtonProps {
  onSelectUser: (user: User) => void;
}

const NewMessageButton: React.FC<NewMessageButtonProps> = ({
  onSelectUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch users that match the search query
      const response = await fetch(
        `/api/collaborators?search=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.collaborators || []);
      } else {
        console.error("Failed to search users");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full bg-violet-700 hover:bg-violet-800 text-white flex items-center cursor-pointer"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a user..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center">
              {searchQuery.length > 1 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing to search for users
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleSelectUser(user)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.image || ""}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.name || "Unnamed User"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageButton;
