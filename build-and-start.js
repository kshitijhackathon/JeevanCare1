import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildFrontend() {
  console.log('📦 Building frontend...');
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: join(__dirname, 'frontend')
    });
    console.log('✅ Frontend build completed');
    if (stderr) console.log('Build warnings:', stderr);
  } catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    throw error;
  }
}

async function startApplication() {
  try {
    // Build frontend first
    await buildFrontend();
    
    console.log('🚀 Starting healthcare application with separated frontend/backend...');
    
    // Start the server which now serves both API and frontend
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
    });

    console.log('🏥 Healthcare application running on http://localhost:5000');
    console.log('Backend API: http://localhost:5000/api');
    console.log('Frontend: http://localhost:5000');
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down application...');
  process.exit(0);
});

startApplication();