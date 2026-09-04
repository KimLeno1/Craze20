import React, { useState } from "react";
import { motion } from "motion/react";
import { databaseService } from "../services/databaseService";
import { 
  Globe, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  ShieldAlert, 
  Video, 
  ShoppingBag,
  Upload,
  BookOpen
} from "lucide-react";

interface AdminScraperPanelProps {
  onProductsChange?: () => void;
}

export const AdminScraperPanel: React.FC<AdminScraperPanelProps> = ({ onProductsChange }) => {
  const [isScraping, setIsScraping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"success" | "error" | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [jsonUploadError, setJsonUploadError] = useState<string | null>(null);
  const [jsonUploadSuccess, setJsonUploadSuccess] = useState<string | null>(null);

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processJsonFile(file);
  };

  const processJsonFile = (file: File) => {
    setJsonUploadError(null);
    setJsonUploadSuccess(null);

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setJsonUploadError("Please upload a valid JSON file (.json)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        let productsList: any[] = [];
        if (Array.isArray(parsed)) {
          productsList = parsed;
        } else if (parsed && Array.isArray(parsed.products)) {
          productsList = parsed.products;
        } else {
          throw new Error("Invalid template format. Must contain an array of products.");
        }

        if (productsList.length === 0) {
          throw new Error("The products array is empty.");
        }

        const validatedProducts = productsList.map((p: any) => {
          if (!p.name || !p.price) {
            throw new Error(`Product missing required 'name' or 'price'.`);
          }
          const id = p.id || `prod_uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const originalPrice = p.originalPrice || p.price;
          const image = p.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop";
          
          return {
            id,
            name: p.name,
            price: Number(p.price),
            originalPrice: Number(originalPrice),
            shippingFee: p.shippingFee || 0,
            image,
            images: Array.isArray(p.images) ? p.images : [image],
            colors: Array.isArray(p.colors) ? p.colors : ['Black', 'White', 'Default'],
            category: p.category || 'General',
            gender: p.gender || 'UNISEX',
            description: p.description || `${p.name} premium listing template.`,
            details: Array.isArray(p.details) ? p.details : [{ key: 'Source', value: 'Bulk Upload' }],
            inStock: p.inStock === undefined ? 1 : (p.inStock ? 1 : 0),
            isNew: p.isNew === undefined ? 1 : (p.isNew ? 1 : 0),
            viewers: p.viewers || Math.floor(50 + Math.random() * 450),
            stockCount: p.stockCount || Math.floor(10 + Math.random() * 90),
            isHallOfFame: p.isHallOfFame ? 1 : 0,
            synergyPath: p.synergyPath || null,
            appeal: p.appeal || 'Trending',
            brand: p.brand || 'Premium Partner',
            tags: Array.isArray(p.tags) ? p.tags : ['bulk', 'upload'],
            supplierId: p.supplierId || 'temu_scraper',
            deliveryTime: p.deliveryTime || '7-10 days',
            sizes: Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L', 'XL'],
            isCustom: p.isCustom ? 1 : 0,
            priceRange: p.priceRange || null,
            customizationFields: Array.isArray(p.customizationFields) ? p.customizationFields : [],
            colorVariants: Array.isArray(p.colorVariants) ? p.colorVariants : [],
            createdAt: p.createdAt || new Date().toISOString(),
            offeredDiscount: Number(p.offeredDiscount) || Math.round(((originalPrice - p.price) / originalPrice) * 100) || 15,
            video: p.video || null
          };
        });

        setScrapedProducts(validatedProducts);
        setJsonUploadSuccess(`Successfully loaded ${validatedProducts.length} products! Review them on the right side.`);
        setImportStatus(null);
      } catch (err: any) {
        console.error("JSON upload validation error:", err);
        setJsonUploadError(err.message || "Failed to parse JSON bulk upload file.");
      }
    };
    reader.onerror = () => {
      setJsonUploadError("Error reading JSON file.");
    };
    reader.readAsText(file);
  };

  const handleDeleteScraped = async () => {
    if (!window.confirm("Are you sure you want to delete all scraped Temu products? This action is permanent and cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await (databaseService as any).deleteScrapedItems();
      if (res && res.status === "success") {
        setImportStatus("success");
        setImportedCount(0);
        setScrapedProducts([]);
        setErrorMessage("");
        alert(`Successfully purged ${res.count} scraped products from inventory.`);
        if (onProductsChange) onProductsChange();
      } else {
        alert(res?.message || "Failed to delete scraped items.");
      }
    } catch (err: any) {
      console.error("Failed to delete scraped items:", err);
      alert("Error deleting scraped items.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAcceptProducts = async () => {
    try {
      setIsScraping(true);
      const res = await (databaseService as any).acceptScrapedProducts(scrapedProducts);
      if (res && res.status === "success") {
        setImportStatus("success");
        setImportedCount(scrapedProducts.length);
        setScrapedProducts([]);
        if (onProductsChange) onProductsChange();
      } else {
        setImportStatus("error");
        setErrorMessage(res?.message || "Failed to accept products.");
      }
    } catch (err: any) {
      console.error("Error accepting products:", err);
      setImportStatus("error");
      setErrorMessage("Failed to accept products. Check logs.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeclineProducts = () => {
    if (window.confirm("Are you sure you want to decline these scraped products? They will be discarded.")) {
      setScrapedProducts([]);
      setImportStatus(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-gradient-to-br from-[#00D1FF] to-[#00D1FF]/40 rounded-lg text-black">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </span>
            <h1 className="text-3xl font-serif italic text-white">Bulk Template Importer</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">
            Synchronized Catalog Ingest Tool
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleDeleteScraped}
            disabled={isDeleting || isScraping}
            className="px-6 py-3 bg-red-500/15 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl flex items-center gap-2 disabled:opacity-40"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Purge Catalog Items
          </button>
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Upload & Instructions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bulk JSON Upload Zone */}
          <div className="glass-grey p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-[#00D1FF]" />
              Bulk JSON Upload
            </h3>
            
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Drop the generated <span className="text-zinc-400 font-mono">temu_bulk_upload.json</span> below from your local computer to parse, validate, and preview listings before importing them permanently.
            </p>

            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) processJsonFile(file);
              }}
              className="border-2 border-dashed border-white/10 hover:border-[#00D1FF]/30 rounded-2xl p-6 text-center cursor-pointer hover:bg-zinc-950/20 transition-all relative group"
              onClick={() => document.getElementById("json-file-input")?.click()}
            >
              <input 
                id="json-file-input"
                type="file"
                accept=".json,application/json"
                onChange={handleJsonFileUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-zinc-600 group-hover:text-[#00D1FF] mx-auto mb-2 transition-colors" />
              <span className="text-[10px] font-bold text-zinc-400 block group-hover:text-white transition-colors">
                Drag & Drop JSON File
              </span>
              <span className="text-[8px] text-zinc-600 block mt-1 uppercase tracking-wider">
                or click to browse local files
              </span>
            </div>

            {jsonUploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{jsonUploadError}</span>
              </div>
            )}

            {jsonUploadSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-xl flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{jsonUploadSuccess}</span>
              </div>
            )}
          </div>

          {/* Local Scraper Setup Instructions */}
          <div className="glass-grey p-6 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#00D1FF] flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#00D1FF]" />
              How to Scrape Locally
            </h4>
            
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              To bypass hosting IP blocks and hotlink restrictions, run the scraper securely on your personal computer:
            </p>

            <ul className="space-y-3.5 text-[10px] text-zinc-400 leading-relaxed list-none">
              <li className="flex gap-2">
                <span className="font-bold text-[#00D1FF] font-mono">1.</span>
                <span>Navigate to the <code className="text-zinc-300 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded font-mono">local-scraper/</code> folder in your terminal.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#00D1FF] font-mono">2.</span>
                <span>Install dependencies by running:
                  <code className="block mt-1 text-zinc-300 bg-zinc-950 border border-white/5 px-2.5 py-1 rounded font-mono text-[9px]">npm install</code>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#00D1FF] font-mono">3.</span>
                <span>Scrape your catalog (e.g. 30 items cycling through fashion rules):
                  <code className="block mt-1 text-emerald-400 bg-zinc-950 border border-white/5 px-2.5 py-1 rounded font-mono text-[9px]">node local_temu_scraper.js 30</code>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#00D1FF] font-mono">4.</span>
                <span>Drag the generated <code className="text-[#00D1FF] font-mono">temu_bulk_upload.json</code> file into the upload box above!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Log Feed / Imported Listings */}
        <div className="lg:col-span-7">
          <div className="glass-grey p-8 rounded-3xl border border-white/5 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#00D1FF]" />
                Template File Preview
              </h3>
              {scrapedProducts.length > 0 && (
                <span className="bg-[#00D1FF]/20 text-[#00D1FF] text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#00D1FF]/20">
                  {scrapedProducts.length} Items Loaded
                </span>
              )}
            </div>

            {/* Status alerts */}
            {importStatus === "success" && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block uppercase tracking-wider text-[10px]">Successfully Imported!</span>
                  Successfully mapped and ingested <span className="font-bold">{importedCount}</span> high-fidelity items with local WebP server images into the database catalog.
                </div>
              </motion.div>
            )}

            {importStatus === "error" && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block uppercase tracking-wider text-[10px]">Import Failed</span>
                  {errorMessage}
                </div>
              </motion.div>
            )}

            {/* Products list or placeholder */}
            {isScraping ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-[#00D1FF] animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-white text-xs font-bold uppercase tracking-widest">Ingesting Assets...</p>
                  <p className="text-[10px] text-zinc-500 max-w-sm">
                    Decoding Base64 data streams, compressing image files to optimized WebP, and saving to permanent storage.
                  </p>
                </div>
              </div>
            ) : scrapedProducts.length > 0 ? (
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-2">
                  <button
                    onClick={handleAcceptProducts}
                    className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl shadow-lg"
                  >
                    Accept & Import Catalog ({scrapedProducts.length})
                  </button>
                  <button
                    onClick={handleDeclineProducts}
                    className="flex-1 py-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl shadow-lg"
                  >
                    Decline All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-2">
                  {scrapedProducts.map((p, idx) => (
                    <motion.div
                      key={p.id || idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex gap-4 hover:border-white/15 transition-all group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0 relative">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {p.video && (
                          <div className="absolute top-1 right-1 bg-black/80 p-0.5 rounded-full text-white">
                            <Video className="w-2.5 h-2.5 text-[#00D1FF]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00D1FF] transition-colors">
                            {p.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">${p.price}</span>
                            {p.originalPrice && (
                              <span className="text-[8px] font-mono text-zinc-600 line-through">${p.originalPrice}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[7.5px] font-black uppercase tracking-wider text-[#00D1FF] bg-[#00D1FF]/10 px-1.5 py-0.5 rounded border border-[#00D1FF]/10 truncate max-w-[80px]">
                            {p.category}
                          </span>

                          {p.video && (
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 flex items-center gap-0.5">
                              <Video className="w-2 h-2" />
                              + Video
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-950/20">
                <Globe className="w-8 h-8 mb-3 text-zinc-700 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Catalog File Uploaded</p>
                <p className="text-[9px] uppercase tracking-wider mt-1 text-zinc-600">Drag or click to choose temu_bulk_upload.json</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
