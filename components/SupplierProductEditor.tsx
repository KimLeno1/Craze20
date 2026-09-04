import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Gender } from '../types';
import { databaseService } from '../services/databaseService';
import { Camera, Upload, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SupplierProductEditorProps {
  product?: Product | null;
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
}

const GENDERS: Gender[] = ['Male', 'Female', 'UNISEX'];

const COLOR_PRESETS = [
  { name: 'Midnight Black', hex: '#0A0A0A' },
  { name: 'Ghost White', hex: '#F8F9FA' },
  { name: 'Slate Grey', hex: '#5A6268' },
  { name: 'Off White', hex: '#FAF9F6' },
  { name: 'Cyber Pink', hex: '#FF007F' },
  { name: 'Acid Neon Yellow', hex: '#CCFF00' },
  { name: 'Cobalt Blue', hex: '#1F51FF' },
  { name: 'Teal Eclipse', hex: '#008080' },
  { name: 'Emerald Matrix', hex: '#00FF66' },
  { name: 'Crimson Red', hex: '#D32F2F' },
  { name: 'Saffron Orange', hex: '#FF9900' },
  { name: 'Mocha Brown', hex: '#4A3B32' },
  { name: 'Cream Beige', hex: '#F5F5DC' },
  { name: 'Khaki Sand', hex: '#C3B091' },
  { name: 'Sunset Peach', hex: '#FFCC99' },
  { name: 'Copper Clay', hex: '#B87333' },
  { name: 'Amethyst Purple', hex: '#9966CC' },
  { name: 'Ethereal Lavender', hex: '#E6E6FA' },
  { name: 'Sage Green', hex: '#87A96B' },
  { name: 'Burgundy Wine', hex: '#800020' },
  { name: 'Metallic Gold', hex: '#FFD700' },
  { name: 'Metallic Silver', hex: '#C0C0C0' },
  { name: 'Navy Deep', hex: '#000080' },
  { name: 'Rose Quartz', hex: '#FFC0CB' }
];

const SupplierProductEditor: React.FC<SupplierProductEditorProps> = ({ product, onSave, onCancel }) => {
  const [paletteTarget, setPaletteTarget] = useState<'MAIN' | 'SECONDARY'>('MAIN');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [adminTags, setAdminTags] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    originalPrice: 0,
    shippingFee: 0,
    deliveryTime: '',
    image: '',
    images: [],
    category: '',
    gender: 'UNISEX',
    description: '',
    details: [],
    inStock: true,
    stockCount: 0,
    tags: [],
    sizes: [],
    colorVariants: [],
    isCustom: false,
    priceRange: { min: 0, max: 0 },
    customizationFields: [],
    offeredDiscount: 0,
    video: ''
  });

  const [detailInput, setDetailInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [variantMain, setVariantMain] = useState('');
  const [variantSecondary, setVariantSecondary] = useState('');

  // Customization Field State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'select' | 'color'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoMeta, setVideoMeta] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [fetchedCategories, fetchedTags] = await Promise.all([
        databaseService.getCategories(),
        databaseService.getTags()
      ]);
      setCategories(fetchedCategories);
      setAdminTags(fetchedTags);
      if (!product && fetchedCategories.length > 0) {
        setFormData(prev => ({ ...prev, category: fetchedCategories[0].name }));
      }
    };
    fetchInitialData();
  }, [product]);

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        shippingFee: product.shippingFee || 0,
        deliveryTime: product.deliveryTime || '',
        image: product.image,
        images: product.images || (product.image ? [product.image] : []),
        category: product.category,
        gender: product.gender || 'UNISEX',
        description: product.description,
        details: product.details,
        inStock: product.inStock,
        stockCount: product.stockCount,
        tags: product.tags,
        sizes: product.sizes || [],
        colorVariants: product.colorVariants || [],
        isCustom: product.isCustom || false,
        priceRange: product.priceRange || { min: 0, max: 0 },
        customizationFields: product.customizationFields || [],
        offeredDiscount: product.offeredDiscount || 0,
        video: product.video || ''
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product?.id) return;
    
    const confirmed = window.confirm('CRITICAL_PROTOCOL: Are you absolutely certain you wish to terminate this silhouette entry from the neural archive? This action is irreversible.');
    
    if (confirmed) {
      setIsSaving(true);
      try {
        await databaseService.deleteProduct(product.id);
        toast.success('Silhouette entry terminated');
        onCancel(); // Close editor and refresh list
      } catch (error) {
        console.error('Termination failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const addDetail = () => {
    if (detailInput.trim()) {
      setFormData({ ...formData, details: [...(formData.details || []), detailInput.trim()] });
      setDetailInput('');
    }
  };

  const addTag = (tag: string) => {
    if (tag && !(formData.tags || []).includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
    }
    setSelectedTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tagToRemove) });
  };

  const addSize = () => {
    if (sizeInput.trim()) {
      setFormData({ ...formData, sizes: [...(formData.sizes || []), sizeInput.trim().toUpperCase()] });
      setSizeInput('');
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setFormData({ ...formData, sizes: (formData.sizes || []).filter(s => s !== sizeToRemove) });
  };
  
  const addColorVariant = () => {
    if (variantMain.trim() && variantSecondary.trim()) {
      setFormData({ 
        ...formData, 
        colorVariants: [...(formData.colorVariants || []), { main: variantMain.trim(), secondary: variantSecondary.trim() }] 
      });
      setVariantMain('');
      setVariantSecondary('');
    }
  };

  const removeColorVariant = (index: number) => {
    const newVariants = [...(formData.colorVariants || [])];
    newVariants.splice(index, 1);
    setFormData({ ...formData, colorVariants: newVariants });
  };

  const addCustomField = () => {
    if (newFieldName.trim()) {
      const options = newFieldOptions.split(',').map(o => o.trim()).filter(o => o);
      const newField = {
        id: `field-${Date.now()}`,
        label: newFieldName.trim(),
        type: newFieldType,
        required: true,
        options: newFieldType === 'select' ? options : undefined
      };
      setFormData({
        ...formData,
        customizationFields: [...(formData.customizationFields || []), newField]
      });
      setNewFieldName('');
      setNewFieldOptions('');
    }
  };

  const removeCustomField = (id: string) => {
    setFormData({
      ...formData,
      customizationFields: (formData.customizationFields || []).filter(f => f.id !== id)
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !formData.name) return;

    setUploadError(null);
    const fileList = Array.from(files);
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError(`File ${file.name} too large. Maximum size is 10MB.`);
            continue;
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setUploadError(`Invalid file type for ${file.name}. Only JPEG, PNG, WEBP, and GIF are allowed.`);
            continue;
        }

        try {
            const result: any = await databaseService.uploadProductImage(file, `${formData.name}-${i}`, (progress) => {
                setUploadProgress(((i + progress / 100) / fileList.length) * 100);
            });
            if (result.url) {
                uploadedUrls.push(result.url);
            }
        } catch (error: any) {
            console.error('Upload failed for file:', file.name, error);
            setUploadError(`Upload failed for ${file.name}: ${error.message || "Please try again."}`);
        }
    }

    if (uploadedUrls.length > 0) {
        const newImages = [...(formData.images || []), ...uploadedUrls];
        setFormData(prev => ({ 
            ...prev, 
            images: newImages,
            image: prev.image || uploadedUrls[0]
        }));
    }

    setIsUploading(false);
    setUploadProgress(100);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoMeta(null);

    try {
      const result = await databaseService.uploadProductVideo(file, formData.name || 'unnamed', (progress) => {
        setVideoUploadProgress(progress);
      });
      if (result.status === 'success' || result.url) {
        setFormData(prev => ({
          ...prev,
          video: result.url
        }));
        setVideoMeta(result.meta || null);
        toast.success('Video uploaded & compressed successfully!');
      } else {
        toast.error('Video upload failed or returned invalid status.');
      }
    } catch (error: any) {
      console.error('Video upload failed:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      video: undefined
    }));
    setVideoMeta(null);
    toast.success('Video removed successfully');
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData(prev => ({
        ...prev,
        images: newImages,
        image: index === 0 ? (newImages[0] || '') : prev.image
    }));
  };

  const setMainImage = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-[#f59e0b]/20 w-full max-w-4xl rounded-[3rem] shadow-[0_0_100px_rgba(245,158,11,0.05)] flex flex-col max-h-[90vh]">
        <header className="p-8 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif italic text-white">
              {product ? 'Modify_Uplink_Data' : 'Register_New_Silhouette'}
            </h2>
            <p className="text-[9px] font-black text-[#f59e0b] uppercase tracking-[0.4em]">Node Supply Ledger</p>
          </div>
          <button 
            onClick={onCancel}
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all text-white"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scrollbar-hide font-mono">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest border-l-2 border-[#f59e0b] pl-3">Logistics Meta</div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Product Designation</label>
                <input 
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] transition-all outline-none"
                  placeholder="ITEM NAME (STRING)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Available Price (GH₵)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price || 0}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Offered Discount (%)</label>
                  <input 
                    type="number"
                    value={formData.offeredDiscount || 0}
                    onChange={e => setFormData({...formData, offeredDiscount: Number(e.target.value)})}
                    placeholder="e.g. 20 (leave 0 for auto)"
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Logistics Yield (Shipping GH₵)</label>
                  <input 
                    type="number"
                    required
                    value={formData.shippingFee || 0}
                    onChange={e => setFormData({...formData, shippingFee: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Delivery Time</label>
                  <input 
                    type="text"
                    value={formData.deliveryTime || ''}
                    onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                    placeholder="e.g. 3-5 Business Days"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Inventory Depth</label>
                  <input 
                    type="number"
                    required
                    value={formData.stockCount || 0}
                    onChange={e => setFormData({...formData, stockCount: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Sector (Category)</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none appearance-none"
                  >
                    <option value="">Select Sector</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Sex Protocol (Gender)</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] focus:border-[#f59e0b] outline-none appearance-none"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Scale Options (Sizes)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={sizeInput}
                    onChange={e => setSizeInput(e.target.value)}
                    placeholder="ADD SIZE..."
                    className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-3 text-[10px] text-white focus:border-[#f59e0b] outline-none"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  />
                  <button type="button" onClick={addSize} className="w-12 h-12 bg-[#f59e0b] text-black rounded-2xl flex items-center justify-center font-black">+</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes?.map(size => (
                    <span 
                      key={size} 
                      onClick={() => removeSize(size)}
                      className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-3 py-1 rounded-full text-[8px] font-black uppercase cursor-pointer hover:bg-red-500/20 hover:text-red-500 transition-all"
                    >
                      {size} ✕
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Available Colours (Main-Secondary Variants)</label>
                <div className="flex flex-col gap-3 p-4 glass-light border border-white/5 rounded-3xl">
                  {/* Target input selector */}
                  <div className="flex justify-between items-center bg-white/5 rounded-xl p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPaletteTarget('MAIN')}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        paletteTarget === 'MAIN' ? 'bg-[#f59e0b] text-black shadow-md' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Target: Main ({variantMain || 'Empty'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaletteTarget('SECONDARY')}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        paletteTarget === 'SECONDARY' ? 'bg-[#f59e0b] text-black shadow-md' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Target: Secondary ({variantSecondary || 'Empty'})
                    </button>
                  </div>

                  {/* Preset Swatches Palette */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block px-1">Quick Color Range Picker</span>
                    <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#020202]/40 rounded-xl max-h-32 overflow-y-auto border border-white/5 custom-scrollbar">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          title={`${preset.name} (${preset.hex})`}
                          onClick={() => {
                            if (paletteTarget === 'MAIN') {
                              setVariantMain(preset.hex);
                              setPaletteTarget('SECONDARY');
                              toast.success(`Set Main color: ${preset.name}`);
                            } else {
                              setVariantSecondary(preset.hex);
                              setPaletteTarget('MAIN');
                              toast.success(`Set Secondary color: ${preset.name}`);
                            }
                          }}
                          className="group relative flex flex-col items-center justify-center p-1 rounded-lg hover:bg-white/5 transition-all"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border border-white/20 transition-all ${
                              (paletteTarget === 'MAIN' && variantMain === preset.hex) ||
                              (paletteTarget === 'SECONDARY' && variantSecondary === preset.hex)
                                ? 'scale-110 border-white ring-2 ring-[#f59e0b]'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="text-[6px] text-zinc-500 group-hover:text-white truncate max-w-[40px] text-center mt-0.5 font-bold uppercase">
                            {preset.name.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text"
                      value={variantMain}
                      onChange={e => setVariantMain(e.target.value)}
                      placeholder="MAIN COLOUR..."
                      className="bg-black border border-white/10 rounded-2xl px-6 py-3 text-[10px] text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                    />
                    <input 
                      type="text"
                      value={variantSecondary}
                      onChange={e => setVariantSecondary(e.target.value)}
                      placeholder="SECONDARY COLOUR..."
                      className="bg-black border border-white/10 rounded-2xl px-6 py-3 text-[10px] text-[#f59e0b] focus:border-[#f59e0b] outline-none"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addColorVariant} 
                    className="w-full py-3 bg-[#f59e0b] text-black rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white transition-all shadow-lg"
                  >
                    DEPLOY VARIANT NODE
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {formData.colorVariants?.map((variant, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => removeColorVariant(idx)}
                      className="group relative flex items-center justify-between bg-zinc-900/40 border border-white/5 p-4 rounded-2xl cursor-pointer hover:border-red-500/50 transition-all overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full border border-white/20 shadow-xl z-20" style={{ backgroundColor: variant.main }} />
                          <div className="w-6 h-6 rounded-full border border-white/20 shadow-xl z-10" style={{ backgroundColor: variant.secondary }} />
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-tight">
                          <span className="text-white/40">{variant.main}</span>
                          <span className="mx-1">/</span>
                          <span className="text-[#f59e0b]">{variant.secondary}</span>
                        </div>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">✕</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1 flex justify-between items-center">
                  Visual Assets (Multi-Upload)
                  {isUploading && <Loader2 className="w-3 h-3 animate-spin text-[#f59e0b]" />}
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                   {formData.images?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 group">
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setMainImage(img)}
                          className={`px-2 py-1 rounded text-[7px] font-black uppercase transition-all ${formData.image === img ? 'bg-[#f59e0b] text-black' : 'bg-white/20 text-white'}`}
                        >
                          {formData.image === img ? 'LEAD' : 'SET_LEAD'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 bg-red-500/20 text-red-500 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-black border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#f59e0b]/50 transition-all group overflow-hidden relative"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[#f59e0b] text-xs font-bold">{Math.round(uploadProgress)}%</span>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                           <div className="h-full bg-[#f59e0b] transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-zinc-700 group-hover:text-[#f59e0b] mb-2" />
                        <span className="text-[8px] font-black text-zinc-700 group-hover:text-[#f59e0b] uppercase tracking-widest">UPLINK_IMG</span>
                      </>
                    )}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
                
                {uploadError && (
                  <p className="text-[8px] text-red-500 uppercase tracking-widest px-2 animate-pulse mt-2">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Product video section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Product Showcase Video (With Auto-Compression)</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Video upload box */}
                  <div className="rounded-2xl bg-black border border-white/5 p-5 flex flex-col justify-between min-h-[160px]">
                    <div className="space-y-2">
                      <div className="text-white text-xs font-black uppercase tracking-widest">Upload Video Link / File</div>
                      <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-relaxed">
                        Suppliers and Admins can upload MP4, WebM, MOV, and basic videos. Videos are compressed server-side to optimal H.264 profiles to preserve viewport frame-rates while maintaining pristine visual quality.
                      </p>
                    </div>

                    <div className="relative group cursor-pointer border border-dashed border-white/10 rounded-xl py-6 flex flex-col items-center justify-center hover:border-[#f59e0b]/50 transition-all">
                      {isVideoUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
                          <span className="text-[8px] font-black text-white">COMPRESSING DETECTOR: {Math.round(videoUploadProgress)}%</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-zinc-700 group-hover:text-[#f59e0b] mb-1" />
                          <span className="text-[8px] font-black text-zinc-600 group-hover:text-[#f59e0b] uppercase tracking-widest">Add Video File</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        onChange={handleVideoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="video/*"
                        disabled={isVideoUploading}
                      />
                    </div>
                  </div>

                  {/* Right Column: Preview / Meta of Video */}
                  <div className="rounded-2xl bg-black border border-white/5 p-5 flex flex-col justify-center min-h-[160px]">
                    {formData.video ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-[#f59e0b] uppercase tracking-widest bg-[#f59e0b]/10 px-2 py-0.5 rounded">ACTIVE_VIDEO</span>
                          <button 
                            type="button" 
                            onClick={removeVideo}
                            className="text-red-500 hover:text-red-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                          >
                            ✕ Remove
                          </button>
                        </div>
                        
                        <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/5 relative">
                          <video 
                            src={formData.video} 
                            controls 
                            className="w-full h-full object-contain"
                            muted
                            playsInline
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="text-[8px] font-bold text-zinc-400 uppercase">Path: <span className="text-zinc-300 font-mono select-all font-normal">{formData.video}</span></div>
                          {videoMeta && (
                            <div className="text-[7px] text-zinc-500 font-mono leading-normal">
                              RAW_SIZE: {(videoMeta.originalSize / (1024 * 1024)).toFixed(2)}MB | COMPRESSED_SIZE: {(videoMeta.compressedSize / (1024 * 1024)).toFixed(2)}MB ({videoMeta.compressionRatio}% SHRUNK) | ELAPSED_TIME: {videoMeta.timeTaken}S
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6">
                        <Camera className="w-8 h-8 text-zinc-800 mb-2" />
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">No Video Uploaded</div>
                        <p className="text-[7px] text-zinc-600 uppercase font-black tracking-wider mt-1 max-w-[200px]">Video display triggers automatically on the dynamic scroll detail sheet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Manual Video Path Link (Direct URL)</label>
                  <input 
                    type="text"
                    value={formData.video || ''}
                    onChange={e => setFormData(prev => ({ ...prev, video: e.target.value }))}
                    placeholder="E.g. /uploads/videos/product_video.mp4"
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:border-[#f59e0b] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest border-l-2 border-[#f59e0b] pl-3">Customization Protocol</div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.isCustom || false}
                      onChange={e => setFormData({...formData, isCustom: e.target.checked})}
                      className="w-5 h-5 rounded border-white/10 bg-black text-[#f59e0b] focus:ring-[#f59e0b]"
                    />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Enable Customization</span>
                  </label>
                </div>

                {formData.isCustom && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Min Price (GH₵)</label>
                        <input 
                          type="number"
                          value={formData.priceRange?.min || 0}
                          onChange={e => setFormData({...formData, priceRange: { ...formData.priceRange!, min: Number(e.target.value) }})}
                          className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Max Price (GH₵)</label>
                        <input 
                          type="number"
                          value={formData.priceRange?.max || 0}
                          onChange={e => setFormData({...formData, priceRange: { ...formData.priceRange!, max: Number(e.target.value) }})}
                          className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-[#f59e0b] outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Customization Form Builder</label>
                      
                      <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text"
                            placeholder="Field Label"
                            value={newFieldName}
                            onChange={e => setNewFieldName(e.target.value)}
                            className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none"
                          />
                          <select 
                            value={newFieldType}
                            onChange={e => setNewFieldType(e.target.value as any)}
                            className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none"
                          >
                            <option value="text">Text Input</option>
                            <option value="select">Dropdown Select</option>
                            <option value="color">Color Picker</option>
                          </select>
                        </div>
                        
                        {newFieldType === 'select' && (
                          <input 
                            type="text"
                            placeholder="Options (comma separated)"
                            value={newFieldOptions}
                            onChange={e => setNewFieldOptions(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none"
                          />
                        )}

                        <button 
                          type="button"
                          onClick={addCustomField}
                          className="w-full py-3 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#f59e0b] hover:text-black transition-all"
                        >
                          Add Field to Form
                        </button>
                      </div>

                      <div className="space-y-2">
                        {formData.customizationFields?.map((field) => (
                          <div key={field.id} className="flex items-center justify-between bg-zinc-900/30 border border-white/5 px-6 py-4 rounded-2xl">
                            <div>
                              <span className="text-xs font-bold text-white uppercase">{field.label}</span>
                              <span className="ml-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest">[{field.type}]</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeCustomField(field.id)}
                              className="text-zinc-600 hover:text-red-500 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-l-2 border-zinc-700 pl-3">Design Intel</div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Dossier Snippet</label>
                <textarea 
                  rows={4}
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:border-[#f59e0b] transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Neural Tags</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedTag}
                    onChange={e => addTag(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-[10px] text-white focus:border-[#f59e0b] outline-none"
                  >
                    <option value="">SELECT_ADMIN_TAG...</option>
                    {adminTags.filter(t => !(formData.tags || []).includes(t.name)).map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map(tag => (
                    <span 
                      key={tag} 
                      onClick={() => removeTag(tag)}
                      className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-3 py-1 rounded-full text-[8px] font-black uppercase cursor-pointer hover:bg-red-500/20 hover:text-red-500 transition-all"
                    >
                      #{tag} ✕
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        <footer className="p-8 border-t border-white/5 flex flex-wrap gap-4 shrink-0">
          {product?.id && (
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="flex-1 py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <Trash2 className="w-4 h-4" />
              <span>Terminate_Entry</span>
            </button>
          )}
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
          >
            Abort_Sync
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving || isUploading}
            className="flex-[2] py-5 bg-[#f59e0b] text-black rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authorizing...</span>
              </>
            ) : 'Authorize_Uplink'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SupplierProductEditor;