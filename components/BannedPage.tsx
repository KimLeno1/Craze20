import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';

const BannedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md space-y-6"
      >
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Access Denied</h1>
        <p className="text-zinc-500 text-sm uppercase tracking-widest leading-relaxed">
          Your account has been restricted due to a violation of our community guidelines. Please contact support for further assistance.
        </p>
        <a 
          href="/"
          className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
        >
          <Home className="w-4 h-4" />
          Return to Lobby
        </a>
      </motion.div>
    </div>
  );
};

export default BannedPage;
