# 📋 Collaborative Whiteboard App - System Requirements

## 🎯 Project Overview

A real-time collaborative planning application that seamlessly integrates TLDraw whiteboard functionality with structured plan board features. Users can create plans, organize them with time-based sections, add activities, vote on options, and collaborate visually on an infinite canvas.

---

## 🏗️ Technical Architecture

### Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6.2.0
- **Backend**: Convex (serverless)
- **Whiteboard Engine**: TLDraw 3.14.2
- **Authentication**: Convex Auth (anonymous sessions)
- **UI Framework**: Radix UI + TailwindCSS
- **Icons**: Lucide React
- **Routing**: React Router v7
- **State Management**: Convex real-time queries/mutations
- **Styling**: TailwindCSS with shadcn/ui components

### Database Schema

```typescript
// Core plan management
plans: {
  _id: Id<"plans">
  title: string
  date?: string (YYYY-MM-DD format)
  shareCode: string (6-character unique code)
  createdBy?: Id<"users">
  createdAt?: number
  updatedAt: number
}

// TLDraw whiteboard state storage
boards: {
  _id: Id<"boards">
  planId: Id<"plans">
  state: string (JSON serialized TLDraw state)
}

// Time-based plan sections
sections: {
  _id: Id<"sections">
  planId: Id<"plans">
  name: string
  emoji: string
  startTime: string ("7:00 PM" format)
  endTime?: string
  notes?: string
  order: number
}

// Reusable activities
activities: {
  _id: Id<"activities">
  name: string
  type: "venue" | "custom"
  location?: string
  description?: string
  isReusable: boolean
  createdBy?: Id<"users">
  // Venue-specific fields
  price?: string
  neighborhood?: string
  category?: string
}

// Junction table linking sections to activities
sectionActivities: {
  _id: Id<"sectionActivities">
  sectionId: Id<"sections">
  activityId: Id<"activities">
  addedBy?: Id<"users">
  addedAt: number
}

// Voting system for activities
votes: {
  _id: Id<"votes">
  sectionActivityId: Id<"sectionActivities">
  userId?: Id<"users">
  userName: string
  userColor?: string
  timestamp: number
}

// Real-time collaboration presence
boardPresence: {
  _id: Id<"boardPresence">
  planId: Id<"plans">
  userId?: Id<"users">
  sessionId: string
  userName: string
  userColor: string
  userInitials: string
  cursor?: { x: number, y: number }
  camera?: { x: number, y: number, z: number }
  selectedShapes: string[]
  isEditing: boolean
  editingShapeId?: string
  isTyping: boolean
  lastActivity: number
  joinedAt: number
}

// Anonymous user sessions
userSessions: {
  _id: Id<"userSessions">
  sessionId: string
  userName: string
  userColor: string
  lastActive: number
  recentPlans: Id<"plans">[]
}
```

---

## 🎨 User Interface Requirements

### Navigation Structure

```
/ (HomePage)
├── Plan list management
├── Create new plan
├── Edit/delete plans (owner only)
└── Plan sharing

/plan/[shareCode] (PlanPage)
├── Plan header with title/date editing
├── TLDraw whiteboard with custom shapes
├── Plan board panel (floating)
├── Real-time collaboration features
└── Share functionality
```

### Core UI Components

1. **Plan Management Interface**

   - Grid layout of plan cards
   - Create plan modal with title and date picker
   - Edit plan modal for title/date updates
   - Delete confirmation dialogs
   - Share modal with link copying

2. **TLDraw Whiteboard Integration**

   - Custom Section shapes with time-based properties
   - Custom Activity shapes with voting functionality
   - Custom tools (Section: S key, Activity: A key)
   - Native TLDraw toolbar with custom tools
   - Keyboard shortcuts (Ctrl/Cmd + Shift + S/A)

3. **Plan Board Panel**

   - Floating panel in top-right corner
   - Tabbed interface: Sections, Activities, Users, Settings
   - Quick actions for adding/editing shapes
   - Real-time user presence display
   - Keyboard shortcuts reference

4. **Real-time Collaboration UI**
   - Active users list with avatars
   - User cursors and activity indicators
   - Typing indicators
   - Presence badges and counts

---

## 🔧 Functional Requirements

### 1. Plan Management

#### Plan Creation

- **FR-1.1**: Users can create plans with title and optional date
- **FR-1.2**: System generates unique 6-character share codes
- **FR-1.3**: Plans are immediately accessible via share code
- **FR-1.4**: Empty TLDraw board state is initialized for new plans

#### Plan Editing

- **FR-1.5**: Plan owners can edit title and date inline
- **FR-1.6**: Title editing with click-to-edit interaction
- **FR-1.7**: Date editing with calendar popup
- **FR-1.8**: Changes are saved automatically with optimistic updates

#### Plan Deletion

- **FR-1.9**: Only plan owners can delete plans
- **FR-1.10**: Deletion removes all associated data (sections, activities, votes, board state)
- **FR-1.11**: Confirmation dialog prevents accidental deletion

