
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface AdminLoginProps {
  onSuccess: (role: 'ADMIN' | 'SUPPLIER', id?: string) => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [status, setStatus] = useState<'IDLE' | 'AUTHENTICATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [showPassword, setShowPassword] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'AUTHENTICATING') {
      interval = setInterval(() => {
        setAuthProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            handleAdminAuth();
            return 100;
          }
          return prev + Math.random() * 25;
        });
      }, 120);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleAdminAuth = async () => {
    try {
      const data = await databaseService.login({ 
        identifier: credentials.username, 
        password: credentials.password, 
        role: 'ADMIN' 
      });
      
      if (data.success) {
        setStatus('SUCCESS');
        localStorage.setItem('cc-admin-id', data.userId || 'admin');
        localStorage.setItem('cc-admin-auth', 'true');
        setTimeout(() => onSuccess('ADMIN'), 1000);
      } else {
        throw new Error(data.error || data.message || 'Auth failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatus('ERROR');
      setAuthProgress(0);
      setTimeout(() => setStatus('IDLE'), 2000);
    }
  };

  const themeColor = '#00ff41'; // Admin Matrix Green

  return (
    <div className="fixed inset-0 z-[500] bg-black text-white font-mono flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000" 
        style={{ 
          backgroundImage: `linear-gradient(${themeColor} 1px, transparent 1px), linear-gradient(90deg, ${themeColor} 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      ></div>

      <div className={`w-full max-w-lg space-y-10 transition-all duration-500 relative z-10 ${status === 'ERROR' ? 'animate-shake' : ''}`}>
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-[0.25em] transition-colors duration-500" style={{ color: themeColor }}>
            System_Core
          </h1>
          <div className="flex items-center justify-center gap-4 opacity-40">
            <div className="h-px w-8 bg-current"></div>
            <p className="text-[9px] uppercase tracking-[0.4em]">Handshake v.2025 // Sector_Admin</p>
            <div className="h-px w-8 bg-current"></div>
          </div>
        </div>

        {/* Main Auth Card */}
        <div 
          className="bg-black border p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden transition-all duration-500"
          style={{ borderColor: `${themeColor}44`, boxShadow: `0 0 100px ${themeColor}11` }}
        >
          {status === 'AUTHENTICATING' || status === 'SUCCESS' ? (
            <div 
              className="py-14 space-y-10 text-center animate-in fade-in duration-500"
              role="status"
              aria-busy={status === 'AUTHENTICATING'}
              aria-label={status === 'SUCCESS' ? "Handshake complete" : "Authenticating neural link"}
            >
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-[1em] animate-pulse transition-colors" style={{ color: themeColor }}>
                  {status === 'SUCCESS' ? 'HANDSHAKE_COMPLETE' : 'CALIBRATING_VIBE_ARCHIVE'}
                </div>
                <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Neural Link: SYNCED // Protocol: ROOT_ARCHITECT</div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-xs mx-auto">
                <div 
                  className="h-full transition-all duration-300 shadow-[0_0_15px_currentColor]" 
                  style={{ width: `${authProgress}%`, backgroundColor: themeColor, color: themeColor }} 
                />
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setStatus('AUTHENTICATING'); }} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Identity Handle</label>
                  <input 
                    type="text" required value={credentials.username}
                    onChange={e => setCredentials({...credentials, username: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                    placeholder="ARCHITECT ID"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Security Signature</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={credentials.password}
                      onChange={e => setCredentials({...credentials, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800 pr-14"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              
              {status === 'ERROR' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase text-center rounded-2xl animate-pulse">
                  AUTHENTICATION_FAILURE // KEY_REJECTION
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={onCancel} 
                  className="flex-1 py-5 bg-zinc-900/50 text-zinc-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                >
                  ABORT
                </button>
                <button 
                  type="submit" 
                  aria-label="Establish Secure Uplink Connection"
                  className="flex-[2] py-5 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" 
                  style={{ backgroundColor: themeColor }}
                >
                  ESTABLISH_UPLINK
                </button>
              </div>
            </form>
          )}

          <div className="text-center opacity-10 hover:opacity-100 transition-opacity duration-700">
            <p className="text-[8px] uppercase tracking-widest">HINT: leno / 1q2w3!</p>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="flex justify-between items-center px-6">
           <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
           </div>
           <div className="text-[8px] font-black uppercase tracking-widest text-zinc-700">
              Uplink: STABLE // Sector: NEW_TOKYO_01
           </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default AdminLogin;
