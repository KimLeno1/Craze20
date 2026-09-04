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
  Search,
  Zap
} from "lucide-react";

interface AdminApifyScraperPanelProps {
  onProductsChange?: () => void;
}

export const AdminApifyScraperPanel: React.FC<AdminApifyScraperPanelProps> = ({ onProductsChange }) => {
  const [isScraping, setIsScraping] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [searchUrl, setSearchUrl] = useState("https://www.temu.com/womens-clothing-o3-28.html");
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"success" | "error" | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const handleScrape = async () => {
    if (!searchUrl.trim()) return;
    
    try {
      setIsScraping(true);
      setImportStatus(null);
      setScrapedProducts([]);
      
      const response = await fetch("/api/scraper/apify-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchUrls: [searchUrl] })
      });
      
      const data = await response.json();
      
      if (data.status === "success" || data.success === true) {
        // Handle potentially different response shapes
        const products = data.products || data.flaggedProducts || [];
        setScrapedProducts(products);
      } else {
        setImportStatus("error");
        setErrorMessage(data.message || "Failed to scrape via Apify.");
      }
    } catch (err: any) {
      console.error("Error running apify scraper:", err);
      setImportStatus("error");
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleAcceptProducts = async () => {
    try {
      setIsAccepting(true);
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
      setIsAccepting(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-gradient-to-br from-[#00D1FF] to-[#00D1FF]/40 rounded-lg text-black">
              <Zap className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-3xl font-serif italic text-white">Apify Cloud Scraper</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">
            Live Actor Execution Engine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Setup */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-grey p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00D1FF] flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Target Selection
            </h3>
            
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Enter a target URL to scrape directly via our managed Apify Actor pool.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                  Target URL (e.g. category or search)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:border-[#00D1FF]/50 focus:outline-none transition-all"
                    placeholder="https://www.temu.com/..."
                  />
                </div>
              </div>

              <button
                onClick={handleScrape}
                disabled={isScraping || !searchUrl.trim()}
                className="w-full py-3 bg-[#00D1FF]/20 text-[#00D1FF] hover:bg-[#00D1FF] hover:text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing Actor...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Run Scrape Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-7">
          <div className="glass-grey p-8 rounded-3xl border border-white/5 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#00D1FF]" />
                Job Results
              </h3>
              {scrapedProducts.length > 0 && (
                <span className="bg-[#00D1FF]/20 text-[#00D1FF] text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#00D1FF]/20">
                  {scrapedProducts.length} Items Found
                </span>
              )}
            </div>

            {importStatus === "success" && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block uppercase tracking-wider text-[10px]">Successfully Imported!</span>
                  Imported <span className="font-bold">{importedCount}</span> items into the database catalog.
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
                  <span className="font-bold block uppercase tracking-wider text-[10px]">Job Failed</span>
                  {errorMessage}
                </div>
              </motion.div>
            )}

            {isScraping ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-[#00D1FF] animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-white text-xs font-bold uppercase tracking-widest">Running Apify Actor...</p>
                  <p className="text-[10px] text-zinc-500 max-w-sm">
                    Containerizing scraping task and fetching dataset...
                  </p>
                </div>
              </div>
            ) : scrapedProducts.length > 0 ? (
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-2">
                  <button
                    onClick={handleAcceptProducts}
                    disabled={isAccepting}
                    className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl shadow-lg flex justify-center items-center gap-2"
                  >
                    {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Accept & Import ({scrapedProducts.length})
                  </button>
                  <button
                    onClick={handleDeclineProducts}
                    disabled={isAccepting}
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
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-950/20">
                <Zap className="w-8 h-8 mb-3 text-zinc-700 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Job Results</p>
                <p className="text-[9px] uppercase tracking-wider mt-1 text-zinc-600">Run a scrape job to view items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
