import { execSync } from 'node:child_process';

const isVercel = !!process.env.VERCEL;

if (isVercel) {
  console.log('Skipping prepare on Vercel environment.');
  process.exit(0);
}

try {
  execSync('npm run type-check', { stdio: 'inherit' });
  execSync('npm run lint', { stdio: 'inherit' });
  execSync('npm run test', { stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}

