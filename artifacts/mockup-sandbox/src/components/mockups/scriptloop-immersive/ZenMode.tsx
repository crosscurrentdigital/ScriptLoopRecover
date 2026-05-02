import React, { useState, useEffect } from 'react';
import { Minimize, Pause, X } from 'lucide-react';
import './_group.css';

export function ZenMode() {
  const [controlsVisible, setControlsVisible] = useState(true);

  // Auto-hide controls effect simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [controlsVisible]);

  return (
    <div 
      className="immersive-theme bg-background h-screen flex flex-col overflow-hidden relative cursor-default select-none"
      onMouseMove={() => setControlsVisible(true)}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-accent/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Top Controls (Auto-hiding) */}
      <div className={`absolute top-0 left-0 right-0 p-8 flex justify-between items-center transition-opacity duration-700 z-50 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4 bg-background/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium tracking-widest uppercase text-white/70">Recording Practice</span>
        </div>
        
        <button className="w-12 h-12 rounded-full bg-background/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
        
        {/* Loop Counter Indicator */}
        <div className="mb-12 flex flex-col items-center gap-2 opacity-60">
          <div className="text-xs font-medium tracking-[0.3em] uppercase text-accent">Loop 3 of 10</div>
          <div className="flex gap-2">
            <div className="w-8 h-1 rounded-full bg-accent" />
            <div className="w-8 h-1 rounded-full bg-accent" />
            <div className="w-8 h-1 rounded-full bg-accent" />
            <div className="w-8 h-1 rounded-full bg-white/20" />
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>
        </div>

        {/* The Script (Hero) */}
        <div className="max-w-4xl text-center">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight text-white font-medium drop-shadow-2xl">
            To be, or not to be: <span className="text-white/40">that is the question:</span>
          </h2>
          <p className="font-serif text-3xl md:text-4xl leading-relaxed text-white/60 mt-12 max-w-3xl mx-auto">
            Whether 'tis nobler in the mind to suffer<br/>
            The slings and arrows of outrageous fortune...
          </p>
        </div>

      </div>

      {/* Bottom Controls (Auto-hiding) */}
      <div className={`absolute bottom-0 left-0 right-0 p-12 flex flex-col items-center gap-8 transition-opacity duration-700 z-50 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Current State Text */}
        <div className="text-sm font-medium text-white/50 tracking-widest uppercase">
          Listening... (3s gap)
        </div>

        {/* Player Surface */}
        <div className="bg-background/60 backdrop-blur-xl border border-white/10 p-4 rounded-full flex items-center gap-6 shadow-2xl">
          <span className="text-sm font-mono text-white/60 ml-4">1:15</span>
          
          <div className="w-64 md:w-96 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            {/* Active playback bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-primary to-accent" />
            {/* Gap indicator (the bright trailing edge showing the current position) */}
            <div className="absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]" />
          </div>
          
          <span className="text-sm font-mono text-white/60">3:45</span>
          
          <div className="w-[1px] h-8 bg-white/10 mx-2" />
          
          <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform mr-1">
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>

      </div>
    </div>
  );
}
