import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Play, Pause, SkipBack, Settings2, Volume2, Maximize, Edit3 } from 'lucide-react';
import './_group.css';

export function ScriptDetail() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gap, setGap] = useState(3);

  return (
    <div className="immersive-theme bg-gradient-immersive flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-border/30 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-6">
          <button className="w-10 h-10 rounded-full hover:bg-secondary flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-medium text-foreground tracking-wide">Hamlet Act 3, Scene 1</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>William Shakespeare</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>3m 45s audio</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary flex items-center gap-2 transition-colors text-sm font-medium text-foreground border border-border/50">
            <Edit3 className="w-4 h-4" />
            Edit Text
          </button>
          <button className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 font-medium glow-immersive transition-all">
            <Maximize className="w-4 h-4" />
            Enter Zen Mode
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Script Content */}
        <div className="flex-1 overflow-y-auto p-12 pr-6">
          <div className="max-w-2xl mx-auto">
            <div className="prose prose-invert prose-lg font-serif leading-relaxed text-foreground/90 selection:bg-primary/30">
              <p className="text-2xl leading-loose">
                To be, or not to be: that is the question:
                <br />
                Whether 'tis nobler in the mind to suffer
                <br />
                The slings and arrows of outrageous fortune,
                <br />
                Or to take arms against a sea of troubles,
                <br />
                And by opposing end them? To die: to sleep;
                <br />
                No more; and by a sleep to say we end
                <br />
                The heart-ache and the thousand natural shocks
                <br />
                That flesh is heir to, 'tis a consummation
                <br />
                Devoutly to be wish'd.
              </p>
              <p className="text-2xl leading-loose opacity-50 transition-opacity hover:opacity-100 mt-8">
                To die, to sleep;
                <br />
                To sleep: perchance to dream: ay, there's the rub;
                <br />
                For in that sleep of death what dreams may come
                <br />
                When we have shuffled off this mortal coil,
                <br />
                Must give us pause: there's the respect
                <br />
                That makes calamity of so long life;
              </p>
              <p className="text-2xl leading-loose opacity-30 mt-8 blur-[1px]">
                For who would bear the whips and scorns of time,
                <br />
                The oppressor's wrong, the proud man's contumely,
                <br />
                The pangs of despised love, the law's delay,
                <br />
                The insolence of office and the spurns
                <br />
                That patient merit of the unworthy takes...
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <aside className="w-[380px] border-l border-border/30 bg-card/20 backdrop-blur-md p-8 flex flex-col gap-10 overflow-y-auto">
          {/* Voice Settings */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Voice Settings</h3>
            
            <div className="p-4 rounded-xl border border-border/50 bg-secondary/30 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                    <span className="font-serif font-bold text-lg">M</span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Marcus</div>
                    <div className="text-xs text-muted-foreground">Deep, Theatrical, British</div>
                  </div>
                </div>
                <button className="text-xs text-primary font-medium hover:text-primary/80">Change</button>
              </div>
              
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-muted-foreground rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Loop Settings */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loop Gap</h3>
              <span className="text-accent font-medium bg-accent/10 px-2 py-1 rounded text-sm">{gap}s</span>
            </div>
            
            <div className="p-5 rounded-xl border border-border/50 bg-secondary/30 flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">
                The silence duration between audio playbacks. Gives you time to recite from memory.
              </p>
              
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={gap} 
                onChange={(e) => setGap(parseInt(e.target.value))}
                className="w-full accent-accent h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No gap</span>
                <span>10s</span>
              </div>
            </div>
          </div>

          {/* Audio Player Surface */}
          <div className="mt-auto pt-6 border-t border-border/30">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-primary to-accent rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>1:15</span>
                  <span>3:45</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-6">
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Settings2 className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-foreground bg-secondary hover:bg-secondary/80 transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-foreground text-background hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-foreground bg-secondary hover:bg-secondary/80 transition-colors">
                  <SkipBack className="w-5 h-5 rotate-180" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors relative">
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
