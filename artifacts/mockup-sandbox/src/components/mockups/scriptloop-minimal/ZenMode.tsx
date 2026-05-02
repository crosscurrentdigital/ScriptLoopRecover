import React from "react";
import { Pause, Minimize2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./_group.css";

const CURRENT_LINE = "Whether 'tis nobler in the mind to suffer";
const PREV_LINE = "To be, or not to be, that is the question:";
const NEXT_LINE = "The slings and arrows of outrageous fortune,";

export function ZenMode() {
  return (
    <div className="scriptloop-minimal zen-mode h-screen w-screen flex flex-col overflow-hidden relative">
      
      {/* Subtle Top Bar - Auto hides in real usage */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start opacity-30 hover:opacity-100 transition-opacity duration-500 z-10">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">Hamlet - Act 3, Scene 1</span>
          <span className="font-mono text-sm text-foreground">Loop 14 / ∞</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/10 hover:text-white rounded-none">
            <Settings2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/10 hover:text-white rounded-none">
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 md:px-24 text-center max-w-5xl mx-auto w-full relative">
        
        {/* Previous Line (Faded) */}
        <div className="absolute top-1/4 w-full transform -translate-y-1/2 opacity-20 blur-[1px]">
          <p className="font-serif text-3xl md:text-4xl lg:text-5xl text-muted-foreground">
            {PREV_LINE}
          </p>
        </div>

        {/* Current Active Line */}
        <div className="z-10 w-full relative">
          <div className="absolute -inset-x-8 -inset-y-4 bg-white/5 rounded-2xl blur-2xl -z-10 opacity-50" />
          <p className="font-serif text-5xl md:text-6xl lg:text-8xl text-foreground leading-tight tracking-tight drop-shadow-lg">
            {CURRENT_LINE}
          </p>
          {/* Progress bar for the current audio clip */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-border overflow-hidden">
            <div className="w-1/3 h-full bg-primary" />
          </div>
        </div>

        {/* Next Line (Faded) */}
        <div className="absolute bottom-1/4 w-full transform translate-y-1/2 opacity-20 blur-[1px]">
          <p className="font-serif text-3xl md:text-4xl lg:text-5xl text-muted-foreground">
            {NEXT_LINE}
          </p>
        </div>

      </div>

      {/* Subtle Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-end opacity-30 hover:opacity-100 transition-opacity duration-500 z-10">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-16 h-16 rounded-full border-border bg-transparent text-foreground hover:bg-white hover:text-black transition-all duration-300"
        >
          <Pause className="w-6 h-6" />
        </Button>
      </div>

      {/* Noise overlay for texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+')]"></div>
    </div>
  );
}
