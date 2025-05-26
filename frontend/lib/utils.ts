import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
