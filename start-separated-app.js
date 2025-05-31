#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Healthcare Application (Frontend/Backend Separated)...\n');

// Start backend server
console.log('🔧 Starting Backend API Server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait for backend to initialize, then start frontend
setTimeout(() => {
  console.log('🌐 Starting Frontend Development Server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (error) => {
    console.error('Frontend error:', error);
  });
}, 3000);

backend.on('error', (error) => {
  console.error('Backend error:', error);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down services...');
  process.exit(0);
});