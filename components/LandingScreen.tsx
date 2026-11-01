
import * as React from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import PolicyModal from './PolicyModal';
import { toast } from 'sonner';

interface LandingScreenProps {
  onComplete: (archetype: string, isNewUser: boolean) => void;
  onAdminAccess?: () => void;
  onClose?: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onComplete, onAdminAccess, onClose }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPolicy, setShowPolicy] = useState<{ open: boolean; type: 'TERMS' | 'REFUND' }>({ open: false, type: 'TERMS' });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    referralCode: ''
  });
  const [refValidation, setRefValidation] = useState<{ isValid: boolean; message: string; referrerName?: string } | null>(null);

  React.useEffect(() => {
    // Check URL or local storage for referral code
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get('ref') || localStorage.getItem('ck-ref-code');
    if (refFromUrl) {
      setFormData(prev => ({ ...prev, referralCode: refFromUrl.toUpperCase() }));
      setAuthMode('SIGNUP');
      validateCode(refFromUrl);
    }
  }, []);

  const validateCode = async (code: string) => {
    if (!code.trim()) {
      setRefValidation(null);
      return;
    }
    try {
      const res = await databaseService.validateReferralCode(code.trim());
      if (res && res.valid) {
        setRefValidation({
          isValid: true,
          message: res.message || `✓ Valid code from @${res.referrerName}! You get GH₵20 off first order over GH₵100.`,
          referrerName: res.referrerName
        });
      } else {
        setRefValidation({
          isValid: false,
          message: res?.message || 'Invalid or expired referral code'
        });
      }
    } catch (e) {
      setRefValidation({ isValid: false, message: 'Could not validate code' });
    }
  };

  const handleAdminClick = () => {
    const nextClicks = adminClicks + 1;
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 150);
    if (nextClicks >= 5) {
      onAdminAccess?.();
      setAdminClicks(0);
    } else {
      setAdminClicks(nextClicks);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'FORGOT_PASSWORD') {
      setIsAuthenticating(true);
      try {
        const result = await databaseService.requestPasswordReset(formData.email);
        if (result.success) {
          toast.success(result.message);
          setAuthMode('LOGIN');
        } else {
          toast.error(result.message || 'Failed to request password reset');
        }
      } catch (error) {
        console.error('Password reset request error:', error);
        toast.error('An error occurred while requesting password reset');
      } finally {
        setIsAuthenticating(false);
      }
      return;
    }

    if (authMode === 'SIGNUP' && formData.password !== formData.confirmPassword) {
      toast.error("Neural Mismatch: Passwords do not sync.");
      return;
    }
    setIsAuthenticating(true);
    try {
      let result;
      if (authMode === 'LOGIN') {
        result = await databaseService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await databaseService.signup({
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          referralCode: formData.referralCode
        });
      }
      
      if (result.success) {
        localStorage.setItem('cc-auth-token', 'true');
        localStorage.setItem('cc-user-id', result.userId);
        localStorage.setItem('userId', result.userId);
        if (result.handle) localStorage.setItem('cc-user-handle', result.handle);
        onComplete('CYBER', authMode === 'SIGNUP');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(authMode === 'LOGIN' ? 'Access Denied: Invalid Credentials' : 'Registration Failed: Identity already exists');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-500 ${isGlitching ? 'invert' : ''}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-12 duration-700">
        <div className="glass-sapphire-main rounded-[3rem] p-6 sm:p-10 md:p-14 group">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif italic text-white leading-none tracking-tighter mb-4">
              CLOSET<br/><span className="not-italic font-sans font-black text-white uppercase select-none cursor-default" onClick={handleAdminClick}>KRAZE</span>
            </h1>
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em]">Authentication</p>
          </div>

          <div className="flex bg-zinc-50 p-1 rounded-2xl mb-8 border border-zinc-100">
            <button onClick={() => setAuthMode('LOGIN')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'LOGIN' ? 'bg-white text-zinc-950 shadow-sm border border-zinc-100' : 'text-zinc-400'}`}>Sign In</button>
            <button onClick={() => setAuthMode('SIGNUP')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'SIGNUP' ? 'bg-white text-zinc-950 shadow-sm border border-zinc-100' : 'text-zinc-400'}`}>Register</button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="EMAIL" className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none placeholder:text-zinc-300" />
            
            {authMode !== 'FORGOT_PASSWORD' && (
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  placeholder="PASSWORD" 
                  className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none pr-14 placeholder:text-zinc-300" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-950 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}
            
            {authMode === 'SIGNUP' && (
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                    placeholder="CONFIRM PASSWORD" 
                    className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none pr-14 placeholder:text-zinc-300" 
                  />
                </div>

                <div className="relative">
                  <select
                    required
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-400 focus:border-blue-600 focus:text-zinc-950 outline-none appearance-none"
                  >
                    <option value="" disabled className="bg-white text-zinc-900">SELECT GENDER</option>
                    <option value="Male" className="bg-white text-zinc-950 font-semibold">MALE</option>
                    <option value="Female" className="bg-white text-zinc-950 font-semibold">FEMALE</option>
                    <option value="Prefer not to say" className="bg-white text-zinc-950 font-semibold">PREFER NOT TO SAY</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-zinc-300">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={e => {
                      const code = e.target.value.toUpperCase();
                      setFormData({ ...formData, referralCode: code });
                      validateCode(code);
                    }}
                    placeholder="REFERRAL CODE (OPTIONAL e.g. CK-KWAM1234)"
                    className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none placeholder:text-zinc-300 font-mono"
                  />
                  {refValidation && (
                    <p className={`text-[10px] font-bold px-3 py-1.5 rounded-lg ${
                      refValidation.isValid ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {refValidation.message}
                    </p>
                  )}
                </div>
                
                <div className="flex items-start gap-3 px-2 py-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    required 
                    className="mt-1 w-4 h-4 rounded border-zinc-200 bg-zinc-50 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="terms" className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-relaxed cursor-pointer select-none">
                    I accept the <button type="button" onClick={() => setShowPolicy({ open: true, type: 'TERMS' })} className="text-zinc-950 hover:text-blue-600 underline transition-colors">Terms and Conditions</button> and the <button type="button" onClick={() => setShowPolicy({ open: true, type: 'REFUND' })} className="text-zinc-950 hover:text-blue-600 underline transition-colors">Refund and Shipping Policy</button>
                  </label>
                </div>
              </div>
            )}

            {authMode === 'LOGIN' && (
              <div className="text-right mt-2">
                <button type="button" onClick={() => setAuthMode('FORGOT_PASSWORD')} className="text-[10px] text-zinc-400 hover:text-zinc-950 uppercase tracking-widest font-black transition-colors">
                  Forgot Password?
                </button>
              </div>
            )}

            {authMode === 'FORGOT_PASSWORD' && (
              <div className="text-center mt-2 mb-4">
                <p className="text-xs text-zinc-400">Enter your email to receive a reset link.</p>
                <button type="button" onClick={() => setAuthMode('LOGIN')} className="text-[10px] mt-2 text-blue-600 hover:text-zinc-950 uppercase tracking-widest font-black transition-colors">
                  Back to Login
                </button>
              </div>
            )}

            <button type="submit" disabled={isAuthenticating} className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] bg-zinc-950 text-white hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 shadow-xl">
              {isAuthenticating ? 'Processing...' : authMode === 'LOGIN' ? 'Login' : authMode === 'SIGNUP' ? 'Sign Up' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>

      <PolicyModal 
        isOpen={showPolicy.open} 
        onClose={() => setShowPolicy({ ...showPolicy, open: false })} 
        type={showPolicy.type} 
      />
    </div>
  );
};

export default LandingScreen;
