import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Zap, Plus, Trash2, Edit, Save, X, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FlashSaleEvent {
  id: string;
  title: string;
  category: string;
  tagline: string;
  status: 'LIVE' | 'CLOSING_SOON' | 'UPCOMING' | 'SCHEDULED';
  discountLabel: string;
  code: string;
  claimedPercent: number;
  remainingSlots: number;
  perks: string[];
  timeRemaining?: string;
  startsAt?: string;
  description: string;
  targetCategory?: string;
}

const DEFAULT_FLASH_EVENTS: FlashSaleEvent[] = [
  {
    id: 'event-haute',
    title: 'Haute Tailoring & Silk Event',
    category: 'Tailoring & Formalwear',
    tagline: 'Precision Italian cuts, structured blazers & evening silk silhouettes',
    status: 'LIVE',
    discountLabel: '45% OFF',
    code: 'HAUTE45',
    claimedPercent: 84,
    remainingSlots: 16,
    perks: ['Complimentary Silk Dust Bag', 'Express Courier Across Ghana', 'Hand-Tailored Alteration Guide'],
    startsAt: 'Tonight at 20:00 GMT',
    description: 'A strictly limited flash privilege applied to Italian double-breasted wool blazers, silk charmeuse pieces, and structured formalwear.',
    targetCategory: 'Tailoring'
  },
  {
    id: 'event-leather',
    title: 'Archival Footwear & Leather Blitz',
    category: 'Footwear & Fine Leather',
    tagline: 'Handcrafted calfskin Chelsea boots, Belgian loafers & luxury leather totes',
    status: 'CLOSING_SOON',
    discountLabel: '35% OFF',
    code: 'LEATHER35',
    claimedPercent: 92,
    remainingSlots: 8,
    perks: ['12-Point RFID Authentication', 'Natural Cedar Shoe Trees Included', 'Waterproof Leather Conditioning'],
    startsAt: 'Final 8 Allocations',
    description: 'Artisanal footwear and full-grain leather bags crafted by legacy European tanneries. Zero restocks once current reserve is claimed.',
    targetCategory: 'Footwear'
  },
  {
    id: 'event-midnight',
    title: 'Midnight Architectural Silhouettes',
    category: 'Contemporary High Fashion',
    tagline: 'Monochromatic draped overcoats, fluid trousers & structured modern lines',
    status: 'UPCOMING',
    discountLabel: 'GH₵100 VOUCHER',
    code: 'MIDNIGHT100',
    claimedPercent: 45,
    remainingSlots: 35,
    perks: ['Priority Dispatch Queue', 'VIP Style Concierge Consultation', 'Archival Lookbook Print'],
    startsAt: 'Tonight at 20:00 GMT',
    description: 'An exclusive 120-minute nighttime surge featuring cutting-edge architectural outerwear and fluid monochromatic staples.',
    targetCategory: 'Outerwear'
  },
  {
    id: 'event-cashmere',
    title: 'Weekend Cashmere & Fine Knitwear Surge',
    category: 'Knitwear & Luxury Fibers',
    tagline: 'Pure Grade-A Mongolian cashmere sweaters, merino turtlenecks & textured knits',
    status: 'SCHEDULED',
    discountLabel: 'BOGO 50% OFF',
    code: 'CASHMERE50',
    claimedPercent: 20,
    remainingSlots: 50,
    perks: ['Cashmere Care Comb Included', 'Breathable Moth-Proof Storage Pouch', 'Complimentary Fiber Refresh Guide'],
    startsAt: 'This Saturday at 18:00 GMT',
    description: 'The pinnacle of tactile luxury. Acquire synchronized fine knitwear with a 50% second-item flash courtesy privilege.',
    targetCategory: 'Knitwear'
  }
];

