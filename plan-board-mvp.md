# 📋 Plan Board MVP - Final Blueprint v3.2

## Core Concept
A mobile-first collaborative planning tool where users create and manage multiple plans, with time-based sections that auto-sort chronologically and voting on activity options.

---

## 👥 Permissions

Since we don't have authentication, permissions work as follows:

**Anyone can:**
- View plans via share link
- Add sections
- Add activities
- Vote on options
- Create custom activities

**Only stored locally (per device/browser):**
- Edit plan title/date
- Delete plans
- Edit sections (name, times, notes)
- Delete sections
- Your saved custom activities
- Your recent plans list

This means if you create a plan on your phone, you can only edit/delete it from that same device. Shared users can add to the plan but can't modify the core structure.

---

## 🕐 Time Utilities

```typescript
// timeUtils.ts - For chronological sorting
export function parseTime(timeStr: string): number {
  // Convert "7:00 PM" to minutes since midnight (840)
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

export function formatTimeRange(start: string, end?: string): string {
  if (!end) return `${start} onwards`;
  return `${start} - ${end}`;
}

// Auto-sort sections whenever displayed
export function getSortedSections(sections: Section[]): Section[] {
  return [...sections].sort((a, b) => 
    parseTime(a.startTime) - parseTime(b.startTime)
  );
}

// When editing a section's time, it will automatically re-sort
// Example: Changing "Lunch" from 12:00 PM to 5:00 PM will move it between
// other afternoon sections automatically
```

---

## 🎯 MVP Features (12 Features)

1. **Plan Board Menu** to view and manage all plans
2. **Create a plan** with title and date via modal
3. **Edit plan** title and date after creation
4. **Delete plans** from the menu or plan view
5. **Add time sections** with start/end times (auto-sorted chronologically)
6. **Edit sections** to change name, times, or notes
7. **Delete sections** from the plan
8. **Add notes to sections** for flexible planning
9. **Create custom activities** (e.g., "Book Club at Sarah's")
10. **Add activity options** to sections via search or custom activities
11. **Vote on options** with visual dot indicators
12. **Share via link** for collaborative planning

---

## 📱 User Interface

### Plan Board Menu (Home)
```
┌─────────────────────────┐
│ 🚀 Roam                 │ ← App header
├─────────────────────────┤
│                         │
│ [+ Create New Plan]     │ ← Primary CTA
│                         │
│ Your Plans              │
│ ┌─────────────────────┐ │
│ │ Saturday Night    ⋮ │ │ ← Menu dots
│ │ Jan 20 • 3 sections │ │
│ │ 2 days ago          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Book Club Meeting ⋮ │ │
│ │ Jan 15 • 2 sections │ │
│ │ Last week           │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Plan Card Menu (Long Press or ⋮)
```
┌─────────────────────────┐
│ Saturday Night          │
├─────────────────────────┤
│ ✏️ Edit Details         │
│ 🗑️ Delete Plan         │
│ 🔗 Copy Link           │
└─────────────────────────┘
```

### Individual Plan Board
```
┌─────────────────────────┐
│ ← Saturday Night  ✏️ 🔗 │ ← Edit + Share buttons
├─────────────────────────┤
│ January 20, 2024        │
├─────────────────────────┤
│ ⚠️ Sections auto-sorted │ ← Info banner (first time)
│ by start time           │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🍽️ Dinner    ✏️ 🗑️ │ │ ← Edit + Delete section
│ │ 7:00 PM - 9:00 PM   │ │
│ │ Mare (3) vs Seoul(1)│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🍺 Drinks    ✏️ 🗑️ │ │
│ │ 9:00 PM onwards     │ │
│ │ [+ Add options]     │ │
│ └─────────────────────┘ │
│                         │
│ [+ Add Time Block]      │
└─────────────────────────┘
```

### Edit Plan Modal
```
┌─────────────────────────┐
│ Edit Plan               │
├─────────────────────────┤
│                         │
│ Plan Title              │
│ [Saturday Night Out   ] │
│                         │
│ Date                    │
│ [January 20, 2024   ▼] │
│                         │
│ [Cancel] [Save Changes] │
└─────────────────────────┘
```

### Delete Confirmation
```
┌─────────────────────────┐
│ Delete Plan?            │
├─────────────────────────┤
│ Are you sure you want   │
│ to delete "Saturday     │
│ Night"? This cannot be  │
│ undone.                 │
│                         │
│ [Cancel] [Delete]       │
└─────────────────────────┘
```

### Edit Section Modal
```
┌─────────────────────────┐
│ Edit Section            │
├─────────────────────────┤
│                         │
│ What's happening?       │
│ [Dinner             ▼] │
│                         │
│ Start Time              │
│ [7:00 PM            ▼] │
│                         │
│ End Time (optional)     │
│ [9:00 PM            ▼] │
│ □ Open-ended           │
│                         │
│ Notes (optional)        │
│ [Going somewhere nice ] │
│                         │
│ [Cancel] [Save Changes] │
└─────────────────────────┘
```

### Section Delete Confirmation
```
┌─────────────────────────┐
│ Delete Section?         │
├─────────────────────────┤
│ Delete "Dinner" and all │
│ its options?            │
│                         │
│ [Cancel] [Delete]       │
└─────────────────────────┘
```

### Add Section Modal (Updated)
```
┌─────────────────────────┐
│ Add Time Block          │
├─────────────────────────┤
│                         │
│ What's happening?       │
│ [Dinner             ▼] │
│                         │
│ Start Time              │
│ [7:00 PM            ▼] │
│                         │
│ End Time (optional)     │
│ [9:00 PM            ▼] │
│ □ Open-ended           │
│                         │
│ Notes (optional)        │
│ [Going somewhere nice ] │
│                         │
│ [Cancel] [Add Section]  │
└─────────────────────────┘
```

---

## 🗄️ Data Models

```typescript
// Plan storage and retrieval
interface PlanSummary {
  id: string
  title: string
  date: string
  shareCode: string
  sectionCount: number
  lastModified: number
  createdAt: number
}

