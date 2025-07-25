# 🎨 Collaborative Whiteboard App - System Design Document

## 📋 Document Overview

This design document provides the technical architecture and implementation details for the Collaborative Whiteboard App. It translates the functional and non-functional requirements into concrete technical solutions and design patterns.

**Version**: 1.0  
**Date**: 2024  
**Status**: Implementation Active

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + TLDraw 3.14.2 + TailwindCSS          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  Plan Management │ │ TLDraw Canvas   │ │   Collaboration │   │
│  │   Components    │ │  Custom Shapes  │ │   Components    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Network Layer                             │
├─────────────────────────────────────────────────────────────────┤
│              Convex Real-time API (WebSocket + HTTP)            │
├─────────────────────────────────────────────────────────────────┤
│                       Backend Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                    Convex Serverless Runtime                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Query/Mutation│ │   Database      │ │   Real-time     │   │
│  │    Functions    │ │   Operations    │ │   Subscriptions │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Storage Layer                              │
├─────────────────────────────────────────────────────────────────┤
│              Convex Database (ACID + Real-time)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack Design Rationale

| Component          | Technology             | Rationale                                                   |
| ------------------ | ---------------------- | ----------------------------------------------------------- |
| **Frontend**       | React 19 + TypeScript  | Latest React features, strong typing, component reusability |
| **Canvas Engine**  | TLDraw 3.14.2          | Production-ready infinite canvas with extensibility         |
| **Backend**        | Convex                 | Serverless, real-time subscriptions, ACID transactions      |
| **UI Framework**   | Radix UI + TailwindCSS | Accessibility-first components, utility-first styling       |
| **Build Tool**     | Vite 6.2.0             | Fast HMR, modern bundling, TypeScript support               |
| **Authentication** | Convex Auth            | Seamless anonymous sessions, future auth extensibility      |

---

## 📊 Database Design

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    users    │────────▶│    plans    │◀────────│   boards    │
│             │  1:N    │             │   1:1   │             │
│ - _id       │         │ - _id       │         │ - _id       │
│ - name      │         │ - title     │         │ - planId    │
│ - email     │         │ - date      │         │ - state     │
└─────────────┘         │ - shareCode │         └─────────────┘
                        │ - createdBy │
                        │ - createdAt │                ┌─────────────┐
                        │ - updatedAt │                │userSessions │
                        └─────────────┘                │             │
                               │                       │ - _id       │
                               │ 1:N                   │ - sessionId │
                               ▼                       │ - userName  │
                        ┌─────────────┐                │ - userColor │
                        │  sections   │                │ - lastActive│
                        │             │                │ - recentPlans│
                        │ - _id       │                └─────────────┘
                        │ - planId    │
                        │ - name      │                ┌─────────────┐
                        │ - emoji     │                │boardPresence│
                        │ - startTime │                │             │
                        │ - endTime   │                │ - _id       │
                        │ - notes     │                │ - planId    │
                        │ - order     │                │ - sessionId │
                        └─────────────┘                │ - userName  │
                               │                       │ - userColor │
                               │ 1:N                   │ - cursor    │
                               ▼                       │ - camera    │
                    ┌─────────────────┐                │ - isEditing │
                    │ sectionActivities│                └─────────────┘
                    │                 │
                    │ - _id           │
                    │ - sectionId     │                ┌─────────────┐
                    │ - activityId    │───────────────▶│ activities  │
                    │ - addedBy       │        N:1     │             │
                    │ - addedAt       │                │ - _id       │
                    └─────────────────┘                │ - name      │
                               │                       │ - type      │
                               │ 1:N                   │ - location  │
                               ▼                       │ - description│
                        ┌─────────────┐                │ - isReusable│
                        │    votes    │                │ - createdBy │
                        │             │                │ - price     │
                        │ - _id       │                │ - neighborhood│
                        │ - sectionActivityId          │ - category  │
                        │ - userId    │                └─────────────┘
                        │ - userName  │
                        │ - userColor │
                        │ - timestamp │
                        └─────────────┘
