import fs from 'fs';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');
console.log("HTML length:", html.length);
console.log("=== First 2000 characters ===");
console.log(html.substring(0, 2000));

console.log("\n=== Last 2000 characters ===");
console.log(html.substring(html.length - 2000));