// Full plan data
interface Plan {
  id: string
  title: string
  date: string
  shareCode: string
  sections: Section[]
  createdAt: number
  lastModified: number
}

// Updated section with sorting
interface Section {
  id: string
  planId: string
  name: string        
  emoji: string       
  startTime: string   // "7:00 PM" - used for auto-sorting
  endTime?: string    // "9:00 PM" or null for open-ended
  notes?: string      
  options: Option[]
  order: number       // Deprecated - sections auto-sort by startTime
}

// Helper function for chronological sorting
function sortSectionsByTime(sections: Section[]): Section[] {
  return sections.sort((a, b) => {
    const timeA = parseTime(a.startTime); // Convert "7:00 PM" to minutes
    const timeB = parseTime(b.startTime);
    return timeA - timeB;
  });
}

interface Option {
  id: string
  sectionId: string
  activity: Activity  
  votes: Vote[]
}

interface Activity {
  id: string
  type: 'venue' | 'custom'
  name: string
  location?: string   
  
  // For venues
  venueData?: {
    price: string     
    neighborhood: string
    category: string  
  }
  
  // For custom activities
  customData?: {
    description?: string
    isReusable: boolean  
    createdBy: string    
  }
}

interface Vote {
  optionId: string
  userId: string      
  userName: string    
  timestamp: number
}

// User session data
interface UserSession {
  id: string
  name?: string
  recentPlans: string[] // Plan IDs
  savedActivities: SavedActivity[]
}
```

---

## 🔄 Complete User Flows

### Flow 1: First Time User
```
1. Land on Plan Board Menu (empty state)
2. Tap "Create New Plan"
3. Modal appears → Enter title and date
4. Tap "Create Plan"
5. Redirected to empty plan board
6. Begin adding sections
```

### Flow 2: Create Plan from Menu
```
1. Open app → See Plan Board Menu
2. View list of recent plans
3. Tap "Create New Plan"
4. Fill modal:
   - Title: "Saturday Night"
   - Date: "Jan 20"