```

### Database Schema Implementation

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  plans: defineTable({
    title: v.string(),
    date: v.optional(v.string()), // YYYY-MM-DD
    shareCode: v.string(), // 6-character unique code
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_share_code", ["shareCode"])
    .index("by_created_by", ["createdBy"])
    .index("by_updated_at", ["updatedAt"]),

  boards: defineTable({
    planId: v.id("plans"),
    state: v.string(), // JSON serialized TLDraw state
  }).index("by_plan", ["planId"]),

  sections: defineTable({
    planId: v.id("plans"),
    name: v.string(),
    emoji: v.string(),
    startTime: v.string(), // "7:00 PM" format
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    order: v.number(),
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
    // Venue-specific fields
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
    userName: v.string(),
    userColor: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_section_activity", ["sectionActivityId"])
    .index("by_user", ["userId"]),

  boardPresence: defineTable({
    planId: v.id("plans"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    userInitials: v.string(),
    cursor: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),
    camera: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      })
    ),
    selectedShapes: v.array(v.string()),
    isEditing: v.boolean(),
    editingShapeId: v.optional(v.string()),
    isTyping: v.boolean(),
    lastActivity: v.number(),
    joinedAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_and_session", ["planId", "sessionId"])
    .index("by_last_activity", ["lastActivity"]),

  userSessions: defineTable({
    sessionId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    lastActive: v.number(),
    recentPlans: v.array(v.id("plans")),
  }).index("by_session", ["sessionId"]),
});
```

---

## 🎨 Frontend Architecture Design

### Component Hierarchy

```
App
├── Router
│   ├── HomePage
│   │   ├── UserHeader
│   │   ├── PlanCard[]
│   │   ├── CreatePlanModal
│   │   ├── EditPlanModal
│   │   ├── ConfirmationDialog
│   │   └── EmptyState
│   └── PlanPage
│       ├── PlanHeader (inline editing)
│       ├── Whiteboard
│       │   ├── TLDraw
│       │   ├── SectionShapeUtil
│       │   ├── ActivityShapeUtil
│       │   ├── CustomToolbar
│       │   └── PlanBoardPanel
│       │       ├── SectionsTab
│       │       ├── ActivitiesTab
│       │       ├── PresenceTab
│       │       └── SettingsTab
│       ├── CalendarPopup
│       └── ShareModal
└── Global Components
    ├── Toaster
    ├── PresenceComponents
    └── UI Components (shadcn/ui)
```

### Custom TLDraw Integration Design

```typescript
// TLDraw Shape Architecture
interface CustomShapeProps {
  id: TLShapeId;
  type: "section" | "activity";
  props: SectionProps | ActivityProps;
  meta: Record<string, unknown>;
}

// Section Shape Design
class SectionShapeUtil extends BaseBoxShapeUtil<SectionShape> {
  static override type = "section" as const;

  // Shape properties with validation
  static override props: RecordProps<SectionShape> = {
    title: T.string,
    startTime: T.string,
    endTime: T.string,
    emoji: T.string,
    details: T.string,
    color: DefaultColorStyle,
    size: DefaultSizeStyle,
    w: T.number,
    h: T.number,
  };

  // Rendering logic with React components
  override component(shape: SectionShape) {
    return (
      <HTMLContainer>
        <SectionComponent shape={shape} />
      </HTMLContainer>
    );
  }

  // Interaction handlers
  override onDoubleClick = (shape: SectionShape) => {
    this.editor.setEditingShape(shape.id);
  };
}
```

### State Management Design

