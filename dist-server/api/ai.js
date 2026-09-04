import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { authenticate } from '../middleware/auth.js';
import { db } from '../server.js';
const router = express.Router();
let aiInstance = null;
function getAI() {
    if (!aiInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            return null;
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
}
// Reuse logic from geminiService but handled on server
router.post('/advice', authenticate, async (req, res) => {
    const { mood, occasion } = req.body;
    const ai = getAI();
    if (!ai)
        return res.status(503).json({ error: 'AI unavailable' });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze user mood '${mood}' and objective '${occasion}'. Provide an elite, provocative styling verdict for 'Closet Kraze'.`,
            config: {
                systemInstruction: "You are a Senior Style Architect. Your tone is confident, modern, and clinical. Focus on silhouette weight and status signaling. Max 50 words.",
            }
        });
        res.json({ text: response.text });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/dream', authenticate, async (req, res) => {
    const { description, highFi } = req.body;
    const ai = getAI();
    if (!ai)
        return res.status(503).json({ error: 'AI unavailable' });
    try {
        const model = highFi ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
        const response = await ai.models.generateContent({
            model: model,
            contents: `High-fashion editorial blueprint for Closet Kraze. Subject: ${description}. Technical streetwear, luxury avant-garde, cinematic lighting. Response must be an image generation prompt.`,
        });
        res.json({ text: response.text });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// MULTIMODAL VISUAL ENGINE: Search products by image
router.post('/visual-search', async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'Image payload is required' });
    }
    const ai = getAI();
    if (!ai)
        return res.status(503).json({ error: 'AI unavailable' });
    try {
        // 1. Fetch products catalog details for context
        const products = await db.all('SELECT id, name, category, brand, description, tags FROM products');
        const catalogProducts = products.map(p => {
            let parsedTags = [];
            try {
                parsedTags = p.tags ? JSON.parse(p.tags) : [];
            }
            catch (e) {
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
        // Use advanced multimodal gemini-3.5-flash
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
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
        const resultText = response.text || '{}';
        const resultObj = JSON.parse(resultText);
        const matches = resultObj.matches || [];
        const detectedAttrs = resultObj.detectedAttrs || "";
        // 3. Obtain full matching details so the client has everything necessary to mount/render instantly
        const matchedIds = matches.map((m) => m.productId).filter(Boolean);
        let matchedProducts = [];
        if (matchedIds.length > 0) {
            const placeholders = matchedIds.map(() => '?').join(',');
            const rows = await db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, matchedIds);
            matchedProducts = rows.map((p) => {
                try {
                    p.tags = p.tags ? JSON.parse(p.tags) : [];
                }
                catch (e) {
                    p.tags = p.tags ? [p.tags] : [];
                }
                try {
                    p.images = p.images ? JSON.parse(p.images) : [];
                }
                catch (e) {
                    p.images = [];
                }
                try {
                    const d = p.details ? JSON.parse(p.details) : [];
                    p.details = Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : [];
                }
                catch (e) {
                    p.details = [];
                }
                try {
                    p.sizes = p.sizes ? JSON.parse(p.sizes) : [];
                }
                catch (e) {
                    p.sizes = [];
                }
                try {
                    p.colors = p.colors ? JSON.parse(p.colors) : [];
                }
                catch (e) {
                    p.colors = [];
                }
                try {
                    p.colorVariants = p.colorVariants ? JSON.parse(p.colorVariants) : [];
                }
                catch (e) {
                    p.colorVariants = [];
                }
                try {
                    p.priceRange = p.priceRange ? JSON.parse(p.priceRange) : null;
                }
                catch (e) {
                    p.priceRange = null;
                }
                try {
                    p.customizationFields = p.customizationFields ? JSON.parse(p.customizationFields) : [];
                }
                catch (e) {
                    p.customizationFields = [];
                }
                return p;
            });
            // Order matchedProducts identically to Gemini's relevance rank order
            matchedProducts.sort((a, b) => {
                return matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id);
            });
        }
        res.json({
            success: true,
            matches: matches.map((m) => {
                const fullProd = matchedProducts.find(p => p.id === m.productId);
                return {
                    ...m,
                    product: fullProd || null
                };
            }).filter((m) => m.product !== null),
            detectedAttrs
        });
    }
    catch (err) {
        console.error("Visual search error details:", err);
        res.status(500).json({ error: err.message || 'Failed to complete visual search analysis' });
    }
});
export default router;
