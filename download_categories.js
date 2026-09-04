import axios from 'axios';
import fs from 'fs';
import path from 'path';

const urls = {
  bags_luggage: "https://www.temu.com/gh/bags-luggage-o3-731.html",
  jewelry_accessories: "https://www.temu.com/gh/jewelry-accessories-o3-352.html",
  mens_big_tall: "https://www.temu.com/gh/mens-big-tall-o3-1232.html",
  mens_shoes: "https://www.temu.com/gh/mens-shoes-o3-1536.html",
  mens_clothing: "https://www.temu.com/gh/mens-clothing-o3-67.html"
};

async function downloadPage(name, url) {
  try {
    console.log(`Fetching ${name}: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const filePath = `data_temu_${name}.html`;
    fs.writeFileSync(filePath, response.data);
    console.log(`Saved ${name} HTML to ${filePath} (${response.data.length} bytes)`);
  } catch (error) {
    console.error(`Error downloading ${name}: ${error.message}`);
  }
}

async function main() {
  for (const [name, url] of Object.entries(urls)) {
    await downloadPage(name, url);
    // Be nice to prevent rate limit
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

main();
