import React from "react";

export function EchoMark() {
  const fontFam = "Plus Jakarta Sans";

  const Logomark = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4">
      <circle cx="32" cy="32" r="8" fill="currentColor" stroke="none" />
      <circle cx="32" cy="32" r="16" strokeOpacity="0.6" />
      <circle cx="32" cy="32" r="24" strokeOpacity="0.2" />
    </svg>
  );

  const Lockup = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logomark className="w-8 h-8 text-blue-500" />
      <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: fontFam }}>ScriptLoop</span>
    </div>
  );

  return (
    <div className="w-[600px] h-[460px] bg-white flex flex-col overflow-hidden font-sans">
      <div className="flex h-40">
        <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center relative">
           <span className="absolute top-3 left-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Mark (Light)</span>
           <Logomark className="w-20 h-20 text-blue-600" />
        </div>
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center relative">
           <span className="absolute top-3 left-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Mark (Dark)</span>
           <Logomark className="w-20 h-20 text-blue-400" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-6 bg-zinc-100 gap-6">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Wordmark</span>
            <div className="text-4xl text-zinc-900 font-extrabold tracking-tighter" style={{ fontFamily: fontFam }}>ScriptLoop</div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm border border-zinc-200 relative">
            <span className="absolute top-2 left-2 text-[9px] font-semibold text-zinc-300 uppercase tracking-wider">Lockup</span>
            <Lockup className="text-zinc-900" />
          </div>
          <div className="flex-1 h-24 bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-zinc-800 relative">
            <span className="absolute top-2 left-2 text-[9px] font-semibold text-zinc-700 uppercase tracking-wider">Lockup</span>
            <div className={`flex items-center gap-3 text-white`}>
              <Logomark className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: fontFam }}>ScriptLoop</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-14 bg-white border-t border-zinc-200 flex items-center px-6 text-[13px] text-zinc-600 italic">
        Concentric ripples suggesting an echo, repetition, and lines of dialogue reverberating through memory.
      </div>
    </div>
  );
}
