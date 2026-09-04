import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Trash2, Plus, Image as ImageIcon, Edit2, X } from 'lucide-react';
import { CategoryInfo } from '../types';
import { toast } from 'sonner';

const AdminTagCategoryManager: React.FC = () => {
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', heroImage: '', inspiration: '' });
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedTags, fetchedCategories] = await Promise.all([
        databaseService.getTags(),
        databaseService.getCategories()
      ]);
      setTags(fetchedTags);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag) return;
    await databaseService.addTag(newTag);
    setNewTag('');
    fetchData();
  };

  const handleDeleteTag = async (id: string) => {
    await databaseService.deleteTag(id);
    fetchData();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await databaseService.uploadCategoryImage(file);
      if (result.url) {
        if (isEditing && editingCategory) {
          setEditingCategory({ ...editingCategory, heroImage: result.url });
        } else {
          setNewCategory({ ...newCategory, heroImage: result.url });
        }
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    await databaseService.addCategory(newCategory);
    setNewCategory({ name: '', heroImage: '', inspiration: '' });
    fetchData();
    toast.success('Category created');
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    await databaseService.updateCategory(editingCategory.id, editingCategory);
    setEditingCategory(null);
    fetchData();
    toast.success('Category updated');
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await databaseService.deleteCategory(id);
      fetchData();
      toast.success('Category deleted');
    }
  };

  return (
    <div className="p-8 space-y-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif italic text-white">System Taxonomy</h2>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Manage Tags & Dynamic Categories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Tags Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-serif italic text-white">Tags</h3>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-grow glass-light border border-white/10 p-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#00D1FF] transition-all"
              placeholder="New Tag Identity"
            />
            <button onClick={handleAddTag} className="p-4 bg-white text-black rounded-2xl hover:bg-[#00D1FF] hover:text-white transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tags.map(tag => (
              <div key={tag.id} className="flex justify-between items-center p-4 glass-grey border border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{tag.name}</span>
                <button onClick={() => handleDeleteTag(tag.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-serif italic text-white">Categories</h3>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>

          {/* New Category Form */}
          <div className="glass-light border border-white/10 p-6 rounded-[2.5rem] space-y-4">
            <div className="text-[8px] font-black text-[#00D1FF] uppercase tracking-widest">Initialize New Category</div>
            <div className="space-y-4">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full glass-light border border-white/5 p-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#00D1FF]"
                placeholder="Category Name"
              />
              <textarea
                value={newCategory.inspiration}
                onChange={(e) => setNewCategory({ ...newCategory, inspiration: e.target.value })}
                className="w-full glass-light border border-white/5 p-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#00D1FF] min-h-[80px]"
                placeholder="Category Inspiration Text"
              />
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl glass-grey border border-white/5 overflow-hidden flex items-center justify-center relative group">
                  {newCategory.heroImage ? (
                    <img src={newCategory.heroImage} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-700" />
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => handleImageUpload(e)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black uppercase">Upload</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Hero Image</div>
                  <p className="text-[7px] text-zinc-600 uppercase leading-relaxed">This image will appear as the background for the category landing page.</p>
                </div>
              </div>
              <button 
                onClick={handleAddCategory} 
                disabled={isUploading || !newCategory.name}
                className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00D1FF] hover:text-white transition-all disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Create Category Protocol'}
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className="glass-grey border border-white/5 p-4 rounded-[2rem] flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden glass-light border border-white/5">
                    {category.heroImage && <img src={category.heroImage} className="w-full h-full object-cover" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black text-white uppercase tracking-widest">{category.name}</div>
                    <div className="text-[7px] text-zinc-500 uppercase tracking-widest truncate max-w-[200px]">{category.inspiration || 'No inspiration set'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setEditingCategory(category);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="p-2 text-zinc-600 hover:text-[#00D1FF] transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingCategory(null)}></div>
          <div className="relative w-full max-w-lg glass-blue border border-white/10 p-8 rounded-[3rem] space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif italic text-white">Edit Category</h3>
              <button onClick={() => setEditingCategory(null)} className="p-2 hover:glass-light rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full glass-light border border-white/5 p-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#00D1FF]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Inspiration Text</label>
                <textarea
                  value={editingCategory.inspiration}
                  onChange={(e) => setEditingCategory({ ...editingCategory, inspiration: e.target.value })}
                  className="w-full glass-light border border-white/5 p-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#00D1FF] min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Hero Image</label>
                <div className="w-full h-40 rounded-2xl glass-grey border border-white/5 overflow-hidden relative group">
                  {editingCategory.heroImage ? (
                    <img src={editingCategory.heroImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-zinc-700" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => handleImageUpload(e, true)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase">Change Image</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleUpdateCategory}
                disabled={isUploading}
                className="w-full py-5 bg-[#00D1FF] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#00D1FF]/20"
              >
                {isUploading ? 'Uploading...' : 'Update Category Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTagCategoryManager;
