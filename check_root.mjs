import fs from 'fs';
const files = fs.readdirSync('.');
const clothesFiles = files.filter(f => f.startsWith('\\\\clothes') || f.startsWith('clothes'));
console.log('Files starting with \\\\clothes or clothes:');
clothesFiles.forEach(f => console.log(f));