```typescript
// Convex Query/Mutation Pattern
const useRealtimeData = () => {
  // Real-time queries
  const plans = useQuery(api.plans.getUserPlans, { userId });
  const boardPresence = useQuery(api.presence.getBoardPresence, { planId });

  // Optimistic mutations
  const createPlan = useMutation(api.plans.createPlan);
  const updatePresence = useMutation(api.presence.updatePresence);

  return {
    // Data
    plans,
    boardPresence,
    // Actions
    createPlan: async (data) => {
      // Optimistic update
      setOptimisticState(data);
      try {
        await createPlan(data);
      } catch (error) {
        // Rollback optimistic update
        rollbackOptimisticState();
        throw error;
      }
    },
  };
};
```

---

## 🔄 Real-time Collaboration Design

### Presence System Architecture

```typescript
// Presence Data Flow
┌─────────────┐    WebSocket    ┌─────────────┐    Database    ┌─────────────┐
│   Client    │ ──────────────▶ │   Convex    │ ─────────────▶ │  Database   │
│  (TLDraw)   │                 │  Backend    │                │ (Presence)  │
│             │ ◀────────────── │             │ ◀───────────── │             │
└─────────────┘    Real-time    └─────────────┘   Subscription └─────────────┘
                   Updates
```

### Presence Implementation

```typescript
// User Presence Hook
export const useUserPresence = () => {
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Generate anonymous user session
    const sessionId = nanoid();
    const userColor = generateUserColor();
    const userName = generateUserName();

    setUserPresence({
      sessionId,
      name: userName,
      color: userColor,
      initials: getInitials(userName),
    });

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateActivity = useCallback(() => {
    if (userPresence) {
      // Throttled activity updates
      updatePresence({
        sessionId: userPresence.sessionId,
        lastActivity: Date.now(),
      });
    }
  }, [userPresence]);

  return { userPresence, isOnline, updateActivity };
};
```

### Collaborative TLDraw Integration

```typescript
// TLDraw Store with Real-time Sync
const useCollaborativeStore = (planId: string) => {
  const [store] = useState(() =>
    createTLStore({
      shapeUtils: [...defaultShapeUtils, SectionShapeUtil, ActivityShapeUtil],
    })
  );

  const updateBoard = useMutation(api.boards.updateBoard);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced save to prevent excessive API calls
  const saveState = useCallback(async () => {
    if (!store) return;

    try {
      const snapshot = getSnapshot(store);
      const stateString = JSON.stringify(snapshot);
      await updateBoard({ planId, state: stateString });
    } catch (error) {
      console.error("Failed to save board state:", error);
    }
  }, [store, updateBoard, planId]);

  // Listen to store changes
  useEffect(() => {
    if (!store) return;

    const handleChange = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(saveState, 1000); // 1 second debounce
      setSaveTimeout(timeout);
    };

    const unsubscribe = store.listen(handleChange, {
      source: "user",
      scope: "document",
    });

    return () => {
      unsubscribe();
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [store, saveState, saveTimeout]);

  return store;
};
```

---

## 🛡️ Security Design

### Authentication & Authorization

```typescript
// Anonymous Session Security
interface SessionSecurity {
  sessionId: string; // Cryptographically secure random ID
  shareCode: string; // 6-character alphanumeric code
  permissions: {
    canView: boolean; // Always true for valid share codes
    canEdit: boolean; // True for collaborators
    canManage: boolean; // True only for plan owners
  };
}

// Permission Checking Middleware
const withPermissions = (requiredPermission: Permission) => {
  return async (ctx: ActionCtx, args: any) => {
    const { planId, userId, sessionId } = args;

    // Get plan and check ownership
    const plan = await ctx.db.get(planId);
    if (!plan) throw new Error("Plan not found");

    // Owner has all permissions
    if (userId && plan.createdBy === userId) {
      return { canView: true, canEdit: true, canManage: true };
    }

    // Anonymous users with valid share code can view/edit
    if (plan.shareCode) {
      return { canView: true, canEdit: true, canManage: false };
    }

    throw new Error("Insufficient permissions");
  };
};
```

### Data Validation

