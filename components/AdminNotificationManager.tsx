import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { databaseService } from '../services/databaseService';
import { Bell, Send, Users, User as UserIcon, CheckCircle2 } from 'lucide-react';

const AdminNotificationManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<Notification['type']>('INFO');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setUsers(await databaseService.getUsers());
      setNotifications(await databaseService.getGlobalNotifications());
    };
    fetchData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setStatus('sending');
    
    const recipientId = selectedRecipient === 'ALL' ? null : selectedRecipient;
    await databaseService.sendNotification(title, message, type, recipientId);
    
    // Refresh notifications
    setNotifications(await databaseService.getGlobalNotifications());

    setStatus('success');
    setTitle('');
    setMessage('');
    
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
            <Bell className="w-6 h-6 text-[#EC4899]" />
            Broadcast_Center
          </h2>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-1">Neural Messaging System</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Send Notification Form */}
        <div className="glass-grey border border-white/10 rounded-[2.5rem] p-8 space-y-8">
          <div className="text-[10px] font-black text-[#EC4899] uppercase tracking-widest border-l-2 border-[#EC4899] pl-3">
            Compose_Transmission
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Recipient_Target</label>
              <div className="relative">
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#EC4899] transition-all outline-none appearance-none"
                >
                  <option value="ALL">ALL_USERS (Global Broadcast)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.handle} ({user.email})
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  {selectedRecipient === 'ALL' ? <Users className="w-4 h-4 text-zinc-500" /> : <UserIcon className="w-4 h-4 text-zinc-500" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Signal_Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#EC4899] transition-all outline-none appearance-none"
                >
                  <option value="INFO">INFO</option>
                  <option value="URGENT">URGENT</option>
                  <option value="REWARD">REWARD</option>
                  <option value="WELCOME">WELCOME</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Signal_Header</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Transmission Title..."
                className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#EC4899] transition-all outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Signal_Payload</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message..."
                rows={4}
                className="w-full glass-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#EC4899] transition-all outline-none resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={status !== 'idle'}
              className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${
                status === 'success' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-black hover:bg-[#EC4899] hover:text-white'
              }`}
            >
              {status === 'idle' && (
                <>
                  <Send className="w-4 h-4" />
                  Initiate_Transmission
                </>
              )}
              {status === 'sending' && (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin rounded-full" />
              )}
              {status === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Transmission_Complete
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Notifications Log */}
        <div className="space-y-6">
          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-l-2 border-blue-500 pl-3">
            Transmission_Log
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {notifications.slice(0, 10).map((notif) => (
              <div key={notif.id} className="glass-grey border border-white/5 rounded-3xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                    notif.type === 'URGENT' ? 'bg-red-500/20 text-red-500' :
                    notif.type === 'REWARD' ? 'bg-emerald-500/20 text-emerald-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {notif.type}
                  </span>
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{notif.timestamp}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
                {notif.recipientId && (
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                    <UserIcon className="w-3 h-3 text-zinc-600" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                      Target: {users.find(u => u.id === notif.recipientId)?.handle || notif.recipientId}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationManager;
