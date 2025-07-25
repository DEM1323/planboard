import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  plans: defineTable({
    title: v.string(),
    date: v.optional(v.string()), // ISO date string (YYYY-MM-DD)
    shareCode: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_share_code", ["shareCode"])
    .index("by_created_by", ["createdBy"])
    .index("by_date", ["date"]),
  
  boards: defineTable({
    planId: v.id("plans"),
    state: v.string(),
  }).index("by_plan", ["planId"]),

  // Real-time user presence on boards
  boardPresence: defineTable({
    planId: v.id("plans"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(), // For anonymous users
    userName: v.string(),
    userColor: v.string(),
    userInitials: v.string(),
    // TLDraw presence data
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
    // Additional presence info
    isEditing: v.boolean(),
    editingShapeId: v.optional(v.string()),
    isTyping: v.boolean(),
    lastActivity: v.number(),
    joinedAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_and_session", ["planId", "sessionId"])
    .index("by_last_activity", ["lastActivity"]),

  // Chat messages for real-time collaboration
  boardMessages: defineTable({
    planId: v.id("plans"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    message: v.string(),
    timestamp: v.number(),
    // Optional: message type for system messages
    type: v.optional(v.union(
      v.literal("chat"),
      v.literal("system"),
      v.literal("activity")
    )),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_and_timestamp", ["planId", "timestamp"]),

  // New tables for plan board functionality
  sections: defineTable({
    planId: v.id("plans"),
    name: v.string(),
    emoji: v.string(),
    startTime: v.string(), // "7:00 PM" format for sorting
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    order: v.number(), // For manual ordering if needed
  })
    .index("by_plan", ["planId"])
    .index("by_plan_and_time", ["planId", "startTime"]),

  activities: defineTable({
    name: v.string(),
    type: v.union(v.literal("venue"), v.literal("custom")),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    isReusable: v.boolean(),
    createdBy: v.optional(v.id("users")),
    // For venues
    price: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    category: v.optional(v.string()),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_type", ["type"]),

  sectionActivities: defineTable({
    sectionId: v.id("sections"),
    activityId: v.id("activities"),
    addedBy: v.optional(v.id("users")),
    addedAt: v.number(),
  })
    .index("by_section", ["sectionId"])
    .index("by_activity", ["activityId"]),

  votes: defineTable({
    sectionActivityId: v.id("sectionActivities"),
    userId: v.optional(v.id("users")),
    userName: v.string(), // For anonymous users
    userColor: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_section_activity", ["sectionActivityId"])
    .index("by_user", ["userId"]),

  // User sessions for anonymous collaboration
  userSessions: defineTable({
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    lastActive: v.number(),
    recentPlans: v.array(v.id("plans")),
  })
    .index("by_session", ["sessionId"])
    .index("by_last_active", ["lastActive"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