```typescript
// Input Validation Schema
const PlanValidation = {
  title: z.string().min(1).max(100),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  shareCode: z
    .string()
    .length(6)
    .regex(/^[A-Z0-9]{6}$/),
};

const SectionValidation = {
  name: z.string().min(1).max(50),
  emoji: z.string().regex(/^[\p{Emoji}]{1,2}$/u),
  startTime: z.string().regex(/^\d{1,2}:\d{2} (AM|PM)$/),
  endTime: z
    .string()
    .regex(/^\d{1,2}:\d{2} (AM|PM)$/)
    .optional(),
  notes: z.string().max(500).optional(),
};

// XSS Prevention
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};
```

---

## ⚡ Performance Design

### Frontend Performance Optimizations

```typescript
// React Performance Patterns
const PlanCard = React.memo(({ plan, onEdit, onDelete }: PlanCardProps) => {
  // Memoized expensive calculations
  const formattedDate = useMemo(() => formatPlanDate(plan.date), [plan.date]);
  const lastUpdated = useMemo(() => formatTimestamp(plan.updatedAt), [plan.updatedAt]);

  // Stable callback references
  const handleEdit = useCallback(() => onEdit(plan), [onEdit, plan]);
  const handleDelete = useCallback(() => onDelete(plan), [onDelete, plan]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.title}</CardTitle>
        <CardMeta>{formattedDate}</CardMeta>
      </CardHeader>
      <CardActions>
        <Button onClick={handleEdit}>Edit</Button>
        <Button onClick={handleDelete}>Delete</Button>
      </CardActions>
    </Card>
  );
});

// Virtualization for large lists
const PlanList = ({ plans }: { plans: Plan[] }) => {
  return (
    <VirtualizedList
      items={plans}
      itemHeight={120}
      renderItem={({ item, index }) => (
        <PlanCard key={item._id} plan={item} />
      )}
    />
  );
};
```

### TLDraw Performance Optimizations

```typescript
// Shape Rendering Optimization
class OptimizedSectionShapeUtil extends SectionShapeUtil {
  // Use React.memo for shape components
  override component = React.memo((shape: SectionShape) => {
    return (
      <HTMLContainer>
        <OptimizedSectionComponent shape={shape} />
      </HTMLContainer>
    );
  });

  // Efficient geometry calculation
  override getGeometry(shape: SectionShape): Geometry2d {
    const { w, h } = shape.props;
    // Cache geometry calculations
    return this.geometryCache.get(`${w}-${h}`) ||
           this.geometryCache.set(`${w}-${h}`, new Rectangle2d({ width: w, height: h }));
  }
}

// Store optimization with selective subscriptions
const useOptimizedStore = (planId: string) => {
  const store = useMemo(() =>
    createTLStore({
      shapeUtils: [...defaultShapeUtils, OptimizedSectionShapeUtil, OptimizedActivityShapeUtil],
    }), []);

  // Only subscribe to shape changes, not camera movements
  const shapes = useValue('shapes', () =>
    store.allRecords().filter(record => record.typeName === 'shape'), [store]);

  return { store, shapes };
};
```

### Database Query Optimization

```typescript
// Efficient Query Patterns
export const getPlanWithSections = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    // Single query for plan
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    // Batch query for sections with index
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    // Parallel queries for activities
    const sectionsWithActivities = await Promise.all(
      sections.map(async (section) => {
        const [activities, votes] = await Promise.all([
          ctx.db
            .query("sectionActivities")
            .withIndex("by_section", (q) => q.eq("sectionId", section._id))
            .collect(),
          ctx.db
            .query("votes")
            .withIndex("by_section", (q) => q.eq("sectionId", section._id))
            .collect(),
        ]);

        return { ...section, activities, votes };
      })
    );

    return { ...plan, sections: sectionsWithActivities };
  },
});
```

---

## 📱 Responsive Design System