#### Plan Sharing

- **FR-1.12**: Anyone with share code can access plan
- **FR-1.13**: Share links are copyable with one-click
- **FR-1.14**: Shared users can collaborate but not modify plan metadata

### 2. TLDraw Whiteboard Integration

#### Custom Shapes

- **FR-2.1**: Section shapes display time ranges, emojis, and details
- **FR-2.2**: Activity shapes show title, description, venue, and vote counts
- **FR-2.3**: Shapes are fully interactive (drag, resize, edit)
- **FR-2.4**: Double-click to edit shape properties
- **FR-2.5**: Visual styling matches plan board theme

#### Custom Tools

- **FR-2.6**: Section tool (S key) creates time-based containers
- **FR-2.7**: Activity tool (A key) creates activity cards
- **FR-2.8**: Tools integrate seamlessly with TLDraw toolbar
- **FR-2.9**: Keyboard shortcuts work consistently

#### State Persistence

- **FR-2.10**: All whiteboard changes auto-save with 1-second debounce
- **FR-2.11**: Board state loads reliably on plan access
- **FR-2.12**: Migration handles schema changes gracefully
- **FR-2.13**: Error recovery for corrupted states

### 3. Section Management

#### Section Creation

- **FR-3.1**: Sections have name, emoji, start time, optional end time, and notes
- **FR-3.2**: Time picker with 30-minute intervals from 12:00 AM to 11:30 PM
- **FR-3.3**: Sections auto-sort chronologically by start time
- **FR-3.4**: Default emoji picker with 30+ options

#### Section Editing

- **FR-3.5**: All section properties are editable
- **FR-3.6**: Time changes trigger automatic re-sorting
- **FR-3.7**: Notes support multi-line text
- **FR-3.8**: Changes reflect in both plan board and whiteboard

#### Section Deletion

- **FR-3.9**: Section deletion removes all associated activities and votes
- **FR-3.10**: Confirmation prevents accidental deletion
- **FR-3.11**: Remaining sections maintain sort order

### 4. Activity Management

#### Activity Creation

- **FR-4.1**: Activities can be venue-based or custom
- **FR-4.2**: Venue activities include location, price, category
- **FR-4.3**: Custom activities support description and reusability
- **FR-4.4**: Activities can be added to multiple sections

#### Activity Voting

- **FR-4.5**: One-click voting toggle for each activity
- **FR-4.6**: Vote counts display visually with badges
- **FR-4.7**: Anonymous users can vote with session tracking
- **FR-4.8**: Vote changes update in real-time

#### Activity Management

- **FR-4.9**: Activities can be removed from sections
- **FR-4.10**: Reusable activities persist for future use
- **FR-4.11**: Activity search and selection interface

### 5. Real-time Collaboration

#### User Presence

- **FR-5.1**: Anonymous users get generated names and colors
- **FR-5.2**: User presence shows on plan board panel
- **FR-5.3**: Active user count displays in badges
- **FR-5.4**: Presence data updates every 5 seconds

#### Collaborative Editing

- **FR-5.5**: Multiple users can edit simultaneously
- **FR-5.6**: Cursor positions visible to other users
- **FR-5.7**: Selected shapes shown to collaborators
- **FR-5.8**: Editing state (typing) indicated visually

#### Session Management

- **FR-5.9**: User sessions persist across page reloads
- **FR-5.10**: Inactive users removed after timeout
- **FR-5.11**: Session IDs track anonymous contributions
- **FR-5.12**: User preferences stored locally

---

## 🔒 Non-Functional Requirements

### Performance

- **NFR-1**: Page load time under 2 seconds
- **NFR-2**: Whiteboard operations under 100ms latency
- **NFR-3**: Auto-save debouncing prevents excessive API calls
- **NFR-4**: Optimistic updates for immediate feedback

### Scalability

- **NFR-5**: Support up to 50 concurrent users per plan
- **NFR-6**: Handle plans with 100+ sections and activities
- **NFR-7**: Efficient database queries with proper indexing
- **NFR-8**: Minimal bundle size with tree-shaking

### Reliability

- **NFR-9**: 99.9% uptime with Convex backend
- **NFR-10**: Graceful error handling and recovery
- **NFR-11**: Data consistency across all operations
- **NFR-12**: Backup and restore capabilities

### Security

- **NFR-13**: Anonymous access without data exposure
- **NFR-14**: Share codes are cryptographically secure
- **NFR-15**: XSS and injection attack prevention
- **NFR-16**: HTTPS enforcement for all connections

### Usability

- **NFR-17**: Mobile-responsive design (iOS/Android)
- **NFR-18**: Keyboard accessibility throughout
- **NFR-19**: Screen reader compatibility
- **NFR-20**: Intuitive user interface with minimal learning curve

---

## 🎯 User Stories

### Epic 1: Plan Management

