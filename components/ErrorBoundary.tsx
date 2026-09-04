import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    const isImportError = error?.message?.includes('dynamically imported module') || 
                          error?.message?.includes('fetch') || 
                          error?.message?.includes('Failed to fetch') ||
                          (error?.name === 'TypeError' && error?.toString().includes('dynamically imported module'));

    if (isImportError) {
      if (!sessionStorage.getItem('reloaded_on_import_error')) {
        sessionStorage.setItem('reloaded_on_import_error', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8 animate-in fade-in duration-700">
            <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl mx-auto">
              ⚠️
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-serif italic text-white tracking-tighter">System <span className="text-red-500 not-italic font-sans font-black">Anomaly</span></h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                A critical error has occurred in the circuit. The neural link has been severed to prevent data corruption.
              </p>
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl text-left overflow-hidden">
                <p className="text-[8px] font-mono text-red-500/70 uppercase tracking-widest mb-2">Error_Log:</p>
                <p className="text-[10px] font-mono text-zinc-400 break-words">
                  {this.state.error?.message || 'Unknown_Anomaly'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-green-500 hover:text-white active:bg-green-700 transition-all shadow-2xl active:scale-95"
            >
              Re-Initialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
