#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to run a command in a specific directory
function runService(name, command, args, cwd) {
  console.log(`Starting ${name}...`);
  
  const child = spawn(command, args, {
    cwd: join(__dirname, cwd),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  child.on('error', (error) => {
    console.error(`${name} error:`, error);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.log(`${name} exited with code ${code}`);
    }
  });

  return child;
}

console.log('🏥 Starting Healthcare Application with Frontend/Backend Separation\n');

// Start backend server
const backend = runService('Backend API', 'npm', ['run', 'dev'], 'backend');

// Give backend time to start, then start frontend
setTimeout(() => {
  const frontend = runService('Frontend App', 'npm', ['run', 'dev'], 'frontend');
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n💫 Shutting down services...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n💫 Shutting down services...');
  process.exit(0);
});