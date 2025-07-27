import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up inactive users every 5 minutes
crons.interval(
  "cleanup inactive users",
  { minutes: 5 },
  internal.presence.cleanupInactiveUsers,
  {}
);

export default crons;
