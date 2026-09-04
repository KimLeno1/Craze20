import fs from 'fs';

const rootFiles = fs.readdirSync('/');
const backslashRoot = rootFiles.filter(f => f.includes('\\'));

console.log('Total files/directories in system-level root / with backslash:', backslashRoot.length);
if (backslashRoot.length > 0) {
  console.log('System-level backslash files/directories:');
  backslashRoot.forEach(f => console.log(f));
}

// Let's also check if there is a directory named "clothes" directly in `/` system root.
console.log('Is there /clothes in system-level root?', fs.existsSync('/clothes'));
if (fs.existsSync('/clothes')) {
  try {
    console.log('/clothes contents:', fs.readdirSync('/clothes'));
  } catch (e) {
    console.log('/clothes read failed:', e.message);
  }
}