const AdminFlashSaleManager: React.FC = () => {
  const [events, setEvents] = useState<FlashSaleEvent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    tagline: string;
    status: 'LIVE' | 'CLOSING_SOON' | 'UPCOMING' | 'SCHEDULED';
    discountLabel: string;
    code: string;
    claimedPercent: number;
    remainingSlots: number;
    perks: string;
    startsAt: string;
    description: string;
    targetCategory: string;
  }>({
    title: '',
    category: '',
    tagline: '',
    status: 'LIVE',
    discountLabel: '',
    code: '',
    claimedPercent: 50,
    remainingSlots: 50,
    perks: '',
    startsAt: '',
    description: '',
    targetCategory: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await databaseService.getSetting<FlashSaleEvent[]>('flash_sale_events');
      if (data && Array.isArray(data)) {
        setEvents(data);
      } else {
        // Seed default events if not present
        setEvents(DEFAULT_FLASH_EVENTS);
        await databaseService.saveSetting('flash_sale_events', DEFAULT_FLASH_EVENTS);
      }
    } catch (error) {
      console.error('Fetch flash events error:', error);
      toast.error('Failed to fetch flash events from backend.');
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPerks = formData.perks
        ? formData.perks.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      let updatedEvents: FlashSaleEvent[];

      if (editingEventId) {
        // Update existing event
        updatedEvents = events.map(ev => {
          if (ev.id === editingEventId) {
            return {
              ...ev,
              title: formData.title,
              category: formData.category,
              tagline: formData.tagline,
              status: formData.status,
              discountLabel: formData.discountLabel,
              code: formData.code.toUpperCase(),
              claimedPercent: Number(formData.claimedPercent),
              remainingSlots: Number(formData.remainingSlots),
              perks: parsedPerks,
              startsAt: formData.startsAt,
              description: formData.description,
              targetCategory: formData.targetCategory
            };
          }
          return ev;
        });
        toast.success('Flash Sale event updated successfully!');
      } else {
        // Create new event
        const newEvent: FlashSaleEvent = {
          id: `flash_event_${Date.now()}`,
          title: formData.title,
          category: formData.category,
          tagline: formData.tagline,
          status: formData.status,
          discountLabel: formData.discountLabel,
          code: formData.code.toUpperCase(),
          claimedPercent: Number(formData.claimedPercent),
          remainingSlots: Number(formData.remainingSlots),
          perks: parsedPerks,
          startsAt: formData.startsAt,
          description: formData.description,
          targetCategory: formData.targetCategory
        };
        updatedEvents = [...events, newEvent];
        toast.success('Flash Sale event created successfully!');
      }

      await databaseService.saveSetting('flash_sale_events', updatedEvents);
      setEvents(updatedEvents);
      resetForm();
    } catch (error) {
      console.error('Save flash event error:', error);
      toast.error('Failed to save flash sale event.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Flash Sale Event?')) {
      return;
    }
    try {
      const updatedEvents = events.filter(ev => ev.id !== id);
      await databaseService.saveSetting('flash_sale_events', updatedEvents);
      setEvents(updatedEvents);
      toast.success('Flash Sale event deleted!');
    } catch (error) {
      console.error('Delete flash event error:', error);
      toast.error('Failed to delete flash event.');
    }
  };

  const handleEditClick = (ev: FlashSaleEvent) => {
    setEditingEventId(ev.id);
    setFormData({
      title: ev.title,
      category: ev.category,
      tagline: ev.tagline,
      status: ev.status,
      discountLabel: ev.discountLabel,
      code: ev.code,
      claimedPercent: ev.claimedPercent,
      remainingSlots: ev.remainingSlots,
      perks: ev.perks.join(', '),
      startsAt: ev.startsAt || '',
      description: ev.description,
      targetCategory: ev.targetCategory || ''
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingEventId(null);
    setFormData({
      title: '',
      category: '',
      tagline: '',
      status: 'LIVE',
      discountLabel: '',
      code: '',
      claimedPercent: 50,
      remainingSlots: 50,
      perks: '',
      startsAt: '',
      description: '',
      targetCategory: ''
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-white flex items-center gap-4">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
            Flash Sale Events
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">
            Configure dynamic limited-time privilege drops & vouchers
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-white text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0F52BA] hover:text-white active:bg-blue-800 transition-all shadow-xl flex items-center gap-3"
        >
          <Plus className="w-4 h-4" />
          Create Flash Event
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 space-y-8 shadow-2xl my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-serif italic text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                  {editingEventId ? 'Edit Flash Event' : 'New Flash Event'}
                </h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Configure real-time scarcity, custom codes, and privileges
                </p>
              </div>
              <button onClick={resetForm} className="text-zinc-400 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Event Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                    placeholder="e.g. Silk Evening Gown Exclusive"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Collection Tag / Banner</label>
                  <input 
                    type="text" 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                    placeholder="e.g. Tailoring & Formalwear"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Tagline</label>
                <input 
                  type="text" 
                  required
                  value={formData.tagline}
                  onChange={e => setFormData({...formData, tagline: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                  placeholder="e.g. Precision double-breasted blazers & Italian premium silks"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                  >
                    <option value="LIVE">🟢 LIVE NOW</option>
                    <option value="CLOSING_SOON">🔥 CLOSING SOON</option>
                    <option value="UPCOMING">🔵 UPCOMING WAVE</option>
                    <option value="SCHEDULED">📅 SCHEDULED</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Privilege Code</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                    placeholder="e.g. SILK45"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Discount Label</label>
                  <input 
                    type="text" 
                    required
                    value={formData.discountLabel}
                    onChange={e => setFormData({...formData, discountLabel: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                    placeholder="e.g. 45% OFF or GH₵100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Target Category Filter</label>
                  <input 
                    type="text" 
                    value={formData.targetCategory}
                    onChange={e => setFormData({...formData, targetCategory: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                    placeholder="e.g. Tailoring, Footwear"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Claims Percent (%)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    max={100}
                    value={formData.claimedPercent}
                    onChange={e => setFormData({...formData, claimedPercent: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Remaining Slots</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={formData.remainingSlots}
                    onChange={e => setFormData({...formData, remainingSlots: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Starts At / Time Remaining Caption</label>
                <input 
                  type="text" 
                  value={formData.startsAt}
                  onChange={e => setFormData({...formData, startsAt: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                  placeholder="e.g. Tonight at 20:00 GMT"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none resize-none"
                  placeholder="Bespoke luxury blazers with hand-finished Italian trims."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Perks (Comma separated)</label>
                <input 
                  type="text" 
                  value={formData.perks}
                  onChange={e => setFormData({...formData, perks: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 p-4 rounded-2xl text-xs font-bold text-white outline-none"
                  placeholder="Complimentary Silk Bag, Express Delivery across Ghana, Authenticated Certificate"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-[#0F52BA] hover:text-white flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid List of Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(ev => (
          <div key={ev.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-8 rounded-[2.5rem] transition-all group relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  ev.status === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                  ev.status === 'CLOSING_SOON' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' :
                  'bg-blue-950 text-blue-400 border border-blue-500/20'
                }`}>
                  {ev.status}
                </span>
                <h3 className="text-2xl font-black text-white mt-3 tracking-tighter">{ev.title}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{ev.category}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditClick(ev)}
                  className="p-2 bg-zinc-800 hover:bg-amber-500 hover:text-white text-zinc-400 rounded-xl transition-all"
                  title="Edit Campaign"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-2 bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 rounded-xl transition-all"
                  title="Delete Campaign"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">{ev.description}</p>

            <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Voucher Code:</span>
                <span className="font-bold text-[#C5A880] tracking-widest">{ev.code}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Privilege Markdown:</span>
                <span className="font-bold text-white">{ev.discountLabel}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Claim Rate / Remaining:</span>
                <span className="font-bold text-emerald-400">{ev.claimedPercent}% ({ev.remainingSlots} left)</span>
              </div>
              {ev.startsAt && (
                <div className="flex justify-between text-zinc-400">
                  <span>Starts At:</span>
                  <span className="text-zinc-300">{ev.startsAt}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Perks List:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ev.perks.map((p, i) => (
                  <span key={i} className="text-[9px] font-medium bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-zinc-950/50 border border-dashed border-zinc-800 rounded-[2.5rem] text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-zinc-600" />
            <p className="text-zinc-400 text-sm">No active flash sale events. Create your first campaign above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFlashSaleManager;