### Breakpoint Strategy

```typescript
// Tailwind Breakpoint Configuration
const breakpoints = {
  'mobile': '375px',   // iPhone SE
  'sm': '640px',       // Small tablets
  'md': '768px',       // Tablets
  'lg': '1024px',      // Small desktops
  'xl': '1280px',      // Large desktops
  '2xl': '1536px',     // Extra large screens
};

// Component Responsive Design
const PlanBoard = () => {
  return (
    <div className="
      grid grid-cols-1 gap-4 p-4
      sm:grid-cols-2 sm:gap-6 sm:p-6
      lg:grid-cols-3 lg:gap-8 lg:p-8
      xl:grid-cols-4
    ">
      {plans.map(plan => <PlanCard key={plan._id} plan={plan} />)}
    </div>
  );
};
```

### Touch Interaction Design

```typescript
// Touch-optimized TLDraw Integration
const TouchOptimizedWhiteboard = ({ planId }: { planId: string }) => {
  const store = useCollaborativeStore(planId);

  return (
    <Tldraw
      store={store}
      // Touch-friendly configuration
      options={{
        // Larger touch targets
        touchTargetSize: 44,
        // Optimized for mobile performance
        maxShapes: 1000,
        // Gesture handling
        enablePinchZoom: true,
        enableTouchPan: true,
      }}
      // Mobile-specific overrides
      overrides={{
        // Larger toolbar buttons on mobile
        toolbar: isMobile ? MobileToolbar : DesktopToolbar,
        // Touch-friendly shape handles
        handles: TouchHandles,
      }}
    />
  );
};
```

---

## 🧪 Testing Architecture

### Testing Strategy

```typescript
// Unit Testing - Utility Functions
describe("timeUtils", () => {
  test("parseTime converts time strings to minutes", () => {
    expect(parseTime("7:00 PM")).toBe(19 * 60);
    expect(parseTime("12:30 AM")).toBe(30);
    expect(parseTime("12:00 PM")).toBe(12 * 60);
  });

  test("getSortedSections sorts by start time", () => {
    const sections = [
      { startTime: "9:00 PM", name: "Dinner" },
      { startTime: "7:00 PM", name: "Drinks" },
      { startTime: "10:00 PM", name: "Dancing" },
    ];

    const sorted = getSortedSections(sections);
    expect(sorted.map((s) => s.name)).toEqual(["Drinks", "Dinner", "Dancing"]);
  });
});

// Integration Testing - Convex Functions
describe("Plans API", () => {
  test("createPlan generates unique share code", async () => {
    const result1 = await createPlan({ title: "Plan 1", userId: "user1" });
    const result2 = await createPlan({ title: "Plan 2", userId: "user1" });

    expect(result1.shareCode).not.toBe(result2.shareCode);
    expect(result1.shareCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  test("updatePlan enforces ownership", async () => {
    const plan = await createPlan({ title: "My Plan", userId: "user1" });

    // Owner can update
    await expect(
      updatePlan({
        planId: plan.planId,
        title: "Updated Plan",
        userId: "user1",
      })
    ).resolves.toBeDefined();

    // Non-owner cannot update
    await expect(
      updatePlan({
        planId: plan.planId,
        title: "Hacked Plan",
        userId: "user2",
      })
    ).rejects.toThrow("Not authorized");
  });
});

// E2E Testing - User Flows
describe("Plan Creation Flow", () => {
  test("user can create and share a plan", async () => {
    const { page } = await setupE2ETest();

    // Navigate to homepage
    await page.goto("/");

    // Create new plan
    await page.click('[data-testid="create-plan-button"]');
    await page.fill('[data-testid="plan-title"]', "Weekend Trip");
    await page.click('[data-testid="submit-plan"]');

    // Verify navigation to plan page
    await expect(page).toHaveURL(/\/plan\/[A-Z0-9]{6}/);

    // Verify plan title is displayed
    await expect(page.locator('[data-testid="plan-title"]')).toHaveText(
      "Weekend Trip"
    );

    // Test sharing
    await page.click('[data-testid="share-button"]');
    const shareUrl = await page
      .locator('[data-testid="share-url"]')
      .inputValue();
    expect(shareUrl).toMatch(/\/plan\/[A-Z0-9]{6}$/);
  });
});
```

