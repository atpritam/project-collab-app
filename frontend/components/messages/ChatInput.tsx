import React, {
  useState,
  useEffect,
  FormEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Info } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  isLoading: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  fallbackMode?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  isLoading,
  inputRef,
  disabled = false,
  fallbackMode = false,
  placeholder = "Type a message...", // Default placeholder text
}) => {
  const [message, setMessage] = useState("");
  const [lastTypingStatus, setLastTypingStatus] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (disabled || fallbackMode) return;

    if (onTyping) {
      const isCurrentlyTyping = value.length > 0;
      if (isCurrentlyTyping !== lastTypingStatus) {
        onTyping(isCurrentlyTyping);
        setLastTypingStatus(isCurrentlyTyping);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (onTyping && lastTypingStatus) {
        onTyping(false);
      }
    };
  }, [onTyping, lastTypingStatus]);

  useEffect(() => {
    if ((disabled || fallbackMode) && onTyping && lastTypingStatus) {
      onTyping(false);
      setLastTypingStatus(false);
    }
  }, [disabled, fallbackMode, onTyping, lastTypingStatus]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {disabled && (
        <div className="flex items-center text-sm text-destructive mb-1">
          <Info className="h-4 w-4 mr-2" />
          <span>Connection error. Messages may not be delivered.</span>
        </div>
      )}
      {fallbackMode && !disabled && (
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          <Info className="h-3 w-3 mr-1" />
          <span>Using basic mode - typing indicators unavailable</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Connection lost..." : placeholder}
          disabled={isLoading || disabled}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading || disabled}
          className="bg-violet-700 hover:bg-violet-800 text-white flex items-center cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
