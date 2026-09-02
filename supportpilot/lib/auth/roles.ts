import type { UserRole } from "@/lib/types";

export function canManageKnowledge(role: UserRole) {
  return role === "admin";
}

export function canInviteMembers(role: UserRole) {
  return role === "admin";
}

export function canManageMailbox(role: UserRole) {
  return role === "admin";
}

export function canEditWorkspace(role: UserRole) {
  return role === "admin" || role === "manager";
}

export function canViewAnalytics(role: UserRole) {
  return role === "admin" || role === "manager";
}

export function canAssignTickets(role: UserRole) {
  return role === "admin" || role === "manager" || role === "agent";
}

export function canManageBilling(role: UserRole) {
  return role === "admin";
}
