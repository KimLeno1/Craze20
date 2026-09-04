
import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SupplierRegisterProps {
  onBack: () => void;
  onSuccess: () => void;
}

const SupplierRegister: React.FC<SupplierRegisterProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    password: '',
    region: 'Neo Tokyo Central'
  });
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SUBMITTING');
    setErrorMessage('');

    try {
      const result = await databaseService.registerSupplierPublic(formData);
      if (result.status === 'success') {
        setStatus('SUCCESS');
        setTimeout(() => onSuccess(), 2000);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setStatus('ERROR');
      setErrorMessage(error.message || 'Network error occurred');
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  const themeColor = '#f59e0b'; // Logistics Amber

  if (status === 'SUCCESS') {
    return (
      <div className="fixed inset-0 z-[500] bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-black border border-green-500/30 p-10 rounded-[3.5rem] text-center space-y-6 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <div className="flex justify-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-green-500">Registration_Stored</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your credentials have been uploaded to the central node. 
            Account status is currently <span className="text-white font-bold">PENDING</span>. 
            An administrator will verify your logistics protocols shortly.
          </p>
          <div className="pt-4">
             <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-[loading-bar_2s_ease-in-out]" />
             </div>
          </div>
        </div>
      </div>
    );
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

      <div className="w-full max-w-lg space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
           </button>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-widest" style={{ color: themeColor }}>Register_Supplier</h1>
              <p className="text-[8px] uppercase tracking-widest text-zinc-600">SUPPLIER ONBOARDING</p>
           </div>
        </div>

        <div className="bg-black border p-10 rounded-[3.5rem] space-y-6 shadow-2xl relative overflow-hidden" style={{ borderColor: `${themeColor}44`, boxShadow: `0 0 100px ${themeColor}11` }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Supplier Designation</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                  placeholder="EX: CYBER LOGISTICS LTD"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Uplink Email</label>
                <input 
                  type="email" required value={formData.contactEmail}
                  onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                  placeholder="name@node.net"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Operational Region</label>
                <select 
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all"
                >
                  <option value="Neo Tokyo Central">Neo Tokyo Central</option>
                  <option value="Shadow Sector 7">Shadow Sector 7</option>
                  <option value="Orbital Nexus">Orbital Nexus</option>
                  <option value="Iron Desert Hub">Iron Desert Hub</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest px-1">Security Access Key</label>
                <input 
                  type="password" required minLength={6} value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-mono text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {status === 'ERROR' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase text-center rounded-2xl animate-shake">
                REGISTRATION_ERROR // {errorMessage.toUpperCase()}
              </div>
            )}

            <button 
              type="submit" 
              disabled={status === 'SUBMITTING'}
              className="w-full py-5 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 active:bg-amber-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" 
            >
              {status === 'SUBMITTING' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  INITIATING_UPLINK...
                </>
              ) : (
                'REGISTER_NODE'
              )}
            </button>
          </form>

          <p className="text-[8px] text-center text-zinc-600 uppercase tracking-[0.2em] leading-relaxed">
            By registering, you agree to comply with all Neo Tokyo trade agreements and logistics security standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupplierRegister;
