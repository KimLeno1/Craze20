import React, { useState, useEffect } from 'react';
import { Product, ViewState, RankBenefits } from '../types';
import ProductCard from './ProductCard';
import { toast } from 'sonner';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  FolderPlus, 
  Edit3, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X, 
  Folder,
  Tag,
  Share2
} from 'lucide-react';

interface WishlistFolder {
  id: string;
  name: string;
  productIds: string[];
  colorIndex?: number;
}

const FOLDER_COLORS = [
  { name: 'Royal Blue', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bullet: 'bg-blue-600', hoverBg: 'hover:bg-blue-600' },
  { name: 'Rose Pink', text: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', bullet: 'bg-pink-600', hoverBg: 'hover:bg-pink-600' },
  { name: 'Emerald', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bullet: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-600' },
  { name: 'Amber Gold', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bullet: 'bg-amber-600', hoverBg: 'hover:bg-amber-600' },
  { name: 'Purple Velvet', text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', bullet: 'bg-purple-600', hoverBg: 'hover:bg-purple-600' },
  { name: 'Sunset Orange', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bullet: 'bg-orange-600', hoverBg: 'hover:bg-orange-600' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHandle, setSearchHandle] = useState('');
  
  // Folders / Collections State
  const [folders, setFolders] = useState<WishlistFolder[]>(() => {
    try {
      const saved = localStorage.getItem('closet-kraze-wishlist-folders');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
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
    toast.success(`Collection "${newFolder.name}" created!`);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    if (window.confirm(`Delete collection "${folder.name}"? Items will remain in your main Wishlist.`)) {
      setFolders(folders.filter(f => f.id !== folderId));
      if (activeFolderId === folderId) {
        setActiveFolderId('all');
      }
      toast.success(`Collection "${folder.name}" removed.`);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editName.trim()) return;
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: editName.trim() } : f));
    setEditingFolderId(null);
    setEditName('');
    toast.success('Collection renamed!');
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
  
  let filteredItems = wishlistItems.filter(p => {
    if (activeFolderId === 'all') return true;
    return activeFolder ? activeFolder.productIds.includes(p.id) : false;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredItems = filteredItems.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Bulk Actions
  const handleMoveAllToCart = () => {
    if (filteredItems.length === 0) return;
    filteredItems.forEach(p => {
      onAddToCart(p);
    });
    toast.success(`Moved ${filteredItems.length} item${filteredItems.length > 1 ? 's' : ''} to your cart!`);
  };

  const handleClearAllWishlist = () => {
    if (filteredItems.length === 0) return;
    if (window.confirm(`Are you sure you want to remove ${filteredItems.length} item${filteredItems.length > 1 ? 's' : ''} from your wishlist?`)) {
      filteredItems.forEach(p => {
        onToggleWishlist(p);
      });
      toast.success('Items removed from wishlist.');
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 space-y-8 animate-in fade-in duration-500 pb-40 max-w-7xl mx-auto text-zinc-900">
      
      {/* Main Header Banner */}
      <header className="bg-gradient-to-br from-white via-blue-50/40 to-slate-50 border border-zinc-200/80 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest font-mono">
                {rank.tier} Member Saved Items
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-serif italic text-zinc-950 tracking-tight flex items-center gap-3">
              My Saved <span className="not-italic font-sans font-black text-[#0F52BA] uppercase">Wishlist</span>
            </h1>
            
            <p className="text-zinc-600 text-xs sm:text-sm font-medium leading-relaxed">
              Keep track of your favorite fashion items, create custom collections, or move your saved looks directly to your cart when ready to shop.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {filteredItems.length > 0 && (
              <>
                <button
                  onClick={handleMoveAllToCart}
                  className="flex-1 md:flex-initial px-5 py-3 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Move All to Bag</span>
                </button>

                <button
                  onClick={handleClearAllWishlist}
                  className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Clear items"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate(ViewState.LOBBY)}
                className="px-5 py-3 bg-white border border-zinc-200 hover:border-[#0F52BA] text-zinc-800 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Browse Shop</span>
                <ArrowRight className="w-4 h-4 text-[#0F52BA]" />
              </button>
            )}
          </div>
        </div>

        {/* Live Search & Social Oracle Bar */}
        <div className="pt-4 border-t border-zinc-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Wishlist Live Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter saved items by name..."
              className="w-full bg-white border border-zinc-200 rounded-full pl-9 pr-4 py-2 text-xs font-medium text-zinc-900 focus:border-[#0F52BA] focus:outline-none shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Social Wishlist Sharing option */}
          {rank.canSeeOtherWishlists && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:inline">Find Friend's Wishlist:</span>
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  value={searchHandle}
                  onChange={e => setSearchHandle(e.target.value)}
                  placeholder="@handle or user ID"
                  className="bg-white border border-zinc-200 px-3 py-1.5 rounded-full text-xs text-zinc-800 focus:border-[#0F52BA] outline-none w-36 font-mono"
                />
                <button 
                  onClick={() => {
                    if (searchHandle.trim()) {
                      toast.info(`Viewing public wishlist for ${searchHandle}`);
                    }
                  }}
                  className="bg-zinc-900 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider hover:bg-[#0F52BA] transition-all cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Wishlist Collections Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#0F52BA]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-800">My Collections</h2>
            <span className="text-xs text-zinc-500 font-bold">({folders.length + 1})</span>
          </div>

          <button 
            onClick={() => { setShowCreateForm(!showCreateForm); setEditingFolderId(null); }}
            className="px-4 py-2 bg-[#0F52BA]/10 hover:bg-[#0F52BA]/20 text-[#0F52BA] border border-[#0F52BA]/30 text-xs font-black uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </div>

        {/* Create Collection Inline Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateFolder} className="p-5 bg-white rounded-2xl border border-blue-200 shadow-md space-y-4 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-800">Create New Collection</span>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)} 
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Collection Name (e.g. Summer Vacation, Gifts)"
                className="flex-1 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-900 focus:border-[#0F52BA] outline-none"
                maxLength={24}
                required
              />
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-[#0F52BA] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
              >
                Save Collection
              </button>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Select Color Tag</span>
              <div className="flex gap-3">
                {FOLDER_COLORS.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`w-7 h-7 rounded-full ${col.bullet} transition-all relative flex items-center justify-center ${
                      selectedColorIndex === idx 
                        ? 'ring-2 ring-offset-2 ring-[#0F52BA] scale-110 shadow-md' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    title={col.name}
                  >
                    {selectedColorIndex === idx && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Collections Tabs Grid */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {/* "All Saved" Default Tab */}
          <button
            onClick={() => { setActiveFolderId('all'); setEditingFolderId(null); }}
            className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
              activeFolderId === 'all'
                ? 'bg-[#0F52BA] text-white border-[#0F52BA] shadow-md'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
            }`}
          >
            <span>All Saved</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              activeFolderId === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {wishlistItems.length}
            </span>
          </button>

          {/* User Collections Tabs */}
          {folders.map((f, idx) => {
            const folderColor = getFolderColor(f.colorIndex !== undefined ? f.colorIndex : idx);
            const isActive = activeFolderId === f.id;
            const itemCount = f.productIds.filter(id => wishlistIds.includes(id)).length;

            return (
              <div key={f.id} className="relative group flex items-center">
                <button
                  onClick={() => { setActiveFolderId(f.id); setEditingFolderId(null); }}
                  className={`pl-4 pr-10 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? `${folderColor.bg} ${folderColor.text} ${folderColor.border} ring-1 ${folderColor.border} shadow-sm`
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${folderColor.bullet}`} />
                  <span>{f.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                    isActive ? 'bg-black/10' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {itemCount}
                  </span>
                </button>
              
                {/* Touch-Friendly Edit & Delete Actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingFolderId(f.id); setEditName(f.name); }}
                    className="p-1 text-zinc-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                    title="Rename Collection"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                    title="Delete Collection"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rename Collection Dialog */}
        {editingFolderId && (
          <div className="flex gap-2 max-w-md p-3 bg-white rounded-xl border border-blue-200 shadow-md animate-in slide-in-from-top-2 duration-150">
            <input 
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="flex-1 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-900 focus:border-[#0F52BA] outline-none"
              maxLength={24}
              required
            />
            <button 
              onClick={() => handleRenameFolder(editingFolderId)}
              className="px-4 py-1.5 bg-[#0F52BA] text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
            >
              Save
            </button>
            <button 
              onClick={() => setEditingFolderId(null)}
              className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main Wishlist Products Grid */}
      {wishlistItems.length === 0 ? (
        <div className="py-24 px-4 text-center flex flex-col items-center justify-center gap-6 bg-white rounded-[2.5rem] border border-dashed border-zinc-300 shadow-xs">
          <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-inner">
            <Heart className="w-10 h-10 stroke-[1.5px] fill-rose-500/10 text-rose-500" />
          </div>
          
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-bold text-zinc-900">Your Wishlist is Empty</h3>
            <p className="text-zinc-500 text-xs font-medium leading-relaxed">
              Save your favorite clothes, shoes, and accessories while browsing the shop by tapping the heart icon on any item.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate(ViewState.LOBBY)}
              className="px-6 py-3 bg-[#0F52BA] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-dashed border-zinc-200">
          <Folder className="w-12 h-12 text-zinc-300" />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-zinc-800">No items found</h4>
            <p className="text-zinc-500 text-xs">
              {searchQuery ? `No items matching "${searchQuery}"` : 'No items categorized in this collection yet.'}
            </p>
          </div>
          <button 
            onClick={() => { setActiveFolderId('all'); setSearchQuery(''); }}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            View All Saved Items
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(p => (
            <div key={p.id} className="flex flex-col gap-3 group relative bg-white border border-zinc-200 rounded-[2rem] p-3 shadow-xs hover:shadow-md transition-shadow">
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
              
              {/* Product Wishlist Quick Actions Bar */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 px-1">
                {/* Primary Move to Cart button */}
                <button
                  onClick={() => {
                    onAddToCart(p);
                    toast.success(`Added ${p.name} to cart!`);
                  }}
                  className="flex-1 py-2 px-3 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>

                {/* Collection Organizer Dropdown Button */}
                <div className="relative">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOrganizingProductId(organizingProductId === p.id ? null : p.id); 
                    }}
                    className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#0F52BA] border border-blue-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    title="Organize in Collection"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Collection</span>
                  </button>

                  {/* Collection Picker Popover */}
                  {organizingProductId === p.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-zinc-200 rounded-2xl p-3 shadow-2xl z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150 text-left">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-wider pb-1.5 border-b border-zinc-100">
                        <span>Add to Collection</span>
                        <button onClick={() => setOrganizingProductId(null)} className="text-zinc-400 hover:text-zinc-700">✕</button>
                      </div>

                      {folders.length === 0 ? (
                        <div className="text-zinc-500 text-[10px] italic py-2 text-center">
                          No custom collections created yet. Create one at the top of your Wishlist!
                        </div>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {folders.map(f => {
                            const isMember = f.productIds.includes(p.id);
                            return (
                              <button
                                key={f.id}
                                onClick={() => handleToggleItemInFolder(p.id, f.id)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  isMember
                                    ? 'bg-blue-50 text-[#0F52BA] font-black'
                                    : 'hover:bg-zinc-50 text-zinc-700'
                                }`}
                              >
                                <span>{f.name}</span>
                                {isMember && <Check className="w-3.5 h-3.5 text-[#0F52BA]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button 
                        onClick={() => setOrganizingProductId(null)}
                        className="w-full text-center py-1.5 bg-[#0F52BA] text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* Remove 1-tap Trash Button */}
                <button
                  onClick={() => {
                    onToggleWishlist(p);
                    toast.info(`Removed ${p.name} from wishlist.`);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all cursor-pointer"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistView;
