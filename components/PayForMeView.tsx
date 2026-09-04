import React, { useState, useEffect } from 'react';
import { PayForMeRequest, PayForMeStatus } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

interface PayForMeViewProps {
  requestId: string;
}

const PayForMeView: React.FC<PayForMeViewProps> = ({ requestId }) => {
  const [request, setRequest] = useState<PayForMeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const requests = await databaseService.getPayForMeRequests();
        const found = requests.find(r => r.id === requestId);
        setRequest(found || null);
        if (found) {
          setPaymentAmount(found.total - found.amountPaid);
        }
      } catch (error) {
        console.error('Failed to fetch request:', error);
        toast.error('Failed to load Pay for Me request.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const handlePay = async () => {
    if (!request) return;
    
    // TODO: Implement actual payment logic
    toast.success(`Paid GH₵${paymentAmount} towards the acquisition!`);
    
    // Update request status/amountPaid
    try {
      // For now, just simulate update
      await databaseService.updatePayForMeStatus(request.id, PayForMeStatus.PAID);
      toast.success('Payment recorded.');
    } catch (error) {
      console.error('Failed to update payment:', error);
      toast.error('Failed to record payment.');
    }
  };

  if (loading) return <div className="text-white p-12">Loading...</div>;
  if (!request) return <div className="text-white p-12">Request not found.</div>;

  const remaining = request.total - request.amountPaid;

  return (
    <div className="p-8 md:p-12 space-y-8 text-white">
      <h1 className="text-4xl font-serif italic">Pay for Me Request</h1>
      <div className="glass-light p-6 rounded-3xl space-y-4">
        <p>Total: GH₵{request.total}</p>
        <p>Paid: GH₵{request.amountPaid}</p>
        <p className="text-xl font-black text-[#00D1FF]">Remaining: GH₵{remaining}</p>
      </div>
      
      {remaining > 0 && (
        <div className="space-y-4">
          <input 
            type="number" 
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
          />
          <button onClick={handlePay} className="w-full py-4 bg-[#00D1FF] text-black rounded-xl font-black uppercase">
            Pay GH₵{paymentAmount}
          </button>
        </div>
      )}
    </div>
  );
};

export default PayForMeView;
