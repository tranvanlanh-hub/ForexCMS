export type AdminRole = "admin" | "editor";

export const adminRoles: AdminRole[] = ["admin", "editor"];

export function normalizeAdminRole(value: string | null | undefined): AdminRole {
  const role = value?.trim().toLowerCase();

  return role === "editor" ? "editor" : "admin";
}

export function canBulkChangeContentStatus(role: AdminRole) {
  return role === "admin" || role === "editor";
}

export {
  getCsrfToken,
  requireAdminMutation,
  requireAdminSession,
  sanitizeAdminReturnTo,
} from "@/lib/admin/session";
