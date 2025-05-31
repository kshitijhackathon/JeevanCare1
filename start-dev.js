import { spawn } from 'child_process';
import path from 'path';

function runCommand(command, args, cwd, name) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error(`${name} error:`, error);
  });

  child.on('exit', (code) => {
    console.log(`${name} exited with code ${code}`);
  });

  return child;
}

console.log('Starting healthcare application...');

// Start backend
const backend = runCommand('npm', ['run', 'dev'], './backend', 'Backend');

// Wait a moment then start frontend
setTimeout(() => {
  const frontend = runCommand('npm', ['run', 'dev'], './frontend', 'Frontend');
}, 2000);

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});