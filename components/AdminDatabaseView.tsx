import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Loader2, Search, Download, Trash2, Database, Table as TableIcon, Terminal, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminDatabaseView: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<{name: string, type: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [activeMode, setActiveMode] = useState<'BROWSE' | 'QUERY'>('BROWSE');
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const data = await databaseService.getDatabaseTables();
      setTables(data);
      if (data.includes('users')) setSelectedTable('users');
      else if (data.length > 0) setSelectedTable(data[0]);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      toast.error('Failed to connect to database core');
    }
  };

  const fetchTableData = async (name: string) => {
    try {
      setLoading(true);
      const { columns, data } = await databaseService.getTableData(name);
      setColumns(columns);
      setTableData(data);
    } catch (error) {
      console.error(`Failed to fetch table data for ${name}:`, error);
      toast.error(`Access denied: ${name} protocol failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    try {
      setExecuting(true);
      const result = await databaseService.executeRawQuery(sqlQuery);
      setQueryResult(result);
      toast.success('Query executed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Query execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const downloadCSV = () => {
    const dataToExport = activeMode === 'BROWSE' ? filteredData : (queryResult || []);
    if (dataToExport.length === 0) return;

    const exportColumns = activeMode === 'BROWSE' ? columns.map(c => c.name) : Object.keys(dataToExport[0]);
    const headers = exportColumns.join(',');
    const rows = dataToExport.map(item => 
      exportColumns.map(col => {
        const val = item[col];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db_export_${selectedTable}_${Date.now()}.csv`;
    a.click();
  };

  const filteredData = tableData.filter(row => {
    if (!search) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif italic text-white tracking-tight">Database_Archives</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Low-level system integrity & record management</p>
        </div>
        
        <div className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveMode('BROWSE')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeMode === 'BROWSE' ? 'bg-[#00D1FF] text-black shadow-[0_0_20px_#00D1FF50]' : 'text-zinc-500 hover:text-white'}`}
          >
            <Database className="w-3 h-3" />
            Browse
          </button>
          <button 
            onClick={() => setActiveMode('QUERY')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeMode === 'QUERY' ? 'bg-[#00D1FF] text-black shadow-[0_0_20px_#00D1FF50]' : 'text-zinc-500 hover:text-white'}`}
          >
            <Terminal className="w-3 h-3" />
            SQL Terminal
          </button>
        </div>
      </header>

      {activeMode === 'BROWSE' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group">
                <TableIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#00D1FF] transition-colors" />
                <select 
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-black/60 border border-white/10 text-white rounded-2xl pl-12 pr-10 py-3 text-[11px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:border-[#00D1FF] min-w-[240px] hover:bg-black/80 transition-all cursor-pointer"
                >
                  {tables.map(t => (
                    <option key={t} value={t} className="bg-zinc-900 border-none">{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#00D1FF] transition-colors" />
                <input 
                  type="text"
                  placeholder="SEARCH ARCHIVES..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-black/60 border border-white/10 text-white rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black tracking-widest focus:outline-none focus:border-[#00D1FF] w-full md:w-[320px] transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => fetchTableData(selectedTable)}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={downloadCSV}
                className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_30px_#ffffff20]"
              >
                <Download className="w-4 h-4" />
                Export_CSV
              </button>
            </div>
          </div>

          <div className="glass-grey border border-white/5 rounded-[3rem] overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-2 border-[#00D1FF] border-t-transparent animate-spin rounded-full shadow-[0_0_20px_#00D1FF30]"></div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Accessing_Encrypted_Sectors...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-40 text-center">
                <div className="text-zinc-700 font-serif italic text-4xl mb-4 opacity-20">Archive_Empty</div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No matching records found in central archives.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="glass-light border-b border-white/10">
                      {columns.map(col => (
                        <th key={col.name} className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                          {col.name}
                          <span className="ml-2 opacity-30 font-mono text-[7px]">[{col.type}]</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredData.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        {columns.map(col => (
                          <td key={col.name} className="px-6 py-4">
                            <div className="text-[10px] text-zinc-300 font-medium max-w-[250px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:z-10 group-hover:relative">
                              {row[col.name] === null ? (
                                <span className="text-zinc-700 italic opacity-50">null</span>
                              ) : typeof row[col.name] === 'object' ? (
                                <span className="text-[#00D1FF]/60 font-mono text-[9px]">
                                  {JSON.stringify(row[col.name]).substring(0, 30)}...
                                </span>
                              ) : (
                                String(row[col.name])
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center px-4">
            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">
              Showing {filteredData.length} records in <span className="text-white">{selectedTable.toUpperCase()}</span> archive
            </p>
            <div className="flex gap-2">
               <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-600 cursor-not-allowed opacity-50">
                  <ChevronLeft className="w-3 h-3" />
               </button>
               <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-600 cursor-not-allowed opacity-50">
                  <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-5xl mx-auto">
          <div className="glass-grey border border-white/5 p-10 rounded-[3rem] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Terminal className="w-4 h-4 text-[#00D1FF]" />
                Direct_Query_Execution
              </h3>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setSqlQuery('SELECT * FROM users LIMIT 10')}
                   className="text-[8px] font-black text-zinc-600 uppercase hover:text-[#00D1FF] transition-colors"
                 >
                   TEMPLATE_USERS
                 </button>
                 <button 
                   onClick={() => setSqlQuery('SELECT * FROM products LIMIT 10')}
                   className="text-[8px] font-black text-zinc-600 uppercase hover:text-[#00D1FF] transition-colors"
                 >
                   TEMPLATE_PRODUCTS
                 </button>
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="SELECT * FROM users WHERE active = 1..."
                className="w-full h-40 bg-black/60 border border-white/10 rounded-3xl p-8 text-sm font-mono text-white focus:outline-none focus:border-[#00D1FF] transition-all resize-none shadow-inner"
              />
              <div className="absolute bottom-6 right-6">
                 <button 
                   onClick={handleRunQuery}
                   disabled={executing || !sqlQuery.trim()}
                   className="px-8 py-3 bg-[#00D1FF] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#33DBFF] transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95 shadow-[0_0_30px_#00D1FF30]"
                 >
                   {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                   RUN_QUERY
                 </button>
              </div>
            </div>
            
            <p className="text-[8px] text-zinc-600 leading-relaxed uppercase tracking-wider">
              <span className="text-amber-500 font-bold mr-2">! ATTENTION :</span> 
              Direct query execution bypasses multiple security layers. Ensure syntax accuracy before initializing. Limited to 100 results per request.
            </p>
          </div>

          {queryResult && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center px-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Query_Result_Buffer [{queryResult.length} rows]</h4>
                <button onClick={downloadCSV} className="text-[9px] font-black text-[#00D1FF] uppercase hover:underline flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Export_Results
                </button>
              </div>
              
              <div className="glass-grey border border-white/5 rounded-[3rem] overflow-hidden">
                {queryResult.length === 0 ? (
                  <div className="py-20 text-center text-zinc-700 italic">No records returned.</div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="glass-light border-b border-white/10">
                          {Object.keys(queryResult[0]).map(key => (
                            <th key={key} className="px-6 py-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {queryResult.map((row, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-6 py-4 text-[9px] text-zinc-400 font-mono truncate max-w-[200px]">
                                {val === null ? 'null' : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer / Danger Zone */}
      <footer className="mt-20 pt-20 border-t border-white/5">
        <div className="glass-grey border border-red-500/20 bg-red-500/[0.02] p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-black text-white uppercase tracking-widest">Emergency_Full_Wipe</p>
            </div>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider leading-loose max-w-md">
              Permanently purges all records and re-initializes factory default schema. <br/>
              <span className="text-red-500/60 font-bold">WARNING: THIS ACTION IS IRREVERSIBLE.</span>
            </p>
          </div>
          <button 
            onClick={() => {
              if (confirm("CRITICAL WARNING: Are you sure you want to purge the entire database? All user data, products, and records will be lost forever.")) {
                if (confirm("FINAL CONFIRMATION: The system will be reset to factory defaults. Proceed?")) {
                  toast.error("Emergency purge protocol currently locked for safety. Use terminal for maintenance.");
                }
              }
            }}
            className="px-10 py-4 bg-red-600/10 border border-red-500/30 text-red-500 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-[0_0_40px_rgba(220,38,38,0.1)]"
          >
            INITIALIZE_PURGE_SEQUENCE
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[7px] font-black text-zinc-800 uppercase tracking-[0.5em]">System_Version_4.0.2 // Database_SQLite_3.x // Neural_Engine_Active</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDatabaseView;
