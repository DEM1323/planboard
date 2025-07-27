import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserPresence } from "./use-user-presence";

/**
 * Hook to get the current board presence data
 */
export function useBoardPresence(planId: any) {
  const { userPresence } = useUserPresence();
  const presence = useQuery(api.presence.getBoardPresence, { planId }) || [];

  // Transform the presence data to the format expected by the UI components
  const transformedPresence = presence.map((p: any) => ({
    sessionId: p.sessionId,
    userName: p.userName,
    userColor: p.userColor,
    userInitials: p.userInitials,
    isEditing: p.isEditing,
    isTyping: p.isTyping,
    lastActivity: p.lastActivity,
    joinedAt: p.joinedAt,
  }));

  // Add the current user to the presence list if they're not already there
  if (userPresence && !transformedPresence.some((p) => p.sessionId === userPresence.sessionId)) {
    transformedPresence.push({
      sessionId: userPresence.sessionId,
      userName: userPresence.name,
      userColor: userPresence.color,
      userInitials: userPresence.initials,
      isEditing: false,
      isTyping: false,
      lastActivity: Date.now(),
      joinedAt: Date.now(),
    });
  }

  return transformedPresence;
}
