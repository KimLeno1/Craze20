
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Supplier } from '../types';
import { Loader2, UserPlus } from 'lucide-react';
import SupplierRegister from './SupplierRegister';

interface SupplierLoginProps {
  onSuccess: (supplierId: string) => void;
  onCancel: () => void;
}

const SupplierLogin: React.FC<SupplierLoginProps> = ({ onSuccess, onCancel }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [status, setStatus] = useState<'IDLE' | 'AUTHENTICATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [authProgress, setAuthProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'AUTHENTICATING') {
      interval = setInterval(() => {
        setAuthProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            handleFinalAuth();
            return 100;
          }
          return prev + Math.random() * 20;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleFinalAuth = async () => {
    try {
      const data = await databaseService.login({ 
        identifier: credentials.username, 
        password: credentials.password, 
        role: 'SUPPLIER' 
      });
      
      if (data.success) {
        setStatus('SUCCESS');
        localStorage.setItem('cc-supplier-id', data.userId);
        localStorage.setItem('cc-supplier-auth', 'true');
        setTimeout(() => onSuccess(data.userId), 800);
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

  const themeColor = '#f59e0b'; // Logistics Amber

  if (showRegister) {
    return <SupplierRegister onBack={() => setShowRegister(false)} onSuccess={() => setShowRegister(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black text-white font-mono flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(${themeColor} 1px, transparent 1px), linear-gradient(90deg, ${themeColor} 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      ></div>

      <div className="w-full max-w-lg space-y-10 relative z-10 animate-in fade-in duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-[0.25em] transition-colors duration-500" style={{ color: themeColor }}>
            Supplier Login
          </h1>
          <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500">Supplier Portal Access</p>
        </div>

        <div className="bg-black border p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden" style={{ borderColor: `${themeColor}44`, boxShadow: `0 0 100px ${themeColor}11` }}>
          {status === 'AUTHENTICATING' || status === 'SUCCESS' ? (
            <div 
              className="py-14 space-y-10 text-center animate-in fade-in duration-500"
              role="status"
              aria-busy={status === 'AUTHENTICATING'}
              aria-label={status === 'SUCCESS' ? "Login complete" : "Verifying credentials"}
            >
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-[0.5em] animate-pulse" style={{ color: themeColor }}>
                  {status === 'SUCCESS' ? 'LOGIN SUCCESSFUL' : 'VERIFYING CREDENTIALS...'}
                </div>
                <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                  Connecting to supplier portal...
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-xs mx-auto">
                <div 
                  className="h-full transition-all duration-300 shadow-[0_0_15px_currentColor]" 
                  style={{ width: `${authProgress}%`, backgroundColor: themeColor, color: themeColor }} 
                />
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={(e) => { e.preventDefault(); setStatus('AUTHENTICATING'); }} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Username / ID</label>
                    <input 
                      type="text" required value={credentials.username}
                      onChange={e => setCredentials({...credentials, username: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                      placeholder="Enter Username or ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Password</label>
                    <input 
                      type="password" required value={credentials.password}
                      onChange={e => setCredentials({...credentials, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                
                {status === 'ERROR' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase text-center rounded-2xl animate-pulse">
                    Invalid credentials. Please try again.
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={onCancel} 
                    className="flex-1 py-5 bg-zinc-900/50 text-zinc-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    aria-label="Supplier Sign In"
                    className="flex-[2] py-5 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 active:bg-green-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" 
                  >
                    Sign In
                  </button>
                </div>

                <div className="pt-6 border-t border-white/5 text-center">
                  <button 
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="group flex flex-col items-center gap-2 mx-auto text-[9px] font-black text-zinc-500 hover:text-[#f59e0b] transition-all uppercase tracking-widest"
                  >
                    <UserPlus className="w-5 h-5 text-zinc-700 group-hover:text-[#f59e0b] group-hover:scale-110 transition-all mb-1" />
                    Register as a Supplier
                    <span className="text-[7px] text-zinc-700 tracking-tight">Create supplier account</span>
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="text-center opacity-10 hover:opacity-100 transition-opacity duration-700">
            <p className="text-[8px] uppercase tracking-widest">HINT: supplier / NODE_2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierLogin;