### Performance Testing

```typescript
// Load Testing Configuration
const loadTestConfig = {
  scenarios: {
    // Concurrent plan creation
    plan_creation: {
      executor: "constant-vus",
      vus: 50,
      duration: "5m",
    },

    // Real-time collaboration
    collaboration: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "2m", target: 20 }, // Ramp up
        { duration: "5m", target: 20 }, // Stay at 20 users
        { duration: "2m", target: 0 }, // Ramp down
      ],
    },
  },

  thresholds: {
    // Performance requirements
    http_req_duration: ["p(95)<500"], // 95% under 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% failures
    ws_connecting: ["p(95)<100"], // WebSocket connection under 100ms
  },
};
```

---

## 🚀 Deployment & DevOps Design

### Build & Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:e2e

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx convex deploy --prod
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}

  deploy-frontend:
    needs: [test, deploy-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v24
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Environment Configuration

```typescript
// Environment Variables
interface AppConfig {
  // Convex
  CONVEX_URL: string;
  CONVEX_SITE_URL: string;

  // Authentication
  AUTH_SECRET: string;

  // Analytics (optional)
  ANALYTICS_ID?: string;

  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_DEBUG_MODE: boolean;
  MAX_CONCURRENT_USERS: number;
}

// Configuration Management
export const config: AppConfig = {
  CONVEX_URL: process.env.VITE_CONVEX_URL!,
  CONVEX_SITE_URL: process.env.VITE_CONVEX_SITE_URL!,
  AUTH_SECRET: process.env.AUTH_SECRET!,
  ANALYTICS_ID: process.env.VITE_ANALYTICS_ID,
  ENABLE_ANALYTICS: process.env.NODE_ENV === "production",
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === "development",
  MAX_CONCURRENT_USERS: parseInt(process.env.MAX_CONCURRENT_USERS || "50"),
};
```

---

## 📈 Monitoring & Analytics Design

### Application Monitoring

```typescript
// Error Tracking
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send to monitoring service
    analytics.track("Application Error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userId: getCurrentUserId(),
      planId: getCurrentPlanId(),
    });
  }
}

// Performance Monitoring
const usePerformanceTracking = () => {
  useEffect(() => {
    // Track page load performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "navigation") {
          analytics.track("Page Load Performance", {
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded:
              entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstContentfulPaint: entry.firstContentfulPaint,
          });
        }
      }
    });

    observer.observe({ entryTypes: ["navigation", "paint"] });

    return () => observer.disconnect();
  }, []);
};

// User Behavior Analytics
const trackUserActions = {
  planCreated: (planId: string, planTitle: string) => {
    analytics.track("Plan Created", { planId, planTitle });
  },

  sectionAdded: (sectionId: string, planId: string) => {
    analytics.track("Section Added", { sectionId, planId });
  },

  collaborationStarted: (planId: string, userCount: number) => {
    analytics.track("Collaboration Started", { planId, userCount });
  },

  whiteboardInteraction: (action: string, shapeType?: string) => {
    analytics.track("Whiteboard Interaction", { action, shapeType });
  },
};
```

---

## 🔮 Future Architecture Considerations

### Scalability Roadmap

```typescript
// Phase 1: Current Architecture (0-1K users)
// - Single Convex deployment
// - Client-side optimizations
// - Basic monitoring

// Phase 2: Horizontal Scaling (1K-10K users)
interface ScalingStrategy {
  database: {
    // Implement database sharding by plan regions
    sharding: "by_plan_region";
    // Add read replicas for query performance
    readReplicas: number;
    // Implement caching layer
    cache: "redis" | "memcached";
  };

  frontend: {
    // Implement CDN for static assets
    cdn: "cloudflare" | "aws-cloudfront";
    // Add service worker for offline support
    serviceWorker: boolean;
    // Implement micro-frontends for modularity
    architecture: "micro-frontends";
  };

  realtime: {
    // Dedicated WebSocket servers
    websocketServers: number;
    // Message queuing for reliability
    messageQueue: "rabbitmq" | "kafka";
  };
}

// Phase 3: Global Scale (10K+ users)
interface GlobalScaling {
  // Multi-region deployment
  regions: ["us-east", "us-west", "eu-west", "asia-pacific"];

  // Advanced features
  features: {
    // AI-powered features
    aiSuggestions: boolean;
    // Advanced analytics
    realTimeAnalytics: boolean;
    // Enterprise features
    ssoIntegration: boolean;
    advancedPermissions: boolean;
  };
}
```

### Technology Evolution Path

```typescript
// Progressive Enhancement Strategy
const technologyRoadmap = {
  // Short-term (3-6 months)
  immediate: {
    // Enhanced mobile experience
    mobileApp: "PWA", // Later: React Native

    // Advanced collaboration
    voiceChat: "WebRTC",
    videoChat: "WebRTC",

    // Better persistence
    offlineSupport: "IndexedDB + Service Worker",
  },

  // Medium-term (6-12 months)
  medium: {
    // AI Integration
    aiFeatures: {
      smartSuggestions: "OpenAI GPT-4",
      autoLayout: "Custom ML Model",
      contentGeneration: "OpenAI API",
    },

    // Advanced real-time
    crdtImplementation: "Y.js",
    conflictResolution: "Operational Transforms",
  },

  // Long-term (1+ years)
  longTerm: {
    // Platform expansion
    nativeApps: ["iOS", "Android", "Desktop"],

    // Enterprise features
    enterpriseIntegration: {
      sso: ["SAML", "OAuth", "LDAP"],
      auditLogs: "Comprehensive logging",
      dataGovernance: "GDPR/CCPA compliance",
    },
  },
};
```

---

## 📋 Design Decisions Summary

### Key Architectural Decisions

| Decision                 | Rationale                                  | Trade-offs                           |
| ------------------------ | ------------------------------------------ | ------------------------------------ |
| **TLDraw 3.14.2**        | Production-ready canvas with extensibility | Learning curve, dependency           |
| **Convex Backend**       | Real-time capabilities, serverless scaling | Vendor lock-in, specific patterns    |
| **Anonymous-first Auth** | Low friction onboarding                    | Limited personalization              |
| **React 19**             | Latest features, concurrent rendering      | Bleeding edge, potential instability |
| **TypeScript Strict**    | Type safety, developer experience          | Initial setup complexity             |
| **Tailwind + Radix**     | Accessibility + utility-first styling      | Learning curve, bundle size          |

### Performance Decisions

| Optimization           | Implementation        | Impact                       |
| ---------------------- | --------------------- | ---------------------------- |
| **React.memo**         | Component memoization | Reduced re-renders           |
| **Debounced saves**    | 1-second delay        | Reduced API calls            |
| **Virtual scrolling**  | Large plan lists      | Better perceived performance |
| **Shape caching**      | TLDraw geometry cache | Faster rendering             |
| **Optimistic updates** | Immediate UI feedback | Better UX                    |

---

This design document provides the technical foundation for implementing the Collaborative Whiteboard App. It translates requirements into concrete architectural patterns, design decisions, and implementation strategies that ensure scalability, maintainability, and performance.

**Next Steps**:

1. Review and validate design decisions with stakeholders
2. Create detailed implementation tickets based on this design
3. Set up development environment following architecture guidelines
4. Begin implementation following the component hierarchy and data flow patterns outlined
