# System Architecture

The AI Assessment Creator is built as a decoupled client-server application. It offloads long-running AI operations to a background queue to ensure high availability and responsiveness under high generation loads.

## System Topology

```
+------------------+      HTTP API       +--------------------+
|                  | <-----------------> |                    |
|   Next.js App    |                     |   Express Server   |
|     (Client)     |    WebSockets       |    (Web Portal)    |
|                  | <=================> |                    |
+------------------+                     +--------------------+
                                            |            ^
                                            v            |
                                      +-----------+  +-------+
                                      |  BullMQ   |  | Mongo |
                                      |  (Redis)  |  |  DB   |
                                      +-----------+  +-------+
                                            |
                                            v
                                     +-------------+
                                     | Background  |  ===> Gemini API
                                     |   Worker    |  ===> Puppeteer (PDF)
                                     +-------------+
```

## Core Components

1. **Frontend (Next.js 16)**
   - A single-page client built with the App Router.
   - Uses Zustand for client-side state caching (assignments list, current active assignment, loading states).
   - Establishes a direct connection via Socket.io-client to receive background progress payloads.
   - Provides a multi-step assignment configuration form with client-side file parsing metadata checks.

2. **Backend Web Server (Node/Express)**
   - Exposes REST endpoints for CRUD operations on assignments (`/api/assignments`).
   - Receives multi-part file uploads (reference materials) and persists metadata to MongoDB.
   - Immediately publishes generation tasks to Redis-backed queues.
   - Manages connection rooms inside Socket.io mapped to specific assignment identifiers (`assignment-${id}`).

3. **Message Broker / Queue (Redis & BullMQ)**
   - Redis manages task queues.
   - BullMQ orchestrates task states (`active`, `completed`, `failed`).
   - Tasks are retry-protected with exponential backoff configurations (3 attempts, 2-second initial delay).

4. **Background Worker**
   - Runs in a distinct thread or process, subscribing to the `generation` BullMQ queue.
   - Translates database records into structural prompts for the Gemini model.
   - Interacts with Google's Generative AI endpoint using structured JSON Schema outputs.
   - Executes HTML-to-PDF rendering pipelines locally via Puppeteer (Chromium binary wrapper).
   - Emits real-time processing milestones through Socket.io rooms to notify clients.

## High-Level Data Flow

1. **Request Phase**
   - The user inputs configuration metrics (subject, grade, duration, difficulty, question quantities) and optional resource files.
   - The client hits `POST /api/assignments`.
   - The server inserts a new database record with `status: "pending"` and appends a job to the Redis queue.

2. **Worker Processing Phase**
   - The worker picks up the job, changes the database state to `status: "generating"`, and signals this state to Socket.io.
   - A prompt containing formatting parameters and source material metadata is constructed and submitted to Gemini.
   - Gemini returns a structured JSON payload containing the question sections.
   - The worker parses and maps the questions, updates the database record to `status: "completed"`, and stores the final sections.

3. **Client Update Phase**
   - During step 2, Socket.io emits events at key execution gates (progress percentages).
   - The client updates the visual status indicators and loads the parsed assessment list once completed.

4. **Print / Generation Phase**
   - The user requests a PDF print.
   - The client requests `GET /api/assignments/:id/pdf`.
   - The server reads the structured question schema, generates an standard-conforming HTML string, feeds it into a headless Puppeteer context, renders an A4 page layout, and sends the raw buffer down as a stream with PDF attachment headers.
