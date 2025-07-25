import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    const fiveMinutesAgo = now - 5 * 60 * 1000; // Consider users inactive after 5 minutes
    
    return await ctx.db
      .query("boardPresence")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.gt(q.field("lastActivity"), fiveMinutesAgo))
      .collect();
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
    
    // Check if user already has presence on this board
    const existingPresence = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan_and_session", (q) => 
        q.eq("planId", args.planId).eq("sessionId", args.sessionId)
      )
      .unique();
    
    if (existingPresence) {
      // Update existing presence
      await ctx.db.patch(existingPresence._id, {
        userName: args.userName,
        userColor: args.userColor,
        userInitials: args.userInitials,
        lastActivity: now,
        isEditing: false,
        isTyping: false,
        selectedShapes: [],
      });
      return existingPresence._id;
    } else {
      // Create new presence
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
    }
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
      throw new Error("User presence not found. Please join the board first.");
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

// Leave a board - remove presence
export const leaveBoard = mutation({
  args: {
    planId: v.id("plans"),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan_and_session", (q) => 
        q.eq("planId", args.planId).eq("sessionId", args.sessionId)
      )
      .unique();
    
    if (presence) {
      await ctx.db.delete(presence._id);
    }
    
    return null;
  },
});

// Cleanup inactive users (called periodically)
export const cleanupInactiveUsers = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000; // Remove users inactive for 10 minutes
    
    const inactiveUsers = await ctx.db
      .query("boardPresence")
      .withIndex("by_last_activity", (q) => q.lt("lastActivity", tenMinutesAgo))
      .collect();
    
    let cleanedCount = 0;
    for (const user of inactiveUsers) {
      await ctx.db.delete(user._id);
      cleanedCount++;
    }
    
    return cleanedCount;
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

// Get user count for a board
export const getBoardUserCount = query({
  args: { planId: v.id("plans") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    const activeUsers = await ctx.db
      .query("boardPresence")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.gt(q.field("lastActivity"), fiveMinutesAgo))
      .collect();
    
    return activeUsers.length;
  },
}); 