import React from 'react';
import { Play, Plus, Clock, Settings, Mic, ArrowRight } from 'lucide-react';
import './_group.css';

const MOCK_SCRIPTS = [
  { id: 1, title: 'Hamlet Act 3, Scene 1', duration: '3m 45s', lastPracticed: '2 hours ago', progress: 85 },
  { id: 2, title: 'TED Talk Intro', duration: '1m 20s', lastPracticed: 'Yesterday', progress: 100 },
  { id: 3, title: 'Q3 Earnings Opening', duration: '5m 10s', lastPracticed: '3 days ago', progress: 40 },
];

export function Dashboard() {
  return (
    <div className="immersive-theme bg-gradient-immersive p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center glow-immersive">
              <div className="w-3 h-3 rounded-full bg-background" />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-wide text-foreground">ScriptLoop</span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Audio Quota */}
            <div className="flex items-center gap-3 bg-secondary/50 rounded-full px-4 py-2 border border-border/50 backdrop-blur-sm">
              <Mic className="w-4 h-4 text-accent" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Audio Generation</span>
                  <span className="text-xs text-muted-foreground">45m / 1h</span>
                </div>
                <div className="w-32 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-accent rounded-full w-[75%]" />
                </div>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors border border-border/50 backdrop-blur-sm">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" alt="User" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col gap-10">
          <section className="flex justify-between items-end">
            <div>
              <h1 className="font-serif text-5xl font-medium mb-3 text-foreground">Your Library</h1>
              <p className="text-muted-foreground text-lg">Focus on the performance. We'll handle the repetition.</p>
            </div>
            <button className="group relative px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium flex items-center gap-2 overflow-hidden glow-immersive transition-transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">New Script</span>
            </button>
          </section>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_SCRIPTS.map((script) => (
              <div key={script.id} className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col gap-6 hover:bg-card/60 transition-all hover:border-primary/30 cursor-pointer overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-2xl font-medium text-foreground leading-tight group-hover:text-gradient-immersive transition-all">{script.title}</h3>
                  <button className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
                    <Play className="w-5 h-5 text-primary group-hover:text-primary-foreground ml-1" />
                  </button>
                </div>
                
                <div className="flex flex-col gap-4 mt-auto">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{script.duration}</span>
                    </div>
                    <span>{script.lastPracticed}</span>
                  </div>
                  
                  <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
                      style={{ width: `${script.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State / Add New Card */}
            <div className="bg-card/20 border-2 border-dashed border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:bg-card/40 hover:border-primary/50 transition-all cursor-pointer min-h-[220px]">
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">Paste a new script</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
