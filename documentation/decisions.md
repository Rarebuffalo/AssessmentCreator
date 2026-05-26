# Engineering Decisions and System Logic

This document details the architectural decisions, trade-offs, and logical workflows implemented across this project.

## Background Queues vs. Inline API Processing

### The Problem
AI text generation typically takes 10 to 40 seconds depending on the model's token length and network conditions. If generation occurred directly inside the `POST /api/assignments` request thread:
1. HTTP gateways or browsers would timeout (typically at 30 seconds).
2. The Node.js single-threaded event loop would spend excessive CPU capacity parsing large JSON strings, degrading throughput.
3. If the server crashed or restarted, the generation task would be lost.

### The Solution: Redis + BullMQ
We decouple API request acceptance from execution using BullMQ:
- The HTTP handler validates request shapes, saves a record with status `pending`, pushes a reference job containing `assignmentId` into Redis, and returns immediately with a `201` status code.
- A decoupled worker thread pulls jobs sequentially, executing AI prompt generation and DB writes.
- If the worker crashes, the job is persisted in Redis and retried using an exponential backoff policy (3 attempts, starting at 2 seconds delay).

---

## PDF Generation: Puppeteer vs. Native Canvas Libraries

### The Problem
Building structural documents like examination sheets with standard canvas libraries (e.g. PDFKit, jsPDF) requires manual pixel coordinate math (`doc.text(text, x, y)`). It makes implementing responsive text, double-column margins, and dynamic height computations extremely tedious and fragile.

### The Solution: Headless Chromium (Puppeteer)
We format the paper using standard HTML/CSS, then load it inside a headless browser:
- Allows using standard print styling specs (`page-break-after: always`).
- Emulates high-quality printer engine outputs matching CSS definitions.
- Keeps markup flexible: changing the layout style is as simple as updating a CSS sheet.
- Headless arguments are configured with `--no-sandbox` to run correctly inside sandboxed Linux server contexts.

---

## WebSocket Strategy: Dynamic Socket Rooms

### The Problem
Broadcasting progress messages globally to all active socket connections would generate massive network overhead and risk data leaks across different classrooms.

### The Solution: Mapped Rooms
When a client begins generation or navigates to the view details screen, it registers its connection to a localized socket room using the custom hook:
- Client emits `join-assignment` with target `assignmentId`.
- Server subscribes the client socket to a room named `assignment-${assignmentId}`.
- When progress updates are generated inside the background worker thread, they are routed specifically via `io.to('assignment-ID').emit()`.
- Data is isolated; clients only receive progress updates for the paper they are actively looking at.

---

## Structured AI Output Handling

### The Problem
Large Language Models (LLMs) can occasionally prepend conversation fillers (e.g., "Here is your JSON:") or include markdown backticks (` ```json `), which break standard `JSON.parse()`.

### The Solution
We apply a multi-step parsing wrapper in `aiService.ts`:
1. Use `gemini-2.5-flash` with configuration `responseMimeType: "application/json"` to ensure the raw response defaults to a valid JSON layout.
2. In case of stray formatting characters, the parser uses a regex fallback to extract contents between the first `{` and the last `}`:
   ```typescript
   const jsonMatch = responseText.match(/\{[\s\S]*\}/);
   ```
3. If JSON keys are successfully parsed, the service loops through the schema and normalizes incorrect key classifications (such as mapping incorrect difficulty strings back to `Moderate` by default).

---

## State Management: Zustand

### The Problem
Using React's default `useContext` triggers component re-renders across the entire provider tree whenever status properties update, causing visible lag in form interactions.

### The Solution: Zustand
Zustand is chosen for state synchronization:
- Uses a pub-sub model that only triggers updates on components that select specific state properties.
- Minimal boilerplate: does not require wrapping layout components in nested React Providers.
- State is easily updated from callback handlers outside the React render context (e.g., inside client socket listeners).
