import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { nanoid } from "nanoid";

function generateShareCode(): string {
  // Generate 6-character code with letters and numbers
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Time utilities for chronological sorting
function parseTime(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  }
  if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
}

// Existing plan functions
export const getUserPlans = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
      .order("desc")
      .collect();
  },
});

export const getPlanByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_share_code", (q) => q.eq("shareCode", args.shareCode))
      .unique();
  },
});

export const getPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId);
  },
});

// New: Get plan with all sections and activities
export const getPlanWithSections = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    const sections = await ctx.db
      .query("sections")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    // Sort sections by start time
    const sortedSections = sections.sort((a, b) => 
      parseTime(a.startTime) - parseTime(b.startTime)
    );

    // Get activities for each section
    const sectionsWithActivities = await Promise.all(
      sortedSections.map(async (section) => {
        const sectionActivities = await ctx.db
          .query("sectionActivities")
          .withIndex("by_section", (q) => q.eq("sectionId", section._id))
          .collect();

        const activitiesWithVotes = await Promise.all(
          sectionActivities.map(async (sa) => {
            const activity = await ctx.db.get(sa.activityId);
            const votes = await ctx.db
              .query("votes")
              .withIndex("by_section_activity", (q) => q.eq("sectionActivityId", sa._id))
              .collect();

            return {
              ...sa,
              activity,
              votes,
              voteCount: votes.length,
            };
          })
        );

        return {
          ...section,
          activities: activitiesWithVotes,
        };
      })
    );

    return {
      ...plan,
      sections: sectionsWithActivities,
    };
  },
});

export const createPlan = mutation({
  args: { 
    title: v.string(),
    date: v.optional(v.string()), // ISO date string (YYYY-MM-DD)
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate unique share code
    let shareCode: string;
    let attempts = 0;
    do {
      shareCode = generateShareCode();
      const existing = await ctx.db
        .query("plans")
        .withIndex("by_share_code", (q) => q.eq("shareCode", shareCode))
        .unique();
      
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new Error("Failed to generate unique share code");
    }
    
    const planId = await ctx.db.insert("plans", {
      title: args.title,
      date: args.date,
      shareCode,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create initial empty board state
    const initialBoardState = {
      schema: {
        schemaVersion: 2,
        sequences: {
          com: 5,
        },
      },
      records: {},
    };
    
    await ctx.db.insert("boards", {
      planId,
      state: JSON.stringify(initialBoardState),
    });
    
    return { planId, shareCode };
  },
});

export const updatePlan = mutation({
  args: {
    planId: v.id("plans"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    if (plan.createdBy !== userId) {
      throw new Error("Not authorized to edit this plan");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    if (args.date !== undefined) {
      updates.date = args.date;
    }

    await ctx.db.patch(args.planId, updates);
    
    return { success: true };
  },
});

export const deletePlan = mutation({
  args: {
    planId: v.id("plans"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    if (plan.createdBy !== userId) {
      throw new Error("Not authorized to delete this plan");
    }

    // Delete associated data
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    // Delete section activities and votes
    for (const section of sections) {
      const sectionActivities = await ctx.db
        .query("sectionActivities")
        .withIndex("by_section", (q) => q.eq("sectionId", section._id))
        .collect();

      for (const sa of sectionActivities) {
        // Delete votes for this section activity
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_section_activity", (q) => q.eq("sectionActivityId", sa._id))
          .collect();

        for (const vote of votes) {
          await ctx.db.delete(vote._id);
        }

        await ctx.db.delete(sa._id);
      }

      await ctx.db.delete(section._id);
    }

    // Delete the associated board
    const board = await ctx.db
      .query("boards")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .unique();
    
    if (board) {
      await ctx.db.delete(board._id);
    }

    // Delete the plan
    await ctx.db.delete(args.planId);
    
    return { success: true };
  },
});

// New: Section management
export const addSection = mutation({
  args: {
    planId: v.id("plans"),
    name: v.string(),
    emoji: v.string(),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get the highest order number for this plan
    const existingSections = await ctx.db
      .query("sections")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const maxOrder = existingSections.length > 0 
      ? Math.max(...existingSections.map(s => s.order))
      : 0;

    const sectionId = await ctx.db.insert("sections", {
      planId: args.planId,
      name: args.name,
      emoji: args.emoji,
      startTime: args.startTime,
      endTime: args.endTime,
      notes: args.notes,
      order: maxOrder + 1,
    });

    // Update plan's updatedAt timestamp
    await ctx.db.patch(args.planId, { updatedAt: now });

    return { sectionId };
  },
});

export const updateSection = mutation({
  args: {
    sectionId: v.id("sections"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.emoji !== undefined) updates.emoji = args.emoji;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.sectionId, updates);

    // Update plan's updatedAt timestamp
    await ctx.db.patch(section.planId, { updatedAt: Date.now() });

    return { success: true };
  },
});

export const deleteSection = mutation({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Delete section activities and votes
    const sectionActivities = await ctx.db
      .query("sectionActivities")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();

    for (const sa of sectionActivities) {
      // Delete votes for this section activity
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_section_activity", (q) => q.eq("sectionActivityId", sa._id))
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }

      await ctx.db.delete(sa._id);
    }

    await ctx.db.delete(args.sectionId);

    // Update plan's updatedAt timestamp
    await ctx.db.patch(section.planId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// New: Activity management
export const createActivity = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("venue"), v.literal("custom")),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    isReusable: v.boolean(),
    userId: v.optional(v.id("users")),
    // For venues
    price: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      name: args.name,
      type: args.type,
      location: args.location,
      description: args.description,
      isReusable: args.isReusable,
      createdBy: args.userId,
      price: args.price,
      neighborhood: args.neighborhood,
      category: args.category,
    });

    return { activityId };
  },
});

