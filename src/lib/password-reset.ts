import { randomBytes } from "crypto";
import { appUrl } from "./presenters";

export const RESET_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export function newResetToken() {
  return randomBytes(32).toString("hex");
}

export function resetUrl(token: string) {
  return `${appUrl()}/reset-password/${token}`;
}
