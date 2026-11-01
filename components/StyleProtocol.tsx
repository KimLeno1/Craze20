import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { Category, Gender, UserPreferences } from '../types';
import { databaseService } from '../services/databaseService';

interface StyleProtocolProps {
  userId: string;
  onComplete: (prefs: UserPreferences) => void;
  onClose: () => void;
  initialStep?: number;
}

const GENDERS: Gender[] = ['Male', 'Female', 'UNISEX'];

export const StyleProtocol: React.FC<StyleProtocolProps> = ({ userId, onComplete, onClose, initialStep = 0 }) => {
  const [step, setStep] = useState(initialStep);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<Gender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  React.useEffect(() => {
    const loadProtocolData = async () => {
      try {
        const [tags, cats] = await Promise.all([
          databaseService.getTags(),
          databaseService.getCategories()
        ]);
        setAvailableTags(tags.map((t: any) => t.name));
        setAvailableCategories(['All', ...cats.map((c: any) => c.name as Category)]);
      } catch (error) {
        console.error('Failed to load protocol metadata:', error);
        // Fallback to defaults if backend fails
        setAvailableTags(['Street', 'Old Money', 'Simple', 'Cyber', 'Avant-Garde', 'Minimalist', 'Vintage', 'Gorpcore', 'Y2K', 'Preppy', 'Grunge', 'Boho']);
        setAvailableCategories(['All', 'Apparel', 'Footwear', 'Accessories', 'Kits', 'Fragments', 'Home', 'Beauty']);
      }
    };
    loadProtocolData();
  }, []);

  React.useEffect(() => {
    const loadPrefsAndSession = async () => {
      if (!userId || userId === 'u1' || userId === 'guest') {
        setIsLoading(false);
        return;
      }
      try {
        const [prefs, session] = await Promise.all([
          databaseService.getUserPreferences(userId),
          databaseService.getProtocolSession('style')
        ]);

        if (session) {
          setStep(session.currentStep);
          const data = session.sessionData;
          if (data.archetypes) setSelectedArchetypes(data.archetypes);
          if (data.categories) setSelectedCategories(data.categories);
          if (data.genders) setSelectedGenders(data.genders);
        } else if (prefs) {
          setSelectedArchetypes(prefs.styleArchetype ? prefs.styleArchetype.split(',') : []);
          setSelectedCategories(prefs.preferredCategories || []);
          setSelectedGenders(prefs.preferredGenders || []);
        }
      } catch (error) {
        console.error('Error loading preferences/session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrefsAndSession();
  }, [userId]);

  const saveSession = async (currentStep: number) => {
    try {
      if (userId && userId !== 'guest') {
        await databaseService.saveProtocolSession('style', currentStep, {
          archetypes: selectedArchetypes,
          categories: selectedCategories,
          genders: selectedGenders
        });
      }
    } catch (e) {
      console.warn('Failed to save protocol session', e);
    }
  };

  const handleNext = async () => {
    if (step < 2) {
      const nextStep = step + 1;
      setStep(nextStep);
      saveSession(nextStep);
    } else {
      const prefs: UserPreferences = {
        userId,
        preferredCategories: selectedCategories,
        preferredGenders: selectedGenders,
        styleArchetype: selectedArchetypes.join(','),
        styleProtocolCompleted: true,
      };
      try {
        if (userId && userId !== 'guest') {
          await databaseService.saveUserPreferences(userId, prefs);
          await databaseService.deleteProtocolSession('style');
        }
        onComplete(prefs);
      } catch (error) {
        console.error('Error saving preferences:', error);
        onComplete(prefs);
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
    const prefs: UserPreferences = {
      userId,
      preferredCategories: [],
      preferredGenders: [],
      styleArchetype: '',
      styleProtocolCompleted: true,
    };
    try {
      if (userId && userId !== 'guest') {
        await databaseService.saveUserPreferences(userId, prefs);
      }
      onComplete(prefs);
    } catch (error) {
      console.error('Error skipping style protocol:', error);
      onComplete(prefs);
    }
  };

  const toggleArchetype = (tag: string) => {
    setSelectedArchetypes(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleCategory = (cat: Category) => {
    if (cat === 'All') {
      setSelectedCategories(prev => prev.includes('All') ? [] : ['All', ...availableCategories.filter(c => c !== 'All')]);
      return;
    }
    setSelectedCategories(prev => {
      const newCats = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      if (newCats.length === availableCategories.length - 1 && !newCats.includes('All')) {
        return ['All', ...newCats];
      }
      return newCats.filter(c => c !== 'All');
    });
  };

  const toggleGender = (gen: Gender) => {
    setSelectedGenders(prev => 
      prev.includes(gen) ? prev.filter(g => g !== gen) : [...prev, gen]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-2xl my-auto text-zinc-900"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-950 transition-colors z-10 cursor-pointer rounded-full hover:bg-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#0F52BA]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif italic text-zinc-950">What is your dressing style?</h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-semibold">Step {step + 1} of 3</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div 
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900">Select Your Styles</h3>
                  <p className="text-zinc-500 text-xs sm:text-sm">Choose tags that define your fashion taste.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleArchetype(tag)}
                      className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full border text-xs sm:text-sm font-black tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                        selectedArchetypes.includes(tag)
                          ? 'bg-[#0F52BA] border-[#0F52BA] text-white shadow-md scale-[1.02]'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-[#0F52BA]/40 hover:bg-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900">Preferred Categories</h3>
                  <p className="text-zinc-500 text-xs sm:text-sm">Select the types of items you want to see in your feed.</p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full border text-xs sm:text-sm font-black tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategories.includes(cat)
                          ? 'bg-[#0F52BA] border-[#0F52BA] text-white shadow-md scale-[1.02]'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-[#0F52BA]/40 hover:bg-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900">Gender Preference</h3>
                  <p className="text-zinc-500 text-xs sm:text-sm">Help us tailor recommendations to you.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {GENDERS.map((gen) => (
                    <button
                      key={gen}
                      onClick={() => toggleGender(gen)}
                      className={`p-4 sm:p-6 rounded-2xl border flex flex-col items-center gap-2 sm:gap-3 transition-all cursor-pointer ${
                        selectedGenders.includes(gen)
                          ? 'bg-blue-50/80 border-[#0F52BA] text-[#0F52BA] shadow-sm font-black'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-white font-bold'
                      }`}
                    >
                      <span className="text-xs sm:text-sm uppercase tracking-widest">{gen}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 sm:mt-12 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-4 text-sm sm:text-base">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className={`flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer ${
                  step === 0 ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Back
              </button>
              <button
                onClick={handleSkip}
                className="text-zinc-400 hover:text-zinc-900 transition-colors font-bold uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Skip Quiz
              </button>
            </div>
            <button
              onClick={handleNext}
              disabled={(step === 0 && selectedArchetypes.length === 0) || (step === 1 && selectedCategories.length === 0) || (step === 2 && selectedGenders.length === 0)}
              className="flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-[#0F52BA] text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-[#0B132B] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              {step === 2 ? 'Done' : 'Next'}
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </motion.div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default StyleProtocol;
