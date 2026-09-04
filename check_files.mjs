import fs from 'fs';
console.log("Root files containing 'clothes':");
const files = fs.readdirSync('.');
files.filter(f => f.includes('clothes')).forEach(f => console.log(f));

if (fs.existsSync('clothes')) {
  console.log("\nContents of 'clothes' dir:");
  console.log(fs.readdirSync('clothes'));
}
