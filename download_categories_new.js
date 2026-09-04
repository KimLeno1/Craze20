import axios from 'axios';
import fs from 'fs';

const urls = {
  mens_clothing: "https://www.temu.com/gh/mens-clothing-o3-67.html",
  womens_lingerie_lounge: "https://www.temu.com/gh/womens-lingerie-lounge-o3-1107.html",
  womens_shoes: "https://www.temu.com/gh/womens-shoes-o3-95.html",
  womens_curve_clothing: "https://www.temu.com/gh/womens-curve-clothing-o3-589.html",
  womens_clothing: "https://www.temu.com/gh/womens-clothing-o3-28.html"
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
