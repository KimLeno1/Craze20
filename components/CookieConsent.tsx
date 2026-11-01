import React, { useState, useEffect } from 'react';
import { setCookie, getCookie } from '../lib/cookieUtils';

const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getCookie('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie('cookieConsent', 'true', 60);
    setShow(false);
  };

  const handleDeny = () => {
    setCookie('cookieConsent', 'denied', 1);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-[#0F52BA]/20 p-8 rounded-[2.5rem] max-w-sm w-full space-y-6 shadow-[0_25px_60px_-10px_rgba(15,82,186,0.15),inset_0_1px_2px_rgba(255,255,255,1)]">
        <p className="text-zinc-700 text-xs leading-relaxed font-medium">
          We use cookieless Plausible Analytics and necessary storage to enhance your experience and analyze traffic. Read more in our{' '}
          <a href="/privacy" className="text-[#0F52BA] hover:text-[#09285E] underline font-bold transition-colors">
            Privacy & Analytics Policy
          </a>.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button 
            onClick={handleDeny}
            className="text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Deny
          </button>
          <button 
            onClick={handleAccept}
            className="bg-zinc-950 text-white hover:bg-[#0F52BA] shadow-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
