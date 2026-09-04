
import React, { useState, useEffect } from 'react';
import { Supplier, Product, Order } from '../types';
import { databaseService } from '../services/databaseService';
import { MOCK_ORDERS } from '../mockData';
import { toast } from 'sonner';

const AdminSupplierPanel: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.region.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration Form State
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactEmail: '',
    password: '',
    region: 'Neo Tokyo Central',
    commissionRate: 10
  });

  useEffect(() => {
    if (selectedSupplier) {
      setTempPassword(selectedSupplier.plain_password || '');
    } else {
      setTempPassword('');
      setShowPassword(false);
    }
  }, [selectedSupplier]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sups, prods, ords] = await Promise.all([
          databaseService.getSuppliers(),
          databaseService.getProducts(),
          databaseService.getOrders()
        ]);
        setSuppliers(Array.isArray(sups) ? sups : []);
        setAllProducts(Array.isArray(prods) ? prods : []);
        setAllOrders(Array.isArray(ords) ? ords : []);
      } catch (error) {
        toast.error('Failed to fetch admin data.');
        console.error('Error fetching admin data:', error);
      }
    };
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await databaseService.registerSupplier(newSupplier);
      if (result.status === 'success' || result.success || Array.isArray(result)) {
        const updated = await databaseService.getSuppliers();
        setSuppliers(updated);
        setIsRegistering(false);
        setNewSupplier({ name: '', contactEmail: '', password: '', region: 'Neo Tokyo Central', commissionRate: 10 });
        toast.success('Supplier registered successfully.');
      } else {
        toast.error('Failed to register supplier.');
      }
    } catch (error) {
      toast.error('Error registering supplier.');
      console.error('Error registering supplier:', error);
    }
  };

  const handleUpdatePassword = async (supplierId: string, password: string) => {
    if (!password) {
      toast.error('Password cannot be empty.');
      return;
    }
    try {
      await databaseService.updateSupplierPassword(supplierId, password);
      setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, plain_password: password } : s));
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(prev => prev ? { ...prev, plain_password: password } : null);
      }
      toast.success('Supplier password updated successfully.');
    } catch (error) {
      toast.error('Error updating password.');
      console.error('Error updating password:', error);
    }
  };

  const handleToggleStatus = async (supplierId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'RESTRICTED' : 'ACTIVE';
    console.log('Toggling supplier status to:', nextStatus);
    try {
      await databaseService.updateSupplierStatus(supplierId, nextStatus);
      setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, status: nextStatus } : s));
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(prev => prev ? { ...prev, status: nextStatus } : null);
      }
      toast.success(`Supplier status updated to ${nextStatus}.`);
    } catch (error) {
      toast.error('Error updating status.');
      console.error('Error updating status:', error);
    }
  };

  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierToEdit) return;
    try {
      const result = await databaseService.updateSupplier(supplierToEdit.id, {
        name: supplierToEdit.name,
        contactEmail: supplierToEdit.contactEmail,
        region: supplierToEdit.region,
      });
      if (result.status === 'success' || result.success) {
        const updated = await databaseService.getSuppliers();
        setSuppliers(updated);
        if (selectedSupplier?.id === supplierToEdit.id) {
          setSelectedSupplier(updated.find((s: Supplier) => s.id === supplierToEdit.id) || null);
        }
        setSupplierToEdit(null);
        toast.success('Supplier updated successfully.');
      } else {
        toast.error('Failed to update supplier.');
      }
    } catch (error) {
      toast.error('Error updating supplier.');
      console.error('Error updating supplier:', error);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      await databaseService.deleteSupplier(supplierToDelete);
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete));
      setSelectedSupplier(null);
      setSupplierToDelete(null);
      toast.success('Supplier decommissioned successfully.');
    } catch (error) {
      toast.error('Error deleting supplier.');
      console.error('Error deleting supplier:', error);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    console.log('Setting supplierToDelete:', supplierId);
    setSupplierToDelete(supplierId);
  };

  const handleUpdateCommission = async (supplierId: string, rate: number) => {
    console.log('Updating commission for:', supplierId, 'to:', rate);
    try {
      await databaseService.updateSupplierCommission(supplierId, rate);
      setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, commissionRate: rate } : s));
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(prev => prev ? { ...prev, commissionRate: rate } : null);
      }
      toast.success('Commission rate updated.');
      console.log('Commission updated successfully');
    } catch (error) {
      toast.error('Error updating commission.');
      console.error('Error updating commission:', error);
    }
  };

  const supplierProducts = allProducts.filter(p => p.supplierId === selectedSupplier?.id);
  const supplierOrders = allOrders.filter(o => 
    Array.isArray(o.items) && o.items.some(item => allProducts.find(ap => ap.id === item.id)?.supplierId === selectedSupplier?.id)
  );

  if (selectedSupplier) {
    return (
      <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
        <header className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-zinc-100 pb-10">
          <div className="space-y-2">
            <button 
              onClick={() => setSelectedSupplier(null)}
              className="text-[8px] font-black text-zinc-400 hover:text-zinc-950 uppercase tracking-widest mb-2 flex items-center gap-2"
            >
              ← Back to Network Nodes
            </button>
            <h2 className="text-4xl font-serif italic text-zinc-950">{selectedSupplier.name}</h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Uplink ID: {selectedSupplier.id}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                selectedSupplier.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                selectedSupplier.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {selectedSupplier.status}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="bg-white px-8 py-4 rounded-2xl border border-zinc-100 flex flex-col items-center shadow-sm">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Access Control</span>
                <div className="flex gap-2 mt-1">
                   <button 
                     onClick={() => setSupplierToEdit(selectedSupplier)}
                     className="px-4 py-1.5 rounded-lg text-[8px] font-black uppercase bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                   >
                     Edit
                   </button>
                   <button 
                     onClick={() => handleToggleStatus(selectedSupplier.id, selectedSupplier.status)}
                     className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${
                       selectedSupplier.status === 'ACTIVE' ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white'
                     }`}
                   >
                     {selectedSupplier.status === 'ACTIVE' ? 'Restrict' : 'Activate'}
                   </button>
                   <button 
                     onClick={() => handleDeleteSupplier(selectedSupplier.id)}
                     className="px-4 py-1.5 rounded-lg text-[8px] font-black uppercase bg-zinc-50 text-zinc-500 hover:bg-red-600 hover:text-white transition-all border border-zinc-200"
                   >
                     Decommission
                   </button>
                </div>
             </div>
             <div className="bg-white px-8 py-4 rounded-2xl border border-zinc-100 flex flex-col items-center shadow-sm">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Auth Key</span>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdatePassword(selectedSupplier.id, tempPassword);
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={() => {
                      if (tempPassword !== (selectedSupplier.plain_password || '')) {
                        handleUpdatePassword(selectedSupplier.id, tempPassword);
                      }
                    }}
                    className="w-28 bg-zinc-50 border border-zinc-100 rounded text-center text-[10px] font-mono font-black text-zinc-950 outline-none py-1"
                    placeholder="New Password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-950 transition-colors text-[9px] px-1.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded font-black uppercase tracking-widest"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
             </div>
             <div className="bg-white px-8 py-4 rounded-2xl border border-zinc-100 flex flex-col items-center shadow-sm">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Commission Rate</span>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number"
                    value={selectedSupplier.commissionRate || 10}
                    onChange={(e) => handleUpdateCommission(selectedSupplier.id, parseInt(e.target.value))}
                    className="w-12 bg-zinc-50 border border-zinc-100 rounded text-center text-sm font-mono font-black text-blue-600 outline-none"
                  />
                  <span className="text-sm font-mono font-black text-blue-600">%</span>
                </div>
             </div>
             <div className="bg-white px-8 py-4 rounded-2xl border border-zinc-100 flex flex-col items-center shadow-sm">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Performance Sync</span>
                <span className="text-xl font-mono font-black text-blue-600">{selectedSupplier.performanceScore}%</span>
             </div>
          </div>
        </header>

        {/* Delete Confirmation Modal for Detail View */}
        {supplierToDelete && (
          <div className="fixed inset-0 z-[500] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white border border-red-100 w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl">
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 text-2xl border border-red-100">
                  ⚠️
                </div>
                <h3 className="text-2xl font-serif italic text-zinc-950">Decommission Node?</h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                  This action is irreversible. All linked data, products, and order streams will be archived or permanently deleted.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setSupplierToDelete(null)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-zinc-950 transition-all border border-zinc-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteSupplier}
                  className="flex-[2] py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 active:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                >
                  Confirm Decommission
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Products */}
        <section className="space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif italic text-zinc-400">Archived Silhouettes</h3>
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{supplierProducts.length} Entries</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplierProducts.map((p, index) => (
                <div key={p.id || `prod-${index}`} className="group bg-white p-6 rounded-3xl border border-zinc-100 hover:border-blue-600/30 transition-all shadow-sm">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4  transition-all border border-zinc-100">
                    <img src={p.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                       <div className="text-xs font-black text-zinc-950 uppercase truncate max-w-[150px]">{p.name}</div>
                       <div className="text-[9px] text-zinc-400 uppercase tracking-widest">SKU_{p.id}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs font-mono font-black text-blue-600">GH₵{p.price}</div>
                       <div className="text-[8px] text-zinc-400 uppercase">Stock: {p.stockCount}</div>
                    </div>
                  </div>
                </div>
              ))}
              {supplierProducts.length === 0 && (
                <div className="col-span-full py-10 text-center border border-dashed border-zinc-200 rounded-3xl text-zinc-300 text-[10px] uppercase font-black tracking-widest">
                  No products attributed to this node.
                </div>
              )}
           </div>
        </section>

        {/* Supplier Orders */}
        <section className="space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif italic text-zinc-400">Linked Order Stream</h3>
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{supplierOrders.length} Events</span>
           </div>
           <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                   <tr>
                      <th className="px-8 py-6">Order Uplink</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Valuation</th>
                      <th className="px-8 py-6 text-right">Timestamp</th>
                   </tr>
                </thead>
                <tbody className="text-[10px] font-mono">
                   {supplierOrders.map((o, index) => (
                     <tr key={o.id || `ord-${index}`} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6 text-zinc-950 font-black">{o.id}</td>
                        <td className="px-8 py-6">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                             o.status === 'DELIVERED' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                           }`}>
                             {o.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right text-zinc-600">GH₵{o.total}</td>
                        <td className="px-8 py-6 text-right text-zinc-400">{o.timestamp.split('T')[0]}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
              {supplierOrders.length === 0 && (
                <div className="py-20 text-center italic text-zinc-300">No active order stream for this node.</div>
              )}
           </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-zinc-950">Supplier Network</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Managing global manufacturing nodes</p>
        </div>
        
        <button 
          onClick={() => setIsRegistering(true)}
          className="bg-zinc-950 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
        >
          Register Node
        </button>
      </header>

      <div className="mb-8">
        <input 
          type="text"
          placeholder="Search Nodes by Name or Sector..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none shadow-sm placeholder:text-zinc-200"
        />
      </div>

      {/* Node Registration Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-[400] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white border border-zinc-100 w-full max-w-lg rounded-[3rem] p-12 space-y-10 animate-in zoom-in-95 duration-500 shadow-2xl">
              <div className="space-y-2">
                 <h3 className="text-3xl font-serif italic text-zinc-950">New Node Auth</h3>
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Provisioning global supplier identity</p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Supplier Designation</label>
                    <input 
                      type="text" 
                      required
                      value={newSupplier.name}
                      onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none"
                      placeholder="e.g. Neo-Mesh Foundry"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Comms Protocol (Email)</label>
                    <input 
                      type="email" 
                      required
                      value={newSupplier.contactEmail}
                      onChange={e => setNewSupplier({...newSupplier, contactEmail: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none"
                      placeholder="ops@node.net"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Initial Auth Key (Password)</label>
                    <input 
                      type="password" 
                      required
                      value={newSupplier.password}
                      onChange={e => setNewSupplier({...newSupplier, password: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none"
                      placeholder="••••••••"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Geographic Sector</label>
                    <select 
                      value={newSupplier.region}
                      onChange={e => setNewSupplier({...newSupplier, region: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none appearance-none"
                    >
                      <option>Neo Tokyo Central</option>
                      <option>Neo Berlin</option>
                      <option>Emerald Heights</option>
                      <option>Void Outer-Rim</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Commission Rate (%)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      max={100}
                      value={newSupplier.commissionRate}
                      onChange={e => setNewSupplier({...newSupplier, commissionRate: parseInt(e.target.value)})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none"
                      placeholder="10"
                    />
                 </div>
                 
                 <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsRegistering(false)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-zinc-950 transition-all border border-zinc-200"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-600 transition-all shadow-xl"
                    >
                      Initialize Provisioning
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSuppliers.map((sup, index) => (
          <div 
            key={sup.id || `sup-${index}`} 
            onClick={() => setSelectedSupplier(sup)}
            className="group bg-white p-10 rounded-[3rem] border border-zinc-100 hover:border-blue-600/50 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md"
          >
            {/* Visual Flare */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 blur-[60px] rounded-full group-hover:bg-blue-100/50 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xl">🏢</div>
                  <div className="flex gap-2">
                    <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      sup.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      sup.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {sup.status}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSupplier(sup.id);
                      }}
                      className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white transition-all"
                      title="Decommission Node"
                    >
                      <span className="text-xs">×</span>
                    </button>
                  </div>
               </div>
               
               <div className="space-y-1">
                  <h3 className="text-2xl font-serif italic text-zinc-950 group-hover:text-blue-600 transition-colors">{sup.name}</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">{sup.region}</p>
               </div>
               
               <div className="pt-6 border-t border-zinc-50 flex justify-end">
                  <div className="text-right">
                    <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest block mb-1">Sync</span>
                    <span className="text-sm font-mono font-black text-blue-600">{sup.performanceScore}%</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Node Modal */}
      {supplierToEdit && (
        <div className="fixed inset-0 z-[400] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white border border-zinc-100 w-full max-w-lg rounded-[3rem] p-12 space-y-10 animate-in zoom-in-95 duration-500 shadow-2xl">
              <div className="space-y-2">
                 <h3 className="text-3xl font-serif italic text-zinc-950">Edit Node</h3>
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Updating global supplier identity</p>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Supplier Designation</label>
                    <input 
                      type="text" 
                      required
                      value={supplierToEdit.name}
                      onChange={e => setSupplierToEdit({...supplierToEdit, name: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none"
                      placeholder="e.g. Neo-Mesh Foundry"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Comms Protocol (Email)</label>
                    <input 
                      type="email" 
                      required
                      value={supplierToEdit.contactEmail}
                      onChange={e => setSupplierToEdit({...supplierToEdit, contactEmail: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none"
                      placeholder="ops@node.net"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">Geographic Sector</label>
                    <select 
                      value={supplierToEdit.region}
                      onChange={e => setSupplierToEdit({...supplierToEdit, region: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-2xl text-xs font-black text-zinc-950 focus:border-blue-600 outline-none appearance-none"
                    >
                      <option>Neo Tokyo Central</option>
                      <option>Neo Berlin</option>
                      <option>Emerald Heights</option>
                      <option>Void Outer-Rim</option>
                    </select>
                 </div>
                 
                 <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setSupplierToEdit(null)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-zinc-950 transition-all border border-zinc-200"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-700 transition-all shadow-xl"
                    >
                      Commit Changes
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-[500] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white border border-red-100 w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 text-2xl border border-red-100">
                ⚠️
              </div>
              <h3 className="text-2xl font-serif italic text-zinc-950">Decommission Node?</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                This action is irreversible. All linked data, products, and order streams will be archived or permanently deleted.
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 py-4 bg-zinc-100 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:text-zinc-950 transition-all border border-zinc-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteSupplier}
                className="flex-[2] py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 active:bg-red-700 transition-all shadow-xl shadow-red-500/20"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupplierPanel;
