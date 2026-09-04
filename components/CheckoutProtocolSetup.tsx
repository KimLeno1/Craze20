import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckoutProtocol, UserPreferences } from '../types';
import { databaseService } from '../services/databaseService';

const REGIONS = [
  { id: 'accra', name: 'Greater Accra', icon: '🏛️', cities: ['Accra', 'Tema', 'Madina', 'Adenta', 'Ashaiman'] },
  { id: 'ashanti', name: 'Ashanti', icon: '🏺', cities: ['Kumasi', 'Obuasi', 'Ejisu', 'Konongo', 'Mampong'] },
  { id: 'western', name: 'Western', icon: '⚓', cities: ['Sekondi-Takoradi', 'Tarkwa', 'Axim', 'Elubo'] },
  { id: 'central', name: 'Central', icon: '🏰', cities: ['Cape Coast', 'Winneba', 'Kasoa', 'Saltpond'] },
  { id: 'eastern', name: 'Eastern', icon: '⛰️', cities: ['Koforidua', 'Nkawkaw', 'Nsawam', 'Akosombo'] },
  { id: 'northern', name: 'Northern', icon: '🕌', cities: ['Tamale', 'Yendi', 'Savelugu'] },
  { id: 'volta', name: 'Volta', icon: '🌊', cities: ['Ho', 'Hohoe', 'Kpando', 'Aflao'] },
  { id: 'bono', name: 'Bono', icon: '🌳', cities: ['Sunyani', 'Berekum', 'Dormaa Ahenkro'] },
  { id: 'bono-east', name: 'Bono East', icon: '🌽', cities: ['Techiman', 'Kintampo', 'Nkoranza'] },
  { id: 'ahafo', name: 'Ahafo', icon: '💎', cities: ['Goaso', 'Mim', 'Bechem'] },
  { id: 'upper-east', name: 'Upper East', icon: '🌞', cities: ['Bolgatanga', 'Bawku', 'Navrongo'] },
  { id: 'upper-west', name: 'Upper West', icon: '🏹', cities: ['Wa', 'Jirapa', 'Tumu'] },
  { id: 'savannah', name: 'Savannah', icon: '🐘', cities: ['Damongo', 'Buipe', 'Salaga'] },
  { id: 'north-east', name: 'North East', icon: '🛡️', cities: ['Nalerigu', 'Gambaga', 'Walewale'] },
  { id: 'oti', name: 'Oti', icon: '🛶', cities: ['Dambai', 'Jasikan', 'Nkwanta'] },
  { id: 'western-north', name: 'Western North', icon: '🌲', cities: ['Sefwi Wiawso', 'Enchi', 'Bibiani'] }
];

interface Props {
  userId: string;
  onComplete: (prefs: UserPreferences) => void;
  onSkip: (prefs: UserPreferences) => void;
}

