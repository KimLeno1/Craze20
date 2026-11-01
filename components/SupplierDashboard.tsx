
import React, { useState, useEffect } from 'react';
import { Product, Supplier, Order, OrderStatus } from '../types';
import { databaseService } from '../services/databaseService';
import SupplierProductEditor from './SupplierProductEditor';
import SupplierWalletView from './SupplierWalletView';
import { Package, LayoutDashboard, ShoppingBag, User, LogOut, CheckCircle, Clock, Truck, XCircle, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton, OrderSkeleton } from './Skeleton';

interface SupplierDashboardProps {
  supplierId: string;
  onLogout: () => void;
  onProductsChange?: () => void;
}

type Tab = 'DASHBOARD' | 'PRODUCTS' | 'ORDERS' | 'ANOMALIES' | 'WALLET';

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ supplierId, onLogout, onProductsChange }) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Anomaly State
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [newAnomaly, setNewAnomaly] = useState({
    productId: '',
    discountedPrice: 0,
    duration: 2
  });

  useEffect(() => {
    refreshData();
  }, [supplierId]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Check auth
      const authData = await databaseService.checkAuth();
      if (!authData.success) {
        onLogout();
        return;
      }
      
      // Fetch data in parallel
      const [currentSupplier, myProducts, myOrders, myAnomalies] = await Promise.all([
        databaseService.getSupplierById(supplierId),
        databaseService.getSupplierProducts(supplierId),
        databaseService.getSupplierOrders(supplierId),
        databaseService.getSupplierAnomalies(supplierId)
      ]);

      if (currentSupplier) setSupplier(currentSupplier);
      setProducts(myProducts);
      setOrders(myOrders);
      setAnomalies(myAnomalies);
    } catch (error) {
      toast.error('Data refresh error.');
      console.error('Data refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (formData: Partial<Product>) => {
    try {
      await databaseService.saveProduct({ ...formData, supplierId });
      setIsEditorOpen(false);
      await refreshData();
      if (onProductsChange) onProductsChange();
      toast.success('Product saved successfully.');
    } catch (error) {
      toast.error('Error saving product.');
      console.error('Save product error:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await databaseService.updateOrderStatus(orderId, status);
      await refreshData();
      toast.success('Order status updated.');
    } catch (error) {
      toast.error('Error updating order status.');
      console.error('Update order error:', error);
    }
  };

  const handleCreateAnomaly = async () => {
    try {
      const anomaly = {
        id: `anomaly_${Date.now()}`,
        productId: newAnomaly.productId,
        price: newAnomaly.discountedPrice,
        anomalyEndTime: Date.now() + newAnomaly.duration * 60 * 60 * 1000,
        discountPercent: Math.round((1 - newAnomaly.discountedPrice / (products.find(p => p.id === newAnomaly.productId)?.price || 1)) * 100)
      };
      
      await databaseService.createPriceAnomaly(anomaly);
      setIsAnomalyModalOpen(false);
      await refreshData();
      toast.success('Anomaly created successfully.');
    } catch (error) {
      toast.error('Error creating anomaly.');
      console.error('Create anomaly error:', error);
    }
  };

  const handleDeleteAnomaly = async (id: string) => {
    try {
      await databaseService.deletePriceAnomaly(id);
      await refreshData();
      toast.success('Anomaly terminated.');
    } catch (error) {
      toast.error('Error terminating anomaly.');
      console.error('Delete anomaly error:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditorOpen(true);
  };

  const handleRegister = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  if (isLoading && !supplier) {
    return (
      <div className="fixed inset-0 z-[300] bg-white text-zinc-950 flex font-sans overflow-hidden">
        <aside className="w-24 md:w-72 bg-zinc-50 border-r border-zinc-100 flex flex-col">
           <div className="p-8 border-b border-zinc-100">
              <Skeleton className="h-8 w-full" />
           </div>
           <div className="flex-1 p-4 space-y-4 mt-8">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
           </div>
        </aside>
        <div className="flex-1 flex flex-col">
           <header className="h-20 bg-white border-b border-zinc-100 px-10 flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-32" />
           </header>
           <main className="p-10 md:p-16 space-y-8">
              <div className="grid grid-cols-3 gap-8">
                 {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />)}
              </div>
              <Skeleton className="h-96 w-full rounded-[3rem]" />
           </main>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-zinc-950">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-serif italic">Node Link Failed</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Supplier data could not be retrieved.</p>
          <button onClick={onLogout} className="mt-6 px-6 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-black uppercase hover:bg-zinc-100 transition-all">
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (supplier.status !== 'ACTIVE') {
    return (
      <div className="fixed inset-0 z-[1000] bg-white text-zinc-950 font-sans flex items-center justify-center p-6 text-center">
         <div className="space-y-8 max-w-lg animate-in fade-in duration-1000">
            <h1 className="text-6xl font-black uppercase tracking-tighter text-zinc-100 select-none">NODE_LOCKED</h1>
            <div className="p-12 border border-zinc-100 rounded-[4rem] space-y-6 bg-white shadow-2xl">
                <div className="text-4xl animate-pulse">🔒</div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-blue-600">UPLINK_RESTRICTED</h2>
                <div className="h-px w-20 bg-zinc-100 mx-auto"></div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-relaxed">
                   YOUR NODE IDENTITY HAS NOT BEEN VALIDATED BY THE CENTRAL PROTOCOL.<br/>
                   PLEASE WAIT FOR ADMIN ACTIVATION BEFORE ATTEMPTING LOGISTICS SYNCHRONIZATION.
                </p>
                <div className="pt-6">
                   <button 
                    onClick={async () => {
                      try {
                        await databaseService.logout('SUPPLIER');
                      } catch (e) {}
                      onLogout();
                    }} 
                    className="px-10 py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                  >
                      ABORT_SYSTEM_LINK
                   </button>
                </div>
            </div>
            <p className="text-[8px] text-zinc-300 uppercase tracking-[0.5em]">System_Code: 403_ACTIVATION_PENDING</p>
         </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 space-y-4">
               <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-10" />
               </div>
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))
        ) : (
          <>
            <div className="lg:col-span-1"></div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 space-y-4 hover:border-blue-600/30 transition-all cursor-pointer shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sync Score</span>
                <span className="text-emerald-600 text-xs font-black">Optimal</span>
              </div>
              <div className="text-3xl font-mono font-black text-zinc-950">{supplier?.performanceScore}%</div>
              <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${supplier?.performanceScore}%` }}></div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 space-y-4 hover:border-blue-600/30 transition-all cursor-pointer shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Silhouettes</span>
                <span className="text-blue-600 text-xs font-black">Linked</span>
              </div>
              <div className="text-3xl font-mono font-black text-zinc-950">{products.length}</div>
              <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[60%]"></div>
              </div>
            </div>
          </>
        )}
      </div>

      <section className="bg-white border border-zinc-100 rounded-[3rem] p-10 space-y-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">👤</div>
          <div>
            <h3 className="text-xl font-serif italic text-zinc-950">Supplier Profile</h3>
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Node Identity & Supplier Panel</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {isLoading || !supplier ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="space-y-6">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-2 w-24" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ))
          ) : (
            <>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Organization Name</label>
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl text-sm font-bold text-zinc-950">{supplier.name}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Contact Protocol</label>
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl text-sm font-bold text-zinc-950">{supplier.contactEmail}</div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Operational Region</label>
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl text-sm font-bold text-zinc-950">{supplier.region}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Connection Status</label>
                  <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-zinc-950 uppercase tracking-widest">{supplier.status}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-zinc-100 pb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-serif italic text-zinc-950">Product Catalog</h3>
          <p className="text-[8px] text-zinc-400 font-black tracking-widest uppercase">Manage your products and inventory</p>
        </div>
        <button 
          onClick={handleRegister}
          className="bg-zinc-950 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all rounded-2xl shadow-xl"
        >
          Upload Product
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] flex items-center gap-8">
              <Skeleton className="w-24 h-32 rounded-3xl" />
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex gap-6">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : products.map(p => (
          <div key={p.id} className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] flex items-center gap-8 hover:border-blue-600/20 transition-all group relative overflow-hidden shadow-sm">
             <div className="w-24 h-32 rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100  transition-all shadow-md">
                <img src={p.image} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 space-y-4">
                <div>
                  <div className="text-lg font-black text-zinc-950 uppercase tracking-tight">{p.name}</div>
                  <div className="text-[9px] text-zinc-400 font-mono mt-1 uppercase tracking-widest">
                    SKU_{p.id} // STOCK: {p.stockCount}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                   <div>
                      <div className="text-[8px] text-zinc-300 uppercase tracking-widest mb-1">Valuation</div>
                      <div className="text-xl font-mono font-black text-zinc-950">GH₵{p.price}</div>
                   </div>
                </div>
             </div>
             <button 
               onClick={() => handleEdit(p)}
               className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
             >
               ⚙️
             </button>
          </div>
        ))}
        {products.length === 0 && (
           <div className="col-span-full py-32 text-center border border-dashed border-zinc-100 rounded-[3rem] space-y-6">
              <div className="text-6xl opacity-10">📦</div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 italic">No supply records detected in this node.</p>
           </div>
        )}
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-zinc-100 pb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-serif italic text-zinc-950">Flash Sales & Discounts</h3>
          <p className="text-[8px] text-zinc-400 font-black tracking-widest uppercase">Set up limited-time sale events</p>
        </div>
        <button 
          onClick={() => setIsAnomalyModalOpen(true)}
          className="bg-emerald-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-950 transition-all rounded-2xl shadow-xl"
        >
          Create New Sale
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {anomalies.map(a => {
          const product = products.find(p => p.id === a.productId);
          if (!product) return null;
          return (
            <div key={a.id} className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] flex items-center gap-8 hover:border-blue-600/20 transition-all group relative overflow-hidden shadow-sm">
               <div className="w-24 h-32 rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100  transition-all shadow-md">
                  <img src={product.image} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-lg font-black text-zinc-950 uppercase tracking-tight">{product.name}</div>
                    <div className="text-[9px] text-blue-600 font-black mt-1 uppercase tracking-widest">
                      SALE_ACTIVE // STATUS: {a.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <div>
                        <div className="text-[8px] text-zinc-300 uppercase tracking-widest mb-1">Sale Price</div>
                        <div className="text-xl font-mono font-black text-zinc-950">GH₵{a.discountedPrice}</div>
                     </div>
                     <div className="h-8 w-px bg-zinc-100"></div>
                     <div>
                        <div className="text-[8px] text-zinc-300 uppercase tracking-widest mb-1">Time Remaining</div>
                        <div className="text-xl font-mono font-black text-blue-600">
                          {Math.max(0, Math.floor((a.endTime - Date.now()) / (1000 * 60)))}m
                        </div>
                     </div>
                  </div>
               </div>
               <button 
                 onClick={() => handleDeleteAnomaly(a.id)}
                 className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
               >
                 End Sale
               </button>
            </div>
          );
        })}
        {anomalies.length === 0 && (
           <div className="col-span-full py-32 text-center border border-dashed border-zinc-100 rounded-[3rem] space-y-6">
              <div className="text-6xl opacity-10">⚡</div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 italic">No flash sales active right now.</p>
           </div>
        )}
      </div>

      {isAnomalyModalOpen && (
        <div className="fixed inset-0 z-[400] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white border border-blue-600/30 w-full max-w-xl rounded-[3rem] p-12 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-3xl font-serif italic text-zinc-950">Create Flash Sale</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Set Discount Price and Duration</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Select Product</label>
                <select 
                  value={newAnomaly.productId}
                  onChange={e => {
                    const p = products.find(prod => prod.id === e.target.value);
                    setNewAnomaly({
                      ...newAnomaly, 
                      productId: e.target.value,
                      discountedPrice: p ? Math.floor(p.price * 0.8) : 0
                    });
                  }}
                  className="w-full bg-zinc-50 border border-zinc-100 p-4 rounded-xl text-sm text-zinc-950 outline-none focus:border-blue-600 shadow-inner"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (GH₵{p.price})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Sale Price (GH₵)</label>
                  <input 
                    type="number"
                    value={newAnomaly.discountedPrice}
                    onChange={e => setNewAnomaly({...newAnomaly, discountedPrice: parseInt(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-100 p-4 rounded-xl text-sm text-zinc-950 outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Duration (Hours)</label>
                  <input 
                    type="number"
                    value={newAnomaly.duration}
                    onChange={e => setNewAnomaly({...newAnomaly, duration: parseInt(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-100 p-4 rounded-xl text-sm text-zinc-950 outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleCreateAnomaly}
                disabled={!newAnomaly.productId}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-950 transition-all disabled:opacity-50 shadow-lg"
              >
                Initialize Protocol
              </button>
              <button 
                onClick={() => setIsAnomalyModalOpen(false)}
                className="flex-1 bg-zinc-100 text-zinc-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 hover:text-zinc-950 transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-zinc-100 pb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-serif italic text-zinc-950">Orders</h3>
          <p className="text-[8px] text-zinc-400 font-black tracking-widest uppercase">Manage incoming regional acquisitions</p>
        </div>
        <div className="bg-zinc-50 px-6 py-2 rounded-full border border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          {isLoading ? <Skeleton className="h-3 w-20 inline-block" /> : `${orders.length} Records Active`}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {isLoading ? (
           [...Array(2)].map((_, i) => <OrderSkeleton key={i} />)
        ) : orders.map(o => (
          <div key={o.id} className="bg-white border border-zinc-100 p-10 rounded-[3rem] space-y-8 relative overflow-hidden group shadow-sm">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                      <div className="text-lg font-black text-zinc-950 tracking-tighter">{o.id}</div>
                   </div>
                   <div className="text-[9px] text-zinc-400 uppercase tracking-[0.3em] font-mono">TIMESTAMP: {new Date(o.timestamp).toLocaleString('en-GB', { timeZone: 'GMT' }) + ' GMT'}</div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <select 
                    value={o.status}
                    onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                    className={`bg-zinc-50 border px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none transition-all ${
                      o.status === OrderStatus.DELIVERED ? 'border-emerald-500/30 text-emerald-600' :
                      o.status === OrderStatus.CANCELLED ? 'border-red-500/30 text-red-500' :
                      'border-blue-600/30 text-blue-600'
                    }`}
                  >
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] px-1">
                  <span className="text-zinc-300">Customer Identity</span>
                  <span className="text-zinc-950">{o.userName}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] px-1">
                  <span className="text-zinc-300">Customer Uplink</span>
                  <span className="text-zinc-950">{o.phone}</span>
                </div>
             </div>

             <div className="space-y-4">
                <div className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] px-1">Allocated Inventory</div>
                <div className="grid gap-3">
                   {o.items.filter(i => products.some(mp => mp.id === i.id)).map((item, idx) => (
                     <div key={idx} className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex justify-between items-center group-hover:border-zinc-200 transition-all shadow-inner">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-white border border-zinc-100 overflow-hidden">
                              <img src={item.image} className="w-full h-full object-cover" />
                           </div>
                           <span className="text-xs text-zinc-400 font-black uppercase truncate max-w-[200px]">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-zinc-950">x{item.quantity}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div className="space-y-2 w-full md:w-auto">
                   <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block">Logistics Protocol Details</span>
                   <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 text-[10px] text-zinc-400 font-bold uppercase leading-relaxed space-y-2 min-w-[300px] shadow-inner">
                      {(() => {
                        try {
                          const logistics = JSON.parse(o.deliveryAddress);
                          return (
                            <>
                              <div className="flex justify-between border-b border-zinc-100 pb-1">
                                <span className="text-zinc-300">Region:</span>
                                <span className="text-blue-600">{logistics.region}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-100 pb-1">
                                <span className="text-zinc-300">City:</span>
                                <span className="text-blue-600">{logistics.city}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-100 pb-1">
                                <span className="text-zinc-300">Uplink:</span>
                                <span>{logistics.phone}</span>
                              </div>
                              <div className="pt-1">
                                <span className="text-zinc-300 block mb-1">Coordinates:</span>
                                <p className="text-[9px] italic normal-case text-zinc-400">"{logistics.address}"</p>
                              </div>
                            </>
                          );
                        } catch (e) {
                          return <span>{o.deliveryAddress}</span>;
                        }
                      })()}
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block mb-1">Node Revenue</span>
                   <div className="text-2xl font-mono font-black text-zinc-950">GH₵{o.total}</div>
                </div>
             </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-32 text-center italic text-zinc-200 text-[10px] uppercase font-black tracking-[0.5em]">Zero active logistics detected in current cycle.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] bg-white text-zinc-950 flex font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-24 md:w-72 bg-zinc-50 border-r border-zinc-100 flex flex-col">
        <div className="p-8 border-b border-zinc-100">
          <div className="text-xl font-serif italic text-zinc-950 hidden md:block">
            SUPPLIER<span className="text-blue-600 font-sans font-black not-italic ml-1">CONSOLE</span>
          </div>
          <div className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-2 hidden md:block">SUPPLIER_PANEL</div>
          <div className="text-2xl md:hidden text-center">🏢</div>
        </div>

        <nav className="flex-1 p-4 space-y-4 mt-8">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-xl' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('PRODUCTS')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'PRODUCTS' ? 'bg-blue-600 text-white shadow-xl' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950'}`}
          >
            <Package size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Inventory</span>
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'ORDERS' ? 'bg-blue-600 text-white shadow-xl' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950'}`}
          >
            <ShoppingBag size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('WALLET')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'WALLET' ? 'bg-blue-600 text-white shadow-xl' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950'}`}
          >
            <div className="w-5 h-5 flex items-center justify-center text-lg">🏦</div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Wallet</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={async () => {
              try {
                await databaseService.logout('SUPPLIER');
              } catch (error) {
                console.error('Logout error:', error);
              } finally {
                onLogout();
              }
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 hover:shadow-inner transition-all"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-zinc-100 px-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.4em]">Uplink_Stable</span>
            </div>
            <div className="h-4 w-px bg-zinc-100"></div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Node: {supplier.region}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Operator Identity</div>
              <div className="text-xs font-black text-zinc-950 uppercase">{supplier.name}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-lg shadow-sm">
              👤
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-10 md:p-16 bg-zinc-50/30">
          {activeTab === 'DASHBOARD' && renderDashboard()}
          {activeTab === 'PRODUCTS' && renderProducts()}
          {activeTab === 'ORDERS' && renderOrders()}
          {activeTab === 'WALLET' && <SupplierWalletView supplierId={supplierId} />}
        </main>

        {/* Footer Marquee */}
        <footer className="h-10 bg-white border-t border-zinc-100 overflow-hidden flex items-center">
           <div className="animate-[marquee_25s_linear_infinite] whitespace-nowrap text-[9px] font-black text-zinc-200 uppercase tracking-[0.6em] flex gap-20">
              <span>Synchronizing logistics data...</span>
              <span>Uplink Secure // Node Status: Optimal</span>
              <span>Archive Integrity: 100%</span>
              <span>Supply Chain Flow: Verified</span>
              <span>No Hype Control Detected // System Rules Active</span>
           </div>
        </footer>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <SupplierProductEditor 
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

export default SupplierDashboard;