- **US-1.1**: As a user, I want to create a plan with a title and date so that I can organize an event
- **US-1.2**: As a plan owner, I want to edit my plan details so that I can keep information current
- **US-1.3**: As a user, I want to share my plan with others so that we can collaborate
- **US-1.4**: As a plan owner, I want to delete old plans so that I can keep my workspace clean

### Epic 2: Visual Planning

- **US-2.1**: As a user, I want to create sections on the whiteboard so that I can organize activities by time
- **US-2.2**: As a user, I want to add activities to sections so that I can track options
- **US-2.3**: As a collaborator, I want to vote on activities so that we can make group decisions
- **US-2.4**: As a user, I want to see the plan visually so that I can understand the schedule

### Epic 3: Collaboration

- **US-3.1**: As a collaborator, I want to see other users' cursors so that I know where they are working
- **US-3.2**: As a user, I want to see who else is online so that I can coordinate with them
- **US-3.3**: As a collaborator, I want my changes to appear immediately so that we can work together seamlessly
- **US-3.4**: As a user, I want to use keyboard shortcuts so that I can work efficiently

---

## 🚀 Implementation Status

### ✅ Completed Features

- [x] Plan CRUD operations with ownership
- [x] TLDraw integration with custom shapes
- [x] Section and activity management
- [x] Real-time collaboration with presence
- [x] Voting system for activities
- [x] Share functionality with unique codes
- [x] Responsive UI with modern design
- [x] Keyboard shortcuts and accessibility
- [x] Anonymous user sessions
- [x] Auto-save and state persistence

### 🏗️ Architectural Decisions

- **Database**: Convex chosen for real-time capabilities and serverless scaling
- **Whiteboard**: TLDraw provides professional-grade drawing with extensibility
- **Authentication**: Anonymous-first approach reduces friction
- **State Management**: Server-side state with optimistic updates
- **UI Framework**: Radix UI for accessibility with TailwindCSS for styling

### 🔮 Future Enhancements

- [ ] User authentication with persistent accounts
- [ ] Plan templates and recurring events
- [ ] Export functionality (PDF, calendar)
- [ ] Mobile app with native gestures
- [ ] Advanced activity search and filtering
- [ ] Integration with external calendar systems
- [ ] AI-powered activity suggestions
- [ ] Analytics and usage insights

---

## 🎨 Design System

### Color Palette

- Primary: Blue (#3b82f6) for primary actions
- Success: Green (#22c55e) for positive actions
- Warning: Orange (#f97316) for caution
- Danger: Red (#ef4444) for destructive actions
- Neutral: Gray scale for backgrounds and text

### Typography

- Font Family: System fonts (Inter/SF Pro/Segoe UI)
- Headings: Bold weights with proper hierarchy
- Body: Regular weight for readability
- Code: Monospace for technical elements

### Component Standards

- Consistent spacing using TailwindCSS scale
- Rounded corners (8px default, 4px small)
- Shadow system for depth (sm, md, lg, xl)
- Animation: Smooth transitions (150ms-300ms)
- Focus states for keyboard navigation

---

## 📱 Device Support

### Desktop Browsers

- Chrome 100+ (primary target)
- Firefox 100+ (full support)
- Safari 15+ (full support)
- Edge 100+ (full support)

### Mobile Browsers

- iOS Safari 15+ (touch optimized)
- Chrome Mobile 100+ (full support)
- Samsung Internet (basic support)

### Screen Sizes

- Mobile: 375px - 768px (touch-first)
- Tablet: 768px - 1024px (hybrid)
- Desktop: 1024px+ (mouse/keyboard)
- Large Desktop: 1440px+ (optimized layout)

---

## 🔍 Quality Assurance

### Testing Strategy

- Unit tests for utility functions and data transformations
- Integration tests for Convex mutations and queries
- End-to-end tests for critical user flows
- Visual regression testing for UI components
- Performance testing for large plans and concurrent users

### Code Quality

- TypeScript strict mode enforced
- ESLint with React and accessibility rules
- Prettier for consistent formatting
- Husky pre-commit hooks for quality gates
- Code review requirements for all changes

---

## 📊 Success Metrics

### User Experience

- Time to create first plan: < 30 seconds
- Collaboration adoption: > 60% of shared plans have multiple contributors
- User retention: > 40% return within 7 days
- Error rate: < 1% of user actions result in errors

### Technical Performance

- Page load time: < 2 seconds (P95)
- Whiteboard interaction latency: < 100ms (P95)
- API response time: < 500ms (P95)
- Uptime: > 99.9% availability

### Business Goals

- Plan creation growth: 20% month-over-month
- Sharing adoption: > 50% of plans are shared
- Session duration: > 10 minutes average
- User satisfaction: > 4.5/5 rating

---

This comprehensive requirements document serves as the definitive specification for the Collaborative Whiteboard App, capturing both the current implementation and the system's intended capabilities. It provides a foundation for continued development, testing, and enhancement of the platform.
