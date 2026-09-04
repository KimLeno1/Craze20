import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const url = "https://www.temu.com/gh/bags-luggage-o3-731.html";

async function main() {
  try {
    console.log("Fetching: " + url);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log("Status:", response.status);
    const html = response.data;
    fs.writeFileSync('temu_test.html', html);
    console.log("Saved raw HTML to temu_test.html. Total length:", html.length);

    const $ = cheerio.load(html);
    
    // Find script tags containing JSON data
    console.log("\n--- Analyzing script tags ---");
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('window.rawData') || text.includes('rawData') || text.includes('INITIAL_STATE') || text.includes('initialState') || text.includes('__goods') || text.includes('goodsList')) {
        console.log(`Script ${i}: Found potential data. Length:`, text.length);
        console.log(`First 300 chars:`, text.substring(0, 300));
      }
    });

    // Check for standard HTML product card patterns
    console.log("\n--- Checking for potential elements ---");
    const potentialSelectors = [
      '[class*="goods"]', '[class*="product"]', '[class*="item"]', 'a[href*="/goods"]', 'a[href*="/product"]'
    ];
    for (const selector of potentialSelectors) {
      const count = $(selector).length;
      console.log(`Selector "${selector}": found ${count} elements`);
    }

  } catch (error) {
    console.error("Error fetching page:", error.message);
  }
}

main();