5. Tap "Create Plan"
6. Navigate to new empty plan
7. Share code auto-generated
```

### Flow 3: Edit Plan Details
```
1. On plan board, tap "✏️" edit icon
2. Edit modal appears with current values
3. Modify title and/or date
4. Tap "Save Changes"
5. Plan updates, stay on plan board
```

### Flow 4: Delete Plan
```
1. From menu: Long press plan card or tap ⋮
2. Select "Delete Plan"
3. Confirmation modal appears
4. Tap "Delete"
5. Plan removed, return to menu
OR
1. From plan view: Access menu → Delete
2. Confirm deletion
3. Navigate back to menu
```

### Flow 5: Delete Section
```
1. In plan board, tap "🗑️" on section
2. Confirmation: "Delete Dinner section?"
3. Tap "Delete"
4. Section removed
5. Remaining sections stay sorted by time
```

### Flow 6: Edit Section
```
1. In plan board, tap "✏️" on section
2. Edit modal appears with current values
3. Can modify:
   - Section name (Dinner → Late Dinner)
   - Start time (7:00 PM → 7:30 PM)
   - End time or make open-ended
   - Notes
4. Tap "Save Changes"
5. Section updates and re-sorts if time changed
6. All activities remain attached
```

### Flow 7: Add Section (Auto-Sort)
```
1. On plan board, tap "+ Add Time Block"
2. Modal appears:
   - What: "Lunch" 
   - Start: "12:00 PM"
   - End: "1:30 PM"
3. Tap "Add Section"
4. Section automatically inserted in chronological order
5. User sees info banner (first time only)
```

---

## 🏗️ Technical Architecture

### Updated Route Structure
```
app/
├── page.tsx                    # Plan Board Menu
├── plan/
│   ├── new/
│   │   └── page.tsx           # Redirects after creation
│   └── [shareCode]/
│       └── page.tsx           # Individual plan view
```

### Component Structure
```
app/
├── components/
│   ├── Menu/
│   │   ├── PlanBoardMenu.tsx  # Main menu container
│   │   ├── PlanCard.tsx       # With menu dots
│   │   ├── PlanCardMenu.tsx   # Edit/Delete options
│   │   ├── CreatePlanButton.tsx
│   │   └── EmptyState.tsx     
│   ├── PlanBoard/
│   │   ├── PlanBoard.tsx      
│   │   ├── PlanHeader.tsx     # Back + title + edit + share
│   │   ├── SectionCard.tsx    # With edit + delete buttons
│   │   ├── SectionExpanded.tsx 
│   │   ├── ActivityCard.tsx   
│   │   ├── VoteDots.tsx       
│   │   └── ShareButton.tsx    
│   ├── modals/
│   │   ├── CreatePlan.tsx     
│   │   ├── EditPlan.tsx       # Edit title/date
│   │   ├── DeleteConfirm.tsx  # Generic delete modal
│   │   ├── AddSection.tsx     
│   │   ├── EditSection.tsx    # Edit section details
│   │   └── AddActivity/
│   │       ├── AddActivity.tsx 
│   │       ├── SearchTab.tsx   
│   │       └── CreateTab.tsx   
│   └── ui/                    
├── lib/
│   ├── supabase.ts
│   ├── store.ts               
│   ├── types.ts
│   ├── planStorage.ts         
│   ├── timeUtils.ts           # Parse and sort times
│   └── mockData.ts            
```

### Navigation Flow
```
PlanBoardMenu
    ↓ Create New Plan
CreatePlanModal
    ↓ Submit
/plan/[shareCode] (new plan)
    ↓ Back arrow
PlanBoardMenu (updated list)
    ↓ Tap existing plan
/plan/[shareCode] (existing plan)
```

---

## 🚀 Development Plan

### Week 1: Foundation + Navigation
```bash
Day 1: Project Setup + Menu
- Initialize Next.js project
- Create Plan Board Menu UI
- Plan card components
- Basic navigation structure

Day 2: Plan Creation Flow
- Create Plan modal
- Route to new plan
- Empty plan state
- Back navigation

Day 3: Section Management
- Add Section modal with times
- Edit Section modal
- Delete section functionality
- Time picker inputs
- Open-ended option
- Section display with times

Day 4: Local Storage + Edit Features
- Save plans to localStorage
- Load recent plans in menu
- Edit plan title/date
- Delete plan functionality
- Auto-save functionality
- Session management

