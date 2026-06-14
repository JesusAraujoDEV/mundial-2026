const fs = require('fs');
const { execSync } = require('child_process');

// Limpiar dist
fs.rmSync('dist', { recursive: true, force: true });

// Build
execSync('npx nest build', { stdio: 'inherit' });

// Run
require('../dist/main');
