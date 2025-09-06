import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// password check
export const checkPassword = (password: string) => {
  // – at least 8 chars
  // – at least one lowercase
  // – at least one uppercase
  // – at least one digit
  // – at least one special character
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
  return regex.test(password);
};

export const debugLog = (...args: any[]): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args);
  }
};

export const debugError = (...args: any[]): void => {
  if (process.env.NODE_ENV !== "production") {
    console.error(...args);
  }
};

export const getInitials = (name: string | null) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const formatTime = (dateString: string) => {
  return format(new Date(dateString), "h:mm a");
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "No due date";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
