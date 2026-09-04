import axios from 'axios';
import * as cheerio from 'cheerio';

const apiKey = '8f314f00625ba5c54ddc3a65965848c5';
const query = "Men's Clothing";
const targetUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&render=true`;

async function main() {
  try {
    console.log("Fetching rendered Temu search result via ScraperAPI...");
    const response = await axios.get(scraperUrl, { timeout: 35000 });
    console.log("Response status:", response.status);
    console.log("HTML length:", response.data.length);
    
    const $ = cheerio.load(response.data);
    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
      if (src.includes('kwcdn') && !images.includes(src)) {
        images.push(src);
      }
    });
    
    console.log(`Found ${images.length} kwcdn images on the rendered page.`);
    console.log("Sample kwcdn images:", images.slice(0, 10));
  } catch (error) {
    console.error("ScraperAPI request failed:", error.message);
  }
}

main();