export const addActivityToSection = mutation({
  args: {
    sectionId: v.id("sections"),
    activityId: v.id("activities"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const sectionActivityId = await ctx.db.insert("sectionActivities", {
      sectionId: args.sectionId,
      activityId: args.activityId,
      addedBy: args.userId,
      addedAt: Date.now(),
    });

    // Update plan's updatedAt timestamp
    const section = await ctx.db.get(args.sectionId);
    if (section) {
      await ctx.db.patch(section.planId, { updatedAt: Date.now() });
    }

    return { sectionActivityId };
  },
});

export const removeActivityFromSection = mutation({
  args: {
    sectionActivityId: v.id("sectionActivities"),
  },
  handler: async (ctx, args) => {
    const sectionActivity = await ctx.db.get(args.sectionActivityId);
    if (!sectionActivity) {
      throw new Error("Section activity not found");
    }

    // Delete all votes for this activity
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_section_activity", (q) => q.eq("sectionActivityId", args.sectionActivityId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(args.sectionActivityId);

    // Update plan's updatedAt timestamp
    const section = await ctx.db.get(sectionActivity.sectionId);
    if (section) {
      await ctx.db.patch(section.planId, { updatedAt: Date.now() });
    }

    return { success: true };
  },
});

// New: Voting system
export const addVote = mutation({
  args: {
    sectionActivityId: v.id("sectionActivities"),
    userId: v.optional(v.id("users")),
    userName: v.string(),
    userColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already voted for this activity
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_section_activity", (q) => q.eq("sectionActivityId", args.sectionActivityId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingVote) {
      // Remove existing vote (toggle)
      await ctx.db.delete(existingVote._id);
      return { action: "removed" };
    } else {
      // Add new vote
      await ctx.db.insert("votes", {
        sectionActivityId: args.sectionActivityId,
        userId: args.userId,
        userName: args.userName,
        userColor: args.userColor,
        timestamp: Date.now(),
      });
      return { action: "added" };
    }
  },
});

// New: User session management for anonymous collaboration
export const createUserSession = mutation({
  args: {
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("userSessions", {
      sessionId: args.sessionId,
      userName: args.userName,
      userColor: args.userColor,
      lastActive: Date.now(),
      recentPlans: [],
    });

    return { success: true };
  },
});

export const updateUserSession = mutation({
  args: {
    sessionId: v.string(),
    userName: v.optional(v.string()),
    userColor: v.optional(v.string()),
    planId: v.optional(v.id("plans")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session) {
      throw new Error("Session not found");
    }

    const updates: any = {
      lastActive: Date.now(),
    };

    if (args.userName !== undefined) updates.userName = args.userName;
    if (args.userColor !== undefined) updates.userColor = args.userColor;

    if (args.planId !== undefined) {
      // Add plan to recent plans if not already there
      const recentPlans = session.recentPlans.filter(id => id !== args.planId);
      recentPlans.unshift(args.planId);
      // Keep only the 10 most recent plans
      updates.recentPlans = recentPlans.slice(0, 10);
    }

    await ctx.db.patch(session._id, updates);

    return { success: true };
  },
});

export const getUserSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});
