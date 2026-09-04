import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { TrendingUp, Users, ShoppingBag, DollarSign, Activity, Shield, Zap, Package } from 'lucide-react';

const AdminMetricsView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await databaseService.getAdminMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#00D1FF] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  const handleResetRevenue = async () => {
    if (window.confirm("Are you sure you want to reset Total Revenue to 0?")) {
      try {
        await databaseService.resetAdminRevenue();
        const data = await databaseService.getAdminMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to reset revenue:', error);
      }
    }
  };

  const statCards = [
    { label: 'Total Revenue', value: `GH₵${metrics?.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-emerald-500', trend: '+12.5%', canReset: true },
    { label: 'Active Orders', value: metrics?.activeOrders || '0', icon: ShoppingBag, color: 'text-[#00D1FF]', trend: '+5.2%' },
    { label: 'Total Users', value: metrics?.totalUsers || '0', icon: Users, color: 'text-purple-500', trend: '+8.1%' },
    { label: 'Total Products', value: metrics?.totalProducts || '0', icon: Package, color: 'text-amber-500', trend: '+2.4%' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header>
        <h2 className="text-3xl font-serif italic text-white flex items-center gap-4">
          <Activity className="w-8 h-8 text-[#00D1FF]" />
          System_Vitals_Dashboard
        </h2>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">Real-time Neural Network Performance Metrics</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-grey p-8 rounded-[2.5rem] border border-white/5 space-y-4 group hover:border-white/20 transition-all relative">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl glass-light ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{stat.trend}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                {stat.label}
                {stat.canReset && (
                  <button 
                    title="Reset to 0"
                    onClick={handleResetRevenue}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded ml-2 hover:bg-red-500 hover:text-white"
                  >
                    RESET
                  </button>
                )}
              </p>
              <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Performance Graph Placeholder */}
        <div className="lg:col-span-2 glass-grey p-10 rounded-[3rem] border border-white/5 space-y-8">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest border-l-2 border-[#00D1FF] pl-3">Revenue_Velocity_Stream</div>
            <div className="flex gap-2">
              {['24H', '7D', '30D', 'ALL'].map(t => (
                <button key={t} className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${t === '7D' ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-2 px-4">
            {(metrics?.revenueStream || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).map((val: number, i: number, arr: number[]) => {
              const maxVal = Math.max(...arr, 100);
              const h = Math.max((val / maxVal) * 100, 5); // minimum 5% height to be visible
              return (
              <div key={i} className="flex-1 glass-light rounded-t-lg relative group transition-all hover:bg-[#00D1FF]/20">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#00D1FF]/40 to-[#00D1FF] rounded-t-lg transition-all duration-1000" 
                  style={{ height: `${h}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black text-white bg-zinc-800 px-2 py-1 rounded whitespace-nowrap z-10">
                  {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0)}
                </div>
              </div>
            )})}
          </div>
          
          <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest px-4">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-grey p-10 rounded-[3rem] border border-white/5 space-y-8">
          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">Core_Integrity_Status</div>
          
          <div className="space-y-6">
            {[
              { label: 'Database Sync', status: 'Operational', icon: Shield, color: 'text-emerald-500' },
              { label: 'API Latency', status: '12ms', icon: Zap, color: 'text-amber-500' },
              { label: 'Security Firewall', status: 'Active', icon: Shield, color: 'text-emerald-500' },
              { label: 'Neural Load', status: 'Optimal', icon: Activity, color: 'text-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 glass-light rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Storage Capacity</span>
              <span className="text-[10px] font-black text-white">74.2%</span>
            </div>
            <div className="w-full h-2 glass-light rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00D1FF] to-purple-500" style={{ width: '74.2%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetricsView;
