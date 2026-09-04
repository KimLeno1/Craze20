import React from 'react';
import { Notification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkRead,
  onMarkAllRead 
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[220] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-white z-[230] shadow-[-20px_0_80px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out border-l border-zinc-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <header className="p-6 sm:p-8 border-b border-zinc-200 flex items-center justify-between bg-white">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-serif italic text-zinc-950 leading-none">notifications</h2>
              <p className="text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-[0.4em]">messages</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {notifications.some(n => !n.read) && (
                <button 
                  onClick={onMarkAllRead}
                  className="text-[7px] sm:text-[8px] font-black text-[#00D1FF] hover:text-black uppercase tracking-widest transition-colors"
                >
                  Clear_All
                </button>
              )}
              <button onClick={onClose} className="text-zinc-400 hover:text-black text-lg sm:text-xl transition-colors">✕</button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">📡</div>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">no messages</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => onMarkRead(n.id)}
                  className={`group relative p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all cursor-pointer overflow-hidden ${
                    n.read ? 'bg-zinc-50 border-zinc-100 opacity-60' : 'bg-white border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  {!n.read && (
                    <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-1.5 h-1.5 rounded-full bg-[#00D1FF] shadow-[0_0_8px_#00D1FF]"></div>
                  )}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded ${
                        n.type === 'URGENT' ? 'bg-red-500 text-white' : 
                        n.type === 'REWARD' ? 'bg-yellow-500 text-black' : 
                        n.type === 'WELCOME' ? 'bg-[#00D1FF] text-white' : 
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {n.type}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-mono text-zinc-400 uppercase">{n.timestamp}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-zinc-950 group-hover:text-[#00D1FF] transition-colors">{n.title}</h3>
                    <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                      "{n.message}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <footer className="p-6 sm:p-8 bg-white border-t border-zinc-200">
            <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-widest">
              <span>Uplink: STABLE</span>
              <span>Buffer Integrity: 100%</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;