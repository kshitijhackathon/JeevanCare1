import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { setupVite, log } from "./vite.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
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
  log(`Backend server running on port ${port}`);
});

if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
}

export default server;