Day 5: Core Interactions
- Expand/collapse sections
- Add/edit notes to sections
- Basic voting mechanism
- Auto-sort sections by time
```

### Week 2: Activities + Polish
```bash
Day 6-7: Activity System
- Venue search (mock data)
- Custom activity creation
- Saved activities
- Add to sections

Day 8: Sharing + Multi-user
- Share code generation
- Load plan by share code
- Anonymous sessions
- Real-time updates

Day 9: Polish + Edge Cases
- Loading states
- Error handling
- Empty states
- Time formatting

Day 10: Testing + Deploy
- Mobile testing (iOS/Android)
- Browser testing
- Performance optimization
- Deploy to Vercel
```

---

## 📝 Storage Strategy

```typescript
// localStorage structure
{
  // User session
  "roam_session": {
    "id": "session_abc123",
    "name": "Guest User"
  },
  
  // Recent plan IDs
  "roam_recent_plans": ["plan_123", "plan_456", "plan_789"],
  
  // Individual plans
  "roam_plan_123": { /* Full plan data */ },
  "roam_plan_456": { /* Full plan data */ },
  
  // Saved activities
  "roam_saved_activities": [
    { /* Custom activity data */ }
  ]
}

// Helper functions
const planStorage = {
  getRecentPlans(): PlanSummary[] {
    // Get up to 10 recent plans
  },
  
  savePlan(plan: Plan): void {
    // Save and update recent list
  },
  
  getPlan(id: string): Plan | null {
    // Retrieve full plan
  }
}
```

---

## ✅ Definition of Done

The MVP is complete when:

1. ✅ User sees menu with recent plans
2. ✅ User can create new plan via modal
3. ✅ User can edit plan title/date after creation
4. ✅ User can delete plans with confirmation
5. ✅ User can navigate between menu and plans
6. ✅ User can add sections with start/end times
7. ✅ Sections automatically sort by start time
8. ✅ User can edit sections (name, times, notes)
9. ✅ User can delete sections with confirmation
10. ✅ Sections can have optional notes
11. ✅ User can create and save custom activities
12. ✅ User can search and add venues
13. ✅ Users can vote on options
14. ✅ Plans persist in localStorage
15. ✅ Anyone with link can access plan
16. ✅ Works on mobile browsers
17. ✅ Real-time updates work

---

## 🚫 NOT in MVP

- ❌ User accounts/login
- ❌ Reorder sections (they auto-sort)
- ❌ Recurring events
- ❌ Comments/chat
- ❌ Push notifications
- ❌ Calendar export
- ❌ Native mobile apps
- ❌ Search/filter in menu
- ❌ Plan templates
- ❌ Undo/redo functionality
- ❌ Bulk operations
- ❌ Activity details/reviews

---

## 🎨 UI States

### Menu States
```typescript
// Empty state (no plans)
<EmptyState>
  <Icon>📋</Icon>
  <Text>No plans yet</Text>
  <CreatePlanButton>Create your first plan</CreatePlanButton>
</EmptyState>

// With plans
<PlanList>
  <PlanCard 
    title="Saturday Night"
    date="Jan 20"
    sections={3}
    lastModified="2 hours ago"
  />
</PlanList>

// Loading state
<LoadingSpinner>Loading your plans...</LoadingSpinner>
```

### Time Display Formats
```typescript
// Section time displays
"7:00 PM - 9:00 PM"     // Fixed duration
"9:00 PM onwards"       // Open-ended
"All day"               // No specific time

// Chronological ordering examples
"9:00 AM - 10:30 AM"    // Morning activity
"12:00 PM - 1:30 PM"    // Lunch
"7:00 PM - 9:00 PM"     // Dinner
"9:00 PM onwards"       // Evening

// Relative dates in menu
"Just now"
"2 hours ago"
"Yesterday"
"Last week"
"Jan 15"                // Older than a week
```

---

## 🏁 Let's Build!

This blueprint now includes a complete menu system for managing multiple plans. Users can create plans, navigate between them, and return to edit later - all without requiring authentication.

**First step**: Set up the Next.js project and create the Plan Board Menu component. Ready to start coding?