import express from "express";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
registerRoutes(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

// Serve frontend application
app.use(express.static(path.join(process.cwd(), 'frontend'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Handle client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
  }
});

export default server;