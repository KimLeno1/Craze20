import React, { useState } from 'react';
import { CartItem, PayForMeRequest } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Share2, Download, CreditCard, Mail } from 'lucide-react';

interface PayForMeShareModalProps {
  items: CartItem[];
  total: number;
  onClose: () => void;
}

const PayForMeShareModal: React.FC<PayForMeShareModalProps> = ({ items, total, onClose }) => {
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<PayForMeRequest | null>(null);

  const handleDownloadVCard = (request: PayForMeRequest) => {
    const product = request.items[0];
    const shareLink = `${window.location.origin}/payformeshared/${request.userName}/${product.id}/${request.id}`;
    
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:Pay For Me: ${request.userName}`,
      `ORG:Closet Kraze Sponsorship`,
      `TITLE:Payment Request for ${product.name}`,
      `REV:${new Date().toISOString()}`,
      `NOTE:Please sponsor this item: ${shareLink}\nMessage: ${request.message || 'Help me get this!'}`,
      `URL:${shareLink}`,
      'END:VCARD'
    ].join('\n');

    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${request.userName}_PayForMe.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('VCard downloaded successfully');
  };

  const handleCopyAsCard = async (request: PayForMeRequest) => {
    const product = request.items[0];
    const shareLink = `${window.location.origin}/payformeshared/${request.userName}/${product.id}/${request.id}`;
    
    const cardText = `
🌟 CLOSET KRAZE SPONSORSHIP CARD 🌟
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 REQUESTER: ${request.userName}
📦 ITEM: ${product.name}
💰 TOTAL GOAL: GH₵${request.total}
💬 MESSAGE: "${request.message || 'I would love to have this item!'}"

🔗 SPONSOR HERE:
${shareLink}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for your support! ✨
    `.trim();

    await navigator.clipboard.writeText(cardText);
    toast.success('Stylized Card copied to clipboard!');
  };

  const handleCreateRequest = async () => {
    const userId = localStorage.getItem('cc-user-id');
    const userName = localStorage.getItem('cc-user-handle') || 'Anonymous';
    
    if (!userId) {
      toast.error('Please log in to create a Pay for Me request.');
      return;
    }

    setIsCreating(true);
    try {
      const request = await databaseService.createPayForMeRequest({
        userId,
        userName,
        items,
        total,
        amountPaid: 0,
        message
      });
      
      setCreatedRequest(request);
      const product = request.items[0];
      const shareLink = `${window.location.origin}/payformeshared/${request.userName}/${product.id}/${request.id}`;
      await navigator.clipboard.writeText(shareLink);
      
      toast.success('Pay for Me request created and link copied to clipboard!');
      // onClose();
    } catch (error) {
      console.error('Failed to create Pay for Me request:', error);
      toast.error('Failed to create Pay for Me request.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-grey w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
        <h2 className="text-2xl font-serif italic text-white">Share for Pay for Me</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message to your request..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm"
          rows={3}
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancel</button>
          <button onClick={handleCreateRequest} disabled={isCreating} className="flex-[2] py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#00D1FF] hover:text-white transition-all shadow-lg">
            {isCreating ? 'Creating Protocol...' : 'Initialize Request'}
          </button>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Advanced Sharing Formats</div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={async () => {
                 if (createdRequest) {
                   handleCopyAsCard(createdRequest);
                 } else {
                   toast.info('Create the request first to enable advanced sharing.');
                 }
              }}
              className="flex items-center justify-center gap-3 p-4 glass-light border border-white/5 rounded-2xl hover:border-[#00D1FF]/30 transition-all group"
            >
              <CreditCard className="w-4 h-4 text-zinc-500 group-hover:text-[#00D1FF]" />
              <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase">Card</span>
            </button>
            <button 
              onClick={() => {
                if (createdRequest) {
                  handleDownloadVCard(createdRequest);
                } else {
                  toast.info('Create the request first to enable advanced sharing.');
                }
              }}
              className="flex items-center justify-center gap-3 p-4 glass-light border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all group"
            >
              <Mail className="w-4 h-4 text-zinc-500 group-hover:text-amber-500" />
              <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase">VCard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayForMeShareModal;
