import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { db } from '../server.js';

const router = express.Router();

let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// Reuse logic from geminiService but handled on server (Gemini Free Tier)
router.post('/advice', authenticate, async (req: AuthRequest, res: any) => {
  const { mood, occasion } = req.body;
  const ai = getAI();
  if (!ai) return res.status(503).json({ error: 'AI unavailable' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze user mood '${mood}' and objective '${occasion}'. Provide an elite, provocative styling verdict for 'Closet Kraze'.`,
      config: {
        systemInstruction: "You are a Senior Style Architect. Your tone is confident, modern, and clinical. Focus on silhouette weight and status signaling. Max 50 words.",
      }
    });
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dream', authenticate, async (req: AuthRequest, res: any) => {
  const { description } = req.body;
  const ai = getAI();
  if (!ai) return res.status(503).json({ error: 'AI unavailable' });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `High-fashion editorial blueprint for Closet Kraze. Subject: ${description}. Technical streetwear, luxury avant-garde, cinematic lighting. Response must be an image generation prompt.`,
    });
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MULTIMODAL VISUAL ENGINE: Search products by image
router.post('/visual-search', async (req: express.Request, res: any) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image payload is required' });
  }

  const ai = getAI();
  if (!ai) return res.status(503).json({ error: 'AI unavailable' });

  try {
    // 1. Fetch products catalog details for context
    const products = await db.all('SELECT id, name, category, brand, description, tags FROM products');
    const catalogProducts = products.map(p => {
      let parsedTags = [];
      try {
        parsedTags = p.tags ? JSON.parse(p.tags) : [];
      } catch (e) {
        parsedTags = p.tags ? [p.tags] : [];
      }
      return {
        id: p.id,
        name: p.name,
        category: p.category || '',
        brand: p.brand || '',
        description: p.description || '',
        tags: parsedTags
      };
    });

    // 2. Clear out any meta tags or base64 headers
    let base64Data = image;
    let mimeType = 'image/jpeg';
    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    };

    const textPart = {
      text: `Analyze the user's uploaded snap and align it with the absolute best matching candidate products from our official style database.
Below is our current database catalog of curated apparel and accessories:
${JSON.stringify(catalogProducts, null, 2)}

Instructions:
1. Deconstruct key style properties from the photo (product category, garment/footwear shape, prominent colors, patterns, and style vibe).
2. Rank matching products by visual similarity and visual taxonomy alignment. Return their exact database 'productId' and a confidence rating from 0.0 to 1.0.
3. If structural matches are not exact, prioritize closest style alternatives inside the same category or vibe with balanced/lower confidence scores. Limit matches list to top 4.
4. Output strict JSON keeping to the schema specified.`
    };

    // Use Gemini free tier multimodal gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  confidence: { type: Type.NUMBER, description: "Matching confidence from 0.0 to 1.0" },
                  reasoning: { type: Type.STRING, description: "Short rationale of the match" }
                },
                required: ["productId", "confidence"]
              }
            },
            detectedAttrs: { type: Type.STRING, description: "Curated styling elements, lines or colors observed in user's image" }
          },
          required: ["matches", "detectedAttrs"]
        }
      }
    });

    const rawResultText = (response.text || '{}').trim();
    let resultObj: any = { matches: [], detectedAttrs: "" };
    try {
      const cleanJson = rawResultText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      resultObj = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e, rawResultText);
    }

    const matches = Array.isArray(resultObj.matches) ? resultObj.matches : [];
    const detectedAttrs = typeof resultObj.detectedAttrs === 'string' ? resultObj.detectedAttrs : "";

    // 3. Obtain full matching details so the client has everything necessary to mount/render instantly
    const matchedIds = matches.map((m: any) => m.productId).filter(Boolean);
    let matchedProducts: any[] = [];
    if (matchedIds.length > 0) {
      const placeholders = matchedIds.map(() => '?').join(',');
      const rows = await db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, matchedIds);
      
      matchedProducts = rows.map((p: any) => {
        try { p.tags = p.tags ? JSON.parse(p.tags) : []; } catch (e) { p.tags = p.tags ? [p.tags] : []; }
        try { p.images = p.images ? JSON.parse(p.images) : []; } catch (e) { p.images = []; }
        try { const d = p.details ? JSON.parse(p.details) : []; p.details = Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch (e) { p.details = []; }
        try { p.sizes = p.sizes ? JSON.parse(p.sizes) : []; } catch (e) { p.sizes = []; }
        try { p.colors = p.colors ? JSON.parse(p.colors) : []; } catch (e) { p.colors = []; }
        try { p.colorVariants = p.colorVariants ? JSON.parse(p.colorVariants) : []; } catch (e) { p.colorVariants = []; }
        try { p.priceRange = p.priceRange ? JSON.parse(p.priceRange) : null; } catch (e) { p.priceRange = null; }
        try { p.customizationFields = p.customizationFields ? JSON.parse(p.customizationFields) : []; } catch (e) { p.customizationFields = []; }
        return p;
      });
      
      // Order matchedProducts identically to Gemini's relevance rank order
      matchedProducts.sort((a, b) => {
        return matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id);
      });
    }

    res.json({
      success: true,
      matches: matches.map((m: any) => {
        const fullProd = matchedProducts.find(p => p.id === m.productId);
        return {
          ...m,
          product: fullProd || null
        };
      }).filter((m: any) => m.product !== null),
      detectedAttrs
    });

  } catch (err: any) {
    console.error("Visual search error details:", err);
    res.status(500).json({ error: err.message || 'Failed to complete visual search analysis' });
  }
});

// ==========================================
// VIRTUAL TRY-ON (VTON) VIA GRADIO / HF
// ==========================================

const MODEL_AVATARS = [
  {
    id: 'avatar_model_1',
    name: 'Streetwear Minimalist',
    label: 'Male / Unisex',
    imageUrl: '/hero/hero_model_freedom_1788236993279.jpg'
  },
  {
    id: 'avatar_model_2',
    name: 'Contemporary Editorial',
    label: 'Female / Unisex',
    imageUrl: '/hero/hero_model_identity_1788237069856.jpg'
  },
  {
    id: 'avatar_model_3',
    name: 'Avant-Garde Silhouette',
    label: 'Editorial',
    imageUrl: '/hero/hero_model_gallery_1788237022752.jpg'
  },
  {
    id: 'avatar_model_4',
    name: 'High-Fashion Tailored',
    label: 'Urban Modern',
    imageUrl: '/hero/hero_model_harder_1788237010924.jpg'
  }
];

// Return preset model avatars for instant 1-click try-on testing
router.get('/tryon/avatars', (req, res) => {
  res.json({
    success: true,
    avatars: MODEL_AVATARS
  });
});

// Perform AI Virtual Try-On using Hugging Face Space Gradio API
router.post('/tryon', async (req: express.Request, res: any) => {
  const {
    personImage,
    garmentImage,
    garmentDescription = 'Luxury archival streetwear garment',
    denoiseSteps = 30,
    seed = 42
  } = req.body;

  if (!personImage || !garmentImage) {
    return res.status(400).json({
      error: 'Both personImage and garmentImage are required for virtual try-on.'
    });
  }

  // IDM-VTON expects denoise steps >= 20 and <= 40
  const steps = Math.min(40, Math.max(20, Number(denoiseSteps) || 30));
  const safeSeed = Math.floor(Math.abs(Number(seed) || 42));

  // Ensure tryon upload directory exists
  const tryonDir = path.resolve('public/uploads/tryon');
  if (!fs.existsSync(tryonDir)) {
    try {
      fs.mkdirSync(tryonDir, { recursive: true });
    } catch {}
  }

  let tempPersonFile: string | null = null;
  let tempGarmentFile: string | null = null;

  try {
    const { Client, handle_file } = await import('@gradio/client');
    const DEFAULT_HF_KEY = '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';
    const hfToken = (process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || DEFAULT_HF_KEY).trim();

    // Connect to yisol/IDM-VTON Gradio space with authenticated token for prioritized GPU queue
    const app = await Client.connect(
      'yisol/IDM-VTON',
      { token: hfToken as `hf_${string}` }
    );

    // 1. Process person image
    let humanInput: any;
    if (typeof personImage === 'string' && personImage.startsWith('data:')) {
      const parts = personImage.split(';base64,');
      const base64Data = parts.length > 1 ? parts[1] : personImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const ext = personImage.includes('png') ? 'png' : 'jpg';
      const tempName = `temp_person_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      tempPersonFile = path.join(tryonDir, tempName);
      fs.writeFileSync(tempPersonFile, Buffer.from(base64Data, 'base64'));
      humanInput = handle_file(tempPersonFile);
    } else if (typeof personImage === 'string' && (personImage.startsWith('/') || personImage.startsWith('./'))) {
      const cleanPath = personImage.replace(/^\.?\//, '');
      const possibleDiskPaths = [
        path.resolve(cleanPath),
        path.resolve('public', cleanPath),
        path.resolve('public', cleanPath.replace(/^hero\//, 'hero/'))
      ];
      const diskPath = possibleDiskPaths.find(p => fs.existsSync(p));
      if (diskPath) {
        humanInput = handle_file(diskPath);
      } else {
        humanInput = handle_file(personImage);
      }
    } else {
      humanInput = handle_file(personImage);
    }

    // 2. Process garment image
    let garmentInput: any;
    if (typeof garmentImage === 'string' && garmentImage.startsWith('data:')) {
      const parts = garmentImage.split(';base64,');
      const base64Data = parts.length > 1 ? parts[1] : garmentImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const ext = garmentImage.includes('png') ? 'png' : 'jpg';
      const tempName = `temp_garm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      tempGarmentFile = path.join(tryonDir, tempName);
      fs.writeFileSync(tempGarmentFile, Buffer.from(base64Data, 'base64'));
      garmentInput = handle_file(tempGarmentFile);
    } else if (typeof garmentImage === 'string' && (garmentImage.startsWith('/') || garmentImage.startsWith('./'))) {
      const cleanPath = garmentImage.replace(/^\.?\//, '');
      const possibleDiskPaths = [
        path.resolve(cleanPath),
        path.resolve('public', cleanPath)
      ];
      const diskPath = possibleDiskPaths.find(p => fs.existsSync(p));
      if (diskPath) {
        garmentInput = handle_file(diskPath);
      } else {
        garmentInput = handle_file(garmentImage);
      }
    } else {
      garmentInput = handle_file(garmentImage);
    }

    // 3. Submit prediction to Gradio /tryon endpoint
    console.log(`[VTON] Submitting try-on request to yisol/IDM-VTON (steps: ${steps}, seed: ${safeSeed})...`);
    const result = await app.predict('/tryon', [
      { background: humanInput, layers: [], composite: null },
      garmentInput,
      String(garmentDescription || 'Clothing piece'),
      true,  // is_checked (auto-masking enabled)
      false, // is_checked_crop
      steps,
      safeSeed
    ]);

    // 4. Cleanup temp uploaded files
    if (tempPersonFile && fs.existsSync(tempPersonFile)) {
      try { fs.unlinkSync(tempPersonFile); } catch {}
    }
    if (tempGarmentFile && fs.existsSync(tempGarmentFile)) {
      try { fs.unlinkSync(tempGarmentFile); } catch {}
    }

    if (!result || !result.data || !result.data[0]) {
      throw new Error('No output image returned from Gradio Space');
    }

    const outputData = result.data[0];
    let outputUrl = '';
    if (typeof outputData === 'string') {
      outputUrl = outputData;
    } else if (outputData && typeof outputData === 'object' && outputData.url) {
      outputUrl = outputData.url;
    } else if (outputData && typeof outputData === 'object' && outputData.path) {
      outputUrl = outputData.path;
    }

    // 5. Cache result locally if URL is accessible
    let localResultUrl = outputUrl;
    if (outputUrl && outputUrl.startsWith('http')) {
      try {
        const fetchRes = await fetch(outputUrl);
        if (fetchRes.ok) {
          const buffer = await fetchRes.arrayBuffer();
          const fileName = `vton_result_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
          const savePath = path.join(tryonDir, fileName);
          fs.writeFileSync(savePath, Buffer.from(buffer));
          localResultUrl = `/uploads/tryon/${fileName}`;
        }
      } catch (cacheErr) {
        console.warn('[VTON] Failed to cache local copy, falling back to remote URL:', cacheErr);
      }
    }

    console.log('[VTON] Try-on generated successfully:', localResultUrl);

    res.json({
      success: true,
      resultUrl: localResultUrl,
      remoteUrl: outputUrl,
      model: 'IDM-VTON (Gradio Free API)',
      denoiseSteps: steps
    });

  } catch (err: any) {
    if (tempPersonFile && fs.existsSync(tempPersonFile)) {
      try { fs.unlinkSync(tempPersonFile); } catch {}
    }
    if (tempGarmentFile && fs.existsSync(tempGarmentFile)) {
      try { fs.unlinkSync(tempGarmentFile); } catch {}
    }

    console.error('[VTON Error]:', err.message || err);

    // Provide friendly diagnostics
    const isQueueError = err.message?.includes('queue') || err.message?.includes('timeout') || err.message?.includes('busy');
    res.status(502).json({
      success: false,
      error: isQueueError
        ? 'The Hugging Face IDM-VTON public server queue is currently busy. Please wait a moment and try again.'
        : (err.message || 'Virtual Try-On generation encountered an error'),
      details: 'You can provide an optional HF_TOKEN in your environment for priority GPU queue access.'
    });
  }
});

export default router;

