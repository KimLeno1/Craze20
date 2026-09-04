import React, { useState, useEffect } from 'react';
import { Product, Gender } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Image as ImageIcon, Upload, Trash2, Plus, Loader2 } from 'lucide-react';

interface AdminProductEditorProps {
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

const AdminProductEditor: React.FC<AdminProductEditorProps> = ({ product, onSave, onCancel }) => {
  const [paletteTarget, setPaletteTarget] = useState<'MAIN' | 'SECONDARY'>('MAIN');
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    originalPrice: 0,
    shippingFee: 0,
    deliveryTime: '',
    images: [],
    category: '',
    gender: 'UNISEX',
    description: '',
    details: [],
    inStock: true,
    isNew: true,
    viewers: 0,
    stockCount: 0,
    isHallOfFame: false,
    synergyPath: '',
    appeal: '',
    brand: '',
    tags: [],
    sizes: [],
    colorVariants: [],
    isCustom: false,
    priceRange: { min: 0, max: 0 },
    customizationFields: [],
    supplierId: '',
    offeredDiscount: 0
  });

  const [detailInput, setDetailInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [variantMain, setVariantMain] = useState('');
  const [variantSecondary, setVariantSecondary] = useState('');
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  
  // Customization Field State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'select' | 'color'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoMeta, setVideoMeta] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [tags, categories, supplierList] = await Promise.all([
        databaseService.getTags(),
        databaseService.getCategories(),
        databaseService.getSuppliers()
      ]);
      setAllTags(tags);
      setAllCategories(categories);
      setSuppliers(supplierList);
    };
    fetchData();
    if (product) {
      setFormData({
        ...product,
        images: product.images || (product.image ? [product.image] : []),
        offeredDiscount: product.offeredDiscount || 0
      });
    }
  }, [product]);

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
        setFormData({
          ...formData,
          video: result.url
        });
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
    setFormData({
      ...formData,
      video: undefined
    });
    setVideoMeta(null);
    toast.success('Video removed successfully');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        try {
            const result: any = await databaseService.uploadProductImage(file, `${formData.name || 'unnamed'}-${i}`, (progress) => {
                setUploadProgress(((i + progress / 100) / fileList.length) * 100);
            });
            if (result.status === 'success' || result.url) {
                uploadedUrls.push(result.url);
            }
        } catch (error) {
            console.error('Upload failed for file:', file.name, error);
            toast.error(`Failed to upload ${file.name}`);
        }
    }

    if (uploadedUrls.length > 0) {
        const newImages = [...(formData.images || []), ...uploadedUrls];
        setFormData({ 
            ...formData, 
            images: newImages,
            image: formData.image || uploadedUrls[0] // Set first uploaded as main image if none exists
        });
        toast.success(`Uploaded ${uploadedUrls.length} images successfully`);
    }

    setIsUploading(false);
    setUploadProgress(100);
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ 
        ...formData, 
        images: newImages,
        image: index === 0 ? (newImages[0] || '') : formData.image 
    });
  };

  const setMainImage = (url: string) => {
    setFormData({ ...formData, image: url });
    toast.success('Main image updated');
  };

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

  const removeDetail = (index: number) => {
    const newDetails = [...(formData.details || [])];
    newDetails.splice(index, 1);
    setFormData({ ...formData, details: newDetails });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim().toUpperCase()] });
      setTagInput('');
    }
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

  return (
    <div className="fixed inset-0 z-[400] bg-white/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 overflow-y-auto">
      <div className="bg-white border border-zinc-200 w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
        <header className="p-8 border-b border-zinc-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-serif italic text-zinc-950">
              {product ? 'Modify Silhouette' : 'Register New Silhouette'}
            </h2>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Product Entry Modulation</p>
          </div>
          <button 
            onClick={onCancel}
            className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center hover:bg-red-50 transition-all text-zinc-400 hover:text-red-500 border border-zinc-100"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scrollbar-hide">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Primary Identity</div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Designation</label>
                <input 
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Midnight Cyber Cloak"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Available Price (GH₵)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price || 0}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Offered Discount (%)</label>
                  <input 
                    type="number"
                    value={formData.offeredDiscount || 0}
                    onChange={e => setFormData({...formData, offeredDiscount: Number(e.target.value)})}
                    placeholder="e.g. 20 (leave 0 for auto)"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Logistics (Shipping GH₵)</label>
                  <input 
                    type="number"
                    required
                    value={formData.shippingFee || 0}
                    onChange={e => setFormData({...formData, shippingFee: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Sector Allocation</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none appearance-none"
                  >
                    <option value="">Select Category</option>
                    {allCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Sex Protocol</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none appearance-none"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Delivery Time</label>
                  <input 
                    type="text"
                    value={formData.deliveryTime || ''}
                    onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                    placeholder="e.g. 3-5 Business Days"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Vault Brand</label>
                  <input 
                    type="text"
                    value={formData.brand || ''}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    placeholder="e.g., ARCHIVE STUDIOS"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Assigned Supplier</label>
                  <select 
                    value={formData.supplierId || ''}
                    onChange={e => setFormData({...formData, supplierId: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none appearance-none"
                  >
                    <option value="">No Supplier (Direct)</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Technical Intel</div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Dossier Description</label>
                <textarea 
                  rows={4}
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 focus:border-blue-600 transition-all outline-none resize-none placeholder:text-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Inventory Depth</label>
                    <input 
                      type="number"
                      value={formData.stockCount || 0}
                      onChange={e => setFormData({...formData, stockCount: Number(e.target.value)})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none"
                    />
                 </div>
                 <div className="space-y-2 pt-2">
                    <div className="pt-2 flex flex-wrap gap-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${formData.isHallOfFame ? 'bg-amber-500' : 'bg-zinc-100'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.isHallOfFame ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={formData.isHallOfFame || false}
                          onChange={e => setFormData({...formData, isHallOfFame: e.target.checked})}
                        />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Hall of Fame</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${formData.isNew ? 'bg-blue-600' : 'bg-zinc-100'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.isNew ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={formData.isNew || false}
                          onChange={e => setFormData({...formData, isNew: e.target.checked})}
                        />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">New Release</span>
                      </label>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Synergy Protocol Path</label>
                  <input 
                    type="text"
                    value={formData.synergyPath || ''}
                    onChange={e => setFormData({...formData, synergyPath: e.target.value})}
                    placeholder="e.g., #001 AESTHETIC SYNC"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Appeal Rating</label>
                  <input 
                    type="text"
                    value={formData.appeal || ''}
                    onChange={e => setFormData({...formData, appeal: e.target.value})}
                    placeholder="e.g., HIGH VELOCITY"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-300"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tags (Click to remove)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add Tag..."
                      className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-[8px] text-zinc-950 outline-none w-32 placeholder:text-zinc-300"
                    />
                    <button type="button" onClick={addTag} className="p-2 bg-zinc-100 rounded-xl hover:bg-blue-600 transition-all group">
                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-black rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                      #{tag}
                    </button>
                  ))}
                  {formData.tags?.length === 0 && <span className="text-[8px] text-zinc-300 italic">No tags associated</span>}
                </div>
                {allTags.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <label className="text-[7px] font-black text-zinc-300 uppercase tracking-widest">Global Archive Suggestions</label>
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.filter(t => !formData.tags?.includes(t.name.toUpperCase())).slice(0, 10).map(tag => (
                        <button 
                          key={tag.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, tags: [...(formData.tags || []), tag.name.toUpperCase()] })}
                          className="px-2 py-1 bg-zinc-50 text-zinc-400 text-[6px] font-black rounded hover:bg-zinc-100 hover:text-zinc-600 transition-all uppercase border border-zinc-100"
                        >
                          +{tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Sizes (e.g. XL, 42)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={sizeInput}
                      onChange={e => setSizeInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                      placeholder="Add Size..."
                      className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-[8px] text-zinc-950 outline-none w-32 placeholder:text-zinc-300"
                    />
                    <button type="button" onClick={addSize} className="p-2 bg-zinc-100 rounded-xl hover:bg-blue-600 transition-all group">
                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes?.map(size => (
                    <button 
                      key={size}
                      type="button"
                      onClick={() => removeSize(size)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 text-zinc-950 text-[8px] font-black rounded-lg hover:border-red-500 hover:text-red-500 transition-all shadow-sm"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Available Colours (Main-Secondary Variants)</label>
                <div className="flex flex-col gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-3xl">
                  {/* Target input selector */}
                  <div className="flex justify-between items-center bg-zinc-100/50 rounded-xl p-1 border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setPaletteTarget('MAIN')}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        paletteTarget === 'MAIN' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      Target: Main ({variantMain || 'Empty'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaletteTarget('SECONDARY')}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        paletteTarget === 'SECONDARY' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      Target: Secondary ({variantSecondary || 'Empty'})
                    </button>
                  </div>

                  {/* Preset Swatches Palette */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Quick Color Range Picker</span>
                    <div className="grid grid-cols-5 gap-1.5 p-2 bg-white rounded-xl max-h-32 overflow-y-auto border border-zinc-200 custom-scrollbar">
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
                          className="group relative flex flex-col items-center justify-center p-1 rounded-lg hover:bg-zinc-100 transition-all"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border border-zinc-200 transition-all ${
                              (paletteTarget === 'MAIN' && variantMain === preset.hex) ||
                              (paletteTarget === 'SECONDARY' && variantSecondary === preset.hex)
                                ? 'scale-110 border-blue-600 ring-2 ring-blue-600/20'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="text-[6px] text-zinc-400 group-hover:text-zinc-600 truncate max-w-[40px] text-center mt-0.5 font-bold uppercase">
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
                      className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-[10px] text-zinc-950 outline-none placeholder:text-zinc-300"
                    />
                    <input 
                      type="text"
                      value={variantSecondary}
                      onChange={e => setVariantSecondary(e.target.value)}
                      placeholder="SECONDARY COLOUR..."
                      className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-[10px] text-zinc-950 outline-none placeholder:text-zinc-300"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addColorVariant} 
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                  >
                    DEPLOY VARIANT NODE
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {formData.colorVariants?.map((variant, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => removeColorVariant(idx)}
                      className="group relative flex items-center justify-between bg-white border border-zinc-200 p-4 rounded-2xl cursor-pointer hover:border-red-500/50 transition-all overflow-hidden shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full border border-white shadow-md z-20" style={{ backgroundColor: variant.main }} />
                          <div className="w-6 h-6 rounded-full border border-white shadow-md z-10" style={{ backgroundColor: variant.secondary }} />
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-tight">
                          <span className="text-zinc-400">{variant.main}</span>
                          <span className="mx-1 text-zinc-300">/</span>
                          <span className="text-blue-600">{variant.secondary}</span>
                        </div>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">✕</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Visual Assets (Multi-Upload Support)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formData.images?.map((img, idx) => (
                    <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-200 group shadow-sm">
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setMainImage(img)}
                          className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest transition-all ${formData.image === img ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950'}`}
                        >
                          {formData.image === img ? 'Main Cover' : 'Set Main'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="aspect-[3/4] rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 flex flex-col items-center justify-center relative group cursor-pointer hover:border-blue-600/50 hover:bg-blue-50/10 transition-all">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-[7px] font-black text-zinc-950">{Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-zinc-300 group-hover:text-blue-600 mb-2" />
                        <span className="text-[8px] font-black text-zinc-400 group-hover:text-blue-600 uppercase tracking-widest text-center px-4">Add Images</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      disabled={isUploading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Manual Image Entry (JSON Array or URL)</label>
                  <input 
                    type="text"
                    value={typeof formData.images === 'string' ? formData.images : JSON.stringify(formData.images)}
                    onChange={e => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            if (Array.isArray(parsed)) {
                                setFormData({ ...formData, images: parsed, image: formData.image || parsed[0] });
                            }
                        } catch (err) {
                            // If not JSON, treat as single additional image
                            const url = e.target.value;
                            if (url && !formData.images?.includes(url)) {
                                setFormData({ ...formData, images: [...(formData.images || []), url], image: formData.image || url });
                            }
                        }
                    }}
                    placeholder='["url1", "url2"]'
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-xs text-zinc-950 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-200"
                  />
                  <p className="text-[7px] text-zinc-400 uppercase font-black tracking-widest">Supports multiple file selection. First image typically serves as primary silhouette cover.</p>
                </div>
              </div>

              {/* Product video section */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Product Showcase Video (With Auto-Compression)</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Video upload box */}
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5 flex flex-col justify-between min-h-[160px]">
                    <div className="space-y-2">
                      <div className="text-zinc-950 text-xs font-black uppercase tracking-widest">Upload Video Link / File</div>
                      <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider leading-relaxed">
                        Suppliers and Admins can upload MP4, WebM, MOV, and basic videos. Videos are compressed server-side to optimal H.264 profiles to preserve viewport frame-rates while maintaining pristine visual quality.
                      </p>
                    </div>

                    <div className="relative group cursor-pointer border border-dashed border-zinc-200 rounded-xl py-6 flex flex-col items-center justify-center hover:border-blue-600/50 hover:bg-blue-50/10 transition-all">
                      {isVideoUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-[8px] font-black text-zinc-950">COMPRESSING: {Math.round(videoUploadProgress)}%</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-zinc-300 group-hover:text-blue-600 mb-1" />
                          <span className="text-[8px] font-black text-zinc-400 group-hover:text-blue-600 uppercase tracking-widest">Add Video File</span>
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
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5 flex flex-col justify-center min-h-[160px]">
                    {formData.video ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">ACTIVE VIDEO</span>
                          <button 
                            type="button" 
                            onClick={removeVideo}
                            className="text-red-500 hover:text-red-600 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" /> Remove
                          </button>
                        </div>
                        
                        <div className="aspect-video rounded-xl overflow-hidden bg-white border border-zinc-200 relative shadow-sm">
                          <video 
                            src={formData.video} 
                            controls 
                            className="w-full h-full object-contain"
                            muted
                            playsInline
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="text-[8px] font-bold text-zinc-400 uppercase">Path: <span className="text-zinc-500 font-mono select-all font-normal">{formData.video}</span></div>
                          {videoMeta && (
                            <div className="text-[7px] text-zinc-400 font-mono leading-normal">
                              RAW_SIZE: {(videoMeta.originalSize / (1024 * 1024)).toFixed(2)}MB | COMPRESSED_SIZE: {(videoMeta.compressedSize / (1024 * 1024)).toFixed(2)}MB ({videoMeta.compressionRatio}% SHRUNK) | ELAPSED_TIME: {videoMeta.timeTaken}S
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6">
                        <ImageIcon className="w-8 h-8 text-zinc-200 mb-2" />
                        <div className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">No Video Uploaded</div>
                        <p className="text-[7px] text-zinc-400 uppercase font-black tracking-wider mt-1 max-w-[200px]">Video display triggers automatically on the dynamic scroll detail sheet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Manual Video Path Link (Direct URL)</label>
                  <input 
                    type="text"
                    value={formData.video || ''}
                    onChange={e => setFormData({ ...formData, video: e.target.value || undefined })}
                    placeholder="E.g. /uploads/videos/product_video.mp4"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-xs text-zinc-950 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-200"
                  />
                </div>
              </div>

              {/* Custom Product Configuration */}
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Customization Protocol</div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${formData.isCustom ? 'bg-blue-600' : 'bg-zinc-100'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.isCustom ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <input 
                      type="checkbox"
                      className="hidden"
                      checked={formData.isCustom || false}
                      onChange={e => setFormData({...formData, isCustom: e.target.checked})}
                    />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Enable Customization</span>
                  </label>
                </div>

                {formData.isCustom && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Min Custom Price (GH₵)</label>
                        <input 
                          type="number"
                          value={formData.priceRange?.min || 0}
                          onChange={e => setFormData({...formData, priceRange: { ...formData.priceRange!, min: Number(e.target.value) }})}
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Max Custom Price (GH₵)</label>
                        <input 
                          type="number"
                          value={formData.priceRange?.max || 0}
                          onChange={e => setFormData({...formData, priceRange: { ...formData.priceRange!, max: Number(e.target.value) }})}
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm text-zinc-950 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-zinc-50 border border-zinc-100 rounded-3xl">
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Add Modification Field</div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <input 
                          type="text"
                          value={newFieldName}
                          onChange={e => setNewFieldName(e.target.value)}
                          placeholder="Field Label (e.g. Back Text)"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-950 outline-none"
                        />
                        <select
                          value={newFieldType}
                          onChange={e => setNewFieldType(e.target.value as any)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-950 outline-none"
                        >
                          <option value="text">Text Input</option>
                          <option value="select">Selection List</option>
                          <option value="color">Color Swatch</option>
                        </select>
                        <button 
                          type="button"
                          onClick={addCustomField}
                          className="w-full bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-700 transition-all"
                        >
                          Add Field Node
                        </button>
                      </div>
                      {newFieldType === 'select' && (
                        <input 
                          type="text"
                          value={newFieldOptions}
                          onChange={e => setNewFieldOptions(e.target.value)}
                          placeholder="Options (comma separated: Red, Blue, Green)"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-950 outline-none mt-2"
                        />
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      {formData.customizationFields?.map((field) => (
                        <div key={field.id} className="flex items-center justify-between bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
                          <div>
                            <div className="text-[10px] font-black text-zinc-950 uppercase">{field.label}</div>
                            <div className="text-[7px] font-black text-blue-600 uppercase tracking-widest">{field.type} Protocol</div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeCustomField(field.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <footer className="p-8 border-t border-zinc-100 flex flex-wrap gap-4 shrink-0 bg-white">
          {product?.id && (
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="flex-1 py-5 bg-red-50 text-red-500 border border-red-100 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Terminate Entry</span>
            </button>
          )}
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:text-zinc-950 transition-all border border-zinc-200"
          >
            Abort Changes
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving || isUploading}
            aria-busy={isSaving}
            aria-label={product ? "Save changes to product" : "Create new product"}
            className="flex-[2] py-5 bg-zinc-950 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Synchronizing...</span>
              </>
            ) : 'Finalize Entry'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminProductEditor;