import React, { useState, useEffect } from 'react';
import { PayForMeRequest, PayForMeStatus } from '../types';
import { databaseService } from '../services/databaseService';
import { Wallet, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const AdminPayForMeManager: React.FC = () => {
  const [requests, setRequests] = useState<PayForMeRequest[]>([]);
  const [filter, setFilter] = useState<PayForMeStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setRequests(await databaseService.getPayForMeRequests());
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (requestId: string, status: PayForMeStatus) => {
    try {
      const result = await databaseService.updatePayForMeStatus(requestId, status);
      if (result.status === 'success' || result.success) {
        toast.success(`Request marked as ${status}`);
        const updated = await databaseService.getPayForMeRequests();
        setRequests(updated);
        
        // Notify the user
        const request = updated.find(r => r.id === requestId);
        if (request) {
          await databaseService.sendNotification(
            `Pay For Me Request ${status}`,
            `Your request for "${request.items[0].name}" has been ${status.toLowerCase()}.`,
            status === PayForMeStatus.APPROVED ? 'REWARD' : 'INFO',
            request.userId
          );
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Strategic communication failure.');
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'ALL' || r.status === filter;
    const matchesSearch = r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.items[0].name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
            <Wallet className="w-6 h-6 text-[#00D1FF]" />
            Sponsorship_Review_Board
          </h2>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-1">Financial Uplink Oversight</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search by User or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:border-[#00D1FF] transition-all outline-none"
          />
        </div>
        <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
          {([
            'ALL', 
            PayForMeStatus.PENDING, 
            PayForMeStatus.APPROVED, 
            PayForMeStatus.PAID, 
            PayForMeStatus.REJECTED
          ] as (PayForMeStatus | 'ALL')[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="glass p-6 border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-white/20 transition-all">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                <img src={request.items[0].image} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-white uppercase">{request.userName}</span>
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ID: {request.id}</span>
                </div>
                <div className="text-sm font-serif italic text-zinc-400">{request.items[0].name}</div>
                <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest">GH₵{request.total}</div>
                {request.payerName && (
                  <div className="mt-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mb-1">Sponsor_Identified</p>
                    <p className="text-[9px] text-emerald-200 font-bold">@{request.payerName}</p>
                    {request.payerContact && <p className="text-[7px] text-zinc-500 font-mono">{request.payerContact}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Current_Status</span>
                <div className="flex items-center gap-2">
                  {request.status === PayForMeStatus.PENDING && <Clock className="w-3 h-3 text-amber-500" />}
                  {request.status === PayForMeStatus.APPROVED && <CheckCircle2 className="w-3 h-3 text-[#00D1FF]" />}
                  {request.status === PayForMeStatus.PAID && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {request.status === PayForMeStatus.REJECTED && <XCircle className="w-3 h-3 text-red-500" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    request.status === PayForMeStatus.PENDING ? 'text-amber-500' :
                    request.status === PayForMeStatus.APPROVED ? 'text-[#00D1FF]' :
                    request.status === PayForMeStatus.PAID ? 'text-emerald-500' :
                    'text-red-500'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>

              {request.status === PayForMeStatus.PENDING && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatusUpdate(request.id, PayForMeStatus.REJECTED)}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    title="Reject Request"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(request.id, PayForMeStatus.APPROVED)}
                    className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                    title="Approve Request"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {request.status === PayForMeStatus.APPROVED && (
                <button 
                  onClick={() => handleStatusUpdate(request.id, PayForMeStatus.PAID)}
                  className="px-4 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest"
                >
                  Verify Payment
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="py-20 text-center opacity-30 italic uppercase text-[10px] tracking-widest">No sponsorship requests matching criteria.</div>
        )}
      </div>
    </div>
  );
};

export default AdminPayForMeManager;
