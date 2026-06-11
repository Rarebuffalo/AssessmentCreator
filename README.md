# AI Assessment Creator

AI Assessment Creator is a full-stack, state-of-the-art AI-powered assessment builder designed for educators. Teachers can create assignments, upload reference documents (PDFs/TXT), generate beautifully structured question papers using Google Gemini AI, track progress via real-time WebSocket updates, and download exam sheets as compiled PDFs.

---

## Tech Stack Overview

### Frontend
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 & Glassmorphism design tokens
- **State Management**: Zustand
- **Real-Time Integration**: Socket.io-client (real-time generation feedback loop)

### Backend
- **Engine**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose (stores metadata, questions, and cached PDF buffers)
- **Job Scheduling**: Redis + BullMQ (handles decoupled generation queues)
- **Sockets**: Socket.io (broadcasts generation milestones)
- **Large Language Model**: Google Gemini AI (`gemini-2.5-flash`)
- **PDF Generation**: Puppeteer (compiles A4 print layouts)

---

## Setup and Installation

### Prerequisites
- **Node.js**: 18+ (tested on v20+)
- **MongoDB**: Running locally at `mongodb://localhost:27017`
- **Redis**: Running locally at `redis://localhost:6379`
- **Gemini API Key**: Obtain a key from the [Google AI Studio](https://aistudio.google.com/)

### 1. Run the Backend API & Queue Worker
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the template environment file:
   ```bash
   cp .env.example .env
   ```
3. Set your environment variables in `.env` (ensure `GEMINI_API_KEY` is specified).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the backend API server in development mode:
   ```bash
   npm run dev
   ```
   *(The server will listen on `http://localhost:5000`)*
6. In a new terminal tab, start the background queue processor worker:
   ```bash
   cd backend
   ```
   ```bash
   npm run worker
   ```

### 2. Run the Frontend Next.js Client
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Copy or create `.env.local`:
   ```bash
   # Set API and WebSocket urls:
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   *(The app will be available at `http://localhost:3000`)*

---

## Gemini API Rate Limits & Constraints

When using the free tier of the Gemini API (e.g. `gemini-2.5-flash`), developers must navigate strict API limits:

### Key Rate Limits
- **Requests Per Minute (RPM)**: 15 Requests/min
- **Tokens Per Minute (TPM)**: 1,000,000 Tokens/min (For Pro/Flash free tier, sometimes dynamically throttled under heavy load)
- **Requests Per Day (RPD)**: 1,500 Requests/day

### Reference Document (PDF/TXT) Upload Constraints
Our file content extraction feature extracts raw text from uploaded reference documents and injects it directly into the prompt context for the LLM. 
* **The Token Cost:** A single dense page of text is roughly **1,500 to 3,000 tokens**. 
* **Free Tier Bottleneck:** If you upload a large PDF (e.g., >30–50 pages), a single generation call can consume over **100,000 - 150,000 tokens** for prompt injection, context windows, and output schemas. When multiple users run requests simultaneously or a single user performs consecutive regenerations, you can trigger a `429 Too Many Requests` or `503 Service Unavailable` error due to the Tokens Per Minute (TPM) limit.
* **Best Practices:**
  1. **Upload Size Constraint:** Keep uploaded PDFs/TXT files under **5MB** and limit the text length to under **15 pages** (~40,000 tokens) to ensure fast processing and prevent token rate limit failures.
  2. **Retry Mechanism:** Our backend uses a **BullMQ job scheduler** that runs generation decoupled in the background. If a `429` rate limit occurs, the queue automatically schedules a retry with exponential backoff, shielding the frontend client from immediate failure.
  3. **Regeneration Delay:** When clicking "Regenerate," allow a brief delay (~5-10 seconds) for rate-limit quotas to refresh on free-tier keys.

---

## Deployment Guide (Vercel vs. Separate Hosting)

### Can I deploy the entire app to Vercel at once?
**No, you cannot deploy the entire project to Vercel.** 

While the **Next.js frontend** is built for Vercel, the backend has persistent service requirements that serverless runtimes do not support:
1. **Persistent Websockets (Socket.io):** Serverless functions on Vercel spin up and down dynamically, making it impossible to hold open stateful TCP connections for Socket.io real-time updates.
2. **Background Workers (BullMQ):** BullMQ requires a persistent, long-running Node process (worker) that listens for new jobs in Redis. Vercel functions cannot run persistent background tasks.
3. **Puppeteer (Chromium):** Running Puppeteer inside serverless functions requires specialized packages (like `@sparticuz/chromium`) and is limited by Vercel's execution time limits (10s on Hobby, 60s on Pro), which can easily time out during heavy Chromium rendering.

---

### Recommended Deployment Architecture

To deploy VedaAI successfully, deploy the frontend and backend separately using the following topology:

```
┌──────────────────┐
│  Vercel/Netlify  │  ◄─── Next.js Frontend (Static & SSR)
└────────┬─────────┘
         │
         │ (HTTP / WebSockets)
         ▼
┌──────────────────┐       ┌──────────────────┐
│  Railway/Render  │ ◄───► │  Railway/Render  │
│  (API Service)   │       │ (Worker Service) │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         └───────────┬──────────────┘
                     ▼
       ┌─────────────┴─────────────┐
       │   Managed Cloud Services  │
       │   - MongoDB Atlas         │
       │   - Upstash Redis         │
       └───────────────────────────┘
```

#### 1. Databases (SaaS Providers)
* **Database (MongoDB):** Deploy a free-tier cluster on **MongoDB Atlas** and get a connection string.
* **Queue Cache (Redis):** Deploy a free-tier managed Redis database on **Upstash Redis** or **Redis Labs**. Upstash is ideal because it is built for serverless/decoupled queues.

#### 2. Backend API & Worker (Railway / Render / Fly.io)
Deploy the backend on a container-based host like **Railway** or **Render**:
1. Connect your Github repository.
2. Deploy the backend folder twice as two separate services:
   - **Service A (Express API Server):** Set the start command to `npm run build && npm run start` (listening on a public URL).
   - **Service B (Queue Worker):** Set the start command to `npm run build && npm run worker`. Disable public routing (this runs as a background worker).
3. Set the environment variables in both services:
   - `PORT`, `MONGO_URI`, `REDIS_HOST`, `REDIS_PORT`, `GEMINI_API_KEY`, `CLIENT_URL` (the Vercel frontend URL).

#### 3. Frontend Next.js Client (Vercel)
Deploy your frontend folder directly to **Vercel**:
1. Connect your GitHub repository and point to the `frontend/` directory as the root.
2. Set the environment variables:
   - `NEXT_PUBLIC_API_URL`: The public URL of the Railway/Render API server (e.g., `https://api.yourdomain.com/api`).
   - `NEXT_PUBLIC_SOCKET_URL`: The base URL of your API server (e.g., `https://api.yourdomain.com`).