export const CheckoutProtocolSetup: React.FC<Props> = ({ userId, onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    region: '',
    city: ''
  });

  React.useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await databaseService.getProtocolSession('checkout');
        if (session) {
          setStep(session.currentStep);
          setFormData(prev => ({ ...prev, ...session.sessionData }));
        }
      } catch (e) {
        console.warn('Failed to load checkout session', e);
      }
    };
    loadSession();
  }, []);

  const saveSession = async (currentStep: number) => {
    try {
      await databaseService.saveProtocolSession('checkout', currentStep, formData);
    } catch (e) {
      console.warn('Failed to save checkout session', e);
    }
  };

  const availableCities = REGIONS.find(r => r.name === formData.region)?.cities || [];

  const handleNext = async () => {
    if (step === 0) {
      if (!formData.region || !formData.city) {
        toast.error("Region and City are required.");
        return;
      }
      const nextStep = 1;
      setStep(nextStep);
      saveSession(nextStep);
    } else {
      if (!formData.name || !formData.phone || !formData.address) {
        toast.error("All logistics fields are required.");
        return;
      }

      try {
        const protocol: CheckoutProtocol = {
          id: `proto_${Date.now()}`,
          ...formData
        };
        // Save the first logistics element
        await databaseService.saveUserLogistics(userId, [protocol]);
        
        // Clear session on completion
        await databaseService.deleteProtocolSession('checkout');

        // Update userPrefs for checkoutProtocolCompleted
        const prefs = await databaseService.getUserPreferences(userId) || { userId, preferredCategories: [], preferredGenders: [] };
        const updatedPrefs = { ...prefs, checkoutProtocolCompleted: true, userId };
        await databaseService.saveUserPreferences(userId, updatedPrefs);
        
        toast.success("Checkout Protocol secured.");
        onComplete(updatedPrefs);
      } catch (e) {
        toast.error("Failed to secure logistics. Try again.");
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      saveSession(prevStep);
    }
  };

  const handleSkip = async () => {
    try {
        await databaseService.deleteProtocolSession('checkout');
        const prefs = await databaseService.getUserPreferences(userId) || { userId, preferredCategories: [], preferredGenders: [] };
        const updatedPrefs = { ...prefs, checkoutProtocolCompleted: true, userId };
        await databaseService.saveUserPreferences(userId, updatedPrefs);
        onSkip(updatedPrefs);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-2xl w-full bg-[#0F52BA]/15 backdrop-blur-[40px] saturate-[200%] border border-[#0F52BA]/40 p-6 md:p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(15,82,186,0.35),inset_0_1px_4px_rgba(255,255,255,0.4)] overflow-hidden"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-serif italic text-white tracking-tighter">What is your address(location)?</h2>
          <p className="text-[10px] md:text-xs font-black text-blue-200 uppercase tracking-[0.3em] mt-2">Delivery Details</p>
        </div>

        {step === 0 ? (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-center">What is your region?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setFormData({...formData, region: r.name, city: ''})}
                  className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${formData.region === r.name ? 'bg-white border-white shadow-lg' : 'bg-white/10 border-white/10 hover:border-white/30 hover:bg-white/15'}`}
                >
                  <span className={`text-xl transition-all ${formData.region === r.name ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`}>{r.icon}</span>
                  <span className={`text-[8px] font-black uppercase text-center tracking-widest transition-colors ${formData.region === r.name ? 'text-[#0F52BA]' : 'text-white/80 group-hover:text-white'}`}>{r.name}</span>
                </button>
              ))}
            </div>

            {formData.region && (
              <div className="space-y-4 animate-in fade-in pt-4">
                <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest px-2">Select City</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableCities.map(city => (
                    <button
                      key={city}
                      onClick={() => setFormData({...formData, city})}
                      className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formData.city === city ? 'bg-white text-[#0F52BA] border-white shadow-lg' : 'bg-white/10 border-white/10 text-white hover:border-white/30'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-center">LOGISTICS</h3>
            <div className="space-y-4">
              <input type="text" placeholder="FULL NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/10 border border-white/20 hover:border-white/40 focus:border-white p-4 rounded-2xl text-xs font-bold text-white placeholder-white/50 outline-none transition-all" />
              <input type="text" placeholder="PHONE NUMBER" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/10 border border-white/20 hover:border-white/40 focus:border-white p-4 rounded-2xl text-xs font-bold text-white placeholder-white/50 outline-none transition-all" />
              <textarea placeholder="DELIVERY ADDRESS" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white/10 border border-white/20 hover:border-white/40 focus:border-white p-4 rounded-2xl text-xs font-bold text-white placeholder-white/50 outline-none h-24 custom-scrollbar transition-all" />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10">
          {step > 0 ? (
            <button onClick={handleBack} className="text-[10px] font-black text-white/50 uppercase tracking-widest hover:text-white transition-all">Back</button>
          ) : (
            <button onClick={handleSkip} className="text-[10px] font-black text-white/50 uppercase tracking-widest hover:text-white transition-all">Skip</button>
          )}
          
          <button onClick={handleNext} className="bg-white text-[#0F52BA] px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/90 hover:scale-[1.02] transition-all shadow-[0_10px_25px_rgba(255,255,255,0.15)]">
            {step === 0 ? 'Next' : 'Save Address'}
          </button>
        </div>
      </motion.div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.45);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
