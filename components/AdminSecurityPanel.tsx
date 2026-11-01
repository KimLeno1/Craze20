
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'LOGIN' | 'LOGOUT' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_CONFIG_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  details: string;
  ip: string;
}

const AdminSecurityPanel: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    firewall: 'ACTIVE',
    encryption: 'AES-256-GCM',
    loadBalancer: 'HEALTHY',
    activeSessions: 12,
    threatLevel: 'LOW'
  });
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [data, maintenance] = await Promise.all([
        databaseService.getSecurityStatus(),
        databaseService.getMaintenanceMode()
      ]);
      setEvents(data.events || []);
      setMaintenanceMode(maintenance?.enabled || false);
      setSystemStatus({
        firewall: data.firewall,
        encryption: data.encryption,
        loadBalancer: data.loadBalancer,
        activeSessions: data.activeSessions,
        threatLevel: data.threatLevel
      });
    } catch (error) {
      console.error('Failed to fetch security status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleSecurityAction = async (action: string) => {
    try {
      setLoadingAction(action);
      const response = await databaseService.executeSecurityAction(action);
      if (response.status === 'success' || response.success) {
        toast.success(response.message || `Success: ${action} procedure finalized.`);
        // Refresh status
        await fetchSecurityData();
      } else {
        toast.error(response.message || `Action failed during ${action}.`);
      }
    } catch (error) {
      console.error('Security action failed:', error);
      toast.error('Directive execution failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setLoadingMaintenance(true);
      const newState = !maintenanceMode;
      await databaseService.setMaintenanceMode(newState);
      setMaintenanceMode(newState);
      toast.success(`Maintenance Mode: ${newState ? 'ACTIVATED' : 'DEACTIVATED'}`);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      toast.error('Failed to update system state');
    } finally {
      setLoadingMaintenance(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#00D1FF] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-white">Security & System Health</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">System Monitoring & Settings</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">System Shield Active</span>
          </div>
        </div>
      </header>

      {/* System Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Neural Firewall', value: systemStatus.firewall, color: 'text-[#00D1FF]' },
          { label: 'Data Encryption', value: systemStatus.encryption, color: 'text-[#00D1FF]' },
          { label: 'Active Links', value: systemStatus.activeSessions, color: 'text-amber-500' },
          { label: 'Threat Level', value: systemStatus.threatLevel, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-grey border border-white/5 p-6 rounded-3xl space-y-2">
            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</div>
            <div className={`text-lg font-black font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Real-time Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Integrity_Logs</h3>
            <button className="text-[8px] font-black text-[#00D1FF] uppercase tracking-widest hover:underline">Export_Archive</button>
          </div>
          
          <div className="glass-grey border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 glass-light">
                    <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Timestamp</th>
                    <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Event_Type</th>
                    <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Severity</th>
                    <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map(event => (
                    <tr key={event.id} className="border-b border-white/5 hover:glass-light transition-colors">
                      <td className="p-6 text-[9px] font-mono text-zinc-400">{new Date(event.timestamp).toLocaleTimeString('en-GB', { timeZone: 'GMT' }) + ' GMT'}</td>
                      <td className="p-6">
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">{event.type}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded text-[7px] font-black uppercase ${
                          event.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                          event.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                          event.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-[#00D1FF]/20 text-[#00D1FF]'
                        }`}>
                          {event.severity}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="text-[10px] text-zinc-300 font-medium">{event.details}</div>
                        <div className="text-[7px] text-zinc-600 font-mono mt-1">SRC_IP: {event.ip}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security Controls */}
        <div className="space-y-8">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">System_Directives</h3>
          
          <div className="space-y-4">
            <div className={`glass-grey border p-6 rounded-3xl flex items-center justify-between group transition-all ${maintenanceMode ? 'border-red-500 bg-red-500/5' : 'border-white/5 hover:border-white/20'}`}>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    Maintenance Mode
                    {maintenanceMode && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                  </div>
                  <div className="text-[8px] text-zinc-600 uppercase">Restricts user field access globally</div>
                </div>
                <button 
                  disabled={loadingMaintenance}
                  onClick={handleToggleMaintenance}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all min-w-[90px] justify-center flex items-center gap-2 ${
                    maintenanceMode ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {loadingMaintenance ? <Loader2 className="w-3 h-3 animate-spin" /> : (maintenanceMode ? 'DEACTIVATE' : 'ACTIVATE')}
                </button>
            </div>

            {[
              { label: 'Lockdown Mode', desc: 'Terminate all active sessions', action: 'lockdown', btnLabel: 'INITIATE', color: 'bg-red-500 hover:bg-red-600' },
              { label: 'Flush Cache', desc: 'Clear all temporary neural buffers', action: 'flush-cache', btnLabel: 'EXECUTE', color: 'bg-zinc-800 hover:bg-zinc-700' },
              { label: 'Rotate Keys', desc: 'Generate new security signatures', action: 'rotate-keys', btnLabel: 'ROTATE', color: 'bg-zinc-800 hover:bg-zinc-700' },
              { label: 'Audit System', desc: 'Run full integrity diagnostic', action: 'audit', btnLabel: 'SCAN', color: 'bg-[#00D1FF] hover:bg-[#00B8E6]' },
            ].map((control, i) => (
              <div key={i} className="glass-grey border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">{control.label}</div>
                  <div className="text-[8px] text-zinc-600 uppercase">{control.desc}</div>
                </div>
                <button 
                  disabled={loadingAction === control.action}
                  onClick={() => handleSecurityAction(control.action)}
                  aria-busy={loadingAction === control.action}
                  aria-label={`${control.label}: ${control.desc}`}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${control.color} text-white active:scale-95 disabled:opacity-50 flex items-center gap-2 min-w-[90px] justify-center`}
                >
                  {loadingAction === control.action ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{control.action === 'audit' ? 'SCANNING' : 'PROCESSING'}</span>
                    </>
                  ) : control.btnLabel}
                </button>
              </div>
            ))}
          </div>

          <div className="glass-grey border border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D1FF]"></span>
              Network_Traffic
            </div>
            <div className="h-24 flex items-end gap-1">
              {[40, 65, 45, 80, 55, 90, 70, 40, 60, 85, 50, 75].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-[#00D1FF]/20 rounded-t-sm hover:bg-[#00D1FF] transition-all cursor-help"
                  style={{ height: `${h}%` }}
                  title={`Traffic: ${h}mb/s`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[7px] font-black text-zinc-700 uppercase">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>

          <div className="glass-grey border border-white/5 p-8 rounded-[2.5rem] space-y-4">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D1FF]"></span>
              Neural_Load
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">CPU_CORE_01</span>
                  <span className="text-white">42%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D1FF] w-[42%] shadow-[0_0_10px_#00D1FF]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">MEMORY_ALLOC</span>
                  <span className="text-white">68%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D1FF] w-[68%] shadow-[0_0_10px_#00D1FF]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityPanel;
