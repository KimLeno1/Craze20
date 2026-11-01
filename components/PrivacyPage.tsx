import React, { useEffect } from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate?: (view: any) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    document.title = "Privacy Policy & Analytics Transparency — Closet Kraze";

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Learn how Closet Kraze protects your data. We use cookieless Plausible Analytics and Sentry error tracking with zero personal advertising trackers.');
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-[#00D1FF] selection:text-black">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-zinc-900 to-indigo-950 border-b border-zinc-800/85 py-3.5 px-4 text-center">
        <p className="text-xs sm:text-sm font-serif italic text-zinc-300 tracking-wide">
          "Privacy isn't just compliance—it's a fundamental respect for our collectors." — <span className="font-mono not-italic font-bold text-[#00D1FF]">Closet Kraze Vault</span>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#00D1FF] text-[10px] font-mono font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            Data Protection & Transparency
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif italic text-white tracking-tight">
            Privacy Policy & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Last Updated: August 2026 • Kumasi, Ghana
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-10 text-zinc-300 font-sans text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-serif italic text-xl">
              <Lock className="text-[#00D1FF]" size={22} />
              <h2>1. Our Commitment to Your Privacy</h2>
            </div>
            <p>
              At Closet Kraze (<code className="font-mono text-xs text-[#00D1FF]">closetkraze.top</code>), we believe in absolute transparency. When you shop for curated fashion, designer silhouettes, view limited drops, or connect via WhatsApp, you entrust us with your details. We treat this data with rigorous security standards and never sell, rent, or monetize your personal information to third-party advertisers.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-serif italic text-xl">
              <EyeOff className="text-emerald-400" size={22} />
              <h2>2. Cookieless Analytics (Plausible.io)</h2>
            </div>
            <p>
              To understand how our store performs and ensure fast drop experiences for collectors in Ghana and worldwide, we use <strong className="text-white">Plausible Analytics</strong>.
            </p>
            <ul className="space-y-2.5 pt-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={16} />
                <span><strong className="text-white">Zero Cookies:</strong> Plausible is entirely cookieless. It does not place tracking cookies on your device or store persistent identifiers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={16} />
                <span><strong className="text-white">GDPR / CCPA Compliant:</strong> All site traffic data is aggregated anonymously. No personal data is ever tracked or profiled.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={16} />
                <span><strong className="text-white">Custom Event Funnels:</strong> We measure anonymous user milestones (such as <code className="font-mono text-xs text-[#00D1FF]">view_product</code>, <code className="font-mono text-xs text-[#00D1FF]">add_to_cart</code>, <code className="font-mono text-xs text-[#00D1FF]">whatsapp_click</code>, <code className="font-mono text-xs text-[#00D1FF]">start_checkout</code>, and <code className="font-mono text-xs text-[#00D1FF]">complete_purchase</code>) to optimize drop performance and measure revenue in GHC.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-serif italic text-xl">
              <ShieldCheck className="text-amber-400" size={22} />
              <h2>3. Error Tracking & Stability (Sentry)</h2>
            </div>
            <p>
              To detect frontend bugs, network failures, and vault checkout anomalies instantly, we use <strong className="text-white">Sentry</strong> error monitoring.
            </p>
            <p>
              When an application error or crash occurs, Sentry collects anonymous device stack traces, browser environment data, and the state leading up to the error. This data allows our engineering team to patch bugs within minutes before they impact your shopping experience.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-serif italic text-xl">
              <FileText className="text-cyan-400" size={22} />
              <h2>4. Information We Collect When You Order</h2>
            </div>
            <p>
              When you place an order or use our "Pay For Me" or WhatsApp checkout features, we collect only the necessary fulfillment details:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li>Your name and contact phone number / WhatsApp handle.</li>
              <li>Delivery address in Ghana (City, Region, Digital Address or Landmark).</li>
              <li>Order selections, sizing, and custom notes.</li>
            </ul>
            <p className="pt-2">
              Payment credentials are processed securely through trusted gateway channels or verified bank transfers. We never store raw credit card numbers on our servers.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-serif italic text-xl">
              <h2>5. Contact the Curator</h2>
            </div>
            <p>
              If you have any questions regarding your data, want to request deletion of your account records, or need clarification on our privacy practices, reach out directly to Leno Akowan via WhatsApp at <a href="https://wa.me/233553877937" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-mono font-bold hover:underline">+233 55 387 7937</a>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
