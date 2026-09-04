import React, { useEffect } from 'react';
import { ShieldCheck, Sparkles, MapPin, ZapOff, XCircle, CheckCircle2, MessageCircle, Quote, Award, Search, Users, ArrowRight, PackageCheck, Layers } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

import founderImg from '../src/assets/images/founder_portrait_1788141410409.jpg';
import jacketImg from '../src/assets/images/curated_jacket_1788141447633.jpg';
import cargoImg from '../src/assets/images/curated_cargo_1788141461478.jpg';
import hoodieImg from '../src/assets/images/curated_hoodie_1788141474939.jpg';

interface AboutPageProps {
  onNavigate?: (view: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  // Update Page Title, Meta Tags, and Inject Schema.org Microdata for SEO
  useEffect(() => {
    document.title = "About Closet Kraze — Curated Fashion & Style from Kumasi, Ghana";

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'We curate archival fashion, timeless silhouettes, and elevated style for Ghana. Every piece verified. WhatsApp: +233 55 387 7937.');

    // Set OpenGraph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'About Closet Kraze — Curated Fashion & Style from Kumasi, Ghana');

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', 'We curate archival fashion, timeless silhouettes, and elevated style for Ghana. Every piece verified. WhatsApp: +233 55 387 7937.');

    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', 'https://closetkraze.top/src/assets/images/founder_portrait_1788141410409.jpg');

    // Schema.org Person & Organization JSON-LD microdata
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          "@id": "https://closetkraze.top/#leno-akowan",
          "name": "Leno Akowan",
          "jobTitle": "Founder & Chief Curator",
          "worksFor": { "@id": "https://closetkraze.top/#organization" },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Kumasi",
            "addressRegion": "Ashanti",
            "addressCountry": "GH"
          },
          "telephone": "+233553877937",
          "url": "https://closetkraze.top/about",
          "sameAs": ["https://wa.me/233553877937"]
        },
        {
          "@type": "Organization",
          "@id": "https://closetkraze.top/#organization",
          "name": "Closet Kraze",
          "url": "https://closetkraze.top",
          "logo": "https://closetkraze.top/logo1.png",
          "founder": { "@id": "https://closetkraze.top/#leno-akowan" },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Kumasi",
            "addressCountry": "GH"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+233553877937",
            "contactType": "customer service",
            "areaServed": "GH",
            "availableLanguage": ["English", "Twi"]
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-about-schema';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('jsonld-about-schema');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const whatsappUrl = "https://wa.me/233553877937?text=Hey%20Leno%2C%20I'm%20reading%20the%20Closet%20Kraze%20About%20page%20and%20want%20to%20connect!";

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-[#00D1FF] selection:text-black">
      {/* Top Archival Callout Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-zinc-900 to-indigo-950 border-b border-zinc-800/80 py-3.5 px-4 text-center">
        <p className="text-xs sm:text-sm font-serif italic text-zinc-300 tracking-wide">
          "Why archival? Because the best stories are already written." — <span className="font-mono not-italic font-bold text-[#00D1FF]">Leno Akowan, Curator</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-20">
        
        {/* HERO SECTION: Founder Photo + Intro */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
          {/* Founder Photo Column */}
          <div className="md:col-span-5 flex flex-col items-center text-center">
            <div className="relative group">
              {/* Glowing ring animation */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00D1FF] via-emerald-500 to-blue-600 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-2 border-white/20 bg-zinc-900 shadow-2xl">
                <img
                  src={founderImg}
                  alt="Leno Akowan — Founder & Curator of Closet Kraze"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-2 right-2 bg-zinc-950 border border-zinc-700/80 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#00D1FF] flex items-center gap-1.5 shadow-lg">
                <MapPin size={12} className="text-[#25D366]" />
                Kumasi, Ghana
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <h1 className="text-3xl font-serif italic text-white tracking-tight">Leno Akowan</h1>
              <p className="text-xs font-mono font-black uppercase tracking-[0.25em] text-[#00D1FF]">
                Founder & Chief Curator
              </p>
              <p className="text-[11px] font-mono text-zinc-400">Closet Kraze Vault // Kumasi Hub</p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-[#25D366]/20 active:scale-95"
            >
              <WhatsAppIcon size={16} title="WhatsApp Leno Directly" />
              Direct Chat with Leno
            </a>
          </div>

          {/* Hero Mission Text Column */}
          <div className="md:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#00D1FF] text-[10px] font-mono font-bold uppercase tracking-widest">
              <Sparkles size={12} />
              The Curator Archetype
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif italic leading-tight text-white">
              We don't build fast fashion. We unearth <span className="text-[#00D1FF] not-italic font-sans font-black">archival grails</span> for West Africa.
            </h2>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans font-normal">
              Closet Kraze is an independent fashion vault engineered in Kumasi, Ashanti Region. Every piece on our grid is individually selected, physical-inspected for fabric weight, seams, hardware, and authenticity before it touches our dispatch unit.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                <span className="text-2xl font-mono font-black text-white block">100%</span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Verified Hardware</span>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                <span className="text-2xl font-mono font-black text-[#00D1FF] block">24H</span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Ghana Dispatch</span>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-2xl font-mono font-black text-[#25D366] block">0%</span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Fake Hype Strategy</span>
              </div>
            </div>
          </div>
        </section>

        {/* ORIGIN STORY: 300-word Narrative in Authentic Ghana Voice */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 p-8 sm:p-12 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00D1FF]" />
              <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-zinc-400">
                Origin Story // Kumasi Roots
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">
              "I started Closet Kraze because my guys in Ghana deserved better than cheap reps and synthetic imports."
            </h3>

            <div className="prose prose-invert prose-sm sm:prose-base text-zinc-300 leading-relaxed space-y-4 font-sans">
              <p>
                Charley, if you live in Ghana and love proper fashion and style, you already know the struggle. You go online, you see sharp tailored silhouettes, Japanese cargo trousers, and vintage washed knitwear with real weight. But when you try buying locally, it's either unverified bootlegs from random sellers or crazy markup prices from people who don't even know what GSM, authentic tailoring, or YKK zippers mean.
              </p>
              <p>
                Back in 2023, right here in Kumasi around KNUST, I started sourcing authentic pieces for a few close friends. We were hunting for garments with true history—heavy canvas parkas, seam-sealed utility shells, deadstock UK thrift grails, and factory surplus tailoring. When people saw the weight of the cotton, the custom zippers, and the genuine tags, the demand went crazy.
              </p>
              <p>
                That is how Closet Kraze was born. Not as a fast fashion boutique, and definitely not as a fake hype page. We are curators of fashion and personal style. We test every zipper, check every seam, verify every tag, and weigh every garment in our Kumasi vault before listing it. When you buy a silhouette from Closet Kraze, you are holding a piece that was physically handpicked and verified by people who respect the culture as much as you do.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-4 text-xs font-mono text-zinc-400 border-t border-zinc-800/80">
              <span className="text-[#00D1FF] font-bold">— Leno Akowan</span>
              <span>•</span>
              <span>Kumasi, Ashanti Region</span>
            </div>
          </div>
        </section>

        {/* CURATION WORK SHOWCASE: 3 Product Highlights */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-[#00D1FF]">
              Curator Work // Physical Inspection
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">
              Anatomy of a Curated Drop
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-lg mx-auto">
              Three archival silhouettes hand-selected and verified in our Kumasi vault.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="h-64 overflow-hidden relative">
                <img
                  src={jacketImg}
                  alt="2018 Archival Technical Shell"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#00D1FF] border border-zinc-700">
                  450 GSM Technical Canvas
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h4 className="text-base font-serif italic text-white">2018 Technical Utility Shell</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  "Sourced directly from verified factory surplus. Dual-vent YKK zippers, seam-sealed interior, and heavy storm flap. Tested for West African humidity resistance."
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Curator Note #01</span>
                  <span className="text-emerald-400 font-bold">✓ Vault Verified</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="h-64 overflow-hidden relative">
                <img
                  src={cargoImg}
                  alt="Japan Deadstock Modular Cargo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#00D1FF] border border-zinc-700">
                  Deadstock Archival
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h4 className="text-base font-serif italic text-white">Japan Deadstock Modular Cargo</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  "Hand-extracted from a vintage Japanese bale. 3D articulated cargo pockets with high-tensile strap hardware. Zero fraying, crisp original tags."
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Curator Note #02</span>
                  <span className="text-emerald-400 font-bold">✓ Vault Verified</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="h-64 overflow-hidden relative">
                <img
                  src={hoodieImg}
                  alt="500 GSM Heavy Acid Wash Hoodie"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#00D1FF] border border-zinc-700">
                  500 GSM Organic Cotton
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h4 className="text-base font-serif italic text-white">Acid Wash Heavy Hoodie</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  "Double-layered hood with no drawstrings for clean silhouette geometry. Custom acid wash finish gives every single piece a unique 1-of-1 pattern."
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Curator Note #03</span>
                  <span className="text-emerald-400 font-bold">✓ Vault Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE STAND FOR: 4 Values with Icons */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-[#00D1FF]">
              The Core Ethos
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">
              What We Stand For
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Value 1 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#00D1FF] flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-lg font-serif italic text-white">1. Authenticity First</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Every garment passes a multi-point physical verification protocol in Kumasi before listing. We verify zipper hardware, seam thread density, neck tags, and wash tags so you never receive a bootleg.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#25D366] flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <h4 className="text-lg font-serif italic text-white">2. Curation Over Volume</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                We drop tightly curated 15–20 piece runs rather than flooding our store with thousands of generic items. Every silhouette has a purpose and elevates your personal style and wardrobe aesthetic.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <h4 className="text-lg font-serif italic text-white">3. Local-First Logistics</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                We operate directly out of Kumasi with express parcel routes across Ghana. Enjoy same-day delivery in Kumasi and 24-hour door-to-door delivery in Accra, Tema, Takoradi, and Tamale.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <ZapOff size={24} />
              </div>
              <h4 className="text-lg font-serif italic text-white">4. No Fake Hype Strategy</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Honest pricing in GH₵ without artificial countdown pressure, inflated MSRP trickery, or hidden fees. Real collectors appreciate straight answers and authentic quality.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE DON'T DO: 4 Anti-Values */}
        <section className="bg-red-950/20 border border-red-900/30 p-8 sm:p-12 rounded-[2.5rem] space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-red-400">
              Our Hard Boundaries
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">
              What We Will Never Do
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h5 className="text-sm font-bold text-white mb-1">No Cheap Replica Restocks</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We refuse to flip low-grade synthetic knockoffs for fast profit. If a supplier sends us unverified replicas, we reject the parcel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h5 className="text-sm font-bold text-white mb-1">No Unverified Drops</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every single piece must sit on our inspection table in Kumasi first. We never drop virtual items that we haven't physically held.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h5 className="text-sm font-bold text-white mb-1">No Pressure Tactics & Upsells</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No forced checkout timers or sneaky cart add-ons. We respect your decision to cop when you are ready.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h5 className="text-sm font-bold text-white mb-1">No Misleading Sourcing</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We state clearly whether an item is factory surplus, deadstock thrift, or boutique techwear import. Full transparency always.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW WE SOURCE: Sourcing Explainer (~100 Words) */}
        <section className="bg-zinc-900/60 border border-zinc-800 p-8 sm:p-12 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <Layers className="text-[#00D1FF]" size={20} />
            <h3 className="text-2xl font-serif italic text-white">How We Source Our Vault</h3>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans max-w-3xl">
            Our sourcing network spans three distinct pipelines built over years of international fashion logistics:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#00D1FF] uppercase tracking-widest block">Pipeline 01</span>
              <h5 className="text-sm font-bold text-white">Verified China Importers</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct partnerships with boutique Guangzhou and Shenzhen technical apparel ateliers producing heavy-grade cotton and tactical nylon.
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#00D1FF] uppercase tracking-widest block">Pipeline 02</span>
              <h5 className="text-sm font-bold text-white">UK / Japan Thrift Deadstock</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hand-picked bale curations from vintage importers in West Africa, unearthing 90s/00s archival grails that are impossible to find in stores.
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#00D1FF] uppercase tracking-widest block">Pipeline 03</span>
              <h5 className="text-sm font-bold text-white">Factory Overruns & Samples</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Legitimate surplus stock and sample prototypes from premium fashion and garment production lines that pass our physical GSM and hardware checks.
              </p>
            </div>
          </div>
        </section>

        {/* MEET THE TEAM */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-[#00D1FF]">
              Behind The Vault
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif italic text-white">
              Meet The Kumasi Core Team
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Founder */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl text-center space-y-3">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border border-[#00D1FF]/40 shadow-xl">
                <img src={founderImg} alt="Leno Akowan" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Leno Akowan</h4>
                <p className="text-xs font-mono text-[#00D1FF] font-semibold">Founder & Chief Curator</p>
                <p className="text-[11px] text-zinc-400 mt-2 font-sans">
                  Oversees all drop selections, international sourcing relationships, and strategic vision from Kumasi.
                </p>
              </div>
            </div>

            {/* Team 2 */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-2xl font-mono font-black text-zinc-400">
                KO
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Kwame Osei</h4>
                <p className="text-xs font-mono text-emerald-400 font-semibold">Authentication & QC Lead</p>
                <p className="text-[11px] text-zinc-400 mt-2 font-sans">
                  Inspects every garment stitch, zipper, and seam density before approving items for site listing.
                </p>
              </div>
            </div>

            {/* Team 3 */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-2xl font-mono font-black text-zinc-400">
                AB
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Ama Boateng</h4>
                <p className="text-xs font-mono text-cyan-400 font-semibold">Logistics & Client Relations</p>
                <p className="text-[11px] text-zinc-400 mt-2 font-sans">
                  Manages VIP & STC dispatch hubs, tracking, and direct customer support across all regions in Ghana.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRESS & RECOGNITION PLACEHOLDERS */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Award size={16} className="text-[#00D1FF]" />
              Press & Circuit Recognition
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Culture Circuit Archive</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <blockquote className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-2">
              <Quote size={20} className="text-[#00D1FF]/60" />
              <p className="text-xs text-zinc-300 italic font-serif">
                "Closet Kraze has quietly built the most trusted archival fashion repository for collectors in West Africa, proving that local verification beats global hype."
              </p>
              <footer className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                — Kumasi Street Culture Digest (2025)
              </footer>
            </blockquote>

            <blockquote className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-2">
              <Quote size={20} className="text-[#25D366]/60" />
              <p className="text-xs text-zinc-300 italic font-serif">
                "By putting physical authentication and direct WhatsApp communication first, Leno Akowan is setting a new standard for fashion ecommerce in Ghana."
              </p>
              <footer className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                — Accra Fashion Circuit Spotlight
              </footer>
            </blockquote>
          </div>
        </section>

        {/* DIRECT WHATSAPP CTA CARD */}
        <section className="bg-gradient-to-r from-[#25D366]/20 via-zinc-900 to-emerald-950/40 border border-[#25D366]/40 p-8 sm:p-12 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center mx-auto shadow-lg">
              <WhatsAppIcon size={32} title="WhatsApp Contact" />
            </div>

            <h3 className="text-2xl sm:text-4xl font-serif italic text-white">
              Got questions about sizing, fabric weight, or upcoming drops?
            </h3>

            <p className="text-xs sm:text-sm text-zinc-300 font-sans">
              DM me directly on WhatsApp. I personally answer every question from our Kumasi vault.
            </p>

            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-[#25D366]/30 active:scale-95"
              >
                <WhatsAppIcon size={20} title="WhatsApp" />
                Got questions? DM me directly → +233 55 387 7937
              </a>
            </div>

            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pt-2">
              Fast Response Time • Mon–Sat 8am – 10pm GMT
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;
