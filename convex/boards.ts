import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBoardByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .unique();
  },
});

export const updateBoard = mutation({
  args: { 
    planId: v.id("plans"),
    state: v.string()
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .unique();
    
    if (board) {
      await ctx.db.patch(board._id, { state: args.state });
    } else {
      await ctx.db.insert("boards", {
        planId: args.planId,
        state: args.state,
      });
    }
    
    // Update plan's updatedAt timestamp
    await ctx.db.patch(args.planId, { updatedAt: Date.now() });
  },
});
