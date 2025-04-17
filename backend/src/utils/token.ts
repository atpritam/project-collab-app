import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}
