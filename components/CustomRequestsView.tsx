import React, { useState, useEffect } from 'react';
import { Product, ViewState } from '../types';
import { databaseService } from '../services/databaseService';
import { Sparkles, ArrowLeft, Send, CheckCircle2, Clock, XCircle, ChevronRight, HelpCircle } from 'lucide-react';

interface CustomRequestsViewProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onNavigate: (view: ViewState) => void;
  userId: string;
}

interface CustomRequest {
  id: string;
  userId: string;
  userHandle: string;
  email: string;
  itemName: string;
  category: string;
  budget: number;
  description: string;
  referenceImage: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PRODUCTION' | 'SHIPPED' | 'COMPLETED';
  timestamp: string;
  adminNotes?: string;
}

const CustomRequestsView: React.FC<CustomRequestsViewProps> = ({ 
  products, 
  onProductClick, 
  onNavigate,
  userId
}) => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(''); // Stores the phone contact number
  const [referenceImage, setReferenceImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Filter products that can be customized (isCustom = 1)
  const customizableProducts = products.filter(p => p.isCustom);

  useEffect(() => {
    fetchRequests();
    // Pre-fill user details if logged in
    const userPhone = localStorage.getItem('cc-user-phone') || '';
    if (userPhone) {
      setEmail(userPhone);
    }
  }, [userId]);

  const fetchRequests = async () => {
    if (!userId || userId === 'guest') return;
    setIsLoading(true);
    try {
      const list = await databaseService.getCustomRequests();
      setRequests(list);
    } catch (err) {
      console.error('Error fetching custom requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;

    setIsSubmitting(true);
    try {
      const handle = localStorage.getItem('cc-user-handle') || 'Guest';
      const uid = localStorage.getItem('cc-user-id') || userId || 'guest';

      await databaseService.submitCustomRequest({
        userId: uid,
        userHandle: handle,
        email,
        itemName,
        category: category || 'Uncategorized',
        budget: budget ? parseFloat(budget) : 0,
        description,
        referenceImage
      });

      setSuccessMessage('Your custom request has been submitted successfully! Our expert designers will review your details shortly.');
      
      // Reset form
      setItemName('');
      setCategory('');
      setBudget('');
      setDescription('');
      setReferenceImage('');
      
      // Refresh requests list
      fetchRequests();

      setTimeout(() => {
        setShowFormModal(false);
        setSuccessMessage('');
      }, 3500);

    } catch (err) {
      console.error('Failed to submit custom request:', err);
      alert('Failed to submit custom request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'border-green-500/50 bg-green-500/10 text-green-400';
      case 'REJECTED':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'IN_PRODUCTION':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'SHIPPED':
        return 'border-[#0F52BA]/50 bg-[#0F52BA]/10 text-blue-500';
      case 'COMPLETED':
        return 'border-emerald-400 bg-emerald-500/10 text-emerald-400';
      default:
        return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'REJECTED':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5 animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-black pb-32 animate-in fade-in duration-500">
      {/* Top Banner and Navigation */}
      <header className="py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-20 border-b border-black/5 bg-gradient-to-b from-[#0F52BA]/5 to-transparent">
        <div className="max-w-7xl mx-auto space-y-6">
          <button 
            onClick={() => onNavigate(ViewState.LOBBY)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-[#0F52BA] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Lobby
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-[#0F52BA] text-[8px] font-black text-white uppercase tracking-[0.4em] rounded shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Custom Workshop
              </div>
              <div className="h-px w-20 bg-black/10"></div>
            </div>

            <h1 className="text-4xl md:text-7xl font-serif italic tracking-tighter leading-none">
              Custom <span className="text-[#0F52BA] not-italic font-sans font-black">Requests</span>
            </h1>

            <p className="text-zinc-600 text-xs md:text-sm max-w-2xl leading-relaxed">
              Welcome to Custom Requests! This atelier service is designed to help you bring bespoke silhouettes and custom tailored pieces to life. Browse customizable foundations or commission an original design.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setShowFormModal(true)}
                className="px-6 py-3 bg-[#0F52BA] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0B132B] hover:scale-105 transition-all duration-300 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" /> Request Custom Item
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-20 py-6 sm:py-8 space-y-12">
        {/* Section 1: Customizable Base items */}
        <section className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-black/5 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-serif italic text-black">Customizable Items</h2>
              <p className="text-[9px] text-zinc-500 font-black tracking-widest uppercase mt-1">Choose an item below to customize it with your own sizes and details</p>
            </div>
          </div>

          {customizableProducts.length === 0 ? (
            <div className="text-center py-16 bg-zinc-50 border border-zinc-200 rounded-3xl p-10">
              <HelpCircle className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
              <p className="text-sm font-serif italic text-zinc-600">No customizable clothes found.</p>
              <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mt-1">Use the "Request Custom Item" button to ask for a custom item from scratch!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {customizableProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => onProductClick(product)}
                  className="group bg-white border border-zinc-200 rounded-3xl overflow-hidden cursor-pointer hover:border-[#0F52BA]/50 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/95 rounded-full text-[8px] font-black text-[#0F52BA] uppercase tracking-widest border border-zinc-200 shadow-sm">
                      Custom Ready
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{product.category}</div>
                    <h3 className="text-xs font-bold text-zinc-900 group-hover:text-[#0F52BA] transition-colors">{product.name}</h3>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-mono font-black text-zinc-900">GHS {product.price.toFixed(2)}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#0F52BA] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Tailor It <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: User requests history */}
        {userId && userId !== 'guest' && (
          <section className="space-y-6">
            <div className="border-b border-black/5 pb-4">
              <h2 className="text-xl md:text-2xl font-serif italic text-black">Your Custom Requests</h2>
              <p className="text-[9px] text-zinc-500 font-black tracking-widest uppercase mt-1">Track the details and status of your custom requests here</p>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-zinc-50 p-6 rounded-3xl border border-zinc-200 h-32"></div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-zinc-50 border border-zinc-200 rounded-3xl p-10 text-zinc-500">
                <Clock className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
                <p className="text-sm font-serif italic text-zinc-600">Your request board is empty.</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">Any custom requests you make will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {requests.map(req => (
                  <div 
                    key={req.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 p-6 rounded-3xl flex flex-col md:flex-row gap-6 justify-between transition-all shadow-xs"
                  >
                    <div className="flex-1 space-y-4">
                      {/* Header metadata */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[9px] font-mono text-zinc-500">{new Date(req.timestamp).toLocaleDateString()}</span>
                        <span className="text-[8px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-black uppercase tracking-widest">{req.category}</span>
                        {req.budget > 0 && (
                          <span className="text-[9px] font-mono font-black text-[#0F52BA]">Target Budget: GHS {req.budget.toFixed(2)}</span>
                        )}
                        <span className={`text-[8px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${getStatusStyle(req.status)}`}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </span>
                      </div>

                      {/* Request Info */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{req.itemName}</h4>
                        <p className="text-xs text-zinc-600 mt-1 font-mono whitespace-pre-wrap leading-relaxed">{req.description}</p>
                      </div>

                      {/* Admin Notes */}
                      {req.adminNotes && (
                        <div className="border-t border-zinc-100 pt-3 mt-3">
                          <div className="text-[8px] font-black uppercase tracking-widest text-[#0F52BA] mb-1">Tailor / Workshop Response</div>
                          <p className="text-xs italic text-zinc-700 pl-3 border-l-2 border-[#0F52BA]/40">{req.adminNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Image preview if exists */}
                    {req.referenceImage && (
                      <div className="w-full md:w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                        <img 
                          src={req.referenceImage} 
                          alt="Bespoke Reference"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If load fails, hide or show fallback
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Form Dialog Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
          <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-xl font-serif italic text-zinc-900">Custom Clothes Request Form</h3>
                <p className="text-[8px] text-zinc-500 font-black tracking-widest uppercase">Tell us about the item you couldn't find or the design you want us to make</p>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {successMessage ? (
              <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="text-md font-bold text-zinc-900">Request Submitted!</h4>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">What is the item name? *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Leather jacket or tailored evening dress" 
                      value={itemName}
                      onChange={e => setItemName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-900 focus:border-[#0F52BA] outline-none rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Category *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Jacket, Tops, Dress" 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-900 focus:border-[#0F52BA] outline-none rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Target Budget (GHS)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 750" 
                        value={budget}
                        onChange={e => setBudget(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-900 focus:border-[#0F52BA] outline-none rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Your Phone Number *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +233 24 123 4567" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-900 focus:border-[#0F52BA] outline-none rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Upload Reference Picture (Optional)</label>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setIsUploading(true);
                          setUploadError('');
                          try {
                            const res = await databaseService.uploadFeedImage(file);
                            if (res && res.url) {
                              setReferenceImage(res.url);
                            } else {
                              setUploadError('Failed to upload picture. Please try again.');
                            }
                          } catch (err) {
                            console.error('Error uploading picture:', err);
                            setUploadError('Failed to upload. Make sure it is an image file.');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-700 focus:border-[#0F52BA] outline-none rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#0F52BA]/10 file:text-[#0F52BA] hover:file:bg-[#0F52BA]/20"
                      />
                      {isUploading && <p className="text-[10px] text-zinc-500 animate-pulse">Uploading your picture...</p>}
                      {uploadError && <p className="text-[10px] text-red-500">{uploadError}</p>}
                      {referenceImage && (
                        <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
                          <img src={referenceImage} alt="Uploaded reference" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setReferenceImage('')}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                            title="Remove picture"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Describe your design and size *</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Please tell us the style, material, colors, and your sizes or measurements." 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-900 focus:border-[#0F52BA] outline-none rounded-xl font-mono leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#0F52BA] text-white hover:bg-[#0B132B] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomRequestsView;
