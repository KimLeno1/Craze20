import React, { useState, useEffect } from "react";
import { databaseService } from "../services/databaseService";
import { toast } from "sonner";
import { 
  Search, Coins, Shield, User, Award, Calendar, 
  ShoppingBag, History, Plus, Minus, ArrowLeft, 
  RefreshCw, Eye, Sparkles, X, ChevronRight, CheckCircle, 
  Clock, TrendingUp, Compass, Heart, DollarSign
} from "lucide-react";
import { User as UserType, UserStats, Order } from "../types";

const AdminUserPanel: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  
  // Credit update state
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [creditOperation, setCreditOperation] = useState<"ADD" | "SET">("ADD");
  const [isUpdatingCredit, setIsUpdatingCredit] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersList, ordersList] = await Promise.all([
        databaseService.getUsers(),
        databaseService.getOrders()
      ]);
      setUsers(usersList || []);
      setOrders(ordersList || []);
    } catch (error) {
      console.error("Failed to fetch admin users and orders data:", error);
      toast.error("Failed to connect to central administrative core");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: UserType) => {
    setSelectedUser(user);
    setStatsLoading(true);
    setCreditAmount("");
    try {
      // Fetch stats
      const stats = await databaseService.getUserStats(user.id);
      setUserStats(stats);
      
      // Filter orders for this user
      const filteredOrders = orders.filter(o => o.userId === user.id);
      setUserOrders(filteredOrders);
    } catch (error) {
      console.error("Failed to load user statistics:", error);
      toast.error("Statistical buffer extraction failed");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdateCredit = async () => {
    if (!selectedUser) return;
    const amountNum = parseFloat(creditAmount);
    if (isNaN(amountNum)) {
      toast.error("Please enter a valid numeric credit amount");
      return;
    }

    try {
      setIsUpdatingCredit(true);
      
      let updatedCredit = selectedUser.credit || 0;
      if (creditOperation === "SET") {
        updatedCredit = amountNum;
        await databaseService.updateUserCredit(selectedUser.id, undefined, amountNum);
      } else {
        updatedCredit = Math.max(0, updatedCredit + amountNum);
        await databaseService.updateUserCredit(selectedUser.id, amountNum, undefined);
      }

      toast.success(`User store credit updated successfully!`);
      
      // Update local states
      const updatedUser = { ...selectedUser, credit: updatedCredit };
      setSelectedUser(updatedUser);
      
      if (userStats) {
        setUserStats({ ...userStats, storeCredit: updatedCredit });
      }

      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credit: updatedCredit } : u));
      setCreditAmount("");
      
      // Reload core database lists silently
      const refreshedUsers = await databaseService.getUsers();
      setUsers(refreshedUsers || []);
    } catch (error) {
      console.error("Failed to update user credit:", error);
      toast.error("Failed to compile user credit transaction");
    } finally {
      setIsUpdatingCredit(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = search.toLowerCase();
    return (
      user.handle.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term) ||
      (user.archetype && user.archetype.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif italic text-white tracking-tight">
            {selectedUser ? `${selectedUser.handle}_Archive` : "User_Database_Archives"}
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
            {selectedUser 
              ? `Detailed profiling & balance management for user ${selectedUser.id}` 
              : "Administrative user accounts & loyalty records"}
          </p>
        </div>
        
        {selectedUser && (
          <button 
            onClick={() => setSelectedUser(null)}
            className="px-6 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back_To_Directory
          </button>
        )}
      </header>

      {!selectedUser ? (
        // List Mode
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative group w-full md:w-[360px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#00D1FF] transition-colors" />
              <input 
                type="text"
                placeholder="SEARCH USER DIRECTORY..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/60 border border-white/10 text-white rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black tracking-widest focus:outline-none focus:border-[#00D1FF] w-full transition-all uppercase placeholder-zinc-600"
              />
            </div>

            <button 
              onClick={fetchData}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="glass-grey border border-white/5 rounded-[3rem] overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-2 border-[#00D1FF] border-t-transparent animate-spin rounded-full shadow-[0_0_20px_#00D1FF30]"></div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Accessing_User_Database...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-40 text-center">
                <div className="text-zinc-700 font-serif italic text-4xl mb-4 opacity-20">No_Users_Found</div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No matching user records are logged in the database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="glass-light border-b border-white/10">
                      <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">User_Profile</th>
                      <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Store_Credit</th>
                      <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Reputation</th>
                      <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Expenditures</th>
                      <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center text-zinc-500 font-bold uppercase">
                              {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.handle} className="w-full h-full object-cover" />
                              ) : (
                                user.handle.substring(0, 2)
                              )}
                            </div>
                            <div>
                              <div className="text-[11px] font-black text-white hover:text-[#00D1FF] transition-colors cursor-pointer" onClick={() => handleSelectUser(user)}>
                                @{user.handle}
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${
                            user.status === "ACTIVE" 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : user.status === "BANNED" 
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-black text-[#00D1FF]">
                            <Coins className="w-3.5 h-3.5 shrink-0 text-[#00D1FF]/70" />
                            GH₵{(user.credit || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-zinc-300 font-mono">
                            {user.rep || 0} <span className="text-zinc-600 text-[8px]">REP</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-zinc-300 font-mono font-bold">
                            GH₵{(user.totalSpent || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleSelectUser(user)}
                            className="px-4 py-2 bg-white/5 border border-white/10 hover:border-[#00D1FF] hover:text-[#00D1FF] rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="w-3 h-3" />
                            Inspect_Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Profiling & Details Mode
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Card & Credit Modification */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass-grey border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-500 font-bold uppercase text-2xl shadow-xl shadow-black/30">
                  {selectedUser.profile_picture ? (
                    <img src={selectedUser.profile_picture} alt={selectedUser.handle} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.handle.substring(0, 2)
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-serif italic text-white">@{selectedUser.handle}</h3>
                  <p className="text-[9px] font-black text-[#00D1FF] uppercase tracking-widest mt-1">UID: {selectedUser.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t border-white/5 text-left">
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Email_Address</span>
                    <span className="text-[10px] text-zinc-300 truncate block">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Role</span>
                    <span className="text-[10px] text-[#00D1FF] font-black uppercase block">{selectedUser.role || "USER"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Archetype</span>
                    <span className="text-[10px] text-zinc-300 uppercase block">{selectedUser.archetype || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Gender</span>
                    <span className="text-[10px] text-zinc-300 uppercase block">{selectedUser.gender || "ALL"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Operations Panel */}
            <div className="glass-grey border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#00D1FF]" />
                  Modify_User_Credit
                </h3>
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Add, deduct, or overwrite store credit instantly</p>
              </div>

              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Current Balance</span>
                  <span className="text-lg font-mono font-black text-[#00D1FF]">GH₵{(selectedUser.credit || 0).toFixed(2)}</span>
                </div>
                <Coins className="w-8 h-8 text-cyan-500/20" />
              </div>

              <div className="space-y-3">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Operation Mode</span>
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setCreditOperation("ADD")}
                    className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      creditOperation === "ADD" 
                        ? "bg-[#00D1FF] text-black shadow-md shadow-[#00D1FF]/20" 
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Add / Deduct
                  </button>
                  <button 
                    onClick={() => setCreditOperation("SET")}
                    className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      creditOperation === "SET" 
                        ? "bg-[#00D1FF] text-black shadow-md shadow-[#00D1FF]/20" 
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Set Value
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">
                  {creditOperation === "ADD" ? "Adjustment (Positive or Negative)" : "New Credit Balance"}
                </span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-zinc-500">GH₵</span>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder={creditOperation === "ADD" ? "e.g. 50 or -50" : "e.g. 100.00"}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#00D1FF] rounded-xl pl-12 pr-4 py-3 text-sm font-mono text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleUpdateCredit}
                disabled={isUpdatingCredit || !creditAmount}
                className="w-full py-3.5 bg-[#00D1FF] text-black hover:bg-[#33DBFF] transition-all disabled:opacity-50 active:scale-95 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_#00D1FF20] flex items-center justify-center gap-2"
              >
                {isUpdatingCredit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    TRANSACTING...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    EXECUTE_CREDIT_UPDATE
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats & Purchase History */}
          <div className="lg:col-span-2 space-y-8">
            {statsLoading ? (
              <div className="glass-grey border border-white/5 p-16 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-2 border-[#00D1FF] border-t-transparent animate-spin rounded-full"></div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Loading stats and history buffers...</p>
              </div>
            ) : (
              <>
                {/* Stats Dashboard */}
                <div className="glass-grey border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00D1FF]" />
                    User_Performance_Stats
                  </h3>

                  {userStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Level / Rank</span>
                        <span className="text-sm font-black text-white block">Lvl {userStats.level || 1}</span>
                        <span className="text-[9px] text-[#00D1FF] font-mono block">{userStats.rank || "Newcomer"}</span>
                      </div>
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Experience</span>
                        <span className="text-sm font-black text-white block">{userStats.experience || 0} XP</span>
                        <span className="text-[8px] text-zinc-600 block">Next: {userStats.nextLevelExp || 100}</span>
                      </div>
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Items Owned</span>
                        <span className="text-sm font-black text-white block">{userStats.itemsOwned || 0} Products</span>
                        <span className="text-[8px] text-zinc-600 block">Unique apparel pieces</span>
                      </div>
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Total Spent</span>
                        <span className="text-sm font-black text-[#00D1FF] block">GH₵{(userStats.totalSpent || selectedUser.totalSpent || 0).toFixed(2)}</span>
                        <span className="text-[8px] text-zinc-600 block">Lifetime transactions</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-[10px] uppercase tracking-widest">
                      No advanced stats mapped to this user record yet.
                    </div>
                  )}
                </div>

                {/* Purchase History */}
                <div className="glass-grey border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-[#00D1FF]" />
                    Order_And_Purchase_History
                  </h3>

                  {userOrders.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 font-serif italic text-base">
                      No purchases logged in transaction registers.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOrders.map((order) => (
                        <div key={order.id} className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-white/5">
                            <div>
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Order ID</span>
                              <span className="text-[10px] font-mono font-bold text-white block">{order.id}</span>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Timestamp</span>
                                <span className="text-[9px] text-zinc-400 font-mono block">
                                  {order.timestamp ? new Date(order.timestamp).toLocaleString() : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Status</span>
                                <span className={`inline-flex px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border mt-0.5 ${
                                  order.status === "DELIVERED" 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                    : order.status === "CANCELLED" 
                                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-2.5">
                            {order.items && order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center gap-4 text-[10px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <span className="text-white font-serif italic block">{item.name}</span>
                                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">
                                      Size: {item.selectedSize || "N/A"} | Color: {item.selectedColorVariant?.main || "N/A"}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-zinc-300 font-mono font-bold whitespace-nowrap">
                                  {item.quantity}x GH₵{item.price}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Checkout totals */}
                          <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <div>
                              {order.creditUsed && order.creditUsed > 0 ? (
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">
                                  Credit Used: <span className="text-[#00D1FF] font-mono">GH₵{order.creditUsed.toFixed(2)}</span>
                                </span>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Total Cart Price</span>
                              <span className="text-sm font-mono font-black text-white">GH₵{(order.total || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserPanel;
