import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Constants for consistent timing
const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CLEANUP_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Get all active users on a board
export const getBoardPresence = query({
  args: { planId: v.id("plans") },
  returns: v.array(v.object({
    _id: v.id("boardPresence"),
    _creationTime: v.number(),
    planId: v.id("plans"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    userInitials: v.string(),
    cursor: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    camera: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    })),
    selectedShapes: v.array(v.string()),
    isEditing: v.boolean(),
    editingShapeId: v.optional(v.string()),
    isTyping: v.boolean(),
    lastActivity: v.number(),
    joinedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVITY_TIMEOUT;
    
    // Get all presence records for this plan that are still active
    const allPresence = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.gt(q.field("lastActivity"), cutoffTime))
      .collect();
    
    // Deduplicate by sessionId (shouldn't be necessary, but just in case)
    const uniquePresence = new Map();
    for (const presence of allPresence) {
      const existing = uniquePresence.get(presence.sessionId);
      if (!existing || presence.lastActivity > existing.lastActivity) {
        uniquePresence.set(presence.sessionId, presence);
      }
    }
    
    return Array.from(uniquePresence.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  },
});

// Join a board - create or update presence
export const joinBoard = mutation({
  args: {
    planId: v.id("plans"),
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    userInitials: v.string(),
    userId: v.optional(v.id("users")),
  },
  returns: v.id("boardPresence"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // First, clean up any existing presence for this session to prevent duplicates
    const existingPresence = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan_and_session", (q) => 
        q.eq("planId", args.planId).eq("sessionId", args.sessionId)
      )
      .collect(); // Use collect() to get all potential duplicates
    
    // Remove all existing presence records for this session
    for (const presence of existingPresence) {
      await ctx.db.delete(presence._id);
    }
    
    // Also clean up old inactive sessions for the same user (by userName) to prevent accumulation
    if (args.userName) {
      const oldSessions = await ctx.db
        .query("boardPresence")
        .withIndex("by_plan", (q) => q.eq("planId", args.planId))
        .filter((q) => 
          q.and(
            q.eq(q.field("userName"), args.userName),
            q.lt(q.field("lastActivity"), now - CLEANUP_TIMEOUT)
          )
        )
        .collect();
      
      for (const oldSession of oldSessions) {
        await ctx.db.delete(oldSession._id);
      }
    }
    
    // Create fresh presence record
    return await ctx.db.insert("boardPresence", {
      planId: args.planId,
      userId: args.userId,
      sessionId: args.sessionId,
      userName: args.userName,
      userColor: args.userColor,
      userInitials: args.userInitials,
      cursor: undefined,
      camera: undefined,
      selectedShapes: [],
      isEditing: false,
      editingShapeId: undefined,
      isTyping: false,
      lastActivity: now,
      joinedAt: now,
    });
  },
});

// Update user presence data (cursor, camera, selections, etc.)
export const updatePresence = mutation({
  args: {
    planId: v.id("plans"),
    sessionId: v.string(),
    cursor: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    camera: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    })),
    selectedShapes: v.optional(v.array(v.string())),
    isEditing: v.optional(v.boolean()),
    editingShapeId: v.optional(v.string()),
    isTyping: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan_and_session", (q) => 
        q.eq("planId", args.planId).eq("sessionId", args.sessionId)
      )
      .unique();
    
    if (!presence) {
      // Don't throw error, just ignore - session might have been cleaned up
      return null;
    }
    
    const updates: any = {
      lastActivity: Date.now(),
    };
    
    if (args.cursor !== undefined) updates.cursor = args.cursor;
    if (args.camera !== undefined) updates.camera = args.camera;
    if (args.selectedShapes !== undefined) updates.selectedShapes = args.selectedShapes;
    if (args.isEditing !== undefined) updates.isEditing = args.isEditing;
    if (args.editingShapeId !== undefined) updates.editingShapeId = args.editingShapeId;
    if (args.isTyping !== undefined) updates.isTyping = args.isTyping;
    
    await ctx.db.patch(presence._id, updates);
    return null;
  },
});

// Heartbeat to keep session alive
export const heartbeat = mutation({
  args: {
    planId: v.id("plans"),
    sessionId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan_and_session", (q) => 
        q.eq("planId", args.planId).eq("sessionId", args.sessionId)
      )
      .unique();
    
    if (!presence) {
      return false; // Session not found
    }
    
    await ctx.db.patch(presence._id, {
      lastActivity: Date.now(),
    });
    
    return true;
  },
});

// Leave a board - remove presence
export const leaveBoard = mutation({
  args: {
    planId: v.id("plans"),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all presence records for this session (in case of duplicates)
    const presenceRecords = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan_and_session", (q) => 
        q.eq("planId", args.planId).eq("sessionId", args.sessionId)
      )
      .collect();
    
    // Delete all matching records
    for (const presence of presenceRecords) {
      await ctx.db.delete(presence._id);
    }
    
    return null;
  },
});

// Cleanup inactive users (called periodically)
export const cleanupInactiveUsers = mutation({
  args: { planId: v.optional(v.id("plans")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoffTime = now - CLEANUP_TIMEOUT;
    
    let inactiveUsers;
    
    if (args.planId) {
      // Clean up users for a specific plan
      const planId = args.planId; // TypeScript type narrowing
      inactiveUsers = await ctx.db
        .query("boardPresence")
        .withIndex("by_plan", (q) => q.eq("planId", planId))
        .filter((q) => q.lt(q.field("lastActivity"), cutoffTime))
        .collect();
    } else {
      // Clean up all inactive users across all plans
      inactiveUsers = await ctx.db
        .query("boardPresence")
        .withIndex("by_last_activity", (q) => q.lt("lastActivity", cutoffTime))
        .collect();
    }
    
    let cleanedCount = 0;
    for (const user of inactiveUsers) {
      await ctx.db.delete(user._id);
      cleanedCount++;
    }
    
    return cleanedCount;
  },
});

// Get user count for a board with consistent timing
export const getBoardUserCount = query({
  args: { planId: v.id("plans") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVITY_TIMEOUT; // Use same timeout as getBoardPresence
    
    const activeUsers = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.gt(q.field("lastActivity"), cutoffTime))
      .collect();
    
    // Deduplicate by sessionId
    const uniqueSessions = new Set(activeUsers.map(user => user.sessionId));
    return uniqueSessions.size;
  },
});

// Get recent board messages for chat
export const getBoardMessages = query({
  args: { 
    planId: v.id("plans"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("boardMessages"),
    _creationTime: v.number(),
    planId: v.id("plans"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    message: v.string(),
    timestamp: v.number(),
    type: v.optional(v.union(
      v.literal("chat"),
      v.literal("system"),
      v.literal("activity")
    )),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("boardMessages")
      .withIndex("by_plan_and_timestamp", (q) => q.eq("planId", args.planId))
      .order("desc")
      .take(limit);
  },
});

// Send a chat message
export const sendMessage = mutation({
  args: {
    planId: v.id("plans"),
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    message: v.string(),
    userId: v.optional(v.id("users")),
    type: v.optional(v.union(
      v.literal("chat"),
      v.literal("system"),
      v.literal("activity")
    )),
  },
  returns: v.id("boardMessages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("boardMessages", {
      planId: args.planId,
      userId: args.userId,
      sessionId: args.sessionId,
      userName: args.userName,
      userColor: args.userColor,
      message: args.message,
      timestamp: Date.now(),
      type: args.type || "chat",
    });
  },
}); 