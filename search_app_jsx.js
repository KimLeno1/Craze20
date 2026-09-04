import fs from 'fs';

const appContent = fs.readFileSync('App.tsx', 'utf-8');
console.log("App.tsx size:", appContent.length);

const lines = appContent.split('\n');
console.log("App.tsx total lines:", lines.length);

const searchKeywords = ['vault', 'intelligence', 'filter', 'searched', 'overlay', 'searchPanel'];
searchKeywords.forEach(kw => {
  const matchingLines = [];
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(kw.toLowerCase())) {
      matchingLines.push(idx + 1);
    }
  });
  console.log(`Keyword "${kw}" found on ${matchingLines.length} lines:`, matchingLines.slice(0, 15));
});
