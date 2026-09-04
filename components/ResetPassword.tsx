import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

interface ResetPasswordProps {
  token: string;
  onComplete: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onComplete }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Neural Mismatch: Passwords do not sync.");
      return;
    }
    
    setIsAuthenticating(true);
    try {
      const result = await databaseService.resetPassword(token, formData.password);
      if (result.success) {
        toast.success(result.message);
        onComplete();
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An error occurred while resetting password');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl" />
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-12 duration-700">
        <div className="bg-white border border-zinc-100 rounded-[3rem] p-10 md:p-14 shadow-2xl group">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif italic text-zinc-950 leading-none tracking-tighter mb-4">
              CLOSET<br/><span className="not-italic font-sans font-black text-zinc-950 uppercase select-none cursor-default">KRAZE</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em]">Reset Password</p>
          </div>

          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="NEW PASSWORD" 
                className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none pr-14 shadow-inner" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-950 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                placeholder="CONFIRM NEW PASSWORD" 
                className="w-full bg-zinc-50 border border-zinc-100 px-6 py-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none pr-14 shadow-inner" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isAuthenticating}
              aria-busy={isAuthenticating}
              aria-label="Confirm Password Reset"
              className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] bg-zinc-950 text-white hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SYNCHRONIZING...</span>
                </>
              ) : 'Confirm Reset'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
