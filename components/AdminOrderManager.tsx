
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { toast } from 'sonner';

interface AdminOrderManagerProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, tracking?: string) => void;
}

const AdminOrderManager: React.FC<AdminOrderManagerProps> = ({ orders, onUpdateStatus }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    if (status === OrderStatus.CANCELLED) {
      if (!window.confirm('Are you sure you want to cancel this order? This will automatically initiate a refund to the user\'s wallet.')) {
        return;
      }
    }
    
    onUpdateStatus(orderId, status, trackingInput);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status, trackingNumber: trackingInput });
    }
    
    if (status === OrderStatus.CANCELLED) {
      toast.success('Order Cancelled & Refund Initiated');
    } else {
      toast.success(`Order Status Updated to ${status}`);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif italic text-zinc-950">Order Management</h2>
        <div className="flex gap-4">
          <div className="bg-zinc-50 px-6 py-2 rounded-xl border border-zinc-200 flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">System Link Active</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`bg-white p-8 rounded-[2.5rem] border shadow-sm transition-all duration-500 ${selectedOrder?.id === order.id ? 'border-blue-600/50 bg-blue-50/10' : 'border-zinc-200 hover:border-blue-600/20'}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black font-mono text-zinc-950">{order.id}</span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    order.status === OrderStatus.DELIVERED ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    order.status === OrderStatus.CANCELLED ? 'bg-red-50 text-red-600 border border-red-100' :
                    order.status === OrderStatus.SHIPPED ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    order.status === OrderStatus.PROCESSING ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-yellow-50 text-yellow-600 border border-yellow-100'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer</div>
                  <div className="text-sm font-serif italic text-zinc-700">@{order.userName}</div>
                </div>
              </div>

              <div className="flex-1 lg:px-12 space-y-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order Items</div>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                        <img src={item.image} className="w-full h-full object-cover grayscale" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">
                          {item.quantity}x {item.name}
                        </span>
                        {item.selectedColorVariant && (
                          <div className="flex items-center gap-1.5 mt-1 border-t border-zinc-200 pt-1">
                            <div className="flex -space-x-0.5">
                              <div className="w-1.5 h-1.5 rounded-full border border-black/10 z-10" style={{ backgroundColor: item.selectedColorVariant.main }} />
                              <div className="w-1.5 h-1.5 rounded-full border border-black/10" style={{ backgroundColor: item.selectedColorVariant.secondary }} />
                            </div>
                            <span className="text-[7px] font-bold text-zinc-400 uppercase">
                              {item.selectedColorVariant.main} / {item.selectedColorVariant.secondary}
                            </span>
                          </div>
                        )}
                        {item.customizationData && Object.keys(item.customizationData).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(item.customizationData).map(([fieldId, value]) => (
                              <span key={fieldId} className="text-[7px] font-bold text-amber-600/80 uppercase">
                                {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Amount</div>
                  <div className="text-2xl font-black font-mono text-zinc-950 tracking-tighter">GH₵{order.total}</div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedOrder(order);
                    setTrackingInput(order.trackingNumber || '');
                  }}
                  className="w-12 h-12 rounded-2xl border border-zinc-200 flex items-center justify-center text-xl hover:bg-zinc-950 hover:text-white transition-all shadow-sm"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {selectedOrder?.id === order.id && (
              <div className="mt-8 pt-8 border-t border-zinc-100 animate-in slide-in-from-top-4 duration-500">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Shipping Details</label>
                    <div className="text-xs font-medium text-zinc-700 bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-3">
                      {(() => {
                        try {
                          const logistics = JSON.parse(order.deliveryAddress);
                          return (
                            <>
                              <div className="flex justify-between border-b border-zinc-100 pb-2">
                                <span className="text-[8px] font-black text-zinc-400 uppercase">Region</span>
                                <span className="text-blue-600 font-bold">{logistics.region}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-100 pb-2">
                                <span className="text-[8px] font-black text-zinc-400 uppercase">City</span>
                                <span className="text-blue-600 font-bold">{logistics.city}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-100 pb-2">
                                <span className="text-[8px] font-black text-zinc-400 uppercase">Phone</span>
                                <span>{logistics.phone}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-100 pb-2">
                                <span className="text-[8px] font-black text-zinc-400 uppercase">Email</span>
                                <span>{logistics.email}</span>
                              </div>
                              <div className="pt-2">
                                <span className="text-[8px] font-black text-zinc-400 uppercase block mb-1">Spatial Coordinates</span>
                                <p className="text-[10px] leading-relaxed italic">"{logistics.address}"</p>
                              </div>
                            </>
                          );
                        } catch (e) {
                          return <p className="text-[10px] italic">{order.deliveryAddress}</p>;
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Tracking Number</label>
                    <input 
                      type="text" 
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="Enter Tracking Number..."
                      className="w-full bg-white border border-zinc-200 px-6 py-4 rounded-2xl text-xs font-mono text-zinc-950 focus:border-blue-600 transition-all outline-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Update Status</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(OrderStatus).map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(order.id, status)}
                          className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                            order.status === status 
                            ? 'bg-zinc-950 text-white border-zinc-950' 
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrderManager;
