# AI Assessment Creator

A full-stack AI-powered assessment creator that allows teachers to create assignments, generate structured question papers using Gemini AI, and download them as PDFs.

## Tech Stack

### Frontend
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Zustand — state management
- socket.io-client — real-time generation updates

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose — data persistence
- Redis + BullMQ — background job queue
- Socket.io — WebSocket real-time updates
- Google Gemini AI (`gemini-2.5-flash`) — question generation
- Puppeteer — PDF rendering

---

## Architecture

```
Teacher fills form  ->  POST /api/assignments  ->  BullMQ job queued
                                                          |
                    Worker pulls job  ->  Calls Gemini AI  ->  Saves to MongoDB
                                                          |
                    Socket.io emits progress events  ->  Frontend updates in real-time
                                                          |
                    Teacher views question paper  ->  Downloads PDF via Puppeteer
```

---

## Setup and Run

### Prerequisites
- Node.js 18+
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)
- Chromium installed (for PDF generation: `sudo apt install chromium-browser`)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
npm install
npm run dev
```

Backend starts on `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`

---

## Features

### Assignment Creation (2-step form)
- Step 1: Subject, Class, School, Time, Difficulty
- Step 2: File upload (PDF/PNG/JPEG/TXT), Due Date, Question Types with counters
- Real-time validation with error messages

### AI Question Generation
- Converts form inputs into a structured Gemini prompt
- Generates sections (A, B, C...) with questions, difficulty tags, and marks
- Background processing via BullMQ (non-blocking)
- Real-time WebSocket progress modal

### Output and View Page
- Formatted question paper rendered in-browser
- Difficulty-coloured tags: Easy (green), Moderate (amber), Challenging (red)
- Answer key included per section
- Download as PDF via Puppeteer (A4 format)

### Dashboard
- Two-column assignment grid with status badges
- Search and filter by status
- Three-dot menu: View Assignment / Delete
- Empty state with illustration

---

## Project Structure

```
AssessmentCreator/
├── backend/
│   └── src/
│       ├── config/         # MongoDB and Redis connections
│       ├── controllers/    # REST API handlers
│       ├── models/         # Mongoose schemas
│       ├── queues/         # BullMQ queue setup
│       ├── routes/         # Express routes
│       ├── services/       # Gemini AI service
│       ├── websocket/      # Socket.io setup
│       └── workers/        # BullMQ background worker
└── frontend/
    └── src/
        ├── app/            # Next.js App Router pages
        ├── components/     # UI components
        ├── hooks/          # useSocket hook
        ├── lib/            # API utility
        ├── store/          # Zustand store
        └── types/          # TypeScript interfaces
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/assessment-creator
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```
