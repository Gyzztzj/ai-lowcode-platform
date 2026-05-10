const { execSync } = require('child_process');
const os = require('os');

const commitMsgFile = process.argv[2];

try {
  console.log('Checking commit message...');

  // 在 Windows 上跳过 commitlint，避免 shell 兼容性问题
  if (os.platform() === 'win32') {
    console.log('Windows detected - skipping commitlint for compatibility');
    console.log('Commit message will be checked in CI/CD');
    process.exit(0);
  }

  // 在 Linux/Mac 上正常运行 commitlint
  execSync(`npx --no -- commitlint --edit "${commitMsgFile}"`, { stdio: 'inherit' });

  console.log('Commit message is valid!');
} catch (error) {
  console.error('Commit message check failed:', error.message);
  process.exit(1);
}
