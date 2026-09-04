
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, 
  BarChart, Bar, 
  AreaChart, Area
} from 'recharts';
import { Order, CartItem } from '../types';
import { TrendingUp, PieChart as PieIcon, BarChart3, AlertCircle } from 'lucide-react';

interface PurchaseInsightsProps {
  orders: Order[];
  theme?: 'dark' | 'light';
}

const COLORS = ['#00D1FF', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#F43F5E'];

const PurchaseInsights: React.FC<PurchaseInsightsProps> = ({ orders, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  // 1. Spending Trends (Over time)
  const spendingData = useMemo(() => {
    if (orders.length === 0) return [];
    
    // Sort orders by date
    const sortedOrders = [...orders].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group by month/day or just per order
    return sortedOrders.map(order => ({
      date: new Date(order.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      amount: order.total
    }));
  }, [orders]);

  // 2. Category Preferences (Pie Chart)
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach((item: CartItem) => {
        const cat = item.category || 'Other';
        categories[cat] = (categories[cat] || 0) + (item.quantity || 1);
      });
    });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // 3. Brand Loyalty (Bar Chart)
  const brandData = useMemo(() => {
    const brands: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach((item: CartItem) => {
        const brand = item.brand || 'No Brand';
        brands[brand] = (brands[brand] || 0) + (item.quantity || 1);
      });
    });
    
    return Object.entries(brands)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 brands
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center glass-light border-dashed border-white/5 rounded-[3rem] opacity-40 flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-[#00D1FF]" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Insufficient archive data for predictive insights.</p>
        <p className="text-[8px] text-zinc-500 uppercase font-mono max-w-xs mx-auto">Requires at least one acquisition event to generate vector reports.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/90 border-zinc-200'} backdrop-blur-md shadow-xl`}>
          <p className="text-[9px] font-black uppercase text-[#00D1FF] mb-1">{label}</p>
          <p className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-black'}`}>GH₵{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Spending Trends */}
        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'glass-blue border-white/10' : 'glass-light border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-4 h-4 text-[#00D1FF]" />
            <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Acquisition Velocity</h4>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: isDark ? '#71717a' : '#52525b', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: isDark ? '#71717a' : '#52525b', fontWeight: 'bold' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#00D1FF" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'glass-grey border-white/10' : 'glass-light border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-8">
            <PieIcon className="w-4 h-4 text-[#EC4899]" />
            <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Archetype Composition</h4>
          </div>
          <div className="h-[250px] w-full flex flex-col sm:flex-row items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center sm:flex-col gap-2 mt-4 sm:mt-0 sm:ml-4">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Loyalty */}
        <div className={`p-8 rounded-[2.5rem] border col-span-1 lg:col-span-2 ${isDark ? 'glass-blue border-white/10' : 'glass-light border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Brand Alignment Protocol</h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fontSize: 9, fill: isDark ? '#fff' : '#000', fontWeight: 'bold', textAnchor: 'start' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#10B981" 
                  radius={[0, 10, 10, 0]} 
                  barSize={20}
                  animationDuration={1500}
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 2 ? '#10B981' : '#10B98188'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className={`p-6 rounded-3xl border border-dashed ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'} flex flex-col sm:flex-row justify-between items-center gap-4`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00D1FF]/10 flex items-center justify-center text-xs">📊</div>
          <div>
            <p className="text-[9px] font-black uppercase text-[#00D1FF] tracking-widest">Aggregate Archive Valuation</p>
            <p className={`text-sm font-mono font-black ${isDark ? 'text-white' : 'text-black'}`}>GH₵{orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Last Update</p>
          <p className="text-[9px] font-black text-white uppercase font-mono">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInsights;
