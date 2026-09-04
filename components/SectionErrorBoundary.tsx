import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName: string;
  onReset?: () => void;
  compact?: boolean;
}

const SectionErrorFallback: React.FC<FallbackProps & { sectionName: string; compact?: boolean }> = ({
  error,
  resetErrorBoundary,
  sectionName,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="p-3 my-2 rounded-xl bg-red-50/80 border border-red-200/60 flex items-center justify-between gap-3 text-red-700 text-xs">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>Couldn't load {sectionName.toLowerCase()}.</span>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 my-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
          Couldn't load {sectionName.toLowerCase()}
        </h4>
        <p className="text-[11px] text-zinc-500 max-w-sm">
          {error instanceof Error ? error.message : (error as any)?.message || 'A network hiccup occurred while fetching this section.'}
        </p>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
};

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({
  children,
  sectionName,
  onReset,
  compact = false,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <SectionErrorFallback {...props} sectionName={sectionName} compact={compact} />
      )}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};

export default SectionErrorBoundary;
