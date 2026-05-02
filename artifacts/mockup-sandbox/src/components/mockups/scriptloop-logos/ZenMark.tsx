import React from "react";

export function ZenMark() {
  const fontFam = "Lora";

  const Logomark = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M 32 8 C 45.255 8 56 18.745 56 32 C 56 45.255 45.255 56 32 56 C 22.5 56 14.5 50.5 10.5 42.5" />
      <circle cx="32" cy="32" r="4" fill="currentColor" stroke="none" />
    </svg>
  );

  const Lockup = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logomark className="w-8 h-8 text-amber-600" />
      <span className="text-[22px] tracking-wide" style={{ fontFamily: fontFam }}>ScriptLoop</span>
    </div>
  );

  return (
    <div className="w-[600px] h-[460px] bg-white flex flex-col overflow-hidden font-sans">
      <div className="flex h-40">
        <div className="flex-1 bg-stone-50 flex flex-col items-center justify-center relative">
           <span className="absolute top-3 left-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Mark (Light)</span>
           <Logomark className="w-20 h-20 text-amber-700" />
        </div>
        <div className="flex-1 bg-stone-950 flex flex-col items-center justify-center relative">
           <span className="absolute top-3 left-3 text-[10px] font-semibold text-stone-600 uppercase tracking-wider">Mark (Dark)</span>
           <Logomark className="w-20 h-20 text-amber-400" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-6 bg-stone-100 gap-6">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Wordmark</span>
            <div className="text-4xl text-stone-900 tracking-wide" style={{ fontFamily: fontFam }}>ScriptLoop</div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm border border-stone-200 relative">
            <span className="absolute top-2 left-2 text-[9px] font-semibold text-stone-300 uppercase tracking-wider">Lockup</span>
            <Lockup className="text-stone-900" />
          </div>
          <div className="flex-1 h-24 bg-stone-950 rounded-lg flex items-center justify-center shadow-sm border border-stone-800 relative">
            <span className="absolute top-2 left-2 text-[9px] font-semibold text-stone-700 uppercase tracking-wider">Lockup</span>
            <div className={`flex items-center gap-3 text-white`}>
              <Logomark className="w-8 h-8 text-amber-400" />
              <span className="text-[22px] tracking-wide" style={{ fontFamily: fontFam }}>ScriptLoop</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-14 bg-white border-t border-stone-200 flex items-center px-6 text-[13px] text-stone-600 italic">
        An enso-inspired circle symbolizing focus, clarity, and the tranquil flow of mastering a script.
      </div>
    </div>
  );
}
