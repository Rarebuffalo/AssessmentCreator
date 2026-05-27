import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import connectDB from './config/db';
import { initSocket } from './websocket/socket';
import assignmentRoutes from './routes/assignmentRoutes';

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const cleanClientUrl = clientUrl.endsWith('/') ? clientUrl.slice(0, -1) : clientUrl;

app.use(
  cors({
    origin: [cleanClientUrl, `${cleanClientUrl}/`],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/assignments', assignmentRoutes);

// Start worker inline (for development single-process convenience)
// In production you would run the worker separately
import('./workers/generationWorker').catch(console.error);

const PORT = parseInt(process.env.PORT || '5000');
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default server;
