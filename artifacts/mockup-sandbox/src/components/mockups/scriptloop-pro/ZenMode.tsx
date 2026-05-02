import './_group.css';
import { Maximize2, Minimize2, Play, Pause, ChevronLeft, Volume2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ZenMode() {
  return (
    <div className="scriptloop-pro h-screen bg-[#050505] text-foreground flex flex-col relative overflow-hidden group">
      
      {/* Top Bar - Auto hides */}
      <div className="absolute top-0 left-0 right-0 h-16 p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 bg-gradient-to-b from-[#050505] to-transparent">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-mono text-[10px] uppercase tracking-widest h-8 rounded-none border border-transparent hover:border-border">
          <ChevronLeft className="h-3 w-3 mr-2" /> Exit Session
        </Button>
        <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-4 bg-card/50 px-3 py-1.5 border border-border backdrop-blur-sm">
          <span className="uppercase tracking-widest">Iter: 04/10</span>
          <span className="w-1 h-1 bg-primary animate-pulse" />
          <span className="text-primary uppercase tracking-widest">Recall Phase</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-12 relative z-0">
        <div className="max-w-4xl w-full text-center">
          <p className="text-2xl md:text-4xl font-sans leading-loose text-muted-foreground opacity-30 mb-8 transition-all blur-[2px]">
            To be, or not to be, that is the question:
          </p>
          <p className="text-3xl md:text-5xl font-sans leading-loose text-foreground font-medium mb-8 tracking-tight">
            Whether 'tis nobler in the mind to suffer
          </p>
          <p className="text-2xl md:text-4xl font-sans leading-loose text-muted-foreground opacity-30 blur-[2px] transition-all">
            The slings and arrows of outrageous fortune,
          </p>
          
          <div className="mt-24 font-mono text-xs text-primary flex items-center justify-center gap-3 tracking-widest">
            <Volume2 className="h-4 w-4 animate-pulse" />
            <span>AWAITING INPUT...</span>
          </div>
        </div>
      </main>

      {/* Bottom Control Bar - Auto hides */}
      <div className="absolute bottom-0 left-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 bg-gradient-to-t from-[#050505] to-transparent flex flex-col items-center">
        
        <div className="w-full max-w-3xl flex items-center gap-6 mb-8">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">01:24</span>
          <div className="flex-1 h-[2px] bg-secondary relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">02:30</span>
        </div>

        <div className="flex items-center gap-6">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-none border-border bg-card/50 backdrop-blur-sm text-foreground hover:bg-secondary">
            <Pause className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-none border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <StopCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
    </div>
  );
}