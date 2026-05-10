const { execSync } = require('child_process');
const os = require('os');

try {
  console.log('Running pre-commit checks...');

  // 在 Windows 上跳过 lint，避免 shell 兼容性问题
  if (os.platform() === 'win32') {
    console.log('Windows detected - skipping lint fix for compatibility');
    console.log('Lint checks will be performed in CI/CD');
    process.exit(0);
  }

  // 在 Linux/Mac 上正常运行 lint
  console.log('Running lint for server...');
  execSync('cd server && npm run lint --fix', { stdio: 'inherit' });

  console.log('Running lint for web...');
  execSync('cd ../web && npm run lint --fix', { stdio: 'inherit' });

  console.log('Pre-commit checks passed!');
} catch (error) {
  console.error('Pre-commit checks failed:', error.message);
  process.exit(1);
}
