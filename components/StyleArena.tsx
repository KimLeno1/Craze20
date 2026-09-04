
import React, { useState } from 'react';

interface ArenaEntry {
  id: string;
  user: string;
  avatar: string;
  outfitImg: string;
}

const MOCK_ENTRIES: ArenaEntry[] = [
  { id: 'e1', user: 'Leo_01', avatar: '👤', outfitImg: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=600' },
  { id: 'e2', user: 'X_Ghost', avatar: '👤', outfitImg: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600' },
  { id: 'e3', user: 'Elena_V', avatar: '👤', outfitImg: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600' }
];

interface StyleArenaProps {
  onVote: (entryId: string, score: number) => void;
  onExit: () => void;
}

const StyleArena: React.FC<StyleArenaProps> = ({ onVote, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  const handleVoteAction = (score: number) => {
    onVote(MOCK_ENTRIES[currentIndex].id, score);
    setVotesCount(prev => prev + 1);
    if (currentIndex < MOCK_ENTRIES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back for demo
    }
  };

  const entry = MOCK_ENTRIES[currentIndex];

  return (
    <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500">
      <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center">
        <div className="flex flex-col">
           <h2 className="text-xl font-serif italic text-white">The Style Arena</h2>
           <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest">Season 01: Midnight Gala</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-zinc-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-zinc-400">
              Votes Today: <span className="text-white">{votesCount}</span>
           </div>
           <button onClick={onExit} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-red-500/20 transition-colors">✕</button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg relative aspect-[3/4] group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="relative h-full w-full bg-zinc-950 rounded-[3rem] border border-white/10 overflow-hidden shadow-3xl">
            <img src={entry.outfitImg} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Entry" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            
            <div className="absolute bottom-10 left-10 right-10 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl backdrop-blur-xl border border-white/10">{entry.avatar}</div>
                  <div>
                    <div className="text-xl font-serif italic text-white">@{entry.user}</div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Circuit Participant</div>
                  </div>
               </div>
            </div>

            {/* Voting Controls Overlay */}
            <div className="absolute inset-x-0 bottom-24 flex justify-center gap-12 px-10">
               <button 
                onClick={() => handleVoteAction(-1)}
                className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl shadow-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
               >
                 👎
               </button>
               <button 
                onClick={() => handleVoteAction(1)}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-3xl shadow-2xl hover:bg-pink-500 hover:text-white transition-all active:scale-90"
               >
                 🔥
               </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
         Swipe or tap to vote • Earn 20 XP per session
      </footer>
    </div>
  );
};

export default StyleArena;
