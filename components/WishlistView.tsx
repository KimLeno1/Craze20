import React, { useState, useEffect } from 'react';
import { Product, ViewState, RankBenefits } from '../types';
import ProductCard from './ProductCard';
import { toast } from 'sonner';

interface WishlistFolder {
  id: string;
  name: string;
  productIds: string[];
  colorIndex?: number;
}

const FOLDER_COLORS = [
  { name: 'Cyan', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', bullet: 'bg-cyan-400', hoverBg: 'hover:bg-cyan-400' },
  { name: 'Magenta', text: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', bullet: 'bg-pink-500', hoverBg: 'hover:bg-pink-500' },
  { name: 'Lime', text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', bullet: 'bg-emerald-400', hoverBg: 'hover:bg-emerald-400' },
  { name: 'Yellow', text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', bullet: 'bg-yellow-400', hoverBg: 'hover:bg-yellow-400' },
  { name: 'Purple', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', bullet: 'bg-purple-400', hoverBg: 'hover:bg-purple-400' },
  { name: 'Orange', text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', bullet: 'bg-orange-500', hoverBg: 'hover:bg-orange-500' },
];

const getFolderColor = (index: number) => {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
};

interface WishlistViewProps {
  products: Product[];
  wishlistIds: string[];
  onAddToCart: (p: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist: (p: Product) => void;
  onProductClick: (p: Product) => void;
  onNavigate?: (view: ViewState) => void;
  rank: RankBenefits;
  limitedOfferEnd?: number | null;
  onToggleCompare?: (product: Product) => void;
  comparisonList?: Product[];
  onQuickBuy?: (product: Product) => void;
}

const WishlistView: React.FC<WishlistViewProps> = ({ 
  products, 
  wishlistIds, 
  onAddToCart, 
  onToggleWishlist,
  onProductClick,
  onNavigate,
  rank,
  limitedOfferEnd,
  onToggleCompare,
  comparisonList = [],
  onQuickBuy
}) => {
  const [searchHandle, setSearchHandle] = useState('');
  
  // Folders State
  const [folders, setFolders] = useState<WishlistFolder[]>(() => {
    try {
      const saved = localStorage.getItem('closet-kraze-wishlist-folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [organizingProductId, setOrganizingProductId] = useState<string | null>(null);

  // Sync folders to local storage
  useEffect(() => {
    localStorage.setItem('closet-kraze-wishlist-folders', JSON.stringify(folders));
  }, [folders]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder: WishlistFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      productIds: [],
      colorIndex: selectedColorIndex
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setSelectedColorIndex(0);
    setShowCreateForm(false);
    toast.success(`Folder "${newFolder.name}" created successfully.`);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    if (window.confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
      setFolders(folders.filter(f => f.id !== folderId));
      if (activeFolderId === folderId) {
        setActiveFolderId('all');
      }
      toast.success(`Folder "${folder.name}" deleted.`);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editName.trim()) return;
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: editName.trim() } : f));
    setEditingFolderId(null);
    setEditName('');
    toast.success('Folder renamed successfully.');
  };

  const handleToggleItemInFolder = (productId: string, folderId: string) => {
    setFolders(folders.map(f => {
      if (f.id === folderId) {
        const exists = f.productIds.includes(productId);
        const updatedIds = exists 
          ? f.productIds.filter(id => id !== productId) 
          : [...f.productIds, productId];
        return { ...f, productIds: updatedIds };
      }
      return f;
    }));
  };

  // Filter items
  const wishlistItems = products.filter(p => wishlistIds.includes(p.id));
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const filteredItems = wishlistItems.filter(p => {
    if (activeFolderId === 'all') return true;
    return activeFolder ? activeFolder.productIds.includes(p.id) : false;
  });

  return (
    <div className="p-8 md:p-16 space-y-16 animate-in fade-in duration-1000 pb-40 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#00D1FF] glow-text animate-pulse"></div>
             <span className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[0.4em]">{rank.tier} Archive</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif italic text-white tracking-tighter leading-none">
            The Saved <span className="text-white not-italic font-sans font-black uppercase glow-text">Circuit</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">
            Retention: {typeof rank.wishlistRetentionDays === 'number' ? `${rank.wishlistRetentionDays} Days` : 'PERMANENT'} // {wishlistItems.length} Identifiers
          </p>
        </div>
        
        {rank.canSeeOtherWishlists && (
          <div className="space-y-3 w-full md:w-auto">
             <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center md:text-right">Social Oracle Access Active</p>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={searchHandle}
                  onChange={e => setSearchHandle(e.target.value)}
                  placeholder="USER HANDLE OR ID"
                  className="glass-light border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-white focus:border-[#00D1FF] outline-none w-40 font-mono"
                />
                <button className="bg-white text-black px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-[#00D1FF] hover:text-black transition-all cursor-pointer">Scan</button>
             </div>
          </div>
        )}
      </header>

      {/* Wishlist Folders Hub */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Archive Directories</span>
          </div>
          <button 
            onClick={() => { setShowCreateForm(!showCreateForm); setEditingFolderId(null); }}
            className="px-4 py-2 bg-white/5 hover:bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📁 + New Folder</span>
          </button>
        </div>

        {/* Create Folder Inline Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateFolder} className="flex flex-col gap-4 max-w-md p-5 bg-white/5 rounded-2xl border border-white/10 animate-in slide-in-from-top-4 duration-300">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="FOLDER NAME (e.g., Summer Looks)"
                className="flex-1 bg-black/40 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-white focus:border-[#00D1FF] outline-none font-mono"
                maxLength={24}
                required
              />
              <button type="submit" className="px-4 py-2 bg-[#00D1FF] text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00D1FF]/80 transition-all cursor-pointer">
                Create
              </button>
            </div>
            
            <div className="space-y-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Choose Theme Tag</span>
              <div className="flex gap-2.5">
                {FOLDER_COLORS.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`w-6 h-6 rounded-full ${col.bullet} transition-all relative ${
                      selectedColorIndex === idx 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d1527] scale-110 shadow-lg shadow-black/50' 
                        : 'opacity-50 hover:opacity-100 scale-95'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Folders Tabs Grid */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setActiveFolderId('all'); setEditingFolderId(null); }}
            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border ${
              activeFolderId === 'all'
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
            }`}
          >
            <span>📦 All Saved</span>
            <span className={`px-1.5 py-0.5 text-[8px] rounded-md font-bold ${activeFolderId === 'all' ? 'bg-black text-white' : 'bg-white/10 text-zinc-400'}`}>
              {wishlistItems.length}
            </span>
          </button>

          {folders.map((f, idx) => {
            const folderColor = getFolderColor(f.colorIndex !== undefined ? f.colorIndex : idx);
            const isActive = activeFolderId === f.id;
            return (
              <div key={f.id} className="relative group flex items-center">
                <button
                  onClick={() => { setActiveFolderId(f.id); setEditingFolderId(null); }}
                  className={`pl-5 pr-12 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2.5 border ${
                    isActive
                      ? `${folderColor.bg} ${folderColor.text} ${folderColor.border} shadow-lg shadow-black/40`
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${folderColor.bullet} animate-pulse`} />
                    📁 {f.name}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[8px] rounded-md font-bold ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'}`}>
                    {f.productIds.filter(id => wishlistIds.includes(id)).length}
                  </span>
                </button>
              
              {/* Folder Actions (Rename / Delete) */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingFolderId(f.id); setEditName(f.name); }}
                  className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white text-[10px]"
                  title="Rename Folder"
                >
                  ✏️
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                  className="p-1 hover:bg-red-500/20 rounded-md text-red-400 hover:text-red-300 text-[10px]"
                  title="Delete Folder"
                >
                  ❌
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {/* Editing Folder Name Dialog */}
        {editingFolderId && (
          <div className="flex gap-2 max-w-md p-4 bg-white/5 rounded-2xl border border-[#00D1FF]/20 animate-in slide-in-from-top-2 duration-200">
            <input 
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-white focus:border-[#00D1FF] outline-none font-mono"
              maxLength={24}
              required
            />
            <button 
              onClick={() => handleRenameFolder(editingFolderId)}
              className="px-4 py-2 bg-[#00D1FF] text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00D1FF]/80 transition-all cursor-pointer"
            >
              Save
            </button>
            <button 
              onClick={() => setEditingFolderId(null)}
              className="px-4 py-2 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="py-40 text-center flex flex-col items-center gap-10 glass-grey rounded-[4rem] border border-dashed border-white/5">
          <div className="text-8xl opacity-10 animate-bounce">📦</div>
          <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.6em] italic">Archive terminal empty.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center gap-6 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5">
          <div className="text-5xl opacity-20">📁</div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] font-mono">No items categorized in this directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
          {filteredItems.map(p => (
            <div key={p.id} className="flex flex-col gap-3 group relative">
              <ProductCard 
                product={p} 
                isWishlisted={true}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onClick={onProductClick}
                saleTimerEnd={p.price < p.originalPrice ? limitedOfferEnd : null}
                onToggleCompare={onToggleCompare}
                isComparing={comparisonList.some(cp => cp.id === p.id)}
                onQuickBuy={onQuickBuy}
              />
              
              {/* Folder Categorizer Bar */}
              <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 text-[9px] font-mono transition-all">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-zinc-500 font-bold text-[8px] uppercase tracking-wider">FOLDER:</span>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none max-w-[120px] sm:max-w-[150px]">
                    {folders.filter(f => f.productIds.includes(p.id)).length > 0 ? (
                      folders.filter(f => f.productIds.includes(p.id)).map(f => {
                        const folderIdx = folders.findIndex(fold => fold.id === f.id);
                        const folderColor = getFolderColor(f.colorIndex !== undefined ? f.colorIndex : folderIdx);
                        return (
                          <span key={f.id} className={`px-2 py-0.5 rounded text-[8px] font-black whitespace-nowrap border flex items-center gap-1 ${folderColor.bg} ${folderColor.text} ${folderColor.border}`}>
                            <span className={`w-1 h-1 rounded-full ${folderColor.bullet}`} />
                            {f.name}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-zinc-600 italic text-[8px]">Uncategorized</span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOrganizingProductId(organizingProductId === p.id ? null : p.id); }}
                    className="px-2.5 py-1 bg-white/5 hover:bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 hover:border-[#00D1FF]/40 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                  >
                    📂 Organize
                  </button>

                  {/* Folder Selection Dropdown Modal/Popout */}
                  {organizingProductId === p.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#090D1A] border border-white/10 rounded-2xl p-3 shadow-2xl z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150 text-left">
                      <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pb-1 border-b border-white/5">
                        Add to Folder
                      </div>
                      {folders.length === 0 ? (
                        <div className="text-zinc-600 text-[8px] italic py-2">
                          No folders created. Create one above first!
                        </div>
                      ) : (
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {folders.map(f => {
                            const isMember = f.productIds.includes(p.id);
                            return (
                              <button
                                key={f.id}
                                onClick={() => handleToggleItemInFolder(p.id, f.id)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                                  isMember
                                    ? 'bg-[#00D1FF]/10 text-[#00D1FF]'
                                    : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <span>{f.name}</span>
                                {isMember && <span className="text-[9px]">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button 
                        onClick={() => setOrganizingProductId(null)}
                        className="w-full text-center py-1.5 bg-white/5 hover:bg-[#00D1FF] hover:text-black text-white text-[8px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistView;
