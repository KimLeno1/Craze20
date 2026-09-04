import React from 'react';
import { motion } from 'motion/react';
import { Shield, Hammer, Clock, Lock } from 'lucide-react';

interface MaintenanceModeProps {
  onAdminAccess?: () => void;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ onAdminAccess }) => {
  const [clickCount, setClickCount] = React.useState(0);

  const handleShieldClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 15) {
      onAdminAccess?.();
      setClickCount(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00D1FF]/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-12">
        {/* Icon Cluster */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative inline-block"
        >
          <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center relative z-10">
            <Hammer className="w-12 h-12 text-[#00D1FF] animate-bounce" />
          </div>
          <div 
            onClick={handleShieldClick}
            className="absolute -top-4 -right-4 w-12 h-12 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center z-20 shadow-2xl cursor-pointer active:scale-95 transition-transform"
          >
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute inset-0 border border-[#00D1FF]/20 rounded-[3rem] -m-4"
          ></motion.div>
        </motion.div>

        {/* Messaging */}
        <div className="space-y-6">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl font-serif italic text-white tracking-tighter"
          >
            System_Maintenance
          </motion.h1>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-4"
          >
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">
              Our neural archives are currently undergoing architectural refinement. Access to the Social Gallery and acquisition floor is temporarily suspended.
            </p>
          </motion.div>
        </div>

        {/* Status Pills */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {[
            { label: 'Protocols', value: 'OFFLINE', icon: <Lock className="w-3 h-3" /> },
            { label: 'Estimated Return', value: 'TBD', icon: <Clock className="w-3 h-3" /> },
            { label: 'Integrity', value: '100%', icon: <Shield className="w-3 h-3" /> },
          ].map((item, i) => (
            <div key={i} className="glass-grey border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-3">
              <span className="text-zinc-500">{item.icon}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{item.label}:</span>
              <span className="text-[8px] font-black text-white uppercase tracking-widest">{item.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Welcome message detail */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="pt-12 border-t border-white/5"
        >
          <div className="text-[7px] font-black text-zinc-800 uppercase tracking-[0.8em]">
            Welcome to the Void // Closet Kraze
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
