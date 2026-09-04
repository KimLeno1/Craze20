import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Skeleton } from './Skeleton';
import { Trash2, CheckCircle, Clock, XCircle, RefreshCw, MessageSquare, Image, ExternalLink, Mail } from 'lucide-react';

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

const AdminCustomRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PRODUCTION' | 'SHIPPED' | 'COMPLETED'>('PENDING');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const list = await databaseService.getCustomRequests();
      setRequests(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (req: CustomRequest) => {
    setEditingId(req.id);
    setAdminNotes(req.adminNotes || '');
    setStatus(req.status);
  };

  const handleSaveUpdate = async (id: string) => {
    setIsSaving(true);
    try {
      await databaseService.updateCustomRequest(id, { status, adminNotes });
      setEditingId(null);
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert('Failed to update request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom request?')) return;
    try {
      await databaseService.deleteCustomRequest(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'border-green-500/50 text-green-400 bg-green-500/10';
      case 'REJECTED':
        return 'border-red-500/50 text-red-400 bg-red-500/10';
      case 'IN_PRODUCTION':
        return 'border-blue-500/50 text-blue-400 bg-blue-500/10';
      case 'SHIPPED':
        return 'border-[#00D1FF]/50 text-[#00D1FF] bg-[#00D1FF]/10';
      case 'COMPLETED':
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
      default:
        return 'border-amber-500/50 text-amber-400 bg-amber-500/10';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h3 className="text-xl font-serif italic text-white">Bespoke & Custom Requests</h3>
          <p className="text-[8px] text-zinc-500 font-black tracking-widest uppercase">Manage user garment commissions and unfound clothing requests</p>
        </div>
        <button 
          onClick={fetchRequests}
          className="p-2 hover:glass-light rounded-lg transition-all border border-white/5 text-zinc-400 hover:text-white"
          title="Refresh requests"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-grey p-6 border border-white/5 rounded-3xl space-y-4">
               <Skeleton className="w-1/3 h-6" />
               <Skeleton className="w-full h-16" />
            </div>
          ))
        ) : requests.length === 0 ? (
          <div className="text-center p-12 glass-grey border border-white/5 rounded-3xl text-zinc-500 uppercase tracking-widest space-y-4 font-black">
            <MessageSquare className="w-12 h-12 mx-auto opacity-50" />
            <p>No custom requests received yet</p>
          </div>
        ) : (
          requests.map(req => (
            <div 
              key={req.id} 
              className="glass-grey p-6 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between gap-6 transition-all hover:bg-white/5"
            >
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-[9px] font-black text-[#00D1FF] uppercase px-3 py-1 bg-[#00D1FF]/10 rounded-full">{req.category}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{new Date(req.timestamp).toLocaleString()}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                  {req.budget > 0 && (
                    <span className="text-[9px] font-mono font-black text-amber-500">Budget: GHS {req.budget.toFixed(2)}</span>
                  )}
                </div>

                <div>
                  <div className="text-xs font-black text-white">
                    {req.userHandle || 'Anonymous'} <span className="text-zinc-500 font-normal">({req.email})</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">Item: {req.itemName}</h4>
                  <div className="mt-2 text-xs font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">{req.description}</div>
                </div>

                {/* Edit Section / Status change form */}
                {editingId === req.id ? (
                  <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Status</label>
                        <select 
                          value={status}
                          onChange={e => setStatus(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-white/10 p-2 text-xs text-white focus:border-[#00D1FF] outline-none rounded-lg"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Designer Feedback / Admin Notes</label>
                      <textarea 
                        rows={3}
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        placeholder="Provide details about availability, final price estimate, production times, etc..."
                        className="w-full bg-zinc-950 border border-white/10 p-3 text-xs text-white focus:border-[#00D1FF] outline-none rounded-lg font-mono"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-400 hover:bg-zinc-800 rounded"
                      >
                        Cancel
                      </button>
                      <button 
                        disabled={isSaving}
                        onClick={() => handleSaveUpdate(req.id)}
                        className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-white text-black hover:bg-[#00D1FF] hover:text-white rounded disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Updates'}
                      </button>
                    </div>
                  </div>
                ) : (
                  req.adminNotes && (
                    <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
                      <div className="text-[8px] font-black uppercase tracking-widest text-[#00D1FF] mb-1">Feedback Left</div>
                      <p className="text-xs italic text-zinc-300 font-mono">{req.adminNotes}</p>
                    </div>
                  )
                )}
              </div>

              {/* Sidebar actions & Media previews */}
              <div className="flex flex-row md:flex-col gap-3 justify-start shrink-0 items-start md:items-end">
                {req.referenceImage && (
                  <a 
                    href={req.referenceImage} 
                    target="_blank" 
                    rel="noreferrer"
                    className="relative group block w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-zinc-900/50"
                  >
                    <img 
                      src={req.referenceImage} 
                      alt="Ref Preview" 
                      className="w-full h-full object-cover transition-all group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white">
                      <ExternalLink size={12} />
                    </div>
                  </a>
                )}

                <div className="flex flex-row md:flex-col gap-2 w-full">
                  {editingId !== req.id && (
                    <button 
                      onClick={() => handleStartEdit(req)}
                      className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all rounded w-full text-center"
                    >
                      Update Request
                    </button>
                  )}
                  
                  {req.email && req.email.includes('@') ? (
                    <a 
                      href={`mailto:${req.email}?subject=Kraze Custom Request: Re: ${req.itemName}`}
                      className="px-4 py-2 text-[9px] flex items-center justify-center gap-1.5 font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all rounded w-full"
                    >
                      <Mail size={12} /> Email
                    </a>
                  ) : (
                    <a 
                      href={`tel:${req.email ? req.email.replace(/\s+/g, '') : ''}`}
                      className="px-4 py-2 text-[9px] flex items-center justify-center gap-1.5 font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all rounded w-full"
                    >
                      <MessageSquare size={12} /> Call / Text
                    </a>
                  )}

                  <button 
                    onClick={() => handleDelete(req.id)}
                    className="px-4 py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded w-full"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCustomRequestsPanel;
