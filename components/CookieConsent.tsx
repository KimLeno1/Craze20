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
    // Attempt to close the window
    window.close();
    // Fallback if not successful
    alert('You need to accept cookies to proceed or manually close this tab.');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F52BA]/30 backdrop-blur-[40px] saturate-[200%] border border-[#0F52BA]/40 p-8 rounded-[2.5rem] max-w-sm w-full space-y-6 shadow-[0_30px_60px_rgba(15,82,186,0.25),inset_0_1px_4px_rgba(255,255,255,0.4)]">
        <p className="text-white text-xs leading-relaxed font-medium">
          We use cookieless Plausible Analytics and necessary storage to enhance your experience and analyze traffic. Read more in our {' '}
          <a href="/privacy" className="text-white hover:text-zinc-200 underline font-black transition-colors">
            Privacy & Analytics Policy
          </a>.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button 
            onClick={handleDeny}
            className="text-zinc-300 hover:text-white border border-white/20 hover:border-white/40 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Deny
          </button>
          <button 
            onClick={handleAccept}
            className="bg-white text-zinc-950 hover:bg-zinc-100 shadow-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
