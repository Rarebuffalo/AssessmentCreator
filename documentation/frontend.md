# Frontend Implementation Details

The frontend client is built with Next.js 16 (App Router) and TypeScript.

## Folder Architecture

```
frontend/src/
├── app/
│   ├── assignments/
│   │   ├── [id]/
│   │   │   └── page.tsx      # Assessment detail, question sheet & printing
│   │   ├── new/
│   │   │   └── page.tsx      # Multi-step creator wizard (form flow)
│   │   └── page.tsx          # Dashboard displaying generated sheets
│   ├── globals.css           # Styling entries and tailwind configurations
│   ├── layout.tsx            # Global HTML template frame
│   └── page.tsx              # Simple redirect to dashboard
├── components/
│   ├── assignments/
│   │   ├── AssignmentCard.tsx # Info card and action drop-down triggers
│   │   └── EmptyState.tsx     # Illustration placeholder if lists are empty
│   ├── layout/
│   │   ├── AppLayout.tsx      # Sidebar/header layout wrapper
│   │   ├── Header.tsx         # User identity and profile indicators
│   │   └── Sidebar.tsx        # Persistent menu and creation CTA trigger
│   └── ui/
│       └── GenerationModal.tsx # Progress overlay for real-time creation
├── hooks/
│   └── useSocket.ts          # Custom socket connection hook
├── lib/
│   └── api.ts                # HTTP request classes wrapper
├── store/
│   └── assignmentStore.ts    # Zustand global state configurations
└── types/
    └── index.ts              # Global type interfaces
```

---

## State Management (`src/store/assignmentStore.ts`)

The client manages runtime data using Zustand. This prevents prop-drilling across deep layout wrappers (Sidebar -> Header -> Content Panels).

### Store Properties
- `assignments`: Cached array of generated assessments.
- `currentAssignment`: The single active assessment details being viewed.
- `isLoading`: Global loading toggle.
- `error`: Active connection or network errors.

### Helper Mutations
- `setAssignments(list)`: Seed initial dashboard view.
- `addAssignment(item)`: Prepend new pending records to cache.
- `removeAssignment(id)`: Evict records instantly from user dashboard on deletion.
- `updateAssignmentStatus(id, status)`: Updates state real-time (e.g. from `pending` -> `generating` -> `completed` / `failed`) based on socket feedback loop.

---

## Real-Time WebSocket Hook (`src/hooks/useSocket.ts`)

WebSockets are implemented with the `socket.io-client` module. The hook maintains a singleton client connection across components.

```typescript
let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}
```

### Hook Logic
- Exposes options to register callbacks: `onProgress`, `onCompleted`, and `onFailed`.
- On mount, if `assignmentId` is provided, emits `join-assignment` to enter the corresponding room on the backend.
- Hooks automatically clean up events on unmount:
  ```typescript
  return () => {
    if (onProgress) sock.off("job:progress", onProgress);
    if (onCompleted) sock.off("job:completed", onCompleted);
    if (onFailed) sock.off("job:failed", onFailed);
  };
  ```

---

## Core Interfaces & Pages

### 1. Dashboard Page (`src/app/assignments/page.tsx`)
- Queries database on render.
- Renders an status filtering bar (All, Completed, Pending, Failed).
- Uses standard cards detailing subject, total marks, time allowed, and status badges.
- Displays an options menu triggering delete requests.

### 2. Multi-Step Creator Form (`src/app/assignments/new/page.tsx`)
A two-stage configuration form:
- **Step 1 (General Information):** Fields for Subject, Grade, Target School Name, time constraints, and Difficulty metrics.
- **Step 2 (Configuration & File Attachments):** Question layout configurations (Dynamic sections with customized mark metrics and quantities). File upload area accepting PDF/Images up to 10MB.
- Submitting the form fires `createAssignment` payload API requests, triggers `GenerationModal` state to open, and activates WebSocket room listeners.

### 3. Generation Modal (`src/components/ui/GenerationModal.tsx`)
- Listens to active progress signals.
- Maps steps sequentially:
  - **Queueing / Start:** "Queued for generation"
  - **AI Generation:** "AI is generating your question paper..." (progress bar moves to 50%)
  - **Formatting:** "Formatting question paper..." (progress bar moves to 80%)
  - **Completion:** Displays dynamic "View Result" buttons.
  - **Failure:** Shows exact error messages passed down from server thread.

### 4. Details and Print View (`src/app/assignments/[id]/page.tsx`)
- Renders a paper preview using standard educational layouts (similar to print sheets).
- Displays color-coded labels matching questions' difficulty levels:
  - **Easy:** Green
  - **Moderate:** Orange/Amber
  - **Challenging:** Red
- Features print actions that navigate directly to `/api/assignments/[id]/pdf` file streams.
